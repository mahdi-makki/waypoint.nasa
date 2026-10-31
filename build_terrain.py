# Turns the downloaded terrain files into images the web map can show, and writes lib/terrain.js.
# Run with: .venv\Scripts\python build_terrain.py
import base64
import io
import json
import math
import re
from pathlib import Path

import numpy as np
import rasterio
from PIL import Image
from rasterio.enums import Resampling
from rasterio.windows import bounds as window_bounds, from_bounds, transform as window_transform

from terrain_shifts import HEIGHT_FILES

HERE = Path(__file__).parent
FIRST_STOP, LAST_STOP = 154, 260  # same walk as walk.js
HIRISE_MARGIN_M = 1000  # how much ground to show around the walk
CTX_MARGIN_M = 2000  # how much ground to show around the rover's full path
METERS_PER_DEGREE = 3396190 * math.pi / 180  # radius used by the terrain files
# The files treat a degree of longitude as if it were on the equator, so east-west distances
# are too long here by this factor.
EAST_SCALE = math.cos(math.radians(18.45))

# HiRISE heights are less detailed than their 1 m pixels suggest, so slopes are measured over 3 m.
HIRISE_SLOPE_PIXEL = 3
# Our own slope classes, not a NASA rule: [from degrees, to degrees, color].
SLOPE_BANDS = [
    [10, 20, [255, 170, 220]],
    [20, 30, [230, 0, 160]],
    [30, None, [90, 0, 130]],
]
SLOPE_OPACITY = 170  # out of 255
WALK_SAMPLE_M = 5
STEEP_DEGREES = 10  # same as lib/walk.js
SCIENCE_STAY_SOLS = 15  # same as lib/walk.js
VIEW_MARGIN_M = 300  # how much ground the 3D view shows around the walk
VIEW_PIXEL = 4  # meters between 3D height points
NO_HEIGHT = -32768  # marks a missing height in the 3D data
MAX_REAL_HEIGHT_M = 30000  # higher than anything on Mars, Olympus Mons included

stops = np.array([
    [float(n) for n in row]
    for row in re.findall(r'\[([\d.]+),([\d.]+),(-?[\d.]+),(\d+),\d+\]', (HERE / 'lib' / 'm20.js').read_text())
])
walk = stops[FIRST_STOP:LAST_STOP + 1]
HIRISE_SHIFT = HEIGHT_FILES['hirise_dtm.tif']
CTX_SHIFT = HEIGHT_FILES['ctx_dtm.tif']


def area_window(src, points, margin_m, shift):
    """The part of the file covering these stops, once the file is shifted onto the rover's coordinates."""
    west = points[:, 0].min() * METERS_PER_DEGREE - margin_m + shift['east_m']
    east = points[:, 0].max() * METERS_PER_DEGREE + margin_m + shift['east_m']
    south = points[:, 1].min() * METERS_PER_DEGREE - margin_m + shift['north_m']
    north = points[:, 1].max() * METERS_PER_DEGREE + margin_m + shift['north_m']
    return from_bounds(west, south, east, north, src.transform).round_offsets().round_lengths()


def map_bounds(src, window, shift):
    """Leaflet [[south, west], [north, east]] for that window, shifted onto the rover's coordinates."""
    west, south, east, north = window_bounds(window, src.transform)
    return [
        [(south - shift['north_m']) / METERS_PER_DEGREE, (west - shift['east_m']) / METERS_PER_DEGREE],
        [(north - shift['north_m']) / METERS_PER_DEGREE, (east - shift['east_m']) / METERS_PER_DEGREE],
    ]


def slope_degrees(heights, pixel_m):
    """Slope of a height grid in degrees. Missing heights (NaN) stay missing."""
    rise_north, rise_east = np.gradient(heights, pixel_m, pixel_m * EAST_SCALE)
    return np.degrees(np.arctan(np.hypot(rise_north, rise_east)))


