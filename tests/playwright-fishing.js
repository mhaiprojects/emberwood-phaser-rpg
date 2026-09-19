/**
 * Playwright proof: from spawn (328, 248), left-click Southshore
 * fishing spots grant Fishing XP. Phaser keyboard stays off.
 * Woodcutting is not this tick.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-session.js 8765
 *   node tests/playwright-fishing.js [port]
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
            if (typeof window.fishAtSpot !== 'function' || typeof window.gainSkillXp !== 'function') {
                throw new Error('fishAtSpot / gainSkillXp missing');
            }
            if (typeof window.catchFish === 'function') {
                throw new Error('catchFish started this tick');
            }
            if (typeof window.chopTree === 'function' || typeof window.woodcutTree === 'function') {
                throw new Error('Woodcutting started this tick');
            }
            if (window.FISH_SPOT_XP !== 10) {
                throw new Error('FISH_SPOT_XP is ' + window.FISH_SPOT_XP + ' not 10');
            }
            var shore = window.SHORE_PROPS;
            if (!shore || !shore.spots || !shore.spots[0]) {
                throw new Error('SHORE_PROPS.spots missing');
            }
            var spot = shore.spots[0];
            if (spot.x !== 16 || spot.y !== 24) {
                throw new Error('first spot is ' + spot.x + ',' + spot.y + ' not 16,24');
            }

            world.enterZone('southshore', null);
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

            var hero = window.makeHero();
            window.game.registry.set('hero', hero);
            world.refreshHud();

            window.Hud.showTab('skills');
            window.Hud.el.log.innerHTML = '';
            var dropsHost = window.Hud.ensureXpDrops();
            if (dropsHost) {
                dropsHost.innerHTML = '';
            }
            var pt = window.tileCenter(spot.x, spot.y);
            world.onClick({ worldX: pt.x, worldY: pt.y });
            hero = window.game.registry.get('hero');
            if (hero.skills.fishing.xp !== 10) {
                throw new Error('spot Fishing XP is ' + hero.skills.fishing.xp + ' not 10');
            }
            if (lastChat() !== 'You fish at the fishing spot.') {
                throw new Error('spot chat was ' + lastChat());
            }
            if (hero.skills.cooking.xp !== 0) {
                throw new Error('Cooking XP changed');
            }
            if (hero.skills.woodcutting.xp !== 0) {
                throw new Error('Woodcutting XP changed');
            }
            var drop = document.querySelector('#xp-drops .xp-drop[data-skill="fishing"]');
            if (!drop || drop.getAttribute('data-xp') !== '10') {
                throw new Error('Fishing XP drop missing');
            }

            var helper = window.fishAtSpot(hero);
            if (!helper || !helper.ok || helper.xp !== 10) {
                throw new Error('fishAtSpot helper did not grant XP');
            }
            if (hero.skills.fishing.xp !== 20) {
                throw new Error('helper Fishing XP is ' + hero.skills.fishing.xp + ' not 20');
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
                cooking: hero.skills.cooking.xp,
                woodcutting: hero.skills.woodcutting.xp,
                keyboard: !!window.game.input.keyboard,
                phaser: window.Phaser.VERSION
            };
        });

        var dedicated = await runOnly(
            page,
            opened,
            'skills: Southshore fishing spots grant Fishing XP'
        );
        return { live: live, dedicated: dedicated };
    });

    if (result.live.player.x !== 328 || result.live.player.y !== 248) {
        throw new Error('did not start at spawn: ' + result.live.player.x + ',' + result.live.player.y);
    }
    if (result.live.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    if (result.live.fishing !== 20 || result.live.cooking !== 0 || result.live.woodcutting !== 0) {
        throw new Error('live fish was ' + JSON.stringify(result.live));
    }
    console.log('PASS 1/1 Southshore fishing spots Fishing XP', result.dedicated, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
