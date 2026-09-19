/**
 * Playwright proof: from spawn (328, 248), the side HUD shows skill
 * total and a single derived combat level (not ambiguous hero.level).
 * Smithing is not this tick. Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-session.js 8765
 *   node tests/playwright-skill-total.js [port]
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
            if (typeof window.skillTotal !== 'function' || typeof window.combatLevel !== 'function') {
                throw new Error('skillTotal / combatLevel missing');
            }
            if (typeof window.smithBar === 'function') {
                throw new Error('Smithing started this tick');
            }

            world.enterZone('haven', null);
            world.encounterLock = false;
            var hero = window.makeHero();
            window.game.registry.set('hero', hero);
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            world.refreshHud();

            if (window.skillTotal(hero) !== 22 || window.combatLevel(hero) !== 3 || hero.level !== 3) {
                throw new Error('starter total/combat is ' + window.skillTotal(hero) + '/' + hero.level);
            }
            var hudLevel = document.getElementById('hud-level');
            var hudTotal = document.getElementById('hud-total');
            if (!hudLevel || !hudTotal || !hudLevel.closest('#side') || !hudTotal.closest('#side')) {
                throw new Error('combat/total missing from side HUD');
            }
            if (hudLevel.textContent !== '3' || hudTotal.textContent !== '22') {
                throw new Error('HUD is combat ' + hudLevel.textContent + ' total ' + hudTotal.textContent);
            }
            var combatLabel = hudLevel.closest('.stat').querySelector('span');
            if (!combatLabel || combatLabel.textContent.indexOf('Combat') === -1) {
                throw new Error('combat row is not labeled Combat');
            }

            hero.skills.cooking.level = 2;
            world.refreshHud();
            if (window.skillTotal(hero) !== 23 || window.combatLevel(hero) !== 3 || hero.level !== 3) {
                throw new Error('Cooking changed combat to ' + hero.level + ' total ' + window.skillTotal(hero));
            }
            if (hudLevel.textContent !== '3' || hudTotal.textContent !== '23') {
                throw new Error('HUD Cooking is combat ' + hudLevel.textContent + ' total ' + hudTotal.textContent);
            }

            hero.skills.attack.level = 10;
            hero.skills.strength.level = 10;
            if (hero.skills.agility) {
                hero.skills.agility.level = 99;
            }
            window.applyCombatLevel(hero, false);
            world.refreshHud();
            if (window.combatLevel(hero) !== 9 || hero.level !== 9) {
                throw new Error('Attack+Strength combat is ' + hero.level + ' not 9');
            }
            if (window.skillTotal(hero) !== 41 || hudTotal.textContent !== '41') {
                throw new Error('skill total is ' + window.skillTotal(hero) + ' not 41');
            }
            if (hudLevel.textContent !== '9') {
                throw new Error('HUD combat is ' + hudLevel.textContent + ' not 9');
            }
            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            return {
                spawn: spawn,
                player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                combat: hero.level,
                derived: window.combatLevel(hero),
                total: window.skillTotal(hero),
                hudCombat: hudLevel.textContent,
                hudTotal: hudTotal.textContent,
                keyboard: !!window.game.input.keyboard,
                phaser: window.Phaser.VERSION
            };
        });

        var dedicated = await runOnly(
            page,
            opened,
            'hud: side HUD shows skill total and derived combat level'
        );
        return { live: live, dedicated: dedicated };
    });

    if (result.live.player.x !== 328 || result.live.player.y !== 248) {
        throw new Error('did not start at spawn: ' + result.live.player.x + ',' + result.live.player.y);
    }
    if (result.live.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    if (result.live.combat !== 9 || result.live.derived !== 9 || result.live.total !== 41
            || result.live.hudCombat !== '9' || result.live.hudTotal !== '41') {
        throw new Error('live HUD was ' + JSON.stringify(result.live));
    }
    console.log('PASS 1/1 side HUD skill total + combat', result.dedicated, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
