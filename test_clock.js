// Run with: node test_clock.js
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

vm.runInThisContext(fs.readFileSync(__dirname + '/clock.js', 'utf8'));

// Real timestamp from NASA's Perseverance photo feed: 2026-10-30T09:06:20.570 UTC = Sol 2024, 12:55:51.
const photo = marsClock(new Date('2026-10-30T09:06:20.570Z'));
const photoHours = 12 + 55 / 60 + 51 / 3600;
assert.strictEqual(photo.sol, 2024, 'photo sol');
assert(Math.abs(photo.meanHours - photoHours) < 1 / 60, 'photo time within 1 minute');
assert(photo.sunElevation > 0, 'sun up around 1pm');

// More real timestamps from the same feed, spread across the mission.
for (const [utc, sol, hours] of [
  ['2021-06-01T16:02:12.292Z', 100, 17 + 10 / 60 + 51 / 3600],
  ['2023-12-13T09:18:57.463Z', 1000, 16 + 39 / 60 + 47 / 3600]
]) {
  const clock = marsClock(new Date(utc));
  assert.strictEqual(clock.sol, sol, `sol ${sol}`);
  assert(Math.abs(clock.meanHours - hours) < 1 / 60, `sol ${sol} time within 1 minute`);
}

// Landing happened 2021-02-18 about 20:44 UTC (20:55 was when the signal reached Earth), early in the Mars year.
const landing = marsClock(new Date('2021-02-18T20:44:00Z'));
assert.strictEqual(landing.sol, 0, 'landing sol');
assert(landing.season > 4 && landing.season < 7, 'landing season');

// Half a Mars day after the photo, it should be night.
const night = marsClock(new Date(Date.parse('2026-10-30T09:06:20.570Z') + 88775 / 2 * 1000));
assert(night.sunElevation < 0, 'sun down around 1am');

assert.strictEqual(formatHours(12 + 5 / 60 + 9 / 3600 + 0.0001), '12:05:09');

console.log('clock tests passed');
