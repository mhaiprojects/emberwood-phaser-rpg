/**
 * Playwright proof: from spawn (328, 248), inventory Use-on is a target
 * cursor. Bones on the shrine and raw shrimp on the Emberhaven range
 * (fire) consume; shrine still grants no Prayer XP. Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-use-on.js [port]
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
            if (typeof window.Hud.beginUseOn !== 'function' || typeof window.itemCanUseOn !== 'function') {
                throw new Error('use-on helpers missing');
            }
            if (!window.ITEM_DB.rawshrimp || window.ITEM_DB.rawshrimp.cook !== 'shrimp') {
                throw new Error('raw shrimp missing');
            }
            if (window.ITEM_DB.rawshrimp.buyPrice != null || window.ITEM_DB.rawshrimp.sellPrice != null) {
                throw new Error('value fields started this tick');
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
            window.addItem(hero, 'bones', 3);
            window.addItem(hero, 'rawshrimp', 2);
            window.game.registry.set('hero', hero);
            world.refreshHud();

            window.Hud.showTab('inv');
            window.Hud.el.log.innerHTML = '';
            window.Hud.beginUseOn('bones');
            if (window.Hud.useOnId !== 'bones') {
                throw new Error('useOnId is ' + window.Hud.useOnId);
            }
            if (lastChat() !== 'Use Bones ->') {
                throw new Error('use prompt was ' + lastChat());
            }
            var shrine = window.tileCenter(18, 8);
            world.onClick({ worldX: shrine.x, worldY: shrine.y });
            hero = window.game.registry.get('hero');
            if (stackQty(hero, 'bones') !== 2) {
                throw new Error('shrine bones qty is ' + stackQty(hero, 'bones'));
            }
            if (hero.skills.prayer.xp !== 0) {
                throw new Error('Prayer XP changed');
            }
            if (lastChat() !== 'You use the Bones on the shrine.') {
                throw new Error('shrine chat was ' + lastChat());
            }

            window.Hud.beginUseOn('rawshrimp');
            var range = window.tileCenter(window.TOWN_PROPS.range.x, window.TOWN_PROPS.range.y);
            world.onClick({ worldX: range.x, worldY: range.y });
            hero = window.game.registry.get('hero');
            if (stackQty(hero, 'rawshrimp') !== 1) {
                throw new Error('raw qty is ' + stackQty(hero, 'rawshrimp'));
            }
            if (stackQty(hero, 'shrimp') !== 9) {
                throw new Error('cooked qty is ' + stackQty(hero, 'shrimp'));
            }
            if (hero.skills.cooking.xp !== 30) {
                throw new Error('Cooking XP is ' + hero.skills.cooking.xp + ' not 30');
            }
            if (lastChat() !== 'You use the Raw shrimp on the fire.') {
                throw new Error('fire chat was ' + lastChat());
            }
            if (window.Hud.useOnId) {
                throw new Error('cursor still armed');
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
                bones: stackQty(hero, 'bones'),
                raw: stackQty(hero, 'rawshrimp'),
                shrimp: stackQty(hero, 'shrimp'),
                keyboard: !!window.game.input.keyboard,
                phaser: window.Phaser.VERSION
            };
        });

        var dedicated = await runOnly(
            page,
            opened,
            'hud: Use-on targets fire with raw shrimp and shrine with bones'
        );
        return { live: live, dedicated: dedicated };
    });

    if (result.live.player.x !== 328 || result.live.player.y !== 248) {
        throw new Error('did not start at spawn: ' + result.live.player.x + ',' + result.live.player.y);
    }
    if (result.live.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    console.log('PASS 1/1 use-on target cursor', result.dedicated, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
