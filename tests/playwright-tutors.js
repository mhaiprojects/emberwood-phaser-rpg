/**
 * Playwright proof: from spawn (328, 248), Ned / Corb / Willa / Kett
 * tutor lines unlock fishing, mining, cows, and combat styles.
 * Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-tutors.js [port]
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
            function findNpc(world, key) {
                var hit = null;
                world.npcs.getChildren().forEach(function (npc) {
                    if (npc.npcDef && npc.npcDef.key === key) {
                        hit = npc;
                    }
                });
                return hit;
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

            var tutors = [
                { zone: 'southshore', key: 'fisher', name: 'Fisher Ned', tutor: 'fishing', needle: 'fishing' },
                { zone: 'darkmine', key: 'miner', name: 'Miner Corb', tutor: 'mining', needle: 'mining' },
                { zone: 'millfields', key: 'farmer', name: 'Farmer Willa', tutor: 'cows', needle: 'cow' },
                { zone: 'northwood', key: 'ranger', name: 'Ranger Kett', tutor: 'combat', needle: 'Accurate' }
            ];
            var unlocked = {};

            tutors.forEach(function (want) {
                world.enterZone(want.zone, null);
                world.encounterLock = false;
                var npc = findNpc(world, want.key);
                if (!npc) {
                    throw new Error(want.name + ' missing');
                }
                if (npc.npcDef.tutor !== want.tutor) {
                    throw new Error(want.name + ' tutor is ' + npc.npcDef.tutor);
                }
                var joined = (npc.npcDef.lines || []).join(' ');
                if (joined.indexOf(want.needle) === -1) {
                    throw new Error(want.name + ' missing ' + want.needle);
                }
                window.Hud.el.log.innerHTML = '';
                world.tryTalk(npc);
                if (!window.Hud.dialogueOpen()) {
                    throw new Error(want.name + ' did not open dialogue');
                }
                if (lastChat() !== want.name + ': ' + npc.npcDef.lines[0]) {
                    throw new Error(want.name + ' first chat was ' + lastChat());
                }
                var hero = window.game.registry.get('hero');
                if (!hero.tutors || hero.tutors[want.tutor] !== true) {
                    throw new Error(want.name + ' did not unlock ' + want.tutor);
                }
                unlocked[want.tutor] = true;
                window.Hud.hideDialogue();
            });

            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            world.enterZone('haven', null);
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            return {
                spawn: spawn,
                player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                unlocked: unlocked,
                keyboard: !!window.game.input.keyboard
            };
        });

        var only = encodeURIComponent('npcs: Ned Corb Willa Kett tutor lines unlock fishing mining cows combat styles');
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
    console.log('PASS 1/1 tutor lines', result.suite, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
