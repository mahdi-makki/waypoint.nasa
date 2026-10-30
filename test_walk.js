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
  [77, 18.02, -2300], // 200 m up: about 18.7 degrees, steep
  [77, 18.03, -2400], // 100 m down: about 9.6 degrees, not steep
  [77, 18.03001, -2390] // about 1 m long: too short to count as steep
]);
assert(Math.abs(made.distanceM - 1775) < 2, 'distance');
assert.strictEqual(made.climbM, 210, 'climb counts only uphill');
assert.strictEqual(made.highestM, -2300);
assert.strictEqual(made.lowestM, -2500);
assert.strictEqual(made.steepParts.length, 1, 'one steep part');
assert(Math.abs(made.steepM - 591.6) < 1, 'steep length');

// The real walk, compared against the numbers found when it was chosen.
const real = walkStats(M20.slice(WALK_FIRST_STOP, WALK_LAST_STOP + 1));
assert(Math.abs(real.distanceM - 4150) < 10, 'real distance');
assert(Math.abs(real.climbM - 125) < 1, 'real climb');
assert(Math.abs(real.steepM - 89) < 1, 'real steep length');

console.log('walk tests passed');
