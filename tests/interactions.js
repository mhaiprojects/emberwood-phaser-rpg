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
    var map = [
        ['F1', 'combat'], ['F2', 'skills'], ['F3', 'quest'], ['F4', 'inv'],
        ['F5', 'equip'], ['F6', 'prayer'], ['F7', 'magic'], ['F8', 'settings']
    ];
    map.forEach(function (pair) {
        win.dispatchEvent(new KeyboardEvent('keydown', { key: pair[0], code: pair[0], bubbles: true, cancelable: true }));
        assert(H.panelVisible(win, pair[1]), pair[0] + ' opens ' + pair[1]);
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
        ['crafting', 'Crafting']
    ];
    H.click(win, '#tab-bar button[data-tab="skills"]');
    assert(H.panelVisible(win, 'skills'), 'skills panel visible');
    var rows = win.document.querySelectorAll('#skills-list .skill-row');
    assertEqual(rows.length, 12, 'twelve skill rows');
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
        'cooking', 'fishing', 'woodcutting', 'mining', 'crafting'
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
    assertEqual(rows.length, 12, 'twelve skill rows');
    var byName = {};
    for (var i = 0; i < rows.length; i++) {
        byName[rows[i].querySelector('span').textContent] = rows[i].querySelector('strong').textContent;
    }
    assertEqual(byName.Hitpoints, '10', 'Skills tab Hitpoints 10');
    [
        'Attack', 'Strength', 'Defence', 'Ranged', 'Prayer', 'Magic',
        'Cooking', 'Fishing', 'Woodcutting', 'Mining', 'Crafting'
    ].forEach(function (name) {
        assertEqual(byName[name], '1', name + ' is 1 on Skills tab');
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
        assertEqual(H.hero(win).level, 1, 'starter combat level is 1');
        assertEqual(win.document.getElementById('hud-quest').textContent, 'Return to Guildmaster Bram for your reward.', 'side HUD at stage 2');
        assertEqual(win.document.getElementById('hud-quest-tab').textContent, 'Return to Guildmaster Bram for your reward.', 'journal at stage 2');
        var bram = H.findNpc(win, 'guild');
        assert(bram, 'Bram is in Emberhaven');

        world.tryTalk(bram);
        assertEqual(H.quest(win).stage, 3, 'stage 2 talk completes the quest');
        assertEqual(H.hero(win).gold, 58, 'pays 50 gold (8 + 50)');
        assertEqual(H.hero(win).xp, 40, 'grants 40 combat XP');
        assertEqual(H.hero(win).level, 2, 'levelHero raises combat level 1 → 2');
        assertEqual(H.hero(win).maxHp, 110, 'level-up maxHp is 90 + level * 10');
        assertEqual(H.hero(win).damage, 18, 'level-up damage is 14 + level * 2');
        assert(H.chatHas(win, 'militia thanks you'), 'reward speech');
        assert(H.chatHas(win, '50 gold and combat training'), 'reward names gold and training');
        assert(H.chatHas(win, 'Your combat level is now 2.'), 'levels when XP crosses the next threshold');
        assertEqual(win.document.getElementById('hud-gold').textContent, '58', 'HUD gold after pay');
        assertEqual(win.document.getElementById('hud-xp').textContent, '40', 'HUD XP after pay');
        assertEqual(win.document.getElementById('hud-level').textContent, '2', 'HUD combat level after level-up');
        assertEqual(win.document.getElementById('hud-quest').textContent, 'Militia task complete. Explore the nine lands.', 'side HUD after complete');
        assertEqual(win.document.getElementById('hud-quest-tab').textContent, 'Militia task complete. Explore the nine lands.', 'journal after complete');

        hero = win.makeHero();
        hero.level = 5;
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
        assertEqual(H.hero(win).level, 5, 'does not level when already above the XP curve');
        assertEqual(H.hero(win).maxHp, 140, 'maxHp unchanged when no level-up');
        assertEqual(H.hero(win).damage, 24, 'damage unchanged when no level-up');
        assertEqual(H.lastChat(win), 'Guildmaster Bram: The militia thanks you. 50 gold and combat training.', 'no extra level-up line when not needed');
        assertEqual(win.document.getElementById('hud-level').textContent, '5', 'HUD level stays 5');
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
        assertEqual(H.hero(win).hp, 100, 'restores HP to max');
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
        world.tryTalk(elise);
        assertEqual(H.hero(win).hp, H.hero(win).maxHp, '0-gold hero still heals to max');
        assertEqual(H.hero(win).gold, 0, '0-gold heal still costs 0');
        assert(!H.chatHas(win, 'Come back with 10 gold'), 'banker never demands gold');
        assertEqual(win.document.getElementById('hud-gold').textContent, '0', 'HUD gold stays 0');

        gold = H.hero(win).gold;
        world.tryTalk(elise);
        assertEqual(H.hero(win).hp, H.hero(win).maxHp, 'full HP stays at max');
        assertEqual(H.hero(win).gold, gold, 'full-HP talk costs 0');
        assertEqual(H.lastChat(win), 'Banker Elise: Your wounds close. HP restored.', 'full-HP talk still uses the heal line');
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

        var origBetween = win.Phaser.Math.Between;
        try {
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

                lines.forEach(function (line, idx) {
                    win.Phaser.Math.Between = function (lo, hi) {
                        assertEqual(lo, 0, want.name + ' Between lo');
                        assertEqual(hi, lines.length - 1, want.name + ' Between hi');
                        return idx;
                    };
                    win.Hud.el.log.innerHTML = '';
                    world.tryTalk(npc);
                    assertEqual(H.lastChat(win), want.name + ': ' + line, want.name + ' line ' + idx);
                    assert(H.lastChat(win).indexOf(want.name + ': ') === 0, want.name + ' Name: prefix');
                    assert(!H.chatHas(win, 'Come back with 10 gold'), want.name + ' is not a paid healer');
                    assert(!H.chatHas(win, 'Your wounds close'), want.name + ' does not heal');
                    assert(!H.chatHas(win, 'Goblins plague Northwood'), want.name + ' is not Bram');
                    assert(!win.game.input.keyboard, 'Phaser keyboard off after ' + want.name);
                });
            });
            assertEqual(flavor.length, 8, 'eight flavor NPCs');
        } finally {
            win.Phaser.Math.Between = origBetween;
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
            assert(remainingFlee > 0, 'flee wake still has grace remaining (' + remainingFlee + 'ms)');
            assert(remainingFlee <= 700, 'flee wake grace is at most 700ms (got ' + remainingFlee + 'ms)');
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

EmberwoodTests.add('world: auto-attack engages a nearby mob', function (win, H) {
    return H.cleanupBattle(win).then(function () {
        H.enterZone(win, 'haven');
        H.setAutoAttack(win, true);
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
        H.enterZone(win, 'haven');
        var chicken = H.findMob(win, 'Chicken');
        var world = H.world(win);
        world.engageGrace = 0;
        world.engageTarget = null;
        world.player.setPosition(chicken.x, chicken.y);
        world.update();
        assertEqual(win.Hud.mode, 'world', 'no auto fight when toggled off');
        assert(!world.encounterLock, 'not locked into combat');
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
    return H.cleanupBattle(win).then(function () {
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
        assertMatch(win.document.getElementById('dead-overlay').innerText, 'You are dead', 'death heading');
        assertEqual(win.Hud.mode, 'dead', 'hud dead mode');
        H.click(win, '#btn-retry');
        return H.waitUntil(function () {
            return !win.document.getElementById('title-overlay').hidden;
        }, 4000, 'title after retry');
    }).then(function () {
        assertEqual(win.Hud.mode, 'title', 'back at title');
        assert(win.document.getElementById('dead-overlay').hidden, 'death overlay closed');
    });
});

function ensureWorldPlay(win, H) {
    return H.cleanupBattle(win).then(function () {
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
