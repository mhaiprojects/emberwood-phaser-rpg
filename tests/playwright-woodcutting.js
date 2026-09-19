/**
 * Playwright proof: from spawn (328, 248), left-click Northwood
 * trees grant Woodcutting XP. Phaser keyboard stays off.
 * Mining XP is a later tick.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-session.js 8765
 *   node tests/playwright-woodcutting.js [port]
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
            if (typeof window.chopAtTree !== 'function' || typeof window.gainSkillXp !== 'function') {
                throw new Error('chopAtTree / gainSkillXp missing');
            }
            if (typeof window.chopTree === 'function' || typeof window.woodcutTree === 'function') {
                throw new Error('chopTree / woodcutTree started this tick');
            }
            if (window.WOODCUT_TREE_XP !== 10) {
                throw new Error('WOODCUT_TREE_XP is ' + window.WOODCUT_TREE_XP + ' not 10');
            }

            world.enterZone('northwood', null);
            world.exitLock = false;
            world.encounterLock = false;
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            if (world.clearLoot) {
                world.clearLoot();
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
            park(world.npcs);
            park(world.mobs);

            if (world.tileGrid[2][0] !== window.TILE.TREE) {
                throw new Error('northwood (0,2) is not TREE');
            }
            var tree = { x: 0, y: 2 };
            if (!window.woodcutTreeAt(tree.x, tree.y, 'northwood', world.tileGrid)) {
                throw new Error('woodcutTreeAt missed northwood tree');
            }

            var hero = window.makeHero();
            window.game.registry.set('hero', hero);
            world.refreshHud();

            window.Hud.showTab('skills');
            window.Hud.el.log.innerHTML = '';
            var dropsHost = window.Hud.ensureXpDrops();
            if (dropsHost) {
                dropsHost.innerHTML = '';
            }
            var pt = window.tileCenter(tree.x, tree.y);
            world.onClick({ worldX: pt.x, worldY: pt.y });
            hero = window.game.registry.get('hero');
            if (hero.skills.woodcutting.xp !== 10) {
                throw new Error('tree Woodcutting XP is ' + hero.skills.woodcutting.xp + ' not 10');
            }
            if (lastChat() !== 'You chop the tree.') {
                throw new Error('tree chat was ' + lastChat());
            }
            if (hero.skills.fishing.xp !== 0) {
                throw new Error('Fishing XP changed');
            }
            if (hero.skills.mining.xp !== 0) {
                throw new Error('Mining XP changed');
            }
            var drop = document.querySelector('#xp-drops .xp-drop[data-skill="woodcutting"]');
            if (!drop || drop.getAttribute('data-xp') !== '10') {
                throw new Error('Woodcutting XP drop missing');
            }

            var helper = window.chopAtTree(hero);
            if (!helper || !helper.ok || helper.xp !== 10) {
                throw new Error('chopAtTree helper did not grant XP');
            }
            if (hero.skills.woodcutting.xp !== 20) {
                throw new Error('helper Woodcutting XP is ' + hero.skills.woodcutting.xp + ' not 20');
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
                woodcutting: hero.skills.woodcutting.xp,
                fishing: hero.skills.fishing.xp,
                mining: hero.skills.mining.xp,
                keyboard: !!window.game.input.keyboard,
                phaser: window.Phaser.VERSION
            };
        });

        var dedicated = await runOnly(
            page,
            opened,
            'skills: Northwood trees grant Woodcutting XP'
        );
        return { live: live, dedicated: dedicated };
    });

    if (result.live.player.x !== 328 || result.live.player.y !== 248) {
        throw new Error('did not start at spawn: ' + result.live.player.x + ',' + result.live.player.y);
    }
    if (result.live.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    if (result.live.woodcutting !== 20 || result.live.fishing !== 0 || result.live.mining !== 0) {
        throw new Error('live chop was ' + JSON.stringify(result.live));
    }
    console.log('PASS 1/1 Northwood trees Woodcutting XP', result.dedicated, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
