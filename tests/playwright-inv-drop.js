/**
 * Playwright proof: from spawn (328, 248), inventory Drop creates
 * groundLoot at the player. Auto-pickup does not vacuum it.
 * Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-inv-drop.js [port]
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
            if (typeof world.dropFromInventory !== 'function' || typeof window.Hud.dropItem !== 'function') {
                throw new Error('drop helpers missing');
            }

            world.enterZone('haven', null);
            world.exitLock = false;
            world.encounterLock = false;
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            world.clearLoot();

            var hero = window.makeHero();
            hero.autoPickup = true;
            window.addItem(hero, 'bones', 1);
            window.game.registry.set('hero', hero);
            world.refreshHud();

            window.Hud.el.log.innerHTML = '';
            var droppedAt = world.time.now;
            var entry = world.dropFromInventory('bones', 1);
            if (!entry || !entry.sprite) {
                throw new Error('dropFromInventory did not place loot');
            }
            if (entry.id !== 'bones' || entry.qty !== 1) {
                throw new Error('dropped pile is ' + entry.id + ' x' + entry.qty);
            }
            if (!entry.skipAuto) {
                throw new Error('dropped pile should skip auto-pickup');
            }
            if (Math.round(entry.sprite.x) !== 328 || Math.round(entry.sprite.y) !== 248) {
                throw new Error('pile at ' + entry.sprite.x + ',' + entry.sprite.y + ' not the player');
            }
            if (entry.until !== droppedAt + 20000) {
                throw new Error('until was ' + entry.until + ' not ' + (droppedAt + 20000));
            }
            if (lastChat() !== 'You drop Bones.') {
                throw new Error('drop chat was ' + lastChat());
            }
            hero = window.game.registry.get('hero');
            if (hero.inventory.filter(function (row) { return row.id === 'bones'; }).length) {
                throw new Error('bones stayed in inventory');
            }

            world.collectNearbyLoot();
            if (entry.taken || !entry.sprite) {
                throw new Error('auto-pickup vacuumed the dropped pile');
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
                phaser: window.Phaser.VERSION
            };
        });

        var dedicated = await runOnly(
            page,
            opened,
            'inv: drop from inventory creates groundLoot at the player'
        );
        return { live: live, dedicated: dedicated };
    });

    if (result.live.player.x !== 328 || result.live.player.y !== 248) {
        throw new Error('did not start at spawn: ' + result.live.player.x + ',' + result.live.player.y);
    }
    if (result.live.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    console.log('PASS 1/1 inventory drop-to-ground', result.dedicated, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
