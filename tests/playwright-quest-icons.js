/**
 * Playwright proof: from spawn (328, 248), Guildmaster Bram shows a yellow
 * bang, then grey/green quest marks until the militia task is done. Stage 0
 * accept still updates the journal. Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-quest-icons.js [port]
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
        }, null, { timeout: 60000 });
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

            if (window.Hud.hideTitle) {
                window.Hud.hideTitle();
            }
            window.Hud.mode = 'world';
            world.enterZone('haven', null);
            world.encounterLock = false;
            window.game.registry.set('quest', { id: 'goblins', stage: 0, progress: 0, goal: 5 });
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            world.refreshHud();

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
            if (!bram.questIcon || bram.questIcon.kind !== 'bang' || !bram.questIcon.visible) {
                throw new Error('stage 0 Bram missing yellow bang');
            }
            if (bram.questIcon.iconColor !== window.QUEST_HEAD_BANG) {
                throw new Error('stage 0 bang is not yellow');
            }
            if (rowan.questIcon) {
                throw new Error('Rowan should not have a quest icon');
            }

            var gold = window.game.registry.get('hero').gold;
            world.tryTalk(bram);
            var quest = window.game.registry.get('quest');
            if (quest.stage !== 1) {
                throw new Error('accept did not set stage 1');
            }
            if (window.game.registry.get('hero').gold !== gold) {
                throw new Error('accept paid gold');
            }
            if (document.getElementById('hud-quest').textContent !== 'Kill goblins in Northwood (0/5).') {
                throw new Error('journal did not update on accept');
            }
            if (!bram.questIcon.visible || bram.questIcon.kind !== 'quest' ||
                    bram.questIcon.iconColor !== window.QUEST_HEAD_QUEST_GREY) {
                throw new Error('stage 1 Bram missing grey quest mark');
            }

            quest.stage = 2;
            quest.progress = 5;
            window.game.registry.set('quest', quest);
            world.refreshHud();
            if (!bram.questIcon.visible || bram.questIcon.kind !== 'quest' ||
                    bram.questIcon.iconColor !== window.QUEST_HEAD_QUEST_GREEN) {
                throw new Error('stage 2 Bram missing green quest mark');
            }

            quest.stage = 3;
            window.game.registry.set('quest', quest);
            world.refreshHud();
            if (bram.questIcon.visible || bram.questIcon.kind) {
                throw new Error('completed militia task still shows a head icon');
            }
            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            return {
                spawn: spawn,
                kindAfterAccept: 'quest',
                readyColor: window.QUEST_HEAD_QUEST_GREEN,
                hiddenAfterDone: true,
                keyboard: !!window.game.input.keyboard
            };
        });

        var dedicated = await runOnly(page, opened, 'npcs: Bram shows bang then grey/green quest marks until militia is done');
        var stage0 = await runOnly(page, opened, 'npcs: Bram stage 0 accepts militia quest and updates journal');
        return { live: live, dedicated: dedicated, stage0: stage0 };
    });
    console.log('PASS 2/2 quest head icons', result.dedicated, result.stage0, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
