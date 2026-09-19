/**
 * Playwright proof: from spawn (328, 248), melee / ranged / magic is a
 * combat-triangle hook (melee beats ranged, ranged beats magic, magic
 * beats melee) without Phaser 4. Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-triangle.js [port]
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
            if (typeof window.triangleHit !== 'function' || typeof window.mobCombatClass !== 'function') {
                throw new Error('combat triangle helpers missing');
            }
            world.enterZone('haven', null);
            world.exitLock = false;
            world.encounterLock = false;
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            var hero = window.makeHero();
            window.game.registry.set('hero', hero);
            world.refreshHud();

            if (hero.stance !== 'melee' || window.heroCombatClass(hero) !== 'melee') {
                throw new Error('starter stance is ' + hero.stance + ' not melee');
            }
            if (window.mobCombatClass('Chicken') !== 'melee' || window.mobCombatClass('Bat') !== 'ranged' ||
                window.mobCombatClass('Slime') !== 'magic') {
                throw new Error('mob combat classes are wrong');
            }
            if (window.triangleMultiplier('melee', 'ranged') !== 1.25 ||
                window.triangleMultiplier('melee', 'magic') !== 0.75 ||
                window.triangleHit(16, 'melee', 'ranged') !== 20) {
                throw new Error('triangle numbers are wrong');
            }
            hero.stance = 'ranged';
            if (window.combatSkill(hero) !== 'ranged') {
                throw new Error('ranged stance did not hook Ranged skill');
            }
            hero.stance = 'magic';
            if (window.combatSkill(hero) !== 'magic') {
                throw new Error('magic stance did not hook Magic skill');
            }
            hero.stance = 'melee';
            window.game.registry.set('hero', hero);

            var chicken = null;
            world.mobs.getChildren().forEach(function (mob) {
                if (!chicken && mob.aliveMob && mob.mobDef && mob.mobDef.type === 'Chicken') {
                    chicken = mob;
                }
            });
            if (!chicken || chicken.mobDef.combatClass !== 'melee') {
                throw new Error('haven chicken is not tagged melee');
            }

            world.encounterLock = true;
            window.game.registry.set('pendingEncounter', {
                enemies: [{ type: 'Bat', texture: 'slime', tint: 0xddbbff, hp: 80, damage: 8, gold: 0, xp: 1 }]
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
            if (you.combatClass !== 'melee') {
                throw new Error('live hero combatClass is ' + you.combatClass);
            }
            if (foe.combatClass !== 'ranged') {
                throw new Error('live Bat combatClass is ' + foe.combatClass);
            }
            var orig = window.Phaser.Math.Between;
            window.Phaser.Math.Between = function () { return 0; };
            var before = foe.hp;
            you.attack(foe);
            return new Promise(function (resolve, reject) {
                var started = Date.now();
                var tick = function () {
                    if (foe.hp < before) {
                        window.Phaser.Math.Between = orig;
                        resolve({
                            drop: before - foe.hp,
                            heroClass: you.combatClass,
                            foeClass: foe.combatClass,
                            keyboard: !!window.game.input.keyboard
                        });
                        return;
                    }
                    if (Date.now() - started > 2000) {
                        window.Phaser.Math.Between = orig;
                        reject(new Error('live melee vs Bat did not land'));
                        return;
                    }
                    setTimeout(tick, 40);
                };
                tick();
            });
        });

        if (battleLive.drop !== 20) {
            throw new Error('live melee vs Bat drop is ' + battleLive.drop + ' not 20');
        }

        var dedicated = await runOnly(
            page,
            opened,
            'combat: melee vs ranged vs magic triangle hook'
        );
        return { live: live, battleLive: battleLive, dedicated: dedicated };
    });

    if (result.live.spawn.x !== 328 || result.live.spawn.y !== 248) {
        throw new Error('spawn is ' + result.live.spawn.x + ',' + result.live.spawn.y + ' not 328,248');
    }
    if (result.live.keyboard || result.battleLive.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    if (result.battleLive.drop !== 20) {
        throw new Error('live drop is ' + result.battleLive.drop + ' not 20');
    }
    console.log('PASS 1/1 combat triangle hook', result.dedicated, JSON.stringify({
        live: result.live,
        battleLive: result.battleLive
    }));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
