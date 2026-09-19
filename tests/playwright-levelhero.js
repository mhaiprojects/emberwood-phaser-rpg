/**
 * Playwright proof: from spawn (328, 248), levelHero uses combat XP / 40
 * and leaves maxHp as 10 * Hitpoints. Existing Hitpoints level-up case
 * still passes. Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-levelhero.js [port]
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

            world.enterZone('haven', null);
            world.encounterLock = false;
            var hero = window.makeHero();
            window.game.registry.set('hero', hero);
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            world.refreshHud();

            hero.xp = 40;
            world.levelHero(hero);
            if (hero.level !== 2) {
                throw new Error('combat XP 40 did not raise combat level to 2');
            }
            if (hero.maxHp !== 100) {
                throw new Error('levelHero overwrote maxHp to ' + hero.maxHp);
            }
            if (hero.damage !== 18) {
                throw new Error('levelHero damage is ' + hero.damage + ' not 18');
            }

            window.gainSkillXp(hero, 'hitpoints', 3846);
            if (hero.skills.hitpoints.level !== 11 || hero.maxHp !== 110) {
                throw new Error('Hitpoints level-up did not set maxHp to 110');
            }

            hero.xp = 80;
            world.levelHero(hero);
            if (hero.level !== 3) {
                throw new Error('combat XP 80 did not raise combat level to 3');
            }
            if (hero.maxHp !== 110) {
                throw new Error('later levelHero overwrote maxHp to ' + hero.maxHp);
            }
            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            return {
                spawn: spawn,
                player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                level: hero.level,
                maxHp: hero.maxHp,
                hitpoints: hero.skills.hitpoints.level,
                keyboard: !!window.game.input.keyboard
            };
        });

        var dedicated = await runOnly(page, opened, 'combat: levelHero XP/40 does not overwrite maxHp from Hitpoints');
        var hitpoints = await runOnly(page, opened, 'skills: Hitpoints level-up sets maxHp to 10 * level and chats Skill increased to N');
        return { live: live, dedicated: dedicated, hitpoints: hitpoints };
    });
    if (result.live.player.x !== 328 || result.live.player.y !== 248) {
        throw new Error('did not return to spawn: ' + result.live.player.x + ',' + result.live.player.y);
    }
    if (result.live.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    if (result.live.maxHp !== 110 || result.live.level !== 3) {
        throw new Error('live proof ended at level ' + result.live.level + ' maxHp ' + result.live.maxHp);
    }
    console.log('PASS 2/2 levelHero leaves maxHp to Hitpoints', result.dedicated, result.hitpoints, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
