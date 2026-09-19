/**
 * Playwright proof: from spawn (328, 248), Darkmine copper/tin mine at
 * Mining 1; iron chats "You need level 15." until Mining 15.
 * Smithing is not this tick. Phaser keyboard stays off.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-session.js 8765
 *   node tests/playwright-ore-level.js [port]
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
                return lines[lines.length - 1] ? lines[lines.length - 1].textContent : '';
            }
            function park(group) {
                group.getChildren().forEach(function (obj) {
                    if (obj.body) {
                        obj.body.enable = false;
                        obj.body.setVelocity(0, 0);
                    }
                    obj.setPosition(24, 24);
                });
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
            if (typeof window.mineAtRock !== 'function' || typeof window.needLevelChat !== 'function') {
                throw new Error('mineAtRock / needLevelChat missing');
            }
            if (typeof window.smithBar === 'function') {
                throw new Error('Smithing started this tick');
            }
            if (window.RESOURCE_LEVEL.copper !== 1 || window.RESOURCE_LEVEL.tin !== 1
                    || window.RESOURCE_LEVEL.iron !== 15) {
                throw new Error('RESOURCE_LEVEL is ' + JSON.stringify(window.RESOURCE_LEVEL));
            }
            if (window.needLevelChat(15) !== 'You need level 15.') {
                throw new Error('needLevelChat is ' + window.needLevelChat(15));
            }

            var copper = window.MINE_PROPS.copper[0];
            var tin = window.MINE_PROPS.tin[0];
            var iron = window.MINE_PROPS.iron[0];

            world.enterZone('darkmine', null);
            world.exitLock = false;
            world.encounterLock = false;
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            if (world.clearLoot) {
                world.clearLoot();
            }
            park(world.npcs);
            park(world.mobs);

            var hero = window.makeHero();
            window.game.registry.set('hero', hero);
            world.refreshHud();
            window.Hud.showTab('skills');
            window.Hud.el.log.innerHTML = '';
            var dropsHost = window.Hud.ensureXpDrops();
            if (dropsHost) {
                dropsHost.innerHTML = '';
            }

            var pt = window.tileCenter(iron.x, iron.y);
            world.onClick({ worldX: pt.x, worldY: pt.y });
            hero = window.game.registry.get('hero');
            if (lastChat() !== 'You need level 15.') {
                throw new Error('iron chat was ' + lastChat());
            }
            if (hero.skills.mining.xp !== 0) {
                throw new Error('iron at 1 granted Mining XP');
            }

            pt = window.tileCenter(copper.x, copper.y);
            world.onClick({ worldX: pt.x, worldY: pt.y });
            hero = window.game.registry.get('hero');
            if (lastChat() !== 'You mine the rock.') {
                throw new Error('copper chat was ' + lastChat());
            }
            if (hero.skills.mining.xp !== 10) {
                throw new Error('copper Mining XP is ' + hero.skills.mining.xp);
            }

            pt = window.tileCenter(tin.x, tin.y);
            world.onClick({ worldX: pt.x, worldY: pt.y });
            hero = window.game.registry.get('hero');
            if (hero.skills.mining.xp !== 20) {
                throw new Error('tin Mining XP is ' + hero.skills.mining.xp);
            }

            hero.skills.mining.level = 15;
            window.game.registry.set('hero', hero);
            world.refreshHud();
            pt = window.tileCenter(iron.x, iron.y);
            world.onClick({ worldX: pt.x, worldY: pt.y });
            hero = window.game.registry.get('hero');
            if (lastChat() !== 'You mine the rock.') {
                throw new Error('iron at 15 chat was ' + lastChat());
            }
            if (hero.skills.mining.xp !== 30) {
                throw new Error('iron at 15 Mining XP is ' + hero.skills.mining.xp);
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
                mining: hero.skills.mining.xp,
                keyboard: !!window.game.input.keyboard,
                phaser: window.Phaser.VERSION
            };
        });

        var dedicated = await runOnly(
            page,
            opened,
            'skills: copper and tin need level 1, iron needs 15'
        );
        return { live: live, dedicated: dedicated };
    });

    if (result.live.player.x !== 328 || result.live.player.y !== 248) {
        throw new Error('did not start at spawn: ' + result.live.player.x + ',' + result.live.player.y);
    }
    if (result.live.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    if (result.live.mining !== 30) {
        throw new Error('live mine was ' + JSON.stringify(result.live));
    }
    console.log('PASS 1/1 Darkmine ore level gates', result.dedicated, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
