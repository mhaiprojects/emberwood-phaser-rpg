/**
 * Playwright proof: from spawn (328, 248), a skill level-up shows a modal
 * and a chat fanfare (not only one log line). Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-session.js 8765
 *   node tests/playwright-level-up.js [port]
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
            function chatLines() {
                return Array.prototype.map.call(document.querySelectorAll('.chat-line'), function (line) {
                    return line.textContent;
                });
            }
            function chatHas(snippet) {
                return chatLines().some(function (line) {
                    return line.indexOf(snippet) !== -1;
                });
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
            if (typeof window.showLevelUpModal !== 'function') {
                throw new Error('showLevelUpModal helper missing');
            }
            if (typeof window.Hud.showLevelUp !== 'function') {
                throw new Error('Hud.showLevelUp missing');
            }

            world.enterZone('haven', null);
            world.exitLock = false;
            world.encounterLock = false;
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);

            var hero = window.makeHero();
            window.game.registry.set('hero', hero);
            world.refreshHud();

            var overlay = window.Hud.ensureLevelUpModal();
            if (!overlay || overlay.id !== 'level-up-overlay') {
                throw new Error('level-up overlay missing');
            }
            window.Hud.hideLevelUp();
            window.Hud.el.log.innerHTML = '';

            window.gainSkillXp(hero, 'hitpoints', 3845);
            if (!overlay.hidden) {
                throw new Error('modal shown below the Hitpoints curve');
            }
            if (chatHas('Congratulations') || chatHas('Hitpoints increased')) {
                throw new Error('fanfare below the Hitpoints curve');
            }

            window.gainSkillXp(hero, 'attack', 50);
            if (overlay.hidden) {
                throw new Error('Attack level-up did not show the modal');
            }
            if (overlay.getAttribute('data-skill') !== 'attack' || overlay.getAttribute('data-level') !== '2') {
                throw new Error('Attack modal was ' + overlay.getAttribute('data-skill') + ' ' + overlay.getAttribute('data-level'));
            }
            var fanfare = chatLines().filter(function (line) {
                return line.indexOf('Congratulations') !== -1 ||
                    line.indexOf('Your Attack level is now 2.') !== -1 ||
                    line.indexOf('Attack increased to 2.') !== -1;
            });
            if (fanfare.length < 3) {
                throw new Error('Attack fanfare was only ' + fanfare.length + ' line(s)');
            }
            if (!chatHas('Congratulations, you just advanced an Attack level.')) {
                throw new Error('missing Attack congratulations line');
            }
            if (!chatHas('Attack increased to 2.')) {
                throw new Error('missing Attack increased line');
            }

            document.getElementById('btn-level-up-close').click();
            if (!overlay.hidden) {
                throw new Error('Continue did not hide the modal');
            }

            window.Hud.el.log.innerHTML = '';
            window.gainSkillXp(hero, 'hitpoints', 1);
            if (overlay.hidden || overlay.getAttribute('data-skill') !== 'hitpoints' || overlay.getAttribute('data-level') !== '11') {
                throw new Error('Hitpoints modal missing');
            }
            if (!chatHas('Congratulations, you just advanced a Hitpoints level.') ||
                    !chatHas('Your Hitpoints level is now 11.') ||
                    !chatHas('Hitpoints increased to 11.')) {
                throw new Error('Hitpoints fanfare incomplete: ' + chatLines().join(' | '));
            }
            if (hero.maxHp !== 110) {
                throw new Error('Hitpoints level-up did not set maxHp to 110');
            }

            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            return {
                spawn: spawn,
                player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                attack: overlay.getAttribute('data-skill') === 'hitpoints' ? '2' : overlay.getAttribute('data-level'),
                hitpoints: overlay.getAttribute('data-level'),
                fanfare: fanfare.length,
                keyboard: !!window.game.input.keyboard,
                phaser: window.Phaser.VERSION
            };
        });

        var dedicated = await runOnly(
            page,
            opened,
            'skills: level-up modal and chat fanfare not only one log line'
        );
        return { live: live, dedicated: dedicated };
    });

    if (result.live.player.x !== 328 || result.live.player.y !== 248) {
        throw new Error('did not start at spawn: ' + result.live.player.x + ',' + result.live.player.y);
    }
    if (result.live.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    console.log('PASS 1/1 level-up modal fanfare', result.dedicated, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
