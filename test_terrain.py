# Run with: .venv\Scripts\python test_terrain.py
import base64
import math

import numpy as np

from build_terrain import EAST_SCALE, NO_HEIGHT, clean_heights, encode_heights, slope_degrees, slope_image, steep_runs

PIXEL_M = 3
rows, cols = np.indices((50, 50))

# A ramp rising 10 degrees to the north. Row numbers grow southward.
north_ramp = -rows * PIXEL_M * math.tan(math.radians(10))
assert np.allclose(slope_degrees(north_ramp, PIXEL_M), 10), 'north-south slope'

# The same ramp rising to the east: distances must be corrected or this would read too gentle.
east_ramp = cols * PIXEL_M * EAST_SCALE * math.tan(math.radians(10))
assert np.allclose(slope_degrees(east_ramp, PIXEL_M), 10), 'east-west slope'

flat = np.zeros((50, 50))
assert np.allclose(slope_degrees(flat, PIXEL_M), 0), 'flat ground'

# A missing height makes its neighbors' slopes missing (they need it), but nothing further away.
holed = flat.copy()
holed[25, 25] = np.nan
slope = slope_degrees(holed, PIXEL_M)
assert np.isnan(slope[25, 26]) and np.isnan(slope[26, 25]), 'neighbors of a missing height'
assert not np.isnan(slope[0, 0]), 'far from a missing height'

# Colors: gentle and missing are see-through, each band has its own color.
colors = np.asarray(slope_image(np.array([[5.0, np.nan, 10.0, 20.0, 30.0, 60.0]])))
assert colors[0, 0, 3] == 0 and colors[0, 1, 3] == 0, 'see-through'
assert colors[0, 2, 3] > 0 and tuple(colors[0, 2]) != tuple(colors[0, 3]), '10 and 20 differ'
assert tuple(colors[0, 4]) == tuple(colors[0, 5]), '30 and up share a color'

# Steep stretches: each one runs to the next sample, and a steep last sample has no ground after it.
assert steep_runs([False, True, True, False, True]) == [(1, 3)], 'steep stretch closes'
assert steep_runs([True, True]) == [(0, 1)], 'steep stretch reaches the end'
assert steep_runs([False, False]) == [], 'no steep stretches'

# The file's "no data" number becomes missing, real heights stay.
cleaned = clean_heights(np.array([-3.4028226550889045e+38, -2500.0, np.nan]))
assert np.isnan(cleaned[0]) and cleaned[1] == -2500 and np.isnan(cleaned[2]), 'no data number removed'

# 3D data: tenths of a meter above the base height, with a marker for missing heights.
decoded = np.frombuffer(base64.b64decode(encode_heights(np.array([-2500.0, -2487.25, np.nan]), -2500.0)), dtype='<i2')
assert decoded[0] == 0 and decoded[1] == 128 and decoded[2] == NO_HEIGHT, '3D height encoding'

print('terrain tests passed')
