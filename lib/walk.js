// Stops 154-260 (sols 434-718) climb the delta front. All 4 km are inside HiRISE height data DTEEC_045994.
export const WALK_FIRST_STOP = 154;
export const WALK_LAST_STOP = 260;

const MARS_RADIUS_M = 3389500;
// A rover staying this many sols (Mars days) or longer usually means science, though not always.
export const SCIENCE_STAY_SOLS = 15;

function distanceM([lon1, lat1], [lon2, lat2]) {
  const rad = Math.PI / 180;
  const a = Math.sin((lat2 - lat1) * rad / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin((lon2 - lon1) * rad / 2) ** 2;
  return 2 * MARS_RADIUS_M * Math.asin(Math.sqrt(a));
}

// Uses straight lines between stops because the file's total-distance column is 0 on 129 stops.
export function walkStats(stops) {
  const heights = stops.map(s => s[2]);
  const stats = {
    distanceM: 0,
    climbM: 0,
    highestM: Math.max(...heights),
    lowestM: Math.min(...heights)
  };
  for (let i = 1; i < stops.length; i++) {
    stats.distanceM += distanceM(stops[i - 1], stops[i]);
    stats.climbM += Math.max(heights[i] - heights[i - 1], 0);
  }
  return stats;
}

export function scienceStops(stops) {
  return stops.slice(0, -1)
    .map((stop, i) => ({ stop, fromSol: stop[3], toSol: stops[i + 1][3] }))
    .filter(({ fromSol, toSol }) => toSol - fromSol >= SCIENCE_STAY_SOLS);
}
