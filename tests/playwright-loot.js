/**
 * Playwright proof: win a haven chicken from spawn (328, 248) and confirm
 * coins + bones + shrimp drop at the mob's feet. Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-loot.js [port]
 */
(async function () {
    var port = process.argv[2] || '39310';
    var result = await require('./playwright-session').withGamePage(port, async function (page) {
    return await page.evaluate(function () {
        return new Promise(function (resolve, reject) {
            var world = window.game.scene.getScene('WorldScene');
            var hero = window.game.registry.get('hero');
            if (hero) {
                hero.autoAttack = false;
                window.game.registry.set('hero', hero);
            }
            var spawn = window.defaultWorldSpawn();
            if (spawn.x !== 328 || spawn.y !== 248) {
                reject(new Error('spawn is ' + spawn.x + ',' + spawn.y + ' not 328,248'));
                return;
            }
            world.placePlayer(spawn.x, spawn.y);
            world.walkTarget = null;
            world.engageTarget = null;
            world.talkTarget = null;
            world.encounterLock = false;
            var chicken = null;
            var kids = world.mobs.getChildren();
            for (var i = 0; i < kids.length; i++) {
                if (kids[i].aliveMob && kids[i].mobDef.type === 'Chicken') {
                    chicken = kids[i];
                    break;
                }
            }
            if (!chicken) {
                reject(new Error('no haven chicken'));
                return;
            }
            var table = window.lootForMob(chicken.mobDef);
            var tableIds = table.map(function (drop) { return drop.id; }).join(',');
            if (tableIds !== 'coins,bones,shrimp') {
                reject(new Error('chicken table ' + tableIds));
                return;
            }
            var feetX = chicken.x;
            var feetY = chicken.y;
            world.beginFight(chicken);

            var started = Date.now();
            var swings = 0;
            var tick = function () {
                if (Date.now() - started > 12000) {
                    reject(new Error('fight did not finish'));
                    return;
                }
                if (window.Hud.mode === 'world' && world.scene.isActive() && !world.encounterLock && swings > 0) {
                    var live = (world.groundLoot || []).filter(function (drop) {
                        return drop && !drop.taken && drop.sprite;
                    });
                    var ids = live.map(function (drop) { return drop.id; });
                    if (ids.indexOf('coins') < 0 || ids.indexOf('bones') < 0 || ids.indexOf('shrimp') < 0) {
                        reject(new Error('loot ids ' + ids.join(',')));
                        return;
                    }
                    for (var j = 0; j < live.length; j++) {
                        var dx = live[j].sprite.x - feetX;
                        var dy = live[j].sprite.y - (feetY + 4);
                        if (Math.abs(dx) > 16 || Math.abs(dy) > 6) {
                            reject(new Error(live[j].id + ' not at feet'));
                            return;
                        }
                    }
                    resolve({
                        spawn: spawn,
                        feet: { x: feetX, y: feetY },
                        loot: ids,
                        lootCount: live.length,
                        chickenAlive: chicken.aliveMob,
                        playerScale: world.player.scaleX,
                        keyboard: window.game.input.keyboard,
                        version: window.Phaser && window.Phaser.VERSION
                    });
                    return;
                }
                var battle = window.game.scene.getScene('BattleScene');
                if (battle && battle.scene.isActive() && battle.isPlayerTurn() && battle.waitingForPlayer && battle.pickReady) {
                    swings += 1;
                    window.Hud.tryAttack();
                }
                setTimeout(tick, 80);
            };
            setTimeout(tick, 300);
        });
    });
    });

    if (result.keyboard) {
        throw new Error('Phaser keyboard was enabled');
    }
    if (!String(result.version || '').startsWith('3.')) {
        throw new Error('expected Phaser 3, got ' + result.version);
    }
    console.log('PASS loot at feet', JSON.stringify(result));
})().catch(function (err) {
    console.error('FAIL', err && err.message ? err.message : err);
    process.exit(1);
});
