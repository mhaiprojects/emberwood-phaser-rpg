/**
 * Playwright proof: from spawn (328, 248), Banker Elise Bank
 * opens HTML #bank-overlay. Deposit/withdraw move coins; Heal is free.
 * Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-bank.js [port]
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
            if (!bank || bank !== window.Hud.el.bank) {
                throw new Error('missing #bank-overlay');
            }
            if (!bank.hidden) {
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

            var hero = window.game.registry.get('hero');
            hero.hp = 40;
            window.game.registry.set('hero', hero);
            world.refreshHud();
            window.Hud.el.log.innerHTML = '';
            world.tryTalk(elise);
            if (window.game.registry.get('hero').hp !== 40) {
                throw new Error('tryTalk auto-healed');
            }
            clickOption('bank');
            if (window.Hud.dialogueOpen()) {
                throw new Error('Bank did not close dialogue');
            }
            if (!window.Hud.bankOpen() || bank.hidden) {
                throw new Error('Bank did not open #bank-overlay');
            }
            if (window.Hud.mode !== 'world') {
                throw new Error('bank froze Hud.mode to ' + window.Hud.mode);
            }

            bank.querySelector('#bank-inv-grid [data-bank-item="coins"]').click();
            bank.querySelector('[data-bank-action="deposit"]').click();
            hero = window.game.registry.get('hero');
            if (hero.gold !== 7 || stackQty(hero.inventory, 'coins') !== 7 || stackQty(hero.bank, 'coins') !== 1) {
                throw new Error('deposit did not move 1 coin');
            }
            if (lastChat() !== 'You deposit 1 x Coins.') {
                throw new Error('deposit chat was ' + lastChat());
            }
            bank.querySelector('[data-bank-action="withdraw"]').click();
            hero = window.game.registry.get('hero');
            if (hero.gold !== 8 || stackQty(hero.inventory, 'coins') !== 8 || stackQty(hero.bank, 'coins') !== 0) {
                throw new Error('withdraw did not return the coin');
            }

            bank.querySelector('[data-bank-action="heal"]').click();
            hero = window.game.registry.get('hero');
            if (hero.hp !== hero.maxHp || hero.gold !== 8) {
                throw new Error('Heal option did not restore HP for free');
            }
            if (lastChat() !== 'Banker Elise: Your wounds close. HP restored.') {
                throw new Error('heal line was ' + lastChat());
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
                hp: hero.hp,
                keyboard: !!window.game.input.keyboard
            };
        });

        var only = encodeURIComponent('npcs: Banker Elise bank overlay deposit withdraw');
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
    console.log('PASS 1/1 banker booth', result.suite, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
