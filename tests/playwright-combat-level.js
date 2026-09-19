/**
 * Playwright proof: from spawn (328, 248), displayed combat level is
 * OSRS-like from Attack, Strength, Defence, Hitpoints, Prayer, Ranged,
 * Magic. maxHp stays 10 * Hitpoints. Style-XP-on-win still passes.
 * Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-combat-level.js [port]
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
        }, null, { timeout: 60000 });
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
            if (typeof window.combatLevel !== 'function') {
                throw new Error('combatLevel missing');
            }

            world.enterZone('haven', null);
            world.encounterLock = false;
            var hero = window.makeHero();
            window.game.registry.set('hero', hero);
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            world.refreshHud();

            if (window.combatLevel(hero) !== 3 || hero.level !== 3) {
                throw new Error('starter combat is ' + hero.level + ' not 3');
            }
            if (hero.maxHp !== 100) {
                throw new Error('starter maxHp is ' + hero.maxHp + ' not 100');
            }
            var hudLevel = document.getElementById('hud-level').textContent;
            if (hudLevel !== '3') {
                throw new Error('HUD combat is ' + hudLevel + ' not 3');
            }

            hero.xp = 40;
            world.levelHero(hero);
            if (hero.level !== 3) {
                throw new Error('XP/40 overwrote combat to ' + hero.level);
            }
            if (hero.maxHp !== 100) {
                throw new Error('levelHero overwrote maxHp to ' + hero.maxHp);
            }

            hero.skills.attack.level = 2;
            hero.skills.strength.level = 2;
            window.applyCombatLevel(hero, false);
            world.refreshHud();
            if (hero.level !== 4) {
                throw new Error('Attack 2 Strength 2 combat is ' + hero.level + ' not 4');
            }
            if (document.getElementById('hud-level').textContent !== '4') {
                throw new Error('HUD did not show combat 4');
            }

            window.gainSkillXp(hero, 'hitpoints', 3846);
            if (hero.skills.hitpoints.level !== 11 || hero.maxHp !== 110) {
                throw new Error('Hitpoints level-up did not set maxHp to 110');
            }
            if (window.combatLevel(hero) !== 4) {
                throw new Error('HP 11 changed combat to ' + window.combatLevel(hero));
            }

            ['attack', 'strength', 'defence', 'hitpoints', 'prayer', 'ranged', 'magic'].forEach(function (id) {
                hero.skills[id].level = 99;
            });
            if (window.combatLevel(hero) !== 126) {
                throw new Error('99 combat skills are ' + window.combatLevel(hero) + ' not 126');
            }
            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            return {
                spawn: spawn,
                player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                level: hero.level,
                combat: window.combatLevel(hero),
                maxHp: hero.maxHp,
                hitpoints: hero.skills.hitpoints.level,
                keyboard: !!window.game.input.keyboard
            };
        });

        var dedicated = await runOnly(
            page,
            opened,
            'combat: OSRS-like combat level from Attack Strength Defence Hitpoints Prayer Ranged Magic'
        );
        var styleXp = await runOnly(
            page,
            opened,
            'combat: Accurate Attack XP, Aggressive Strength XP, Defensive Defence XP on win'
        );
        return { live: live, dedicated: dedicated, styleXp: styleXp };
    });
    if (result.live.player.x !== 328 || result.live.player.y !== 248) {
        throw new Error('did not return to spawn: ' + result.live.player.x + ',' + result.live.player.y);
    }
    if (result.live.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    if (result.live.combat !== 126) {
        throw new Error('live proof ended at combat ' + result.live.combat);
    }
    console.log('PASS 2/2 OSRS combat level', result.dedicated, result.styleXp, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
