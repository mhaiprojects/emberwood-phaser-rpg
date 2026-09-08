/**
 * Playwright proof: from Emberhaven spawn (328, 248), left-click a living
 * chicken sets engageTarget, walks in, and chats You target the Chicken.
 * Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-engage.js [port]
 */
(async function () {
    var port = process.argv[2] || '39310';
    var result = await require('./playwright-session').withGamePage(port, async function (page) {
    return await page.evaluate(function () {
        var world = window.game.scene.getScene('WorldScene');
        var hero = window.game.registry.get('hero');
        if (hero) {
            hero.autoAttack = false;
            window.game.registry.set('hero', hero);
        }
        var spawn = window.defaultWorldSpawn();
        if (spawn.x !== 328 || spawn.y !== 248) {
            throw new Error('spawn is ' + spawn.x + ',' + spawn.y + ' not 328,248');
        }
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
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
            throw new Error('no haven chicken');
        }
        var dist = window.Phaser.Math.Distance.Between(world.player.x, world.player.y, chicken.x, chicken.y);
        if (dist < 24) {
            throw new Error('chicken too close to spawn (' + dist + 'px)');
        }
        world.onClick({ worldX: chicken.x, worldY: chicken.y });
        if (world.engageTarget !== chicken) {
            throw new Error('engageTarget not set');
        }
        if (!world.walkTarget) {
            throw new Error('walkTarget not set');
        }
        if (Math.round(world.walkTarget.x) !== Math.round(chicken.x) ||
                Math.round(world.walkTarget.y) !== Math.round(chicken.y)) {
            throw new Error('walkTarget is not the chicken');
        }
        var log = (window.Hud.el && window.Hud.el.log) ? window.Hud.el.log.textContent : '';
        if (log.indexOf('You target the Chicken') < 0) {
            throw new Error('missing target chat');
        }
        world.update();
        if (world.player.body.velocity.x <= 10) {
            throw new Error('not walking east toward chicken vx=' + world.player.body.velocity.x);
        }
        if (window.game.scene.isActive('BattleScene')) {
            throw new Error('BattleScene started from spawn distance');
        }
        return {
            spawn: spawn,
            player: { x: world.player.x, y: world.player.y },
            chicken: { x: chicken.x, y: chicken.y, type: chicken.mobDef.type },
            dist: Math.round(dist),
            vx: Math.round(world.player.body.velocity.x),
            vy: Math.round(world.player.body.velocity.y),
            engaged: world.engageTarget === chicken,
            playerScale: world.player.scaleX,
            keyboard: window.game.input.keyboard,
            version: window.Phaser && window.Phaser.VERSION
        };
    });
    });

    if (result.keyboard) {
        throw new Error('Phaser keyboard was enabled');
    }
    if (!String(result.version || '').startsWith('3.')) {
        throw new Error('expected Phaser 3, got ' + result.version);
    }
    console.log('PASS click-mob engage', JSON.stringify(result));
})().catch(function (err) {
    console.error('FAIL', err && err.message ? err.message : err);
    process.exit(1);
});
