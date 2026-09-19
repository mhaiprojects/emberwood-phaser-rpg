/**
 * Playwright proof: from spawn (328, 248), unused stretch skills stay
 * backlog-only. Skills lists 13 rows (Firemaking extra); Agility and the
 * other eight have no empty Skills-tab rows or HUD tabs.
 *
 * Headless via tests/playwright-session.js (reuses a live server, or starts
 * python3 -m http.server on this port and kills that PID on exit).
 *   node tests/playwright-session.js 8765
 *   node tests/playwright-stretch-skills.js [port]
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
            var expected = [
                ['agility', 'Agility'],
                ['thieving', 'Thieving'],
                ['slayer', 'Slayer'],
                ['runecraft', 'Runecraft'],
                ['hunter', 'Hunter'],
                ['farming', 'Farming'],
                ['herblore', 'Herblore'],
                ['fletching', 'Fletching'],
                ['construction', 'Construction']
            ];
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
            if (typeof window.isStretchSkill !== 'function' || !window.STRETCH_SKILL_NAMES
                    || window.STRETCH_SKILL_NAMES.length !== 9) {
                throw new Error('STRETCH_SKILL_NAMES missing');
            }
            if (typeof window.smithBar === 'function') {
                throw new Error('Smithing started this tick');
            }
            if (window.ITEM_DB.logs || window.ITEM_DB.tinderbox || window.ITEM_DB.ore || window.ITEM_DB.net) {
                throw new Error('gathering section items started this tick');
            }
            if (window.SKILL_NAMES.length !== 13 || window.SKILL_NAMES[12][0] !== 'firemaking') {
                throw new Error('Firemaking is not the extra skill');
            }

            world.enterZone('haven', null);
            world.encounterLock = false;
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            if (world.npcs) {
                world.npcs.getChildren().forEach(function (obj) {
                    if (obj.body) {
                        obj.body.enable = false;
                        obj.body.setVelocity(0, 0);
                    }
                    obj.setPosition(24, 24);
                });
            }

            var listed = window.SKILL_NAMES.map(function (pair) { return pair[0]; });
            expected.forEach(function (pair, i) {
                if (window.STRETCH_SKILL_NAMES[i][0] !== pair[0] || !window.isStretchSkill(pair[0])) {
                    throw new Error(pair[1] + ' is not stretch');
                }
                if (listed.indexOf(pair[0]) !== -1) {
                    throw new Error(pair[1] + ' leaked into SKILL_NAMES');
                }
            });

            var hero = window.makeHero();
            window.game.registry.set('hero', hero);
            world.refreshHud();
            if (!hero.skills.agility || hero.skills.thieving || hero.skills.slayer) {
                throw new Error('stretch skills were stubbed on the hero');
            }
            if (window.skillTotal(hero) !== 22) {
                throw new Error('starter total is ' + window.skillTotal(hero) + ' not 22');
            }

            window.Hud.showTab('skills');
            var rows = document.querySelectorAll('#skills-list .skill-row');
            if (rows.length !== 13) {
                throw new Error('Skills tab has ' + rows.length + ' rows not 13');
            }
            if (!document.querySelector('#skills-list [data-skill="firemaking"]')) {
                throw new Error('Firemaking Skills row missing');
            }
            expected.forEach(function (pair) {
                if (document.querySelector('#skills-list [data-skill="' + pair[0] + '"]')) {
                    throw new Error(pair[1] + ' has an empty Skills-tab row');
                }
            });

            var tabs = document.querySelectorAll('#tab-bar button[data-tab]');
            if (tabs.length !== 8) {
                throw new Error('HUD has ' + tabs.length + ' tabs not 8');
            }
            expected.forEach(function (pair) {
                if (document.querySelector('#tab-bar [data-tab="' + pair[0] + '"]')) {
                    throw new Error(pair[1] + ' has a stub HUD tab');
                }
            });

            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            return {
                spawn: spawn,
                player: { x: Math.round(world.player.x), y: Math.round(world.player.y) },
                stretch: window.STRETCH_SKILL_NAMES.length,
                skills: window.SKILL_NAMES.length,
                rows: rows.length,
                tabs: tabs.length,
                total: window.skillTotal(hero),
                keyboard: !!window.game.input.keyboard,
                phaser: window.Phaser.VERSION
            };
        });

        var dedicated = await runOnly(
            page,
            opened,
            'skills: unused stretch skills stay backlog-only without empty tabs'
        );
        return { live: live, dedicated: dedicated };
    });

    if (result.live.player.x !== 328 || result.live.player.y !== 248) {
        throw new Error('did not start at spawn: ' + result.live.player.x + ',' + result.live.player.y);
    }
    if (result.live.keyboard) {
        throw new Error('Phaser keyboard must stay off');
    }
    if (result.live.stretch !== 9 || result.live.skills !== 13 || result.live.rows !== 13
            || result.live.tabs !== 8 || result.live.total !== 22) {
        throw new Error('live stretch skills were ' + JSON.stringify(result.live));
    }
    console.log('PASS 1/1 stretch skills backlog-only', result.dedicated, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
