/**
 * Playwright proof: from spawn (328, 248), dialogue shows Talk / Trade /
 * Bank / Quest buttons only where the NPC supports them. No shop/bank UI.
 * Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-dialogue-options.js [port]
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
            function optionIds() {
                var btns = document.querySelectorAll('[data-dialogue-option]');
                var ids = [];
                for (var i = 0; i < btns.length; i++) {
                    ids.push(btns[i].getAttribute('data-dialogue-option'));
                }
                return ids.join(',');
            }
            function clickOption(id) {
                var btn = document.querySelector('[data-dialogue-option="' + id + '"]');
                if (!btn) {
                    throw new Error('missing option button ' + id);
                }
                btn.click();
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
            if (!document.getElementById('dialogue-options')) {
                throw new Error('missing #dialogue-options');
            }

            var rowan = null;
            var bram = null;
            var elise = null;
            world.npcs.getChildren().forEach(function (npc) {
                if (!npc.npcDef) {
                    return;
                }
                if (npc.npcDef.key === 'guard') {
                    rowan = npc;
                }
                if (npc.npcDef.key === 'guild') {
                    bram = npc;
                }
                if (npc.npcDef.key === 'banker') {
                    elise = npc;
                }
            });
            if (!rowan || !bram || !elise) {
                throw new Error('haven NPCs missing');
            }

            window.Hud.el.log.innerHTML = '';
            world.tryTalk(rowan);
            if (optionIds() !== 'talk') {
                throw new Error('Rowan options were ' + optionIds());
            }
            clickOption('talk');
            if (document.getElementById('dialogue-text').textContent !== rowan.npcDef.lines[0]) {
                throw new Error('Talk did not replay Rowan flavor');
            }
            window.Hud.hideDialogue();

            window.game.registry.set('quest', { id: 'goblins', stage: 0, progress: 0, goal: 5 });
            world.refreshHud();
            world.tryTalk(bram);
            if (optionIds() !== 'talk,quest') {
                throw new Error('Bram options were ' + optionIds());
            }
            clickOption('quest');
            if (lastChat() !== 'Guildmaster Bram: 0 of 5 goblins down. Keep at it.') {
                throw new Error('Quest button was ' + lastChat());
            }
            window.Hud.hideDialogue();

            world.tryTalk(elise);
            if (optionIds() !== 'talk,bank') {
                throw new Error('Elise options were ' + optionIds());
            }
            clickOption('bank');
            if (lastChat() !== 'Banker Elise: The vault is still being fitted.') {
                throw new Error('Bank stub was ' + lastChat());
            }
            if (document.getElementById('shop-overlay') && !document.getElementById('shop-overlay').hidden) {
                throw new Error('shop UI opened');
            }
            if (document.getElementById('bank-overlay') && !document.getElementById('bank-overlay').hidden) {
                throw new Error('bank UI opened');
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
                rowan: 'talk',
                bram: 'talk,quest',
                elise: 'talk,bank',
                keyboard: !!window.game.input.keyboard
            };
        });

        var only = encodeURIComponent('npcs: dialogue option buttons Talk Trade Bank Quest where the NPC supports them');
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
    console.log('PASS 1/1 dialogue option buttons', result.suite, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
