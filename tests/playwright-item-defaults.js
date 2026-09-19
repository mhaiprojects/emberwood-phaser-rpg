/**
 * Playwright proof: from spawn (328, 248), inventory left-click eats food,
 * wields/wears gear, buries bones, and drops junk. Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-item-defaults.js [port]
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
            if (typeof window.itemDefaultVerb !== 'function' || typeof window.buryItem !== 'function') {
                throw new Error('itemDefaultVerb / buryItem missing');
            }
            if (window.itemDefaultVerb('shrimp') !== 'eat' || window.itemDefaultVerb('sword') !== 'wield' ||
                window.itemDefaultVerb('shield') !== 'wear' || window.itemDefaultVerb('bones') !== 'bury' ||
                window.itemDefaultVerb('coins') !== 'drop') {
                throw new Error('itemDefaultVerb map is wrong');
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
            window.addItem(hero, 'bones', 2);
            window.addItem(hero, 'key', 1);
            window.game.registry.set('hero', hero);
            world.refreshHud();

            window.Hud.showTab('inv');
            window.Hud.el.log.innerHTML = '';
            document.querySelector('#inv-grid [data-item="shrimp"]').click();
            if (lastChat().indexOf('already at full health') === -1) {
                throw new Error('full-HP shrimp was ' + lastChat());
            }

            hero = window.game.registry.get('hero');
            hero.hp = 70;
            window.game.registry.set('hero', hero);
            world.refreshHud();
            document.querySelector('#inv-grid [data-item="shrimp"]').click();
            hero = window.game.registry.get('hero');
            if (hero.hp !== 82) {
                throw new Error('shrimp heal was ' + hero.hp + ' not 82');
            }
            if (lastChat() !== 'You eat Cooked shrimp and recover 12 HP.') {
                throw new Error('eat chat was ' + lastChat());
            }

            document.querySelector('#inv-grid [data-item="sword"]').click();
            hero = window.game.registry.get('hero');
            if (hero.equipment.weapon !== 'sword' || stackQty(hero, 'sword') !== 0) {
                throw new Error('left-click did not wield the inventory sword');
            }
            if (lastChat() !== 'You wield the Bronze sword.') {
                throw new Error('wield chat was ' + lastChat());
            }

            document.querySelector('#inv-grid [data-item="shield"]').click();
            hero = window.game.registry.get('hero');
            if (hero.equipment.shield !== 'shield' || stackQty(hero, 'shield') !== 0) {
                throw new Error('left-click did not wear the inventory shield');
            }
            if (lastChat() !== 'You wear the Wooden shield.') {
                throw new Error('wear chat was ' + lastChat());
            }

            document.querySelector('#inv-grid [data-item="bones"]').click();
            hero = window.game.registry.get('hero');
            if (stackQty(hero, 'bones') !== 1) {
                throw new Error('bury qty is ' + stackQty(hero, 'bones') + ' not 1');
            }
            if (lastChat() !== 'You bury the bones.') {
                throw new Error('bury chat was ' + lastChat());
            }
            if (hero.skills.prayer.xp !== 4) {
                throw new Error('bury Prayer XP is ' + hero.skills.prayer.xp + ' not 4');
            }

            document.querySelector('#inv-grid [data-item="coins"]').click();
            hero = window.game.registry.get('hero');
            if (hero.gold !== 7) {
                throw new Error('coin drop gold is ' + hero.gold + ' not 7');
            }
            if (lastChat() !== 'You drop Coins.') {
                throw new Error('coin drop chat was ' + lastChat());
            }

            document.querySelector('#inv-grid [data-item="key"]').click();
            if (lastChat() !== 'You drop Iron key.') {
                throw new Error('key drop chat was ' + lastChat());
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
                last: lastChat()
            };
        });

        var dedicated = await runOnly(
            page,
            opened,
            'hud: left-click eats food, wields gear, buries bones, drops junk'
        );
        return { live: live, dedicated: dedicated };
    });

    if (result.live.player.x !== 328 || result.live.player.y !== 248) {
        throw new Error('did not start at spawn: ' + result.live.player.x + ',' + result.live.player.y);
    }
    if (result.live.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    console.log('PASS 1/1 inventory left-click defaults', result.dedicated, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
