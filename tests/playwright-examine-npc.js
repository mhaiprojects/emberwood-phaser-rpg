/**
 * Playwright proof: from spawn (328, 248), right-click or long-press an NPC
 * offers Examine and logs that NPC's flavor sentence. Left-click still talks.
 * Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-examine-npc.js [port]
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
            if (world.clearWalk) {
                world.clearWalk();
            }

            var bram = null;
            var rowan = null;
            world.npcs.getChildren().forEach(function (npc) {
                if (!npc.npcDef) {
                    return;
                }
                if (npc.npcDef.key === 'guild') {
                    bram = npc;
                }
                if (npc.npcDef.key === 'guard') {
                    rowan = npc;
                }
            });
            if (!bram || !rowan) {
                throw new Error('haven NPCs missing');
            }
            var bramLine = window.examineNpcText(bram.npcDef);
            var rowanLine = window.examineNpcText(rowan.npcDef);
            if (!bramLine || bramLine === rowanLine) {
                throw new Error('NPC examine lines missing or not unique');
            }

            window.Hud.hideContextMenu();
            window.Hud.el.log.innerHTML = '';
            world.onClick({
                worldX: bram.x,
                worldY: bram.y,
                button: 2,
                rightButtonDown: function () { return true; },
                event: { clientX: 48, clientY: 56 }
            });
            var examBtn = document.querySelector('#ctx-menu [data-ctx="examine"]');
            if (!examBtn) {
                throw new Error('right-click Bram missing Examine');
            }
            if (document.querySelector('#ctx-menu [data-ctx="walk-here"]')) {
                throw new Error('NPC menu should not list Walk here');
            }
            examBtn.click();
            if (lastChat() !== bramLine) {
                throw new Error('Examine menu was ' + lastChat());
            }
            if (world.walkTarget) {
                throw new Error('Examine walked');
            }
            if (window.Hud.dialogueOpen && window.Hud.dialogueOpen()) {
                throw new Error('Examine opened dialogue');
            }

            window.Hud.hideContextMenu();
            world.longPressAt(rowan.x, rowan.y, { clientX: 64, clientY: 72 });
            examBtn = document.querySelector('#ctx-menu [data-ctx="examine"]');
            if (!examBtn) {
                throw new Error('long-press Rowan missing Examine');
            }
            examBtn.click();
            if (lastChat() !== rowanLine) {
                throw new Error('long-press Examine was ' + lastChat());
            }

            world.onClick({ worldX: bram.x, worldY: bram.y });
            if (world.talkTarget !== bram) {
                throw new Error('left-click Bram no longer talks');
            }
            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            return {
                spawn: spawn,
                last: lastChat(),
                bram: bramLine,
                keyboard: !!window.game.input.keyboard
            };
        });

        var only = encodeURIComponent('npcs: right-click Examine on NPCs logs a flavor sentence');
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
    console.log('PASS 1/1 examine NPCs', result.suite, result.live && result.live.last);
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
