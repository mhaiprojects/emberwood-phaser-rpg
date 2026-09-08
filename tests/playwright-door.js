/**
 * Playwright proof: from Emberhaven spawn, walk through the 1-tile courtyard
 * gate via Keys.js, then confirm a solid wall still blocks.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-door.js [port]
 */
(async function () {
    var port = process.argv[2] || '8765';
    var result = await require('./playwright-session').withGamePage(port, async function (page) {
    return await page.evaluate(function () {
        return new Promise(function (resolve, reject) {
            var world = window.game.scene.getScene('WorldScene');
            if (window.Hud && window.Hud.setAutoAttack) {
                /* keep chickens from engaging */
            }
            var hero = window.game.registry.get('hero');
            if (hero) {
                hero.autoAttack = false;
                window.game.registry.set('hero', hero);
            }
            world.walkTarget = null;
            world.engageTarget = null;
            world.talkTarget = null;
            world.encounterLock = false;
            var spawn = window.defaultWorldSpawn();
            world.placePlayer(spawn.x, spawn.y);
            var gate = window.HAVEN_GATE_TILE;
            var tile = window.TILE_SIZE || 16;
            var doorEast = (gate.x + 1) * tile;
            var doorWest = gate.x * tile;
            var ev = new KeyboardEvent('keydown', {
                key: 'd',
                code: 'KeyD',
                keyCode: 68,
                which: 68,
                bubbles: true,
                cancelable: true
            });
            (document.body || window).dispatchEvent(ev);
            setTimeout(function () {
                var throughX = world.player.x;
                var throughY = world.player.y;
                var up = new KeyboardEvent('keyup', {
                    key: 'd',
                    code: 'KeyD',
                    keyCode: 68,
                    which: 68,
                    bubbles: true,
                    cancelable: true
                });
                (document.body || window).dispatchEvent(up);
                if (window.Keys) {
                    window.Keys.down = {};
                }
                if (!(throughX > doorEast)) {
                    reject(new Error('did not pass 1-tile door, x=' + throughX));
                    return;
                }
                var wall = window.tileCenter(gate.x - 1, gate.y + 1);
                world.placePlayer(wall.x, wall.y);
                (document.body || window).dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'd',
                    code: 'KeyD',
                    keyCode: 68,
                    which: 68,
                    bubbles: true,
                    cancelable: true
                }));
                setTimeout(function () {
                    var blockedX = world.player.x;
                    (document.body || window).dispatchEvent(up);
                    if (window.Keys) {
                        window.Keys.down = {};
                    }
                    if (!(blockedX < doorWest + 8)) {
                        reject(new Error('walked through solid wall, x=' + blockedX));
                        return;
                    }
                    resolve({
                        spawn: spawn,
                        throughX: throughX,
                        throughY: throughY,
                        blockedX: blockedX,
                        playerScale: world.player.scaleX,
                        bodyW: world.player.body.width,
                        keyboard: window.game.input.keyboard
                    });
                }, 400);
            }, 700);
        });
    });
    });

    if (result.keyboard) {
        throw new Error('Phaser keyboard was enabled');
    }
    console.log('PASS door walk', JSON.stringify(result));
})().catch(function (err) {
    console.error('FAIL', err && err.message ? err.message : err);
    process.exit(1);
});