def slope_image(slope):
    """Colors each slope band. Gentle ground and missing data are see-through."""
    image = np.zeros((*slope.shape, 4), dtype='uint8')
    for low, high, color in SLOPE_BANDS:
        in_band = (slope >= low) & (slope < (high if high is not None else np.inf))
        image[in_band] = [*color, SLOPE_OPACITY]
    return Image.fromarray(image)


def read_heights(src, window, reduce_by=1):
    """Heights in a window, averaged down by reduce_by, with missing heights as NaN."""
    shape = (int(window.height / reduce_by), int(window.width / reduce_by))
    heights = src.read(1, window=window, out_shape=shape, boundless=True, masked=True,
                       resampling=Resampling.average)
    return clean_heights(heights.astype(float).filled(np.nan))


def clean_heights(heights):
    """Averaging can leave the file's giant "no data" number unmasked at data edges, so remove it by size."""
    return np.where(np.abs(heights) > MAX_REAL_HEIGHT_M, np.nan, heights)


def walk_path(shift):
    """File coordinates every few meters along the walk."""
    east = walk[:, 0] * METERS_PER_DEGREE
    north = walk[:, 1] * METERS_PER_DEGREE
    lengths = np.hypot(np.diff(east) * EAST_SCALE, np.diff(north))
    along = np.concatenate([[0], np.cumsum(lengths)])
    samples = np.arange(0, along[-1], WALK_SAMPLE_M)
    return np.interp(samples, along, east) + shift['east_m'], np.interp(samples, along, north) + shift['north_m']


def grid_index(x, y, grid):
    """Which row and column of a grid these file coordinates fall in."""
    return np.floor((y - grid.f) / grid.e).astype(int), np.floor((x - grid.c) / grid.a).astype(int)


def walk_slopes(slope, grid, shift):
    """Slope every few meters along the walk, using the same 3 m grid as the map."""
    rows, cols = grid_index(*walk_path(shift), grid)
    return slope[rows, cols]


def steep_runs(is_steep):
    """(first, last) sample of each steep stretch. A steep sample covers the ground up to the next one."""
    runs = []
    start = None
    for i, steep in enumerate(is_steep[:-1]):
        if steep and start is None:
            start = i
        if not steep and start is not None:
            runs.append((start, i))
            start = None
    if start is not None:
        runs.append((start, len(is_steep) - 1))
    return runs


def grey_photo(pixels, has_data):
    low, high = np.percentile(pixels[has_data], [0.1, 99.95])
    return np.clip((pixels - low) / (high - low) * 255, 0, 255).astype('uint8')


def encode_heights(heights, base_m):
    """Heights as base64 16-bit tenths of a meter above base_m, the smallest form a web page can read."""
    tenths = np.where(np.isnan(heights), NO_HEIGHT, np.round((heights - base_m) * 10))
    return base64.b64encode(tenths.astype('<i2').tobytes()).decode()


