/**
 * Playwright proof: from spawn (328, 248), collision debug is off
 * by default. Settings / F9 toggle arcade body outlines and colliding
 * tiles. Phaser keyboard stays off. WASD is not used as the toggle.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-collision-debug.js [port]
 */
(async function () {
    var port = process.argv[2] || '8765';
    var session = require('./playwright-session');
    var result = await session.withGamePage(port, async function (page, opened) {
        var live = await page.evaluate(function () {
            function lastChat() {
                var lines = document.querySelectorAll('.chat-line');
                return lines.length ? lines[lines.length - 1].textContent : '';
            }
            function countColliding(world) {
                var n = 0;
                world.ground.forEachTile(function (tile) {
                    if (tile && tile.collides) {
                        n += 1;
                    }
                });
                return n;
            }

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
            world.encounterLock = false;
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            if (world.clearWalk) {
                world.clearWalk();
            }

            var arcadeCfg = window.game.config && window.game.config.physics && window.game.config.physics.arcade;
            if (!arcadeCfg || arcadeCfg.debug !== false) {
                throw new Error('config arcade.debug is not false');
            }
            if (world.collisionDebug) {
                throw new Error('overlay started on');
            }
            if (world.physics.world.drawDebug) {
                throw new Error('arcade drawDebug started on');
            }
            if (world.collisionDebugGfx.visible) {
                throw new Error('tile overlay started visible');
            }

            window.Hud.showTab('settings');
            var btn = document.querySelector('#panel-settings [data-collision-debug]');
            if (!btn) {
                throw new Error('missing collision debug button');
            }
            if (btn.textContent.indexOf('Off') === -1) {
                throw new Error('button started ' + btn.textContent);
            }
            btn.click();
            if (!world.collisionDebug) {
                throw new Error('settings click did not enable overlay');
            }
            if (!world.physics.world.drawDebug) {
                throw new Error('arcade body debug stayed off');
            }
            if (!world.physics.world.debugGraphic || !world.physics.world.debugGraphic.visible) {
                throw new Error('arcade debug graphic not visible');
            }
            if (!world.collisionDebugGfx.visible) {
                throw new Error('colliding tile overlay not visible');
            }
            var n = countColliding(world);
            if (n < 20 || world.collisionDebugTileCount !== n) {
                throw new Error('tile overlay count ' + world.collisionDebugTileCount + ' vs ' + n);
            }
            if (lastChat() !== 'Collision debug on.') {
                throw new Error('on chat was ' + lastChat());
            }

            window.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'F9', code: 'F9', bubbles: true, cancelable: true
            }));
            if (world.collisionDebug) {
                throw new Error('F9 did not turn overlay off');
            }
            if (world.physics.world.drawDebug) {
                throw new Error('arcade drawDebug stayed on after F9');
            }
            if (world.collisionDebugGfx.visible) {
                throw new Error('tile overlay stayed visible after F9');
            }
            if (lastChat() !== 'Collision debug off.') {
                throw new Error('off chat was ' + lastChat());
            }
            if (window.Keys && (window.Keys.isDown('KeyW') || window.Keys.isDown('KeyA') ||
                    window.Keys.isDown('KeyS') || window.Keys.isDown('KeyD'))) {
                throw new Error('F9 stole WASD');
            }
            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            return {
                spawn: spawn,
                colliding: n,
                last: lastChat(),
                keyboard: !!window.game.input.keyboard
            };
        });

        var only = encodeURIComponent('world: collision debug overlay toggles arcade bodies and colliding tiles');
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
    console.log('PASS 1/1 collision debug overlay', result.suite, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
