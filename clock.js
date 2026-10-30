// Mars time, using NASA GISS's Mars24 formulas (giss.nasa.gov/tools/mars24/help/algorithm.html).
const JEZERO_LAT = 18.44;
const JEZERO_LON_EAST = 77.45;
const TT_MINUS_UTC_SECONDS = 69.184; // 37 leap seconds + 32.184. Update if a new leap second is added.
const MARS_DATE_AT_LANDING = 52304; // Mars Sol Date of Perseverance's sol 0

function marsClock(date) {
  const rad = Math.PI / 180;
  const sinDeg = degrees => Math.sin(degrees * rad);
  const julianDateTT = date.getTime() / 86400000 + 2440587.5 + TT_MINUS_UTC_SECONDS / 86400;
  const days = julianDateTT - 2451545; // days since the year 2000 reference point

  const meanAnomaly = 19.3871 + 0.52402073 * days;
  const fictionSunAngle = 270.3871 + 0.524038496 * days;
  const planets = [
    [0.0071, 2.2353, 49.409], [0.0057, 2.7543, 168.173], [0.0039, 1.1177, 191.837], [0.0037, 15.7866, 21.736],
    [0.0021, 2.1354, 15.704], [0.0020, 2.4694, 95.528], [0.0018, 32.8493, 49.095]
  ].reduce((sum, [a, tau, phi]) => sum + a * Math.cos((0.985626 * days / tau + phi) * rad), 0);
  const orbitOffset = (10.691 + 3e-7 * days) * sinDeg(meanAnomaly) + 0.623 * sinDeg(2 * meanAnomaly) +
    0.05 * sinDeg(3 * meanAnomaly) + 0.005 * sinDeg(4 * meanAnomaly) + 0.0005 * sinDeg(5 * meanAnomaly) + planets;
  const season = fictionSunAngle + orbitOffset; // Ls: where Mars is in its year, in degrees

  const timeEquation = 2.861 * sinDeg(2 * season) - 0.071 * sinDeg(4 * season) +
    0.002 * sinDeg(6 * season) - orbitOffset;
  const marsDate = (days - 4.5) / 1.0274912517 + 44796 - 0.0009626 + JEZERO_LON_EAST / 360;
  const meanHours = (marsDate % 1) * 24;

  const declination = Math.asin(0.42565 * sinDeg(season)) + 0.25 * rad * sinDeg(season);
  const hourAngle = (meanHours + timeEquation / 15 - 12) * 15 * rad;
  const sunElevation = Math.asin(
    sinDeg(JEZERO_LAT) * Math.sin(declination) + Math.cos(JEZERO_LAT * rad) * Math.cos(declination) * Math.cos(hourAngle)
  ) / rad;

  return {
    sol: Math.floor(marsDate) - MARS_DATE_AT_LANDING,
    meanHours,
    season: ((season % 360) + 360) % 360,
    sunElevation
  };
}

function formatHours(hours) {
  const seconds = Math.floor(hours * 3600);
  return [seconds / 3600, seconds / 60 % 60, seconds % 60]
    .map(n => String(Math.floor(n)).padStart(2, '0'))
    .join(':');
}
