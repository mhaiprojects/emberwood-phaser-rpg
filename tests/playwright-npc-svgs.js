/**
 * Playwright proof: from spawn (328, 248), cook / priest / shopkeeper
 * use original CC0 SVGs from tools/generate_svgs.py (no commercial packs).
 * Mira uses npc-shopkeeper. Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-npc-svgs.js [port]
 */
(async function () {
    var port = process.argv[2] || '8765';
    var session = require('./playwright-session');
    var result = await session.withGamePage(port, async function (page, opened) {
        var live = await page.evaluate(function () {
            var roles = [
                { key: 'cook', name: 'Cook Pell', x: 280, y: 280, texture: 'npc-cook' },
                { key: 'priest', name: 'Priest Alden', x: 296, y: 168, texture: 'npc-priest' },
                { key: 'shopkeep', name: 'Shopkeeper Mira', x: 376, y: 216, texture: 'npc-shopkeeper' }
            ];
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
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);

            var found = {};
            world.npcs.getChildren().forEach(function (npc) {
                if (npc.npcDef) {
                    found[npc.npcDef.key] = npc;
                }
            });
            roles.forEach(function (want) {
                if (!window.game.textures.exists(want.texture)) {
                    throw new Error('missing texture ' + want.texture);
                }
                var npc = found[want.key];
                if (!npc) {
                    throw new Error(want.name + ' missing');
                }
                if (Math.round(npc.x) !== want.x || Math.round(npc.y) !== want.y) {
                    throw new Error(want.name + ' is at ' + npc.x + ',' + npc.y);
                }
                if (npc.texture.key !== want.texture) {
                    throw new Error(want.name + ' texture is ' + npc.texture.key);
                }
            });

            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            return {
                spawn: spawn,
                player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                textures: roles.map(function (want) { return want.texture; }),
                mira: found.shopkeep.texture.key,
                keyboard: !!window.game.input.keyboard
            };
        });

        var only = encodeURIComponent('npcs: cook priest shopkeeper original CC0 SVGs from generate_svgs');
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
            throw new Error('dedicated case failed: ' + suiteTitle + ' / ' + suiteStatus);
        }
        return { live: live, suite: suiteStatus || suiteTitle };
    });
    if (result.live.player.x !== 328 || result.live.player.y !== 248) {
        throw new Error('did not return to spawn: ' + result.live.player.x + ',' + result.live.player.y);
    }
    if (result.live.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    if (result.live.mira !== 'npc-shopkeeper') {
        throw new Error('Mira texture is ' + result.live.mira);
    }
    console.log('PASS 1/1 original CC0 cook/priest/shopkeeper SVGs', result.suite, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
