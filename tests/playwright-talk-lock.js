/**
 * Playwright proof: from spawn (328, 248), talking never starts during
 * Hud.mode === 'battle' or encounterLock (tryTalk + Keys.js Space).
 * Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-talk-lock.js [port]
 */
(async function () {
    var port = process.argv[2] || '8765';
    var session = require('./playwright-session');
    var result = await session.withGamePage(port, async function (page) {
        return await page.evaluate(function () {
            function dispatchKey(code, key, type) {
                var keyCode = code === 'Space' ? 32 : 0;
                var event = new KeyboardEvent(type, {
                    key: key,
                    code: code,
                    keyCode: keyCode,
                    which: keyCode,
                    bubbles: true,
                    cancelable: true
                });
                (document.body || window).dispatchEvent(event);
            }

            function chatLines() {
                return Array.prototype.map.call(document.querySelectorAll('.chat-line'), function (line) {
                    return line.textContent;
                });
            }

            function lastChat() {
                var lines = chatLines();
                return lines.length ? lines[lines.length - 1] : '';
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
            world.exitLock = false;
            world.encounterLock = false;
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            var hero = window.game.registry.get('hero');
            hero.autoAttack = false;
            window.game.registry.set('hero', hero);
            window.game.registry.set('quest', { id: 'goblins', stage: 3, progress: 5, goal: 5 });

            var bram = null;
            world.npcs.getChildren().forEach(function (npc) {
                if (npc.npcDef && npc.npcDef.key === 'guild') {
                    bram = npc;
                }
            });
            if (!bram) {
                throw new Error('Bram missing');
            }

            world.placePlayer(bram.x + 16, bram.y);
            world.player.body.setVelocity(0, 0);
            world.talkTarget = null;
            window.Hud.mode = 'world';
            world.refreshHud();

            var chatCount = chatLines().length;
            world.tryTalk(bram);
            var unlockedLine = lastChat();
            if (chatLines().length !== chatCount + 1) {
                throw new Error('unlocked tryTalk did not append chat');
            }
            if (unlockedLine !== 'Guildmaster Bram: Emberhaven stands because of you.') {
                throw new Error('unlocked tryTalk was ' + unlockedLine);
            }

            chatCount = chatLines().length;
            world.talkTarget = bram;
            world.encounterLock = true;
            world.tryTalk(bram);
            if (chatLines().length !== chatCount) {
                throw new Error('tryTalk spoke under encounterLock: ' + lastChat());
            }
            dispatchKey('Space', ' ', 'keydown');
            world.update();
            if (chatLines().length !== chatCount) {
                throw new Error('Space spoke under encounterLock: ' + lastChat());
            }
            dispatchKey('Space', ' ', 'keyup');
            if (window.Keys) {
                window.Keys.down = {};
                window.Keys.pressed = {};
            }
            world.encounterLock = false;

            window.Hud.mode = 'battle';
            world.talkTarget = bram;
            world.tryTalk(bram);
            if (chatLines().length !== chatCount) {
                throw new Error('tryTalk spoke in battle: ' + lastChat());
            }
            dispatchKey('Space', ' ', 'keydown');
            world.update();
            if (chatLines().length !== chatCount) {
                throw new Error('Space spoke in battle: ' + lastChat());
            }
            dispatchKey('Space', ' ', 'keyup');
            if (window.Keys) {
                window.Keys.down = {};
                window.Keys.pressed = {};
            }
            var quest = window.game.registry.get('quest');
            if (quest.stage !== 3) {
                throw new Error('quest stage became ' + quest.stage);
            }

            window.Hud.mode = 'world';
            world.encounterLock = false;
            world.talkTarget = null;
            world.tryTalk(bram);
            if (chatLines().length !== chatCount + 1) {
                throw new Error('tryTalk after unlock did not append chat');
            }
            if (lastChat() !== 'Guildmaster Bram: Emberhaven stands because of you.') {
                throw new Error('tryTalk after unlock was ' + lastChat());
            }

            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            return {
                spawn: spawn,
                player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                phaser: window.Phaser.VERSION,
                keyboard: window.game.input.keyboard,
                unlockedLine: unlockedLine,
                stage: quest.stage,
                mode: window.Hud.mode
            };
        });
    });

    if (result.player.x !== 328 || result.player.y !== 248) {
        throw new Error('did not return to spawn: ' + result.player.x + ',' + result.player.y);
    }
    if (result.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    if (result.stage !== 3) {
        throw new Error('quest stage is ' + result.stage);
    }
    if (result.mode !== 'world') {
        throw new Error('HUD mode is ' + result.mode);
    }
    console.log(JSON.stringify(result));
})().catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
