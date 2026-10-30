// Stops 154-260 (sols 434-718) climb the delta front. All 4 km are inside HiRISE height data DTEEC_045994.
const WALK_FIRST_STOP = 154;
const WALK_LAST_STOP = 260;

// Our own cut-off for "steep", not a NASA rule. Change it here to re-color the route.
const STEEP_DEGREES = 10;
// Below this, small height errors between stops would look like cliffs, so slope is ignored.
const MIN_SLOPE_LENGTH_M = 5;
const MARS_RADIUS_M = 3389500;

function distanceM([lon1, lat1], [lon2, lat2]) {
  const rad = Math.PI / 180;
  const a = Math.sin((lat2 - lat1) * rad / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin((lon2 - lon1) * rad / 2) ** 2;
  return 2 * MARS_RADIUS_M * Math.asin(Math.sqrt(a));
}

// Uses straight lines between stops because the file's total-distance column is 0 on 129 stops.
function walkStats(stops) {
  const heights = stops.map(s => s[2]);
  const stats = {
    distanceM: 0,
    climbM: 0,
    steepM: 0,
    highestM: Math.max(...heights),
    lowestM: Math.min(...heights),
    steepParts: []
  };
  for (let i = 1; i < stops.length; i++) {
    const length = distanceM(stops[i - 1], stops[i]);
    const rise = heights[i] - heights[i - 1];
    stats.distanceM += length;
    stats.climbM += Math.max(rise, 0);
    const degrees = Math.atan(Math.abs(rise) / length) * 180 / Math.PI;
    if (length >= MIN_SLOPE_LENGTH_M && degrees >= STEEP_DEGREES) {
      stats.steepM += length;
      stats.steepParts.push([stops[i - 1], stops[i]]);
    }
  }
  return stats;
}
