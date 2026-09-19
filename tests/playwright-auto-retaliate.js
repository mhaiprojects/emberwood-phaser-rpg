/**
 * Playwright proof: from spawn (328, 248), auto-retaliate is a setting
 * separate from world auto-engage. World auto-attack still engages a nearby
 * mob when retaliate is off. Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-auto-retaliate.js [port]
 */
(async function () {
    var port = process.argv[2] || '8765';
    var session = require('./playwright-session');

    async function runOnly(page, opened, onlyName) {
        var only = encodeURIComponent(onlyName);
        await page.goto(opened.base + 'tests/run.html?only=' + only, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(function () {
            var title = document.title || '';
            return title.indexOf('PASS') === 0 || title.indexOf('FAIL') === 0;
        }, null, { timeout: 90000 });
        var suiteTitle = await page.title();
        var suiteStatus = await page.evaluate(function () {
            return document.getElementById('status') && document.getElementById('status').textContent;
        });
        if (suiteTitle.indexOf('PASS') !== 0) {
            throw new Error(onlyName + ' failed: ' + suiteTitle + ' / ' + suiteStatus);
        }
        return suiteStatus || suiteTitle;
    }

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
            world.enterZone('haven', null);
            world.exitLock = false;
            world.encounterLock = false;
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            var hero = window.game.registry.get('hero');
            if (!hero.autoAttack) {
                throw new Error('auto-attack should default on');
            }
            if (!window.autoRetaliateOn(hero)) {
                throw new Error('auto-retaliate should default on');
            }

            hero.autoAttack = true;
            hero.autoRetaliate = false;
            window.game.registry.set('hero', hero);
            if (window.Hud && window.Hud.renderAutoAttack) {
                window.Hud.renderAutoAttack(hero);
            }
            if (window.Hud && window.Hud.renderAutoRetaliate) {
                window.Hud.renderAutoRetaliate(hero);
            }
            if (!world.autoAttackOn()) {
                throw new Error('world auto-engage should stay on with retaliate off');
            }
            if (world.autoRetaliateOn()) {
                throw new Error('auto-retaliate helper should be off');
            }

            var chicken = null;
            world.mobs.getChildren().forEach(function (mob) {
                if (!chicken && mob.aliveMob && mob.mobDef && mob.mobDef.type === 'Chicken') {
                    chicken = mob;
                }
            });
            if (!chicken) {
                throw new Error('need a haven chicken');
            }
            world.engageGrace = 0;
            world.engageTarget = null;
            world.talkTarget = null;
            world.walkTarget = null;
            world.player.setPosition(chicken.x - 10, chicken.y);
            world.player.body.setVelocity(0, 0);
            if (!world.tryAutoEngage()) {
                throw new Error('world auto-attack should engage with retaliate off');
            }
            return {
                spawn: { x: spawn.x, y: spawn.y },
                autoAttack: hero.autoAttack,
                autoRetaliate: hero.autoRetaliate,
                engaged: true,
                keyboard: !!window.game.input.keyboard
            };
        });

        await page.waitForFunction(function () {
            return window.game && window.game.scene && window.game.scene.isActive('BattleScene');
        }, null, { timeout: 4000 });

        var dedicated = await runOnly(
            page,
            opened,
            'combat: auto-retaliate is separate from world auto-engage'
        );
        var worldEngage = await runOnly(
            page,
            opened,
            'world: auto-attack engages a nearby mob'
        );
        return { live: live, dedicated: dedicated, worldEngage: worldEngage };
    });
    if (result.live.spawn.x !== 328 || result.live.spawn.y !== 248) {
        throw new Error('spawn is ' + result.live.spawn.x + ',' + result.live.spawn.y + ' not 328,248');
    }
    if (!result.live.engaged) {
        throw new Error('live world auto-attack did not engage');
    }
    if (result.live.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    if (!result.live.autoAttack) {
        throw new Error('live auto-attack should stay on');
    }
    if (result.live.autoRetaliate) {
        throw new Error('live auto-retaliate should stay off');
    }
    console.log('PASS 2/2 auto-retaliate split', result.dedicated, result.worldEngage, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
