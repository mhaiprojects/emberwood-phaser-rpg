/**
 * Playwright proof: from spawn (328, 248), Wield/Wear/Remove actually
 * equip sword and shield and refresh the Worn tab. Item damage/defence
 * stay unused. Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-worn.js [port]
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
            function stackQty(hero, id) {
                var stack = hero.inventory.filter(function (row) { return row.id === id; })[0];
                return stack ? stack.qty : 0;
            }
            function wornText() {
                return document.getElementById('equip-grid').innerText;
            }
            function openInvMenu(id) {
                var slot = document.querySelector('#inv-grid [data-item="' + id + '"]');
                if (!slot) {
                    throw new Error('missing inv ' + id);
                }
                slot.dispatchEvent(new MouseEvent('contextmenu', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    button: 2,
                    clientX: 40,
                    clientY: 80
                }));
                return document.getElementById('ctx-menu');
            }
            function clickCtx(action) {
                var btn = document.querySelector('#ctx-menu [data-ctx="' + action + '"]');
                if (!btn) {
                    throw new Error('missing ctx ' + action);
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
            if (typeof window.equipItem !== 'function' || typeof window.unequipItem !== 'function') {
                throw new Error('equipItem / unequipItem missing');
            }

            world.enterZone('haven', null);
            world.exitLock = false;
            world.encounterLock = false;
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);

            var hero = window.game.registry.get('hero');
            if (hero.equipment.weapon !== 'sword' || hero.equipment.shield !== 'shield') {
                throw new Error('starter is not wearing sword and shield');
            }
            if (stackQty(hero, 'sword') !== 1 || stackQty(hero, 'shield') !== 1) {
                throw new Error('starter kit missing inv sword/shield');
            }

            window.Hud.showTab('inv');
            var menu = openInvMenu('sword');
            if (menu.hidden || !menu.querySelector('[data-ctx="wield"]')) {
                throw new Error('sword menu missing Wield');
            }
            clickCtx('wield');
            hero = window.game.registry.get('hero');
            if (hero.equipment.weapon !== 'sword' || stackQty(hero, 'sword') !== 0) {
                throw new Error('wield did not take the inventory sword');
            }
            if (lastChat() !== 'You wield the Bronze sword.') {
                throw new Error('wield chat was ' + lastChat());
            }
            window.Hud.showTab('equip');
            if (wornText().indexOf('Bronze sword') === -1) {
                throw new Error('worn tab did not keep bronze sword');
            }

            var wornSword = document.querySelector('#equip-grid [data-equip-slot="weapon"]');
            if (!wornSword) {
                throw new Error('worn sword button missing');
            }
            wornSword.click();
            hero = window.game.registry.get('hero');
            if (hero.equipment.weapon !== null || stackQty(hero, 'sword') !== 1) {
                throw new Error('remove did not return the sword');
            }
            if (lastChat() !== 'You remove the Bronze sword.') {
                throw new Error('remove chat was ' + lastChat());
            }
            var worn = wornText();
            if (worn.indexOf('Bronze sword') !== -1 || worn.indexOf('None') === -1) {
                throw new Error('worn tab did not refresh after remove: ' + worn);
            }

            window.Hud.showTab('inv');
            menu = openInvMenu('shield');
            if (!menu.querySelector('[data-ctx="wear"]')) {
                throw new Error('shield menu missing Wear');
            }
            clickCtx('wear');
            hero = window.game.registry.get('hero');
            if (hero.equipment.shield !== 'shield' || stackQty(hero, 'shield') !== 0) {
                throw new Error('wear did not take the inventory shield');
            }
            window.Hud.showTab('equip');
            if (wornText().indexOf('Wooden shield') === -1) {
                throw new Error('worn tab did not keep wooden shield');
            }

            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            return {
                spawn: spawn,
                player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                keyboard: !!window.game.input.keyboard,
                phaser: window.Phaser.VERSION,
                weapon: hero.equipment.weapon,
                shield: hero.equipment.shield
            };
        });

        var dedicated = await runOnly(
            page,
            opened,
            'hud: wear/wield/remove sword and shield refresh worn tab'
        );
        return { live: live, dedicated: dedicated };
    });

    if (result.live.player.x !== 328 || result.live.player.y !== 248) {
        throw new Error('did not start at spawn: ' + result.live.player.x + ',' + result.live.player.y);
    }
    if (result.live.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    console.log('PASS 1/1 wear/wield/remove worn tab', result.dedicated, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
