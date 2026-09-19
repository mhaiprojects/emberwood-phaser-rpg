/**
 * Playwright proof: from spawn (328, 248), Settings shift-click drop
 * (OSRS default on) drops inventory to groundLoot. Toggle off leaves
 * shift-click as a normal use. Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-shift-drop.js [port]
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
            function shiftClick(selector) {
                var el = document.querySelector(selector);
                if (!el) {
                    throw new Error('Missing ' + selector);
                }
                el.dispatchEvent(new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    button: 0,
                    shiftKey: true
                }));
                return el;
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
            if (typeof window.shiftClickDropOn !== 'function') {
                throw new Error('shiftClickDropOn helper missing');
            }

            world.enterZone('haven', null);
            world.exitLock = false;
            world.encounterLock = false;
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            world.clearLoot();

            var hero = window.makeHero();
            if (hero.shiftClickDrop !== true) {
                throw new Error('makeHero shiftClickDrop is ' + hero.shiftClickDrop + ' not true');
            }
            hero.autoPickup = true;
            window.addItem(hero, 'bones', 1);
            window.game.registry.set('hero', hero);
            world.refreshHud();

            window.Hud.showTab('settings');
            var toggle = document.querySelector('#panel-settings [data-shift-click-drop]');
            if (!toggle) {
                throw new Error('Settings shift-click drop toggle missing');
            }
            if (toggle.textContent.indexOf('On') < 0) {
                throw new Error('toggle label is ' + toggle.textContent + ' not On');
            }

            window.Hud.showTab('inv');
            window.Hud.el.log.innerHTML = '';
            var droppedAt = world.time.now;
            shiftClick('#inv-grid [data-item="bones"]');
            var liveLoot = (world.groundLoot || []).filter(function (drop) {
                return drop && !drop.taken && drop.sprite;
            });
            if (lastChat() !== 'You drop Bones.') {
                throw new Error('shift-click chat was ' + lastChat());
            }
            if (liveLoot.length !== 1 || liveLoot[0].id !== 'bones') {
                throw new Error('shift-click did not drop bones');
            }
            if (!liveLoot[0].skipAuto) {
                throw new Error('dropped pile should skip auto-pickup');
            }
            if (Math.round(liveLoot[0].sprite.x) !== 328 || Math.round(liveLoot[0].sprite.y) !== 248) {
                throw new Error('pile at ' + liveLoot[0].sprite.x + ',' + liveLoot[0].sprite.y + ' not the player');
            }
            if (liveLoot[0].until !== droppedAt + 20000) {
                throw new Error('until was ' + liveLoot[0].until + ' not ' + (droppedAt + 20000));
            }
            hero = window.game.registry.get('hero');
            if (hero.inventory.filter(function (row) { return row.id === 'bones'; }).length) {
                throw new Error('bones stayed in inventory');
            }

            world.collectNearbyLoot();
            if (liveLoot[0].taken || !liveLoot[0].sprite) {
                throw new Error('auto-pickup vacuumed the dropped pile');
            }

            window.Hud.showTab('settings');
            toggle.click();
            hero = window.game.registry.get('hero');
            if (hero.shiftClickDrop !== false) {
                throw new Error('settings click did not turn shift-click drop off');
            }

            window.addItem(hero, 'bones', 1);
            window.game.registry.set('hero', hero);
            world.refreshHud();
            window.Hud.showTab('inv');
            shiftClick('#inv-grid [data-item="bones"]');
            hero = window.game.registry.get('hero');
            if (!hero.inventory.filter(function (row) { return row.id === 'bones'; }).length) {
                throw new Error('toggle-off shift-click dropped bones');
            }
            liveLoot = (world.groundLoot || []).filter(function (drop) {
                return drop && !drop.taken && drop.sprite && drop.id === 'bones';
            });
            if (liveLoot.length !== 1) {
                throw new Error('toggle-off shift-click spawned extra loot');
            }

            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            world.clearLoot();
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            return {
                spawn: spawn,
                player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                keyboard: !!window.game.input.keyboard,
                phaser: window.Phaser.VERSION,
                shiftClickDrop: hero.shiftClickDrop
            };
        });

        var dedicated = await runOnly(
            page,
            opened,
            'inv: shift-click drop follows Settings toggle'
        );
        return { live: live, dedicated: dedicated };
    });

    if (result.live.player.x !== 328 || result.live.player.y !== 248) {
        throw new Error('did not start at spawn: ' + result.live.player.x + ',' + result.live.player.y);
    }
    if (result.live.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    console.log('PASS 1/1 inventory shift-click drop', result.dedicated, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
