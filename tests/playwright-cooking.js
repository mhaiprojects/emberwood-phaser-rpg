/**
 * Playwright proof: from spawn (328, 248), Use-on raw shrimp on the
 * Emberhaven range (or a fire) grants Cooking XP. Phaser keyboard stays off.
 * Fishing is not this tick.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-session.js 8765
 *   node tests/playwright-cooking.js [port]
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
            if (typeof window.useItemOnScenery !== 'function' || typeof window.gainSkillXp !== 'function') {
                throw new Error('useItemOnScenery / gainSkillXp missing');
            }
            if (!window.ITEM_DB.rawshrimp || window.ITEM_DB.rawshrimp.cook !== 'shrimp') {
                throw new Error('raw shrimp missing');
            }
            if (window.ITEM_DB.rawshrimp.cookXp !== 30) {
                throw new Error('cookXp is ' + window.ITEM_DB.rawshrimp.cookXp + ' not 30');
            }
            if (typeof window.cookFood === 'function') {
                throw new Error('cookFood started this tick');
            }
            if (typeof window.catchFish === 'function') {
                throw new Error('Fishing started this tick');
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
            window.addItem(hero, 'rawshrimp', 2);
            window.game.registry.set('hero', hero);
            world.refreshHud();

            window.Hud.showTab('inv');
            window.Hud.el.log.innerHTML = '';
            var dropsHost = window.Hud.ensureXpDrops();
            if (dropsHost) {
                dropsHost.innerHTML = '';
            }
            window.Hud.beginUseOn('rawshrimp');
            var range = window.tileCenter(window.TOWN_PROPS.range.x, window.TOWN_PROPS.range.y);
            world.onClick({ worldX: range.x, worldY: range.y });
            hero = window.game.registry.get('hero');
            if (stackQty(hero, 'rawshrimp') !== 1) {
                throw new Error('raw qty is ' + stackQty(hero, 'rawshrimp') + ' not 1');
            }
            if (stackQty(hero, 'shrimp') !== 9) {
                throw new Error('cooked qty is ' + stackQty(hero, 'shrimp') + ' not 9');
            }
            if (hero.skills.cooking.xp !== 30) {
                throw new Error('range Cooking XP is ' + hero.skills.cooking.xp + ' not 30');
            }
            if (lastChat() !== 'You use the Raw shrimp on the fire.') {
                throw new Error('range chat was ' + lastChat());
            }
            if (hero.skills.fishing.xp !== 0) {
                throw new Error('Fishing XP changed');
            }
            var drop = document.querySelector('#xp-drops .xp-drop[data-skill="cooking"]');
            if (!drop || drop.getAttribute('data-xp') !== '30') {
                throw new Error('Cooking XP drop missing');
            }

            var fireResult = window.useItemOnScenery(hero, 'rawshrimp', 'fire');
            if (!fireResult || !fireResult.ok || fireResult.cooked !== 'shrimp') {
                throw new Error('fire helper did not cook');
            }
            if (hero.skills.cooking.xp !== 60) {
                throw new Error('fire Cooking XP is ' + hero.skills.cooking.xp + ' not 60');
            }

            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            return {
                spawn: spawn,
                player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                raw: stackQty(hero, 'rawshrimp'),
                shrimp: stackQty(hero, 'shrimp'),
                cooking: hero.skills.cooking.xp,
                fishing: hero.skills.fishing.xp,
                keyboard: !!window.game.input.keyboard,
                phaser: window.Phaser.VERSION
            };
        });

        var dedicated = await runOnly(
            page,
            opened,
            'skills: Use-on raw shrimp on fire or range grants Cooking XP'
        );
        return { live: live, dedicated: dedicated };
    });

    if (result.live.player.x !== 328 || result.live.player.y !== 248) {
        throw new Error('did not start at spawn: ' + result.live.player.x + ',' + result.live.player.y);
    }
    if (result.live.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    if (result.live.cooking !== 60 || result.live.raw !== 0 || result.live.shrimp !== 10) {
        throw new Error('live cook was ' + JSON.stringify(result.live));
    }
    console.log('PASS 1/1 Use-on raw shrimp Cooking XP', result.dedicated, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
