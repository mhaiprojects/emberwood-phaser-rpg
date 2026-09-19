/**
 * Playwright proof: giant Drake bodies occupy 2x2 tiles and cannot squeeze
 * through Emberhaven 1-tile doors; the player still walks the courtyard gate.
 * Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-giant.js [port]
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
                world.exitLock = true;
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
                if (!window.isGiantMob || !window.isGiantMob('Drake')) {
                    reject(new Error('Drake is not a giant'));
                    return;
                }
                world.placePlayer(spawn.x, spawn.y);
                world.player.body.setVelocity(0, 0);

                var away = window.tileCenter(8, 22);
                var gate = window.HAVEN_GATE_TILE;
                var tile = window.TILE_SIZE || 16;
                var doorEast = (gate.x + 1) * tile;
                var stand = window.tileCenter(gate.x - 2, gate.y);
                var origWander = world.wanderMobs;
                world.wanderMobs = function () {};

                var drake = world.physics.add.sprite(stand.x, stand.y, 'mob-drake', 0);
                world.mobs.add(drake);
                drake.setScale(window.mobScaleFor('Drake', 'world'));
                window.applyMobWorldBody(drake, 'Drake');
                drake.mobDef = { type: 'Drake', id: 'test-giant' };
                drake.aliveMob = true;
                world.physics.add.collider(drake, world.ground);
                world.physics.add.collider(world.player, drake);

                world.mobs.getChildren().forEach(function (mob) {
                    if (mob !== drake) {
                        mob.aliveMob = false;
                    }
                });
                var occ = world.collectOccupiedTiles(-200, -200);
                var footprint = window.giantFootprintTiles(drake.x, drake.y);
                if (footprint.length !== 4) {
                    world.wanderMobs = origWander;
                    reject(new Error('footprint is ' + footprint.length + ' not 2x2'));
                    return;
                }
                var i;
                for (i = 0; i < footprint.length; i++) {
                    var key = footprint[i].tx + ',' + footprint[i].ty;
                    if (!occ[key]) {
                        world.wanderMobs = origWander;
                        reject(new Error('occupancy missed ' + key));
                        return;
                    }
                }

                world.placePlayer(away.x, away.y);
                world.player.body.setVelocity(0, 0);
                drake.body.setVelocity(80, 0);
                setTimeout(function () {
                    drake.body.setVelocity(0, 0);
                    if (!(drake.x < doorEast)) {
                        world.wanderMobs = origWander;
                        reject(new Error('drake passed 1-tile gate, x=' + drake.x));
                        return;
                    }
                    var bank = window.interiorById('bank');
                    var doorPt = window.tileCenter(bank.doorTx, bank.doorTy);
                    var south = window.tileCenter(bank.doorTx, bank.doorTy + 2);
                    drake.setPosition(south.x, south.y);
                    drake.body.reset(south.x, south.y);
                    drake.body.setVelocity(0, -80);
                    setTimeout(function () {
                        drake.body.setVelocity(0, 0);
                        if (!(drake.y > doorPt.y - 8)) {
                            world.wanderMobs = origWander;
                            reject(new Error('drake entered 1-tile interior, y=' + drake.y));
                            return;
                        }
                        if (drake.body) {
                            drake.body.enable = false;
                            drake.body.setVelocity(0, 0);
                        }
                        drake.aliveMob = false;
                        drake.setPosition(24, 24);
                        world.placePlayer(spawn.x, spawn.y);
                        world.player.body.setVelocity(0, 0);
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
                            world.wanderMobs = origWander;
                            if (!(throughX > doorEast)) {
                                reject(new Error('player did not pass 1-tile door, x=' + throughX));
                                return;
                            }
                            world.placePlayer(spawn.x, spawn.y);
                            resolve({
                                spawn: spawn,
                                drakeX: Math.round(drake.x),
                                throughX: throughX,
                                occ: Object.keys(occ).length,
                                keyboard: window.game.input.keyboard
                            });
                        }, 700);
                    }, 800);
                }, 800);
            });
        });

        var only = encodeURIComponent('giant mobs block 2x2');
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
    console.log('PASS 1/1 giant 2x2', result.suite, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
