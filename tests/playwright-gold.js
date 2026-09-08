/**
 * Playwright proof: from spawn (328, 248), starter gold is 8 and
 * Bram's militia reward is the first large income (+50 → 58).
 * Phaser keyboard stays off.
 *
 * Serve the repo, then:
 *   node tests/playwright-gold.js [port]
 */
(async function () {
    var port = process.argv[2] || '8765';
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
        var hero = window.makeHero();
        window.game.registry.set('hero', hero);
        window.game.registry.set('quest', { id: 'goblins', stage: 0, progress: 0, goal: 5 });
        world.placePlayer(spawn.x, spawn.y);
        world.refreshHud();

        var startGold = window.game.registry.get('hero').gold;
        var startHud = document.getElementById('hud-gold').textContent;
        var maxMobGold = 0;
        Object.keys(window.MOB_DEFS).forEach(function (zoneId) {
            window.MOB_DEFS[zoneId].forEach(function (mob) {
                if (mob.gold > maxMobGold) {
                    maxMobGold = mob.gold;
                }
            });
        });

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
        var afterAccept = window.game.registry.get('hero').gold;

        var quest = window.game.registry.get('quest');
        quest.stage = 2;
        quest.progress = 5;
        window.game.registry.set('quest', quest);
        world.tryTalk(bram);

        var chat = Array.prototype.map.call(document.querySelectorAll('.chat-line'), function (line) {
            return line.textContent;
        }).join('\n');
        return {
            spawn: spawn,
            player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
            phaser: window.Phaser.VERSION,
            keyboard: window.game.input.keyboard,
            startGold: startGold,
            startHud: startHud,
            afterAccept: afterAccept,
            maxMobGold: maxMobGold,
            gold: window.game.registry.get('hero').gold,
            hud: document.getElementById('hud-gold').textContent,
            paid: chat.indexOf('50 gold') !== -1
        };
    });

    if (result.startGold !== 8 || result.startHud !== '8') {
        throw new Error('start gold is ' + result.startGold + ' / HUD ' + result.startHud);
    }
    if (result.afterAccept !== 8) {
        throw new Error('accept paid gold: ' + result.afterAccept);
    }
    if (!(result.maxMobGold > 0 && result.maxMobGold < 50)) {
        throw new Error('mob gold max is ' + result.maxMobGold + ', expected 1–49');
    }
    if (result.gold !== 58 || result.hud !== '58' || !result.paid) {
        throw new Error('reward failed: gold=' + result.gold + ' hud=' + result.hud + ' paid=' + result.paid);
    }
    console.log(JSON.stringify(result));
    await browser.close();
})().catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
