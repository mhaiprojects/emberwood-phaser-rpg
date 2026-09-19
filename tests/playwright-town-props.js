/**
 * Playwright proof: from spawn (328, 248), Emberhaven stall / range /
 * anvil / bank booth are examine-only scenery (no shop or bank UI).
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

            var props = window.TOWN_PROPS;
            var want = {
                stall: 'A market stall. The grocer is away.',
                range: 'A cooking range. The fire is out.',
                anvil: 'A well-used smithing anvil.',
                booth: 'A bank booth. The clerk is away.'
            };
            var keys = ['stall', 'range', 'anvil', 'booth'];
            var i;
            for (i = 0; i < keys.length; i++) {
                var key = keys[i];
                var at = props[key];
                clickTile(world, at.x, at.y);
                if (lastChat() !== want[key]) {
                    throw new Error(key + ' examine was ' + lastChat());
                }
                if (world.walkTarget) {
                    throw new Error(key + ' examine started a walk');
                }
            }

            world.enterInterior('bank');
            var boothTx = window.INTERIOR_ROOM.x + 3;
            var boothTy = window.INTERIOR_ROOM.y + 4;
            if (world.tileGrid[boothTy][boothTx] !== window.TILE.BOOTH) {
                throw new Error('bank interior missing booth');
            }
            clickTile(world, boothTx, boothTy);
            if (lastChat() !== want.booth) {
                throw new Error('interior booth examine was ' + lastChat());
            }
            var shop = document.getElementById('shop-overlay');
            var bank = document.getElementById('bank-overlay');
            if (shop && !shop.hidden) {
                throw new Error('shop overlay opened');
            }
            if (bank && !bank.hidden) {
                throw new Error('bank overlay opened');
            }
            world.leaveInterior();
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

        var only = encodeURIComponent('world: Emberhaven stall, range, anvil, and bank booth are examine-only scenery');
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
    console.log('PASS 1/1 town props', result.suite, result.live && result.live.last);
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
