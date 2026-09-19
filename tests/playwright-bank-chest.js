/**
 * Playwright proof: from spawn (328, 248), Banker Elise Bank
 * opens the HTML chest UI. Withdraw-X and Withdraw-all move stacks;
 * deposit/withdraw 1 still work. Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-bank-chest.js [port]
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
            function stackQty(list, id) {
                var row = (list || []).filter(function (stack) { return stack.id === id; })[0];
                return row ? row.qty : 0;
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

            var bank = document.getElementById('bank-overlay');
            var chest = document.getElementById('bank-chest');
            var qty = document.getElementById('bank-qty');
            if (!bank || bank !== window.Hud.el.bank) {
                throw new Error('missing #bank-overlay');
            }
            if (!chest || chest !== window.Hud.el.bankChest || !chest.hasAttribute('data-bank-chest')) {
                throw new Error('missing bank chest UI');
            }
            if (!chest.contains(document.getElementById('bank-vault-grid'))) {
                throw new Error('vault is not inside the chest');
            }
            if (!qty || qty !== window.Hud.el.bankQty) {
                throw new Error('missing #bank-qty');
            }
            if (bank.hidden) {
                /* starts hidden — good */
            } else {
                throw new Error('bank overlay started visible');
            }

            var elise = null;
            world.npcs.getChildren().forEach(function (npc) {
                if (npc.npcDef && npc.npcDef.key === 'banker') {
                    elise = npc;
                }
            });
            if (!elise || elise.npcDef.name !== 'Banker Elise') {
                throw new Error('Banker Elise missing');
            }
            if (Math.round(elise.x) !== 160 || Math.round(elise.y) !== 130) {
                throw new Error('Elise is at ' + elise.x + ',' + elise.y);
            }

            window.Hud.el.log.innerHTML = '';
            world.tryTalk(elise);
            clickOption('bank');
            if (!window.Hud.bankOpen() || bank.hidden) {
                throw new Error('Bank did not open #bank-overlay');
            }
            if (window.Hud.mode !== 'world') {
                throw new Error('bank froze Hud.mode to ' + window.Hud.mode);
            }

            bank.querySelector('#bank-inv-grid [data-bank-item="coins"]').click();
            bank.querySelector('[data-bank-action="deposit"]').click();
            bank.querySelector('[data-bank-action="deposit"]').click();
            bank.querySelector('[data-bank-action="deposit"]').click();
            bank.querySelector('[data-bank-action="deposit"]').click();
            bank.querySelector('[data-bank-action="deposit"]').click();
            var hero = window.game.registry.get('hero');
            if (hero.gold !== 3 || stackQty(hero.bank, 'coins') !== 5) {
                throw new Error('deposit did not bank 5 coins');
            }

            bank.querySelector('#bank-vault-grid [data-bank-item="coins"]').click();
            qty.value = '2';
            bank.querySelector('[data-bank-action="withdraw-x"]').click();
            hero = window.game.registry.get('hero');
            if (hero.gold !== 5 || stackQty(hero.inventory, 'coins') !== 5 || stackQty(hero.bank, 'coins') !== 3) {
                throw new Error('withdraw-X 2 did not move coins');
            }
            if (lastChat() !== 'You withdraw 2 x Coins.') {
                throw new Error('withdraw-X chat was ' + lastChat());
            }

            bank.querySelector('[data-bank-action="withdraw-all"]').click();
            hero = window.game.registry.get('hero');
            if (hero.gold !== 8 || stackQty(hero.bank, 'coins') !== 0) {
                throw new Error('withdraw-all did not return remaining coins');
            }
            if (lastChat() !== 'You withdraw 3 x Coins.') {
                throw new Error('withdraw-all chat was ' + lastChat());
            }

            document.getElementById('btn-bank-close').click();
            if (!bank.hidden) {
                throw new Error('Close did not hide bank');
            }
            if (document.getElementById('shop-overlay') && !document.getElementById('shop-overlay').hidden) {
                throw new Error('shop UI opened');
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
                keyboard: !!window.game.input.keyboard
            };
        });

        var only = encodeURIComponent('npcs: Banker Elise withdraw-X withdraw-all bank chest');
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
    console.log('PASS 1/1 bank chest withdraw-X/all', result.suite, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
