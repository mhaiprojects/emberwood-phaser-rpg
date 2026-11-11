/**
 * Playwright proof: from spawn (328, 248), Emberhaven stall / range /
 * anvil open station UIs and the bank booth opens the bank overlay.
 * Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-town-props.js [port]
 */
(async function () {
    var port = process.argv[2] || '8765';
    var session = require('./playwright-session');
    var result = await session.withGamePage(port, async function (page, opened) {
        var live = await page.evaluate(function () {
            function standNear(world, tx, ty) {
                var near = window.nearestWalkableTile(world.tileGrid, tx, ty);
                if (!near) {
                    throw new Error('no walkable tile near ' + tx + ',' + ty);
                }
                var pt = window.tileCenter(near.tx, near.ty);
                world.placePlayer(pt.x, pt.y);
                world.player.body.setVelocity(0, 0);
                if (world.clearWalk) {
                    world.clearWalk();
                }
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
            if (window.Hud.hideTitle) {
                window.Hud.hideTitle();
            }
            window.Hud.mode = 'world';
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
            if (window.Hud.hideStation) {
                window.Hud.hideStation();
            }
            if (window.Hud.hideBank) {
                window.Hud.hideBank();
            }

            var props = window.TOWN_PROPS;
            standNear(world, props.range.x, props.range.y);
            clickTile(world, props.range.x, props.range.y);
            if (!window.Hud.stationOpen() || window.Hud.stationKind !== 'range') {
                throw new Error('range did not open cook station');
            }
            window.Hud.hideStation();

            standNear(world, props.anvil.x, props.anvil.y);
            clickTile(world, props.anvil.x, props.anvil.y);
            if (!window.Hud.stationOpen() || window.Hud.stationKind !== 'anvil') {
                throw new Error('anvil did not open smith station');
            }
            window.Hud.hideStation();

            if (!props.furnace) {
                throw new Error('furnace town prop missing');
            }
            standNear(world, props.furnace.x, props.furnace.y);
            clickTile(world, props.furnace.x, props.furnace.y);
            if (!window.Hud.stationOpen() || window.Hud.stationKind !== 'furnace') {
                throw new Error('furnace did not open smelt station');
            }
            window.Hud.hideStation();

            standNear(world, props.booth.x, props.booth.y);
            clickTile(world, props.booth.x, props.booth.y);
            if (!window.Hud.bankOpen()) {
                throw new Error('booth did not open bank');
            }
            window.Hud.hideBank();

            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            return {
                spawn: spawn,
                rangeOpen: true,
                anvilOpen: true,
                boothBank: true,
                keyboard: !!window.game.input.keyboard
            };
        });

        var only = encodeURIComponent('world: Emberhaven stall, range, anvil, and bank booth open station UIs');
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
    console.log('PASS 1/1 town props', result.suite, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
