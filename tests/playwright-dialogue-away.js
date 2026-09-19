/**
 * Playwright proof: from spawn (328, 248), walking away closes
 * #dialogue-overlay, and TREE/ROCK tiles block talk. Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-dialogue-away.js [port]
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

            var overlay = document.getElementById('dialogue-overlay');
            if (!overlay || overlay !== window.Hud.el.dialogue) {
                throw new Error('missing #dialogue-overlay');
            }
            if (!overlay.hidden) {
                throw new Error('dialogue started visible');
            }

            var rowan = null;
            world.npcs.getChildren().forEach(function (npc) {
                if (npc.npcDef && npc.npcDef.key === 'guard') {
                    rowan = npc;
                }
            });
            if (!rowan) {
                throw new Error('Rowan missing');
            }

            world.placePlayer(rowan.x + 16, rowan.y);
            world.player.body.setVelocity(0, 0);
            window.Hud.el.log.innerHTML = '';
            world.tryTalk(rowan);
            if (!window.Hud.dialogueOpen()) {
                throw new Error('adjacent tryTalk did not open dialogue');
            }

            window.Keys.down.KeyD = true;
            world.update();
            if (window.Hud.dialogueOpen() || !overlay.hidden) {
                throw new Error('D walk-away did not close dialogue');
            }
            window.Keys.down = {};
            window.Keys.pressed = {};

            world.placePlayer(rowan.x + 16, rowan.y);
            world.player.body.setVelocity(0, 0);
            world.tryTalk(rowan);
            if (!window.Hud.dialogueOpen()) {
                throw new Error('reopen before distance walk-away failed');
            }
            world.placePlayer(rowan.x + 80, rowan.y);
            world.player.body.setVelocity(0, 0);
            world.update();
            if (window.Hud.dialogueOpen()) {
                throw new Error('80px walk-away did not close dialogue');
            }

            var mid = window.worldToTile(rowan.x + 12, rowan.y);
            var saved = world.tileGrid[mid.ty][mid.tx];
            world.tileGrid[mid.ty][mid.tx] = window.TILE.ROCK;
            world.placePlayer(rowan.x + 24, rowan.y);
            world.player.body.setVelocity(0, 0);
            window.Hud.el.log.innerHTML = '';
            var before = lastChat();
            world.tryTalk(rowan);
            if (window.Hud.dialogueOpen()) {
                throw new Error('talked through ROCK');
            }
            if (lastChat() !== before) {
                throw new Error('ROCK talk logged chat');
            }
            world.tileGrid[mid.ty][mid.tx] = window.TILE.TREE;
            world.tryTalk(rowan);
            if (window.Hud.dialogueOpen()) {
                throw new Error('talked through TREE');
            }
            world.tileGrid[mid.ty][mid.tx] = saved;
            world.tryTalk(rowan);
            if (!window.Hud.dialogueOpen()) {
                throw new Error('clear LOS did not talk');
            }
            window.Hud.hideDialogue();

            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            return {
                spawn: spawn,
                player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                keyboard: !!window.game.input.keyboard
            };
        });

        var only = encodeURIComponent('npcs: walk-away closes dialogue and TREE/ROCK walls block talk');
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
    console.log('PASS 1/1 walk-away dialogue / wall talk', result.suite, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
