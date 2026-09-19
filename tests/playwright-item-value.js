/**
 * Playwright proof: from spawn (328, 248), each ITEM_DB entry has a value
 * field for shops and a later High Alch. Shop Buy/Sell stay stubbed. High
 * Alch is not this tick. Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-item-value.js [port]
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
            if (typeof window.itemValue !== 'function') {
                throw new Error('itemValue helper missing');
            }
            if (typeof window.highAlch === 'function' || typeof window.castHighAlch === 'function') {
                throw new Error('High Alch started this tick');
            }

            var expected = {
                coins: 1,
                shrimp: 5,
                rawshrimp: 5,
                bread: 12,
                sword: 26,
                shield: 20,
                bones: 1,
                key: 1
            };
            var ids = Object.keys(window.ITEM_DB);
            if (ids.length !== 8) {
                throw new Error('ITEM_DB count is ' + ids.length + ' not 8');
            }
            if (window.ITEM_DB.logs || window.ITEM_DB.ore || window.ITEM_DB.net) {
                throw new Error('gathering section items started this tick');
            }
            ids.forEach(function (id) {
                var def = window.ITEM_DB[id];
                if (def.value !== expected[id]) {
                    throw new Error(id + ' value is ' + def.value + ' not ' + expected[id]);
                }
                if (window.itemValue(id) !== expected[id]) {
                    throw new Error(id + ' itemValue is ' + window.itemValue(id));
                }
                if (def.buyPrice != null || def.sellPrice != null) {
                    throw new Error(id + ' buy/sell prices started this tick');
                }
            });

            world.enterZone('haven', null);
            world.exitLock = false;
            world.encounterLock = false;
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            if (world.clearLoot) {
                world.clearLoot();
            }

            var hero = window.makeHero();
            window.game.registry.set('hero', hero);
            world.refreshHud();

            var mira = null;
            world.npcs.getChildren().forEach(function (npc) {
                if (npc.npcDef && npc.npcDef.key === 'shopkeep') {
                    mira = npc;
                }
            });
            if (!mira) {
                throw new Error('Shopkeeper Mira missing');
            }
            window.Hud.el.log.innerHTML = '';
            window.Hud.showShop(mira.npcDef);
            if (!window.Hud.shopOpen()) {
                throw new Error('shop did not open');
            }
            document.querySelector('#shop-overlay [data-shop-action="buy"]').click();
            if (lastChat() !== 'The shelves are still being stocked.') {
                throw new Error('Buy was ' + lastChat());
            }
            hero = window.game.registry.get('hero');
            if (hero.gold !== 8) {
                throw new Error('Buy stub changed gold to ' + hero.gold);
            }
            document.querySelector('#shop-overlay [data-shop-action="sell"]').click();
            if (lastChat() !== 'The shelves are still being stocked.') {
                throw new Error('Sell was ' + lastChat());
            }
            hero = window.game.registry.get('hero');
            if (hero.gold !== 8) {
                throw new Error('Sell stub changed gold to ' + hero.gold);
            }
            document.getElementById('btn-shop-close').click();
            if (window.Hud.shopOpen()) {
                throw new Error('shop stayed open');
            }

            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            return {
                spawn: spawn,
                player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                gold: hero.gold,
                shrimp: window.itemValue('shrimp'),
                sword: window.itemValue('sword'),
                keyboard: !!window.game.input.keyboard,
                phaser: window.Phaser.VERSION
            };
        });

        var dedicated = await runOnly(
            page,
            opened,
            'hud: ITEM_DB value fields for shops and later High Alch'
        );
        return { live: live, dedicated: dedicated };
    });

    if (result.live.player.x !== 328 || result.live.player.y !== 248) {
        throw new Error('did not start at spawn: ' + result.live.player.x + ',' + result.live.player.y);
    }
    if (result.live.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    console.log('PASS 1/1 item value fields', result.dedicated, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
