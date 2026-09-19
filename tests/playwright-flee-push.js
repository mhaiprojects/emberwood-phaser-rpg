/**
 * Playwright proof: from spawn (328, 248), fleeing a fight pushes the
 * player off the mob and extends engageGrace so auto-attack does not
 * instantly re-aggro. Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-flee-push.js [port]
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
                throw new Error('need two haven chickens');
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
            parkChicken(near, spawn.x + 10, spawn.y);
            parkChicken(far, spawn.x + 80, spawn.y);
            world.engageTarget = null;
            world.talkTarget = null;
            world.walkTarget = null;
            world.lastFought = near;
            window.game.registry.set('battleOutcome', 'flee');
            world.wake();

            var dist = window.Phaser.Math.Distance.Between(world.player.x, world.player.y, near.x, near.y);
            if (!(dist > 20)) {
                throw new Error('flee did not push outside auto-attack range (' + dist + 'px)');
            }
            if (dist < 28) {
                throw new Error('flee knockback too short (' + dist + 'px)');
            }
            var remaining = world.engageGrace - world.time.now;
            if (!(remaining > 700 && remaining <= 1100)) {
                throw new Error('flee grace not extended (got ' + remaining + 'ms)');
            }
            if (world.tryAutoEngage()) {
                throw new Error('auto-attack re-aggroed during flee grace');
            }
            world.engageGrace = 0;
            if (world.tryAutoEngage()) {
                throw new Error('auto-attack re-aggroed from pushed distance');
            }
            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard must stay off after flee');
            }
            return {
                spawn: spawn,
                dist: dist,
                remaining: remaining,
                player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                chicken: { x: Math.round(near.x), y: Math.round(near.y) },
                autoAttack: hero.autoAttack,
                keyboard: window.game.input.keyboard,
                phaser: window.Phaser.VERSION
            };
        });

        var dedicated = await runOnly(
            page,
            opened,
            'combat: after flee player is pushed off the mob and engageGrace blocks auto-attack'
        );
        return { live: live, dedicated: dedicated };
    });

    if (result.live.spawn.x !== 328 || result.live.spawn.y !== 248) {
        throw new Error('spawn is ' + result.live.spawn.x + ',' + result.live.spawn.y + ' not 328,248');
    }
    if (!(result.live.dist > 20)) {
        throw new Error('live flee push stayed in range: ' + result.live.dist);
    }
    if (result.live.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    if (!result.live.autoAttack) {
        throw new Error('auto-attack should stay on');
    }
    console.log('PASS 1/1 flee push + engageGrace', result.dedicated, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
