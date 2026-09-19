/**
 * Playwright proof: from spawn (328, 248), inventory left-click bury
 * grants Prayer XP. Phaser keyboard stays off. Magic is not this tick.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-session.js 8765
 *   node tests/playwright-prayer.js [port]
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
            if (typeof window.buryItem !== 'function' || typeof window.gainSkillXp !== 'function') {
                throw new Error('buryItem / gainSkillXp missing');
            }
            if (!window.ITEM_DB.bones || window.ITEM_DB.bones.buryXp !== 4) {
                throw new Error('bones buryXp is ' + (window.ITEM_DB.bones && window.ITEM_DB.bones.buryXp));
            }
            if (typeof window.windStrike === 'function' || window.ITEM_DB.airrune || window.ITEM_DB.mindrune) {
                throw new Error('Magic started this tick');
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
            window.game.registry.set('hero', hero);
            world.refreshHud();

            window.Hud.showTab('inv');
            window.Hud.el.log.innerHTML = '';
            var dropsHost = window.Hud.ensureXpDrops();
            if (dropsHost) {
                dropsHost.innerHTML = '';
            }
            document.querySelector('#inv-grid [data-item="bones"]').click();
            hero = window.game.registry.get('hero');
            if (stackQty(hero, 'bones') !== 1) {
                throw new Error('bury qty is ' + stackQty(hero, 'bones') + ' not 1');
            }
            if (hero.skills.prayer.xp !== 4) {
                throw new Error('bury Prayer XP is ' + hero.skills.prayer.xp + ' not 4');
            }
            if (lastChat() !== 'You bury the bones.') {
                throw new Error('bury chat was ' + lastChat());
            }
            if (hero.skills.magic.xp !== 0) {
                throw new Error('Magic XP changed');
            }
            var drop = document.querySelector('#xp-drops .xp-drop[data-skill="prayer"]');
            if (!drop || drop.getAttribute('data-xp') !== '4') {
                throw new Error('Prayer XP drop missing');
            }

            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            return {
                spawn: spawn,
                player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                bones: stackQty(hero, 'bones'),
                prayer: hero.skills.prayer.xp,
                magic: hero.skills.magic.xp,
                keyboard: !!window.game.input.keyboard,
                phaser: window.Phaser.VERSION
            };
        });

        var dedicated = await runOnly(
            page,
            opened,
            'skills: burying inventory bones grants Prayer XP'
        );
        return { live: live, dedicated: dedicated };
    });

    if (result.live.player.x !== 328 || result.live.player.y !== 248) {
        throw new Error('did not start at spawn: ' + result.live.player.x + ',' + result.live.player.y);
    }
    if (result.live.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    if (result.live.prayer !== 4 || result.live.bones !== 1) {
        throw new Error('live bury was ' + JSON.stringify(result.live));
    }
    console.log('PASS 1/1 bury bones Prayer XP', result.dedicated, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
