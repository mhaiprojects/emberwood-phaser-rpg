/**
 * Playwright proof: from spawn (328, 248), gainSkillXp shows an OSRS-style
 * XP drop floater (number + skill icon). Phaser keyboard stays off.
 * Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-session.js 8765
 *   node tests/playwright-xp-drop.js [port]
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
            if (typeof window.xpDropFloater !== 'function') {
                throw new Error('xpDropFloater helper missing');
            }
            if (typeof window.Hud.showXpDrop !== 'function') {
                throw new Error('Hud.showXpDrop missing');
            }

            world.enterZone('haven', null);
            world.exitLock = false;
            world.encounterLock = false;
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);

            var hero = window.makeHero();
            window.game.registry.set('hero', hero);
            world.refreshHud();

            var host = window.Hud.ensureXpDrops();
            host.innerHTML = '';
            window.gainSkillXp(hero, 'attack', 50);
            var drops = document.querySelectorAll('.xp-drop');
            if (drops.length !== 1) {
                throw new Error('expected 1 Attack drop, got ' + drops.length);
            }
            if (drops[0].getAttribute('data-skill') !== 'attack' || drops[0].getAttribute('data-xp') !== '50') {
                throw new Error('Attack drop was ' + drops[0].getAttribute('data-skill') + ' ' + drops[0].getAttribute('data-xp'));
            }
            var icon = drops[0].querySelector('img.pix');
            if (!icon || icon.getAttribute('src').indexOf('assets/svg/skills/attack.svg') === -1) {
                throw new Error('Attack icon missing');
            }
            window.gainSkillXp(hero, 'hitpoints', 4);
            drops = document.querySelectorAll('.xp-drop');
            if (drops.length !== 2 || drops[1].getAttribute('data-skill') !== 'hitpoints' || drops[1].getAttribute('data-xp') !== '4') {
                throw new Error('Hitpoints drop missing');
            }
            var hpIcon = drops[1].querySelector('img.pix');
            if (!hpIcon || hpIcon.getAttribute('src').indexOf('assets/svg/skills/hitpoints.svg') === -1) {
                throw new Error('Hitpoints icon missing');
            }

            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            return {
                spawn: spawn,
                player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                attack: drops[0].getAttribute('data-xp'),
                hitpoints: drops[1].getAttribute('data-xp'),
                keyboard: !!window.game.input.keyboard,
                phaser: window.Phaser.VERSION
            };
        });

        var dedicated = await runOnly(
            page,
            opened,
            'skills: XP drop floater shows number and skill icon on gain'
        );
        return { live: live, dedicated: dedicated };
    });

    if (result.live.player.x !== 328 || result.live.player.y !== 248) {
        throw new Error('did not start at spawn: ' + result.live.player.x + ',' + result.live.player.y);
    }
    if (result.live.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    console.log('PASS 1/1 XP drop floater', result.dedicated, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
