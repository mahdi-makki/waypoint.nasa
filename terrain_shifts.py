# The height files don't line up exactly with the rover's coordinates. These shifts were found by
# searching for the best match on the walk, so they only apply around the walk.
# east_m / north_m: where in the file to look for a rover position.
# height_m: how much higher the file reads than the rover.
# max_spread_m: largest allowed scatter once shifted.
HEIGHT_FILES = {
    'hirise_dtm.tif': {'east_m': 30, 'north_m': -90, 'height_m': 4.8, 'max_spread_m': 1},
    'ctx_dtm.tif': {'east_m': 20, 'north_m': 80, 'height_m': 38.2, 'max_spread_m': 3},
}
