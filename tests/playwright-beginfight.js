/**
 * Playwright proof: from Emberhaven spawn (328, 248), walking within 24px of
 * engageTarget calls beginFight (camera shake, 260ms, BattleScene).
 * Exactly 24px does not fight. Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-beginfight.js [port]
 */
(async function () {
    var port = process.argv[2] || '39310';
    var result = await require('./playwright-session').withGamePage(port, async function (page) {
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
            var hero = window.game.registry.get('hero');
            hero.autoAttack = false;
            window.game.registry.set('hero', hero);
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            world.engageTarget = null;
            world.talkTarget = null;
            world.walkTarget = null;
            world.encounterLock = false;
            world.engageGrace = 0;
            var chicken = null;
            var kids = world.mobs.getChildren();
            for (var i = 0; i < kids.length; i++) {
                if (kids[i].aliveMob && kids[i].mobDef.type === 'Chicken') {
                    chicken = kids[i];
                    break;
                }
            }
            if (!chicken) {
                reject(new Error('no haven chicken'));
                return;
            }
            chicken.setPosition(400, 250);
            if (chicken.body) {
                chicken.body.setVelocity(0, 0);
            }
            var spawnDist = window.Phaser.Math.Distance.Between(world.player.x, world.player.y, chicken.x, chicken.y);
            if (spawnDist <= 24) {
                reject(new Error('chicken too close to spawn (' + spawnDist + 'px)'));
                return;
            }
            world.onClick({ worldX: chicken.x, worldY: chicken.y });
            if (world.engageTarget !== chicken) {
                reject(new Error('engageTarget not set'));
                return;
            }

            world.player.setPosition(chicken.x - 24, chicken.y);
            world.player.body.setVelocity(90, 0);
            world.engageGrace = 0;
            if (world.tryAutoEngage()) {
                reject(new Error('fought at exactly 24px'));
                return;
            }
            if (window.game.scene.isActive('BattleScene')) {
                reject(new Error('BattleScene started at 24px'));
                return;
            }

            var shakeMs = null;
            var cam = world.cameras.main;
            var origShake = cam.shake.bind(cam);
            cam.shake = function (duration) {
                shakeMs = duration;
                return origShake.apply(cam, arguments);
            };
            world.player.setPosition(chicken.x - 23, chicken.y);
            world.player.body.setVelocity(90, 0);
            world.walkTarget = { x: chicken.x, y: chicken.y };
            world.engageGrace = 0;
            var t0 = Date.now();
            var started = world.tryAutoEngage();
            cam.shake = origShake;
            if (!started) {
                reject(new Error('did not beginFight at 23px'));
                return;
            }
            if (!world.encounterLock) {
                reject(new Error('encounterLock not set'));
                return;
            }
            if (world.walkTarget) {
                reject(new Error('walkTarget not cleared'));
                return;
            }
            if (world.player.body.velocity.x || world.player.body.velocity.y) {
                reject(new Error('body still moving'));
                return;
            }
            if (shakeMs !== 160) {
                reject(new Error('shake duration ' + shakeMs + ' not 160'));
                return;
            }
            if (!(cam.shakeEffect && cam.shakeEffect.isRunning)) {
                reject(new Error('camera shake not running'));
                return;
            }
            if (window.game.scene.isActive('BattleScene')) {
                reject(new Error('BattleScene started before 260ms delay'));
                return;
            }

            var waitBattle = function () {
                if (world.overworldFight) {
                    var elapsed = Date.now() - t0;
                    if (elapsed < 200) {
                        reject(new Error('overworld fight too soon (' + elapsed + 'ms)'));
                        return;
                    }
                    resolve({
                        spawn: spawn,
                        chicken: { x: chicken.x, y: chicken.y },
                        spawnDist: Math.round(spawnDist),
                        shakeMs: shakeMs,
                        elapsed: elapsed,
                        hudMode: window.Hud.mode,
                        keyboard: window.game.input.keyboard,
                        version: window.Phaser && window.Phaser.VERSION
                    });
                    return;
                }
                if (Date.now() - t0 > 1500) {
                    reject(new Error('overworld fight did not start after 260ms'));
                    return;
                }
                setTimeout(waitBattle, 20);
            };
            waitBattle();
        });
    });
    });

    if (result.keyboard) {
        throw new Error('Phaser keyboard was enabled');
    }
    if (!String(result.version || '').startsWith('3.')) {
        throw new Error('expected Phaser 3, got ' + result.version);
    }
    if (result.hudMode !== 'battle') {
        throw new Error('HUD mode is ' + result.hudMode + ' not battle');
    }
    console.log('PASS beginFight within 24px', JSON.stringify(result));
})().catch(function (err) {
    console.error('FAIL', err && err.message ? err.message : err);
    process.exit(1);
});
