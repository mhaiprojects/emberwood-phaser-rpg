/**
 * Playwright proof: from spawn (328, 248), the Millfields farm door
 * stays locked until an Iron key, then a visible leaf tweens open to PATH
 * and closes when the player walks away. Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-door-anim.js [port]
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
                if (typeof world.playDoorOpen !== 'function' || typeof world.playDoorClose !== 'function') {
                    reject(new Error('door open/close helpers missing'));
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
                var doorKey = world.doorUnlockKey(door.tx, door.ty);
                world.placePlayer(south.x, south.y);
                world.player.body.setVelocity(0, 0);
                if (world.clearWalk) {
                    world.clearWalk();
                }
                dispatchKey('KeyW', 'w', 87, 'keydown');

                var started = Date.now();
                var phase = 'locked';
                var openScale = null;
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

                    if (phase === 'unlock') {
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
                            var fx = world.doorFx[doorKey];
                            if (!fx || !fx.leaf || !fx.leaf.active) {
                                reject(new Error('open leaf missing'));
                                return;
                            }
                            if (!(fx.leaf.scaleX < 1)) {
                                reject(new Error('open leaf did not tween, scaleX=' + fx.leaf.scaleX));
                                return;
                            }
                            openScale = fx.leaf.scaleX;
                            var away = window.tileCenter(door.tx, door.ty + 3);
                            world.placePlayer(away.x, away.y);
                            world.player.body.setVelocity(0, 0);
                            if (world.clearWalk) {
                                world.clearWalk();
                            }
                            phase = 'close';
                            started = Date.now();
                            setTimeout(tick, 40);
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
                        return;
                    }

                    if (phase === 'close') {
                        if (world.tileGrid[door.ty][door.tx] === window.TILE.DOOR && !world.doorFx[doorKey]) {
                            if (!world.unlockedDoors[doorKey]) {
                                reject(new Error('close re-locked the door'));
                                return;
                            }
                            world.placePlayer(south.x, south.y);
                            world.player.body.setVelocity(0, 0);
                            if (world.clearWalk) {
                                world.clearWalk();
                            }
                            world.exitLock = true;
                            world.encounterLock = false;
                            dispatchKey('KeyW', 'w', 87, 'keydown');
                            phase = 'reopen';
                            started = Date.now();
                            setTimeout(tick, 40);
                            return;
                        }
                        if (Date.now() - started > 1500) {
                            reject(new Error('door did not close after walking away'));
                            return;
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
                            reject(new Error('reopened door is not PATH'));
                            return;
                        }
                        if (lastChat() !== 'You open the door.') {
                            reject(new Error('reopen chat was ' + lastChat()));
                            return;
                        }
                        if (window.game.input.keyboard) {
                            reject(new Error('Phaser keyboard turned on'));
                            return;
                        }
                        resolve({
                            spawn: spawn,
                            door: { tx: door.tx, ty: door.ty },
                            openScale: openScale,
                            reopenedY: world.player.y,
                            keyboard: !!window.game.input.keyboard
                        });
                        return;
                    }
                    if (Date.now() - started > 1500) {
                        dispatchKey('KeyW', 'w', 87, 'keyup');
                        if (window.Keys) {
                            window.Keys.down = {};
                        }
                        reject(new Error('did not re-enter closed unlocked door, y=' + world.player.y));
                        return;
                    }
                    setTimeout(tick, 40);
                };
                tick();
            });
        });

        var only = encodeURIComponent('door open/close animation');
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
    console.log('PASS 1/1 door open/close', result.suite, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
