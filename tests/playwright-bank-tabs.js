/**
 * Playwright proof: from spawn (328, 248), Banker Elise Bank
 * chest has search plus All / Food tabs. Search filters the vault;
 * Food hides coins. Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-bank-tabs.js [port]
 */
(async function () {
    var port = process.argv[2] || '8765';
    var session = require('./playwright-session');
    var result = await session.withGamePage(port, async function (page, opened) {
        var live = await page.evaluate(function () {
            function stackQty(list, id) {
                var row = (list || []).filter(function (stack) { return stack.id === id; })[0];
                return row ? row.qty : 0;
            }
            function vaultIds() {
                var nodes = document.querySelectorAll('#bank-vault-grid [data-bank-item]');
                var ids = [];
                var i;
                for (i = 0; i < nodes.length; i++) {
                    ids.push(nodes[i].getAttribute('data-bank-item'));
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

            var bank = document.getElementById('bank-overlay');
            var chest = document.getElementById('bank-chest');
            var search = document.getElementById('bank-search');
            var tabs = document.getElementById('bank-tabs');
            if (!bank || bank !== window.Hud.el.bank) {
                throw new Error('missing #bank-overlay');
            }
            if (!chest || chest !== window.Hud.el.bankChest) {
                throw new Error('missing bank chest UI');
            }
            if (!search || search !== window.Hud.el.bankSearch || search.tagName !== 'INPUT') {
                throw new Error('missing #bank-search');
            }
            if (!tabs || tabs !== window.Hud.el.bankTabs) {
                throw new Error('missing #bank-tabs');
            }
            if (tabs.querySelectorAll('[data-bank-tab]').length < 2) {
                throw new Error('need at least two bank tabs');
            }
            if (!chest.contains(search) || !chest.contains(tabs)) {
                throw new Error('search/tabs are not inside the chest');
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

            window.Hud.el.log.innerHTML = '';
            world.tryTalk(elise);
            clickOption('bank');
            if (!window.Hud.bankOpen() || bank.hidden) {
                throw new Error('Bank did not open #bank-overlay');
            }
            if (window.Hud.mode !== 'world') {
                throw new Error('bank froze Hud.mode to ' + window.Hud.mode);
            }
            if (window.Hud.bankTab !== 'all') {
                throw new Error('bank did not open on All');
            }

            bank.querySelector('#bank-inv-grid [data-bank-item="coins"]').click();
            bank.querySelector('[data-bank-action="deposit"]').click();
            bank.querySelector('#bank-inv-grid [data-bank-item="shrimp"]').click();
            bank.querySelector('[data-bank-action="deposit"]').click();
            bank.querySelector('#bank-inv-grid [data-bank-item="bread"]').click();
            bank.querySelector('[data-bank-action="deposit"]').click();
            var hero = window.game.registry.get('hero');
            if (stackQty(hero.bank, 'coins') !== 1 || stackQty(hero.bank, 'shrimp') !== 1 ||
                    stackQty(hero.bank, 'bread') !== 1) {
                throw new Error('deposit did not bank coins/shrimp/bread');
            }
            if (vaultIds() !== 'coins,shrimp,bread') {
                throw new Error('All tab vault was ' + vaultIds());
            }

            tabs.querySelector('[data-bank-tab="food"]').click();
            if (window.Hud.bankTab !== 'food' || vaultIds() !== 'shrimp,bread') {
                throw new Error('Food tab vault was ' + vaultIds());
            }

            search.value = 'shr';
            search.dispatchEvent(new Event('input', { bubbles: true }));
            if (vaultIds() !== 'shrimp') {
                throw new Error('search shr vault was ' + vaultIds());
            }

            search.value = '';
            search.dispatchEvent(new Event('input', { bubbles: true }));
            tabs.querySelector('[data-bank-tab="all"]').click();
            if (vaultIds() !== 'coins,shrimp,bread') {
                throw new Error('All after clear was ' + vaultIds());
            }

            document.getElementById('btn-bank-close').click();
            if (!bank.hidden) {
                throw new Error('Close did not hide bank');
            }
            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            return {
                spawn: spawn,
                player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                vault: 'coins,shrimp,bread',
                keyboard: !!window.game.input.keyboard
            };
        });

        var only = encodeURIComponent('npcs: Banker Elise bank search and All Food tabs');
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
    console.log('PASS 1/1 bank search All/Food tabs', result.suite, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
