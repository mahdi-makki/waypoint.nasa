# Checks the downloaded height files against the rover's own heights.
# Run with: .venv\Scripts\python check_data.py
import re
from pathlib import Path

import numpy as np
import rasterio
from rasterio.warp import transform

from terrain_shifts import HEIGHT_FILES

HERE = Path(__file__).parent
FIRST_STOP, LAST_STOP = 154, 260  # same walk as lib/walk.js

stops = np.array([
    [float(n) for n in row]
    for row in re.findall(r'\[([\d.]+),([\d.]+),(-?[\d.]+),\d+,\d+\]', (HERE / 'lib' / 'm20.js').read_text())
])
walk = stops[FIRST_STOP:LAST_STOP + 1]


def walk_position(src):
    mars = ('GEOGCS["Mars",DATUM["Mars",SPHEROID["Mars",3396190,0]],'
            'PRIMEM["Reference_Meridian",0],UNIT["degree",0.0174532925199433]]')
    xs, ys = transform(mars, src.crs, walk[:, 0].tolist(), walk[:, 1].tolist())
    return np.array(xs), np.array(ys)


for name, shift in HEIGHT_FILES.items():
    with rasterio.open(HERE / 'data' / name) as src:
        xs, ys = walk_position(src)
        positions = zip(xs + shift['east_m'], ys + shift['north_m'])
        values = np.array([v[0] for v in src.sample(positions)], dtype=float)
        assert (values != src.nodata).all(), f'{name} has gaps on the walk'
        diff = values - walk[:, 2]
        print(f'{name}: {src.res[0]:.2f} m/px, height offset {np.median(diff):.1f} m, scatter {diff.std():.2f} m')
        assert abs(np.median(diff) - shift['height_m']) < 1, f'{name} height offset changed'
        assert diff.std() < shift['max_spread_m'], f'{name} does not match the rover'

with rasterio.open(HERE / 'data' / 'hirise_ortho.tif') as src:
    xs, ys = walk_position(src)
    values = np.array([v[0] for v in src.sample(zip(xs, ys))], dtype=float)
    assert (values != src.nodata).all(), 'photo has gaps on the walk'
    print(f'hirise_ortho.tif: {src.res[0]:.2f} m/px, covers the whole walk')

print('data checks passed')
