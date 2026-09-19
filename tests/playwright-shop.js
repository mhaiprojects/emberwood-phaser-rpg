/**
 * Playwright proof: from spawn (328, 248), Shopkeeper Mira Trade
 * opens HTML #shop-overlay. Buy/sell stay stubbed. Elise is not a booth.
 * Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-shop.js [port]
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
            function optionIds() {
                var btns = document.querySelectorAll('[data-dialogue-option]');
                var ids = [];
                for (var i = 0; i < btns.length; i++) {
                    ids.push(btns[i].getAttribute('data-dialogue-option'));
                }
                return ids.join(',');
            }
            function clickOption(id) {
                var btn = document.querySelector('[data-dialogue-option="' + id + '"]');
                if (!btn) {
                    throw new Error('missing option button ' + id);
                }
                btn.click();
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

            var shop = document.getElementById('shop-overlay');
            if (!shop || shop !== window.Hud.el.shop) {
                throw new Error('missing #shop-overlay');
            }
            if (!shop.hidden) {
                throw new Error('shop overlay started visible');
            }

            var mira = null;
            var elise = null;
            world.npcs.getChildren().forEach(function (npc) {
                if (!npc.npcDef) {
                    return;
                }
                if (npc.npcDef.key === 'shopkeep') {
                    mira = npc;
                }
                if (npc.npcDef.key === 'banker') {
                    elise = npc;
                }
            });
            if (!mira) {
                throw new Error('Shopkeeper Mira missing');
            }
            if (Math.round(mira.x) !== 376 || Math.round(mira.y) !== 216) {
                throw new Error('Mira is at ' + mira.x + ',' + mira.y);
            }
            if (!elise || elise.npcDef.name !== 'Banker Elise') {
                throw new Error('Elise must stay the banker this tick');
            }

            window.Hud.el.log.innerHTML = '';
            world.tryTalk(mira);
            if (optionIds() !== 'talk,trade') {
                throw new Error('Mira options were ' + optionIds());
            }
            clickOption('trade');
            if (window.Hud.dialogueOpen()) {
                throw new Error('Trade did not close dialogue');
            }
            if (!window.Hud.shopOpen() || shop.hidden) {
                throw new Error('Trade did not open #shop-overlay');
            }
            if (window.Hud.mode !== 'world') {
                throw new Error('shop froze Hud.mode to ' + window.Hud.mode);
            }
            var gold = window.game.registry.get('hero').gold;
            document.querySelector('[data-shop-action="buy"]').click();
            if (lastChat() !== 'The shelves are still being stocked.') {
                throw new Error('Buy stub was ' + lastChat());
            }
            if (window.game.registry.get('hero').gold !== gold) {
                throw new Error('Buy stub changed gold');
            }
            document.getElementById('btn-shop-close').click();
            if (!shop.hidden) {
                throw new Error('Close did not hide shop');
            }
            if (document.getElementById('bank-overlay') && !document.getElementById('bank-overlay').hidden) {
                throw new Error('bank UI opened');
            }
            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            return {
                spawn: spawn,
                player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                mira: 'talk,trade',
                shop: 'closed',
                keyboard: !!window.game.input.keyboard
            };
        });

        var only = encodeURIComponent('npcs: Shopkeeper Mira Trade window opens shop-overlay');
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
    console.log('PASS 1/1 shopkeeper trade', result.suite, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
