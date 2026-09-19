/**
 * Playwright proof: from spawn (328, 248), the Millfields farm door
 * stays locked until the player has an Iron key (test-granted).
 * Phaser keyboard stays off. No door open/close animation this tick.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-locked-door.js [port]
 */
(async function () {
    var port = process.argv[2] || '8765';
    var session = require('./playwright-session');
    var result = await session.withGamePage(port, async function (page, opened) {
        var live = await page.evaluate(function () {
            return new Promise(function (resolve, reject) {
                function lastChat() {
                    var lines = document.querySelectorAll('.chat-line');
                    return lines.length ? lines[lines.length - 1].textContent : '';
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
                function dispatchKey(code, key, keyCode, type) {
                    var event = new KeyboardEvent(type, {
                        key: key,
                        code: code,
                        keyCode: keyCode,
                        which: keyCode,
                        bubbles: true,
                        cancelable: true
                    });
                    (document.body || window).dispatchEvent(event);
                }

                var world = window.game.scene.getScene('WorldScene');
                var spawn = window.defaultWorldSpawn();
                if (spawn.x !== 328 || spawn.y !== 248) {
                    reject(new Error('spawn is ' + spawn.x + ',' + spawn.y + ' not 328,248'));
                    return;
                }
                if (window.game.input.keyboard) {
                    reject(new Error('Phaser keyboard must stay off'));
                    return;
                }
                if (String(window.Phaser.VERSION).indexOf('3.90') !== 0) {
                    reject(new Error('Phaser is ' + window.Phaser.VERSION + ' not 3.90'));
                    return;
                }

                var door = window.LOCKED_DOOR;
                if (!door || door.zoneId !== 'millfields' || door.tx !== 26 || door.ty !== 17) {
                    reject(new Error('LOCKED_DOOR missing'));
                    return;
                }
                if (!window.ITEM_DB.key || window.TILE.DOOR !== 16) {
                    reject(new Error('key item or TILE.DOOR missing'));
                    return;
                }

                world.enterZone('millfields', null);
                world.exitLock = true;
                world.encounterLock = false;
                var hero = window.game.registry.get('hero');
                hero.autoAttack = false;
                window.game.registry.set('hero', hero);
                park(world.npcs);
                park(world.mobs);

                if (world.tileGrid[door.ty][door.tx] !== window.TILE.DOOR) {
                    reject(new Error('farm door is not TILE.DOOR'));
                    return;
                }

                var south = window.tileCenter(door.tx, door.ty + 1);
                var insideY = door.ty * (window.TILE_SIZE || 16);
                world.placePlayer(south.x, south.y);
                world.player.body.setVelocity(0, 0);
                if (world.clearWalk) {
                    world.clearWalk();
                }
                dispatchKey('KeyW', 'w', 87, 'keydown');

                var started = Date.now();
                var phase = 'locked';
                var tick = function () {
                    if (phase === 'locked') {
                        if (Date.now() - started > 500) {
                            dispatchKey('KeyW', 'w', 87, 'keyup');
                            if (window.Keys) {
                                window.Keys.down = {};
                            }
                            world.player.body.setVelocity(0, 0);
                            if (!(world.player.y > insideY)) {
                                reject(new Error('walked through locked door, y=' + world.player.y));
                                return;
                            }
                            if (lastChat() !== 'The door is locked.') {
                                reject(new Error('locked chat was ' + lastChat()));
                                return;
                            }
                            if (world.tileGrid[door.ty][door.tx] !== window.TILE.DOOR) {
                                reject(new Error('door unlocked without a key'));
                                return;
                            }

                            window.addItem(hero, 'key', 1);
                            window.game.registry.set('hero', hero);
                            world.placePlayer(south.x, south.y);
                            world.player.body.setVelocity(0, 0);
                            if (world.clearWalk) {
                                world.clearWalk();
                            }
                            world.exitLock = true;
                            world.encounterLock = false;
                            dispatchKey('KeyW', 'w', 87, 'keydown');
                            phase = 'unlock';
                            started = Date.now();
                        }
                        setTimeout(tick, 40);
                        return;
                    }

                    if (world.player.y < insideY) {
                        dispatchKey('KeyW', 'w', 87, 'keyup');
                        if (window.Keys) {
                            window.Keys.down = {};
                        }
                        world.player.body.setVelocity(0, 0);
                        if (world.tileGrid[door.ty][door.tx] !== window.TILE.PATH) {
                            reject(new Error('unlocked door is not PATH'));
                            return;
                        }
                        if (lastChat() !== 'You unlock the door.') {
                            reject(new Error('unlock chat was ' + lastChat()));
                            return;
                        }
                        if (!window.heroHasItem(window.game.registry.get('hero'), 'key')) {
                            reject(new Error('key was consumed'));
                            return;
                        }
                        if (window.game.input.keyboard) {
                            reject(new Error('Phaser keyboard turned on'));
                            return;
                        }
                        resolve({
                            spawn: spawn,
                            door: { tx: door.tx, ty: door.ty },
                            unlockedY: world.player.y,
                            keyboard: !!window.game.input.keyboard
                        });
                        return;
                    }
                    if (Date.now() - started > 1500) {
                        dispatchKey('KeyW', 'w', 87, 'keyup');
                        if (window.Keys) {
                            window.Keys.down = {};
                        }
                        reject(new Error('did not enter unlocked door, y=' + world.player.y));
                        return;
                    }
                    setTimeout(tick, 40);
                };
                tick();
            });
        });

        var only = encodeURIComponent('world: locked door blocks until the player has a key');
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
    console.log('PASS 1/1 locked door + key', result.suite, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
