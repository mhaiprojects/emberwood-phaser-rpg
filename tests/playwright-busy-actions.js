/**
 * Playwright proof: from spawn (328, 248), Attack / Eat / Run disable
 * while busy or not player-turn and a second action does not replace
 * the queued turn. Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-busy-actions.js [port]
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
            world.enterZone('haven', null);
            world.exitLock = false;
            world.encounterLock = false;
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            var hero = window.game.registry.get('hero');
            hero.autoAttack = false;
            hero.autoRetaliate = false;
            window.game.registry.set('hero', hero);
            if (window.Hud && window.Hud.renderAutoAttack) {
                window.Hud.renderAutoAttack(hero);
            }
            if (window.Hud && window.Hud.renderAutoRetaliate) {
                window.Hud.renderAutoRetaliate(hero);
            }

            world.encounterLock = true;
            window.game.registry.set('pendingEncounter', {
                enemies: [{ type: 'Goblin', texture: 'slime', tint: 0x5aa33a, hp: 80, damage: 1, gold: 0, xp: 1 }]
            });
            world.scene.switch('BattleScene');
            return {
                spawn: spawn,
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
            var hero = window.game.registry.get('hero');
            var attackBtn = document.querySelector('#battle-actions [data-action="attack"]');
            var eatBtn = document.querySelector('#battle-actions [data-action="heal"]');
            var runBtn = document.querySelector('#battle-actions [data-action="flee"]');
            if (attackBtn.disabled || eatBtn.disabled || runBtn.disabled) {
                throw new Error('live actions should be enabled on player turn');
            }
            battle.heroes[0].hp = 50;
            hero.hp = 50;
            window.game.registry.set('hero', hero);
            var shrimp = (hero.inventory || []).filter(function (s) { return s && s.id === 'shrimp'; })[0];
            var foodBefore = shrimp ? shrimp.qty : 0;
            var swings = 0;
            var origAttack = battle.heroes[0].attack;
            battle.heroes[0].attack = function () {
                swings += 1;
                return origAttack.apply(this, arguments);
            };
            attackBtn.click();
            if (swings !== 1) {
                throw new Error('live Attack should swing once, got ' + swings);
            }
            if (!battle.busy || battle.waitingForPlayer) {
                throw new Error('live Attack should mark busy');
            }
            if (!attackBtn.disabled || !eatBtn.disabled || !runBtn.disabled) {
                throw new Error('live actions should disable while busy');
            }
            var queued = battle.turnTimer;
            if (!queued || queued.delay !== 900) {
                throw new Error('live Attack did not queue 900ms');
            }
            window.Hud.tryAttack();
            window.Hud.setActionsEnabled(true);
            attackBtn.click();
            eatBtn.click();
            runBtn.click();
            battle.receivePlayerSelection('attack', 0);
            battle.receivePlayerSelection('heal');
            battle.receivePlayerSelection('flee');
            hero = window.game.registry.get('hero');
            shrimp = (hero.inventory || []).filter(function (s) { return s && s.id === 'shrimp'; })[0];
            if (swings !== 1) {
                throw new Error('live double Attack queued a second swing');
            }
            if (battle.turnTimer !== queued) {
                throw new Error('live busy spam replaced the turn timer');
            }
            if ((shrimp ? shrimp.qty : 0) !== foodBefore) {
                throw new Error('live Eat while busy consumed food');
            }
            if (battle.outcome === 'flee') {
                throw new Error('live Run while busy fled');
            }
            battle.outcome = 'flee';
            battle.endBattle();
            return {
                swings: swings,
                delay: queued.delay,
                foodBefore: foodBefore,
                keyboard: !!window.game.input.keyboard
            };
        });

        var dedicated = await runOnly(
            page,
            opened,
            'combat: Attack Eat Run no-op while busy or not player-turn'
        );
        return { live: live, battleLive: battleLive, dedicated: dedicated };
    });

    if (result.live.spawn.x !== 328 || result.live.spawn.y !== 248) {
        throw new Error('spawn is ' + result.live.spawn.x + ',' + result.live.spawn.y + ' not 328,248');
    }
    if (result.live.keyboard || result.battleLive.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    if (result.battleLive.swings !== 1) {
        throw new Error('live swings is ' + result.battleLive.swings + ' not 1');
    }
    if (result.battleLive.delay !== 900) {
        throw new Error('live delay is ' + result.battleLive.delay + ' not 900');
    }
    console.log('PASS 1/1 busy Attack/Eat/Run no double-queue', result.dedicated, JSON.stringify({
        live: result.live,
        battleLive: result.battleLive
    }));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
