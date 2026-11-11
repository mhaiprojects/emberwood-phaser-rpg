/**
 * Playwright smoke: title → play → walk → talk Bram → Inv → eat refuse at full HP.
 *   node tests/playwright-smoke.js [port]
 */
(async function () {
    var port = process.argv[2] || '8765';
    var session = require('./playwright-session');
    var result = await session.withGamePage(port, async function (page, opened) {
        await page.goto(opened.base + 'index.html?v=smoke1', { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(function () {
            return window.Hud && window.Hud.el && window.Hud.el.start && !window.Hud.el.start.disabled;
        }, null, { timeout: 20000 });

        await page.click('#btn-start');
        await page.waitForFunction(function () {
            var world = window.game && window.game.scene.getScene('WorldScene');
            return world && world.player && window.Hud.mode === 'world';
        }, null, { timeout: 15000 });

        var live = await page.evaluate(function () {
            var world = window.game.scene.getScene('WorldScene');
            var spawn = window.defaultWorldSpawn();
            world.enterZone('haven', null);
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            world.encounterLock = false;
            if (window.game.input.keyboard) {
                throw new Error('keyboard on');
            }
            if (String(window.Phaser.VERSION).indexOf('3') !== 0) {
                throw new Error('Phaser ' + window.Phaser.VERSION);
            }

            var y0 = world.player.y;
            window.Keys.down.KeyW = true;
            return new Promise(function (resolve) {
                setTimeout(function () {
                    window.Keys.down.KeyW = false;
                    var walked = world.player.y < y0 - 8;
                    var bram = null;
                    world.npcs.getChildren().forEach(function (npc) {
                        if (npc.npcDef && npc.npcDef.key === 'bram') {
                            bram = npc;
                        }
                    });
                    if (!bram) {
                        throw new Error('Bram missing');
                    }
                    world.placePlayer(bram.x, bram.y + 12);
                    world.tryTalk(bram);
                    if (!window.Hud.dialogueOpen()) {
                        throw new Error('Bram talk failed');
                    }
                    window.Hud.hideDialogue();
                    window.Hud.showTab('inv');
                    var hero = window.game.registry.get('hero');
                    hero.hp = hero.maxHp;
                    window.game.registry.set('hero', hero);
                    window.Hud.el.log.innerHTML = '';
                    var shrimp = document.querySelector('#inv-grid [data-item="shrimp"], #panel-inv [data-item="shrimp"]');
                    if (!shrimp) {
                        throw new Error('shrimp missing from inv');
                    }
                    shrimp.click();
                    var lines = Array.prototype.map.call(document.querySelectorAll('.chat-line'), function (el) {
                        return el.textContent;
                    });
                    var refused = lines.some(function (line) {
                        return /full|already|need/i.test(line) || line.indexOf('hp') !== -1;
                    });
                    /* eat at full HP should not consume */
                    var qty = window.itemQty(window.game.registry.get('hero'), 'shrimp');
                    resolve({
                        walked: walked,
                        bram: true,
                        inv: window.Hud.tab === 'inv' || document.getElementById('panel-inv'),
                        shrimpQty: qty,
                        refused: qty === 8 || refused,
                        keyboard: !!window.game.input.keyboard,
                        phaser: window.Phaser.VERSION
                    });
                }, 400);
            });
        });
        return live;
    });

    if (!result.walked) {
        throw new Error('did not walk');
    }
    if (!result.refused) {
        throw new Error('eat at full HP did not refuse/preserve shrimp');
    }
    if (result.keyboard) {
        throw new Error('keyboard enabled');
    }
    console.log('PASS 1/1 smoke title-play-walk-bram-inv-eat', JSON.stringify(result));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
