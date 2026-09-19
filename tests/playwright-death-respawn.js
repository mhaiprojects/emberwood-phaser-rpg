/**
 * Playwright proof: death keeps items (safe-death) and respawns in
 * Emberhaven at low HP. Title retry stays as abandon.
 * Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-death-respawn.js [port]
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
            function stackQty(list, id) {
                var row = (list || []).filter(function (stack) { return stack.id === id; })[0];
                return row ? row.qty : 0;
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
            world.exitLock = false;
            world.encounterLock = false;
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);

            var hero = window.game.registry.get('hero');
            window.takeItem(hero, 'shrimp', 1);
            window.addItem(hero, 'bones', 2);
            hero.gold = 12;
            window.syncCoins(hero);
            window.game.registry.set('hero', hero);
            world.refreshHud();

            var respawn = document.getElementById('btn-respawn');
            var retry = document.getElementById('btn-retry');
            if (!respawn || respawn !== window.Hud.el.respawn) {
                throw new Error('missing #btn-respawn');
            }
            if (respawn.textContent.replace(/\s+/g, ' ').trim() !== 'Respawn in Emberhaven') {
                throw new Error('respawn copy is ' + respawn.textContent);
            }
            if (!retry || retry.textContent.replace(/\s+/g, ' ').trim() !== 'Return to title') {
                throw new Error('abandon retry copy is ' + (retry && retry.textContent));
            }

            var expectedHp = window.Hud.safeDeathHp(hero);
            if (expectedHp !== 10) {
                throw new Error('safe-death HP is ' + expectedHp + ' not 10');
            }
            window.Hud.respawnInHaven();
            hero = window.game.registry.get('hero');
            if (window.Hud.mode !== 'world') {
                throw new Error('mode is ' + window.Hud.mode + ' after respawn');
            }
            if (!document.getElementById('dead-overlay').hidden) {
                throw new Error('death overlay still visible');
            }
            if (world.zoneId !== 'haven') {
                throw new Error('zone is ' + world.zoneId + ' not haven');
            }
            if (Math.round(world.player.x) !== spawn.x || Math.round(world.player.y) !== spawn.y) {
                throw new Error('respawn at ' + world.player.x + ',' + world.player.y);
            }
            if (hero.hp !== expectedHp) {
                throw new Error('hp is ' + hero.hp + ' not ' + expectedHp);
            }
            if (stackQty(hero.inventory, 'shrimp') !== 7 || stackQty(hero.inventory, 'bones') !== 2) {
                throw new Error('items were wiped');
            }
            if (hero.gold !== 12 || stackQty(hero.inventory, 'coins') !== 12) {
                throw new Error('gold was wiped');
            }
            return {
                spawn: { x: spawn.x, y: spawn.y },
                hp: hero.hp,
                gold: hero.gold,
                shrimp: stackQty(hero.inventory, 'shrimp'),
                bones: stackQty(hero.inventory, 'bones'),
                zone: world.zoneId,
                keyboard: !!window.game.input.keyboard
            };
        });

        var dedicated = await runOnly(
            page,
            opened,
            'combat: death respawns in Emberhaven at low HP and keeps items'
        );
        return { live: live, dedicated: dedicated };
    });
    if (result.live.spawn.x !== 328 || result.live.spawn.y !== 248) {
        throw new Error('spawn is ' + result.live.spawn.x + ',' + result.live.spawn.y + ' not 328,248');
    }
    if (result.live.hp !== 10 || result.live.gold !== 12 || result.live.shrimp !== 7 || result.live.bones !== 2) {
        throw new Error('live safe-death did not keep low HP and items ' + JSON.stringify(result.live));
    }
    if (result.live.zone !== 'haven' || result.live.keyboard) {
        throw new Error('live respawn left zone/keyboard ' + JSON.stringify(result.live));
    }
    console.log('PASS 1/1 death respawn keeps items', result.dedicated, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
