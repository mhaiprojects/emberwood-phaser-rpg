/**
 * Playwright proof: from spawn (328, 248), courtyard gate and
 * bank/shop/guild doors keep PATH walk-through; Examine is flavor only.
 * Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-examine-door.js [port]
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
            function park(group) {
                group.getChildren().forEach(function (obj) {
                    if (obj.body) {
                        obj.body.enable = false;
                        obj.body.setVelocity(0, 0);
                    }
                    obj.setPosition(24, 24);
                });
            }
            park(world.npcs);
            park(world.mobs);
            var hero = window.game.registry.get('hero');
            hero.autoAttack = false;
            window.game.registry.set('hero', hero);
            if (world.clearWalk) {
                world.clearWalk();
            }

            var gate = window.HAVEN_GATE_TILE;
            if (world.tileGrid[gate.y][gate.x] !== window.TILE.PATH) {
                throw new Error('courtyard gate is not PATH');
            }
            var before = lastChat();
            var gatePt = clickTile(world, gate.x, gate.y);
            if (!world.walkTarget) {
                throw new Error('left-click gate did not walk');
            }
            if (lastChat() !== before) {
                throw new Error('left-click gate examined: ' + lastChat());
            }
            if (world.clearWalk) {
                world.clearWalk();
            }
            world.examineAt(gatePt.x, gatePt.y);
            if (lastChat() !== 'A wooden courtyard gate. The hinges still work.') {
                throw new Error('gate examine was ' + lastChat());
            }

            var doors = [
                { id: 'bank', tx: 11, ty: 10, line: 'The bank door. Elise keeps the ledgers inside.' },
                { id: 'shop', tx: 25, ty: 11, line: 'The shop door. A faded sign hangs above it.' },
                { id: 'guild', tx: 15, ty: 20, line: 'The guild hall door. Bram drills the militia inside.' }
            ];
            var i;
            for (i = 0; i < doors.length; i++) {
                var spec = doors[i];
                if (world.tileGrid[spec.ty][spec.tx] !== window.TILE.PATH) {
                    throw new Error(spec.id + ' door is not PATH');
                }
                if (world.clearWalk) {
                    world.clearWalk();
                }
                before = lastChat();
                var doorPt = clickTile(world, spec.tx, spec.ty);
                if (!world.walkTarget) {
                    throw new Error('left-click ' + spec.id + ' door did not walk');
                }
                if (lastChat() !== before) {
                    throw new Error('left-click ' + spec.id + ' door examined: ' + lastChat());
                }
                if (world.clearWalk) {
                    world.clearWalk();
                }
                world.examineAt(doorPt.x, doorPt.y);
                if (lastChat() !== spec.line) {
                    throw new Error(spec.id + ' examine was ' + lastChat());
                }
            }

            if (world.clearWalk) {
                world.clearWalk();
            }
            window.Hud.hideContextMenu();
            world.onClick({
                worldX: gatePt.x,
                worldY: gatePt.y,
                button: 2,
                rightButtonDown: function () { return true; },
                event: { clientX: 48, clientY: 56 }
            });
            var examBtn = document.querySelector('#ctx-menu [data-ctx="examine"]');
            if (!examBtn) {
                throw new Error('right-click gate missing Examine');
            }
            examBtn.click();
            if (lastChat() !== 'A wooden courtyard gate. The hinges still work.') {
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

        var only = encodeURIComponent('world: examine courtyard gate and house doors without changing walk-through');
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
    console.log('PASS 1/1 examine door', result.suite, result.live && result.live.last);
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
