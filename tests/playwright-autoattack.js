/**
 * Playwright proof: from spawn (328, 248), auto-attack on engages the
 * nearest living mob within 20px after engageGrace. Exactly 20px and
 * grace window do not fight. Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-autoattack.js [port]
 */
(async function () {
    var port = process.argv[2] || '8765';
    var session = require('./playwright-session');
    var result = await session.withGamePage(port, async function (page) {
        return await page.evaluate(function () {
            return new Promise(function (resolve, reject) {
                var world = window.game.scene.getScene('WorldScene');
                var spawn = window.defaultWorldSpawn();
                if (spawn.x !== 328 || spawn.y !== 248) {
                    reject(new Error('spawn is ' + spawn.x + ',' + spawn.y + ' not 328,248'));
                    return;
                }
                if (window.game.input.keyboard) {
                    reject(new Error('Phaser keyboard must stay off'));
                    return;
                }
                if (String(window.Phaser.VERSION).indexOf('3.90') !== 0) {
                    reject(new Error('Phaser is ' + window.Phaser.VERSION + ' not 3.90'));
                    return;
                }
                world.enterZone('haven', null);
                world.exitLock = false;
                world.encounterLock = false;
                world.placePlayer(spawn.x, spawn.y);
                world.player.body.setVelocity(0, 0);
                var hero = window.game.registry.get('hero');
                hero.autoAttack = true;
                window.game.registry.set('hero', hero);
                if (window.Hud && window.Hud.renderAutoAttack) {
                    window.Hud.renderAutoAttack(hero);
                }

                var chickens = [];
                world.mobs.getChildren().forEach(function (mob) {
                    if (mob.aliveMob && mob.mobDef && mob.mobDef.type === 'Chicken') {
                        chickens.push(mob);
                    }
                });
                if (chickens.length < 2) {
                    reject(new Error('need two haven chickens'));
                    return;
                }
                var near = chickens[0];
                var far = chickens[1];
                function parkChicken(mob, x, y) {
                    mob.setPosition(x, y);
                    mob.aliveMob = true;
                    if (mob.body) {
                        mob.body.setVelocity(0, 0);
                    }
                }

                parkChicken(near, spawn.x + 20, spawn.y);
                parkChicken(far, spawn.x + 40, spawn.y);
                world.engageTarget = null;
                world.talkTarget = null;
                world.walkTarget = null;
                world.engageGrace = world.time.now + 800;
                if (world.tryAutoEngage()) {
                    reject(new Error('fought at 20px during engageGrace'));
                    return;
                }

                world.player.setPosition(spawn.x + 1, spawn.y);
                world.player.body.setVelocity(0, 0);
                if (window.Phaser.Math.Distance.Between(world.player.x, world.player.y, near.x, near.y) !== 19) {
                    reject(new Error('19px fixture failed'));
                    return;
                }
                if (world.tryAutoEngage()) {
                    reject(new Error('fought at 19px during engageGrace'));
                    return;
                }

                world.placePlayer(spawn.x, spawn.y);
                world.player.body.setVelocity(0, 0);
                world.engageGrace = 0;
                if (world.tryAutoEngage()) {
                    reject(new Error('fought at exactly 20px'));
                    return;
                }

                near.aliveMob = false;
                near.setPosition(spawn.x + 10, spawn.y);
                if (near.body) {
                    near.body.setVelocity(0, 0);
                }
                parkChicken(far, spawn.x + 40, spawn.y);
                world.engageGrace = 0;
                if (world.tryAutoEngage()) {
                    reject(new Error('engaged a dead mob'));
                    return;
                }

                parkChicken(near, spawn.x + 10, spawn.y);
                parkChicken(far, spawn.x + 19, spawn.y);
                world.engageTarget = null;
                world.engageGrace = 0;
                var started = world.tryAutoEngage();
                if (!started) {
                    reject(new Error('did not beginFight within 20px after grace'));
                    return;
                }
                if (!world.encounterLock) {
                    reject(new Error('encounterLock not set'));
                    return;
                }
                if (world.lastFought !== near) {
                    reject(new Error('did not pick the nearest living chicken'));
                    return;
                }
                var pending = window.game.registry.get('pendingEncounter');
                if (!(pending && pending.enemies && pending.enemies[0] && pending.enemies[0].type === 'Chicken')) {
                    reject(new Error('pendingEncounter is not the nearest Chicken'));
                    return;
                }

                var t0 = Date.now();
                var waitBattle = function () {
                    if (window.game.scene.isActive('BattleScene')) {
                        resolve({
                            spawn: spawn,
                            player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                            phaser: window.Phaser.VERSION,
                            keyboard: window.game.input.keyboard,
                            lastType: world.lastFought && world.lastFought.mobDef && world.lastFought.mobDef.type,
                            autoAttack: hero.autoAttack,
                            hudMode: window.Hud.mode,
                            elapsed: Date.now() - t0
                        });
                        return;
                    }
                    if (Date.now() - t0 > 1500) {
                        reject(new Error('BattleScene did not start after auto-attack'));
                        return;
                    }
                    setTimeout(waitBattle, 20);
                };
                waitBattle();
            });
        });
    });

    if (result.player.x !== 328 || result.player.y !== 248) {
        throw new Error('did not return to spawn: ' + result.player.x + ',' + result.player.y);
    }
    if (result.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    if (!result.autoAttack) {
        throw new Error('auto-attack should stay on');
    }
    if (result.lastType !== 'Chicken') {
        throw new Error('lastFought is ' + result.lastType);
    }
    if (result.hudMode !== 'battle') {
        throw new Error('HUD mode is ' + result.hudMode + ' not battle');
    }
    console.log(JSON.stringify(result));
})().catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
