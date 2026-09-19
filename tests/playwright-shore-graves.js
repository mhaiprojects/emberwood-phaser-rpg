/**
 * Playwright proof: from spawn (328, 248), Southshore dock / boat and
 * Restless Graves tomb markers are examine-only scenery (no travel).
 * Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-shore-graves.js [port]
 */
(async function () {
    var port = process.argv[2] || '8765';
    var session = require('./playwright-session');
    var result = await session.withGamePage(port, async function (page, opened) {
        var live = await page.evaluate(function () {
            function lastChat() {
                var lines = document.querySelectorAll('.chat-line');
                return lines.length ? lines[lines.length - 1].textContent : '';
            }
            function clickTile(world, tx, ty) {
                var pt = window.tileCenter(tx, ty);
                world.onClick({ worldX: pt.x, worldY: pt.y });
                return pt;
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
            world.encounterLock = false;
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            var hero = window.game.registry.get('hero');
            hero.autoAttack = false;
            window.game.registry.set('hero', hero);
            if (world.clearWalk) {
                world.clearWalk();
            }

            var want = {
                dock: 'A weathered wooden dock. The tide slaps the pilings.',
                boat: 'A fishing boat, tied off and empty.',
                tomb: 'A weathered tomb marker. The name is worn away.'
            };

            world.enterZone('southshore', null);
            world.encounterLock = false;
            if (world.mobs && world.mobs.getChildren) {
                world.mobs.getChildren().forEach(function (mob) {
                    if (mob.body) {
                        mob.body.setVelocity(0, 0);
                    }
                });
            }
            var shore = window.SHORE_PROPS;
            clickTile(world, shore.dock.x, shore.dock.y);
            if (lastChat() !== want.dock) {
                throw new Error('dock examine was ' + lastChat());
            }
            if (world.walkTarget) {
                throw new Error('dock examine started a walk');
            }
            clickTile(world, shore.boat.x, shore.boat.y);
            if (lastChat() !== want.boat) {
                throw new Error('boat examine was ' + lastChat());
            }
            if (world.walkTarget) {
                throw new Error('boat examine started a walk');
            }

            world.enterZone('graves', null);
            world.encounterLock = false;
            if (world.mobs && world.mobs.getChildren) {
                world.mobs.getChildren().forEach(function (mob) {
                    if (mob.body) {
                        mob.body.setVelocity(0, 0);
                    }
                });
            }
            var tombs = window.GRAVE_PROPS.tombs;
            var i;
            for (i = 0; i < tombs.length; i++) {
                clickTile(world, tombs[i].x, tombs[i].y);
                if (lastChat() !== want.tomb) {
                    throw new Error('tomb examine was ' + lastChat());
                }
                if (world.walkTarget) {
                    throw new Error('tomb examine started a walk');
                }
            }

            world.enterZone('haven', null);
            world.placePlayer(spawn.x, spawn.y);
            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            return {
                spawn: spawn,
                last: lastChat(),
                keyboard: !!window.game.input.keyboard
            };
        });

        var only = encodeURIComponent('world: Southshore dock/boat and Restless Graves tombs are examine-only scenery');
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
    console.log('PASS 1/1 shore graves', result.suite, result.live && result.live.last);
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
