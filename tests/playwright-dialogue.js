/**
 * Playwright proof: from spawn (328, 248), NPC talk pages through
 * lines via click-to-continue instead of dumping one chat line.
 * Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-dialogue.js [port]
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
            function chatCount() {
                return document.querySelectorAll('.chat-line').length;
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
            if (overlay.querySelectorAll('button').length) {
                throw new Error('option buttons must wait for the next item');
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
            var pages = rowan.npcDef.lines;
            if (!pages || pages.length !== 2) {
                throw new Error('Rowan should have 2 lines');
            }

            window.Hud.el.log.innerHTML = '';
            world.tryTalk(rowan);
            if (!window.Hud.dialogueOpen()) {
                throw new Error('tryTalk did not open dialogue');
            }
            if (document.getElementById('dialogue-text').textContent !== pages[0]) {
                throw new Error('first page was ' + document.getElementById('dialogue-text').textContent);
            }
            if (lastChat() !== 'Guard Rowan: ' + pages[0]) {
                throw new Error('first chat was ' + lastChat());
            }
            if (chatCount() !== 1) {
                throw new Error('dumped more than the first page');
            }

            overlay.click();
            if (document.getElementById('dialogue-text').textContent !== pages[1]) {
                throw new Error('click did not continue: ' + document.getElementById('dialogue-text').textContent);
            }
            if (lastChat() !== 'Guard Rowan: ' + pages[1]) {
                throw new Error('second chat was ' + lastChat());
            }

            overlay.click();
            if (window.Hud.dialogueOpen() || !overlay.hidden) {
                throw new Error('last click did not close dialogue');
            }
            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            return {
                spawn: spawn,
                player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                first: pages[0],
                second: pages[1],
                keyboard: !!window.game.input.keyboard
            };
        });

        var only = encodeURIComponent('npcs: click-to-continue pages through multi-line dialogue');
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
    console.log('PASS 1/1 click-to-continue dialogue', result.suite, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
