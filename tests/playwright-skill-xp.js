/**
 * Playwright proof: from spawn (328, 248), Skills tab rows show current XP
 * and XP-to-next on hover (title) or click (chat). Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-session.js 8765
 *   node tests/playwright-skill-xp.js [port]
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
            if (typeof window.skillXpText !== 'function') {
                throw new Error('skillXpText helper missing');
            }
            if (typeof window.xpDropFloater !== 'function') {
                throw new Error('xpDropFloater helper missing');
            }

            world.enterZone('haven', null);
            world.exitLock = false;
            world.encounterLock = false;
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);

            var hero = window.makeHero();
            window.game.registry.set('hero', hero);
            world.refreshHud();

            var hpHint = window.skillXpText('Hitpoints', hero.skills.hitpoints);
            var atkHint = window.skillXpText('Attack', hero.skills.attack);
            if (hpHint !== 'Hitpoints: 1154 XP (3846 XP to next level)') {
                throw new Error('Hitpoints hint is ' + hpHint);
            }
            if (atkHint !== 'Attack: 0 XP (50 XP to next level)') {
                throw new Error('Attack hint is ' + atkHint);
            }

            document.querySelector('#tab-bar button[data-tab="skills"]').click();
            var hpRow = document.querySelector('#skills-list .skill-row[data-skill="hitpoints"]');
            var atkRow = document.querySelector('#skills-list .skill-row[data-skill="attack"]');
            if (!hpRow || hpRow.getAttribute('title') !== hpHint) {
                throw new Error('Hitpoints title is ' + (hpRow && hpRow.getAttribute('title')));
            }
            if (!atkRow || atkRow.getAttribute('title') !== atkHint) {
                throw new Error('Attack title is ' + (atkRow && atkRow.getAttribute('title')));
            }
            hpRow.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
            if (hpRow.getAttribute('title') !== hpHint) {
                throw new Error('hover lost Hitpoints title');
            }

            window.Hud.el.log.innerHTML = '';
            hpRow.click();
            if (lastChat() !== hpHint) {
                throw new Error('Hitpoints click was ' + lastChat());
            }
            atkRow.click();
            if (lastChat() !== atkHint) {
                throw new Error('Attack click was ' + lastChat());
            }

            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            return {
                spawn: spawn,
                player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                hitpoints: hpHint,
                attack: atkHint,
                keyboard: !!window.game.input.keyboard,
                phaser: window.Phaser.VERSION
            };
        });

        var dedicated = await runOnly(
            page,
            opened,
            'skills: skill-row hover or click shows current XP and XP-to-next'
        );
        return { live: live, dedicated: dedicated };
    });

    if (result.live.player.x !== 328 || result.live.player.y !== 248) {
        throw new Error('did not start at spawn: ' + result.live.player.x + ',' + result.live.player.y);
    }
    if (result.live.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    console.log('PASS 1/1 skill-row XP hover/click', result.dedicated, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
