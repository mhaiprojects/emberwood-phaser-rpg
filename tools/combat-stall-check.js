#!/usr/bin/env node
/**
 * Diagnostic asserts for overworld combat stall
 * ("You enter combat with X" but no move/attack).
 *
 * Run: node tools/combat-stall-check.js
 * (Does not open a browser; suite harness remains disabled per project rules.)
 *
 * Loads CombatController in isolation with a tiny mock world.
 */
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var root = path.join(__dirname, '..');
var src = fs.readFileSync(path.join(root, 'js/world/CombatController.js'), 'utf8');
var sandbox = { window: {}, console: console };
vm.createContext(sandbox);
vm.runInContext(src, sandbox);
var CC = sandbox.CombatController || sandbox.window.CombatController;
if (!CC) {
    console.error('FAIL: CombatController not loaded');
    process.exit(1);
}

var fails = 0;
function assert(cond, msg) {
    if (!cond) {
        fails += 1;
        console.error('FAIL:', msg);
    } else {
        console.log('ok:', msg);
    }
}

/* Policy: in-fight close must NOT require auto-retaliate once fight exists. */
var world = {
    overworldFight: { mob: { aliveMob: true } },
    playerIntent: { kind: 'attack', pauseAutos: false },
    playerClickWalkActive: false,
    autoRetaliateOn: function () { return false; }
};
assert(CC.shouldCloseInFight(world, 30, 24, 40) === true,
    'in-fight close allowed with retaliate off when inside mob range / outside weapon');
assert(CC.shouldCloseInFight(world, 50, 24, 40) === false,
    'no close when safely outside mob attack range');
assert(CC.shouldCloseInFight(world, 20, 24, 40) === false,
    'no close when already in weapon range');

world.playerIntent.pauseAutos = true;
assert(CC.shouldCloseInFight(world, 30, 24, 40) === false,
    'click-walk pause blocks in-fight close');

world.playerIntent.pauseAutos = false;
world.overworldFight = null;
assert(CC.shouldCloseInFight(world, 30, 24, 40) === false,
    'no in-fight close without active overworldFight');

/* Intent restore after begin→start: applyIntent attack source fight. */
var w2 = {
    engageTarget: null,
    playerClickWalkActive: true,
    playerIntent: null
};
CC.applyIntent(w2, {
    kind: 'attack',
    target: { aliveMob: true, id: 'cow' },
    dest: null,
    pauseAutos: false,
    silent: true,
    source: 'fight'
});
assert(w2.engageTarget && w2.engageTarget.id === 'cow', 'fight intent mirrors engageTarget');
assert(w2.playerClickWalkActive === false, 'fight intent clears click-walk pause');
assert(CC.attackTarget(w2) && CC.attackTarget(w2).id === 'cow', 'attackTarget reads intent');

if (fails) {
    console.error('\n' + fails + ' assertion(s) failed');
    process.exit(1);
}
console.log('\nAll combat-stall policy checks passed.');
