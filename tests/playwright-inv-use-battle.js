/**
 * Playwright proof: from spawn (328, 248), inventory Use stays
 * world-blocked while Hud.mode === 'battle' (chat: Use Eat food on
 * your combat turn). Combat eat-on-turn already exists. Phaser
 * keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-inv-use-battle.js [port]
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
        }, null, { timeout: 90000 });
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
            function lastChat() {
                var lines = document.querySelectorAll('.chat-line');
                return lines.length ? lines[lines.length - 1].textContent : '';
            }
            function stackQty(hero, id) {
                var stack = hero.inventory.filter(function (row) { return row.id === id; })[0];
                return stack ? stack.qty : 0;
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
            if (typeof window.Hud.useItem !== 'function') {
                throw new Error('Hud.useItem missing');
            }

            world.enterZone('haven', null);
            world.exitLock = false;
            world.encounterLock = false;
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            if (world.clearLoot) {
                world.clearLoot();
            }

            var hero = window.makeHero();
            window.addItem(hero, 'bones', 2);
            window.addItem(hero, 'key', 1);
            hero.hp = 70;
            window.game.registry.set('hero', hero);
            world.refreshHud();

            window.Hud.showTab('inv');
            window.Hud.el.log.innerHTML = '';
            window.Hud.battle = null;
            window.Hud.mode = 'battle';
            if (window.Hud.canBattleAct()) {
                throw new Error('canBattleAct should be false without a battle');
            }

            document.querySelector('#inv-grid [data-item="bones"]').click();
            if (lastChat() !== 'Use Eat food on your combat turn.') {
                throw new Error('battle bones Use was ' + lastChat());
            }
            document.querySelector('#inv-grid [data-item="sword"]').click();
            if (lastChat() !== 'Use Eat food on your combat turn.') {
                throw new Error('battle sword Use was ' + lastChat());
            }
            document.querySelector('#inv-grid [data-item="shrimp"]').click();
            if (lastChat() !== 'Use Eat food on your combat turn.') {
                throw new Error('battle shrimp Use was ' + lastChat());
            }

            hero = window.game.registry.get('hero');
            if (hero.hp !== 70) {
                throw new Error('battle shrimp world-ate HP to ' + hero.hp);
            }
            if (stackQty(hero, 'shrimp') !== 8) {
                throw new Error('battle shrimp qty is ' + stackQty(hero, 'shrimp'));
            }
            if (stackQty(hero, 'bones') !== 2) {
                throw new Error('battle buried bones to ' + stackQty(hero, 'bones'));
            }
            if (stackQty(hero, 'sword') !== 1) {
                throw new Error('battle wielded the spare sword');
            }

            window.Hud.mode = 'world';
            document.querySelector('#inv-grid [data-item="shrimp"]').click();
            hero = window.game.registry.get('hero');
            if (hero.hp !== 82) {
                throw new Error('world shrimp heal was ' + hero.hp + ' not 82');
            }
            if (lastChat() !== 'You eat Cooked shrimp and recover 12 HP.') {
                throw new Error('world eat chat was ' + lastChat());
            }

            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            world.clearLoot();
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            return {
                spawn: spawn,
                player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                hp: hero.hp,
                shrimp: stackQty(hero, 'shrimp'),
                keyboard: !!window.game.input.keyboard,
                phaser: window.Phaser.VERSION
            };
        });

        var dedicated = await runOnly(
            page,
            opened,
            'hud: inventory Use is blocked while Hud.mode is battle'
        );
        return { live: live, dedicated: dedicated };
    });

    if (result.live.player.x !== 328 || result.live.player.y !== 248) {
        throw new Error('did not start at spawn: ' + result.live.player.x + ',' + result.live.player.y);
    }
    if (result.live.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    console.log('PASS 1/1 inventory Use blocked in battle', result.dedicated, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
