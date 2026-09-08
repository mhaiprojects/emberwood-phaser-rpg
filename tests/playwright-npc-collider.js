/**
 * Playwright proof: from spawn (328, 248), the player–NPC arcade collider
 * is immovable — Keys.js D into Guard Rowan does not shove the NPC.
 * Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-npc-collider.js [port]
 */
(async function () {
    var port = process.argv[2] || '8765';
    var session = require('./playwright-session');
    var result = await session.withGamePage(port, async function (page) {
        return await page.evaluate(function () {
            function dispatchKey(code, key, type) {
                var keyCode = code === 'KeyD' ? 68 : 0;
                var event = new KeyboardEvent(type, {
                    key: key,
                    code: code,
                    keyCode: keyCode,
                    which: keyCode,
                    bubbles: true,
                    cancelable: true
                });
                (document.body || window).dispatchEvent(event);
            }

            var world = window.game.scene.getScene('WorldScene');
            var spawn = window.defaultWorldSpawn();
            if (spawn.x !== 328 || spawn.y !== 248) {
                throw new Error('spawn is ' + spawn.x + ',' + spawn.y + ' not 328,248');
            }
            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard must stay off');
            }
            if (String(window.Phaser.VERSION).indexOf('3.90') !== 0) {
                throw new Error('Phaser is ' + window.Phaser.VERSION + ' not 3.90');
            }
            world.enterZone('haven', null);
            world.exitLock = false;
            world.encounterLock = false;
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            var hero = window.game.registry.get('hero');
            hero.autoAttack = false;
            window.game.registry.set('hero', hero);

            var groupDefaults = world.npcs.defaults || {};
            if (!(groupDefaults.immovable === true || groupDefaults.setImmovable === true)) {
                throw new Error('NPC group is not immovable');
            }
            var colliders = world.physics.world.colliders;
            var list = (colliders.getActive && colliders.getActive()) || colliders.list || colliders._active || [];
            var npcCollider = null;
            for (var i = 0; i < list.length; i++) {
                var c = list[i];
                if (!c) {
                    continue;
                }
                if ((c.object1 === world.player && c.object2 === world.npcs) ||
                    (c.object2 === world.player && c.object1 === world.npcs)) {
                    npcCollider = c;
                    break;
                }
            }
            if (!npcCollider || !npcCollider.active) {
                throw new Error('player-NPC arcade collider missing');
            }
            if (world.player.body.immovable) {
                throw new Error('player body should be movable');
            }

            var rowan = null;
            world.npcs.getChildren().forEach(function (npc) {
                if (npc.npcDef && npc.npcDef.key === 'guard') {
                    rowan = npc;
                }
            });
            if (!rowan) {
                throw new Error('Guard Rowan missing');
            }
            if (!rowan.body.immovable) {
                throw new Error('Rowan body is not immovable');
            }
            world.mobs.getChildren().forEach(function (mob) {
                if (mob.body) {
                    mob.body.enable = false;
                    mob.body.setVelocity(0, 0);
                }
            });
            world.npcs.getChildren().forEach(function (other) {
                if (other.body) {
                    other.body.enable = other === rowan;
                    other.body.setVelocity(0, 0);
                }
            });

            var ox = rowan.x;
            var oy = rowan.y;
            world.placePlayer(ox - 18, oy);
            world.player.body.setVelocity(0, 0);
            world.clearWalk();
            world.exitLock = true;
            world.talkTarget = null;
            world.engageTarget = null;
            if (window.Keys) {
                window.Keys.down = {};
                window.Keys.pressed = {};
            }
            var startX = world.player.x;
            dispatchKey('KeyD', 'd', 'keydown');
            return new Promise(function (resolve) {
                setTimeout(resolve, 400);
            }).then(function () {
                dispatchKey('KeyD', 'd', 'keyup');
                if (window.Keys) {
                    window.Keys.down = {};
                    window.Keys.pressed = {};
                }
                world.player.body.setVelocity(0, 0);
                if (Math.abs(rowan.x - ox) >= 1 || Math.abs(rowan.y - oy) >= 1) {
                    throw new Error('Rowan shoved to ' + rowan.x + ',' + rowan.y);
                }
                if (!(world.player.x > startX)) {
                    throw new Error('D did not walk into Rowan');
                }
                if (!(world.player.x < rowan.x)) {
                    throw new Error('player passed through Rowan x=' + world.player.x);
                }
                world.placePlayer(spawn.x, spawn.y);
                world.player.body.setVelocity(0, 0);
                return {
                    spawn: spawn,
                    player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                    phaser: window.Phaser.VERSION,
                    keyboard: window.game.input.keyboard,
                    rowan: { x: Math.round(rowan.x), y: Math.round(rowan.y), immovable: rowan.body.immovable },
                    colliderActive: npcCollider.active,
                    walkedX: startX
                };
            });
        });
    });

    if (result.player.x !== 328 || result.player.y !== 248) {
        throw new Error('did not return to spawn: ' + result.player.x + ',' + result.player.y);
    }
    if (result.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    if (result.rowan.x !== 252 || result.rowan.y !== 168 || !result.rowan.immovable) {
        throw new Error('Rowan not immovable at 252,168: ' + JSON.stringify(result.rowan));
    }
    if (!result.colliderActive) {
        throw new Error('player-NPC collider inactive');
    }
    console.log(JSON.stringify(result));
})().catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
