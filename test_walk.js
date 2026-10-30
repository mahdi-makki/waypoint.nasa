// Run with: node test_walk.js
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

vm.runInThisContext(fs.readFileSync(__dirname + '/m20.js', 'utf8'));
vm.runInThisContext(fs.readFileSync(__dirname + '/walk.js', 'utf8'));

// 0.01 degrees of latitude on Mars is about 591.6 m.
const made = walkStats([
  [77, 18.00, -2500],
  [77, 18.01, -2500], // flat
  [77, 18.02, -2300], // 200 m up
  [77, 18.03, -2400], // 100 m down
  [77, 18.03001, -2390] // 10 m up
]);
assert(Math.abs(made.distanceM - 1775) < 2, 'distance');
assert.strictEqual(made.climbM, 210, 'climb counts only uphill');
assert.strictEqual(made.highestM, -2300);
assert.strictEqual(made.lowestM, -2500);

// The real walk, compared against the numbers found when it was chosen.
const real = walkStats(M20.slice(WALK_FIRST_STOP, WALK_LAST_STOP + 1));
assert(Math.abs(real.distanceM - 4150) < 10, 'real distance');
assert(Math.abs(real.climbM - 125) < 1, 'real climb');

// Stays: 14 sols is too short, 15 counts, and the last stop has no next stop to measure against.
const stays = scienceStops([
  [77, 18, -2500, 100],
  [77, 18, -2500, 114],
  [77, 18, -2500, 129],
  [77, 18, -2500, 200]
]);
assert.deepStrictEqual(stays.map(s => s.fromSol), [114, 129], 'long stays');

const realStays = scienceStops(M20.slice(WALK_FIRST_STOP, WALK_LAST_STOP + 1));
assert.deepStrictEqual(realStays.map(s => s.fromSol), [477, 502, 565, 609], 'real long stays');

// Every science stop needs photos taken during its own stay.
vm.runInThisContext(fs.readFileSync(__dirname + '/photos.js', 'utf8'));
assert.strictEqual(STOP_PHOTOS.length, realStays.length, 'photos for each stop');
STOP_PHOTOS.forEach((photos, i) => {
  assert(photos.length >= 1 && photos.length <= 3, `stop ${i + 1} has 1-3 photos`);
  for (const { sol } of photos) {
    assert(sol >= realStays[i].fromSol && sol <= realStays[i].toSol, `stop ${i + 1} photo from sol ${sol}`);
  }
});

// Every science stop needs a description, and every source it names must exist.
vm.runInThisContext(fs.readFileSync(__dirname + '/science.js', 'utf8'));
assert.strictEqual(STOP_SCIENCE.length, realStays.length, 'science for each stop');
for (const { place, did, why, sources } of STOP_SCIENCE) {
  assert(place && did && why, 'science text filled in');
  assert(sources.length > 0 && sources.every(name => SOURCES[name]), `${place} sources exist`);
}

console.log('walk tests passed');