def build_3d_view():
    with rasterio.open(HERE / 'data' / 'hirise_dtm.tif') as src:
        window = area_window(src, walk, VIEW_MARGIN_M, HIRISE_SHIFT)
        heights = read_heights(src, window, VIEW_PIXEL)
        grid = window_transform(window, src.transform) * rasterio.Affine.scale(
            window.width / heights.shape[1], window.height / heights.shape[0])
        area = window_bounds(window, src.transform)
    base_m = float(np.nanmin(heights))
    assert np.nanmax(heights) - base_m < 3000, '3D view height range is not believable'

    # Compare every rover stop with the grid: proves the grid is placed correctly.
    stop_x = walk[:, 0] * METERS_PER_DEGREE + HIRISE_SHIFT['east_m']
    stop_y = walk[:, 1] * METERS_PER_DEGREE + HIRISE_SHIFT['north_m']
    stop_rows, stop_cols = grid_index(stop_x, stop_y, grid)
    diff = heights[stop_rows, stop_cols] - walk[:, 2]
    assert abs(np.median(diff) - HIRISE_SHIFT['height_m']) < 1 and diff.std() < 2, '3D grid does not match the rover'

    path_rows, path_cols = grid_index(*walk_path(HIRISE_SHIFT), grid)
    path_heights = heights[path_rows, path_cols]
    assert np.isfinite(path_heights).all(), 'height data has gaps on the walk'

    stayed = np.flatnonzero(np.diff(walk[:, 3]) >= SCIENCE_STAY_SOLS)
    assert len(stayed) == 4, 'expected the same 4 science stops as lib/walk.js'

    with rasterio.open(HERE / 'data' / 'hirise_ortho.tif') as src:
        photo_window = from_bounds(*area, src.transform)
        shape = (round(photo_window.height), round(photo_window.width))
        pixels = src.read(1, window=photo_window, out_shape=shape, boundless=True, fill_value=src.nodata).astype(float)
        photo = io.BytesIO()
        Image.fromarray(grey_photo(pixels, pixels != src.nodata)).save(photo, 'JPEG', quality=80)

    def to_scene(rows, cols):
        return [[round(float((c + 0.5) * grid.a * EAST_SCALE), 1), round(float(heights[r, c] - base_m), 1),
                 round(float((r + 0.5) * -grid.e), 1)] for r, c in zip(rows, cols)]

    view = {
        'rows': heights.shape[0],
        'cols': heights.shape[1],
        'eastStepM': grid.a * EAST_SCALE,
        'southStepM': -grid.e,
        'noHeight': NO_HEIGHT,
        'heights': encode_heights(heights, base_m),
        'photo': 'data:image/jpeg;base64,' + base64.b64encode(photo.getvalue()).decode(),
        'route': to_scene(path_rows, path_cols),
        'stops': to_scene(stop_rows[stayed], stop_cols[stayed]),
    }
    (HERE / 'lib' / 'terrain3d.js').write_text(
        '// Made by build_terrain.py. Do not edit by hand.\nexport const VIEW_3D = ' + json.dumps(view) + ';\n')
    size = (HERE / 'lib' / 'terrain3d.js').stat().st_size / 1e6
    print(f'terrain3d.js: {heights.shape[1]}x{heights.shape[0]} height points, {size:.1f} MB, '
          f'grid vs rover: median {np.median(diff):.1f} m, scatter {diff.std():.2f} m')


def photo_outline(has_data, bounds):
    """[lat, lon] corners of where the photo has data. Its side edge slants, so its bounds rectangle won't do."""
    (south, west), (north, east) = bounds
    height, width = has_data.shape
    top = np.flatnonzero(has_data[0])
    bottom = np.flatnonzero(has_data[-1])
    corners = [(0, top[0]), (0, top[-1] + 1), (height, bottom[-1] + 1), (height, bottom[0])]
    return [[north - float(row) / height * (north - south), west + float(col) / width * (east - west)]
            for row, col in corners]


def build_photo():
    with rasterio.open(HERE / 'data' / 'hirise_ortho.tif') as src:
        window = area_window(src, walk, HIRISE_MARGIN_M, HIRISE_SHIFT)
        pixels = src.read(1, window=window, boundless=True, fill_value=src.nodata).astype(float)
        has_data = pixels != src.nodata
        grey = grey_photo(pixels, has_data)
        alpha = np.where(has_data, 255, 0).astype('uint8')
        Image.merge('LA', (Image.fromarray(grey), Image.fromarray(alpha))).save(
            HERE / 'public' / 'hirise_walk.webp', quality=75, method=6)
        print(f'hirise_walk.webp: {grey.shape[1]}x{grey.shape[0]} px, {has_data.mean():.0%} has data')
        bounds = map_bounds(src, window, HIRISE_SHIFT)
        return bounds, photo_outline(has_data, bounds)


