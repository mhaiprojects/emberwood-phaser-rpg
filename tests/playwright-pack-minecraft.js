/**
 * Playwright: boot Blocklands (?pack=minecraft), verify pack content + distinct town.
 *   node tests/playwright-pack-minecraft.js [port]
 */
(async function () {
    var port = process.argv[2] || '8765';
    var session = require('./playwright-session');
    var opened = await session.open(port);
    try {
        var page = opened.page;
        await page.goto(opened.base + 'index.html?pack=minecraft&v=mcpack1', {
            waitUntil: 'domcontentloaded'
        });
        await page.waitForFunction(function () {
            var sel = document.getElementById('pack-select');
            var vue = window.Hud && window.Hud.vueState && window.Hud.vueState();
            var opts = vue && vue.packOptions ? vue.packOptions : [];
            return window.Hud && window.Hud.el && window.Hud.el.start && !window.Hud.el.start.disabled
                && window.GameDataPack && window.GameDataPack.getActive() === 'minecraft'
                && sel && opts.length >= 2 && vue.packId === 'minecraft';
        }, null, { timeout: 25000 });

        var titleBits = await page.evaluate(function () {
            var vue = window.Hud.vueState();
            return {
                packId: window.GameDataPack.getActive(),
                selectVal: vue.packId,
                options: (vue.packOptions || []).map(function (p) { return p.id; }),
                title: vue.packTitle
            };
        });
        if (titleBits.packId !== 'minecraft') {
            throw new Error('active pack is ' + titleBits.packId);
        }
        if (titleBits.options.indexOf('minecraft') < 0) {
            throw new Error('pack options missing minecraft: ' + titleBits.options.join(','));
        }

        await page.click('#btn-start');
        await page.waitForFunction(function () {
            var world = window.game && window.game.scene.getScene('WorldScene');
            return world && world.player && window.Hud.mode === 'world';
        }, null, { timeout: 20000 });

        var live = await page.evaluate(function () {
            var world = window.game.scene.getScene('WorldScene');
            var zoneBag = window.ZONES || {};
            var zones = Object.keys(zoneBag);
            var skills = window.SKILL_NAMES || [];
            var center = window.TOWN_CENTER_TILE;
            var spawn = window.defaultWorldSpawn && window.defaultWorldSpawn();
            var guide = null;
            world.enterZone('spawn', null);
            world.exitLock = false;
            world.encounterLock = false;
            if (spawn) {
                world.placePlayer(spawn.x, spawn.y);
            }
            world.npcs.getChildren().forEach(function (npc) {
                if (npc.npcDef && npc.npcDef.key === 'guide') {
                    guide = { x: npc.x, y: npc.y, name: npc.npcDef.name };
                }
            });
            var forest = zoneBag.forest || null;
            var grid = null;
            var treeCount = 0;
            if (typeof generateMap === 'function' && forest) {
                grid = generateMap(forest.seed, forest.biome, forest.neighbors || {}, forest.id);
                for (var y = 0; y < grid.length; y++) {
                    for (var x = 0; x < grid[y].length; x++) {
                        if (grid[y][x] === window.TILE.TREE) {
                            treeCount += 1;
                        }
                    }
                }
            }
            return {
                packId: window.GameDataPack.getActive(),
                saveKey: window.GameDataPack.saveKey(),
                zone: world.zoneId,
                zones: zones,
                skillCount: skills.length,
                center: center,
                hasGuide: !!guide,
                guideName: guide && guide.name,
                forestTrees: treeCount,
                forestSeed: forest && forest.seed,
                biomeForestTrees: window.BIOME_PARAMS
                    && window.BIOME_PARAMS.forest
                    && window.BIOME_PARAMS.forest.scatter
                    && window.BIOME_PARAMS.forest.scatter.tree,
                questKeys: window.QUESTS ? Object.keys(window.QUESTS) : []
            };
        });

        if (live.packId !== 'minecraft') {
            throw new Error('in-world pack ' + live.packId);
        }
        if (live.zones.indexOf('spawn') < 0 || live.zones.indexOf('haven') >= 0) {
            throw new Error('unexpected zones ' + live.zones.join(','));
        }
        if (!live.hasGuide) {
            throw new Error('guide NPC missing in spawn');
        }
        if (live.center && live.center.x === 18 && live.center.y === 15) {
            throw new Error('town center still Emberhaven 18,15');
        }
        if (live.biomeForestTrees !== 110) {
            throw new Error('forest tree scatter is ' + live.biomeForestTrees + ' not 110');
        }
        if (live.forestTrees < 40) {
            throw new Error('generated forest too sparse (' + live.forestTrees + ' trees)');
        }
        console.log('PASS playwright-pack-minecraft', JSON.stringify(live));
        process.exit(0);
    } catch (err) {
        console.error('FAIL', err && err.stack ? err.stack : err);
        process.exitCode = 1;
    } finally {
        await opened.close();
    }
})().catch(function (err) {
    console.error('FAIL', err && err.stack ? err.stack : err);
    process.exit(1);
});
