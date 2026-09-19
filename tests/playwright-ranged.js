/**
 * Playwright proof: from spawn (328, 248), a shortbow + bronze arrows
 * fill the ammo slot, grant Ranged XP on a hit, and consume one arrow.
 * Phaser keyboard stays off. Magic is not this tick.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-session.js 8765
 *   node tests/playwright-ranged.js [port]
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
            if (!window.ITEM_DB.shortbow || !window.ITEM_DB.arrow) {
                throw new Error('shortbow or bronze arrows missing from ITEM_DB');
            }
            if (window.ITEM_DB.shortbow.combatClass !== 'ranged') {
                throw new Error('shortbow combatClass is ' + window.ITEM_DB.shortbow.combatClass);
            }
            if (typeof window.rangedWeaponEquipped !== 'function' || typeof window.consumeAmmo !== 'function') {
                throw new Error('ranged helpers missing');
            }

            world.enterZone('haven', null);
            world.exitLock = false;
            world.encounterLock = false;
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);

            var hero = window.makeHero();
            window.addItem(hero, 'shortbow', 1);
            window.addItem(hero, 'arrow', 50);
            window.equipItem(hero, 'shortbow');
            window.equipItem(hero, 'arrow');
            window.game.registry.set('hero', hero);
            world.refreshHud();
            if (hero.equipment.weapon !== 'shortbow' || hero.equipment.ammo !== 'arrow') {
                throw new Error('shortbow/ammo did not equip');
            }
            if (window.equippedQty(hero, 'ammo') !== 50) {
                throw new Error('ammo qty is ' + window.equippedQty(hero, 'ammo'));
            }
            if (window.heroCombatClass(hero) !== 'ranged' || window.combatSkill(hero) !== 'ranged') {
                throw new Error('shortbow did not train Ranged');
            }
            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            return {
                spawn: spawn,
                player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                weapon: hero.equipment.weapon,
                ammo: hero.equipment.ammo,
                ammoQty: window.equippedQty(hero, 'ammo'),
                combat: window.heroCombatClass(hero),
                keyboard: !!window.game.input.keyboard,
                phaser: window.Phaser.VERSION
            };
        });

        var dedicated = await runOnly(
            page,
            opened,
            'combat: shortbow and bronze arrows grant Ranged XP and consume ammo'
        );
        return { live: live, dedicated: dedicated };
    });

    if (result.live.player.x !== 328 || result.live.player.y !== 248) {
        throw new Error('did not start at spawn: ' + result.live.player.x + ',' + result.live.player.y);
    }
    if (result.live.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    if (result.live.weapon !== 'shortbow' || result.live.ammo !== 'arrow' || result.live.ammoQty !== 50) {
        throw new Error('live equip was ' + JSON.stringify(result.live));
    }
    console.log('PASS 1/1 shortbow + bronze arrows', result.dedicated, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
