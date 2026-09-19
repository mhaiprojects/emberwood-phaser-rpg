/**
 * Playwright proof: from spawn (328, 248), NPCs idle-face and take a tiny
 * wander leash without becoming statues. Player–NPC collider stays immovable.
 * Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-npc-wander.js [port]
 */
(async function () {
    var port = process.argv[2] || '8765';
    var session = require('./playwright-session');
    var result = await session.withGamePage(port, async function (page, opened) {
        var live = await page.evaluate(function () {
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
            if (typeof world.wanderNpcs !== 'function') {
                throw new Error('wanderNpcs missing');
            }

            world.enterZone('haven', null);
            world.exitLock = true;
            world.encounterLock = false;
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            world.talkTarget = null;
            world.dialogueNpc = null;
            world.engageTarget = null;
            if (world.clearWalk) {
                world.clearWalk();
            }
            var hero = window.game.registry.get('hero');
            if (hero) {
                hero.autoAttack = false;
                window.game.registry.set('hero', hero);
            }

            var rowan = null;
            world.npcs.getChildren().forEach(function (npc) {
                if (npc.npcDef && npc.npcDef.key === 'guard') {
                    rowan = npc;
                } else if (npc.body) {
                    npc.body.enable = false;
                    npc.body.setVelocity(0, 0);
                }
            });
            if (!rowan || !rowan.body) {
                throw new Error('Guard Rowan missing');
            }
            if (!rowan.body.immovable) {
                throw new Error('Rowan body is not immovable');
            }
            if (Math.round(rowan.x) !== 252 || Math.round(rowan.y) !== 168) {
                throw new Error('Rowan not at 252,168');
            }
            if (rowan.homeX !== 252 || rowan.homeY !== 168) {
                throw new Error('Rowan home is not spawn');
            }

            world.mobs.getChildren().forEach(function (mob) {
                if (mob.body) {
                    mob.body.enable = false;
                    mob.body.setVelocity(0, 0);
                }
            });

            var orig = window.Phaser.Math.Between;
            try {
                window.Phaser.Math.Between = function () {
                    return 1;
                };
                rowan.body.setVelocity(0, 0);
                rowan.lastFacing = 'down';
                world.wanderNpcs();
                if (rowan.body.velocity.x !== 0 || rowan.body.velocity.y !== 0) {
                    throw new Error('miss still wandered');
                }
                if (rowan.lastFacing !== 'down' || rowan.flipX) {
                    throw new Error('miss idle facing lost');
                }

                var seq = [0, 8, 0];
                var i = 0;
                window.Phaser.Math.Between = function () {
                    var value = seq[i];
                    i += 1;
                    return value;
                };
                world.wanderNpcs();
                if (Math.round(rowan.body.velocity.x) !== 8 || Math.round(rowan.body.velocity.y) !== 0) {
                    throw new Error('wander vx/vy ' + rowan.body.velocity.x + ',' + rowan.body.velocity.y);
                }
                if (rowan.lastFacing !== 'right' || !rowan.flipX) {
                    throw new Error('wander did not face right');
                }
                if (!rowan.body.immovable) {
                    throw new Error('wander made Rowan movable');
                }

                rowan.body.reset(rowan.homeX + 24, rowan.homeY);
                rowan.setPosition(rowan.homeX + 24, rowan.homeY);
                window.Phaser.Math.Between = function () {
                    return 0;
                };
                world.wanderNpcs();
                if (!(rowan.body.velocity.x < 0) || Math.round(rowan.body.velocity.y) !== 0) {
                    throw new Error('leash did not pull home');
                }

                rowan.body.setVelocity(0, 0);
                rowan.body.reset(rowan.homeX, rowan.homeY);
                rowan.setPosition(rowan.homeX, rowan.homeY);
                world.placePlayer(rowan.x - 18, rowan.y);
                world.player.body.setVelocity(0, 0);
                world.wanderNpcs();
                if (rowan.body.velocity.x !== 0 || rowan.body.velocity.y !== 0) {
                    throw new Error('nearby player let Rowan wander');
                }
                if (Math.round(rowan.x) !== 252 || Math.round(rowan.y) !== 168) {
                    throw new Error('nearby player shoved Rowan');
                }
            } finally {
                window.Phaser.Math.Between = orig;
            }

            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            return {
                spawn: spawn,
                player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                rowan: {
                    x: Math.round(rowan.x),
                    y: Math.round(rowan.y),
                    immovable: rowan.body.immovable,
                    facing: rowan.lastFacing
                },
                keyboard: !!window.game.input.keyboard
            };
        });

        var only = encodeURIComponent('npcs: idle facing and a tiny wander leash so they are not statues');
        await page.goto(opened.base + 'tests/run.html?only=' + only, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(function () {
            var title = document.title || '';
            return title.indexOf('PASS') === 0 || title.indexOf('FAIL') === 0;
        }, null, { timeout: 60000 });
        var suiteTitle = await page.title();
        var suiteStatus = await page.evaluate(function () {
            return document.getElementById('status') && document.getElementById('status').textContent;
        });
        if (suiteTitle.indexOf('PASS') !== 0) {
            throw new Error('dedicated case failed: ' + suiteTitle + ' / ' + suiteStatus);
        }
        return { live: live, suite: suiteStatus || suiteTitle };
    });
    if (result.live.player.x !== 328 || result.live.player.y !== 248) {
        throw new Error('did not return to spawn: ' + result.live.player.x + ',' + result.live.player.y);
    }
    if (result.live.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    if (!result.live.rowan.immovable) {
        throw new Error('Rowan not immovable');
    }
    console.log('PASS 1/1 NPC idle facing + wander leash', result.suite, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
