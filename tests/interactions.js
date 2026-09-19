var EmberwoodTests = {
    cases: [],

    add: function (name, fn) {
        this.cases.push({ name: name, fn: fn });
    },

    run: function (win, onCase, only) {
        var self = this;
        var H = EmberwoodHarness;
        var results = [];
        var chain = Promise.resolve();
        var needle = only ? String(only).toLowerCase() : '';
        var cases = needle
            ? this.cases.filter(function (item) {
                return item.name.toLowerCase().indexOf(needle) !== -1;
            })
            : this.cases;
        cases.forEach(function (item) {
            chain = chain.then(function () {
                var started = Date.now();
                return Promise.resolve()
                    .then(function () {
                        return item.fn(win, H);
                    })
                    .then(function () {
                        var row = { name: item.name, ok: true, ms: Date.now() - started };
                        results.push(row);
                        if (onCase) {
                            onCase(row);
                        }
                    })
                    .catch(function (err) {
                        var row = {
                            name: item.name,
                            ok: false,
                            ms: Date.now() - started,
                            error: err && err.message ? err.message : String(err)
                        };
                        results.push(row);
                        if (onCase) {
                            onCase(row);
                        }
                    });
            });
        });
        return chain.then(function () {
            var failed = results.filter(function (row) { return !row.ok; }).length;
            var report = {
                total: results.length,
                passed: results.length - failed,
                failed: failed,
                results: results
            };
            win.__EMBERWOOD_TEST_RESULTS__ = report;
            window.__EMBERWOOD_TEST_RESULTS__ = report;
            return report;
        });
    }
};

EmberwoodTests.add('title: credits toggle', function (win, H) {
    return H.waitReady(win).then(function () {
        assert(win.document.getElementById('title-overlay').hidden === false, 'title overlay should show');
        var credits = win.document.getElementById('credit-text');
        assert(credits.hidden, 'credits start hidden');
        H.click(win, '#btn-credits');
        assert(!credits.hidden, 'credits should appear');
        H.click(win, '#btn-credits');
        assert(credits.hidden, 'credits should hide again');
        assert(win.document.getElementById('btn-start').textContent.indexOf('play') !== -1, 'start button label');
    });
});

EmberwoodTests.add('title: click here to play starts WorldScene in Emberhaven and credits toggle #credit-text', function (win, H) {
    return H.waitReady(win).then(function () {
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(win.Hud.mode, 'title', 'hud starts on title');
        assert(win.document.getElementById('title-overlay').hidden === false, 'title overlay should show');
        assert(win.game.scene.isActive('TitleScene'), 'TitleScene active before play');
        assert(!win.game.scene.isActive('WorldScene'), 'WorldScene stays off on title');
        var credits = win.document.getElementById('credit-text');
        var start = win.document.getElementById('btn-start');
        assert(credits, '#credit-text exists');
        assert(credits.hidden, 'credits start hidden');
        H.click(win, '#btn-credits');
        assert(!credits.hidden, 'Credits shows #credit-text');
        H.click(win, '#btn-credits');
        assert(credits.hidden, 'Credits hides #credit-text again');
        assert(start && start.textContent.indexOf('Click here to play') !== -1, 'start button label');
        return H.startPlay(win);
    }).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assert(win.game.scene.isActive('WorldScene'), 'Click here to play starts WorldScene');
        assert(!win.game.scene.isActive('TitleScene'), 'TitleScene stops after play');
        assert(win.document.getElementById('title-overlay').hidden, 'title overlay hidden after play');
        assertEqual(win.Hud.mode, 'world', 'hud mode world');
        assertEqual(win.game.registry.get('zone'), 'haven', 'registry zone haven');
        assertEqual(world.zoneId, 'haven', 'start zone');
        assertEqual(win.document.getElementById('hud-zone').textContent, 'Emberhaven', 'zone heading');
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off after play');
    });
});

EmberwoodTests.add('title: #btn-start stays disabled until TitleScene binds Hud.setStartHandler', function (win, H) {
    return H.waitReady(win).then(function () {
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(win.Hud.mode, 'title', 'hud starts on title');
        assert(win.game.scene.isActive('TitleScene'), 'TitleScene active before play');
        assert(!win.game.scene.isActive('WorldScene'), 'WorldScene stays off on title');

        var start = win.document.getElementById('btn-start');
        assert(start && start === win.Hud.el.start, '#btn-start is Hud.el.start');
        assertEqual(typeof win.Hud.setStartHandler, 'function', 'Hud.setStartHandler exists');
        assertEqual(typeof win.Hud._startHandler, 'function', 'TitleScene already bound the start handler');
        assertEqual(start.disabled, false, '#btn-start enabled after TitleScene bind');

        win.Hud._startHandler = null;
        start.disabled = true;
        assert(start.disabled, '#btn-start disabled without a bound handler');
        H.click(win, '#btn-start');
        win.Hud.onStart();
        assert(win.game.scene.isActive('TitleScene'), 'unbound click stays on TitleScene');
        assert(!win.game.scene.isActive('WorldScene'), 'WorldScene does not start before setStartHandler');
        assertEqual(win.Hud.mode, 'title', 'mode stays title until bind');
        assert(win.document.getElementById('title-overlay').hidden === false, 'title overlay stays');
        assert(start.disabled, '#btn-start stays disabled until setStartHandler');

        var title = win.game.scene.getScene('TitleScene');
        win.Hud.setStartHandler(function () {
            title.startGame();
        });
        assertEqual(typeof win.Hud._startHandler, 'function', 'setStartHandler stores the TitleScene callback');
        assertEqual(start.disabled, false, 'setStartHandler enables #btn-start');

        return H.startPlay(win);
    }).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assert(win.game.scene.isActive('WorldScene'), 'bound start starts WorldScene');
        assert(!win.game.scene.isActive('TitleScene'), 'TitleScene stops after play');
        assertEqual(win.Hud.mode, 'world', 'hud mode world');
        assertEqual(win.game.registry.get('zone'), 'haven', 'registry zone haven');
        assertEqual(world.zoneId, 'haven', 'start zone');
        assertEqual(win.document.getElementById('hud-zone').textContent, 'Emberhaven', 'zone heading');
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off after play');
    });
});

EmberwoodTests.add('title: click here to play enters Emberhaven', function (win, H) {
    return H.startPlay(win).then(function () {
        var world = H.world(win);
        assertEqual(world.zoneId, 'haven', 'start zone');
        assertEqual(win.document.getElementById('hud-zone').textContent, 'Emberhaven', 'zone heading');
        assertMatch(win.document.getElementById('hud-hp').textContent, '100 / 100', 'starting HP');
        assertEqual(win.document.getElementById('hud-gold').textContent, '8', 'starting gold');
        assert(H.chatHas(win, 'Emberhaven'), 'arrival chat');
        assertEqual(win.Hud.mode, 'world', 'hud mode');
        assertEqual(H.hero(win).autoAttack, true, 'auto-attack defaults on');
        assertEqual(H.hero(win).autoPickup, true, 'auto-pickup defaults on');
    });
});

EmberwoodTests.add('hud: tab bar opens every panel', function (win, H) {
    var tabs = ['combat', 'skills', 'quest', 'inv', 'equip', 'prayer', 'magic', 'settings'];
    tabs.forEach(function (tab) {
        H.click(win, '#tab-bar button[data-tab="' + tab + '"]');
        assert(H.panelVisible(win, tab), 'panel ' + tab + ' visible after click');
        assertEqual(win.Hud.tab, tab, 'hud.tab ' + tab);
        assert(win.document.querySelector('#tab-bar button[data-tab="' + tab + '"]').classList.contains('is-on'), tab + ' tab highlighted');
    });
});

EmberwoodTests.add('hud: F1–F8 switch panels', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        world.placePlayer(spawn.x, spawn.y);
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        var map = [
            ['F1', 'combat'], ['F2', 'skills'], ['F3', 'quest'], ['F4', 'inv'],
            ['F5', 'equip'], ['F6', 'prayer'], ['F7', 'magic'], ['F8', 'settings']
        ];
        map.forEach(function (pair) {
            win.dispatchEvent(new win.KeyboardEvent('keydown', { key: pair[0], code: pair[0], bubbles: true, cancelable: true }));
            assert(H.panelVisible(win, pair[1]), pair[0] + ' opens ' + pair[1]);
            assertEqual(win.Hud.tab, pair[1], pair[0] + ' sets hud.tab ' + pair[1]);
            var onBtn = win.document.querySelector('#tab-bar button[data-tab="' + pair[1] + '"]');
            assert(onBtn.classList.contains('is-on'), pair[0] + ' marks ' + pair[1] + ' is-on');
            var onTabs = win.document.querySelectorAll('#tab-bar button.is-on');
            assertEqual(onTabs.length, 1, pair[0] + ' leaves only one tab is-on');
            assertEqual(onTabs[0].getAttribute('data-tab'), pair[1], pair[0] + ' is-on matches ' + pair[1]);
        });
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off after F-keys');
    });
});

EmberwoodTests.add('hud: tab bar clicks match F-keys and only one panel is visible', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        world.placePlayer(spawn.x, spawn.y);
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        var map = [
            ['F1', 'combat'], ['F2', 'skills'], ['F3', 'quest'], ['F4', 'inv'],
            ['F5', 'equip'], ['F6', 'prayer'], ['F7', 'magic'], ['F8', 'settings']
        ];
        var visiblePanels = function () {
            return Array.prototype.filter.call(win.document.querySelectorAll('.tab-panel'), function (panel) {
                return !panel.hidden;
            });
        };
        var snapshot = function () {
            var shown = visiblePanels();
            var onTabs = win.document.querySelectorAll('#tab-bar button.is-on');
            return {
                tab: win.Hud.tab,
                panelId: shown[0] ? shown[0].id : null,
                panelCount: shown.length,
                onCount: onTabs.length,
                onTab: onTabs[0] ? onTabs[0].getAttribute('data-tab') : null
            };
        };
        map.forEach(function (pair) {
            var other = pair[1] === 'inv' ? 'combat' : 'inv';
            win.dispatchEvent(new win.KeyboardEvent('keydown', {
                key: pair[0], code: pair[0], bubbles: true, cancelable: true
            }));
            var afterKey = snapshot();
            assertEqual(afterKey.panelCount, 1, pair[0] + ' leaves only one .tab-panel visible');
            assertEqual(afterKey.tab, pair[1], pair[0] + ' sets hud.tab ' + pair[1]);
            assertEqual(afterKey.panelId, 'panel-' + pair[1], pair[0] + ' shows panel-' + pair[1]);
            assertEqual(afterKey.onCount, 1, pair[0] + ' leaves only one tab is-on');
            assertEqual(afterKey.onTab, pair[1], pair[0] + ' is-on matches ' + pair[1]);

            H.click(win, '#tab-bar button[data-tab="' + other + '"]');
            assertEqual(win.Hud.tab, other, 'switched away to ' + other + ' before ' + pair[1] + ' click');
            assertEqual(visiblePanels().length, 1, 'still one .tab-panel after switching away from ' + pair[0]);

            H.click(win, '#tab-bar button[data-tab="' + pair[1] + '"]');
            var afterClick = snapshot();
            assertEqual(afterClick.panelCount, 1, pair[1] + ' click leaves only one .tab-panel visible');
            assertEqual(afterClick.tab, afterKey.tab, pair[1] + ' click matches ' + pair[0] + ' hud.tab');
            assertEqual(afterClick.panelId, afterKey.panelId, pair[1] + ' click matches ' + pair[0] + ' panel');
            assertEqual(afterClick.onCount, afterKey.onCount, pair[1] + ' click matches ' + pair[0] + ' is-on count');
            assertEqual(afterClick.onTab, afterKey.onTab, pair[1] + ' click matches ' + pair[0] + ' is-on');
            assert(H.panelVisible(win, pair[1]), pair[1] + ' panel visible after click');
            var hiddenOthers = Array.prototype.filter.call(win.document.querySelectorAll('.tab-panel'), function (panel) {
                return panel.id !== 'panel-' + pair[1];
            });
            hiddenOthers.forEach(function (panel) {
                assert(panel.hidden, panel.id + ' stays hidden while ' + pair[1] + ' is open');
            });
        });
        assertEqual(win.document.querySelectorAll('.tab-panel').length, 8, 'eight tab panels exist');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off after tab clicks');
    });
});

EmberwoodTests.add('hud: skills, worn, combat style, inventory', function (win, H) {
    H.click(win, '#tab-bar button[data-tab="skills"]');
    var skillsText = win.document.getElementById('skills-list').innerText;
    ['Attack', 'Strength', 'Defence', 'Hitpoints', 'Cooking', 'Mining'].forEach(function (name) {
        assertMatch(skillsText, name, 'skill listed');
    });
    assertMatch(skillsText, '10', 'hitpoints level 10');

    H.click(win, '#tab-bar button[data-tab="equip"]');
    var worn = win.document.getElementById('equip-grid').innerText;
    assertMatch(worn, 'Bronze sword', 'worn weapon');
    assertMatch(worn, 'Wooden shield', 'worn shield');

    H.click(win, '#tab-bar button[data-tab="combat"]');
    H.click(win, '#style-row button[data-style="aggressive"]');
    assertEqual(H.hero(win).style, 'aggressive', 'aggressive style');
    assert(win.document.querySelector('[data-style="aggressive"]').classList.contains('is-on'), 'aggressive highlighted');
    H.click(win, '#style-row button[data-style="defensive"]');
    assertEqual(H.hero(win).style, 'defensive', 'defensive style');
    H.click(win, '#style-row button[data-style="accurate"]');
    assertEqual(H.hero(win).style, 'accurate', 'accurate style');

    H.click(win, '#tab-bar button[data-tab="inv"]');
    var inv = win.document.getElementById('inv-grid');
    assertEqual(inv.querySelectorAll('.inv-slot').length, 28, '28 inventory slots');
    assert(inv.querySelector('[data-item="shrimp"]'), 'shrimp in inventory');
    assert(inv.querySelector('[data-item="bread"]'), 'bread in inventory');
    assertMatch(inv.querySelector('[data-item="coins"]').textContent, '8', 'coin stack');
});

EmberwoodTests.add('hud: Accurate Aggressive Defensive highlight and persist on hero.style', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        world.placePlayer(spawn.x, spawn.y);
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        var assertStyleOn = function (style, label) {
            var buttons = win.document.querySelectorAll('#style-row button[data-style]');
            assertEqual(buttons.length, 3, label + ' has Accurate/Aggressive/Defensive');
            var on = [];
            for (var i = 0; i < buttons.length; i++) {
                if (buttons[i].classList.contains('is-on')) {
                    on.push(buttons[i].getAttribute('data-style'));
                }
            }
            assertEqual(on.length, 1, label + ' leaves only one style is-on');
            assertEqual(on[0], style, label + ' is-on matches ' + style);
            assertEqual(H.hero(win).style, style, label + ' hero.style is ' + style);
            assertEqual(win.game.registry.get('hero').style, style, label + ' registry persists ' + style);
        };

        H.click(win, '#tab-bar button[data-tab="combat"]');
        assertEqual(H.hero(win).style, 'accurate', 'starter style is Accurate');
        assertStyleOn('accurate', 'default Accurate');

        ['aggressive', 'defensive', 'accurate'].forEach(function (style) {
            H.click(win, '#style-row button[data-style="' + style + '"]');
            assertStyleOn(style, 'click ' + style);
            assert(H.chatHas(win, 'Combat style: ' + style), style + ' logs Combat style');
        });

        H.click(win, '#style-row button[data-style="aggressive"]');
        assertStyleOn('aggressive', 'before zone change');
        H.enterZone(win, 'northwood');
        world.refreshHud();
        H.click(win, '#tab-bar button[data-tab="combat"]');
        assertStyleOn('aggressive', 'after Northwood refreshHud');
        assertEqual(H.hero(win).style, 'aggressive', 'Aggressive survives zone change');

        H.click(win, '#style-row button[data-style="defensive"]');
        assertStyleOn('defensive', 'before return to haven');
        H.enterZone(win, 'haven');
        world.placePlayer(spawn.x, spawn.y);
        world.refreshHud();
        H.click(win, '#tab-bar button[data-tab="combat"]');
        assertStyleOn('defensive', 'after haven refreshHud');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off after style clicks');
    });
});

EmberwoodTests.add('hud: wear/wield/remove sword and shield refresh worn tab', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        world.placePlayer(spawn.x, spawn.y);
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assertEqual(typeof win.equipItem, 'function', 'equipItem helper');
        assertEqual(typeof win.unequipItem, 'function', 'unequipItem helper');
        assertEqual(win.itemEquipVerb('sword'), 'wield', 'sword verb is wield');
        assertEqual(win.itemEquipVerb('shield'), 'wear', 'shield verb is wear');
        assertEqual(win.ITEM_DB.sword.slot, 'weapon', 'sword is a weapon');
        assertEqual(win.ITEM_DB.shield.slot, 'shield', 'shield is a shield');
        assertEqual(win.ITEM_DB.sword.damage, 16, 'ITEM_DB sword lists damage 16');
        assertEqual(win.ITEM_DB.shield.defence, 1, 'ITEM_DB shield lists defence 1');

        function stackQty(hero, id) {
            var stack = hero.inventory.filter(function (row) { return row.id === id; })[0];
            return stack ? stack.qty : 0;
        }
        function wornText() {
            return win.document.getElementById('equip-grid').innerText;
        }
        function openInvMenu(id) {
            var slot = win.document.querySelector('#inv-grid [data-item="' + id + '"]');
            assert(slot, id + ' inv slot');
            slot.dispatchEvent(new win.MouseEvent('contextmenu', {
                bubbles: true,
                cancelable: true,
                view: win,
                button: 2,
                clientX: 40,
                clientY: 80
            }));
            return win.document.getElementById('ctx-menu');
        }

        var hero = H.hero(win);
        assertEqual(hero.equipment.weapon, 'sword', 'starter wears bronze sword');
        assertEqual(hero.equipment.shield, 'shield', 'starter wears wooden shield');
        assertEqual(stackQty(hero, 'sword'), 1, 'starter sword still in inventory');
        assertEqual(stackQty(hero, 'shield'), 1, 'starter shield still in inventory');
        assertEqual(hero.damage, 16, 'starter hero.damage is 16');

        H.click(win, '#tab-bar button[data-tab="equip"]');
        var worn = wornText();
        assertMatch(worn, 'Bronze sword', 'equip tab shows bronze sword name');
        assertMatch(worn, 'Wooden shield', 'equip tab shows wooden shield name');
        assertEqual(worn.indexOf('16'), -1, 'equip tab does not show sword damage');
        assertEqual(worn.toLowerCase().indexOf('defence'), -1, 'equip tab does not show shield defence');
        var renderSrc = String(win.Hud.renderEquip);
        assertEqual(renderSrc.indexOf('damage'), -1, 'renderEquip does not read item damage');
        assertEqual(renderSrc.indexOf('defence'), -1, 'renderEquip does not read item defence');

        H.click(win, '#tab-bar button[data-tab="inv"]');
        var menu = openInvMenu('sword');
        assert(!menu.hidden, 'right-click sword opens menu');
        assert(menu.querySelector('[data-ctx="wield"]'), 'Wield action is listed');
        assertEqual(menu.querySelector('[data-ctx="wield"]').textContent, 'Wield', 'Wield label');
        assert(menu.querySelector('[data-ctx="drop"]'), 'Drop stays on sword');
        H.mouseClick(win, menu.querySelector('[data-ctx="wield"]'));
        hero = H.hero(win);
        assertEqual(hero.equipment.weapon, 'sword', 'wield keeps the bronze sword equipped');
        assertEqual(stackQty(hero, 'sword'), 0, 'wield takes the inventory sword');
        assertEqual(H.lastChat(win), 'You wield the Bronze sword.', 'wield chat');
        H.click(win, '#tab-bar button[data-tab="equip"]');
        worn = wornText();
        assertMatch(worn, 'Bronze sword', 'worn tab still shows bronze sword after wield');
        assert(!win.document.querySelector('#inv-grid [data-item="sword"]'), 'inv sword slot empty after wield');

        var wornSword = win.document.querySelector('#equip-grid [data-equip-slot="weapon"]');
        assert(wornSword, 'worn sword is clickable');
        wornSword.dispatchEvent(new win.MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            view: win,
            button: 2,
            clientX: 48,
            clientY: 90
        }));
        menu = win.document.getElementById('ctx-menu');
        assert(!menu.hidden, 'right-click worn sword opens Remove');
        var removeBtn = menu.querySelector('[data-ctx="remove"]');
        assert(removeBtn, 'Remove action is listed');
        assertEqual(removeBtn.textContent, 'Remove', 'Remove label');
        H.mouseClick(win, removeBtn);
        hero = H.hero(win);
        assertEqual(hero.equipment.weapon, null, 'remove clears the weapon slot');
        assertEqual(stackQty(hero, 'sword'), 1, 'removed sword returns to inventory');
        assertEqual(H.lastChat(win), 'You remove the Bronze sword.', 'remove sword chat');
        worn = wornText();
        assertEqual(worn.indexOf('Bronze sword'), -1, 'worn tab dropped the sword name');
        assertMatch(worn, 'None', 'weapon slot shows None');
        assertMatch(worn, 'Wooden shield', 'shield stays worn');

        H.click(win, '#tab-bar button[data-tab="inv"]');
        menu = openInvMenu('sword');
        H.mouseClick(win, menu.querySelector('[data-ctx="wield"]'));
        hero = H.hero(win);
        assertEqual(hero.equipment.weapon, 'sword', 'wield from inv equips the sword');
        assertEqual(stackQty(hero, 'sword'), 0, 'second wield empties inv sword');
        H.click(win, '#tab-bar button[data-tab="equip"]');
        assertMatch(wornText(), 'Bronze sword', 'worn tab shows bronze sword after re-wield');

        H.click(win, '#tab-bar button[data-tab="inv"]');
        menu = openInvMenu('shield');
        assert(menu.querySelector('[data-ctx="wear"]'), 'Wear action is listed');
        assertEqual(menu.querySelector('[data-ctx="wear"]').textContent, 'Wear', 'Wear label');
        H.mouseClick(win, menu.querySelector('[data-ctx="wear"]'));
        hero = H.hero(win);
        assertEqual(hero.equipment.shield, 'shield', 'wear keeps the wooden shield equipped');
        assertEqual(stackQty(hero, 'shield'), 0, 'wear takes the inventory shield');
        assertEqual(H.lastChat(win), 'You wear the Wooden shield.', 'wear chat');
        H.click(win, '#tab-bar button[data-tab="equip"]');
        assertMatch(wornText(), 'Wooden shield', 'worn tab still shows wooden shield after wear');

        H.click(win, '#equip-grid [data-equip-slot="shield"]');
        hero = H.hero(win);
        assertEqual(hero.equipment.shield, null, 'left-click worn shield removes it');
        assertEqual(stackQty(hero, 'shield'), 1, 'removed shield returns to inventory');
        assertEqual(H.lastChat(win), 'You remove the Wooden shield.', 'remove shield chat');
        worn = wornText();
        assertEqual(worn.indexOf('Wooden shield'), -1, 'worn tab dropped the shield name');
        assertMatch(worn, 'Bronze sword', 'sword stays worn');
        assertMatch(worn, 'None', 'shield slot shows None');

        H.click(win, '#tab-bar button[data-tab="inv"]');
        menu = openInvMenu('shield');
        H.mouseClick(win, menu.querySelector('[data-ctx="wear"]'));
        hero = H.hero(win);
        assertEqual(hero.equipment.shield, 'shield', 'wear from inv equips the shield');
        assertEqual(stackQty(hero, 'shield'), 0, 'second wear empties inv shield');
        H.click(win, '#tab-bar button[data-tab="equip"]');
        worn = wornText();
        assertMatch(worn, 'Bronze sword', 'worn tab shows sword after re-wear');
        assertMatch(worn, 'Wooden shield', 'worn tab shows shield after re-wear');

        hero.damage = 24;
        win.game.registry.set('hero', hero);
        world.refreshHud();
        worn = wornText();
        assertMatch(worn, 'Bronze sword', 'still worn after hero.damage change');
        assertEqual(worn.indexOf('24'), -1, 'equip tab still hides combat numbers');

        return H.startCustomFight(win, [
            { type: 'Goblin', texture: 'slime', tint: 0x5aa33a, hp: 80, damage: 8, gold: 0, xp: 1 }
        ]);
    }).then(function () {
        var battle = H.battle(win);
        var you = battle.heroes[0];
        var hero = H.hero(win);
        assertEqual(hero.equipment.weapon, 'sword', 'still wearing sword in battle');
        assertEqual(hero.equipment.shield, 'shield', 'still wearing shield in battle');
        assertEqual(you.damage, 24, 'battle actor still copies hero.damage onto the sprite');

        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        return H.forceFlee(win);
    }).then(function () {
        H.enterZone(win, 'haven');
    }).catch(function (err) {
        return H.cleanupBattle(win).then(function () {
            throw err;
        });
    });
});

EmberwoodTests.add('combat: equipped weapon damage and shield defence apply to hits', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        world.placePlayer(spawn.x, spawn.y);
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assertEqual(typeof win.equippedWeaponDamage, 'function', 'equippedWeaponDamage helper');
        assertEqual(typeof win.equippedShieldDefence, 'function', 'equippedShieldDefence helper');
        assertEqual(win.ITEM_DB.sword.damage, 16, 'ITEM_DB sword damage is 16');
        assertEqual(win.ITEM_DB.shield.defence, 1, 'ITEM_DB shield defence is 1');

        var hero = H.hero(win);
        assertEqual(hero.equipment.weapon, 'sword', 'starter wears bronze sword');
        assertEqual(hero.equipment.shield, 'shield', 'starter wears wooden shield');
        hero.damage = 24;
        win.game.registry.set('hero', hero);
        world.refreshHud();
        assertEqual(win.equippedWeaponDamage(hero, hero.damage), 16, 'worn sword uses ITEM_DB damage 16 not hero.damage 24');
        assertEqual(win.equippedShieldDefence(hero), 1, 'worn shield uses ITEM_DB defence 1');

        assert(win.unequipItem(hero, 'weapon'), 'unequip sword');
        win.game.registry.set('hero', hero);
        assertEqual(hero.equipment.weapon, null, 'sword slot empty');
        assertEqual(win.equippedWeaponDamage(hero, hero.damage), 24, 'unarmed falls back to hero.damage');
        assert(win.equipItem(hero, 'sword'), 're-wield sword');
        win.game.registry.set('hero', hero);
        assertEqual(win.equippedWeaponDamage(hero, hero.damage), 16, 're-wield restores sword damage 16');

        assert(win.unequipItem(hero, 'shield'), 'unequip shield');
        win.game.registry.set('hero', hero);
        assertEqual(win.equippedShieldDefence(hero), 0, 'no shield is defence 0');
        assert(win.equipItem(hero, 'shield'), 're-wear shield');
        win.game.registry.set('hero', hero);
        assertEqual(win.equippedShieldDefence(hero), 1, 're-wear restores shield defence 1');

        return H.startCustomFight(win, [
            { type: 'Goblin', texture: 'slime', tint: 0x5aa33a, hp: 80, damage: 8, gold: 0, xp: 1 }
        ]);
    }).then(function () {
        var battle = H.battle(win);
        var you = battle.heroes[0];
        var foe = battle.enemies[0];
        var hero = H.hero(win);
        assertEqual(hero.equipment.weapon, 'sword', 'still wearing sword in battle');
        assertEqual(hero.equipment.shield, 'shield', 'still wearing shield in battle');
        assertEqual(you.damage, 24, 'battle sprite still holds hero.damage 24');
        assertEqual(win.equippedWeaponDamage(hero, you.damage), 16, 'attack helper still reads worn sword 16');

        var orig = win.Phaser.Math.Between;
        win.Phaser.Math.Between = function (lo, hi) {
            assertEqual(lo, -2, 'hit variance low is -2');
            assertEqual(hi, 2, 'hit variance high is +2');
            return 0;
        };

        function landHit(attacker, defender, label) {
            var before = defender.hp;
            attacker.attack(defender);
            return H.waitUntil(function () {
                return defender.hp < before;
            }, 2000, label).then(function () {
                return before - defender.hp;
            });
        }

        return landHit(you, foe, 'worn sword outgoing hit').then(function (drop) {
            assertEqual(drop, 16, 'outgoing hit uses worn sword damage 16, not hero.damage 24');
            var incoming = you.takeDamage(8);
            assertEqual(incoming, 7, 'incoming hit is 8 minus worn shield defence 1');

            assert(win.unequipItem(hero, 'weapon'), 'unequip sword in battle');
            win.game.registry.set('hero', hero);
            assertEqual(hero.equipment.weapon, null, 'battle unequip clears weapon');
            return landHit(you, foe, 'unarmed outgoing hit');
        }).then(function (drop) {
            assertEqual(drop, 24, 'unarmed outgoing hit falls back to hero.damage 24');

            assert(win.unequipItem(hero, 'shield'), 'unequip shield in battle');
            win.game.registry.set('hero', hero);
            assertEqual(hero.equipment.shield, null, 'battle unequip clears shield');
            assertEqual(you.takeDamage(8), 8, 'unshielded incoming hit is amount + 0');

            assert(win.equipItem(hero, 'sword'), 're-wield in battle');
            assert(win.equipItem(hero, 'shield'), 're-wear in battle');
            win.game.registry.set('hero', hero);
            return landHit(you, foe, 're-equipped outgoing hit');
        }).then(function (drop) {
            assertEqual(drop, 16, 're-wield outgoing hit is sword damage 16 again');
            assertEqual(you.takeDamage(8), 7, 're-wear incoming hit is reduced by defence 1 again');
            win.Phaser.Math.Between = orig;
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
            return H.forceFlee(win);
        }).catch(function (err) {
            win.Phaser.Math.Between = orig;
            throw err;
        });
    }).then(function () {
        H.enterZone(win, 'haven');
    }).catch(function (err) {
        return H.cleanupBattle(win).then(function () {
            throw err;
        });
    });
});

EmberwoodTests.add('hud: worn tab lists OSRS slots with empty None', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        world.placePlayer(spawn.x, spawn.y);
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(win.EQUIP_SLOTS, 'EQUIP_SLOTS is exported');
        assertEqual(typeof win.ensureEquipment, 'function', 'ensureEquipment helper');
        assertEqual(win.EQUIP_SLOTS.length, 11, 'eleven worn slots');
        assertEqual(win.EQUIP_SLOTS.map(function (row) { return row[0]; }).join(','),
            'head,cape,neck,ammo,weapon,body,shield,legs,hands,feet,ring',
            'OSRS slot keys');
        assertEqual(win.EQUIP_SLOTS.map(function (row) { return row[1]; }).join(','),
            'Head,Cape,Neck,Ammo,Weapon,Body,Shield,Legs,Hands,Feet,Ring',
            'OSRS slot labels');

        var hero = H.hero(win);
        win.EQUIP_SLOTS.forEach(function (row) {
            assert(Object.prototype.hasOwnProperty.call(hero.equipment, row[0]), row[0] + ' slot exists');
        });
        assertEqual(hero.equipment.weapon, 'sword', 'starter wears bronze sword');
        assertEqual(hero.equipment.shield, 'shield', 'starter wears wooden shield');
        ['head', 'cape', 'neck', 'ammo', 'body', 'legs', 'hands', 'feet', 'ring'].forEach(function (slot) {
            assertEqual(hero.equipment[slot], null, slot + ' starts empty');
        });

        H.click(win, '#tab-bar button[data-tab="equip"]');
        var rows = win.document.querySelectorAll('#equip-grid .equip-row');
        assertEqual(rows.length, 11, 'worn tab renders eleven rows');
        var labels = [];
        var empty = 0;
        var filled = 0;
        for (var i = 0; i < rows.length; i++) {
            var label = rows[i].querySelector('span');
            assert(label, 'slot ' + i + ' has a label');
            labels.push(label.textContent);
            var key = win.EQUIP_SLOTS[i][0];
            var button = rows[i].querySelector('[data-equip-slot="' + key + '"]');
            if (key === 'weapon') {
                assert(button, 'weapon slot is clickable');
                assertMatch(button.textContent, 'Bronze sword', 'weapon shows bronze sword');
                filled += 1;
            } else if (key === 'shield') {
                assert(button, 'shield slot is clickable');
                assertMatch(button.textContent, 'Wooden shield', 'shield shows wooden shield');
                filled += 1;
            } else {
                assert(!button, key + ' empty slot has no remove button');
                assertMatch(rows[i].textContent, 'None', key + ' shows None');
                empty += 1;
            }
        }
        assertEqual(labels.join(','),
            'Head,Cape,Neck,Ammo,Weapon,Body,Shield,Legs,Hands,Feet,Ring',
            'worn rows follow OSRS order');
        assertEqual(filled, 2, 'sword and shield are worn');
        assertEqual(empty, 9, 'nine empty slots');

        var worn = win.document.getElementById('equip-grid').innerText;
        assertEqual(worn.indexOf('16'), -1, 'worn tab hides sword damage');
        assertEqual(worn.toLowerCase().indexOf('defence'), -1, 'worn tab hides shield defence');
        var renderSrc = String(win.Hud.renderEquip);
        assertEqual(renderSrc.indexOf('damage'), -1, 'renderEquip does not read item damage');
        assertEqual(renderSrc.indexOf('defence'), -1, 'renderEquip does not read item defence');

        var leftover = { equipment: { weapon: 'sword' } };
        win.ensureEquipment(leftover);
        assertEqual(leftover.equipment.head, null, 'ensureEquipment fills missing head');
        assertEqual(leftover.equipment.ring, null, 'ensureEquipment fills missing ring');
        assertEqual(leftover.equipment.shield, null, 'ensureEquipment fills missing shield');
        assertEqual(leftover.equipment.weapon, 'sword', 'ensureEquipment keeps worn sword');

        hero.equipment = { weapon: 'sword' };
        win.game.registry.set('hero', hero);
        world.refreshHud();
        rows = win.document.querySelectorAll('#equip-grid .equip-row');
        assertEqual(rows.length, 11, 'partial equipment still renders eleven rows');
        assertMatch(win.document.getElementById('equip-grid').innerText, 'None', 'missing slots show None');
        assert(win.document.querySelector('#equip-grid [data-equip-slot="weapon"]'), 'partial hero still shows sword');
        assert(!win.document.querySelector('#equip-grid [data-equip-slot="shield"]'), 'missing shield stays empty');

        win.ensureEquipment(hero);
        hero.equipment.shield = 'shield';
        win.game.registry.set('hero', hero);
        world.refreshHud();
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('hud: worn tab shows melee +defence from equipment', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        world.placePlayer(spawn.x, spawn.y);
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assertEqual(typeof win.equipmentMeleeDefence, 'function', 'equipmentMeleeDefence helper');
        assertEqual(typeof win.signedStat, 'function', 'signedStat helper');
        assertEqual(win.ITEM_DB.shield.defence, 1, 'ITEM_DB shield defence is 1');
        assertEqual(win.ITEM_DB.sword.damage, 16, 'ITEM_DB sword damage is 16');

        var hero = H.hero(win);
        assertEqual(hero.equipment.weapon, 'sword', 'starter wears bronze sword');
        assertEqual(hero.equipment.shield, 'shield', 'starter wears wooden shield');
        assertEqual(win.equipmentMeleeDefence(hero), 1, 'worn wooden shield is melee +defence 1');
        assertEqual(win.equippedShieldDefence(hero), 1, 'combat shield defence still 1');
        assertEqual(win.signedStat(1), '+1', 'signedStat prefixes plus');
        assertEqual(win.signedStat(0), '+0', 'signedStat zero is +0');

        H.click(win, '#tab-bar button[data-tab="equip"]');
        var stats = win.document.getElementById('equip-stats');
        assert(stats, 'equip-stats readout exists');
        var text = stats.innerText;
        assertMatch(text, 'Equipment stats', 'stats heading is listed');
        assertMatch(text, 'Melee +defence', 'stats readout labels melee +defence');
        assertMatch(text, '+1', 'starter wooden shield shows +1');
        assertEqual(text.indexOf('16'), -1, 'readout does not show sword damage 16');

        var rows = win.document.querySelectorAll('#equip-grid .equip-row');
        assertEqual(rows.length, 11, 'slot rows stay eleven');
        var worn = win.document.getElementById('equip-grid').innerText;
        assertEqual(worn.toLowerCase().indexOf('defence'), -1, 'slot grid still hides defence');
        assertEqual(worn.indexOf('16'), -1, 'slot grid still hides sword damage');

        assert(win.unequipItem(hero, 'shield'), 'unequip shield');
        win.game.registry.set('hero', hero);
        world.refreshHud();
        assertEqual(hero.equipment.shield, null, 'shield slot empty');
        assertEqual(win.equipmentMeleeDefence(hero), 0, 'no shield is melee +defence 0');
        assertEqual(win.equippedShieldDefence(hero), 0, 'combat shield defence is 0');
        text = win.document.getElementById('equip-stats').innerText;
        assertMatch(text, 'Melee +defence', 'label stays after unequip');
        assertMatch(text, '+0', 'readout drops to +0');
        assertEqual(text.indexOf('+1'), -1, 'unequip hides +1');

        assert(win.equipItem(hero, 'shield'), 're-wear shield');
        win.game.registry.set('hero', hero);
        world.refreshHud();
        assertEqual(win.equipmentMeleeDefence(hero), 1, 're-wear restores melee +defence 1');
        text = win.document.getElementById('equip-stats').innerText;
        assertMatch(text, '+1', 'readout restores +1');

        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('hud: inventory and ground Examine logs ITEM_DB flavor', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.setAutoPickup(win, true);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        world.clearLoot();
        if (world.clearWalk) {
            world.clearWalk();
        }
        if (win.Hud.hideContextMenu) {
            win.Hud.hideContextMenu();
        }
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assertEqual(win.Hud.mode, 'world', 'world mode');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(!world.cursors, 'WorldScene has no Phaser cursors');
        assertEqual(typeof win.itemExamineText, 'function', 'itemExamineText exists');
        assertEqual(typeof win.Hud.examineItem, 'function', 'Hud.examineItem exists');
        assertEqual(typeof world.examineLoot, 'function', 'examineLoot exists');
        assertEqual(typeof world.showLootExamineMenu, 'function', 'showLootExamineMenu exists');

        var expected = {
            coins: 'A small pile of copper and silver coins.',
            shrimp: 'A cooked shrimp, still warm enough to eat.',
            rawshrimp: 'A raw shrimp. It should be cooked.',
            bread: 'A dense loaf baked for the road.',
            sword: 'A short bronze blade, nicked but serviceable.',
            shortbow: 'A yew shortbow, light enough for bronze arrows.',
            arrow: 'A sheaf of bronze arrows with grey-goose fletching.',
            shield: 'A round wooden shield bound with iron.',
            bones: 'Dry bones. Someone should bury them.',
            airrune: 'A pale blue rune. It hums with air.',
            mindrune: 'A dull purple rune. It focuses the mind.',
            key: 'A heavy iron key with a worn bit.',
            cowhide: 'A raw cowhide. It can be crafted into leather.',
            leather: 'Soft leather, ready to stitch.',
            string: 'A short length of string for stitching leather.'
        };
        var ids = Object.keys(win.ITEM_DB);
        assertEqual(ids.length, 15, 'fifteen ITEM_DB entries');
        var seen = {};
        ids.forEach(function (id) {
            var def = win.ITEM_DB[id];
            assert(def.examine, id + ' has examine text');
            var line = win.itemExamineText(id);
            assertEqual(line, expected[id], id + ' examine text');
            assert(line.indexOf('.') !== -1, id + ' examine is a sentence');
            assert(!seen[line], id + ' examine is unique');
            seen[line] = id;
        });

        var hero = win.makeHero();
        win.addItem(hero, 'bones', 1);
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assertEqual(hero.inventory.filter(function (row) { return row.id === 'bones'; })[0].qty, 1, 'starter bones 1');

        H.click(win, '#tab-bar button[data-tab="inv"]');
        var inv = win.document.getElementById('inv-grid');
        assert(inv.querySelector('[data-item="bones"]'), 'bones slot');
        assert(inv.querySelector('[data-item="coins"]'), 'coins slot');

        win.Hud.el.log.innerHTML = '';
        H.click(win, '#inv-grid [data-item="shrimp"]');
        assert(H.chatHas(win, 'already at full health'), 'left-click food still eats');
        assert(H.lastChat(win) !== win.itemExamineText('shrimp'), 'left-click does not log examine flavor');

        var menu = win.document.getElementById('ctx-menu');
        assert(menu, 'ctx-menu element exists');
        win.Hud.hideContextMenu();
        var slot = inv.querySelector('[data-item="bones"]');
        slot.dispatchEvent(new win.MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            view: win,
            button: 2,
            clientX: 40,
            clientY: 80
        }));
        assert(!menu.hidden, 'right-click inventory opens menu');
        var examBtn = menu.querySelector('[data-ctx="examine"]');
        var dropBtn = menu.querySelector('[data-ctx="drop"]');
        assert(dropBtn, 'Drop stays listed');
        assert(examBtn, 'Examine action is listed');
        assertEqual(examBtn.textContent, 'Examine', 'Examine label');
        assertEqual(win.Hud.ctxTarget.itemId, 'bones', 'menu stores bones id');
        assertEqual(win.Hud.ctxTarget.kind, 'inv', 'menu is inventory');
        assert(!menu.querySelector('[data-ctx="take"]'), 'Take is not this tick');
        H.mouseClick(win, examBtn);
        assert(menu.hidden, 'Examine closes the menu');
        assertEqual(H.lastChat(win), expected.bones, 'inventory Examine logs bones flavor');
        assertEqual(H.hero(win).inventory.filter(function (row) { return row.id === 'bones'; })[0].qty, 1, 'Examine does not drop bones');
        assertEqual(H.lootLive(win).length, 0, 'Examine does not spawn loot');

        var dropped = world.dropFromInventory('bones', 1);
        assert(dropped && dropped.sprite, 'bones on the ground');
        assertEqual(H.hero(win).inventory.filter(function (row) { return row.id === 'bones'; }).length, 0, 'bones left inventory');
        var live = H.lootLive(win);
        assertEqual(live.length, 1, 'one ground pile');
        assertEqual(live[0].id, 'bones', 'ground bones id');
        assertEqual(Math.round(live[0].sprite.x), 328, 'bones pile at player x');
        assertEqual(Math.round(live[0].sprite.y), 248, 'bones pile at player y');

        win.Hud.el.log.innerHTML = '';
        win.Hud.hideContextMenu();
        world.onClick({
            worldX: live[0].sprite.x,
            worldY: live[0].sprite.y,
            button: 2,
            rightButtonDown: function () { return true; },
            event: { clientX: 48, clientY: 56 }
        });
        assert(!world.walkTarget, 'right-click loot does not walk');
        assert(!menu.hidden, 'right-click loot opens Examine');
        examBtn = menu.querySelector('[data-ctx="examine"]');
        assert(examBtn, 'ground Examine is listed');
        assertEqual(examBtn.textContent, 'Examine', 'ground Examine label');
        assert(!menu.querySelector('[data-ctx="take"]'), 'ground Take is not this tick');
        assert(!menu.querySelector('[data-ctx="walk-here"]'), 'Walk here is not listed on loot');
        assertEqual(win.Hud.ctxTarget.kind, 'loot', 'menu is ground loot');
        assertEqual(win.Hud.ctxTarget.itemId, 'bones', 'ground menu stores bones id');
        H.mouseClick(win, examBtn);
        assert(menu.hidden, 'ground Examine closes the menu');
        assertEqual(H.lastChat(win), expected.bones, 'ground Examine logs bones flavor');
        live = H.lootLive(win);
        assertEqual(live.length, 1, 'Examine does not pick up bones');
        assertEqual(live[0].taken, false, 'ground bones stay');

        win.Hud.el.log.innerHTML = '';
        assertEqual(world.tryPickup(live[0]), true, 'left-click still takes the pile');
        assert(H.chatHas(win, 'You pick up Bones.'), 'pickup chat after examine');
        assertEqual(H.lootLive(win).length, 0, 'pile gone after pickup');
        assertEqual(H.hero(win).inventory.filter(function (row) { return row.id === 'bones'; })[0].qty, 1, 'bones return on pickup');

        world.dropFromInventory('bones', 1);
        live = H.lootLive(win);
        assertEqual(live.length, 1, 'bones re-dropped');
        world.encounterLock = true;
        win.Hud.hideContextMenu();
        world.onClick({
            worldX: live[0].sprite.x,
            worldY: live[0].sprite.y,
            button: 2,
            rightButtonDown: function () { return true; },
            event: { clientX: 48, clientY: 56 }
        });
        assert(menu.hidden, 'encounterLock ignores loot right-click');
        world.encounterLock = false;
        win.Hud.mode = 'battle';
        world.onClick({
            worldX: live[0].sprite.x,
            worldY: live[0].sprite.y,
            button: 2,
            rightButtonDown: function () { return true; },
            event: { clientX: 48, clientY: 56 }
        });
        assert(menu.hidden, 'battle mode ignores loot right-click');
        win.Hud.mode = 'world';

        world.clearLoot();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'still at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'still at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('hud: ITEM_DB value fields for shops and later High Alch', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.setAutoPickup(win, true);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        world.clearLoot();
        if (world.clearWalk) {
            world.clearWalk();
        }
        if (win.Hud.hideContextMenu) {
            win.Hud.hideContextMenu();
        }
        if (win.Hud.hideShop) {
            win.Hud.hideShop();
        }
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assertEqual(win.Hud.mode, 'world', 'world mode');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(!world.cursors, 'WorldScene has no Phaser cursors');
        assertEqual(typeof win.itemValue, 'function', 'itemValue helper exists');
        assertEqual(typeof win.highAlch, 'undefined', 'High Alch is not this tick');
        assertEqual(typeof win.castHighAlch, 'undefined', 'castHighAlch is not this tick');

        var expected = {
            coins: 1,
            shrimp: 5,
            rawshrimp: 5,
            bread: 12,
            sword: 26,
            shortbow: 32,
            arrow: 1,
            shield: 20,
            bones: 1,
            airrune: 4,
            mindrune: 3,
            key: 1,
            cowhide: 2,
            leather: 4,
            string: 1
        };
        var ids = Object.keys(win.ITEM_DB);
        assertEqual(ids.length, 15, 'fifteen ITEM_DB entries');
        assert(!win.ITEM_DB.logs && !win.ITEM_DB.ore && !win.ITEM_DB.net, 'no gathering section items');
        ids.forEach(function (id) {
            var def = win.ITEM_DB[id];
            assertEqual(typeof def.value, 'number', id + ' has a numeric value');
            assertEqual(def.value, Math.floor(def.value), id + ' value is an integer');
            assert(def.value >= 0, id + ' value is not negative');
            assertEqual(def.value, expected[id], id + ' shop/alch value');
            assertEqual(win.itemValue(id), expected[id], id + ' itemValue helper');
            assertEqual(def.buyPrice, undefined, id + ' has no buyPrice this tick');
            assertEqual(def.sellPrice, undefined, id + ' has no sellPrice this tick');
        });
        assertEqual(win.itemValue('not-an-item'), 0, 'unknown items are worth 0');

        var hero = win.makeHero();
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assertEqual(hero.gold, 8, 'starter gold is 8');
        assertEqual(win.itemValue('coins'), 1, 'coins value is 1gp');

        var shop = win.document.getElementById('shop-overlay');
        assert(shop && shop === win.Hud.el.shop, '#shop-overlay is Hud.el.shop');
        assert(shop.hidden, 'shop overlay starts hidden');
        var mira = H.findNpc(win, 'shopkeep');
        assert(mira, 'Shopkeeper Mira is in Emberhaven');
        win.Hud.el.log.innerHTML = '';
        win.Hud.showShop(mira.npcDef);
        assert(win.Hud.shopOpen(), 'shop can read item values while open');
        assertEqual(win.document.getElementById('shop-copy').textContent, 'The shelves are still being stocked.', 'shop stock is still stubbed');
        H.click(win, shop.querySelector('[data-shop-action="buy"]'));
        assertEqual(H.lastChat(win), 'The shelves are still being stocked.', 'Buy stays stubbed');
        assertEqual(H.hero(win).gold, 8, 'Buy stub does not take gold');
        H.click(win, shop.querySelector('[data-shop-action="sell"]'));
        assertEqual(H.lastChat(win), 'The shelves are still being stocked.', 'Sell stays stubbed');
        assertEqual(H.hero(win).gold, 8, 'Sell stub does not change gold');
        assertEqual(H.hero(win).inventory.filter(function (row) { return row.id === 'shrimp'; })[0].qty, 8, 'Sell stub does not take shrimp');
        H.click(win, win.document.getElementById('btn-shop-close'));
        assert(!win.Hud.shopOpen(), 'Close hides the shop');

        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'still at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'still at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('hud: skills tab lists twelve skills with icons', function (win, H) {
    var expected = [
        ['attack', 'Attack'],
        ['strength', 'Strength'],
        ['defence', 'Defence'],
        ['hitpoints', 'Hitpoints'],
        ['ranged', 'Ranged'],
        ['prayer', 'Prayer'],
        ['magic', 'Magic'],
        ['cooking', 'Cooking'],
        ['fishing', 'Fishing'],
        ['woodcutting', 'Woodcutting'],
        ['mining', 'Mining'],
        ['crafting', 'Crafting'],
        ['firemaking', 'Firemaking']
    ];
    H.click(win, '#tab-bar button[data-tab="skills"]');
    assert(H.panelVisible(win, 'skills'), 'skills panel visible');
    var rows = win.document.querySelectorAll('#skills-list .skill-row');
    assertEqual(rows.length, 13, 'thirteen skill rows');
    expected.forEach(function (pair, i) {
        var row = rows[i];
        var img = row.querySelector('img.pix');
        var name = row.querySelector('span');
        assert(img, pair[1] + ' has icon');
        assertMatch(img.getAttribute('src'), 'assets/svg/skills/' + pair[0] + '.svg', pair[1] + ' icon path');
        assertEqual(name.textContent, pair[1], pair[1] + ' label');
    });
    return Promise.all(expected.map(function (pair) {
        return win.fetch('assets/svg/skills/' + pair[0] + '.svg').then(function (res) {
            assert(res.ok, pair[1] + ' svg exists');
        });
    }));
});

EmberwoodTests.add('hud: skill icons resolve under assets/svg/skills/{id}.svg', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        var hero = win.makeHero();
        win.game.registry.set('hero', hero);
        world.refreshHud();
        world.placePlayer(spawn.x, spawn.y);
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assertEqual(typeof win.skillIcon, 'function', 'skillIcon helper exists');
        assert(win.SKILL_NAMES && win.SKILL_NAMES.length === 13, 'thirteen SKILL_NAMES');

        win.SKILL_NAMES.forEach(function (pair) {
            assertEqual(win.skillIcon(pair[0]), 'assets/svg/skills/' + pair[0] + '.svg', pair[1] + ' skillIcon path');
        });

        var sideHp = win.document.getElementById('hud-hp').closest('.stat').querySelector('img.pix');
        assert(sideHp, 'side HUD Hitpoints icon exists');
        assertEqual(sideHp.getAttribute('src'), 'assets/svg/skills/hitpoints.svg', 'side HUD Hitpoints path');

        H.click(win, '#tab-bar button[data-tab="skills"]');
        assert(H.panelVisible(win, 'skills'), 'skills panel visible');
        var rows = win.document.querySelectorAll('#skills-list .skill-row');
        assertEqual(rows.length, 13, 'thirteen skill rows');

        win.SKILL_NAMES.forEach(function (pair, i) {
            var img = rows[i].querySelector('img.pix');
            assert(img, pair[1] + ' has icon');
            assertEqual(img.getAttribute('src'), win.skillIcon(pair[0]), pair[1] + ' HUD src is skillIcon');
        });

        var imgs = win.document.querySelectorAll('#skills-list .skill-row img.pix');
        return Promise.all(win.SKILL_NAMES.map(function (pair, i) {
            var path = 'assets/svg/skills/' + pair[0] + '.svg';
            return win.fetch(path).then(function (res) {
                assert(res.ok, pair[1] + ' svg HTTP ' + res.status);
                assertEqual(res.status, 200, pair[1] + ' svg status 200');
                return res.text();
            }).then(function (body) {
                assert(body.indexOf('<svg') !== -1, pair[1] + ' body is SVG');
                var img = imgs[i];
                var ready = (img.complete && img.naturalWidth > 0)
                    ? Promise.resolve()
                    : new Promise(function (resolve, reject) {
                        img.onload = function () { resolve(); };
                        img.onerror = function () { reject(new Error(pair[1] + ' icon failed to load')); };
                    });
                return ready.then(function () {
                    assert(img.complete, pair[1] + ' icon complete');
                    assert(img.naturalWidth > 0, pair[1] + ' icon decoded');
                });
            });
        }));
    });
});

EmberwoodTests.add('hud: start skills Hitpoints 10 / 1154 XP / 100 HP; others 1 / 0', function (win, H) {
    var world = H.world(win);
    var hero = win.makeHero();
    win.game.registry.set('hero', hero);
    world.refreshHud();
    var spawn = win.defaultWorldSpawn();
    world.placePlayer(spawn.x, spawn.y);
    assertEqual(Math.round(world.player.x), 328, 'courtyard spawn x');
    assertEqual(Math.round(world.player.y), 248, 'courtyard spawn y');
    assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
    assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');

    hero = H.hero(win);
    assertEqual(hero.hp, 100, 'start hp 100');
    assertEqual(hero.maxHp, 100, 'start maxHp 100');
    assertEqual(hero.skills.hitpoints.level, 10, 'Hitpoints level 10');
    assertEqual(hero.skills.hitpoints.xp, 1154, 'Hitpoints 1154 XP');

    var others = [
        'attack', 'strength', 'defence', 'ranged', 'prayer', 'magic',
        'cooking', 'fishing', 'woodcutting', 'mining', 'crafting', 'firemaking'
    ];
    others.forEach(function (id) {
        assertEqual(hero.skills[id].level, 1, id + ' start level 1');
        assertEqual(hero.skills[id].xp, 0, id + ' start xp 0');
    });

    assertEqual(win.document.getElementById('hud-hp').textContent, '100 / 100', 'side HUD HP');
    var fill = win.document.getElementById('hp-fill');
    assert(fill, 'hp fill exists');
    assertEqual(fill.style.width, '100%', 'hp bar full');

    H.click(win, '#tab-bar button[data-tab="skills"]');
    assert(H.panelVisible(win, 'skills'), 'skills panel visible');
    var rows = win.document.querySelectorAll('#skills-list .skill-row');
    assertEqual(rows.length, 13, 'thirteen skill rows');
    var byName = {};
    for (var i = 0; i < rows.length; i++) {
        byName[rows[i].querySelector('span').textContent] = rows[i].querySelector('strong').textContent;
    }
    assertEqual(byName.Hitpoints, '10', 'Skills tab Hitpoints 10');
    [
        'Attack', 'Strength', 'Defence', 'Ranged', 'Prayer', 'Magic',
        'Cooking', 'Fishing', 'Woodcutting', 'Mining', 'Crafting', 'Firemaking'
    ].forEach(function (name) {
        assertEqual(byName[name], '1', name + ' is 1 on Skills tab');
    });
});

EmberwoodTests.add('skills: skill-row hover or click shows current XP and XP-to-next', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        var hero = win.makeHero();
        win.game.registry.set('hero', hero);
        world.refreshHud();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assertEqual(win.Hud.mode, 'world', 'world mode');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(typeof win.xpForNextSkillLevel, 'function', 'xpForNextSkillLevel exists');
        assertEqual(typeof win.skillXpToNext, 'function', 'skillXpToNext exists');
        assertEqual(typeof win.skillXpText, 'function', 'skillXpText exists');
        assertEqual(typeof win.Hud.showSkillXp, 'function', 'showSkillXp exists');
        assertEqual(typeof win.xpDropFloater, 'function', 'XP drop floater helper exists');

        assertEqual(win.xpForNextSkillLevel(1), 50, 'level 1 next total is 50');
        assertEqual(win.xpForNextSkillLevel(2), 200, 'level 2 next total is 200');
        assertEqual(win.xpForNextSkillLevel(10), 5000, 'level 10 next total is 5000');
        assertEqual(win.skillXpToNext({ level: 1, xp: 0 }), 50, '0 XP at 1 needs 50');
        assertEqual(win.skillXpToNext({ level: 10, xp: 1154 }), 3846, 'Hitpoints 1154 needs 3846');

        hero = H.hero(win);
        assertEqual(hero.skills.hitpoints.level, 10, 'Hitpoints starts 10');
        assertEqual(hero.skills.hitpoints.xp, 1154, 'Hitpoints starts 1154 XP');
        assertEqual(hero.skills.attack.level, 1, 'Attack starts 1');
        assertEqual(hero.skills.attack.xp, 0, 'Attack starts 0 XP');

        var hpHint = win.skillXpText('Hitpoints', hero.skills.hitpoints);
        var atkHint = win.skillXpText('Attack', hero.skills.attack);
        assertEqual(hpHint, 'Hitpoints: 1154 XP (3846 XP to next level)', 'Hitpoints hover text');
        assertEqual(atkHint, 'Attack: 0 XP (50 XP to next level)', 'Attack hover text');

        H.click(win, '#tab-bar button[data-tab="skills"]');
        assert(H.panelVisible(win, 'skills'), 'skills panel visible');
        var rows = win.document.querySelectorAll('#skills-list .skill-row');
        assertEqual(rows.length, 13, 'thirteen skill rows');
        var byId = {};
        for (var i = 0; i < rows.length; i++) {
            byId[rows[i].getAttribute('data-skill')] = rows[i];
        }
        assert(byId.hitpoints && byId.attack, 'Hitpoints and Attack rows exist');
        assertEqual(byId.hitpoints.getAttribute('title'), hpHint, 'Hitpoints title is current XP and XP-to-next');
        assertEqual(byId.attack.getAttribute('title'), atkHint, 'Attack title is current XP and XP-to-next');
        byId.hitpoints.dispatchEvent(new win.MouseEvent('mouseover', { bubbles: true }));
        assertEqual(byId.hitpoints.getAttribute('title'), hpHint, 'hover keeps Hitpoints XP title');

        win.Hud.el.log.innerHTML = '';
        H.click(win, byId.hitpoints);
        assertEqual(H.lastChat(win), hpHint, 'click chats Hitpoints XP and XP-to-next');
        H.click(win, byId.attack);
        assertEqual(H.lastChat(win), atkHint, 'click chats Attack XP and XP-to-next');

        win.gainSkillXp(hero, 'attack', 50);
        win.game.registry.set('hero', hero);
        world.refreshHud();
        H.click(win, '#tab-bar button[data-tab="skills"]');
        var attackRow = win.document.querySelector('#skills-list .skill-row[data-skill="attack"]');
        var after = win.skillXpText('Attack', H.hero(win).skills.attack);
        assertEqual(after, 'Attack: 50 XP (150 XP to next level)', 'Attack 50 XP is 150 to next');
        assertEqual(attackRow.getAttribute('title'), after, 'title updates after XP gain');
        win.Hud.el.log.innerHTML = '';
        H.click(win, attackRow);
        assertEqual(H.lastChat(win), after, 'click chats updated Attack XP');
        assert(!H.chatHas(win, 'XP drop'), 'floater is not a chat line');

        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'still at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'still at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('skills: XP drop floater shows number and skill icon on gain', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        var hero = win.makeHero();
        win.game.registry.set('hero', hero);
        world.refreshHud();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assertEqual(win.Hud.mode, 'world', 'world mode');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(typeof win.gainSkillXp, 'function', 'gainSkillXp exists');
        assertEqual(typeof win.xpDropFloater, 'function', 'xpDropFloater exists');
        assertEqual(typeof win.Hud.showXpDrop, 'function', 'Hud.showXpDrop exists');

        var host = win.Hud.ensureXpDrops();
        assert(host && host.id === 'xp-drops', 'xp-drops host exists');
        host.innerHTML = '';
        assertEqual(win.document.querySelectorAll('.xp-drop').length, 0, 'no leftover drops');

        win.gainSkillXp(hero, 'attack', 50);
        win.game.registry.set('hero', hero);
        world.refreshHud();
        var drops = win.document.querySelectorAll('.xp-drop');
        assertEqual(drops.length, 1, 'one Attack drop after +50');
        assertEqual(drops[0].getAttribute('data-skill'), 'attack', 'drop skill is attack');
        assertEqual(drops[0].getAttribute('data-xp'), '50', 'drop amount is 50');
        assertEqual(drops[0].querySelector('.xp-drop-amt').textContent, '50', 'drop shows 50');
        var atkIcon = drops[0].querySelector('img.pix');
        assert(atkIcon && atkIcon.getAttribute('src').indexOf('assets/svg/skills/attack.svg') !== -1, 'Attack skill icon');

        win.gainSkillXp(hero, 'hitpoints', 4);
        drops = win.document.querySelectorAll('.xp-drop');
        assertEqual(drops.length, 2, 'Hitpoints drop stacks under Attack');
        var hpDrop = drops[1];
        assertEqual(hpDrop.getAttribute('data-skill'), 'hitpoints', 'second drop is Hitpoints');
        assertEqual(hpDrop.getAttribute('data-xp'), '4', 'Hitpoints drop amount is 4');
        assertEqual(hpDrop.querySelector('.xp-drop-amt').textContent, '4', 'Hitpoints drop shows 4');
        var hpIcon = hpDrop.querySelector('img.pix');
        assert(hpIcon && hpIcon.getAttribute('src').indexOf('assets/svg/skills/hitpoints.svg') !== -1, 'Hitpoints skill icon');

        var beforeZero = drops.length;
        win.gainSkillXp(hero, 'attack', 0);
        assertEqual(win.document.querySelectorAll('.xp-drop').length, beforeZero, '0 XP adds no drop');
        win.gainSkillXp(hero, 'nosuchskill', 12);
        assertEqual(win.document.querySelectorAll('.xp-drop').length, beforeZero, 'unknown skill adds no drop');
        assertEqual(win.xpDropFloater('strength', 0), null, 'direct 0 XP floater is skipped');
        assert(!H.chatHas(win, 'XP drop'), 'floater is not a chat line');

        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'still at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'still at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('hud: side HUD shows zone combat level HP fill gold XP and task', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        var hero = win.makeHero();
        win.game.registry.set('hero', hero);
        win.game.registry.set('quest', { id: 'goblins', stage: 0, progress: 0, goal: 5 });
        world.placePlayer(spawn.x, spawn.y);
        world.refreshHud();
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        var zoneEl = win.document.getElementById('hud-zone');
        var levelEl = win.document.getElementById('hud-level');
        var totalEl = win.document.getElementById('hud-total');
        var hpEl = win.document.getElementById('hud-hp');
        var goldEl = win.document.getElementById('hud-gold');
        var xpEl = win.document.getElementById('hud-xp');
        var questEl = win.document.getElementById('hud-quest');
        var fill = win.document.getElementById('hp-fill');
        assert(zoneEl && zoneEl.closest('#side'), 'zone name is on the side HUD');
        assert(levelEl && levelEl.closest('#side'), 'combat level is on the side HUD');
        assert(totalEl && totalEl.closest('#side'), 'skill total is on the side HUD');
        assert(hpEl && hpEl.closest('#side'), 'HP is on the side HUD');
        assert(fill && fill.closest('#side'), 'HP fill is on the side HUD');
        assert(goldEl && goldEl.closest('#side'), 'gold is on the side HUD');
        assert(xpEl && xpEl.closest('#side'), 'XP is on the side HUD');
        assert(questEl && questEl.closest('#side'), 'task text is on the side HUD');

        assertEqual(zoneEl.textContent, 'Emberhaven', 'starter zone name');
        assertEqual(levelEl.textContent, '3', 'starter OSRS combat level');
        assertEqual(totalEl.textContent, '22', 'starter skill total');
        assertEqual(hpEl.textContent.replace(/\s+/g, ' ').trim(), '100 / 100', 'starter HP cur / max');
        assertEqual(fill.style.width, '100%', 'starter HP fill 100%');
        assertEqual(goldEl.textContent, '8', 'starter gold');
        assertEqual(xpEl.textContent, '0', 'starter XP');
        assertEqual(questEl.textContent, 'Talk to Guildmaster Bram in Emberhaven.', 'starter task text');

        hero = H.hero(win);
        hero.hp = 55;
        hero.maxHp = 110;
        hero.gold = 25;
        hero.xp = 40;
        hero.skills.attack.level = 10;
        hero.skills.strength.level = 10;
        win.game.registry.set('hero', hero);
        win.game.registry.set('quest', { id: 'goblins', stage: 1, progress: 3, goal: 5 });
        H.enterZone(win, 'millfields');
        world.refreshHud();

        assertEqual(zoneEl.textContent, 'Millfields', 'zone name updates');
        assertEqual(levelEl.textContent, '9', 'combat level updates from Attack+Strength');
        assertEqual(totalEl.textContent, '40', 'skill total updates from Attack+Strength');
        assertEqual(hpEl.textContent.replace(/\s+/g, ' ').trim(), '55 / 110', 'HP cur / max updates');
        assertEqual(fill.style.width, '50%', 'HP fill is 50% at 55/110');
        assertEqual(goldEl.textContent, '25', 'gold updates');
        assertEqual(xpEl.textContent, '40', 'XP updates');
        assertEqual(questEl.textContent, 'Kill goblins in Northwood (3/5).', 'task text updates');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off after HUD refresh');

        win.game.registry.set('hero', win.makeHero());
        win.game.registry.set('quest', { id: 'goblins', stage: 0, progress: 0, goal: 5 });
        H.enterZone(win, 'haven');
        world.placePlayer(spawn.x, spawn.y);
        world.refreshHud();
    });
});

EmberwoodTests.add('hud: side HUD shows skill total and derived combat level', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        var hero = win.makeHero();
        win.game.registry.set('hero', hero);
        win.game.registry.set('quest', { id: 'goblins', stage: 0, progress: 0, goal: 5 });
        world.placePlayer(spawn.x, spawn.y);
        world.refreshHud();
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(typeof win.skillTotal, 'function', 'skillTotal exists');
        assertEqual(typeof win.combatLevel, 'function', 'combatLevel exists');
        assertEqual(typeof win.firemakeAt, 'function', 'Firemaking helper exists');
        assertEqual(typeof win.lightFire, 'function', 'lightFire alias exists');
        assertEqual(typeof win.smithBar, 'undefined', 'Smithing is not this tick');
        assertEqual(win.SKILL_NAMES.length, 13, 'thirteen skills in the total');

        var levelEl = win.document.getElementById('hud-level');
        var totalEl = win.document.getElementById('hud-total');
        assert(levelEl && levelEl.closest('#side'), 'combat level is on the side HUD');
        assert(totalEl && totalEl.closest('#side'), 'skill total is on the side HUD');
        var combatLabel = levelEl.closest('.stat').querySelector('span');
        var totalLabel = totalEl.closest('.stat').querySelector('span');
        assertMatch(combatLabel && combatLabel.textContent, 'Combat', 'Combat label not generic Level');
        assertMatch(totalLabel && totalLabel.textContent, 'Total', 'Total label on the side HUD');
        var totalIcon = totalEl.closest('.stat').querySelector('img.pix');
        assert(totalIcon && totalIcon.getAttribute('src').indexOf('assets/svg/ui/skills.svg') !== -1, 'Total uses skills icon');

        assertEqual(win.skillTotal(hero), 22, 'starter skill total is 22');
        assertEqual(win.combatLevel(hero), 3, 'starter derived combat is 3');
        assertEqual(hero.level, 3, 'hero.level is derived combat not skill total');
        assertEqual(levelEl.textContent, '3', 'HUD combat is 3');
        assertEqual(totalEl.textContent, '22', 'HUD total is 22');

        hero.skills.cooking.level = 2;
        win.game.registry.set('hero', hero);
        world.refreshHud();
        assertEqual(win.skillTotal(hero), 23, 'Cooking 2 raises skill total');
        assertEqual(win.combatLevel(hero), 3, 'Cooking does not change combat');
        assertEqual(hero.level, 3, 'hero.level stays combat 3');
        assertEqual(levelEl.textContent, '3', 'HUD combat stays 3 after Cooking');
        assertEqual(totalEl.textContent, '23', 'HUD total is 23 after Cooking');

        hero.skills.attack.level = 10;
        hero.skills.strength.level = 10;
        if (hero.skills.agility) {
            hero.skills.agility.level = 99;
        }
        win.applyCombatLevel(hero, false);
        win.game.registry.set('hero', hero);
        world.refreshHud();
        assertEqual(win.combatLevel(hero), 9, 'Attack+Strength 10 is combat 9');
        assertEqual(win.skillTotal(hero), 41, 'Attack+Strength+Cooking total is 41');
        assertEqual(hero.level, 9, 'hero.level is combat 9 not skill total');
        assertEqual(levelEl.textContent, '9', 'HUD combat is 9');
        assertEqual(totalEl.textContent, '41', 'HUD total ignores unused Agility');

        win.game.registry.set('hero', win.makeHero());
        win.game.registry.set('quest', { id: 'goblins', stage: 0, progress: 0, goal: 5 });
        H.enterZone(win, 'haven');
        world.placePlayer(spawn.x, spawn.y);
        world.refreshHud();
        assertEqual(Math.round(world.player.x), 328, 'still at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'still at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        assertEqual(typeof win.smithBar, 'undefined', 'Smithing still not this tick');
    });
});

EmberwoodTests.add('hud: Quest tab copies the same quest string as the side Task panel', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        var hero = win.makeHero();
        win.game.registry.set('hero', hero);
        win.game.registry.set('quest', { id: 'goblins', stage: 0, progress: 0, goal: 5 });
        world.placePlayer(spawn.x, spawn.y);
        world.refreshHud();
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        var sideTask = win.document.getElementById('hud-quest');
        var questTab = win.document.getElementById('hud-quest-tab');
        assert(sideTask && sideTask.closest('#side'), 'side Task is #hud-quest in #side');
        assert(questTab && questTab.closest('#panel-quest'), 'Quest tab journal is #hud-quest-tab');

        function assertCopied(expected, label) {
            assertEqual(sideTask.textContent, expected, 'side Task ' + label);
            assertEqual(questTab.textContent, expected, 'Quest tab ' + label);
            assertEqual(questTab.textContent, sideTask.textContent, 'Quest tab copies side Task ' + label);
        }

        assertCopied('Talk to Guildmaster Bram in Emberhaven.', 'at stage 0');
        H.click(win, '#tab-bar button[data-tab="quest"]');
        assert(H.panelVisible(win, 'quest'), 'Quest tab panel is visible');
        assertCopied('Talk to Guildmaster Bram in Emberhaven.', 'with Quest tab open');

        win.game.registry.set('quest', { id: 'goblins', stage: 1, progress: 0, goal: 5 });
        world.refreshHud();
        assertCopied('Kill goblins in Northwood (0/5).', 'after accept');

        win.game.registry.set('quest', { id: 'goblins', stage: 1, progress: 3, goal: 5 });
        world.refreshHud();
        assertCopied('Kill goblins in Northwood (3/5).', 'at 3/5');

        win.game.registry.set('quest', { id: 'goblins', stage: 2, progress: 5, goal: 5 });
        world.refreshHud();
        assertCopied('Return to Guildmaster Bram for your reward.', 'at stage 2');

        win.game.registry.set('quest', { id: 'goblins', stage: 3, progress: 5, goal: 5 });
        world.refreshHud();
        assertCopied('Militia task complete. Explore the nine lands.', 'at stage 3');

        win.game.registry.set('quest', { id: 'goblins', stage: 4, progress: 5, goal: 5 });
        world.refreshHud();
        assertCopied('Militia task complete. Explore the nine lands.', 'at stage 4+');
        assert(H.panelVisible(win, 'quest'), 'Quest tab stays open through refreshes');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off after quest copy');
    });
});

EmberwoodTests.add('hud: chat appends lines, auto-scrolls, and drops the oldest after 40 lines', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        var hero = win.makeHero();
        win.game.registry.set('hero', hero);
        world.placePlayer(spawn.x, spawn.y);
        world.refreshHud();
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        var logEl = win.document.getElementById('chat-log');
        assert(logEl && logEl === win.Hud.el.log, 'Hud.log writes #chat-log');
        assertEqual(win.getComputedStyle(logEl).overflowY, 'auto', '#chat-log overflows so it can scroll');

        while (logEl.firstChild) {
            logEl.removeChild(logEl.firstChild);
        }
        assertEqual(logEl.children.length, 0, 'chat starts empty for this case');

        win.Hud.log('alpha line');
        assertEqual(logEl.children.length, 1, 'first log appends one line');
        assertEqual(logEl.lastChild.className, 'chat-line', 'appended node is .chat-line');
        assertEqual(logEl.lastChild.textContent, 'alpha line', 'appended text is the logged line');
        assertEqual(H.lastChat(win), 'alpha line', 'lastChat is the appended line');

        win.Hud.log('beta line');
        assertEqual(logEl.children.length, 2, 'second log appends after the first');
        assertEqual(logEl.firstChild.textContent, 'alpha line', 'older line stays first');
        assertEqual(logEl.lastChild.textContent, 'beta line', 'newer line is last');

        var i;
        for (i = 1; i <= 40; i++) {
            win.Hud.log('cap-' + i);
        }
        assertEqual(logEl.children.length, 40, 'chat keeps at most 40 lines');
        assertEqual(logEl.firstChild.textContent, 'cap-1', 'oldest remaining is the first of the last 40');
        assertEqual(logEl.lastChild.textContent, 'cap-40', 'newest line is last');
        assert(!H.chatHas(win, 'alpha line'), 'oldest lines drop after 40');
        assert(!H.chatHas(win, 'beta line'), 'pre-cap lines drop after 40');

        logEl.style.height = '72px';
        logEl.style.flex = 'none';
        logEl.scrollTop = 0;
        assertEqual(logEl.scrollTop, 0, 'can scroll away from the newest line');
        win.Hud.log('cap-41');
        assertEqual(logEl.children.length, 40, '41st line still keeps 40');
        assertEqual(logEl.firstChild.textContent, 'cap-2', 'oldest (cap-1) is dropped');
        assertEqual(logEl.lastChild.textContent, 'cap-41', 'newest is last after the drop');
        assert(logEl.scrollHeight > logEl.clientHeight, '40 lines overflow a short chat box');
        var maxScroll = logEl.scrollHeight - logEl.clientHeight;
        assert(Math.abs(logEl.scrollTop - maxScroll) <= 1, 'new line auto-scrolls to the bottom');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off after chat log');
    });
});

EmberwoodTests.add('hud: death overlay copy You are dead and retry keeps focus', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        world.placePlayer(spawn.x, spawn.y);
        world.refreshHud();
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        var overlay = win.document.getElementById('dead-overlay');
        var heading = overlay && overlay.querySelector('h1');
        var deadText = win.document.getElementById('dead-text');
        var retry = win.document.getElementById('btn-retry');
        assert(overlay && overlay === win.Hud.el.dead, '#dead-overlay is Hud.el.dead');
        assert(heading, 'death overlay has an h1');
        assertEqual(heading.textContent.replace(/\s+/g, ' ').trim(), 'You are dead', 'death heading copy');
        assert(retry && retry === win.Hud.el.retry, '#btn-retry is Hud.el.retry');
        assertEqual(retry.textContent.replace(/\s+/g, ' ').trim(), 'Return to title', 'retry button copy');
        assert(deadText, '#dead-text exists');

        var hero = H.hero(win);
        var combatLevel = hero.level;
        var subtitle = 'Combat level ' + combatLevel + '. Emberwood claimed another traveller.';
        win.Hud.showDead(subtitle);
        assertEqual(win.Hud.mode, 'dead', 'hud dead mode');
        assert(!overlay.hidden, 'death overlay visible');
        assert(win.document.getElementById('title-overlay').hidden, 'title stays hidden while dead');
        assertEqual(deadText.textContent, subtitle, 'GameOverScene combat-level subtitle');
        assertMatch(overlay.innerText, 'You are dead', 'overlay still shows You are dead');
        assertMatch(overlay.innerText, 'Return to title', 'overlay still shows Return to title');
        assertMatch(overlay.innerText, 'Combat level ' + combatLevel, 'overlay shows combat level');

        retry.focus();
        assertEqual(win.document.activeElement, retry, 'retry can take focus');
        var opts = { bubbles: true, cancelable: true, view: win, button: 0 };
        retry.dispatchEvent(new win.MouseEvent('mouseup', opts));
        assertEqual(win.document.activeElement, retry, 'retry keeps focus after mouseup');
        assert(retry.matches(':focus'), 'retry is :focus (bindHudBlur skips #dead-overlay)');

        var invBtn = win.document.querySelector('#tab-bar button[data-tab="inv"]');
        assert(invBtn, 'Inv tab exists');
        invBtn.focus();
        assertEqual(win.document.activeElement, invBtn, 'Inv tab can take focus');
        H.mouseClick(win, invBtn);
        assert(win.document.activeElement !== invBtn, 'Inv tab still blurs after mouseup');
        assert(!invBtn.matches(':focus'), 'Inv tab is not :focus');

        H.click(win, '#btn-retry');
        return H.waitUntil(function () {
            return !win.document.getElementById('title-overlay').hidden;
        }, 4000, 'title after retry');
    }).then(function () {
        assertEqual(win.Hud.mode, 'title', 'retry returns to title');
        assert(win.document.getElementById('dead-overlay').hidden, 'death overlay closed');
        assert(!win.document.getElementById('title-overlay').hidden, 'title overlay shown');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off after retry');
    });
});

EmberwoodTests.add('hud: shop-overlay and bank overlay use hidden CSS like title/dead not a Phaser text menu', function (win, H) {
    function hiddenCssRule(doc, id) {
        var needle = '#' + id + '[hidden]';
        var sheets = doc.styleSheets;
        for (var s = 0; s < sheets.length; s++) {
            var rules;
            try {
                rules = sheets[s].cssRules;
            } catch (err) {
                continue;
            }
            if (!rules) {
                continue;
            }
            for (var r = 0; r < rules.length; r++) {
                var sel = rules[r].selectorText || '';
                if (sel.indexOf(needle) !== -1) {
                    return rules[r];
                }
            }
        }
        return null;
    }

    function assertHtmlOverlayHiddenPattern(doc, id, el) {
        var rule = hiddenCssRule(doc, id);
        assert(rule, '#' + id + '[hidden] CSS exists like title/dead');
        assertEqual(rule.style.getPropertyValue('display'), 'none', '#' + id + '[hidden] is display:none');
        assertEqual(el.style.display, '', '#' + id + ' uses the hidden attribute, not inline display');
        assert(el.tagName !== 'CANVAS', '#' + id + ' is HTML, not a Phaser canvas menu');
        el.hidden = true;
        assert(el.hidden, '#' + id + ' hidden attribute is true');
        assertEqual(doc.defaultView.getComputedStyle(el).display, 'none', '#' + id + ' computed display is none while hidden');
    }

    function assertNoPhaserShopBankMenu(gameWin) {
        var texts = [];
        var menus = [];
        gameWin.game.scene.getScenes(true).forEach(function (scene) {
            if (!scene || !scene.children || !scene.children.list) {
                return;
            }
            scene.children.list.forEach(function (child) {
                if (gameWin.Menu && child instanceof gameWin.Menu) {
                    menus.push(child);
                }
                if (gameWin.MenuItem && child instanceof gameWin.MenuItem) {
                    texts.push(String(child.text || ''));
                }
            });
        });
        menus.forEach(function (menu) {
            var labels = (menu.menuItems || []).map(function (item) {
                return String(item.text || '').toLowerCase();
            }).join(' ');
            assert(
                labels.indexOf('shop') === -1 && labels.indexOf('bank') === -1 &&
                    labels.indexOf('buy') === -1 && labels.indexOf('sell') === -1 &&
                    labels.indexOf('deposit') === -1 && labels.indexOf('withdraw') === -1,
                'leftover Phaser Menu is not a shop/bank text menu: ' + labels
            );
        });
        texts.forEach(function (text) {
            var low = text.toLowerCase();
            assert(
                low.indexOf('shop') === -1 && low.indexOf('buy') === -1 &&
                    low.indexOf('sell') === -1 && low.indexOf('deposit') === -1 &&
                    low.indexOf('withdraw') === -1,
                'Phaser MenuItem is not shop/bank copy: ' + text
            );
        });
        assert(!gameWin.ShopMenu, 'no Phaser ShopMenu class');
        assert(!gameWin.BankMenu, 'no Phaser BankMenu class');
    }

    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        world.placePlayer(spawn.x, spawn.y);
        world.refreshHud();
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        var title = win.document.getElementById('title-overlay');
        var dead = win.document.getElementById('dead-overlay');
        assert(title && title === win.Hud.el.title, '#title-overlay is Hud.el.title');
        assert(dead && dead === win.Hud.el.dead, '#dead-overlay is Hud.el.dead');
        assertEqual(title.tagName, 'DIV', 'title overlay is an HTML div');
        assertEqual(dead.tagName, 'DIV', 'dead overlay is an HTML div');
        assertHtmlOverlayHiddenPattern(win.document, 'title-overlay', title);
        assertHtmlOverlayHiddenPattern(win.document, 'dead-overlay', dead);

        win.Hud.hideDead();
        win.Hud.hideTitle();
        assert(title.hidden, 'title starts hidden in world');
        assert(dead.hidden, 'dead starts hidden in world');
        assertEqual(win.getComputedStyle(title).display, 'none', 'title computed none in world');
        assertEqual(win.getComputedStyle(dead).display, 'none', 'dead computed none in world');

        win.Hud.showTitle();
        assertEqual(win.Hud.mode, 'title', 'showTitle sets mode title');
        assertEqual(title.hidden, false, 'showTitle clears title.hidden');
        assert(dead.hidden, 'showTitle keeps dead hidden');
        assertEqual(win.getComputedStyle(title).display, 'flex', 'visible title uses flex CSS, not Phaser text');
        win.Hud.hideTitle();
        assert(title.hidden, 'hideTitle sets title.hidden');
        assertEqual(win.getComputedStyle(title).display, 'none', 'hideTitle computed none');

        win.Hud.showDead('Combat level 1. Overlay pattern check.');
        assertEqual(win.Hud.mode, 'dead', 'showDead sets mode dead');
        assertEqual(dead.hidden, false, 'showDead clears dead.hidden');
        assertEqual(win.getComputedStyle(dead).display, 'flex', 'visible dead uses flex CSS, not Phaser text');
        win.Hud.hideDead();
        win.Hud.mode = 'world';
        assert(dead.hidden, 'hideDead sets dead.hidden');
        assertEqual(win.getComputedStyle(dead).display, 'none', 'hideDead computed none');

        var shop = win.document.getElementById('shop-overlay');
        assert(shop && shop === win.Hud.el.shop, '#shop-overlay is Hud.el.shop');
        assertEqual(shop.tagName, 'DIV', 'shop overlay is an HTML div');
        assertHtmlOverlayHiddenPattern(win.document, 'shop-overlay', shop);
        assert(shop.hidden, 'shop overlay starts hidden in world');
        assertEqual(typeof win.Hud.showShop, 'function', 'Hud.showShop is an HTML overlay helper');
        assertEqual(typeof win.Hud.hideShop, 'function', 'Hud.hideShop is an HTML overlay helper');
        win.Hud.showShop({ key: 'shopkeep', name: 'Shopkeeper Mira' });
        assertEqual(shop.hidden, false, 'showShop clears shop.hidden');
        assertEqual(win.Hud.mode, 'world', 'showShop keeps Hud.mode world');
        assertEqual(win.getComputedStyle(shop).display, 'flex', 'visible shop uses flex CSS, not Phaser text');
        win.Hud.hideShop();
        assert(shop.hidden, 'hideShop sets shop.hidden');
        assertEqual(win.getComputedStyle(shop).display, 'none', 'hideShop computed none');

        var bank = win.document.getElementById('bank-overlay');
        assert(bank && bank === win.Hud.el.bank, '#bank-overlay is Hud.el.bank');
        assertEqual(bank.tagName, 'DIV', 'bank overlay is an HTML div');
        assertHtmlOverlayHiddenPattern(win.document, 'bank-overlay', bank);
        assert(bank.hidden, 'bank overlay starts hidden in world');
        assertEqual(typeof win.Hud.showBank, 'function', 'Hud.showBank is an HTML overlay helper');
        assertEqual(typeof win.Hud.hideBank, 'function', 'Hud.hideBank is an HTML overlay helper');
        win.Hud.showBank({ key: 'banker', name: 'Banker Elise' });
        assertEqual(bank.hidden, false, 'showBank clears bank.hidden');
        assertEqual(win.Hud.mode, 'world', 'showBank keeps Hud.mode world');
        assertEqual(win.getComputedStyle(bank).display, 'flex', 'visible bank uses flex CSS, not Phaser text');
        assert(shop.hidden, 'showBank hides the shop overlay');
        win.Hud.hideBank();
        assert(bank.hidden, 'hideBank sets bank.hidden');
        assertEqual(win.getComputedStyle(bank).display, 'none', 'hideBank computed none');

        assertNoPhaserShopBankMenu(win);
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off after overlay check');
        assertEqual(Math.round(world.player.x), 328, 'player still at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player still at spawn y');
    });
});

EmberwoodTests.add('skills: Hitpoints level-up sets maxHp to 10 * level and chats Skill increased to N', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        var hero = win.makeHero();
        win.game.registry.set('hero', hero);
        world.refreshHud();
        world.placePlayer(spawn.x, spawn.y);
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assertEqual(typeof win.gainSkillXp, 'function', 'gainSkillXp exists');

        hero = H.hero(win);
        assertEqual(hero.skills.hitpoints.level, 10, 'Hitpoints starts 10');
        assertEqual(hero.skills.hitpoints.xp, 1154, 'Hitpoints starts 1154 XP');
        assertEqual(hero.maxHp, 100, 'start maxHp 100');
        assertEqual(hero.hp, 100, 'start hp 100');
        assertEqual(hero.skills.attack.level, 1, 'Attack starts 1');

        win.gainSkillXp(hero, 'hitpoints', 3845);
        assertEqual(hero.skills.hitpoints.xp, 4999, 'Hitpoints 4999 is still below level 11');
        assertEqual(hero.skills.hitpoints.level, 10, 'Hitpoints stays 10 below 5000 XP');
        assertEqual(hero.maxHp, 100, 'maxHp stays 100 before the level-up');
        assert(!H.chatHas(win, 'Hitpoints increased'), 'no Hitpoints level-up chat below the curve');

        win.gainSkillXp(hero, 'attack', 50);
        assertEqual(hero.skills.attack.level, 2, 'Attack levels to 2');
        assert(H.chatHas(win, 'Attack increased to 2.'), 'Attack chats {Skill} increased to N.');
        assertEqual(hero.maxHp, 100, 'Attack level-up does not change maxHp');

        win.gainSkillXp(hero, 'hitpoints', 1);
        assertEqual(hero.skills.hitpoints.xp, 5000, 'Hitpoints reaches 5000 XP');
        assertEqual(hero.skills.hitpoints.level, 11, 'Hitpoints levels to 1 + floor(sqrt(5000/50))');
        assertEqual(hero.maxHp, 110, 'maxHp is 10 * Hitpoints 11');
        assertEqual(hero.hp, 100, 'current HP is not filled on a Hitpoints level-up');
        assert(H.chatHas(win, 'Hitpoints increased to 11.'), 'Hitpoints chats {Skill} increased to N.');

        win.gainSkillXp(hero, 'hitpoints', 1050);
        assertEqual(hero.skills.hitpoints.xp, 6050, 'Hitpoints reaches 6050 XP');
        assertEqual(hero.skills.hitpoints.level, 12, 'Hitpoints levels to 12');
        assertEqual(hero.maxHp, 120, 'maxHp is 10 * Hitpoints 12');
        assert(H.chatHas(win, 'Hitpoints increased to 12.'), 'second Hitpoints level chats the new N');

        win.game.registry.set('hero', hero);
        world.refreshHud();
        assertEqual(win.document.getElementById('hud-hp').textContent, '100 / 120', 'side HUD uses new maxHp');
        H.click(win, '#tab-bar button[data-tab="skills"]');
        var rows = win.document.querySelectorAll('#skills-list .skill-row');
        var byName = {};
        for (var i = 0; i < rows.length; i++) {
            byName[rows[i].querySelector('span').textContent] = rows[i].querySelector('strong').textContent;
        }
        assertEqual(byName.Hitpoints, '12', 'Skills tab Hitpoints is 12');
        assertEqual(byName.Attack, '2', 'Skills tab Attack is 2');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('skills: level-up modal and chat fanfare not only one log line', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        var hero = win.makeHero();
        win.game.registry.set('hero', hero);
        world.refreshHud();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assertEqual(typeof win.gainSkillXp, 'function', 'gainSkillXp exists');
        assertEqual(typeof win.showLevelUpModal, 'function', 'showLevelUpModal exists');
        assertEqual(typeof win.Hud.showLevelUp, 'function', 'Hud.showLevelUp exists');

        var overlay = win.Hud.ensureLevelUpModal();
        assert(overlay && overlay.id === 'level-up-overlay', 'level-up overlay exists');
        assert(overlay.hidden, 'overlay starts hidden');
        win.Hud.hideLevelUp();
        win.Hud.el.log.innerHTML = '';

        hero = H.hero(win);
        assertEqual(hero.skills.hitpoints.level, 10, 'Hitpoints starts 10');
        assertEqual(hero.skills.attack.level, 1, 'Attack starts 1');

        win.gainSkillXp(hero, 'hitpoints', 3845);
        assertEqual(hero.skills.hitpoints.level, 10, 'Hitpoints stays 10 below 5000 XP');
        assert(overlay.hidden, 'no modal below the Hitpoints curve');
        assert(!H.chatHas(win, 'Congratulations'), 'no fanfare below the curve');
        assert(!H.chatHas(win, 'Hitpoints increased'), 'no Hitpoints increased line below the curve');

        win.gainSkillXp(hero, 'attack', 50);
        win.game.registry.set('hero', hero);
        world.refreshHud();
        assertEqual(hero.skills.attack.level, 2, 'Attack levels to 2');
        assert(!overlay.hidden, 'Attack level-up shows the modal');
        assertEqual(overlay.getAttribute('data-skill'), 'attack', 'modal skill is attack');
        assertEqual(overlay.getAttribute('data-level'), '2', 'modal level is 2');
        var atkIcon = overlay.querySelector('#level-up-icon');
        assert(atkIcon && atkIcon.getAttribute('src').indexOf('assets/svg/skills/attack.svg') !== -1, 'Attack skill icon');
        assertEqual(win.document.getElementById('level-up-copy').textContent, 'Your Attack level is now 2.', 'modal copy is the new Attack level');
        var attackFanfare = H.chat(win).filter(function (line) {
            return line.indexOf('Congratulations') !== -1 || line.indexOf('Your Attack level is now 2.') !== -1 || line.indexOf('Attack increased to 2.') !== -1;
        });
        assert(attackFanfare.length >= 3, 'Attack fanfare is more than one log line');
        assert(H.chatHas(win, 'Congratulations, you just advanced an Attack level.'), 'Attack congratulations line');
        assert(H.chatHas(win, 'Your Attack level is now 2.'), 'Attack now-N line');
        assert(H.chatHas(win, 'Attack increased to 2.'), 'keeps Skill increased to N');
        assert(win.document.querySelectorAll('#chat-log .chat-fanfare').length >= 2, 'fanfare lines are marked in chat');
        assertEqual(hero.maxHp, 100, 'Attack level-up does not change maxHp');

        H.click(win, '#btn-level-up-close');
        assert(overlay.hidden, 'Continue hides the modal');
        assertEqual(win.Hud.mode, 'world', 'modal does not steal Hud.mode');

        win.Hud.el.log.innerHTML = '';
        win.gainSkillXp(hero, 'hitpoints', 1);
        assertEqual(hero.skills.hitpoints.level, 11, 'Hitpoints levels to 11');
        assertEqual(hero.maxHp, 110, 'maxHp is 10 * Hitpoints 11');
        assert(!overlay.hidden, 'Hitpoints level-up shows the modal');
        assertEqual(overlay.getAttribute('data-skill'), 'hitpoints', 'modal skill is hitpoints');
        assertEqual(overlay.getAttribute('data-level'), '11', 'modal level is 11');
        var hpIcon = overlay.querySelector('#level-up-icon');
        assert(hpIcon && hpIcon.getAttribute('src').indexOf('assets/svg/skills/hitpoints.svg') !== -1, 'Hitpoints skill icon');
        var hpFanfare = H.chat(win).filter(function (line) {
            return line.indexOf('Congratulations') !== -1 || line.indexOf('Your Hitpoints level is now 11.') !== -1 || line.indexOf('Hitpoints increased to 11.') !== -1;
        });
        assert(hpFanfare.length >= 3, 'Hitpoints fanfare is more than one log line');
        assert(H.chatHas(win, 'Congratulations, you just advanced a Hitpoints level.'), 'Hitpoints congratulations line');
        assert(H.chatHas(win, 'Your Hitpoints level is now 11.'), 'Hitpoints now-N line');
        assert(H.chatHas(win, 'Hitpoints increased to 11.'), 'keeps Skill increased to N');

        H.click(win, '#tab-bar button[data-tab="skills"]');
        assert(H.panelVisible(win, 'skills'), 'skills tab still clicks with the modal up');

        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'still at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'still at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('combat: levelHero XP/40 does not overwrite maxHp from Hitpoints', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        var hero = win.makeHero();
        win.game.registry.set('hero', hero);
        world.refreshHud();
        world.placePlayer(spawn.x, spawn.y);
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assertEqual(typeof world.levelHero, 'function', 'levelHero exists');
        assertEqual(typeof win.gainSkillXp, 'function', 'gainSkillXp exists');

        hero = H.hero(win);
        assertEqual(hero.level, 3, 'starter OSRS combat level 3');
        assertEqual(hero.xp, 0, 'starter combat XP 0');
        assertEqual(hero.skills.hitpoints.level, 10, 'Hitpoints starts 10');
        assertEqual(hero.skills.hitpoints.xp, 1154, 'Hitpoints starts 1154 XP');
        assertEqual(hero.maxHp, 100, 'start maxHp 100');
        assertEqual(hero.hp, 100, 'start hp 100');
        assertEqual(hero.damage, 16, 'starter damage 16');
        assertEqual(win.combatLevel(hero), 3, 'derived combat is 3');

        hero.xp = 40;
        world.levelHero(hero);
        assertEqual(hero.level, 3, 'combat XP 40 does not overwrite OSRS combat');
        assertEqual(hero.maxHp, 100, 'combat XP leaves maxHp as 10 * Hitpoints 10');
        assertEqual(hero.hp, 100, 'combat XP does not grow or refill HP');
        assertEqual(hero.damage, 18, 'combat XP still sets damage 14 + rank * 2');
        assert(!H.chatHas(win, 'Your combat level is now'), 'XP/40 does not chat combat level');
        assert(!H.chatHas(win, 'Hitpoints increased'), 'combat XP does not chat Hitpoints');

        win.gainSkillXp(hero, 'hitpoints', 3846);
        assertEqual(hero.skills.hitpoints.xp, 5000, 'Hitpoints reaches 5000 XP');
        assertEqual(hero.skills.hitpoints.level, 11, 'Hitpoints levels to 11');
        assertEqual(hero.maxHp, 110, 'maxHp is 10 * Hitpoints 11');
        assertEqual(hero.hp, 100, 'Hitpoints level-up does not fill current HP');
        assertEqual(hero.level, 3, 'Hitpoints 11 keeps OSRS combat at 3');
        assert(H.chatHas(win, 'Hitpoints increased to 11.'), 'Hitpoints chats Skill increased to N');

        hero.xp = 80;
        world.levelHero(hero);
        assertEqual(hero.level, 3, 'later combat XP still leaves OSRS combat');
        assertEqual(hero.maxHp, 110, 'later combat XP still leaves maxHp as 10 * Hitpoints');
        assertEqual(hero.hp, 100, 'later combat XP does not fill HP');
        assertEqual(hero.damage, 20, 'rank 3 still sets damage 20');

        win.game.registry.set('hero', hero);
        world.refreshHud();
        assertEqual(win.document.getElementById('hud-hp').textContent, '100 / 110', 'HUD follows Hitpoints maxHp');
        assertEqual(win.document.getElementById('hud-level').textContent, '3', 'HUD combat level stays OSRS 3');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('combat: OSRS-like combat level from Attack Strength Defence Hitpoints Prayer Ranged Magic', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        var hero = win.makeHero();
        win.game.registry.set('hero', hero);
        world.refreshHud();
        world.placePlayer(spawn.x, spawn.y);
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assertEqual(typeof win.combatLevel, 'function', 'combatLevel exists');
        assertEqual(typeof win.applyCombatLevel, 'function', 'applyCombatLevel exists');

        hero = H.hero(win);
        assertEqual(hero.skills.attack.level, 1, 'Attack starts 1');
        assertEqual(hero.skills.strength.level, 1, 'Strength starts 1');
        assertEqual(hero.skills.defence.level, 1, 'Defence starts 1');
        assertEqual(hero.skills.hitpoints.level, 10, 'Hitpoints starts 10');
        assertEqual(hero.skills.prayer.level, 1, 'Prayer starts 1');
        assertEqual(hero.skills.ranged.level, 1, 'Ranged starts 1');
        assertEqual(hero.skills.magic.level, 1, 'Magic starts 1');
        assertEqual(win.combatLevel(hero), 3, 'OSRS starter combat is 3');
        assertEqual(hero.level, 3, 'hero.level matches derived combat');
        assertEqual(hero.maxHp, 100, 'maxHp is 10 * Hitpoints 10');
        assertEqual(win.document.getElementById('hud-level').textContent, '3', 'HUD shows derived combat 3');

        hero.skills.cooking.level = 99;
        assertEqual(win.combatLevel(hero), 3, 'Cooking does not change combat');

        hero.xp = 40;
        world.levelHero(hero);
        assertEqual(hero.level, 3, 'combat XP 40 does not overwrite OSRS combat');
        assertEqual(hero.maxHp, 100, 'levelHero leaves maxHp as 10 * Hitpoints');
        assertEqual(hero.damage, 18, 'combat XP still raises damage');
        assert(!H.chatHas(win, 'Your combat level is now'), 'XP/40 does not chat combat level');
        world.refreshHud();
        assertEqual(win.document.getElementById('hud-level').textContent, '3', 'HUD stays 3 after XP/40');

        hero.skills.attack.level = 2;
        hero.skills.strength.level = 2;
        assertEqual(win.combatLevel(hero), 4, 'Attack 2 Strength 2 is combat 4');
        win.applyCombatLevel(hero, true);
        assertEqual(hero.level, 4, 'hero.level updates to 4');
        assert(H.chatHas(win, 'Your combat level is now 4.'), 'combat level chat on skill raise');
        world.refreshHud();
        assertEqual(win.document.getElementById('hud-level').textContent, '4', 'HUD shows combat 4');
        assertEqual(hero.maxHp, 100, 'melee skills do not change maxHp');

        hero.skills.defence.level = 20;
        assertEqual(win.combatLevel(hero), 8, 'Defence 20 with Atk/Str 2 HP 10 is combat 8');

        hero.skills.defence.level = 1;
        win.gainSkillXp(hero, 'hitpoints', 3846);
        assertEqual(hero.skills.hitpoints.level, 11, 'Hitpoints 11');
        assertEqual(hero.maxHp, 110, 'maxHp is 10 * Hitpoints 11');
        assertEqual(win.combatLevel(hero), 4, 'HP 11 with Atk/Str 2 stays combat 4');

        hero.skills.prayer.level = 6;
        assertEqual(win.combatLevel(hero), 5, 'Prayer 6 raises base combat to 5');

        hero.skills.ranged.level = 20;
        assertEqual(win.combatLevel(hero), 13, 'Ranged 20 beats melee for combat 13');

        hero.skills.magic.level = 30;
        assertEqual(win.combatLevel(hero), 18, 'Magic 30 beats ranged for combat 18');

        ['attack', 'strength', 'defence', 'hitpoints', 'prayer', 'ranged', 'magic'].forEach(function (id) {
            hero.skills[id].level = 99;
        });
        assertEqual(win.combatLevel(hero), 126, '99 combat skills are 126');
        hero.maxHp = 10 * hero.skills.hitpoints.level;
        win.applyCombatLevel(hero, false);
        win.game.registry.set('hero', hero);
        world.refreshHud();
        assertEqual(hero.level, 126, 'hero.level is 126');
        assertEqual(win.document.getElementById('hud-level').textContent, '126', 'HUD shows 126');
        assertEqual(win.document.getElementById('hud-hp').textContent, hero.hp + ' / 990', 'HUD maxHp follows Hitpoints');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');

        win.game.registry.set('hero', win.makeHero());
        H.enterZone(win, 'haven');
        world.placePlayer(spawn.x, spawn.y);
        world.refreshHud();
    });
});

EmberwoodTests.add('combat: melee vs ranged vs magic triangle hook', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        var hero = win.makeHero();
        win.game.registry.set('hero', hero);
        world.refreshHud();
        world.placePlayer(spawn.x, spawn.y);
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assertEqual(typeof win.heroCombatClass, 'function', 'heroCombatClass exists');
        assertEqual(typeof win.mobCombatClass, 'function', 'mobCombatClass exists');
        assertEqual(typeof win.combatClass, 'function', 'combatClass exists');
        assertEqual(typeof win.triangleMultiplier, 'function', 'triangleMultiplier exists');
        assertEqual(typeof win.triangleHit, 'function', 'triangleHit exists');

        hero = H.hero(win);
        assertEqual(hero.stance, 'melee', 'starter stance is melee');
        assertEqual(win.heroCombatClass(hero), 'melee', 'starter combat class is melee');
        assertEqual(win.combatSkill(hero), 'attack', 'melee Accurate still maps to Attack');
        hero.style = 'aggressive';
        assertEqual(win.combatSkill(hero), 'strength', 'melee Aggressive still maps to Strength');
        hero.style = 'defensive';
        assertEqual(win.combatSkill(hero), 'defence', 'melee Defensive still maps to Defence');
        hero.style = 'accurate';
        hero.stance = 'ranged';
        assertEqual(win.heroCombatClass(hero), 'ranged', 'ranged stance uses Ranged');
        assertEqual(win.combatSkill(hero), 'ranged', 'ranged stance trains Ranged, not Attack');
        hero.stance = 'magic';
        assertEqual(win.heroCombatClass(hero), 'magic', 'magic stance uses Magic');
        assertEqual(win.combatSkill(hero), 'magic', 'magic stance trains Magic, not Attack');
        hero.stance = 'melee';

        var chicken = H.findMob(win, 'Chicken');
        assert(chicken, 'haven chicken exists');
        assertEqual(win.mobCombatClass(chicken.mobDef), 'melee', 'Chicken is melee');
        assertEqual(chicken.mobDef.combatClass, 'melee', 'world chicken mobDef is tagged melee');
        assertEqual(win.mobCombatClass('Goblin'), 'melee', 'Goblin is melee');
        assertEqual(win.mobCombatClass('Cow'), 'melee', 'Cow is melee');
        assertEqual(win.mobCombatClass('Crab'), 'melee', 'Crab is melee');
        assertEqual(win.mobCombatClass('Skeleton'), 'melee', 'Skeleton is melee');
        assertEqual(win.mobCombatClass('Bat'), 'ranged', 'Bat is ranged');
        assertEqual(win.mobCombatClass('Slime'), 'magic', 'Slime is magic');
        assertEqual(win.mobCombatClass('Drake'), 'magic', 'Drake is magic');

        assertEqual(win.triangleMultiplier('melee', 'melee'), 1, 'same class is 1');
        assertEqual(win.triangleMultiplier('melee', 'ranged'), 1.25, 'melee beats ranged');
        assertEqual(win.triangleMultiplier('ranged', 'magic'), 1.25, 'ranged beats magic');
        assertEqual(win.triangleMultiplier('magic', 'melee'), 1.25, 'magic beats melee');
        assertEqual(win.triangleMultiplier('melee', 'magic'), 0.75, 'melee is weak to magic');
        assertEqual(win.triangleMultiplier('ranged', 'melee'), 0.75, 'ranged is weak to melee');
        assertEqual(win.triangleMultiplier('magic', 'ranged'), 0.75, 'magic is weak to ranged');
        assertEqual(win.triangleHit(16, 'melee', 'melee'), 16, 'neutral 16 stays 16');
        assertEqual(win.triangleHit(16, 'melee', 'ranged'), 20, 'melee vs ranged is 20');
        assertEqual(win.triangleHit(16, 'melee', 'magic'), 12, 'melee vs magic is 12');
        assertEqual(win.triangleHit(16, 'ranged', 'magic'), 20, 'ranged vs magic is 20');
        assertEqual(win.triangleHit(16, 'magic', 'melee'), 20, 'magic vs melee is 20');
        assertEqual(win.triangleHit(8, 'magic', 'melee'), 10, 'incoming magic vs melee 8 becomes 10');

        hero.stance = 'melee';
        win.game.registry.set('hero', hero);
        return H.startCustomFight(win, [
            { type: 'Bat', texture: 'slime', tint: 0xddbbff, hp: 80, damage: 8, gold: 0, xp: 1 }
        ]);
    }).then(function () {
        var battle = H.battle(win);
        var you = battle.heroes[0];
        var foe = battle.enemies[0];
        assertEqual(you.combatClass, 'melee', 'battle hero is melee');
        assertEqual(foe.combatClass, 'ranged', 'battle Bat is ranged');
        assertEqual(win.combatClass(you), 'melee', 'combatClass reads hero unit');
        assertEqual(win.combatClass(foe), 'ranged', 'combatClass reads Bat unit');
        assertEqual(you.damage, 16, 'starter battle damage is 16');

        var orig = win.Phaser.Math.Between;
        win.Phaser.Math.Between = function () { return 0; };
        var before = foe.hp;
        you.attack(foe);
        return H.waitUntil(function () {
            return foe.hp < before;
        }, 2000, 'melee vs ranged triangle hit').then(function () {
            win.Phaser.Math.Between = orig;
            assertEqual(before - foe.hp, 20, 'melee vs Bat deals 20 (16 * 1.25)');
            return H.forceFlee(win);
        }).catch(function (err) {
            win.Phaser.Math.Between = orig;
            throw err;
        });
    }).then(function () {
        var hero = win.makeHero();
        hero.stance = 'ranged';
        win.game.registry.set('hero', hero);
        H.world(win).refreshHud();
        return H.startCustomFight(win, [
            { type: 'Slime', texture: 'slime', tint: 0x88ffaa, hp: 80, damage: 8, gold: 0, xp: 1 }
        ]);
    }).then(function () {
        var battle = H.battle(win);
        var you = battle.heroes[0];
        var foe = battle.enemies[0];
        assertEqual(you.combatClass, 'ranged', 'ranged stance stamps the hero');
        assertEqual(foe.combatClass, 'magic', 'Slime is magic in battle');
        var orig = win.Phaser.Math.Between;
        win.Phaser.Math.Between = function () { return 0; };
        var before = foe.hp;
        you.attack(foe);
        return H.waitUntil(function () {
            return foe.hp < before;
        }, 2000, 'ranged vs magic triangle hit').then(function () {
            assertEqual(before - foe.hp, 20, 'ranged vs Slime deals 20 (16 * 1.25)');
            var incomingBefore = you.hp;
            foe.attack(you);
            return H.waitUntil(function () {
                return you.hp < incomingBefore;
            }, 2000, 'magic vs ranged incoming hit').then(function () {
                return incomingBefore;
            });
        }).then(function (incomingBefore) {
            win.Phaser.Math.Between = orig;
            assertEqual(you.hp, incomingBefore - 5, 'magic vs ranged incoming is 5 (8 * 0.75 minus wooden shield defence 1)');
            return H.forceFlee(win);
        }).catch(function (err) {
            win.Phaser.Math.Between = orig;
            throw err;
        });
    }).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        var hero = win.makeHero();
        hero.stance = 'magic';
        win.game.registry.set('hero', hero);
        world.refreshHud();
        world.placePlayer(spawn.x, spawn.y);
        var chicken = H.findMob(win, 'Chicken');
        var xp = chicken.mobDef.xp || 10;
        var orig = win.Phaser.Math.Between;
        win.Phaser.Math.Between = function () { return 0; };
        return H.startFight(win, chicken).then(function () {
            win.Hud.tryAttack();
            return H.waitWorld(win);
        }).then(function () {
            win.Phaser.Math.Between = orig;
            hero = H.hero(win);
            assertEqual(hero.stance, 'magic', 'magic stance persisted through win');
            assertEqual(win.combatSkill(hero), 'magic', 'win still maps magic stance to Magic');
            assertEqual(hero.skills.magic.xp, xp, 'magic stance grants Magic XP');
            assertEqual(hero.skills.attack.xp, 0, 'magic stance does not grant Attack XP');
            assertEqual(hero.skills.ranged.xp, 0, 'magic stance does not grant Ranged XP');
            assert(H.chatHas(win, 'collapses'), 'magic stance still wins a chicken');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
            world.placePlayer(spawn.x, spawn.y);
        }).catch(function (err) {
            win.Phaser.Math.Between = orig;
            throw err;
        });
    }).catch(function (err) {
        return H.cleanupBattle(win).then(function () {
            throw err;
        });
    });
});

EmberwoodTests.add('skills: gainSkillXp uses 1 + floor(sqrt(xp / 50)) and Hitpoints never below 10', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        var hero = win.makeHero();
        win.game.registry.set('hero', hero);
        world.refreshHud();
        world.placePlayer(spawn.x, spawn.y);
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assertEqual(typeof win.gainSkillXp, 'function', 'gainSkillXp exists');

        function curveLevel(xp) {
            return 1 + Math.floor(Math.sqrt(xp / 50));
        }
        assertEqual(curveLevel(0), 1, '0 XP is level 1');
        assertEqual(curveLevel(49), 1, '49 XP stays level 1');
        assertEqual(curveLevel(50), 2, '50 XP is level 2');
        assertEqual(curveLevel(199), 2, '199 XP stays level 2');
        assertEqual(curveLevel(200), 3, '200 XP is level 3');
        assertEqual(curveLevel(1154), 5, '1154 XP curves to 5 without the Hitpoints floor');

        hero = H.hero(win);
        assertEqual(hero.skills.attack.level, 1, 'Attack starts 1');
        assertEqual(hero.skills.attack.xp, 0, 'Attack starts 0 XP');
        assertEqual(hero.skills.hitpoints.level, 10, 'Hitpoints starts 10');
        assertEqual(hero.skills.hitpoints.xp, 1154, 'Hitpoints starts 1154 XP');

        win.gainSkillXp(hero, 'attack', 49);
        assertEqual(hero.skills.attack.xp, 49, 'Attack +49 XP');
        assertEqual(hero.skills.attack.level, 1, 'Attack stays 1 below 50 XP');

        win.gainSkillXp(hero, 'attack', 1);
        assertEqual(hero.skills.attack.xp, 50, 'Attack reaches 50 XP');
        assertEqual(hero.skills.attack.level, 2, 'Attack levels to 1 + floor(sqrt(50/50))');

        win.gainSkillXp(hero, 'strength', 200);
        assertEqual(hero.skills.strength.xp, 200, 'Strength +200 XP');
        assertEqual(hero.skills.strength.level, 3, 'Strength levels to 1 + floor(sqrt(200/50))');

        win.gainSkillXp(hero, 'hitpoints', 1);
        assertEqual(hero.skills.hitpoints.xp, 1155, 'Hitpoints +1 XP');
        assertEqual(hero.skills.hitpoints.level, 10, 'Hitpoints stays 10 when the curve is still 5');
        assertEqual(curveLevel(1155), 5, '1155 XP still curves to 5');

        hero.skills.hitpoints.xp = 0;
        hero.skills.hitpoints.level = 1;
        win.gainSkillXp(hero, 'hitpoints', 0);
        assertEqual(hero.skills.hitpoints.xp, 0, 'Hitpoints XP can be 0');
        assertEqual(hero.skills.hitpoints.level, 10, 'Hitpoints floors to 10 from 0 XP');

        hero.skills.hitpoints.xp = 800;
        hero.skills.hitpoints.level = 4;
        win.gainSkillXp(hero, 'hitpoints', 0);
        assertEqual(curveLevel(800), 5, '800 XP curves to 5');
        assertEqual(hero.skills.hitpoints.level, 10, 'Hitpoints floors to 10 from a mid curve');

        win.game.registry.set('hero', hero);
        world.refreshHud();
        H.click(win, '#tab-bar button[data-tab="skills"]');
        var rows = win.document.querySelectorAll('#skills-list .skill-row');
        var byName = {};
        for (var i = 0; i < rows.length; i++) {
            byName[rows[i].querySelector('span').textContent] = rows[i].querySelector('strong').textContent;
        }
        assertEqual(byName.Hitpoints, '10', 'Skills tab Hitpoints stays 10');
        assertEqual(byName.Attack, '2', 'Skills tab Attack is 2');
        assertEqual(byName.Strength, '3', 'Skills tab Strength is 3');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('hud: inventory 28 slots and starter kit', function (win, H) {
    var hero = H.hero(win);
    var qty = {};
    hero.inventory.forEach(function (stack) {
        qty[stack.id] = stack.qty;
    });
    assertEqual(hero.inventory.length, 5, 'five starter stacks');
    assertEqual(qty.coins, 8, '8 coins');
    assertEqual(qty.sword, 1, 'bronze sword');
    assertEqual(qty.shield, 1, 'wooden shield');
    assertEqual(qty.shrimp, 8, '8 shrimp');
    assertEqual(qty.bread, 3, '3 bread');
    assertEqual(hero.gold, 8, 'hero.gold matches coin stack');

    H.click(win, '#tab-bar button[data-tab="inv"]');
    var inv = win.document.getElementById('inv-grid');
    assertEqual(inv.querySelectorAll('.inv-slot').length, 28, '28 inventory slots');
    assertEqual(inv.querySelectorAll('.inv-slot[data-item]').length, 5, 'five filled slots');
    assertEqual(inv.querySelectorAll('.inv-slot:not([data-item])').length, 23, '23 empty slots');

    function slot(id) {
        return inv.querySelector('[data-item="' + id + '"]');
    }
    assert(slot('coins'), 'coins slot');
    assertMatch(slot('coins').textContent, '8', 'coin qty badge 8');
    assertEqual(slot('coins').title, 'Coins', 'coins title');
    assert(slot('sword'), 'sword slot');
    assertEqual(slot('sword').title, 'Bronze sword', 'sword title');
    assert(slot('shield'), 'shield slot');
    assertEqual(slot('shield').title, 'Wooden shield', 'shield title');
    assert(slot('shrimp'), 'shrimp slot');
    assertMatch(slot('shrimp').textContent, '8', 'shrimp qty badge 8');
    assertEqual(slot('shrimp').title, 'Cooked shrimp', 'shrimp title');
    assert(slot('bread'), 'bread slot');
    assertMatch(slot('bread').textContent, '3', 'bread qty badge 3');
    assertEqual(slot('bread').title, 'Bread', 'bread title');
});

EmberwoodTests.add('hud: minimap highlights Emberhaven', function (win, H) {
    var here = win.document.querySelector('#minimap .mm-cell.is-here');
    assert(here, 'minimap has current cell');
    assertEqual(here.dataset.zone, 'haven', 'haven highlighted');
    assertEqual(win.document.querySelectorAll('#minimap .mm-cell').length, 9, 'nine minimap cells');
});

EmberwoodTests.add('hud: click shrimp at full HP does not consume', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        world.placePlayer(spawn.x, spawn.y);
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assertEqual(win.ITEM_DB.shrimp.heal, 12, 'cooked shrimp heals 12');
        var hero = H.hero(win);
        assertEqual(hero.hp, hero.maxHp, 'starts at full HP');
        assertEqual(hero.hp, 100, 'starter HP is 100');
        var shrimp = hero.inventory.filter(function (s) { return s.id === 'shrimp'; })[0];
        assert(shrimp && shrimp.qty > 0, 'starter shrimp to refuse');
        var qty = shrimp.qty;
        H.click(win, '#tab-bar button[data-tab="inv"]');
        H.click(win, '#inv-grid [data-item="shrimp"]');
        hero = H.hero(win);
        assert(H.chatHas(win, 'already at full health'), 'full-HP shrimp chat');
        assertEqual(hero.inventory.filter(function (s) { return s.id === 'shrimp'; })[0].qty, qty, 'full HP does not consume shrimp');
        assertEqual(hero.hp, 100, 'HP stays at max');
        assertEqual(win.document.getElementById('hud-hp').textContent.replace(/\s+/g, ' ').trim(), '100 / 100', 'HUD HP unchanged');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('hud: click shrimp at low HP heals 12 and decrements', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        world.placePlayer(spawn.x, spawn.y);
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assertEqual(win.ITEM_DB.shrimp.heal, 12, 'cooked shrimp heals 12');
        var hero = H.hero(win);
        assertEqual(hero.maxHp, 100, 'starter maxHp is 100');
        var shrimp = hero.inventory.filter(function (s) { return s.id === 'shrimp'; })[0];
        assert(shrimp && shrimp.qty >= 2, 'starter shrimp for two eats');
        var qty = shrimp.qty;
        hero.hp = 70;
        win.game.registry.set('hero', hero);
        world.refreshHud();
        H.click(win, '#tab-bar button[data-tab="inv"]');
        H.click(win, '#inv-grid [data-item="shrimp"]');
        hero = H.hero(win);
        assertEqual(hero.hp, 82, '70 + 12 = 82');
        assertEqual(hero.inventory.filter(function (s) { return s.id === 'shrimp'; })[0].qty, qty - 1, 'low HP consumes one shrimp');
        assert(H.chatHas(win, 'You eat Cooked shrimp and recover 12 HP.'), 'eat 12 chat');
        assertEqual(win.document.getElementById('hud-hp').textContent.replace(/\s+/g, ' ').trim(), '82 / 100', 'HUD HP after +12');
        hero.hp = 95;
        win.game.registry.set('hero', hero);
        world.refreshHud();
        H.click(win, '#inv-grid [data-item="shrimp"]');
        hero = H.hero(win);
        assertEqual(hero.hp, 100, 'heal caps at maxHp');
        assertEqual(hero.inventory.filter(function (s) { return s.id === 'shrimp'; })[0].qty, qty - 2, 'capped eat still consumes');
        assert(H.chatHas(win, 'You eat Cooked shrimp and recover 5 HP.'), 'capped heal chats actual amount');
        assertEqual(win.document.getElementById('hud-hp').textContent.replace(/\s+/g, ' ').trim(), '100 / 100', 'HUD HP capped');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('hud: click bread at low HP heals 20 and decrements', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        world.placePlayer(spawn.x, spawn.y);
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assertEqual(win.ITEM_DB.bread.heal, 20, 'bread heals 20');
        var hero = H.hero(win);
        assertEqual(hero.maxHp, 100, 'starter maxHp is 100');
        var bread = hero.inventory.filter(function (s) { return s.id === 'bread'; })[0];
        assert(bread && bread.qty >= 2, 'starter bread for two eats');
        var qty = bread.qty;
        hero.hp = 70;
        win.game.registry.set('hero', hero);
        world.refreshHud();
        H.click(win, '#tab-bar button[data-tab="inv"]');
        H.click(win, '#inv-grid [data-item="bread"]');
        hero = H.hero(win);
        assertEqual(hero.hp, 90, '70 + 20 = 90');
        assertEqual(hero.inventory.filter(function (s) { return s.id === 'bread'; })[0].qty, qty - 1, 'low HP consumes one bread');
        assert(H.chatHas(win, 'You eat Bread and recover 20 HP.'), 'eat 20 chat');
        assertEqual(win.document.getElementById('hud-hp').textContent.replace(/\s+/g, ' ').trim(), '90 / 100', 'HUD HP after +20');
        hero.hp = 85;
        win.game.registry.set('hero', hero);
        world.refreshHud();
        H.click(win, '#inv-grid [data-item="bread"]');
        hero = H.hero(win);
        assertEqual(hero.hp, 100, 'heal caps at maxHp');
        assertEqual(hero.inventory.filter(function (s) { return s.id === 'bread'; })[0].qty, qty - 2, 'capped eat still consumes');
        assert(H.chatHas(win, 'You eat Bread and recover 15 HP.'), 'capped heal chats actual amount');
        assertEqual(win.document.getElementById('hud-hp').textContent.replace(/\s+/g, ' ').trim(), '100 / 100', 'HUD HP capped');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('hud: left-click eats food, wields gear, buries bones, drops junk', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.setAutoPickup(win, true);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        world.clearLoot();
        if (win.Hud.hideContextMenu) {
            win.Hud.hideContextMenu();
        }
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assertEqual(typeof win.itemDefaultVerb, 'function', 'itemDefaultVerb helper');
        assertEqual(typeof win.buryItem, 'function', 'buryItem helper');
        assertEqual(win.itemDefaultVerb('shrimp'), 'eat', 'shrimp default is eat');
        assertEqual(win.itemDefaultVerb('bread'), 'eat', 'bread default is eat');
        assertEqual(win.itemDefaultVerb('sword'), 'wield', 'sword default is wield');
        assertEqual(win.itemDefaultVerb('shield'), 'wear', 'shield default is wear');
        assertEqual(win.itemDefaultVerb('bones'), 'bury', 'bones default is bury');
        assertEqual(win.itemDefaultVerb('coins'), 'drop', 'coins default is drop');
        assertEqual(win.itemDefaultVerb('key'), 'drop', 'key default is drop');
        assert(win.ITEM_DB.bones.bury, 'bones are buryable');

        function stackQty(hero, id) {
            var stack = hero.inventory.filter(function (row) { return row.id === id; })[0];
            return stack ? stack.qty : 0;
        }

        var hero = win.makeHero();
        win.addItem(hero, 'bones', 2);
        win.addItem(hero, 'key', 1);
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        var shrimpQty = stackQty(hero, 'shrimp');
        assertEqual(hero.hp, 100, 'starts at full HP');
        assertEqual(hero.gold, 8, 'starts with 8 gold');
        assertEqual(stackQty(hero, 'bones'), 2, 'starter bones 2');
        assertEqual(stackQty(hero, 'key'), 1, 'iron key in inventory');
        assertEqual(hero.equipment.weapon, 'sword', 'starter wears bronze sword');
        assertEqual(hero.equipment.shield, 'shield', 'starter wears wooden shield');
        assertEqual(hero.skills.prayer.xp, 0, 'Prayer XP starts 0');

        H.click(win, '#tab-bar button[data-tab="inv"]');
        assert(win.document.querySelector('#inv-grid [data-item="coins"]'), 'coins slot');
        assert(win.document.querySelector('#inv-grid [data-item="sword"]'), 'sword slot');
        assert(win.document.querySelector('#inv-grid [data-item="shield"]'), 'shield slot');
        assert(win.document.querySelector('#inv-grid [data-item="bones"]'), 'bones slot');
        assert(win.document.querySelector('#inv-grid [data-item="key"]'), 'key slot');
        assert(win.document.querySelector('#inv-grid [data-item="shrimp"]'), 'shrimp slot');

        H.click(win, '#inv-grid [data-item="shrimp"]');
        hero = H.hero(win);
        assert(H.chatHas(win, 'already at full health'), 'full-HP shrimp still eats');
        assertEqual(stackQty(hero, 'shrimp'), shrimpQty, 'full HP does not consume shrimp');
        assertEqual(hero.hp, 100, 'full HP stays 100');

        hero.hp = 70;
        win.game.registry.set('hero', hero);
        world.refreshHud();
        H.click(win, '#inv-grid [data-item="shrimp"]');
        hero = H.hero(win);
        assertEqual(hero.hp, 82, 'left-click shrimp heals 12');
        assertEqual(stackQty(hero, 'shrimp'), shrimpQty - 1, 'eat consumes one shrimp');
        assertEqual(H.lastChat(win), 'You eat Cooked shrimp and recover 12 HP.', 'eat chat');

        H.click(win, '#inv-grid [data-item="sword"]');
        hero = H.hero(win);
        assertEqual(hero.equipment.weapon, 'sword', 'left-click keeps the bronze sword equipped');
        assertEqual(stackQty(hero, 'sword'), 0, 'left-click wield takes the inventory sword');
        assertEqual(H.lastChat(win), 'You wield the Bronze sword.', 'wield chat');
        assert(!win.document.querySelector('#inv-grid [data-item="sword"]'), 'inv sword slot empty after wield');

        H.click(win, '#inv-grid [data-item="shield"]');
        hero = H.hero(win);
        assertEqual(hero.equipment.shield, 'shield', 'left-click keeps the wooden shield equipped');
        assertEqual(stackQty(hero, 'shield'), 0, 'left-click wear takes the inventory shield');
        assertEqual(H.lastChat(win), 'You wear the Wooden shield.', 'wear chat');
        assert(!win.document.querySelector('#inv-grid [data-item="shield"]'), 'inv shield slot empty after wear');

        H.click(win, '#inv-grid [data-item="bones"]');
        hero = H.hero(win);
        assertEqual(stackQty(hero, 'bones'), 1, 'bury takes one bones');
        assertEqual(H.lastChat(win), 'You bury the bones.', 'bury chat');
        assertEqual(H.lootLive(win).length, 0, 'bury does not drop bones');
        assertEqual(hero.skills.prayer.xp, 4, 'bury grants 4 Prayer XP');
        assert(!H.chatHas(win, 'Use'), 'left-click bones is not use-with');

        H.click(win, '#inv-grid [data-item="coins"]');
        hero = H.hero(win);
        assertEqual(hero.gold, 7, 'left-click coins drops one');
        assertEqual(stackQty(hero, 'coins'), 7, 'coin stack syncs after drop');
        assertEqual(H.lastChat(win), 'You drop Coins.', 'coin drop chat');
        var live = H.lootLive(win);
        assertEqual(live.length, 1, 'one ground pile after coin drop');
        assertEqual(live[0].id, 'coins', 'dropped coins id');
        assertEqual(live[0].qty, 1, 'dropped coins qty 1');
        assertEqual(live[0].skipAuto, true, 'dropped coins skip auto-pickup');
        assertEqual(Math.round(live[0].sprite.x), 328, 'coin pile at player x');
        assertEqual(Math.round(live[0].sprite.y), 248, 'coin pile at player y');

        world.collectNearbyLoot();
        assertEqual(H.lootLive(win).length, 1, 'auto-pickup does not vacuum dropped coins');

        H.click(win, '#inv-grid [data-item="key"]');
        hero = H.hero(win);
        assertEqual(stackQty(hero, 'key'), 0, 'left-click drops the iron key');
        assertEqual(H.lastChat(win), 'You drop Iron key.', 'key drop chat');
        live = H.lootLive(win);
        assertEqual(live.length, 2, 'coins and key on the ground');
        var keyPile = live.filter(function (drop) { return drop.id === 'key'; })[0];
        assert(keyPile, 'key pile exists');
        assertEqual(keyPile.skipAuto, true, 'dropped key skips auto-pickup');

        world.encounterLock = true;
        var lockedBones = stackQty(H.hero(win), 'bones');
        H.click(win, '#inv-grid [data-item="bones"]');
        assertEqual(stackQty(H.hero(win), 'bones'), lockedBones, 'encounterLock does not bury');
        world.encounterLock = false;

        win.Hud.mode = 'battle';
        H.click(win, '#inv-grid [data-item="bones"]');
        assertEqual(H.lastChat(win), 'Use Eat food on your combat turn.', 'battle blocks bury');
        assertEqual(stackQty(H.hero(win), 'bones'), lockedBones, 'battle does not bury');
        win.Hud.mode = 'world';

        world.clearLoot();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'still at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'still at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('hud: inventory Use is blocked while Hud.mode is battle', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.setAutoPickup(win, true);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        world.clearLoot();
        if (win.Hud.hideContextMenu) {
            win.Hud.hideContextMenu();
        }
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assertEqual(typeof win.Hud.useItem, 'function', 'Hud.useItem helper');
        assertEqual(typeof win.Hud.canBattleAct, 'function', 'canBattleAct helper');
        assertEqual(win.Hud.mode, 'world', 'starts in world');

        function stackQty(hero, id) {
            var stack = hero.inventory.filter(function (row) { return row.id === id; })[0];
            return stack ? stack.qty : 0;
        }

        var hero = win.makeHero();
        win.addItem(hero, 'bones', 2);
        win.addItem(hero, 'key', 1);
        hero.hp = 70;
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assertEqual(hero.hp, 70, 'damaged so world eat would heal');
        assertEqual(stackQty(hero, 'shrimp'), 8, 'starter shrimp');
        assertEqual(stackQty(hero, 'bread'), 3, 'starter bread');
        assertEqual(stackQty(hero, 'bones'), 2, 'bones in inv');
        assertEqual(stackQty(hero, 'key'), 1, 'key in inv');
        assertEqual(stackQty(hero, 'sword'), 1, 'spare sword in inv');
        assertEqual(stackQty(hero, 'shield'), 1, 'spare shield in inv');
        assertEqual(hero.equipment.weapon, 'sword', 'sword equipped');
        assertEqual(hero.equipment.shield, 'shield', 'shield equipped');
        assertEqual(hero.gold, 8, 'starter gold');
        assertEqual(hero.skills.prayer.xp, 0, 'Prayer XP still 0');

        H.click(win, '#tab-bar button[data-tab="inv"]');
        assert(win.document.querySelector('#inv-grid [data-item="shrimp"]'), 'shrimp slot');
        assert(win.document.querySelector('#inv-grid [data-item="sword"]'), 'sword slot');
        assert(win.document.querySelector('#inv-grid [data-item="bones"]'), 'bones slot');
        assert(win.document.querySelector('#inv-grid [data-item="coins"]'), 'coins slot');
        assert(win.document.querySelector('#inv-grid [data-item="key"]'), 'key slot');

        function snapshot(heroState) {
            return {
                hp: heroState.hp,
                gold: heroState.gold,
                shrimp: stackQty(heroState, 'shrimp'),
                bread: stackQty(heroState, 'bread'),
                bones: stackQty(heroState, 'bones'),
                coins: stackQty(heroState, 'coins'),
                key: stackQty(heroState, 'key'),
                sword: stackQty(heroState, 'sword'),
                shield: stackQty(heroState, 'shield'),
                weapon: heroState.equipment.weapon,
                shieldWorn: heroState.equipment.shield,
                prayer: heroState.skills.prayer.xp,
                loot: H.lootLive(win).length
            };
        }

        function assertUnchanged(before, after, label) {
            assertEqual(after.hp, before.hp, label + ' hp');
            assertEqual(after.gold, before.gold, label + ' gold');
            assertEqual(after.shrimp, before.shrimp, label + ' shrimp');
            assertEqual(after.bread, before.bread, label + ' bread');
            assertEqual(after.bones, before.bones, label + ' bones');
            assertEqual(after.coins, before.coins, label + ' coins');
            assertEqual(after.key, before.key, label + ' key');
            assertEqual(after.sword, before.sword, label + ' sword');
            assertEqual(after.shield, before.shield, label + ' shield');
            assertEqual(after.weapon, before.weapon, label + ' weapon');
            assertEqual(after.shieldWorn, before.shieldWorn, label + ' worn shield');
            assertEqual(after.prayer, before.prayer, label + ' prayer xp');
            assertEqual(after.loot, before.loot, label + ' loot');
        }

        var before = snapshot(hero);
        try {
            win.Hud.battle = null;
            win.Hud.mode = 'battle';
            assertEqual(win.Hud.mode, 'battle', 'Hud.mode is battle');
            assertEqual(win.Hud.canBattleAct(), false, 'no combat turn without a battle');

            var blocked = ['shrimp', 'bread', 'sword', 'shield', 'bones', 'coins', 'key'];
            var i;
            for (i = 0; i < blocked.length; i++) {
                H.click(win, '#inv-grid [data-item="' + blocked[i] + '"]');
                assertEqual(H.lastChat(win), 'Use Eat food on your combat turn.', 'battle blocks ' + blocked[i] + ' Use');
                assertUnchanged(before, snapshot(H.hero(win)), 'after ' + blocked[i]);
            }

            win.Hud.useItem('bones');
            assertEqual(H.lastChat(win), 'Use Eat food on your combat turn.', 'useItem bones is blocked');
            assertUnchanged(before, snapshot(H.hero(win)), 'after useItem bones');
            win.Hud.useItem('shrimp');
            assertEqual(H.lastChat(win), 'Use Eat food on your combat turn.', 'world eat shrimp is blocked off-turn');
            assertUnchanged(before, snapshot(H.hero(win)), 'after useItem shrimp');

            var menu = win.document.getElementById('ctx-menu');
            assert(menu, 'ctx-menu exists');
            if (win.Hud.hideContextMenu) {
                win.Hud.hideContextMenu();
            }
            var slot = win.document.querySelector('#inv-grid [data-item="bones"]');
            slot.dispatchEvent(new win.MouseEvent('contextmenu', {
                bubbles: true,
                cancelable: true,
                view: win,
                button: 2,
                clientX: 40,
                clientY: 80
            }));
            assert(menu.hidden, 'battle hides inventory context Use/Drop');
            assertUnchanged(before, snapshot(H.hero(win)), 'after battle contextmenu');
        } finally {
            win.Hud.mode = 'world';
            win.Hud.battle = null;
        }

        assertEqual(win.Hud.mode, 'world', 'restored world');
        H.click(win, '#inv-grid [data-item="shrimp"]');
        hero = H.hero(win);
        assertEqual(hero.hp, 82, 'world Use shrimp heals 12 after battle');
        assertEqual(stackQty(hero, 'shrimp'), 7, 'world Use consumes one shrimp after battle');
        assertEqual(H.lastChat(win), 'You eat Cooked shrimp and recover 12 HP.', 'world eat chat after battle');

        world.clearLoot();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'still at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'still at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('hud: Use-on targets fire with raw shrimp and shrine with bones', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.setAutoPickup(win, true);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        world.clearLoot();
        if (world.clearWalk) {
            world.clearWalk();
        }
        if (win.Hud.hideContextMenu) {
            win.Hud.hideContextMenu();
        }
        if (win.Hud.clearUseOn) {
            win.Hud.clearUseOn();
        }
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assertEqual(typeof win.Hud.beginUseOn, 'function', 'beginUseOn helper');
        assertEqual(typeof win.Hud.finishUseOn, 'function', 'finishUseOn helper');
        assertEqual(typeof win.itemCanUseOn, 'function', 'itemCanUseOn helper');
        assertEqual(typeof win.useItemOnScenery, 'function', 'useItemOnScenery helper');
        assert(win.ITEM_DB.rawshrimp, 'raw shrimp exists');
        assertEqual(win.ITEM_DB.rawshrimp.cook, 'shrimp', 'raw shrimp cooks to shrimp');
        assertEqual(win.ITEM_DB.rawshrimp.buyPrice, undefined, 'no buyPrice this tick');
        assertEqual(win.ITEM_DB.rawshrimp.sellPrice, undefined, 'no sellPrice this tick');
        assertEqual(win.itemCanUseOn('rawshrimp', 'range'), true, 'raw uses on range');
        assertEqual(win.itemCanUseOn('rawshrimp', 'fire'), true, 'raw uses on fire');
        assertEqual(win.itemCanUseOn('bones', 'shrine'), true, 'bones use on shrine');
        assertEqual(win.itemCanUseOn('bones', 'range'), false, 'bones do not cook');
        assertEqual(win.itemCanUseOn('shrimp', 'range'), false, 'cooked shrimp is not raw');
        assert(win.game.textures.exists('item-rawshrimp'), 'item-rawshrimp is loaded');
        assertEqual(win.TOWN_PROPS.range.x, 16, 'haven range x');
        assertEqual(win.TOWN_PROPS.range.y, 17, 'haven range y');
        assertEqual(world.tileGrid[8][18], win.TILE.SHRINE, 'haven shrine tile');
        assertEqual(world.tileGrid[17][16], win.TILE.RANGE, 'haven range tile');

        function stackQty(hero, id) {
            var stack = hero.inventory.filter(function (row) { return row.id === id; })[0];
            return stack ? stack.qty : 0;
        }
        function clickTile(tx, ty) {
            var pt = win.tileCenter(tx, ty);
            world.onClick({ worldX: pt.x, worldY: pt.y });
            return pt;
        }
        function rightInv(id) {
            var slot = win.document.querySelector('#inv-grid [data-item="' + id + '"]');
            slot.dispatchEvent(new win.MouseEvent('contextmenu', {
                bubbles: true,
                cancelable: true,
                view: win,
                button: 2,
                clientX: 40,
                clientY: 80
            }));
            return slot;
        }

        var hero = win.makeHero();
        win.addItem(hero, 'bones', 3);
        win.addItem(hero, 'rawshrimp', 2);
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assertEqual(stackQty(hero, 'bones'), 3, 'starter bones 3');
        assertEqual(stackQty(hero, 'rawshrimp'), 2, 'starter raw shrimp 2');
        assertEqual(stackQty(hero, 'shrimp'), 8, 'starter cooked shrimp');
        assertEqual(hero.skills.prayer.xp, 0, 'Prayer XP starts 0');
        assertEqual(hero.skills.cooking.xp, 0, 'Cooking XP starts 0');

        H.click(win, '#tab-bar button[data-tab="inv"]');
        var menu = win.document.getElementById('ctx-menu');
        var shell = win.document.getElementById('shell');
        assert(menu, 'ctx-menu exists');
        win.Hud.hideContextMenu();
        rightInv('bones');
        assert(!menu.hidden, 'right-click bones opens menu');
        var useBtn = menu.querySelector('[data-ctx="use"]');
        assert(useBtn, 'Use is listed');
        assertEqual(useBtn.textContent, 'Use', 'Use label');
        H.mouseClick(win, useBtn);
        assert(menu.hidden, 'Use closes the menu');
        assertEqual(win.Hud.useOnId, 'bones', 'use-on id is bones');
        assert(shell.classList.contains('is-use-on'), 'shell has use-on cursor class');
        assertEqual(H.lastChat(win), 'Use Bones ->', 'use-on prompt chat');

        clickTile(18, 8);
        hero = H.hero(win);
        assertEqual(stackQty(hero, 'bones'), 2, 'shrine consumes one bones');
        assertEqual(hero.skills.prayer.xp, 0, 'shrine does not grant Prayer XP this tick');
        assertEqual(H.lastChat(win), 'You use the Bones on the shrine.', 'bones-on-shrine chat');
        assertEqual(win.Hud.useOnId, null, 'cursor clears after shrine');
        assert(!shell.classList.contains('is-use-on'), 'shell class clears after shrine');
        assert(!world.walkTarget, 'use-on shrine does not walk');

        rightInv('rawshrimp');
        useBtn = menu.querySelector('[data-ctx="use"]');
        assert(useBtn, 'Use listed on raw shrimp');
        H.mouseClick(win, useBtn);
        assertEqual(win.Hud.useOnId, 'rawshrimp', 'use-on id is raw shrimp');
        assertEqual(H.lastChat(win), 'Use Raw shrimp ->', 'raw use-on prompt');
        clickTile(16, 17);
        hero = H.hero(win);
        assertEqual(stackQty(hero, 'rawshrimp'), 1, 'range consumes one raw shrimp');
        assertEqual(stackQty(hero, 'shrimp'), 9, 'raw becomes cooked shrimp');
        assertEqual(hero.skills.cooking.xp, 30, 'range grants Cooking XP');
        assertEqual(H.lastChat(win), 'You use the Raw shrimp on the fire.', 'raw-on-fire chat');
        assertEqual(win.Hud.useOnId, null, 'cursor clears after fire');

        rightInv('bones');
        H.mouseClick(win, menu.querySelector('[data-ctx="use"]'));
        assertEqual(win.Hud.useOnId, 'bones', 'use-on ready for miss');
        clickTile(0, 2);
        hero = H.hero(win);
        assertEqual(stackQty(hero, 'bones'), 2, 'miss does not consume bones');
        assertEqual(H.lastChat(win), 'Nothing interesting happens.', 'invalid target chat');
        assertEqual(win.Hud.useOnId, null, 'miss clears cursor');

        win.Hud.beginUseOn('bones');
        assertEqual(win.Hud.useOnId, 'bones', 'Esc target armed');
        H.key(win, 'Escape', 'Escape', 'keydown');
        world.update();
        assertEqual(win.Hud.useOnId, null, 'Esc cancels use-on');
        assertEqual(stackQty(H.hero(win), 'bones'), 2, 'Esc does not consume');
        H.key(win, 'Escape', 'Escape', 'keyup');
        H.clearKeys(win);

        world.encounterLock = true;
        win.Hud.beginUseOn('bones');
        clickTile(18, 8);
        assertEqual(stackQty(H.hero(win), 'bones'), 2, 'encounterLock does not use-on');
        assertEqual(win.Hud.useOnId, null, 'lock clears use-on');
        world.encounterLock = false;

        world.clearLoot();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'still at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'still at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('inv: addItem coins increments gold and syncCoins; takeItem decrements both', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(typeof win.addItem, 'function', 'addItem is the coin-add helper');
        assertEqual(typeof win.takeItem, 'function', 'takeItem is the coin-removal helper');
        assertEqual(typeof win.syncCoins, 'function', 'syncCoins keeps gold and stack together');

        function coinQty(hero) {
            var stack = hero.inventory.filter(function (row) { return row.id === 'coins'; })[0];
            return stack ? stack.qty : 0;
        }

        function assertCoins(hero, gold, label) {
            assertEqual(hero.gold, gold, label + ' hero.gold');
            assertEqual(coinQty(hero), gold, label + ' syncCoins stack');
            assertEqual(win.document.getElementById('hud-gold').textContent, String(gold), label + ' HUD gold');
            var badge = win.document.querySelector('#inv-grid [data-item="coins"]');
            if (gold > 1) {
                assert(badge, label + ' coins slot');
                assertMatch(badge.textContent, String(gold), label + ' Inv coin badge');
            } else if (gold === 1) {
                assert(badge, label + ' coins slot');
            } else {
                assert(!badge, label + ' no coins slot at 0');
            }
        }

        var hero = H.hero(win);
        var shrimp = hero.inventory.filter(function (row) { return row.id === 'shrimp'; })[0];
        var shrimpQty = shrimp ? shrimp.qty : 0;
        H.click(win, '#tab-bar button[data-tab="inv"]');
        assertCoins(hero, 8, 'starter');

        win.addItem(hero, 'coins', 5);
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assertCoins(hero, 13, 'addItem +5');

        win.addItem(hero, 'coins');
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assertCoins(hero, 14, 'addItem default +1');

        var took = win.takeItem(hero, 'coins', 3);
        assertEqual(took, true, 'takeItem +3 succeeds');
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assertCoins(hero, 11, 'takeItem -3');

        took = win.takeItem(hero, 'coins');
        assertEqual(took, true, 'takeItem default -1 succeeds');
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assertCoins(hero, 10, 'takeItem default -1');

        var shrimpAfter = hero.inventory.filter(function (row) { return row.id === 'shrimp'; })[0];
        assertEqual(shrimpAfter ? shrimpAfter.qty : 0, shrimpQty, 'food stack untouched');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('inv: stacks merge by id and drop when qty hits 0', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(typeof win.addItem, 'function', 'addItem merges by id');
        assertEqual(typeof win.takeItem, 'function', 'takeItem drops empty stacks');
        assertEqual(typeof win.eatItem, 'function', 'eatItem uses takeItem');

        function stacksOf(hero, id) {
            return hero.inventory.filter(function (row) { return row.id === id; });
        }

        function qtyOf(hero, id) {
            var rows = stacksOf(hero, id);
            return rows.reduce(function (sum, row) { return sum + row.qty; }, 0);
        }

        function assertOneStack(hero, id, qty, label) {
            var rows = stacksOf(hero, id);
            assertEqual(rows.length, qty > 0 ? 1 : 0, label + ' stack count for ' + id);
            assertEqual(qtyOf(hero, id), qty, label + ' qty for ' + id);
            var slot = win.document.querySelector('#inv-grid [data-item="' + id + '"]');
            if (qty > 0) {
                assert(slot, label + ' Inv slot for ' + id);
                assertEqual(win.document.querySelectorAll('#inv-grid [data-item="' + id + '"]').length, 1, label + ' one Inv slot for ' + id);
                if (qty > 1) {
                    assertMatch(slot.textContent, String(qty), label + ' Inv qty badge for ' + id);
                }
            } else {
                assert(!slot, label + ' no Inv slot for ' + id);
            }
        }

        var hero = H.hero(win);
        H.click(win, '#tab-bar button[data-tab="inv"]');
        assertEqual(hero.inventory.length, 5, 'starter has five stacks');
        assertOneStack(hero, 'shrimp', 8, 'starter shrimp');
        assertOneStack(hero, 'bread', 3, 'starter bread');
        assert(!stacksOf(hero, 'bones')[0], 'starter has no bones');

        win.addItem(hero, 'shrimp', 3);
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assertOneStack(hero, 'shrimp', 11, 'addItem shrimp +3 merges');

        win.addItem(hero, 'bones', 2);
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assertOneStack(hero, 'bones', 2, 'addItem bones creates one stack');

        win.addItem(hero, 'bones', 3);
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assertOneStack(hero, 'bones', 5, 'addItem bones +3 merges');
        assertEqual(hero.inventory.filter(function (row) { return row.id === 'bones'; }).length, 1, 'still a single bones stack');

        var took = win.takeItem(hero, 'bones', 4);
        assertEqual(took, true, 'takeItem bones 4 succeeds');
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assertOneStack(hero, 'bones', 1, 'takeItem leaves qty 1');

        took = win.takeItem(hero, 'bones', 1);
        assertEqual(took, true, 'takeItem last bones succeeds');
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assertOneStack(hero, 'bones', 0, 'takeItem last qty drops bones');
        assertEqual(win.takeItem(hero, 'bones', 1), false, 'takeItem missing stack fails');

        hero.inventory.forEach(function (row) {
            if (row.id === 'shrimp') {
                row.qty = 1;
            }
        });
        hero.hp = 70;
        win.game.registry.set('hero', hero);
        world.refreshHud();
        H.click(win, '#inv-grid [data-item="shrimp"]');
        hero = H.hero(win);
        assertEqual(hero.hp, 82, 'last shrimp heals 12');
        assertOneStack(hero, 'shrimp', 0, 'eat last shrimp drops stack');
        assert(H.chatHas(win, 'You eat Cooked shrimp and recover 12 HP.'), 'eat last shrimp chat');

        hero.inventory.forEach(function (row) {
            if (row.id === 'bread') {
                row.qty = 1;
            }
        });
        hero.hp = 70;
        win.game.registry.set('hero', hero);
        world.refreshHud();
        var eaten = win.eatItem(hero, 'bread');
        assert(eaten && eaten.heal === 20, 'eatItem last bread heals 20');
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assertOneStack(hero, 'bread', 0, 'eatItem last bread drops stack');
        assertEqual(win.eatItem(hero, 'bread'), null, 'eatItem with no bread returns null');

        assertOneStack(hero, 'shrimp', 0, 'shrimp still gone');
        win.addItem(hero, 'shrimp', 2);
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assertOneStack(hero, 'shrimp', 2, 'addItem after drop makes one new stack');

        took = win.takeItem(hero, 'coins', hero.gold);
        assertEqual(took, true, 'takeItem all coins succeeds');
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assertEqual(hero.gold, 0, 'gold is 0 after last coins');
        assertOneStack(hero, 'coins', 0, 'last coins drop the stack');

        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('inv: 28-stack cap refuses loot shop buy and gather with inventory full', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.setAutoPickup(win, true);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        world.clearLoot();
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(win.INVENTORY_CAP, 28, 'hard inventory cap is 28 stacks');
        assertEqual(typeof win.canAddItem, 'function', 'canAddItem helper');
        assertEqual(typeof win.addItem, 'function', 'addItem respects the cap');
        assertEqual(typeof world.tryPickup, 'function', 'tryPickup is loot');
        assertEqual(typeof world.collectNearbyLoot, 'function', 'collectNearbyLoot is gather');

        var hero = win.makeHero();
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assertEqual(hero.inventory.length, 5, 'starter has five stacks');
        assertEqual(win.canAddItem(hero, 'bones'), true, 'new bones stack has room');
        assertEqual(win.canAddItem(hero, 'shrimp'), true, 'existing shrimp can merge');
        assertEqual(win.addItem(hero, 'bones', 1), true, 'addItem bones succeeds with room');
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assertEqual(hero.inventory.length, 6, 'bones opened a sixth stack');

        win.takeItem(hero, 'bones', 1);
        var n = 0;
        while (hero.inventory.length < win.INVENTORY_CAP) {
            hero.inventory.push({ id: 'pad-' + n, qty: 1 });
            n += 1;
        }
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assertEqual(hero.inventory.length, 28, 'bag filled to 28 stacks');
        assertEqual(win.canAddItem(hero, 'bones'), false, 'new bones stack is refused');
        assertEqual(win.canAddItem(hero, 'shrimp'), true, 'shrimp still merges at 28');
        assertEqual(win.canAddItem(hero), false, 'shop new-stack buy is refused at 28');
        assertEqual(win.addItem(hero, 'bones', 1), false, 'addItem bones fails at cap');
        assertEqual(hero.inventory.filter(function (row) { return row.id === 'bones'; }).length, 0, 'bones never added');
        var shrimp = hero.inventory.filter(function (row) { return row.id === 'shrimp'; })[0];
        var shrimpQty = shrimp.qty;
        assertEqual(win.addItem(hero, 'shrimp', 1), true, 'addItem shrimp merges at cap');
        assertEqual(shrimp.qty, shrimpQty + 1, 'shrimp qty grew');
        assertEqual(hero.inventory.length, 28, 'merge does not grow past 28');
        var gold = hero.gold;
        assertEqual(win.addItem(hero, 'coins', 3), true, 'addItem coins merges at cap');
        assertEqual(hero.gold, gold + 3, 'gold still increases when coins exist');
        assertEqual(hero.inventory.length, 28, 'coins merge stays at 28');

        H.click(win, '#tab-bar button[data-tab="inv"]');
        var inv = win.document.getElementById('inv-grid');
        assertEqual(inv.querySelectorAll('.inv-slot').length, 28, 'HUD still has 28 slots');
        assertEqual(inv.querySelectorAll('.inv-slot[data-item]').length, 28, 'all 28 slots filled');

        win.Hud.el.log.innerHTML = '';
        world.spawnLoot(spawn.x, spawn.y, [{ id: 'bones', qty: 1 }]);
        var live = (world.groundLoot || []).filter(function (entry) { return entry && !entry.taken && entry.sprite; });
        assertEqual(live.length, 1, 'bones pile spawned');
        var drop = live[0];
        assertEqual(world.tryPickup(drop), false, 'loot pickup refuses a new stack');
        assertEqual(drop.taken, false, 'loot stays on the ground');
        assert(drop.sprite, 'loot sprite is not destroyed');
        assertEqual(H.lastChat(win), 'inventory full', 'loot chats inventory full');
        assertEqual(H.hero(win).inventory.length, 28, 'loot did not add a stack');
        assertEqual(H.hero(win).inventory.filter(function (row) { return row.id === 'bones'; }).length, 0, 'no bones from refused loot');

        world.collectNearbyLoot();
        assert(!drop.taken, 'gather leaves the pile');
        assert(drop.sprite, 'gather does not destroy the sprite');
        assertEqual(H.hero(win).inventory.length, 28, 'gather did not add a stack');
        assert(H.chatHas(win, 'inventory full'), 'gather refuse is inventory full');

        var shop = win.document.getElementById('shop-overlay');
        gold = H.hero(win).gold;
        win.Hud.showShop({ key: 'shopkeep', name: 'Shopkeeper Mira' });
        assert(win.Hud.shopOpen(), 'shop opens while bag is full');
        H.click(win, shop.querySelector('[data-shop-action="buy"]'));
        assertEqual(H.lastChat(win), 'inventory full', 'shop buy chats inventory full');
        assertEqual(H.hero(win).gold, gold, 'shop buy does not take gold when full');
        assertEqual(H.hero(win).inventory.length, 28, 'shop buy does not add a stack');
        assert(win.Hud.shopOpen(), 'shop stays open after refuse');
        H.click(win, win.document.getElementById('btn-shop-close'));
        assert(!win.Hud.shopOpen(), 'shop closed');

        hero = H.hero(win);
        hero.inventory = hero.inventory.filter(function (row) { return row.id !== 'pad-0'; });
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assertEqual(hero.inventory.length, 27, 'one pad stack removed');
        assertEqual(win.canAddItem(hero, 'bones'), true, 'bones has room again');
        win.Hud.el.log.innerHTML = '';
        assertEqual(world.tryPickup(drop), true, 'loot pickup succeeds with room');
        assert(drop.taken, 'bones pile taken');
        assert(H.chatHas(win, 'You pick up'), 'pickup chat after room');
        hero = H.hero(win);
        assertEqual(hero.inventory.filter(function (row) { return row.id === 'bones'; })[0].qty, 1, 'bones entered the bag');

        world.clearLoot();
        world.spawnLoot(spawn.x, spawn.y, [{ id: 'key', qty: 1 }]);
        live = (world.groundLoot || []).filter(function (entry) { return entry && !entry.taken && entry.sprite; });
        drop = live[0];
        n = 0;
        hero = H.hero(win);
        while (hero.inventory.length < win.INVENTORY_CAP) {
            hero.inventory.push({ id: 'fill-' + n, qty: 1 });
            n += 1;
        }
        win.game.registry.set('hero', hero);
        world.refreshHud();
        win.Hud.el.log.innerHTML = '';
        world.placePlayer(spawn.x, spawn.y);
        world.collectNearbyLoot();
        assert(!drop.taken, 'gather refuses a new key stack');
        assertEqual(H.lastChat(win), 'inventory full', 'gather chats inventory full');
        assertEqual(H.hero(win).inventory.filter(function (row) { return row.id === 'key'; }).length, 0, 'no key from refused gather');

        hero = H.hero(win);
        hero.inventory = hero.inventory.filter(function (row) {
            return String(row.id).indexOf('pad-') !== 0 && String(row.id).indexOf('fill-') !== 0;
        });
        win.game.registry.set('hero', hero);
        world.refreshHud();
        win.Hud.showShop({ key: 'shopkeep', name: 'Shopkeeper Mira' });
        H.click(win, shop.querySelector('[data-shop-action="buy"]'));
        assertEqual(H.lastChat(win), 'The shelves are still being stocked.', 'Buy stays stubbed when there is room');
        H.click(win, win.document.getElementById('btn-shop-close'));

        world.clearLoot();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'still at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'still at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('inv: drop from inventory creates groundLoot at the player', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.setAutoPickup(win, true);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        world.clearLoot();
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(typeof world.dropFromInventory, 'function', 'dropFromInventory helper');
        assertEqual(typeof win.Hud.dropItem, 'function', 'Hud.dropItem helper');
        assertEqual(win.Hud.mode, 'world', 'world mode');

        var hero = win.makeHero();
        win.addItem(hero, 'bones', 2);
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assertEqual(hero.autoPickup, true, 'auto-pickup stays on');
        assertEqual(hero.inventory.filter(function (row) { return row.id === 'bones'; })[0].qty, 2, 'starter bones 2');
        var bread = hero.inventory.filter(function (row) { return row.id === 'bread'; })[0];
        var breadQty = bread.qty;
        var gold = hero.gold;

        H.click(win, '#tab-bar button[data-tab="inv"]');
        var inv = win.document.getElementById('inv-grid');
        assert(inv.querySelector('[data-item="bones"]'), 'bones slot before drop');

        var menu = win.document.getElementById('ctx-menu');
        assert(menu, 'ctx-menu element exists');
        if (win.Hud.hideContextMenu) {
            win.Hud.hideContextMenu();
        }
        assert(menu.hidden, 'menu starts hidden');
        var slot = inv.querySelector('[data-item="bones"]');
        slot.dispatchEvent(new win.MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            view: win,
            button: 2,
            clientX: 40,
            clientY: 80
        }));
        assert(!menu.hidden, 'right-click inventory opens Drop menu');
        var dropBtn = menu.querySelector('[data-ctx="drop"]');
        assert(dropBtn, 'Drop action is listed');
        assertEqual(dropBtn.textContent, 'Drop', 'Drop label');
        assertEqual(win.Hud.ctxTarget.itemId, 'bones', 'menu stores bones id');
        assertEqual(win.Hud.ctxTarget.kind, 'inv', 'menu is inventory drop');

        var droppedAt = world.time.now;
        H.mouseClick(win, dropBtn);
        assert(menu.hidden, 'Drop closes the menu');
        hero = H.hero(win);
        assertEqual(hero.inventory.filter(function (row) { return row.id === 'bones'; })[0].qty, 1, 'Drop takes one bones');
        assertEqual(H.lastChat(win), 'You drop Bones.', 'drop chat');
        var live = H.lootLive(win);
        assertEqual(live.length, 1, 'one ground pile after Drop');
        assertEqual(live[0].id, 'bones', 'dropped bones id');
        assertEqual(live[0].qty, 1, 'dropped bones qty 1');
        assertEqual(live[0].skipAuto, true, 'dropped pile skips auto-pickup');
        assertEqual(Math.round(live[0].sprite.x), 328, 'bones pile at player x');
        assertEqual(Math.round(live[0].sprite.y), 248, 'bones pile at player y');
        assertEqual(live[0].until, droppedAt + 20000, 'dropped until is now + 20000');
        assert(inv.querySelector('[data-item="bones"]'), 'bones slot still filled');

        world.collectNearbyLoot();
        live = H.lootLive(win);
        assertEqual(live.length, 1, 'auto-pickup does not vacuum a dropped pile');
        assertEqual(live[0].taken, false, 'dropped bones stay on the ground');
        assertEqual(H.hero(win).inventory.filter(function (row) { return row.id === 'bones'; })[0].qty, 1, 'inventory bones unchanged by vacuum');

        var breadDrop = world.dropFromInventory('bread', 1);
        assert(breadDrop && breadDrop.sprite, 'dropFromInventory returns a loot entry');
        hero = H.hero(win);
        assertEqual(hero.inventory.filter(function (row) { return row.id === 'bread'; })[0].qty, breadQty - 1, 'bread stack decrements');
        assertEqual(H.lastChat(win), 'You drop Bread.', 'bread drop chat');
        live = H.lootLive(win);
        assertEqual(live.length, 2, 'bones and bread on the ground');
        var breadPile = live.filter(function (drop) { return drop.id === 'bread'; })[0];
        assert(breadPile, 'bread pile exists');
        assertEqual(Math.round(breadPile.sprite.x), 328, 'bread pile at player x');
        assertEqual(Math.round(breadPile.sprite.y), 248, 'bread pile at player y');
        assertEqual(breadPile.skipAuto, true, 'bread pile skips auto-pickup');

        var coinDrop = win.Hud.dropItem('coins', 1);
        assert(coinDrop && coinDrop.id === 'coins', 'Hud.dropItem drops coins');
        hero = H.hero(win);
        assertEqual(hero.gold, gold - 1, 'dropping a coin decrements gold');
        assertEqual(hero.inventory.filter(function (row) { return row.id === 'coins'; })[0].qty, gold - 1, 'coin stack syncs');
        assertEqual(win.document.getElementById('hud-gold').textContent, String(gold - 1), 'HUD gold after coin drop');
        assertEqual(H.lastChat(win), 'You drop Coins.', 'coin drop chat');

        world.collectNearbyLoot();
        assertEqual(H.lootLive(win).length, 3, 'three skipped piles stay at the player');

        var bonesPile = H.lootLive(win).filter(function (drop) { return drop.id === 'bones'; })[0];
        assertEqual(world.tryPickup(bonesPile), true, 'click pickup still takes a dropped pile');
        hero = H.hero(win);
        assertEqual(hero.inventory.filter(function (row) { return row.id === 'bones'; })[0].qty, 2, 'bones return on pickup');
        assert(H.chatHas(win, 'You pick up Bones.'), 'pickup chat after drop');

        world.dropFromInventory('bones', 2);
        hero = H.hero(win);
        assertEqual(hero.inventory.filter(function (row) { return row.id === 'bones'; }).length, 0, 'last bones drop the stack');
        assert(!win.document.querySelector('#inv-grid [data-item="bones"]'), 'bones slot gone after last drop');

        world.encounterLock = true;
        var locked = world.dropFromInventory('bread', 1);
        assertEqual(locked, false, 'encounterLock refuses drop');
        world.encounterLock = false;
        win.Hud.mode = 'battle';
        assertEqual(world.dropFromInventory('bread', 1), false, 'battle mode refuses drop');
        win.Hud.mode = 'world';
        hero = H.hero(win);
        assertEqual(hero.inventory.filter(function (row) { return row.id === 'bread'; })[0].qty, breadQty - 1, 'refused drops do not take bread');

        world.clearLoot();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'still at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'still at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('inv: shift-click drop follows Settings toggle', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.setAutoPickup(win, true);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        world.clearLoot();
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(typeof win.shiftClickDropOn, 'function', 'shiftClickDropOn helper');
        assertEqual(typeof H.shiftClick, 'function', 'harness shiftClick helper');

        var fresh = win.makeHero();
        assertEqual(fresh.shiftClickDrop, true, 'makeHero OSRS default is on');
        assertEqual(win.shiftClickDropOn(fresh), true, 'shiftClickDropOn reads starter on');

        var hero = win.makeHero();
        win.addItem(hero, 'bones', 2);
        delete hero.shiftClickDrop;
        win.game.registry.set('hero', hero);
        world.refreshHud();
        assertEqual(win.shiftClickDropOn(H.hero(win)), true, 'missing key defaults on');
        assertMatch(win.document.querySelector('#panel-settings [data-shift-click-drop]').textContent, 'On', 'missing key shows On');

        H.click(win, '#tab-bar button[data-tab="settings"]');
        assert(H.panelVisible(win, 'settings'), 'Settings panel visible');
        var toggle = win.document.querySelector('#panel-settings [data-shift-click-drop]');
        assert(toggle, 'Settings shift-click drop toggle exists');
        assertMatch(toggle.textContent, 'On', 'settings label starts On');
        assert(toggle.classList.contains('is-on'), 'settings button is-on');

        H.click(win, '#tab-bar button[data-tab="inv"]');
        var inv = win.document.getElementById('inv-grid');
        assert(inv.querySelector('[data-item="bones"]'), 'bones slot before shift-click');

        var droppedAt = world.time.now;
        H.shiftClick(win, '#inv-grid [data-item="bones"]');
        hero = H.hero(win);
        assertEqual(hero.inventory.filter(function (row) { return row.id === 'bones'; })[0].qty, 1, 'shift-click Drop takes one bones');
        assertEqual(H.lastChat(win), 'You drop Bones.', 'shift-click drop chat');
        var live = H.lootLive(win);
        assertEqual(live.length, 1, 'one ground pile after shift-click');
        assertEqual(live[0].id, 'bones', 'dropped bones id');
        assertEqual(live[0].qty, 1, 'dropped bones qty 1');
        assertEqual(live[0].skipAuto, true, 'dropped pile skips auto-pickup');
        assertEqual(Math.round(live[0].sprite.x), 328, 'bones pile at player x');
        assertEqual(Math.round(live[0].sprite.y), 248, 'bones pile at player y');
        assertEqual(live[0].until, droppedAt + 20000, 'dropped until is now + 20000');

        world.collectNearbyLoot();
        assertEqual(H.lootLive(win).length, 1, 'auto-pickup does not vacuum a shift-clicked pile');

        H.click(win, '#tab-bar button[data-tab="settings"]');
        var settingsClicked = H.mouseClick(win, '#panel-settings [data-shift-click-drop]');
        assertEqual(H.hero(win).shiftClickDrop, false, 'settings panel toggles off');
        assertMatch(win.document.querySelector('#panel-settings [data-shift-click-drop]').textContent, 'Off', 'settings label Off');
        assert(win.document.activeElement !== settingsClicked, 'settings toggle blurs after click');
        assert(H.chatHas(win, 'Shift-click drop off'), 'toggle off chat');
        assertEqual(win.shiftClickDropOn(H.hero(win)), false, 'shiftClickDropOn reads off');

        H.click(win, '#tab-bar button[data-tab="inv"]');
        H.shiftClick(win, '#inv-grid [data-item="bones"]');
        assertEqual(H.lastChat(win), 'You bury the bones.', 'shift-click with toggle off uses bury');
        assertEqual(H.hero(win).inventory.filter(function (row) { return row.id === 'bones'; }).length, 0, 'toggle off buries the last bones');
        assertEqual(H.lootLive(win).length, 1, 'toggle off leaves only the earlier pile');

        H.click(win, '#tab-bar button[data-tab="settings"]');
        H.mouseClick(win, '#panel-settings [data-shift-click-drop]');
        assertEqual(H.hero(win).shiftClickDrop, true, 'settings panel toggles on');
        assert(H.chatHas(win, 'Shift-click drop on'), 'toggle on chat');

        H.click(win, '#tab-bar button[data-tab="inv"]');
        var bread = H.hero(win).inventory.filter(function (row) { return row.id === 'bread'; })[0];
        var breadQty = bread.qty;
        H.shiftClick(win, '#inv-grid [data-item="bread"]');
        hero = H.hero(win);
        assertEqual(hero.inventory.filter(function (row) { return row.id === 'bread'; })[0].qty, breadQty - 1, 'shift-click drops bread when on');
        assertEqual(H.lastChat(win), 'You drop Bread.', 'bread shift-click drop chat');
        assertEqual(H.lootLive(win).length, 2, 'bones and bread on the ground');

        world.encounterLock = true;
        var locked = H.shiftClick(win, '#inv-grid [data-item="bread"]');
        assert(locked, 'shift-click still hits the bread slot');
        assertEqual(world.dropFromInventory('bread', 1), false, 'encounterLock refuses drop');
        world.encounterLock = false;
        win.Hud.mode = 'battle';
        H.shiftClick(win, '#inv-grid [data-item="bread"]');
        assertEqual(H.hero(win).inventory.filter(function (row) { return row.id === 'bread'; })[0].qty, breadQty - 1, 'battle mode does not shift-drop');
        win.Hud.mode = 'world';

        world.clearLoot();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'still at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'still at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('hud: eat food from inventory', function (win, H) {
    H.click(win, '#tab-bar button[data-tab="inv"]');
    H.click(win, '#inv-grid [data-item="shrimp"]');
    assert(H.chatHas(win, 'already at full health'), 'refuse food at full HP');
    var hero = H.hero(win);
    var shrimpBefore = hero.inventory.filter(function (s) { return s.id === 'shrimp'; })[0].qty;
    hero.hp = 70;
    win.game.registry.set('hero', hero);
    H.world(win).refreshHud();
    H.click(win, '#inv-grid [data-item="shrimp"]');
    hero = H.hero(win);
    assertEqual(hero.hp, 82, 'shrimp heals 12');
    var shrimpAfter = hero.inventory.filter(function (s) { return s.id === 'shrimp'; })[0].qty;
    assertEqual(shrimpAfter, shrimpBefore - 1, 'shrimp consumed');
    assertMatch(win.document.getElementById('hud-hp').textContent, '82 / 100', 'HUD HP after eat');
    H.click(win, '#inv-grid [data-item="bread"]');
    hero = H.hero(win);
    assertEqual(hero.hp, 100, 'bread finishes heal');
    hero.hp = 100;
    win.game.registry.set('hero', hero);
    H.world(win).refreshHud();
});

EmberwoodTests.add('movement: W walks north from Emberhaven spawn via Keys.js', function (win, H) {
    var world = H.world(win);
    H.setAutoAttack(win, false);
    H.enterZone(win, 'haven');
    world.walkTarget = null;
    world.engageTarget = null;
    world.talkTarget = null;
    var spawn = win.defaultWorldSpawn();
    world.placePlayer(spawn.x, spawn.y);
    assertEqual(world.zoneId, 'haven', 'Emberhaven');
    assertEqual(Math.round(world.player.x), spawn.x, 'courtyard spawn x');
    assertEqual(Math.round(world.player.y), spawn.y, 'courtyard spawn y');
    assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
    assert(!world.cursors, 'WorldScene has no Phaser cursors');
    assertEqual(typeof win.Keys.up, 'function', 'Keys.up exists');
    var startX = world.player.x;
    var startY = world.player.y;
    H.key(win, 'KeyW', 'w', 'keydown');
    assert(win.Keys.isDown('KeyW'), 'Keys.js recorded KeyW');
    assert(win.Keys.up(), 'Keys.up is true for W');
    var flags = world.moveFlags();
    assert(flags.up && !flags.left && !flags.right && !flags.down, 'moveFlags up-only from Keys');
    return H.sleep(400).then(function () {
        assert(world.player.y < startY - 16, 'W walks north from spawn, y=' + world.player.y);
        assert(Math.abs(world.player.x - startX) < 8, 'W does not drift sideways');
        var anim = world.player.anims.currentAnim;
        assert(anim && anim.key === 'up', 'up walk animation');
        H.key(win, 'KeyW', 'w', 'keyup');
        if (win.Keys) {
            win.Keys.down = {};
        }
    });
});

EmberwoodTests.add('movement: A S D walk west south east from Emberhaven spawn via Keys.js', function (win, H) {
    var world = H.world(win);
    H.setAutoAttack(win, false);
    H.enterZone(win, 'haven');
    var spawn = win.defaultWorldSpawn();
    assertEqual(world.zoneId, 'haven', 'Emberhaven');
    assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
    assert(!world.cursors, 'WorldScene has no Phaser cursors');
    assertEqual(typeof win.Keys.left, 'function', 'Keys.left exists');
    assertEqual(typeof win.Keys.right, 'function', 'Keys.right exists');
    assertEqual(typeof win.Keys.downArrow, 'function', 'Keys.downArrow exists');

    var resetSpawn = function () {
        world.placePlayer(spawn.x, spawn.y);
        world.walkTarget = null;
        world.engageTarget = null;
        world.talkTarget = null;
        if (win.Keys) {
            win.Keys.down = {};
            win.Keys.pressed = {};
        }
        assertEqual(Math.round(world.player.x), spawn.x, 'courtyard spawn x');
        assertEqual(Math.round(world.player.y), spawn.y, 'courtyard spawn y');
    };

    var walkAxis = function (code, key, flag, axis, sign, anim) {
        resetSpawn();
        H.key(win, code, key, 'keydown');
        assert(win.Keys.isDown(code), 'Keys.js recorded ' + code);
        var flags = world.moveFlags();
        assert(flags[flag], 'moveFlags.' + flag + ' from ' + code);
        assert((flag === 'left') === flags.left, 'left flag for ' + code);
        assert((flag === 'right') === flags.right, 'right flag for ' + code);
        assert((flag === 'up') === flags.up, 'up flag for ' + code);
        assert((flag === 'down') === flags.down, 'down flag for ' + code);
        return H.sleep(400).then(function () {
            if (axis === 'x') {
                assert(sign * (world.player.x - spawn.x) > 16, code + ' walks ' + (sign < 0 ? 'west' : 'east') + ', x=' + world.player.x);
                assert(Math.abs(world.player.y - spawn.y) < 8, code + ' does not drift north/south');
            } else {
                assert(sign * (world.player.y - spawn.y) > 16, code + ' walks ' + (sign < 0 ? 'north' : 'south') + ', y=' + world.player.y);
                assert(Math.abs(world.player.x - spawn.x) < 8, code + ' does not drift east/west');
            }
            var current = world.player.anims.currentAnim;
            assert(current && current.key === anim, anim + ' walk animation');
            H.key(win, code, key, 'keyup');
            if (win.Keys) {
                win.Keys.down = {};
            }
        });
    };

    return walkAxis('KeyA', 'a', 'left', 'x', -1, 'left').then(function () {
        return walkAxis('KeyS', 's', 'down', 'y', 1, 'down');
    }).then(function () {
        return walkAxis('KeyD', 'd', 'right', 'x', 1, 'right');
    });
});

EmberwoodTests.add('movement: WASD walks the hero from spawn', function (win, H) {
    var world = H.world(win);
    H.setAutoAttack(win, false);
    H.enterZone(win, 'haven');
    world.walkTarget = null;
    world.engageTarget = null;
    var startX = world.player.x;
    var startY = world.player.y;
    assert(startX > 16 && startY > 16, 'spawned on the map');
    return H.holdKey(win, 'KeyD', 'd', 400).then(function () {
        assert(world.player.x > startX + 16, 'D walks right, x=' + world.player.x);
        var x = world.player.x;
        return H.holdKey(win, 'KeyA', 'a', 400).then(function () {
            assert(world.player.x < x - 16, 'A walks left');
            var y = world.player.y;
            return H.holdKey(win, 'KeyW', 'w', 400).then(function () {
                assert(world.player.y < y - 16, 'W walks up');
                y = world.player.y;
                return H.holdKey(win, 'KeyS', 's', 400).then(function () {
                    assert(world.player.y > y + 16, 'S walks down');
                });
            });
        });
    });
});

EmberwoodTests.add('movement: arrow keys walk the hero', function (win, H) {
    var world = H.world(win);
    H.setAutoAttack(win, false);
    H.enterZone(win, 'haven');
    var spawn = win.defaultWorldSpawn();
    assertEqual(world.zoneId, 'haven', 'Emberhaven');
    assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
    assert(!world.cursors, 'WorldScene has no Phaser cursors');
    assertEqual(typeof win.Keys.left, 'function', 'Keys.left exists');
    assertEqual(typeof win.Keys.up, 'function', 'Keys.up exists');
    assertEqual(typeof win.Keys.downArrow, 'function', 'Keys.downArrow exists');

    var resetSpawn = function () {
        world.placePlayer(spawn.x, spawn.y);
        world.walkTarget = null;
        world.engageTarget = null;
        world.talkTarget = null;
        if (win.Keys) {
            win.Keys.down = {};
            win.Keys.pressed = {};
        }
        assertEqual(Math.round(world.player.x), spawn.x, 'courtyard spawn x');
        assertEqual(Math.round(world.player.y), spawn.y, 'courtyard spawn y');
    };

    var walkArrow = function (code, key, flag, axis, sign, anim) {
        resetSpawn();
        H.key(win, code, key, 'keydown');
        assert(win.Keys.isDown(code), 'Keys.js recorded ' + code);
        var flags = world.moveFlags();
        assert(flags[flag], 'moveFlags.' + flag + ' from ' + code);
        assert((flag === 'left') === flags.left, 'left flag for ' + code);
        assert((flag === 'right') === flags.right, 'right flag for ' + code);
        assert((flag === 'up') === flags.up, 'up flag for ' + code);
        assert((flag === 'down') === flags.down, 'down flag for ' + code);
        return H.sleep(400).then(function () {
            if (axis === 'x') {
                assert(sign * (world.player.x - spawn.x) > 16, code + ' walks ' + (sign < 0 ? 'west' : 'east') + ', x=' + world.player.x);
                assert(Math.abs(world.player.y - spawn.y) < 8, code + ' does not drift north/south');
            } else {
                assert(sign * (world.player.y - spawn.y) > 16, code + ' walks ' + (sign < 0 ? 'north' : 'south') + ', y=' + world.player.y);
                assert(Math.abs(world.player.x - spawn.x) < 8, code + ' does not drift east/west');
            }
            var current = world.player.anims.currentAnim;
            assert(current && current.key === anim, anim + ' walk animation');
            H.key(win, code, key, 'keyup');
            if (win.Keys) {
                win.Keys.down = {};
            }
        });
    };

    return walkArrow('ArrowUp', 'ArrowUp', 'up', 'y', -1, 'up').then(function () {
        return walkArrow('ArrowDown', 'ArrowDown', 'down', 'y', 1, 'down');
    }).then(function () {
        return walkArrow('ArrowLeft', 'ArrowLeft', 'left', 'x', -1, 'left');
    }).then(function () {
        return walkArrow('ArrowRight', 'ArrowRight', 'right', 'x', 1, 'right');
    });
});

EmberwoodTests.add('movement: WASD works after clicking a HUD tab', function (win, H) {
    var world = H.world(win);
    H.setAutoAttack(win, false);
    H.enterZone(win, 'haven');
    world.walkTarget = null;
    world.engageTarget = null;
    world.talkTarget = null;
    var spawn = win.defaultWorldSpawn();
    world.placePlayer(spawn.x, spawn.y);
    var tabs = ['combat', 'skills', 'quest', 'inv', 'equip', 'prayer', 'magic', 'settings'];
    var walks = [
        { code: 'KeyW', key: 'w', flag: 'up' },
        { code: 'KeyA', key: 'a', flag: 'left' },
        { code: 'KeyS', key: 's', flag: 'down' },
        { code: 'KeyD', key: 'd', flag: 'right' }
    ];
    tabs.forEach(function (tab, i) {
        var btn = win.document.querySelector('#tab-bar button[data-tab="' + tab + '"]');
        assert(btn, 'missing tab ' + tab);
        btn.focus();
        assertEqual(win.document.activeElement, btn, tab + ' tab can take focus');
        H.mouseClick(win, btn);
        assert(H.panelVisible(win, tab), 'panel ' + tab + ' visible after click');
        assertEqual(win.Hud.tab, tab, 'hud.tab ' + tab);
        assert(win.document.activeElement !== btn, tab + ' tab blurred after mouseup');
        assert(!btn.matches(':focus'), tab + ' tab is not :focus');
        var step = walks[i % walks.length];
        H.key(win, step.code, step.key, 'keydown');
        assert(win.Keys.isDown(step.code), 'Keys.js recorded ' + step.code + ' after ' + tab);
        var flags = world.moveFlags();
        assert(flags[step.flag], 'moveFlags.' + step.flag + ' after ' + tab + ' click');
        H.key(win, step.code, step.key, 'keyup');
        if (win.Keys) {
            win.Keys.down = {};
            win.Keys.pressed = {};
        }
    });
    assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
    world.placePlayer(spawn.x, spawn.y);
    var startX = world.player.x;
    var startY = world.player.y;
    return H.holdKey(win, 'KeyD', 'd', 400).then(function () {
        assert(world.player.x > startX + 16, 'D walks after every HUD tab, x=' + world.player.x);
        var x = world.player.x;
        return H.holdKey(win, 'KeyA', 'a', 400).then(function () {
            assert(world.player.x < x - 16, 'A walks after every HUD tab');
            var y = world.player.y;
            return H.holdKey(win, 'KeyW', 'w', 400).then(function () {
                assert(world.player.y < y - 16, 'W walks after every HUD tab');
                y = world.player.y;
                return H.holdKey(win, 'KeyS', 's', 400).then(function () {
                    assert(world.player.y > y + 16, 'S walks after every HUD tab');
                    assert(H.panelVisible(win, 'settings'), 'last clicked Settings panel still open');
                    assert(Math.abs(world.player.x - startX) < 8, 'A/D cancel so x stays near start');
                });
            });
        });
    });
});

EmberwoodTests.add('movement: opposite keys cancel and keyup clears velocity', function (win, H) {
    var world = H.world(win);
    H.setAutoAttack(win, false);
    H.enterZone(win, 'haven');
    var spawn = win.defaultWorldSpawn();

    var resetSpawn = function () {
        world.placePlayer(spawn.x, spawn.y);
        world.walkTarget = null;
        world.engageTarget = null;
        world.talkTarget = null;
        H.clearKeys(win);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), spawn.x, 'courtyard spawn x');
        assertEqual(Math.round(world.player.y), spawn.y, 'courtyard spawn y');
    };

    var assertNoJitter = function (samples, axisV, otherV, otherPos, startOther, label) {
        var signs = [];
        var i;
        for (i = 0; i < samples.length; i++) {
            var sample = samples[i];
            signs.push(Math.sign(Math.round(sample[axisV])));
            assert(Math.abs(sample[otherV]) < 8, label + ' no ' + otherV + ' drift');
            assert(Math.abs(sample[otherPos] - startOther) < 8, label + ' stays on ' + otherPos);
        }
        var nonzero = signs.filter(function (sign) { return sign !== 0; });
        if (nonzero.length) {
            var first = nonzero[0];
            for (i = 0; i < nonzero.length; i++) {
                assert(nonzero[i] === first, label + ' velocity sign does not flip');
            }
        }
        var maxPos = samples[0][axisV === 'vx' ? 'x' : 'y'];
        var minPos = maxPos;
        for (i = 1; i < samples.length; i++) {
            var pos = samples[i][axisV === 'vx' ? 'x' : 'y'];
            if (pos > maxPos) { maxPos = pos; }
            if (pos < minPos) { minPos = pos; }
        }
        assert(maxPos - minPos < 10, label + ' does not oscillate (span=' + (maxPos - minPos).toFixed(2) + ')');
    };

    var assertStopped = function (label) {
        return H.sleep(50).then(function () {
            assert(Math.abs(world.player.body.velocity.x) < 1, label + ' vx 0 after keyup');
            assert(Math.abs(world.player.body.velocity.y) < 1, label + ' vy 0 after keyup');
            var x = world.player.x;
            var y = world.player.y;
            return H.sleep(80).then(function () {
                assert(Math.abs(world.player.x - x) < 2, label + ' x stopped after keyup');
                assert(Math.abs(world.player.y - y) < 2, label + ' y stopped after keyup');
            });
        });
    };

    resetSpawn();
    assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
    assert(!world.cursors, 'WorldScene has no Phaser cursors');

    H.key(win, 'KeyA', 'a', 'keydown');
    H.key(win, 'KeyD', 'd', 'keydown');
    var flags = world.moveFlags();
    assert(flags.left && flags.right, 'A and D both down');

    return H.samplePlayer(win, 200).then(function (samples) {
        assertNoJitter(samples, 'vx', 'vy', 'y', spawn.y, 'A+D');
        assert(Math.abs(world.player.x - spawn.x) < 10, 'A+D cancel so x stays near spawn');
        H.key(win, 'KeyA', 'a', 'keyup');
        H.key(win, 'KeyD', 'd', 'keyup');
        assert(!win.Keys.left() && !win.Keys.right(), 'A and D released');
        return assertStopped('A+D');
    }).then(function () {
        resetSpawn();
        H.key(win, 'KeyW', 'w', 'keydown');
        H.key(win, 'KeyS', 's', 'keydown');
        flags = world.moveFlags();
        assert(flags.up && flags.down, 'W and S both down');
        return H.samplePlayer(win, 200);
    }).then(function (samples) {
        assertNoJitter(samples, 'vy', 'vx', 'x', spawn.x, 'W+S');
        assert(Math.abs(world.player.y - spawn.y) < 10, 'W+S cancel so y stays near spawn');
        H.key(win, 'KeyW', 'w', 'keyup');
        H.key(win, 'KeyS', 's', 'keyup');
        return assertStopped('W+S');
    }).then(function () {
        resetSpawn();
        H.key(win, 'ArrowLeft', 'ArrowLeft', 'keydown');
        H.key(win, 'ArrowRight', 'ArrowRight', 'keydown');
        flags = world.moveFlags();
        assert(flags.left && flags.right, 'ArrowLeft and ArrowRight both down');
        return H.samplePlayer(win, 200);
    }).then(function (samples) {
        assertNoJitter(samples, 'vx', 'vy', 'y', spawn.y, 'arrows L+R');
        assert(Math.abs(world.player.x - spawn.x) < 10, 'arrow opposites cancel');
        H.key(win, 'ArrowLeft', 'ArrowLeft', 'keyup');
        H.key(win, 'ArrowRight', 'ArrowRight', 'keyup');
        return assertStopped('arrows L+R');
    }).then(function () {
        resetSpawn();
        H.key(win, 'KeyA', 'a', 'keydown');
        H.key(win, 'KeyD', 'd', 'keydown');
        return H.sleep(80).then(function () {
            var xBoth = world.player.x;
            H.key(win, 'KeyD', 'd', 'keyup');
            assert(win.Keys.left() && !win.Keys.right(), 'A still down after D up');
            return H.sleep(250).then(function () {
                assert(world.player.x < xBoth - 8, 'after D up, remaining A walks west, x=' + world.player.x);
                H.key(win, 'KeyA', 'a', 'keyup');
                return assertStopped('A remaining');
            });
        });
    }).then(function () {
        assert(!win.game.input.keyboard, 'Phaser keyboard still off after opposite-key test');
        H.clearKeys(win);
    });
});

EmberwoodTests.add('movement: diagonal W+D and arrows stay at 90px speed', function (win, H) {
    var world = H.world(win);
    H.setAutoAttack(win, false);
    H.enterZone(win, 'haven');
    var spawn = win.defaultWorldSpawn();
    var SPEED = 90;
    var AXIS = SPEED / Math.sqrt(2);

    var resetSpawn = function () {
        world.placePlayer(spawn.x, spawn.y);
        world.walkTarget = null;
        world.engageTarget = null;
        world.talkTarget = null;
        H.clearKeys(win);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), spawn.x, 'courtyard spawn x');
        assertEqual(Math.round(world.player.y), spawn.y, 'courtyard spawn y');
    };

    var assertNormSpeed = function (samples, vxSign, vySign, label) {
        var seen = 0;
        var i;
        for (i = 1; i < samples.length; i++) {
            var sample = samples[i];
            var mag = Math.sqrt(sample.vx * sample.vx + sample.vy * sample.vy);
            if (mag < 1) {
                continue;
            }
            seen += 1;
            assert(Math.abs(mag - SPEED) < 3, label + ' speed ≈90 not √2-boosted (got ' + mag.toFixed(2) + ')');
            assert(Math.abs(Math.abs(sample.vx) - AXIS) < 3, label + ' |vx| ≈63.64 (got ' + sample.vx.toFixed(2) + ')');
            assert(Math.abs(Math.abs(sample.vy) - AXIS) < 3, label + ' |vy| ≈63.64 (got ' + sample.vy.toFixed(2) + ')');
            assert(Math.sign(sample.vx) === vxSign, label + ' vx sign');
            assert(Math.sign(sample.vy) === vySign, label + ' vy sign');
        }
        assert(seen >= 3, label + ' had moving samples');
    };

    resetSpawn();
    assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
    assert(!world.cursors, 'WorldScene has no Phaser cursors');

    H.key(win, 'KeyW', 'w', 'keydown');
    H.key(win, 'KeyD', 'd', 'keydown');
    var flags = world.moveFlags();
    assert(flags.up && flags.right && !flags.left && !flags.down, 'W+D moveFlags');

    return H.samplePlayer(win, 250).then(function (samples) {
        assertNormSpeed(samples, 1, -1, 'W+D');
        var first = samples[0];
        var last = samples[samples.length - 1];
        assert(last.x >= first.x - 1, 'W+D does not walk west, x=' + last.x);
        assert(last.y <= first.y + 1, 'W+D does not walk south, y=' + last.y);
        H.key(win, 'KeyW', 'w', 'keyup');
        H.key(win, 'KeyD', 'd', 'keyup');
        H.clearKeys(win);
    }).then(function () {
        resetSpawn();
        H.key(win, 'ArrowUp', 'ArrowUp', 'keydown');
        H.key(win, 'ArrowRight', 'ArrowRight', 'keydown');
        flags = world.moveFlags();
        assert(flags.up && flags.right && !flags.left && !flags.down, 'ArrowUp+ArrowRight moveFlags');
        return H.samplePlayer(win, 250);
    }).then(function (samples) {
        assertNormSpeed(samples, 1, -1, 'arrows U+R');
        var first = samples[0];
        var last = samples[samples.length - 1];
        assert(last.x >= first.x - 1, 'arrows U+R do not walk west, x=' + last.x);
        assert(last.y <= first.y + 1, 'arrows U+R do not walk south, y=' + last.y);
        H.key(win, 'ArrowUp', 'ArrowUp', 'keyup');
        H.key(win, 'ArrowRight', 'ArrowRight', 'keyup');
        H.clearKeys(win);
        assert(!win.game.input.keyboard, 'Phaser keyboard still off after diagonal test');
    });
});

EmberwoodTests.add('movement: Keys.typing ignores chat input so west does not walk', function (win, H) {
    function typeWest() {
        ['w', 'e', 's', 't'].forEach(function (letter) {
            var code = 'Key' + letter.toUpperCase();
            H.dispatchKey(win, code, letter, 'keydown');
            H.dispatchKey(win, code, letter, 'keyup');
        });
    }

    function assertTypingIgnores(el, label) {
        el.focus();
        assertEqual(win.document.activeElement, el, label + ' can take focus');
        assert(win.Keys.typing(), label + ' Keys.typing via activeElement');
        assert(win.Keys.typing({ target: el }), label + ' Keys.typing via event.target');
        H.clearKeys(win);
        typeWest();
        assert(!win.Keys.isDown('KeyW'), label + ' does not record KeyW');
        assert(!win.Keys.isDown('KeyS'), label + ' does not record KeyS');
        assert(!win.Keys.moving(), label + ' Keys.moving stays false');
    }

    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        H.setAutoAttack(win, false);
        H.enterZone(win, 'haven');
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.walkTarget = null;
        world.engageTarget = null;
        world.talkTarget = null;
        H.clearKeys(win);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'courtyard spawn x');
        assertEqual(Math.round(world.player.y), 248, 'courtyard spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(!world.cursors, 'WorldScene has no Phaser cursors');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assertEqual(typeof win.Keys.typing, 'function', 'Keys.typing exists');
        assert(!win.Keys.typing({ target: win.document.body }), 'body is not typing');

        var chat = H.mountTypingField(win, 'input');
        assertTypingIgnores(chat, 'chat input');
        return H.sleep(400).then(function () {
            assertEqual(Math.round(world.player.x), 328, 'typing west does not walk x');
            assertEqual(Math.round(world.player.y), 248, 'typing west does not walk y');
            assert(Math.abs(world.player.body.velocity.x) < 1, 'vx 0 while chat focused');
            assert(Math.abs(world.player.body.velocity.y) < 1, 'vy 0 while chat focused');
            var flags = world.moveFlags();
            assert(!flags.up && !flags.left && !flags.right && !flags.down, 'moveFlags idle while typing west');

            var area = H.mountTypingField(win, 'textarea');
            assertTypingIgnores(area, 'textarea');
            var sel = H.mountTypingField(win, 'select');
            assertTypingIgnores(sel, 'select');
            var edit = H.mountTypingField(win, 'contenteditable');
            assert(edit.isContentEditable, 'contentEditable field');
            assertTypingIgnores(edit, 'contentEditable');

            H.removeTypingField(win, chat);
            H.removeTypingField(win, area);
            H.removeTypingField(win, sel);
            H.removeTypingField(win, edit);
            H.clearKeys(win);
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            assert(!win.Keys.typing(), 'no typing after fields removed');
            H.key(win, 'KeyW', 'w', 'keydown');
            assert(win.Keys.isDown('KeyW'), 'W records after chat blur');
            return H.sleep(200);
        }).then(function () {
            assert(world.player.y < spawn.y - 8, 'W still walks after chat input, y=' + world.player.y);
            H.key(win, 'KeyW', 'w', 'keyup');
            H.clearKeys(win);
            assert(!win.game.input.keyboard, 'Phaser keyboard still off after typing test');
        });
    });
});

EmberwoodTests.add('movement: window blur clears Keys so a held key cannot walk', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        H.setAutoAttack(win, false);
        H.enterZone(win, 'haven');
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.walkTarget = null;
        world.engageTarget = null;
        world.talkTarget = null;
        H.clearKeys(win);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'courtyard spawn x');
        assertEqual(Math.round(world.player.y), 248, 'courtyard spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(!world.cursors, 'WorldScene has no Phaser cursors');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');

        H.key(win, 'KeyW', 'w', 'keydown');
        assert(win.Keys.isDown('KeyW'), 'Keys.js recorded KeyW');
        assert(win.Keys.pressed.KeyW === true, 'KeyW is just-pressed');
        assert(win.Keys.up(), 'Keys.up is true for W');
        var flags = world.moveFlags();
        assert(flags.up && !flags.left && !flags.right && !flags.down, 'moveFlags up-only from Keys');

        return H.sleep(200).then(function () {
            assert(world.player.y < spawn.y - 8, 'W walks north before blur, y=' + world.player.y);
            assert(world.player.body.velocity.y < -10, 'north velocity before blur');
            var midY = world.player.y;
            var midX = world.player.x;
            win.dispatchEvent(new win.Event('blur'));
            assert(!win.Keys.isDown('KeyW'), 'blur clears Keys.down KeyW');
            assert(!win.Keys.pressed.KeyW, 'blur clears Keys.pressed KeyW');
            assertEqual(Object.keys(win.Keys.down).length, 0, 'Keys.down empty after blur');
            assertEqual(Object.keys(win.Keys.pressed).length, 0, 'Keys.pressed empty after blur');
            assert(!win.Keys.moving(), 'Keys.moving is false after blur');
            flags = world.moveFlags();
            assert(!flags.up && !flags.left && !flags.right && !flags.down, 'moveFlags all false after blur');
            return H.sleep(80).then(function () {
                assert(Math.abs(world.player.body.velocity.x) < 1, 'vx 0 after blur');
                assert(Math.abs(world.player.body.velocity.y) < 1, 'vy 0 after blur');
                var stopX = world.player.x;
                var stopY = world.player.y;
                return H.sleep(150).then(function () {
                    assert(Math.abs(world.player.x - stopX) < 2, 'x stopped after blur (no stuck walk)');
                    assert(Math.abs(world.player.y - stopY) < 2, 'y stopped after blur (no stuck walk)');
                    assert(stopY <= midY + 2, 'did not keep walking north after blur');
                    assert(Math.abs(world.player.x - midX) < 8, 'no sideways drift after blur');
                    H.key(win, 'KeyD', 'd', 'keydown');
                    assert(win.Keys.isDown('KeyD'), 'fresh KeyD after blur still records');
                    return H.sleep(200);
                }).then(function () {
                    assert(world.player.x > midX + 8, 'D still walks after blur once pressed again, x=' + world.player.x);
                    H.key(win, 'KeyD', 'd', 'keyup');
                    H.clearKeys(win);
                    assert(!win.game.input.keyboard, 'Phaser keyboard still off after blur');
                });
            });
        });
    });
});

EmberwoodTests.add('movement: idle stops on the last facing frame', function (win, H) {
    function frameName(sprite) {
        var frame = sprite && sprite.frame;
        if (!frame) {
            return '';
        }
        return String(frame.name);
    }

    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        H.setAutoAttack(win, false);
        H.enterZone(win, 'haven');
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.walkTarget = null;
        world.engageTarget = null;
        world.talkTarget = null;
        H.clearKeys(win);
        world.player.body.setVelocity(0, 0);
        world.lastFacing = 'down';
        world.update();
        assertEqual(Math.round(world.player.x), 328, 'courtyard spawn x');
        assertEqual(Math.round(world.player.y), 248, 'courtyard spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(!world.cursors, 'WorldScene has no Phaser cursors');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assertEqual(frameName(world.player), '0', 'spawn idle is down frame 0');
        assert(!world.player.anims.isPlaying, 'spawn idle is not playing a walk cycle');

        var dirs = [
            { code: 'KeyW', key: 'w', face: 'up', frame: '2', flip: false, axis: 'y', sign: -1 },
            { code: 'KeyA', key: 'a', face: 'left', frame: '1', flip: false, axis: 'x', sign: -1 },
            { code: 'KeyS', key: 's', face: 'down', frame: '0', flip: false, axis: 'y', sign: 1 },
            { code: 'KeyD', key: 'd', face: 'right', frame: '1', flip: true, axis: 'x', sign: 1 }
        ];

        var chain = Promise.resolve();
        dirs.forEach(function (dir) {
            chain = chain.then(function () {
                world.placePlayer(spawn.x, spawn.y);
                world.walkTarget = null;
                world.engageTarget = null;
                world.talkTarget = null;
                H.clearKeys(win);
                world.player.body.setVelocity(0, 0);
                H.key(win, dir.code, dir.key, 'keydown');
                assert(win.Keys.isDown(dir.code), 'Keys.js recorded ' + dir.code);
                return H.sleep(400).then(function () {
                    if (dir.axis === 'x') {
                        assert(dir.sign * (world.player.x - spawn.x) > 16, dir.code + ' walks');
                    } else {
                        assert(dir.sign * (world.player.y - spawn.y) > 16, dir.code + ' walks');
                    }
                    var walking = world.player.anims.currentAnim;
                    assert(walking && walking.key === dir.face, dir.face + ' walk animation');
                    H.key(win, dir.code, dir.key, 'keyup');
                    H.clearKeys(win);
                    world.update();
                    assertEqual(world.lastFacing, dir.face, 'lastFacing ' + dir.face);
                    assert(!world.player.anims.isPlaying, dir.face + ' idle stops the walk anim');
                    assertEqual(frameName(world.player), dir.frame, dir.face + ' idle uses standing frame ' + dir.frame);
                    assertEqual(world.player.flipX, dir.flip, dir.face + ' idle flipX');
                    var idleFrame = Number(frameName(world.player));
                    assert([0, 1, 2].indexOf(idleFrame) !== -1, dir.face + ' idle is not a mid-stride frame');
                    assert([6, 7, 8, 12, 13, 14].indexOf(idleFrame) === -1, dir.face + ' idle is not a walk-cycle frame');
                    world.placePlayer(spawn.x, spawn.y);
                    world.player.body.setVelocity(0, 0);
                });
            });
        });
        return chain.then(function () {
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
            assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
        });
    });
});

EmberwoodTests.add('movement: Space is not preventDefault on title or death overlays', function (win, H) {
    function spaceEvent() {
        return { code: 'Space', key: ' ', keyCode: 32 };
    }

    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        H.clearKeys(win);
        assertEqual(spawn.x, 328, 'spawn x tile center');
        assertEqual(spawn.y, 248, 'spawn y tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assertEqual(win.Hud.mode, 'world', 'world mode after play');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assert(win.Keys.shouldBlockBrowser(spaceEvent()), 'shouldBlockBrowser true in world');
        var worldEv = H.dispatchKey(win, 'Space', ' ');
        assert(worldEv.defaultPrevented, 'Space keydown is preventDefault in world');
        H.clearKeys(win);

        win.Hud.showTitle();
        assertEqual(win.Hud.mode, 'title', 'title overlay mode');
        assert(!win.document.getElementById('title-overlay').hidden, 'title overlay visible');
        assert(!win.Keys.shouldBlockBrowser(spaceEvent()), 'shouldBlockBrowser false on title');
        assert(!win.Keys.shouldBlockBrowser({ code: 'ArrowUp' }), 'arrows not blocked on title');
        var titleEv = H.dispatchKey(win, 'Space', ' ');
        assert(!titleEv.defaultPrevented, 'Space keydown not preventDefault on title');
        H.clearKeys(win);
        win.Hud.hideTitle();
        assertEqual(win.Hud.mode, 'world', 'world restored after title');
        assert(win.document.getElementById('title-overlay').hidden, 'title overlay closed');

        win.Hud.showDead('The world goes dark.');
        assertEqual(win.Hud.mode, 'dead', 'dead mode');
        assert(!win.document.getElementById('dead-overlay').hidden, 'death overlay visible');
        assert(!win.Keys.shouldBlockBrowser(spaceEvent()), 'shouldBlockBrowser false on death');
        assert(!win.Keys.shouldBlockBrowser({ code: 'ArrowLeft' }), 'arrows not blocked on death');
        var deadEv = H.dispatchKey(win, 'Space', ' ');
        assert(!deadEv.defaultPrevented, 'Space keydown not preventDefault on death');
        H.clearKeys(win);
        win.Hud.hideDead();
        win.Hud.mode = 'world';
        assert(win.document.getElementById('dead-overlay').hidden, 'death overlay closed');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('movement: click-to-walk sets a destination', function (win, H) {
    var world = H.world(win);
    H.setAutoAttack(win, false);
    H.enterZone(win, 'haven');
    var spawn = win.defaultWorldSpawn();
    world.placePlayer(spawn.x, spawn.y);
    world.onClick({ worldX: 200, worldY: 180 });
    assert(world.walkTarget, 'walk target set');
    assertEqual(Math.round(world.walkTarget.x), 200, 'walk x');
    assert(world.marker.visible, 'walk marker visible');
    assert(world.walkPath && world.walkPath.length, 'path waypoints set');
    assert(world.pathGfx && world.pathGfx.visible, 'purple path visible');
    if (world.clearWalk) {
        world.clearWalk();
    } else {
        world.walkTarget = null;
        world.marker.setVisible(false);
    }
});

EmberwoodTests.add('movement: right-click Walk here on the ground shows a context menu', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        world.engageTarget = null;
        world.talkTarget = null;
        if (world.clearWalk) {
            world.clearWalk();
        }
        if (win.Hud.hideContextMenu) {
            win.Hud.hideContextMenu();
        }
        assertEqual(spawn.x, 328, 'spawn x tile center');
        assertEqual(spawn.y, 248, 'spawn y tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assertEqual(win.Hud.mode, 'world', 'world mode');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(!world.cursors, 'WorldScene has no Phaser cursors');

        var destX = spawn.x - 64;
        var destY = spawn.y;
        world.onClick({ worldX: destX, worldY: destY });
        assert(world.walkTarget, 'left-click still sets walkTarget');
        assertEqual(Math.round(world.walkTarget.x), destX, 'left-click walk x');
        assertEqual(Math.round(world.walkTarget.y), destY, 'left-click walk y');
        assert(world.marker.visible, 'left-click yellow marker');
        assert(world.walkPath && world.walkPath.length, 'left-click A* path');
        assert(world.pathGfx && world.pathGfx.visible, 'left-click purple line');
        world.clearWalk();

        var menu = win.document.getElementById('ctx-menu');
        assert(menu, 'ctx-menu element exists');
        assert(menu.hidden, 'menu starts hidden');
        var right = {
            worldX: destX,
            worldY: destY,
            button: 2,
            rightButtonDown: function () { return true; },
            event: { clientX: 48, clientY: 56 }
        };
        world.onClick(right);
        assert(!world.walkTarget, 'right-click does not walk immediately');
        assert(!world.marker.visible, 'right-click does not show marker yet');
        assert(!menu.hidden, 'right-click opens context menu');
        var walkBtn = menu.querySelector('[data-ctx="walk-here"]');
        assert(walkBtn, 'Walk here action is listed');
        assertEqual(walkBtn.textContent, 'Walk here', 'Walk here label');
        assertEqual(Math.round(win.Hud.ctxTarget.worldX), destX, 'menu stores ground x');
        assertEqual(Math.round(win.Hud.ctxTarget.worldY), destY, 'menu stores ground y');

        H.mouseClick(win, walkBtn);
        assert(menu.hidden, 'Walk here closes the menu');
        assert(world.walkTarget, 'Walk here sets walkTarget');
        assertEqual(Math.round(world.walkTarget.x), destX, 'Walk here walk x');
        assertEqual(Math.round(world.walkTarget.y), destY, 'Walk here walk y');
        assert(world.marker.visible, 'Walk here yellow marker');
        assert(world.walkPath && world.walkPath.length, 'Walk here A* path');
        assert(world.pathGfx && world.pathGfx.visible, 'Walk here purple line');

        world.clearWalk();
        world.encounterLock = true;
        world.onClick(right);
        assert(menu.hidden, 'encounterLock ignores right-click menu');
        assert(!world.walkTarget, 'encounterLock does not walk from menu');
        world.encounterLock = false;
        win.Hud.mode = 'battle';
        world.onClick(right);
        assert(menu.hidden, 'battle mode ignores right-click menu');
        win.Hud.mode = 'world';
        world.clearWalk();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('movement: click-to-walk after HUD click when canvas is unfocused', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        world.engageTarget = null;
        world.talkTarget = null;
        if (world.clearWalk) {
            world.clearWalk();
        }
        assertEqual(spawn.x, 328, 'spawn x tile center');
        assertEqual(spawn.y, 248, 'spawn y tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assertEqual(win.Hud.mode, 'world', 'world mode');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(!world.cursors, 'WorldScene has no Phaser cursors');

        var canvas = win.game.canvas;
        var invBtn = win.document.querySelector('#tab-bar button[data-tab="inv"]');
        assert(invBtn, 'Inv tab button exists');
        invBtn.focus();
        assertEqual(win.document.activeElement, invBtn, 'Inv tab takes focus before click');
        H.mouseClick(win, invBtn);
        assert(H.panelVisible(win, 'inv'), 'Inv panel visible after HUD click');
        assertEqual(win.Hud.tab, 'inv', 'hud.tab inv');
        assert(win.document.activeElement !== invBtn, 'Inv tab blurred after mouseup');
        assert(win.document.activeElement !== canvas, 'canvas is not focused after HUD click');
        assert(world.input && world.input.enabled !== false, 'world pointer input still enabled');

        var destX = spawn.x - 64;
        var destY = spawn.y;
        H.clickWorld(win, destX, destY);
        assert(world.walkTarget, 'unfocused canvas still sets walkTarget');
        assertEqual(Math.round(world.walkTarget.x), destX, 'walk x is the click');
        assertEqual(Math.round(world.walkTarget.y), destY, 'walk y is the click');
        assert(world.marker.visible, 'yellow marker after HUD-then-world click');
        assert(world.walkPath && world.walkPath.length, 'A* path after HUD-then-world click');
        assert(world.pathGfx && world.pathGfx.visible, 'purple line after HUD-then-world click');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off after world click');

        var startX = world.player.x;
        return H.sleep(400).then(function () {
            assert(world.player.x < startX - 12, 'walks west after HUD-then-world click, x=' + world.player.x);
            assert(world.walkTarget, 'still pathing after HUD click');
            assert(world.pathGfx.visible, 'purple line stays while walking');
            world.clearWalk();
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
            assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        });
    });
});

EmberwoodTests.add('world: camera follows player with lerp 0.12 and map bounds', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        assertEqual(spawn.x, 328, 'spawn x tile center');
        assertEqual(spawn.y, 248, 'spawn y tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(win.game.config.roundPixels, true, 'game config roundPixels');

        function assertCam(label) {
            var map = world.map;
            var cam = world.cameras.main;
            var tile = typeof win.TILE_SIZE === 'number' ? win.TILE_SIZE : 16;
            var wantW = (typeof win.MAP_W === 'number' ? win.MAP_W : 36) * tile;
            var wantH = (typeof win.MAP_H === 'number' ? win.MAP_H : 28) * tile;
            assert(cam, label + ' has main camera');
            assert(cam._follow === world.player, label + ' startFollow target is the player');
            assertEqual(cam.lerp.x, 0.12, label + ' lerp x 0.12');
            assertEqual(cam.lerp.y, 0.12, label + ' lerp y 0.12');
            assertEqual(cam.roundPixels, true, label + ' camera roundPixels');
            assertEqual(cam.useBounds, true, label + ' camera uses bounds');
            assertEqual(map.width, 36, label + ' map width tiles');
            assertEqual(map.height, 28, label + ' map height tiles');
            assertEqual(map.widthInPixels, wantW, label + ' map width px');
            assertEqual(map.heightInPixels, wantH, label + ' map height px');
            assertEqual(cam.getBounds().x, 0, label + ' bounds x');
            assertEqual(cam.getBounds().y, 0, label + ' bounds y');
            assertEqual(cam.getBounds().width, map.widthInPixels, label + ' bounds width = tilemap');
            assertEqual(cam.getBounds().height, map.heightInPixels, label + ' bounds height = tilemap');
        }

        assertCam('Emberhaven');
        H.enterZone(win, 'northwood');
        world = H.world(win);
        assertEqual(world.zoneId, 'northwood', 'entered Northwood');
        assertCam('Northwood');
        H.enterZone(win, 'haven');
        world = H.world(win);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        H.clearKeys(win);
        H.key(win, 'KeyW', 'w', 'keydown');
        var midY0 = world.cameras.main.midPoint.y;
        return H.sleep(400).then(function () {
            var midY1 = world.cameras.main.midPoint.y;
            assert(world.player.y < 248 - 12, 'W from spawn walks north, y=' + world.player.y);
            assert(midY1 < midY0 - 4, 'camera midY follows north ' + midY0 + ' → ' + midY1);
            assert(world.cameras.main._follow === world.player, 'still following after walk');
            H.key(win, 'KeyW', 'w', 'keyup');
            H.clearKeys(win);
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        });
    });
});

EmberwoodTests.add('movement: world clicks ignored during lock, battle, or title', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        var chicken = H.findMob(win, 'Chicken');
        var bram = H.findNpc(win, 'guild');
        assert(chicken, 'chicken exists in haven');
        assert(bram, 'Bram exists in haven');
        assertEqual(spawn.x, 328, 'spawn x tile center');
        assertEqual(spawn.y, 248, 'spawn y tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        world.engageTarget = null;
        world.talkTarget = null;
        if (world.clearWalk) {
            world.clearWalk();
        }

        var destX = spawn.x - 64;
        var destY = spawn.y;
        world.onClick({ worldX: destX, worldY: destY });
        assert(world.walkTarget, 'unlocked world click sets walkTarget');
        assert(world.marker.visible, 'yellow marker on unlocked click');
        assert(world.pathGfx && world.pathGfx.visible, 'purple line on unlocked click');
        world.clearWalk();

        world.encounterLock = true;
        world.onClick({ worldX: destX, worldY: destY });
        assert(!world.walkTarget, 'encounterLock ignores ground click');
        assert(!world.marker.visible, 'no marker under lock');
        assert(!world.pathGfx.visible, 'no purple line under lock');
        world.onClick({ worldX: chicken.x, worldY: chicken.y });
        assert(!world.engageTarget, 'encounterLock ignores mob click');
        world.onClick({ worldX: bram.x, worldY: bram.y });
        assert(!world.talkTarget, 'encounterLock ignores NPC click');
        world.encounterLock = false;

        win.Hud.mode = 'battle';
        world.onClick({ worldX: destX, worldY: destY });
        assert(!world.walkTarget, 'battle mode ignores ground click');
        assert(!world.marker.visible, 'no marker in battle');
        world.onClick({ worldX: chicken.x, worldY: chicken.y });
        assert(!world.engageTarget, 'battle mode ignores mob click');
        win.Hud.mode = 'world';

        win.Hud.showTitle();
        assertEqual(win.Hud.mode, 'title', 'title overlay');
        assert(!win.document.getElementById('title-overlay').hidden, 'title visible');
        world.onClick({ worldX: destX, worldY: destY });
        assert(!world.walkTarget, 'title ignores world click');
        assert(!world.marker.visible, 'no marker on title');
        world.onClick({ worldX: chicken.x, worldY: chicken.y });
        assert(!world.engageTarget, 'title ignores mob click');
        win.Hud.hideTitle();
        assertEqual(win.Hud.mode, 'world', 'back to world');

        world.encounterLock = false;
        world.onClick({ worldX: destX, worldY: destY });
        assert(world.walkTarget, 'click works again after unlock');
        assert(world.marker.visible, 'marker returns after unlock');
        world.clearWalk();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('world: nine lands match the 3x3 grid', function (win, H) {
    var world = H.world(win);
    H.setAutoAttack(win, false);
    H.enterZone(win, 'haven');
    var spawn = win.defaultWorldSpawn();
    world.placePlayer(spawn.x, spawn.y);
    assertEqual(spawn.x, 328, 'spawn x tile center');
    assertEqual(spawn.y, 248, 'spawn y tile center');
    assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
    assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
    assertEqual(world.zoneId, 'haven', 'start Emberhaven');
    assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
    assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

    var expected = [
        { id: 'graves', name: 'Restless Graves', gx: -1, gy: -1 },
        { id: 'northwood', name: 'Northwood', gx: 0, gy: -1 },
        { id: 'highlands', name: 'Windrock Highlands', gx: 1, gy: -1 },
        { id: 'westmead', name: 'Westmead', gx: -1, gy: 0 },
        { id: 'haven', name: 'Emberhaven', gx: 0, gy: 0 },
        { id: 'millfields', name: 'Millfields', gx: 1, gy: 0 },
        { id: 'darkmine', name: 'Darkmine', gx: -1, gy: 1 },
        { id: 'southshore', name: 'Southshore', gx: 0, gy: 1 },
        { id: 'mire', name: 'Mirefen', gx: 1, gy: 1 }
    ];
    assertEqual(win.ZONE_LIST.length, 9, 'nine lands');
    expected.forEach(function (want) {
        var zone = win.ZONES[want.id];
        assert(zone, 'ZONES has ' + want.id);
        assertEqual(zone.name, want.name, want.id + ' name');
        assertEqual(zone.gx, want.gx, want.id + ' gx');
        assertEqual(zone.gy, want.gy, want.id + ' gy');
        var byGrid = win.zoneByGrid(want.gx, want.gy);
        assert(byGrid, 'zoneByGrid ' + want.gx + ',' + want.gy);
        assertEqual(byGrid.id, want.id, 'grid cell ' + want.gx + ',' + want.gy);
    });
    assertEqual(win.zoneByGrid(-2, 0), null, 'no wrap west');
    assertEqual(win.zoneByGrid(2, 0), null, 'no wrap east');
    assertEqual(win.zoneByGrid(0, -2), null, 'no wrap north');
    assertEqual(win.zoneByGrid(0, 2), null, 'no wrap south');

    var cells = win.document.querySelectorAll('#minimap .mm-cell');
    assertEqual(cells.length, 9, 'minimap 3x3');
    var order = ['graves', 'northwood', 'highlands', 'westmead', 'haven', 'millfields', 'darkmine', 'southshore', 'mire'];
    for (var i = 0; i < order.length; i++) {
        assertEqual(cells[i].dataset.zone, order[i], 'minimap cell ' + i);
    }

    expected.forEach(function (want) {
        H.enterZone(win, want.id);
        world = H.world(win);
        assertEqual(world.zoneId, want.id, 'enter ' + want.id);
        assertEqual(win.document.getElementById('hud-zone').textContent, want.name, want.id + ' HUD title');
        var here = win.document.querySelector('#minimap .mm-cell.is-here');
        assert(here, want.id + ' minimap highlight');
        assertEqual(here.dataset.zone, want.id, want.id + ' is-here');
    });

    H.enterZone(win, 'haven');
    world.placePlayer(spawn.x, spawn.y);
    assertEqual(H.world(win).zoneId, 'haven', 'return Emberhaven');
});

EmberwoodTests.add('world: every zone spawns its NPCs and mobs', function (win, H) {
    var missing = [];
    win.ZONE_LIST.forEach(function (zone) {
        H.enterZone(win, zone.id);
        var npcNames = H.world(win).npcs.getChildren().map(function (npc) {
            return npc.npcDef.name;
        }).sort();
        var expectedNpcs = (win.NPC_DEFS[zone.id] || []).map(function (def) { return def.name; }).sort();
        if (npcNames.join('|') !== expectedNpcs.join('|')) {
            missing.push(zone.id + ' npcs got ' + npcNames.join(',') + ' expected ' + expectedNpcs.join(','));
        }
        var mobTypes = H.livingMobs(win).map(function (mob) { return mob.mobDef.type; }).sort();
        var expectedMobs = (win.MOB_DEFS[zone.id] || []).map(function (def) { return def.type; }).sort();
        if (mobTypes.join('|') !== expectedMobs.join('|')) {
            missing.push(zone.id + ' mobs got ' + mobTypes.join(',') + ' expected ' + expectedMobs.join(','));
        }
        var mm = win.document.querySelector('#minimap .mm-cell.is-here');
        if (!mm || mm.dataset.zone !== zone.id) {
            missing.push(zone.id + ' minimap');
        }
        if (win.document.getElementById('hud-zone').textContent !== zone.name) {
            missing.push(zone.id + ' heading ' + win.document.getElementById('hud-zone').textContent);
        }
    });
    H.enterZone(win, 'haven');
    assert(missing.length === 0, missing.join(' | '));
});

EmberwoodTests.add('npcs: talk to every named character', function (win, H) {
    var talks = [];
    win.ZONE_LIST.forEach(function (zone) {
        H.enterZone(win, zone.id);
        (win.NPC_DEFS[zone.id] || []).forEach(function (def) {
            if (def.key === 'guild' || def.key === 'banker' || def.key === 'witch') {
                return;
            }
            var npc = H.findNpc(win, def.key);
            assert(npc, 'missing npc ' + def.key + ' in ' + zone.id);
            H.world(win).player.setPosition(npc.x, npc.y);
            H.world(win).tryTalk(npc);
            assert(H.chatHas(win, def.name + ':'), 'dialogue from ' + def.name);
            talks.push(def.name);
        });
    });
    H.enterZone(win, 'haven');
    assert(talks.length >= 8, 'talked to flavor NPCs, got ' + talks.length);
});

EmberwoodTests.add('npcs: Space talks when standing next to someone', function (win, H) {
    H.enterZone(win, 'haven');
    H.setAutoAttack(win, false);
    H.clearKeys(win);
    var world = H.world(win);
    var rowan = H.findNpc(win, 'guard');
    var bram = H.findNpc(win, 'guild');
    assert(rowan && bram, 'haven NPCs spawned');
    world.scene.pause();
    try {
        world.player.setPosition(rowan.x + 27, rowan.y);
        world.player.body.setVelocity(0, 0);
        var lastBefore = H.lastChat(win);
        H.key(win, 'Space', ' ', 'keydown');
        assert(win.Keys.pressed.Space === true, 'Space is just-pressed via Keys.js');
        world.update();
        assert(H.lastChat(win) !== lastBefore, 'Space adds a new chat line at 27px');
        assert(H.lastChat(win).indexOf('Guard Rowan:') === 0, 'Space talks to Rowan within 28px');
        H.key(win, 'Space', ' ', 'keyup');
        H.clearKeys(win);

        lastBefore = H.lastChat(win);
        world.update();
        assertEqual(H.lastChat(win), lastBefore, 'Space talks only on justPressed');

        world.player.setPosition(rowan.x + 28, rowan.y);
        lastBefore = H.lastChat(win);
        H.key(win, 'Space', ' ', 'keydown');
        world.update();
        assertEqual(H.lastChat(win), lastBefore, 'Space does not talk at exactly 28px');
        H.key(win, 'Space', ' ', 'keyup');
        H.clearKeys(win);

        world.player.setPosition(rowan.x + 29, rowan.y);
        lastBefore = H.lastChat(win);
        H.key(win, 'Space', ' ', 'keydown');
        world.update();
        assertEqual(H.lastChat(win), lastBefore, 'Space does not talk at 29px');
        H.key(win, 'Space', ' ', 'keyup');
        H.clearKeys(win);

        win.game.registry.set('quest', { id: 'goblins', stage: 1, progress: 2, goal: 5 });
        world.player.setPosition(228, 156);
        var dRowan = win.Phaser.Math.Distance.Between(world.player.x, world.player.y, rowan.x, rowan.y);
        var dBram = win.Phaser.Math.Distance.Between(world.player.x, world.player.y, bram.x, bram.y);
        assert(dRowan < 28 && dBram < 28 && dBram < dRowan, 'fixture: both in range, Bram nearer');
        lastBefore = H.lastChat(win);
        H.key(win, 'Space', ' ', 'keydown');
        world.update();
        assert(H.lastChat(win) !== lastBefore, 'Space talks when two NPCs are in range');
        assert(H.lastChat(win).indexOf('Guildmaster Bram:') === 0, 'Space picks the nearest NPC');
        assert(H.lastChat(win).indexOf('2 of 5 goblins') !== -1, 'nearest talk is Bram, not Rowan');
        assert(win.game.input.keyboard === false || win.game.input.keyboard === null, 'Phaser keyboard stays off');
    } finally {
        H.clearKeys(win);
        world.scene.resume();
    }
});

EmberwoodTests.add('npcs: click an NPC to target them for a talk', function (win, H) {
    H.enterZone(win, 'haven');
    H.setAutoAttack(win, false);
    H.clearKeys(win);
    win.game.registry.set('quest', { id: 'goblins', stage: 0, progress: 0, goal: 5 });
    var world = H.world(win);
    var bram = H.findNpc(win, 'guild');
    var chicken = H.findMob(win, 'Chicken');
    world.scene.pause();
    try {
        world.player.setPosition(bram.x + 48, bram.y);
        world.player.body.setVelocity(0, 0);
        world.engageTarget = chicken;
        world.talkTarget = null;
        world.walkTarget = null;
        world.onClick({ worldX: bram.x, worldY: bram.y });
        assert(world.talkTarget === bram, 'click targets Bram');
        assert(world.engageTarget === null, 'talk click clears mob target');
        assert(world.walkTarget, 'click walks in toward the NPC');
        assertEqual(Math.round(world.walkTarget.x), Math.round(bram.x), 'walk x is Bram');
        assertEqual(Math.round(world.walkTarget.y), Math.round(bram.y), 'walk y is Bram');

        var lastBefore = H.lastChat(win);
        world.player.setPosition(bram.x + 23, bram.y);
        world.update();
        assert(world.talkTarget === bram, 'still approaching at 23px');
        assertEqual(H.lastChat(win), lastBefore, 'tryTalk does not fire at 23px');
        assert(world.player.body.velocity.x < -10, 'walks west toward Bram');

        world.player.setPosition(bram.x + 21, bram.y);
        world.update();
        assert(world.talkTarget === null, 'tryTalk clears talkTarget within 22px');
        assert(H.lastChat(win) !== lastBefore, 'tryTalk adds a chat line within 22px');
        assert(H.chatHas(win, 'Guildmaster Bram:'), 'Bram speaks');
        assert(H.chatHas(win, 'Goblins plague Northwood'), 'stage-0 briefing from walk-in talk');
        assertEqual(H.quest(win).stage, 1, 'walk-in tryTalk accepted the militia task');
    } finally {
        world.scene.resume();
    }
});

EmberwoodTests.add('npcs: click NPC clears engageTarget and does not fight', function (win, H) {
    return H.cleanupBattle(win).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var bram = H.findNpc(win, 'guild');
        var chicken = H.findMob(win, 'Chicken');
        assert(bram && chicken, 'Bram and a chicken exist in Emberhaven');
        world.scene.pause();
        try {
            world.engageGrace = 0;
            world.encounterLock = false;
            world.player.setPosition(chicken.x - 20, chicken.y);
            world.player.body.setVelocity(0, 0);
            world.onClick({ worldX: chicken.x, worldY: chicken.y });
            assert(world.engageTarget === chicken, 'chicken is engaged first');
            assert(world.talkTarget === null, 'no talk target yet');
            assert(H.chatHas(win, 'You target the Chicken'), 'mob target chat');

            world.onClick({ worldX: bram.x, worldY: bram.y });
            assert(world.talkTarget === bram, 'click targets Bram');
            assert(world.engageTarget === null, 'NPC click clears engageTarget');
            assert(world.walkTarget, 'walks toward Bram');
            assertEqual(Math.round(world.walkTarget.x), Math.round(bram.x), 'walk x is Bram');
            assertEqual(Math.round(world.walkTarget.y), Math.round(bram.y), 'walk y is Bram');

            world.player.setPosition(chicken.x + 16, chicken.y);
            world.player.body.setVelocity(0, 0);
            var started = world.tryAutoEngage();
            assertEqual(started, false, 'tryAutoEngage does not start a fight');
            assertEqual(world.encounterLock, false, 'encounterLock stays off beside the old mob');
            assert(!win.game.scene.isActive('BattleScene'), 'BattleScene stays inactive');
            assertEqual(win.Hud.mode, 'world', 'HUD stays in world after NPC click');

            world.player.setPosition(bram.x + 16, bram.y);
            world.update();
            assert(world.talkTarget === null, 'tryTalk clears talkTarget');
            assert(H.chatHas(win, 'Guildmaster Bram:'), 'talks to Bram instead of fighting');
            assertEqual(world.encounterLock, false, 'talk does not lock combat');
            assert(!win.game.scene.isActive('BattleScene'), 'still no battle after talk');
        } finally {
            world.scene.resume();
        }
    });
});

EmberwoodTests.add('npcs: Bram stage 0 accepts militia quest and updates journal', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        var world = H.world(win);
        world.placePlayer(spawn.x, spawn.y);
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        win.game.registry.set('quest', { id: 'goblins', stage: 0, progress: 0, goal: 5 });
        world.refreshHud();
        assertEqual(H.quest(win).stage, 0, 'starts unaccepted');
        assertEqual(win.document.getElementById('hud-quest').textContent, 'Talk to Guildmaster Bram in Emberhaven.', 'side task before talk');
        assertEqual(win.document.getElementById('hud-quest-tab').textContent, 'Talk to Guildmaster Bram in Emberhaven.', 'journal before talk');
        var gold = H.hero(win).gold;
        var xp = H.hero(win).xp;
        var bram = H.findNpc(win, 'guild');
        assert(bram, 'Bram is in Emberhaven');
        world.tryTalk(bram);
        assertEqual(H.quest(win).stage, 1, 'stage 0 talk accepts the militia task');
        assertEqual(H.quest(win).progress, 0, 'progress starts at 0');
        assertEqual(H.hero(win).gold, gold, 'accept does not pay gold');
        assertEqual(H.hero(win).xp, xp, 'accept does not grant XP');
        assert(H.chatHas(win, 'Goblins plague Northwood'), 'briefing chat');
        assert(H.chatHas(win, 'Bring me 5 kills'), 'kill count in briefing');
        assertEqual(win.document.getElementById('hud-quest').textContent, 'Kill goblins in Northwood (0/5).', 'side HUD updates');
        assertEqual(win.document.getElementById('hud-quest-tab').textContent, 'Kill goblins in Northwood (0/5).', 'Quest tab journal updates');
    });
});

EmberwoodTests.add('npcs: Bram shows blue star then gold compass until militia is done', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        var world = H.world(win);
        var hero = win.makeHero();
        win.game.registry.set('hero', hero);
        win.game.registry.set('quest', { id: 'goblins', stage: 0, progress: 0, goal: 5 });
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.refreshHud();
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        var spec0 = win.questHeadIconFor({ questGiver: true }, { stage: 0 });
        var spec1 = win.questHeadIconFor({ questGiver: true }, { stage: 1 });
        var spec2 = win.questHeadIconFor({ questGiver: true }, { stage: 2 });
        var spec3 = win.questHeadIconFor({ questGiver: true }, { stage: 3 });
        var specRowan = win.questHeadIconFor({ key: 'guard' }, { stage: 0 });
        assert(spec0 && spec0.kind === 'star', 'stage 0 helper is a blue star');
        assertEqual(spec0.color, win.QUEST_HEAD_STAR, 'star fill is blue');
        assert(spec1 && spec1.kind === 'compass', 'stage 1 helper is a gold compass');
        assertEqual(spec1.color, win.QUEST_HEAD_COMPASS, 'compass fill is gold');
        assert(spec2 && spec2.kind === 'compass', 'stage 2 helper stays a gold compass');
        assertEqual(spec3, null, 'stage 3 helper hides the icon');
        assertEqual(specRowan, null, 'non-quest NPCs have no head icon');

        var bram = H.findNpc(win, 'guild');
        var rowan = H.findNpc(win, 'guard');
        assert(bram, 'Bram is in Emberhaven');
        assert(rowan, 'Rowan is in Emberhaven');
        assert(bram.npcDef.questGiver, 'Bram is marked as a quest-giver');
        assert(!rowan.npcDef.questGiver, 'Rowan is not a quest-giver');
        assert(bram.questIcon, 'Bram has a quest head icon');
        assert(!rowan.questIcon, 'Rowan has no quest head icon');
        assert(bram.questIcon.visible, 'stage 0 star is visible');
        assertEqual(bram.questIcon.kind, 'star', 'stage 0 icon is a star');
        assertEqual(bram.questIcon.iconColor, win.QUEST_HEAD_STAR, 'stage 0 icon is blue');
        assertEqual(Math.round(bram.questIcon.x), Math.round(bram.x), 'star sits over Bram x');
        assert(bram.questIcon.y < bram.nameLabel.y, 'star sits above the name label');
        assert(world.floatLabels.indexOf(bram.questIcon) !== -1, 'icon is tracked in floatLabels');

        var gold = H.hero(win).gold;
        world.tryTalk(bram);
        assertEqual(H.quest(win).stage, 1, 'stage 0 talk still accepts the militia task');
        assertEqual(H.hero(win).gold, gold, 'accept still does not pay');
        assertEqual(win.document.getElementById('hud-quest').textContent, 'Kill goblins in Northwood (0/5).', 'journal still updates on accept');
        assert(bram.questIcon.visible, 'in-progress compass is visible');
        assertEqual(bram.questIcon.kind, 'compass', 'accept swaps the star for a compass');
        assertEqual(bram.questIcon.iconColor, win.QUEST_HEAD_COMPASS, 'in-progress icon is gold');

        var quest = H.quest(win);
        quest.stage = 2;
        quest.progress = 5;
        win.game.registry.set('quest', quest);
        world.refreshHud();
        assertEqual(bram.questIcon.kind, 'compass', 'return-to-Bram still shows the gold compass');
        assert(bram.questIcon.visible, 'stage 2 compass stays visible');

        world.tryTalk(bram);
        assertEqual(H.quest(win).stage, 3, 'stage 2 talk still completes the militia task');
        assert(!bram.questIcon.visible, 'icon hides when the militia task is done');
        assertEqual(bram.questIcon.kind, null, 'completed icon has no kind');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('npcs: Bram stage 1 reports progress of 5 goblins and does not pay', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        var world = H.world(win);
        var hero = win.makeHero();
        win.game.registry.set('hero', hero);
        win.game.registry.set('quest', { id: 'goblins', stage: 1, progress: 0, goal: 5 });
        world.placePlayer(spawn.x, spawn.y);
        world.refreshHud();
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(H.hero(win).gold, 8, 'starter gold is 8');
        assertEqual(win.document.getElementById('hud-quest').textContent, 'Kill goblins in Northwood (0/5).', 'side HUD at 0/5');
        assertEqual(win.document.getElementById('hud-quest-tab').textContent, 'Kill goblins in Northwood (0/5).', 'journal at 0/5');
        var gold = H.hero(win).gold;
        var xp = H.hero(win).xp;
        var bram = H.findNpc(win, 'guild');
        assert(bram, 'Bram is in Emberhaven');

        world.tryTalk(bram);
        assertEqual(H.quest(win).stage, 1, 'stage 1 talk does not complete the quest');
        assertEqual(H.quest(win).progress, 0, 'progress stays 0');
        assertEqual(H.hero(win).gold, gold, '0/5 talk does not pay gold');
        assertEqual(H.hero(win).xp, xp, '0/5 talk does not grant XP');
        assertEqual(H.lastChat(win), 'Guildmaster Bram: 0 of 5 goblins down. Keep at it.', 'progress chatter at 0');
        assert(!H.chatHas(win, 'militia thanks you'), 'does not pay at 0/5');

        var quest = H.quest(win);
        quest.progress = 3;
        win.game.registry.set('quest', quest);
        world.refreshHud();
        world.tryTalk(bram);
        assertEqual(H.quest(win).stage, 1, '3/5 talk stays stage 1');
        assertEqual(H.quest(win).progress, 3, 'progress stays 3');
        assertEqual(H.hero(win).gold, gold, '3/5 talk does not pay gold');
        assertEqual(H.hero(win).xp, xp, '3/5 talk does not grant XP');
        assertEqual(H.lastChat(win), 'Guildmaster Bram: 3 of 5 goblins down. Keep at it.', 'progress chatter at 3');
        assert(!H.chatHas(win, 'militia thanks you'), 'does not pay at 3/5');
        assertEqual(win.document.getElementById('hud-quest').textContent, 'Kill goblins in Northwood (3/5).', 'side HUD still 3/5');
        assertEqual(win.document.getElementById('hud-quest-tab').textContent, 'Kill goblins in Northwood (3/5).', 'journal still 3/5');
    });
});

EmberwoodTests.add('npcs: Bram stage 2 pays 50 gold + 40 combat XP and levels if needed', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        var world = H.world(win);
        var hero = win.makeHero();
        win.game.registry.set('hero', hero);
        win.game.registry.set('quest', { id: 'goblins', stage: 2, progress: 5, goal: 5 });
        world.placePlayer(spawn.x, spawn.y);
        world.refreshHud();
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(H.hero(win).gold, 8, 'starter gold is 8');
        assertEqual(H.hero(win).xp, 0, 'starter combat XP is 0');
        assertEqual(H.hero(win).level, 3, 'starter OSRS combat level is 3');
        assertEqual(win.document.getElementById('hud-quest').textContent, 'Return to Guildmaster Bram for your reward.', 'side HUD at stage 2');
        assertEqual(win.document.getElementById('hud-quest-tab').textContent, 'Return to Guildmaster Bram for your reward.', 'journal at stage 2');
        var bram = H.findNpc(win, 'guild');
        assert(bram, 'Bram is in Emberhaven');

        world.tryTalk(bram);
        assertEqual(H.quest(win).stage, 3, 'stage 2 talk completes the quest');
        assertEqual(H.hero(win).gold, 58, 'pays 50 gold (8 + 50)');
        assertEqual(H.hero(win).xp, 40, 'grants 40 combat XP');
        assertEqual(H.hero(win).level, 3, 'Bram XP does not overwrite OSRS combat');
        assertEqual(H.hero(win).maxHp, 100, 'combat XP leaves maxHp as 10 * Hitpoints');
        assertEqual(H.hero(win).damage, 18, 'level-up damage is 14 + xp-rank * 2');
        assert(H.chatHas(win, 'militia thanks you'), 'reward speech');
        assert(H.chatHas(win, '50 gold and combat training'), 'reward names gold and training');
        assert(!H.chatHas(win, 'Your combat level is now'), 'Bram XP does not chat combat level');
        assertEqual(win.document.getElementById('hud-gold').textContent, '58', 'HUD gold after pay');
        assertEqual(win.document.getElementById('hud-xp').textContent, '40', 'HUD XP after pay');
        assertEqual(win.document.getElementById('hud-level').textContent, '3', 'HUD combat stays OSRS 3');
        assertEqual(win.document.getElementById('hud-quest').textContent, 'Militia task complete. Explore the nine lands.', 'side HUD after complete');
        assertEqual(win.document.getElementById('hud-quest-tab').textContent, 'Militia task complete. Explore the nine lands.', 'journal after complete');

        hero = win.makeHero();
        hero.skills.attack.level = 4;
        hero.skills.strength.level = 3;
        hero.level = win.combatLevel(hero);
        hero.xp = 0;
        hero.maxHp = 140;
        hero.hp = 140;
        hero.damage = 24;
        win.game.registry.set('hero', hero);
        win.game.registry.set('quest', { id: 'goblins', stage: 2, progress: 5, goal: 5 });
        world.refreshHud();
        world.tryTalk(bram);
        assertEqual(H.quest(win).stage, 3, 'already-leveled hero still completes');
        assertEqual(H.hero(win).gold, 58, 'still pays 50 gold');
        assertEqual(H.hero(win).xp, 40, 'still grants 40 combat XP');
        assertEqual(H.hero(win).level, 5, 'OSRS combat stays 5 when skills are unchanged');
        assertEqual(H.hero(win).maxHp, 140, 'maxHp unchanged when skills are unchanged');
        assertEqual(H.hero(win).damage, 24, 'damage unchanged when already above the XP rank');
        assertEqual(H.lastChat(win), 'Guildmaster Bram: The militia thanks you. 50 gold and combat training.', 'no extra level-up line when not needed');
        assertEqual(win.document.getElementById('hud-level').textContent, '5', 'HUD combat stays 5');
    });
});

EmberwoodTests.add('npcs: Bram stage 3+ uses the post-quest line only', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        var world = H.world(win);
        var hero = win.makeHero();
        win.game.registry.set('hero', hero);
        win.game.registry.set('quest', { id: 'goblins', stage: 3, progress: 5, goal: 5 });
        world.placePlayer(spawn.x, spawn.y);
        world.refreshHud();
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(H.hero(win).gold, 8, 'starter gold is 8');
        assertEqual(H.hero(win).xp, 0, 'starter combat XP is 0');
        assertEqual(win.document.getElementById('hud-quest').textContent, 'Militia task complete. Explore the nine lands.', 'side HUD at stage 3');
        assertEqual(win.document.getElementById('hud-quest-tab').textContent, 'Militia task complete. Explore the nine lands.', 'journal at stage 3');
        var gold = H.hero(win).gold;
        var xp = H.hero(win).xp;
        var level = H.hero(win).level;
        var bram = H.findNpc(win, 'guild');
        assert(bram, 'Bram is in Emberhaven');
        win.Hud.el.log.innerHTML = '';

        world.tryTalk(bram);
        assertEqual(H.quest(win).stage, 3, 'stage 3 talk does not change stage');
        assertEqual(H.quest(win).progress, 5, 'progress stays 5');
        assertEqual(H.hero(win).gold, gold, 'post-quest talk does not pay gold');
        assertEqual(H.hero(win).xp, xp, 'post-quest talk does not grant XP');
        assertEqual(H.hero(win).level, level, 'post-quest talk does not level');
        assertEqual(H.chat(win).length, 1, 'stage 3 talk adds exactly one chat line');
        assertEqual(H.lastChat(win), 'Guildmaster Bram: Emberhaven stands because of you.', 'post-quest line only');
        assert(!H.chatHas(win, 'militia thanks you'), 'does not replay the reward speech');
        assert(!H.chatHas(win, 'Goblins plague Northwood'), 'does not replay the briefing');
        assert(!H.chatHas(win, 'of 5 goblins'), 'does not replay progress chatter');
        assertEqual(win.document.getElementById('hud-quest').textContent, 'Militia task complete. Explore the nine lands.', 'side HUD stays complete');
        assertEqual(win.document.getElementById('hud-quest-tab').textContent, 'Militia task complete. Explore the nine lands.', 'journal stays complete');

        world.tryTalk(bram);
        assertEqual(H.chat(win).length, 2, 'repeat talk adds one more line');
        assertEqual(H.lastChat(win), 'Guildmaster Bram: Emberhaven stands because of you.', 'second stage-3 talk stays post-quest');
        assertEqual(H.quest(win).stage, 3, 'repeat talk does not change stage');
        assertEqual(H.hero(win).gold, gold, 'repeat talk does not pay gold');
        assertEqual(H.hero(win).xp, xp, 'repeat talk does not grant XP');

        win.game.registry.set('quest', { id: 'goblins', stage: 4, progress: 5, goal: 5 });
        world.refreshHud();
        world.tryTalk(bram);
        assertEqual(H.quest(win).stage, 4, 'stage 4 talk stays stage 4');
        assertEqual(H.hero(win).gold, gold, 'stage 4 talk does not pay gold');
        assertEqual(H.hero(win).xp, xp, 'stage 4 talk does not grant XP');
        assertEqual(H.chat(win).length, 3, 'stage 4 talk adds one more line');
        assertEqual(H.lastChat(win), 'Guildmaster Bram: Emberhaven stands because of you.', 'stage 4+ uses the same post-quest line');
        assertEqual(win.document.getElementById('hud-quest').textContent, 'Militia task complete. Explore the nine lands.', 'side HUD at stage 4+');
        assertEqual(win.document.getElementById('hud-quest-tab').textContent, 'Militia task complete. Explore the nine lands.', 'journal at stage 4+');
    });
});

EmberwoodTests.add('quests: side Task and Quest tab start as Talk to Guildmaster Bram', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        var world = H.world(win);
        var hero = win.makeHero();
        win.game.registry.set('hero', hero);
        win.game.registry.set('quest', { id: 'goblins', stage: 0, progress: 0, goal: 5 });
        world.placePlayer(spawn.x, spawn.y);
        world.refreshHud();
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(H.quest(win).stage, 0, 'new game quest is unaccepted');
        var startLine = 'Talk to Guildmaster Bram in Emberhaven.';
        assertEqual(win.document.getElementById('hud-quest').textContent, startLine, 'side Task starts as talk-to-Bram');
        assertEqual(win.document.getElementById('hud-quest-tab').textContent, startLine, 'Quest tab starts as talk-to-Bram');
        H.click(win, '#tab-bar button[data-tab="quest"]');
        assert(H.panelVisible(win, 'quest'), 'Quest tab panel is visible');
        assertEqual(win.document.getElementById('hud-quest-tab').textContent, startLine, 'open Quest tab still talks-to-Bram');
        assertEqual(win.document.getElementById('hud-quest').textContent, startLine, 'side Task stays talk-to-Bram while Quest is open');
    });
});

EmberwoodTests.add('quests: after accept HUD is Kill goblins in Northwood (N/5) and journal is 0/5', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        var world = H.world(win);
        var hero = win.makeHero();
        win.game.registry.set('hero', hero);
        win.game.registry.set('quest', { id: 'goblins', stage: 0, progress: 0, goal: 5 });
        world.placePlayer(spawn.x, spawn.y);
        world.refreshHud();
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(H.quest(win).stage, 0, 'starts unaccepted');
        var bram = H.findNpc(win, 'guild');
        assert(bram, 'Bram is in Emberhaven');
        world.tryTalk(bram);
        assertEqual(H.quest(win).stage, 1, 'accept moves to stage 1');
        assertEqual(H.quest(win).progress, 0, 'accept progress is 0');
        var afterAccept = 'Kill goblins in Northwood (0/5).';
        assertEqual(win.document.getElementById('hud-quest').textContent, afterAccept, 'side HUD is Kill goblins in Northwood (N/5) at 0');
        assertEqual(win.document.getElementById('hud-quest-tab').textContent, afterAccept, 'journal after accept is 0/5');
        assertMatch(win.document.getElementById('hud-quest-tab').textContent, '0/5', 'journal contains 0/5');
        H.click(win, '#tab-bar button[data-tab="quest"]');
        assert(H.panelVisible(win, 'quest'), 'Quest tab panel is visible');
        assertEqual(win.document.getElementById('hud-quest-tab').textContent, afterAccept, 'open Quest tab still 0/5');
        assertEqual(win.document.getElementById('hud-quest').textContent, afterAccept, 'side Task stays 0/5 while Quest is open');
        var quest = H.quest(win);
        quest.progress = 2;
        win.game.registry.set('quest', quest);
        world.refreshHud();
        assertEqual(win.document.getElementById('hud-quest').textContent, 'Kill goblins in Northwood (2/5).', 'N in (N/5) is quest.progress');
        assertEqual(win.document.getElementById('hud-quest-tab').textContent, 'Kill goblins in Northwood (2/5).', 'journal tracks N');
    });
});

EmberwoodTests.add('quests: fifth goblin sets stage 2 and chats to return to Bram', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.setAutoAttack(win, false);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        var world = H.world(win);
        var hero = win.makeHero();
        win.game.registry.set('hero', hero);
        win.game.registry.set('quest', { id: 'goblins', stage: 1, progress: 4, goal: 5 });
        H.enterZone(win, 'haven');
        world.placePlayer(spawn.x, spawn.y);
        world.refreshHud();
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(H.quest(win).stage, 1, 'starts one kill short of the goal');
        assertEqual(H.quest(win).progress, 4, 'progress is 4 of 5');
        assertEqual(win.document.getElementById('hud-quest').textContent, 'Kill goblins in Northwood (4/5).', 'side HUD at 4/5');
        assertEqual(win.document.getElementById('hud-quest-tab').textContent, 'Kill goblins in Northwood (4/5).', 'journal at 4/5');
        H.enterZone(win, 'northwood');
        var goblin = H.findMob(win, 'Goblin');
        assert(goblin, 'Northwood has a Goblin');
        goblin.mobDef.hp = 8;
        return H.startFight(win, goblin);
    }).then(function () {
        win.Hud.tryAttack();
        return H.waitWorld(win);
    }).then(function () {
        assertEqual(H.quest(win).progress, 5, 'fifth kill fills the goal');
        assertEqual(H.quest(win).stage, 2, 'fifth goblin sets stage 2');
        assertEqual(H.lastChat(win), 'That should be enough goblins. Return to Bram.', 'return-to-Bram chat');
        assertEqual(win.document.getElementById('hud-quest').textContent, 'Return to Guildmaster Bram for your reward.', 'side HUD after fifth');
        assertEqual(win.document.getElementById('hud-quest-tab').textContent, 'Return to Guildmaster Bram for your reward.', 'journal after fifth');
        H.enterZone(win, 'haven');
    }).catch(function (err) {
        return H.cleanupBattle(win).then(function () {
            throw err;
        });
    });
});

EmberwoodTests.add('npcs: Guildmaster Bram quest', function (win, H) {
    H.enterZone(win, 'haven');
    var bram = H.findNpc(win, 'guild');
    win.game.registry.set('quest', { id: 'goblins', stage: 0, progress: 0, goal: 5 });
    H.world(win).tryTalk(bram);
    assertEqual(H.quest(win).stage, 1, 'quest accepted');
    assert(H.chatHas(win, 'Goblins plague Northwood'), 'quest briefing');
    assertMatch(win.document.getElementById('hud-quest').textContent, 'Kill goblins', 'side quest text');
    assertMatch(win.document.getElementById('hud-quest-tab').textContent, '0/5', 'journal progress');

    H.world(win).tryTalk(bram);
    assert(H.chatHas(win, '0 of 5 goblins'), 'progress chatter');

    var quest = H.quest(win);
    quest.stage = 2;
    quest.progress = 5;
    win.game.registry.set('quest', quest);
    var gold = H.hero(win).gold;
    H.world(win).tryTalk(bram);
    assertEqual(H.quest(win).stage, 3, 'quest complete');
    assertEqual(H.hero(win).gold, gold + 50, 'quest gold reward');
    assert(H.chatHas(win, 'militia thanks you'), 'reward speech');
    H.world(win).tryTalk(bram);
    assert(H.chatHas(win, 'Emberhaven stands because of you'), 'post-quest line');
});

EmberwoodTests.add('economy: starting gold is 8 and militia quest pays +50', function (win, H) {
    H.enterZone(win, 'haven');
    var spawn = win.defaultWorldSpawn();
    assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
    assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
    var world = H.world(win);
    var hero = win.makeHero();
    win.game.registry.set('hero', hero);
    win.game.registry.set('quest', { id: 'goblins', stage: 0, progress: 0, goal: 5 });
    world.placePlayer(spawn.x, spawn.y);
    world.refreshHud();
    assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
    assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
    assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
    assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');

    hero = H.hero(win);
    assertEqual(hero.gold, 8, 'starter gold is 8');
    assertEqual(win.document.getElementById('hud-gold').textContent, '8', 'HUD gold is 8');
    var coinStack = hero.inventory.filter(function (stack) { return stack.id === 'coins'; })[0];
    assert(coinStack, 'starter coin stack');
    assertEqual(coinStack.qty, 8, 'coin stack qty is 8');
    H.click(win, '#tab-bar button[data-tab="inv"]');
    assertMatch(win.document.querySelector('#inv-grid [data-item="coins"]').textContent, '8', 'Inv coin badge is 8');

    var maxMobGold = 0;
    Object.keys(win.MOB_DEFS).forEach(function (zoneId) {
        win.MOB_DEFS[zoneId].forEach(function (mob) {
            if (mob.gold > maxMobGold) {
                maxMobGold = mob.gold;
            }
        });
    });
    assert(maxMobGold > 0, 'mobs drop some gold');
    assert(maxMobGold < 50, 'quest +50 is larger than any single mob drop (' + maxMobGold + ')');

    var bram = H.findNpc(win, 'guild');
    var elise = H.findNpc(win, 'banker');
    assert(bram && elise, 'Bram and Elise are in Emberhaven');
    world.tryTalk(bram);
    assertEqual(H.hero(win).gold, 8, 'accepting the quest does not pay');
    world.tryTalk(elise);
    assertEqual(H.hero(win).gold, 8, 'Elise heal is not income');

    var quest = H.quest(win);
    quest.stage = 2;
    quest.progress = 5;
    win.game.registry.set('quest', quest);
    world.tryTalk(bram);
    assertEqual(H.quest(win).stage, 3, 'quest complete');
    assertEqual(H.hero(win).gold, 58, '8 + 50 militia gold');
    assertEqual(win.document.getElementById('hud-gold').textContent, '58', 'HUD gold after reward');
    coinStack = H.hero(win).inventory.filter(function (stack) { return stack.id === 'coins'; })[0];
    assertEqual(coinStack.qty, 58, 'coin stack after reward');
    H.click(win, '#tab-bar button[data-tab="inv"]');
    assertMatch(win.document.querySelector('#inv-grid [data-item="coins"]').textContent, '58', 'Inv coin badge after reward');
    assert(H.chatHas(win, '50 gold'), 'reward speech names the 50 gold');
});

EmberwoodTests.add('npcs: Banker Elise heals for free', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        var world = H.world(win);
        var hero = win.makeHero();
        win.game.registry.set('hero', hero);
        world.placePlayer(spawn.x, spawn.y);
        world.refreshHud();
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        var elise = H.findNpc(win, 'banker');
        assert(elise, 'Elise is in Emberhaven');
        assertEqual(elise.npcDef.name, 'Banker Elise', 'banker name');
        assertEqual(Math.round(elise.x), 160, 'Elise courtyard x');
        assertEqual(Math.round(elise.y), 130, 'Elise courtyard y');
        assertEqual(H.hero(win).gold, 8, 'starter gold is 8');
        assertEqual(H.hero(win).hp, 100, 'starter HP is 100');
        assertEqual(H.hero(win).maxHp, 100, 'starter maxHp is 100');

        hero = H.hero(win);
        hero.hp = 40;
        win.game.registry.set('hero', hero);
        world.refreshHud();
        assertEqual(win.document.getElementById('hud-hp').textContent, '40 / 100', 'HUD wounded');
        win.Hud.el.log.innerHTML = '';
        var gold = H.hero(win).gold;
        var xp = H.hero(win).xp;
        world.tryTalk(elise);
        assertEqual(H.hero(win).hp, 40, 'tryTalk no longer auto-heals');
        assertEqual(H.lastChat(win), 'Banker Elise: Your coin is safe with me.', 'Talk is bank flavor');
        var overlay = win.document.getElementById('dialogue-overlay');
        H.click(win, overlay.querySelector('[data-dialogue-option="bank"]'));
        var bank = win.document.getElementById('bank-overlay');
        assert(bank && bank === win.Hud.el.bank, '#bank-overlay is Hud.el.bank');
        assert(win.Hud.bankOpen() && !bank.hidden, 'Bank option opens the overlay');
        assertEqual(win.Hud.mode, 'world', 'bank keeps Hud.mode world');
        H.click(win, bank.querySelector('[data-bank-action="heal"]'));
        assertEqual(H.hero(win).hp, 100, 'Heal option restores HP to max');
        assertEqual(H.hero(win).hp, H.hero(win).maxHp, 'HP equals maxHp');
        assertEqual(H.hero(win).gold, gold, 'heal costs 0 gold');
        assertEqual(H.hero(win).gold, 8, 'starter gold stays 8');
        assertEqual(H.hero(win).xp, xp, 'heal does not grant XP');
        assertEqual(H.lastChat(win), 'Banker Elise: Your wounds close. HP restored.', 'heal line');
        assertEqual(win.document.getElementById('hud-hp').textContent, '100 / 100', 'HUD HP after heal');
        assertEqual(win.document.getElementById('hud-gold').textContent, '8', 'HUD gold after heal');
        var fill = win.document.getElementById('hp-fill');
        assert(fill, 'HP fill bar exists');
        assertEqual(fill.style.width, '100%', 'HP bar full after heal');
        var coinStack = H.hero(win).inventory.filter(function (stack) { return stack.id === 'coins'; })[0];
        assertEqual(coinStack.qty, 8, 'coin stack stays 8');

        hero = H.hero(win);
        hero.hp = 22;
        hero.gold = 0;
        win.syncCoins(hero);
        win.game.registry.set('hero', hero);
        world.refreshHud();
        H.click(win, bank.querySelector('[data-bank-action="heal"]'));
        assertEqual(H.hero(win).hp, H.hero(win).maxHp, '0-gold hero still heals to max');
        assertEqual(H.hero(win).gold, 0, '0-gold heal still costs 0');
        assert(!H.chatHas(win, 'Come back with 10 gold'), 'banker never demands gold');
        assertEqual(win.document.getElementById('hud-gold').textContent, '0', 'HUD gold stays 0');

        gold = H.hero(win).gold;
        H.click(win, bank.querySelector('[data-bank-action="heal"]'));
        assertEqual(H.hero(win).hp, H.hero(win).maxHp, 'full HP stays at max');
        assertEqual(H.hero(win).gold, gold, 'full-HP heal costs 0');
        assertEqual(H.lastChat(win), 'Banker Elise: Your wounds close. HP restored.', 'full-HP Heal still uses the heal line');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off after heal');
    });
});

EmberwoodTests.add('npcs: Banker Elise bank overlay deposit withdraw', function (win, H) {
    function stackQty(list, id) {
        var row = (list || []).filter(function (stack) { return stack.id === id; })[0];
        return row ? row.qty : 0;
    }

    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        var world = H.world(win);
        var hero = win.makeHero();
        win.game.registry.set('hero', hero);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        world.refreshHud();
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(typeof win.depositItem, 'function', 'depositItem exists');
        assertEqual(typeof win.withdrawItem, 'function', 'withdrawItem exists');

        var elise = H.findNpc(win, 'banker');
        assert(elise, 'Elise is in Emberhaven');
        var bank = win.document.getElementById('bank-overlay');
        assert(bank && bank === win.Hud.el.bank, '#bank-overlay is Hud.el.bank');
        assert(bank.hidden, 'bank overlay starts hidden');

        win.Hud.el.log.innerHTML = '';
        world.tryTalk(elise);
        assertEqual(H.hero(win).hp, 100, 'Talk does not change HP');
        assertEqual(H.hero(win).gold, 8, 'Talk does not change gold');
        H.click(win, win.document.querySelector('[data-dialogue-option="bank"]'));
        assert(!win.Hud.dialogueOpen(), 'Bank closes dialogue');
        assert(win.Hud.bankOpen() && !bank.hidden, 'Bank opens #bank-overlay');
        assertEqual(win.Hud.mode, 'world', 'bank keeps Hud.mode world');
        assertEqual(bank.getAttribute('data-bank'), 'banker', 'overlay is Elise');
        assertEqual(win.document.getElementById('bank-speaker').textContent, 'Banker Elise', 'bank names Elise');
        assertEqual(win.document.getElementById('bank-title').textContent, 'Bank', 'window title is Bank');
        assertEqual(win.getComputedStyle(bank).display, 'flex', 'visible bank uses flex CSS, not Phaser text');

        assertEqual(stackQty(H.hero(win).inventory, 'coins'), 8, 'start with 8 coins in inventory');
        assertEqual(stackQty(H.hero(win).bank, 'coins'), 0, 'bank starts empty of coins');
        H.click(win, bank.querySelector('#bank-inv-grid [data-bank-item="coins"]'));
        H.click(win, bank.querySelector('[data-bank-action="deposit"]'));
        assertEqual(H.hero(win).gold, 7, 'deposit 1 coin decrements gold');
        assertEqual(stackQty(H.hero(win).inventory, 'coins'), 7, 'inventory coins 8→7');
        assertEqual(stackQty(H.hero(win).bank, 'coins'), 1, 'bank coins 0→1');
        assertEqual(win.document.getElementById('hud-gold').textContent, '7', 'HUD gold after deposit');
        assertEqual(H.lastChat(win), 'You deposit 1 x Coins.', 'deposit chat');
        H.click(win, bank.querySelector('[data-bank-action="deposit"]'));
        H.click(win, bank.querySelector('[data-bank-action="deposit"]'));
        assertEqual(H.hero(win).gold, 5, 'three coin deposits leave 5 gold');
        assertEqual(stackQty(H.hero(win).inventory, 'coins'), 5, 'inventory coins 5');
        assertEqual(stackQty(H.hero(win).bank, 'coins'), 3, 'bank coins 3');

        H.click(win, bank.querySelector('#bank-vault-grid [data-bank-item="coins"]'));
        H.click(win, bank.querySelector('[data-bank-action="withdraw"]'));
        assertEqual(H.hero(win).gold, 6, 'withdraw 1 coin increments gold');
        assertEqual(stackQty(H.hero(win).inventory, 'coins'), 6, 'inventory coins 5→6');
        assertEqual(stackQty(H.hero(win).bank, 'coins'), 2, 'bank coins 3→2');
        assertEqual(win.document.getElementById('hud-gold').textContent, '6', 'HUD gold after withdraw');
        assertEqual(H.lastChat(win), 'You withdraw 1 x Coins.', 'withdraw chat');

        var shrimpInv = stackQty(H.hero(win).inventory, 'shrimp');
        assertEqual(shrimpInv, 8, 'start with 8 shrimp');
        H.click(win, bank.querySelector('#bank-inv-grid [data-bank-item="shrimp"]'));
        H.click(win, bank.querySelector('[data-bank-action="deposit"]'));
        assertEqual(stackQty(H.hero(win).inventory, 'shrimp'), 7, 'inventory shrimp 8→7');
        assertEqual(stackQty(H.hero(win).bank, 'shrimp'), 1, 'bank shrimp 0→1');
        assertEqual(H.hero(win).gold, 6, 'shrimp deposit does not change gold');
        H.click(win, bank.querySelector('#bank-vault-grid [data-bank-item="shrimp"]'));
        H.click(win, bank.querySelector('[data-bank-action="withdraw"]'));
        assertEqual(stackQty(H.hero(win).inventory, 'shrimp'), 8, 'withdraw restores shrimp');
        assertEqual(stackQty(H.hero(win).bank, 'shrimp'), 0, 'bank shrimp stack removed');
        assertEqual(H.hero(win).gold, 6, 'shrimp withdraw does not change gold');

        H.click(win, win.document.getElementById('btn-bank-close'));
        assert(bank.hidden, 'Close hides the bank overlay');
        assert(!win.Hud.bankOpen(), 'bankOpen is false after Close');
        assertEqual(win.Hud.mode, 'world', 'Close keeps Hud.mode world');
        assertEqual(H.hero(win).gold, 6, 'gold stays 6 after close');
        assertEqual(stackQty(H.hero(win).bank, 'coins'), 2, 'banked coins persist after close');
        assert(!win.document.getElementById('shop-overlay') || win.document.getElementById('shop-overlay').hidden, 'shop stays closed');
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
        assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('npcs: Banker Elise withdraw-X withdraw-all bank chest', function (win, H) {
    function stackQty(list, id) {
        var row = (list || []).filter(function (stack) { return stack.id === id; })[0];
        return row ? row.qty : 0;
    }

    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        var world = H.world(win);
        var hero = win.makeHero();
        win.game.registry.set('hero', hero);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        world.refreshHud();
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        var elise = H.findNpc(win, 'banker');
        assert(elise, 'Elise is in Emberhaven');
        var bank = win.document.getElementById('bank-overlay');
        var chest = win.document.getElementById('bank-chest');
        var qtyInput = win.document.getElementById('bank-qty');
        assert(bank && bank === win.Hud.el.bank, '#bank-overlay is Hud.el.bank');
        assert(chest && chest === win.Hud.el.bankChest, '#bank-chest is Hud.el.bankChest');
        assert(chest.hasAttribute('data-bank-chest'), 'chest UI is marked data-bank-chest');
        assert(chest.contains(win.document.getElementById('bank-vault-grid')), 'vault grid sits in the chest');
        assertEqual(chest.querySelector('h3').textContent, 'Chest', 'chest pane is labeled Chest');
        assert(qtyInput && qtyInput === win.Hud.el.bankQty, '#bank-qty is Hud.el.bankQty');
        assertEqual(qtyInput.tagName, 'INPUT', 'withdraw-X uses an HTML number input');
        assert(bank.querySelector('[data-bank-action="withdraw-x"]'), 'Withdraw-X button exists');
        assert(bank.querySelector('[data-bank-action="withdraw-all"]'), 'Withdraw-all button exists');
        assert(bank.hidden, 'bank overlay starts hidden');

        win.Hud.el.log.innerHTML = '';
        world.tryTalk(elise);
        H.click(win, win.document.querySelector('[data-dialogue-option="bank"]'));
        assert(win.Hud.bankOpen() && !bank.hidden, 'Bank opens #bank-overlay');
        assertEqual(win.Hud.mode, 'world', 'bank keeps Hud.mode world');
        assertEqual(qtyInput.value, '1', 'qty input resets to 1');
        assertEqual(win.getComputedStyle(chest).display, 'block', 'chest UI is visible HTML, not Phaser text');

        H.click(win, bank.querySelector('#bank-inv-grid [data-bank-item="coins"]'));
        H.click(win, bank.querySelector('[data-bank-action="deposit"]'));
        H.click(win, bank.querySelector('[data-bank-action="deposit"]'));
        H.click(win, bank.querySelector('[data-bank-action="deposit"]'));
        H.click(win, bank.querySelector('[data-bank-action="deposit"]'));
        H.click(win, bank.querySelector('[data-bank-action="deposit"]'));
        assertEqual(H.hero(win).gold, 3, 'five coin deposits leave 3 gold');
        assertEqual(stackQty(H.hero(win).bank, 'coins'), 5, 'bank coins 5');

        H.click(win, bank.querySelector('#bank-vault-grid [data-bank-item="coins"]'));
        qtyInput.value = '0';
        H.click(win, bank.querySelector('[data-bank-action="withdraw-x"]'));
        assertEqual(H.hero(win).gold, 3, 'invalid X does not move gold');
        assertEqual(stackQty(H.hero(win).bank, 'coins'), 5, 'invalid X leaves bank coins');
        assertEqual(H.lastChat(win), 'Enter how many to withdraw.', 'invalid X chat');

        qtyInput.value = '2';
        H.click(win, bank.querySelector('[data-bank-action="withdraw-x"]'));
        assertEqual(H.hero(win).gold, 5, 'withdraw-X 2 increments gold 3→5');
        assertEqual(stackQty(H.hero(win).inventory, 'coins'), 5, 'inventory coins 3→5');
        assertEqual(stackQty(H.hero(win).bank, 'coins'), 3, 'bank coins 5→3');
        assertEqual(win.document.getElementById('hud-gold').textContent, '5', 'HUD gold after withdraw-X');
        assertEqual(H.lastChat(win), 'You withdraw 2 x Coins.', 'withdraw-X chat');

        qtyInput.value = '99';
        H.click(win, bank.querySelector('[data-bank-action="withdraw-all"]'));
        assertEqual(H.hero(win).gold, 8, 'withdraw-all returns remaining coins');
        assertEqual(stackQty(H.hero(win).inventory, 'coins'), 8, 'inventory coins back to 8');
        assertEqual(stackQty(H.hero(win).bank, 'coins'), 0, 'bank coins stack removed');
        assertEqual(H.lastChat(win), 'You withdraw 3 x Coins.', 'withdraw-all chat uses remaining qty');

        H.click(win, bank.querySelector('#bank-inv-grid [data-bank-item="shrimp"]'));
        var i;
        for (i = 0; i < 8; i++) {
            H.click(win, bank.querySelector('[data-bank-action="deposit"]'));
        }
        assertEqual(stackQty(H.hero(win).inventory, 'shrimp'), 0, 'inventory shrimp deposited');
        assertEqual(stackQty(H.hero(win).bank, 'shrimp'), 8, 'bank shrimp 8');
        assertEqual(H.hero(win).gold, 8, 'shrimp deposit does not change gold');
        H.click(win, bank.querySelector('#bank-vault-grid [data-bank-item="shrimp"]'));
        H.click(win, bank.querySelector('[data-bank-action="withdraw-all"]'));
        assertEqual(stackQty(H.hero(win).inventory, 'shrimp'), 8, 'withdraw-all restores shrimp');
        assertEqual(stackQty(H.hero(win).bank, 'shrimp'), 0, 'bank shrimp stack removed');
        assertEqual(H.hero(win).gold, 8, 'shrimp withdraw-all does not change gold');
        assertEqual(H.lastChat(win), 'You withdraw 8 x Cooked shrimp.', 'withdraw-all shrimp chat');

        H.click(win, win.document.getElementById('btn-bank-close'));
        assert(bank.hidden, 'Close hides the bank overlay');
        assert(!win.Hud.bankOpen(), 'bankOpen is false after Close');
        assert(!win.document.getElementById('shop-overlay') || win.document.getElementById('shop-overlay').hidden, 'shop stays closed');
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
        assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('npcs: Banker Elise bank search and All Food tabs', function (win, H) {
    function stackQty(list, id) {
        var row = (list || []).filter(function (stack) { return stack.id === id; })[0];
        return row ? row.qty : 0;
    }

    function vaultIds(root) {
        var nodes = root.querySelectorAll('#bank-vault-grid [data-bank-item]');
        var ids = [];
        var i;
        for (i = 0; i < nodes.length; i++) {
            ids.push(nodes[i].getAttribute('data-bank-item'));
        }
        return ids.join(',');
    }

    function typeSearch(el, value) {
        el.value = value;
        el.dispatchEvent(new win.Event('input', { bubbles: true }));
    }

    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        var world = H.world(win);
        var hero = win.makeHero();
        win.game.registry.set('hero', hero);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        world.refreshHud();
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        assert(win.BANK_TABS && win.BANK_TABS.length >= 2, 'BANK_TABS has at least two tabs');
        assertEqual(win.BANK_TABS[0][0], 'all', 'first bank tab is All');
        assertEqual(win.BANK_TABS[1][0], 'food', 'second bank tab is Food');
        assertEqual(win.bankItemTab('shrimp'), 'food', 'shrimp is a food tab item');
        assertEqual(win.bankItemTab('coins'), 'all', 'coins stay on All');

        var elise = H.findNpc(win, 'banker');
        assert(elise, 'Elise is in Emberhaven');
        var bank = win.document.getElementById('bank-overlay');
        var chest = win.document.getElementById('bank-chest');
        var search = win.document.getElementById('bank-search');
        var tabs = win.document.getElementById('bank-tabs');
        assert(bank && bank === win.Hud.el.bank, '#bank-overlay is Hud.el.bank');
        assert(chest && chest === win.Hud.el.bankChest, '#bank-chest is Hud.el.bankChest');
        assert(search && search === win.Hud.el.bankSearch, '#bank-search is Hud.el.bankSearch');
        assertEqual(search.tagName, 'INPUT', 'bank search is an HTML input');
        assert(tabs && tabs === win.Hud.el.bankTabs, '#bank-tabs is Hud.el.bankTabs');
        assert(chest.contains(search), 'search sits in the chest');
        assert(chest.contains(tabs), 'tabs sit in the chest');
        assertEqual(tabs.querySelectorAll('[data-bank-tab]').length, 2, 'exactly two bank tabs');
        assert(tabs.querySelector('[data-bank-tab="all"]'), 'All tab exists');
        assert(tabs.querySelector('[data-bank-tab="food"]'), 'Food tab exists');
        assert(bank.hidden, 'bank overlay starts hidden');

        win.Hud.el.log.innerHTML = '';
        world.tryTalk(elise);
        H.click(win, win.document.querySelector('[data-dialogue-option="bank"]'));
        assert(win.Hud.bankOpen() && !bank.hidden, 'Bank opens #bank-overlay');
        assertEqual(win.Hud.mode, 'world', 'bank keeps Hud.mode world');
        assertEqual(win.Hud.bankTab, 'all', 'opens on All tab');
        assertEqual(search.value, '', 'search starts empty');
        assert(tabs.querySelector('[data-bank-tab="all"]').classList.contains('is-on'), 'All tab is on');
        assert(!tabs.querySelector('[data-bank-tab="food"]').classList.contains('is-on'), 'Food tab starts off');

        H.click(win, bank.querySelector('#bank-inv-grid [data-bank-item="coins"]'));
        H.click(win, bank.querySelector('[data-bank-action="deposit"]'));
        H.click(win, bank.querySelector('#bank-inv-grid [data-bank-item="shrimp"]'));
        H.click(win, bank.querySelector('[data-bank-action="deposit"]'));
        H.click(win, bank.querySelector('#bank-inv-grid [data-bank-item="bread"]'));
        H.click(win, bank.querySelector('[data-bank-action="deposit"]'));
        assertEqual(stackQty(H.hero(win).bank, 'coins'), 1, 'bank coins 1');
        assertEqual(stackQty(H.hero(win).bank, 'shrimp'), 1, 'bank shrimp 1');
        assertEqual(stackQty(H.hero(win).bank, 'bread'), 1, 'bank bread 1');
        assertEqual(vaultIds(bank), 'coins,shrimp,bread', 'All tab shows coins shrimp bread');

        H.click(win, tabs.querySelector('[data-bank-tab="food"]'));
        assertEqual(win.Hud.bankTab, 'food', 'Food tab is selected');
        assert(tabs.querySelector('[data-bank-tab="food"]').classList.contains('is-on'), 'Food tab is on');
        assert(!tabs.querySelector('[data-bank-tab="all"]').classList.contains('is-on'), 'All tab turns off');
        assertEqual(vaultIds(bank), 'shrimp,bread', 'Food tab hides coins');
        assert(!bank.querySelector('#bank-vault-grid [data-bank-item="coins"]'), 'coins leave the Food grid');

        typeSearch(search, 'shr');
        assertEqual(vaultIds(bank), 'shrimp', 'Food search shr shows shrimp only');
        assert(!bank.querySelector('#bank-vault-grid [data-bank-item="bread"]'), 'bread filtered out');

        typeSearch(search, 'coin');
        assertEqual(vaultIds(bank), '', 'Food search coin shows nothing');

        H.click(win, tabs.querySelector('[data-bank-tab="all"]'));
        assertEqual(win.Hud.bankTab, 'all', 'All tab selected again');
        assertEqual(vaultIds(bank), 'coins', 'All + coin search shows coins only');

        typeSearch(search, '');
        assertEqual(vaultIds(bank), 'coins,shrimp,bread', 'clearing search restores All stacks');

        H.click(win, tabs.querySelector('[data-bank-tab="food"]'));
        H.click(win, bank.querySelector('#bank-vault-grid [data-bank-item="shrimp"]'));
        H.click(win, bank.querySelector('[data-bank-action="withdraw"]'));
        assertEqual(stackQty(H.hero(win).bank, 'shrimp'), 0, 'withdraw from Food tab removes shrimp');
        assertEqual(stackQty(H.hero(win).inventory, 'shrimp'), 8, 'shrimp returns to inventory');
        assertEqual(vaultIds(bank), 'bread', 'Food tab left with bread');
        assertEqual(H.lastChat(win), 'You withdraw 1 x Cooked shrimp.', 'Food-tab withdraw chat');

        H.click(win, win.document.getElementById('btn-bank-close'));
        assert(bank.hidden, 'Close hides the bank overlay');
        assert(!win.Hud.bankOpen(), 'bankOpen is false after Close');
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
        assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('npcs: Fen Witch refuses below 10 gold and does not heal', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        var world = H.world(win);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        H.enterZone(win, 'mire');
        world = H.world(win);
        H.setAutoAttack(win, false);
        var witch = H.findNpc(win, 'witch');
        assert(witch, 'Fen Witch is in Mirefen');
        assertEqual(Math.round(witch.x), 200, 'witch x');
        assertEqual(Math.round(witch.y), 180, 'witch y');

        function coinQty(hero) {
            var stack = hero.inventory.filter(function (row) { return row.id === 'coins'; })[0];
            return stack ? stack.qty : 0;
        }

        function assertRefuse(label, gold, hp) {
            var hero = win.makeHero();
            hero.hp = hp;
            hero.gold = gold;
            win.syncCoins(hero);
            win.game.registry.set('hero', hero);
            world.refreshHud();
            var xp = H.hero(win).xp;
            var coins = coinQty(H.hero(win));
            win.Hud.el.log.innerHTML = '';
            world.tryTalk(witch);
            assertEqual(H.hero(win).hp, hp, label + ' HP unchanged');
            assertEqual(H.hero(win).gold, gold, label + ' gold unchanged');
            assertEqual(coinQty(H.hero(win)), coins, label + ' coin stack unchanged');
            assertEqual(H.hero(win).xp, xp, label + ' XP unchanged');
            assertEqual(H.lastChat(win), 'Fen Witch: Come back with 10 gold.', label + ' refuse line');
            assert(!H.chatHas(win, 'Your wounds close'), label + ' does not heal');
            assert(!H.chatHas(win, 'HP restored'), label + ' does not restore');
            assert(!win.game.input.keyboard, 'Phaser keyboard off after ' + label);
        }

        assertEqual(win.makeHero().gold, 8, 'starter gold is 8 (below 10)');
        assertRefuse('starter 8gp', 8, 40);
        assertRefuse('0gp', 0, 22);
        assertRefuse('9gp', 9, 61);

        H.enterZone(win, 'haven');
        world = H.world(win);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
        assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('npcs: Fen Witch at 10+ gold heals and takeItem removes 10 coins', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        var world = H.world(win);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(typeof win.takeItem, 'function', 'takeItem is the coin-removal helper');

        H.enterZone(win, 'mire');
        world = H.world(win);
        H.setAutoAttack(win, false);
        var witch = H.findNpc(win, 'witch');
        assert(witch, 'Fen Witch is in Mirefen');
        assertEqual(witch.npcDef.name, 'Fen Witch', 'witch name');
        assertEqual(Math.round(witch.x), 200, 'witch x');
        assertEqual(Math.round(witch.y), 180, 'witch y');

        function coinQty(hero) {
            var stack = hero.inventory.filter(function (row) { return row.id === 'coins'; })[0];
            return stack ? stack.qty : 0;
        }

        function assertPaidHeal(label, gold, hp) {
            var hero = win.makeHero();
            hero.hp = hp;
            hero.gold = gold;
            win.syncCoins(hero);
            win.game.registry.set('hero', hero);
            world.refreshHud();
            assertEqual(coinQty(H.hero(win)), gold, label + ' coins match gold before talk');
            var xp = H.hero(win).xp;
            var shrimp = H.hero(win).inventory.filter(function (row) { return row.id === 'shrimp'; })[0];
            var shrimpQty = shrimp ? shrimp.qty : 0;
            win.Hud.el.log.innerHTML = '';
            world.tryTalk(witch);
            assertEqual(H.hero(win).hp, H.hero(win).maxHp, label + ' heals to max');
            assertEqual(H.hero(win).hp, 100, label + ' HP is 100');
            assertEqual(H.hero(win).gold, gold - 10, label + ' gold minus 10 via takeItem');
            assertEqual(coinQty(H.hero(win)), gold - 10, label + ' coin stack minus 10 (takeItem, not gold-only)');
            assertEqual(H.hero(win).xp, xp, label + ' XP unchanged');
            assertEqual(H.lastChat(win), 'Fen Witch: Your wounds close. HP restored.', label + ' heal line');
            assert(!H.chatHas(win, 'Come back with 10 gold'), label + ' does not refuse');
            assertEqual(win.document.getElementById('hud-hp').textContent, '100 / 100', label + ' HUD HP');
            assertEqual(win.document.getElementById('hud-gold').textContent, String(gold - 10), label + ' HUD gold');
            var fill = win.document.getElementById('hp-fill');
            assert(fill, 'HP fill bar exists');
            assertEqual(fill.style.width, '100%', label + ' HP bar full');
            var shrimpAfter = H.hero(win).inventory.filter(function (row) { return row.id === 'shrimp'; })[0];
            assertEqual(shrimpAfter ? shrimpAfter.qty : 0, shrimpQty, label + ' food stack untouched');
            assert(!win.game.input.keyboard, 'Phaser keyboard off after ' + label);
        }

        assertPaidHeal('exact 10gp', 10, 40);
        assertPaidHeal('11gp', 11, 22);
        assertPaidHeal('18gp', 18, 55);

        H.enterZone(win, 'haven');
        world = H.world(win);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
        assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('npcs: flavor NPCs emit Name plus one of their lines', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        var world = H.world(win);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        var flavor = [
            { zone: 'haven', key: 'guard', name: 'Guard Rowan', x: 252, y: 168 },
            { zone: 'northwood', key: 'ranger', name: 'Ranger Kett', x: 240, y: 200 },
            { zone: 'millfields', key: 'farmer', name: 'Farmer Willa', x: 200, y: 180 },
            { zone: 'southshore', key: 'fisher', name: 'Fisher Ned', x: 220, y: 160 },
            { zone: 'westmead', key: 'wanderer', name: 'Wanderer Sila', x: 180, y: 190 },
            { zone: 'graves', key: 'ghost', name: 'Wisp', x: 200, y: 170 },
            { zone: 'darkmine', key: 'miner', name: 'Miner Corb', x: 210, y: 200 },
            { zone: 'highlands', key: 'hermit', name: 'Hermit Ola', x: 240, y: 160 }
        ];

        flavor.forEach(function (want) {
            H.enterZone(win, want.zone);
            world = H.world(win);
            H.setAutoAttack(win, false);
            var npc = H.findNpc(win, want.key);
            assert(npc, want.name + ' spawned in ' + want.zone);
            assertEqual(npc.npcDef.name, want.name, want.name + ' display name');
            assertEqual(Math.round(npc.x), want.x, want.name + ' x');
            assertEqual(Math.round(npc.y), want.y, want.name + ' y');
            var lines = npc.npcDef.lines;
            assert(lines && lines.length >= 2, want.name + ' has flavor lines');

            win.Hud.el.log.innerHTML = '';
            world.tryTalk(npc);
            assert(win.Hud.dialogueOpen(), want.name + ' opens dialogue');
            assertEqual(H.lastChat(win), want.name + ': ' + lines[0], want.name + ' first page');
            assert(H.lastChat(win).indexOf(want.name + ': ') === 0, want.name + ' Name: prefix');
            for (var idx = 1; idx < lines.length; idx++) {
                win.Hud.advanceDialogue();
                assertEqual(H.lastChat(win), want.name + ': ' + lines[idx], want.name + ' page ' + idx);
            }
            assert(!H.chatHas(win, 'Come back with 10 gold'), want.name + ' is not a paid healer');
            assert(!H.chatHas(win, 'Your wounds close'), want.name + ' does not heal');
            assert(!H.chatHas(win, 'Goblins plague Northwood'), want.name + ' is not Bram');
            win.Hud.advanceDialogue();
            assert(!win.Hud.dialogueOpen(), want.name + ' dialogue closes after last page');
            assert(!win.game.input.keyboard, 'Phaser keyboard off after ' + want.name);
        });
        assertEqual(flavor.length, 8, 'eight flavor NPCs');

        H.enterZone(win, 'haven');
        world = H.world(win);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
        assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('npcs: Ned Corb Willa Kett tutor lines unlock fishing mining cows combat styles', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        var world = H.world(win);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(typeof win.applyNpcTutor, 'function', 'applyNpcTutor exists');
        assertEqual(H.hero(win).tutors && Object.keys(H.hero(win).tutors).length, 0, 'starter has no tutors');

        var tutors = [
            {
                zone: 'southshore',
                key: 'fisher',
                name: 'Fisher Ned',
                x: 220,
                y: 160,
                tutor: 'fishing',
                needles: ['fishing', 'net']
            },
            {
                zone: 'darkmine',
                key: 'miner',
                name: 'Miner Corb',
                x: 210,
                y: 200,
                tutor: 'mining',
                needles: ['mining', 'pickaxe']
            },
            {
                zone: 'millfields',
                key: 'farmer',
                name: 'Farmer Willa',
                x: 200,
                y: 180,
                tutor: 'cows',
                needles: ['cow', 'hide']
            },
            {
                zone: 'northwood',
                key: 'ranger',
                name: 'Ranger Kett',
                x: 240,
                y: 200,
                tutor: 'combat',
                needles: ['Accurate', 'Aggressive', 'Defensive']
            }
        ];

        tutors.forEach(function (want) {
            H.enterZone(win, want.zone);
            world = H.world(win);
            H.setAutoAttack(win, false);
            var npc = H.findNpc(win, want.key);
            assert(npc, want.name + ' spawned in ' + want.zone);
            assertEqual(npc.npcDef.name, want.name, want.name + ' display name');
            assertEqual(Math.round(npc.x), want.x, want.name + ' x');
            assertEqual(Math.round(npc.y), want.y, want.name + ' y');
            assertEqual(npc.npcDef.tutor, want.tutor, want.name + ' tutor key');
            var lines = npc.npcDef.lines;
            assert(lines && lines.length >= 4, want.name + ' has flavor plus tutor lines');
            var joined = lines.join(' ');
            want.needles.forEach(function (needle) {
                assert(joined.indexOf(needle) !== -1, want.name + ' explains ' + needle);
            });
            assert(!H.hero(win).tutors[want.tutor], want.name + ' tutor locked before talk');

            win.Hud.el.log.innerHTML = '';
            world.tryTalk(npc);
            assert(win.Hud.dialogueOpen(), want.name + ' opens dialogue');
            assertEqual(H.lastChat(win), want.name + ': ' + lines[0], want.name + ' first page');
            for (var idx = 1; idx < lines.length; idx++) {
                win.Hud.advanceDialogue();
                assertEqual(H.lastChat(win), want.name + ': ' + lines[idx], want.name + ' page ' + idx);
            }
            assertEqual(H.hero(win).tutors[want.tutor], true, want.name + ' unlocks ' + want.tutor);
            win.Hud.advanceDialogue();
            assert(!win.Hud.dialogueOpen(), want.name + ' dialogue closes after last page');
            assert(!win.game.input.keyboard, 'Phaser keyboard off after ' + want.name);
        });

        H.enterZone(win, 'northwood');
        world = H.world(win);
        var kett = H.findNpc(win, 'ranger');
        assert(kett, 'Kett still in Northwood for Talk option');
        H.hero(win).tutors.combat = false;
        win.game.registry.set('hero', H.hero(win));
        world.dialogueNpc = kett;
        world.chooseDialogueOption('talk');
        assert(win.Hud.dialogueOpen(), 'Talk option opens Kett dialogue');
        assertEqual(H.hero(win).tutors.combat, true, 'Talk option also unlocks combat');
        win.Hud.hideDialogue();

        var unlocked = H.hero(win).tutors;
        assertEqual(unlocked.fishing, true, 'fishing stays unlocked');
        assertEqual(unlocked.mining, true, 'mining stays unlocked');
        assertEqual(unlocked.cows, true, 'cows stays unlocked');
        assertEqual(unlocked.combat, true, 'combat stays unlocked');

        H.enterZone(win, 'haven');
        world = H.world(win);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
        assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('npcs: click-to-continue pages through multi-line dialogue', function (win, H) {
    function hiddenCssRule(doc, id) {
        var needle = '#' + id + '[hidden]';
        var sheets = doc.styleSheets;
        for (var s = 0; s < sheets.length; s++) {
            var rules;
            try {
                rules = sheets[s].cssRules;
            } catch (err) {
                continue;
            }
            if (!rules) {
                continue;
            }
            for (var r = 0; r < rules.length; r++) {
                var sel = rules[r].selectorText || '';
                if (sel.indexOf(needle) !== -1) {
                    return rules[r];
                }
            }
        }
        return null;
    }

    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        var world = H.world(win);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(win.Hud.mode, 'world', 'world mode');

        var overlay = win.document.getElementById('dialogue-overlay');
        assert(overlay && overlay === win.Hud.el.dialogue, '#dialogue-overlay is Hud.el.dialogue');
        assertEqual(overlay.tagName, 'DIV', 'dialogue overlay is an HTML div');
        assert(overlay.hidden, 'dialogue starts hidden');
        var rule = hiddenCssRule(win.document, 'dialogue-overlay');
        assert(rule, '#dialogue-overlay[hidden] CSS exists like title/dead');
        assertEqual(rule.style.getPropertyValue('display'), 'none', '#dialogue-overlay[hidden] is display:none');
        assertEqual(win.getComputedStyle(overlay).display, 'none', 'hidden dialogue computed display is none');
        assertEqual(overlay.querySelectorAll('button').length, 0, 'no Talk/Trade/Bank/Quest buttons yet');

        var rowan = H.findNpc(win, 'guard');
        assert(rowan, 'Rowan is in Emberhaven');
        var lines = rowan.npcDef.lines;
        assert(lines && lines.length === 2, 'Rowan has two flavor pages');
        win.Hud.el.log.innerHTML = '';
        world.tryTalk(rowan);
        assert(world.talkTarget === null, 'tryTalk still clears talkTarget');
        assert(win.Hud.dialogueOpen(), 'talk opens the dialogue box');
        assertEqual(overlay.hidden, false, 'dialogue overlay is visible');
        assertEqual(overlay.getAttribute('data-page'), '1', 'first page index');
        assertEqual(overlay.getAttribute('data-pages'), '2', 'two pages');
        assertEqual(win.document.getElementById('dialogue-speaker').textContent, 'Guard Rowan', 'speaker is Rowan');
        assertEqual(win.document.getElementById('dialogue-text').textContent, lines[0], 'first page text');
        assertEqual(win.document.getElementById('dialogue-continue').textContent, 'Click to continue', 'continue hint');
        assertEqual(H.chat(win).length, 1, 'first page logs one chat line');
        assertEqual(H.lastChat(win), 'Guard Rowan: ' + lines[0], 'first page in chat');
        assert(!H.chatHas(win, lines[1]), 'second page waits for click');
        assertEqual(win.Hud.mode, 'world', 'dialogue keeps Hud.mode world');
        assert(!world.walkTarget, 'opening dialogue does not walk');

        H.click(win, overlay);
        assert(win.Hud.dialogueOpen(), 'click continues to the last page');
        assertEqual(overlay.getAttribute('data-page'), '2', 'second page index');
        assertEqual(win.document.getElementById('dialogue-text').textContent, lines[1], 'second page text');
        assertEqual(win.document.getElementById('dialogue-continue').textContent, 'Click to close', 'close hint on last page');
        assertEqual(H.chat(win).length, 2, 'second page logs the next chat line');
        assertEqual(H.lastChat(win), 'Guard Rowan: ' + lines[1], 'second page in chat');

        H.click(win, overlay);
        assert(!win.Hud.dialogueOpen(), 'click on the last page closes dialogue');
        assert(overlay.hidden, 'dialogue overlay hidden after close');
        assertEqual(H.chat(win).length, 2, 'closing does not add another chat line');

        win.Hud.el.log.innerHTML = '';
        world.tryTalk(rowan);
        assert(win.Hud.dialogueOpen(), 'talk again opens page 1');
        assertEqual(H.lastChat(win), 'Guard Rowan: ' + lines[0], 'reopen first page');
        if (world.clearWalk) {
            world.clearWalk();
        }
        H.clickWorld(win, spawn.x + 80, spawn.y);
        assert(win.Hud.dialogueOpen(), 'world click continues dialogue');
        assertEqual(win.document.getElementById('dialogue-text').textContent, lines[1], 'world click shows page 2');
        assert(!world.walkTarget, 'world click does not walk while paging');
        assertEqual(Math.round(world.player.x), 328, 'player stays at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player stays at spawn y');
        H.clickWorld(win, spawn.x + 80, spawn.y);
        assert(!win.Hud.dialogueOpen(), 'world click closes the last page');
        assert(!world.walkTarget, 'closing click still does not walk');

        win.game.registry.set('quest', { id: 'goblins', stage: 3, progress: 5, goal: 5 });
        world.refreshHud();
        var bram = H.findNpc(win, 'guild');
        assert(bram, 'Bram is in Emberhaven');
        win.Hud.el.log.innerHTML = '';
        world.tryTalk(bram);
        assertEqual(H.chat(win).length, 1, 'post-quest Bram is still one page');
        assertEqual(H.lastChat(win), 'Guildmaster Bram: Emberhaven stands because of you.', 'post-quest line');
        assertEqual(overlay.getAttribute('data-pages'), '1', 'Bram special line is a single page');
        H.click(win, overlay);
        assert(!win.Hud.dialogueOpen(), 'single-page Bram closes on click');

        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
        assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('npcs: dialogue option buttons Talk Trade Bank Quest where the NPC supports them', function (win, H) {
    function optionIds(overlay) {
        var btns = overlay.querySelectorAll('[data-dialogue-option]');
        var ids = [];
        for (var i = 0; i < btns.length; i++) {
            ids.push(btns[i].getAttribute('data-dialogue-option'));
        }
        return ids.join(',');
    }

    function optionLabels(overlay) {
        var btns = overlay.querySelectorAll('[data-dialogue-option]');
        var labels = [];
        for (var i = 0; i < btns.length; i++) {
            labels.push(btns[i].textContent);
        }
        return labels.join(',');
    }

    function noShopBank(win, label) {
        assert(!win.document.getElementById('shop-overlay') || win.document.getElementById('shop-overlay').hidden, label + ' does not open shop UI');
        assert(!win.document.getElementById('bank-overlay') || win.document.getElementById('bank-overlay').hidden, label + ' does not open bank UI');
    }

    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        var world = H.world(win);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(win.Hud.mode, 'world', 'world mode');

        var overlay = win.document.getElementById('dialogue-overlay');
        var row = win.document.getElementById('dialogue-options');
        assert(overlay && overlay === win.Hud.el.dialogue, '#dialogue-overlay is Hud.el.dialogue');
        assert(row && row === win.Hud.el.dialogueOptions, '#dialogue-options is Hud.el.dialogueOptions');
        assert(row.hidden, 'option row starts hidden');
        assertEqual(optionIds(overlay), '', 'no option buttons before talk');

        var rowan = H.findNpc(win, 'guard');
        assert(rowan, 'Rowan is in Emberhaven');
        assertEqual(win.npcDialogueOptions(rowan.npcDef).map(function (opt) { return opt.id; }).join(','), 'talk', 'Rowan supports Talk only');
        win.Hud.el.log.innerHTML = '';
        world.tryTalk(rowan);
        assert(win.Hud.dialogueOpen(), 'Rowan talk opens dialogue');
        assertEqual(optionIds(overlay), 'talk', 'Rowan shows Talk');
        assertEqual(optionLabels(overlay), 'Talk', 'Rowan Talk label');
        assertEqual(overlay.getAttribute('data-options'), 'talk', 'Rowan data-options is talk');
        assert(!overlay.querySelector('[data-dialogue-option="trade"]'), 'Rowan has no Trade');
        assert(!overlay.querySelector('[data-dialogue-option="bank"]'), 'Rowan has no Bank');
        assert(!overlay.querySelector('[data-dialogue-option="quest"]'), 'Rowan has no Quest');
        H.click(win, overlay.querySelector('[data-dialogue-option="talk"]'));
        assert(win.Hud.dialogueOpen(), 'Talk button does not close dialogue');
        assertEqual(win.document.getElementById('dialogue-text').textContent, rowan.npcDef.lines[0], 'Talk replays flavor page 1');
        assertEqual(overlay.getAttribute('data-page'), '1', 'Talk restarts at page 1');
        assert(!world.walkTarget, 'Talk button does not walk');
        assertEqual(win.Hud.mode, 'world', 'Talk keeps Hud.mode world');
        H.click(win, overlay);
        assertEqual(win.document.getElementById('dialogue-text').textContent, rowan.npcDef.lines[1], 'overlay click still pages after Talk');
        win.Hud.hideDialogue();

        win.game.registry.set('quest', { id: 'goblins', stage: 0, progress: 0, goal: 5 });
        world.refreshHud();
        var bram = H.findNpc(win, 'guild');
        assert(bram, 'Bram is in Emberhaven');
        assertEqual(win.npcDialogueOptions(bram.npcDef).map(function (opt) { return opt.id; }).join(','), 'talk,quest', 'Bram supports Talk and Quest');
        win.Hud.el.log.innerHTML = '';
        world.tryTalk(bram);
        assertEqual(H.quest(win).stage, 1, 'tryTalk still accepts the militia task');
        assertEqual(optionIds(overlay), 'talk,quest', 'Bram shows Talk and Quest');
        assertEqual(optionLabels(overlay), 'Talk,Quest', 'Bram Talk Quest labels');
        assert(!overlay.querySelector('[data-dialogue-option="trade"]'), 'Bram has no Trade');
        assert(!overlay.querySelector('[data-dialogue-option="bank"]'), 'Bram has no Bank');
        var gold = H.hero(win).gold;
        var xp = H.hero(win).xp;
        H.click(win, overlay.querySelector('[data-dialogue-option="talk"]'));
        assertEqual(win.document.getElementById('dialogue-text').textContent, bram.npcDef.lines[0], 'Talk shows Bram flavor, not the quest briefing');
        assertEqual(H.quest(win).stage, 1, 'Talk does not change quest stage');
        assertEqual(H.hero(win).gold, gold, 'Talk does not pay');
        H.click(win, overlay.querySelector('[data-dialogue-option="quest"]'));
        assert(win.Hud.dialogueOpen(), 'Quest keeps dialogue open');
        assertEqual(H.lastChat(win), 'Guildmaster Bram: 0 of 5 goblins down. Keep at it.', 'Quest button reports progress');
        assertEqual(H.quest(win).stage, 1, 'Quest at stage 1 does not pay');
        assertEqual(H.hero(win).gold, gold, 'Quest button does not pay gold');
        assertEqual(H.hero(win).xp, xp, 'Quest button does not grant XP');
        win.Hud.hideDialogue();

        var elise = H.findNpc(win, 'banker');
        assert(elise, 'Elise is in Emberhaven');
        assertEqual(win.npcDialogueOptions(elise.npcDef).map(function (opt) { return opt.id; }).join(','), 'talk,bank', 'Elise supports Talk and Bank');
        var hero = H.hero(win);
        hero.hp = 40;
        win.game.registry.set('hero', hero);
        world.refreshHud();
        win.Hud.el.log.innerHTML = '';
        world.tryTalk(elise);
        assertEqual(H.hero(win).hp, 40, 'tryTalk no longer auto-heals');
        assertEqual(optionIds(overlay), 'talk,bank', 'Elise shows Talk and Bank');
        assertEqual(optionLabels(overlay), 'Talk,Bank', 'Elise Talk Bank labels');
        assert(!overlay.querySelector('[data-dialogue-option="trade"]'), 'Elise has no Trade');
        assert(!overlay.querySelector('[data-dialogue-option="quest"]'), 'Elise has no Quest');
        gold = H.hero(win).gold;
        H.click(win, overlay.querySelector('[data-dialogue-option="bank"]'));
        var bank = win.document.getElementById('bank-overlay');
        assert(!win.Hud.dialogueOpen(), 'Bank closes dialogue');
        assert(win.Hud.bankOpen() && bank && !bank.hidden, 'Bank opens #bank-overlay');
        assertEqual(win.Hud.mode, 'world', 'bank keeps Hud.mode world');
        assertEqual(H.hero(win).gold, gold, 'Bank does not take gold');
        assertEqual(H.hero(win).hp, 40, 'Bank does not auto-heal');
        assert(win.document.getElementById('shop-overlay').hidden, 'Elise Bank does not open shop UI');
        H.click(win, win.document.getElementById('btn-bank-close'));
        assert(bank.hidden, 'Close hides the bank overlay');
        world.tryTalk(elise);
        H.click(win, overlay.querySelector('[data-dialogue-option="talk"]'));
        assertEqual(win.document.getElementById('dialogue-text').textContent, elise.npcDef.lines[0], 'Talk shows Elise flavor');
        assert(bank.hidden, 'Elise Talk does not open bank UI');
        win.Hud.hideDialogue();

        H.enterZone(win, 'mire');
        world = H.world(win);
        H.setAutoAttack(win, false);
        world.encounterLock = false;
        var witch = H.findNpc(win, 'witch');
        assert(witch, 'Fen Witch is in Mirefen');
        assertEqual(win.npcDialogueOptions(witch.npcDef).map(function (opt) { return opt.id; }).join(','), 'talk', 'Witch supports Talk only');
        world.tryTalk(witch);
        assertEqual(optionIds(overlay), 'talk', 'Witch shows Talk only');
        assert(!overlay.querySelector('[data-dialogue-option="trade"]'), 'Witch is not a shop');
        assert(!overlay.querySelector('[data-dialogue-option="bank"]'), 'Witch has no Bank');
        assert(!overlay.querySelector('[data-dialogue-option="quest"]'), 'Witch has no Quest');
        win.Hud.hideDialogue();

        H.enterZone(win, 'haven');
        world = H.world(win);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
        assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        noShopBank(win, 'return to spawn');
    });
});

EmberwoodTests.add('npcs: walk-away closes dialogue and TREE/ROCK walls block talk', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        var world = H.world(win);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(win.Hud.mode, 'world', 'world mode');

        var overlay = win.document.getElementById('dialogue-overlay');
        assert(overlay && overlay === win.Hud.el.dialogue, '#dialogue-overlay is Hud.el.dialogue');
        assert(overlay.hidden, 'dialogue starts hidden');

        var rowan = H.findNpc(win, 'guard');
        assert(rowan, 'Rowan is in Emberhaven');
        assertEqual(Math.round(rowan.x), 252, 'Rowan x');
        assertEqual(Math.round(rowan.y), 168, 'Rowan y');

        win.Hud.el.log.innerHTML = '';
        world.placePlayer(rowan.x + 16, rowan.y);
        world.player.body.setVelocity(0, 0);
        world.tryTalk(rowan);
        assert(win.Hud.dialogueOpen(), 'adjacent talk still opens dialogue');
        assertEqual(win.document.getElementById('dialogue-text').textContent, rowan.npcDef.lines[0], 'first page before walk-away');
        assertEqual(win.Hud.mode, 'world', 'dialogue keeps Hud.mode world');

        world.scene.pause();
        try {
            H.key(win, 'KeyD', 'd', 'keydown');
            assert(win.Keys.down.KeyD, 'D via Keys.js');
            world.update();
            assert(!win.Hud.dialogueOpen(), 'WASD walk-away closes #dialogue-overlay');
            assert(overlay.hidden, 'overlay hidden after D');
            assertEqual(world.dialogueNpc, null, 'walk-away clears dialogueNpc');
            assert(!win.game.input.keyboard, 'Phaser keyboard off after D');
        } finally {
            H.clearKeys(win);
            world.scene.resume();
        }

        win.Hud.el.log.innerHTML = '';
        world.placePlayer(rowan.x + 16, rowan.y);
        world.player.body.setVelocity(0, 0);
        world.tryTalk(rowan);
        assert(win.Hud.dialogueOpen(), 'talk again before distance walk-away');
        world.placePlayer(rowan.x + 80, rowan.y);
        world.player.body.setVelocity(0, 0);
        world.update();
        assert(!win.Hud.dialogueOpen(), 'standing 80px away closes dialogue');
        assert(overlay.hidden, 'overlay hidden after distance walk-away');

        var mid = win.worldToTile(rowan.x + 12, rowan.y);
        assertEqual(mid.tx, 16, 'wall tile is between Rowan and the east stand');
        assertEqual(mid.ty, 10, 'wall tile y matches Rowan');
        var saved = world.tileGrid[mid.ty][mid.tx];
        assert(saved !== win.TILE.TREE && saved !== win.TILE.ROCK, 'courtyard mid starts walkable');

        function assertWallBlocks(kind, tileId) {
            world.tileGrid[mid.ty][mid.tx] = tileId;
            world.placePlayer(rowan.x + 24, rowan.y);
            world.player.body.setVelocity(0, 0);
            if (world.clearWalk) {
                world.clearWalk();
            }
            world.talkTarget = null;
            win.Hud.hideDialogue();
            win.Hud.el.log.innerHTML = '';
            var lastBefore = H.lastChat(win);
            world.tryTalk(rowan);
            assert(!win.Hud.dialogueOpen(), kind + ' wall blocks tryTalk');
            assertEqual(H.lastChat(win), lastBefore, kind + ' wall does not log talk');

            world.scene.pause();
            try {
                H.clearKeys(win);
                H.key(win, 'Space', ' ', 'keydown');
                world.update();
                assert(!win.Hud.dialogueOpen(), kind + ' wall blocks Space talk');
                assertEqual(H.lastChat(win), lastBefore, kind + ' Space stays silent');
            } finally {
                H.clearKeys(win);
                world.scene.resume();
            }

            world.talkTarget = rowan;
            world.update();
            assert(world.talkTarget === rowan, kind + ' walk-in does not freeze on a walled NPC');
            assert(!win.Hud.dialogueOpen(), kind + ' walk-in does not talk through the wall');
        }

        assertWallBlocks('ROCK', win.TILE.ROCK);
        assertWallBlocks('TREE', win.TILE.TREE);

        world.tileGrid[mid.ty][mid.tx] = saved;
        world.placePlayer(rowan.x + 24, rowan.y);
        world.player.body.setVelocity(0, 0);
        win.Hud.el.log.innerHTML = '';
        world.tryTalk(rowan);
        assert(win.Hud.dialogueOpen(), 'clear LOS still talks at 24px');
        assert(H.chatHas(win, 'Guard Rowan:'), 'Rowan speaks once the wall is gone');
        win.Hud.hideDialogue();

        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
        assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('npcs: Shopkeeper Mira Trade window opens shop-overlay', function (win, H) {
    function hiddenCssRule(doc, id) {
        var needle = '#' + id + '[hidden]';
        var sheets = doc.styleSheets;
        for (var s = 0; s < sheets.length; s++) {
            var rules;
            try {
                rules = sheets[s].cssRules;
            } catch (err) {
                continue;
            }
            if (!rules) {
                continue;
            }
            for (var r = 0; r < rules.length; r++) {
                var sel = rules[r].selectorText || '';
                if (sel.indexOf(needle) !== -1) {
                    return rules[r];
                }
            }
        }
        return null;
    }

    function optionIds(overlay) {
        var btns = overlay.querySelectorAll('[data-dialogue-option]');
        var ids = [];
        for (var i = 0; i < btns.length; i++) {
            ids.push(btns[i].getAttribute('data-dialogue-option'));
        }
        return ids.join(',');
    }

    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        var world = H.world(win);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(win.Hud.mode, 'world', 'world mode');

        var shop = win.document.getElementById('shop-overlay');
        var overlay = win.document.getElementById('dialogue-overlay');
        assert(shop && shop === win.Hud.el.shop, '#shop-overlay is Hud.el.shop');
        assert(shop.hidden, 'shop overlay starts hidden');
        var shopHidden = hiddenCssRule(win.document, 'shop-overlay');
        assert(shopHidden, '#shop-overlay[hidden] CSS exists like title/dead');
        assertEqual(shopHidden.style.getPropertyValue('display'), 'none', '#shop-overlay[hidden] is display:none');

        var mira = H.findNpc(win, 'shopkeep');
        assert(mira, 'Shopkeeper Mira is in Emberhaven');
        assertEqual(mira.npcDef.name, 'Shopkeeper Mira', 'shopkeeper name');
        assertEqual(Math.round(mira.x), 376, 'Mira courtyard x');
        assertEqual(Math.round(mira.y), 216, 'Mira courtyard y');
        assert(mira.x !== spawn.x || mira.y !== spawn.y, 'Mira is not on the spawn tile');
        assertEqual(win.npcDialogueOptions(mira.npcDef).map(function (opt) { return opt.id; }).join(','), 'talk,trade', 'Mira supports Talk and Trade');

        var elise = H.findNpc(win, 'banker');
        assert(elise, 'Elise is still in Emberhaven');
        assertEqual(elise.npcDef.name, 'Banker Elise', 'Elise remains the banker');
        assertEqual(win.npcDialogueOptions(elise.npcDef).map(function (opt) { return opt.id; }).join(','), 'talk,bank', 'Elise stays Talk and Bank');

        win.Hud.el.log.innerHTML = '';
        world.tryTalk(mira);
        assert(win.Hud.dialogueOpen(), 'Mira talk opens dialogue');
        assertEqual(optionIds(overlay), 'talk,trade', 'Mira shows Talk and Trade');
        assert(overlay.querySelector('[data-dialogue-option="trade"]'), 'Mira has a Trade button');
        assert(!overlay.querySelector('[data-dialogue-option="bank"]'), 'Mira has no Bank');
        assert(shop.hidden, 'talk does not open the shop yet');
        assertEqual(H.hero(win).gold, 8, 'starter gold is 8');

        H.click(win, overlay.querySelector('[data-dialogue-option="talk"]'));
        assertEqual(win.document.getElementById('dialogue-text').textContent, mira.npcDef.lines[0], 'Talk shows Mira flavor');
        assert(shop.hidden, 'Talk does not open shop');

        H.click(win, overlay.querySelector('[data-dialogue-option="trade"]'));
        assert(!win.Hud.dialogueOpen(), 'Trade closes dialogue');
        assert(win.Hud.shopOpen(), 'Trade opens the shop overlay');
        assertEqual(shop.hidden, false, 'shop overlay is visible');
        assertEqual(win.getComputedStyle(shop).display, 'flex', 'visible shop uses flex CSS, not Phaser text');
        assertEqual(win.Hud.mode, 'world', 'shop keeps Hud.mode world');
        assertEqual(shop.getAttribute('data-shop'), 'shopkeep', 'shop overlay is Mira');
        assertEqual(win.document.getElementById('shop-speaker').textContent, 'Shopkeeper Mira', 'shop names Mira');
        assertEqual(win.document.getElementById('shop-title').textContent, 'Trade', 'window title is Trade');
        var gold = H.hero(win).gold;
        var hp = H.hero(win).hp;
        H.click(win, shop.querySelector('[data-shop-action="buy"]'));
        assertEqual(H.lastChat(win), 'The shelves are still being stocked.', 'Buy is stubbed');
        assertEqual(H.hero(win).gold, gold, 'Buy stub does not take gold');
        assertEqual(H.hero(win).hp, hp, 'Buy stub does not change HP');
        assert(win.Hud.shopOpen(), 'Buy stub keeps the shop open');
        H.click(win, shop.querySelector('[data-shop-action="sell"]'));
        assertEqual(H.lastChat(win), 'The shelves are still being stocked.', 'Sell is stubbed');
        assertEqual(H.hero(win).gold, gold, 'Sell stub does not change gold');
        H.click(win, win.document.getElementById('btn-shop-close'));
        assert(shop.hidden, 'Close hides the shop overlay');
        assert(!win.Hud.shopOpen(), 'shopOpen is false after Close');
        assertEqual(win.Hud.mode, 'world', 'Close keeps Hud.mode world');
        assert(!win.document.getElementById('bank-overlay') || win.document.getElementById('bank-overlay').hidden, 'bank UI stays closed');

        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
        assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('npcs: cook priest shopkeeper original CC0 SVGs from generate_svgs', function (win, H) {
    var roles = [
        { key: 'cook', name: 'Cook Pell', x: 280, y: 280, texture: 'npc-cook', file: 'cook' },
        { key: 'priest', name: 'Priest Alden', x: 296, y: 168, texture: 'npc-priest', file: 'priest' },
        { key: 'shopkeep', name: 'Shopkeeper Mira', x: 376, y: 216, texture: 'npc-shopkeeper', file: 'shopkeeper' }
    ];

    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        var world = H.world(win);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(win.Hud.mode, 'world', 'world mode');

        roles.forEach(function (want) {
            assert(win.game.textures.exists(want.texture), want.texture + ' is loaded');
            var npc = H.findNpc(win, want.key);
            assert(npc, want.name + ' spawned in Emberhaven');
            assertEqual(npc.npcDef.name, want.name, want.name + ' display name');
            assertEqual(Math.round(npc.x), want.x, want.name + ' x');
            assertEqual(Math.round(npc.y), want.y, want.name + ' y');
            assertEqual(npc.texture.key, want.texture, want.name + ' uses original ' + want.texture);
            assert(want.texture !== 'npc-farmer', want.name + ' is not the farmer pack-in');
        });

        var mira = H.findNpc(win, 'shopkeep');
        assertEqual(mira.texture.key, 'npc-shopkeeper', 'Mira no longer borrows npc-farmer');
        assertEqual(win.examineNpcText(mira.npcDef), 'The town shopkeeper. She minds the general store.', 'Mira examine stays');

        return win.fetch('assets/svg/manifest.json').then(function (res) {
            assert(res.ok, 'manifest HTTP ' + res.status);
            assertEqual(res.status, 200, 'manifest status 200');
            return res.json();
        }).then(function (manifest) {
            assertEqual(manifest.license, 'Original Emberwood artwork. CC0-1.0.', 'SVGs stay original CC0');
            roles.forEach(function (want) {
                assert(manifest.npcs.indexOf(want.file) !== -1, want.file + ' is in the CC0 manifest');
            });
            assert(manifest.npcs.indexOf('farmer') !== -1, 'farmer SVG remains for Willa');
            return Promise.all(roles.map(function (want) {
                var path = 'assets/svg/npcs/' + want.file + '.svg';
                return win.fetch(path).then(function (res) {
                    assert(res.ok, want.file + ' svg HTTP ' + res.status);
                    assertEqual(res.status, 200, want.file + ' svg status 200');
                    return res.text();
                }).then(function (body) {
                    assert(body.indexOf('<svg') !== -1, want.file + ' body is SVG');
                    assert(body.indexOf('shape-rendering="crispEdges"') !== -1, want.file + ' is original pixel SVG');
                    assert(body.indexOf('<rect') !== -1, want.file + ' is drawn as pixel rects');
                    assert(body.toLowerCase().indexOf('kenney') === -1, want.file + ' is not a commercial pack');
                    assert(body.toLowerCase().indexOf('itch.io') === -1, want.file + ' is not an itch pack');
                });
            }));
        }).then(function () {
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
            assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        });
    });
});

EmberwoodTests.add('npcs: right-click Examine on NPCs logs a flavor sentence', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        world.engageTarget = null;
        world.talkTarget = null;
        if (world.clearWalk) {
            world.clearWalk();
        }
        if (win.Hud.hideContextMenu) {
            win.Hud.hideContextMenu();
        }
        if (win.Hud.hideDialogue) {
            win.Hud.hideDialogue();
        }
        assertEqual(spawn.x, 328, 'spawn x tile center');
        assertEqual(spawn.y, 248, 'spawn y tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assertEqual(win.Hud.mode, 'world', 'world mode');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(!world.cursors, 'WorldScene has no Phaser cursors');
        assertEqual(typeof win.examineNpcText, 'function', 'examineNpcText exists');
        assertEqual(typeof world.examineNpc, 'function', 'examineNpc exists');
        assertEqual(typeof world.longPressAt, 'function', 'longPressAt exists');

        var seen = {};
        var counted = 0;
        Object.keys(win.NPC_DEFS).forEach(function (zoneId) {
            (win.NPC_DEFS[zoneId] || []).forEach(function (def) {
                counted += 1;
                var line = win.examineNpcText(def);
                assert(line && line.length > 8, def.name + ' has a flavor sentence');
                assert(line.indexOf('.') !== -1, def.name + ' examine is a sentence');
                assert(!seen[line], def.name + ' examine is unique');
                seen[line] = def.name;
            });
        });
        assert(counted >= 11, 'every named NPC has examine text, n=' + counted);
        assertEqual(win.examineNpcText(win.NPC_DEFS.haven[0]), 'A scarred militia captain. He still drills the courtyard.', 'Bram examine text');
        assertEqual(win.examineNpcText(win.NPC_DEFS.haven[2]), 'A watchful town guard. He knows every path from the gate.', 'Rowan examine text');

        var bram = H.findNpc(win, 'guild');
        var rowan = H.findNpc(win, 'guard');
        assert(bram && rowan, 'Bram and Rowan are in Emberhaven');
        var bramLine = win.examineNpcText(bram.npcDef);
        var rowanLine = win.examineNpcText(rowan.npcDef);

        win.Hud.el.log.innerHTML = '';
        world.onClick({ worldX: bram.x, worldY: bram.y });
        assert(world.talkTarget === bram, 'left-click still targets Bram');
        assert(world.walkTarget, 'left-click still walks in');
        assertEqual(H.lastChat(win), '', 'left-click does not examine');
        if (world.clearWalk) {
            world.clearWalk();
        }
        world.talkTarget = null;

        var menu = win.document.getElementById('ctx-menu');
        assert(menu, 'ctx-menu element exists');
        win.Hud.hideContextMenu();
        world.onClick({
            worldX: bram.x,
            worldY: bram.y,
            button: 2,
            rightButtonDown: function () { return true; },
            event: { clientX: 48, clientY: 56 }
        });
        assert(!world.walkTarget, 'right-click NPC does not walk immediately');
        assert(world.talkTarget === null, 'right-click NPC does not talk-target');
        assert(!menu.hidden, 'right-click NPC opens context menu');
        var examBtn = menu.querySelector('[data-ctx="examine"]');
        var walkBtn = menu.querySelector('[data-ctx="walk-here"]');
        assert(examBtn, 'Examine action is listed');
        assertEqual(examBtn.textContent, 'Examine', 'Examine label');
        assert(!walkBtn, 'Walk here is not listed on an NPC');
        assert(!menu.querySelector('[data-ctx="talk"]'), 'Talk-to is not this tick');
        assert(!menu.querySelector('[data-ctx="trade"]'), 'Trade is not this tick');
        assert(!menu.querySelector('[data-ctx="bank"]'), 'Bank is not this tick');
        H.mouseClick(win, examBtn);
        assert(menu.hidden, 'Examine closes the menu');
        assertEqual(H.lastChat(win), bramLine, 'Examine menu logs Bram flavor');
        assert(!world.walkTarget, 'Examine menu does not walk');
        assert(!win.Hud.dialogueOpen(), 'Examine does not open dialogue');

        win.Hud.hideContextMenu();
        world.longPressAt(rowan.x, rowan.y, { clientX: 64, clientY: 72 });
        assert(!world.walkTarget, 'long-press NPC does not walk');
        assert(world.talkTarget === null, 'long-press NPC does not talk-target');
        assert(!menu.hidden, 'long-press NPC opens context menu');
        examBtn = menu.querySelector('[data-ctx="examine"]');
        assert(examBtn, 'long-press lists Examine');
        H.mouseClick(win, examBtn);
        assertEqual(H.lastChat(win), rowanLine, 'long-press Examine logs Rowan flavor');
        assert(!win.Hud.dialogueOpen(), 'long-press Examine does not open dialogue');

        world.encounterLock = true;
        world.onClick({
            worldX: bram.x,
            worldY: bram.y,
            button: 2,
            rightButtonDown: function () { return true; },
            event: { clientX: 48, clientY: 56 }
        });
        assert(menu.hidden, 'encounterLock ignores NPC right-click');
        world.longPressAt(bram.x, bram.y, { clientX: 48, clientY: 56 });
        assert(menu.hidden, 'encounterLock ignores NPC long-press');
        world.encounterLock = false;
        win.Hud.mode = 'battle';
        world.onClick({
            worldX: bram.x,
            worldY: bram.y,
            button: 2,
            rightButtonDown: function () { return true; },
            event: { clientX: 48, clientY: 56 }
        });
        assert(menu.hidden, 'battle mode ignores NPC right-click');
        win.Hud.mode = 'world';

        var destX = spawn.x - 64;
        var destY = spawn.y;
        if (world.clearWalk) {
            world.clearWalk();
        }
        win.Hud.hideContextMenu();
        world.onClick({
            worldX: destX,
            worldY: destY,
            button: 2,
            rightButtonDown: function () { return true; },
            event: { clientX: 48, clientY: 56 }
        });
        assert(!menu.hidden, 'ground right-click still opens a menu');
        assert(menu.querySelector('[data-ctx="walk-here"]'), 'ground still lists Walk here');
        win.Hud.hideContextMenu();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        assert(!win.document.getElementById('shop-overlay') || win.document.getElementById('shop-overlay').hidden, 'no shop UI');
        assert(!win.document.getElementById('bank-overlay') || win.document.getElementById('bank-overlay').hidden, 'no bank UI');
    });
});

EmberwoodTests.add('npcs: every NPC_DEFS entry spawns at xy with a yellow name label', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        var world = H.world(win);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        var counted = 0;
        var expectedTotal = 0;
        Object.keys(win.NPC_DEFS).forEach(function (zoneId) {
            expectedTotal += (win.NPC_DEFS[zoneId] || []).length;
        });
        assert(expectedTotal >= 11, 'NPC_DEFS has the eleven named characters');

        win.ZONE_LIST.forEach(function (zone) {
            H.enterZone(win, zone.id);
            world = H.world(win);
            H.setAutoAttack(win, false);
            var defs = win.NPC_DEFS[zone.id] || [];
            assertEqual(world.npcs.getChildren().length, defs.length, zone.id + ' spawned NPC count');
            defs.forEach(function (def) {
                counted += 1;
                var npc = H.findNpc(win, def.key);
                assert(npc, def.name + ' spawned in ' + zone.id);
                assertEqual(npc.npcDef.name, def.name, def.name + ' display name');
                assertEqual(Math.round(npc.x), def.x, def.name + ' x');
                assertEqual(Math.round(npc.y), def.y, def.name + ' y');
                var label = npc.nameLabel;
                assert(label, def.name + ' has a name label');
                assertEqual(label.text, def.name, def.name + ' label text');
                assertEqual(Math.round(label.x), def.x, def.name + ' label x');
                assertEqual(Math.round(label.y), def.y - 14, def.name + ' label sits above sprite');
                var color = String((label.style && (label.style.color || label.style.fill)) || '').toLowerCase();
                assertEqual(color, '#ffe08a', def.name + ' yellow label');
                assert(color !== '#ffb0a0', def.name + ' is not a salmon mob label');
                assert(world.floatLabels.indexOf(label) !== -1, def.name + ' label is in floatLabels');
                assert(label.active !== false && label.scene, def.name + ' label is live');
                assert(!win.game.input.keyboard, 'Phaser keyboard off after ' + def.name);
            });
        });
        assertEqual(counted, expectedTotal, 'every NPC_DEFS entry checked');

        H.enterZone(win, 'haven');
        world = H.world(win);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
        assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

function colliderList(world) {
    var colliders = world.physics && world.physics.world && world.physics.world.colliders;
    if (!colliders) {
        return [];
    }
    if (typeof colliders.getActive === 'function') {
        return colliders.getActive();
    }
    return colliders.list || colliders._active || [];
}

function findPlayerNpcCollider(world) {
    var list = colliderList(world);
    var i;
    for (i = 0; i < list.length; i++) {
        var c = list[i];
        if (!c) {
            continue;
        }
        var a = c.object1;
        var b = c.object2;
        if ((a === world.player && b === world.npcs) || (b === world.player && a === world.npcs)) {
            return c;
        }
    }
    return null;
}

function findMobGroundCollider(world, mob) {
    var list = colliderList(world);
    var i;
    for (i = 0; i < list.length; i++) {
        var c = list[i];
        if (!c) {
            continue;
        }
        var a = c.object1;
        var b = c.object2;
        if ((a === mob && b === world.ground) || (b === mob && a === world.ground)) {
            return c;
        }
    }
    return null;
}

function parkMobsOnly(world) {
    world.mobs.getChildren().forEach(function (mob) {
        if (mob.body) {
            mob.body.enable = false;
            mob.body.setVelocity(0, 0);
        }
    });
}

function shoveNpcWithKey(win, H, npc, dir) {
    var world = H.world(win);
    var name = npc.npcDef && npc.npcDef.name ? npc.npcDef.name : 'npc';
    var ox = npc.x;
    var oy = npc.y;
    var code;
    var key;
    var px = ox;
    var py = oy;
    var gap = 18;
    if (dir === 'east') {
        code = 'KeyD';
        key = 'd';
        px = ox - gap;
        py = oy;
    } else if (dir === 'west') {
        code = 'KeyA';
        key = 'a';
        px = ox + gap;
        py = oy;
    } else if (dir === 'south') {
        code = 'KeyS';
        key = 's';
        px = ox;
        py = oy - gap;
    } else {
        code = 'KeyW';
        key = 'w';
        px = ox;
        py = oy + gap;
    }
    world.npcs.getChildren().forEach(function (other) {
        if (other.body) {
            other.body.enable = other === npc;
            other.body.setVelocity(0, 0);
        }
    });
    parkMobsOnly(world);
    world.placePlayer(px, py);
    world.player.body.setVelocity(0, 0);
    world.clearWalk();
    world.exitLock = true;
    world.encounterLock = false;
    world.talkTarget = null;
    world.engageTarget = null;
    H.clearKeys(win);
    var startX = world.player.x;
    var startY = world.player.y;
    return H.holdKey(win, code, key, 400).then(function () {
        H.clearKeys(win);
        world = H.world(win);
        world.player.body.setVelocity(0, 0);
        assertEqual(npc.body.immovable, true, name + ' still immovable after shove');
        assert(Math.abs(npc.x - ox) < 1, name + ' x not shoved, dx=' + (npc.x - ox));
        assert(Math.abs(npc.y - oy) < 1, name + ' y not shoved, dy=' + (npc.y - oy));
        assertEqual(npc.body.velocity.x, 0, name + ' vx still 0');
        assertEqual(npc.body.velocity.y, 0, name + ' vy still 0');
        if (dir === 'east') {
            assert(world.player.x > startX, name + ' Keys.js D walked into the body');
            assert(world.player.x < npc.x, name + ' did not pass through east');
        } else if (dir === 'west') {
            assert(world.player.x < startX, name + ' Keys.js A walked into the body');
            assert(world.player.x > npc.x, name + ' did not pass through west');
        } else if (dir === 'south') {
            assert(world.player.y > startY, name + ' Keys.js S walked into the body');
            assert(world.player.y < npc.y, name + ' did not pass through south');
        } else {
            assert(world.player.y < startY, name + ' Keys.js W walked into the body');
            assert(world.player.y > npc.y, name + ' did not pass through north');
        }
        assert(!win.game.input.keyboard, 'Phaser keyboard off after shoving ' + name);
        world.npcs.getChildren().forEach(function (other) {
            if (other.body) {
                other.body.enable = true;
            }
        });
    });
}

EmberwoodTests.add('npcs: player-NPC arcade collider is immovable and does not shove NPCs', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        var world = H.world(win);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(world.player.body.immovable, false, 'player body is movable');

        var groupDefaults = world.npcs.defaults || {};
        assert(groupDefaults.immovable === true || groupDefaults.setImmovable === true, 'NPC physics group defaults immovable');
        var npcCollider = findPlayerNpcCollider(world);
        assert(npcCollider, 'player-NPC arcade collider exists');
        assertEqual(npcCollider.active, true, 'player-NPC collider is active');

        world.npcs.getChildren().forEach(function (npc) {
            var name = npc.npcDef && npc.npcDef.name ? npc.npcDef.name : 'npc';
            assert(npc.body, name + ' has an arcade body');
            assertEqual(npc.body.immovable, true, name + ' body is immovable');
            assertEqual(npc.body.moves, true, name + ' body still participates in collision');
            assertEqual(npc.body.velocity.x, 0, name + ' vx at rest');
            assertEqual(npc.body.velocity.y, 0, name + ' vy at rest');
        });

        world.mobs.getChildren().forEach(function (mob) {
            if (mob.body) {
                mob.body.enable = false;
                mob.body.setVelocity(0, 0);
            }
        });

        var rowan = H.findNpc(win, 'guard');
        var bram = H.findNpc(win, 'guild');
        assert(rowan, 'Guard Rowan spawned');
        assert(bram, 'Guildmaster Bram spawned');
        assertEqual(Math.round(rowan.x), 252, 'Rowan x');
        assertEqual(Math.round(rowan.y), 168, 'Rowan y');
        assertEqual(Math.round(bram.x), 210, 'Bram x');
        assertEqual(Math.round(bram.y), 150, 'Bram y');

        return shoveNpcWithKey(win, H, rowan, 'east').then(function () {
            return shoveNpcWithKey(win, H, bram, 'south');
        }).then(function () {
            H.enterZone(win, 'northwood');
            world = H.world(win);
            H.setAutoAttack(win, false);
            parkMobsOnly(world);
            npcCollider = findPlayerNpcCollider(world);
            assert(npcCollider && npcCollider.active, 'player-NPC collider survives enterZone');
            var kett = H.findNpc(win, 'ranger');
            assert(kett, 'Ranger Kett spawned');
            assertEqual(kett.body.immovable, true, 'Kett body is immovable');
            return shoveNpcWithKey(win, H, kett, 'east');
        }).then(function () {
            H.enterZone(win, 'haven');
            world = H.world(win);
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
            assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        });
    });
});

EmberwoodTests.add('npcs: idle facing and a tiny wander leash so they are not statues', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        var world = H.world(win);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.exitLock = true;
        world.encounterLock = false;
        world.clearWalk();
        world.engageTarget = null;
        world.talkTarget = null;
        world.dialogueNpc = null;
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(typeof world.wanderNpcs, 'function', 'wanderNpcs exists');
        assertEqual(typeof world.applyNpcFacing, 'function', 'applyNpcFacing exists');

        var groupDefaults = world.npcs.defaults || {};
        assert(groupDefaults.immovable === true || groupDefaults.setImmovable === true, 'NPC physics group defaults immovable');
        var npcCollider = findPlayerNpcCollider(world);
        assert(npcCollider && npcCollider.active, 'player-NPC arcade collider is active');

        var rowan = H.findNpc(win, 'guard');
        assert(rowan && rowan.body, 'Guard Rowan spawned');
        assertEqual(Math.round(rowan.x), 252, 'Rowan x');
        assertEqual(Math.round(rowan.y), 168, 'Rowan y');
        assertEqual(rowan.homeX, 252, 'Rowan homeX is spawn x');
        assertEqual(rowan.homeY, 168, 'Rowan homeY is spawn y');
        assertEqual(rowan.body.immovable, true, 'Rowan body is immovable');
        assertEqual(rowan.body.moves, true, 'Rowan body still participates in collision');
        assert(['down', 'left', 'right', 'up'].indexOf(rowan.lastFacing) !== -1, 'Rowan has an idle facing');
        assertEqual(rowan.flipX, rowan.lastFacing === 'right', 'spawn idle flipX matches lastFacing');

        parkMobsOnly(world);
        world.npcs.getChildren().forEach(function (npc) {
            if (npc !== rowan && npc.body) {
                npc.body.enable = false;
                npc.body.setVelocity(0, 0);
            }
        });
        rowan.body.setVelocity(0, 0);
        rowan.lastFacing = 'down';
        rowan.flipX = true;
        world.applyNpcFacing(rowan);
        assertEqual(rowan.flipX, false, 'idle down does not flipX');

        var orig = win.Phaser.Math.Between;
        try {
            var calls = [];
            win.Phaser.Math.Between = function (lo, hi) {
                calls.push([lo, hi]);
                return 1;
            };
            world.wanderNpcs();
            assertEqual(calls.length, 1, 'occasional roll happens once per enabled NPC');
            assertEqual(calls[0][0], 0, 'wander chance low is 0');
            assertEqual(calls[0][1], 80, 'wander chance high is 80');
            assertEqual(rowan.body.velocity.x, 0, 'no wander vx when roll is not 0');
            assertEqual(rowan.body.velocity.y, 0, 'no wander vy when roll is not 0');
            assertEqual(rowan.lastFacing, 'down', 'miss keeps idle facing');
            assertEqual(rowan.flipX, false, 'miss idle flipX stays down');

            var seq = [0, 8, 0];
            var i = 0;
            calls = [];
            win.Phaser.Math.Between = function (lo, hi) {
                calls.push([lo, hi]);
                var value = seq[i];
                i += 1;
                return value;
            };
            world.wanderNpcs();
            assertEqual(calls.length, 3, 'roll then vx then vy');
            assertEqual(calls[1][0], -12, 'vx low is -12');
            assertEqual(calls[1][1], 12, 'vx high is 12');
            assertEqual(calls[2][0], -12, 'vy low is -12');
            assertEqual(calls[2][1], 12, 'vy high is 12');
            assertEqual(Math.round(rowan.body.velocity.x), 8, 'small wander vx');
            assertEqual(Math.round(rowan.body.velocity.y), 0, 'small wander vy');
            assert(Math.abs(rowan.body.velocity.x) <= 12 && Math.abs(rowan.body.velocity.y) <= 12, 'wander velocity stays tiny');
            assertEqual(rowan.lastFacing, 'right', 'wander east sets idle facing right');
            assertEqual(rowan.flipX, true, 'right facing uses flipX');
            assertEqual(rowan.body.immovable, true, 'Rowan stays immovable while wandering');

            seq = [0, -8, 0];
            i = 0;
            world.wanderNpcs();
            assertEqual(Math.round(rowan.body.velocity.x), -8, 'small wander vx west');
            assertEqual(rowan.lastFacing, 'left', 'wander west sets idle facing left');
            assertEqual(rowan.flipX, false, 'left facing does not flipX');

            rowan.body.setVelocity(0, 0);
            rowan.body.reset(rowan.homeX + 24, rowan.homeY);
            rowan.setPosition(rowan.homeX + 24, rowan.homeY);
            calls = [];
            win.Phaser.Math.Between = function (lo, hi) {
                calls.push([lo, hi]);
                return 0;
            };
            world.wanderNpcs();
            assertEqual(calls.length, 0, 'leash pull does not roll a new wander');
            assert(rowan.body.velocity.x < 0, 'leash pulls back toward home x');
            assertEqual(Math.round(rowan.body.velocity.y), 0, 'leash pull along x has no vy');
            assert(Math.abs(rowan.body.velocity.x) <= 12, 'leash pull stays tiny');
            assertEqual(rowan.lastFacing, 'left', 'leash pull west keeps left facing');
            assertEqual(rowan.body.immovable, true, 'leash pull keeps the body immovable');

            rowan.body.setVelocity(0, 0);
            rowan.body.reset(rowan.homeX, rowan.homeY);
            rowan.setPosition(rowan.homeX, rowan.homeY);
            world.placePlayer(rowan.x - 18, rowan.y);
            world.player.body.setVelocity(0, 0);
            calls = [];
            win.Phaser.Math.Between = function (lo, hi) {
                calls.push([lo, hi]);
                return 0;
            };
            world.wanderNpcs();
            assertEqual(calls.length, 0, 'nearby player skips the wander roll');
            assertEqual(rowan.body.velocity.x, 0, 'nearby player does not wander vx');
            assertEqual(rowan.body.velocity.y, 0, 'nearby player does not wander vy');
            assertEqual(Math.round(rowan.x), 252, 'nearby player does not shove Rowan x');
            assertEqual(Math.round(rowan.y), 168, 'nearby player does not shove Rowan y');
            assertEqual(rowan.body.immovable, true, 'nearby player leaves Rowan immovable');
        } finally {
            win.Phaser.Math.Between = orig;
            world.npcs.getChildren().forEach(function (npc) {
                if (npc && npc.body) {
                    npc.body.enable = true;
                    npc.body.setVelocity(0, 0);
                }
            });
            world.mobs.getChildren().forEach(function (mob) {
                if (mob && mob.body && mob.mobDef) {
                    mob.body.enable = true;
                    mob.aliveMob = true;
                }
            });
        }

        H.enterZone(win, 'haven');
        world = H.world(win);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
        assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('npcs: talking never starts during battle or encounterLock', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        var world = H.world(win);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        var bram = H.findNpc(win, 'guild');
        assert(bram, 'Bram exists in Emberhaven');
        win.game.registry.set('quest', { id: 'goblins', stage: 3, progress: 5, goal: 5 });
        var gold = H.hero(win).gold;
        var xp = H.hero(win).xp;
        world.placePlayer(bram.x + 16, bram.y);
        world.player.body.setVelocity(0, 0);
        world.talkTarget = null;
        world.encounterLock = false;
        win.Hud.mode = 'world';
        world.refreshHud();

        world.scene.pause();
        try {
            var chatCount = H.chat(win).length;
            world.tryTalk(bram);
            assertEqual(H.chat(win).length, chatCount + 1, 'unlocked tryTalk still speaks');
            assertEqual(H.lastChat(win), 'Guildmaster Bram: Emberhaven stands because of you.', 'post-quest line when unlocked');
            assertEqual(H.quest(win).stage, 3, 'unlocked talk does not change stage 3');

            chatCount = H.chat(win).length;
            world.talkTarget = bram;
            world.encounterLock = true;
            world.tryTalk(bram);
            assertEqual(H.chat(win).length, chatCount, 'tryTalk is silent under encounterLock');
            assertEqual(world.talkTarget, bram, 'blocked tryTalk does not clear talkTarget');
            H.key(win, 'Space', ' ', 'keydown');
            assert(win.Keys.pressed.Space === true, 'Space is just-pressed via Keys.js under lock');
            world.update();
            assertEqual(H.chat(win).length, chatCount, 'Space update does not talk under encounterLock');
            H.key(win, 'Space', ' ', 'keyup');
            H.clearKeys(win);
            world.encounterLock = false;

            win.Hud.mode = 'battle';
            world.talkTarget = bram;
            world.tryTalk(bram);
            assertEqual(H.chat(win).length, chatCount, 'tryTalk is silent while Hud.mode is battle');
            H.key(win, 'Space', ' ', 'keydown');
            world.update();
            assertEqual(H.chat(win).length, chatCount, 'Space does not talk while Hud.mode is battle');
            H.key(win, 'Space', ' ', 'keyup');
            H.clearKeys(win);
            assertEqual(H.quest(win).stage, 3, 'battle/lock talk does not change quest');
            assertEqual(H.hero(win).gold, gold, 'battle/lock talk does not pay');
            assertEqual(H.hero(win).xp, xp, 'battle/lock talk does not grant XP');

            win.Hud.mode = 'world';
            world.encounterLock = false;
            world.talkTarget = null;
            world.tryTalk(bram);
            assertEqual(H.chat(win).length, chatCount + 1, 'tryTalk works again after unlock');
            assertEqual(H.lastChat(win), 'Guildmaster Bram: Emberhaven stands because of you.', 'post-quest line after unlock');
        } finally {
            H.clearKeys(win);
            win.Hud.mode = 'world';
            world.encounterLock = false;
            world.talkTarget = null;
            world.scene.resume();
        }

        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
        assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('mobs: click a monster to target it', function (win, H) {
    H.enterZone(win, 'haven');
    H.setAutoAttack(win, false);
    H.clearKeys(win);
    var world = H.world(win);
    var spawn = win.defaultWorldSpawn();
    var chicken = H.findMob(win, 'Chicken');
    assert(chicken, 'chicken exists in haven');
    assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
    assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
    assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
    world.scene.pause();
    try {
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.engageTarget = null;
        world.talkTarget = null;
        world.walkTarget = null;
        world.encounterLock = false;
        world.onClick({ worldX: chicken.x, worldY: chicken.y });
        assert(world.engageTarget === chicken, 'click targets chicken');
        assert(world.talkTarget === null, 'talkTarget stays clear');
        assert(world.walkTarget, 'click walks in toward the mob');
        assertEqual(Math.round(world.walkTarget.x), Math.round(chicken.x), 'walk x is chicken');
        assertEqual(Math.round(world.walkTarget.y), Math.round(chicken.y), 'walk y is chicken');
        assert(H.chatHas(win, 'You target the Chicken'), 'target chat');
        assert(world.marker.visible, 'yellow walk marker shows');
        world.update();
        assert(world.player.body.velocity.x > 10, 'walks east toward chicken from spawn');
        assert(!win.game.scene.isActive('BattleScene'), 'does not fight yet from spawn distance');

        chicken.aliveMob = false;
        world.engageTarget = null;
        world.walkTarget = null;
        world.onClick({ worldX: chicken.x, worldY: chicken.y });
        assert(world.engageTarget === null, 'dead mob is not engaged');
    } finally {
        chicken.aliveMob = true;
        world.scene.resume();
    }
});

EmberwoodTests.add('mobs: wander uses occasional small velocity and still collides with the ground', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.exitLock = true;
        world.encounterLock = false;
        world.clearWalk();
        world.engageTarget = null;
        world.talkTarget = null;
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(typeof world.wanderMobs, 'function', 'wanderMobs exists');

        return H.waitUntil(function () {
            var ready = H.livingMobs(win);
            if (ready.length < 2) {
                return false;
            }
            return ready.every(function (mob) {
                var hit = findMobGroundCollider(world, mob);
                return !!(hit && hit.active);
            });
        }, 800, 'mob-ground colliders become active').then(function () {
        var living = H.livingMobs(win);
        assert(living.length >= 2, 'haven has living chickens');
        living.forEach(function (mob) {
            var hit = findMobGroundCollider(world, mob);
            assert(hit && hit.active, (mob.mobDef && mob.mobDef.type) + ' has an active ground collider');
            assert(hit.object1 === world.ground || hit.object2 === world.ground, 'collider is the ground layer');
        });

        var chicken = H.findMob(win, 'Chicken');
        assert(chicken && chicken.body, 'chicken has a physics body');
        world.mobs.getChildren().forEach(function (mob) {
            if (mob !== chicken) {
                mob.aliveMob = false;
            }
        });
        chicken.body.setVelocity(0, 0);

        var orig = win.Phaser.Math.Between;
        try {
            var calls = [];
            win.Phaser.Math.Between = function (lo, hi) {
                calls.push([lo, hi]);
                return 1;
            };
            world.wanderMobs();
            assertEqual(calls.length, 1, 'occasional roll happens once per living mob');
            assertEqual(calls[0][0], 0, 'wander chance low is 0');
            assertEqual(calls[0][1], 80, 'wander chance high is 80');
            assertEqual(chicken.body.velocity.x, 0, 'no wander vx when roll is not 0');
            assertEqual(chicken.body.velocity.y, 0, 'no wander vy when roll is not 0');

            var seq = [0, 12, -7];
            var i = 0;
            calls = [];
            win.Phaser.Math.Between = function (lo, hi) {
                calls.push([lo, hi]);
                var value = seq[i];
                i += 1;
                return value;
            };
            world.wanderMobs();
            assertEqual(calls.length, 3, 'roll then vx then vy');
            assertEqual(calls[0][0], 0, 'chance low');
            assertEqual(calls[0][1], 80, 'chance high');
            assertEqual(calls[1][0], -20, 'vx low is -20');
            assertEqual(calls[1][1], 20, 'vx high is 20');
            assertEqual(calls[2][0], -20, 'vy low is -20');
            assertEqual(calls[2][1], 20, 'vy high is 20');
            assertEqual(Math.round(chicken.body.velocity.x), 12, 'small wander vx');
            assertEqual(Math.round(chicken.body.velocity.y), -7, 'small wander vy');
            assert(Math.abs(chicken.body.velocity.x) <= 20 && Math.abs(chicken.body.velocity.y) <= 20, 'wander velocity stays small');

            chicken.body.setVelocity(0, 0);
            chicken.aliveMob = false;
            i = 0;
            seq = [0, 15, 15];
            world.wanderMobs();
            assertEqual(chicken.body.velocity.x, 0, 'dead mob does not wander vx');
            assertEqual(chicken.body.velocity.y, 0, 'dead mob does not wander vy');
            chicken.aliveMob = true;
        } finally {
            win.Phaser.Math.Between = orig;
            chicken.aliveMob = true;
            world.mobs.getChildren().forEach(function (mob) {
                if (mob && mob.mobDef) {
                    mob.aliveMob = true;
                }
            });
        }

        world.npcs.getChildren().forEach(function (npc) {
            if (npc.body) {
                npc.body.enable = false;
                npc.body.setVelocity(0, 0);
            }
        });
        world.mobs.getChildren().forEach(function (mob) {
            if (mob !== chicken && mob.body) {
                mob.body.enable = false;
                mob.body.setVelocity(0, 0);
            }
        });

        var walkable = {};
        walkable[win.TILE.GRASS] = true;
        walkable[win.TILE.GRASS2] = true;
        walkable[win.TILE.PATH] = true;
        walkable[win.TILE.FLOWER] = true;
        var push = findCardinalPush(world.tileGrid, win.TILE.TREE, walkable);
        assert(push, 'found a stand tile beside TREE');
        var stand = win.tileCenter(push.stand.tx, push.stand.ty);
        chicken.body.enable = true;
        chicken.body.reset(stand.x, stand.y);
        chicken.setPosition(stand.x, stand.y);
        chicken.body.setVelocity(0, 0);
        var vx = 0;
        var vy = 0;
        if (push.dir.code === 'KeyD') {
            vx = 20;
        } else if (push.dir.code === 'KeyA') {
            vx = -20;
        } else if (push.dir.code === 'KeyS') {
            vy = 20;
        } else {
            vy = -20;
        }
        orig = win.Phaser.Math.Between;
        win.Phaser.Math.Between = function () {
            return 1;
        };
        chicken.body.setVelocity(vx, vy);
        return H.sleep(1000).then(function () {
            win.Phaser.Math.Between = orig;
            chicken.body.setVelocity(0, 0);
            var at = win.worldToTile(chicken.x, chicken.y);
            assert(!(at.tx === push.target.tx && at.ty === push.target.ty), 'chicken did not walk into TREE (' + at.tx + ',' + at.ty + ')');
            assert(Math.abs(chicken.x - stand.x) < 14, 'wander vx blocked by ground, dx=' + (chicken.x - stand.x));
            assert(Math.abs(chicken.y - stand.y) < 14, 'wander vy blocked by ground, dy=' + (chicken.y - stand.y));
            assert(findMobGroundCollider(world, chicken) && findMobGroundCollider(world, chicken).active, 'ground collider still active');
            H.enterZone(win, 'haven');
            world = H.world(win);
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
            assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        }).catch(function (err) {
            win.Phaser.Math.Between = orig;
            throw err;
        });
        });
    });
});

EmberwoodTests.add('combat: walking within 24px of engageTarget begins a fight', function (win, H) {
    return H.cleanupBattle(win).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        var chicken = H.findMob(win, 'Chicken');
        assert(chicken, 'chicken exists in haven');
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3.x');

        chicken.setPosition(400, 250);
        if (chicken.body) {
            chicken.body.setVelocity(0, 0);
        }
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.engageGrace = 0;
        world.encounterLock = false;
        world.engageTarget = null;
        world.talkTarget = null;
        world.walkTarget = null;
        var spawnDist = win.Phaser.Math.Distance.Between(world.player.x, world.player.y, chicken.x, chicken.y);
        assert(spawnDist > 24, 'chicken starts more than 24px from spawn');

        world.onClick({ worldX: chicken.x, worldY: chicken.y });
        assert(world.engageTarget === chicken, 'click sets engageTarget');
        assert(H.chatHas(win, 'You target the Chicken'), 'target chat');

        world.player.setPosition(chicken.x - 23, chicken.y);
        world.player.body.setVelocity(0, 0);
        world.engageTarget = null;
        world.engageGrace = 0;
        assertEqual(world.tryAutoEngage(), false, 'auto-attack off: no fight without engageTarget at 23px');
        assertEqual(world.encounterLock, false, 'no lock without engageTarget');
        assert(!win.game.scene.isActive('BattleScene'), 'BattleScene stays off without engageTarget');

        world.engageTarget = chicken;
        world.walkTarget = { x: chicken.x, y: chicken.y };
        world.player.setPosition(chicken.x - 24, chicken.y);
        world.player.body.setVelocity(90, 0);
        world.engageGrace = 0;
        var at24 = win.Phaser.Math.Distance.Between(world.player.x, world.player.y, chicken.x, chicken.y);
        assertEqual(at24, 24, 'fixture: exactly 24px');
        assertEqual(world.tryAutoEngage(), false, 'does not beginFight at exactly 24px');
        assertEqual(world.encounterLock, false, 'encounterLock stays off at 24px');
        assert(world.walkTarget, 'walk continues at 24px');
        assert(!win.game.scene.isActive('BattleScene'), 'no BattleScene at 24px');

        var shakeMs = null;
        var cam = world.cameras.main;
        var origShake = cam.shake.bind(cam);
        cam.shake = function (duration) {
            shakeMs = duration;
            return origShake.apply(cam, arguments);
        };

        world.player.setPosition(chicken.x - 23, chicken.y);
        world.player.body.setVelocity(90, 0);
        world.walkTarget = { x: chicken.x, y: chicken.y };
        world.engageGrace = 0;
        var at23 = win.Phaser.Math.Distance.Between(world.player.x, world.player.y, chicken.x, chicken.y);
        assertEqual(at23, 23, 'fixture: 23px is within 24');
        var t0 = Date.now();
        var started = world.tryAutoEngage();
        cam.shake = origShake;
        assertEqual(started, true, 'beginFight within 24px');
        assertEqual(world.encounterLock, true, 'encounterLock after beginFight');
        assertEqual(world.walkTarget, null, 'walk cancels on fight');
        assertEqual(Math.round(world.player.body.velocity.x), 0, 'body vx stops');
        assertEqual(Math.round(world.player.body.velocity.y), 0, 'body vy stops');
        assert(world.lastFought === chicken, 'lastFought is the engaged chicken');
        assertEqual(shakeMs, 220, 'camera shake duration 220ms');
        assert(cam.shakeEffect && cam.shakeEffect.isRunning, 'camera shake is running');
        var pending = win.game.registry.get('pendingEncounter');
        assert(pending && pending.enemies && pending.enemies[0], 'pendingEncounter set');
        assertEqual(pending.enemies[0].type, 'Chicken', 'pending foe is the Chicken');
        assert(!win.game.scene.isActive('BattleScene'), 'BattleScene waits for the 260ms delay');

        return H.waitUntil(function () {
            return win.game.scene.isActive('BattleScene');
        }, 1500, 'BattleScene after 260ms').then(function () {
            var elapsed = Date.now() - t0;
            assert(elapsed >= 200, 'BattleScene waits ~260ms (elapsed ' + elapsed + 'ms)');
            assertEqual(win.Hud.mode, 'battle', 'HUD switches to battle');
            return H.forceFlee(win);
        });
    });
});

EmberwoodTests.add('combat: auto-attack on engages nearest living mob within 20px after engageGrace', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, true);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        assertEqual(H.hero(win).autoAttack, true, 'auto-attack is on');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        var chickens = world.mobs.getChildren().filter(function (mob) {
            return mob.aliveMob && mob.mobDef && mob.mobDef.type === 'Chicken';
        });
        assert(chickens.length >= 2, 'haven has two living chickens');
        var near = chickens[0];
        var far = chickens[1];
        function parkChicken(mob, x, y) {
            mob.setPosition(x, y);
            mob.aliveMob = true;
            if (mob.body) {
                mob.body.setVelocity(0, 0);
            }
        }

        parkChicken(near, 500, 80);
        parkChicken(far, 520, 80);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.engageTarget = null;
        world.talkTarget = null;
        world.walkTarget = null;
        world.encounterLock = false;

        parkChicken(near, spawn.x + 20, spawn.y);
        parkChicken(far, spawn.x + 40, spawn.y);
        var at20 = win.Phaser.Math.Distance.Between(world.player.x, world.player.y, near.x, near.y);
        assertEqual(at20, 20, 'fixture: nearest living chicken is exactly 20px');
        world.engageGrace = world.time.now + 800;
        assertEqual(world.tryAutoEngage(), false, 'engageGrace blocks auto-attack at 20px');
        assertEqual(world.encounterLock, false, 'grace does not lock combat');

        world.player.setPosition(spawn.x + 1, spawn.y);
        world.player.body.setVelocity(0, 0);
        var duringGrace = win.Phaser.Math.Distance.Between(world.player.x, world.player.y, near.x, near.y);
        assertEqual(duringGrace, 19, 'fixture: 19px during grace');
        assertEqual(world.tryAutoEngage(), false, 'engageGrace blocks auto-attack even within 20px');
        assert(!win.game.scene.isActive('BattleScene'), 'no BattleScene during grace');

        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.engageGrace = 0;
        assertEqual(world.tryAutoEngage(), false, 'exactly 20px is outside auto-attack range');
        assertEqual(world.encounterLock, false, 'no lock at exactly 20px');

        near.aliveMob = false;
        near.setPosition(spawn.x + 10, spawn.y);
        if (near.body) {
            near.body.setVelocity(0, 0);
        }
        parkChicken(far, spawn.x + 40, spawn.y);
        world.engageGrace = 0;
        assertEqual(world.tryAutoEngage(), false, 'dead nearer mob is not engaged');
        parkChicken(near, spawn.x + 10, spawn.y);
        parkChicken(far, spawn.x + 19, spawn.y);
        near.aliveMob = true;
        var nearD = win.Phaser.Math.Distance.Between(world.player.x, world.player.y, near.x, near.y);
        var farD = win.Phaser.Math.Distance.Between(world.player.x, world.player.y, far.x, far.y);
        assertEqual(nearD, 10, 'fixture: nearer living chicken at 10px');
        assertEqual(farD, 19, 'fixture: farther living chicken still within 20px');
        world.engageGrace = 0;
        world.engageTarget = null;
        var started = world.tryAutoEngage();
        assertEqual(started, true, 'auto-attack begins fight within 20px after grace');
        assertEqual(world.encounterLock, true, 'encounterLock after auto-attack');
        assert(world.lastFought === near, 'picks the nearest living mob, not the farther one');
        var pending = win.game.registry.get('pendingEncounter');
        assert(pending && pending.enemies && pending.enemies[0], 'pendingEncounter set');
        assertEqual(pending.enemies[0].type, 'Chicken', 'pending foe is the nearest Chicken');

        return H.waitUntil(function () {
            return win.game.scene.isActive('BattleScene');
        }, 1500, 'BattleScene after auto-attack').then(function () {
            assertEqual(win.Hud.mode, 'battle', 'HUD switches to battle');
            return H.forceFlee(win);
        }).then(function () {
            world = H.world(win);
            H.setAutoAttack(win, true);
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
            assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        });
    });
});

EmberwoodTests.add('combat: engageGrace is ~800ms on zone enter and ~700ms after battle', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.setAutoAttack(win, true);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        world.enterZone('haven', null);
        world.exitLock = false;
        world.encounterLock = false;
        var remainingEnter = world.engageGrace - world.time.now;
        assert(remainingEnter >= 780 && remainingEnter <= 800, 'zone enter grace ~800ms (got ' + remainingEnter + 'ms)');

        var chicken = H.findMob(win, 'Chicken');
        assert(chicken && chicken.aliveMob, 'living chicken in haven');
        chicken.setPosition(spawn.x + 10, spawn.y);
        if (chicken.body) {
            chicken.body.setVelocity(0, 0);
        }
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.engageTarget = null;
        world.talkTarget = null;
        world.walkTarget = null;
        var dist = win.Phaser.Math.Distance.Between(world.player.x, world.player.y, chicken.x, chicken.y);
        assertEqual(dist, 10, 'fixture: living chicken at 10px');
        assertEqual(H.hero(win).autoAttack, true, 'auto-attack is on');
        assertEqual(world.tryAutoEngage(), false, 'zone-enter grace blocks auto-attack at 10px');
        assert(!win.game.scene.isActive('BattleScene'), 'no BattleScene during zone-enter grace');

        win.game.registry.set('battleOutcome', null);
        world.wake();
        var remainingWake = world.engageGrace - world.time.now;
        assert(remainingWake >= 680 && remainingWake <= 700, 'wake grace ~700ms (got ' + remainingWake + 'ms)');
        assertEqual(world.encounterLock, false, 'wake clears encounterLock');
        assertEqual(world.tryAutoEngage(), false, 'post-battle grace blocks auto-attack at 10px');
        assert(!win.game.scene.isActive('BattleScene'), 'no BattleScene during post-battle grace');

        return H.startFight(win, chicken).then(function () {
            assertEqual(win.Hud.mode, 'battle', 'HUD in battle');
            return H.forceFlee(win);
        }).then(function () {
            world = H.world(win);
            var remainingFlee = world.engageGrace - world.time.now;
            assert(remainingFlee > 700, 'flee wake extends grace past the 700ms battle return (' + remainingFlee + 'ms)');
            assert(remainingFlee <= 1100, 'flee wake grace is at most 1100ms (got ' + remainingFlee + 'ms)');
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            chicken.setPosition(spawn.x + 10, spawn.y);
            if (chicken.body) {
                chicken.body.setVelocity(0, 0);
            }
            world.engageTarget = null;
            assertEqual(world.tryAutoEngage(), false, 'returning from battle blocks auto-attack');
            assertEqual(Math.round(world.player.x), 328, 'at spawn x');
            assertEqual(Math.round(world.player.y), 248, 'at spawn y');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        });
    });
});

EmberwoodTests.add('combat: after flee player is pushed off the mob and engageGrace blocks auto-attack', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, true);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        assertEqual(H.hero(win).autoAttack, true, 'auto-attack is on');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        var chickens = world.mobs.getChildren().filter(function (mob) {
            return mob.aliveMob && mob.mobDef && mob.mobDef.type === 'Chicken';
        });
        assert(chickens.length >= 2, 'haven has two living chickens');
        var near = chickens[0];
        var far = chickens[1];
        function parkChicken(mob, x, y) {
            mob.setPosition(x, y);
            mob.aliveMob = true;
            if (mob.body) {
                mob.body.setVelocity(0, 0);
            }
        }
        parkChicken(near, spawn.x + 10, spawn.y);
        parkChicken(far, spawn.x + 80, spawn.y);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.engageTarget = null;
        world.talkTarget = null;
        world.walkTarget = null;
        world.encounterLock = false;
        world.engageGrace = 0;
        var before = win.Phaser.Math.Distance.Between(world.player.x, world.player.y, near.x, near.y);
        assertEqual(before, 10, 'fixture: living chicken at 10px before fight');

        return H.startFight(win, near).then(function () {
            assertEqual(win.Hud.mode, 'battle', 'HUD in battle');
            return H.forceFlee(win);
        }).then(function () {
            world = H.world(win);
            H.setAutoAttack(win, true);
            var dist = win.Phaser.Math.Distance.Between(world.player.x, world.player.y, near.x, near.y);
            assert(dist > 20, 'flee pushes the player outside auto-attack range (got ' + dist + 'px)');
            assert(dist >= 28, 'flee knockback is at least a tile-and-a-half (got ' + dist + 'px)');
            var remaining = world.engageGrace - world.time.now;
            assert(remaining > 700, 'flee extends engageGrace past 700ms (got ' + remaining + 'ms)');
            assert(remaining <= 1100, 'flee grace is at most 1100ms (got ' + remaining + 'ms)');
            assertEqual(world.tryAutoEngage(), false, 'grace blocks auto-attack right after flee');
            assert(!win.game.scene.isActive('BattleScene'), 'no instant re-aggro during grace');

            world.engageGrace = 0;
            assertEqual(world.tryAutoEngage(), false, 'pushed distance still blocks auto-attack after grace');
            assertEqual(world.encounterLock, false, 'no lock while standing off the mob');
            assert(!win.game.scene.isActive('BattleScene'), 'no BattleScene from distance after flee');

            world.placePlayer(near.x - 10, near.y);
            world.player.body.setVelocity(0, 0);
            world.engageGrace = world.time.now + 1100;
            var close = win.Phaser.Math.Distance.Between(world.player.x, world.player.y, near.x, near.y);
            assertEqual(close, 10, 'fixture: 10px during extended grace');
            assertEqual(world.tryAutoEngage(), false, 'extended grace still blocks a 10px stand');
            assertEqual(Math.round(world.player.x), 328, 'spawn-relative park stays on courtyard x');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        });
    }).catch(function (err) {
        return H.cleanupBattle(win).then(function () {
            throw err;
        });
    });
});

EmberwoodTests.add('combat: auto-attack off does not engage unless the player clicked that mob', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        assertEqual(H.hero(win).autoAttack, false, 'auto-attack is off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        var chicken = H.findMob(win, 'Chicken');
        assert(chicken && chicken.aliveMob, 'living chicken in haven');
        chicken.setPosition(spawn.x + 10, spawn.y);
        if (chicken.body) {
            chicken.body.setVelocity(0, 0);
        }
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.engageTarget = null;
        world.talkTarget = null;
        world.walkTarget = null;
        world.encounterLock = false;
        world.engageGrace = 0;

        var dist = win.Phaser.Math.Distance.Between(world.player.x, world.player.y, chicken.x, chicken.y);
        assertEqual(dist, 10, 'fixture: living mob within 20px');
        assertEqual(world.engageTarget, null, 'no engageTarget (player did not click the mob)');
        assertEqual(world.tryAutoEngage(), false, 'auto-attack off does not engage');
        assertEqual(world.encounterLock, false, 'no encounterLock');
        assert(!win.game.scene.isActive('BattleScene'), 'no BattleScene');
        assertEqual(win.Hud.mode, 'world', 'HUD stays in world');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('combat: Attack auto-hits the only foe and winning loots', function (win, H) {
    H.enterZone(win, 'haven');
    H.setAutoAttack(win, false);
    var chicken = H.findMob(win, 'Chicken');
    var gold = H.hero(win).gold;
    var bonesBefore = (H.hero(win).inventory.filter(function (s) { return s.id === 'bones'; })[0] || { qty: 0 }).qty;
    return H.startFight(win, chicken).then(function () {
        var battle = H.battle(win);
        assertEqual(battle.enemies.length, 1, 'one enemy');
        assertEqual(battle.targetIndex, 0, 'auto-selected');
        assertMatch(win.document.getElementById('battle-message').textContent, 'Chicken', 'turn names chicken');
        win.Hud.tryAttack();
        return H.waitWorld(win);
    }).then(function () {
        assert(H.chatHas(win, 'collapses'), 'win chat');
        assert(H.chatHas(win, 'Loot drops'), 'drop chat');
        assertEqual(H.hero(win).gold, gold, 'gold waits on the ground');
        var bones = (H.hero(win).inventory.filter(function (s) { return s.id === 'bones'; })[0] || { qty: 0 }).qty;
        assertEqual(bones, bonesBefore, 'bones wait on the ground');
        assert((H.world(win).groundLoot || []).length >= 2, 'coins and bones spawned');
        H.pickupAllLoot(win);
        assert(H.hero(win).gold > gold, 'gold looted after pickup');
        bones = (H.hero(win).inventory.filter(function (s) { return s.id === 'bones'; })[0] || { qty: 0 }).qty;
        assert(bones > bonesBefore, 'bones looted after pickup');
        assert(H.chatHas(win, 'You pick up'), 'pickup chat');
        assert(!chicken.aliveMob, 'chicken despawned');
    });
});

EmberwoodTests.add('loot: gold and bones stay on the ground until pickup', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.setAutoPickup(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.clearLoot();
        world.encounterLock = false;
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(H.hero(win).autoPickup, false, 'auto-pickup off so wake cannot vacuum');

        var chicken = H.findMob(win, 'Chicken');
        assert(chicken && chicken.aliveMob, 'living chicken in haven');
        var feetX = chicken.x;
        var feetY = chicken.y;
        var dropGold = chicken.mobDef.gold;
        var gold = H.hero(win).gold;
        var coinsBefore = (H.hero(win).inventory.filter(function (s) { return s.id === 'coins'; })[0] || { qty: 0 }).qty;
        var bonesBefore = (H.hero(win).inventory.filter(function (s) { return s.id === 'bones'; })[0] || { qty: 0 }).qty;
        var hudGold = win.document.getElementById('hud-gold').textContent;
        assertEqual(Number(hudGold), gold, 'HUD gold matches hero before fight');

        return H.startFight(win, chicken).then(function () {
            return H.attackUntilWorld(win);
        }).then(function () {
            assert(H.chatHas(win, 'Loot drops'), 'win drop chat');
            assertEqual(H.hero(win).gold, gold, 'gold waits on the ground');
            assertEqual((H.hero(win).inventory.filter(function (s) { return s.id === 'coins'; })[0] || { qty: 0 }).qty, coinsBefore, 'coin stack waits on the ground');
            assertEqual((H.hero(win).inventory.filter(function (s) { return s.id === 'bones'; })[0] || { qty: 0 }).qty, bonesBefore, 'bones wait on the ground');
            assertEqual(win.document.getElementById('hud-gold').textContent, hudGold, 'HUD gold waits on the ground');
            var live = H.assertLootAtFeet(win, feetX, feetY, ['coins', 'bones', 'shrimp']);
            var coins = live.filter(function (drop) { return drop.id === 'coins'; })[0];
            var bonesDrop = live.filter(function (drop) { return drop.id === 'bones'; })[0];
            assertEqual(coins.qty, dropGold, 'ground coins match mob gold');
            assertEqual(bonesDrop.qty, 1, 'ground bones qty 1');
            assert(!chicken.aliveMob, 'chicken despawned');
            assertEqual(Math.round(H.world(win).player.x), 328, 'player still at spawn x (not on the pile)');
            assertEqual(Math.round(H.world(win).player.y), 248, 'player still at spawn y');

            H.pickupAllLoot(win);
            assertEqual(H.hero(win).gold, gold + dropGold, 'gold looted after pickup');
            assertEqual((H.hero(win).inventory.filter(function (s) { return s.id === 'coins'; })[0] || { qty: 0 }).qty, coinsBefore + dropGold, 'coin stack after pickup');
            assertEqual((H.hero(win).inventory.filter(function (s) { return s.id === 'bones'; })[0] || { qty: 0 }).qty, bonesBefore + 1, 'bones looted after pickup');
            assertEqual(win.document.getElementById('hud-gold').textContent, String(gold + dropGold), 'HUD gold after pickup');
            assert(H.chatHas(win, 'You pick up'), 'pickup chat');
            assertEqual(H.lootLive(win).length, 0, 'ground pile taken');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        });
    });
});

EmberwoodTests.add('combat: dead overworld mob hides ~18s then respawns in place', function (win, H) {
    function clockBags(clock) {
        return [clock._active, clock._pendingInsertion, clock.list].filter(function (bag) {
            return bag && (bag.length || bag.size);
        });
    }

    function findRespawnTimer(clock) {
        var bags = clockBags(clock);
        for (var i = 0; i < bags.length; i++) {
            var bag = bags[i];
            var list = typeof bag.forEach === 'function' && !Array.isArray(bag)
                ? (function (set) {
                    var out = [];
                    set.forEach(function (item) { out.push(item); });
                    return out;
                }(bag))
                : Array.prototype.slice.call(bag);
            for (var j = 0; j < list.length; j++) {
                if (list[j] && list[j].delay === 18000) {
                    return list[j];
                }
            }
        }
        return null;
    }

    function remainingOf(timer) {
        if (timer.getRemaining) {
            return timer.getRemaining();
        }
        return timer.delay - (timer.elapsed || 0);
    }

    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        var chicken = H.findMob(win, 'Chicken');
        assert(chicken && chicken.aliveMob, 'living chicken in haven');
        var atX = chicken.x;
        var atY = chicken.y;
        assertEqual(chicken.visible, true, 'living body visible');
        assertEqual(chicken.body.enable, true, 'living body enabled');
        assert(chicken.nameLabel, 'living name label exists');
        assertEqual(chicken.nameLabel.visible, true, 'living label visible');

        return H.startFight(win, chicken).then(function () {
            win.Hud.tryAttack();
            return H.waitWorld(win);
        }).then(function () {
            world = H.world(win);
            assertEqual(chicken.aliveMob, false, 'dead mob flagged');
            assertEqual(chicken.visible, false, 'dead body hidden');
            assertEqual(chicken.body.enable, false, 'dead body disabled');
            assertEqual(chicken.nameLabel.visible, false, 'dead label hidden');
            assertEqual(Math.round(chicken.x), Math.round(atX), 'stays at death x');
            assertEqual(Math.round(chicken.y), Math.round(atY), 'stays at death y');

            var timer = findRespawnTimer(world.time);
            assert(timer, '18000ms respawn timer is queued');
            var remain = remainingOf(timer);
            assert(remain > 16000 && remain <= 18000, '~18s remaining (got ' + remain + 'ms)');

            world.time.update(world.time.now, remain - 400);
            assertEqual(chicken.aliveMob, false, 'still hidden ~400ms before respawn');
            assertEqual(chicken.visible, false, 'body still hidden before 18s');
            assertEqual(chicken.body.enable, false, 'body still disabled before 18s');
            assertEqual(chicken.nameLabel.visible, false, 'label still hidden before 18s');

            world.time.update(world.time.now, 800);
            assertEqual(chicken.aliveMob, true, 'respawned alive');
            assertEqual(chicken.visible, true, 'body re-enabled');
            assertEqual(chicken.body.enable, true, 'physics body re-enabled');
            assertEqual(chicken.nameLabel.visible, true, 'label re-enabled');
            assertEqual(Math.round(chicken.x), Math.round(atX), 'respawned in place x');
            assertEqual(Math.round(chicken.y), Math.round(atY), 'respawned in place y');
            assertEqual(Math.round(world.player.x), 328, 'player still at spawn x');
            assertEqual(Math.round(world.player.y), 248, 'player still at spawn y');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        });
    });
});

EmberwoodTests.add('world: persist mob alive/dead/respawn timers when leaving a zone and returning', function (win, H) {
    function clockBags(clock) {
        return [clock._active, clock._pendingInsertion, clock.list].filter(function (bag) {
            return bag && (bag.length || bag.size);
        });
    }

    function findRespawnTimer(clock, delay) {
        var bags = clockBags(clock);
        for (var i = 0; i < bags.length; i++) {
            var bag = bags[i];
            var list = typeof bag.forEach === 'function' && !Array.isArray(bag)
                ? (function (set) {
                    var out = [];
                    set.forEach(function (item) { out.push(item); });
                    return out;
                }(bag))
                : Array.prototype.slice.call(bag);
            for (var j = 0; j < list.length; j++) {
                if (list[j] && list[j].delay === delay) {
                    return list[j];
                }
            }
        }
        return null;
    }

    function remainingOf(timer) {
        if (timer.getRemaining) {
            return timer.getRemaining();
        }
        return timer.delay - (timer.elapsed || 0);
    }

    function mobById(world, id) {
        var kids = world.mobs.getChildren();
        for (var i = 0; i < kids.length; i++) {
            if (kids[i].mobDef && kids[i].mobDef.id === id) {
                return kids[i];
            }
        }
        return null;
    }

    function livingCount(world, type) {
        return world.mobs.getChildren().filter(function (mob) {
            return mob.aliveMob && (!type || (mob.mobDef && mob.mobDef.type === type));
        }).length;
    }

    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        var chicken = H.findMob(win, 'Chicken');
        assert(chicken && chicken.aliveMob, 'living chicken in haven');
        var chickenId = chicken.mobDef.id;
        var otherId = world.mobs.getChildren().filter(function (mob) {
            return mob.mobDef && mob.mobDef.id !== chickenId;
        })[0].mobDef.id;
        var atX = chicken.x;
        var atY = chicken.y;
        assertEqual(livingCount(world, 'Chicken'), 2, 'both haven chickens start alive');

        return H.startFight(win, chicken).then(function () {
            win.Hud.tryAttack();
            return H.waitWorld(win);
        }).then(function () {
            world = H.world(win);
            assertEqual(chicken.aliveMob, false, 'dead mob flagged');
            assertEqual(chicken.visible, false, 'dead body hidden');
            assertEqual(chicken.body.enable, false, 'dead body disabled');
            var timer = findRespawnTimer(world.time, 18000);
            assert(timer, 'in-zone 18000ms respawn timer is queued');
            var remain = remainingOf(timer);
            assert(remain > 16000 && remain <= 18000, '~18s remaining after death (got ' + remain + 'ms)');

            world.time.update(world.time.now, 5000);
            assertEqual(chicken.aliveMob, false, 'still dead after 5s in-zone');
            var remainAfter5 = remainingOf(timer);
            assert(remainAfter5 > 10000 && remainAfter5 < 14000, 'about 13s left after 5s (got ' + remainAfter5 + 'ms)');

            var oldChicken = chicken;
            world.enterZone('northwood', 'n');
            world = H.world(win);
            assertEqual(world.zoneId, 'northwood', 'walk-enter Northwood');
            assert(isDestroyedGo(oldChicken), 'old haven chicken sprite is destroyed');
            assert(H.findMob(win, 'Goblin') && H.findMob(win, 'Goblin').aliveMob, 'Northwood goblins spawn alive');
            assertEqual(livingCount(world, 'Goblin'), (win.MOB_DEFS.northwood || []).length, 'all Northwood goblins alive');
            timer = findRespawnTimer(world.time, 18000);
            assert(timer, 'haven respawn timer keeps running while away');
            assert(remainingOf(timer) > 10000 && remainingOf(timer) < 14000, 'away remaining still ~13s (got ' + remainingOf(timer) + 'ms)');

            world.enterZone('haven', 's');
            world = H.world(win);
            assertEqual(world.zoneId, 'haven', 'walk-return Emberhaven');
            chicken = mobById(world, chickenId);
            var other = mobById(world, otherId);
            assert(chicken, 'same chicken id restored');
            assertEqual(chicken.aliveMob, false, 'returned chicken stays dead (not a full respawn)');
            assertEqual(chicken.visible, false, 'returned dead body hidden');
            assertEqual(chicken.body.enable, false, 'returned dead body disabled');
            assert(chicken.nameLabel && chicken.nameLabel.visible === false, 'returned dead label hidden');
            assertEqual(Math.round(chicken.x), Math.round(atX), 'dead chicken stays at death x');
            assertEqual(Math.round(chicken.y), Math.round(atY), 'dead chicken stays at death y');
            assert(other && other.aliveMob, 'unkilled chicken still alive');
            timer = chicken.respawnTimer || findRespawnTimer(world.time, 18000);
            assert(timer, 'persisted respawn timer is still queued');
            var remainBack = remainingOf(timer);
            assert(remainBack > 10000 && remainBack < 14000, 'respawn timer did not reset to 18s (got ' + remainBack + 'ms)');

            world.time.update(world.time.now, remainBack - 400);
            assertEqual(chicken.aliveMob, false, 'still hidden ~400ms before persisted respawn');

            world.time.update(world.time.now, 800);
            assertEqual(chicken.aliveMob, true, 'persisted timer respawned in place');
            assertEqual(chicken.visible, true, 'body visible after persisted respawn');
            assertEqual(chicken.body.enable, true, 'body enabled after persisted respawn');
            assertEqual(chicken.nameLabel.visible, true, 'label visible after persisted respawn');
            assertEqual(Math.round(chicken.x), Math.round(atX), 'respawned in place x');
            assertEqual(Math.round(chicken.y), Math.round(atY), 'respawned in place y');

            return H.startFight(win, chicken);
        }).then(function () {
            win.Hud.tryAttack();
            return H.waitWorld(win);
        }).then(function () {
            world = H.world(win);
            chicken = mobById(world, chickenId);
            assertEqual(chicken.aliveMob, false, 'chicken dead again');
            world.enterZone('northwood', 'n');
            world = H.world(win);
            world.time.update(world.time.now, 18000);
            world.enterZone('haven', 's');
            world = H.world(win);
            chicken = mobById(world, chickenId);
            assert(chicken && chicken.aliveMob, 'timer elapsed while away, chicken is alive on return');
            assertEqual(chicken.visible, true, 'elapsed-away body visible');
            assertEqual(chicken.body.enable, true, 'elapsed-away body enabled');
            assertEqual(Math.round(chicken.x), Math.round(atX), 'elapsed-away respawn in place x');
            assertEqual(Math.round(chicken.y), Math.round(atY), 'elapsed-away respawn in place y');
            assertEqual(livingCount(world, 'Chicken'), 2, 'both chickens alive after away-timer');
            world.placePlayer(spawn.x, spawn.y);
            assertEqual(Math.round(world.player.x), 328, 'player can stand at spawn x');
            assertEqual(Math.round(world.player.y), 248, 'player can stand at spawn y');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        });
    });
});

EmberwoodTests.add('combat: Accurate Attack XP, Aggressive Strength XP, Defensive Defence XP on win', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        world.placePlayer(spawn.x, spawn.y);
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assertEqual(win.combatSkill({ style: 'accurate' }), 'attack', 'Accurate maps to Attack');
        assertEqual(win.combatSkill({ style: 'aggressive' }), 'strength', 'Aggressive maps to Strength');
        assertEqual(win.combatSkill({ style: 'defensive' }), 'defence', 'Defensive maps to Defence');

        var styles = [
            { style: 'accurate', skill: 'attack', others: ['strength', 'defence'] },
            { style: 'aggressive', skill: 'strength', others: ['attack', 'defence'] },
            { style: 'defensive', skill: 'defence', others: ['attack', 'strength'] }
        ];

        function winWithStyle(row) {
            return H.cleanupBattle(win).then(function () {
                H.enterZone(win, 'haven');
                H.setAutoAttack(win, false);
                var hero = win.makeHero();
                win.game.registry.set('hero', hero);
                world.refreshHud();
                world.placePlayer(spawn.x, spawn.y);
                H.click(win, '#tab-bar button[data-tab="combat"]');
                H.click(win, '#style-row button[data-style="' + row.style + '"]');
                hero = H.hero(win);
                assertEqual(hero.style, row.style, row.style + ' style selected');
                assertEqual(hero.skills.attack.xp, 0, row.style + ' Attack starts 0');
                assertEqual(hero.skills.strength.xp, 0, row.style + ' Strength starts 0');
                assertEqual(hero.skills.defence.xp, 0, row.style + ' Defence starts 0');
                assertEqual(hero.skills.hitpoints.xp, 1154, row.style + ' Hitpoints starts 1154');
                assertEqual(hero.xp, 0, row.style + ' combat XP starts 0');
                var chicken = H.findMob(win, 'Chicken');
                var xp = chicken.mobDef.xp || 10;
                var hpXp = Math.max(1, Math.ceil(xp / 3));
                return H.startFight(win, chicken).then(function () {
                    var battle = H.battle(win);
                    assertEqual(battle.enemies.length, 1, row.style + ' one foe');
                    win.Hud.tryAttack();
                    return H.waitWorld(win);
                }).then(function () {
                    hero = H.hero(win);
                    assertEqual(hero.style, row.style, row.style + ' style persisted through win');
                    assertEqual(win.combatSkill(hero), row.skill, row.style + ' still maps to ' + row.skill);
                    assertEqual(hero.skills[row.skill].xp, xp, row.style + ' grants ' + row.skill + ' XP');
                    row.others.forEach(function (id) {
                        assertEqual(hero.skills[id].xp, 0, row.style + ' does not grant ' + id + ' XP');
                    });
                    assertEqual(hero.skills.hitpoints.xp, 1154 + hpXp, row.style + ' still grants Hitpoints XP');
                    assertEqual(hero.xp, xp, row.style + ' grants combat XP');
                    assert(H.chatHas(win, 'collapses'), row.style + ' win chat');
                    assert(!win.game.input.keyboard, 'Phaser keyboard still off');
                });
            });
        }

        return winWithStyle(styles[0])
            .then(function () { return winWithStyle(styles[1]); })
            .then(function () { return winWithStyle(styles[2]); })
            .then(function () {
                H.enterZone(win, 'haven');
            });
    }).catch(function (err) {
        return H.cleanupBattle(win).then(function () {
            throw err;
        });
    });
});

EmberwoodTests.add('combat: Accurate Attack XP, Aggressive Strength XP, Defensive Defence XP from hits', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        world.placePlayer(spawn.x, spawn.y);
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assertEqual(typeof win.styleHitXp, 'function', 'styleHitXp exists');
        assertEqual(typeof win.hitpointsHitXp, 'function', 'hitpointsHitXp exists');
        assertEqual(win.styleHitXp(4, 12, 12), 4, 'chicken one-shot is full mob XP');
        assertEqual(win.styleHitXp(12, 16, 80), 2, 'goblin 16/80 is 2 XP');
        assertEqual(win.styleHitXp(12, 1, 80), 1, 'successful hit is at least 1 XP');
        assertEqual(win.hitpointsHitXp(12, 16, 80), 1, 'goblin 16/80 Hitpoints is ceil(2/3) min 1');
        assertEqual(win.combatSkill({ style: 'accurate' }), 'attack', 'Accurate maps to Attack');
        assertEqual(win.combatSkill({ style: 'aggressive' }), 'strength', 'Aggressive maps to Strength');
        assertEqual(win.combatSkill({ style: 'defensive' }), 'defence', 'Defensive maps to Defence');

        var styles = [
            { style: 'accurate', skill: 'attack', others: ['strength', 'defence'] },
            { style: 'aggressive', skill: 'strength', others: ['attack', 'defence'] },
            { style: 'defensive', skill: 'defence', others: ['attack', 'strength'] }
        ];
        var foeSpec = { type: 'Goblin', texture: 'slime', tint: 0x5aa33a, hp: 80, damage: 1, gold: 0, xp: 12 };
        var hitXp = win.styleHitXp(12, 16, 80);
        var hpHitXp = win.hitpointsHitXp(12, 16, 80);

        function hitWithStyle(row) {
            var hero;
            return H.cleanupBattle(win).then(function () {
                H.enterZone(win, 'haven');
                H.setAutoAttack(win, false);
                hero = win.makeHero();
                hero.autoAttack = false;
                hero.autoRetaliate = false;
                hero.style = row.style;
                win.game.registry.set('hero', hero);
                world.refreshHud();
                world.placePlayer(spawn.x, spawn.y);
                H.setAutoAttack(win, false);
                H.setAutoRetaliate(win, false);
                H.click(win, '#tab-bar button[data-tab="combat"]');
                H.click(win, '#style-row button[data-style="' + row.style + '"]');
                hero = H.hero(win);
                assertEqual(hero.style, row.style, row.style + ' style selected');
                assertEqual(hero.skills.attack.xp, 0, row.style + ' Attack starts 0');
                assertEqual(hero.skills.strength.xp, 0, row.style + ' Strength starts 0');
                assertEqual(hero.skills.defence.xp, 0, row.style + ' Defence starts 0');
                assertEqual(hero.skills.hitpoints.xp, 1154, row.style + ' Hitpoints starts 1154');
                assertEqual(hero.xp, 0, row.style + ' combat XP starts 0');
                return H.startCustomFight(win, [foeSpec]);
            }).then(function () {
                var battle = H.battle(win);
                var you = battle.heroes[0];
                var foe = battle.enemies[0];
                assertEqual(battle.enemies.length, 1, row.style + ' one foe');
                assertEqual(foe.hp, 80, row.style + ' goblin starts at 80');
                assertEqual(foe.xp, 12, row.style + ' foe carries mob XP');
                assertEqual(you.damage, 16, row.style + ' starter battle damage is 16');
                var orig = win.Phaser.Math.Between;
                win.Phaser.Math.Between = function () { return 0; };
                var before = foe.hp;
                you.attack(foe);
                return H.waitUntil(function () {
                    return foe.hp < before;
                }, 2000, row.style + ' hit lands').then(function () {
                    return H.sleep(280);
                }).then(function () {
                    win.Phaser.Math.Between = orig;
                    hero = H.hero(win);
                    assertEqual(before - foe.hp, 16, row.style + ' deals 16');
                    assert(foe.living, row.style + ' goblin still living');
                    assertEqual(win.Hud.mode, 'battle', row.style + ' still in battle');
                    assertEqual(hero.skills[row.skill].xp, hitXp, row.style + ' grants ' + row.skill + ' XP on the hit');
                    row.others.forEach(function (id) {
                        assertEqual(hero.skills[id].xp, 0, row.style + ' does not grant ' + id + ' XP');
                    });
                    assertEqual(hero.skills.hitpoints.xp, 1154 + hpHitXp, row.style + ' Hitpoints XP on the hit');
                    assertEqual(hero.xp, 0, row.style + ' combat XP still waits for the win');
                    var skillRow = win.document.querySelector('#skills-list [data-skill="' + row.skill + '"]');
                    assert(skillRow, row.style + ' Skills row exists');
                    assert(
                        String(skillRow.getAttribute('title') || '').indexOf(hitXp + ' XP') !== -1,
                        row.style + ' Skills tab shows hit XP'
                    );
                    assert(!H.chatHas(win, 'collapses'), row.style + ' no win chat yet');
                    return H.forceFlee(win);
                }).catch(function (err) {
                    win.Phaser.Math.Between = orig;
                    throw err;
                });
            }).then(function () {
                hero = H.hero(win);
                assertEqual(hero.skills[row.skill].xp, hitXp, row.style + ' keeps hit XP after flee');
                row.others.forEach(function (id) {
                    assertEqual(hero.skills[id].xp, 0, row.style + ' other melee skill still 0 after flee');
                });
                assertEqual(hero.skills.hitpoints.xp, 1154 + hpHitXp, row.style + ' keeps Hitpoints XP after flee');
                assertEqual(hero.xp, 0, row.style + ' no combat XP on flee');
                assert(!win.game.input.keyboard, 'Phaser keyboard still off');
            });
        }

        return hitWithStyle(styles[0])
            .then(function () { return hitWithStyle(styles[1]); })
            .then(function () { return hitWithStyle(styles[2]); })
            .then(function () {
                H.enterZone(win, 'haven');
                world.placePlayer(spawn.x, spawn.y);
            });
    }).catch(function (err) {
        return H.cleanupBattle(win).then(function () {
            throw err;
        });
    });
});

EmberwoodTests.add('combat: Hitpoints XP on win is ceil(mobXp / 3) min 1', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        world.placePlayer(spawn.x, spawn.y);
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');

        var rows = [
            { mobXp: 1, expect: 1 },
            { mobXp: 2, expect: 1 },
            { mobXp: 4, expect: 2 },
            { mobXp: 5, expect: 2 },
            { mobXp: 10, expect: 4 }
        ];

        function winWithMobXp(row) {
            return H.cleanupBattle(win).then(function () {
                H.enterZone(win, 'haven');
                H.setAutoAttack(win, false);
                var hero = win.makeHero();
                win.game.registry.set('hero', hero);
                world.refreshHud();
                world.placePlayer(spawn.x, spawn.y);
                hero = H.hero(win);
                assertEqual(hero.skills.hitpoints.xp, 1154, 'mobXp ' + row.mobXp + ' Hitpoints starts 1154');
                assertEqual(hero.skills.hitpoints.level, 10, 'mobXp ' + row.mobXp + ' Hitpoints starts 10');
                var chicken = H.findMob(win, 'Chicken');
                return H.startFight(win, chicken).then(function () {
                    world.lastFought.mobDef = Object.assign({}, world.lastFought.mobDef, { xp: row.mobXp });
                    assertEqual(
                        Math.max(1, Math.ceil(row.mobXp / 3)),
                        row.expect,
                        'mobXp ' + row.mobXp + ' formula is ' + row.expect
                    );
                    win.Hud.tryAttack();
                    return H.waitWorld(win);
                }).then(function () {
                    hero = H.hero(win);
                    assertEqual(
                        hero.skills.hitpoints.xp,
                        1154 + row.expect,
                        'mobXp ' + row.mobXp + ' grants Hitpoints +' + row.expect
                    );
                    assert(H.chatHas(win, 'collapses'), 'mobXp ' + row.mobXp + ' win chat');
                    assert(!win.game.input.keyboard, 'Phaser keyboard still off');
                });
            });
        }

        return winWithMobXp(rows[0])
            .then(function () { return winWithMobXp(rows[1]); })
            .then(function () { return winWithMobXp(rows[2]); })
            .then(function () { return winWithMobXp(rows[3]); })
            .then(function () { return winWithMobXp(rows[4]); })
            .then(function () {
                H.enterZone(win, 'haven');
            });
    }).catch(function (err) {
        return H.cleanupBattle(win).then(function () {
            throw err;
        });
    });
});

EmberwoodTests.add('combat: Hitpoints XP on each successful melee hit', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        world.placePlayer(spawn.x, spawn.y);
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assertEqual(typeof win.hitpointsHitXp, 'function', 'hitpointsHitXp exists');
        assertEqual(win.hitpointsHitXp(4, 12, 12), 2, 'chicken one-shot is ceil(4/3)');
        assertEqual(win.hitpointsHitXp(1, 12, 12), 1, 'mobXp 1 one-shot is min 1');
        assertEqual(win.hitpointsHitXp(2, 12, 12), 1, 'mobXp 2 one-shot is ceil(2/3) min 1');
        assertEqual(win.hitpointsHitXp(5, 12, 12), 2, 'mobXp 5 one-shot is ceil(5/3)');
        assertEqual(win.hitpointsHitXp(10, 12, 12), 4, 'mobXp 10 one-shot is ceil(10/3)');
        assertEqual(win.hitpointsHitXp(12, 16, 80), 1, 'goblin 16/80 is ceil(2/3) min 1');
        assertEqual(win.hitpointsHitXp(12, 1, 80), 1, 'successful hit is at least 1 Hitpoints XP');
        assertEqual(win.hitpointsHitXp(12, 0, 80), 0, 'a miss grants no Hitpoints XP');

        var foeSpec = { type: 'Goblin', texture: 'slime', tint: 0x5aa33a, hp: 80, damage: 1, gold: 0, xp: 12 };
        var styleXp = win.styleHitXp(12, 16, 80);
        var hpHitXp = win.hitpointsHitXp(12, 16, 80);
        var hero;

        return H.cleanupBattle(win).then(function () {
            H.enterZone(win, 'haven');
            H.setAutoAttack(win, false);
            hero = win.makeHero();
            hero.autoAttack = false;
            hero.autoRetaliate = false;
            hero.style = 'accurate';
            win.game.registry.set('hero', hero);
            world.refreshHud();
            world.placePlayer(spawn.x, spawn.y);
            H.setAutoAttack(win, false);
            H.setAutoRetaliate(win, false);
            hero = H.hero(win);
            assertEqual(hero.skills.attack.xp, 0, 'Attack starts 0');
            assertEqual(hero.skills.hitpoints.xp, 1154, 'Hitpoints starts 1154');
            assertEqual(hero.xp, 0, 'combat XP starts 0');
            return H.startCustomFight(win, [foeSpec]);
        }).then(function () {
            var battle = H.battle(win);
            var you = battle.heroes[0];
            var foe = battle.enemies[0];
            assertEqual(battle.enemies.length, 1, 'one foe');
            assertEqual(foe.hp, 80, 'goblin starts at 80');
            assertEqual(foe.xp, 12, 'foe carries mob XP');
            assertEqual(you.damage, 16, 'starter battle damage is 16');
            var orig = win.Phaser.Math.Between;
            win.Phaser.Math.Between = function () { return 0; };
            var before = foe.hp;
            you.attack(foe);
            return H.waitUntil(function () {
                return foe.hp < before;
            }, 2000, 'hit lands').then(function () {
                return H.sleep(280);
            }).then(function () {
                win.Phaser.Math.Between = orig;
                hero = H.hero(win);
                assertEqual(before - foe.hp, 16, 'deals 16');
                assert(foe.living, 'goblin still living');
                assertEqual(win.Hud.mode, 'battle', 'still in battle');
                assertEqual(hero.skills.attack.xp, styleXp, 'Attack XP on the hit');
                assertEqual(hero.skills.hitpoints.xp, 1154 + hpHitXp, 'Hitpoints XP on the hit, not only on win');
                assertEqual(hero.xp, 0, 'combat XP still waits for the win');
                var hpRow = win.document.querySelector('#skills-list [data-skill="hitpoints"]');
                assert(hpRow, 'Hitpoints Skills row exists');
                assert(
                    String(hpRow.getAttribute('title') || '').indexOf((1154 + hpHitXp) + ' XP') !== -1,
                    'Skills tab shows Hitpoints hit XP'
                );
                assert(!H.chatHas(win, 'collapses'), 'no win chat yet');
                return H.forceFlee(win);
            }).catch(function (err) {
                win.Phaser.Math.Between = orig;
                throw err;
            });
        }).then(function () {
            hero = H.hero(win);
            assertEqual(hero.skills.attack.xp, styleXp, 'keeps Attack XP after flee');
            assertEqual(hero.skills.hitpoints.xp, 1154 + hpHitXp, 'keeps Hitpoints XP after flee');
            assertEqual(hero.xp, 0, 'no combat XP on flee');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');

            return H.cleanupBattle(win);
        }).then(function () {
            H.enterZone(win, 'haven');
            H.setAutoAttack(win, false);
            hero = win.makeHero();
            hero.autoAttack = false;
            hero.autoRetaliate = false;
            win.game.registry.set('hero', hero);
            world.refreshHud();
            world.placePlayer(spawn.x, spawn.y);
            var chicken = H.findMob(win, 'Chicken');
            var xp = chicken.mobDef.xp || 10;
            var hpXp = win.hitpointsHitXp(xp, chicken.mobDef.hp, chicken.mobDef.hp);
            assertEqual(hpXp, Math.max(1, Math.ceil(xp / 3)), 'one-shot Hitpoints matches old win formula');
            return H.startFight(win, chicken).then(function () {
                win.Hud.tryAttack();
                return H.waitWorld(win);
            }).then(function () {
                hero = H.hero(win);
                assertEqual(hero.skills.hitpoints.xp, 1154 + hpXp, 'chicken win does not double Hitpoints XP');
                assert(H.chatHas(win, 'collapses'), 'win chat');
                assert(!win.game.input.keyboard, 'Phaser keyboard still off');
                H.enterZone(win, 'haven');
                world.placePlayer(spawn.x, spawn.y);
            });
        });
    }).catch(function (err) {
        return H.cleanupBattle(win).then(function () {
            throw err;
        });
    });
});

EmberwoodTests.add('combat: shortbow and bronze arrows grant Ranged XP and consume ammo', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        world.placePlayer(spawn.x, spawn.y);
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(win.ITEM_DB.shortbow, 'shortbow is in ITEM_DB');
        assert(win.ITEM_DB.arrow, 'bronze arrows are in ITEM_DB');
        assertEqual(win.ITEM_DB.shortbow.slot, 'weapon', 'shortbow uses the weapon slot');
        assertEqual(win.ITEM_DB.shortbow.combatClass, 'ranged', 'shortbow is a ranged weapon');
        assertEqual(win.ITEM_DB.shortbow.damage, 16, 'shortbow damage is 16');
        assertEqual(win.ITEM_DB.arrow.slot, 'ammo', 'arrows use the ammo slot');
        assertEqual(win.itemDefaultVerb('shortbow'), 'wield', 'shortbow default is wield');
        assertEqual(win.itemDefaultVerb('arrow'), 'wear', 'arrows default is wear');
        assertEqual(typeof win.rangedWeaponEquipped, 'function', 'rangedWeaponEquipped exists');
        assertEqual(typeof win.consumeAmmo, 'function', 'consumeAmmo exists');
        assertEqual(typeof win.equippedQty, 'function', 'equippedQty exists');
        assertEqual(win.styleHitXp(12, 16, 80), 2, 'Bat 16/80 is 2 Ranged XP');
        assertEqual(win.hitpointsHitXp(12, 16, 80), 1, 'Bat 16/80 Hitpoints is ceil(2/3) min 1');

        var foeSpec = { type: 'Bat', texture: 'slime', tint: 0xddbbff, hp: 80, damage: 1, gold: 0, xp: 12 };
        var styleXp = win.styleHitXp(12, 16, 80);
        var hpHitXp = win.hitpointsHitXp(12, 16, 80);
        var hero;

        return H.cleanupBattle(win).then(function () {
            H.enterZone(win, 'haven');
            H.setAutoAttack(win, false);
            hero = win.makeHero();
            hero.autoAttack = false;
            hero.autoRetaliate = false;
            hero.style = 'accurate';
            win.addItem(hero, 'shortbow', 1);
            win.addItem(hero, 'arrow', 50);
            win.game.registry.set('hero', hero);
            world.refreshHud();
            world.placePlayer(spawn.x, spawn.y);
            H.setAutoAttack(win, false);
            H.setAutoRetaliate(win, false);
            H.click(win, '#tab-bar button[data-tab="inv"]');
            H.click(win, '#inv-grid [data-item="shortbow"]');
            H.click(win, '#inv-grid [data-item="arrow"]');
            hero = H.hero(win);
            assertEqual(hero.equipment.weapon, 'shortbow', 'left-click wields the shortbow');
            assertEqual(hero.equipment.ammo, 'arrow', 'left-click wears bronze arrows');
            assertEqual(win.equippedQty(hero, 'ammo'), 50, 'ammo slot holds the whole stack');
            assertEqual(win.rangedWeaponEquipped(hero), true, 'worn shortbow is a ranged weapon');
            assertEqual(win.heroCombatClass(hero), 'ranged', 'shortbow sets combat class to ranged');
            assertEqual(win.combatSkill(hero), 'ranged', 'Accurate shortbow trains Ranged');
            assertEqual(hero.skills.ranged.xp, 0, 'Ranged starts 0');
            assertEqual(hero.skills.attack.xp, 0, 'Attack starts 0');
            assertEqual(hero.skills.hitpoints.xp, 1154, 'Hitpoints starts 1154');
            H.click(win, '#tab-bar button[data-tab="equip"]');
            var worn = win.document.getElementById('equip-grid').innerText;
            assertMatch(worn, 'Shortbow', 'worn tab shows Shortbow');
            assertMatch(worn, 'Bronze arrows', 'worn tab shows Bronze arrows');
            assertMatch(worn, 'x50', 'worn ammo shows x50');
            return H.startCustomFight(win, [foeSpec]);
        }).then(function () {
            var battle = H.battle(win);
            var you = battle.heroes[0];
            var foe = battle.enemies[0];
            assertEqual(battle.enemies.length, 1, 'one foe');
            assertEqual(you.combatClass, 'ranged', 'battle hero is ranged from the shortbow');
            assertEqual(foe.combatClass, 'ranged', 'Bat is ranged');
            assertEqual(foe.hp, 80, 'Bat starts at 80');
            assertEqual(foe.xp, 12, 'foe carries mob XP');
            var orig = win.Phaser.Math.Between;
            win.Phaser.Math.Between = function () { return 0; };
            var before = foe.hp;
            you.attack(foe);
            return H.waitUntil(function () {
                return foe.hp < before;
            }, 2000, 'ranged hit lands').then(function () {
                return H.sleep(280);
            }).then(function () {
                win.Phaser.Math.Between = orig;
                hero = H.hero(win);
                assertEqual(before - foe.hp, 16, 'shortbow deals 16 vs Bat');
                assert(foe.living, 'Bat still living');
                assertEqual(win.Hud.mode, 'battle', 'still in battle');
                assertEqual(hero.skills.ranged.xp, styleXp, 'Ranged XP on the hit');
                assertEqual(hero.skills.attack.xp, 0, 'shortbow does not grant Attack XP');
                assertEqual(hero.skills.magic.xp, 0, 'shortbow does not start Magic XP');
                assertEqual(hero.skills.hitpoints.xp, 1154 + hpHitXp, 'Hitpoints XP on the ranged hit');
                assertEqual(hero.equipment.ammo, 'arrow', 'ammo slot still holds arrows');
                assertEqual(win.equippedQty(hero, 'ammo'), 49, 'one bronze arrow was consumed');
                var wornAmmo = win.document.querySelector('#equip-grid [data-equip-slot="ammo"]');
                assert(wornAmmo, 'worn ammo button exists');
                assertMatch(wornAmmo.textContent, 'x49', 'worn tab shows x49 after the shot');
                var rangedRow = win.document.querySelector('#skills-list [data-skill="ranged"]');
                assert(rangedRow, 'Ranged Skills row exists');
                assert(
                    String(rangedRow.getAttribute('title') || '').indexOf(styleXp + ' XP') !== -1,
                    'Skills tab shows Ranged hit XP'
                );
                assert(!H.chatHas(win, 'collapses'), 'no win chat yet');
                return H.forceFlee(win);
            }).catch(function (err) {
                win.Phaser.Math.Between = orig;
                throw err;
            });
        }).then(function () {
            hero = H.hero(win);
            assertEqual(hero.skills.ranged.xp, styleXp, 'keeps Ranged XP after flee');
            assertEqual(hero.skills.attack.xp, 0, 'Attack still 0 after flee');
            assertEqual(win.equippedQty(hero, 'ammo'), 49, 'keeps consumed ammo after flee');
            assertEqual(hero.xp, 0, 'no combat XP on flee');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');

            hero.equipment.ammo = null;
            hero.equipmentQty.ammo = 0;
            win.game.registry.set('hero', hero);
            world.refreshHud();
            return H.startCustomFight(win, [foeSpec]);
        }).then(function () {
            var battle = H.battle(win);
            var you = battle.heroes[0];
            var foe = battle.enemies[0];
            var before = foe.hp;
            win.Hud.el.log.innerHTML = '';
            you.attack(foe);
            return H.sleep(400).then(function () {
                assertEqual(foe.hp, before, 'no ammo means the shortbow does not fire');
                assert(H.chatHas(win, 'no ammo'), 'empty ammo logs You have no ammo.');
                assertEqual(H.hero(win).skills.ranged.xp, styleXp, 'dry-fire grants no more Ranged XP');
                return H.forceFlee(win);
            });
        }).then(function () {
            H.enterZone(win, 'haven');
            world.placePlayer(spawn.x, spawn.y);
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        });
    }).catch(function (err) {
        return H.cleanupBattle(win).then(function () {
            throw err;
        });
    });
});

EmberwoodTests.add('skills: burying inventory bones grants Prayer XP', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.setAutoPickup(win, true);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        world.clearLoot();
        if (win.Hud.hideContextMenu) {
            win.Hud.hideContextMenu();
        }
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assertEqual(typeof win.buryItem, 'function', 'buryItem helper');
        assertEqual(typeof win.gainSkillXp, 'function', 'gainSkillXp helper');
        assert(win.ITEM_DB.bones.bury, 'bones are buryable');
        assertEqual(win.ITEM_DB.bones.buryXp, 4, 'bones bury for 4 Prayer XP');
        assertEqual(win.itemDefaultVerb('bones'), 'bury', 'bones default is bury');

        function stackQty(hero, id) {
            var stack = hero.inventory.filter(function (row) { return row.id === id; })[0];
            return stack ? stack.qty : 0;
        }

        var hero = win.makeHero();
        win.addItem(hero, 'bones', 2);
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assertEqual(stackQty(hero, 'bones'), 2, 'starter bones 2');
        assertEqual(hero.skills.prayer.xp, 0, 'Prayer XP starts 0');
        assertEqual(hero.skills.prayer.level, 1, 'Prayer starts 1');
        assertEqual(hero.skills.magic.xp, 0, 'Magic XP stays 0');
        assertEqual(hero.level, 3, 'starter combat level 3');

        H.click(win, '#tab-bar button[data-tab="inv"]');
        assert(win.document.querySelector('#inv-grid [data-item="bones"]'), 'bones slot');
        var dropsHost = win.Hud.ensureXpDrops();
        assert(dropsHost && dropsHost.id === 'xp-drops', 'xp-drops host exists');
        dropsHost.innerHTML = '';
        win.Hud.el.log.innerHTML = '';

        H.click(win, '#inv-grid [data-item="bones"]');
        hero = H.hero(win);
        assertEqual(stackQty(hero, 'bones'), 1, 'bury takes one bones');
        assertEqual(H.lastChat(win), 'You bury the bones.', 'bury chat');
        assertEqual(hero.skills.prayer.xp, 4, 'first bury grants 4 Prayer XP');
        assertEqual(hero.skills.prayer.level, 1, '4 XP does not level Prayer');
        assertEqual(hero.skills.magic.xp, 0, 'bury does not grant Magic XP');
        assertEqual(hero.skills.cooking.xp, 0, 'bury does not grant Cooking XP');
        assertEqual(hero.level, 3, 'combat level unchanged at Prayer 1');
        assertEqual(H.lootLive(win).length, 0, 'bury does not drop bones');
        var drops = win.document.querySelectorAll('#xp-drops .xp-drop');
        assertEqual(drops.length, 1, 'one Prayer XP drop');
        assertEqual(drops[0].getAttribute('data-skill'), 'prayer', 'drop skill is prayer');
        assertEqual(drops[0].getAttribute('data-xp'), '4', 'drop amount is 4');
        var prayIcon = drops[0].querySelector('img.pix');
        assert(prayIcon && prayIcon.getAttribute('src').indexOf('assets/svg/skills/prayer.svg') !== -1, 'Prayer skill icon');

        H.click(win, '#tab-bar button[data-tab="skills"]');
        var prayerRow = win.document.querySelector('#skills-list [data-skill="prayer"]');
        assert(prayerRow, 'Prayer Skills row exists');
        assert(
            String(prayerRow.getAttribute('title') || '').indexOf('4 XP') !== -1,
            'Skills tab shows Prayer bury XP'
        );

        H.click(win, '#tab-bar button[data-tab="inv"]');
        H.click(win, '#inv-grid [data-item="bones"]');
        hero = H.hero(win);
        assertEqual(stackQty(hero, 'bones'), 0, 'second bury takes the last bones');
        assertEqual(hero.skills.prayer.xp, 8, 'second bury grants another 4 Prayer XP');
        assertEqual(H.lastChat(win), 'You bury the bones.', 'second bury chat');
        assert(!win.document.querySelector('#inv-grid [data-item="bones"]'), 'bones slot gone');

        assertEqual(win.buryItem(hero, 'bones'), false, 'empty stack does not bury');
        assertEqual(hero.skills.prayer.xp, 8, 'failed bury grants no more Prayer XP');
        assertEqual(win.buryItem(hero, 'shrimp'), false, 'food is not buryable');
        assertEqual(hero.skills.prayer.xp, 8, 'non-bones grant no Prayer XP');

        world.encounterLock = true;
        win.addItem(hero, 'bones', 1);
        win.game.registry.set('hero', hero);
        world.refreshHud();
        H.click(win, '#inv-grid [data-item="bones"]');
        assertEqual(stackQty(H.hero(win), 'bones'), 1, 'encounterLock does not bury');
        assertEqual(H.hero(win).skills.prayer.xp, 8, 'encounterLock grants no Prayer XP');
        world.encounterLock = false;

        win.Hud.mode = 'battle';
        H.click(win, '#inv-grid [data-item="bones"]');
        assertEqual(H.lastChat(win), 'Use Eat food on your combat turn.', 'battle blocks bury');
        assertEqual(stackQty(H.hero(win), 'bones'), 1, 'battle does not bury');
        assertEqual(H.hero(win).skills.prayer.xp, 8, 'battle grants no Prayer XP');
        win.Hud.mode = 'world';

        world.clearLoot();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'still at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'still at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('skills: Magic panel Wind Strike grants Magic XP', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.setAutoPickup(win, true);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        world.clearLoot();
        if (win.Hud.hideContextMenu) {
            win.Hud.hideContextMenu();
        }
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assertEqual(typeof win.windStrike, 'function', 'windStrike helper');
        assertEqual(typeof win.hasWindStrikeRunes, 'function', 'hasWindStrikeRunes helper');
        assertEqual(typeof win.gainSkillXp, 'function', 'gainSkillXp helper');
        assert(win.ITEM_DB.airrune, 'air rune exists');
        assert(win.ITEM_DB.mindrune, 'mind rune exists');
        assertEqual(win.WIND_STRIKE_XP, 5, 'Wind Strike grants 5 Magic XP');
        assertEqual(win.itemDefaultVerb('airrune'), 'drop', 'air rune default is drop');
        assertEqual(win.itemDefaultVerb('mindrune'), 'drop', 'mind rune default is drop');
        assertEqual(typeof win.highAlch, 'undefined', 'High Alch is not this tick');
        assertEqual(typeof win.cookFood, 'undefined', 'Cooking XP is not this tick');

        function stackQty(hero, id) {
            var stack = hero.inventory.filter(function (row) { return row.id === id; })[0];
            return stack ? stack.qty : 0;
        }

        var hero = win.makeHero();
        win.addItem(hero, 'airrune', 2);
        win.addItem(hero, 'mindrune', 2);
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assertEqual(stackQty(hero, 'airrune'), 2, 'starter air runes 2');
        assertEqual(stackQty(hero, 'mindrune'), 2, 'starter mind runes 2');
        assertEqual(hero.skills.magic.xp, 0, 'Magic XP starts 0');
        assertEqual(hero.skills.magic.level, 1, 'Magic starts 1');
        assertEqual(hero.skills.prayer.xp, 0, 'Prayer XP stays 0');
        assertEqual(hero.skills.cooking.xp, 0, 'Cooking XP stays 0');
        assertEqual(hero.level, 3, 'starter combat level 3');

        H.click(win, '#tab-bar button[data-tab="magic"]');
        assert(H.panelVisible(win, 'magic'), 'Magic panel visible');
        assertEqual(win.Hud.tab, 'magic', 'hud.tab magic');
        var stub = win.document.querySelector('#panel-magic p');
        assert(!stub || stub.textContent.indexOf('not learned yet') === -1, 'Magic stub is gone');
        var castBtn = win.document.getElementById('btn-wind-strike');
        assert(castBtn, 'Wind Strike button exists');
        assertEqual(castBtn.getAttribute('data-spell'), 'windstrike', 'Wind Strike data-spell');
        assertEqual(castBtn.textContent.trim(), 'Wind Strike', 'Wind Strike label');

        var dropsHost = win.Hud.ensureXpDrops();
        assert(dropsHost && dropsHost.id === 'xp-drops', 'xp-drops host exists');
        dropsHost.innerHTML = '';
        win.Hud.el.log.innerHTML = '';

        H.click(win, '#btn-wind-strike');
        hero = H.hero(win);
        assertEqual(stackQty(hero, 'airrune'), 1, 'cast takes one air rune');
        assertEqual(stackQty(hero, 'mindrune'), 1, 'cast takes one mind rune');
        assertEqual(H.lastChat(win), 'You cast Wind Strike.', 'cast chat');
        assertEqual(hero.skills.magic.xp, 5, 'first cast grants 5 Magic XP');
        assertEqual(hero.skills.magic.level, 1, '5 XP does not level Magic');
        assertEqual(hero.skills.prayer.xp, 0, 'cast does not grant Prayer XP');
        assertEqual(hero.skills.cooking.xp, 0, 'cast does not grant Cooking XP');
        assertEqual(hero.level, 3, 'combat level unchanged at Magic 1');
        assertEqual(H.lootLive(win).length, 0, 'cast does not drop runes');
        var drops = win.document.querySelectorAll('#xp-drops .xp-drop');
        assertEqual(drops.length, 1, 'one Magic XP drop');
        assertEqual(drops[0].getAttribute('data-skill'), 'magic', 'drop skill is magic');
        assertEqual(drops[0].getAttribute('data-xp'), '5', 'drop amount is 5');
        var magicIcon = drops[0].querySelector('img.pix');
        assert(magicIcon && magicIcon.getAttribute('src').indexOf('assets/svg/skills/magic.svg') !== -1, 'Magic skill icon');

        H.click(win, '#tab-bar button[data-tab="skills"]');
        var magicRow = win.document.querySelector('#skills-list [data-skill="magic"]');
        assert(magicRow, 'Magic Skills row exists');
        assert(
            String(magicRow.getAttribute('title') || '').indexOf('5 XP') !== -1,
            'Skills tab shows Magic Wind Strike XP'
        );

        H.click(win, '#tab-bar button[data-tab="magic"]');
        H.click(win, '#btn-wind-strike');
        hero = H.hero(win);
        assertEqual(stackQty(hero, 'airrune'), 0, 'second cast takes the last air rune');
        assertEqual(stackQty(hero, 'mindrune'), 0, 'second cast takes the last mind rune');
        assertEqual(hero.skills.magic.xp, 10, 'second cast grants another 5 Magic XP');
        assertEqual(H.lastChat(win), 'You cast Wind Strike.', 'second cast chat');
        assert(!win.document.querySelector('#inv-grid [data-item="airrune"]'), 'air rune slot gone');

        H.click(win, '#btn-wind-strike');
        assertEqual(H.lastChat(win), 'You do not have the runes for Wind Strike.', 'missing runes chat');
        assertEqual(H.hero(win).skills.magic.xp, 10, 'failed cast grants no more Magic XP');
        assertEqual(win.windStrike(hero), false, 'empty stacks do not cast');
        assertEqual(hero.skills.magic.xp, 10, 'helper miss grants no more Magic XP');
        win.addItem(hero, 'airrune', 1);
        win.game.registry.set('hero', hero);
        assertEqual(win.windStrike(hero), false, 'air without mind does not cast');
        assertEqual(stackQty(hero, 'airrune'), 1, 'partial runes are not consumed');
        assertEqual(hero.skills.magic.xp, 10, 'partial runes grant no Magic XP');

        world.encounterLock = true;
        win.addItem(hero, 'mindrune', 1);
        win.game.registry.set('hero', hero);
        world.refreshHud();
        H.click(win, '#btn-wind-strike');
        assertEqual(stackQty(H.hero(win), 'airrune'), 1, 'encounterLock does not spend air');
        assertEqual(stackQty(H.hero(win), 'mindrune'), 1, 'encounterLock does not spend mind');
        assertEqual(H.hero(win).skills.magic.xp, 10, 'encounterLock grants no Magic XP');
        world.encounterLock = false;

        win.Hud.mode = 'battle';
        H.click(win, '#btn-wind-strike');
        assertEqual(H.lastChat(win), 'Cast Wind Strike on your combat turn.', 'battle waits for a combat turn');
        assertEqual(stackQty(H.hero(win), 'airrune'), 1, 'off-turn battle does not spend air');
        assertEqual(H.hero(win).skills.magic.xp, 10, 'off-turn battle grants no Magic XP');
        win.Hud.mode = 'world';

        world.clearLoot();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'still at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'still at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        assertEqual(typeof win.cookFood, 'undefined', 'Cooking still not this tick');
    });
});

EmberwoodTests.add('skills: Use-on raw shrimp on fire or range grants Cooking XP', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.setAutoPickup(win, true);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        world.clearLoot();
        if (world.clearWalk) {
            world.clearWalk();
        }
        if (win.Hud.hideContextMenu) {
            win.Hud.hideContextMenu();
        }
        if (win.Hud.clearUseOn) {
            win.Hud.clearUseOn();
        }
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assertEqual(typeof win.useItemOnScenery, 'function', 'useItemOnScenery helper');
        assertEqual(typeof win.Hud.beginUseOn, 'function', 'beginUseOn helper');
        assertEqual(typeof win.Hud.finishUseOn, 'function', 'finishUseOn helper');
        assertEqual(typeof win.gainSkillXp, 'function', 'gainSkillXp helper');
        assert(win.ITEM_DB.rawshrimp, 'raw shrimp exists');
        assertEqual(win.ITEM_DB.rawshrimp.cook, 'shrimp', 'raw shrimp cooks to shrimp');
        assertEqual(win.ITEM_DB.rawshrimp.cookXp, 30, 'raw shrimp cooks for 30 Cooking XP');
        assertEqual(win.itemCanUseOn('rawshrimp', 'range'), true, 'raw uses on range');
        assertEqual(win.itemCanUseOn('rawshrimp', 'fire'), true, 'raw uses on fire');
        assertEqual(typeof win.cookFood, 'undefined', 'cookFood helper is not this tick');
        assertEqual(typeof win.catchFish, 'undefined', 'Fishing XP is not this tick');

        function stackQty(hero, id) {
            var stack = hero.inventory.filter(function (row) { return row.id === id; })[0];
            return stack ? stack.qty : 0;
        }
        function clickTile(tx, ty) {
            var pt = win.tileCenter(tx, ty);
            world.onClick({ worldX: pt.x, worldY: pt.y });
            return pt;
        }

        var hero = win.makeHero();
        win.addItem(hero, 'rawshrimp', 3);
        win.addItem(hero, 'bones', 1);
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assertEqual(stackQty(hero, 'rawshrimp'), 3, 'starter raw shrimp 3');
        assertEqual(stackQty(hero, 'shrimp'), 8, 'starter cooked shrimp');
        assertEqual(hero.skills.cooking.xp, 0, 'Cooking XP starts 0');
        assertEqual(hero.skills.cooking.level, 1, 'Cooking starts 1');
        assertEqual(hero.skills.fishing.xp, 0, 'Fishing XP stays 0');
        assertEqual(hero.skills.prayer.xp, 0, 'Prayer XP stays 0');
        assertEqual(hero.level, 3, 'starter combat level 3');
        assertEqual(win.TOWN_PROPS.range.x, 16, 'haven range x');
        assertEqual(win.TOWN_PROPS.range.y, 17, 'haven range y');
        assertEqual(world.tileGrid[17][16], win.TILE.RANGE, 'haven range tile');

        H.click(win, '#tab-bar button[data-tab="inv"]');
        var dropsHost = win.Hud.ensureXpDrops();
        assert(dropsHost && dropsHost.id === 'xp-drops', 'xp-drops host exists');
        dropsHost.innerHTML = '';
        win.Hud.el.log.innerHTML = '';

        win.Hud.beginUseOn('rawshrimp');
        assertEqual(win.Hud.useOnId, 'rawshrimp', 'use-on id is raw shrimp');
        clickTile(16, 17);
        hero = H.hero(win);
        assertEqual(stackQty(hero, 'rawshrimp'), 2, 'range consumes one raw shrimp');
        assertEqual(stackQty(hero, 'shrimp'), 9, 'raw becomes cooked shrimp');
        assertEqual(H.lastChat(win), 'You use the Raw shrimp on the fire.', 'raw-on-range chat');
        assertEqual(hero.skills.cooking.xp, 30, 'range cook grants 30 Cooking XP');
        assertEqual(hero.skills.cooking.level, 1, '30 XP does not level Cooking');
        assertEqual(hero.skills.fishing.xp, 0, 'range cook does not grant Fishing XP');
        assertEqual(hero.skills.prayer.xp, 0, 'range cook does not grant Prayer XP');
        assertEqual(hero.level, 3, 'combat level unchanged at Cooking 1');
        assertEqual(H.lootLive(win).length, 0, 'cook does not drop food');
        assertEqual(win.Hud.useOnId, null, 'cursor clears after range');
        var drops = win.document.querySelectorAll('#xp-drops .xp-drop');
        assertEqual(drops.length, 1, 'one Cooking XP drop');
        assertEqual(drops[0].getAttribute('data-skill'), 'cooking', 'drop skill is cooking');
        assertEqual(drops[0].getAttribute('data-xp'), '30', 'drop amount is 30');
        var cookIcon = drops[0].querySelector('img.pix');
        assert(cookIcon && cookIcon.getAttribute('src').indexOf('assets/svg/skills/cooking.svg') !== -1, 'Cooking skill icon');

        H.click(win, '#tab-bar button[data-tab="skills"]');
        var cookRow = win.document.querySelector('#skills-list [data-skill="cooking"]');
        assert(cookRow, 'Cooking Skills row exists');
        assert(
            String(cookRow.getAttribute('title') || '').indexOf('30 XP') !== -1,
            'Skills tab shows Cooking XP'
        );

        dropsHost.innerHTML = '';
        var fireResult = win.useItemOnScenery(hero, 'rawshrimp', 'fire');
        assert(fireResult && fireResult.ok, 'helper cooks on fire kind');
        assertEqual(fireResult.cooked, 'shrimp', 'fire helper cooked shrimp');
        assertEqual(stackQty(hero, 'rawshrimp'), 1, 'fire helper consumes one raw shrimp');
        assertEqual(stackQty(hero, 'shrimp'), 10, 'fire helper adds cooked shrimp');
        assertEqual(hero.skills.cooking.xp, 60, 'fire cook grants another 30 Cooking XP');
        assertEqual(hero.skills.cooking.level, 2, '60 XP reaches Cooking 2');
        var overlay = win.document.getElementById('level-up-overlay');
        assert(overlay && !overlay.hidden, 'Cooking 2 shows the level-up overlay');
        win.Hud.hideLevelUp();
        win.game.registry.set('hero', hero);
        world.refreshHud();
        drops = win.document.querySelectorAll('#xp-drops .xp-drop');
        assertEqual(drops.length, 1, 'one fire Cooking XP drop');
        assertEqual(drops[0].getAttribute('data-skill'), 'cooking', 'fire drop skill is cooking');
        assertEqual(drops[0].getAttribute('data-xp'), '30', 'fire drop amount is 30');

        H.click(win, '#tab-bar button[data-tab="skills"]');
        cookRow = win.document.querySelector('#skills-list [data-skill="cooking"]');
        assert(
            String(cookRow.getAttribute('title') || '').indexOf('60 XP') !== -1,
            'Skills tab shows fire Cooking XP'
        );

        assertEqual(win.useItemOnScenery(hero, 'rawshrimp', 'shrine'), null, 'raw does not cook on shrine');
        assertEqual(stackQty(hero, 'rawshrimp'), 1, 'shrine miss does not consume raw');
        assertEqual(hero.skills.cooking.xp, 60, 'shrine miss grants no Cooking XP');

        win.Hud.beginUseOn('bones');
        clickTile(18, 8);
        hero = H.hero(win);
        assertEqual(stackQty(hero, 'bones'), 0, 'shrine still consumes bones');
        assertEqual(hero.skills.prayer.xp, 0, 'shrine still grants no Prayer XP');
        assertEqual(hero.skills.cooking.xp, 60, 'bones on shrine grant no Cooking XP');

        world.encounterLock = true;
        win.Hud.beginUseOn('rawshrimp');
        clickTile(16, 17);
        assertEqual(stackQty(H.hero(win), 'rawshrimp'), 1, 'encounterLock does not cook');
        assertEqual(H.hero(win).skills.cooking.xp, 60, 'encounterLock grants no Cooking XP');
        world.encounterLock = false;

        world.clearLoot();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'still at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'still at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        assertEqual(typeof win.catchFish, 'undefined', 'Fishing still not this tick');
    });
});

EmberwoodTests.add('skills: Southshore fishing spots grant Fishing XP', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.setAutoPickup(win, true);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        world.clearLoot();
        if (world.clearWalk) {
            world.clearWalk();
        }
        if (win.Hud.hideContextMenu) {
            win.Hud.hideContextMenu();
        }
        if (win.Hud.clearUseOn) {
            win.Hud.clearUseOn();
        }
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assertEqual(typeof win.fishAtSpot, 'function', 'fishAtSpot helper');
        assertEqual(typeof win.fishingSpotAt, 'function', 'fishingSpotAt helper');
        assertEqual(typeof win.gainSkillXp, 'function', 'gainSkillXp helper');
        assertEqual(win.FISH_SPOT_XP, 10, 'Southshore spots grant 10 Fishing XP');
        assertEqual(typeof win.catchFish, 'undefined', 'catchFish helper is not this tick');
        assertEqual(typeof win.chopTree, 'undefined', 'Woodcutting is not this tick');
        assertEqual(typeof win.woodcutTree, 'undefined', 'Woodcutting helper is not this tick');

        function clickTile(tx, ty) {
            var pt = win.tileCenter(tx, ty);
            world.onClick({ worldX: pt.x, worldY: pt.y });
            return pt;
        }

        var hero = win.makeHero();
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assertEqual(hero.skills.fishing.xp, 0, 'Fishing XP starts 0');
        assertEqual(hero.skills.fishing.level, 1, 'Fishing starts 1');
        assertEqual(hero.skills.cooking.xp, 0, 'Cooking XP stays 0');
        assertEqual(hero.skills.woodcutting.xp, 0, 'Woodcutting XP stays 0');
        assertEqual(hero.level, 3, 'starter combat level 3');

        var shore = win.SHORE_PROPS;
        assert(shore && shore.spots && shore.spots.length >= 2, 'SHORE_PROPS.spots exist');
        var spot = shore.spots[0];
        var spot2 = shore.spots[1];
        assertEqual(spot.x, 16, 'first fishing spot x');
        assertEqual(spot.y, 24, 'first fishing spot y');
        assertEqual(win.fishingSpotAt(spot.x, spot.y, 'southshore'), spot, 'fishingSpotAt matches southshore');
        assertEqual(win.fishingSpotAt(spot.x, spot.y, 'haven'), null, 'fishing spots are zone-gated');
        assertEqual(win.examineSceneryText('fishspot'), 'A fishing spot. Fish dart beneath the surface.', 'fishspot examine text');

        H.enterZone(win, 'southshore');
        world = H.world(win);
        H.setAutoAttack(win, false);
        world.encounterLock = false;
        world.engageTarget = null;
        world.talkTarget = null;
        if (world.clearWalk) {
            world.clearWalk();
        }
        parkWorldBodies(world);
        hero = win.makeHero();
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assertEqual(world.tileGrid[spot.y][spot.x], win.TILE.WATER, 'first spot stays WATER');
        assertEqual(world.tileGrid[spot2.y][spot2.x], win.TILE.WATER, 'second spot stays WATER');
        assertEqual(
            win.sceneryKindAt(world.tileGrid, spot.x, spot.y, { zoneId: 'southshore' }),
            'fishspot',
            'southshore spot kind'
        );
        assertEqual(
            win.sceneryKindAt(world.tileGrid, spot.x, spot.y, { zoneId: 'haven' }),
            'water',
            'same tile is water outside southshore'
        );

        H.click(win, '#tab-bar button[data-tab="skills"]');
        var dropsHost = win.Hud.ensureXpDrops();
        assert(dropsHost && dropsHost.id === 'xp-drops', 'xp-drops host exists');
        dropsHost.innerHTML = '';
        win.Hud.el.log.innerHTML = '';

        clickTile(spot.x, spot.y);
        hero = H.hero(win);
        assertEqual(H.lastChat(win), 'You fish at the fishing spot.', 'spot click chat');
        assertEqual(hero.skills.fishing.xp, 10, 'spot click grants 10 Fishing XP');
        assertEqual(hero.skills.fishing.level, 1, '10 XP does not level Fishing');
        assertEqual(hero.skills.cooking.xp, 0, 'spot click does not grant Cooking XP');
        assertEqual(hero.skills.woodcutting.xp, 0, 'spot click does not grant Woodcutting XP');
        assertEqual(hero.level, 3, 'combat level unchanged at Fishing 1');
        assertEqual(H.lootLive(win).length, 0, 'fish does not drop loot');
        assert(!world.walkTarget, 'fishing does not walk');
        var drops = win.document.querySelectorAll('#xp-drops .xp-drop');
        assertEqual(drops.length, 1, 'one Fishing XP drop');
        assertEqual(drops[0].getAttribute('data-skill'), 'fishing', 'drop skill is fishing');
        assertEqual(drops[0].getAttribute('data-xp'), '10', 'drop amount is 10');
        var fishIcon = drops[0].querySelector('img.pix');
        assert(fishIcon && fishIcon.getAttribute('src').indexOf('assets/svg/skills/fishing.svg') !== -1, 'Fishing skill icon');

        var fishRow = win.document.querySelector('#skills-list [data-skill="fishing"]');
        assert(fishRow, 'Fishing Skills row exists');
        assert(
            String(fishRow.getAttribute('title') || '').indexOf('10 XP') !== -1,
            'Skills tab shows Fishing XP'
        );

        dropsHost.innerHTML = '';
        var helper = win.fishAtSpot(hero);
        assert(helper && helper.ok, 'helper fishes at a spot');
        assertEqual(helper.xp, 10, 'helper grants 10 Fishing XP');
        assertEqual(hero.skills.fishing.xp, 20, 'helper grants another 10 Fishing XP');
        assertEqual(hero.skills.fishing.level, 1, '20 XP does not level Fishing');
        assertEqual(hero.skills.woodcutting.xp, 0, 'helper does not grant Woodcutting XP');
        win.game.registry.set('hero', hero);
        world.refreshHud();
        drops = win.document.querySelectorAll('#xp-drops .xp-drop');
        assertEqual(drops.length, 1, 'one helper Fishing XP drop');
        assertEqual(drops[0].getAttribute('data-skill'), 'fishing', 'helper drop skill is fishing');
        assertEqual(drops[0].getAttribute('data-xp'), '10', 'helper drop amount is 10');

        H.click(win, '#tab-bar button[data-tab="skills"]');
        fishRow = win.document.querySelector('#skills-list [data-skill="fishing"]');
        assert(
            String(fishRow.getAttribute('title') || '').indexOf('20 XP') !== -1,
            'Skills tab shows helper Fishing XP'
        );

        dropsHost.innerHTML = '';
        clickTile(spot2.x, spot2.y);
        hero = H.hero(win);
        assertEqual(hero.skills.fishing.xp, 30, 'second spot grants another 10 Fishing XP');
        assertEqual(H.lastChat(win), 'You fish at the fishing spot.', 'second spot chat');

        var water = null;
        var y;
        var x;
        for (y = 0; y < world.tileGrid.length && !water; y++) {
            for (x = 0; x < world.tileGrid[y].length; x++) {
                if (world.tileGrid[y][x] === win.TILE.WATER && !win.fishingSpotAt(x, y, 'southshore')) {
                    water = { tx: x, ty: y };
                    break;
                }
            }
        }
        assert(water, 'Southshore has plain WATER');
        assertEqual(
            win.sceneryKindAt(world.tileGrid, water.tx, water.ty, { zoneId: 'southshore' }),
            'water',
            'plain water kind'
        );
        clickTile(water.tx, water.ty);
        hero = H.hero(win);
        assertEqual(H.lastChat(win), "It's water.", 'plain water still examines');
        assertEqual(hero.skills.fishing.xp, 30, 'plain water grants no Fishing XP');

        clickTile(shore.boat.x, shore.boat.y);
        hero = H.hero(win);
        assertEqual(H.lastChat(win), 'A fishing boat, tied off and empty.', 'boat still examines');
        assertEqual(hero.skills.fishing.xp, 30, 'boat grants no Fishing XP');

        world.encounterLock = true;
        clickTile(spot.x, spot.y);
        assertEqual(H.hero(win).skills.fishing.xp, 30, 'encounterLock grants no Fishing XP');
        world.encounterLock = false;

        H.enterZone(win, 'haven');
        world = H.world(win);
        world.encounterLock = false;
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'still at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'still at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        assertEqual(typeof win.catchFish, 'undefined', 'catchFish still not this tick');
        assertEqual(typeof win.chopTree, 'undefined', 'Woodcutting still not this tick');
        assertEqual(H.hero(win).skills.woodcutting.xp, 0, 'Woodcutting XP still 0');
    });
});

EmberwoodTests.add('skills: Northwood trees grant Woodcutting XP', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.setAutoPickup(win, true);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        world.clearLoot();
        if (world.clearWalk) {
            world.clearWalk();
        }
        if (win.Hud.hideContextMenu) {
            win.Hud.hideContextMenu();
        }
        if (win.Hud.clearUseOn) {
            win.Hud.clearUseOn();
        }
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assertEqual(typeof win.chopAtTree, 'function', 'chopAtTree helper');
        assertEqual(typeof win.woodcutTreeAt, 'function', 'woodcutTreeAt helper');
        assertEqual(typeof win.gainSkillXp, 'function', 'gainSkillXp helper');
        assertEqual(win.WOODCUT_TREE_XP, 10, 'Northwood trees grant 10 Woodcutting XP');
        assertEqual(typeof win.chopTree, 'undefined', 'chopTree helper is not this tick');
        assertEqual(typeof win.woodcutTree, 'undefined', 'woodcutTree helper is not this tick');

        function clickTile(tx, ty) {
            var pt = win.tileCenter(tx, ty);
            world.onClick({ worldX: pt.x, worldY: pt.y });
            return pt;
        }

        var hero = win.makeHero();
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assertEqual(hero.skills.woodcutting.xp, 0, 'Woodcutting XP starts 0');
        assertEqual(hero.skills.woodcutting.level, 1, 'Woodcutting starts 1');
        assertEqual(hero.skills.fishing.xp, 0, 'Fishing XP stays 0');
        assertEqual(hero.skills.mining.xp, 0, 'Mining XP stays 0');
        assertEqual(hero.level, 3, 'starter combat level 3');
        assertEqual(world.tileGrid[2][0], win.TILE.TREE, 'haven west border is TREE');
        assertEqual(win.woodcutTreeAt(0, 2, 'haven', world.tileGrid), null, 'woodcut trees are zone-gated');
        assertEqual(win.examineSceneryText('tree'), "It's a tree.", 'tree examine text');

        clickTile(0, 2);
        hero = H.hero(win);
        assertEqual(H.lastChat(win), "It's a tree.", 'haven tree still examines');
        assertEqual(hero.skills.woodcutting.xp, 0, 'haven tree grants no Woodcutting XP');

        H.enterZone(win, 'northwood');
        world = H.world(win);
        H.setAutoAttack(win, false);
        world.encounterLock = false;
        world.engageTarget = null;
        world.talkTarget = null;
        if (world.clearWalk) {
            world.clearWalk();
        }
        parkWorldBodies(world);
        hero = win.makeHero();
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assertEqual(world.tileGrid[2][0], win.TILE.TREE, 'northwood west border is TREE');
        var tree = { x: 0, y: 2 };
        var tree2 = null;
        var flower = null;
        var y;
        var x;
        for (y = 0; y < world.tileGrid.length; y++) {
            for (x = 0; x < world.tileGrid[y].length; x++) {
                if (!tree2 && world.tileGrid[y][x] === win.TILE.TREE && (x !== tree.x || y !== tree.y)) {
                    tree2 = { x: x, y: y };
                }
                if (!flower && world.tileGrid[y][x] === win.TILE.FLOWER) {
                    flower = { tx: x, ty: y };
                }
            }
        }
        assert(tree2, 'Northwood has a second TREE');
        assertEqual(
            win.sceneryKindAt(world.tileGrid, tree.x, tree.y, { zoneId: 'northwood' }),
            'tree',
            'northwood tree kind'
        );
        assertEqual(win.woodcutTreeAt(tree.x, tree.y, 'northwood', world.tileGrid).x, tree.x, 'woodcutTreeAt matches northwood');
        assertEqual(win.woodcutTreeAt(tree.x, tree.y, 'haven', world.tileGrid), null, 'same tile is not woodcut outside northwood');

        H.click(win, '#tab-bar button[data-tab="skills"]');
        var dropsHost = win.Hud.ensureXpDrops();
        assert(dropsHost && dropsHost.id === 'xp-drops', 'xp-drops host exists');
        dropsHost.innerHTML = '';
        win.Hud.el.log.innerHTML = '';

        clickTile(tree.x, tree.y);
        hero = H.hero(win);
        assertEqual(H.lastChat(win), 'You chop the tree.', 'tree click chat');
        assertEqual(hero.skills.woodcutting.xp, 10, 'tree click grants 10 Woodcutting XP');
        assertEqual(hero.skills.woodcutting.level, 1, '10 XP does not level Woodcutting');
        assertEqual(hero.skills.fishing.xp, 0, 'tree click does not grant Fishing XP');
        assertEqual(hero.skills.mining.xp, 0, 'tree click does not grant Mining XP');
        assertEqual(hero.level, 3, 'combat level unchanged at Woodcutting 1');
        assertEqual(H.lootLive(win).length, 0, 'chop does not drop loot');
        assert(!world.walkTarget, 'woodcutting does not walk');
        var drops = win.document.querySelectorAll('#xp-drops .xp-drop');
        assertEqual(drops.length, 1, 'one Woodcutting XP drop');
        assertEqual(drops[0].getAttribute('data-skill'), 'woodcutting', 'drop skill is woodcutting');
        assertEqual(drops[0].getAttribute('data-xp'), '10', 'drop amount is 10');
        var woodIcon = drops[0].querySelector('img.pix');
        assert(woodIcon && woodIcon.getAttribute('src').indexOf('assets/svg/skills/woodcutting.svg') !== -1, 'Woodcutting skill icon');

        var woodRow = win.document.querySelector('#skills-list [data-skill="woodcutting"]');
        assert(woodRow, 'Woodcutting Skills row exists');
        assert(
            String(woodRow.getAttribute('title') || '').indexOf('10 XP') !== -1,
            'Skills tab shows Woodcutting XP'
        );

        dropsHost.innerHTML = '';
        var helper = win.chopAtTree(hero);
        assert(helper && helper.ok, 'helper chops a tree');
        assertEqual(helper.xp, 10, 'helper grants 10 Woodcutting XP');
        assertEqual(hero.skills.woodcutting.xp, 20, 'helper grants another 10 Woodcutting XP');
        assertEqual(hero.skills.woodcutting.level, 1, '20 XP does not level Woodcutting');
        assertEqual(hero.skills.mining.xp, 0, 'helper does not grant Mining XP');
        win.game.registry.set('hero', hero);
        world.refreshHud();
        drops = win.document.querySelectorAll('#xp-drops .xp-drop');
        assertEqual(drops.length, 1, 'one helper Woodcutting XP drop');
        assertEqual(drops[0].getAttribute('data-skill'), 'woodcutting', 'helper drop skill is woodcutting');
        assertEqual(drops[0].getAttribute('data-xp'), '10', 'helper drop amount is 10');

        H.click(win, '#tab-bar button[data-tab="skills"]');
        woodRow = win.document.querySelector('#skills-list [data-skill="woodcutting"]');
        assert(
            String(woodRow.getAttribute('title') || '').indexOf('20 XP') !== -1,
            'Skills tab shows helper Woodcutting XP'
        );

        dropsHost.innerHTML = '';
        clickTile(tree2.x, tree2.y);
        hero = H.hero(win);
        assertEqual(hero.skills.woodcutting.xp, 30, 'second tree grants another 10 Woodcutting XP');
        assertEqual(H.lastChat(win), 'You chop the tree.', 'second tree chat');

        if (flower) {
            clickTile(flower.tx, flower.ty);
            hero = H.hero(win);
            assertEqual(hero.skills.woodcutting.xp, 30, 'flower grants no Woodcutting XP');
        }

        world.encounterLock = true;
        clickTile(tree.x, tree.y);
        assertEqual(H.hero(win).skills.woodcutting.xp, 30, 'encounterLock grants no Woodcutting XP');
        world.encounterLock = false;

        H.enterZone(win, 'haven');
        world = H.world(win);
        world.encounterLock = false;
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        clickTile(0, 2);
        hero = H.hero(win);
        assertEqual(H.lastChat(win), "It's a tree.", 'haven tree still examines after chop');
        assertEqual(hero.skills.woodcutting.xp, 30, 'haven tree still grants no Woodcutting XP');
        assertEqual(Math.round(world.player.x), 328, 'still at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'still at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        assertEqual(H.hero(win).skills.mining.xp, 0, 'Mining XP still 0');
    });
});

EmberwoodTests.add('skills: Darkmine rocks grant Mining XP', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.setAutoPickup(win, true);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        world.clearLoot();
        if (world.clearWalk) {
            world.clearWalk();
        }
        if (win.Hud.hideContextMenu) {
            win.Hud.hideContextMenu();
        }
        if (win.Hud.clearUseOn) {
            win.Hud.clearUseOn();
        }
        parkWorldBodies(world);
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assertEqual(typeof win.mineAtRock, 'function', 'mineAtRock helper');
        assertEqual(typeof win.mineRockAt, 'function', 'mineRockAt helper');
        assertEqual(typeof win.gainSkillXp, 'function', 'gainSkillXp helper');
        assertEqual(win.MINE_ROCK_XP, 10, 'Darkmine rocks grant 10 Mining XP');
        assertEqual(typeof win.mineRock, 'undefined', 'mineRock helper is not this tick');
        assertEqual(typeof win.smithBar, 'undefined', 'Smithing is not this tick');

        function clickTile(tx, ty) {
            var pt = win.tileCenter(tx, ty);
            world.onClick({ worldX: pt.x, worldY: pt.y });
            return pt;
        }

        function findMineRock(grid, skip) {
            var y;
            var x;
            skip = skip || {};
            for (y = 0; y < grid.length; y++) {
                for (x = 0; x < grid[y].length; x++) {
                    if (skip.x === x && skip.y === y) {
                        continue;
                    }
                    var found = win.mineRockAt(x, y, 'darkmine', grid);
                    if (found && found.level > 1) {
                        continue;
                    }
                    if (found) {
                        return { x: x, y: y };
                    }
                }
            }
            return null;
        }

        var hero = win.makeHero();
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assertEqual(hero.skills.mining.xp, 0, 'Mining XP starts 0');
        assertEqual(hero.skills.mining.level, 1, 'Mining starts 1');
        assertEqual(hero.skills.woodcutting.xp, 0, 'Woodcutting XP stays 0');
        assertEqual(hero.skills.crafting.xp, 0, 'Crafting XP stays 0');
        assertEqual(hero.level, 3, 'starter combat level 3');
        var havenRock = { x: win.HAVEN_GATE_TILE.x, y: win.HAVEN_GATE_TILE.y + 2 };
        assertEqual(world.tileGrid[havenRock.y][havenRock.x], win.TILE.ROCK, 'haven gate neighbor is ROCK');
        assertEqual(win.mineRockAt(havenRock.x, havenRock.y, 'haven', world.tileGrid), null, 'mine rocks are zone-gated');
        assertEqual(win.examineSceneryText('rock'), "It's a rock.", 'rock examine text');

        clickTile(havenRock.x, havenRock.y);
        hero = H.hero(win);
        assertEqual(H.lastChat(win), "It's a rock.", 'haven rock still examines');
        assertEqual(hero.skills.mining.xp, 0, 'haven rock grants no Mining XP');

        H.enterZone(win, 'darkmine');
        world = H.world(win);
        H.setAutoAttack(win, false);
        world.encounterLock = false;
        world.engageTarget = null;
        world.talkTarget = null;
        if (world.clearWalk) {
            world.clearWalk();
        }
        parkWorldBodies(world);
        hero = win.makeHero();
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        var rock = findMineRock(world.tileGrid);
        assert(rock, 'Darkmine has a mineable ROCK');
        var rock2 = findMineRock(world.tileGrid, rock);
        assert(rock2, 'Darkmine has a second mineable ROCK');
        var flower = null;
        var y;
        var x;
        for (y = 0; y < world.tileGrid.length; y++) {
            for (x = 0; x < world.tileGrid[y].length; x++) {
                if (!flower && world.tileGrid[y][x] === win.TILE.FLOWER) {
                    flower = { tx: x, ty: y };
                }
            }
        }
        var wall = { x: win.MINE_SHAFT_HOUSE.x + Math.floor(win.MINE_SHAFT_HOUSE.w / 2) - 1, y: win.MINE_SHAFT_HOUSE.y + win.MINE_SHAFT_HOUSE.h - 1 };
        assertEqual(world.tileGrid[wall.y][wall.x], win.TILE.ROCK, 'shaft door west frame is ROCK');
        assertEqual(
            win.sceneryKindAt(world.tileGrid, rock.x, rock.y, {
                zoneId: 'darkmine',
                houseRects: win.housesForBiome('mine')
            }),
            'rock',
            'darkmine rock kind'
        );
        assertEqual(win.mineRockAt(rock.x, rock.y, 'darkmine', world.tileGrid).x, rock.x, 'mineRockAt matches darkmine');
        assertEqual(win.mineRockAt(rock.x, rock.y, 'haven', world.tileGrid), null, 'same tile is not mined outside darkmine');
        assertEqual(win.mineRockAt(wall.x, wall.y, 'darkmine', world.tileGrid), null, 'shaft house wall is not mined');

        H.click(win, '#tab-bar button[data-tab="skills"]');
        var dropsHost = win.Hud.ensureXpDrops();
        assert(dropsHost && dropsHost.id === 'xp-drops', 'xp-drops host exists');
        dropsHost.innerHTML = '';
        win.Hud.el.log.innerHTML = '';

        clickTile(rock.x, rock.y);
        hero = H.hero(win);
        assertEqual(H.lastChat(win), 'You mine the rock.', 'rock click chat');
        assertEqual(hero.skills.mining.xp, 10, 'rock click grants 10 Mining XP');
        assertEqual(hero.skills.mining.level, 1, '10 XP does not level Mining');
        assertEqual(hero.skills.woodcutting.xp, 0, 'rock click does not grant Woodcutting XP');
        assertEqual(hero.skills.crafting.xp, 0, 'rock click does not grant Crafting XP');
        assertEqual(hero.level, 3, 'combat level unchanged at Mining 1');
        assertEqual(H.lootLive(win).length, 0, 'mine does not drop loot');
        assert(!world.walkTarget, 'mining does not walk');
        var drops = win.document.querySelectorAll('#xp-drops .xp-drop');
        assertEqual(drops.length, 1, 'one Mining XP drop');
        assertEqual(drops[0].getAttribute('data-skill'), 'mining', 'drop skill is mining');
        assertEqual(drops[0].getAttribute('data-xp'), '10', 'drop amount is 10');
        var mineIcon = drops[0].querySelector('img.pix');
        assert(mineIcon && mineIcon.getAttribute('src').indexOf('assets/svg/skills/mining.svg') !== -1, 'Mining skill icon');

        var mineRow = win.document.querySelector('#skills-list [data-skill="mining"]');
        assert(mineRow, 'Mining Skills row exists');
        assert(
            String(mineRow.getAttribute('title') || '').indexOf('10 XP') !== -1,
            'Skills tab shows Mining XP'
        );

        dropsHost.innerHTML = '';
        var helper = win.mineAtRock(hero);
        assert(helper && helper.ok, 'helper mines a rock');
        assertEqual(helper.xp, 10, 'helper grants 10 Mining XP');
        assertEqual(hero.skills.mining.xp, 20, 'helper grants another 10 Mining XP');
        assertEqual(hero.skills.mining.level, 1, '20 XP does not level Mining');
        assertEqual(hero.skills.woodcutting.xp, 0, 'helper does not grant Woodcutting XP');
        win.game.registry.set('hero', hero);
        world.refreshHud();
        drops = win.document.querySelectorAll('#xp-drops .xp-drop');
        assertEqual(drops.length, 1, 'one helper Mining XP drop');
        assertEqual(drops[0].getAttribute('data-skill'), 'mining', 'helper drop skill is mining');
        assertEqual(drops[0].getAttribute('data-xp'), '10', 'helper drop amount is 10');

        H.click(win, '#tab-bar button[data-tab="skills"]');
        mineRow = win.document.querySelector('#skills-list [data-skill="mining"]');
        assert(
            String(mineRow.getAttribute('title') || '').indexOf('20 XP') !== -1,
            'Skills tab shows helper Mining XP'
        );

        dropsHost.innerHTML = '';
        clickTile(rock2.x, rock2.y);
        hero = H.hero(win);
        assertEqual(hero.skills.mining.xp, 30, 'second rock grants another 10 Mining XP');
        assertEqual(H.lastChat(win), 'You mine the rock.', 'second rock chat');

        clickTile(wall.x, wall.y);
        hero = H.hero(win);
        assertEqual(H.lastChat(win), "It's a house wall.", 'shaft wall still examines');
        assertEqual(hero.skills.mining.xp, 30, 'shaft wall grants no Mining XP');

        if (flower) {
            clickTile(flower.tx, flower.ty);
            hero = H.hero(win);
            assertEqual(hero.skills.mining.xp, 30, 'flower grants no Mining XP');
        }

        world.encounterLock = true;
        clickTile(rock.x, rock.y);
        assertEqual(H.hero(win).skills.mining.xp, 30, 'encounterLock grants no Mining XP');
        world.encounterLock = false;

        H.enterZone(win, 'haven');
        world = H.world(win);
        world.encounterLock = false;
        parkWorldBodies(world);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        clickTile(havenRock.x, havenRock.y);
        hero = H.hero(win);
        assertEqual(H.lastChat(win), "It's a rock.", 'haven rock still examines after mine');
        assertEqual(hero.skills.mining.xp, 30, 'haven rock still grants no Mining XP');
        assertEqual(Math.round(world.player.x), 328, 'still at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'still at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        assertEqual(typeof win.smithBar, 'undefined', 'Smithing still not this tick');
        assertEqual(H.hero(win).skills.crafting.xp, 0, 'Crafting XP still 0');
    });
});

EmberwoodTests.add('skills: copper and tin need level 1, iron needs 15', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.setAutoPickup(win, true);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        world.clearLoot();
        if (world.clearWalk) {
            world.clearWalk();
        }
        if (win.Hud.hideContextMenu) {
            win.Hud.hideContextMenu();
        }
        if (win.Hud.clearUseOn) {
            win.Hud.clearUseOn();
        }
        parkWorldBodies(world);
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assertEqual(typeof win.mineAtRock, 'function', 'mineAtRock helper');
        assertEqual(typeof win.mineRockAt, 'function', 'mineRockAt helper');
        assertEqual(typeof win.mineOreAt, 'function', 'mineOreAt helper');
        assertEqual(typeof win.needLevelChat, 'function', 'needLevelChat helper');
        assertEqual(typeof win.resourceNeedLevel, 'function', 'resourceNeedLevel helper');
        assertEqual(win.RESOURCE_LEVEL.copper, 1, 'copper needs Mining 1');
        assertEqual(win.RESOURCE_LEVEL.tin, 1, 'tin needs Mining 1');
        assertEqual(win.RESOURCE_LEVEL.iron, 15, 'iron needs Mining 15');
        assertEqual(win.resourceNeedLevel('copper'), 1, 'copper gate is 1');
        assertEqual(win.resourceNeedLevel('tin'), 1, 'tin gate is 1');
        assertEqual(win.resourceNeedLevel('iron'), 15, 'iron gate is 15');
        assertEqual(win.needLevelChat(15), 'You need level 15.', 'need-level chat');
        assertEqual(typeof win.smithBar, 'undefined', 'Smithing is not this tick');

        function clickTile(tx, ty) {
            var pt = win.tileCenter(tx, ty);
            world.onClick({ worldX: pt.x, worldY: pt.y });
            return pt;
        }

        var copperSpot = win.MINE_PROPS.copper[0];
        var tinSpot = win.MINE_PROPS.tin[0];
        var ironSpot = win.MINE_PROPS.iron[0];
        assertEqual(copperSpot.x, 14, 'copper rock x');
        assertEqual(copperSpot.y, 16, 'copper rock y');
        assertEqual(tinSpot.x, 16, 'tin rock x');
        assertEqual(tinSpot.y, 16, 'tin rock y');
        assertEqual(ironSpot.x, 22, 'iron rock x');
        assertEqual(ironSpot.y, 16, 'iron rock y');
        assertEqual(win.mineOreAt(copperSpot.x, copperSpot.y), 'copper', 'listed copper ore');
        assertEqual(win.mineOreAt(tinSpot.x, tinSpot.y), 'tin', 'listed tin ore');
        assertEqual(win.mineOreAt(ironSpot.x, ironSpot.y), 'iron', 'listed iron ore');

        var hero = win.makeHero();
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assertEqual(hero.skills.mining.level, 1, 'Mining starts 1');
        assertEqual(hero.skills.mining.xp, 0, 'Mining XP starts 0');

        var blocked = win.mineAtRock(hero, 'iron');
        assert(blocked && blocked.ok === false, 'helper blocks iron at Mining 1');
        assertEqual(blocked.need, 15, 'helper need is 15');
        assertEqual(blocked.ore, 'iron', 'helper ore is iron');
        assertEqual(hero.skills.mining.xp, 0, 'blocked helper grants no Mining XP');

        var copperHelper = win.mineAtRock(hero, 'copper');
        assert(copperHelper && copperHelper.ok, 'helper mines copper at Mining 1');
        assertEqual(copperHelper.ore, 'copper', 'helper ore is copper');
        assertEqual(hero.skills.mining.xp, 10, 'copper helper grants Mining XP');

        var tinHelper = win.mineAtRock(hero, 'tin');
        assert(tinHelper && tinHelper.ok, 'helper mines tin at Mining 1');
        assertEqual(tinHelper.ore, 'tin', 'helper ore is tin');
        assertEqual(hero.skills.mining.xp, 20, 'tin helper grants Mining XP');

        H.enterZone(win, 'darkmine');
        world = H.world(win);
        H.setAutoAttack(win, false);
        world.encounterLock = false;
        world.engageTarget = null;
        world.talkTarget = null;
        if (world.clearWalk) {
            world.clearWalk();
        }
        parkWorldBodies(world);
        hero = win.makeHero();
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assertEqual(world.tileGrid[copperSpot.y][copperSpot.x], win.TILE.ROCK, 'copper tile is ROCK');
        assertEqual(world.tileGrid[tinSpot.y][tinSpot.x], win.TILE.ROCK, 'tin tile is ROCK');
        assertEqual(world.tileGrid[ironSpot.y][ironSpot.x], win.TILE.ROCK, 'iron tile is ROCK');
        assertEqual(win.mineRockAt(copperSpot.x, copperSpot.y, 'darkmine', world.tileGrid).ore, 'copper', 'mineRockAt copper');
        assertEqual(win.mineRockAt(tinSpot.x, tinSpot.y, 'darkmine', world.tileGrid).ore, 'tin', 'mineRockAt tin');
        assertEqual(win.mineRockAt(ironSpot.x, ironSpot.y, 'darkmine', world.tileGrid).ore, 'iron', 'mineRockAt iron');
        assertEqual(win.mineRockAt(ironSpot.x, ironSpot.y, 'darkmine', world.tileGrid).level, 15, 'iron rock level 15');
        assertEqual(win.mineRockAt(copperSpot.x, copperSpot.y, 'darkmine', world.tileGrid).level, 1, 'copper rock level 1');

        H.click(win, '#tab-bar button[data-tab="skills"]');
        var dropsHost = win.Hud.ensureXpDrops();
        assert(dropsHost && dropsHost.id === 'xp-drops', 'xp-drops host exists');
        dropsHost.innerHTML = '';
        win.Hud.el.log.innerHTML = '';

        clickTile(ironSpot.x, ironSpot.y);
        hero = H.hero(win);
        assertEqual(H.lastChat(win), 'You need level 15.', 'iron at Mining 1 chats need-level');
        assertEqual(hero.skills.mining.xp, 0, 'iron at Mining 1 grants no XP');
        assertEqual(hero.skills.mining.level, 1, 'Mining stays 1');
        assertEqual(hero.skills.woodcutting.xp, 0, 'iron gate does not grant Woodcutting');
        assertEqual(H.lootLive(win).length, 0, 'gated mine does not drop loot');
        assert(!world.walkTarget, 'gated mine does not walk');
        var drops = win.document.querySelectorAll('#xp-drops .xp-drop');
        assertEqual(drops.length, 0, 'gated mine has no XP drop');

        clickTile(copperSpot.x, copperSpot.y);
        hero = H.hero(win);
        assertEqual(H.lastChat(win), 'You mine the rock.', 'copper at Mining 1 mines');
        assertEqual(hero.skills.mining.xp, 10, 'copper click grants 10 Mining XP');

        clickTile(tinSpot.x, tinSpot.y);
        hero = H.hero(win);
        assertEqual(H.lastChat(win), 'You mine the rock.', 'tin at Mining 1 mines');
        assertEqual(hero.skills.mining.xp, 20, 'tin click grants another 10 Mining XP');

        dropsHost.innerHTML = '';
        win.Hud.el.log.innerHTML = '';
        hero.skills.mining.level = 15;
        win.game.registry.set('hero', hero);
        world.refreshHud();
        clickTile(ironSpot.x, ironSpot.y);
        hero = H.hero(win);
        assertEqual(H.lastChat(win), 'You mine the rock.', 'iron at Mining 15 mines');
        assertEqual(hero.skills.mining.xp, 30, 'iron at Mining 15 grants XP');
        drops = win.document.querySelectorAll('#xp-drops .xp-drop');
        assertEqual(drops.length, 1, 'one Mining XP drop after iron');
        assertEqual(drops[0].getAttribute('data-skill'), 'mining', 'drop skill is mining');
        assertEqual(drops[0].getAttribute('data-xp'), '10', 'drop amount is 10');

        hero.skills.mining.level = 14;
        win.game.registry.set('hero', hero);
        world.refreshHud();
        win.Hud.el.log.innerHTML = '';
        dropsHost.innerHTML = '';
        clickTile(ironSpot.x, ironSpot.y);
        hero = H.hero(win);
        assertEqual(H.lastChat(win), 'You need level 15.', 'iron at Mining 14 still gated');
        assertEqual(hero.skills.mining.xp, 30, 'Mining 14 iron grants no XP');
        drops = win.document.querySelectorAll('#xp-drops .xp-drop');
        assertEqual(drops.length, 0, 'Mining 14 iron has no XP drop');

        H.enterZone(win, 'haven');
        world = H.world(win);
        world.encounterLock = false;
        parkWorldBodies(world);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'still at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'still at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        assertEqual(typeof win.smithBar, 'undefined', 'Smithing still not this tick');
    });
});

EmberwoodTests.add('skills: cowhide to leather or string plus leather grants Crafting XP', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.setAutoPickup(win, true);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        world.clearLoot();
        if (world.clearWalk) {
            world.clearWalk();
        }
        if (win.Hud.hideContextMenu) {
            win.Hud.hideContextMenu();
        }
        if (win.Hud.clearUseOn) {
            win.Hud.clearUseOn();
        }
        parkWorldBodies(world);
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assertEqual(typeof win.tanCowhide, 'function', 'tanCowhide helper');
        assertEqual(typeof win.stitchLeather, 'function', 'stitchLeather helper');
        assertEqual(typeof win.useItemOnItem, 'function', 'useItemOnItem helper');
        assertEqual(typeof win.gainSkillXp, 'function', 'gainSkillXp helper');
        assertEqual(win.CRAFT_HIDE_XP, 14, 'cowhide tans for 14 Crafting XP');
        assertEqual(win.CRAFT_LEATHER_XP, 14, 'string plus leather grants 14 Crafting XP');
        assert(win.ITEM_DB.cowhide, 'cowhide exists');
        assertEqual(win.ITEM_DB.cowhide.tan, 'leather', 'cowhide tans to leather');
        assertEqual(win.ITEM_DB.cowhide.tanXp, 14, 'cowhide tanXp is 14');
        assert(win.ITEM_DB.leather, 'leather exists');
        assert(win.ITEM_DB.string, 'string exists');
        assertEqual(win.itemDefaultVerb('cowhide'), 'tan', 'cowhide default is tan');
        assertEqual(win.itemDefaultVerb('leather'), 'drop', 'leather default is drop');
        assertEqual(win.itemDefaultVerb('string'), 'drop', 'string default is drop');
        assertEqual(typeof win.smithBar, 'undefined', 'Smithing is not this tick');

        function stackQty(hero, id) {
            var stack = hero.inventory.filter(function (row) { return row.id === id; })[0];
            return stack ? stack.qty : 0;
        }

        var hero = win.makeHero();
        win.addItem(hero, 'cowhide', 2);
        win.addItem(hero, 'string', 2);
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assertEqual(stackQty(hero, 'cowhide'), 2, 'starter cowhide 2');
        assertEqual(stackQty(hero, 'string'), 2, 'starter string 2');
        assertEqual(stackQty(hero, 'leather'), 0, 'no leather yet');
        assertEqual(hero.skills.crafting.xp, 0, 'Crafting XP starts 0');
        assertEqual(hero.skills.crafting.level, 1, 'Crafting starts 1');
        assertEqual(hero.skills.mining.xp, 0, 'Mining XP stays 0');
        assertEqual(hero.skills.cooking.xp, 0, 'Cooking XP stays 0');
        assertEqual(hero.level, 3, 'starter combat level 3');

        H.click(win, '#tab-bar button[data-tab="inv"]');
        assert(win.document.querySelector('#inv-grid [data-item="cowhide"]'), 'cowhide slot');
        assert(win.document.querySelector('#inv-grid [data-item="string"]'), 'string slot');
        var dropsHost = win.Hud.ensureXpDrops();
        assert(dropsHost && dropsHost.id === 'xp-drops', 'xp-drops host exists');
        dropsHost.innerHTML = '';
        win.Hud.el.log.innerHTML = '';

        H.click(win, '#inv-grid [data-item="cowhide"]');
        hero = H.hero(win);
        assertEqual(H.lastChat(win), 'You tan the cowhide.', 'tan chat');
        assertEqual(stackQty(hero, 'cowhide'), 1, 'tan consumes one cowhide');
        assertEqual(stackQty(hero, 'leather'), 1, 'tan makes one leather');
        assertEqual(hero.skills.crafting.xp, 14, 'tan grants 14 Crafting XP');
        assertEqual(hero.skills.crafting.level, 1, '14 XP does not level Crafting');
        assertEqual(hero.skills.mining.xp, 0, 'tan does not grant Mining XP');
        assertEqual(hero.skills.cooking.xp, 0, 'tan does not grant Cooking XP');
        assertEqual(hero.level, 3, 'combat level unchanged at Crafting 1');
        assertEqual(H.lootLive(win).length, 0, 'tan does not drop loot');
        var drops = win.document.querySelectorAll('#xp-drops .xp-drop');
        assertEqual(drops.length, 1, 'one Crafting XP drop');
        assertEqual(drops[0].getAttribute('data-skill'), 'crafting', 'drop skill is crafting');
        assertEqual(drops[0].getAttribute('data-xp'), '14', 'drop amount is 14');
        var craftIcon = drops[0].querySelector('img.pix');
        assert(craftIcon && craftIcon.getAttribute('src').indexOf('assets/svg/skills/crafting.svg') !== -1, 'Crafting skill icon');

        H.click(win, '#tab-bar button[data-tab="skills"]');
        var craftRow = win.document.querySelector('#skills-list [data-skill="crafting"]');
        assert(craftRow, 'Crafting Skills row exists');
        assert(
            String(craftRow.getAttribute('title') || '').indexOf('14 XP') !== -1,
            'Skills tab shows Crafting XP'
        );

        dropsHost.innerHTML = '';
        var helper = win.tanCowhide(hero, 'cowhide');
        assert(helper && helper.ok, 'helper tans cowhide');
        assertEqual(helper.made, 'leather', 'helper makes leather');
        assertEqual(helper.xp, 14, 'helper grants 14 Crafting XP');
        assertEqual(hero.skills.crafting.xp, 28, 'helper grants another 14 Crafting XP');
        assertEqual(stackQty(hero, 'cowhide'), 0, 'helper consumes last cowhide');
        assertEqual(stackQty(hero, 'leather'), 2, 'helper makes second leather');
        win.game.registry.set('hero', hero);
        world.refreshHud();
        drops = win.document.querySelectorAll('#xp-drops .xp-drop');
        assertEqual(drops.length, 1, 'one helper Crafting XP drop');
        assertEqual(drops[0].getAttribute('data-skill'), 'crafting', 'helper drop skill is crafting');
        assertEqual(drops[0].getAttribute('data-xp'), '14', 'helper drop amount is 14');

        H.click(win, '#tab-bar button[data-tab="inv"]');
        var menu = win.document.getElementById('ctx-menu');
        var slot = win.document.querySelector('#inv-grid [data-item="string"]');
        slot.dispatchEvent(new win.MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            view: win,
            button: 2,
            clientX: 40,
            clientY: 80
        }));
        assert(!menu.hidden, 'right-click string opens menu');
        var useBtn = menu.querySelector('[data-ctx="use"]');
        assert(useBtn, 'Use is listed');
        H.mouseClick(win, useBtn);
        assertEqual(win.Hud.useOnId, 'string', 'use-on id is string');
        assertEqual(H.lastChat(win), 'Use String ->', 'use-on prompt chat');

        dropsHost.innerHTML = '';
        H.click(win, '#inv-grid [data-item="leather"]');
        hero = H.hero(win);
        assertEqual(H.lastChat(win), 'You stitch the leather.', 'stitch chat');
        assertEqual(stackQty(hero, 'string'), 1, 'stitch consumes one string');
        assertEqual(stackQty(hero, 'leather'), 1, 'stitch consumes one leather');
        assertEqual(hero.skills.crafting.xp, 42, 'stitch grants another 14 Crafting XP');
        assertEqual(win.Hud.useOnId, null, 'cursor clears after stitch');
        drops = win.document.querySelectorAll('#xp-drops .xp-drop');
        assertEqual(drops.length, 1, 'one stitch Crafting XP drop');
        assertEqual(drops[0].getAttribute('data-xp'), '14', 'stitch drop amount is 14');

        dropsHost.innerHTML = '';
        var stitched = win.stitchLeather(hero);
        assert(stitched && stitched.ok, 'helper stitches leather');
        assertEqual(stitched.xp, 14, 'helper stitch grants 14 Crafting XP');
        assertEqual(hero.skills.crafting.xp, 56, 'helper stitch grants another 14 Crafting XP');
        assertEqual(stackQty(hero, 'string'), 0, 'helper consumes last string');
        assertEqual(stackQty(hero, 'leather'), 0, 'helper consumes last leather');
        assertEqual(win.useItemOnItem(hero, 'string', 'leather'), null, 'empty stitch grants no XP');
        assertEqual(hero.skills.crafting.xp, 56, 'empty stitch leaves XP');

        win.addItem(hero, 'string', 1);
        win.addItem(hero, 'bones', 1);
        win.game.registry.set('hero', hero);
        world.refreshHud();
        win.Hud.beginUseOn('string');
        H.click(win, '#inv-grid [data-item="bones"]');
        hero = H.hero(win);
        assertEqual(H.lastChat(win), 'Nothing interesting happens.', 'string on bones misses');
        assertEqual(stackQty(hero, 'string'), 1, 'miss does not consume string');
        assertEqual(hero.skills.crafting.xp, 56, 'miss grants no Crafting XP');
        assertEqual(win.Hud.useOnId, null, 'miss clears cursor');

        win.addItem(hero, 'cowhide', 1);
        win.game.registry.set('hero', hero);
        world.refreshHud();
        world.encounterLock = true;
        H.click(win, '#inv-grid [data-item="cowhide"]');
        assertEqual(H.hero(win).skills.crafting.xp, 56, 'encounterLock grants no Crafting XP');
        assertEqual(stackQty(H.hero(win), 'cowhide'), 1, 'encounterLock does not tan');
        world.encounterLock = false;

        assertEqual(Math.round(world.player.x), 328, 'still at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'still at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        assertEqual(typeof win.smithBar, 'undefined', 'Smithing still not this tick');
        assertEqual(H.hero(win).skills.mining.xp, 0, 'Mining XP still 0');
    });
});

EmberwoodTests.add('skills: Firemaking listed and firemakeAt grants Firemaking XP', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.setAutoPickup(win, true);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        world.clearLoot();
        if (world.clearWalk) {
            world.clearWalk();
        }
        if (win.Hud.hideContextMenu) {
            win.Hud.hideContextMenu();
        }
        if (win.Hud.clearUseOn) {
            win.Hud.clearUseOn();
        }
        parkWorldBodies(world);
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assertEqual(typeof win.firemakeAt, 'function', 'firemakeAt helper');
        assertEqual(typeof win.lightFire, 'function', 'lightFire helper');
        assertEqual(typeof win.useItemOnScenery, 'function', 'useItemOnScenery helper');
        assertEqual(typeof win.gainSkillXp, 'function', 'gainSkillXp helper');
        assertEqual(win.FIREMAKE_XP, 10, 'Firemaking grants 10 XP');
        assertEqual(typeof win.smithBar, 'undefined', 'Smithing is not this tick');
        assertEqual(typeof win.smithAt, 'undefined', 'Smithing helper is not this tick');
        assert(!win.ITEM_DB.logs && !win.ITEM_DB.tinderbox && !win.ITEM_DB.ore && !win.ITEM_DB.net,
            'no gathering section items');
        assertEqual(win.itemCanUseOn('rawshrimp', 'fire'), true, 'Use-on still targets fire');
        assertEqual(win.itemCanUseOn('rawshrimp', 'range'), true, 'Use-on still targets range');
        var skillIds = win.SKILL_NAMES.map(function (pair) { return pair[0]; });
        assert(skillIds.indexOf('firemaking') !== -1, 'Firemaking is listed');
        assertEqual(skillIds.indexOf('smithing'), -1, 'Smithing is not listed');
        assertEqual(win.SKILL_NAMES.length, 13, 'thirteen skills including Firemaking');
        assertEqual(win.SKILL_NAMES[12][0], 'firemaking', 'Firemaking is the extra skill');
        assertEqual(win.skillIcon('firemaking'), 'assets/svg/skills/firemaking.svg', 'Firemaking icon path');

        function clickTile(tx, ty) {
            var pt = win.tileCenter(tx, ty);
            world.onClick({ worldX: pt.x, worldY: pt.y });
            return pt;
        }

        var hero = win.makeHero();
        win.addItem(hero, 'rawshrimp', 1);
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assertEqual(hero.skills.firemaking.xp, 0, 'Firemaking XP starts 0');
        assertEqual(hero.skills.firemaking.level, 1, 'Firemaking starts 1');
        assertEqual(hero.skills.cooking.xp, 0, 'Cooking XP stays 0');
        assertEqual(hero.skills.crafting.xp, 0, 'Crafting XP stays 0');
        assertEqual(win.skillTotal(hero), 22, 'starter total includes Firemaking');
        assertEqual(hero.level, 3, 'starter combat level 3');

        H.click(win, '#tab-bar button[data-tab="skills"]');
        assert(H.panelVisible(win, 'skills'), 'skills panel visible');
        var rows = win.document.querySelectorAll('#skills-list .skill-row');
        assertEqual(rows.length, 13, 'thirteen skill rows');
        var fireRow = win.document.querySelector('#skills-list [data-skill="firemaking"]');
        assert(fireRow, 'Firemaking Skills row exists');
        var fireImg = fireRow.querySelector('img.pix');
        assert(fireImg && fireImg.getAttribute('src').indexOf('assets/svg/skills/firemaking.svg') !== -1,
            'Firemaking skill icon');

        H.click(win, '#tab-bar button[data-tab="inv"]');
        var dropsHost = win.Hud.ensureXpDrops();
        assert(dropsHost && dropsHost.id === 'xp-drops', 'xp-drops host exists');
        dropsHost.innerHTML = '';
        win.Hud.el.log.innerHTML = '';

        win.Hud.beginUseOn('rawshrimp');
        clickTile(16, 17);
        hero = H.hero(win);
        assertEqual(H.lastChat(win), 'You use the Raw shrimp on the fire.', 'raw-on-range chat');
        assertEqual(hero.skills.cooking.xp, 30, 'Use-on fire still grants Cooking XP');
        assertEqual(hero.skills.firemaking.xp, 0, 'Use-on cook does not grant Firemaking XP');
        assertEqual(win.Hud.useOnId, null, 'cursor clears after range');

        dropsHost.innerHTML = '';
        win.Hud.el.log.innerHTML = '';
        var helper = win.firemakeAt(hero);
        assert(helper && helper.ok, 'firemakeAt helper succeeds');
        assertEqual(helper.xp, 10, 'helper grants 10 Firemaking XP');
        assertEqual(hero.skills.firemaking.xp, 10, 'firemakeAt grants 10 Firemaking XP');
        assertEqual(hero.skills.firemaking.level, 1, '10 XP does not level Firemaking');
        assertEqual(hero.skills.cooking.xp, 30, 'firemakeAt does not grant Cooking XP');
        assertEqual(hero.level, 3, 'combat level unchanged at Firemaking 1');
        var drops = win.document.querySelectorAll('#xp-drops .xp-drop');
        assertEqual(drops.length, 1, 'one Firemaking XP drop');
        assertEqual(drops[0].getAttribute('data-skill'), 'firemaking', 'drop skill is firemaking');
        assertEqual(drops[0].getAttribute('data-xp'), '10', 'drop amount is 10');
        var fireIcon = drops[0].querySelector('img.pix');
        assert(fireIcon && fireIcon.getAttribute('src').indexOf('assets/svg/skills/firemaking.svg') !== -1,
            'Firemaking drop icon');

        win.game.registry.set('hero', hero);
        world.refreshHud();
        H.click(win, '#tab-bar button[data-tab="skills"]');
        fireRow = win.document.querySelector('#skills-list [data-skill="firemaking"]');
        assert(
            String(fireRow.getAttribute('title') || '').indexOf('10 XP') !== -1,
            'Skills tab shows Firemaking XP'
        );

        dropsHost.innerHTML = '';
        var alias = win.lightFire(hero);
        assert(alias && alias.ok, 'lightFire alias succeeds');
        assertEqual(alias.xp, 10, 'lightFire grants 10 Firemaking XP');
        assertEqual(hero.skills.firemaking.xp, 20, 'lightFire grants another 10 Firemaking XP');
        assertEqual(hero.skills.firemaking.level, 1, '20 XP does not level Firemaking');
        drops = win.document.querySelectorAll('#xp-drops .xp-drop');
        assertEqual(drops.length, 1, 'one helper Firemaking XP drop');
        assertEqual(drops[0].getAttribute('data-skill'), 'firemaking', 'alias drop skill is firemaking');

        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        return win.fetch('assets/svg/skills/firemaking.svg').then(function (res) {
            assert(res.ok, 'Firemaking svg exists');
            assertEqual(res.status, 200, 'Firemaking svg status 200');
            return res.text();
        }).then(function (body) {
            assert(body.indexOf('<svg') !== -1, 'Firemaking body is SVG');
            assertEqual(Math.round(world.player.x), 328, 'still at spawn x');
            assertEqual(Math.round(world.player.y), 248, 'still at spawn y');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
            assertEqual(typeof win.smithBar, 'undefined', 'Smithing still not this tick');
            assertEqual(H.hero(win).skills.firemaking.xp, 20, 'Firemaking XP still 20');
        });
    });
});

EmberwoodTests.add('skills: unused stretch skills stay backlog-only without empty tabs', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        if (world.clearWalk) {
            world.clearWalk();
        }
        parkWorldBodies(world);
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assertEqual(typeof win.isStretchSkill, 'function', 'isStretchSkill helper');
        assert(win.STRETCH_SKILL_NAMES && win.STRETCH_SKILL_NAMES.length === 9, 'nine stretch skills');
        assertEqual(typeof win.smithBar, 'undefined', 'Smithing is not this tick');
        assert(!win.ITEM_DB.logs && !win.ITEM_DB.tinderbox && !win.ITEM_DB.ore && !win.ITEM_DB.net,
            'no gathering section items');

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
        expected.forEach(function (pair, i) {
            assertEqual(win.STRETCH_SKILL_NAMES[i][0], pair[0], pair[1] + ' stretch id');
            assertEqual(win.STRETCH_SKILL_NAMES[i][1], pair[1], pair[1] + ' stretch name');
            assertEqual(win.isStretchSkill(pair[0]), true, pair[1] + ' is stretch');
        });
        assertEqual(win.isStretchSkill('firemaking'), false, 'Firemaking is playable');
        assertEqual(win.isStretchSkill('smithing'), false, 'Smithing is gathering not stretch');

        var listed = win.SKILL_NAMES.map(function (pair) { return pair[0]; });
        assertEqual(win.SKILL_NAMES.length, 13, 'thirteen playable skills');
        assertEqual(win.SKILL_NAMES[12][0], 'firemaking', 'Firemaking is the extra skill');
        expected.forEach(function (pair) {
            assertEqual(listed.indexOf(pair[0]), -1, pair[1] + ' is not in SKILL_NAMES');
        });
        assertEqual(listed.indexOf('smithing'), -1, 'Smithing is not listed');

        var hero = win.makeHero();
        win.game.registry.set('hero', hero);
        world.refreshHud();
        hero = H.hero(win);
        assert(hero.skills.agility, 'Agility stays on the hero for shortcuts');
        assertEqual(hero.skills.agility.level, 1, 'starter Agility is 1');
        expected.forEach(function (pair) {
            if (pair[0] === 'agility') {
                return;
            }
            assertEqual(typeof hero.skills[pair[0]], 'undefined', pair[1] + ' is not a stub skill');
        });
        assertEqual(typeof hero.skills.smithing, 'undefined', 'Smithing is not a stub skill');
        assertEqual(win.skillTotal(hero), 22, 'starter total ignores unused Agility');
        hero.skills.agility.level = 99;
        win.game.registry.set('hero', hero);
        world.refreshHud();
        assertEqual(win.skillTotal(hero), 22, 'Agility 99 still ignored by total');

        H.click(win, '#tab-bar button[data-tab="skills"]');
        assert(H.panelVisible(win, 'skills'), 'skills panel visible');
        var rows = win.document.querySelectorAll('#skills-list .skill-row');
        assertEqual(rows.length, 13, 'thirteen skill rows');
        expected.forEach(function (pair) {
            assertEqual(
                win.document.querySelectorAll('#skills-list [data-skill="' + pair[0] + '"]').length,
                0,
                pair[1] + ' has no Skills-tab row'
            );
        });
        assert(
            win.document.querySelector('#skills-list [data-skill="firemaking"]'),
            'Firemaking Skills row stays'
        );

        var tabs = win.document.querySelectorAll('#tab-bar button[data-tab]');
        assertEqual(tabs.length, 8, 'eight HUD tabs');
        var tabIds = [];
        for (var t = 0; t < tabs.length; t++) {
            tabIds.push(tabs[t].getAttribute('data-tab'));
        }
        assertEqual(tabIds.join(','), 'combat,skills,quest,inv,equip,prayer,magic,settings', 'HUD tabs unchanged');
        expected.forEach(function (pair) {
            assertEqual(tabIds.indexOf(pair[0]), -1, pair[1] + ' has no HUD tab');
            assertEqual(
                win.document.querySelectorAll('#tab-bar [data-tab="' + pair[0] + '"]').length,
                0,
                pair[1] + ' is not a stub tab'
            );
        });

        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'still at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'still at spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        assertEqual(typeof win.smithBar, 'undefined', 'Smithing still not this tick');
        assertEqual(typeof world.tryAgilityShortcut, 'function', 'Agility shortcut helper stays');
    });
});

EmberwoodTests.add('combat: Attack auto-selects index 0 and rolls damage -2..+2 min 1', function (win, H) {
    H.enterZone(win, 'haven');
    H.setAutoAttack(win, false);
    var spawn = win.defaultWorldSpawn();
    assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
    assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
    H.world(win).placePlayer(spawn.x, spawn.y);
    assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
    return H.startCustomFight(win, [
        { type: 'Goblin', texture: 'slime', tint: 0x5aa33a, hp: 80, damage: 1, gold: 0, xp: 1 }
    ]).then(function () {
        var battle = H.battle(win);
        assertEqual(battle.enemies.length, 1, 'one foe');
        assertEqual(battle.targetIndex, 0, 'startBattle auto-selects index 0');
        battle.targetIndex = null;
        assertEqual(battle.autoSelectTarget(), 0, 'autoSelectTarget picks living[0]');
        assertEqual(battle.targetIndex, 0, 'targetIndex restored to 0');

        var foe = battle.enemies[0];
        var dmg = battle.heroes[0].damage;
        assert(dmg >= 1, 'hero has melee damage');
        var orig = win.Phaser.Math.Between;
        var seen = [];
        function stubBetween(value) {
            win.Phaser.Math.Between = function (lo, hi) {
                seen.push([lo, hi]);
                return value;
            };
        }
        try {
            stubBetween(-2);
            var hp = foe.hp;
            assertEqual(foe.takeDamage(dmg), dmg - 2, 'variance -2');
            assertEqual(foe.hp, hp - (dmg - 2), 'hp drop at -2');
            stubBetween(2);
            hp = foe.hp;
            assertEqual(foe.takeDamage(dmg), dmg + 2, 'variance +2');
            assertEqual(foe.hp, hp - (dmg + 2), 'hp drop at +2');
            stubBetween(-2);
            hp = foe.hp;
            assertEqual(foe.takeDamage(0), 1, 'min 1 when roll would be negative');
            assertEqual(foe.hp, hp - 1, 'min 1 applied');
            assert(seen.length >= 3, 'Between used for each hit');
            seen.forEach(function (pair) {
                assertEqual(pair[0], -2, 'Between low is -2');
                assertEqual(pair[1], 2, 'Between high is +2');
            });
        } finally {
            win.Phaser.Math.Between = orig;
        }

        var before = foe.hp;
        win.Hud.tryAttack();
        return H.sleep(280).then(function () {
            var drop = before - foe.hp;
            assert(drop >= 1, 'Attack deals at least 1');
            assert(drop >= dmg - 2 && drop <= dmg + 2, 'Attack variance -2..+2');
            assertEqual(battle.targetIndex, 0, 'Attack still on index 0');
            assert(foe.living, 'tanky foe survived one hit');
            return H.forceFlee(win);
        });
    }).then(function () {
        H.enterZone(win, 'haven');
    }).catch(function (err) {
        return H.cleanupBattle(win).then(function () {
            throw err;
        });
    });
});

EmberwoodTests.add('loot: win drops coins bones and extra food at the mob feet', function (win, H) {
    function idsOf(drops) {
        return drops.map(function (drop) { return drop.id; }).join(',');
    }
    function goldQty(drops) {
        var coin = drops.filter(function (drop) { return drop.id === 'coins'; })[0];
        return coin ? coin.qty : 0;
    }
    var chickenTable = win.lootForMob({ type: 'Chicken', gold: 1 });
    assertEqual(idsOf(chickenTable), 'coins,bones,shrimp', 'chicken table');
    assertEqual(goldQty(chickenTable), 1, 'chicken gold qty');
    var crabTable = win.lootForMob({ type: 'Crab', gold: 4 });
    assertEqual(idsOf(crabTable), 'coins,bones,shrimp', 'crab table');
    assertEqual(goldQty(crabTable), 4, 'crab gold qty');
    var cowTable = win.lootForMob({ type: 'Cow', gold: 3 });
    assertEqual(idsOf(cowTable), 'coins,bones,bread', 'cow table');
    assertEqual(goldQty(cowTable), 3, 'cow gold qty');
    var goblinTable = win.lootForMob({ type: 'Goblin', gold: 6 });
    assertEqual(idsOf(goblinTable), 'coins,bones', 'goblin no extra food');

    H.setAutoAttack(win, false);
    var spawn = win.defaultWorldSpawn();
    assertEqual(spawn.x, 328, 'spawn x');
    assertEqual(spawn.y, 248, 'spawn y');
    return H.cleanupBattle(win).then(function () {

    function winAndCheck(zoneId, type, extraId) {
        H.enterZone(win, zoneId);
        H.world(win).placePlayer(spawn.x, spawn.y);
        var mob = H.findMob(win, type);
        assert(mob, type + ' exists in ' + zoneId);
        var feetX = mob.x;
        var feetY = mob.y;
        var gold = mob.mobDef.gold;
        return H.startFight(win, mob).then(function () {
            return H.attackUntilWorld(win);
        }).then(function () {
            assert(H.chatHas(win, 'Loot drops'), type + ' drop chat');
            var live = H.assertLootAtFeet(win, feetX, feetY, ['coins', 'bones', extraId]);
            var coins = live.filter(function (drop) { return drop.id === 'coins'; })[0];
            assertEqual(coins.qty, gold, type + ' coins match mob gold');
            assert(!mob.aliveMob, type + ' despawned');
        });
    }

    return winAndCheck('haven', 'Chicken', 'shrimp').then(function () {
        return winAndCheck('southshore', 'Crab', 'shrimp');
    }).then(function () {
        return winAndCheck('millfields', 'Cow', 'bread');
    }).then(function () {
        var hero = H.hero(win);
        hero.hp = hero.maxHp;
        win.game.registry.set('hero', hero);
        assert(!win.game.input.keyboard, 'Phaser keyboard stays off');
        H.enterZone(win, 'haven');
        H.world(win).placePlayer(328, 248);
        H.world(win).refreshHud();
    });
    });
});

EmberwoodTests.add('loot: item-sword and item-shield load so ground drops show them', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.setAutoPickup(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.clearLoot();
        world.encounterLock = false;
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        ['coins', 'bones', 'shrimp', 'bread', 'sword', 'shield'].forEach(function (id) {
            assert(win.game.textures.exists('item-' + id), 'item-' + id + ' is loaded');
        });

        world.spawnLoot(spawn.x, spawn.y, [
            { id: 'sword', qty: 1 },
            { id: 'shield', qty: 1 }
        ]);
        var live = H.lootLive(win);
        assertEqual(live.length, 2, 'sword and shield ground pile');
        assertEqual(live[0].id, 'sword', 'first drop is sword');
        assertEqual(live[1].id, 'shield', 'second drop is shield');
        assert(live[0].sprite, 'sword has a sprite');
        assert(live[1].sprite, 'shield has a sprite');
        assertEqual(live[0].sprite.texture.key, 'item-sword', 'sword sprite uses item-sword');
        assertEqual(live[1].sprite.texture.key, 'item-shield', 'shield sprite uses item-shield');
        assert(live[0].sprite.texture.key !== '__MISSING', 'sword is not the missing texture');
        assert(live[1].sprite.texture.key !== '__MISSING', 'shield is not the missing texture');
        assertEqual(live[0].sprite.x, spawn.x - 5, 'sword offset -5');
        assertEqual(live[1].sprite.x, spawn.x + 5, 'shield offset +5');
        assertEqual(live[0].sprite.y, spawn.y + 4, 'sword sits at feet y+4');
        assertEqual(live[1].sprite.y, spawn.y + 4, 'shield sits at feet y+4');

        world.clearLoot();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('loot: sprites are interactive and offset by 10px per extra drop', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.setAutoPickup(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.clearLoot();
        world.encounterLock = false;
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        function assertInteractiveOffsets(feetX, feetY, drops, expectedXs) {
            world.clearLoot();
            world.spawnLoot(feetX, feetY, drops);
            var live = H.lootLive(win);
            assertEqual(live.length, drops.length, drops.length + '-drop pile size');
            live.forEach(function (drop, index) {
                var sprite = drop.sprite;
                assert(sprite, drop.id + ' has a sprite');
                assert(sprite.input, drop.id + ' is interactive');
                assert(sprite.input.enabled !== false, drop.id + ' input enabled');
                assertEqual(sprite.input.cursor, 'pointer', drop.id + ' uses hand cursor');
                assert(sprite.listenerCount('pointerdown') >= 1, drop.id + ' listens for pointerdown');
                assertEqual(sprite.x, expectedXs[index], drop.id + ' x is 10px per extra drop');
                assertEqual(sprite.y, feetY + 4, drop.id + ' sits at feet y+4');
                if (index > 0) {
                    assertEqual(sprite.x - live[index - 1].sprite.x, 10, drop.id + ' is 10px from previous drop');
                }
            });
            return live;
        }

        assertInteractiveOffsets(200, 200, [{ id: 'coins', qty: 1 }], [200]);
        assertInteractiveOffsets(200, 200, [{ id: 'coins', qty: 1 }, { id: 'bones', qty: 1 }], [195, 205]);
        assertInteractiveOffsets(200, 200, [
            { id: 'coins', qty: 1 },
            { id: 'bones', qty: 1 },
            { id: 'shrimp', qty: 1 }
        ], [190, 200, 210]);

        var chicken = H.findMob(win, 'Chicken');
        assert(chicken && chicken.aliveMob, 'living chicken in haven');
        var table = win.lootForMob(chicken.mobDef);
        assertEqual(table.map(function (drop) { return drop.id; }).join(','), 'coins,bones,shrimp', 'chicken table');
        var atFeet = assertInteractiveOffsets(chicken.x, chicken.y, table, [
            chicken.x - 10,
            chicken.x,
            chicken.x + 10
        ]);
        assertEqual(atFeet[0].id, 'coins', 'first extra drop is coins at -10');
        assertEqual(atFeet[2].id, 'shrimp', 'second extra drop is shrimp at +10');

        world.clearLoot();
        world.spawnLoot(200, 200, [{ id: 'coins', qty: 2 }]);
        var gold = H.hero(win).gold;
        H.lootLive(win)[0].sprite.emit('pointerdown');
        assertEqual(H.hero(win).gold, gold + 2, 'pointerdown picks up coins');
        assert(H.chatHas(win, 'You pick up'), 'click pickup chat');
        assertEqual(H.lootLive(win).length, 0, 'clicked pile taken');

        world.clearLoot();
        world.placePlayer(spawn.x, spawn.y);
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('loot: expires at until = now + 20000 and the sprite is destroyed', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.setAutoPickup(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.clearLoot();
        world.encounterLock = false;
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(typeof world.spawnLoot, 'function', 'spawnLoot helper');
        assertEqual(typeof world.pruneLoot, 'function', 'pruneLoot helper');

        var spawnedAt = world.time.now;
        world.spawnLoot(80, 80, [{ id: 'coins', qty: 1 }, { id: 'bones', qty: 1 }]);
        var live = H.lootLive(win);
        assertEqual(live.length, 2, 'two ground drops spawned');
        assertEqual(live[0].until, spawnedAt + 20000, 'first until is now + 20000');
        assertEqual(live[1].until, spawnedAt + 20000, 'second until is now + 20000');
        var sprites = live.map(function (drop) { return drop.sprite; });
        sprites.forEach(function (sprite, i) {
            assert(sprite, 'drop ' + i + ' has a sprite');
            assert(sprite.active !== false, 'drop ' + i + ' sprite is active');
        });

        world.pruneLoot();
        assertEqual(H.lootLive(win).length, 2, 'prune keeps loot before until');
        assert(sprites[0].active !== false, 'first sprite still live before until');
        assert(sprites[1].active !== false, 'second sprite still live before until');

        var savedNow = world.time.now;
        world.time.now = live[0].until;
        if (world.time.now !== live[0].until && typeof world.time.update === 'function') {
            world.time.update(live[0].until, 0);
        }
        world.pruneLoot();
        assertEqual(H.lootLive(win).length, 2, 'loot remains at exactly until');

        world.time.now = live[0].until + 1;
        if (world.time.now <= live[0].until && typeof world.time.update === 'function') {
            world.time.update(live[0].until + 1, 20001);
        }
        assert(world.time.now > live[0].until, 'clock is past until');
        world.pruneLoot();
        assertEqual(H.lootLive(win).length, 0, 'expired loot removed from groundLoot');
        assertEqual((world.groundLoot || []).length, 0, 'groundLoot array empty after expiry');
        sprites.forEach(function (sprite, i) {
            assert(isDestroyedGo(sprite), 'expired sprite ' + i + ' is destroyed');
        });

        world.time.now = savedNow;
        world.clearLoot();
        world.placePlayer(spawn.x, spawn.y);
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('loot: prune and pickup do not throw if a sprite was already destroyed', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.setAutoPickup(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.clearLoot();
        world.encounterLock = false;
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(typeof world.tryPickup, 'function', 'tryPickup helper');
        assertEqual(typeof world.pruneLoot, 'function', 'pruneLoot helper');
        assertEqual(typeof world.collectNearbyLoot, 'function', 'collectNearbyLoot helper');

        function destroySpriteKeepRef(drop) {
            assert(drop && drop.sprite, 'drop has a sprite to destroy');
            drop.sprite.destroy();
            assert(isDestroyedGo(drop.sprite), 'sprite already destroyed, drop still holds the ref');
            assert(drop.sprite, 'stale sprite ref remains');
        }

        function assertNoThrow(fn, label) {
            try {
                fn();
            } catch (err) {
                throw new Error(label + ' threw: ' + (err && err.message ? err.message : err));
            }
        }

        world.spawnLoot(spawn.x, spawn.y, [{ id: 'coins', qty: 2 }]);
        var pickDrop = H.lootLive(win)[0];
        destroySpriteKeepRef(pickDrop);
        var gold = H.hero(win).gold;
        var picked = false;
        assertNoThrow(function () {
            picked = world.tryPickup(pickDrop);
        }, 'tryPickup after sprite.destroy');
        assertEqual(picked, true, 'tryPickup still takes the drop');
        assertEqual(H.hero(win).gold, gold + 2, 'gold looted after destroyed-sprite pickup');
        assert(H.chatHas(win, 'You pick up'), 'pickup chat after destroyed sprite');
        assertEqual(pickDrop.sprite, null, 'tryPickup nulls the stale sprite');

        world.clearLoot();
        H.setAutoPickup(win, true);
        world.spawnLoot(spawn.x, spawn.y, [{ id: 'bones', qty: 1 }]);
        var walkDrop = H.lootLive(win)[0];
        destroySpriteKeepRef(walkDrop);
        var bonesBefore = (H.hero(win).inventory.filter(function (s) { return s.id === 'bones'; })[0] || { qty: 0 }).qty;
        assertNoThrow(function () {
            world.collectNearbyLoot();
        }, 'collectNearbyLoot after sprite.destroy');
        assertEqual((H.hero(win).inventory.filter(function (s) { return s.id === 'bones'; })[0] || { qty: 0 }).qty, bonesBefore + 1, 'walk-over pickup after destroyed sprite');

        world.clearLoot();
        H.setAutoPickup(win, false);
        world.spawnLoot(80, 80, [{ id: 'coins', qty: 1 }]);
        var expireDrop = H.lootLive(win)[0];
        var expireSprite = expireDrop.sprite;
        var savedNow = world.time.now;
        destroySpriteKeepRef(expireDrop);
        world.time.now = expireDrop.until + 1;
        if (world.time.now <= expireDrop.until && typeof world.time.update === 'function') {
            world.time.update(expireDrop.until + 1, 20001);
        }
        assert(world.time.now > expireDrop.until, 'clock is past until');
        assertNoThrow(function () {
            world.pruneLoot();
        }, 'pruneLoot after sprite.destroy');
        assertEqual((world.groundLoot || []).length, 0, 'expired destroyed sprite is removed');
        assert(isDestroyedGo(expireSprite), 'stale expire sprite stays destroyed');

        world.time.now = savedNow;
        world.clearLoot();
        world.spawnLoot(80, 80, [{ id: 'shrimp', qty: 1 }]);
        var takenDrop = H.lootLive(win)[0];
        var takenSprite = takenDrop.sprite;
        destroySpriteKeepRef(takenDrop);
        takenDrop.taken = true;
        assertNoThrow(function () {
            world.pruneLoot();
        }, 'pruneLoot taken path after sprite.destroy');
        assertEqual((world.groundLoot || []).length, 0, 'taken destroyed sprite is removed');
        assert(isDestroyedGo(takenSprite), 'stale taken sprite stays destroyed');

        world.time.now = savedNow;
        world.clearLoot();
        world.placePlayer(spawn.x, spawn.y);
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('loot: persist ground loot when leaving a zone', function (win, H) {
    function snapLive(drops) {
        return drops.map(function (drop) {
            return {
                id: drop.id,
                qty: drop.qty,
                x: drop.sprite.x,
                y: drop.sprite.y,
                until: drop.until
            };
        });
    }

    function assertRestored(win, H, saved, via) {
        var live = H.lootLive(win);
        assertEqual(live.length, saved.length, via + ' restored live loot count');
        saved.forEach(function (want) {
            var got = live.filter(function (drop) {
                return drop.id === want.id && drop.qty === want.qty;
            })[0];
            assert(got, via + ' restored ' + want.id);
            assertEqual(got.until, want.until, via + ' ' + want.id + ' keeps original until');
            assertEqual(Math.round(got.sprite.x), Math.round(want.x), via + ' ' + want.id + ' x');
            assertEqual(Math.round(got.sprite.y), Math.round(want.y), via + ' ' + want.id + ' y');
            assert(got.sprite.active !== false, via + ' ' + want.id + ' sprite is live');
        });
    }

    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.setAutoPickup(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.clearLoot();
        world.encounterLock = false;
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(typeof world.clearLoot, 'function', 'clearLoot helper');
        assertEqual(typeof world.snapshotLoot, 'function', 'snapshotLoot helper');
        assertEqual(typeof world.restoreLoot, 'function', 'restoreLoot helper');
        assertEqual(typeof world.enterZone, 'function', 'enterZone helper');

        var gold = H.hero(win).gold;
        var invLen = H.hero(win).inventory.length;
        var spawnedAt = world.time.now;
        world.spawnLoot(200, 200, [{ id: 'coins', qty: 3 }, { id: 'bones', qty: 1 }]);
        var live = H.lootLive(win);
        assertEqual(live.length, 2, 'haven has ground loot before leave');
        assertEqual(live[0].until, spawnedAt + 20000, 'first until is now + 20000');
        assertEqual(live[1].until, spawnedAt + 20000, 'second until is now + 20000');
        var saved = snapLive(live);
        var sprites = live.map(function (drop) { return drop.sprite; });
        sprites.forEach(function (sprite, i) {
            assert(sprite, 'drop ' + i + ' has a sprite');
            assert(sprite.active !== false, 'drop ' + i + ' sprite is active');
        });
        var chatBefore = H.chat(win).length;

        world.enterZone('northwood', null);
        world = H.world(win);
        assertEqual(world.zoneId, 'northwood', 'enterZone lands in Northwood');
        assertEqual((world.groundLoot || []).length, 0, 'Northwood has no haven pile');
        assertEqual(H.lootLive(win).length, 0, 'no live loot in Northwood');
        sprites.forEach(function (sprite, i) {
            assert(isDestroyedGo(sprite), 'old loot sprite ' + i + ' is destroyed');
        });
        assertEqual(H.hero(win).gold, gold, 'gold unchanged after leave');
        assertEqual(H.hero(win).inventory.length, invLen, 'inventory unchanged after leave');
        var newChat = H.chat(win).slice(chatBefore);
        assert(!newChat.some(function (line) {
            return line.indexOf('You pick up') !== -1;
        }), 'zone change does not pick up loot');

        H.enterZone(win, 'haven');
        world = H.world(win);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(world.zoneId, 'haven', 'returned to Emberhaven');
        assertRestored(win, H, saved, 'enterZone return');
        sprites.forEach(function (sprite, i) {
            assert(isDestroyedGo(sprite), 'returned loot uses a new sprite ' + i);
        });
        assertEqual(H.hero(win).gold, gold, 'gold still unchanged after return');
        assertEqual(H.hero(win).inventory.length, invLen, 'inventory still unchanged after return');

        world.pruneLoot();
        assertEqual(H.lootLive(win).length, 2, 'prune keeps persisted loot before until');
        var savedNow = world.time.now;
        world.time.now = saved[0].until;
        world.pruneLoot();
        assertEqual(H.lootLive(win).length, 2, 'persisted loot remains at exactly until');
        world.time.now = saved[0].until + 1;
        world.pruneLoot();
        assertEqual(H.lootLive(win).length, 0, 'persisted loot expires after until');
        world.time.now = savedNow;

        world.clearLoot();
        world.spawnLoot(80, 80, [{ id: 'coins', qty: 1 }, { id: 'shrimp', qty: 1 }]);
        var walkLive = H.lootLive(win);
        var walkSaved = snapLive(walkLive);
        var walkSprites = walkLive.map(function (drop) { return drop.sprite; });
        assertEqual(walkSprites.length, 2, 'haven has loot before walk leave');
        var strip = 14;
        var pathX = win.tileCenter(18, 14).x;
        world.placePlayer(pathX, strip + 1);
        world.player.body.setVelocity(0, 0);
        world.exitLock = false;
        world.encounterLock = false;
        H.clearKeys(win);
        H.key(win, 'KeyW', 'w', 'keydown');
        return H.waitUntil(function () {
            return H.world(win).zoneId === 'northwood';
        }, 1500, 'Keys.js W walk into Northwood').then(function () {
            H.key(win, 'KeyW', 'w', 'keyup');
            H.clearKeys(win);
            return H.sleep(50).then(function () {
                world = H.world(win);
                assertEqual(world.zoneId, 'northwood', 'W walk enters Northwood');
                assertEqual((world.groundLoot || []).length, 0, 'walk leave has no haven pile');
                walkSprites.forEach(function (sprite, i) {
                    assert(isDestroyedGo(sprite), 'walk-leave loot sprite ' + i + ' is destroyed');
                });
                H.enterZone(win, 'haven');
                world = H.world(win);
                world.placePlayer(spawn.x, spawn.y);
                world.player.body.setVelocity(0, 0);
                assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
                assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
                assertRestored(win, H, walkSaved, 'walk return');

                world.clearLoot();
                world.spawnLoot(200, 200, [{ id: 'bones', qty: 1 }]);
                var away = H.lootLive(win)[0];
                var awayUntil = away.until;
                world.enterZone('northwood', 'n');
                world = H.world(win);
                world.time.now = awayUntil + 1;
                world.enterZone('haven', 's');
                world = H.world(win);
                world.placePlayer(spawn.x, spawn.y);
                world.player.body.setVelocity(0, 0);
                assertEqual(H.lootLive(win).length, 0, 'loot expired while away is not restored');
                assert(!win.game.input.keyboard, 'Phaser keyboard still off');
            });
        });
    });
});

EmberwoodTests.add('loot: pickup during encounterLock is blocked or deferred', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.setAutoPickup(win, true);
        H.clearKeys(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        var world = H.world(win);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.clearLoot();
        world.encounterLock = false;
        win.Hud.mode = 'world';
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(H.hero(win).autoPickup, true, 'auto-pickup on so unlock can defer');

        world.spawnLoot(spawn.x, spawn.y, [{ id: 'coins', qty: 2 }]);
        var gold = H.hero(win).gold;
        world.collectNearbyLoot();
        assertEqual(H.hero(win).gold, gold + 2, 'unlocked collectNearbyLoot still takes');
        assert(H.chatHas(win, 'You pick up'), 'unlocked pickup chat');
        assertEqual(H.lootLive(win).length, 0, 'unlocked pile taken');

        world.clearLoot();
        world.spawnLoot(spawn.x, spawn.y, [{ id: 'coins', qty: 3 }]);
        gold = H.hero(win).gold;
        var chatCount = H.chat(win).length;
        var live = H.lootLive(win);
        assertEqual(live.length, 1, 'locked pile exists');
        var drop = live[0];

        world.scene.pause();
        try {
            world.encounterLock = true;
            world.collectNearbyLoot();
            assertEqual(H.hero(win).gold, gold, 'collectNearbyLoot is blocked under encounterLock');
            assertEqual(H.lootLive(win).length, 1, 'walk-over pile stays under encounterLock');
            assertEqual(H.chat(win).length, chatCount, 'no pickup chat under encounterLock');

            assertEqual(world.tryPickup(drop), false, 'tryPickup returns false under encounterLock');
            assertEqual(H.hero(win).gold, gold, 'tryPickup is blocked under encounterLock');
            assert(!drop.taken, 'drop stays untaken under encounterLock');

            world.onClick({ worldX: drop.sprite.x, worldY: drop.sprite.y });
            assertEqual(H.hero(win).gold, gold, 'onClick pickup is blocked under encounterLock');

            drop.sprite.emit('pointerdown');
            assertEqual(H.hero(win).gold, gold, 'sprite click is blocked under encounterLock');
            assertEqual(H.lootLive(win).length, 1, 'sprite pile stays under encounterLock');

            world.update();
            assertEqual(H.hero(win).gold, gold, 'update does not vacuum under encounterLock');

            world.encounterLock = false;
            win.Hud.mode = 'battle';
            world.collectNearbyLoot();
            assertEqual(H.hero(win).gold, gold, 'collectNearbyLoot is blocked in battle');
            assertEqual(world.tryPickup(drop), false, 'tryPickup returns false in battle');
            world.onClick({ worldX: drop.sprite.x, worldY: drop.sprite.y });
            assertEqual(H.hero(win).gold, gold, 'onClick pickup is blocked in battle');
            drop.sprite.emit('pointerdown');
            assertEqual(H.hero(win).gold, gold, 'sprite click is blocked in battle');
            assertEqual(H.lootLive(win).length, 1, 'pile stays in battle');
            assertEqual(H.chat(win).length, chatCount, 'no pickup chat in battle');

            win.Hud.mode = 'world';
            world.encounterLock = false;
            world.collectNearbyLoot();
            assertEqual(H.hero(win).gold, gold + 3, 'collectNearbyLoot takes after unlock (deferred)');
            assertEqual(H.chat(win).length, chatCount + 1, 'deferred pickup chat');
            assert(H.lastChat(win).indexOf('You pick up') !== -1, 'deferred pickup line');
            assertEqual(H.lootLive(win).length, 0, 'deferred pile taken');
        } finally {
            H.clearKeys(win);
            win.Hud.mode = 'world';
            world.encounterLock = false;
            world.clearLoot();
            world.scene.resume();
        }

        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
        assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('combat: Eat food uses inventory on your turn', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard stays off');
        assertEqual(typeof win.eatBestFood, 'function', 'eatBestFood helper');
        H.enterZone(win, 'millfields');
        H.setAutoAttack(win, false);
        var cow = H.findMob(win, 'Cow');
        return H.startFight(win, cow);
    }).then(function () {
        win.document.querySelector('#battle-actions [data-action="heal"]').click();
        assert(H.chatHas(win, 'already at full health') || win.document.getElementById('battle-message').textContent.indexOf('full health') !== -1, 'eat at full HP');
        assert(H.battle(win).waitingForPlayer, 'full HP eat does not spend the turn');
        var battle = H.battle(win);
        battle.heroes[0].hp = 60;
        var hero = H.hero(win);
        hero.hp = 60;
        win.game.registry.set('hero', hero);
        var shrimp = hero.inventory.filter(function (s) { return s.id === 'shrimp'; })[0].qty;
        var bread = hero.inventory.filter(function (s) { return s.id === 'bread'; })[0].qty;
        return H.waitPlayerTurn(win).then(function () {
            win.Hud.setActionsEnabled(true);
            win.document.querySelector('#battle-actions [data-action="heal"]').click();
            return H.sleep(200);
        }).then(function () {
            battle = H.battle(win);
            assertEqual(battle.heroes[0].hp, 72, 'shrimp heals 12 in combat');
            assertEqual(H.hero(win).hp, 72, 'hero HP after shrimp');
            var afterShrimp = H.hero(win).inventory.filter(function (s) { return s.id === 'shrimp'; })[0];
            var afterBread = H.hero(win).inventory.filter(function (s) { return s.id === 'bread'; })[0];
            assert(afterShrimp.qty === shrimp - 1, 'combat consumed one shrimp');
            assertEqual(afterBread.qty, bread, 'shrimp preferred over bread');
            assert(H.chatHas(win, 'Cooked shrimp') || win.document.getElementById('battle-message').textContent.indexOf('Cooked shrimp') !== -1, 'ate shrimp');
            assert(!battle.waitingForPlayer, 'shrimp eat spends the turn');
            assert(battle.busy, 'shrimp eat queues the next turn');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
            return H.waitPlayerTurn(win);
        }).then(function () {
            hero = H.hero(win);
            hero.hp = 50;
            hero.inventory = hero.inventory.filter(function (s) { return s.id !== 'shrimp'; });
            win.game.registry.set('hero', hero);
            battle = H.battle(win);
            battle.heroes[0].hp = 50;
            bread = hero.inventory.filter(function (s) { return s.id === 'bread'; })[0].qty;
            win.Hud.setActionsEnabled(true);
            win.document.querySelector('#battle-actions [data-action="heal"]').click();
            return H.sleep(200);
        }).then(function () {
            battle = H.battle(win);
            assertEqual(battle.heroes[0].hp, 70, 'bread heals 20 when no shrimp');
            assertEqual(H.hero(win).hp, 70, 'hero HP after bread');
            var afterBread = H.hero(win).inventory.filter(function (s) { return s.id === 'bread'; })[0];
            assert(afterBread.qty === bread - 1, 'combat consumed one bread');
            assert(!H.hero(win).inventory.filter(function (s) { return s.id === 'shrimp'; })[0], 'no shrimp left');
            assert(H.chatHas(win, 'Bread') || win.document.getElementById('battle-message').textContent.indexOf('Bread') !== -1, 'ate bread');
            assert(!battle.waitingForPlayer, 'bread eat spends the turn');
            assert(battle.busy, 'bread eat queues the next turn');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off after eat');
            return H.forceFlee(win);
        });
    }).then(function () {
        H.enterZone(win, 'haven');
    });
});

EmberwoodTests.add('combat: Eat from inventory chooses shrimp vs bread on your turn', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        world.placePlayer(spawn.x, spawn.y);
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assertEqual(typeof win.eatItem, 'function', 'eatItem helper');
        assertEqual(typeof win.eatBestFood, 'function', 'eatBestFood helper still exists');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        world.placePlayer(spawn.x, spawn.y);
        var chicken = H.findMob(win, 'Chicken');
        return H.startFight(win, chicken);
    }).then(function () {
        var battle = H.battle(win);
        battle.heroes[0].hp = 50;
        var hero = H.hero(win);
        hero.hp = 50;
        win.game.registry.set('hero', hero);
        win.Hud.renderHero(hero);
        var shrimp = hero.inventory.filter(function (s) { return s.id === 'shrimp'; })[0].qty;
        var bread = hero.inventory.filter(function (s) { return s.id === 'bread'; })[0].qty;
        assert(shrimp > 0, 'starter shrimp so Eat food would prefer it');
        assert(bread > 0, 'starter bread to choose instead');
        assert(battle.waitingForPlayer, 'player turn before inv eat');
        assert(!battle.busy, 'not busy before inv eat');
        H.click(win, '#tab-bar button[data-tab="inv"]');
        assert(H.panelVisible(win, 'inv'), 'Inv tab open to pick food');
        H.click(win, '#inv-grid [data-item="bread"]');
        return H.sleep(200).then(function () {
            battle = H.battle(win);
            hero = H.hero(win);
            assertEqual(battle.heroes[0].hp, 70, 'chosen bread heals 20 in combat');
            assertEqual(hero.hp, 70, 'hero HP after chosen bread');
            var afterShrimp = hero.inventory.filter(function (s) { return s.id === 'shrimp'; })[0];
            var afterBread = hero.inventory.filter(function (s) { return s.id === 'bread'; })[0];
            assertEqual(afterShrimp.qty, shrimp, 'choosing bread leaves shrimp');
            assertEqual(afterBread.qty, bread - 1, 'combat consumed one bread');
            assert(H.chatHas(win, 'Bread') || win.document.getElementById('battle-message').textContent.indexOf('Bread') !== -1, 'ate chosen bread');
            assert(!battle.waitingForPlayer, 'chosen bread spends the turn');
            assert(battle.busy, 'chosen bread queues the next turn');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off after bread');
            return H.waitPlayerTurn(win);
        }).then(function () {
            hero = H.hero(win);
            hero.hp = 40;
            win.game.registry.set('hero', hero);
            battle = H.battle(win);
            battle.heroes[0].hp = 40;
            win.Hud.renderHero(hero);
            shrimp = hero.inventory.filter(function (s) { return s.id === 'shrimp'; })[0].qty;
            bread = hero.inventory.filter(function (s) { return s.id === 'bread'; })[0].qty;
            win.Hud.setActionsEnabled(true);
            H.click(win, '#tab-bar button[data-tab="inv"]');
            H.click(win, '#inv-grid [data-item="shrimp"]');
            return H.sleep(200);
        }).then(function () {
            battle = H.battle(win);
            hero = H.hero(win);
            assertEqual(battle.heroes[0].hp, 52, 'chosen shrimp heals 12 in combat');
            assertEqual(hero.hp, 52, 'hero HP after chosen shrimp');
            var afterShrimp = hero.inventory.filter(function (s) { return s.id === 'shrimp'; })[0];
            var afterBread = hero.inventory.filter(function (s) { return s.id === 'bread'; })[0];
            assertEqual(afterShrimp.qty, shrimp - 1, 'combat consumed one shrimp');
            assertEqual(afterBread.qty, bread, 'choosing shrimp leaves bread');
            assert(H.chatHas(win, 'Cooked shrimp') || win.document.getElementById('battle-message').textContent.indexOf('Cooked shrimp') !== -1, 'ate chosen shrimp');
            assert(!battle.waitingForPlayer, 'chosen shrimp spends the turn');
            assert(battle.busy, 'chosen shrimp queues the next turn');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off after shrimp');
            return H.forceFlee(win);
        });
    }).then(function () {
        H.enterZone(win, 'haven');
    }).catch(function (err) {
        return H.cleanupBattle(win).then(function () {
            throw err;
        });
    });
});

EmberwoodTests.add('combat: Eat at full HP does not consume food and returns the turn', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        world.placePlayer(spawn.x, spawn.y);
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assertEqual(typeof win.eatBestFood, 'function', 'eatBestFood helper');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        world.placePlayer(spawn.x, spawn.y);
        var hero = H.hero(win);
        assertEqual(hero.hp, hero.maxHp, 'starts at full HP');
        var shrimp = hero.inventory.filter(function (s) { return s.id === 'shrimp'; })[0].qty;
        var bread = hero.inventory.filter(function (s) { return s.id === 'bread'; })[0].qty;
        assert(shrimp > 0, 'starter shrimp to refuse');
        assert(bread > 0, 'starter bread to refuse');
        assertEqual(win.eatBestFood(hero), null, 'eatBestFood refuses at full HP');
        assertEqual(hero.inventory.filter(function (s) { return s.id === 'shrimp'; })[0].qty, shrimp, 'helper does not take shrimp');
        assertEqual(hero.inventory.filter(function (s) { return s.id === 'bread'; })[0].qty, bread, 'helper does not take bread');
        assertEqual(hero.hp, hero.maxHp, 'helper leaves HP at max');
        var chicken = H.findMob(win, 'Chicken');
        return H.startFight(win, chicken).then(function () {
            hero = H.hero(win);
            assertEqual(hero.hp, hero.maxHp, 'combat starts at full HP');
            shrimp = hero.inventory.filter(function (s) { return s.id === 'shrimp'; })[0].qty;
            bread = hero.inventory.filter(function (s) { return s.id === 'bread'; })[0].qty;
            var battle = H.battle(win);
            assert(battle.waitingForPlayer, 'player turn before eat');
            assert(!battle.busy, 'not busy before eat');
            win.document.querySelector('#battle-actions [data-action="heal"]').click();
            battle = H.battle(win);
            hero = H.hero(win);
            assert(H.chatHas(win, 'already at full health') || win.document.getElementById('battle-message').textContent.indexOf('full health') !== -1, 'full-HP eat message');
            assertEqual(hero.inventory.filter(function (s) { return s.id === 'shrimp'; })[0].qty, shrimp, 'combat does not consume shrimp');
            assertEqual(hero.inventory.filter(function (s) { return s.id === 'bread'; })[0].qty, bread, 'combat does not consume bread');
            assertEqual(hero.hp, hero.maxHp, 'HP stays at max');
            assertEqual(battle.heroes[0].hp, battle.heroes[0].maxHp, 'battle actor stays at max');
            assert(battle.waitingForPlayer, 'full HP eat returns the turn');
            assert(!battle.busy, 'full HP eat does not queue a turn');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
            return H.forceFlee(win);
        });
    }).then(function () {
        H.enterZone(win, 'haven');
    }).catch(function (err) {
        return H.cleanupBattle(win).then(function () {
            throw err;
        });
    });
});

EmberwoodTests.add('combat: Eat with no food chats You have no food and returns the turn', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        world.placePlayer(spawn.x, spawn.y);
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assertEqual(typeof win.eatBestFood, 'function', 'eatBestFood helper');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        world.placePlayer(spawn.x, spawn.y);
        var hero = H.hero(win);
        var kept = hero.inventory.filter(function (s) { return s.id !== 'shrimp' && s.id !== 'bread'; });
        hero.inventory = kept.map(function (s) { return { id: s.id, qty: s.qty }; });
        hero.hp = 60;
        win.game.registry.set('hero', hero);
        assert(!hero.inventory.filter(function (s) { return s.id === 'shrimp'; })[0], 'no shrimp in pack');
        assert(!hero.inventory.filter(function (s) { return s.id === 'bread'; })[0], 'no bread in pack');
        assertEqual(win.eatBestFood(hero), null, 'eatBestFood refuses with no food');
        assertEqual(hero.hp, 60, 'helper leaves damaged HP');
        assert(!hero.inventory.filter(function (s) { return s.id === 'shrimp'; })[0], 'helper does not invent shrimp');
        assert(!hero.inventory.filter(function (s) { return s.id === 'bread'; })[0], 'helper does not invent bread');
        var chicken = H.findMob(win, 'Chicken');
        return H.startFight(win, chicken).then(function () {
            hero = H.hero(win);
            hero.inventory = hero.inventory.filter(function (s) { return s.id !== 'shrimp' && s.id !== 'bread'; });
            hero.hp = 60;
            win.game.registry.set('hero', hero);
            var battle = H.battle(win);
            battle.heroes[0].hp = 60;
            assert(battle.waitingForPlayer, 'player turn before eat');
            assert(!battle.busy, 'not busy before eat');
            win.document.querySelector('#battle-actions [data-action="heal"]').click();
            battle = H.battle(win);
            hero = H.hero(win);
            assert(H.chatHas(win, 'You have no food.') || win.document.getElementById('battle-message').textContent.indexOf('You have no food.') !== -1, 'no-food eat message');
            assert(!H.chatHas(win, 'already at full health') && win.document.getElementById('battle-message').textContent.indexOf('full health') === -1, 'not the full-HP message');
            assert(!hero.inventory.filter(function (s) { return s.id === 'shrimp'; })[0], 'combat does not invent shrimp');
            assert(!hero.inventory.filter(function (s) { return s.id === 'bread'; })[0], 'combat does not invent bread');
            assertEqual(hero.hp, 60, 'HP stays damaged');
            assertEqual(battle.heroes[0].hp, 60, 'battle actor stays damaged');
            assert(battle.waitingForPlayer, 'no-food eat returns the turn');
            assert(!battle.busy, 'no-food eat does not queue a turn');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
            return H.forceFlee(win);
        });
    }).then(function () {
        H.enterZone(win, 'haven');
    }).catch(function (err) {
        return H.cleanupBattle(win).then(function () {
            throw err;
        });
    });
});

EmberwoodTests.add('combat: Run flees back to the world', function (win, H) {
    H.enterZone(win, 'haven');
    H.setAutoAttack(win, false);
    var chicken = H.findMob(win, 'Chicken');
    var orig = win.Phaser.Math.Between;
    win.Phaser.Math.Between = function () { return 0; };
    return H.startFight(win, chicken).then(function () {
        win.document.querySelector('#battle-actions [data-action="flee"]').click();
        return H.waitWorld(win);
    }).then(function () {
        win.Phaser.Math.Between = orig;
        assert(H.chatHas(win, 'break away') || H.chatHas(win, 'run from the fight'), 'flee message');
        assertEqual(win.Hud.mode, 'world', 'back in world after run');
    }).catch(function (err) {
        win.Phaser.Math.Between = orig;
        throw err;
    });
});

EmberwoodTests.add('combat: Run succeeds on Between(0,99) < 70 and flees without XP or loot', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        world.placePlayer(spawn.x, spawn.y);
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        world.placePlayer(spawn.x, spawn.y);
        var chicken = H.findMob(win, 'Chicken');
        var hero = H.hero(win);
        var gold = hero.gold;
        var xp = hero.xp;
        var attackXp = hero.skills.attack.xp;
        var hpXp = hero.skills.hitpoints.xp;
        var lootBefore = (world.groundLoot || []).length;
        var orig = win.Phaser.Math.Between;
        var fleeArgs = null;
        win.Phaser.Math.Between = function (lo, hi) {
            if (lo === 0 && hi === 99) {
                fleeArgs = [lo, hi];
                return 0;
            }
            return orig.apply(this, arguments);
        };
        return H.startFight(win, chicken).then(function () {
            assert(H.battle(win).waitingForPlayer, 'player turn before run');
            win.document.querySelector('#battle-actions [data-action="flee"]').click();
            var battle = H.battle(win);
            assert(fleeArgs, 'Run rolls Between(0,99)');
            assertEqual(fleeArgs[0], 0, 'Between lo is 0');
            assertEqual(fleeArgs[1], 99, 'Between hi is 99');
            assertEqual(battle.outcome, 'flee', 'outcome flee on success roll');
            assert(H.chatHas(win, 'You run from the fight.'), 'run chat');
            return H.waitWorld(win);
        }).then(function () {
            win.Phaser.Math.Between = orig;
            hero = H.hero(win);
            assert(H.chatHas(win, 'You break away from the fight.'), 'break-away chat');
            assertEqual(win.Hud.mode, 'world', 'back in world after run');
            assertEqual(win.game.registry.get('battleOutcome'), null, 'battleOutcome cleared after wake');
            assertEqual(hero.xp, xp, 'no combat XP on flee');
            assertEqual(hero.gold, gold, 'no gold on flee');
            assertEqual(hero.skills.attack.xp, attackXp, 'no Attack XP on flee');
            assertEqual(hero.skills.hitpoints.xp, hpXp, 'no Hitpoints XP on flee');
            assertEqual((H.world(win).groundLoot || []).length, lootBefore, 'no loot spawned on flee');
            assert(chicken.aliveMob, 'chicken still alive after flee');
            assert(!H.chatHas(win, 'collapses'), 'no win collapse chat');
            assert(!H.chatHas(win, 'Loot drops'), 'no loot drop chat');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        }).catch(function (err) {
            win.Phaser.Math.Between = orig;
            throw err;
        });
    }).catch(function (err) {
        return H.cleanupBattle(win).then(function () {
            throw err;
        });
    });
});

EmberwoodTests.add('combat: Run fail chats You fail to get away and the enemy still gets a turn', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        world.placePlayer(spawn.x, spawn.y);
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        world.placePlayer(spawn.x, spawn.y);
        var chicken = H.findMob(win, 'Chicken');
        var orig = win.Phaser.Math.Between;
        var fleeArgs = null;
        win.Phaser.Math.Between = function (lo, hi) {
            if (lo === 0 && hi === 99) {
                fleeArgs = [lo, hi];
                return 70;
            }
            return orig.apply(this, arguments);
        };
        return H.startFight(win, chicken).then(function () {
            var battle = H.battle(win);
            assert(battle.waitingForPlayer, 'player turn before run');
            assert(!battle.busy, 'not busy before run');
            var hpBefore = battle.heroes[0].hp;
            win.document.querySelector('#battle-actions [data-action="flee"]').click();
            battle = H.battle(win);
            assert(fleeArgs, 'Run rolls Between(0,99)');
            assertEqual(fleeArgs[0], 0, 'Between lo is 0');
            assertEqual(fleeArgs[1], 99, 'Between hi is 99');
            assert(H.chatHas(win, 'You fail to get away!') || win.document.getElementById('battle-message').textContent.indexOf('You fail to get away!') !== -1, 'fail chat');
            assert(!H.chatHas(win, 'You run from the fight.'), 'not the succeed chat');
            assert(battle.outcome !== 'flee', 'outcome is not flee');
            assert(!battle.waitingForPlayer, 'fail spends the turn');
            assert(battle.busy, 'fail queues the next turn');
            assert(win.game.scene.isActive('BattleScene'), 'still in battle after fail');
            assertEqual(win.Hud.mode, 'battle', 'HUD stays in battle');
            return H.waitPlayerTurn(win).then(function () {
                return { hpBefore: hpBefore };
            });
        }).then(function (state) {
            win.Phaser.Math.Between = orig;
            var battle = H.battle(win);
            assert(win.game.scene.isActive('BattleScene'), 'still in battle after enemy turn');
            assertEqual(win.Hud.mode, 'battle', 'HUD still battle after enemy turn');
            assert(H.chatHas(win, 'hits You') || win.document.getElementById('battle-message').textContent.indexOf('hits You') !== -1, 'enemy attack chat');
            assert(battle.heroes[0].hp < state.hpBefore, 'enemy turn damaged the hero');
            assert(battle.waitingForPlayer, 'player turn after enemy');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
            return H.forceFlee(win);
        }).catch(function (err) {
            win.Phaser.Math.Between = orig;
            throw err;
        });
    }).then(function () {
        H.enterZone(win, 'haven');
    }).catch(function (err) {
        return H.cleanupBattle(win).then(function () {
            throw err;
        });
    });
});

EmberwoodTests.add('combat: Attack Eat Run no-op while busy or not player-turn', function (win, H) {
    function actionButtons() {
        return {
            attack: win.document.querySelector('#battle-actions [data-action="attack"]'),
            eat: win.document.querySelector('#battle-actions [data-action="heal"]'),
            run: win.document.querySelector('#battle-actions [data-action="flee"]')
        };
    }

    function shrimpQty(hero) {
        var stack = (hero.inventory || []).filter(function (s) { return s && s.id === 'shrimp'; })[0];
        return stack ? stack.qty : 0;
    }

    function spamActions(battle) {
        win.Hud.tryAttack();
        win.Hud.setActionsEnabled(true);
        var buttons = actionButtons();
        buttons.attack.click();
        buttons.eat.click();
        buttons.run.click();
        battle.receivePlayerSelection('attack', 0);
        battle.receivePlayerSelection('heal');
        battle.receivePlayerSelection('flee');
    }

    var origBetween = win.Phaser.Math.Between;
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        world.placePlayer(spawn.x, spawn.y);
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard stays off');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        world.placePlayer(spawn.x, spawn.y);
        return H.startCustomFight(win, [
            { type: 'Goblin', texture: 'slime', tint: 0x5aa33a, hp: 80, damage: 1, gold: 0, xp: 1 }
        ]);
    }).then(function () {
        var battle = H.battle(win);
        var hero = H.hero(win);
        var buttons = actionButtons();
        assert(battle.waitingForPlayer, 'player turn before first Attack');
        assert(!battle.busy, 'not busy before first Attack');
        assert(battle.isPlayerTurn(), 'isPlayerTurn before first Attack');
        assert(win.Hud.canBattleAct(), 'canBattleAct on player turn');
        assert(!buttons.attack.disabled, 'Attack enabled on player turn');
        assert(!buttons.eat.disabled, 'Eat enabled on player turn');
        assert(!buttons.run.disabled, 'Run enabled on player turn');

        battle.heroes[0].hp = 50;
        hero.hp = 50;
        win.game.registry.set('hero', hero);
        var foodBefore = shrimpQty(hero);
        assert(foodBefore > 0, 'starter shrimp so Eat would consume if it queued');

        var swings = 0;
        var origAttack = battle.heroes[0].attack;
        battle.heroes[0].attack = function () {
            swings += 1;
            return origAttack.apply(this, arguments);
        };
        win.Phaser.Math.Between = function (lo, hi) {
            if (lo === 0 && hi === 99) {
                return 0;
            }
            return origBetween.apply(this, arguments);
        };

        buttons.attack.click();
        battle = H.battle(win);
        buttons = actionButtons();
        assertEqual(swings, 1, 'first Attack spends the turn');
        assert(battle.busy, 'Attack marks busy');
        assert(!battle.waitingForPlayer, 'Attack spends waitingForPlayer');
        assert(!battle.isPlayerTurn(), 'not player-turn while busy');
        assert(!win.Hud.canBattleAct(), 'canBattleAct false while busy');
        assert(buttons.attack.disabled, 'Attack disabled while busy');
        assert(buttons.eat.disabled, 'Eat disabled while busy');
        assert(buttons.run.disabled, 'Run disabled while busy');
        var queued = battle.turnTimer;
        assert(queued, 'Attack queues next turn');
        assertEqual(queued.delay, 900, 'Attack queues 900ms');

        spamActions(battle);
        battle = H.battle(win);
        hero = H.hero(win);
        buttons = actionButtons();
        assertEqual(swings, 1, 'second Attack does not swing again');
        assert(battle.turnTimer === queued, 'busy spam does not replace the turn timer');
        assertEqual(battle.turnTimer.delay, 900, 'Eat/Run do not replace 900ms with 800ms');
        assertEqual(shrimpQty(hero), foodBefore, 'Eat while busy does not consume food');
        assertEqual(battle.heroes[0].hp, 50, 'Eat while busy does not heal');
        assert(battle.outcome !== 'flee', 'Run while busy does not flee');
        assert(win.game.scene.isActive('BattleScene'), 'still in battle after busy spam');
        assert(battle.busy, 'still busy after no-op spam');
        assert(!battle.waitingForPlayer, 'still not waiting after no-op spam');
        assert(buttons.attack.disabled, 'Attack still disabled after no-op');
        assert(buttons.eat.disabled, 'Eat still disabled after no-op');
        assert(buttons.run.disabled, 'Run still disabled after no-op');

        queued.remove(false);
        battle.turnTimer = null;
        battle.nextTurn();
        battle = H.battle(win);
        buttons = actionButtons();
        assert(battle.busy, 'enemy turn marks busy');
        assert(!battle.waitingForPlayer, 'enemy turn is not player-turn');
        assert(!battle.isPlayerTurn(), 'isPlayerTurn false on enemy turn');
        assert(!win.Hud.canBattleAct(), 'canBattleAct false on enemy turn');
        assert(buttons.attack.disabled, 'Attack disabled on enemy turn');
        assert(buttons.eat.disabled, 'Eat disabled on enemy turn');
        assert(buttons.run.disabled, 'Run disabled on enemy turn');
        var enemyQueue = battle.turnTimer;
        assert(enemyQueue, 'enemy turn queues the next actor');

        spamActions(battle);
        battle = H.battle(win);
        hero = H.hero(win);
        buttons = actionButtons();
        assertEqual(swings, 1, 'Attack on enemy turn does not swing');
        assert(battle.turnTimer === enemyQueue, 'enemy-turn spam does not replace the queue');
        assertEqual(shrimpQty(hero), foodBefore, 'Eat on enemy turn does not consume food');
        assert(battle.outcome !== 'flee', 'Run on enemy turn does not flee');
        assert(win.game.scene.isActive('BattleScene'), 'still in battle after enemy-turn spam');
        assert(battle.busy, 'still busy after enemy-turn no-op');
        assert(!battle.waitingForPlayer, 'still not player-turn after enemy-turn no-op');
        assert(buttons.attack.disabled, 'Attack still disabled after enemy-turn no-op');
        assert(buttons.eat.disabled, 'Eat still disabled after enemy-turn no-op');
        assert(buttons.run.disabled, 'Run still disabled after enemy-turn no-op');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');

        win.Phaser.Math.Between = origBetween;
        return H.forceFlee(win);
    }).then(function () {
        H.enterZone(win, 'haven');
    }).catch(function (err) {
        win.Phaser.Math.Between = origBetween;
        return H.cleanupBattle(win).then(function () {
            throw err;
        });
    });
});

EmberwoodTests.add('combat: manual list click hits the chosen foe', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.setAutoAttack(win, false);
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard stays off');
        return H.startCustomFight(win, [
            { type: 'Goblin', texture: 'slime', tint: 0x5aa33a, hp: 40, damage: 1, gold: 0, xp: 1 },
            { type: 'Cow', texture: 'slime', tint: 0xaa7744, hp: 40, damage: 1, gold: 0, xp: 1 }
        ]);
    }).then(function () {
        var battle = H.battle(win);
        assertEqual(battle.enemies.length, 2, 'two foes');
        assertEqual(battle.targetIndex, 0, 'default first foe');
        assert(battle.isPlayerTurn(), 'player turn');
        var buttons = win.Hud.el.enemies.querySelectorAll('.enemy-btn');
        assertEqual(buttons.length, 2, 'two HTML list buttons');
        assert(buttons[0].className.indexOf('is-target') !== -1, 'list highlights index 0');
        buttons[1].click();
        assertEqual(battle.targetIndex, 1, 'list click selected cow');
        return H.sleep(250).then(function () {
            assertEqual(battle.enemies[0].hp, 40, 'goblin untouched');
            assert(battle.enemies[1].hp < 40, 'cow took the hit');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
            return H.forceFlee(win);
        });
    }).then(function () {
        H.enterZone(win, 'haven');
    }).catch(function (err) {
        return H.cleanupBattle(win).then(function () {
            throw err;
        });
    });
});

EmberwoodTests.add('combat: canvas select then Attack uses that target', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.setAutoAttack(win, false);
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard stays off');
        return H.startCustomFight(win, [
            { type: 'Goblin', texture: 'slime', tint: 0x5aa33a, hp: 40, damage: 1, gold: 0, xp: 1 },
            { type: 'Cow', texture: 'slime', tint: 0xaa7744, hp: 40, damage: 1, gold: 0, xp: 1 }
        ]);
    }).then(function () {
        var battle = H.battle(win);
        battle.pickReady = true;
        assertEqual(win.Hud.selectingEnemy, false, 'not in pick-to-strike mode');
        battle.enemies[1].emit('pointerdown');
        assertEqual(battle.targetIndex, 1, 'sprite selected cow');
        assertEqual(battle.enemies[1].hp, 40, 'select does not strike');
        assertEqual(battle.enemies[0].hp, 40, 'goblin still full after select');
        win.Hud.tryAttack();
        return H.sleep(250).then(function () {
            assert(battle.enemies[1].hp < 40, 'Attack hit selected cow');
            assertEqual(battle.enemies[0].hp, 40, 'goblin still full');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
            return H.forceFlee(win);
        });
    }).then(function () {
        return H.startCustomFight(win, [
            { type: 'Goblin', texture: 'slime', tint: 0x5aa33a, hp: 40, damage: 1, gold: 0, xp: 1 },
            { type: 'Cow', texture: 'slime', tint: 0xaa7744, hp: 40, damage: 1, gold: 0, xp: 1 }
        ]);
    }).then(function () {
        var battle = H.battle(win);
        battle.pickReady = true;
        win.Hud.selectingEnemy = true;
        battle.enemies[1].emit('pointerdown');
        return H.sleep(250).then(function () {
            assertEqual(battle.targetIndex, 1, 'selectingEnemy canvas targeted cow');
            assert(battle.enemies[1].hp < 40, 'fromSprite strikes when selectingEnemy');
            assertEqual(battle.enemies[0].hp, 40, 'goblin still full after selectingEnemy strike');
            assertEqual(win.Hud.selectingEnemy, false, 'selectingEnemy cleared after strike');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
            return H.forceFlee(win);
        });
    }).then(function () {
        H.enterZone(win, 'haven');
    }).catch(function (err) {
        return H.cleanupBattle(win).then(function () {
            throw err;
        });
    });
});

EmberwoodTests.add('combat: gold target rectangle follows selected living enemy and hides on death', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.setAutoAttack(win, false);
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard stays off');
        return H.startCustomFight(win, [
            { type: 'Goblin', texture: 'slime', tint: 0x5aa33a, hp: 40, damage: 1, gold: 0, xp: 1 },
            { type: 'Cow', texture: 'slime', tint: 0xaa7744, hp: 40, damage: 1, gold: 0, xp: 1 }
        ]);
    }).then(function () {
        var battle = H.battle(win);
        var marker = battle.targetMarker;
        var goblin = battle.enemies[0];
        var cow = battle.enemies[1];
        assert(marker, 'gold target rectangle exists');
        assertEqual(marker.strokeColor, 0xf0d060, 'stroke is gold');
        assertEqual(marker.lineWidth, 2, 'stroke width 2');
        assertEqual(marker.fillAlpha, 0, 'fill is hollow');
        assert(marker.visible, 'visible on default living target');
        assertEqual(battle.targetIndex, 0, 'default first foe');
        assertEqual(marker.x, goblin.x, 'marker on goblin x');
        assertEqual(marker.y, goblin.y, 'marker on goblin y');

        battle.pickReady = true;
        assertEqual(win.Hud.selectingEnemy, false, 'not in pick-to-strike mode');
        cow.emit('pointerdown');
        assertEqual(battle.targetIndex, 1, 'canvas selected cow');
        assertEqual(cow.hp, 40, 'select does not strike');
        assert(marker.visible, 'stays visible on new living target');
        assertEqual(marker.x, cow.x, 'marker jumped to cow x');
        assertEqual(marker.y, cow.y, 'marker jumped to cow y');

        cow.setPosition(cow.x + 24, cow.y - 16);
        battle.update();
        assertEqual(marker.x, cow.x, 'follows cow x');
        assertEqual(marker.y, cow.y, 'follows cow y');
        assert(marker.visible, 'still visible while cow lives');

        cow.die();
        battle.update();
        assertEqual(cow.living, false, 'cow died');
        assertEqual(goblin.living, true, 'goblin still living');
        assertEqual(marker.visible, false, 'hides when selected foe dies');

        win.Hud.onEnemyPicked(0, true);
        assertEqual(battle.targetIndex, 0, 'reselected living goblin');
        assert(marker.visible, 'shows again on living foe');
        assertEqual(marker.x, goblin.x, 'marker on goblin after reselect');
        assertEqual(marker.y, goblin.y, 'marker on goblin y after reselect');

        goblin.die();
        battle.update();
        assertEqual(marker.visible, false, 'hides when last selected foe dies');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        return H.forceFlee(win);
    }).then(function () {
        H.enterZone(win, 'haven');
    }).catch(function (err) {
        return H.cleanupBattle(win).then(function () {
            throw err;
        });
    });
});

EmberwoodTests.add('combat: HP bars go green amber red at 65 and 35 and floaters show on hit heal', function (win, H) {
    function rgbOf(hex) {
        var n = parseInt(hex.slice(1), 16);
        return 'rgb(' + ((n >> 16) & 255) + ', ' + ((n >> 8) & 255) + ', ' + (n & 255) + ')';
    }
    function expectHudBar(hp, hex, label) {
        var hero = H.hero(win);
        hero.hp = hp;
        win.game.registry.set('hero', hero);
        H.world(win).refreshHud();
        var fill = win.document.getElementById('hp-fill');
        assert(fill, 'HUD hp-fill exists');
        assertEqual(fill.style.width, hp + '%', label + ' HUD width');
        var painted = fill.style.backgroundColor.replace(/\s+/g, '');
        var expect = rgbOf(hex).replace(/\s+/g, '');
        assert(painted === hex || painted === expect || painted === hex.toLowerCase(), label + ' HUD color ' + painted);
    }
    function expectUnitBar(unit, hp, color, label) {
        unit.hp = hp;
        unit.refreshHpBar();
        var ratio = hp / unit.maxHp;
        assertEqual(unit.hpBarFill.width, 28 * ratio, label + ' bar width');
        assertEqual(unit.hpBarFill.fillColor, color, label + ' bar color');
    }
    function findFloater(battle, prefix) {
        var list = battle.children.list;
        for (var i = list.length - 1; i >= 0; i--) {
            var obj = list[i];
            if (obj.type === 'Text' && String(obj.text).indexOf(prefix) === 0) {
                return obj;
            }
        }
        return null;
    }

    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        world.placePlayer(spawn.x, spawn.y);
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        world.placePlayer(spawn.x, spawn.y);
        assertEqual(H.hero(win).maxHp, 100, 'starter maxHp 100');

        expectHudBar(100, '#3dcc6a', 'full');
        expectHudBar(65, '#3dcc6a', '65% green');
        expectHudBar(64, '#d4a017', 'just under 65% amber');
        expectHudBar(35, '#d4a017', '35% amber');
        expectHudBar(34, '#cc3d3d', 'just under 35% red');

        return H.startCustomFight(win, [
            { type: 'Goblin', texture: 'slime', tint: 0x5aa33a, hp: 100, damage: 1, gold: 0, xp: 1 }
        ]);
    }).then(function () {
        var battle = H.battle(win);
        var hero = battle.heroes[0];
        var foe = battle.enemies[0];
        assertEqual(hero.maxHp, 100, 'battle hero maxHp 100');
        assertEqual(foe.maxHp, 100, 'battle foe maxHp 100');

        expectUnitBar(hero, 100, 0x3dcc6a, 'hero full green');
        expectUnitBar(hero, 65, 0x3dcc6a, 'hero 65% green');
        expectUnitBar(hero, 64, 0xd4a017, 'hero 64% amber');
        expectUnitBar(hero, 35, 0xd4a017, 'hero 35% amber');
        expectUnitBar(hero, 34, 0xcc3d3d, 'hero 34% red');
        expectUnitBar(foe, 100, 0x3dcc6a, 'foe full green');
        expectUnitBar(foe, 65, 0x3dcc6a, 'foe 65% green');
        expectUnitBar(foe, 64, 0xd4a017, 'foe 64% amber');
        expectUnitBar(foe, 35, 0xd4a017, 'foe 35% amber');
        expectUnitBar(foe, 34, 0xcc3d3d, 'foe 34% red');

        var orig = win.Phaser.Math.Between;
        win.Phaser.Math.Between = function () { return 0; };
        try {
            foe.hp = 80;
            foe.refreshHpBar();
            assertEqual(foe.takeDamage(7), 7, 'hit deals 7');
            var hit = findFloater(battle, '-');
            assert(hit, 'minus floater on hit');
            assertEqual(hit.text, '-7', 'hit floater text');
            assertEqual(String(hit.style.color).toLowerCase(), '#ff6b6b', 'hit floater color');

            hero.hp = 50;
            hero.refreshHpBar();
            assertEqual(hero.heal(12), 12, 'heal restores 12');
            var plus = findFloater(battle, '+');
            assert(plus, 'plus floater on heal');
            assertEqual(plus.text, '+12', 'heal floater text');
            assertEqual(String(plus.style.color).toLowerCase(), '#7dffb3', 'heal floater color');
        } finally {
            win.Phaser.Math.Between = orig;
        }

        expectUnitBar(foe, foe.hp, 0x3dcc6a, 'foe after hit still green');
        expectUnitBar(hero, hero.hp, 0xd4a017, 'hero after heal amber');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        return H.forceFlee(win);
    }).then(function () {
        H.enterZone(win, 'haven');
    }).catch(function (err) {
        return H.cleanupBattle(win).then(function () {
            throw err;
        });
    });
});

EmberwoodTests.add('combat: hit-splats reuse floaters and attack queues 900ms turns not a 0.6s tick', function (win, H) {
    function findMarked(battle, kind, type) {
        var list = battle.children.list;
        for (var i = list.length - 1; i >= 0; i--) {
            var obj = list[i];
            if (obj && obj.isHitSplat && obj.splatKind === kind && (!type || obj.type === type)) {
                return obj;
            }
        }
        return null;
    }

    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        world.placePlayer(spawn.x, spawn.y);
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard stays off');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        world.placePlayer(spawn.x, spawn.y);
        assertEqual(win.BATTLE_TURN_QUEUE_MS, 900, 'named 900ms turn queue');
        assertEqual(typeof win.BATTLE_TURN_QUEUE_MS, 'number', 'queue is a number not a 0.6s ticker');
        return H.startCustomFight(win, [
            { type: 'Goblin', texture: 'slime', tint: 0x5aa33a, hp: 80, damage: 1, gold: 0, xp: 1 }
        ]);
    }).then(function () {
        var battle = H.battle(win);
        var hero = battle.heroes[0];
        var foe = battle.enemies[0];
        assert(battle.waitingForPlayer, 'still turn-based player turn');
        assertEqual(battle.busy, false, 'not busy before attack');
        assert(!battle.combatTick, 'no 0.6s combat tick');
        assert(!battle.tickMs, 'no tickMs field');

        var orig = win.Phaser.Math.Between;
        win.Phaser.Math.Between = function () { return 0; };
        try {
            foe.hp = 80;
            foe.refreshHpBar();
            assertEqual(foe.takeDamage(7), 7, 'hit deals 7');
            var hitDisc = findMarked(battle, 'hit', 'Arc');
            var hitText = findMarked(battle, 'hit', 'Text');
            assert(hitDisc, 'hit splat disc');
            assertEqual(hitDisc.fillColor, 0x7a1c1c, 'hit splat fill');
            assert(hitText, 'hit splat reuses minus floater');
            assertEqual(hitText.text, '-7', 'hit floater text');
            assertEqual(String(hitText.style.color).toLowerCase(), '#ff6b6b', 'hit floater color');

            hero.hp = 50;
            hero.refreshHpBar();
            assertEqual(hero.heal(12), 12, 'heal restores 12');
            var healDisc = findMarked(battle, 'heal', 'Arc');
            var healText = findMarked(battle, 'heal', 'Text');
            assert(healDisc, 'heal splat disc');
            assertEqual(healDisc.fillColor, 0x1e4a32, 'heal splat fill');
            assert(healText, 'heal splat reuses plus floater');
            assertEqual(healText.text, '+12', 'heal floater text');
            assertEqual(String(healText.style.color).toLowerCase(), '#7dffb3', 'heal floater color');

            battle.receivePlayerSelection('attack', 0);
            assertEqual(battle.busy, true, 'attack marks busy');
            assert(battle.turnTimer, 'attack queues next turn');
            assertEqual(battle.turnTimer.delay, 900, 'attack queues 900ms not 600');
            assertEqual(battle.turnTimer.delay, win.BATTLE_TURN_QUEUE_MS, 'timer uses named queue');
        } finally {
            win.Phaser.Math.Between = orig;
        }

        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        return H.forceFlee(win);
    }).then(function () {
        H.enterZone(win, 'haven');
    }).catch(function (err) {
        return H.cleanupBattle(win).then(function () {
            throw err;
        });
    });
});

EmberwoodTests.add('combat: goblin kill advances the militia quest', function (win, H) {
    return H.cleanupBattle(win).then(function () {
        H.enterZone(win, 'northwood');
        win.game.registry.set('quest', { id: 'goblins', stage: 1, progress: 4, goal: 5 });
        H.setAutoAttack(win, false);
        var goblin = H.findMob(win, 'Goblin');
        goblin.mobDef.hp = 8;
        return H.startFight(win, goblin);
    }).then(function () {
        win.Hud.tryAttack();
        return H.waitWorld(win);
    }).then(function () {
        assertEqual(H.quest(win).stage, 2, 'fifth goblin completes hunt');
        assert(H.chatHas(win, 'Return to Bram') || H.chatHas(win, 'enough goblins'), 'return prompt');
        H.enterZone(win, 'haven');
    }).catch(function (err) {
        return H.cleanupBattle(win).then(function () {
            throw err;
        });
    });
});

EmberwoodTests.add('combat: any Goblin type kill counts in Northwood and Westmead', function (win, H) {
    function fightAndWin(zoneId, type) {
        H.enterZone(win, zoneId);
        H.setAutoAttack(win, false);
        var mob = H.findMob(win, type);
        assert(mob, type + ' lives in ' + zoneId);
        assertEqual(mob.mobDef.type, type, zoneId + ' mob type is ' + type);
        mob.mobDef.hp = 8;
        return H.startFight(win, mob).then(function () {
            win.Hud.tryAttack();
            return H.waitWorld(win);
        });
    }

    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        world.placePlayer(spawn.x, spawn.y);
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        var northGoblins = (win.MOB_DEFS.northwood || []).filter(function (def) {
            return def.type === 'Goblin';
        });
        var westGoblins = (win.MOB_DEFS.westmead || []).filter(function (def) {
            return def.type === 'Goblin';
        });
        assert(northGoblins.length > 0, 'Northwood has Goblin defs');
        assert(westGoblins.length > 0, 'Westmead has Goblin defs');

        win.game.registry.set('quest', { id: 'goblins', stage: 1, progress: 0, goal: 5 });
        world.refreshHud();
        assertEqual(win.document.getElementById('hud-quest').textContent, 'Kill goblins in Northwood (0/5).', 'HUD names Northwood');

        return fightAndWin('northwood', 'Goblin');
    }).then(function () {
        assertEqual(H.quest(win).progress, 1, 'Northwood Goblin kill counts');
        assertEqual(H.quest(win).stage, 1, 'still hunting after first kill');
        assertEqual(win.document.getElementById('hud-quest').textContent, 'Kill goblins in Northwood (1/5).', 'HUD after Northwood kill');
        return fightAndWin('westmead', 'Goblin');
    }).then(function () {
        assertEqual(H.quest(win).progress, 2, 'Westmead Goblin also counts — any def.type === Goblin');
        assertEqual(H.quest(win).stage, 1, 'still hunting after Westmead kill');
        assertEqual(win.document.getElementById('hud-quest').textContent, 'Kill goblins in Northwood (2/5).', 'HUD still says Northwood after Westmead kill');
        assertEqual(win.document.getElementById('hud-quest-tab').textContent, 'Kill goblins in Northwood (2/5).', 'journal tracks any Goblin');
        return fightAndWin('haven', 'Chicken');
    }).then(function () {
        assertEqual(H.quest(win).progress, 2, 'non-Goblin kill does not count');
        assertEqual(H.quest(win).stage, 1, 'chicken does not advance stage');
        H.enterZone(win, 'haven');
    }).catch(function (err) {
        return H.cleanupBattle(win).then(function () {
            throw err;
        });
    });
});

EmberwoodTests.add('world: player is one tile and mobs scale by type', function (win, H) {
    H.enterZone(win, 'haven');
    var world = H.world(win);
    assertEqual(world.player.scaleX, 1, 'world player scale');
    assert(world.player.body.width <= 16, 'player body width <= 1 tile');
    assert(world.player.body.height <= 16, 'player body height <= 1 tile');
    var chicken = H.findMob(win, 'Chicken');
    assert(chicken.scaleX < world.player.scaleX, 'chicken smaller than player, scale=' + chicken.scaleX);
    H.enterZone(win, 'millfields');
    var cow = H.findMob(win, 'Cow');
    assert(cow.scaleX > world.player.scaleX, 'cow a bit bigger than player');
    H.enterZone(win, 'northwood');
    var goblin = H.findMob(win, 'Goblin');
    assertEqual(goblin.scaleX, 1, 'goblin about 1 tile');
    H.enterZone(win, 'southshore');
    var crab = H.findMob(win, 'Crab');
    assert(crab.scaleX < world.player.scaleX, 'crab smaller than player');
    H.enterZone(win, 'highlands');
    var drake = H.findMob(win, 'Drake');
    assert(drake.scaleX > world.player.scaleX, 'drake larger than player');
    assert(drake.displayWidth > 16, 'drake sprite occupies more than 1 tile');
    assert(drake.body.width > 16 && drake.body.height > 16, 'drake body is multi-tile');
    H.enterZone(win, 'haven');
});

EmberwoodTests.add('world: player walks through a 1-tile door and is blocked by walls', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        H.setAutoAttack(win, false);
        H.enterZone(win, 'haven');
        world.walkTarget = null;
        world.engageTarget = null;
        world.talkTarget = null;
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        assertEqual(Math.round(world.player.x), spawn.x, 'starts at courtyard spawn x');
        assertEqual(Math.round(world.player.y), spawn.y, 'starts at courtyard spawn y');
        assertEqual(world.player.scaleX, 1, 'world player is 1 tile');
        assert(world.player.body.width < 16, 'body narrower than a tile so doors are reliable');
        var gate = win.HAVEN_GATE_TILE;
        var tile = typeof win.TILE_SIZE === 'number' ? win.TILE_SIZE : 16;
        var doorWest = gate.x * tile;
        var doorEast = (gate.x + 1) * tile;
        assert(spawn.x < doorWest, 'spawn is west of the 1-tile gate');
        return H.holdKey(win, 'KeyD', 'd', 700).then(function () {
            assert(world.player.x > doorEast, 'walked through 1-tile door, x=' + world.player.x);
            assert(Math.abs(world.player.y - spawn.y) < 8, 'door walk stays on the opening row');
            var wallSpot = win.tileCenter(gate.x - 1, gate.y + 1);
            world.placePlayer(wallSpot.x, wallSpot.y);
            world.walkTarget = null;
            var blockedX = world.player.x;
            return H.holdKey(win, 'KeyD', 'd', 400).then(function () {
                assert(world.player.x < doorWest + 8, 'solid wall still blocks, x=' + world.player.x);
                assert(world.player.x < blockedX + 10, 'did not pass through rock');
                world.placePlayer(spawn.x, spawn.y);
            });
        });
    });
});

EmberwoodTests.add('world: diagonal W+D enters a 1-tile door without catching the frame', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        H.setAutoAttack(win, false);
        H.enterZone(win, 'haven');
        world.walkTarget = null;
        world.engageTarget = null;
        world.talkTarget = null;
        world.encounterLock = false;
        parkWorldBodies(world);
        var spawn = win.defaultWorldSpawn();
        var gate = win.HAVEN_GATE_TILE;
        var tile = typeof win.TILE_SIZE === 'number' ? win.TILE_SIZE : 16;
        var doorWest = gate.x * tile;
        var doorEast = (gate.x + 1) * tile;
        var gapY = win.tileCenter(gate.x, gate.y).y;
        var startX = doorWest - 8;
        var startY = gapY + 6;
        world.placePlayer(startX, startY);
        assertEqual(typeof win.slideIntoOneTileGap, 'function', 'slideIntoOneTileGap is global');
        assert(startX < doorWest, 'start west of the gate');
        assert(startY > gapY, 'start south of the opening so W+D would catch the south frame');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(!world.cursors, 'WorldScene has no Phaser cursors');

        H.key(win, 'KeyW', 'w', 'keydown');
        H.key(win, 'KeyD', 'd', 'keydown');
        var flags = world.moveFlags();
        assert(flags.up && flags.right && !flags.left && !flags.down, 'W+D moveFlags');

        return H.waitUntil(function () {
            return world.player.x > doorEast;
        }, 1500, 'Keys.js W+D through 1-tile door').then(function () {
            var throughY = world.player.y;
            H.key(win, 'KeyW', 'w', 'keyup');
            H.key(win, 'KeyD', 'd', 'keyup');
            H.clearKeys(win);
            assert(world.player.x > doorEast, 'W+D walked through the 1-tile door, x=' + world.player.x);
            assert(Math.abs(throughY - gapY) < 16, 'threaded the opening instead of catching the frame, y=' + throughY);
            assert(!win.game.input.keyboard, 'Phaser keyboard still off after diagonal door');

            var wallSpot = win.tileCenter(gate.x - 1, gate.y + 1);
            world.placePlayer(wallSpot.x, wallSpot.y);
            world.walkTarget = null;
            var blockedX = world.player.x;
            return H.holdKey(win, 'KeyD', 'd', 400).then(function () {
                assert(world.player.x < doorWest + 8, 'solid wall still blocks after diagonal slide, x=' + world.player.x);
                assert(world.player.x < blockedX + 10, 'did not pass through rock');
                world.placePlayer(spawn.x, spawn.y);
            });
        });
    });
});

EmberwoodTests.add('world: giant mobs block 2x2 and cannot enter 1-tile interiors', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        H.setAutoAttack(win, false);
        H.enterZone(win, 'haven');
        world.walkTarget = null;
        world.engageTarget = null;
        world.talkTarget = null;
        world.encounterLock = false;
        world.exitLock = true;
        parkWorldBodies(world);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        assertEqual(world.player.scaleX, 1, 'world player is 1 tile');
        assert(world.player.body.width < 16, 'player body still fits 1-tile doors');
        assertEqual(typeof win.isGiantMob, 'function', 'isGiantMob is global');
        assertEqual(typeof win.giantFootprintTiles, 'function', 'giantFootprintTiles is global');
        assertEqual(typeof win.giantBlockedAt, 'function', 'giantBlockedAt is global');
        assert(win.isGiantMob('Drake'), 'Drake is a giant');
        assert(!win.isGiantMob('Chicken'), 'chicken is not a giant');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(!world.cursors, 'WorldScene has no Phaser cursors');

        var gate = win.HAVEN_GATE_TILE;
        var tile = typeof win.TILE_SIZE === 'number' ? win.TILE_SIZE : 16;
        var doorWest = gate.x * tile;
        var doorEast = (gate.x + 1) * tile;
        var stand = win.tileCenter(gate.x - 2, gate.y);
        var origWander = world.wanderMobs;
        world.wanderMobs = function () {};

        var drake = spawnTestDrake(world, win, stand.x, stand.y);
        assert(drake.body, 'drake has a body');
        assertEqual(drake.body.width, 28, 'drake body width stays 28');
        assertEqual(drake.body.height, 28, 'drake body height stays 28');
        assert(drake.body.width > 16 && drake.body.height > 16, 'drake body is multi-tile');

        world.mobs.children.iterate(function (mob) {
            if (mob && mob !== drake) {
                mob.aliveMob = false;
            }
        });
        var occ = world.collectOccupiedTiles(-200, -200);
        var footprint = win.giantFootprintTiles(drake.x, drake.y);
        assertEqual(footprint.length, 4, 'giant footprint is 2x2 tiles');
        var fi;
        for (fi = 0; fi < footprint.length; fi++) {
            var key = footprint[fi].tx + ',' + footprint[fi].ty;
            assert(occ[key], 'occupied includes footprint tile ' + key);
        }
        assert(Object.keys(occ).length >= 4, 'giant occupies 2x2 or more, n=' + Object.keys(occ).length);
        assert(win.giantBlockedAt(world.tileGrid, doorWest + 8, stand.y, 'haven'), '1-tile gate blocks giants');

        var away = win.tileCenter(8, 22);
        world.placePlayer(away.x, away.y);
        world.player.body.setVelocity(0, 0);
        var origX = drake.x;
        drake.body.setVelocity(80, 0);
        return H.sleep(800).then(function () {
            drake.body.setVelocity(0, 0);
            assert(drake.x < doorEast, 'drake cannot pass the 1-tile gate, x=' + drake.x);
            assert(drake.x < origX + 80, 'drake did not free-run through the door');
            assert(drake.x > origX - 8, 'drake stayed on the west approach');

            var bank = win.interiorById('bank');
            var doorPt = win.tileCenter(bank.doorTx, bank.doorTy);
            var south = win.tileCenter(bank.doorTx, bank.doorTy + 2);
            drake.setPosition(south.x, south.y);
            drake.body.reset(south.x, south.y);
            drake.body.setVelocity(0, -80);
            var origY = drake.y;
            return H.sleep(800).then(function () {
                drake.body.setVelocity(0, 0);
                assert(drake.y > doorPt.y - 8, 'drake cannot enter the 1-tile house door, y=' + drake.y);
                assert(drake.y < origY + 8, 'drake did not bounce far south');
                assert(world.interiorId == null, 'giant did not trigger an interior scene');

                if (drake.body) {
                    drake.body.enable = false;
                    drake.body.setVelocity(0, 0);
                }
                drake.aliveMob = false;
                drake.setPosition(24, 24);
                world.placePlayer(spawn.x, spawn.y);
                world.player.body.setVelocity(0, 0);
                world.walkTarget = null;
                return H.holdKey(win, 'KeyD', 'd', 700).then(function () {
                    assert(world.player.x > doorEast, 'player still walks through the 1-tile door, x=' + world.player.x);
                    assert(Math.abs(world.player.y - spawn.y) < 8, 'player door walk stays on the opening row');
                    assert(!win.game.input.keyboard, 'Phaser keyboard still off after giant door check');
                    world.wanderMobs = origWander;
                    H.enterZone(win, 'haven');
                    world.placePlayer(spawn.x, spawn.y);
                    world.player.body.setVelocity(0, 0);
                });
            });
        }).then(null, function (err) {
            world.wanderMobs = origWander;
            throw err;
        });
    });
});

EmberwoodTests.add('hud: auto-attack toggle persists on the hero', function (win, H) {
    H.setAutoAttack(win, true);
    H.click(win, '#tab-bar button[data-tab="combat"]');
    assertMatch(win.document.querySelector('#panel-combat [data-auto-attack]').textContent, 'On', 'combat label on');
    H.click(win, '#panel-combat [data-auto-attack]');
    assertEqual(H.hero(win).autoAttack, false, 'combat panel toggles off');
    assertMatch(win.document.querySelector('#panel-combat [data-auto-attack]').textContent, 'Off', 'combat label off');
    assertMatch(win.document.querySelector('#panel-settings [data-auto-attack]').textContent, 'Off', 'settings label follows');
    H.click(win, '#tab-bar button[data-tab="settings"]');
    H.click(win, '#panel-settings [data-auto-attack]');
    assertEqual(H.hero(win).autoAttack, true, 'settings panel toggles on');
    assert(H.chatHas(win, 'Auto-attack on'), 'toggle chat');
});

EmberwoodTests.add('hud: all three Auto-attack buttons stay in sync and log on/off', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, true);
        world.placePlayer(spawn.x, spawn.y);
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        var combatBtn = win.document.querySelector('#panel-combat [data-auto-attack]');
        var settingsBtn = win.document.querySelector('#panel-settings [data-auto-attack]');
        var battleBtn = win.document.querySelector('#battle-panel [data-auto-attack]');
        assertEqual(win.document.querySelectorAll('[data-auto-attack]').length, 3, 'exactly three Auto-attack buttons');
        assert(combatBtn && settingsBtn && battleBtn, 'Combat, Settings, and battle-panel buttons exist');

        var assertSynced = function (on, label) {
            var expected = on ? 'On' : 'Off';
            assertEqual(H.hero(win).autoAttack, on, label + ' hero.autoAttack is ' + on);
            assertEqual(win.game.registry.get('hero').autoAttack, on, label + ' registry persists ' + on);
            [combatBtn, settingsBtn, battleBtn].forEach(function (btn, i) {
                var where = ['combat', 'settings', 'battle panel'][i];
                assertMatch(btn.textContent, expected, label + ' ' + where + ' label ' + expected);
                assertEqual(btn.classList.contains('is-on'), on, label + ' ' + where + ' is-on ' + on);
            });
        };

        H.click(win, '#tab-bar button[data-tab="combat"]');
        assertSynced(true, 'default On');
        var combatClicked = H.mouseClick(win, combatBtn);
        assertSynced(false, 'Combat click Off');
        assertEqual(H.lastChat(win), 'Auto-attack off.', 'Combat click logs off');
        assert(win.document.activeElement !== combatClicked, 'Combat toggle blurs after click');

        H.click(win, '#tab-bar button[data-tab="settings"]');
        var settingsClicked = H.mouseClick(win, settingsBtn);
        assertSynced(true, 'Settings click On');
        assertEqual(H.lastChat(win), 'Auto-attack on.', 'Settings click logs on');
        assert(win.document.activeElement !== settingsClicked, 'Settings toggle blurs after click');

        H.setAutoAttack(win, false);
        var chicken = H.findMob(win, 'Chicken');
        chicken.mobDef.hp = 40;
        return H.startFight(win, chicken).then(function () {
            assertEqual(win.Hud.mode, 'battle', 'battle panel is open');
            assertEqual(win.document.getElementById('battle-panel').hidden, false, 'battle panel visible');
            assertSynced(false, 'battle starts Off');
            var battleOn = H.mouseClick(win, battleBtn);
            assertSynced(true, 'battle-panel click On');
            assertEqual(H.lastChat(win), 'Auto-attack on.', 'battle-panel click logs on');
            assert(win.document.activeElement !== battleOn, 'battle-panel toggle blurs after click');
            var battleOff = H.mouseClick(win, battleBtn);
            assertSynced(false, 'battle-panel click Off');
            assertEqual(H.lastChat(win), 'Auto-attack off.', 'battle-panel click logs off');
            assert(win.document.activeElement !== battleOff, 'battle-panel Off blurs after click');
            assert(H.chatHas(win, 'Auto-attack on'), 'on log remains in chat');
            assert(H.chatHas(win, 'Auto-attack off'), 'off log remains in chat');
            assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
            return H.forceFlee(win);
        }).then(function () {
            assertSynced(false, 'after flee');
            assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off after flee');
        }).catch(function (err) {
            return H.cleanupBattle(win).then(function () {
                throw err;
            });
        });
    });
});

EmberwoodTests.add('world: auto-attack engages a nearby mob', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        return H.cleanupBattle(win);
    }).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, true);
        H.setAutoRetaliate(win, false);
        var chicken = H.findMob(win, 'Chicken');
        var world = H.world(win);
        world.engageGrace = 0;
        world.player.setPosition(chicken.x, chicken.y);
        world.update();
        return H.waitUntil(function () {
            return win.game.scene.isActive('BattleScene');
        }, 4000, 'auto-attack battle');
    }).then(function () {
        return H.forceFlee(win);
    }).then(function () {
        H.setAutoAttack(win, false);
        H.setAutoRetaliate(win, true);
        H.enterZone(win, 'haven');
        var chicken = H.findMob(win, 'Chicken');
        var world = H.world(win);
        world.engageGrace = 0;
        world.engageTarget = null;
        world.player.setPosition(chicken.x, chicken.y);
        world.update();
        assertEqual(win.Hud.mode, 'world', 'no auto fight when toggled off');
        assert(!world.encounterLock, 'not locked into combat');
        assertEqual(H.hero(win).autoRetaliate, true, 'auto-retaliate does not world-engage');
    });
});

EmberwoodTests.add('combat: auto-retaliate is separate from world auto-engage', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(H.hero(win).autoAttack, true, 'auto-attack defaults on');
        assertEqual(win.autoRetaliateOn(H.hero(win)), true, 'auto-retaliate defaults on');
        assertEqual(world.autoAttackOn(), true, 'world auto-engage on');
        assertEqual(world.autoRetaliateOn(), true, 'world helper sees retaliate on');

        var combatAtk = win.document.querySelector('#panel-combat [data-auto-attack]');
        var combatRet = win.document.querySelector('#panel-combat [data-auto-retaliate]');
        var settingsAtk = win.document.querySelector('#panel-settings [data-auto-attack]');
        var settingsRet = win.document.querySelector('#panel-settings [data-auto-retaliate]');
        var battleRet = win.document.querySelector('#battle-panel [data-auto-retaliate]');
        assertEqual(win.document.querySelectorAll('[data-auto-attack]').length, 3, 'three Auto-attack buttons stay');
        assertEqual(win.document.querySelectorAll('[data-auto-retaliate]').length, 3, 'three Auto-retaliate buttons');
        assert(combatAtk && combatRet && settingsAtk && settingsRet && battleRet, 'Combat, Settings, and battle-panel retaliate exist');

        H.click(win, '#tab-bar button[data-tab="combat"]');
        var retOff = H.mouseClick(win, combatRet);
        assertEqual(H.hero(win).autoRetaliate, false, 'Combat auto-retaliate toggles off');
        assertEqual(H.hero(win).autoAttack, true, 'auto-attack stays on when retaliate toggles');
        assertMatch(combatRet.textContent, 'Off', 'combat retaliate Off');
        assertMatch(settingsRet.textContent, 'Off', 'settings retaliate follows');
        assertMatch(battleRet.textContent, 'Off', 'battle-panel retaliate follows');
        assertEqual(H.lastChat(win), 'Auto-retaliate off.', 'retaliate off log');
        assert(win.document.activeElement !== retOff, 'retaliate toggle blurs');

        H.click(win, '#tab-bar button[data-tab="settings"]');
        var atkOff = H.mouseClick(win, settingsAtk);
        assertEqual(H.hero(win).autoAttack, false, 'Settings auto-attack toggles off');
        assertEqual(H.hero(win).autoRetaliate, false, 'auto-retaliate stays off when auto-attack toggles');
        assert(win.document.activeElement !== atkOff, 'auto-attack toggle blurs');
        var atkOn = H.mouseClick(win, settingsAtk);
        assertEqual(H.hero(win).autoAttack, true, 'Settings auto-attack toggles on');
        assertEqual(H.hero(win).autoRetaliate, false, 'turning auto-attack on does not turn retaliate on');
        assert(win.document.activeElement !== atkOn, 'auto-attack On blurs');

        H.setAutoAttack(win, true);
        H.setAutoRetaliate(win, false);
        assertEqual(world.autoAttackOn(), true, 'world auto-engage still on');
        assertEqual(world.autoRetaliateOn(), false, 'auto-retaliate off independently');

        var chicken = H.findMob(win, 'Chicken');
        world.engageGrace = 0;
        world.engageTarget = null;
        world.talkTarget = null;
        world.walkTarget = null;
        world.encounterLock = false;
        world.player.setPosition(chicken.x - 10, chicken.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(world.tryAutoEngage(), true, 'world auto-attack still engages with retaliate off');
        assertEqual(world.encounterLock, true, 'encounterLock after world engage');

        return H.waitUntil(function () {
            return win.game.scene.isActive('BattleScene');
        }, 4000, 'BattleScene after world auto-attack').then(function () {
            return H.waitPlayerTurn(win);
        }).then(function () {
            var battle = H.battle(win);
            var hp = battle.enemies[0].hp;
            return H.sleep(400).then(function () {
                assertEqual(H.battle(win).waitingForPlayer, true, 'retaliate off does not auto-Attack');
                assertEqual(H.battle(win).enemies[0].hp, hp, 'foe HP unchanged without retaliate');
                assertEqual(H.hero(win).autoAttack, true, 'auto-attack still on in battle');
                assertEqual(H.hero(win).autoRetaliate, false, 'auto-retaliate still off in battle');
                return H.forceFlee(win);
            });
        }).then(function () {
            H.enterZone(win, 'haven');
            world = H.world(win);
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            H.setAutoAttack(win, false);
            H.setAutoRetaliate(win, true);
            assertEqual(world.autoAttackOn(), false, 'world auto-engage off');
            assertEqual(world.autoRetaliateOn(), true, 'auto-retaliate on independently');

            chicken = H.findMob(win, 'Chicken');
            world.engageGrace = 0;
            world.engageTarget = null;
            world.encounterLock = false;
            world.player.setPosition(chicken.x - 10, chicken.y);
            world.player.body.setVelocity(0, 0);
            assertEqual(world.tryAutoEngage(), false, 'auto-retaliate does not world-engage');
            assertEqual(world.encounterLock, false, 'no lock from retaliate');
            assertEqual(win.Hud.mode, 'world', 'still world with retaliate on and auto-attack off');
            assert(!win.game.scene.isActive('BattleScene'), 'no BattleScene from retaliate');

            H.setAutoRetaliate(win, false);
            chicken.mobDef.hp = 80;
            return H.startFight(win, chicken);
        }).then(function () {
            var battle = H.battle(win);
            battle.enemies[0].hp = 80;
            var hp = battle.enemies[0].hp;
            assert(battle.waitingForPlayer, 'player turn before auto-retaliate');
            H.setAutoRetaliate(win, true);
            win.Hud.onPlayerTurn(battle);
            return H.sleep(350).then(function () {
                battle = H.battle(win);
                assert(battle.enemies[0].hp < hp, 'auto-retaliate Attack drops foe HP');
                assert(!battle.waitingForPlayer || battle.busy, 'auto-retaliate spends the turn');
                assertEqual(H.hero(win).autoAttack, false, 'world auto-attack stayed off');
                assertEqual(H.hero(win).autoRetaliate, true, 'auto-retaliate stayed on');
                assert(!win.game.input.keyboard, 'Phaser keyboard still off');
                return H.forceFlee(win);
            });
        }).then(function () {
            world = H.world(win);
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
            assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off after flee');
        }).catch(function (err) {
            return H.cleanupBattle(win).then(function () {
                throw err;
            });
        });
    });
});

EmberwoodTests.add('world: walking onto loot picks it up', function (win, H) {
    H.enterZone(win, 'haven');
    H.setAutoAttack(win, false);
    var world = H.world(win);
    assertEqual(H.hero(win).autoPickup, true, 'auto-pickup starts on');
    var gold = H.hero(win).gold;
    world.spawnLoot(200, 200, [{ id: 'coins', qty: 4 }, { id: 'bones', qty: 1 }]);
    assert((world.groundLoot || []).length >= 2, 'loot on ground');
    world.player.setPosition(200, 200);
    world.collectNearbyLoot();
    assertEqual(H.hero(win).gold, gold + 4, 'auto-pickup coins');
    assert((H.hero(win).inventory.filter(function (s) { return s.id === 'bones'; })[0] || { qty: 0 }).qty >= 1, 'auto-pickup bones');
    assert(H.chatHas(win, 'You pick up'), 'pickup logged');
});

EmberwoodTests.add('hud: auto-pickup toggle persists on the hero', function (win, H) {
    H.setAutoPickup(win, true);
    H.click(win, '#tab-bar button[data-tab="combat"]');
    assertMatch(win.document.querySelector('#panel-combat [data-auto-pickup]').textContent, 'On', 'combat label on');
    H.click(win, '#panel-combat [data-auto-pickup]');
    assertEqual(H.hero(win).autoPickup, false, 'combat panel toggles off');
    assertMatch(win.document.querySelector('#panel-combat [data-auto-pickup]').textContent, 'Off', 'combat label off');
    assertMatch(win.document.querySelector('#panel-settings [data-auto-pickup]').textContent, 'Off', 'settings label follows');
    H.click(win, '#tab-bar button[data-tab="settings"]');
    var settingsBtn = H.mouseClick(win, '#panel-settings [data-auto-pickup]');
    assertEqual(H.hero(win).autoPickup, true, 'settings panel toggles on');
    assert(win.document.activeElement !== settingsBtn, 'settings toggle blurs after click');
    assert(H.chatHas(win, 'Auto-pickup on'), 'toggle chat');
    H.enterZone(win, 'northwood');
    assertEqual(H.hero(win).autoPickup, true, 'survives zone change');
    H.enterZone(win, 'haven');
});

EmberwoodTests.add('hud: settings experiment never sets input.keyboard true', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, true);
        H.setAutoPickup(win, true);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');

        var keyboardOff = function (label) {
            var kb = win.game.input.keyboard;
            assert(kb !== true, label + ': input.keyboard is not true');
            assert(!kb, label + ': Phaser keyboard plugin stays off');
        };
        keyboardOff('before settings');

        H.click(win, '#tab-bar button[data-tab="settings"]');
        assert(H.panelVisible(win, 'settings'), 'Settings panel visible');
        keyboardOff('open Settings tab');

        var settingsAttack = win.document.querySelector('#panel-settings [data-auto-attack]');
        var settingsPickup = win.document.querySelector('#panel-settings [data-auto-pickup]');
        assert(settingsAttack && settingsPickup, 'Settings auto-attack and auto-pickup exist');

        H.mouseClick(win, settingsAttack);
        assertEqual(H.hero(win).autoAttack, false, 'settings auto-attack toggles off');
        keyboardOff('auto-attack off');

        H.mouseClick(win, settingsAttack);
        assertEqual(H.hero(win).autoAttack, true, 'settings auto-attack toggles on');
        keyboardOff('auto-attack on');

        H.mouseClick(win, settingsPickup);
        assertEqual(H.hero(win).autoPickup, false, 'settings auto-pickup toggles off');
        keyboardOff('auto-pickup off');

        H.mouseClick(win, settingsPickup);
        assertEqual(H.hero(win).autoPickup, true, 'settings auto-pickup toggles on');
        keyboardOff('auto-pickup on');

        win.dispatchEvent(new win.KeyboardEvent('keydown', {
            key: 'F8', code: 'F8', bubbles: true, cancelable: true
        }));
        assert(H.panelVisible(win, 'settings'), 'F8 keeps Settings open');
        keyboardOff('F8 Settings');

        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off after settings');
        assertEqual(Math.round(world.player.x), 328, 'still at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'still at spawn y');
    });
});

EmberwoodTests.add('input: game.input.keyboard stays false after any input change', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.clearWalk();
        H.clearKeys(win);
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!world.cursors, 'WorldScene has no Phaser cursors');
        assertEqual(typeof win.Keys.keepPhaserKeyboardOff, 'function', 'Keys.keepPhaserKeyboardOff exists');

        var keyboardFalse = function (label) {
            var kb = win.game.input.keyboard;
            assert(kb === false, label + ': game.input.keyboard === false (got ' + kb + ')');
        };

        keyboardFalse('after play');

        H.key(win, 'KeyW', 'w', 'keydown');
        assert(win.Keys.isDown('KeyW'), 'Keys.js recorded KeyW');
        keyboardFalse('W down');
        H.key(win, 'KeyW', 'w', 'keyup');
        keyboardFalse('W up');

        H.key(win, 'KeyA', 'a', 'keydown');
        keyboardFalse('A down');
        H.key(win, 'KeyA', 'a', 'keyup');
        H.key(win, 'KeyS', 's', 'keydown');
        keyboardFalse('S down');
        H.key(win, 'KeyS', 's', 'keyup');
        H.key(win, 'KeyD', 'd', 'keydown');
        keyboardFalse('D down');
        H.key(win, 'KeyD', 'd', 'keyup');
        H.clearKeys(win);

        H.key(win, 'ArrowUp', 'ArrowUp', 'keydown');
        keyboardFalse('ArrowUp');
        H.key(win, 'ArrowUp', 'ArrowUp', 'keyup');
        H.key(win, 'Escape', 'Escape', 'keydown');
        keyboardFalse('Escape');
        H.key(win, 'Escape', 'Escape', 'keyup');
        H.clearKeys(win);

        H.click(win, '#tab-bar button[data-tab="inv"]');
        keyboardFalse('Inv tab click');
        H.click(win, '#tab-bar button[data-tab="combat"]');
        keyboardFalse('Combat tab click');

        world.onClick({ worldX: spawn.x - 48, worldY: spawn.y });
        keyboardFalse('click-to-walk');
        world.clearWalk();

        win.game.input.keyboard = { enabled: true };
        assert(win.game.input.keyboard && win.game.input.keyboard.enabled, 'fixture: plugin-like object assigned');
        H.key(win, 'KeyD', 'd', 'keydown');
        keyboardFalse('after attempted re-enable on key');
        H.key(win, 'KeyD', 'd', 'keyup');
        H.clearKeys(win);

        win.game.input.keyboard = true;
        H.mouseClick(win, '#tab-bar button[data-tab="settings"]');
        keyboardFalse('after attempted re-enable on pointer');

        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        H.clearKeys(win);
        var startY = world.player.y;
        return H.holdKey(win, 'KeyW', 'w', 400).then(function () {
            assert(world.player.y < startY - 16, 'W still walks north via Keys.js, y=' + world.player.y);
            assert(Math.abs(world.player.x - spawn.x) < 8, 'W does not drift sideways');
            keyboardFalse('after WASD walk');
            H.clearKeys(win);
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
        });
    });
});

EmberwoodTests.add('world: auto-pickup off skips walk-over and click still takes', function (win, H) {
    H.enterZone(win, 'haven');
    H.setAutoAttack(win, false);
    var world = H.world(win);
    var hero = H.hero(win);
    delete hero.autoPickup;
    win.game.registry.set('hero', hero);
    assert(world.autoPickupOn(), 'missing registry key defaults on');
    win.Hud.renderAutoPickup(hero);
    assertMatch(win.document.querySelector('#panel-settings [data-auto-pickup]').textContent, 'On', 'missing key shows On');

    H.setAutoPickup(win, false);
    assert(!world.autoPickupOn(), 'toggle off');
    var gold = H.hero(win).gold;
    var bonesBefore = (H.hero(win).inventory.filter(function (s) { return s.id === 'bones'; })[0] || { qty: 0 }).qty;
    world.clearLoot();
    world.spawnLoot(200, 200, [{ id: 'coins', qty: 3 }, { id: 'bones', qty: 1 }]);
    world.player.setPosition(200, 200);
    world.collectNearbyLoot();
    assertEqual(H.hero(win).gold, gold, 'walk-over does not take coins when off');
    assertEqual((H.hero(win).inventory.filter(function (s) { return s.id === 'bones'; })[0] || { qty: 0 }).qty, bonesBefore, 'walk-over does not take bones when off');
    assert((world.groundLoot || []).filter(function (drop) { return drop && !drop.taken; }).length >= 2, 'loot stays on ground');

    world.onClick({ worldX: 200, worldY: 204 });
    assertEqual(H.hero(win).gold, gold + 3, 'click still takes coins');
    assert(H.chatHas(win, 'You pick up'), 'click pickup logged');
    var leftover = (world.groundLoot || []).filter(function (drop) { return drop && !drop.taken && drop.sprite; });
    if (leftover.length) {
        world.onClick({ worldX: leftover[0].sprite.x, worldY: leftover[0].sprite.y });
    }
    assertEqual((H.hero(win).inventory.filter(function (s) { return s.id === 'bones'; })[0] || { qty: 0 }).qty, bonesBefore + 1, 'click still takes bones');

    H.setAutoPickup(win, true);
    world.clearLoot();
    var gold2 = H.hero(win).gold;
    world.spawnLoot(220, 220, [{ id: 'coins', qty: 2 }]);
    world.player.setPosition(220, 220);
    world.collectNearbyLoot();
    assertEqual(H.hero(win).gold, gold2 + 2, 'walk-over picks up when toggled on');
    assert(H.chatHas(win, 'You pick up'), 'walk-over pickup logged');
});

EmberwoodTests.add('combat: defeat shows You are dead and retry returns to title', function (win, H) {
    var combatLevel;
    return ensureWorldPlay(win, H).then(function () {
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        var hero = H.hero(win);
        hero.hp = 4;
        combatLevel = hero.level;
        win.game.registry.set('hero', hero);
        H.setAutoAttack(win, false);
        return H.startCustomFight(win, [
            { type: 'Drake', texture: 'drake', tint: 0xffffff, hp: 80, damage: 20, gold: 0, xp: 1 }
        ]);
    }).then(function () {
        win.Hud.tryAttack();
        return H.waitUntil(function () {
            return !win.document.getElementById('dead-overlay').hidden;
        }, 5000, 'death overlay');
    }).then(function () {
        assertMatch(win.document.getElementById('dead-overlay').innerText, 'You are dead', 'death heading');
        assertEqual(win.Hud.mode, 'dead', 'hud dead mode');
        assertMatch(win.document.getElementById('dead-text').textContent, 'Combat level ' + combatLevel, 'combat level subtitle');
        assert(!win.game.input.keyboard, 'Phaser keyboard stays off');
        H.click(win, '#btn-retry');
        return H.waitUntil(function () {
            return !win.document.getElementById('title-overlay').hidden;
        }, 4000, 'title after retry');
    }).then(function () {
        assertEqual(win.Hud.mode, 'title', 'back at title');
        assert(win.document.getElementById('dead-overlay').hidden, 'death overlay closed');
    });
});

EmberwoodTests.add('title: Return to title stops scenes and shows title-overlay', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(win.game.scene.isActive('WorldScene'), 'WorldScene running before death');
        assert(win.document.getElementById('title-overlay').hidden, 'title overlay hidden in world');
        var hero = H.hero(win);
        hero.hp = 4;
        win.game.registry.set('hero', hero);
        H.setAutoAttack(win, false);
        return H.startCustomFight(win, [
            { type: 'Drake', texture: 'drake', tint: 0xffffff, hp: 80, damage: 20, gold: 0, xp: 1 }
        ]);
    }).then(function () {
        win.Hud.tryAttack();
        return H.waitUntil(function () {
            return !win.document.getElementById('dead-overlay').hidden;
        }, 5000, 'death overlay');
    }).then(function () {
        assert(win.game.scene.isActive('GameOverScene'), 'GameOverScene active on death');
        assert(!win.game.scene.isActive('WorldScene'), 'WorldScene already stopped on death');
        assert(!win.game.scene.isActive('BattleScene'), 'BattleScene already stopped on death');
        assert(win.document.getElementById('title-overlay').hidden, 'title overlay still hidden while dead');
        H.click(win, '#btn-retry');
        return H.waitUntil(function () {
            return !win.document.getElementById('title-overlay').hidden && win.game.scene.isActive('TitleScene');
        }, 4000, 'title overlay and TitleScene');
    }).then(function () {
        var overlay = win.document.getElementById('title-overlay');
        assert(overlay && overlay.hidden === false, '#title-overlay shown again');
        assertEqual(win.Hud.mode, 'title', 'hud title mode');
        assert(win.document.getElementById('dead-overlay').hidden, 'death overlay closed');
        assert(win.game.scene.isActive('TitleScene'), 'TitleScene running');
        assert(!win.game.scene.isActive('WorldScene'), 'WorldScene stopped');
        assert(!win.game.scene.isActive('BattleScene'), 'BattleScene stopped');
        assert(!win.game.scene.isActive('GameOverScene'), 'GameOverScene stopped');
        var active = win.game.scene.getScenes(true).map(function (scene) {
            return scene.sys.settings.key;
        });
        assertEqual(active.length, 1, 'only TitleScene remains active');
        assertEqual(active[0], 'TitleScene', 'active scene is TitleScene');
        assert(!win.game.input.keyboard, 'Phaser keyboard stays off');
    });
});

EmberwoodTests.add('combat: death respawns in Emberhaven at low HP and keeps items', function (win, H) {
    function stackQty(list, id) {
        var row = (list || []).filter(function (stack) { return stack.id === id; })[0];
        return row ? row.qty : 0;
    }
    var expectedHp;
    return ensureWorldPlay(win, H).then(function () {
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        world.placePlayer(spawn.x, spawn.y);

        var hero = H.hero(win);
        win.takeItem(hero, 'shrimp', 1);
        win.addItem(hero, 'bones', 2);
        hero.gold = 12;
        win.syncCoins(hero);
        hero.hp = 4;
        expectedHp = win.Hud.safeDeathHp(hero);
        assertEqual(expectedHp, 10, 'safe-death HP is 10% of maxHp');
        win.game.registry.set('hero', hero);
        world.refreshHud();

        var respawn = win.document.getElementById('btn-respawn');
        var retry = win.document.getElementById('btn-retry');
        assert(respawn && respawn === win.Hud.el.respawn, '#btn-respawn is Hud.el.respawn');
        assertEqual(respawn.textContent.replace(/\s+/g, ' ').trim(), 'Respawn in Emberhaven', 'respawn button copy');
        assert(retry && retry === win.Hud.el.retry, '#btn-retry is Hud.el.retry');
        assertEqual(retry.textContent.replace(/\s+/g, ' ').trim(), 'Return to title', 'abandon retry copy');

        return H.startCustomFight(win, [
            { type: 'Drake', texture: 'drake', tint: 0xffffff, hp: 80, damage: 20, gold: 0, xp: 1 }
        ]);
    }).then(function () {
        win.Hud.tryAttack();
        return H.waitUntil(function () {
            return !win.document.getElementById('dead-overlay').hidden;
        }, 5000, 'death overlay');
    }).then(function () {
        assertMatch(win.document.getElementById('dead-overlay').innerText, 'You are dead', 'death heading');
        assertEqual(win.Hud.mode, 'dead', 'hud dead mode');
        assert(win.game.scene.isActive('GameOverScene'), 'GameOverScene active on death');
        assert(!win.game.scene.isActive('WorldScene'), 'WorldScene already stopped on death');
        assert(!win.game.scene.isActive('BattleScene'), 'BattleScene already stopped on death');
        assert(win.document.getElementById('title-overlay').hidden, 'title stays hidden while dead');

        var deadHero = H.hero(win);
        assertEqual(stackQty(deadHero.inventory, 'shrimp'), 7, 'shrimp kept while dead');
        assertEqual(stackQty(deadHero.inventory, 'bones'), 2, 'bones kept while dead');
        assertEqual(deadHero.gold, 12, 'gold kept while dead');
        assertEqual(stackQty(deadHero.inventory, 'coins'), 12, 'coin stack kept while dead');
        assertEqual(deadHero.equipment.weapon, 'sword', 'worn sword kept');
        assertEqual(deadHero.equipment.shield, 'shield', 'worn shield kept');

        H.click(win, '#btn-respawn');
        return H.waitUntil(function () {
            var world = H.world(win);
            return win.Hud.mode === 'world' &&
                world && world.scene.isActive() && world.player &&
                win.document.getElementById('dead-overlay').hidden;
        }, 4000, 'respawn world');
    }).then(function () {
        var world = H.world(win);
        var hero = H.hero(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(win.Hud.mode, 'world', 'hud world after respawn');
        assert(win.document.getElementById('dead-overlay').hidden, 'death overlay closed');
        assert(win.document.getElementById('title-overlay').hidden, 'title stays hidden after respawn');
        assert(win.game.scene.isActive('WorldScene'), 'WorldScene running after respawn');
        assert(!win.game.scene.isActive('GameOverScene'), 'GameOverScene stopped');
        assert(!win.game.scene.isActive('BattleScene'), 'BattleScene stays stopped');
        assert(!win.game.scene.isActive('TitleScene'), 'TitleScene stays off');
        assertEqual(world.zoneId, 'haven', 'respawned in Emberhaven');
        assertEqual(Math.round(world.player.x), spawn.x, 'respawn at courtyard x');
        assertEqual(Math.round(world.player.y), spawn.y, 'respawn at courtyard y');
        assertEqual(hero.hp, expectedHp, 'respawn HP is low');
        assertEqual(hero.maxHp, 100, 'maxHp unchanged');
        assertEqual(stackQty(hero.inventory, 'shrimp'), 7, 'shrimp kept after respawn');
        assertEqual(stackQty(hero.inventory, 'bones'), 2, 'bones kept after respawn');
        assertEqual(hero.gold, 12, 'gold kept after respawn');
        assertEqual(stackQty(hero.inventory, 'coins'), 12, 'coin stack kept after respawn');
        assertEqual(stackQty(hero.inventory, 'sword'), 1, 'sword kept');
        assertEqual(stackQty(hero.inventory, 'shield'), 1, 'shield kept');
        assert(H.chatHas(win, 'You wake in Emberhaven'), 'respawn chat');
        assert(!win.game.input.keyboard, 'Phaser keyboard stays off after respawn');
    });
});

function ensureWorldPlay(win, H) {
    return H.cleanupBattle(win).then(function () {
        if (win.Hud && win.Hud.hideDialogue) {
            win.Hud.hideDialogue();
        }
        var world = H.world(win);
        if (win.Hud.mode === 'title' || win.Hud.mode === 'dead' || !world || !world.scene.isActive() || !world.player || !world.player.body) {
            return H.startPlay(win);
        }
    });
}

function pathTilesFromWalk(win, world) {
    return (world.walkPath || []).map(function (point) {
        return win.worldToTile(point.x, point.y);
    });
}

function pathIncludesTile(tiles, tx, ty) {
    return tiles.some(function (tile) {
        return tile.tx === tx && tile.ty === ty;
    });
}

EmberwoodTests.add('movement: click path walks a far tile and draws a purple line', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.encounterLock = false;
        var destX = spawn.x - 80;
        var destY = spawn.y;
        world.onClick({ worldX: destX, worldY: destY });
        assert(world.walkTarget, 'walkTarget set');
        assertEqual(Math.round(world.walkTarget.x), destX, 'walk x is the click');
        assert(world.walkPath && world.walkPath.length, 'A* path set');
        assert(world.pathGfx && world.pathGfx.visible, 'purple path graphics visible');
        assertEqual(win.PATH_LINE_COLOR, 0xaa66ff, 'path color is purple');
        var startX = world.player.x;
        return H.sleep(400).then(function () {
            assert(world.player.x < startX - 12, 'moved west along the path, x=' + world.player.x);
            assert(world.walkTarget, 'still pathing');
            assert(world.pathGfx.visible, 'purple line stays while walking');
            world.clearWalk();
            assert(!world.walkTarget, 'clearWalk drops walkTarget');
            assert(!world.pathGfx.visible, 'clearWalk hides the line');
        });
    });
});

EmberwoodTests.add('movement: minimap cell click walks toward that land and draws a purple line', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        world.engageTarget = null;
        world.talkTarget = null;
        if (world.clearWalk) {
            world.clearWalk();
        }
        world.mobs.children.iterate(function (mob) {
            if (!mob) {
                return;
            }
            mob.setPosition(80, 80);
            if (mob.body) {
                mob.body.reset(80, 80);
            }
        });
        assertEqual(spawn.x, 328, 'spawn x tile center');
        assertEqual(spawn.y, 248, 'spawn y tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assertEqual(win.Hud.mode, 'world', 'world mode');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(!world.cursors, 'WorldScene has no Phaser cursors');
        assertEqual(typeof world.walkTowardZone, 'function', 'walkTowardZone exists');

        var east = win.tileCenter(win.MAP_W - 1, Math.floor(win.MAP_H / 2));
        var north = win.tileCenter(Math.floor(win.MAP_W / 2), 0);
        var west = win.tileCenter(0, Math.floor(win.MAP_H / 2));
        var mill = win.document.querySelector('#minimap .mm-cell[data-zone="millfields"]');
        var wood = win.document.querySelector('#minimap .mm-cell[data-zone="northwood"]');
        var graves = win.document.querySelector('#minimap .mm-cell[data-zone="graves"]');
        var here = win.document.querySelector('#minimap .mm-cell[data-zone="haven"]');
        assert(mill && wood && graves && here, 'minimap cells exist');

        H.click(win, here);
        assert(!world.walkTarget, 'current-land cell does not start a walk');
        assert(!world.pathGfx.visible, 'current-land cell does not draw a path');

        H.click(win, mill);
        assert(world.walkTarget, 'millfields cell sets walkTarget');
        assertEqual(Math.round(world.walkTarget.x), Math.round(east.x), 'walk x is the east exit');
        assertEqual(Math.round(world.walkTarget.y), Math.round(east.y), 'walk y is the east exit');
        assert(world.marker.visible, 'yellow marker at the east exit');
        assert(world.walkPath && world.walkPath.length, 'A* path toward Millfields');
        assert(world.pathGfx && world.pathGfx.visible, 'purple path visible toward Millfields');
        assertEqual(win.PATH_LINE_COLOR, 0xaa66ff, 'path color is purple');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off after minimap click');

        var startX = world.player.x;
        return H.sleep(400).then(function () {
            assert(world.player.x > startX + 12, 'walks east toward Millfields, x=' + world.player.x);
            assert(world.walkTarget, 'still pathing toward Millfields');
            assert(world.pathGfx.visible, 'purple line stays while walking to the exit');
            world.clearWalk();
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);

            H.click(win, wood);
            assert(world.walkTarget, 'northwood cell sets walkTarget');
            assertEqual(Math.round(world.walkTarget.x), Math.round(north.x), 'walk x is the north exit');
            assertEqual(Math.round(world.walkTarget.y), Math.round(north.y), 'walk y is the north exit');
            assert(world.pathGfx.visible, 'purple line toward Northwood');
            world.clearWalk();

            H.click(win, graves);
            assert(world.walkTarget, 'diagonal Graves cell sets walkTarget');
            assertEqual(Math.round(world.walkTarget.x), Math.round(west.x), 'Graves hop uses the west exit');
            assertEqual(Math.round(world.walkTarget.y), Math.round(west.y), 'Graves hop y is the west exit');
            assert(world.pathGfx.visible, 'purple line toward Graves via Westmead');
            world.clearWalk();

            world.encounterLock = true;
            H.click(win, mill);
            assert(!world.walkTarget, 'encounterLock ignores minimap click');
            assert(!world.pathGfx.visible, 'no purple line under lock');
            world.encounterLock = false;

            win.Hud.mode = 'battle';
            H.click(win, mill);
            assert(!world.walkTarget, 'battle mode ignores minimap click');
            win.Hud.mode = 'world';

            win.Hud.showTitle();
            H.click(win, mill);
            assert(!world.walkTarget, 'title ignores minimap click');
            win.Hud.hideTitle();
            assertEqual(win.Hud.mode, 'world', 'world restored after title');

            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        });
    });
});

EmberwoodTests.add('hud: minimap chrome click opens the world-map panel', function (win, H) {
    function hiddenCssRule(doc, id) {
        var needle = '#' + id + '[hidden]';
        var sheets = doc.styleSheets;
        for (var s = 0; s < sheets.length; s++) {
            var rules;
            try {
                rules = sheets[s].cssRules;
            } catch (err) {
                continue;
            }
            if (!rules) {
                continue;
            }
            for (var r = 0; r < rules.length; r++) {
                var sel = rules[r].selectorText || '';
                if (sel.indexOf(needle) !== -1) {
                    return rules[r];
                }
            }
        }
        return null;
    }

    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        world.engageTarget = null;
        world.talkTarget = null;
        if (world.clearWalk) {
            world.clearWalk();
        }
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assertEqual(win.Hud.mode, 'world', 'world mode');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        var cells = win.document.querySelectorAll('#minimap .mm-cell');
        assertEqual(cells.length, 9, 'nine minimap cells');
        for (var i = 0; i < cells.length; i++) {
            assertEqual(cells[i].tagName, 'DIV', 'minimap cell ' + i + ' is a div, not a button');
        }
        assertEqual(win.document.querySelectorAll('#minimap button').length, 0, 'minimap has no leftover buttons');

        var overlay = win.document.getElementById('world-map-overlay');
        var chrome = win.document.getElementById('minimap-chrome');
        var closeBtn = win.document.getElementById('btn-world-map-close');
        var mill = win.document.querySelector('#minimap .mm-cell[data-zone="millfields"]');
        assert(overlay && overlay === win.Hud.el.worldMap, '#world-map-overlay is Hud.el.worldMap');
        assert(chrome && chrome === win.Hud.el.minimapChrome, '#minimap-chrome is Hud.el.minimapChrome');
        assert(closeBtn && mill, 'close button and Millfields cell exist');
        assertEqual(overlay.tagName, 'DIV', 'world-map overlay is an HTML div');
        assert(overlay.hidden, 'world-map starts hidden');

        var rule = hiddenCssRule(win.document, 'world-map-overlay');
        assert(rule, '#world-map-overlay[hidden] CSS exists like title/dead');
        assertEqual(rule.style.getPropertyValue('display'), 'none', '#world-map-overlay[hidden] is display:none');
        assertEqual(win.getComputedStyle(overlay).display, 'none', 'hidden world-map computed display is none');

        H.click(win, mill);
        assert(overlay.hidden, 'cell click does not open the world-map panel');
        assert(world.walkTarget, 'Millfields cell still starts a walk');
        var east = win.tileCenter(win.MAP_W - 1, Math.floor(win.MAP_H / 2));
        assertEqual(Math.round(world.walkTarget.x), Math.round(east.x), 'walk x is still the east exit');
        assertEqual(Math.round(world.walkTarget.y), Math.round(east.y), 'walk y is still the east exit');
        world.clearWalk();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);

        H.click(win, chrome);
        assertEqual(overlay.hidden, false, 'minimap chrome click opens the world-map panel');
        assertEqual(win.Hud.mode, 'world', 'world-map panel keeps Hud.mode world');
        assertEqual(win.getComputedStyle(overlay).display, 'flex', 'visible world-map uses flex CSS, not Phaser text');
        assertMatch(overlay.innerText, 'World map', 'panel heading is World map');
        assert(!world.walkTarget, 'chrome click does not start a walk');
        assertEqual(Math.round(world.player.x), 328, 'chrome click leaves the player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'chrome click leaves the player at spawn y');

        H.click(win, closeBtn);
        assert(overlay.hidden, 'Close hides the world-map panel');
        assertEqual(win.getComputedStyle(overlay).display, 'none', 'closed world-map computed display is none');

        win.Hud.showWorldMap();
        assertEqual(overlay.hidden, false, 'showWorldMap clears hidden');
        win.Hud.hideWorldMap();
        assert(overlay.hidden, 'hideWorldMap sets hidden');

        win.Hud.mode = 'battle';
        H.click(win, chrome);
        assert(overlay.hidden, 'battle mode ignores minimap chrome');
        win.Hud.mode = 'world';

        win.Hud.showTitle();
        H.click(win, chrome);
        assert(overlay.hidden, 'title ignores minimap chrome');
        win.Hud.hideTitle();
        assertEqual(win.Hud.mode, 'world', 'world restored after title');
        assert(overlay.hidden, 'world-map stays closed after title');

        assert(!win.game.input.keyboard, 'Phaser keyboard still off after world-map panel');
        assertEqual(Math.round(world.player.x), 328, 'player still at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player still at spawn y');
    });
});

EmberwoodTests.add('hud: world-map panel lists nine lands, biome, and danger', function (win, H) {
    function hiddenCssRule(doc, id) {
        var needle = '#' + id + '[hidden]';
        var sheets = doc.styleSheets;
        for (var s = 0; s < sheets.length; s++) {
            var rules;
            try {
                rules = sheets[s].cssRules;
            } catch (err) {
                continue;
            }
            if (!rules) {
                continue;
            }
            for (var r = 0; r < rules.length; r++) {
                var sel = rules[r].selectorText || '';
                if (sel.indexOf(needle) !== -1) {
                    return rules[r];
                }
            }
        }
        return null;
    }

    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        world.engageTarget = null;
        world.talkTarget = null;
        if (world.clearWalk) {
            world.clearWalk();
        }
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assertEqual(win.Hud.mode, 'world', 'world mode');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(typeof win.zoneDanger, 'function', 'zoneDanger helper exists');

        var overlay = win.document.getElementById('world-map-overlay');
        var list = win.document.getElementById('world-map-list');
        var chrome = win.document.getElementById('minimap-chrome');
        var mill = win.document.querySelector('#minimap .mm-cell[data-zone="millfields"]');
        assert(overlay && overlay === win.Hud.el.worldMap, '#world-map-overlay is Hud.el.worldMap');
        assert(list && list === win.Hud.el.worldMapList, '#world-map-list is Hud.el.worldMapList');
        assert(chrome && mill, 'minimap chrome and Millfields cell exist');
        assert(overlay.hidden, 'world-map starts hidden');
        assertEqual(overlay.tagName, 'DIV', 'world-map overlay is an HTML div');
        assertEqual(list.tagName, 'DIV', 'world-map list is an HTML div');

        var overlayRule = hiddenCssRule(win.document, 'world-map-overlay');
        assert(overlayRule, '#world-map-overlay[hidden] CSS exists like title/dead');
        assertEqual(overlayRule.style.getPropertyValue('display'), 'none', '#world-map-overlay[hidden] is display:none');
        assertEqual(win.getComputedStyle(overlay).display, 'none', 'hidden world-map computed display is none');

        H.click(win, chrome);
        assertEqual(overlay.hidden, false, 'minimap chrome click opens the world-map panel');
        assertEqual(win.Hud.mode, 'world', 'world-map panel keeps Hud.mode world');
        assertEqual(win.getComputedStyle(overlay).display, 'flex', 'visible world-map uses flex CSS, not Phaser text');
        assertEqual(list.hidden, false, 'land list is not hidden once the panel opens');
        assert(win.getComputedStyle(list).display !== 'none', 'land list is visible inside the overlay');
        assertMatch(overlay.innerText, 'World map', 'panel heading is World map');
        assertMatch(overlay.innerText, 'Land', 'list has a Land column');
        assertMatch(overlay.innerText, 'Biome', 'list has a Biome column');
        assertMatch(overlay.innerText, 'Danger', 'list has a Danger column');

        var rows = list.querySelectorAll('.wm-row[data-zone]');
        assertEqual(rows.length, 9, 'list has nine land rows');
        assertEqual(win.ZONE_LIST.length, 9, 'ZONE_LIST is still nine lands');
        var chicken = false;
        var drake = false;
        for (var i = 0; i < win.ZONE_LIST.length; i++) {
            var zone = win.ZONE_LIST[i];
            var row = list.querySelector('.wm-row[data-zone="' + zone.id + '"]');
            assert(row, 'list has a row for ' + zone.id);
            var nameEl = row.querySelector('.wm-name');
            var biomeEl = row.querySelector('.wm-biome');
            var dangerEl = row.querySelector('.wm-danger');
            assert(nameEl && biomeEl && dangerEl, zone.id + ' shows name, biome, and danger');
            assertEqual(nameEl.textContent, zone.name, zone.id + ' name');
            assertEqual(biomeEl.textContent, zone.biome, zone.id + ' biome');
            var danger = win.zoneDanger(zone.id);
            assertEqual(dangerEl.textContent, danger, zone.id + ' danger');
            if (zone.id === 'haven') {
                assertEqual(danger, 'Chicken', 'Emberhaven danger is Chicken');
                chicken = true;
            }
            if (zone.id === 'highlands') {
                assertEqual(danger, 'Drake', 'Windrock Highlands danger is Drake');
                drake = true;
            }
        }
        assert(chicken && drake, 'list spans chickens vs drakes');
        var here = list.querySelector('.wm-row.is-here');
        assert(here, 'current land is marked is-here');
        assertEqual(here.getAttribute('data-zone'), 'haven', 'is-here is Emberhaven at spawn');

        win.Hud.hideWorldMap();
        assert(overlay.hidden, 'Close hides the overlay');
        H.click(win, mill);
        assert(overlay.hidden, 'cell click does not open the world-map panel');
        assert(world.walkTarget, 'Millfields cell still starts a walk');
        var east = win.tileCenter(win.MAP_W - 1, Math.floor(win.MAP_H / 2));
        assertEqual(Math.round(world.walkTarget.x), Math.round(east.x), 'walk x is still the east exit');
        assertEqual(Math.round(world.walkTarget.y), Math.round(east.y), 'walk y is still the east exit');
        world.clearWalk();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);

        win.Hud.showWorldMap();
        assertEqual(overlay.hidden, false, 'showWorldMap opens the overlay');
        var millRow = list.querySelector('.wm-row[data-zone="millfields"]');
        assert(millRow, 'Millfields row exists');
        H.click(win, millRow);
        assert(overlay.hidden, 'list row click closes the overlay via clickMinimap');
        assert(world.walkTarget, 'list row still starts a walk');
        assertEqual(Math.round(world.walkTarget.x), Math.round(east.x), 'list row walk x is the east exit');
        assertEqual(Math.round(world.walkTarget.y), Math.round(east.y), 'list row walk y is the east exit');
        world.clearWalk();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);

        assert(!win.game.input.keyboard, 'Phaser keyboard still off after world-map list');
        assertEqual(Math.round(world.player.x), 328, 'player still at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player still at spawn y');
    });
});

EmberwoodTests.add('movement: click path goes through the courtyard gate', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.encounterLock = false;
        var inside = win.tileCenter(10, 7);
        world.onClick({ worldX: inside.x, worldY: inside.y });
        assert(pathIncludesTile(pathTilesFromWalk(win, world), 11, 10), 'path uses the 1-tile house door');
        world.clearWalk();
        var gate = win.HAVEN_GATE_TILE;
        var dest = win.tileCenter(gate.x + 4, gate.y);
        var clearPath = win.findTilePath(world.tileGrid, 20, 15, gate.x + 4, gate.y, { avoid: {}, allowEnd: true });
        assert(pathIncludesTile(clearPath, gate.x, gate.y), 'A* uses the 1-tile gate when clear');
        var avoid = {};
        avoid['25,15'] = true;
        var detour = win.findTilePath(world.tileGrid, 20, 15, gate.x + 4, gate.y, { avoid: avoid, allowEnd: true });
        assert(detour, 'detour exists around an occupied tile');
        assert(!pathIncludesTile(detour, 25, 15), 'A* skips occupied tiles when it can');
        world.mobs.children.iterate(function (mob) {
            if (!mob) {
                return;
            }
            mob.setPosition(80, 80);
            if (mob.body) {
                mob.body.reset(80, 80);
            }
        });
        world.onClick({ worldX: dest.x, worldY: dest.y });
        assert(world.walkTarget, 'path target set');
        var tiles = pathTilesFromWalk(win, world);
        assert(pathIncludesTile(tiles, gate.x, gate.y), 'path uses the 1-tile gate');
        assert(world.pathGfx && world.pathGfx.visible, 'purple line for gate path');
        return H.waitUntil(function () {
            return world.player.x > (gate.x + 1) * (win.TILE_SIZE || 16);
        }, 2500, 'walk through gate on the path').then(function () {
            assert(Math.abs(world.player.y - spawn.y) < 14, 'stayed on the gate row');
            world.clearWalk();
        });
    });
});

EmberwoodTests.add('movement: click path waits or stops adjacent when a mob parks on the only corridor', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        world.exitLock = true;
        world.engageTarget = null;
        world.talkTarget = null;
        world.clearWalk();

        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(!world.cursors, 'WorldScene has no Phaser cursors');

        var gate = win.HAVEN_GATE_TILE;
        var gatePt = win.tileCenter(gate.x, gate.y);
        var dest = win.tileCenter(gate.x + 4, gate.y);
        var gateWest = gate.x * (win.TILE_SIZE || 16);
        var gateEast = (gate.x + 1) * (win.TILE_SIZE || 16);
        var rock = win.TILE.ROCK;
        var gy;
        for (gy = 0; gy < win.MAP_H; gy++) {
            if (gy !== gate.y) {
                world.tileGrid[gy][gate.x] = rock;
            }
        }
        var chicken = H.findMob(win, 'Chicken');
        assert(chicken, 'haven chicken exists');
        world.mobs.children.iterate(function (mob) {
            if (!mob) {
                return;
            }
            if (mob === chicken) {
                mob.setPosition(gatePt.x, gatePt.y);
                mob.aliveMob = true;
                if (mob.body) {
                    mob.body.reset(gatePt.x, gatePt.y);
                    mob.body.setVelocity(0, 0);
                }
                return;
            }
            mob.setPosition(80, 80);
            if (mob.body) {
                mob.body.reset(80, 80);
                mob.body.setVelocity(0, 0);
            }
        });
        var origWander = world.wanderMobs;
        world.wanderMobs = function () {};

        var avoid = {};
        avoid[gate.x + ',' + gate.y] = true;
        var blocked = win.findTilePath(world.tileGrid, 20, 15, gate.x + 4, gate.y, { avoid: avoid, allowEnd: true });
        assertEqual(blocked, null, 'A* has no route through the parked corridor');
        var nearest = win.findTilePath(world.tileGrid, 20, 15, gate.x + 4, gate.y, { avoid: avoid, allowEnd: true, nearest: true });
        assert(nearest && nearest.length, 'nearest path stops short of the corridor');
        var lastNear = nearest[nearest.length - 1];
        assert(lastNear.tx !== gate.x || lastNear.ty !== gate.y, 'nearest path does not enter the occupied gate');
        assert(lastNear.tx < gate.x, 'nearest path stays west of the blocked gate');

        world.onClick({ worldX: dest.x, worldY: dest.y });
        assert(world.walkTarget, 'walkTarget stays the far-side click');
        assertEqual(Math.round(world.walkTarget.x), Math.round(dest.x), 'walk x is east of the gate');
        assertEqual(Math.round(world.walkTarget.y), Math.round(dest.y), 'walk y is the gate row');
        assert(world.walkBlocked, 'corridor is marked blocked');
        var tiles = pathTilesFromWalk(win, world);
        assert(!pathIncludesTile(tiles, gate.x, gate.y), 'path does not walk through the parked mob');
        assert(world.marker.visible, 'yellow marker stays on the far dest');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off after click');

        return H.waitUntil(function () {
            return world.player.x > spawn.x + 16 && world.player.x < gateWest;
        }, 4000, 'walk up to the blocked gate').then(function () {
            var xAtGate = world.player.x;
            var yAtGate = world.player.y;
            return H.sleep(800).then(function () {
                assert(world.player.x < gateWest + 4, 'waited west of the gate, x=' + world.player.x);
                assert(world.player.x < gateEast, 'did not walk through the parked mob');
                assert(world.walkTarget, 'still waiting on the original dest');
                assert(Math.abs(world.player.x - xAtGate) < 18, 'stayed adjacent instead of walking through');
                assert(Math.abs(world.player.y - yAtGate) < 18, 'did not slide off the corridor');
                assertEqual(Math.round(chicken.x), Math.round(gatePt.x), 'chicken stayed parked on the gate');
                assert(!win.game.input.keyboard, 'Phaser keyboard stays off while waiting');

                chicken.setPosition(80, 80);
                if (chicken.body) {
                    chicken.body.reset(80, 80);
                    chicken.body.setVelocity(0, 0);
                }
                world.pathCheckAt = 0;
                world.maybeRepath();
                assert(world.walkTarget, 'dest kept after the corridor opens');
                assert(!world.walkBlocked, 'repath clears the blocked flag');
                assert(pathIncludesTile(pathTilesFromWalk(win, world), gate.x, gate.y), 'open corridor uses the gate');

                return H.waitUntil(function () {
                    return world.player.x > gateEast;
                }, 4000, 'resume through the gate after the mob moves').then(function () {
                    assert(world.player.x > gatePt.x, 'passed the corridor once the mob moved');
                    assert(!win.game.input.keyboard, 'Phaser keyboard stays off');
                    world.wanderMobs = origWander;
                    world.clearWalk();
                    H.enterZone(win, 'haven');
                    world.placePlayer(spawn.x, spawn.y);
                    world.player.body.setVelocity(0, 0);
                });
            });
        }).then(null, function (err) {
            world.wanderMobs = origWander;
            throw err;
        });
    });
});

EmberwoodTests.add('movement: click-to-walk shows an OSRS yellow destination X', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        world.engageTarget = null;
        world.talkTarget = null;
        if (world.clearWalk) {
            world.clearWalk();
        }
        assertEqual(spawn.x, 328, 'spawn x tile center');
        assertEqual(spawn.y, 248, 'spawn y tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assertEqual(win.Hud.mode, 'world', 'world mode');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(!world.cursors, 'WorldScene has no Phaser cursors');
        assert(world.destX, 'dest X exists');
        assert(!world.destX.visible, 'dest X starts hidden');
        assertEqual(win.DEST_X_COLOR, 0xf8ff38, 'OSRS yellow dest color');
        assertEqual(world.destX.strokeColor, 0xf8ff38, 'X stroke is OSRS yellow');
        assert(world.destX.arm >= 7, 'X arms are larger than the 6px rect');
        assert(world.destX !== world.marker, 'X is in addition to the tiny rectangle');
        assertEqual(world.marker.width, 6, 'tiny rectangle is still 6 wide');
        assertEqual(world.marker.height, 6, 'tiny rectangle is still 6 tall');
        assert(world.destX.list && world.destX.list.length >= 2, 'X is drawn as crossing strokes');
        var yellowStrokes = world.destX.list.filter(function (child) {
            return child && child.strokeColor === 0xf8ff38;
        });
        assertEqual(yellowStrokes.length, 2, 'two yellow crossing strokes');

        var destX = spawn.x - 64;
        var destY = spawn.y;
        world.onClick({ worldX: destX, worldY: destY });
        assert(world.walkTarget, 'click sets walkTarget');
        assertEqual(Math.round(world.walkTarget.x), destX, 'walk x is the click');
        assertEqual(Math.round(world.walkTarget.y), destY, 'walk y is the click');
        assert(world.marker.visible, 'tiny yellow rectangle still shows');
        assertEqual(Math.round(world.marker.x), destX, 'rectangle at click x');
        assertEqual(Math.round(world.marker.y), destY, 'rectangle at click y');
        assert(world.destX.visible, 'OSRS yellow X is visible');
        assertEqual(Math.round(world.destX.x), destX, 'X at click x');
        assertEqual(Math.round(world.destX.y), destY, 'X at click y');
        assert(world.walkPath && world.walkPath.length, 'A* path set');
        assert(world.pathGfx && world.pathGfx.visible, 'purple path visible');

        H.key(win, 'Escape', 'Escape', 'keydown');
        world.update();
        assert(!world.walkTarget, 'Esc cancels walkTarget');
        assert(!world.destX.visible, 'Esc hides dest X');
        assert(!world.marker.visible, 'Esc hides tiny rectangle');
        H.key(win, 'Escape', 'Escape', 'keyup');
        H.clearKeys(win);

        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        var near = win.tileCenter(18, 15);
        world.onClick({ worldX: near.x, worldY: near.y });
        assert(world.destX.visible, 'short path shows dest X');
        return H.waitUntil(function () {
            return !world.walkTarget && !world.destX.visible;
        }, 2000, 'arrive and hide dest X').then(function () {
            assert(Math.abs(world.player.x - near.x) < 10, 'stopped near the click');
            assert(!world.destX.visible, 'dest X hidden on arrive');
            assert(!world.marker.visible, 'tiny rectangle hidden on arrive');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
        });
    });
});

EmberwoodTests.add('movement: Esc and click-self cancel walk and hide the purple line', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.encounterLock = false;
        world.onClick({ worldX: spawn.x - 96, worldY: spawn.y });
        assert(world.walkTarget, 'path started');
        assert(world.walkPath && world.walkPath.length, 'A* path set');
        assert(world.pathGfx.visible, 'purple line shown');
        assert(world.marker.visible, 'yellow marker shown');
        H.key(win, 'Escape', 'Escape', 'keydown');
        assert(win.Keys.isDown('Escape'), 'Keys.js recorded Escape');
        assert(win.Keys.pressed.Escape === true, 'Escape is just-pressed via Keys.js');
        world.update();
        assert(!world.walkTarget, 'Esc cancels walkTarget');
        assert(!world.walkPath, 'Esc clears walkPath');
        assert(!world.marker.visible, 'Esc hides marker');
        assert(!world.pathGfx.visible, 'Esc hides purple line');
        assert(!world.talkTarget, 'Esc clears talk target');
        H.key(win, 'Escape', 'Escape', 'keyup');
        H.clearKeys(win);

        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0);
        world.onClick({ worldX: spawn.x - 96, worldY: spawn.y });
        assert(world.walkTarget, 'second path started');
        assert(world.pathGfx.visible, 'purple line shown again');
        world.onClick({ worldX: world.player.x, worldY: world.player.y });
        assert(!world.walkTarget, 'click-self cancels walkTarget');
        assert(!world.walkPath, 'click-self clears walkPath');
        assert(!world.marker.visible, 'click-self hides marker');
        assert(!world.pathGfx.visible, 'click-self hides purple line');

        world.onClick({ worldX: spawn.x - 64, worldY: spawn.y });
        assert(world.walkTarget, 'nearby ground click still walks');
        assert(world.pathGfx.visible, 'nearby ground still draws purple line');
        world.clearWalk();
        assert(!win.game.input.keyboard, 'Phaser keyboard stays off');
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0);
    });
});

EmberwoodTests.add('movement: walk vs run toggle drains and restores run energy', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        var hero = H.hero(win);
        hero.running = false;
        hero.runEnergy = 100;
        win.game.registry.set('hero', hero);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.clearWalk();
        world.refreshHud();

        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(!world.cursors, 'WorldScene has no Phaser cursors');
        assertEqual(typeof win.Keys.runTogglePressed, 'function', 'Keys.runTogglePressed exists');
        assertEqual(H.hero(win).running, false, 'starts walking');
        assertEqual(H.hero(win).runEnergy, 100, 'full run energy');
        assertEqual(win.document.getElementById('hud-run').textContent.trim(), '100', 'HUD energy 100');
        var fill = win.document.getElementById('run-fill');
        assert(fill, 'run-energy bar exists');
        assertEqual(fill.style.width, '100%', 'bar full');
        assertEqual(world.moveSpeed(), 90, 'walk speed is 90');

        var walkY = world.player.y;
        return H.holdKey(win, 'KeyW', 'w', 400).then(function () {
            var walked = walkY - world.player.y;
            assert(walked > 16 && walked < 55, 'W walks at walk speed, dy=' + walked);
            assert(H.hero(win).runEnergy >= 99, 'walking at full energy stays full');
            assertEqual(H.hero(win).running, false, 'still walking');

            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            H.clearKeys(win);

            H.key(win, 'ControlLeft', 'Control', 'keydown');
            assert(win.Keys.isDown('Control'), 'Keys.js recorded Control');
            assert(win.Keys.pressed.Control === true, 'Control is just-pressed via Keys.js');
            world.update();
            H.key(win, 'ControlLeft', 'Control', 'keyup');
            H.clearKeys(win);
            assertEqual(H.hero(win).running, true, 'Ctrl toggles run on');
            assert(H.chatHas(win, 'You start running.'), 'run chat');
            assertEqual(world.moveSpeed(), 180, 'run speed is 180');
            assertMatch(win.document.querySelector('#panel-combat .run-mode-btn').textContent, 'On', 'combat Run On');
            assertMatch(win.document.querySelector('#panel-settings .run-mode-btn').textContent, 'On', 'settings Run On');

            var runY = world.player.y;
            var energyBefore = H.hero(win).runEnergy;
            return H.holdKey(win, 'KeyW', 'w', 400).then(function () {
                var ran = runY - world.player.y;
                assert(ran > walked + 10, 'run covers more ground than walk, dy=' + ran);
                assert(H.hero(win).runEnergy < energyBefore - 4, 'running drains energy');
                assertEqual(H.hero(win).running, true, 'still set to run');

                var drained = H.hero(win).runEnergy;
                world.player.body.setVelocity(0, 0);
                H.clearKeys(win);
                return H.sleep(400).then(function () {
                    assert(H.hero(win).runEnergy > drained + 2, 'idle restores energy');
                    assertEqual(win.document.getElementById('hud-run').textContent.trim(), String(Math.round(H.hero(win).runEnergy)), 'HUD tracks restore');

                    H.click(win, '#run-bar');
                    assertEqual(H.hero(win).running, false, 'energy bar click walks');
                    assert(H.chatHas(win, 'You start walking.'), 'walk chat');
                    assertEqual(world.moveSpeed(), 90, 'walk speed after toggle off');

                    var tired = H.hero(win);
                    tired.runEnergy = 0;
                    tired.running = false;
                    win.game.registry.set('hero', tired);
                    world.refreshHud();
                    H.click(win, '#panel-settings .run-mode-btn');
                    assertEqual(H.hero(win).running, false, 'no run at 0 energy');
                    assert(H.chatHas(win, 'You are too tired to run.'), 'tired chat');
                    assertEqual(win.document.getElementById('hud-run').textContent.trim(), '0', 'HUD energy 0');

                    tired.runEnergy = 20;
                    tired.running = false;
                    win.game.registry.set('hero', tired);
                    world.placePlayer(spawn.x, spawn.y);
                    world.player.body.setVelocity(0, 0);
                    return H.holdKey(win, 'KeyD', 'd', 400).then(function () {
                        assert(H.hero(win).runEnergy > 20, 'walking restores energy');
                        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
                        world.placePlayer(spawn.x, spawn.y);
                        world.player.body.setVelocity(0, 0);
                        H.clearKeys(win);
                    });
                });
            });
        });
    });
});

EmberwoodTests.add('movement: WASD cancels click path and hides the purple line', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.onClick({ worldX: spawn.x - 96, worldY: spawn.y });
        assert(world.walkTarget, 'path started');
        assert(world.pathGfx.visible, 'purple line shown');
        H.clearKeys(win);
        H.key(win, 'KeyW', 'w', 'keydown');
        world.update();
        assert(!world.walkTarget, 'WASD cancels walkTarget');
        assert(!world.walkPath, 'WASD clears walkPath');
        assert(!world.marker.visible, 'marker hidden');
        assert(!world.pathGfx.visible, 'purple line hidden');
        assert(!world.talkTarget, 'talk target cleared');
        H.key(win, 'KeyW', 'w', 'keyup');
        H.clearKeys(win);
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0);
    });
});

EmberwoodTests.add('movement: click path arrives and hides the purple line', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        var dest = win.tileCenter(18, 15);
        world.onClick({ worldX: dest.x, worldY: dest.y });
        assert(world.walkTarget, 'short path set');
        return H.waitUntil(function () {
            return !world.walkTarget && !world.pathGfx.visible;
        }, 2000, 'arrive and hide path').then(function () {
            assert(Math.abs(world.player.x - dest.x) < 10, 'stopped near the click');
            assert(!world.marker.visible, 'marker hidden on arrive');
        });
    });
});

EmberwoodTests.add('movement: collideWorldBounds keeps the player on the map except 14px exit strips', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(spawn.x, 328, 'spawn x tile center');
        assertEqual(spawn.y, 248, 'spawn y tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(world.player.body.collideWorldBounds, true, 'collideWorldBounds on after enterZone');

        var tile = typeof win.TILE_SIZE === 'number' ? win.TILE_SIZE : 16;
        var wantW = (typeof win.MAP_W === 'number' ? win.MAP_W : 36) * tile;
        var wantH = (typeof win.MAP_H === 'number' ? win.MAP_H : 28) * tile;
        var bounds = world.physics.world.bounds;
        assertEqual(world.map.widthInPixels, wantW, 'tilemap width px');
        assertEqual(world.map.heightInPixels, wantH, 'tilemap height px');
        assertEqual(bounds.x, 0, 'physics bounds x');
        assertEqual(bounds.y, 0, 'physics bounds y');
        assertEqual(bounds.width, wantW, 'physics bounds width = tilemap');
        assertEqual(bounds.height, wantH, 'physics bounds height = tilemap');

        var strip = 14;
        var eastInside = wantW - strip - 1;
        var eastStrip = wantW - strip + 1;
        var pathY = win.tileCenter(32, 14).y;

        function assertBodyOnMap(label) {
            var body = world.player.body;
            var b = world.physics.world.bounds;
            assert(body.left >= b.x - 0.5, label + ' body left on map (' + body.left + ')');
            assert(body.right <= b.x + b.width + 0.5, label + ' body right on map (' + body.right + ')');
            assert(body.top >= b.y - 0.5, label + ' body top on map (' + body.top + ')');
            assert(body.bottom <= b.y + b.height + 0.5, label + ' body bottom on map (' + body.bottom + ')');
        }

        world.placePlayer(eastInside, pathY);
        world.player.body.setVelocity(0, 0);
        world.exitLock = false;
        world.checkExits();
        assertEqual(world.zoneId, 'haven', '1px inside the east strip does not exit');
        assertBodyOnMap('inside strip');

        H.enterZone(win, 'graves');
        world = H.world(win);
        assertEqual(world.player.body.collideWorldBounds, true, 'collideWorldBounds after Graves enter');
        assertEqual(win.neighborId(win.ZONES.graves, 'w'), null, 'Graves has no west neighbor');
        world.placePlayer(10, pathY);
        world.player.body.setVelocity(0, 0);
        world.exitLock = false;
        world.checkExits();
        assertEqual(world.zoneId, 'graves', '14px west strip does not wrap without a neighbor');
        assertBodyOnMap('graves west strip');

        var groundWasActive = !world.groundCollider || world.groundCollider.active !== false;
        if (world.groundCollider) {
            world.groundCollider.active = false;
        }
        world.exitLock = true;
        world.placePlayer(28, pathY);
        world.player.body.setVelocity(0, 0);
        H.clearKeys(win);
        H.key(win, 'KeyA', 'a', 'keydown');
        return H.sleep(450).then(function () {
            H.key(win, 'KeyA', 'a', 'keyup');
            H.clearKeys(win);
            world = H.world(win);
            assertEqual(world.zoneId, 'graves', 'locked/closed west walk stays in Graves');
            assert(world.player.x < 28, 'A via Keys.js walks west toward the bound, x=' + world.player.x);
            assert(world.player.body.left >= -0.5, 'collideWorldBounds stops west of the map, left=' + world.player.body.left);
            assertBodyOnMap('graves bound walk');
            if (world.groundCollider && groundWasActive) {
                world.groundCollider.active = true;
            }
            world.exitLock = false;

            H.enterZone(win, 'haven');
            world = H.world(win);
            world.placePlayer(eastInside, pathY);
            world.player.body.setVelocity(0, 0);
            world.exitLock = true;
            H.clearKeys(win);
            H.key(win, 'KeyD', 'd', 'keydown');
            return H.sleep(500);
        }).then(function () {
            H.key(win, 'KeyD', 'd', 'keyup');
            H.clearKeys(win);
            world = H.world(win);
            assertEqual(world.zoneId, 'haven', 'exitLock walk stays in Emberhaven');
            assert(world.player.x > eastInside, 'D via Keys.js walks east toward the bound, x=' + world.player.x);
            assert(world.player.body.right <= wantW + 0.5, 'collideWorldBounds stops east of the map, right=' + world.player.body.right);
            assertBodyOnMap('haven locked east walk');
            world.exitLock = false;
            world.placePlayer(eastStrip, pathY);
            world.player.body.setVelocity(0, 0);
            world.checkExits();
            assertEqual(world.zoneId, 'millfields', '14px east strip enters Millfields');
            world.placePlayer(spawn.x, spawn.y);
            H.enterZone(win, 'haven');
            world = H.world(win);
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
            assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        });
    });
});

EmberwoodTests.add('world: outer edges of corner zones do not wrap', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(spawn.x, 328, 'spawn x tile center');
        assertEqual(spawn.y, 248, 'spawn y tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        var tile = typeof win.TILE_SIZE === 'number' ? win.TILE_SIZE : 16;
        var wantW = (typeof win.MAP_W === 'number' ? win.MAP_W : 36) * tile;
        var wantH = (typeof win.MAP_H === 'number' ? win.MAP_H : 28) * tile;
        var midX = (typeof win.MAP_W === 'number' ? win.MAP_W : 36) / 2 * tile;
        var midY = (typeof win.MAP_H === 'number' ? win.MAP_H : 28) / 2 * tile;
        var strip = 14;

        var corners = [
            {
                id: 'graves',
                name: 'Restless Graves',
                gx: -1,
                gy: -1,
                keep: { e: 'northwood', s: 'westmead' },
                outer: [
                    { dir: 'w', key: 'KeyA', char: 'a', x: 10, y: midY, wrapGx: -2, wrapGy: -1, wrapId: 'highlands' },
                    { dir: 'n', key: 'KeyW', char: 'w', x: midX, y: 10, wrapGx: -1, wrapGy: -2, wrapId: 'darkmine' }
                ]
            },
            {
                id: 'highlands',
                name: 'Windrock Highlands',
                gx: 1,
                gy: -1,
                keep: { w: 'northwood', s: 'millfields' },
                outer: [
                    { dir: 'e', key: 'KeyD', char: 'd', x: wantW - 10, y: midY, wrapGx: 2, wrapGy: -1, wrapId: 'graves' },
                    { dir: 'n', key: 'KeyW', char: 'w', x: midX, y: 10, wrapGx: 1, wrapGy: -2, wrapId: 'mire' }
                ]
            },
            {
                id: 'darkmine',
                name: 'Darkmine',
                gx: -1,
                gy: 1,
                keep: { e: 'southshore', n: 'westmead' },
                outer: [
                    { dir: 'w', key: 'KeyA', char: 'a', x: 10, y: midY, wrapGx: -2, wrapGy: 1, wrapId: 'mire' },
                    { dir: 's', key: 'KeyS', char: 's', x: midX, y: wantH - 10, wrapGx: -1, wrapGy: 2, wrapId: 'graves' }
                ]
            },
            {
                id: 'mire',
                name: 'Mirefen',
                gx: 1,
                gy: 1,
                keep: { w: 'southshore', n: 'millfields' },
                outer: [
                    { dir: 'e', key: 'KeyD', char: 'd', x: wantW - 10, y: midY, wrapGx: 2, wrapGy: 1, wrapId: 'darkmine' },
                    { dir: 's', key: 'KeyS', char: 's', x: midX, y: wantH - 10, wrapGx: 1, wrapGy: 2, wrapId: 'highlands' }
                ]
            }
        ];

        function assertBodyOnMap(label) {
            var body = world.player.body;
            var b = world.physics.world.bounds;
            assert(body.left >= b.x - 0.5, label + ' body left on map (' + body.left + ')');
            assert(body.right <= b.x + b.width + 0.5, label + ' body right on map (' + body.right + ')');
            assert(body.top >= b.y - 0.5, label + ' body top on map (' + body.top + ')');
            assert(body.bottom <= b.y + b.height + 0.5, label + ' body bottom on map (' + body.bottom + ')');
        }

        function walkOuter(list, i) {
            if (i >= list.length) {
                H.enterZone(win, 'haven');
                world = H.world(win);
                world.placePlayer(spawn.x, spawn.y);
                world.player.body.setVelocity(0, 0);
                assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
                assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
                assert(!win.game.input.keyboard, 'Phaser keyboard still off');
                return Promise.resolve();
            }
            var corner = list[i];
            var zone = win.ZONES[corner.id];
            assert(zone, corner.id + ' exists');
            assertEqual(zone.gx, corner.gx, corner.id + ' gx');
            assertEqual(zone.gy, corner.gy, corner.id + ' gy');
            Object.keys(corner.keep).forEach(function (dir) {
                assertEqual(win.neighborId(zone, dir), corner.keep[dir], corner.id + ' keeps ' + dir);
            });

            H.enterZone(win, corner.id);
            world = H.world(win);
            H.setAutoAttack(win, false);
            assertEqual(world.zoneId, corner.id, 'enter ' + corner.id);
            assertEqual(win.document.getElementById('hud-zone').textContent, corner.name, corner.id + ' HUD');

            var chatBefore = H.lastChat(win);
            assertEqual(chatBefore, 'You enter ' + corner.name + '.', corner.id + ' enter chat');

            var chain = Promise.resolve();
            corner.outer.forEach(function (edge) {
                chain = chain.then(function () {
                    assertEqual(win.neighborId(zone, edge.dir), null, corner.id + ' has no ' + edge.dir + ' neighbor');
                    assertEqual(win.zoneByGrid(edge.wrapGx, edge.wrapGy), null, corner.id + ' ' + edge.dir + ' grid does not wrap');
                    world.placePlayer(edge.x, edge.y);
                    world.player.body.setVelocity(0, 0);
                    world.exitLock = false;
                    world.encounterLock = false;
                    world.checkExits();
                    world = H.world(win);
                    assertEqual(world.zoneId, corner.id, corner.id + ' ' + edge.dir + ' strip does not enterZone');
                    assertEqual(world.zoneId !== edge.wrapId, true, corner.id + ' ' + edge.dir + ' does not wrap to ' + edge.wrapId);
                    assertEqual(win.document.getElementById('hud-zone').textContent, corner.name, corner.id + ' ' + edge.dir + ' HUD stays');
                    assertEqual(H.lastChat(win), chatBefore, corner.id + ' ' + edge.dir + ' chat does not wrap');
                    assertBodyOnMap(corner.id + ' ' + edge.dir + ' strip');

                    var groundWasActive = !world.groundCollider || world.groundCollider.active !== false;
                    if (world.groundCollider) {
                        world.groundCollider.active = false;
                    }
                    var startX = world.player.x;
                    var startY = world.player.y;
                    H.clearKeys(win);
                    H.key(win, edge.key, edge.char, 'keydown');
                    return H.sleep(400).then(function () {
                        H.key(win, edge.key, edge.char, 'keyup');
                        H.clearKeys(win);
                        world = H.world(win);
                        assertEqual(world.zoneId, corner.id, corner.id + ' ' + edge.dir + ' Keys.js walk stays');
                        assertEqual(H.lastChat(win), chatBefore, corner.id + ' ' + edge.dir + ' walk chat stays');
                        if (edge.dir === 'w') {
                            assert(world.player.x < startX, corner.id + ' A walks west, x=' + world.player.x);
                        } else if (edge.dir === 'e') {
                            assert(world.player.x > startX, corner.id + ' D walks east, x=' + world.player.x);
                        } else if (edge.dir === 'n') {
                            assert(world.player.y < startY, corner.id + ' W walks north, y=' + world.player.y);
                        } else {
                            assert(world.player.y > startY, corner.id + ' S walks south, y=' + world.player.y);
                        }
                        assertBodyOnMap(corner.id + ' ' + edge.dir + ' walk');
                        if (world.groundCollider && groundWasActive) {
                            world.groundCollider.active = true;
                        }
                    });
                });
            });
            return chain.then(function () {
                return walkOuter(list, i + 1);
            });
        }

        assert(strip === 14, 'exit strip is 14px');
        return walkOuter(corners, 0);
    });
});

EmberwoodTests.add('world: walking off a path at N/S/E/W enters the neighbor and chats You enter', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(spawn.x, 328, 'spawn x tile center');
        assertEqual(spawn.y, 248, 'spawn y tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        var tile = typeof win.TILE_SIZE === 'number' ? win.TILE_SIZE : 16;
        var wantW = (typeof win.MAP_W === 'number' ? win.MAP_W : 36) * tile;
        var wantH = (typeof win.MAP_H === 'number' ? win.MAP_H : 28) * tile;
        var strip = 14;
        var pathX = win.tileCenter(18, 14).x;
        var pathY = win.tileCenter(18, 14).y;
        assertEqual(win.TILE.PATH, 3, 'PATH tile index');
        assertEqual(win.neighborId(win.ZONES.haven, 'n'), 'northwood', 'haven north neighbor');
        assertEqual(win.neighborId(win.ZONES.haven, 's'), 'southshore', 'haven south neighbor');
        assertEqual(win.neighborId(win.ZONES.haven, 'e'), 'millfields', 'haven east neighbor');
        assertEqual(win.neighborId(win.ZONES.haven, 'w'), 'westmead', 'haven west neighbor');

        var exits = [
            { dir: 'e', key: 'KeyD', char: 'd', x: wantW - strip - 1, y: pathY, zone: 'millfields', name: 'Millfields' },
            { dir: 'w', key: 'KeyA', char: 'a', x: strip + 1, y: pathY, zone: 'westmead', name: 'Westmead' },
            { dir: 'n', key: 'KeyW', char: 'w', x: pathX, y: strip + 1, zone: 'northwood', name: 'Northwood' },
            { dir: 's', key: 'KeyS', char: 's', x: pathX, y: wantH - strip - 1, zone: 'southshore', name: 'Southshore' }
        ];

        function tileAt(x, y) {
            var t = win.worldToTile(x, y);
            return world.tileGrid[t.ty][t.tx];
        }

        function walkExit(i) {
            if (i >= exits.length) {
                H.enterZone(win, 'haven');
                world = H.world(win);
                world.placePlayer(spawn.x, spawn.y);
                world.player.body.setVelocity(0, 0);
                assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
                assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
                assert(!win.game.input.keyboard, 'Phaser keyboard still off');
                return Promise.resolve();
            }
            var step = exits[i];
            H.enterZone(win, 'haven');
            world = H.world(win);
            H.setAutoAttack(win, false);
            world.placePlayer(step.x, step.y);
            world.player.body.setVelocity(0, 0);
            world.exitLock = false;
            assertEqual(tileAt(step.x, step.y), win.TILE.PATH, step.dir + ' stand is on PATH');
            world.checkExits();
            assertEqual(world.zoneId, 'haven', step.dir + ' 1px inside the strip does not exit');

            H.clearKeys(win);
            H.key(win, step.key, step.char, 'keydown');
            return H.waitUntil(function () {
                return H.world(win).zoneId === step.zone;
            }, 1500, step.dir + ' Keys.js walk into ' + step.name).then(function () {
                H.key(win, step.key, step.char, 'keyup');
                H.clearKeys(win);
                world = H.world(win);
                assertEqual(world.zoneId, step.zone, step.dir + ' walk enters ' + step.name);
                assertEqual(H.lastChat(win), 'You enter ' + step.name + '.', step.dir + ' chat You enter');
                return walkExit(i + 1);
            });
        }

        return walkExit(0);
    });
});

EmberwoodTests.add('world: spawnPointForEntry places the player on the opposite side', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(spawn.x, 328, 'spawn x tile center');
        assertEqual(spawn.y, 248, 'spawn y tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(typeof win.spawnPointForEntry, 'function', 'spawnPointForEntry exists');

        var tile = typeof win.TILE_SIZE === 'number' ? win.TILE_SIZE : 16;
        var mapW = typeof win.MAP_W === 'number' ? win.MAP_W : 36;
        var mapH = typeof win.MAP_H === 'number' ? win.MAP_H : 28;
        var wantW = mapW * tile;
        var wantH = mapH * tile;
        var cx = (mapW / 2) * tile;
        var cy = (mapH / 2) * tile;
        var southY = (mapH - 3) * tile;
        var northY = 3 * tile;
        var eastX = (mapW - 3) * tile;
        var westX = 3 * tile;
        var strip = 14;
        var pathX = win.tileCenter(18, 14).x;
        var pathY = win.tileCenter(18, 14).y;

        var fromN = win.spawnPointForEntry('n');
        var fromS = win.spawnPointForEntry('s');
        var fromW = win.spawnPointForEntry('w');
        var fromE = win.spawnPointForEntry('e');
        var fallback = win.spawnPointForEntry(null);
        assertEqual(fromN.x, cx, 'enter from n x is mid');
        assertEqual(fromN.y, southY, 'enter from n spawn near south');
        assertEqual(fromS.x, cx, 'enter from s x is mid');
        assertEqual(fromS.y, northY, 'enter from s spawn near north');
        assertEqual(fromW.x, eastX, 'enter from w spawn near east');
        assertEqual(fromW.y, cy, 'enter from w y is mid');
        assertEqual(fromE.x, westX, 'enter from e spawn near west');
        assertEqual(fromE.y, cy, 'enter from e y is mid');
        assert(fromN.y > wantH / 2, 'n spawn is in the south half');
        assert(fromS.y < wantH / 2, 's spawn is in the north half');
        assert(fromW.x > wantW / 2, 'w spawn is in the east half');
        assert(fromE.x < wantW / 2, 'e spawn is in the west half');
        assertEqual(fallback.x, 328, 'unknown dir falls back to courtyard x');
        assertEqual(fallback.y, 248, 'unknown dir falls back to courtyard y');

        var placed = [
            { dir: 'n', zone: 'northwood', name: 'Northwood', x: fromN.x, y: fromN.y },
            { dir: 's', zone: 'southshore', name: 'Southshore', x: fromS.x, y: fromS.y },
            { dir: 'w', zone: 'westmead', name: 'Westmead', x: fromW.x, y: fromW.y },
            { dir: 'e', zone: 'millfields', name: 'Millfields', x: fromE.x, y: fromE.y }
        ];
        placed.forEach(function (step) {
            world.enterZone(step.zone, step.dir);
            world.exitLock = false;
            world.encounterLock = false;
            world = H.world(win);
            assertEqual(world.zoneId, step.zone, 'enterZone(' + step.dir + ') lands in ' + step.name);
            assertEqual(Math.round(world.player.x), Math.round(step.x), step.dir + ' enterZone spawn x');
            assertEqual(Math.round(world.player.y), Math.round(step.y), step.dir + ' enterZone spawn y');
        });

        var walks = [
            { dir: 'n', key: 'KeyW', char: 'w', x: pathX, y: strip + 1, zone: 'northwood', name: 'Northwood', wantX: fromN.x, wantY: fromN.y },
            { dir: 's', key: 'KeyS', char: 's', x: pathX, y: wantH - strip - 1, zone: 'southshore', name: 'Southshore', wantX: fromS.x, wantY: fromS.y },
            { dir: 'w', key: 'KeyA', char: 'a', x: strip + 1, y: pathY, zone: 'westmead', name: 'Westmead', wantX: fromW.x, wantY: fromW.y },
            { dir: 'e', key: 'KeyD', char: 'd', x: wantW - strip - 1, y: pathY, zone: 'millfields', name: 'Millfields', wantX: fromE.x, wantY: fromE.y }
        ];

        function tileAt(x, y) {
            var t = win.worldToTile(x, y);
            return world.tileGrid[t.ty][t.tx];
        }

        function walkEntry(i) {
            if (i >= walks.length) {
                H.enterZone(win, 'haven');
                world = H.world(win);
                world.placePlayer(spawn.x, spawn.y);
                world.player.body.setVelocity(0, 0);
                assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
                assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
                assert(!win.game.input.keyboard, 'Phaser keyboard still off');
                return Promise.resolve();
            }
            var step = walks[i];
            H.enterZone(win, 'haven');
            world = H.world(win);
            H.setAutoAttack(win, false);
            world.placePlayer(step.x, step.y);
            world.player.body.setVelocity(0, 0);
            world.exitLock = false;
            assertEqual(tileAt(step.x, step.y), win.TILE.PATH, step.dir + ' stand is on PATH');
            H.clearKeys(win);
            H.key(win, step.key, step.char, 'keydown');
            var landed = null;
            return H.waitUntil(function () {
                var w = H.world(win);
                if (w.zoneId === step.zone) {
                    if (!landed) {
                        landed = { x: w.player.x, y: w.player.y };
                    }
                    return true;
                }
                return false;
            }, 1500, step.dir + ' Keys.js walk into ' + step.name).then(function () {
                H.key(win, step.key, step.char, 'keyup');
                H.clearKeys(win);
                world = H.world(win);
                assert(landed, step.dir + ' captured opposite spawn');
                assertEqual(world.zoneId, step.zone, step.dir + ' walk enters ' + step.name);
                if (step.dir === 'n') {
                    assert(landed.y > wantH / 2, step.dir + ' walk spawn is south half (y=' + landed.y + ')');
                    assert(Math.abs(landed.x - step.wantX) < 48, step.dir + ' walk spawn x near mid (' + landed.x + ')');
                } else if (step.dir === 's') {
                    assert(landed.y < wantH / 2, step.dir + ' walk spawn is north half (y=' + landed.y + ')');
                    assert(Math.abs(landed.x - step.wantX) < 48, step.dir + ' walk spawn x near mid (' + landed.x + ')');
                } else if (step.dir === 'w') {
                    assert(landed.x > wantW / 2, step.dir + ' walk spawn is east half (x=' + landed.x + ')');
                    assert(Math.abs(landed.y - step.wantY) < 48, step.dir + ' walk spawn y near mid (' + landed.y + ')');
                } else {
                    assert(landed.x < wantW / 2, step.dir + ' walk spawn is west half (x=' + landed.x + ')');
                    assert(Math.abs(landed.y - step.wantY) < 48, step.dir + ' walk spawn y near mid (' + landed.y + ')');
                }
                return walkEntry(i + 1);
            });
        }

        return walkEntry(0);
    });
});

EmberwoodTests.add('world: default spawn and edge spawns do not start inside a solid tile', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(spawn.x, 328, 'spawn x tile center');
        assertEqual(spawn.y, 248, 'spawn y tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        var courtyard = win.tileCenter(20, 15);
        assertEqual(courtyard.x, 328, 'tile (20,15) x');
        assertEqual(courtyard.y, 248, 'tile (20,15) y');
        assertEqual(win.worldToTile(328, 248).tx, 20, 'spawn world x is tile 20');
        assertEqual(win.worldToTile(328, 248).ty, 15, 'spawn world y is tile 15');
        assertEqual(world.tileGrid[15][20], win.TILE.PATH, 'default spawn tile (20,15) is PATH');

        function tileName(idx) {
            var names = {
                1: 'GRASS',
                2: 'GRASS2',
                3: 'PATH',
                4: 'FLOWER',
                5: 'WATER',
                6: 'TREE',
                7: 'ROCK',
                8: 'SHRINE'
            };
            return names[idx] || String(idx);
        }

        function assertClearAt(label, x, y) {
            world = H.world(win);
            var at = win.worldToTile(x, y);
            assert(world.tileGrid && world.tileGrid[at.ty], label + ' has tile row');
            var idx = world.tileGrid[at.ty][at.tx];
            assert(!win.tileBlockedByTerrain(idx), label + ' tile (' + at.tx + ',' + at.ty + ') is ' + tileName(idx) + ', not solid');
            var layerTile = world.ground && world.ground.getTileAt(at.tx, at.ty);
            if (layerTile) {
                assert(!layerTile.collides, label + ' layer tile does not collide');
            }
            var body = world.player.body;
            var corners = [
                { x: body.x + 1, y: body.y + 1 },
                { x: body.x + body.width - 1, y: body.y + 1 },
                { x: body.x + 1, y: body.y + body.height - 1 },
                { x: body.x + body.width - 1, y: body.y + body.height - 1 }
            ];
            corners.forEach(function (pt, i) {
                var t = win.worldToTile(pt.x, pt.y);
                var ci = world.tileGrid[t.ty][t.tx];
                assert(!win.tileBlockedByTerrain(ci), label + ' body corner ' + i + ' (' + t.tx + ',' + t.ty + ') is ' + tileName(ci));
            });
        }

        assertClearAt('default spawn', spawn.x, spawn.y);

        var edges = [];
        win.ZONE_LIST.forEach(function (zone) {
            var n = win.zoneNeighbors(zone);
            if (n.s) {
                edges.push({ zone: zone.id, name: zone.name, fromDir: 'n' });
            }
            if (n.n) {
                edges.push({ zone: zone.id, name: zone.name, fromDir: 's' });
            }
            if (n.e) {
                edges.push({ zone: zone.id, name: zone.name, fromDir: 'w' });
            }
            if (n.w) {
                edges.push({ zone: zone.id, name: zone.name, fromDir: 'e' });
            }
        });
        assertEqual(edges.length, 24, '24 directed edge entries (12 adjacencies both ways)');

        edges.forEach(function (step) {
            world.enterZone(step.zone, step.fromDir);
            world.exitLock = false;
            world.encounterLock = false;
            world = H.world(win);
            H.setAutoAttack(win, false);
            var want = win.spawnPointForEntry(step.fromDir);
            assertEqual(world.zoneId, step.zone, step.name + ' from ' + step.fromDir);
            assertEqual(Math.round(world.player.x), Math.round(want.x), step.name + ' ' + step.fromDir + ' spawn x');
            assertEqual(Math.round(world.player.y), Math.round(want.y), step.name + ' ' + step.fromDir + ' spawn y');
            assertClearAt(step.name + ' from ' + step.fromDir, world.player.x, world.player.y);
            assert(!win.game.input.keyboard, 'Phaser keyboard off after ' + step.name);
        });

        H.enterZone(win, 'haven');
        world = H.world(win);
        H.setAutoAttack(win, false);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.exitLock = true;
        world.encounterLock = false;
        return H.holdKey(win, 'KeyW', 'w', 400).then(function () {
            H.clearKeys(win);
            world = H.world(win);
            assert(world.player.y < spawn.y - 16, 'W from courtyard spawn walks north, y=' + world.player.y);
            assertEqual(world.zoneId, 'haven', 'W from spawn stays in haven');
            assert(!win.game.input.keyboard, 'Phaser keyboard off after courtyard walk');

            world.enterZone('northwood', 'n');
            world.exitLock = true;
            world.encounterLock = false;
            world = H.world(win);
            H.setAutoAttack(win, false);
            var edge = win.spawnPointForEntry('n');
            assertEqual(Math.round(world.player.y), Math.round(edge.y), 'Northwood south-edge spawn y');
            assertClearAt('Northwood live edge', world.player.x, world.player.y);
            return H.holdKey(win, 'KeyW', 'w', 400);
        }).then(function () {
            H.clearKeys(win);
            world = H.world(win);
            assert(world.player.y < 400 - 16, 'W from Northwood edge spawn walks north, y=' + world.player.y);
            assertEqual(world.zoneId, 'northwood', 'edge walk stays in Northwood');
            var after = win.worldToTile(world.player.x, world.player.y);
            assert(!win.tileBlockedByTerrain(world.tileGrid[after.ty][after.tx]), 'walked onto a non-solid tile');

            H.enterZone(win, 'haven');
            world = H.world(win);
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
            assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        });
    });
});

EmberwoodTests.add('world: exitLock (~400ms) prevents skipping a zone in one dash', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(spawn.x, 328, 'spawn x tile center');
        assertEqual(spawn.y, 248, 'spawn y tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        var tile = typeof win.TILE_SIZE === 'number' ? win.TILE_SIZE : 16;
        var wantW = (typeof win.MAP_W === 'number' ? win.MAP_W : 36) * tile;
        var strip = 14;
        var pathX = win.tileCenter(18, 14).x;
        var pathY = win.tileCenter(18, 14).y;
        var eastStrip = wantW - strip + 1;
        var northStrip = strip - 1;
        var westStrip = strip - 1;
        var lockedAt = 0;

        function tileAt(x, y) {
            var t = win.worldToTile(x, y);
            return world.tileGrid[t.ty][t.tx];
        }

        return H.sleep(450).then(function () {
            world = H.world(win);
            world.exitLock = false;
            world.encounterLock = false;
            world.placePlayer(eastStrip, pathY);
            world.player.body.setVelocity(0, 0);
            assertEqual(tileAt(eastStrip, pathY), win.TILE.PATH, 'haven east stand is on PATH');
            lockedAt = Date.now();
            world.checkExits();
            world = H.world(win);
            assertEqual(world.zoneId, 'millfields', 'east strip enters Millfields');
            assertEqual(world.exitLock, true, 'enter sets exitLock');

            world.placePlayer(pathX, northStrip);
            world.player.body.setVelocity(0, 0);
            assertEqual(tileAt(pathX, northStrip), win.TILE.PATH, 'millfields north stand is on PATH');
            world.checkExits();
            world = H.world(win);
            assertEqual(world.zoneId, 'millfields', 'exitLock blocks skip to Highlands');
            assertEqual(world.exitLock, true, 'exitLock still on during dash');

            world.placePlayer(westStrip, pathY);
            world.player.body.setVelocity(0, 0);
            world.checkExits();
            world = H.world(win);
            assertEqual(world.zoneId, 'millfields', 'exitLock blocks bounce back to Emberhaven');

            return H.sleep(220);
        }).then(function () {
            world = H.world(win);
            assertEqual(world.exitLock, true, 'exitLock still on at ~220ms');
            world.placePlayer(pathX, northStrip);
            world.player.body.setVelocity(0, 0);
            world.checkExits();
            world = H.world(win);
            assertEqual(world.zoneId, 'millfields', 'still Millfields at ~220ms');
            world.placePlayer(pathX, pathY);
            world.player.body.setVelocity(0, 0);
            return H.waitUntil(function () {
                return H.world(win).exitLock === false && H.world(win).zoneId === 'millfields';
            }, 800, 'exitLock releases after ~400ms');
        }).then(function () {
            var elapsed = Date.now() - lockedAt;
            assert(elapsed >= 320, 'lock lasted at least ~400ms (' + elapsed + 'ms)');
            assert(elapsed <= 850, 'lock released near 400ms (' + elapsed + 'ms)');
            world = H.world(win);
            assertEqual(world.exitLock, false, 'exitLock clears after ~400ms');
            world.placePlayer(pathX, northStrip);
            world.player.body.setVelocity(0, 0);
            world.checkExits();
            world = H.world(win);
            assertEqual(world.zoneId, 'highlands', 'after unlock north strip enters Windrock Highlands');

            return H.sleep(450);
        }).then(function () {
            H.enterZone(win, 'haven');
            world = H.world(win);
            H.setAutoAttack(win, false);
            world.exitLock = false;
            world.encounterLock = false;
            world.placePlayer(wantW - strip - 1, pathY);
            world.player.body.setVelocity(0, 0);
            assertEqual(tileAt(wantW - strip - 1, pathY), win.TILE.PATH, 'haven east-inside is on PATH');
            H.clearKeys(win);
            H.key(win, 'KeyD', 'd', 'keydown');
            return H.waitUntil(function () {
                return H.world(win).zoneId === 'millfields';
            }, 1500, 'Keys.js D walk into Millfields');
        }).then(function () {
            H.key(win, 'KeyD', 'd', 'keyup');
            H.clearKeys(win);
            world = H.world(win);
            assertEqual(world.zoneId, 'millfields', 'D walk enters Millfields');
            assertEqual(world.exitLock, true, 'Keys.js enter sets exitLock');
            world.placePlayer(pathX, northStrip);
            world.player.body.setVelocity(0, 0);
            H.key(win, 'KeyW', 'w', 'keydown');
            return H.sleep(220);
        }).then(function () {
            H.key(win, 'KeyW', 'w', 'keyup');
            H.clearKeys(win);
            world = H.world(win);
            assertEqual(world.zoneId, 'millfields', 'W during lock stays in Millfields (no skip)');
            world.placePlayer(pathX, pathY);
            world.player.body.setVelocity(0, 0);
            return H.waitUntil(function () {
                return H.world(win).exitLock === false && H.world(win).zoneId === 'millfields';
            }, 800, 'Keys.js exitLock releases inland');
        }).then(function () {
            world = H.world(win);
            world.placePlayer(pathX, northStrip);
            world.player.body.setVelocity(0, 0);
            H.clearKeys(win);
            H.key(win, 'KeyW', 'w', 'keydown');
            return H.waitUntil(function () {
                return H.world(win).zoneId === 'highlands';
            }, 1500, 'Keys.js W after unlock enters Highlands');
        }).then(function () {
            H.key(win, 'KeyW', 'w', 'keyup');
            H.clearKeys(win);
            world = H.world(win);
            assertEqual(world.zoneId, 'highlands', 'after unlock W enters Highlands');
            H.enterZone(win, 'haven');
            world = H.world(win);
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
            assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        });
    });
});

function isDestroyedGo(obj) {
    if (!obj) {
        return true;
    }
    try {
        return obj.active === false || obj.scene == null;
    } catch (err) {
        return true;
    }
}

function assertEnterZoneClearedOld(win, H, old, world, via) {
    assert(world.map && world.map !== old.map, via + ' built a new tilemap');
    assert(world.ground && world.ground !== old.ground, via + ' built a new ground layer');
    assert(world.groundCollider && world.groundCollider !== old.collider, via + ' built a new ground collider');
    assert(!old.map.scene, via + ' old tilemap scene is cleared');
    assert(isDestroyedGo(old.ground), via + ' old ground layer is destroyed');
    assert(old.collider, via + ' old groundCollider existed');
    assert(!old.collider.world, via + ' old groundCollider world cleared');
    assertEqual(old.collider.active, false, via + ' old groundCollider inactive');
    var queuedColliders = [];
    if (world.physics.world.colliders) {
        if (typeof world.physics.world.colliders.getActive === 'function') {
            queuedColliders = world.physics.world.colliders.getActive();
        } else if (world.physics.world.colliders.list) {
            queuedColliders = world.physics.world.colliders.list;
        }
    }
    var stillLive = queuedColliders.filter(function (col) {
        return col === old.collider && col && col.active && col.world;
    });
    assertEqual(stillLive.length, 0, via + ' old ground collider is not live');
    assertEqual(world.groundLoot.length, 0, via + ' clearLoot emptied groundLoot');
    old.lootSprites.forEach(function (sprite, i) {
        assert(isDestroyedGo(sprite), via + ' old loot sprite ' + i + ' is destroyed');
    });
    old.npcs.forEach(function (npc, i) {
        assert(isDestroyedGo(npc), via + ' old NPC ' + i + ' is destroyed');
        assert(world.npcs.getChildren().indexOf(npc) === -1, via + ' old NPC ' + i + ' not in new group');
    });
    old.mobs.forEach(function (mob, i) {
        assert(isDestroyedGo(mob), via + ' old mob ' + i + ' is destroyed');
        assert(world.mobs.getChildren().indexOf(mob) === -1, via + ' old mob ' + i + ' not in new group');
    });
    old.labels.forEach(function (label, i) {
        assert(isDestroyedGo(label), via + ' old float label ' + i + ' is destroyed');
        assert(world.floatLabels.indexOf(label) === -1, via + ' old float label ' + i + ' not reused');
    });
    assert(!H.findNpc(win, 'guild'), via + ' Bram does not persist');
    assert(!H.findMob(win, 'Chicken'), via + ' haven chicken does not persist');
    assert(H.findNpc(win, 'ranger'), via + ' Ranger Kett spawned');
    assert(H.findMob(win, 'Goblin'), via + ' goblin spawned');
    assertEqual(world.npcs.getChildren().length, (win.NPC_DEFS.northwood || []).length, via + ' Northwood NPC count');
    assertEqual(world.mobs.getChildren().length, (win.MOB_DEFS.northwood || []).length, via + ' Northwood mob count');
    assertEqual(world.floatLabels.length, world.npcs.getChildren().length + world.mobs.getChildren().length, via + ' new float labels only');
    world.floatLabels.forEach(function (label) {
        assert(label.active !== false && label.scene, via + ' new float label is live');
    });
    assert(world.map && typeof world.map.createLayer === 'function', via + ' new map is Phaser 3 tilemap');
    assert(world.ground && world.groundCollider && world.groundCollider.active, via + ' new ground + collider are live');
}

function snapshotHavenWorld(win, H, world) {
    world.clearLoot();
    world.spawnLoot(200, 200, [{ id: 'coins', qty: 2 }, { id: 'bones', qty: 1 }]);
    assertEqual(world.groundLoot.length, 2, 'haven has ground loot before leave');
    var old = {
        map: world.map,
        ground: world.ground,
        collider: world.groundCollider,
        npcs: world.npcs.getChildren().slice(),
        mobs: world.mobs.getChildren().slice(),
        labels: world.floatLabels.slice(),
        lootSprites: world.groundLoot.map(function (drop) {
            return drop && drop.sprite;
        })
    };
    assert(old.npcs.length >= 3, 'haven spawned NPCs');
    assert(old.mobs.length >= 2, 'haven spawned mobs');
    assert(old.labels.length >= old.npcs.length + old.mobs.length, 'haven spawned float labels');
    assert(old.map && old.ground && old.collider, 'haven tilemap + collider exist');
    assert(H.findNpc(win, 'guild'), 'Bram is in Emberhaven');
    assert(H.findMob(win, 'Chicken'), 'chicken is in Emberhaven');
    return old;
}

EmberwoodTests.add('world: enterZone destroys the old tilemap, colliders, NPCs, mobs, labels, and loot', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(spawn.x, 328, 'spawn x tile center');
        assertEqual(spawn.y, 248, 'spawn y tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(typeof world.createLayer, 'undefined', 'Phaser 4 createLayer is not on the scene');
        assert(world.map && typeof world.map.createLayer === 'function', 'Phaser 3 tilemap createLayer');

        var old = snapshotHavenWorld(win, H, world);
        world.enterZone('northwood', null);
        world = H.world(win);
        assertEqual(world.zoneId, 'northwood', 'enterZone lands in Northwood');
        assertEnterZoneClearedOld(win, H, old, world, 'enterZone()');

        H.enterZone(win, 'haven');
        world = H.world(win);
        H.setAutoAttack(win, false);
        old = snapshotHavenWorld(win, H, world);
        var strip = 14;
        var pathX = win.tileCenter(18, 14).x;
        function tileAt(x, y) {
            var t = win.worldToTile(x, y);
            return world.tileGrid[t.ty][t.tx];
        }
        world.placePlayer(pathX, strip + 1);
        world.player.body.setVelocity(0, 0);
        world.exitLock = false;
        world.encounterLock = false;
        assertEqual(tileAt(pathX, strip + 1), win.TILE.PATH, 'north stand is on PATH');
        H.clearKeys(win);
        H.key(win, 'KeyW', 'w', 'keydown');
        return H.waitUntil(function () {
            return H.world(win).zoneId === 'northwood';
        }, 1500, 'Keys.js W walk into Northwood').then(function () {
            H.key(win, 'KeyW', 'w', 'keyup');
            H.clearKeys(win);
            return H.sleep(50).then(function () {
                world = H.world(win);
                assertEqual(world.zoneId, 'northwood', 'W walk enters Northwood');
                assertEnterZoneClearedOld(win, H, old, world, 'Keys.js walk');

                H.enterZone(win, 'haven');
                world = H.world(win);
                world.placePlayer(spawn.x, spawn.y);
                world.player.body.setVelocity(0, 0);
                assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
                assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
                assert(H.findNpc(win, 'guild'), 'Bram returns in Emberhaven');
                assert(!win.game.input.keyboard, 'Phaser keyboard still off');
            });
        });
    });
});

function parkWorldBodies(world) {
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
}

function spawnTestDrake(world, win, x, y) {
    var sprite = world.physics.add.sprite(x, y, 'mob-drake', 0);
    world.mobs.add(sprite);
    sprite.setScale(win.mobScaleFor('Drake', 'world'));
    win.applyMobWorldBody(sprite, 'Drake');
    sprite.mobDef = { type: 'Drake', id: 'test-giant' };
    sprite.aliveMob = true;
    sprite.respawnAt = 0;
    world.physics.add.collider(sprite, world.ground);
    world.physics.add.collider(world.player, sprite);
    return sprite;
}

function tileCollideIndexes(layer) {
    if (layer.layer && layer.layer.collideIndexes) {
        return layer.layer.collideIndexes;
    }
    return layer.collideIndexes || [];
}

function countTilesOf(grid, index) {
    var n = 0;
    var y;
    var x;
    for (y = 0; y < grid.length; y++) {
        for (x = 0; x < grid[y].length; x++) {
            if (grid[y][x] === index) {
                n++;
            }
        }
    }
    return n;
}

function assertLayerCollides(world, index, should, label) {
    var grid = world.tileGrid;
    var n = 0;
    var y;
    var x;
    for (y = 0; y < grid.length; y++) {
        for (x = 0; x < grid[y].length; x++) {
            if (grid[y][x] !== index) {
                continue;
            }
            n++;
            var tile = world.ground.getTileAt(x, y);
            assert(tile, label + ' tile at ' + x + ',' + y);
            assertEqual(tile.index, index, label + ' index at ' + x + ',' + y);
            assertEqual(!!tile.collides, should, label + ' collides at ' + x + ',' + y + ' is ' + tile.collides);
        }
    }
    return n;
}

function findCardinalPush(grid, targetIndex, walkable) {
    var dirs = [
        { dx: -1, dy: 0, code: 'KeyD', key: 'd' },
        { dx: 1, dy: 0, code: 'KeyA', key: 'a' },
        { dx: 0, dy: -1, code: 'KeyS', key: 's' },
        { dx: 0, dy: 1, code: 'KeyW', key: 'w' }
    ];
    var y;
    var x;
    var d;
    for (y = 0; y < grid.length; y++) {
        for (x = 0; x < grid[y].length; x++) {
            if (grid[y][x] !== targetIndex) {
                continue;
            }
            for (d = 0; d < dirs.length; d++) {
                var sx = x + dirs[d].dx;
                var sy = y + dirs[d].dy;
                if (sy < 0 || sx < 0 || sy >= grid.length || sx >= grid[sy].length) {
                    continue;
                }
                if (!walkable[grid[sy][sx]]) {
                    continue;
                }
                return {
                    target: { tx: x, ty: y },
                    stand: { tx: sx, ty: sy },
                    dir: dirs[d]
                };
            }
        }
    }
    return null;
}

EmberwoodTests.add('world: WATER/TREE/ROCK/SHRINE collide; GRASS/GRASS2/PATH/FLOWER do not', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(spawn.x, 328, 'spawn x tile center');
        assertEqual(spawn.y, 248, 'spawn y tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(typeof world.createLayer, 'undefined', 'Phaser 4 createLayer is not on the scene');
        assert(world.map && typeof world.map.createLayer === 'function', 'Phaser 3 tilemap createLayer');

        assertEqual(win.TILE.GRASS, 1, 'GRASS index');
        assertEqual(win.TILE.GRASS2, 2, 'GRASS2 index');
        assertEqual(win.TILE.PATH, 3, 'PATH index');
        assertEqual(win.TILE.FLOWER, 4, 'FLOWER index');
        assertEqual(win.TILE.WATER, 5, 'WATER index');
        assertEqual(win.TILE.TREE, 6, 'TREE index');
        assertEqual(win.TILE.ROCK, 7, 'ROCK index');
        assertEqual(win.TILE.SHRINE, 8, 'SHRINE index');

        var solids = [win.TILE.WATER, win.TILE.TREE, win.TILE.ROCK, win.TILE.SHRINE];
        var opens = [win.TILE.GRASS, win.TILE.GRASS2, win.TILE.PATH, win.TILE.FLOWER];
        var collideIdx = tileCollideIndexes(world.ground);
        solids.forEach(function (idx) {
            assert(collideIdx.indexOf(idx) !== -1, 'setCollision includes ' + idx);
            assertEqual(win.tileBlockedByTerrain(idx), true, 'Pathfind blocks ' + idx);
        });
        opens.forEach(function (idx) {
            assert(collideIdx.indexOf(idx) === -1, 'setCollision excludes ' + idx);
            assertEqual(win.tileBlockedByTerrain(idx), false, 'Pathfind allows ' + idx);
        });

        assert(assertLayerCollides(world, win.TILE.TREE, true, 'TREE') > 0, 'haven has TREE');
        assert(assertLayerCollides(world, win.TILE.ROCK, true, 'ROCK') > 0, 'haven has ROCK');
        assert(assertLayerCollides(world, win.TILE.SHRINE, true, 'SHRINE') > 0, 'haven has SHRINE');
        assertEqual(countTilesOf(world.tileGrid, win.TILE.WATER), 0, 'haven has no WATER tiles');
        assert(assertLayerCollides(world, win.TILE.GRASS, false, 'GRASS') > 0, 'haven has GRASS');
        assert(assertLayerCollides(world, win.TILE.GRASS2, false, 'GRASS2') > 0, 'haven has GRASS2');
        assert(assertLayerCollides(world, win.TILE.PATH, false, 'PATH') > 0, 'haven has PATH');
        assert(assertLayerCollides(world, win.TILE.FLOWER, false, 'FLOWER') > 0, 'haven has FLOWER');

        parkWorldBodies(world);
        var walkable = {};
        walkable[win.TILE.GRASS] = true;
        walkable[win.TILE.GRASS2] = true;
        walkable[win.TILE.PATH] = true;
        walkable[win.TILE.FLOWER] = true;

        function walkIntoSolid(label, index, zoneId) {
            world = H.world(win);
            if (zoneId && world.zoneId !== zoneId) {
                H.enterZone(win, zoneId);
                world = H.world(win);
                H.setAutoAttack(win, false);
                parkWorldBodies(world);
            }
            var push = findCardinalPush(world.tileGrid, index, walkable);
            assert(push, 'found stand beside ' + label);
            var stand = win.tileCenter(push.stand.tx, push.stand.ty);
            world.placePlayer(stand.x, stand.y);
            world.player.body.setVelocity(0, 0);
            world.clearWalk();
            world.exitLock = true;
            world.encounterLock = false;
            var zone = world.zoneId;
            return H.holdKey(win, push.dir.code, push.dir.key, 400).then(function () {
                H.clearKeys(win);
                world = H.world(win);
                world.player.body.setVelocity(0, 0);
                var at = win.worldToTile(world.player.x, world.player.y);
                assert(!(at.tx === push.target.tx && at.ty === push.target.ty), label + ' did not enter solid tile (' + at.tx + ',' + at.ty + ')');
                assert(Math.abs(world.player.x - stand.x) < 14, label + ' x blocked, dx=' + (world.player.x - stand.x));
                assert(Math.abs(world.player.y - stand.y) < 14, label + ' y blocked, dy=' + (world.player.y - stand.y));
                assertEqual(world.zoneId, zone, label + ' stay in zone');
                assert(!win.game.input.keyboard, 'Phaser keyboard off after ' + label);
            });
        }

        function walkOntoOpen(label, index) {
            world = H.world(win);
            var push = findCardinalPush(world.tileGrid, index, walkable);
            assert(push, 'found stand beside ' + label);
            var stand = win.tileCenter(push.stand.tx, push.stand.ty);
            world.placePlayer(stand.x, stand.y);
            world.player.body.setVelocity(0, 0);
            world.clearWalk();
            world.exitLock = true;
            world.encounterLock = false;
            H.clearKeys(win);
            H.key(win, push.dir.code, push.dir.key, 'keydown');
            return H.waitUntil(function () {
                var at = win.worldToTile(H.world(win).player.x, H.world(win).player.y);
                return at.tx === push.target.tx && at.ty === push.target.ty;
            }, 900, 'Keys.js walk onto ' + label).then(function () {
                H.key(win, push.dir.code, push.dir.key, 'keyup');
                H.clearKeys(win);
                world = H.world(win);
                world.player.body.setVelocity(0, 0);
                var at = win.worldToTile(world.player.x, world.player.y);
                assertEqual(at.tx, push.target.tx, label + ' entered tx');
                assertEqual(at.ty, push.target.ty, label + ' entered ty');
                assert(!win.game.input.keyboard, 'Phaser keyboard off after ' + label);
            });
        }

        return walkIntoSolid('ROCK', win.TILE.ROCK).then(function () {
            return walkIntoSolid('SHRINE', win.TILE.SHRINE);
        }).then(function () {
            return walkIntoSolid('TREE', win.TILE.TREE);
        }).then(function () {
            return walkOntoOpen('PATH', win.TILE.PATH);
        }).then(function () {
            return walkOntoOpen('GRASS', win.TILE.GRASS);
        }).then(function () {
            return walkOntoOpen('GRASS2', win.TILE.GRASS2);
        }).then(function () {
            return walkOntoOpen('FLOWER', win.TILE.FLOWER);
        }).then(function () {
            H.enterZone(win, 'southshore');
            world = H.world(win);
            H.setAutoAttack(win, false);
            parkWorldBodies(world);
            assert(assertLayerCollides(world, win.TILE.WATER, true, 'WATER') > 0, 'Southshore has WATER');
            return walkIntoSolid('WATER', win.TILE.WATER, 'southshore');
        }).then(function () {
            H.enterZone(win, 'haven');
            world = H.world(win);
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
            assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        });
    });
});

EmberwoodTests.add('world: Emberhaven houses have a south-wall PATH door', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(spawn.x, 328, 'spawn x tile center');
        assertEqual(spawn.y, 248, 'spawn y tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(typeof win.house, 'function', 'house() exists');

        var scratch = win.makeGrid(win.TILE.GRASS);
        win.house(scratch, 8, 6, 6, 5);
        assertEqual(scratch[10][11], win.TILE.PATH, 'house() last-row mid is PATH');
        assertEqual(scratch[10][10], win.TILE.ROCK, 'house() last-row west of door is ROCK');
        assertEqual(scratch[10][12], win.TILE.ROCK, 'house() last-row east of door is ROCK');
        assertEqual(scratch[6][11], win.TILE.ROCK, 'house() north wall stays ROCK');
        assertEqual(scratch[8][10], win.TILE.PATH, 'house() interior is PATH');

        var houses = [
            { x: 8, y: 6, w: 6, h: 5, name: 'NW cottage' },
            { x: 22, y: 7, w: 7, h: 5, name: 'NE cottage' },
            { x: 12, y: 16, w: 6, h: 5, name: 'south cottage' }
        ];
        houses.forEach(function (spec) {
            var doorX = spec.x + Math.floor(spec.w / 2);
            var doorY = spec.y + spec.h - 1;
            assertEqual(world.tileGrid[doorY][doorX], win.TILE.PATH, spec.name + ' south-wall door is PATH');
            assertEqual(win.tileBlockedByTerrain(world.tileGrid[doorY][doorX]), false, spec.name + ' door is walkable');
            var doorTile = world.ground.getTileAt(doorX, doorY);
            assert(doorTile, spec.name + ' door tile exists');
            assertEqual(doorTile.index, win.TILE.PATH, spec.name + ' layer door is PATH');
            assertEqual(!!doorTile.collides, false, spec.name + ' door does not collide');
            var leftX = doorX - 1;
            var rightX = doorX + 1;
            if (leftX >= spec.x) {
                assertEqual(world.tileGrid[doorY][leftX], win.TILE.ROCK, spec.name + ' south wall west of door is ROCK');
                assertEqual(!!world.ground.getTileAt(leftX, doorY).collides, true, spec.name + ' west frame collides');
            }
            if (rightX < spec.x + spec.w) {
                assertEqual(world.tileGrid[doorY][rightX], win.TILE.ROCK, spec.name + ' south wall east of door is ROCK');
                assertEqual(!!world.ground.getTileAt(rightX, doorY).collides, true, spec.name + ' east frame collides');
            }
        });

        parkWorldBodies(world);
        var door = { tx: 11, ty: 10 };
        var south = win.tileCenter(door.tx, door.ty + 1);
        var insideY = door.ty * (win.TILE_SIZE || 16);
        world.placePlayer(south.x, south.y);
        world.player.body.setVelocity(0, 0);
        world.clearWalk();
        world.exitLock = true;
        world.encounterLock = false;
        assertEqual(win.tileBlockedByTerrain(world.tileGrid[door.ty + 1][door.tx]), false, 'stand south of door is open');
        H.clearKeys(win);
        H.key(win, 'KeyW', 'w', 'keydown');
        return H.waitUntil(function () {
            return H.world(win).player.y < insideY;
        }, 1200, 'Keys.js W through house south-wall door').then(function () {
            H.key(win, 'KeyW', 'w', 'keyup');
            H.clearKeys(win);
            world = H.world(win);
            world.player.body.setVelocity(0, 0);
            var at = win.worldToTile(world.player.x, world.player.y);
            assert(world.player.y < insideY, 'walked north through the door, y=' + world.player.y);
            assertEqual(at.tx, door.tx, 'door walk stayed on the opening column');
            assert(at.ty <= door.ty, 'entered the house through the last-row PATH');
            assert(!win.game.input.keyboard, 'Phaser keyboard off after door walk');

            var wallSouth = win.tileCenter(door.tx - 1, door.ty + 1);
            world.placePlayer(wallSouth.x, wallSouth.y);
            world.player.body.setVelocity(0, 0);
            world.clearWalk();
            return H.holdKey(win, 'KeyW', 'w', 400);
        }).then(function () {
            H.clearKeys(win);
            world = H.world(win);
            world.player.body.setVelocity(0, 0);
            var wallAt = win.worldToTile(world.player.x, world.player.y);
            assert(wallAt.ty > door.ty, 'ROCK frame still blocks, ty=' + wallAt.ty);
            assert(world.player.y > insideY, 'did not pass through the south-wall rock, y=' + world.player.y);

            H.enterZone(win, 'haven');
            world = H.world(win);
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
            assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        });
    });
});

EmberwoodTests.add('world: locked door blocks until the player has a key', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(spawn.x, 328, 'spawn x tile center');
        assertEqual(spawn.y, 248, 'spawn y tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(win.TILE.DOOR, 16, 'DOOR tile index');
        assertEqual(win.tileBlockedByTerrain(win.TILE.DOOR), true, 'Pathfind blocks locked doors');
        assert(win.ITEM_DB.key, 'Iron key exists');
        assertEqual(win.ITEM_DB.key.name, 'Iron key', 'key name');
        assertEqual(typeof win.heroHasItem, 'function', 'heroHasItem exists');
        assertEqual(typeof world.tryLockedDoor, 'function', 'tryLockedDoor exists');
        assertEqual(typeof world.unlockDoor, 'function', 'unlockDoor exists');

        var door = win.LOCKED_DOOR;
        assert(door, 'LOCKED_DOOR def exists');
        assertEqual(door.zoneId, 'millfields', 'locked door is in Millfields');
        assertEqual(door.tx, 26, 'farm door tx');
        assertEqual(door.ty, 17, 'farm door ty');
        assertEqual(door.keyId, 'key', 'door wants the Iron key');

        H.enterZone(win, 'millfields');
        world = H.world(win);
        H.setAutoAttack(win, false);
        parkWorldBodies(world);
        assertEqual(world.tileGrid[door.ty][door.tx], win.TILE.DOOR, 'farm south-wall door is TILE.DOOR');
        var doorTile = world.ground.getTileAt(door.tx, door.ty);
        assert(doorTile, 'locked door tile exists');
        assertEqual(doorTile.index, win.TILE.DOOR, 'layer door is DOOR');
        assertEqual(!!doorTile.collides, true, 'locked door collides');
        assertEqual(world.tileGrid[door.ty][door.tx - 1], win.TILE.ROCK, 'west frame is ROCK');
        assertEqual(world.tileGrid[door.ty][door.tx + 1], win.TILE.ROCK, 'east frame is ROCK');

        var hero = H.hero(win);
        assertEqual(win.heroHasItem(hero, 'key'), false, 'starter kit has no key');
        var south = win.tileCenter(door.tx, door.ty + 1);
        var insideY = door.ty * (win.TILE_SIZE || 16);
        world.placePlayer(south.x, south.y);
        world.player.body.setVelocity(0, 0);
        world.clearWalk();
        world.exitLock = true;
        world.encounterLock = false;
        H.clearKeys(win);
        var blockedY = world.player.y;
        return H.holdKey(win, 'KeyW', 'w', 500).then(function () {
            H.clearKeys(win);
            world = H.world(win);
            world.player.body.setVelocity(0, 0);
            var at = win.worldToTile(world.player.x, world.player.y);
            assert(world.player.y > insideY, 'locked door blocks without a key, y=' + world.player.y);
            assert(world.player.y > blockedY - 10, 'did not pass through the locked door');
            assert(at.ty > door.ty, 'still south of the locked door, ty=' + at.ty);
            assertEqual(world.tileGrid[door.ty][door.tx], win.TILE.DOOR, 'door stays TILE.DOOR without a key');
            assert(H.chatHas(win, 'The door is locked.'), 'locked chat');
            assert(!win.game.input.keyboard, 'Phaser keyboard off after locked bump');

            hero = H.hero(win);
            win.addItem(hero, 'key', 1);
            win.game.registry.set('hero', hero);
            assert(win.heroHasItem(hero, 'key'), 'test-granted Iron key');
            world.placePlayer(south.x, south.y);
            world.player.body.setVelocity(0, 0);
            world.clearWalk();
            world.exitLock = true;
            world.encounterLock = false;
            H.clearKeys(win);
            H.key(win, 'KeyW', 'w', 'keydown');
            return H.waitUntil(function () {
                return H.world(win).player.y < insideY;
            }, 1500, 'Keys.js W through unlocked door');
        }).then(function () {
            H.key(win, 'KeyW', 'w', 'keyup');
            H.clearKeys(win);
            world = H.world(win);
            world.player.body.setVelocity(0, 0);
            var at = win.worldToTile(world.player.x, world.player.y);
            assert(world.player.y < insideY, 'walked north through the unlocked door, y=' + world.player.y);
            assertEqual(at.tx, door.tx, 'door walk stayed on the opening column');
            assert(at.ty <= door.ty, 'entered the farm house after unlocking');
            assertEqual(world.tileGrid[door.ty][door.tx], win.TILE.PATH, 'unlocked door is PATH');
            assertEqual(!!world.ground.getTileAt(door.tx, door.ty).collides, false, 'unlocked door does not collide');
            assert(H.chatHas(win, 'You unlock the door.'), 'unlock chat');
            assert(win.heroHasItem(H.hero(win), 'key'), 'key is kept after unlock');
            assert(!win.game.input.keyboard, 'Phaser keyboard off after unlock');

            H.enterZone(win, 'haven');
            world = H.world(win);
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
            assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        });
    });
});

EmberwoodTests.add('world: door open/close animation on the Millfields farm door', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(spawn.x, 328, 'spawn x tile center');
        assertEqual(spawn.y, 248, 'spawn y tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(typeof world.playDoorOpen, 'function', 'playDoorOpen exists');
        assertEqual(typeof world.playDoorClose, 'function', 'playDoorClose exists');
        assertEqual(typeof world.updateDoors, 'function', 'updateDoors exists');

        var door = win.LOCKED_DOOR;
        assert(door, 'LOCKED_DOOR def exists');
        assertEqual(door.zoneId, 'millfields', 'locked door is in Millfields');
        assertEqual(door.tx, 26, 'farm door tx');
        assertEqual(door.ty, 17, 'farm door ty');
        assertEqual(door.keyId, 'key', 'door wants the Iron key');

        H.enterZone(win, 'millfields');
        world = H.world(win);
        H.setAutoAttack(win, false);
        parkWorldBodies(world);
        assertEqual(world.tileGrid[door.ty][door.tx], win.TILE.DOOR, 'farm door starts closed');
        var hero = H.hero(win);
        assertEqual(win.heroHasItem(hero, 'key'), false, 'starter kit has no key');
        var south = win.tileCenter(door.tx, door.ty + 1);
        var insideY = door.ty * (win.TILE_SIZE || 16);
        var doorKey = world.doorUnlockKey(door.tx, door.ty);
        world.placePlayer(south.x, south.y);
        world.player.body.setVelocity(0, 0);
        world.clearWalk();
        world.exitLock = true;
        world.encounterLock = false;
        H.clearKeys(win);
        return H.holdKey(win, 'KeyW', 'w', 500).then(function () {
            H.clearKeys(win);
            world = H.world(win);
            world.player.body.setVelocity(0, 0);
            assert(world.player.y > insideY, 'locked door blocks without a key, y=' + world.player.y);
            assertEqual(world.tileGrid[door.ty][door.tx], win.TILE.DOOR, 'door stays TILE.DOOR without a key');
            assert(H.chatHas(win, 'The door is locked.'), 'locked chat');
            assert(!world.doorFx[doorKey], 'no open leaf while locked');
            assert(!win.game.input.keyboard, 'Phaser keyboard off after locked bump');

            hero = H.hero(win);
            win.addItem(hero, 'key', 1);
            win.game.registry.set('hero', hero);
            world.placePlayer(south.x, south.y);
            world.player.body.setVelocity(0, 0);
            world.clearWalk();
            world.exitLock = true;
            world.encounterLock = false;
            H.clearKeys(win);
            H.key(win, 'KeyW', 'w', 'keydown');
            return H.waitUntil(function () {
                return H.world(win).player.y < insideY;
            }, 1500, 'Keys.js W through unlocking door');
        }).then(function () {
            H.key(win, 'KeyW', 'w', 'keyup');
            H.clearKeys(win);
            world = H.world(win);
            world.player.body.setVelocity(0, 0);
            assertEqual(world.tileGrid[door.ty][door.tx], win.TILE.PATH, 'unlocked door is PATH');
            assert(H.chatHas(win, 'You unlock the door.'), 'unlock chat');
            var fx = world.doorFx[doorKey];
            assert(fx && fx.leaf && fx.leaf.active, 'open animation leaf exists');
            assert(fx.leaf.scaleX < 1, 'door leaf tweened open, scaleX=' + fx.leaf.scaleX);
            assert(fx.state === 'opening' || fx.state === 'open', 'door state is opening or open');
            assert(world.unlockedDoors[doorKey], 'door stays unlocked');
            assert(!win.game.input.keyboard, 'Phaser keyboard off after open');
            return H.waitUntil(function () {
                var anim = H.world(win).doorFx[doorKey];
                return anim && anim.state === 'open';
            }, 800, 'open tween finished');
        }).then(function () {
            world = H.world(win);
            var away = win.tileCenter(door.tx, door.ty + 3);
            world.placePlayer(away.x, away.y);
            world.player.body.setVelocity(0, 0);
            world.clearWalk();
            H.clearKeys(win);
            return H.waitUntil(function () {
                var scene = H.world(win);
                return scene.tileGrid[door.ty][door.tx] === win.TILE.DOOR && !scene.doorFx[doorKey];
            }, 1500, 'door closes after walking away');
        }).then(function () {
            world = H.world(win);
            assertEqual(world.tileGrid[door.ty][door.tx], win.TILE.DOOR, 'closed door is TILE.DOOR again');
            assertEqual(!!world.ground.getTileAt(door.tx, door.ty).collides, true, 'closed door collides');
            assert(world.unlockedDoors[doorKey], 'close does not re-lock');
            assert(!world.doorFx[doorKey], 'close tween removes the leaf');
            world.placePlayer(south.x, south.y);
            world.player.body.setVelocity(0, 0);
            world.clearWalk();
            world.exitLock = true;
            world.encounterLock = false;
            H.clearKeys(win);
            H.key(win, 'KeyW', 'w', 'keydown');
            return H.waitUntil(function () {
                return H.world(win).player.y < insideY;
            }, 1500, 'Keys.js W reopens the unlocked door');
        }).then(function () {
            H.key(win, 'KeyW', 'w', 'keyup');
            H.clearKeys(win);
            world = H.world(win);
            world.player.body.setVelocity(0, 0);
            assert(world.player.y < insideY, 'walked north through the reopened door, y=' + world.player.y);
            assertEqual(world.tileGrid[door.ty][door.tx], win.TILE.PATH, 'reopened door is PATH');
            assert(H.chatHas(win, 'You open the door.'), 'reopen chat');
            var fx = world.doorFx[doorKey];
            assert(fx && fx.leaf && fx.leaf.active, 'reopen animation leaf exists');
            assert(fx.leaf.scaleX < 1, 'reopen leaf tweened, scaleX=' + fx.leaf.scaleX);
            assert(win.heroHasItem(H.hero(win), 'key'), 'key is kept');
            assert(!win.game.input.keyboard, 'Phaser keyboard off after reopen');

            H.enterZone(win, 'haven');
            world = H.world(win);
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
            assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        });
    });
});

EmberwoodTests.add('world: agility shortcut squeezes beside the locked farm door', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(spawn.x, 328, 'spawn x tile center');
        assertEqual(spawn.y, 248, 'spawn y tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assertEqual(typeof win.heroSkillLevel, 'function', 'heroSkillLevel exists');
        assertEqual(typeof world.tryAgilityShortcut, 'function', 'tryAgilityShortcut exists');
        assertEqual(typeof world.handleAgilityShortcut, 'function', 'handleAgilityShortcut exists');

        var door = win.LOCKED_DOOR;
        var gap = win.AGILITY_SHORTCUT;
        assert(door, 'LOCKED_DOOR def exists');
        assert(gap, 'AGILITY_SHORTCUT def exists');
        assertEqual(door.zoneId, 'millfields', 'locked door is in Millfields');
        assertEqual(door.tx, 26, 'farm door tx');
        assertEqual(door.ty, 17, 'farm door ty');
        assertEqual(gap.zoneId, 'millfields', 'shortcut is in Millfields');
        assertEqual(gap.tx, 25, 'shortcut is west of the farm door');
        assertEqual(gap.ty, 17, 'shortcut shares the door row');
        assertEqual(gap.level, 5, 'shortcut wants Agility 5');
        assertEqual(gap.skill, 'agility', 'shortcut skill is agility');
        assertEqual(win.agilityShortcutAt(gap.tx, gap.ty, 'millfields'), gap, 'agilityShortcutAt matches');
        assertEqual(win.agilityShortcutAt(gap.tx, gap.ty, 'haven'), null, 'shortcut is zone-gated');

        var fresh = win.makeHero();
        assertEqual(win.heroSkillLevel(fresh, 'agility'), 1, 'starter Agility is 1');
        assertEqual(win.heroHasItem(fresh, 'key'), false, 'starter kit has no key');

        H.enterZone(win, 'millfields');
        world = H.world(win);
        H.setAutoAttack(win, false);
        parkWorldBodies(world);
        assertEqual(world.tileGrid[door.ty][door.tx], win.TILE.DOOR, 'farm door stays TILE.DOOR');
        assertEqual(world.tileGrid[gap.ty][gap.tx], win.TILE.ROCK, 'shortcut tile stays ROCK');
        assertEqual(win.tileBlockedByTerrain(world.tileGrid[gap.ty][gap.tx]), true, 'Pathfind still blocks the squeeze');
        assertEqual(win.sceneryKindAt(world.tileGrid, gap.tx, gap.ty, {
            houseRects: world.houseRectsNow(),
            zoneId: 'millfields'
        }), 'shortcut', 'shortcut examine kind');
        assertEqual(win.examineSceneryText('shortcut'), 'A narrow gap beside the locked door. You might squeeze through.', 'shortcut examine text');

        var hero = H.hero(win);
        hero.skills.agility = hero.skills.agility || { level: 1, xp: 0 };
        hero.skills.agility.level = 1;
        win.game.registry.set('hero', hero);
        assertEqual(win.heroHasItem(hero, 'key'), false, 'no Iron key yet');
        assertEqual(win.heroSkillLevel(hero, 'agility'), 1, 'Agility starts at 1');

        var doorSouth = win.tileCenter(door.tx, door.ty + 1);
        var gapSouth = win.tileCenter(gap.tx, gap.ty + 1);
        var insideY = gap.ty * (win.TILE_SIZE || 16);
        world.placePlayer(doorSouth.x, doorSouth.y);
        world.player.body.setVelocity(0, 0);
        world.clearWalk();
        world.exitLock = true;
        world.encounterLock = false;
        H.clearKeys(win);
        return H.holdKey(win, 'KeyW', 'w', 500).then(function () {
            H.clearKeys(win);
            world = H.world(win);
            world.player.body.setVelocity(0, 0);
            assert(world.player.y > insideY, 'locked door blocks without a key, y=' + world.player.y);
            assertEqual(world.tileGrid[door.ty][door.tx], win.TILE.DOOR, 'door stays TILE.DOOR without a key');
            assert(H.chatHas(win, 'The door is locked.'), 'locked chat');
            assert(!win.game.input.keyboard, 'Phaser keyboard off after locked bump');

            world.placePlayer(gapSouth.x, gapSouth.y);
            world.player.body.setVelocity(0, 0);
            world.clearWalk();
            world.exitLock = true;
            world.encounterLock = false;
            H.clearKeys(win);
            return H.holdKey(win, 'KeyW', 'w', 500);
        }).then(function () {
            H.clearKeys(win);
            world = H.world(win);
            world.player.body.setVelocity(0, 0);
            var at = win.worldToTile(world.player.x, world.player.y);
            assert(world.player.y > insideY, 'low Agility cannot squeeze, y=' + world.player.y);
            assert(at.ty > gap.ty, 'still south of the shortcut, ty=' + at.ty);
            assert(H.chatHas(win, 'You need Agility level 5 to squeeze through.'), 'need-level chat');
            assertEqual(world.tileGrid[door.ty][door.tx], win.TILE.DOOR, 'failed squeeze does not unlock the door');
            assertEqual(win.heroHasItem(H.hero(win), 'key'), false, 'failed squeeze does not grant a key');
            assert(!win.game.input.keyboard, 'Phaser keyboard off after failed squeeze');

            hero = H.hero(win);
            hero.skills.agility = hero.skills.agility || { level: 1, xp: 0 };
            hero.skills.agility.level = 5;
            win.game.registry.set('hero', hero);
            assertEqual(win.heroSkillLevel(hero, 'agility'), 5, 'test-set Agility 5');
            world.placePlayer(gapSouth.x, gapSouth.y);
            world.player.body.setVelocity(0, 0);
            world.clearWalk();
            world.exitLock = true;
            world.encounterLock = false;
            world.shortcutLockUntil = 0;
            H.clearKeys(win);
            H.key(win, 'KeyW', 'w', 'keydown');
            return H.waitUntil(function () {
                return H.world(win).player.y < insideY;
            }, 1500, 'Keys.js W through agility squeeze');
        }).then(function () {
            H.key(win, 'KeyW', 'w', 'keyup');
            H.clearKeys(win);
            world = H.world(win);
            world.player.body.setVelocity(0, 0);
            var at = win.worldToTile(world.player.x, world.player.y);
            assert(world.player.y < insideY, 'squeezed north through the gap, y=' + world.player.y);
            assertEqual(at.tx, gap.tx, 'squeeze stayed on the shortcut column');
            assert(at.ty < gap.ty, 'landed inside the farm house');
            assert(H.chatHas(win, 'You squeeze through the gap.'), 'squeeze chat');
            assertEqual(world.tileGrid[door.ty][door.tx], win.TILE.DOOR, 'door stays locked after the squeeze');
            assertEqual(!!world.ground.getTileAt(door.tx, door.ty).collides, true, 'locked door still collides');
            assertEqual(win.heroHasItem(H.hero(win), 'key'), false, 'squeeze does not consume or grant a key');
            assert(!win.game.input.keyboard, 'Phaser keyboard off after squeeze');

            H.enterZone(win, 'haven');
            world = H.world(win);
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
            assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        });
    });
});

EmberwoodTests.add('world: Emberhaven bank shop and guild doors enter one indoor tilemap', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.interiorId = null;
        world.exitLock = false;
        world.encounterLock = false;
        assertEqual(spawn.x, 328, 'spawn x tile center');
        assertEqual(spawn.y, 248, 'spawn y tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        assert(win.INTERIOR_LIST && win.INTERIOR_LIST.length === 4, 'four interior defs');
        assertEqual(typeof win.generateInterior, 'function', 'generateInterior exists');
        assertEqual(typeof world.enterInterior, 'function', 'enterInterior exists');
        assertEqual(typeof world.leaveInterior, 'function', 'leaveInterior exists');
        assertEqual(typeof world.map.createLayer, 'function', 'Phaser 3 createLayer');

        var wanted = [
            { id: 'bank', name: 'Emberhaven Bank', doorTx: 11, doorTy: 10 },
            { id: 'shop', name: 'Emberhaven Shop', doorTx: 25, doorTy: 11 },
            { id: 'guild', name: 'Emberhaven Guild Hall', doorTx: 15, doorTy: 20 }
        ];
        wanted.forEach(function (want) {
            var spec = win.interiorById(want.id);
            assert(spec, want.id + ' def exists');
            assertEqual(spec.name, want.name, want.id + ' name');
            assertEqual(spec.doorTx, want.doorTx, want.id + ' door tx');
            assertEqual(spec.doorTy, want.doorTy, want.id + ' door ty');
            assertEqual(world.tileGrid[want.doorTy][want.doorTx], win.TILE.PATH, want.id + ' overworld door is PATH');
            var doorTile = world.ground.getTileAt(want.doorTx, want.doorTy);
            assert(doorTile, want.id + ' door tile exists');
            assertEqual(!!doorTile.collides, false, want.id + ' door does not collide');
            assert(win.interiorAtDoor(want.doorTx, want.doorTy), want.id + ' interiorAtDoor hits');
        });

        parkWorldBodies(world);
        var bank = win.interiorById('bank');
        var south = win.tileCenter(bank.doorTx, bank.doorTy + 1);
        world.placePlayer(south.x, south.y);
        world.player.body.setVelocity(0, 0);
        world.clearWalk();
        world.exitLock = false;
        world.encounterLock = false;
        H.clearKeys(win);
        H.key(win, 'KeyW', 'w', 'keydown');
        return H.waitUntil(function () {
            return H.world(win).interiorId === 'bank';
        }, 1500, 'Keys.js W into bank door').then(function () {
            H.key(win, 'KeyW', 'w', 'keyup');
            H.clearKeys(win);
            world = H.world(win);
            world.player.body.setVelocity(0, 0);
            assertEqual(world.interiorId, 'bank', 'entered bank interior');
            assertEqual(world.zoneId, 'haven', 'parent zone stays Emberhaven');
            assertEqual(win.document.getElementById('hud-zone').textContent, 'Emberhaven Bank', 'HUD title is the bank');
            var here = win.document.querySelector('#minimap .mm-cell.is-here');
            assert(here, 'minimap still has is-here');
            assertEqual(here.dataset.zone, 'haven', 'minimap stays Emberhaven');
            assert(H.chatHas(win, 'You enter Emberhaven Bank.'), 'enter-bank chat');
            assert(world.map && world.ground, 'indoor Phaser 3 tilemap exists');
            assertEqual(typeof world.map.createLayer, 'function', 'indoor map still Phaser 3 createLayer');
            assertEqual(world.map.width, 36, 'indoor map width 36');
            assertEqual(world.map.height, 28, 'indoor map height 28');
            var exit = win.INTERIOR_EXIT_TILE;
            assertEqual(world.tileGrid[exit.y][exit.x], win.TILE.PATH, 'indoor south door is PATH');
            assertEqual(world.tileGrid[exit.y][exit.x - 1], win.TILE.ROCK, 'indoor door west frame is ROCK');
            var at = win.worldToTile(world.player.x, world.player.y);
            assert(at.ty < exit.y, 'spawned inside north of the indoor door');
            assertEqual(world.npcs.getChildren().length, 0, 'indoor scene has no overworld NPCs');
            assertEqual(world.mobs.getChildren().length, 0, 'indoor scene has no overworld mobs');
            assert(!win.game.input.keyboard, 'Phaser keyboard off indoors');

            world.exitLock = false;
            world.placePlayer(win.tileCenter(exit.x, exit.y).x, win.tileCenter(exit.x, exit.y).y);
            world.player.body.setVelocity(0, 0);
            world.checkInteriorExit();
            world = H.world(win);
            assertEqual(world.interiorId, null, 'left the indoor tilemap');
            assertEqual(world.zoneId, 'haven', 'returned to Emberhaven');
            assertEqual(win.document.getElementById('hud-zone').textContent, 'Emberhaven', 'HUD title is Emberhaven');
            assert(H.chatHas(win, 'You enter Emberhaven.'), 'leave chat returns to Emberhaven');
            var out = win.worldToTile(world.player.x, world.player.y);
            assertEqual(out.tx, bank.doorTx, 'exit lands on the bank door column');
            assertEqual(out.ty, bank.doorTy + 1, 'exit lands south of the bank door');
            assert(H.findNpc(win, 'guild'), 'Bram is back in the overworld');

            world.exitLock = false;
            world.enterInterior('shop');
            assertEqual(world.interiorId, 'shop', 'shop door uses the same indoor scene');
            assertEqual(win.document.getElementById('hud-zone').textContent, 'Emberhaven Shop', 'HUD title is the shop');
            assert(H.chatHas(win, 'You enter Emberhaven Shop.'), 'enter-shop chat');
            world.exitLock = false;
            world.leaveInterior();
            assertEqual(world.interiorId, null, 'left the shop');
            var shopOut = win.worldToTile(world.player.x, world.player.y);
            assertEqual(shopOut.tx, 25, 'shop exit south of shop door x');
            assertEqual(shopOut.ty, 12, 'shop exit south of shop door y');

            world.exitLock = false;
            world.enterInterior('guild');
            assertEqual(world.interiorId, 'guild', 'guild door uses the same indoor scene');
            assertEqual(win.document.getElementById('hud-zone').textContent, 'Emberhaven Guild Hall', 'HUD title is the guild hall');
            assert(H.chatHas(win, 'You enter Emberhaven Guild Hall.'), 'enter-guild chat');
            world.exitLock = false;
            world.leaveInterior();
            assertEqual(world.interiorId, null, 'left the guild hall');

            H.enterZone(win, 'haven');
            world = H.world(win);
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            assertEqual(world.interiorId, null, 'enterZone clears interior');
            assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
            assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        });
    });
});

EmberwoodTests.add('world: Darkmine lower shaft is a second indoor mine room', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'darkmine');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.interiorId = null;
        world.exitLock = false;
        world.encounterLock = false;
        assertEqual(spawn.x, 328, 'spawn x tile center');
        assertEqual(spawn.y, 248, 'spawn y tile center');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        var shaft = win.interiorById('shaft');
        assert(shaft, 'shaft def exists');
        assertEqual(shaft.name, 'Darkmine Lower Shaft', 'shaft name');
        assertEqual(shaft.zoneId, 'darkmine', 'shaft belongs to Darkmine');
        assertEqual(shaft.doorTx, 9, 'shaft door tx');
        assertEqual(shaft.doorTy, 12, 'shaft door ty');
        assertEqual(win.MINE_SHAFT_HOUSE.x, 6, 'shaft house x');
        assertEqual(win.housesForBiome('mine').length, 1, 'mine biome has the shaft house');
        assertEqual(world.tileGrid[shaft.doorTy][shaft.doorTx], win.TILE.PATH, 'shaft overworld door is PATH');
        assertEqual(world.tileGrid[shaft.doorTy][shaft.doorTx - 1], win.TILE.ROCK, 'shaft door west frame is ROCK');
        assertEqual(world.tileGrid[shaft.doorTy][shaft.doorTx + 1], win.TILE.ROCK, 'shaft door east frame is ROCK');
        var doorTile = world.ground.getTileAt(shaft.doorTx, shaft.doorTy);
        assert(doorTile, 'shaft door tile exists');
        assertEqual(!!doorTile.collides, false, 'shaft door does not collide');
        assert(win.interiorAtDoor(shaft.doorTx, shaft.doorTy, 'darkmine'), 'interiorAtDoor hits in Darkmine');
        assert(!win.interiorAtDoor(shaft.doorTx, shaft.doorTy, 'haven'), 'haven does not use the shaft door');

        var corb = H.findNpc(win, 'miner');
        assert(corb, 'Miner Corb stays in Darkmine');
        assertEqual(corb.npcDef.name, 'Miner Corb', 'Corb display name');
        assertEqual(Math.round(corb.x), 210, 'Corb x');
        assertEqual(Math.round(corb.y), 200, 'Corb y');
        assert(corb.npcDef.lines.indexOf('Bats took the lower shaft.') !== -1, 'Corb mentions the lower shaft');

        parkWorldBodies(world);
        var south = win.tileCenter(shaft.doorTx, shaft.doorTy + 1);
        world.placePlayer(south.x, south.y);
        world.player.body.setVelocity(0, 0);
        world.clearWalk();
        world.exitLock = false;
        world.encounterLock = false;
        H.clearKeys(win);
        H.key(win, 'KeyW', 'w', 'keydown');
        return H.waitUntil(function () {
            return H.world(win).interiorId === 'shaft';
        }, 1500, 'Keys.js W into Darkmine shaft door').then(function () {
            H.key(win, 'KeyW', 'w', 'keyup');
            H.clearKeys(win);
            world = H.world(win);
            world.player.body.setVelocity(0, 0);
            assertEqual(world.interiorId, 'shaft', 'entered lower shaft');
            assertEqual(world.zoneId, 'darkmine', 'parent zone stays Darkmine');
            assertEqual(win.document.getElementById('hud-zone').textContent, 'Darkmine Lower Shaft', 'HUD title is the shaft');
            var here = win.document.querySelector('#minimap .mm-cell.is-here');
            assert(here, 'minimap still has is-here');
            assertEqual(here.dataset.zone, 'darkmine', 'minimap stays Darkmine');
            assert(H.chatHas(win, 'You enter Darkmine Lower Shaft.'), 'enter-shaft chat');
            assert(world.map && world.ground, 'indoor Phaser 3 tilemap exists');
            assertEqual(typeof world.map.createLayer, 'function', 'indoor map still Phaser 3 createLayer');
            assertEqual(world.map.width, 36, 'indoor map width 36');
            assertEqual(world.map.height, 28, 'indoor map height 28');
            var exit = win.INTERIOR_EXIT_TILE;
            assertEqual(world.tileGrid[exit.y][exit.x], win.TILE.PATH, 'indoor south door is PATH');
            assertEqual(world.tileGrid[exit.y][exit.x - 1], win.TILE.ROCK, 'indoor door west frame is ROCK');
            var at = win.worldToTile(world.player.x, world.player.y);
            assert(at.ty < exit.y, 'spawned inside north of the indoor door');
            assertEqual(world.npcs.getChildren().length, 0, 'shaft has no overworld NPCs');
            assert(!H.findNpc(win, 'miner'), 'Miner Corb is not inside the shaft');
            assertEqual(world.mobs.getChildren().length, 0, 'shaft has no overworld mobs');
            assertEqual(world.tileGrid[13][15], win.TILE.ROCK, 'shaft has mine rock pillars');
            assert(!win.game.input.keyboard, 'Phaser keyboard off in the shaft');

            world.exitLock = false;
            world.placePlayer(win.tileCenter(exit.x, exit.y).x, win.tileCenter(exit.x, exit.y).y);
            world.player.body.setVelocity(0, 0);
            world.checkInteriorExit();
            world = H.world(win);
            assertEqual(world.interiorId, null, 'left the lower shaft');
            assertEqual(world.zoneId, 'darkmine', 'returned to Darkmine');
            assertEqual(win.document.getElementById('hud-zone').textContent, 'Darkmine', 'HUD title is Darkmine');
            assert(H.chatHas(win, 'You enter Darkmine.'), 'leave chat returns to Darkmine');
            var out = win.worldToTile(world.player.x, world.player.y);
            assertEqual(out.tx, shaft.doorTx, 'exit lands on the shaft door column');
            assertEqual(out.ty, shaft.doorTy + 1, 'exit lands south of the shaft door');
            corb = H.findNpc(win, 'miner');
            assert(corb, 'Miner Corb is back in Darkmine');
            assertEqual(Math.round(corb.x), 210, 'Corb still at x 210');
            assertEqual(Math.round(corb.y), 200, 'Corb still at y 200');

            H.enterZone(win, 'haven');
            world = H.world(win);
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            assertEqual(world.interiorId, null, 'enterZone clears interior');
            assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
            assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        });
    });
});

EmberwoodTests.add('world: examine on scenery tree, rock, shrine, water, house wall', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        world.engageTarget = null;
        world.talkTarget = null;
        if (world.clearWalk) {
            world.clearWalk();
        }
        if (win.Hud.hideContextMenu) {
            win.Hud.hideContextMenu();
        }
        assertEqual(spawn.x, 328, 'spawn x tile center');
        assertEqual(spawn.y, 248, 'spawn y tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assertEqual(win.Hud.mode, 'world', 'world mode');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(!world.cursors, 'WorldScene has no Phaser cursors');
        assertEqual(typeof world.examineAt, 'function', 'examineAt exists');
        assertEqual(typeof win.sceneryKindAt, 'function', 'sceneryKindAt exists');
        assertEqual(win.examineSceneryText('tree'), "It's a tree.", 'tree examine text');
        assertEqual(win.examineSceneryText('rock'), "It's a rock.", 'rock examine text');
        assertEqual(win.examineSceneryText('shrine'), 'A weathered stone shrine.', 'shrine examine text');
        assertEqual(win.examineSceneryText('water'), "It's water.", 'water examine text');
        assertEqual(win.examineSceneryText('wall'), "It's a house wall.", 'house wall examine text');

        var townRects = win.housesForBiome('town');
        var opts = { houseRects: townRects };
        assertEqual(world.tileGrid[2][0], win.TILE.TREE, 'haven west border is TREE');
        assertEqual(win.sceneryKindAt(world.tileGrid, 0, 2, opts), 'tree', 'kind tree');
        assertEqual(world.tileGrid[8][18], win.TILE.SHRINE, 'haven shrine tile');
        assertEqual(win.sceneryKindAt(world.tileGrid, 18, 8, opts), 'shrine', 'kind shrine');
        assertEqual(world.tileGrid[10][10], win.TILE.ROCK, 'cottage south wall is ROCK');
        assertEqual(win.sceneryKindAt(world.tileGrid, 10, 10, opts), 'wall', 'kind house wall');
        assertEqual(world.tileGrid[13][23], win.TILE.ROCK, 'courtyard gate rock');
        assertEqual(win.sceneryKindAt(world.tileGrid, 23, 13, opts), 'rock', 'kind loose rock');

        function clickTile(tx, ty) {
            var pt = win.tileCenter(tx, ty);
            world.onClick({ worldX: pt.x, worldY: pt.y });
            return pt;
        }
        function rightTile(tx, ty) {
            var pt = win.tileCenter(tx, ty);
            world.onClick({
                worldX: pt.x,
                worldY: pt.y,
                button: 2,
                rightButtonDown: function () { return true; },
                event: { clientX: 48, clientY: 56 }
            });
            return pt;
        }

        clickTile(0, 2);
        assertEqual(H.lastChat(win), "It's a tree.", 'left-click tree logs examine');
        assert(!world.walkTarget, 'tree examine does not walk');

        clickTile(18, 8);
        assertEqual(H.lastChat(win), 'A weathered stone shrine.', 'left-click shrine logs examine');
        assert(!world.walkTarget, 'shrine examine does not walk');

        clickTile(10, 10);
        assertEqual(H.lastChat(win), "It's a house wall.", 'left-click house wall logs examine');
        assert(!world.walkTarget, 'house wall examine does not walk');

        clickTile(23, 13);
        assertEqual(H.lastChat(win), "It's a rock.", 'left-click gate rock logs examine');
        assert(!world.walkTarget, 'rock examine does not walk');

        var menu = win.document.getElementById('ctx-menu');
        assert(menu, 'ctx-menu element exists');
        if (world.clearWalk) {
            world.clearWalk();
        }
        win.Hud.hideContextMenu();
        rightTile(0, 2);
        assert(!world.walkTarget, 'right-click tree does not walk immediately');
        assert(!menu.hidden, 'right-click tree opens context menu');
        var examBtn = menu.querySelector('[data-ctx="examine"]');
        var walkBtn = menu.querySelector('[data-ctx="walk-here"]');
        assert(examBtn, 'Examine action is listed');
        assertEqual(examBtn.textContent, 'Examine', 'Examine label');
        assert(walkBtn, 'Walk here remains listed on scenery');
        H.mouseClick(win, examBtn);
        assert(menu.hidden, 'Examine closes the menu');
        assertEqual(H.lastChat(win), "It's a tree.", 'Examine menu logs tree line');
        assert(!world.walkTarget, 'Examine menu does not walk');

        if (world.clearWalk) {
            world.clearWalk();
        }
        var destX = spawn.x - 64;
        var destY = spawn.y;
        world.onClick({ worldX: destX, worldY: destY });
        assert(world.walkTarget, 'left-click ground still walks');
        assertEqual(Math.round(world.walkTarget.x), destX, 'ground walk x');
        assertEqual(Math.round(world.walkTarget.y), destY, 'ground walk y');
        if (world.clearWalk) {
            world.clearWalk();
        }

        H.enterZone(win, 'southshore');
        world = H.world(win);
        H.setAutoAttack(win, false);
        world.encounterLock = false;
        var water = null;
        var y;
        var x;
        for (y = 0; y < world.tileGrid.length && !water; y++) {
            for (x = 0; x < world.tileGrid[y].length; x++) {
                if (world.tileGrid[y][x] === win.TILE.WATER) {
                    water = { tx: x, ty: y };
                    break;
                }
            }
        }
        assert(water, 'Southshore has WATER');
        assertEqual(win.sceneryKindAt(world.tileGrid, water.tx, water.ty, { houseRects: [] }), 'water', 'kind water');
        var waterPt = win.tileCenter(water.tx, water.ty);
        world.onClick({ worldX: waterPt.x, worldY: waterPt.y });
        assertEqual(H.lastChat(win), "It's water.", 'left-click water logs examine');
        assert(!world.walkTarget, 'water examine does not walk');

        H.enterZone(win, 'haven');
        world = H.world(win);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = true;
        var lastBefore = H.lastChat(win);
        clickTile(0, 2);
        assertEqual(H.lastChat(win), lastBefore, 'encounterLock ignores scenery examine');
        world.encounterLock = false;
        win.Hud.mode = 'battle';
        clickTile(0, 2);
        assertEqual(H.lastChat(win), lastBefore, 'battle mode ignores scenery examine');
        win.Hud.mode = 'world';
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        H.clearKeys(win);
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        assertEqual(Math.round(world.player.x), 328, 'restored spawn x');
        assertEqual(Math.round(world.player.y), 248, 'restored spawn y');
    });
});

EmberwoodTests.add('world: examine courtyard gate and house doors without changing walk-through', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        parkWorldBodies(world);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        world.engageTarget = null;
        world.talkTarget = null;
        if (world.clearWalk) {
            world.clearWalk();
        }
        if (win.Hud.hideContextMenu) {
            win.Hud.hideContextMenu();
        }
        assertEqual(spawn.x, 328, 'spawn x tile center');
        assertEqual(spawn.y, 248, 'spawn y tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assertEqual(win.Hud.mode, 'world', 'world mode');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(!world.cursors, 'WorldScene has no Phaser cursors');
        assertEqual(typeof world.examineAt, 'function', 'examineAt exists');
        assertEqual(typeof win.sceneryKindAt, 'function', 'sceneryKindAt exists');
        assertEqual(typeof win.isWalkableExamineKind, 'function', 'isWalkableExamineKind exists');
        assertEqual(win.examineSceneryText('gate'), 'A wooden courtyard gate. The hinges still work.', 'gate examine text');
        assertEqual(win.examineSceneryText('door-bank'), 'The bank door. Elise keeps the ledgers inside.', 'bank door examine text');
        assertEqual(win.examineSceneryText('door-shop'), 'The shop door. A faded sign hangs above it.', 'shop door examine text');
        assertEqual(win.examineSceneryText('door-guild'), 'The guild hall door. Bram drills the militia inside.', 'guild door examine text');
        assert(win.isWalkableExamineKind('gate'), 'gate is a walkable examine');
        assert(win.isWalkableExamineKind('door-bank'), 'bank door is a walkable examine');
        assert(!win.isWalkableExamineKind('wall'), 'house wall stays examine-only');

        var gate = win.HAVEN_GATE_TILE;
        var interiors = win.INTERIOR_LIST.filter(function (spec) {
            return spec.id === 'bank' || spec.id === 'shop' || spec.id === 'guild';
        });
        assertEqual(interiors.length, 3, 'bank/shop/guild interiors exist');
        assertEqual(world.tileGrid[gate.y][gate.x], win.TILE.PATH, 'courtyard gate stays PATH');
        assertEqual(win.TILE.DOOR, 16, 'TILE.DOOR is unchanged');
        var opts = { houseRects: win.housesForBiome('town'), zoneId: 'haven' };
        assertEqual(win.sceneryKindAt(world.tileGrid, gate.x, gate.y, opts), 'gate', 'kind gate');
        interiors.forEach(function (spec) {
            assertEqual(world.tileGrid[spec.doorTy][spec.doorTx], win.TILE.PATH, spec.id + ' door stays PATH');
            assertEqual(win.sceneryKindAt(world.tileGrid, spec.doorTx, spec.doorTy, opts), 'door-' + spec.id, spec.id + ' door kind');
        });

        function clickTile(tx, ty) {
            var pt = win.tileCenter(tx, ty);
            world.onClick({ worldX: pt.x, worldY: pt.y });
            return pt;
        }
        function rightTile(tx, ty) {
            var pt = win.tileCenter(tx, ty);
            world.onClick({
                worldX: pt.x,
                worldY: pt.y,
                button: 2,
                rightButtonDown: function () { return true; },
                event: { clientX: 48, clientY: 56 }
            });
            return pt;
        }

        var lastBefore = H.lastChat(win);
        var gatePt = clickTile(gate.x, gate.y);
        assert(world.walkTarget, 'left-click gate still walks through');
        assertEqual(Math.round(world.walkTarget.x), Math.round(gatePt.x), 'gate walk x');
        assertEqual(Math.round(world.walkTarget.y), Math.round(gatePt.y), 'gate walk y');
        assertEqual(H.lastChat(win), lastBefore, 'left-click gate does not examine');
        if (world.clearWalk) {
            world.clearWalk();
        }
        world.examineAt(gatePt.x, gatePt.y);
        assertEqual(H.lastChat(win), 'A wooden courtyard gate. The hinges still work.', 'examineAt gate logs flavor');
        assert(!world.walkTarget, 'examineAt gate does not walk');

        interiors.forEach(function (spec) {
            if (world.clearWalk) {
                world.clearWalk();
            }
            lastBefore = H.lastChat(win);
            var doorPt = clickTile(spec.doorTx, spec.doorTy);
            assert(world.walkTarget, 'left-click ' + spec.id + ' door still walks through');
            assertEqual(Math.round(world.walkTarget.x), Math.round(doorPt.x), spec.id + ' walk x');
            assertEqual(Math.round(world.walkTarget.y), Math.round(doorPt.y), spec.id + ' walk y');
            assertEqual(H.lastChat(win), lastBefore, 'left-click ' + spec.id + ' door does not examine');
            if (world.clearWalk) {
                world.clearWalk();
            }
            world.examineAt(doorPt.x, doorPt.y);
            assertEqual(H.lastChat(win), win.examineSceneryText('door-' + spec.id), 'examineAt ' + spec.id + ' logs flavor');
            assert(!world.walkTarget, 'examineAt ' + spec.id + ' does not walk');
        });

        var menu = win.document.getElementById('ctx-menu');
        assert(menu, 'ctx-menu element exists');
        if (world.clearWalk) {
            world.clearWalk();
        }
        win.Hud.hideContextMenu();
        rightTile(gate.x, gate.y);
        assert(!world.walkTarget, 'right-click gate does not walk immediately');
        assert(!menu.hidden, 'right-click gate opens context menu');
        var examBtn = menu.querySelector('[data-ctx="examine"]');
        var walkBtn = menu.querySelector('[data-ctx="walk-here"]');
        assert(examBtn, 'Examine action is listed on the gate');
        assertEqual(examBtn.textContent, 'Examine', 'Examine label');
        assert(walkBtn, 'Walk here remains listed on the gate');
        H.mouseClick(win, examBtn);
        assert(menu.hidden, 'Examine closes the menu');
        assertEqual(H.lastChat(win), 'A wooden courtyard gate. The hinges still work.', 'Examine menu logs gate line');
        assert(!world.walkTarget, 'Examine menu does not walk');

        if (world.clearWalk) {
            world.clearWalk();
        }
        win.Hud.hideContextMenu();
        rightTile(11, 10);
        examBtn = menu.querySelector('[data-ctx="examine"]');
        assert(examBtn, 'Examine action is listed on the bank door');
        H.mouseClick(win, examBtn);
        assertEqual(H.lastChat(win), 'The bank door. Elise keeps the ledgers inside.', 'Examine menu logs bank door');

        H.enterZone(win, 'millfields');
        world = H.world(win);
        parkWorldBodies(world);
        H.setAutoAttack(win, false);
        world.encounterLock = false;
        var locked = win.LOCKED_DOOR;
        assertEqual(world.tileGrid[locked.ty][locked.tx], win.TILE.DOOR, 'farm door stays TILE.DOOR');
        assertEqual(win.sceneryKindAt(world.tileGrid, locked.tx, locked.ty, {
            houseRects: win.housesForBiome('farm'),
            zoneId: 'millfields'
        }), null, 'locked farm door is not examine scenery');

        H.enterZone(win, 'haven');
        world = H.world(win);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = true;
        lastBefore = H.lastChat(win);
        clickTile(gate.x, gate.y);
        assertEqual(H.lastChat(win), lastBefore, 'encounterLock ignores gate click');
        assert(!world.walkTarget, 'encounterLock does not walk through the gate');
        world.encounterLock = false;
        win.Hud.mode = 'battle';
        clickTile(11, 10);
        assertEqual(H.lastChat(win), lastBefore, 'battle mode ignores house-door click');
        assert(!world.walkTarget, 'battle mode does not walk through the bank door');
        win.Hud.mode = 'world';
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        H.clearKeys(win);
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        assertEqual(Math.round(world.player.x), 328, 'restored spawn x');
        assertEqual(Math.round(world.player.y), 248, 'restored spawn y');
    });
});

EmberwoodTests.add('world: Emberhaven stall, range, anvil, and bank booth are examine-only scenery', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        world.engageTarget = null;
        world.talkTarget = null;
        if (world.clearWalk) {
            world.clearWalk();
        }
        if (win.Hud.hideContextMenu) {
            win.Hud.hideContextMenu();
        }
        assertEqual(spawn.x, 328, 'spawn x tile center');
        assertEqual(spawn.y, 248, 'spawn y tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assertEqual(win.Hud.mode, 'world', 'world mode');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(!world.cursors, 'WorldScene has no Phaser cursors');
        assertEqual(win.TILE.STALL, 9, 'STALL index');
        assertEqual(win.TILE.RANGE, 10, 'RANGE index');
        assertEqual(win.TILE.ANVIL, 11, 'ANVIL index');
        assertEqual(win.TILE.BOOTH, 12, 'BOOTH index');
        assertEqual(win.examineSceneryText('stall'), 'A market stall. The grocer is away.', 'stall examine text');
        assertEqual(win.examineSceneryText('range'), 'A cooking range. The fire is out.', 'range examine text');
        assertEqual(win.examineSceneryText('anvil'), 'A well-used smithing anvil.', 'anvil examine text');
        assertEqual(win.examineSceneryText('booth'), 'A bank booth. The clerk is away.', 'booth examine text');
        assertEqual(win.tileBlockedByTerrain(win.TILE.STALL), true, 'Pathfind blocks stall');
        assertEqual(win.tileBlockedByTerrain(win.TILE.RANGE), true, 'Pathfind blocks range');
        assertEqual(win.tileBlockedByTerrain(win.TILE.ANVIL), true, 'Pathfind blocks anvil');
        assertEqual(win.tileBlockedByTerrain(win.TILE.BOOTH), true, 'Pathfind blocks booth');

        var props = win.TOWN_PROPS;
        assert(props && props.stall && props.range && props.anvil && props.booth, 'TOWN_PROPS exists');
        var specs = [
            { key: 'stall', tile: win.TILE.STALL, kind: 'stall', line: 'A market stall. The grocer is away.' },
            { key: 'range', tile: win.TILE.RANGE, kind: 'range', line: 'A cooking range. The fire is out.' },
            { key: 'anvil', tile: win.TILE.ANVIL, kind: 'anvil', line: 'A well-used smithing anvil.' },
            { key: 'booth', tile: win.TILE.BOOTH, kind: 'booth', line: 'A bank booth. The clerk is away.' }
        ];
        var opts = { houseRects: win.housesForBiome('town') };
        specs.forEach(function (spec) {
            var at = props[spec.key];
            assertEqual(world.tileGrid[at.y][at.x], spec.tile, spec.key + ' tile at ' + at.x + ',' + at.y);
            assertEqual(win.sceneryKindAt(world.tileGrid, at.x, at.y, opts), spec.kind, spec.key + ' kind');
            var layerTile = world.ground.getTileAt(at.x, at.y);
            assert(layerTile && layerTile.collides, spec.key + ' collides');
        });
        assertEqual(world.tileGrid[15][20], win.TILE.PATH, 'spawn tile stays PATH');

        function clickTile(tx, ty) {
            var pt = win.tileCenter(tx, ty);
            world.onClick({ worldX: pt.x, worldY: pt.y });
            return pt;
        }
        function rightTile(tx, ty) {
            var pt = win.tileCenter(tx, ty);
            world.onClick({
                worldX: pt.x,
                worldY: pt.y,
                button: 2,
                rightButtonDown: function () { return true; },
                event: { clientX: 48, clientY: 56 }
            });
            return pt;
        }

        specs.forEach(function (spec) {
            var at = props[spec.key];
            if (world.clearWalk) {
                world.clearWalk();
            }
            clickTile(at.x, at.y);
            assertEqual(H.lastChat(win), spec.line, 'left-click ' + spec.key + ' logs examine');
            assert(!world.walkTarget, spec.key + ' examine does not walk');
        });

        var menu = win.document.getElementById('ctx-menu');
        assert(menu, 'ctx-menu element exists');
        if (world.clearWalk) {
            world.clearWalk();
        }
        win.Hud.hideContextMenu();
        rightTile(props.stall.x, props.stall.y);
        assert(!world.walkTarget, 'right-click stall does not walk immediately');
        assert(!menu.hidden, 'right-click stall opens context menu');
        var examBtn = menu.querySelector('[data-ctx="examine"]');
        var walkBtn = menu.querySelector('[data-ctx="walk-here"]');
        assert(examBtn, 'Examine action is listed');
        assertEqual(examBtn.textContent, 'Examine', 'Examine label');
        assert(walkBtn, 'Walk here remains listed on stall');
        H.mouseClick(win, examBtn);
        assert(menu.hidden, 'Examine closes the menu');
        assertEqual(H.lastChat(win), 'A market stall. The grocer is away.', 'Examine menu logs stall line');
        assert(!world.walkTarget, 'Examine menu does not walk');

        world.enterInterior('bank');
        world = H.world(win);
        world.encounterLock = false;
        var boothTx = win.INTERIOR_ROOM.x + 3;
        var boothTy = win.INTERIOR_ROOM.y + 4;
        assertEqual(world.interiorId, 'bank', 'entered Emberhaven Bank');
        assertEqual(world.tileGrid[boothTy][boothTx], win.TILE.BOOTH, 'bank interior has a booth');
        assertEqual(win.sceneryKindAt(world.tileGrid, boothTx, boothTy, { interior: true }), 'booth', 'interior booth kind');
        var boothPt = win.tileCenter(boothTx, boothTy);
        world.onClick({ worldX: boothPt.x, worldY: boothPt.y });
        assertEqual(H.lastChat(win), 'A bank booth. The clerk is away.', 'left-click interior booth logs examine');
        assert(!world.walkTarget, 'interior booth examine does not walk');
        assert(
            !win.document.getElementById('shop-overlay') || win.document.getElementById('shop-overlay').hidden,
            'shop overlay stays hidden'
        );
        assert(
            !win.document.getElementById('bank-overlay') || win.document.getElementById('bank-overlay').hidden,
            'bank overlay stays hidden'
        );

        world.leaveInterior();
        world = H.world(win);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = true;
        var lastBefore = H.lastChat(win);
        clickTile(props.stall.x, props.stall.y);
        assertEqual(H.lastChat(win), lastBefore, 'encounterLock ignores town-prop examine');
        world.encounterLock = false;
        win.Hud.mode = 'battle';
        clickTile(props.stall.x, props.stall.y);
        assertEqual(H.lastChat(win), lastBefore, 'battle mode ignores town-prop examine');
        win.Hud.mode = 'world';
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        H.clearKeys(win);
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        assertEqual(Math.round(world.player.x), 328, 'restored spawn x');
        assertEqual(Math.round(world.player.y), 248, 'restored spawn y');
    });
});

EmberwoodTests.add('world: Southshore dock/boat and Restless Graves tombs are examine-only scenery', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = false;
        world.engageTarget = null;
        world.talkTarget = null;
        if (world.clearWalk) {
            world.clearWalk();
        }
        if (win.Hud.hideContextMenu) {
            win.Hud.hideContextMenu();
        }
        assertEqual(spawn.x, 328, 'spawn x tile center');
        assertEqual(spawn.y, 248, 'spawn y tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assertEqual(win.Hud.mode, 'world', 'world mode');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');
        assert(!world.cursors, 'WorldScene has no Phaser cursors');
        assertEqual(win.TILE.DOCK, 13, 'DOCK index');
        assertEqual(win.TILE.BOAT, 14, 'BOAT index');
        assertEqual(win.TILE.TOMB, 15, 'TOMB index');
        assertEqual(win.examineSceneryText('dock'), 'A weathered wooden dock. The tide slaps the pilings.', 'dock examine text');
        assertEqual(win.examineSceneryText('boat'), 'A fishing boat, tied off and empty.', 'boat examine text');
        assertEqual(win.examineSceneryText('tomb'), 'A weathered tomb marker. The name is worn away.', 'tomb examine text');
        assertEqual(win.tileBlockedByTerrain(win.TILE.DOCK), true, 'Pathfind blocks dock');
        assertEqual(win.tileBlockedByTerrain(win.TILE.BOAT), true, 'Pathfind blocks boat');
        assertEqual(win.tileBlockedByTerrain(win.TILE.TOMB), true, 'Pathfind blocks tomb');

        function clickTile(tx, ty) {
            var pt = win.tileCenter(tx, ty);
            world.onClick({ worldX: pt.x, worldY: pt.y });
            return pt;
        }
        function rightTile(tx, ty) {
            var pt = win.tileCenter(tx, ty);
            world.onClick({
                worldX: pt.x,
                worldY: pt.y,
                button: 2,
                rightButtonDown: function () { return true; },
                event: { clientX: 48, clientY: 56 }
            });
            return pt;
        }

        H.enterZone(win, 'southshore');
        world = H.world(win);
        H.setAutoAttack(win, false);
        world.encounterLock = false;
        world.engageTarget = null;
        world.talkTarget = null;
        if (world.clearWalk) {
            world.clearWalk();
        }
        parkWorldBodies(world);
        var shore = win.SHORE_PROPS;
        assert(shore && shore.dock && shore.boat && shore.planks, 'SHORE_PROPS exists');
        shore.planks.forEach(function (at) {
            assertEqual(world.tileGrid[at.y][at.x], win.TILE.DOCK, 'dock plank at ' + at.x + ',' + at.y);
            assertEqual(win.sceneryKindAt(world.tileGrid, at.x, at.y, {}), 'dock', 'dock kind at ' + at.x + ',' + at.y);
            var layerTile = world.ground.getTileAt(at.x, at.y);
            assert(layerTile && layerTile.collides, 'dock collides at ' + at.x + ',' + at.y);
        });
        assertEqual(world.tileGrid[shore.boat.y][shore.boat.x], win.TILE.BOAT, 'boat tile');
        assertEqual(win.sceneryKindAt(world.tileGrid, shore.boat.x, shore.boat.y, {}), 'boat', 'boat kind');
        assert(world.ground.getTileAt(shore.boat.x, shore.boat.y).collides, 'boat collides');
        assertEqual(world.tileGrid[13][18], win.TILE.PATH, 'southshore path stays open');

        clickTile(shore.dock.x, shore.dock.y);
        assertEqual(H.lastChat(win), 'A weathered wooden dock. The tide slaps the pilings.', 'left-click dock logs examine');
        assert(!world.walkTarget, 'dock examine does not walk');
        clickTile(shore.boat.x, shore.boat.y);
        assertEqual(H.lastChat(win), 'A fishing boat, tied off and empty.', 'left-click boat logs examine');
        assert(!world.walkTarget, 'boat examine does not walk');
        assert(
            !win.document.getElementById('shop-overlay') || win.document.getElementById('shop-overlay').hidden,
            'shop overlay stays hidden'
        );

        var menu = win.document.getElementById('ctx-menu');
        assert(menu, 'ctx-menu element exists');
        if (world.clearWalk) {
            world.clearWalk();
        }
        win.Hud.hideContextMenu();
        rightTile(shore.dock.x, shore.dock.y);
        assert(!world.walkTarget, 'right-click dock does not walk immediately');
        assert(!menu.hidden, 'right-click dock opens context menu');
        var examBtn = menu.querySelector('[data-ctx="examine"]');
        var walkBtn = menu.querySelector('[data-ctx="walk-here"]');
        assert(examBtn, 'Examine action is listed');
        assertEqual(examBtn.textContent, 'Examine', 'Examine label');
        assert(walkBtn, 'Walk here remains listed on dock');
        H.mouseClick(win, examBtn);
        assert(menu.hidden, 'Examine closes the menu');
        assertEqual(H.lastChat(win), 'A weathered wooden dock. The tide slaps the pilings.', 'Examine menu logs dock line');
        assert(!world.walkTarget, 'Examine menu does not walk');

        H.enterZone(win, 'graves');
        world = H.world(win);
        H.setAutoAttack(win, false);
        world.encounterLock = false;
        world.engageTarget = null;
        world.talkTarget = null;
        if (world.clearWalk) {
            world.clearWalk();
        }
        parkWorldBodies(world);
        var graves = win.GRAVE_PROPS;
        assert(graves && graves.tombs && graves.tombs.length >= 3, 'GRAVE_PROPS tombs exist');
        graves.tombs.forEach(function (at) {
            assertEqual(world.tileGrid[at.y][at.x], win.TILE.TOMB, 'tomb at ' + at.x + ',' + at.y);
            assertEqual(win.sceneryKindAt(world.tileGrid, at.x, at.y, {}), 'tomb', 'tomb kind at ' + at.x + ',' + at.y);
            var tombTile = world.ground.getTileAt(at.x, at.y);
            assert(tombTile && tombTile.collides, 'tomb collides at ' + at.x + ',' + at.y);
            if (world.clearWalk) {
                world.clearWalk();
            }
            clickTile(at.x, at.y);
            assertEqual(H.lastChat(win), 'A weathered tomb marker. The name is worn away.', 'left-click tomb logs examine');
            assert(!world.walkTarget, 'tomb examine does not walk');
        });
        assertEqual(world.tileGrid[14][18], win.TILE.PATH, 'graves path stays open');

        H.enterZone(win, 'haven');
        world = H.world(win);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        H.enterZone(win, 'southshore');
        world = H.world(win);
        parkWorldBodies(world);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.encounterLock = true;
        var lastBefore = H.lastChat(win);
        clickTile(shore.dock.x, shore.dock.y);
        assertEqual(H.lastChat(win), lastBefore, 'encounterLock ignores dock examine');
        world.encounterLock = false;
        win.Hud.mode = 'battle';
        clickTile(shore.boat.x, shore.boat.y);
        assertEqual(H.lastChat(win), lastBefore, 'battle mode ignores boat examine');
        win.Hud.mode = 'world';

        H.enterZone(win, 'haven');
        world = H.world(win);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        H.clearKeys(win);
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        assertEqual(Math.round(world.player.x), 328, 'restored spawn x');
        assertEqual(Math.round(world.player.y), 248, 'restored spawn y');
    });
});

function countTilesInRows(grid, index, y0, y1) {
    var n = 0;
    var y;
    var x;
    for (y = y0; y <= y1; y++) {
        if (!grid[y]) {
            continue;
        }
        for (x = 0; x < grid[y].length; x++) {
            if (grid[y][x] === index) {
                n++;
            }
        }
    }
    return n;
}

function assertLiveGridMatchesGenerate(win, world, zoneId) {
    var zone = win.ZONES[zoneId];
    var want = win.generateMap(zone.seed, zone.biome, win.zoneNeighbors(zone));
    var y;
    var x;
    assertEqual(world.tileGrid.length, want.length, zoneId + ' map height');
    for (y = 0; y < want.length; y++) {
        assertEqual(world.tileGrid[y].length, want[y].length, zoneId + ' row ' + y + ' width');
        for (x = 0; x < want[y].length; x++) {
            if (world.tileGrid[y][x] !== want[y][x]) {
                assertEqual(world.tileGrid[y][x], want[y][x], zoneId + ' tile ' + x + ',' + y);
            }
        }
    }
}

EmberwoodTests.add('world: biome scatter still looks like forest trees, mine rocks, swamp water, shore band, grave rocks, farm flowers', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        H.setAutoAttack(win, false);
        H.enterZone(win, 'haven');
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        assertEqual(spawn.x, 328, 'spawn x tile center');
        assertEqual(spawn.y, 248, 'spawn y tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        assertEqual(win.ZONES.northwood.biome, 'forest', 'Northwood is forest');
        assertEqual(win.ZONES.darkmine.biome, 'mine', 'Darkmine is mine');
        assertEqual(win.ZONES.mire.biome, 'swamp', 'Mirefen is swamp');
        assertEqual(win.ZONES.southshore.biome, 'shore', 'Southshore is shore');
        assertEqual(win.ZONES.graves.biome, 'grave', 'Restless Graves is grave');
        assertEqual(win.ZONES.millfields.biome, 'farm', 'Millfields is farm');

        H.enterZone(win, 'northwood');
        world = H.world(win);
        assertLiveGridMatchesGenerate(win, world, 'northwood');
        var forestTrees = countTilesOf(world.tileGrid, win.TILE.TREE);
        var forestFlowers = countTilesOf(world.tileGrid, win.TILE.FLOWER);
        var forestRocks = countTilesOf(world.tileGrid, win.TILE.ROCK);
        assert(forestTrees > 150, 'forest has many trees, n=' + forestTrees);
        assert(forestFlowers >= 10, 'forest has flower scatter, n=' + forestFlowers);
        assertEqual(forestRocks, 0, 'forest does not scatter rocks');

        H.enterZone(win, 'westmead');
        world = H.world(win);
        var plainsTrees = countTilesOf(world.tileGrid, win.TILE.TREE);
        assert(forestTrees > plainsTrees, 'forest trees outnumber plains trees (' + forestTrees + '>' + plainsTrees + ')');

        H.enterZone(win, 'darkmine');
        world = H.world(win);
        assertLiveGridMatchesGenerate(win, world, 'darkmine');
        var mineRocks = countTilesOf(world.tileGrid, win.TILE.ROCK);
        assert(mineRocks > 40, 'mine has many rocks, n=' + mineRocks);
        assert(mineRocks > forestRocks, 'mine rocks outnumber forest rocks');

        H.enterZone(win, 'mire');
        world = H.world(win);
        assertLiveGridMatchesGenerate(win, world, 'mire');
        var swampWater = countTilesOf(world.tileGrid, win.TILE.WATER);
        var swampNorthWater = countTilesInRows(world.tileGrid, win.TILE.WATER, 2, 18);
        assert(swampWater > 150, 'swamp has water, n=' + swampWater);
        assert(swampNorthWater > 80, 'swamp water is inland, not only a shore band, n=' + swampNorthWater);

        H.enterZone(win, 'southshore');
        world = H.world(win);
        assertLiveGridMatchesGenerate(win, world, 'southshore');
        var shoreBand = countTilesInRows(world.tileGrid, win.TILE.WATER, 22, 26);
        var shoreNorth = countTilesInRows(world.tileGrid, win.TILE.WATER, 2, 18);
        assert(shoreBand > 100, 'shore south band is water, n=' + shoreBand);
        assert(shoreNorth < 20, 'shore water is a south band, north water=' + shoreNorth);
        assert(shoreBand > shoreNorth, 'shore water sits on the south band');

        H.enterZone(win, 'graves');
        world = H.world(win);
        assertLiveGridMatchesGenerate(win, world, 'graves');
        var graveRocks = countTilesOf(world.tileGrid, win.TILE.ROCK);
        assert(graveRocks > 12, 'graves have rock scatter, n=' + graveRocks);
        assert(graveRocks > forestRocks, 'grave rocks outnumber forest rocks');

        H.enterZone(win, 'millfields');
        world = H.world(win);
        assertLiveGridMatchesGenerate(win, world, 'millfields');
        var farmFlowers = countTilesOf(world.tileGrid, win.TILE.FLOWER);
        assert(farmFlowers > 25, 'farm has flower scatter, n=' + farmFlowers);
        assert(farmFlowers > forestFlowers, 'farm flowers outnumber forest flowers (' + farmFlowers + '>' + forestFlowers + ')');

        H.enterZone(win, 'haven');
        world = H.world(win);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
        assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
        assertEqual(world.zoneId, 'haven', 'return Emberhaven');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off');
    });
});

EmberwoodTests.add('world: HUD zone title and minimap is-here update on every transition', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(spawn.x, 328, 'spawn x tile center');
        assertEqual(spawn.y, 248, 'spawn y tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        function assertHudHere(zoneId, name, label) {
            assertEqual(win.document.getElementById('hud-zone').textContent, name, label + ' HUD title');
            var heres = win.document.querySelectorAll('#minimap .mm-cell.is-here');
            assertEqual(heres.length, 1, label + ' one is-here');
            assertEqual(heres[0].dataset.zone, zoneId, label + ' is-here');
            var cells = win.document.querySelectorAll('#minimap .mm-cell');
            assertEqual(cells.length, 9, label + ' nine minimap cells');
        }

        assertHudHere('haven', 'Emberhaven', 'spawn');

        var tile = typeof win.TILE_SIZE === 'number' ? win.TILE_SIZE : 16;
        var wantW = (typeof win.MAP_W === 'number' ? win.MAP_W : 36) * tile;
        var wantH = (typeof win.MAP_H === 'number' ? win.MAP_H : 28) * tile;
        var strip = 14;
        var pathX = win.tileCenter(18, 14).x;
        var pathY = win.tileCenter(18, 14).y;

        var exits = [
            { dir: 'e', key: 'KeyD', char: 'd', x: wantW - strip - 1, y: pathY, zone: 'millfields', name: 'Millfields' },
            { dir: 'w', key: 'KeyA', char: 'a', x: strip + 1, y: pathY, zone: 'westmead', name: 'Westmead' },
            { dir: 'n', key: 'KeyW', char: 'w', x: pathX, y: strip + 1, zone: 'northwood', name: 'Northwood' },
            { dir: 's', key: 'KeyS', char: 's', x: pathX, y: wantH - strip - 1, zone: 'southshore', name: 'Southshore' }
        ];

        function tileAt(x, y) {
            var t = win.worldToTile(x, y);
            return world.tileGrid[t.ty][t.tx];
        }

        function walkExit(i) {
            if (i >= exits.length) {
                return Promise.resolve();
            }
            var step = exits[i];
            H.enterZone(win, 'haven');
            world = H.world(win);
            H.setAutoAttack(win, false);
            assertHudHere('haven', 'Emberhaven', step.dir + ' reset');
            world.placePlayer(step.x, step.y);
            world.player.body.setVelocity(0, 0);
            world.exitLock = false;
            assertEqual(tileAt(step.x, step.y), win.TILE.PATH, step.dir + ' stand is on PATH');
            world.checkExits();
            assertEqual(world.zoneId, 'haven', step.dir + ' 1px inside the strip does not exit');
            assertHudHere('haven', 'Emberhaven', step.dir + ' inside strip');

            H.clearKeys(win);
            H.key(win, step.key, step.char, 'keydown');
            return H.waitUntil(function () {
                return H.world(win).zoneId === step.zone;
            }, 1500, step.dir + ' Keys.js walk into ' + step.name).then(function () {
                H.key(win, step.key, step.char, 'keyup');
                H.clearKeys(win);
                world = H.world(win);
                assertEqual(world.zoneId, step.zone, step.dir + ' walk enters ' + step.name);
                assertHudHere(step.zone, step.name, step.dir + ' walk');
                return walkExit(i + 1);
            });
        }

        var rest = [
            { id: 'graves', name: 'Restless Graves' },
            { id: 'highlands', name: 'Windrock Highlands' },
            { id: 'darkmine', name: 'Darkmine' },
            { id: 'mire', name: 'Mirefen' }
        ];

        return walkExit(0).then(function () {
            rest.forEach(function (zone) {
                H.enterZone(win, zone.id);
                world = H.world(win);
                assertEqual(world.zoneId, zone.id, 'enterZone ' + zone.id);
                assertHudHere(zone.id, zone.name, 'enterZone ' + zone.id);
            });
            H.enterZone(win, 'haven');
            world = H.world(win);
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
            assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
            assertHudHere('haven', 'Emberhaven', 'return');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        });
    });
});

EmberwoodTests.add('world: walking the 12 adjacencies does not soft-lock or spawn in water', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(spawn.x, 328, 'spawn x tile center');
        assertEqual(spawn.y, 248, 'spawn y tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        var tile = typeof win.TILE_SIZE === 'number' ? win.TILE_SIZE : 16;
        var wantW = (typeof win.MAP_W === 'number' ? win.MAP_W : 36) * tile;
        var wantH = (typeof win.MAP_H === 'number' ? win.MAP_H : 28) * tile;
        var strip = 14;
        var pathX = win.tileCenter(18, 14).x;
        var pathY = win.tileCenter(18, 14).y;
        var keyFor = {
            n: { key: 'KeyW', char: 'w' },
            s: { key: 'KeyS', char: 's' },
            e: { key: 'KeyD', char: 'd' },
            w: { key: 'KeyA', char: 'a' }
        };
        var standFor = {
            n: { x: pathX, y: strip + 1 },
            s: { x: pathX, y: wantH - strip - 1 },
            e: { x: wantW - strip - 1, y: pathY },
            w: { x: strip + 1, y: pathY }
        };

        var expected = [
            'darkmine|southshore',
            'darkmine|westmead',
            'graves|northwood',
            'graves|westmead',
            'haven|millfields',
            'haven|northwood',
            'haven|southshore',
            'haven|westmead',
            'highlands|millfields',
            'highlands|northwood',
            'millfields|mire',
            'mire|southshore'
        ];
        var seen = {};
        var hops = [];
        win.ZONE_LIST.forEach(function (zone) {
            ['n', 's', 'e', 'w'].forEach(function (dir) {
                var nid = win.neighborId(zone, dir);
                if (!nid) {
                    return;
                }
                hops.push({
                    from: zone.id,
                    fromName: zone.name,
                    dir: dir,
                    to: nid,
                    toName: win.ZONES[nid].name
                });
                var pair = [zone.id, nid].sort().join('|');
                seen[pair] = true;
            });
        });
        assertEqual(Object.keys(seen).length, 12, '12 unique adjacencies');
        expected.forEach(function (pair) {
            assert(seen[pair], 'adjacency ' + pair + ' exists');
        });
        Object.keys(seen).forEach(function (pair) {
            assert(expected.indexOf(pair) !== -1, 'unexpected adjacency ' + pair);
        });
        assertEqual(hops.length, 24, '24 directed walks (12 edges both ways)');

        function tileName(idx) {
            var names = {
                1: 'GRASS',
                2: 'GRASS2',
                3: 'PATH',
                4: 'FLOWER',
                5: 'WATER',
                6: 'TREE',
                7: 'ROCK',
                8: 'SHRINE'
            };
            return names[idx] || String(idx);
        }

        function tileAt(x, y) {
            world = H.world(win);
            var t = win.worldToTile(x, y);
            assert(world.tileGrid, 'tileGrid exists');
            assert(world.tileGrid[t.ty], 'tile row ' + t.ty + ' exists at (' + x + ',' + y + ')');
            return world.tileGrid[t.ty][t.tx];
        }

        function assertOnMap(label, x, y) {
            assert(x >= 0 && x <= wantW, label + ' x on map (' + x + ')');
            assert(y >= 0 && y <= wantH, label + ' y on map (' + y + ')');
        }

        function assertNotWater(label, x, y) {
            world = H.world(win);
            assertOnMap(label, x, y);
            var at = win.worldToTile(x, y);
            assert(world.tileGrid && world.tileGrid[at.ty], label + ' has tile row ' + at.ty);
            var idx = world.tileGrid[at.ty][at.tx];
            assert(idx !== win.TILE.WATER, label + ' tile (' + at.tx + ',' + at.ty + ') is ' + tileName(idx) + ', not WATER');
            assert(!win.tileBlockedByTerrain(idx), label + ' tile is walkable (' + tileName(idx) + ')');
            var body = world.player.body;
            [
                { x: body.x + 1, y: body.y + 1 },
                { x: body.x + body.width - 1, y: body.y + 1 },
                { x: body.x + 1, y: body.y + body.height - 1 },
                { x: body.x + body.width - 1, y: body.y + body.height - 1 }
            ].forEach(function (pt, i) {
                assertOnMap(label + ' body corner ' + i, pt.x, pt.y);
                var t = win.worldToTile(pt.x, pt.y);
                assert(world.tileGrid[t.ty], label + ' body corner ' + i + ' row ' + t.ty);
                var ci = world.tileGrid[t.ty][t.tx];
                assert(ci !== win.TILE.WATER, label + ' body corner ' + i + ' is ' + tileName(ci) + ', not WATER');
                assert(!win.tileBlockedByTerrain(ci), label + ' body corner ' + i + ' is walkable');
            });
        }

        function walkHop(i) {
            if (i >= hops.length) {
                H.enterZone(win, 'haven');
                world = H.world(win);
                world.placePlayer(spawn.x, spawn.y);
                world.player.body.setVelocity(0, 0);
                assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
                assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
                assert(!win.game.input.keyboard, 'Phaser keyboard still off');
                return Promise.resolve();
            }
            var hop = hops[i];
            var stand = standFor[hop.dir];
            var walk = keyFor[hop.dir];
            var landPos = null;
            H.enterZone(win, hop.from);
            world = H.world(win);
            H.setAutoAttack(win, false);
            world.placePlayer(stand.x, stand.y);
            world.player.body.setVelocity(0, 0);
            world.exitLock = false;
            world.encounterLock = false;
            assertEqual(tileAt(stand.x, stand.y), win.TILE.PATH, hop.from + ' ' + hop.dir + ' stand is on PATH');
            world.checkExits();
            assertEqual(world.zoneId, hop.from, hop.from + ' ' + hop.dir + ' 1px inside the strip does not exit');

            H.clearKeys(win);
            H.key(win, walk.key, walk.char, 'keydown');
            return H.waitUntil(function () {
                return H.world(win).zoneId === hop.to;
            }, 1500, hop.from + ' ' + hop.dir + ' Keys.js walk into ' + hop.toName).then(function () {
                H.key(win, walk.key, walk.char, 'keyup');
                H.clearKeys(win);
                world = H.world(win);
                world.player.body.setVelocity(0, 0);
                world.exitLock = true;
                world.encounterLock = false;
                return H.sleep(50);
            }).then(function () {
                world = H.world(win);
                landPos = { x: world.player.x, y: world.player.y };
                assertEqual(world.zoneId, hop.to, hop.from + ' ' + hop.dir + ' walk enters ' + hop.toName);
                assertEqual(H.lastChat(win), 'You enter ' + hop.toName + '.', hop.from + '→' + hop.to + ' chat');
                assertNotWater(hop.from + '→' + hop.to, landPos.x, landPos.y);
                var want = win.spawnPointForEntry(hop.dir);
                assert(Math.abs(landPos.x - want.x) < 64, hop.from + '→' + hop.to + ' land x near opposite spawn (' + landPos.x + ')');
                assert(Math.abs(landPos.y - want.y) < 64, hop.from + '→' + hop.to + ' land y near opposite spawn (' + landPos.y + ')');
                assert(!win.game.input.keyboard, 'Phaser keyboard off after ' + hop.from + '→' + hop.to);

                world.exitLock = true;
                world.encounterLock = false;
                return H.holdKey(win, walk.key, walk.char, 300);
            }).then(function () {
                H.clearKeys(win);
                world = H.world(win);
                var moved = Math.abs(world.player.x - landPos.x) > 8 || Math.abs(world.player.y - landPos.y) > 8;
                assert(moved, hop.from + '→' + hop.to + ' Keys.js still walks after land (x=' + world.player.x + ', y=' + world.player.y + ')');
                assertEqual(world.zoneId, hop.to, hop.from + '→' + hop.to + ' inward walk does not bounce');
                assertNotWater(hop.from + '→' + hop.to + ' after walk', world.player.x, world.player.y);
                assert(!win.game.input.keyboard, 'Phaser keyboard off after inward walk');
                return walkHop(i + 1);
            });
        }

        return walkHop(0);
    });
});

EmberwoodTests.add('world: map is 36x28 tiles at 16px via Phaser 3 make.tilemap + createLayer', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        assertEqual(spawn.x, 328, 'spawn x tile center');
        assertEqual(spawn.y, 248, 'spawn y tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        assertEqual(win.MAP_W, 36, 'MAP_W is 36');
        assertEqual(win.MAP_H, 28, 'MAP_H is 28');
        assertEqual(win.TILE_SIZE, 16, 'TILE_SIZE is 16');
        assertEqual(typeof world.make.tilemap, 'function', 'Phaser 3 make.tilemap factory');
        assertEqual(typeof world.createLayer, 'undefined', 'Phaser 4 createLayer is not on the scene');
        assertEqual(typeof win.Phaser.Tilemaps.TilemapLayer, 'function', 'Phaser 3 TilemapLayer class');
        assert(win.Phaser.Tilemaps.Formats && win.Phaser.Tilemaps.Formats.ARRAY_2D != null, 'Phaser 3 ARRAY_2D format');

        function assertMap(label) {
            var map = world.map;
            var ground = world.ground;
            var neighbors = win.zoneNeighbors(win.ZONES[world.zoneId]);
            var grid = win.generateMap(win.ZONES[world.zoneId].seed, win.ZONES[world.zoneId].biome, neighbors);
            var flat = win.flattenMap(grid);
            assertEqual(grid.length, 28, label + ' generateMap rows');
            assertEqual(grid[0].length, 36, label + ' generateMap cols');
            assertEqual(flat.length, 28, label + ' flattenMap rows');
            assertEqual(flat[0].length, 36, label + ' flattenMap cols');
            assertEqual(world.tileGrid.length, 28, label + ' live tileGrid rows');
            assertEqual(world.tileGrid[0].length, 36, label + ' live tileGrid cols');
            assert(map, label + ' has a tilemap');
            assertEqual(typeof map.createLayer, 'function', label + ' Phaser 3 tilemap.createLayer');
            assertEqual(map.format, win.Phaser.Tilemaps.Formats.ARRAY_2D, label + ' made from 2D array data');
            assertEqual(map.tileWidth, 16, label + ' tileWidth 16');
            assertEqual(map.tileHeight, 16, label + ' tileHeight 16');
            assertEqual(map.width, 36, label + ' width tiles');
            assertEqual(map.height, 28, label + ' height tiles');
            assertEqual(map.widthInPixels, 576, label + ' widthInPixels 36*16');
            assertEqual(map.heightInPixels, 448, label + ' heightInPixels 28*16');
            assert(ground, label + ' has a ground layer');
            assert(ground instanceof win.Phaser.Tilemaps.TilemapLayer, label + ' ground is Phaser 3 TilemapLayer');
            assertEqual(ground.tilemap, map, label + ' layer belongs to this tilemap');
            assert(ground.layer, label + ' has Phaser 3 LayerData');
            assertEqual(ground.layer.width, 36, label + ' LayerData width 36 tiles');
            assertEqual(ground.layer.height, 28, label + ' LayerData height 28 tiles');
            assertEqual(ground.layer.tileWidth, 16, label + ' LayerData tileWidth 16');
            assertEqual(ground.layer.tileHeight, 16, label + ' LayerData tileHeight 16');
            assertEqual(typeof world.createLayer, 'undefined', label + ' scene has no Phaser 4 createLayer');
        }

        assertMap('Emberhaven');

        win.ZONE_LIST.forEach(function (zone) {
            if (zone.id === 'haven') {
                return;
            }
            H.enterZone(win, zone.id);
            world = H.world(win);
            assertEqual(world.zoneId, zone.id, 'entered ' + zone.name);
            assertMap(zone.name);
            assert(!win.game.input.keyboard, 'Phaser keyboard off in ' + zone.name);
        });

        H.enterZone(win, 'haven');
        world = H.world(win);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.exitLock = true;
        assertEqual(Math.round(world.player.x), 328, 'returned to spawn x');
        assertEqual(Math.round(world.player.y), 248, 'returned to spawn y');
        assertMap('return Emberhaven');
        H.clearKeys(win);
        H.key(win, 'KeyW', 'w', 'keydown');
        return H.sleep(400).then(function () {
            assert(world.player.y < 248 - 12, 'W from spawn walks north via Keys.js, y=' + world.player.y);
            H.key(win, 'KeyW', 'w', 'keyup');
            H.clearKeys(win);
            world.player.body.setVelocity(0, 0);
            world.placePlayer(spawn.x, spawn.y);
            assertEqual(Math.round(world.player.x), 328, 'restored spawn x');
            assertEqual(Math.round(world.player.y), 248, 'restored spawn y');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        });
    });
});

EmberwoodTests.add('world: gathering uses Phaser 3 arcade overlap or distance only', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        H.setAutoPickup(win, true);
        H.clearKeys(win);
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        world.clearLoot();
        world.exitLock = true;
        world.encounterLock = false;
        assertEqual(spawn.x, 328, 'spawn x tile center');
        assertEqual(spawn.y, 248, 'spawn y tile center');
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.') === 0, 'Phaser 3');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        var physicsDefault = win.game.config && win.game.config.physics && win.game.config.physics.default;
        assertEqual(physicsDefault, 'arcade', 'Phaser 3 arcade is the physics default');
        assert(world.physics && world.physics.world, 'scene has Phaser 3 arcade world');
        assertEqual(typeof world.physics.add.overlap, 'function', 'arcade overlap helper exists');
        assertEqual(typeof win.Phaser.Math.Distance.Between, 'function', 'Phaser 3 Distance.Between');
        assert(win.Phaser.Physics && win.Phaser.Physics.Arcade, 'Phaser 3 Arcade namespace');
        assertEqual(typeof world.createLayer, 'undefined', 'Phaser 4 createLayer is not on the scene');
        assertEqual(typeof world.collectNearbyLoot, 'function', 'collectNearbyLoot exists');
        assertEqual(typeof world.pickLoot, 'function', 'pickLoot exists');
        assertEqual(typeof world.tryPickup, 'function', 'tryPickup exists');

        function assertGatherApi(fn, label) {
            var src = Function.prototype.toString.call(fn);
            var usesDistance = src.indexOf('Distance.Between') !== -1;
            var usesOverlap = src.indexOf('physics') !== -1 && src.indexOf('overlap') !== -1;
            assert(usesDistance || usesOverlap, label + ' uses Phaser 3 Distance.Between or arcade overlap');
            assert(src.indexOf('overlapRect') === -1, label + ' does not use overlapRect');
            assert(src.indexOf('overlapCirc') === -1, label + ' does not use overlapCirc');
            assert(src.indexOf('Matter') === -1, label + ' does not use Matter');
            assert(src.indexOf('SpatialHash') === -1, label + ' does not use SpatialHash');
        }
        assertGatherApi(world.collectNearbyLoot, 'collectNearbyLoot');
        assertGatherApi(world.pickLoot, 'pickLoot');

        var gold = H.hero(win).gold;
        world.spawnLoot(200, 200, [{ id: 'coins', qty: 1 }]);
        var live = (world.groundLoot || []).filter(function (entry) { return entry && !entry.taken && entry.sprite; });
        assertEqual(live.length, 1, 'one gather pile');
        var drop = live[0];
        assert(!drop.sprite.body, 'loot is a Phaser image, not an arcade body');
        var sx = drop.sprite.x;
        var sy = drop.sprite.y;
        assertEqual(sx, 200, 'single drop x');
        assertEqual(sy, 204, 'single drop y+4');

        world.placePlayer(sx, sy + 18);
        var at18 = win.Phaser.Math.Distance.Between(world.player.x, world.player.y, sx, sy);
        assertEqual(at18, 18, 'player is exactly 18px from pile');
        world.collectNearbyLoot();
        assertEqual(H.hero(win).gold, gold, 'exactly 18px does not gather');
        assert(!drop.taken, 'pile stays at 18px');

        world.placePlayer(sx, sy + 17);
        var at17 = win.Phaser.Math.Distance.Between(world.player.x, world.player.y, sx, sy);
        assertEqual(at17, 17, 'player is 17px from pile');
        world.collectNearbyLoot();
        assertEqual(H.hero(win).gold, gold + 1, 'within 18px gathers via Distance.Between');
        assert(drop.taken, 'pile taken inside range');
        assert(H.chatHas(win, 'You pick up'), 'gather chat');

        world.clearLoot();
        var gold2 = H.hero(win).gold;
        world.spawnLoot(200, 200, [{ id: 'coins', qty: 2 }]);
        live = (world.groundLoot || []).filter(function (entry) { return entry && !entry.taken && entry.sprite; });
        drop = live[0];
        sx = drop.sprite.x;
        sy = drop.sprite.y;
        world.placePlayer(spawn.x, spawn.y);
        assert(!world.pickLoot(sx, sy + 18, 18), 'click at 18px misses');
        var hit = world.pickLoot(sx, sy + 17, 18);
        assert(hit, 'click within 18px hits via Distance.Between');
        world.tryPickup(hit);
        assertEqual(H.hero(win).gold, gold2 + 2, 'click gather');

        world.clearLoot();
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        H.clearKeys(win);
        H.key(win, 'KeyW', 'w', 'keydown');
        return H.sleep(400).then(function () {
            assert(world.player.y < 248 - 12, 'W from spawn walks north via Keys.js, y=' + world.player.y);
            H.key(win, 'KeyW', 'w', 'keyup');
            H.clearKeys(win);
            world.player.body.setVelocity(0, 0);
            world.placePlayer(spawn.x, spawn.y);
            assertEqual(Math.round(world.player.x), 328, 'restored spawn x');
            assertEqual(Math.round(world.player.y), 248, 'restored spawn y');
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
        });
    });
});

function countCollidingTiles(world) {
    var n = 0;
    if (!world || !world.ground || !world.ground.forEachTile) {
        return 0;
    }
    world.ground.forEachTile(function (tile) {
        if (tile && tile.collides) {
            n += 1;
        }
    });
    return n;
}

EmberwoodTests.add('world: collision debug overlay toggles arcade bodies and colliding tiles', function (win, H) {
    return ensureWorldPlay(win, H).then(function () {
        var world = H.world(win);
        var spawn = win.defaultWorldSpawn();
        assertEqual(spawn.x, 328, 'spawn x is courtyard tile center');
        assertEqual(spawn.y, 248, 'spawn y is courtyard tile center');
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, false);
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);
        if (world.clearWalk) {
            world.clearWalk();
        }
        H.clearKeys(win);
        assertEqual(Math.round(world.player.x), 328, 'player at spawn x');
        assertEqual(Math.round(world.player.y), 248, 'player at spawn y');
        assert(String(win.Phaser.VERSION).indexOf('3.90') === 0, 'Phaser 3.90');
        assert(!win.game.input.keyboard, 'Phaser keyboard plugin stays off');

        var arcadeCfg = win.game.config && win.game.config.physics && win.game.config.physics.arcade;
        assert(arcadeCfg && arcadeCfg.debug === false, 'config arcade.debug stays false');
        assertEqual(world.collisionDebug, false, 'overlay starts off');
        assertEqual(world.physics.world.drawDebug, false, 'arcade drawDebug starts off');
        assert(!world.collisionDebugGfx.visible, 'tile overlay hidden by default');
        assertEqual(world.collisionDebugTileCount, 0, 'no colliding tiles drawn by default');

        H.click(win, '#tab-bar button[data-tab="settings"]');
        assert(H.panelVisible(win, 'settings'), 'Settings panel visible');
        var btn = win.document.querySelector('#panel-settings [data-collision-debug]');
        assert(btn, 'Settings collision debug button exists');
        assertMatch(btn.textContent, 'Off', 'button starts Off');

        var shrine = world.ground.getTileAt(18, 8);
        assert(shrine && shrine.index === win.TILE.SHRINE, 'haven shrine is TILE.SHRINE');
        assert(shrine.collides, 'shrine tile collides');

        var settingsClicked = H.mouseClick(win, btn);
        assertEqual(world.collisionDebug, true, 'settings click turns overlay on');
        assertEqual(world.physics.world.drawDebug, true, 'arcade body debug on');
        assert(world.physics.world.debugGraphic && world.physics.world.debugGraphic.visible, 'arcade debug graphic visible');
        assert(world.collisionDebugGfx.visible, 'colliding tile overlay visible');
        var havenCount = countCollidingTiles(world);
        assert(havenCount > 20, 'haven has colliding tiles, n=' + havenCount);
        assertEqual(world.collisionDebugTileCount, havenCount, 'overlay draws every colliding tile');
        assert(H.chatHas(win, 'Collision debug on'), 'on chat');
        assertMatch(btn.textContent, 'On', 'button On');
        assert(btn.classList.contains('is-on'), 'button is-on');
        assert(win.document.activeElement !== settingsClicked, 'settings toggle blurs after click');
        assert(!win.game.input.keyboard, 'Phaser keyboard still off after settings click');

        H.enterZone(win, 'northwood');
        assertEqual(world.collisionDebug, true, 'overlay survives zone change');
        assertEqual(world.physics.world.drawDebug, true, 'arcade debug stays on after enterZone');
        assert(world.collisionDebugGfx.visible, 'tile overlay redrawn in Northwood');
        var woodCount = countCollidingTiles(world);
        assert(woodCount > 20, 'Northwood colliding tiles, n=' + woodCount);
        assertEqual(world.collisionDebugTileCount, woodCount, 'Northwood overlay matches collides');
        H.enterZone(win, 'haven');
        world.placePlayer(spawn.x, spawn.y);
        world.player.body.setVelocity(0, 0);

        win.dispatchEvent(new win.KeyboardEvent('keydown', {
            key: 'F9', code: 'F9', bubbles: true, cancelable: true
        }));
        assertEqual(world.collisionDebug, false, 'F9 toggles overlay off');
        assertEqual(world.physics.world.drawDebug, false, 'arcade drawDebug off after F9');
        assert(world.physics.world.debugGraphic && !world.physics.world.debugGraphic.visible, 'arcade debug graphic hidden');
        assert(!world.collisionDebugGfx.visible, 'tile overlay hidden after F9');
        assertEqual(world.collisionDebugTileCount, 0, 'no colliding tiles drawn after F9');
        assert(H.chatHas(win, 'Collision debug off'), 'off chat');
        assertMatch(win.document.querySelector('#panel-settings [data-collision-debug]').textContent, 'Off', 'button Off after F9');
        assert(!win.Keys.isDown('KeyW') && !win.Keys.isDown('KeyA') && !win.Keys.isDown('KeyS') && !win.Keys.isDown('KeyD'), 'F9 does not press WASD');

        H.click(win, '#panel-settings [data-collision-debug]');
        assertEqual(world.collisionDebug, true, 'settings click turns overlay back on');

        var walkY = world.player.y;
        return H.holdKey(win, 'KeyW', 'w', 400).then(function () {
            assert(world.player.y < walkY - 12, 'W still walks north with overlay on, y=' + world.player.y);
            assert(!win.game.input.keyboard, 'Phaser keyboard still off');
            world.setCollisionDebug(false);
            win.Hud.renderCollisionDebug();
            world.placePlayer(spawn.x, spawn.y);
            world.player.body.setVelocity(0, 0);
            H.clearKeys(win);
            assertEqual(Math.round(world.player.x), 328, 'restored spawn x');
            assertEqual(Math.round(world.player.y), 248, 'restored spawn y');
        });
    });
});

