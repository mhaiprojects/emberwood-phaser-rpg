/**
 * Playwright proof: from spawn (328, 248), each ITEM_DB entry has examine
 * text. Inventory and ground right-click Examine log that flavor. Left-click
 * still names / picks up. Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-examine-item.js [port]
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
            function lastChat() {
                var lines = document.querySelectorAll('.chat-line');
                return lines.length ? lines[lines.length - 1].textContent : '';
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
            if (typeof window.itemExamineText !== 'function') {
                throw new Error('itemExamineText helper missing');
            }

            var bonesLine = window.itemExamineText('bones');
            var ids = Object.keys(window.ITEM_DB);
            if (ids.length !== 8) {
                throw new Error('ITEM_DB count is ' + ids.length + ' not 8');
            }
            var seen = {};
            ids.forEach(function (id) {
                var line = window.itemExamineText(id);
                if (!line || line.indexOf('.') === -1) {
                    throw new Error(id + ' missing examine sentence');
                }
                if (seen[line]) {
                    throw new Error(id + ' examine duplicates ' + seen[line]);
                }
                seen[line] = id;
            });
            if (bonesLine !== 'Dry bones. Someone should bury them.') {
                throw new Error('bones examine was ' + bonesLine);
            }

            world.enterZone('haven', null);
            world.exitLock = false;
            world.encounterLock = false;
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            if (world.clearLoot) {
                world.clearLoot();
            }

            var hero = window.makeHero();
            window.addItem(hero, 'bones', 1);
            window.game.registry.set('hero', hero);
            world.refreshHud();

            window.Hud.showTab('inv');
            window.Hud.el.log.innerHTML = '';
            document.querySelector('#inv-grid [data-item="shrimp"]').click();
            if (lastChat().indexOf('already at full health') === -1) {
                throw new Error('left-click shrimp was ' + lastChat());
            }
            if (lastChat() === window.itemExamineText('shrimp')) {
                throw new Error('left-click logged examine flavor');
            }

            var slot = document.querySelector('#inv-grid [data-item="bones"]');
            slot.dispatchEvent(new MouseEvent('contextmenu', {
                bubbles: true,
                cancelable: true,
                view: window,
                button: 2,
                clientX: 40,
                clientY: 80
            }));
            var examBtn = document.querySelector('#ctx-menu [data-ctx="examine"]');
            if (!examBtn) {
                throw new Error('inventory menu missing Examine');
            }
            examBtn.click();
            if (lastChat() !== bonesLine) {
                throw new Error('inventory Examine was ' + lastChat());
            }

            var dropped = world.dropFromInventory('bones', 1);
            if (!dropped || !dropped.sprite) {
                throw new Error('dropFromInventory did not place bones');
            }
            window.Hud.el.log.innerHTML = '';
            window.Hud.hideContextMenu();
            world.onClick({
                worldX: dropped.sprite.x,
                worldY: dropped.sprite.y,
                button: 2,
                rightButtonDown: function () { return true; },
                event: { clientX: 48, clientY: 56 }
            });
            examBtn = document.querySelector('#ctx-menu [data-ctx="examine"]');
            if (!examBtn) {
                throw new Error('ground menu missing Examine');
            }
            if (document.querySelector('#ctx-menu [data-ctx="take"]')) {
                throw new Error('ground Take is not this tick');
            }
            examBtn.click();
            if (lastChat() !== bonesLine) {
                throw new Error('ground Examine was ' + lastChat());
            }
            if (dropped.taken) {
                throw new Error('Examine picked up bones');
            }

            if (!world.tryPickup(dropped)) {
                throw new Error('left-click no longer picks up');
            }
            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            return {
                spawn: spawn,
                player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                keyboard: !!window.game.input.keyboard,
                phaser: window.Phaser.VERSION,
                last: lastChat(),
                bones: bonesLine
            };
        });

        var dedicated = await runOnly(
            page,
            opened,
            'hud: inventory and ground Examine logs ITEM_DB flavor'
        );
        return { live: live, dedicated: dedicated };
    });

    if (result.live.player.x !== 328 || result.live.player.y !== 248) {
        throw new Error('did not start at spawn: ' + result.live.player.x + ',' + result.live.player.y);
    }
    if (result.live.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    console.log('PASS 1/1 item examine', result.dedicated, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
