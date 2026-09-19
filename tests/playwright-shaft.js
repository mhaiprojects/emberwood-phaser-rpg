/**
 * Playwright proof: from spawn (328, 248), Darkmine's lower-shaft door
 * enters a second indoor Phaser 3 tilemap; Miner Corb stays in Darkmine.
 * Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-shaft.js [port]
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
                function findNpc(world, key) {
                    var found = null;
                    world.npcs.getChildren().forEach(function (npc) {
                        if (npc.npcDef && npc.npcDef.key === key) {
                            found = npc;
                        }
                    });
                    return found;
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
                function dispatchKey(code, key, type) {
                    var event = new KeyboardEvent(type, {
                        key: key,
                        code: code,
                        keyCode: 87,
                        which: 87,
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

                world.enterZone('darkmine', null);
                world.exitLock = false;
                world.encounterLock = false;
                var hero = window.game.registry.get('hero');
                hero.autoAttack = false;
                window.game.registry.set('hero', hero);

                var corb = findNpc(world, 'miner');
                if (!corb || Math.round(corb.x) !== 210 || Math.round(corb.y) !== 200) {
                    reject(new Error('Miner Corb missing from Darkmine'));
                    return;
                }
                var shaft = window.interiorById('shaft');
                if (!shaft || shaft.zoneId !== 'darkmine' || shaft.doorTx !== 9 || shaft.doorTy !== 12) {
                    reject(new Error('shaft def missing'));
                    return;
                }
                if (world.tileGrid[shaft.doorTy][shaft.doorTx] !== window.TILE.PATH) {
                    reject(new Error('shaft door is not PATH'));
                    return;
                }

                park(world.npcs);
                park(world.mobs);
                var south = window.tileCenter(shaft.doorTx, shaft.doorTy + 1);
                world.placePlayer(south.x, south.y);
                world.player.body.setVelocity(0, 0);
                if (world.clearWalk) {
                    world.clearWalk();
                }
                world.exitLock = false;
                world.encounterLock = false;
                dispatchKey('KeyW', 'w', 'keydown');

                var started = Date.now();
                var tick = function () {
                    if (world.interiorId === 'shaft') {
                        dispatchKey('KeyW', 'w', 'keyup');
                        if (window.Keys) {
                            window.Keys.down = {};
                        }
                        world.player.body.setVelocity(0, 0);
                        if (world.zoneId !== 'darkmine') {
                            reject(new Error('parent zone left Darkmine'));
                            return;
                        }
                        if (document.getElementById('hud-zone').textContent !== 'Darkmine Lower Shaft') {
                            reject(new Error('HUD title is ' + document.getElementById('hud-zone').textContent));
                            return;
                        }
                        if (lastChat() !== 'You enter Darkmine Lower Shaft.') {
                            reject(new Error('enter chat was ' + lastChat()));
                            return;
                        }
                        if (world.npcs.getChildren().length !== 0 || findNpc(world, 'miner')) {
                            reject(new Error('Corb followed into the shaft'));
                            return;
                        }
                        if (window.game.input.keyboard) {
                            reject(new Error('Phaser keyboard turned on indoors'));
                            return;
                        }

                        world.exitLock = false;
                        world.leaveInterior();
                        corb = findNpc(world, 'miner');
                        if (world.interiorId || world.zoneId !== 'darkmine') {
                            reject(new Error('did not return to Darkmine'));
                            return;
                        }
                        if (!corb || Math.round(corb.x) !== 210 || Math.round(corb.y) !== 200) {
                            reject(new Error('Miner Corb did not stay in Darkmine'));
                            return;
                        }
                        if (window.game.input.keyboard) {
                            reject(new Error('Phaser keyboard turned on'));
                            return;
                        }
                        resolve({
                            spawn: spawn,
                            interiorId: 'shaft',
                            zoneId: world.zoneId,
                            corb: { x: Math.round(corb.x), y: Math.round(corb.y) },
                            keyboard: !!window.game.input.keyboard
                        });
                        return;
                    }
                    if (Date.now() - started > 1500) {
                        dispatchKey('KeyW', 'w', 'keyup');
                        if (window.Keys) {
                            window.Keys.down = {};
                        }
                        reject(new Error('did not enter shaft, interiorId=' + world.interiorId));
                        return;
                    }
                    setTimeout(tick, 40);
                };
                tick();
            });
        });

        var only = encodeURIComponent('world: Darkmine lower shaft is a second indoor mine room');
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
    console.log('PASS 1/1 Darkmine lower shaft', result.suite, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
