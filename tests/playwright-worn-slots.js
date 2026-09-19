/**
 * Playwright proof: from spawn (328, 248), Worn lists the OSRS slot
 * set (head through ring). Sword/shield stay filled; other slots are
 * empty None. No equipment-stats readout. Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-worn-slots.js [port]
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
            if (!window.EQUIP_SLOTS || window.EQUIP_SLOTS.length !== 11) {
                throw new Error('EQUIP_SLOTS missing or not 11');
            }
            var keys = window.EQUIP_SLOTS.map(function (row) { return row[0]; }).join(',');
            if (keys !== 'head,cape,neck,ammo,weapon,body,shield,legs,hands,feet,ring') {
                throw new Error('EQUIP_SLOTS keys are ' + keys);
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
            var empty = ['head', 'cape', 'neck', 'ammo', 'body', 'legs', 'hands', 'feet', 'ring'];
            for (var i = 0; i < empty.length; i++) {
                if (hero.equipment[empty[i]] != null) {
                    throw new Error(empty[i] + ' should start empty');
                }
            }

            window.Hud.showTab('equip');
            var rows = document.querySelectorAll('#equip-grid .equip-row');
            if (rows.length !== 11) {
                throw new Error('worn rows are ' + rows.length + ' not 11');
            }
            var labels = [];
            var noneCount = 0;
            for (var r = 0; r < rows.length; r++) {
                labels.push(rows[r].querySelector('span').textContent);
                if (rows[r].textContent.indexOf('None') !== -1) {
                    noneCount += 1;
                }
            }
            if (labels.join(',') !== 'Head,Cape,Neck,Ammo,Weapon,Body,Shield,Legs,Hands,Feet,Ring') {
                throw new Error('worn labels are ' + labels.join(','));
            }
            if (noneCount !== 9) {
                throw new Error('empty None count is ' + noneCount + ' not 9');
            }
            var worn = document.getElementById('equip-grid').innerText;
            if (worn.indexOf('Bronze sword') === -1 || worn.indexOf('Wooden shield') === -1) {
                throw new Error('worn tab missing sword/shield names');
            }
            if (worn.indexOf('16') !== -1 || worn.toLowerCase().indexOf('defence') !== -1) {
                throw new Error('worn tab showed combat stats');
            }

            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            return {
                spawn: spawn,
                player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                keyboard: !!window.game.input.keyboard,
                phaser: window.Phaser.VERSION,
                slots: keys,
                noneCount: noneCount
            };
        });

        var dedicated = await runOnly(
            page,
            opened,
            'hud: worn tab lists OSRS slots with empty None'
        );
        return { live: live, dedicated: dedicated };
    });

    if (result.live.player.x !== 328 || result.live.player.y !== 248) {
        throw new Error('did not start at spawn: ' + result.live.player.x + ',' + result.live.player.y);
    }
    if (result.live.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    console.log('PASS 1/1 worn OSRS slots', result.dedicated, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
