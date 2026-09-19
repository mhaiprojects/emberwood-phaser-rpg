var EmberwoodHarness = {
    sleep: function (ms) {
        return new Promise(function (resolve) {
            setTimeout(resolve, ms);
        });
    },

    waitUntil: function (check, timeout, label) {
        timeout = timeout || 4000;
        var started = Date.now();
        var self = this;
        return new Promise(function (resolve, reject) {
            var tick = function () {
                try {
                    if (check()) {
                        resolve(true);
                        return;
                    }
                } catch (err) {
                    /* keep waiting until timeout */
                }
                if (Date.now() - started > timeout) {
                    reject(new Error('Timed out waiting for ' + (label || 'condition')));
                    return;
                }
                setTimeout(tick, 40);
            };
            tick();
        });
    },

    waitReady: function (win) {
        var self = this;
        return this.waitUntil(function () {
            return win.Hud && win.Hud.el && win.Hud.el.start && !win.Hud.el.start.disabled && win.game;
        }, 8000, 'game ready');
    },

    keyCodes: {
        KeyW: 87,
        KeyA: 65,
        KeyS: 83,
        KeyD: 68,
        ArrowLeft: 37,
        ArrowUp: 38,
        ArrowRight: 39,
        ArrowDown: 40,
        Space: 32,
        Escape: 27,
        ControlLeft: 17,
        ControlRight: 17
    },

    click: function (win, selector) {
        var el = typeof selector === 'string' ? win.document.querySelector(selector) : selector;
        if (!el) {
            throw new Error('Missing element ' + selector);
        }
        el.click();
        return el;
    },

    mouseClick: function (win, selector) {
        var el = typeof selector === 'string' ? win.document.querySelector(selector) : selector;
        if (!el) {
            throw new Error('Missing element ' + selector);
        }
        var opts = { bubbles: true, cancelable: true, view: win, button: 0 };
        el.focus();
        el.dispatchEvent(new win.MouseEvent('mousedown', opts));
        el.dispatchEvent(new win.MouseEvent('mouseup', opts));
        el.click();
        return el;
    },

    clickWorld: function (win, worldX, worldY) {
        var world = this.world(win);
        var pointer = world.input && world.input.activePointer;
        if (pointer) {
            pointer.worldX = worldX;
            pointer.worldY = worldY;
        }
        if (world.input && world.input.emit) {
            world.input.emit('pointerdown', pointer || { worldX: worldX, worldY: worldY });
            return pointer || { worldX: worldX, worldY: worldY };
        }
        world.onClick({ worldX: worldX, worldY: worldY });
        return { worldX: worldX, worldY: worldY };
    },

    key: function (win, code, key, type) {
        this.dispatchKey(win, code, key, type);
    },

    dispatchKey: function (win, code, key, type) {
        var keyCode = this.keyCodes[code] || 0;
        var Ctor = win.KeyboardEvent || KeyboardEvent;
        var event = new Ctor(type || 'keydown', {
            key: key,
            code: code,
            keyCode: keyCode,
            which: keyCode,
            bubbles: true,
            cancelable: true,
            view: win
        });
        var target = win.document.activeElement;
        if (!target || target === win.document.documentElement) {
            target = win.document.body || win;
        }
        target.dispatchEvent(event);
        return event;
    },

    holdKey: function (win, code, key, ms) {
        var self = this;
        this.key(win, code, key, 'keydown');
        return this.sleep(ms || 350).then(function () {
            self.key(win, code, key, 'keyup');
            if (win.Keys) {
                win.Keys.down = {};
            }
        });
    },

    clearKeys: function (win) {
        if (win.Keys) {
            win.Keys.down = {};
            win.Keys.pressed = {};
        }
    },

    samplePlayer: function (win, ms, interval) {
        var self = this;
        var world = this.world(win);
        var samples = [];
        interval = interval || 50;
        var take = function () {
            var body = world.player.body;
            samples.push({
                x: world.player.x,
                y: world.player.y,
                vx: body.velocity.x,
                vy: body.velocity.y
            });
        };
        take();
        var elapsed = 0;
        var step = function () {
            if (elapsed >= ms) {
                return Promise.resolve(samples);
            }
            return self.sleep(interval).then(function () {
                elapsed += interval;
                take();
                return step();
            });
        };
        return step();
    },

    chat: function (win) {
        return Array.prototype.map.call(win.document.querySelectorAll('.chat-line'), function (line) {
            return line.textContent;
        });
    },

    chatHas: function (win, snippet) {
        return this.chat(win).some(function (line) {
            return line.indexOf(snippet) !== -1;
        });
    },

    lastChat: function (win) {
        var lines = this.chat(win);
        return lines.length ? lines[lines.length - 1] : '';
    },

    world: function (win) {
        return win.game.scene.getScene('WorldScene');
    },

    battle: function (win) {
        return win.game.scene.getScene('BattleScene');
    },

    hero: function (win) {
        return win.game.registry.get('hero');
    },

    quest: function (win) {
        return win.game.registry.get('quest');
    },

    startPlay: function (win) {
        var self = this;
        return this.waitReady(win).then(function () {
            if (win.Hud.mode === 'title') {
                self.click(win, '#btn-start');
            }
            return self.waitUntil(function () {
                var world = self.world(win);
                return win.Hud.mode === 'world' && world && world.scene.isActive() && world.player;
            }, 6000, 'world scene');
        });
    },

    findNpc: function (win, key) {
        var kids = this.world(win).npcs.getChildren();
        for (var i = 0; i < kids.length; i++) {
            if (kids[i].npcDef && kids[i].npcDef.key === key) {
                return kids[i];
            }
        }
        return null;
    },

    findMob: function (win, type) {
        var kids = this.world(win).mobs.getChildren();
        for (var i = 0; i < kids.length; i++) {
            if (kids[i].aliveMob && (!type || kids[i].mobDef.type === type)) {
                return kids[i];
            }
        }
        return null;
    },

    livingMobs: function (win) {
        return this.world(win).mobs.getChildren().filter(function (mob) {
            return mob.aliveMob;
        });
    },

    enterZone: function (win, zoneId) {
        this.world(win).enterZone(zoneId, null);
        this.world(win).exitLock = false;
        this.world(win).encounterLock = false;
    },

    waitPlayerTurn: function (win) {
        var self = this;
        return this.waitUntil(function () {
            var battle = self.battle(win);
            return battle && battle.scene.isActive() && battle.isPlayerTurn() && battle.waitingForPlayer;
        }, 5000, 'player combat turn').then(function () {
            return self.waitUntil(function () {
                return self.battle(win).pickReady;
            }, 1500, 'combat input ready');
        });
    },

    waitWorld: function (win) {
        var self = this;
        return this.waitUntil(function () {
            var world = self.world(win);
            return world && world.scene.isActive() && win.Hud.mode === 'world' && !world.encounterLock;
        }, 5000, 'return to world');
    },

    startFight: function (win, mob) {
        var self = this;
        this.world(win).beginFight(mob);
        return this.waitUntil(function () {
            return win.game.scene.isActive('BattleScene');
        }, 4000, 'battle scene').then(function () {
            return self.waitPlayerTurn(win);
        });
    },

    startCustomFight: function (win, enemies) {
        var self = this;
        return this.cleanupBattle(win).then(function () {
            var world = self.world(win);
            world.encounterLock = true;
            world.lastFought = self.findMob(win) || { mobDef: enemies[0], aliveMob: true };
            win.game.registry.set('pendingEncounter', { enemies: enemies });
            world.scene.switch('BattleScene');
            return self.waitUntil(function () {
                return win.game.scene.isActive('BattleScene');
            }, 4000, 'custom battle');
        }).then(function () {
            return self.waitPlayerTurn(win);
        });
    },

    forceFlee: function (win) {
        var battle = this.battle(win);
        if (battle && battle.scene.isActive()) {
            battle.outcome = 'flee';
            battle.endBattle();
        }
        return this.waitWorld(win);
    },

    cleanupBattle: function (win) {
        var self = this;
        try {
            var battle = this.battle(win);
            if (battle && battle.scene && battle.scene.isActive()) {
                battle.outcome = 'flee';
                battle.endBattle();
            }
        } catch (err) {
            /* world may already be active */
        }
        return this.sleep(80).then(function () {
            try {
                var world = self.world(win);
                if (world) {
                    world.encounterLock = false;
                    world.exitLock = false;
                }
            } catch (err2) {
                /* ignore */
            }
        });
    },

    panelVisible: function (win, tab) {
        var panel = win.document.getElementById('panel-' + tab);
        return panel && !panel.hidden;
    },

    setAutoAttack: function (win, on) {
        var hero = this.hero(win);
        hero.autoAttack = !!on;
        hero.autoRetaliate = !!on;
        win.game.registry.set('hero', hero);
        if (win.Hud && win.Hud.renderAutoAttack) {
            win.Hud.renderAutoAttack(hero);
        }
        if (win.Hud && win.Hud.renderAutoRetaliate) {
            win.Hud.renderAutoRetaliate(hero);
        }
        return hero;
    },

    setAutoRetaliate: function (win, on) {
        var hero = this.hero(win);
        hero.autoRetaliate = !!on;
        win.game.registry.set('hero', hero);
        if (win.Hud && win.Hud.renderAutoRetaliate) {
            win.Hud.renderAutoRetaliate(hero);
        }
        return hero;
    },

    mountTypingField: function (win, kind) {
        var doc = win.document;
        var el;
        kind = kind || 'input';
        if (kind === 'textarea') {
            el = doc.createElement('textarea');
        } else if (kind === 'select') {
            el = doc.createElement('select');
            var opt = doc.createElement('option');
            opt.value = 'west';
            opt.textContent = 'west';
            el.appendChild(opt);
        } else if (kind === 'contenteditable') {
            el = doc.createElement('div');
            el.contentEditable = 'true';
        } else {
            el = doc.createElement('input');
            el.type = 'text';
            el.id = 'chat-input';
            el.setAttribute('placeholder', 'chat');
        }
        el.setAttribute('data-test-typing', kind);
        doc.body.appendChild(el);
        el.focus();
        return el;
    },

    removeTypingField: function (win, el) {
        if (el && el.parentNode) {
            el.parentNode.removeChild(el);
        }
        if (win.document.body) {
            win.document.body.focus();
        }
    },

    setAutoPickup: function (win, on) {
        var hero = this.hero(win);
        hero.autoPickup = !!on;
        win.game.registry.set('hero', hero);
        if (win.Hud && win.Hud.renderAutoPickup) {
            win.Hud.renderAutoPickup(hero);
        }
        return hero;
    },

    pickupAllLoot: function (win) {
        var world = this.world(win);
        var drops = (world.groundLoot || []).slice();
        drops.forEach(function (drop) {
            world.tryPickup(drop);
        });
    },

    lootLive: function (win) {
        return (this.world(win).groundLoot || []).filter(function (drop) {
            return drop && !drop.taken && drop.sprite;
        });
    },

    assertLootAtFeet: function (win, feetX, feetY, expectedIds) {
        var live = this.lootLive(win);
        var ids = live.map(function (drop) {
            return drop.id;
        });
        if (ids.length !== expectedIds.length) {
            throw new Error('loot count — expected ' + expectedIds.join(',') + ', got ' + ids.join(','));
        }
        expectedIds.forEach(function (id) {
            if (ids.indexOf(id) === -1) {
                throw new Error('missing loot ' + id + ' (have ' + ids.join(',') + ')');
            }
        });
        live.forEach(function (drop) {
            var dx = drop.sprite.x - feetX;
            var dy = drop.sprite.y - (feetY + 4);
            if (Math.abs(dx) > 16 || Math.abs(dy) > 6) {
                throw new Error(drop.id + ' not at feet (' + drop.sprite.x + ',' + drop.sprite.y + ') vs (' + feetX + ',' + (feetY + 4) + ')');
            }
        });
        return live;
    },

    attackUntilWorld: function (win) {
        var self = this;
        var n = 0;
        var step = function () {
            var world = self.world(win);
            if (world && world.scene.isActive() && win.Hud.mode === 'world' && !world.encounterLock) {
                return Promise.resolve();
            }
            if (n++ > 8) {
                return Promise.reject(new Error('fight did not end'));
            }
            return self.waitUntil(function () {
                var w = self.world(win);
                if (w && w.scene.isActive() && win.Hud.mode === 'world' && !w.encounterLock) {
                    return true;
                }
                var battle = self.battle(win);
                return battle && battle.scene.isActive() && battle.isPlayerTurn() && battle.waitingForPlayer && battle.pickReady;
            }, 5000, 'player turn or world').then(function () {
                var w = self.world(win);
                if (w && w.scene.isActive() && win.Hud.mode === 'world' && !w.encounterLock) {
                    return;
                }
                win.Hud.tryAttack();
                return self.sleep(120).then(step);
            });
        };
        return step();
    }
};

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error((message || 'assertEqual') + ' — expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
    }
}

function assertMatch(text, snippet, message) {
    if (String(text).indexOf(snippet) === -1) {
        throw new Error((message || 'assertMatch') + ' — missing ' + JSON.stringify(snippet) + ' in ' + JSON.stringify(text));
    }
}
