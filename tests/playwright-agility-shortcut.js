/**
 * Playwright proof: from spawn (328, 248), the Millfields farm door
 * stays locked without an Iron key. The ROCK squeeze west of it
 * needs Agility 5 (test-set) and does not unlock the door.
 * Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-agility-shortcut.js [port]
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
                var gap = window.AGILITY_SHORTCUT;
                if (!door || door.zoneId !== 'millfields' || door.tx !== 26 || door.ty !== 17) {
                    reject(new Error('LOCKED_DOOR missing'));
                    return;
                }
                if (!gap || gap.tx !== 25 || gap.ty !== 17 || gap.level !== 5) {
                    reject(new Error('AGILITY_SHORTCUT missing'));
                    return;
                }
                if (typeof window.heroSkillLevel !== 'function') {
                    reject(new Error('heroSkillLevel missing'));
                    return;
                }

                world.enterZone('millfields', null);
                world.exitLock = true;
                world.encounterLock = false;
                var hero = window.game.registry.get('hero');
                hero.autoAttack = false;
                hero.skills.agility = hero.skills.agility || { level: 1, xp: 0 };
                hero.skills.agility.level = 1;
                window.game.registry.set('hero', hero);
                park(world.npcs);
                park(world.mobs);

                if (world.tileGrid[door.ty][door.tx] !== window.TILE.DOOR) {
                    reject(new Error('farm door is not TILE.DOOR'));
                    return;
                }
                if (world.tileGrid[gap.ty][gap.tx] !== window.TILE.ROCK) {
                    reject(new Error('shortcut tile is not ROCK'));
                    return;
                }

                var doorSouth = window.tileCenter(door.tx, door.ty + 1);
                var gapSouth = window.tileCenter(gap.tx, gap.ty + 1);
                var insideY = gap.ty * (window.TILE_SIZE || 16);
                world.placePlayer(doorSouth.x, doorSouth.y);
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

                            world.placePlayer(gapSouth.x, gapSouth.y);
                            world.player.body.setVelocity(0, 0);
                            if (world.clearWalk) {
                                world.clearWalk();
                            }
                            world.exitLock = true;
                            world.encounterLock = false;
                            dispatchKey('KeyW', 'w', 87, 'keydown');
                            phase = 'need';
                            started = Date.now();
                        }
                        setTimeout(tick, 40);
                        return;
                    }

                    if (phase === 'need') {
                        if (Date.now() - started > 500) {
                            dispatchKey('KeyW', 'w', 87, 'keyup');
                            if (window.Keys) {
                                window.Keys.down = {};
                            }
                            world.player.body.setVelocity(0, 0);
                            if (!(world.player.y > insideY)) {
                                reject(new Error('squeezed at Agility 1, y=' + world.player.y));
                                return;
                            }
                            if (lastChat() !== 'You need Agility level 5 to squeeze through.') {
                                reject(new Error('need-level chat was ' + lastChat()));
                                return;
                            }

                            hero.skills.agility.level = 5;
                            window.game.registry.set('hero', hero);
                            world.placePlayer(gapSouth.x, gapSouth.y);
                            world.player.body.setVelocity(0, 0);
                            if (world.clearWalk) {
                                world.clearWalk();
                            }
                            world.exitLock = true;
                            world.encounterLock = false;
                            world.shortcutLockUntil = 0;
                            dispatchKey('KeyW', 'w', 87, 'keydown');
                            phase = 'squeeze';
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
                        if (world.tileGrid[door.ty][door.tx] !== window.TILE.DOOR) {
                            reject(new Error('squeeze unlocked the farm door'));
                            return;
                        }
                        if (lastChat() !== 'You squeeze through the gap.') {
                            reject(new Error('squeeze chat was ' + lastChat()));
                            return;
                        }
                        if (window.heroHasItem(window.game.registry.get('hero'), 'key')) {
                            reject(new Error('squeeze granted a key'));
                            return;
                        }
                        if (window.game.input.keyboard) {
                            reject(new Error('Phaser keyboard turned on'));
                            return;
                        }
                        resolve({
                            spawn: spawn,
                            door: { tx: door.tx, ty: door.ty },
                            gap: { tx: gap.tx, ty: gap.ty },
                            insideY: world.player.y,
                            keyboard: !!window.game.input.keyboard
                        });
                        return;
                    }
                    if (Date.now() - started > 1500) {
                        dispatchKey('KeyW', 'w', 87, 'keyup');
                        if (window.Keys) {
                            window.Keys.down = {};
                        }
                        reject(new Error('did not squeeze through, y=' + world.player.y));
                        return;
                    }
                    setTimeout(tick, 40);
                };
                tick();
            });
        });

        var only = encodeURIComponent('world: agility shortcut squeezes beside the locked farm door');
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
    console.log('PASS 1/1 agility shortcut vs door', result.suite, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
