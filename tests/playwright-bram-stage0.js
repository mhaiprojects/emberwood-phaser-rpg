/**
 * Playwright proof: from spawn (328, 248), talking to Guildmaster Bram
 * at quest stage 0 accepts the militia task and updates HUD + journal.
 * Phaser keyboard stays off.
 *
 * Serve the repo, then:
 *   node tests/playwright-bram-stage0.js [port]
 */
(async function () {
    var port = process.argv[2] || '43919';
    var base = 'http://127.0.0.1:' + port + '/';
    var playwright;
    try {
        playwright = require('playwright');
    } catch (err) {
        var pw = await import('playwright');
        playwright = pw.default || pw;
    }
    var browser;
    try {
        browser = await playwright.chromium.launch({ headless: true });
    } catch (err) {
        browser = await playwright.chromium.launch({
            headless: true,
            executablePath: '/usr/bin/google-chrome-stable'
        });
    }
    var page = await browser.newPage();
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(function () {
        return window.Hud && window.Hud.el && window.Hud.el.start && !window.Hud.el.start.disabled && window.game;
    }, null, { timeout: 15000 });
    await page.click('#btn-start');
    await page.waitForFunction(function () {
        var world = window.game && window.game.scene && window.game.scene.getScene('WorldScene');
        return window.Hud && window.Hud.mode === 'world' && world && world.player;
    }, null, { timeout: 10000 });

    var result = await page.evaluate(function () {
        var world = window.game.scene.getScene('WorldScene');
        var spawn = window.defaultWorldSpawn();
        if (spawn.x !== 328 || spawn.y !== 248) {
            throw new Error('spawn is ' + spawn.x + ',' + spawn.y + ' not 328,248');
        }
        if (window.game.input.keyboard) {
            throw new Error('Phaser keyboard must stay off');
        }
        world.placePlayer(spawn.x, spawn.y);
        window.game.registry.set('quest', { id: 'goblins', stage: 0, progress: 0, goal: 5 });
        world.refreshHud();
        var beforeTask = document.getElementById('hud-quest').textContent;
        var beforeJournal = document.getElementById('hud-quest-tab').textContent;
        var gold = window.game.registry.get('hero').gold;
        var bram = null;
        world.npcs.getChildren().forEach(function (npc) {
            if (npc.npcDef && npc.npcDef.key === 'guild') {
                bram = npc;
            }
        });
        if (!bram) {
            throw new Error('Bram missing in Emberhaven');
        }
        world.tryTalk(bram);
        var quest = window.game.registry.get('quest');
        var chat = Array.prototype.map.call(document.querySelectorAll('.chat-line'), function (line) {
            return line.textContent;
        }).join('\n');
        return {
            spawn: spawn,
            player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
            beforeTask: beforeTask,
            beforeJournal: beforeJournal,
            stage: quest.stage,
            progress: quest.progress,
            gold: window.game.registry.get('hero').gold,
            goldBefore: gold,
            task: document.getElementById('hud-quest').textContent,
            journal: document.getElementById('hud-quest-tab').textContent,
            briefing: chat.indexOf('Goblins plague Northwood') !== -1,
            kills: chat.indexOf('Bring me 5 kills') !== -1,
            keyboard: window.game.input.keyboard,
            phaser: window.Phaser.VERSION
        };
    });

    if (result.keyboard) {
        throw new Error('Phaser keyboard was enabled');
    }
    if (result.stage !== 1 || result.progress !== 0) {
        throw new Error('quest is stage ' + result.stage + ' progress ' + result.progress);
    }
    if (result.gold !== result.goldBefore) {
        throw new Error('accept paid gold');
    }
    if (result.task !== 'Kill goblins in Northwood (0/5).' || result.journal !== result.task) {
        throw new Error('HUD/journal is ' + JSON.stringify(result.task) + ' / ' + JSON.stringify(result.journal));
    }
    if (!result.briefing || !result.kills) {
        throw new Error('missing briefing chat');
    }
    if (String(result.phaser).indexOf('3.90') !== 0) {
        throw new Error('Phaser is ' + result.phaser + ' not 3.90');
    }
    console.log(JSON.stringify(result));
    await browser.close();
})().catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
