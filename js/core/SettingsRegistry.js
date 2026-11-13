/**
 * Declarative settings: one entry drives normalize defaults + Hud click/render labels.
 * Hud still owns DOM; registry owns the shared toggle/choice semantics.
 */
var SettingsRegistry = {
    entries: [
        {
            id: 'autoRetaliate',
            heroKey: 'autoRetaliate',
            control: 'toggle',
            dataAttr: 'data-auto-retaliate',
            defaultValue: false,
            label: function (on) {
                return 'Auto-retaliate: ' + (on ? 'On' : 'Off');
            },
            vueOn: 'autoRetaliateOn',
            vueLabel: 'autoRetaliateLabel',
            chat: function (on) {
                return 'Auto-retaliate ' + (on ? 'on' : 'off') + '.';
            }
        },
        {
            id: 'autoAttack',
            heroKey: 'autoAttack',
            control: 'toggle',
            dataAttr: 'data-auto-attack',
            defaultValue: false,
            label: function (on) {
                return 'Auto-attack: ' + (on ? 'On' : 'Off');
            },
            vueOn: 'autoAttackOn',
            vueLabel: 'autoAttackLabel',
            chat: function (on) {
                return 'Auto-attack ' + (on ? 'on' : 'off') + '.';
            }
        },
        {
            id: 'autoPickup',
            heroKey: 'autoPickup',
            control: 'toggle',
            dataAttr: 'data-auto-pickup',
            defaultValue: true,
            /* false means off; missing/true means on */
            read: function (hero) {
                return hero.autoPickup !== false;
            },
            write: function (hero, on) {
                hero.autoPickup = on;
            },
            label: function (on) {
                return 'Auto-pickup: ' + (on ? 'On' : 'Off');
            },
            vueOn: 'autoPickupOn',
            vueLabel: 'autoPickupLabel',
            chat: function (on) {
                return 'Auto-pickup ' + (on ? 'on' : 'off') + '.';
            }
        },
        {
            id: 'shiftClickDrop',
            heroKey: 'shiftClickDrop',
            control: 'toggle',
            dataAttr: 'data-shift-click-drop',
            defaultValue: true,
            read: function (hero) {
                return hero.shiftClickDrop !== false;
            },
            write: function (hero, on) {
                hero.shiftClickDrop = on;
            },
            label: function (on) {
                return 'Shift-click drop: ' + (on ? 'On' : 'Off');
            },
            vueOn: 'shiftClickDropOn',
            vueLabel: 'shiftClickDropLabel',
            chat: function (on) {
                return 'Shift-click drop ' + (on ? 'on' : 'off') + '.';
            }
        },
        {
            id: 'hideBones',
            heroKey: 'hideBones',
            control: 'toggle',
            dataAttr: 'data-hide-bones',
            defaultValue: false,
            label: function (on) {
                return 'Hide bones: ' + (on ? 'On' : 'Off');
            },
            vueOn: 'hideBonesOn',
            vueLabel: 'hideBonesLabel',
            chat: function (on) {
                return 'Hide bones ' + (on ? 'on' : 'off') + '.';
            },
            afterToggle: function (hero, on, hud) {
                if (hud && typeof hud.syncHideBones === 'function') {
                    hud.syncHideBones();
                }
                var world = window.game && window.game.scene.getScene('WorldScene');
                if (world && world.refreshLootVisibility) {
                    world.refreshLootVisibility();
                }
            }
        },
        {
            id: 'showCombatVisuals',
            heroKey: 'showCombatVisuals',
            control: 'toggle',
            dataAttr: 'data-combat-visuals',
            defaultValue: true,
            read: function (hero) {
                return hero.showCombatVisuals !== false;
            },
            write: function (hero, on) {
                hero.showCombatVisuals = on;
            },
            label: function (on) {
                return 'Combat visuals: ' + (on ? 'On' : 'Off');
            },
            vueOn: 'combatVisualsOn',
            vueLabel: 'combatVisualsLabel',
            chat: function (on) {
                return 'Combat visuals ' + (on ? 'on' : 'off') + '.';
            }
        },
        {
            id: 'showRangeRings',
            heroKey: 'showRangeRings',
            control: 'toggle',
            dataAttr: 'data-range-rings',
            defaultValue: true,
            read: function (hero) {
                return hero.showRangeRings !== false;
            },
            write: function (hero, on) {
                hero.showRangeRings = on;
            },
            label: function (on) {
                return 'Show range rings: ' + (on ? 'On' : 'Off');
            },
            vueOn: 'rangeRingsOn',
            vueLabel: 'rangeRingsLabel',
            chat: function (on) {
                return 'Range rings ' + (on ? 'on' : 'off') + '.';
            },
            afterToggle: function (hero, on) {
                var world = window.game && window.game.scene.getScene('WorldScene');
                if (!on && world && world.clearCombatRangeRings) {
                    world.clearCombatRangeRings();
                }
            }
        }
    ],

    byId: function (id) {
        var i;
        for (i = 0; i < this.entries.length; i++) {
            if (this.entries[i].id === id) {
                return this.entries[i];
            }
        }
        return null;
    },

    byDataAttr: function (attr) {
        var i;
        for (i = 0; i < this.entries.length; i++) {
            if (this.entries[i].dataAttr === attr) {
                return this.entries[i];
            }
        }
        return null;
    },

    readOn: function (entry, hero) {
        if (!entry || !hero) {
            return !!entry && !!entry.defaultValue;
        }
        if (typeof entry.read === 'function') {
            return !!entry.read(hero);
        }
        return !!hero[entry.heroKey];
    },

    writeOn: function (entry, hero, on) {
        if (!entry || !hero) {
            return;
        }
        if (typeof entry.write === 'function') {
            entry.write(hero, !!on);
            return;
        }
        hero[entry.heroKey] = !!on;
    },

    normalizeHero: function (hero) {
        var i;
        var entry;
        var cur;
        if (!hero) {
            return hero;
        }
        for (i = 0; i < this.entries.length; i++) {
            entry = this.entries[i];
            if (entry.control !== 'toggle') {
                continue;
            }
            cur = hero[entry.heroKey];
            if (cur == null) {
                this.writeOn(entry, hero, entry.defaultValue);
            }
        }
        return hero;
    },

    toggle: function (entry, hero, hud) {
        var on;
        if (!entry || !hero) {
            return false;
        }
        on = !this.readOn(entry, hero);
        this.writeOn(entry, hero, on);
        if (hud && typeof hud.saveHero === 'function') {
            hud.saveHero(hero);
        }
        this.renderOne(entry, hero, hud);
        if (typeof entry.afterToggle === 'function') {
            entry.afterToggle(hero, on, hud);
        }
        if (hud && typeof hud.log === 'function' && typeof entry.chat === 'function') {
            hud.log(entry.chat(on));
        }
        return on;
    },

    renderOne: function (entry, hero, hud) {
        var on;
        var vue;
        var label;
        var buttons;
        var i;
        if (!entry) {
            return;
        }
        on = this.readOn(entry, hero);
        label = typeof entry.label === 'function' ? entry.label(on) : null;
        vue = (hud && typeof hud.vueState === 'function' ? hud.vueState() : null)
            || (window.HudApp && HudApp.vue);
        if (vue) {
            if (entry.vueOn) {
                vue[entry.vueOn] = on;
            }
            if (entry.vueLabel && label) {
                vue[entry.vueLabel] = label;
            }
        }
        if (entry.dataAttr && typeof document !== 'undefined' && document.querySelectorAll) {
            buttons = document.querySelectorAll('[' + entry.dataAttr + ']');
            for (i = 0; i < buttons.length; i++) {
                buttons[i].classList.toggle('is-on', on);
                if (label) {
                    buttons[i].textContent = label;
                }
            }
        }
    },

    renderAll: function (hero, hud) {
        var i;
        for (i = 0; i < this.entries.length; i++) {
            this.renderOne(this.entries[i], hero, hud);
        }
    },

    /**
     * Handle a click on a registered toggle data-* button.
     * @returns {boolean} true if handled
     */
    handleClick: function (event, hud) {
        var i;
        var entry;
        var btn;
        var hero;
        for (i = 0; i < this.entries.length; i++) {
            entry = this.entries[i];
            if (entry.control !== 'toggle' || !entry.dataAttr) {
                continue;
            }
            btn = event.target.closest('[' + entry.dataAttr + ']');
            if (!btn) {
                continue;
            }
            hero = hud && typeof hud.hero === 'function' ? hud.hero() : null;
            if (!hero) {
                return true;
            }
            this.toggle(entry, hero, hud);
            return true;
        }
        return false;
    }
};

window.SettingsRegistry = SettingsRegistry;
