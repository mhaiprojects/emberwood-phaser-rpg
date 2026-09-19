/**
 * Playwright proof: from spawn (328, 248), Firemaking is the extra skill
 * and firemakeAt / lightFire grant Firemaking XP. Use-on fire still cooks.
 * Smithing and gathering-section items are not this tick.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-session.js 8765
 *   node tests/playwright-firemaking.js [port]
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
            if (typeof window.firemakeAt !== 'function' || typeof window.lightFire !== 'function'
                    || typeof window.gainSkillXp !== 'function') {
                throw new Error('firemakeAt / lightFire / gainSkillXp missing');
            }
            if (typeof window.smithBar === 'function' || typeof window.smithAt === 'function') {
                throw new Error('Smithing started this tick');
            }
            if (window.ITEM_DB.logs || window.ITEM_DB.tinderbox || window.ITEM_DB.ore || window.ITEM_DB.net) {
                throw new Error('gathering section items started this tick');
            }
            if (window.FIREMAKE_XP !== 10) {
                throw new Error('FIREMAKE_XP is ' + window.FIREMAKE_XP + ' not 10');
            }
            if (window.SKILL_NAMES.length !== 13 || window.SKILL_NAMES[12][0] !== 'firemaking') {
                throw new Error('Firemaking is not the extra skill');
            }

            world.enterZone('haven', null);
            world.exitLock = false;
            world.encounterLock = false;
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            if (world.clearLoot) {
                world.clearLoot();
            }
            world.npcs.getChildren().forEach(function (obj) {
                if (obj.body) {
                    obj.body.enable = false;
                    obj.body.setVelocity(0, 0);
                }
                obj.setPosition(24, 24);
            });

            var hero = window.makeHero();
            window.addItem(hero, 'rawshrimp', 1);
            window.game.registry.set('hero', hero);
            world.refreshHud();

            window.Hud.showTab('skills');
            var fireRow = document.querySelector('#skills-list [data-skill="firemaking"]');
            if (!fireRow) {
                throw new Error('Firemaking Skills row missing');
            }
            var fireImg = fireRow.querySelector('img.pix');
            if (!fireImg || fireImg.getAttribute('src').indexOf('assets/svg/skills/firemaking.svg') === -1) {
                throw new Error('Firemaking skill icon missing');
            }
            if (window.skillTotal(hero) !== 22) {
                throw new Error('starter total is ' + window.skillTotal(hero) + ' not 22');
            }

            window.Hud.showTab('inv');
            window.Hud.el.log.innerHTML = '';
            var dropsHost = window.Hud.ensureXpDrops();
            if (dropsHost) {
                dropsHost.innerHTML = '';
            }
            var range = window.tileCenter(window.TOWN_PROPS.range.x, window.TOWN_PROPS.range.y);
            window.Hud.beginUseOn('rawshrimp');
            world.onClick({ worldX: range.x, worldY: range.y });
            hero = window.game.registry.get('hero');
            if (lastChat() !== 'You use the Raw shrimp on the fire.') {
                throw new Error('range chat was ' + lastChat());
            }
            if (hero.skills.cooking.xp !== 30) {
                throw new Error('Use-on fire Cooking XP is ' + hero.skills.cooking.xp);
            }
            if (hero.skills.firemaking.xp !== 0) {
                throw new Error('Use-on cook granted Firemaking XP');
            }

            var helper = window.firemakeAt(hero);
            if (!helper || !helper.ok || helper.xp !== 10) {
                throw new Error('firemakeAt helper did not grant XP');
            }
            if (hero.skills.firemaking.xp !== 10) {
                throw new Error('firemakeAt XP is ' + hero.skills.firemaking.xp + ' not 10');
            }
            var drop = document.querySelector('#xp-drops .xp-drop[data-skill="firemaking"]');
            if (!drop || drop.getAttribute('data-xp') !== '10') {
                throw new Error('Firemaking XP drop missing');
            }

            var alias = window.lightFire(hero);
            if (!alias || !alias.ok || alias.xp !== 10 || hero.skills.firemaking.xp !== 20) {
                throw new Error('lightFire XP is ' + hero.skills.firemaking.xp + ' not 20');
            }
            if (hero.skills.cooking.xp !== 30) {
                throw new Error('Cooking XP changed');
            }

            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            return {
                spawn: spawn,
                player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                firemaking: hero.skills.firemaking.xp,
                cooking: hero.skills.cooking.xp,
                total: window.skillTotal(hero),
                skills: window.SKILL_NAMES.length,
                keyboard: !!window.game.input.keyboard,
                phaser: window.Phaser.VERSION
            };
        });

        var dedicated = await runOnly(
            page,
            opened,
            'skills: Firemaking listed and firemakeAt grants Firemaking XP'
        );
        return { live: live, dedicated: dedicated };
    });

    if (result.live.player.x !== 328 || result.live.player.y !== 248) {
        throw new Error('did not start at spawn: ' + result.live.player.x + ',' + result.live.player.y);
    }
    if (result.live.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    if (result.live.firemaking !== 20 || result.live.cooking !== 30
            || result.live.total !== 22 || result.live.skills !== 13) {
        throw new Error('live firemake was ' + JSON.stringify(result.live));
    }
    console.log('PASS 1/1 Firemaking skill + firemakeAt XP', result.dedicated, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
