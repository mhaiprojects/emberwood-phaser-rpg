/**
 * Playwright proof: from spawn (328, 248), battle hits reuse ± floaters
 * as hit-splats and Attack still queues the next turn at 900ms (no 0.6s
 * real-time tick). Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-hitsplats.js [port]
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
            if (window.BATTLE_TURN_QUEUE_MS !== 900) {
                throw new Error('BATTLE_TURN_QUEUE_MS is ' + window.BATTLE_TURN_QUEUE_MS + ' not 900');
            }
            world.enterZone('haven', null);
            world.exitLock = false;
            world.encounterLock = false;
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);

            world.encounterLock = true;
            window.game.registry.set('pendingEncounter', {
                enemies: [{ type: 'Goblin', texture: 'slime', tint: 0x5aa33a, hp: 80, damage: 1, gold: 0, xp: 1 }]
            });
            world.scene.switch('BattleScene');
            return {
                spawn: spawn,
                queueMs: window.BATTLE_TURN_QUEUE_MS,
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
            var orig = window.Phaser.Math.Between;
            window.Phaser.Math.Between = function () { return 0; };
            try {
                var foe = battle.enemies[0];
                foe.takeDamage(7);
                var hitDisc = null;
                var hitText = null;
                var list = battle.children.list;
                for (var i = list.length - 1; i >= 0; i--) {
                    var obj = list[i];
                    if (obj && obj.isHitSplat && obj.splatKind === 'hit') {
                        if (obj.type === 'Arc') {
                            hitDisc = obj;
                        }
                        if (obj.type === 'Text') {
                            hitText = obj;
                        }
                    }
                }
                if (!hitDisc) {
                    throw new Error('live hit splat disc missing');
                }
                if (!hitText || hitText.text !== '-7') {
                    throw new Error('live hit floater missing');
                }
                var splatFill = hitDisc.fillColor;
                var floater = hitText.text;
                battle.receivePlayerSelection('attack', 0);
                if (!battle.turnTimer || battle.turnTimer.delay !== 900) {
                    throw new Error('live attack did not queue 900ms');
                }
                if (battle.combatTick || battle.tickMs === 600) {
                    throw new Error('0.6s tick should stay deferred');
                }
                var delay = battle.turnTimer.delay;
                battle.outcome = 'flee';
                battle.endBattle();
                return {
                    splatFill: splatFill,
                    floater: floater,
                    delay: delay,
                    waitingWasPlayer: true
                };
            } finally {
                window.Phaser.Math.Between = orig;
            }
        });

        var dedicated = await runOnly(
            page,
            opened,
            'combat: hit-splats reuse floaters and attack queues 900ms turns not a 0.6s tick'
        );
        return { live: live, battleLive: battleLive, dedicated: dedicated };
    });

    if (result.live.spawn.x !== 328 || result.live.spawn.y !== 248) {
        throw new Error('spawn is ' + result.live.spawn.x + ',' + result.live.spawn.y + ' not 328,248');
    }
    if (result.live.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    if (result.live.queueMs !== 900) {
        throw new Error('live queue is ' + result.live.queueMs + ' not 900');
    }
    if (result.battleLive.floater !== '-7') {
        throw new Error('live floater is ' + result.battleLive.floater);
    }
    console.log('PASS 1/1 hit-splats + 900ms queue', result.dedicated, JSON.stringify({
        live: result.live,
        battleLive: result.battleLive
    }));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
