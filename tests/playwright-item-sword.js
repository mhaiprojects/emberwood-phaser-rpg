/**
 * Playwright proof: from spawn (328, 248), BootScene has loaded
 * item-sword and item-shield so ground drops use those textures.
 * Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-item-sword.js [port]
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

            ['coins', 'bones', 'shrimp', 'bread', 'sword', 'shield'].forEach(function (id) {
                if (!window.game.textures.exists('item-' + id)) {
                    throw new Error('missing texture item-' + id);
                }
            });

            world.enterZone('haven', null);
            world.encounterLock = false;
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            if (world.clearLoot) {
                world.clearLoot();
            }
            world.spawnLoot(spawn.x, spawn.y, [
                { id: 'sword', qty: 1 },
                { id: 'shield', qty: 1 }
            ]);
            var liveLoot = (world.groundLoot || []).filter(function (drop) {
                return drop && !drop.taken && drop.sprite;
            });
            if (liveLoot.length !== 2) {
                throw new Error('ground pile size is ' + liveLoot.length);
            }
            var keys = liveLoot.map(function (drop) {
                return drop.sprite.texture.key;
            });
            if (keys[0] !== 'item-sword' || keys[1] !== 'item-shield') {
                throw new Error('drop textures are ' + keys.join(','));
            }
            if (keys.indexOf('__MISSING') !== -1) {
                throw new Error('gear drop used the missing texture');
            }

            world.clearLoot();
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            return {
                spawn: spawn,
                player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                textures: keys,
                keyboard: !!window.game.input.keyboard,
                phaser: window.Phaser.VERSION
            };
        });

        var dedicated = await runOnly(
            page,
            opened,
            'loot: item-sword and item-shield load so ground drops show them'
        );
        return { live: live, dedicated: dedicated };
    });

    if (result.live.player.x !== 328 || result.live.player.y !== 248) {
        throw new Error('did not start at spawn: ' + result.live.player.x + ',' + result.live.player.y);
    }
    if (result.live.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    console.log('PASS 1/1 item-sword and item-shield ground textures', result.dedicated, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
