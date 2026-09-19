/**
 * Playwright proof: from spawn (328, 248), a hard 28-stack inventory
 * cap refuses loot / shop buy / gather with `inventory full`.
 * Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-inv-cap.js [port]
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
            if (window.INVENTORY_CAP !== 28 || typeof window.canAddItem !== 'function') {
                throw new Error('inventory cap helpers missing');
            }

            world.enterZone('haven', null);
            world.exitLock = false;
            world.encounterLock = false;
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            world.clearLoot();

            var hero = window.makeHero();
            window.game.registry.set('hero', hero);
            world.refreshHud();
            hero = window.game.registry.get('hero');
            var n = 0;
            while (hero.inventory.length < window.INVENTORY_CAP) {
                hero.inventory.push({ id: 'pad-' + n, qty: 1 });
                n += 1;
            }
            window.game.registry.set('hero', hero);
            world.refreshHud();
            if (hero.inventory.length !== 28) {
                throw new Error('fill stopped at ' + hero.inventory.length);
            }
            if (window.addItem(hero, 'bones', 1) !== false) {
                throw new Error('addItem bones should refuse at 28');
            }

            window.Hud.el.log.innerHTML = '';
            world.spawnLoot(spawn.x, spawn.y, [{ id: 'bones', qty: 1 }]);
            var drop = (world.groundLoot || []).filter(function (entry) {
                return entry && !entry.taken && entry.sprite;
            })[0];
            if (!drop) {
                throw new Error('bones pile missing');
            }
            if (world.tryPickup(drop) !== false || drop.taken) {
                throw new Error('loot pickup should refuse');
            }
            if (lastChat() !== 'inventory full') {
                throw new Error('loot chat was ' + lastChat());
            }

            world.collectNearbyLoot();
            if (drop.taken) {
                throw new Error('gather took the pile');
            }
            if (lastChat() !== 'inventory full') {
                throw new Error('gather chat was ' + lastChat());
            }

            var gold = window.game.registry.get('hero').gold;
            window.Hud.showShop({ key: 'shopkeep', name: 'Shopkeeper Mira' });
            document.querySelector('[data-shop-action="buy"]').click();
            if (lastChat() !== 'inventory full') {
                throw new Error('shop buy chat was ' + lastChat());
            }
            if (window.game.registry.get('hero').gold !== gold) {
                throw new Error('shop buy changed gold');
            }
            document.getElementById('btn-shop-close').click();

            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            world.clearLoot();
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            return {
                spawn: spawn,
                player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                stacks: window.game.registry.get('hero').inventory.length,
                keyboard: !!window.game.input.keyboard,
                phaser: window.Phaser.VERSION
            };
        });

        var dedicated = await runOnly(
            page,
            opened,
            'inv: 28-stack cap refuses loot shop buy and gather with inventory full'
        );
        return { live: live, dedicated: dedicated };
    });

    if (result.live.player.x !== 328 || result.live.player.y !== 248) {
        throw new Error('did not start at spawn: ' + result.live.player.x + ',' + result.live.player.y);
    }
    if (result.live.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    if (result.live.stacks !== 28) {
        throw new Error('live fill was ' + result.live.stacks + ' not 28');
    }
    console.log('PASS 1/1 inventory 28-stack cap', result.dedicated, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