def build_hirise_slopes():
    with rasterio.open(HERE / 'data' / 'hirise_dtm.tif') as src:
        window = area_window(src, walk, HIRISE_MARGIN_M, HIRISE_SHIFT)
        heights = read_heights(src, window, HIRISE_SLOPE_PIXEL)
        pixel_m = src.res[0] * window.width / heights.shape[1]
        slope = slope_degrees(heights, pixel_m)
        slope_image(slope).save(HERE / 'public' / 'slope_hirise.png', optimize=True)
        grid = window_transform(window, src.transform) * rasterio.Affine.scale(
            window.width / heights.shape[1], window.height / heights.shape[0])

        on_walk = walk_slopes(slope, grid, HIRISE_SHIFT)
        assert np.isfinite(on_walk).all(), 'height data has gaps on the walk'
        is_steep = on_walk >= STEEP_DEGREES
        x, y = walk_path(HIRISE_SHIFT)
        lats = (y - HIRISE_SHIFT['north_m']) / METERS_PER_DEGREE
        lons = (x - HIRISE_SHIFT['east_m']) / METERS_PER_DEGREE
        stats = {
            'steepDegrees': STEEP_DEGREES,
            'steepPercent': round(float(is_steep.mean() * 100)),
            'steepMeters': int(is_steep.sum() * WALK_SAMPLE_M),
            'steepestDegrees': round(float(on_walk.max())),
            'steepParts': [
                [[round(float(lats[i]), 6), round(float(lons[i]), 6)] for i in range(first, last + 1)]
                for first, last in steep_runs(is_steep)
            ],
        }
        print(f"slope_hirise.png: {pixel_m:.1f} m/px; walk: {stats['steepMeters']} m steep "
              f"({stats['steepPercent']}%) in {len(stats['steepParts'])} parts, steepest {stats['steepestDegrees']} deg")
        return map_bounds(src, window, HIRISE_SHIFT), grid, np.isfinite(heights), stats


def build_ctx_slopes(hirise_grid, hirise_has_data):
    with rasterio.open(HERE / 'data' / 'ctx_dtm.tif') as src:
        window = area_window(src, stops, CTX_MARGIN_M, CTX_SHIFT)
        heights = read_heights(src, window)
        slope = slope_degrees(heights, src.res[0])

        # Where HiRISE has data, its more detailed slopes replace these.
        grid = window_transform(window, src.transform)
        rows, cols = np.indices(slope.shape)
        x = grid.c + (cols + 0.5) * grid.a - CTX_SHIFT['east_m'] + HIRISE_SHIFT['east_m']
        y = grid.f + (rows + 0.5) * grid.e - CTX_SHIFT['north_m'] + HIRISE_SHIFT['north_m']
        hirise_cols = np.floor((x - hirise_grid.c) / hirise_grid.a).astype(int)
        hirise_rows = np.floor((y - hirise_grid.f) / hirise_grid.e).astype(int)
        inside = ((hirise_rows >= 0) & (hirise_rows < hirise_has_data.shape[0]) &
                  (hirise_cols >= 0) & (hirise_cols < hirise_has_data.shape[1]))
        covered = np.zeros(slope.shape, dtype=bool)
        covered[inside] = hirise_has_data[hirise_rows[inside], hirise_cols[inside]]
        slope[covered] = np.nan

        slope_image(slope).save(HERE / 'public' / 'slope_ctx.png', optimize=True)
        print(f'slope_ctx.png: {src.res[0]:.1f} m/px, {slope.shape[1]}x{slope.shape[0]} px')
        return map_bounds(src, window, CTX_SHIFT)


if __name__ == '__main__':
    photo_bounds, photo_edge = build_photo()
    hirise_slope_bounds, hirise_grid, hirise_has_data, walk_stats = build_hirise_slopes()
    ctx_slope_bounds = build_ctx_slopes(hirise_grid, hirise_has_data)
    terrain = {
        'hiriseWalk': {'url': 'hirise_walk.webp', 'bounds': photo_bounds, 'outline': photo_edge},
        'slopeHirise': {'url': 'slope_hirise.png', 'bounds': hirise_slope_bounds},
        'slopeCtx': {'url': 'slope_ctx.png', 'bounds': ctx_slope_bounds},
        'slopeBands': SLOPE_BANDS,
        'walkSlopes': walk_stats,
    }
    (HERE / 'lib' / 'terrain.js').write_text(
        '// Made by build_terrain.py. Do not edit by hand.\nexport const TERRAIN = ' + json.dumps(terrain, indent=2) + ';\n')
    build_3d_view()
