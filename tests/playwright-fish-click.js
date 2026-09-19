/**
 * Playwright proof: from spawn (328, 248), Southshore fishing spots are
 * proper gathering clickables (Fish action) and Fisher Ned explains the net.
 * Catching shrimp / requiring a net is not this tick.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-session.js 8765
 *   node tests/playwright-fish-click.js [port]
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
            var logText = await page.evaluate(function () {
                var log = document.getElementById('log');
                return log ? log.textContent : '';
            });
            throw new Error(onlyName + ' failed: ' + suiteTitle + ' / ' + suiteStatus + '\n' + logText);
        }
        return suiteStatus || suiteTitle;
    }

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
            function invQty(hero, id) {
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
            if (typeof world.clickFishSpot !== 'function' || typeof window.sceneryPrimaryAction !== 'function') {
                throw new Error('clickFishSpot / sceneryPrimaryAction missing');
            }
            if (typeof window.catchFish === 'function') {
                throw new Error('catchFish started this tick');
            }
            if (window.ITEM_DB.net || window.ITEM_DB.smallnet) {
                throw new Error('net item started this tick');
            }
            var primary = window.sceneryPrimaryAction('fishspot');
            if (!primary || primary.label !== 'Fish' || primary.action !== 'fish') {
                throw new Error('fishspot primary action is not Fish');
            }

            world.enterZone('southshore', null);
            world.exitLock = false;
            world.encounterLock = false;
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);

            var ned = findNpc(world, 'fisher');
            if (!ned || ned.npcDef.name !== 'Fisher Ned') {
                throw new Error('Fisher Ned missing in Southshore');
            }
            var joined = (ned.npcDef.lines || []).join(' ');
            if (joined.indexOf('net') === -1 || joined.indexOf('Click the fishing spots') === -1) {
                throw new Error('Ned does not explain the net: ' + joined);
            }
            world.tryTalk(ned);
            if (!window.Hud.dialogueOpen()) {
                throw new Error('Ned dialogue did not open');
            }
            window.Hud.hideDialogue();

            function park(group) {
                group.getChildren().forEach(function (obj) {
                    if (obj.body) {
                        obj.body.enable = false;
                        obj.body.setVelocity(0, 0);
                    }
                    obj.setPosition(24, 24);
                });
            }
            park(world.npcs);
            park(world.mobs);

            var shore = window.SHORE_PROPS;
            var spot = shore && shore.spots && shore.spots[0];
            if (!spot || spot.x !== 16 || spot.y !== 24) {
                throw new Error('first fishing spot missing');
            }
            var hero = window.makeHero();
            window.game.registry.set('hero', hero);
            world.refreshHud();

            var pt = window.tileCenter(spot.x, spot.y);
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            world.fishTarget = null;
            if (world.clearWalk) {
                world.clearWalk();
            }
            window.Hud.el.log.innerHTML = '';
            world.onClick({ worldX: pt.x, worldY: pt.y });
            hero = window.game.registry.get('hero');
            if (!world.fishTarget || !world.walkTarget) {
                throw new Error('far click did not walk to the fishing spot');
            }
            if (hero.skills.fishing.xp !== 0) {
                throw new Error('far click granted Fishing XP');
            }

            var near = window.nearestWalkableTile(world.tileGrid, spot.x, spot.y);
            var stand = window.tileCenter(near.tx, near.ty);
            world.placePlayer(stand.x, stand.y);
            world.player.body.setVelocity(0, 0);
            if (!world.tryCompleteFish()) {
                throw new Error('in-range Fish did not complete');
            }
            hero = window.game.registry.get('hero');
            if (hero.skills.fishing.xp !== 10) {
                throw new Error('spot Fishing XP is ' + hero.skills.fishing.xp + ' not 10');
            }
            if (lastChat() !== 'You fish at the fishing spot.') {
                throw new Error('spot chat was ' + lastChat());
            }
            if (invQty(hero, 'rawshrimp') !== 0) {
                throw new Error('caught raw shrimp this tick');
            }

            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            world.enterZone('haven', null);
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            return {
                spawn: spawn,
                player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                fishing: hero.skills.fishing.xp,
                rawshrimp: invQty(hero, 'rawshrimp'),
                keyboard: !!window.game.input.keyboard,
                phaser: window.Phaser.VERSION
            };
        });

        var dedicated = await runOnly(
            page,
            opened,
            'gather: clickable Southshore spots and Fisher Ned explains the net'
        );
        return { live: live, dedicated: dedicated };
    });

    if (result.live.player.x !== 328 || result.live.player.y !== 248) {
        throw new Error('did not start at spawn: ' + result.live.player.x + ',' + result.live.player.y);
    }
    if (result.live.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    if (result.live.fishing !== 10 || result.live.rawshrimp !== 0) {
        throw new Error('live fish was ' + JSON.stringify(result.live));
    }
    console.log('PASS 1/1 clickable Southshore spots + Ned net', result.dedicated, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
