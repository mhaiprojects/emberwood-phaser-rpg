/**
 * Priority gather/UI smoke: resize CSS vars, fishing net gate, woodcut/mine
 * full loops, bank deposit-x, craft gloves, rabbit hunter XP.
 * Headless via tests/playwright-session.js.
 *   node tests/playwright-gather-priority.js [port]
 */
(async function () {
    var port = process.argv[2] || '8765';
    var session = require('./playwright-session');

    var result = await session.withGamePage(port, async function (page) {
        var live = await page.evaluate(function () {
            function lastChat() {
                var vue = window.HudApp && window.HudApp.state && window.HudApp.state.chatLines;
                if (vue && vue.length) {
                    return vue[vue.length - 1].text || '';
                }
                var lines = document.querySelectorAll('.chat-line');
                return lines.length ? lines[lines.length - 1].textContent : '';
            }
            function clearChat() {
                if (window.HudApp && window.HudApp.state) {
                    window.HudApp.state.chatLines = [];
                }
                if (window.Hud && window.Hud.el && window.Hud.el.log) {
                    window.Hud.el.log.innerHTML = '';
                }
            }
            function qty(hero, id) {
                return window.itemQty(hero, id);
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

            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard must stay off');
            }
            if (String(window.Phaser.VERSION).indexOf('3.90') !== 0) {
                throw new Error('Phaser is ' + window.Phaser.VERSION);
            }

            // Resizable UI CSS vars + apply
            var sizes = window.Hud.applyShellSizes({ side: 250, bottom: 220, iface: 320 });
            if (sizes.side !== 250 || sizes.bottom !== 220 || sizes.iface !== 320) {
                throw new Error('shell sizes not applied');
            }
            var sideVar = getComputedStyle(document.documentElement).getPropertyValue('--shell-side').trim();
            if (sideVar !== '250px') {
                throw new Error('--shell-side is ' + sideVar);
            }
            if (!document.getElementById('resize-side') || !document.getElementById('resize-bottom')
                    || !document.getElementById('resize-iface')) {
                throw new Error('resize handles missing');
            }

            var world = window.game.scene.getScene('WorldScene');
            var spawn = window.defaultWorldSpawn();
            var hero = window.makeHero();
            window.game.registry.set('hero', hero);
            world.enterZone('haven', null);
            world.exitLock = false;
            world.encounterLock = false;
            world.placePlayer(spawn.x, spawn.y);
            park(world.npcs);
            park(world.mobs);
            world.refreshHud();

            // Fishing net gate
            world.enterZone('southshore', null);
            world.exitLock = false;
            world.encounterLock = false;
            park(world.npcs);
            park(world.mobs);
            var spot = window.SHORE_PROPS.spots[0];
            var near = window.nearestWalkableTile(world.tileGrid, spot.x, spot.y);
            var stand = window.tileCenter(near.tx, near.ty);
            world.placePlayer(stand.x, stand.y);
            hero = window.makeHero();
            window.game.registry.set('hero', hero);
            world.refreshHud();
            clearChat();
            var pt = window.tileCenter(spot.x, spot.y);
            world.onClick({ worldX: pt.x, worldY: pt.y });
            if (lastChat() !== 'You need a fishing net.') {
                throw new Error('net gate chat was "' + lastChat() + '" fishAction=' + !!world.fishAction + ' kind=' + (world.pickScenery(pt.x, pt.y) && world.pickScenery(pt.x, pt.y).kind));
            }
            window.addItem(hero, 'net', 1);
            clearChat();
            world.onClick({ worldX: pt.x, worldY: pt.y });
            if (!world.fishAction) {
                throw new Error('fish action did not start with net; chat=' + lastChat());
            }
            if (lastChat() !== 'You fish…') {
                throw new Error('fish start chat was ' + lastChat());
            }
            world.clearGather();

            // Woodcutting full loop
            world.enterZone('northwood', null);
            world.exitLock = false;
            world.encounterLock = false;
            park(world.npcs);
            park(world.mobs);
            hero = window.makeHero();
            window.addItem(hero, 'bronzeaxe', 1);
            window.game.registry.set('hero', hero);
            world.refreshHud();
            var tree = null;
            var y;
            var x;
            for (y = 0; y < world.tileGrid.length && !tree; y++) {
                for (x = 0; x < world.tileGrid[y].length; x++) {
                    if (window.woodcutTreeAt(x, y, 'northwood', world.tileGrid)) {
                        tree = { tx: x, ty: y };
                        break;
                    }
                }
            }
            if (!tree) {
                throw new Error('no northwood tree');
            }
            near = window.nearestWalkableTile(world.tileGrid, tree.tx, tree.ty);
            stand = window.tileCenter(near.tx, near.ty);
            world.placePlayer(stand.x, stand.y);
            clearChat();
            world.onClick({ worldX: window.tileCenter(tree.tx, tree.ty).x, worldY: window.tileCenter(tree.tx, tree.ty).y });
            if (!world.chopAction) {
                throw new Error('chop action missing; chat=' + lastChat());
            }
            if (lastChat() !== 'You swing your axe…') {
                throw new Error('chop start chat was ' + lastChat());
            }
            // Force complete
            if (world.chopAction.timer) {
                world.chopAction.timer.remove(false);
            }
            world.finishChopAction();
            hero = window.game.registry.get('hero');
            if (qty(hero, 'logs') < 1) {
                throw new Error('no logs after chop');
            }
            if (hero.skills.woodcutting.xp < 10) {
                throw new Error('no woodcutting XP');
            }
            if (world.tileGrid[tree.ty][tree.tx] === window.TILE.TREE) {
                throw new Error('tree did not deplete');
            }

            // Mining full loop
            world.enterZone('darkmine', null);
            world.exitLock = false;
            world.encounterLock = false;
            park(world.npcs);
            park(world.mobs);
            hero = window.makeHero();
            window.addItem(hero, 'bronzepick', 1);
            window.game.registry.set('hero', hero);
            world.refreshHud();
            var rock = null;
            for (y = 0; y < world.tileGrid.length && !rock; y++) {
                for (x = 0; x < world.tileGrid[y].length; x++) {
                    var found = window.mineRockAt(x, y, 'darkmine', world.tileGrid);
                    if (found && !(found.level > 1)) {
                        rock = found;
                        break;
                    }
                }
            }
            if (!rock) {
                throw new Error('no darkmine rock');
            }
            near = window.nearestWalkableTile(world.tileGrid, rock.x, rock.y);
            stand = window.tileCenter(near.tx, near.ty);
            world.placePlayer(stand.x, stand.y);
            clearChat();
            world.onClick({ worldX: window.tileCenter(rock.x, rock.y).x, worldY: window.tileCenter(rock.x, rock.y).y });
            if (!world.mineAction) {
                throw new Error('mine action missing; chat=' + lastChat());
            }
            if (world.mineAction.timer) {
                world.mineAction.timer.remove(false);
            }
            world.finishMineAction();
            hero = window.game.registry.get('hero');
            if (qty(hero, rock.ore) < 1) {
                throw new Error('no ore after mine');
            }
            if (hero.skills.mining.xp < 10) {
                throw new Error('no mining XP');
            }

            // Bank deposit-x
            hero = window.makeHero();
            window.addItem(hero, 'shrimp', 5);
            window.game.registry.set('hero', hero);
            world.enterZone('haven', null);
            world.placePlayer(spawn.x, spawn.y);
            window.Hud.showBank({ key: 'banker', name: 'Banker Elise' });
            window.Hud.bankSel = 'shrimp';
            if (window.Hud.el.bankQty) {
                window.Hud.el.bankQty.value = '2';
            }
            window.Hud.chooseBankAction('deposit-x');
            hero = window.game.registry.get('hero');
            if (qty(hero, 'shrimp') !== 11) {
                throw new Error('deposit-x left inv shrimp at ' + qty(hero, 'shrimp'));
            }
            if (!hero.bank || !hero.bank.length || hero.bank[0].qty !== 2) {
                throw new Error('deposit-x bank qty wrong');
            }
            if (!document.querySelector('[data-bank-tab="gear"]')) {
                throw new Error('gear bank tab missing');
            }
            window.Hud.hideBank();

            // Craft gloves
            hero = window.makeHero();
            window.addItem(hero, 'cowhide', 1);
            window.addItem(hero, 'string', 1);
            window.tanCowhide(hero, 'cowhide');
            var stitched = window.stitchLeather(hero);
            if (!stitched || !stitched.ok || stitched.made !== 'gloves') {
                throw new Error('stitch did not make gloves');
            }
            if (qty(hero, 'gloves') !== 1) {
                throw new Error('gloves missing');
            }

            // Hunting rabbit XP helper + loot table
            if (!window.MOB_SCALES.Rabbit) {
                throw new Error('Rabbit scale missing');
            }
            var loot = window.lootForMob({ type: 'Rabbit', gold: 1 });
            var fur = loot.filter(function (d) { return d.id === 'rabbitfur'; })[0];
            if (!fur) {
                throw new Error('rabbit loot missing fur');
            }
            hero = window.makeHero();
            window.grantHunterXp(hero, 12);
            if (hero.skills.hunter.xp !== 12) {
                throw new Error('hunter XP is ' + hero.skills.hunter.xp);
            }
            if (window.SKILL_NAMES.map(function (p) { return p[0]; }).indexOf('hunter') === -1) {
                throw new Error('hunter not in SKILL_NAMES');
            }

            var cowLoot = window.lootForMob({ type: 'Cow', gold: 3 });
            if (!cowLoot.some(function (d) { return d.id === 'cowhide'; })
                    || !cowLoot.some(function (d) { return d.id === 'rawbeef'; })) {
                throw new Error('cow loot missing hide/beef');
            }

            if (window.game.input.keyboard) {
                throw new Error('Phaser keyboard turned on');
            }
            return {
                keyboard: !!window.game.input.keyboard,
                phaser: window.Phaser.VERSION,
                hunter: hero.skills.hunter.xp,
                shellSide: sizes.side
            };
        });

        return live;
    });

    console.log('gather-priority OK', JSON.stringify(result));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
