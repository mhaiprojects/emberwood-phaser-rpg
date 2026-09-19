/**
 * Playwright proof: from spawn (328, 248), equipped bronze sword damage
 * and wooden shield defence apply in Unit.attack / takeDamage even when
 * hero.damage is 24. Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-equip-hit.js [port]
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
            if (typeof window.equippedWeaponDamage !== 'function' || typeof window.equippedShieldDefence !== 'function') {
                throw new Error('equipped weapon/shield helpers missing');
            }
            if (window.ITEM_DB.sword.damage !== 16 || window.ITEM_DB.shield.defence !== 1) {
                throw new Error('ITEM_DB sword/shield stats are wrong');
            }

            world.enterZone('haven', null);
            world.exitLock = false;
            world.encounterLock = false;
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);

            var hero = window.game.registry.get('hero');
            if (hero.equipment.weapon !== 'sword' || hero.equipment.shield !== 'shield') {
                throw new Error('starter is not wearing sword and shield');
            }
            hero.autoAttack = false;
            hero.damage = 24;
            window.game.registry.set('hero', hero);
            window.Hud.renderAutoAttack(hero);
            world.refreshHud();

            if (window.equippedWeaponDamage(hero, hero.damage) !== 16) {
                throw new Error('worn sword did not override hero.damage 24');
            }
            if (window.equippedShieldDefence(hero) !== 1) {
                throw new Error('worn shield defence is not 1');
            }

            world.encounterLock = true;
            window.game.registry.set('pendingEncounter', {
                enemies: [{ type: 'Goblin', texture: 'slime', tint: 0x5aa33a, hp: 80, damage: 8, gold: 0, xp: 1 }]
            });
            world.scene.switch('BattleScene');
            return {
                spawn: spawn,
                player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                keyboard: !!window.game.input.keyboard,
                phaser: window.Phaser.VERSION
            };
        });

        await page.waitForFunction(function () {
            var battle = window.game && window.game.scene && window.game.scene.getScene('BattleScene');
            return !!(battle && window.game.scene.isActive('BattleScene') &&
                battle.waitingForPlayer && battle.isPlayerTurn && battle.isPlayerTurn());
        }, null, { timeout: 4000 });

        var battleLive = await page.evaluate(function () {
            var battle = window.game.scene.getScene('BattleScene');
            var you = battle.heroes[0];
            var foe = battle.enemies[0];
            var hero = window.game.registry.get('hero');
            if (you.damage !== 24) {
                throw new Error('battle sprite damage is ' + you.damage + ' not 24');
            }
            if (window.equippedWeaponDamage(hero, you.damage) !== 16) {
                throw new Error('live attack helper is not sword 16');
            }
            var orig = window.Phaser.Math.Between;
            window.Phaser.Math.Between = function (lo, hi) {
                if (lo !== -2 || hi !== 2) {
                    throw new Error('Between args ' + lo + ',' + hi);
                }
                return 0;
            };
            var before = foe.hp;
            you.attack(foe);
            return new Promise(function (resolve, reject) {
                var started = Date.now();
                var tick = function () {
                    if (foe.hp < before) {
                        var outgoing = before - foe.hp;
                        var incoming = you.takeDamage(8);
                        window.unequipItem(hero, 'weapon');
                        window.game.registry.set('hero', hero);
                        var unarmedBefore = foe.hp;
                        you.attack(foe);
                        var waitUnarmed = function () {
                            if (foe.hp < unarmedBefore) {
                                var unarmed = unarmedBefore - foe.hp;
                                window.unequipItem(hero, 'shield');
                                window.game.registry.set('hero', hero);
                                var bare = you.takeDamage(8);
                                window.Phaser.Math.Between = orig;
                                battle.outcome = 'flee';
                                battle.endBattle();
                                resolve({
                                    outgoing: outgoing,
                                    incoming: incoming,
                                    unarmed: unarmed,
                                    bare: bare,
                                    keyboard: !!window.game.input.keyboard
                                });
                                return;
                            }
                            if (Date.now() - started > 2000) {
                                window.Phaser.Math.Between = orig;
                                reject(new Error('live unarmed hit did not land'));
                                return;
                            }
                            setTimeout(waitUnarmed, 40);
                        };
                        waitUnarmed();
                        return;
                    }
                    if (Date.now() - started > 2000) {
                        window.Phaser.Math.Between = orig;
                        reject(new Error('live worn-sword hit did not land'));
                        return;
                    }
                    setTimeout(tick, 40);
                };
                tick();
            });
        });

        if (battleLive.outgoing !== 16) {
            throw new Error('live worn-sword hit is ' + battleLive.outgoing + ' not 16');
        }
        if (battleLive.incoming !== 7) {
            throw new Error('live shielded hit is ' + battleLive.incoming + ' not 7');
        }
        if (battleLive.unarmed !== 24) {
            throw new Error('live unarmed hit is ' + battleLive.unarmed + ' not 24');
        }
        if (battleLive.bare !== 8) {
            throw new Error('live unshielded hit is ' + battleLive.bare + ' not 8');
        }

        var dedicated = await runOnly(
            page,
            opened,
            'combat: equipped weapon damage and shield defence apply to hits'
        );
        return { live: live, battleLive: battleLive, dedicated: dedicated };
    });

    if (result.live.player.x !== 328 || result.live.player.y !== 248) {
        throw new Error('did not start at spawn: ' + result.live.player.x + ',' + result.live.player.y);
    }
    if (result.live.keyboard || result.battleLive.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    console.log('PASS 1/1 equipped weapon damage and shield defence', result.dedicated, JSON.stringify({
        live: result.live,
        battleLive: result.battleLive
    }));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
