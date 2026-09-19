/**
 * Playwright proof: from spawn (328, 248), Worn shows an equipment-stats
 * readout with melee +defence from the wooden shield (+1 / +0). Slot rows
 * stay the 11 OSRS names. Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-equip-stats.js [port]
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
            if (typeof window.equipmentMeleeDefence !== 'function') {
                throw new Error('equipmentMeleeDefence helper missing');
            }
            if (window.ITEM_DB.shield.defence !== 1) {
                throw new Error('ITEM_DB shield defence is not 1');
            }

            world.enterZone('haven', null);
            world.exitLock = false;
            world.encounterLock = false;
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);

            var hero = window.game.registry.get('hero');
            if (hero.equipment.weapon !== 'sword' || hero.equipment.shield !== 'shield') {
                throw new Error('starter is not wearing sword and shield');
            }
            if (window.equipmentMeleeDefence(hero) !== 1) {
                throw new Error('starter melee +defence is not 1');
            }

            window.Hud.showTab('equip');
            var stats = document.getElementById('equip-stats');
            if (!stats) {
                throw new Error('equip-stats readout missing');
            }
            var text = stats.innerText;
            if (text.indexOf('Melee +defence') === -1) {
                throw new Error('stats readout missing Melee +defence');
            }
            if (text.indexOf('+1') === -1) {
                throw new Error('starter readout is not +1: ' + text);
            }
            var rows = document.querySelectorAll('#equip-grid .equip-row');
            if (rows.length !== 11) {
                throw new Error('worn rows are ' + rows.length + ' not 11');
            }
            var worn = document.getElementById('equip-grid').innerText;
            if (worn.toLowerCase().indexOf('defence') !== -1) {
                throw new Error('slot grid showed defence');
            }

            if (!window.unequipItem(hero, 'shield')) {
                throw new Error('unequip shield failed');
            }
            window.game.registry.set('hero', hero);
            world.refreshHud();
            if (window.equipmentMeleeDefence(hero) !== 0) {
                throw new Error('unequipped melee +defence is not 0');
            }
            text = document.getElementById('equip-stats').innerText;
            if (text.indexOf('+0') === -1) {
                throw new Error('unequip readout is not +0: ' + text);
            }

            if (!window.equipItem(hero, 'shield')) {
                throw new Error('re-wear shield failed');
            }
            window.game.registry.set('hero', hero);
            world.refreshHud();
            if (window.equipmentMeleeDefence(hero) !== 1) {
                throw new Error('re-wear melee +defence is not 1');
            }
            text = document.getElementById('equip-stats').innerText;
            if (text.indexOf('+1') === -1) {
                throw new Error('re-wear readout is not +1: ' + text);
            }

            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            return {
                spawn: spawn,
                player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                keyboard: !!window.game.input.keyboard,
                phaser: window.Phaser.VERSION,
                defence: window.equipmentMeleeDefence(hero),
                readout: text.replace(/\s+/g, ' ').trim()
            };
        });

        var dedicated = await runOnly(
            page,
            opened,
            'hud: worn tab shows melee +defence from equipment'
        );
        return { live: live, dedicated: dedicated };
    });

    if (result.live.player.x !== 328 || result.live.player.y !== 248) {
        throw new Error('did not start at spawn: ' + result.live.player.x + ',' + result.live.player.y);
    }
    if (result.live.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    if (result.live.defence !== 1) {
        throw new Error('live melee +defence is ' + result.live.defence + ' not 1');
    }
    console.log('PASS 1/1 worn melee +defence', result.dedicated, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
