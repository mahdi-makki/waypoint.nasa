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

console.log('walk tests passed');
