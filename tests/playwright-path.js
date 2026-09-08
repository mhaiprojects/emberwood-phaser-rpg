/**
 * Playwright proof: from Emberhaven spawn, click-to-walk through the
 * 1-tile courtyard gate along a purple A* path; WASD cancels the line.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-path.js [port]
 */
(async function () {
    var port = process.argv[2] || '39310';
    var result = await require('./playwright-session').withGamePage(port, async function (page) {
    return await page.evaluate(function () {
        return new Promise(function (resolve, reject) {
            var world = window.game.scene.getScene('WorldScene');
            var hero = window.game.registry.get('hero');
            if (hero) {
                hero.autoAttack = false;
                window.game.registry.set('hero', hero);
            }
            var spawn = window.defaultWorldSpawn();
            world.placePlayer(spawn.x, spawn.y);
            world.clearWalk();
            world.engageTarget = null;
            world.talkTarget = null;
            world.encounterLock = false;
            var gate = window.HAVEN_GATE_TILE;
            var dest = window.tileCenter(gate.x + 4, gate.y);
            world.mobs.children.iterate(function (mob) {
                if (!mob) {
                    return;
                }
                mob.setPosition(80, 80);
                if (mob.body) {
                    mob.body.reset(80, 80);
                }
            });
            world.onClick({ worldX: dest.x, worldY: dest.y });
            if (!world.walkTarget || !world.walkPath || !world.walkPath.length) {
                reject(new Error('path not set'));
                return;
            }
            if (!world.pathGfx || !world.pathGfx.visible) {
                reject(new Error('purple path not visible'));
                return;
            }
            var usesGate = (world.walkPath || []).some(function (point) {
                var tile = window.worldToTile(point.x, point.y);
                return tile.tx === gate.x && tile.ty === gate.y;
            });
            if (!usesGate) {
                reject(new Error('path missed courtyard gate'));
                return;
            }
            var started = Date.now();
            var tick = function () {
                if (world.player.x > (gate.x + 1) * (window.TILE_SIZE || 16)) {
                    var throughX = world.player.x;
                    var ev = new KeyboardEvent('keydown', {
                        key: 'w',
                        code: 'KeyW',
                        keyCode: 87,
                        which: 87,
                        bubbles: true,
                        cancelable: true
                    });
                    (document.body || window).dispatchEvent(ev);
                    world.update();
                    if (world.walkTarget || (world.pathGfx && world.pathGfx.visible)) {
                        reject(new Error('WASD did not cancel path/line'));
                        return;
                    }
                    if (window.Keys) {
                        window.Keys.down = {};
                    }
                    resolve({
                        spawn: spawn,
                        throughX: throughX,
                        pathLen: world.walkPath ? world.walkPath.length : 0,
                        keyboard: window.game.input.keyboard,
                        color: window.PATH_LINE_COLOR
                    });
                    return;
                }
                if (Date.now() - started > 2500) {
                    reject(new Error('did not walk through gate, x=' + world.player.x));
                    return;
                }
                setTimeout(tick, 40);
            };
            tick();
        });
    });
    });

    if (result.keyboard) {
        throw new Error('Phaser keyboard was enabled');
    }
    if (result.color !== 0xaa66ff) {
        throw new Error('path color is not purple');
    }
    console.log('PASS click path', JSON.stringify(result));
})().catch(function (err) {
    console.error('FAIL', err && err.message ? err.message : err);
    process.exit(1);
});
