/**
 * Playwright proof: from spawn (328, 248), tan cowhide → leather
 * or Use string on leather grants Crafting XP. Phaser keyboard stays off.
 * Firemaking is not this tick.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-session.js 8765
 *   node tests/playwright-crafting.js [port]
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
            if (typeof window.tanCowhide !== 'function' || typeof window.stitchLeather !== 'function'
                    || typeof window.useItemOnItem !== 'function' || typeof window.gainSkillXp !== 'function') {
                throw new Error('tanCowhide / stitchLeather / useItemOnItem / gainSkillXp missing');
            }
            if (typeof window.lightFire === 'function' || typeof window.firemakeAt === 'function') {
                throw new Error('Firemaking started this tick');
            }
            if (!window.ITEM_DB.cowhide || window.ITEM_DB.cowhide.tan !== 'leather') {
                throw new Error('cowhide missing');
            }
            if (window.ITEM_DB.cowhide.tanXp !== 14 || window.CRAFT_HIDE_XP !== 14 || window.CRAFT_LEATHER_XP !== 14) {
                throw new Error('Crafting XP constants are wrong');
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
            window.addItem(hero, 'cowhide', 2);
            window.addItem(hero, 'string', 1);
            window.game.registry.set('hero', hero);
            world.refreshHud();

            window.Hud.showTab('inv');
            window.Hud.el.log.innerHTML = '';
            var dropsHost = window.Hud.ensureXpDrops();
            if (dropsHost) {
                dropsHost.innerHTML = '';
            }
            document.querySelector('#inv-grid [data-item="cowhide"]').click();
            hero = window.game.registry.get('hero');
            if (stackQty(hero, 'cowhide') !== 1) {
                throw new Error('tan hide qty is ' + stackQty(hero, 'cowhide') + ' not 1');
            }
            if (stackQty(hero, 'leather') !== 1) {
                throw new Error('tan leather qty is ' + stackQty(hero, 'leather') + ' not 1');
            }
            if (hero.skills.crafting.xp !== 14) {
                throw new Error('tan Crafting XP is ' + hero.skills.crafting.xp + ' not 14');
            }
            if (lastChat() !== 'You tan the cowhide.') {
                throw new Error('tan chat was ' + lastChat());
            }
            if (hero.skills.mining.xp !== 0) {
                throw new Error('Mining XP changed');
            }
            var drop = document.querySelector('#xp-drops .xp-drop[data-skill="crafting"]');
            if (!drop || drop.getAttribute('data-xp') !== '14') {
                throw new Error('Crafting XP drop missing');
            }

            window.Hud.beginUseOn('string');
            document.querySelector('#inv-grid [data-item="leather"]').click();
            hero = window.game.registry.get('hero');
            if (stackQty(hero, 'string') !== 0) {
                throw new Error('stitch string qty is ' + stackQty(hero, 'string') + ' not 0');
            }
            if (stackQty(hero, 'leather') !== 0) {
                throw new Error('stitch leather qty is ' + stackQty(hero, 'leather') + ' not 0');
            }
            if (hero.skills.crafting.xp !== 28) {
                throw new Error('stitch Crafting XP is ' + hero.skills.crafting.xp + ' not 28');
            }
            if (lastChat() !== 'You stitch the leather.') {
                throw new Error('stitch chat was ' + lastChat());
            }

            var helper = window.tanCowhide(hero, 'cowhide');
            if (!helper || !helper.ok || helper.xp !== 14 || helper.made !== 'leather') {
                throw new Error('tanCowhide helper did not grant XP');
            }
            if (hero.skills.crafting.xp !== 42) {
                throw new Error('helper Crafting XP is ' + hero.skills.crafting.xp + ' not 42');
            }

            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            return {
                spawn: spawn,
                player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                cowhide: stackQty(hero, 'cowhide'),
                leather: stackQty(hero, 'leather'),
                string: stackQty(hero, 'string'),
                crafting: hero.skills.crafting.xp,
                mining: hero.skills.mining.xp,
                keyboard: !!window.game.input.keyboard,
                phaser: window.Phaser.VERSION
            };
        });

        var dedicated = await runOnly(
            page,
            opened,
            'skills: cowhide to leather or string plus leather grants Crafting XP'
        );
        return { live: live, dedicated: dedicated };
    });

    if (result.live.player.x !== 328 || result.live.player.y !== 248) {
        throw new Error('did not start at spawn: ' + result.live.player.x + ',' + result.live.player.y);
    }
    if (result.live.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    if (result.live.crafting !== 42 || result.live.mining !== 0
            || result.live.cowhide !== 0 || result.live.leather !== 1 || result.live.string !== 0) {
        throw new Error('live craft was ' + JSON.stringify(result.live));
    }
    console.log('PASS 1/1 cowhide / string+leather Crafting XP', result.dedicated, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
