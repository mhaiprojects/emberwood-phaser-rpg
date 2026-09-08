/**
 * Playwright proof: from spawn (328, 248), a single-foe fight auto-selects
 * index 0 and Attack deals damage with variance −2..+2 (min 1).
 * Phaser keyboard stays off.
 *
 * Serve the repo, then:
 *   node tests/playwright-attack.js [port]
 */
(async function () {
    var port = process.argv[2] || '39310';
    var base = 'http://127.0.0.1:' + port + '/';
    var playwright;
    try {
        playwright = require('playwright');
    } catch (err) {
        var pw = await import('playwright');
        playwright = pw.default || pw;
    }
    var browser;
    try {
        browser = await playwright.chromium.launch({ headless: true });
    } catch (err) {
        browser = await playwright.chromium.launch({
            headless: true,
            executablePath: '/usr/bin/google-chrome-stable'
        });
    }
    var page = await browser.newPage();
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(function () {
        return window.Hud && window.Hud.el && window.Hud.el.start && !window.Hud.el.start.disabled && window.game;
    }, null, { timeout: 15000 });
    await page.click('#btn-start');
    await page.waitForFunction(function () {
        var world = window.game && window.game.scene && window.game.scene.getScene('WorldScene');
        return window.Hud && window.Hud.mode === 'world' && world && world.player;
    }, null, { timeout: 10000 });

    var result = await page.evaluate(function () {
        return new Promise(function (resolve, reject) {
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
            var hero = window.game.registry.get('hero');
            hero.autoAttack = false;
            window.game.registry.set('hero', hero);
            window.Hud.renderAutoAttack(hero);
            world.placePlayer(spawn.x, spawn.y);
            world.engageTarget = null;
            world.talkTarget = null;
            world.walkTarget = null;
            world.encounterLock = true;
            window.game.registry.set('pendingEncounter', {
                enemies: [{ type: 'Goblin', texture: 'slime', tint: 0x5aa33a, hp: 80, damage: 1, gold: 0, xp: 1 }]
            });
            world.scene.switch('BattleScene');

            var started = Date.now();
            var waitTurn = function () {
                var battle = window.game.scene.getScene('BattleScene');
                if (battle && battle.scene.isActive() && battle.isPlayerTurn() && battle.waitingForPlayer && battle.pickReady) {
                    finish(battle);
                    return;
                }
                if (Date.now() - started > 5000) {
                    reject(new Error('timed out waiting for player turn'));
                    return;
                }
                setTimeout(waitTurn, 40);
            };

            var finish = function (battle) {
                try {
                    if (battle.enemies.length !== 1) {
                        throw new Error('expected one foe');
                    }
                    if (battle.targetIndex !== 0) {
                        throw new Error('targetIndex is ' + battle.targetIndex + ' not 0');
                    }
                    var foe = battle.enemies[0];
                    var dmg = battle.heroes[0].damage;
                    if (dmg < 1) {
                        throw new Error('hero has no melee damage');
                    }
                    var orig = window.Phaser.Math.Between;
                    window.Phaser.Math.Between = function (lo, hi) {
                        if (lo !== -2 || hi !== 2) {
                            throw new Error('Between args ' + lo + ',' + hi);
                        }
                        return 0;
                    };
                    var mid = foe.takeDamage(dmg);
                    window.Phaser.Math.Between = function () { return -2; };
                    var low = foe.takeDamage(0);
                    window.Phaser.Math.Between = orig;
                    if (mid !== dmg) {
                        throw new Error('variance 0 dealt ' + mid + ' not ' + dmg);
                    }
                    if (low !== 1) {
                        throw new Error('min 1 failed, dealt ' + low);
                    }
                    var before = foe.hp;
                    window.Hud.tryAttack();
                    setTimeout(function () {
                        var drop = before - foe.hp;
                        battle.outcome = 'flee';
                        battle.endBattle();
                        resolve({
                            spawn: spawn,
                            targetIndex: 0,
                            damage: dmg,
                            mid: mid,
                            minHit: low,
                            attackDrop: drop,
                            keyboard: window.game.input.keyboard
                        });
                    }, 280);
                } catch (err) {
                    reject(err);
                }
            };
            waitTurn();
        });
    });

    if (result.keyboard) {
        throw new Error('Phaser keyboard was enabled');
    }
    if (result.attackDrop < 1 || result.attackDrop < result.damage - 2 || result.attackDrop > result.damage + 2) {
        throw new Error('Attack drop ' + result.attackDrop + ' outside 1..' + (result.damage + 2));
    }
    console.log(JSON.stringify(result));
    await browser.close();
})().catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
