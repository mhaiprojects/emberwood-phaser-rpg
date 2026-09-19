/**
 * Playwright proof: from spawn (328, 248), click/right-click scenery
 * (tree, rock, shrine, water, house wall) logs an examine chat line.
 * Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-examine.js [port]
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

            clickTile(world, 0, 2);
            if (lastChat() !== "It's a tree.") {
                throw new Error('tree examine was ' + lastChat());
            }
            clickTile(world, 18, 8);
            if (lastChat() !== 'A weathered stone shrine.') {
                throw new Error('shrine examine was ' + lastChat());
            }
            clickTile(world, 10, 10);
            if (lastChat() !== "It's a house wall.") {
                throw new Error('house wall examine was ' + lastChat());
            }
            clickTile(world, 23, 13);
            if (lastChat() !== "It's a rock.") {
                throw new Error('rock examine was ' + lastChat());
            }

            world.enterZone('southshore', null);
            world.encounterLock = false;
            var water = null;
            var y;
            var x;
            for (y = 0; y < world.tileGrid.length && !water; y++) {
                for (x = 0; x < world.tileGrid[y].length; x++) {
                    if (world.tileGrid[y][x] === window.TILE.WATER) {
                        water = { tx: x, ty: y };
                        break;
                    }
                }
            }
            if (!water) {
                throw new Error('Southshore missing WATER');
            }
            clickTile(world, water.tx, water.ty);
            if (lastChat() !== "It's water.") {
                throw new Error('water examine was ' + lastChat());
            }

            var pt = window.tileCenter(0, 2);
            world.enterZone('haven', null);
            world.encounterLock = false;
            world.placePlayer(spawn.x, spawn.y);
            if (world.clearWalk) {
                world.clearWalk();
            }
            window.Hud.hideContextMenu();
            world.onClick({
                worldX: pt.x,
                worldY: pt.y,
                button: 2,
                rightButtonDown: function () { return true; },
                event: { clientX: 48, clientY: 56 }
            });
            var examBtn = document.querySelector('#ctx-menu [data-ctx="examine"]');
            if (!examBtn) {
                throw new Error('right-click tree missing Examine');
            }
            examBtn.click();
            if (lastChat() !== "It's a tree.") {
                throw new Error('Examine menu was ' + lastChat());
            }
            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            return {
                spawn: spawn,
                last: lastChat(),
                keyboard: !!window.game.input.keyboard
            };
        });

        var only = encodeURIComponent('world: examine on scenery tree, rock, shrine, water, house wall');
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
    console.log('PASS 1/1 examine scenery', result.suite, result.live && result.live.last);
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
