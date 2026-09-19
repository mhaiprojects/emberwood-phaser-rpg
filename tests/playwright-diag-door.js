/**
 * Playwright proof: from a south-offset approach, Keys.js W+D threads the
 * Emberhaven 1-tile courtyard gate without catching the ROCK frame.
 * Phaser keyboard stays off. Straight D through the aligned door still works.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-diag-door.js [port]
 */
(async function () {
    var port = process.argv[2] || '8765';
    var session = require('./playwright-session');
    var result = await session.withGamePage(port, async function (page, opened) {
        var live = await page.evaluate(function () {
            return new Promise(function (resolve, reject) {
                var world = window.game.scene.getScene('WorldScene');
                var hero = window.game.registry.get('hero');
                if (hero) {
                    hero.autoAttack = false;
                    window.game.registry.set('hero', hero);
                }
                world.enterZone('haven', null);
                world.encounterLock = false;
                world.walkTarget = null;
                world.engageTarget = null;
                world.talkTarget = null;
                if (world.clearWalk) {
                    world.clearWalk();
                }
                function park(group) {
                    group.getChildren().forEach(function (obj) {
                        if (obj.body) {
                            obj.body.enable = false;
                            obj.body.setVelocity(0, 0);
                        }
                        obj.setPosition(24, 24);
                    });
                }
                park(world.npcs);
                park(world.mobs);

                var spawn = window.defaultWorldSpawn();
                var gate = window.HAVEN_GATE_TILE;
                var tile = window.TILE_SIZE || 16;
                var doorWest = gate.x * tile;
                var doorEast = (gate.x + 1) * tile;
                var gapY = window.tileCenter(gate.x, gate.y).y;
                var startX = doorWest - 8;
                var startY = gapY + 6;
                world.placePlayer(startX, startY);
                if (window.game.input.keyboard) {
                    reject(new Error('Phaser keyboard must stay off'));
                    return;
                }
                if (typeof window.slideIntoOneTileGap !== 'function') {
                    reject(new Error('slideIntoOneTileGap missing'));
                    return;
                }
                if (String(window.Phaser.VERSION).indexOf('3.') !== 0) {
                    reject(new Error('Phaser is ' + window.Phaser.VERSION + ' not 3.x'));
                    return;
                }

                function keyEv(type, key, code, keyCode) {
                    return new KeyboardEvent(type, {
                        key: key,
                        code: code,
                        keyCode: keyCode,
                        which: keyCode,
                        bubbles: true,
                        cancelable: true
                    });
                }
                var target = document.body || window;
                target.dispatchEvent(keyEv('keydown', 'w', 'KeyW', 87));
                target.dispatchEvent(keyEv('keydown', 'd', 'KeyD', 68));
                var started = Date.now();
                var tick = function () {
                    if (world.player.x > doorEast) {
                        var throughX = world.player.x;
                        var throughY = world.player.y;
                        target.dispatchEvent(keyEv('keyup', 'w', 'KeyW', 87));
                        target.dispatchEvent(keyEv('keyup', 'd', 'KeyD', 68));
                        if (window.Keys) {
                            window.Keys.down = {};
                            window.Keys.pressed = {};
                        }
                        if (!(Math.abs(throughY - gapY) < 16)) {
                            reject(new Error('caught the frame, y=' + throughY));
                            return;
                        }
                        var wall = window.tileCenter(gate.x - 1, gate.y + 1);
                        world.placePlayer(wall.x, wall.y);
                        target.dispatchEvent(keyEv('keydown', 'd', 'KeyD', 68));
                        setTimeout(function () {
                            var blockedX = world.player.x;
                            target.dispatchEvent(keyEv('keyup', 'd', 'KeyD', 68));
                            if (window.Keys) {
                                window.Keys.down = {};
                            }
                            if (!(blockedX < doorWest + 8)) {
                                reject(new Error('walked through solid wall, x=' + blockedX));
                                return;
                            }
                            world.placePlayer(spawn.x, spawn.y);
                            resolve({
                                spawn: spawn,
                                throughX: throughX,
                                throughY: throughY,
                                blockedX: blockedX,
                                keyboard: window.game.input.keyboard
                            });
                        }, 400);
                        return;
                    }
                    if (Date.now() - started > 1500) {
                        reject(new Error('W+D did not pass 1-tile door, x=' + world.player.x + ' y=' + world.player.y));
                        return;
                    }
                    setTimeout(tick, 30);
                };
                setTimeout(tick, 30);
            });
        });

        var only = encodeURIComponent('1-tile door');
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

    if (result.live && result.live.keyboard) {
        throw new Error('Phaser keyboard was enabled');
    }
    console.log('PASS 1/1 diagonal door', result.suite, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
