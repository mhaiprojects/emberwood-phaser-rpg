var Hud = {
    mode: 'title',
    battle: null,
    selectingEnemy: false,
    useOnId: null,
    tab: 'inv',

    vueState: function () {
        if (window.HudApp && HudApp.vm) {
            return HudApp.vm;
        }
        return window.HudApp && HudApp.state ? HudApp.state : null;
    },

    bindEls: function () {
        this.el = {
            shell: document.getElementById('shell'),
            title: document.getElementById('title-overlay'),
            battle: document.getElementById('battle-panel'),
            dead: document.getElementById('dead-overlay'),
            log: document.getElementById('chat-log'),
            zone: document.getElementById('hud-zone'),
            hp: document.getElementById('hud-hp'),
            gold: document.getElementById('hud-gold'),
            xp: document.getElementById('hud-xp'),
            level: document.getElementById('hud-level'),
            total: document.getElementById('hud-total'),
            quest: document.getElementById('hud-quest'),
            questTab: document.getElementById('hud-quest-tab'),
            questPoints: document.getElementById('hud-quest-points'),
            questChecklist: document.getElementById('quest-checklist'),
            questComplete: document.getElementById('quest-complete-overlay'),
            questCompleteCopy: document.getElementById('quest-complete-copy'),
            questCompleteClose: document.getElementById('btn-quest-complete-close'),
            minimap: document.getElementById('minimap'),
            minimapChrome: document.getElementById('minimap-chrome'),
            worldMap: document.getElementById('world-map-overlay'),
            worldMapList: document.getElementById('world-map-list'),
            worldMapClose: document.getElementById('btn-world-map-close'),
            enemies: document.getElementById('battle-enemies'),
            actions: document.getElementById('battle-actions'),
            message: document.getElementById('battle-message'),
            start: document.getElementById('btn-start'),
            credits: document.getElementById('btn-credits'),
            creditText: document.getElementById('credit-text'),
            respawn: document.getElementById('btn-respawn'),
            retry: document.getElementById('btn-retry'),
            inv: document.getElementById('inv-grid'),
            skills: document.getElementById('skills-list'),
            equip: document.getElementById('equip-grid'),
            equipStats: document.getElementById('equip-stats'),
            tabs: document.getElementById('tab-bar'),
            styles: document.getElementById('style-row'),
            ctx: document.getElementById('ctx-menu'),
            dialogue: document.getElementById('dialogue-overlay'),
            dialogueSpeaker: document.getElementById('dialogue-speaker'),
            dialogueText: document.getElementById('dialogue-text'),
            dialogueOptions: document.getElementById('dialogue-options'),
            dialogueContinue: document.getElementById('dialogue-continue'),
            dialogueClose: document.getElementById('btn-dialogue-close'),
            shop: document.getElementById('shop-overlay'),
            shopSpeaker: document.getElementById('shop-speaker'),
            shopCopy: document.getElementById('shop-copy'),
            shopStock: document.getElementById('shop-stock'),
            shopInv: document.getElementById('shop-inv'),
            shopClose: document.getElementById('btn-shop-close'),
            bank: document.getElementById('bank-overlay'),
            bankSpeaker: document.getElementById('bank-speaker'),
            bankCopy: document.getElementById('bank-copy'),
            bankInv: document.getElementById('bank-inv-grid'),
            bankVault: document.getElementById('bank-vault-grid'),
            bankChest: document.getElementById('bank-chest'),
            bankQty: document.getElementById('bank-qty'),
            bankSearch: document.getElementById('bank-search'),
            bankTabs: document.getElementById('bank-tabs'),
            bankClose: document.getElementById('btn-bank-close'),
            station: document.getElementById('station-overlay'),
            stationTitle: document.getElementById('station-title'),
            stationCopy: document.getElementById('station-copy'),
            stationList: document.getElementById('station-list'),
            stationActions: document.getElementById('station-actions'),
            stationClose: document.getElementById('btn-station-close'),
            levelUp: document.getElementById('level-up-overlay'),
            levelUpIcon: document.getElementById('level-up-icon'),
            levelUpTitle: document.getElementById('level-up-title'),
            levelUpCopy: document.getElementById('level-up-copy'),
            levelUpClose: document.getElementById('btn-level-up-close')
        };
    },

    onVueMounted: function () {
        this.bindEls();
        if (!this._vueReady) {
            this._vueReady = true;
            this.ensureLevelUpModal();
            this.buildMinimap();
            this.renderWorldMap();
            this.bindInterface();
            this.bindHudBlur();
            this.hideContextMenu();
            this.showTitle();
            this.showTab('inv');
        }
    },

    init: function () {
        this.ctxTarget = null;
        this.dialogue = null;
        this.bankSel = null;
        this.bankTab = 'all';
        this.stationKind = null;
        this.stationSel = null;
        this.shopKey = null;
        this.shopSelStock = null;
        this.shopSelInv = null;
        this._showFps = true;
        this._vueReady = false;
        if (window.HudApp && typeof HudApp.mount === 'function') {
            HudApp.mount();
        }
        this.bindEls();
        this.bindShellResize();
        this.bindAutosave();
        if (!this._vueReady) {
            this.onVueMounted();
        }
    },

    shellResizeDefaults: function () {
        return { side: 230, bottom: 210, iface: 300 };
    },

    applyShellSizes: function (sizes) {
        var root = document.documentElement;
        var def = this.shellResizeDefaults();
        var side = sizes && sizes.side != null ? sizes.side : def.side;
        var bottom = sizes && sizes.bottom != null ? sizes.bottom : def.bottom;
        var iface = sizes && sizes.iface != null ? sizes.iface : def.iface;
        side = Math.max(160, Math.min(420, Math.round(side)));
        bottom = Math.max(140, Math.min(360, Math.round(bottom)));
        iface = Math.max(200, Math.min(480, Math.round(iface)));
        root.style.setProperty('--shell-side', side + 'px');
        root.style.setProperty('--shell-bottom', bottom + 'px');
        root.style.setProperty('--shell-iface', iface + 'px');
        this._shellSizes = { side: side, bottom: bottom, iface: iface };
        if (window.game && game.scale && typeof game.scale.refresh === 'function') {
            game.scale.refresh();
        }
        return this._shellSizes;
    },

    loadShellSizes: function () {
        var raw;
        var parsed;
        try {
            raw = window.localStorage && localStorage.getItem('emberwood-shell-sizes');
            parsed = raw ? JSON.parse(raw) : null;
        } catch (err) {
            parsed = null;
        }
        return this.applyShellSizes(parsed || this.shellResizeDefaults());
    },

    saveShellSizes: function () {
        if (!this._shellSizes) {
            return;
        }
        try {
            if (window.localStorage) {
                localStorage.setItem('emberwood-shell-sizes', JSON.stringify(this._shellSizes));
            }
        } catch (err) {
            /* ignore quota / private mode */
        }
    },

    bindShellResize: function () {
        var self = this;
        var sideEl = document.getElementById('resize-side');
        var bottomEl = document.getElementById('resize-bottom');
        var ifaceEl = document.getElementById('resize-iface');
        var drag = null;

        this.loadShellSizes();

        function endDrag() {
            if (!drag) {
                return;
            }
            if (drag.el) {
                drag.el.classList.remove('is-drag');
            }
            document.body.classList.remove('is-shell-resize', 'is-shell-resize-y');
            self.saveShellSizes();
            drag = null;
        }

        function onMove(event) {
            var sizes;
            var shell;
            var rect;
            if (!drag) {
                return;
            }
            sizes = self._shellSizes
                ? { side: self._shellSizes.side, bottom: self._shellSizes.bottom, iface: self._shellSizes.iface }
                : self.shellResizeDefaults();
            shell = document.getElementById('shell');
            rect = shell ? shell.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
            if (drag.kind === 'side') {
                sizes.side = rect.right - event.clientX;
            } else if (drag.kind === 'bottom') {
                sizes.bottom = rect.bottom - event.clientY;
            } else if (drag.kind === 'iface') {
                sizes.iface = rect.right - event.clientX;
            }
            self.applyShellSizes(sizes);
        }

        function startDrag(kind, el, event) {
            if (event.button != null && event.button !== 0) {
                return;
            }
            event.preventDefault();
            drag = { kind: kind, el: el };
            if (el) {
                el.classList.add('is-drag');
            }
            document.body.classList.add(kind === 'bottom' ? 'is-shell-resize-y' : 'is-shell-resize');
        }

        if (sideEl) {
            sideEl.addEventListener('pointerdown', function (event) {
                startDrag('side', sideEl, event);
            });
        }
        if (bottomEl) {
            bottomEl.addEventListener('pointerdown', function (event) {
                startDrag('bottom', bottomEl, event);
            });
        }
        if (ifaceEl) {
            ifaceEl.addEventListener('pointerdown', function (event) {
                startDrag('iface', ifaceEl, event);
            });
        }
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', endDrag);
        window.addEventListener('pointercancel', endDrag);
        window.addEventListener('blur', endDrag);
    },

    bindInterface: function () {
        var self = this;
        this.el.tabs.addEventListener('click', function (event) {
            var btn = event.target.closest('[data-tab]');
            var tab = btn && btn.getAttribute('data-tab');
            if (tab) {
                self.showTab(tab);
            }
        });
        this.el.styles.addEventListener('click', function (event) {
            var btn = event.target.closest('[data-style]');
            var style = btn && btn.getAttribute('data-style');
            if (!style) {
                return;
            }
            self.setStyle(style);
        });
        document.addEventListener('click', function (event) {
            var btn = event.target.closest('[data-auto-attack]');
            if (!btn) {
                return;
            }
            var hero = self.hero();
            if (!hero) {
                return;
            }
            hero.autoAttack = !hero.autoAttack;
            self.saveHero(hero);
            self.renderAutoAttack(hero);
            self.log('Auto-attack ' + (hero.autoAttack ? 'on' : 'off') + '.');
        });
        document.addEventListener('click', function (event) {
            var btn = event.target.closest('[data-auto-attack-range]');
            var raw;
            var value;
            var hero;
            if (!btn) {
                return;
            }
            hero = self.hero();
            if (!hero) {
                return;
            }
            raw = btn.getAttribute('data-auto-attack-range');
            value = parseInt(raw, 10);
            if (!(value >= 1) || value > 5) {
                return;
            }
            hero.autoAttackRange = value;
            self.saveHero(hero);
            self.renderAutoAttackRange(hero);
            self.log('Auto-attack range ' + value + ' tile' + (value === 1 ? '' : 's') + '.');
        });
        document.addEventListener('click', function (event) {
            var btn = event.target.closest('[data-auto-retaliate]');
            if (!btn) {
                return;
            }
            var hero = self.hero();
            if (!hero) {
                return;
            }
            hero.autoRetaliate = !autoRetaliateOn(hero);
            self.saveHero(hero);
            self.renderAutoRetaliate(hero);
            self.log('Auto-retaliate ' + (hero.autoRetaliate ? 'on' : 'off') + '.');
        });
        document.addEventListener('click', function (event) {
            var btn = event.target.closest('[data-auto-pickup]');
            if (!btn) {
                return;
            }
            var hero = self.hero();
            if (!hero) {
                return;
            }
            hero.autoPickup = hero.autoPickup === false;
            self.saveHero(hero);
            self.renderAutoPickup(hero);
            self.log('Auto-pickup ' + (hero.autoPickup !== false ? 'on' : 'off') + '.');
        });
        document.addEventListener('click', function (event) {
            var btn = event.target.closest('[data-shift-click-drop]');
            if (!btn) {
                return;
            }
            var hero = self.hero();
            if (!hero) {
                return;
            }
            hero.shiftClickDrop = hero.shiftClickDrop === false;
            self.saveHero(hero);
            self.renderShiftClickDrop(hero);
            self.log('Shift-click drop ' + (hero.shiftClickDrop !== false ? 'on' : 'off') + '.');
        });
        document.addEventListener('click', function (event) {
            var btn = event.target.closest('[data-run-toggle]');
            if (!btn) {
                return;
            }
            self.toggleRun();
        });
        document.addEventListener('click', function (event) {
            var btn = event.target.closest('[data-collision-debug]');
            if (!btn) {
                return;
            }
            self.toggleCollisionDebug();
        });
        document.addEventListener('click', function (event) {
            var btn = event.target.closest('[data-spell]');
            var spell = btn && btn.getAttribute('data-spell');
            if (spell === 'windstrike') {
                self.castWindStrike();
            } else if (spell === 'highalch') {
                self.beginHighAlch();
            } else if (spell === 'waterstrike' || spell === 'earthstrike' || spell === 'firestrike') {
                self.castCombatSpell(spell);
            }
        });
        document.addEventListener('click', function (event) {
            var spec = event.target.closest('[data-special-attack]');
            if (!spec) {
                return;
            }
            self.trySpecialAttack();
        });
        document.addEventListener('click', function (event) {
            var btn = event.target.closest('[data-hide-bones]');
            if (!btn) {
                return;
            }
            var hero = self.hero();
            if (!hero) {
                return;
            }
            hero.hideBones = !hero.hideBones;
            self.saveHero(hero);
            self.syncHideBones();
            self.log('Hide bones ' + (hero.hideBones ? 'on' : 'off') + '.');
            var world = window.game && window.game.scene.getScene('WorldScene');
            if (world && world.refreshLootVisibility) {
                world.refreshLootVisibility();
            }
        });
        document.addEventListener('click', function (event) {
            var btn = event.target.closest('[data-combat-visuals]');
            if (!btn) {
                return;
            }
            var hero = self.hero();
            if (!hero) {
                return;
            }
            hero.showCombatVisuals = hero.showCombatVisuals === false;
            self.saveHero(hero);
            self.renderCombatVisuals(hero);
            self.log('Combat visuals ' + (hero.showCombatVisuals !== false ? 'on' : 'off') + '.');
        });
        document.addEventListener('click', function (event) {
            var btn = event.target.closest('[data-range-rings]');
            if (!btn) {
                return;
            }
            var hero = self.hero();
            if (!hero) {
                return;
            }
            hero.showRangeRings = hero.showRangeRings === false;
            self.saveHero(hero);
            self.renderRangeRings(hero);
            self.log('Range rings ' + (hero.showRangeRings !== false ? 'on' : 'off') + '.');
            var world = window.game && window.game.scene.getScene('WorldScene');
            if (world && world.clearCombatRangeRings && hero.showRangeRings === false) {
                world.clearCombatRangeRings();
            }
        });
        document.addEventListener('click', function (event) {
            var btn = event.target.closest('[data-mob-spawn-mod]');
            var raw;
            var value;
            var hero;
            if (!btn) {
                return;
            }
            hero = self.hero();
            if (!hero) {
                return;
            }
            raw = btn.getAttribute('data-mob-spawn-mod');
            value = parseFloat(raw);
            if (!(value > 0)) {
                return;
            }
            hero.mobSpawnModifier = value;
            self.saveHero(hero);
            self.renderMobSpawnModifier(hero);
            self.log('Mob spawn density ' + value + '× (applies on next zone enter).');
        });

        document.addEventListener('click', function (event) {
            var btn = event.target.closest('[data-target-tps]');
            var raw;
            var value;
            var hero;
            var applied;
            var fromTps;
            var fromSpeed;
            if (!btn) {
                return;
            }
            hero = self.hero();
            if (!hero) {
                return;
            }
            fromTps = window.GameClock && typeof GameClock.getTps === 'function'
                ? GameClock.getTps()
                : (hero.simTps || hero.targetTps || 60);
            fromSpeed = window.GameClock && typeof GameClock.getGameSpeed === 'function'
                ? GameClock.getGameSpeed()
                : (hero.gameSpeed || 1);
            raw = btn.getAttribute('data-target-tps');
            value = typeof normalizeTargetTps === 'function'
                ? normalizeTargetTps(raw)
                : (parseInt(raw, 10) === 30 ? 30 : 60);
            hero.simTps = value;
            hero.targetTps = value;
            applied = typeof applyTargetTps === 'function' ? applyTargetTps(value) : value;
            if (typeof recomputeOpenSimCountdowns === 'function') {
                recomputeOpenSimCountdowns(fromTps, fromSpeed);
            }
            self.saveHero(hero);
            self.renderTargetTps(hero);
            self.log('Simulation TPS ' + applied + '.');
        });
        document.addEventListener('click', function (event) {
            var btn = event.target.closest('[data-game-speed]');
            var raw;
            var value;
            var hero;
            var applied;
            var fromTps;
            var fromSpeed;
            if (!btn) {
                return;
            }
            hero = self.hero();
            if (!hero) {
                return;
            }
            fromTps = window.GameClock && typeof GameClock.getTps === 'function'
                ? GameClock.getTps()
                : (hero.simTps || hero.targetTps || 60);
            fromSpeed = window.GameClock && typeof GameClock.getGameSpeed === 'function'
                ? GameClock.getGameSpeed()
                : (hero.gameSpeed || 1);
            raw = btn.getAttribute('data-game-speed');
            value = typeof normalizeGameSpeed === 'function'
                ? normalizeGameSpeed(raw)
                : parseFloat(raw);
            hero.gameSpeed = value;
            applied = typeof applyGameSpeed === 'function' ? applyGameSpeed(value) : value;
            if (typeof recomputeOpenSimCountdowns === 'function') {
                recomputeOpenSimCountdowns(fromTps, fromSpeed);
            }
            self.saveHero(hero);
            self.renderGameSpeed(hero);
            self.log('Game Speed ' + applied + '×.');
        });
        document.addEventListener('click', function (event) {
            var btn = event.target.closest('[data-xp-mult]');
            var raw;
            var value;
            var hero;
            if (!btn) {
                return;
            }
            hero = self.hero();
            if (!hero) {
                return;
            }
            raw = btn.getAttribute('data-xp-mult');
            value = typeof normalizeXpMultiplier === 'function'
                ? normalizeXpMultiplier(raw)
                : (parseFloat(raw) || 1);
            hero.xpMultiplier = value;
            self.saveHero(hero);
            self.renderXpMultiplier(hero);
            self.log('XP multiplier ' + value + '×.');
        });
        document.addEventListener('click', function (event) {
            var btn = event.target.closest('[data-prayer]');
            var id = btn && btn.getAttribute('data-prayer');
            if (!id) {
                return;
            }
            self.togglePrayer(id);
        });
        document.addEventListener('click', function (event) {
            var btn = event.target.closest('[data-save-action]');
            var action = btn && btn.getAttribute('data-save-action');
            if (!action) {
                return;
            }
            if (window.Sfx && Sfx.ui) {
                Sfx.ui();
            }
            if (action === 'logout') {
                self.logoutToTitle();
                return;
            }
            if (action === 'export') {
                self.exportSavePrompt();
                return;
            }
            if (action === 'import') {
                self.importSavePrompt();
            }
        });
        document.addEventListener('click', function (event) {
            var tab = event.target.closest('[data-tab], [data-shop-action], [data-spell], .auto-attack-btn, .auto-pickup-btn');
            if (tab && window.Sfx && Sfx.ui) {
                Sfx.ui();
            }
            if (event.target.closest('[data-sfx-mute]') && window.Sfx) {
                Sfx.muted = !Sfx.muted;
                self.log('SFX ' + (Sfx.muted ? 'muted' : 'on') + '.');
            }
            if (event.target.closest('[data-music-mute]') && window.Sfx) {
                Sfx.setMusicMuted(!Sfx.musicMuted);
                self.log('Music ' + (Sfx.musicMuted ? 'muted' : 'on') + '.');
                if (!Sfx.musicMuted && window.game) {
                    var worldMusic = window.game.scene.getScene('WorldScene');
                    if (worldMusic && worldMusic.playZoneMusic) {
                        worldMusic.playZoneMusic();
                    }
                }
            }
            if (event.target.closest('[data-show-fps]')) {
                self.toggleFps();
            }
        });
        var zoom = document.getElementById('setting-zoom');
        if (zoom) {
            zoom.addEventListener('input', function () {
                self.applyZoom(Number(zoom.value) || 1);
            });
        }
        var chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.addEventListener('keydown', function (event) {
                if (event.code !== 'Enter') {
                    return;
                }
                event.preventDefault();
                var text = String(chatInput.value || '').trim();
                var filter = document.getElementById('chat-filter');
                var channel = filter ? filter.value : 'game';
                if (channel !== 'public' && channel !== 'clan') {
                    channel = 'game';
                }
                if (!text) {
                    return;
                }
                chatInput.value = '';
                var prefix = channel === 'public' ? '[Public] ' : (channel === 'clan' ? '[Clan] ' : '[Game] ');
                self.log(prefix + text, channel === 'clan' ? 'clan' : '');
                chatInput.blur();
            });
        }
        this.el.inv.addEventListener('click', function (event) {
            var slot = event.target.closest('[data-item]');
            if (!slot) {
                return;
            }
            var id = slot.getAttribute('data-item');
            if (event.shiftKey && self.mode === 'world' && shiftClickDropOn(self.hero())) {
                self.hideContextMenu();
                self.dropItem(id);
                return;
            }
            self.useItem(id);
        });
        this.el.inv.addEventListener('contextmenu', function (event) {
            event.preventDefault();
            var slot = event.target.closest('[data-item]');
            if (!slot) {
                return;
            }
            self.showInvDropMenu(slot.getAttribute('data-item'), event);
        });
        if (this.el.skills) {
            this.el.skills.addEventListener('click', function (event) {
                var row = event.target.closest('.skill-row[data-skill]');
                if (!row) {
                    return;
                }
                self.showSkillXp(row.getAttribute('data-skill'));
            });
        }
        if (this.el.equip) {
            this.el.equip.addEventListener('click', function (event) {
                var slotEl = event.target.closest('[data-equip-slot]');
                if (!slotEl) {
                    return;
                }
                self.hideContextMenu();
                self.unequipWorn(slotEl.getAttribute('data-equip-slot'));
            });
            this.el.equip.addEventListener('contextmenu', function (event) {
                event.preventDefault();
                var slotEl = event.target.closest('[data-equip-slot]');
                if (!slotEl) {
                    return;
                }
                self.showEquipRemoveMenu(slotEl.getAttribute('data-equip-slot'), event);
            });
        }
        if (this.el.ctx) {
            this.el.ctx.addEventListener('click', function (event) {
                var btn = event.target.closest('[data-ctx]');
                if (!btn) {
                    return;
                }
                self.chooseContext(btn.getAttribute('data-ctx'), btn.getAttribute('data-ctx-loot'));
            });
        }
        document.addEventListener('mousedown', function (event) {
            if (!self.el.ctx || self.el.ctx.hidden) {
                return;
            }
            if (event.button !== 0) {
                return;
            }
            /* Phaser opens the menu on the same mousedown; ignore that opener so the Take menu stays. */
            if (self.ctxIgnoreOutsideClose) {
                return;
            }
            if (event.target && event.target.closest && event.target.closest('#ctx-menu')) {
                return;
            }
            self.hideContextMenu();
        });
        if (this.el.minimap) {
            this.el.minimap.addEventListener('click', function (event) {
                var cell = event.target.closest('.mm-cell');
                var zoneId = cell && cell.getAttribute('data-zone');
                if (zoneId) {
                    self.clickMinimap(zoneId);
                    return;
                }
                self.showWorldMap();
            });
        }
        if (this.el.minimapChrome) {
            this.el.minimapChrome.addEventListener('click', function () {
                self.showWorldMap();
            });
        }
        if (this.el.worldMapList) {
            this.el.worldMapList.addEventListener('click', function (event) {
                var row = event.target.closest('[data-zone]');
                var zoneId = row && row.getAttribute('data-zone');
                if (zoneId) {
                    self.clickMinimap(zoneId);
                }
            });
        }
        if (this.el.worldMapClose) {
            this.el.worldMapClose.addEventListener('click', function () {
                self.hideWorldMap();
            });
        }
        if (this.el.shop) {
            this.el.shop.addEventListener('click', function (event) {
                var stockSlot = event.target && event.target.closest && event.target.closest('[data-shop-stock]');
                if (stockSlot) {
                    event.preventDefault();
                    event.stopPropagation();
                    self.shopSelStock = stockSlot.getAttribute('data-shop-stock');
                    self.shopSelInv = null;
                    self.renderShop();
                    return;
                }
                var invSlot = event.target && event.target.closest && event.target.closest('[data-shop-inv]');
                if (invSlot) {
                    event.preventDefault();
                    event.stopPropagation();
                    self.shopSelInv = invSlot.getAttribute('data-shop-inv');
                    self.shopSelStock = null;
                    self.renderShop();
                    return;
                }
                var btn = event.target && event.target.closest && event.target.closest('[data-shop-action]');
                if (!btn) {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                btn.blur();
                var action = btn.getAttribute('data-shop-action');
                var qtyAttr = btn.getAttribute('data-shop-qty');
                if (action === 'close') {
                    self.hideShop();
                    return;
                }
                if (action === 'buy') {
                    self.shopBuy(qtyAttr);
                    return;
                }
                if (action === 'sell') {
                    self.shopSell(qtyAttr);
                }
            });
        }
        if (this.el.bank) {
            this.el.bank.addEventListener('click', function (event) {
                var slot = event.target && event.target.closest && event.target.closest('[data-bank-item]');
                if (slot) {
                    event.preventDefault();
                    event.stopPropagation();
                    slot.blur();
                    self.bankSel = slot.getAttribute('data-bank-item');
                    self.renderBank();
                    return;
                }
                var tabBtn = event.target && event.target.closest && event.target.closest('[data-bank-tab]');
                if (tabBtn) {
                    event.preventDefault();
                    event.stopPropagation();
                    tabBtn.blur();
                    self.bankTab = tabBtn.getAttribute('data-bank-tab') || 'all';
                    self.renderBank();
                    return;
                }
                var btn = event.target && event.target.closest && event.target.closest('[data-bank-action]');
                if (!btn) {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                btn.blur();
                self.chooseBankAction(btn.getAttribute('data-bank-action'));
            });
        }
        if (this.el.station) {
            this.el.station.addEventListener('click', function (event) {
                var select = event.target && event.target.closest && event.target.closest('[data-station-select]');
                if (select) {
                    event.preventDefault();
                    event.stopPropagation();
                    select.blur();
                    self.stationSel = select.getAttribute('data-station-select');
                    self.renderStation();
                    return;
                }
                var recipe = event.target && event.target.closest && event.target.closest('[data-station-recipe]');
                if (recipe) {
                    event.preventDefault();
                    event.stopPropagation();
                    recipe.blur();
                    self.chooseStationRecipe(recipe.getAttribute('data-station-recipe'));
                    return;
                }
                var actionBtn = event.target && event.target.closest && event.target.closest('[data-station-action]');
                if (!actionBtn) {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                actionBtn.blur();
                var action = actionBtn.getAttribute('data-station-action');
                if (action === 'close') {
                    self.hideStation();
                    return;
                }
                if (action === 'cook') {
                    self.chooseStationCook(actionBtn.getAttribute('data-station-qty'));
                }
            });
        }
        if (this.el.bankSearch) {
            this.el.bankSearch.addEventListener('input', function () {
                self.renderBank();
            });
        }
        if (this.el.bankQty) {
            this.el.bankQty.addEventListener('keydown', function (event) {
                if (event.code === 'Enter' || event.key === 'Enter') {
                    event.preventDefault();
                    self.chooseBankAction('withdraw-x');
                }
            });
        }
        if (this.el.dialogue) {
            this.el.dialogue.addEventListener('click', function (event) {
                var closeBtn = event.target && event.target.closest && event.target.closest('#btn-dialogue-close');
                if (closeBtn) {
                    event.preventDefault();
                    event.stopPropagation();
                    closeBtn.blur();
                    self.hideDialogue();
                    return;
                }
                var btn = event.target && event.target.closest && event.target.closest('[data-dialogue-option]');
                if (btn) {
                    event.preventDefault();
                    event.stopPropagation();
                    btn.blur();
                    self.chooseDialogueOption(btn.getAttribute('data-dialogue-option'));
                    return;
                }
                event.preventDefault();
                self.advanceDialogue();
            });
        }
        window.addEventListener('keydown', function (event) {
            var isSpace = event.code === 'Space' || event.key === ' ' || event.key === 'Spacebar';
            if (isSpace && self.dialogueOpen()) {
                if (window.Keys && Keys.typing(event)) {
                    return;
                }
                event.preventDefault();
                if (event.repeat) {
                    return;
                }
                if (document.activeElement && document.activeElement.blur) {
                    document.activeElement.blur();
                }
                /* Consume so WorldScene update does not also advance. */
                if (window.Keys && Keys.pressed) {
                    Keys.pressed.Space = false;
                }
                self.advanceDialogue();
                return;
            }
            if (event.code === 'Escape' && self.el.levelUp && !self.el.levelUp.hidden) {
                self.hideLevelUp();
                return;
            }
            if (event.code === 'Escape' && self.dialogueOpen()) {
                self.hideDialogue();
                return;
            }
            if (event.code === 'Escape' && self.el.shop && !self.el.shop.hidden) {
                self.hideShop();
                return;
            }
            if (event.code === 'Escape' && self.el.bank && !self.el.bank.hidden) {
                self.hideBank();
                return;
            }
            if (event.code === 'Escape' && self.el.station && !self.el.station.hidden) {
                self.hideStation();
                return;
            }
            if (event.code === 'Escape' && self.el.worldMap && !self.el.worldMap.hidden) {
                self.hideWorldMap();
            }
            if (event.code === 'Escape' && self.useOnId) {
                self.clearUseOn();
            }
            if (event.code === 'F9') {
                if (window.Keys && Keys.typing(event)) {
                    return;
                }
                event.preventDefault();
                self.toggleCollisionDebug();
                return;
            }
            var tabs = {
                F1: 'inv', F2: 'combat', F3: 'skills', F4: 'quest',
                F5: 'equip', F6: 'prayer', F7: 'magic', F8: 'settings'
            };
            var tab = tabs[event.code];
            if (!tab) {
                return;
            }
            event.preventDefault();
            self.showTab(tab);
        }, true);
    },

    bindHudBlur: function () {
        document.addEventListener('mouseup', function (event) {
            if (event.target && event.target.closest && event.target.closest('#title-overlay, #dead-overlay, #world-map-overlay, #dialogue-overlay, #shop-overlay, #bank-overlay, #station-overlay')) {
                return;
            }
            var btn = event.target && event.target.closest && event.target.closest('#shell button');
            if (btn) {
                btn.blur();
            }
        }, true);
    },

    showTab: function (id) {
        this.tab = id;
        var vue = this.vueState();
        var panels;
        var p;
        if (vue) {
            vue.tab = id;
        }
        if (this.el && this.el.tabs) {
            var buttons = this.el.tabs.querySelectorAll('button');
            for (var b = 0; b < buttons.length; b++) {
                buttons[b].classList.toggle('is-on', buttons[b].getAttribute('data-tab') === id);
            }
        }
        panels = document.querySelectorAll('.tab-panel');
        for (p = 0; p < panels.length; p++) {
            panels[p].hidden = panels[p].id !== ('panel-' + id);
        }
    },

    hero: function () {
        return window.game ? window.game.registry.get('hero') : null;
    },

    saveHero: function (hero) {
        if (typeof normalizeHeroCombat === 'function') {
            normalizeHeroCombat(hero);
        }
        if (window.game) {
            window.game.registry.set('hero', hero);
        }
        var world = window.game && window.game.scene.getScene('WorldScene');
        if (world && world.scene.isActive() && world.refreshHud) {
            world.refreshHud();
        } else {
            this.renderHero(hero);
        }
        if (this.mode === 'world' || this.mode === 'dead') {
            this.saveGame();
        }
    },

    setStyle: function (style) {
        var hero = this.hero();
        var labels;
        var label;
        if (!hero || !style) {
            return false;
        }
        labels = typeof styleLabelsForHero === 'function' ? styleLabelsForHero(hero) : null;
        if (style === 'aggressive' && labels && labels.powerKey) {
            style = labels.powerKey;
        }
        hero.style = style;
        this.saveHero(hero);
        this.renderStyles(hero);
        label = style === 'shared' ? 'Shared'
            : (labels && style === labels.powerKey ? labels.power
                : (style === 'accurate' ? (labels && labels.accurate) || 'Accurate'
                    : (style === 'defensive' ? (labels && labels.defensive) || 'Defensive' : style)));
        this.log('Combat style: ' + label + '.');
        return true;
    },

    useItem: function (id) {
        var hero = this.hero();
        if (!hero || !id) {
            return;
        }
        if (this.mode === 'title' || this.mode === 'dead') {
            return;
        }
        if (this.alchArmed) {
            this.castHighAlch(id);
            return;
        }
        if (this.useOnId) {
            if (this.useOnId === id) {
                this.clearUseOn();
                return;
            }
            var world = window.game && window.game.scene.getScene('WorldScene');
            var crafted;
            if (!world || world.encounterLock) {
                this.clearUseOn();
                return;
            }
            crafted = typeof useItemOnItem === 'function'
                ? useItemOnItem(hero, this.useOnId, id, {
                    canLightFire: !!(world.canLightFireAtPlayer && world.canLightFireAtPlayer())
                })
                : null;
            if (crafted && crafted.blocked) {
                this.log('You cannot light a fire here.');
                this.clearUseOn();
                return;
            }
            if (crafted && crafted.ok) {
                this.saveHero(hero);
                if (crafted.groundFire) {
                    if (world.spawnGroundFireAtPlayer) {
                        world.spawnGroundFireAtPlayer(crafted.durationMs);
                    }
                    this.log('You light a fire.');
                } else if (crafted.made) {
                    this.log('You stitch the leather into ' + itemName(crafted.made) + '.');
                } else {
                    this.log('You stitch the leather.');
                }
                this.clearUseOn();
                return;
            }
            this.log('Nothing interesting happens.');
            this.clearUseOn();
            return;
        }
        var def = ITEM_DB[id];
        if (this.mode === 'battle') {
            if (def && def.heal && this.canBattleAct()) {
                this.selectingEnemy = false;
                this.setActionsEnabled(false);
                this.battle.receivePlayerSelection('heal', this.battle.targetIndex, id);
                return;
            }
            this.log('Use Eat food on your combat turn.');
            return;
        }
        var verb = typeof itemDefaultVerb === 'function' ? itemDefaultVerb(id) : null;
        if (verb === 'eat' || (def && def.heal)) {
            if (hero.hp >= hero.maxHp) {
                this.log('You are already at full health.');
                return;
            }
            var eaten = eatItem(hero, id);
            if (!eaten) {
                this.log('You do not have that.');
                return;
            }
            this.saveHero(hero);
            this.log('You eat ' + eaten.name + ' and recover ' + eaten.heal + ' HP.');
            if (window.Sfx && Sfx.eat) {
                Sfx.eat();
            }
            if (hero.diary) {
                hero.diary.eat = true;
                this.saveHero(hero);
            }
            var worldEat = window.game && window.game.scene.getScene('WorldScene');
            if (worldEat && worldEat.checkDiaryComplete) {
                worldEat.checkDiaryComplete(hero);
            }
            return;
        }
        if (verb === 'drink') {
            var drunk = typeof drinkItem === 'function' ? drinkItem(hero, id) : null;
            if (!drunk) {
                this.log('You do not have that.');
                return;
            }
            this.saveHero(hero);
            this.log('You drink the ' + drunk.name +
                (drunk.bonus ? (' (+' + drunk.bonus + ' damage briefly).') : '.'));
            return;
        }
        if (verb === 'wield' || verb === 'wear') {
            this.equipFromInventory(id);
            return;
        }
        if (verb === 'bury') {
            this.buryFromInventory(id);
            return;
        }
        if (verb === 'tan') {
            this.tanFromInventory(id);
            return;
        }
        if (verb === 'examine') {
            this.examineItem(id);
            return;
        }
        if (verb === 'use') {
            this.beginUseOn(id);
            return;
        }
        if (verb === 'drop') {
            this.dropItem(id);
            return;
        }
        this.beginUseOn(id);
    },

    equipFromInventory: function (id) {
        var hero = this.hero();
        if (!hero || !id || this.mode !== 'world') {
            return false;
        }
        var world = window.game && window.game.scene.getScene('WorldScene');
        if (!world || world.encounterLock) {
            return false;
        }
        var verb = typeof itemEquipVerb === 'function' ? itemEquipVerb(id) : null;
        if (!verb) {
            this.log(itemName(id) + '.');
            return false;
        }
        var slot = itemEquipSlot(id);
        var already = !!(hero.equipment && hero.equipment[slot] === id);
        var had = heroHasItem(hero, id);
        if (!equipItem(hero, id)) {
            if (already && !had) {
                this.log('You already have a ' + itemName(id) + ' equipped.');
            } else if (!had) {
                this.log('You do not have that.');
            } else {
                this.log('inventory full');
            }
            return false;
        }
        this.saveHero(hero);
        this.log('You ' + verb + ' the ' + itemName(id) + '.');
        return true;
    },

    unequipWorn: function (slot) {
        var hero = this.hero();
        if (!hero || !slot || this.mode !== 'world') {
            return false;
        }
        var world = window.game && window.game.scene.getScene('WorldScene');
        if (!world || world.encounterLock) {
            return false;
        }
        var id = hero.equipment && hero.equipment[slot];
        if (!id) {
            return false;
        }
        if (!unequipItem(hero, slot)) {
            this.log('inventory full');
            return false;
        }
        this.saveHero(hero);
        this.log('You remove the ' + itemName(id) + '.');
        return true;
    },

    dropItem: function (id, qty) {
        var world = window.game && window.game.scene.getScene('WorldScene');
        if (!world || !world.dropFromInventory) {
            return false;
        }
        return world.dropFromInventory(id, qty || 1);
    },

    togglePrayer: function (id) {
        var hero = this.hero();
        var on;
        if (!hero || this.mode === 'title' || this.mode === 'dead') {
            return;
        }
        if (!hero.prayers) {
            hero.prayers = { thickskin: false, burststrength: false };
        }
        if (typeof hero.prayerPoints !== 'number') {
            hero.prayerPoints = heroSkillLevel(hero, 'prayer');
            hero.maxPrayerPoints = hero.prayerPoints;
        }
        on = !hero.prayers[id];
        if (on && hero.prayerPoints < 1) {
            this.log('You need more prayer points.');
            return;
        }
        hero.prayers[id] = on;
        this.saveHero(hero);
        this.renderPrayers(hero);
        this.log((id === 'thickskin' ? 'Thick Skin' : 'Burst of Strength') + (on ? ' on.' : ' off.'));
    },

    renderPrayers: function (hero) {
        var points = hero && typeof hero.prayerPoints === 'number' ? hero.prayerPoints : 1;
        var max = hero && typeof hero.maxPrayerPoints === 'number' ? hero.maxPrayerPoints : points;
        var buttons;
        var i;
        var id;
        this.paintStatBar(
            document.getElementById('prayer-fill'),
            document.getElementById('prayer-points'),
            points,
            max,
            '#c9a227',
            points + ' / ' + max
        );
        buttons = document.querySelectorAll('[data-prayer]');
        for (i = 0; i < buttons.length; i++) {
            id = buttons[i].getAttribute('data-prayer');
            buttons[i].classList.toggle('is-on', !!(hero && hero.prayers && hero.prayers[id]));
        }
    },

    exportSavePrompt: function () {
        var json = typeof exportSaveJson === 'function' && window.game
            ? exportSaveJson(window.game.registry)
            : '';
        if (!json) {
            this.log('Nothing to export.');
            return;
        }
        window.prompt('Copy your Emberwood save JSON:', json);
    },

    importSavePrompt: function () {
        var text = window.prompt('Paste Emberwood save JSON:');
        var data;
        if (!text) {
            return;
        }
        data = typeof importSaveJson === 'function' ? importSaveJson(text) : null;
        if (!data) {
            this.log('Import failed.');
            return;
        }
        if (data.tooNew) {
            this.log('Save is from a newer Emberwood.');
            return;
        }
        this.log('Save imported. Continue from the title screen.');
        this.refreshTitleSaveButtons();
    },

    buryFromInventory: function (id) {
        var hero = this.hero();
        if (!hero || !id || this.mode !== 'world') {
            return false;
        }
        var world = window.game && window.game.scene.getScene('WorldScene');
        if (!world || world.encounterLock) {
            return false;
        }
        if (typeof buryItem !== 'function' || !buryItem(hero, id)) {
            this.log('You do not have that.');
            return false;
        }
        this.saveHero(hero);
        this.log('You bury the bones.');
        if (hero.diary) {
            hero.diary.bury = true;
            this.saveHero(hero);
        }
        var world = window.game && window.game.scene.getScene('WorldScene');
        if (world && world.noteTutorial) {
            world.noteTutorial('bury');
        }
        if (world && world.checkDiaryComplete) {
            world.checkDiaryComplete(hero);
        }
        return true;
    },

    tanFromInventory: function (id) {
        var hero = this.hero();
        var result;
        if (!hero || !id || this.mode !== 'world') {
            return false;
        }
        var world = window.game && window.game.scene.getScene('WorldScene');
        if (!world || world.encounterLock) {
            return false;
        }
        result = typeof tanCowhide === 'function' ? tanCowhide(hero, id) : null;
        if (!result) {
            this.log('You do not have that.');
            return false;
        }
        if (!result.ok) {
            this.log('inventory full');
            return false;
        }
        this.saveHero(hero);
        this.log('You tan the cowhide.');
        return true;
    },

    castCombatSpell: function (spellId) {
        var world = window.game && window.game.scene.getScene('WorldScene');
        if (world && world.overworldFight && world.castOverworldSpell) {
            return world.castOverworldSpell(spellId);
        }
        if (spellId === 'windstrike') {
            return this.castWindStrike();
        }
        var hero = this.hero();
        var cast = typeof spellCastFn === 'function' ? spellCastFn(spellId) : null;
        var result = cast && hero ? cast(hero) : null;
        if (!result) {
            this.log('You do not have the runes for that spell.');
            return false;
        }
        this.saveHero(hero);
        this.log('You cast ' + (result.label || spellId) + '.');
        return true;
    },

    castWindStrike: function () {
        var hero = this.hero();
        var world;
        if (!hero || this.mode === 'title' || this.mode === 'dead') {
            return false;
        }
        world = window.game && window.game.scene.getScene('WorldScene');
        if (world && world.overworldFight) {
            return world.castOverworldSpell('windstrike');
        }
        if (this.mode === 'battle') {
            if (!this.canBattleAct()) {
                this.log('Cast Wind Strike on your combat turn.');
                return false;
            }
            this.selectingEnemy = false;
            this.setActionsEnabled(false);
            this.battle.receivePlayerSelection('windstrike', this.battle.targetIndex);
            return true;
        }
        if (!world || world.encounterLock) {
            return false;
        }
        if (typeof hasWindStrikeRunes === 'function' && !hasWindStrikeRunes(hero)) {
            this.log('You do not have the runes for Wind Strike.');
            return false;
        }
        if (typeof windStrike !== 'function' || !windStrike(hero)) {
            this.log('You do not have the runes for Wind Strike.');
            return false;
        }
        this.saveHero(hero);
        this.log('You cast Wind Strike.');
        return true;
    },

    beginHighAlch: function () {
        var hero = this.hero();
        if (!hero || this.mode !== 'world') {
            return false;
        }
        if (typeof hasHighAlchRunes === 'function' && !hasHighAlchRunes(hero)) {
            this.log('You need 5 Fire runes.');
            return false;
        }
        this.alchArmed = true;
        this.clearUseOn();
        this.log('High Alchemy -> choose an inventory item.');
        this.showTab('inv');
        return true;
    },

    castHighAlch: function (id) {
        var hero = this.hero();
        var result;
        if (!hero || !id || this.mode !== 'world') {
            this.alchArmed = false;
            return false;
        }
        result = typeof highAlchItem === 'function' ? highAlchItem(hero, id) : null;
        this.alchArmed = false;
        if (!result) {
            this.log('Nothing interesting happens.');
            return false;
        }
        if (!result.ok) {
            if (result.need === 'runes') {
                this.log('You need 5 Fire runes.');
            } else {
                this.log('Nothing interesting happens.');
            }
            return false;
        }
        this.saveHero(hero);
        this.log('You convert the ' + itemName(id) + ' into ' + result.coins + ' coins.');
        return true;
    },

    examineItem: function (id) {
        if (!id) {
            return false;
        }
        var line = typeof itemExamineText === 'function' ? itemExamineText(id) : '';
        if (!line) {
            return false;
        }
        this.log(line);
        return true;
    },

    showSkillXp: function (id) {
        var named = typeof SKILL_NAMES !== 'undefined'
            ? SKILL_NAMES.filter(function (n) { return n[0] === id; })[0]
            : null;
        if (!named) {
            return false;
        }
        var hero = this.hero();
        var skill = hero && hero.skills && hero.skills[id];
        var line = typeof skillXpText === 'function' ? skillXpText(named[1], skill) : named[1];
        this.log(line);
        var world = window.game && window.game.scene.getScene('WorldScene');
        var playable = ['slayer', 'runecraft', 'farming', 'herblore', 'fletching', 'construction'];
        if (world && world.tryStretchSkillAction && playable.indexOf(id) !== -1) {
            world.tryStretchSkillAction(id);
        }
        return true;
    },

    ensureXpDrops: function () {
        if (this.el && this.el.xpDrops && this.el.xpDrops.parentNode) {
            return this.el.xpDrops;
        }
        var host = document.getElementById('xp-drops');
        if (!host) {
            var parent = document.getElementById('content') || document.body;
            host = document.createElement('div');
            host.id = 'xp-drops';
            parent.appendChild(host);
        }
        if (this.el) {
            this.el.xpDrops = host;
        }
        return host;
    },

    ensureLevelUpModal: function () {
        var host = this.el && this.el.levelUp && this.el.levelUp.parentNode
            ? this.el.levelUp
            : document.getElementById('level-up-overlay');
        if (!host) {
            var parent = document.getElementById('content') || document.body;
            host = document.createElement('div');
            host.id = 'level-up-overlay';
            host.hidden = true;
            host.innerHTML = '<div class="level-up-card" role="dialog" aria-labelledby="level-up-title">' +
                '<img id="level-up-icon" class="pix" alt="">' +
                '<h2 id="level-up-title">Level up</h2>' +
                '<p id="level-up-copy"></p>' +
                '<button type="button" id="btn-level-up-close">Continue</button>' +
                '</div>';
            parent.appendChild(host);
        }
        if (this.el) {
            this.el.levelUp = host;
            this.el.levelUpIcon = host.querySelector('#level-up-icon');
            this.el.levelUpTitle = host.querySelector('#level-up-title');
            this.el.levelUpCopy = host.querySelector('#level-up-copy');
            this.el.levelUpClose = host.querySelector('#btn-level-up-close');
        }
        if (!host.getAttribute('data-bound')) {
            var self = this;
            host.setAttribute('data-bound', '1');
            host.addEventListener('click', function (event) {
                var close = event.target && event.target.closest && event.target.closest('#btn-level-up-close');
                if (event.target === host || close) {
                    self.hideLevelUp();
                }
            });
        }
        if (this.el && this.el.questComplete && !this.el.questComplete._bound) {
            this.el.questComplete._bound = true;
            this.el.questComplete.addEventListener('click', function (event) {
                var close = event.target && event.target.closest && event.target.closest('#btn-quest-complete-close');
                if (event.target === self.el.questComplete || close) {
                    self.hideQuestComplete();
                }
            });
        }
        return host;
    },

    showLevelUp: function (skill, name, level) {
        var n = Number(level);
        var host;
        var shown;
        if (!name || !(n > 0)) {
            return null;
        }
        shown = String(Math.floor(n));
        var article = /^[aeiou]/i.test(name) ? 'an' : 'a';
        this.log('Congratulations, you just advanced ' + article + ' ' + name + ' level.', 'chat-fanfare');
        this.log('Your ' + name + ' level is now ' + shown + '.', 'chat-fanfare');
        this.log(name + ' increased to ' + shown + '.');
        host = this.ensureLevelUpModal();
        if (!host) {
            return null;
        }
        host.setAttribute('data-skill', skill || '');
        host.setAttribute('data-level', shown);
        if (this.el.levelUpIcon) {
            this.el.levelUpIcon.alt = name;
            this.el.levelUpIcon.src = typeof skillIcon === 'function'
                ? skillIcon(skill)
                : ('assets/svg/skills/' + skill + '.svg');
        }
        if (this.el.levelUpTitle) {
            this.el.levelUpTitle.textContent = 'Congratulations!';
        }
        if (this.el.levelUpCopy) {
            this.el.levelUpCopy.textContent = 'Your ' + name + ' level is now ' + shown + '.';
        }
        host.hidden = false;
        if (window.Sfx && Sfx.levelUp) {
            Sfx.levelUp();
        }
        return host;
    },

    hideLevelUp: function () {
        var host = this.el && this.el.levelUp;
        if (host) {
            host.hidden = true;
        }
        if (this.el && this.el.levelUpClose) {
            this.el.levelUpClose.blur();
        }
    },

    showQuestComplete: function (title, copy) {
        var host = this.el && this.el.questComplete;
        if (!host) {
            return null;
        }
        if (this.el.questCompleteCopy) {
            this.el.questCompleteCopy.textContent = copy || 'Quest complete.';
        }
        var titleEl = document.getElementById('quest-complete-title');
        if (titleEl) {
            titleEl.textContent = title || 'Quest complete';
        }
        host.hidden = false;
        this.log(copy || 'Quest complete.', 'chat-fanfare');
        return host;
    },

    hideQuestComplete: function () {
        if (this.el && this.el.questComplete) {
            this.el.questComplete.hidden = true;
        }
        if (this.el && this.el.questCompleteClose) {
            this.el.questCompleteClose.blur();
        }
    },

    renderQuestJournal: function (quest) {
        var stage = quest && quest.stage != null ? quest.stage : 0;
        var progress = quest && quest.progress != null ? quest.progress : 0;
        var goal = quest && quest.goal != null ? quest.goal : 5;
        var qp = quest && quest.points != null ? quest.points : 0;
        var steps = [
            { label: 'Talk to Guildmaster Bram', done: stage >= 1 },
            { label: 'Kill goblins in Northwood (' + Math.min(progress, goal) + '/' + goal + ')', done: stage >= 2 || (stage === 1 && progress >= goal) },
            { label: 'Return to Bram for your reward', done: stage >= 3 }
        ];
        var html = '';
        var i;
        if (this.el && this.el.questPoints) {
            this.el.questPoints.textContent = 'Quest points: ' + qp;
        }
        if (!this.el || !this.el.questChecklist) {
            return;
        }
        for (i = 0; i < steps.length; i++) {
            if (stage < 1 && i > 0) {
                continue;
            }
            if (stage < 2 && i > 1 && stage < 1) {
                continue;
            }
            if (stage === 0 && i > 0) {
                continue;
            }
            if (stage === 1 && i > 1) {
                continue;
            }
            html += '<li' + (steps[i].done ? ' class="is-done"' : '') + '>' + steps[i].label + '</li>';
        }
        if (stage >= 3) {
            html = '';
            for (i = 0; i < steps.length; i++) {
                html += '<li class="is-done">' + steps[i].label + '</li>';
            }
        }
        this.el.questChecklist.innerHTML = html;
    },

    showXpDrop: function (skill, amount) {
        var n = Number(amount);
        if (!skill || !(n > 0)) {
            return null;
        }
        var shown = String(Math.floor(n));
        var host = this.ensureXpDrops();
        if (!host) {
            return null;
        }
        var row = document.createElement('div');
        row.className = 'xp-drop';
        row.setAttribute('data-skill', skill);
        row.setAttribute('data-xp', shown);
        var img = document.createElement('img');
        img.className = 'pix';
        img.alt = '';
        img.src = typeof skillIcon === 'function' ? skillIcon(skill) : ('assets/svg/skills/' + skill + '.svg');
        var num = document.createElement('span');
        num.className = 'xp-drop-amt';
        num.textContent = shown;
        row.appendChild(img);
        row.appendChild(num);
        host.appendChild(row);
        window.setTimeout(function () {
            if (row.parentNode) {
                row.parentNode.removeChild(row);
            }
        }, 1600);
        return row;
    },

    beginUseOn: function (id) {
        var hero = this.hero();
        if (!id || this.mode !== 'world' || !hero || !heroHasItem(hero, id)) {
            this.clearUseOn();
            return false;
        }
        this.hideContextMenu();
        this.useOnId = id;
        if (this.el && this.el.shell) {
            this.el.shell.classList.add('is-use-on');
        }
        this.log('Use ' + itemName(id) + ' ->');
        return true;
    },

    clearUseOn: function () {
        this.useOnId = null;
        if (this.el && this.el.shell) {
            this.el.shell.classList.remove('is-use-on');
        }
    },

    finishUseOn: function (kind) {
        var id = this.useOnId;
        var hero;
        var result;
        if (!id || this.mode !== 'world') {
            this.clearUseOn();
            return false;
        }
        if (!kind || typeof itemCanUseOn !== 'function' || !itemCanUseOn(id, kind)) {
            this.log('Nothing interesting happens.');
            this.clearUseOn();
            return false;
        }
        hero = this.hero();
        result = typeof useItemOnScenery === 'function' ? useItemOnScenery(hero, id, kind) : null;
        if (!result) {
            this.log('You do not have that.');
            this.clearUseOn();
            return false;
        }
        if (!result.ok) {
            this.log('inventory full');
            this.clearUseOn();
            return false;
        }
        this.saveHero(hero);
        if (result.buried) {
            this.log('You offer the bones at the shrine.');
        } else if (result.burned) {
            this.log('You accidentally burn the ' + itemName(id) + '.');
        } else if (result.cooked) {
            this.log('You cook the ' + itemName(id) + ' on the ' + itemUseTargetName(kind) + '.');
        } else {
            this.log('You use the ' + itemName(id) + ' on the ' + itemUseTargetName(kind) + '.');
        }
        this.clearUseOn();
        return true;
    },

    showInvDropMenu: function (id, event) {
        if (this.mode !== 'world' || !id) {
            this.hideContextMenu();
            return;
        }
        var items = [];
        var seen = {};
        var def = ITEM_DB[id] || {};
        var verb = typeof itemDefaultVerb === 'function'
            ? itemDefaultVerb(id)
            : (typeof itemEquipVerb === 'function' ? itemEquipVerb(id) : 'use');
        var equipVerb = typeof itemEquipVerb === 'function' ? itemEquipVerb(id) : null;
        function pushAction(action, text) {
            if (!action || seen[action]) {
                return;
            }
            seen[action] = true;
            items.push({
                label: text || (typeof itemDefaultVerbLabel === 'function'
                    ? itemDefaultVerbLabel(action)
                    : action),
                action: action
            });
        }
        pushAction(verb || 'use');
        if (def.heal) {
            pushAction('eat', 'Eat');
        }
        if (def.drink || id === 'attackpot') {
            pushAction('drink', 'Drink');
        }
        if (equipVerb) {
            pushAction(equipVerb);
        }
        if (def.bury) {
            pushAction('bury', 'Bury');
        }
        if (def.tan) {
            pushAction('tan', 'Tan');
        }
        pushAction('use', 'Use');
        pushAction('drop', 'Drop');
        pushAction('examine', 'Examine');
        this.showContextMenu(items, {
            kind: 'inv',
            itemId: id,
            clientX: event && event.clientX != null ? event.clientX : 16,
            clientY: event && event.clientY != null ? event.clientY : 16
        });
    },

    showEquipRemoveMenu: function (slot, event) {
        if (this.mode !== 'world' || !slot) {
            this.hideContextMenu();
            return;
        }
        this.showContextMenu([{ label: 'Remove', action: 'remove' }], {
            kind: 'equip',
            slot: slot,
            clientX: event && event.clientX != null ? event.clientX : 16,
            clientY: event && event.clientY != null ? event.clientY : 16
        });
    },

    onStart: function () {
        if (typeof hasSave === 'function' && hasSave()) {
            if (!window.confirm('Start a new game? This will wipe your Emberwood save.')) {
                return;
            }
            if (typeof clearSave === 'function') {
                clearSave();
            }
            this._loadSave = false;
            this._pendingSave = null;
            if (window.game && window.game.registry) {
                window.game.registry.set('resumeAt', null);
                window.game.registry.set('playerX', null);
                window.game.registry.set('playerY', null);
                window.game.registry.set('interiorId', null);
                window.game.registry.set('dungeonFloor', 0);
                window.game.registry.set('dungeonEscapeFloor', 0);
                window.game.registry.set('facing', 'down');
                window.game.registry.set('worldSave', null);
            }
        }
        var iron = document.getElementById('ironman-toggle');
        this._ironmanNewGame = !!(iron && iron.checked);
        if (this._startHandler) {
            this._startHandler();
        }
    },

    onContinue: function () {
        var data = typeof readSave === 'function' ? readSave() : null;
        if (!data || data.tooNew || !data.hero) {
            if (data && data.tooNew) {
                this.log('Save is from a newer Emberwood. Resetting.');
                if (typeof clearSave === 'function') {
                    clearSave();
                }
            }
            return;
        }
        this._loadSave = true;
        this._pendingSave = data;
        if (this._startHandler) {
            this._startHandler();
        }
    },

    refreshTitleSaveButtons: function () {
        var vue = this.vueState();
        var canContinue = typeof hasSave === 'function' && hasSave();
        if (vue) {
            vue.continueEnabled = canContinue;
            vue.startEnabled = true;
        }
        if (this.el && this.el.start) {
            this.el.start.disabled = false;
        }
    },

    setStartHandler: function (fn) {
        this._startHandler = fn;
        this.refreshTitleSaveButtons();
    },

    applyPendingSave: function (registry) {
        var data = this._pendingSave;
        this._pendingSave = null;
        this._loadSave = false;
        if (!data || !data.hero || !registry) {
            return false;
        }
        if (typeof normalizeHeroCombat === 'function') {
            normalizeHeroCombat(data.hero);
        }
        registry.set('hero', data.hero);
        registry.set('quest', data.quest || { id: 'goblins', stage: 0, progress: 0, goal: 5, points: 0 });
        registry.set('zone', data.zone || 'haven');
        registry.set('dungeonFloor', typeof data.dungeonFloor === 'number' ? data.dungeonFloor : 0);
        registry.set('dungeonEscapeFloor', typeof data.dungeonEscapeFloor === 'number' ? data.dungeonEscapeFloor : 0);
        registry.set('facing', data.facing === 'left' || data.facing === 'right'
            || data.facing === 'up' || data.facing === 'down' ? data.facing : 'down');
        registry.set('worldSave', data.world || null);
        if (typeof data.playerX === 'number' && typeof data.playerY === 'number') {
            registry.set('resumeAt', {
                x: data.playerX,
                y: data.playerY,
                interiorId: data.interiorId || null,
                dungeonFloor: typeof data.dungeonFloor === 'number' ? data.dungeonFloor : 0
            });
            registry.set('playerX', data.playerX);
            registry.set('playerY', data.playerY);
            registry.set('interiorId', data.interiorId || null);
        } else {
            registry.set('resumeAt', null);
            registry.set('playerX', null);
            registry.set('playerY', null);
            registry.set('interiorId', null);
        }
        return true;
    },

    syncSavePosition: function () {
        var world;
        if (!window.game || !window.game.registry) {
            return;
        }
        world = window.game.scene.getScene('WorldScene');
        /* getScene still returns a shut-down WorldScene after death; exporting then
           touches destroyed time/physics and throws (breaking Respawn). */
        if (!world || !world.player || !world.scene || !world.scene.isActive()) {
            return;
        }
        window.game.registry.set('zone', world.zoneId || window.game.registry.get('zone') || 'haven');
        window.game.registry.set('playerX', world.player.x);
        window.game.registry.set('playerY', world.player.y);
        window.game.registry.set('interiorId', world.interiorId || null);
        window.game.registry.set('dungeonFloor', world.dungeonFloor || 0);
        window.game.registry.set(
            'dungeonEscapeFloor',
            window.game.registry.get('dungeonEscapeFloor') || 0
        );
        window.game.registry.set('facing', world.lastFacing || 'down');
        if (typeof world.exportWorldSave === 'function') {
            window.game.registry.set('worldSave', world.exportWorldSave());
        }
    },

    saveGame: function () {
        if (!window.game || this.mode === 'battle' || this.mode === 'title') {
            return false;
        }
        this.syncSavePosition();
        return typeof writeSave === 'function' ? writeSave(window.game.registry) : false;
    },

    bindAutosave: function () {
        var self = this;
        if (this._autosaveBound) {
            return;
        }
        this._autosaveBound = true;
        window.addEventListener('pagehide', function () {
            self.saveGame();
        });
        window.addEventListener('beforeunload', function () {
            self.saveGame();
        });
        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'hidden') {
                self.saveGame();
            }
        });
    },

    logoutToTitle: function () {
        this.saveGame();
        this.hideShop();
        this.hideBank();
        this.hideStation();
        this.hideDialogue();
        this.hideQuestComplete();
        this.hideLevelUp();
        if (window.game) {
            window.game.registry.set('autoContinueSave', false);
            window.game.scene.getScenes(true).forEach(function (scene) {
                var key = scene.sys.settings.key;
                if (key && key !== 'TitleScene') {
                    window.game.scene.stop(key);
                }
            });
            window.game.scene.start('TitleScene');
        }
        this.showTitle();
        this.refreshTitleSaveButtons();
        this.log('You log out. Progress saved.');
    },

    setMode: function (mode) {
        this.mode = mode;
        if (window.HudApp && HudApp.syncMode) {
            HudApp.syncMode(mode);
        }
        if (this.el && this.el.shell) {
            this.el.shell.classList.toggle('is-title', mode === 'title');
        }
    },

    showTitle: function () {
        this.hideContextMenu();
        this.hideWorldMap();
        this.hideDialogue();
        this.hideShop();
        this.hideBank();
        this.hideStation();
        this.hideLevelUp();
        this.hideQuestComplete();
        this.clearUseOn();
        this.alchArmed = false;
        this.setMode('title');
        this.refreshTitleSaveButtons();
        if (this.el && this.el.title) {
            this.el.title.hidden = false;
        }
        if (this.el && this.el.battle) {
            this.el.battle.hidden = true;
        }
        if (this.el && this.el.dead) {
            this.el.dead.hidden = true;
        }
    },

    hideTitle: function () {
        /* Mode first so Vue :hidden="!titleVisible" matches before any flush. */
        this.setMode('world');
        var vue = this.vueState();
        if (vue) {
            vue.titleVisible = false;
            vue.shellTitle = false;
        }
        if (this.el && this.el.title) {
            this.el.title.hidden = true;
        }
        if (this.el && this.el.start) {
            this.el.start.blur();
        }
    },

    showDead: function (text) {
        this.hideBattle();
        this.hideContextMenu();
        this.hideWorldMap();
        this.hideDialogue();
        this.hideShop();
        this.hideBank();
        this.hideStation();
        this.hideLevelUp();
        this.clearUseOn();
        var msg = text || 'You have been defeated.';
        var vue = this.vueState();
        if (vue) {
            vue.deadText = msg;
        }
        this.setMode('dead');
        if (this.el && this.el.dead) {
            this.el.dead.hidden = false;
        }
        var deadText = document.getElementById('dead-text');
        if (deadText && !vue) {
            deadText.textContent = msg;
        }
    },

    hideDead: function () {
        var vue = this.vueState();
        if (vue) {
            vue.deadVisible = false;
        }
        if (this.el && this.el.dead) {
            this.el.dead.hidden = true;
        }
    },

    safeDeathHp: function (hero) {
        var maxHp = hero && hero.maxHp > 0 ? hero.maxHp : 10;
        return Math.max(1, Math.floor(maxHp / 10));
    },

    respawnInHaven: function () {
        var hero = this.hero();
        var reg;
        var spawn;
        var world;
        if (hero) {
            hero.hp = this.safeDeathHp(hero);
            if (typeof normalizeHeroCombat === 'function') {
                normalizeHeroCombat(hero);
            }
            /* Avoid saveHero here: while GameOver is up, WorldScene is stopped and
               saveGame → syncSavePosition → exportWorldSave used to throw. */
            if (window.game) {
                window.game.registry.set('hero', hero);
            }
        }
        this.hideDead();
        this.setMode('world');
        if (hero) {
            this.renderHero(hero);
        }
        if (!window.game) {
            return;
        }
        reg = window.game.registry;
        reg.set('zone', 'haven');
        reg.set('battleOutcome', null);
        reg.set('resumeAt', null);
        reg.set('interiorId', null);
        reg.set('dungeonFloor', 0);
        if (typeof defaultWorldSpawn === 'function') {
            spawn = defaultWorldSpawn();
            reg.set('playerX', spawn.x);
            reg.set('playerY', spawn.y);
        } else {
            reg.set('playerX', null);
            reg.set('playerY', null);
        }
        world = window.game.scene.getScene('WorldScene');
        /* Overworld death sleeps World under GameOver so graves stay in memory;
           battle death stops World and relies on worldSave + a fresh start. */
        if (world && world.player && world.respawnInHaven
            && (window.game.scene.isActive('WorldScene') || window.game.scene.isSleeping('WorldScene'))) {
            if (window.game.scene.isSleeping('WorldScene')) {
                window.game.scene.wake('WorldScene');
            }
            world.respawnInHaven();
            this.log('You wake in Emberhaven, barely standing.');
            if (window.game.scene.getScene('GameOverScene')) {
                window.game.scene.stop('GameOverScene');
            }
            this.saveGame();
            return;
        }
        reg.set('respawnAfterDeath', true);
        window.game.scene.getScenes(true).forEach(function (scene) {
            var key = scene.sys.settings.key;
            if (key && key !== 'WorldScene') {
                window.game.scene.stop(key);
            }
        });
        if (window.game.scene.isSleeping('WorldScene')) {
            window.game.scene.stop('WorldScene');
        }
        if (window.game.scene.getScene('GameOverScene')) {
            window.game.scene.stop('GameOverScene');
        }
        window.game.scene.start('WorldScene');
    },

    showContextMenu: function (items, pos) {
        var menu = this.el && this.el.ctx;
        if (!menu) {
            return;
        }
        this.ctxTarget = pos || null;
        if (pos && pos.lootPile) {
            this.ctxLootPile = pos.lootPile;
        } else {
            this.ctxLootPile = null;
        }
        menu.innerHTML = '';
        items = items || [];
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (!item || !item.action) {
                continue;
            }
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = item.label || item.action;
            if (item.action === 'take-loot') {
                btn.setAttribute('data-ctx', 'take-loot');
                btn.setAttribute('data-ctx-loot', String(item.lootIndex != null ? item.lootIndex : i));
            } else {
                btn.setAttribute('data-ctx', item.action);
            }
            menu.appendChild(btn);
        }
        /* Same-event mousedown on the canvas must not immediately dismiss this menu. */
        this.ctxIgnoreOutsideClose = true;
        menu.hidden = false;
        var self = this;
        setTimeout(function () {
            self.ctxIgnoreOutsideClose = false;
        }, 0);
        var x = pos && pos.clientX != null ? pos.clientX : 16;
        var y = pos && pos.clientY != null ? pos.clientY : 16;
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        var w = menu.offsetWidth || 110;
        var h = menu.offsetHeight || 28;
        menu.style.left = Math.max(4, Math.min(x, window.innerWidth - w - 4)) + 'px';
        menu.style.top = Math.max(4, Math.min(y, window.innerHeight - h - 4)) + 'px';
    },

    hideContextMenu: function () {
        var menu = this.el && this.el.ctx;
        if (menu) {
            menu.hidden = true;
            menu.innerHTML = '';
            menu.style.left = '';
            menu.style.top = '';
        }
        this.ctxTarget = null;
        this.ctxLootPile = null;
        this.ctxIgnoreOutsideClose = false;
    },

    showWorldMap: function () {
        if (this.mode !== 'world') {
            return;
        }
        this.hideContextMenu();
        this.renderWorldMap();
        if (this.el.worldMap) {
            this.el.worldMap.hidden = false;
        }
        if (this.el.worldMapList) {
            this.el.worldMapList.hidden = false;
        }
    },

    hideWorldMap: function () {
        if (this.el && this.el.worldMap) {
            this.el.worldMap.hidden = true;
            if (this.el.worldMapClose) {
                this.el.worldMapClose.blur();
            }
        }
    },

    startDialogue: function (speaker, pages, options) {
        var clean = [];
        pages = pages || [];
        for (var i = 0; i < pages.length; i++) {
            if (pages[i]) {
                clean.push(pages[i]);
            }
        }
        if (!clean.length) {
            this.hideDialogue();
            return;
        }
        if (!options || !options.length) {
            var world = window.game && window.game.scene.getScene('WorldScene');
            var def = world && world.dialogueNpc && world.dialogueNpc.npcDef;
            options = typeof npcDialogueOptions === 'function' && def
                ? npcDialogueOptions(def)
                : [];
        }
        this.hideContextMenu();
        this.hideShop();
        this.hideBank();
        this.hideStation();
        this.pauseWorldForUi();
        this.dialogue = { speaker: speaker || '', pages: clean, index: 0, options: options };
        this.renderDialogue(true);
    },

    dialogueOpen: function () {
        return !!(this.dialogue && this.el && this.el.dialogue && !this.el.dialogue.hidden);
    },

    interactionPaused: function () {
        return this.dialogueOpen() || this.stationOpen();
    },

    pauseWorldForUi: function () {
        var world = window.game && window.game.scene.getScene('WorldScene');
        if (!world || !world.player) {
            return;
        }
        if (world.clearWalk) {
            world.clearWalk();
        }
        if (world.clearGather) {
            world.clearGather();
        }
        world.talkTarget = null;
        world.engageTarget = null;
        if (world.player.body) {
            world.player.body.setVelocity(0, 0);
        }
    },

    renderDialogue: function (logPage) {
        var overlay = this.el && this.el.dialogue;
        var d = this.dialogue;
        if (!overlay || !d || !d.pages || !d.pages.length) {
            this.hideDialogue();
            return;
        }
        var page = d.pages[d.index];
        overlay.hidden = false;
        overlay.setAttribute('data-page', String(d.index + 1));
        overlay.setAttribute('data-pages', String(d.pages.length));
        if (this.el.dialogueSpeaker) {
            this.el.dialogueSpeaker.textContent = d.speaker;
        }
        if (this.el.dialogueText) {
            this.el.dialogueText.textContent = page;
        }
        if (this.el.dialogueContinue) {
            this.el.dialogueContinue.textContent = d.index >= d.pages.length - 1
                ? 'Click or Space to close'
                : 'Click or Space to continue';
        }
        this.renderDialogueOptions();
        if (logPage) {
            this.log(d.speaker + ': ' + page);
        }
    },

    renderDialogueOptions: function () {
        var row = this.el && this.el.dialogueOptions;
        var overlay = this.el && this.el.dialogue;
        var opts = this.dialogue && this.dialogue.options ? this.dialogue.options : [];
        if (!row) {
            return;
        }
        row.innerHTML = '';
        if (!opts.length) {
            row.hidden = true;
            if (overlay) {
                overlay.removeAttribute('data-options');
            }
            return;
        }
        row.hidden = false;
        var ids = [];
        for (var i = 0; i < opts.length; i++) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.setAttribute('data-dialogue-option', opts[i].id);
            btn.textContent = opts[i].label;
            row.appendChild(btn);
            ids.push(opts[i].id);
        }
        if (overlay) {
            overlay.setAttribute('data-options', ids.join(','));
        }
    },

    chooseDialogueOption: function (id) {
        if (!this.dialogueOpen() || this.mode !== 'world') {
            return;
        }
        var world = window.game && window.game.scene.getScene('WorldScene');
        if (!world || world.encounterLock || !world.chooseDialogueOption) {
            return;
        }
        world.chooseDialogueOption(id);
    },

    advanceDialogue: function () {
        if (!this.dialogueOpen() || !this.dialogue || !this.dialogue.pages) {
            return false;
        }
        /* Last page: Space/click acts as Close. Earlier pages: Continue. */
        if (this.dialogue.index >= this.dialogue.pages.length - 1) {
            this.hideDialogue();
            return true;
        }
        this.dialogue.index += 1;
        this.renderDialogue(true);
        return true;
    },

    hideDialogue: function () {
        this.dialogue = null;
        if (this.el && this.el.dialogue) {
            this.el.dialogue.hidden = true;
            this.el.dialogue.removeAttribute('data-page');
            this.el.dialogue.removeAttribute('data-pages');
            this.el.dialogue.removeAttribute('data-options');
        }
        if (this.el && this.el.dialogueOptions) {
            this.el.dialogueOptions.innerHTML = '';
            this.el.dialogueOptions.hidden = true;
        }
        var world = window.game && window.game.scene.getScene('WorldScene');
        if (world) {
            world.dialogueNpc = null;
        }
    },

    showShop: function (def) {
        if (!this.el || !this.el.shop || this.mode !== 'world') {
            return;
        }
        var hero = this.hero();
        if (hero && hero.ironman) {
            this.log('Ironman accounts cannot trade.');
            return;
        }
        this.hideContextMenu();
        this.hideWorldMap();
        this.hideDialogue();
        this.hideBank();
        this.hideStation();
        var name = def && def.name ? def.name : 'Shopkeeper';
        this.shopKey = (def && def.shopKey)
            || (typeof GENERAL_SHOP_KEY !== 'undefined' ? GENERAL_SHOP_KEY : 'mira');
        this.shopSelStock = null;
        this.shopSelInv = null;
        if (this.el.shopSpeaker) {
            this.el.shopSpeaker.textContent = name;
        }
        if (this.el.shopCopy) {
            this.el.shopCopy.textContent = 'Take a look at the wares.';
        }
        this.el.shop.hidden = false;
        this.el.shop.setAttribute('data-shop', this.shopKey);
        this.log('Take a look at the wares.');
        var world = window.game && window.game.scene.getScene('WorldScene');
        if (world && world.noteTutorial) {
            world.noteTutorial('shop');
        }
        this.renderShop();
    },

    hideShop: function () {
        if (this.el && this.el.shop) {
            this.el.shop.hidden = true;
            this.el.shop.removeAttribute('data-shop');
            if (this.el.shopClose) {
                this.el.shopClose.blur();
            }
        }
        this.shopKey = null;
        this.shopSelStock = null;
        this.shopSelInv = null;
    },

    shopOpen: function () {
        return !!(this.el && this.el.shop && !this.el.shop.hidden);
    },

    showPlayerTrade: function (def) {
        var hero = this.hero();
        if (hero && hero.ironman) {
            this.log('Ironman accounts cannot trade.');
            return;
        }
        this.showShop(def || { name: 'Trader', shopKey: 'mira' });
        if (this.el && this.el.shopCopy) {
            this.el.shopCopy.textContent = 'A travelling trader shows their pack.';
        }
        this.log('Trading with ' + ((def && def.name) || 'a trader') + '.');
    },

    showGrandExchange: function () {
        this.log('The Grand Exchange is frozen. Trade with Mira or Armsman Cole instead.');
    },

    renderHiscores: function () {
        var hero = this.hero();
        var el = document.getElementById('hiscores-panel');
        if (!el || !hero) {
            return;
        }
        var kills = hero.hiscores && hero.hiscores.kills != null ? hero.hiscores.kills : 0;
        var total = typeof skillTotal === 'function' ? skillTotal(hero) : 0;
        el.textContent = 'Local hiscores — Kills: ' + kills + ', Skill total: ' + total + ', Name: ' + (hero.displayName || 'Adventurer');
    },

    renderShop: function () {
        var hero = this.hero();
        var rows;
        var html;
        var i;
        var row;
        var inv;
        var stack;
        var sell;
        var now = (window.game && window.game.scene.getScene('WorldScene') && window.game.scene.getScene('WorldScene').time)
            ? window.game.scene.getScene('WorldScene').time.now
            : Date.now();
        if (!this.el || !this.el.shopStock || !this.el.shopInv || !this.shopOpen()) {
            return;
        }
        rows = typeof shopStockRows === 'function' ? shopStockRows(this.shopKey, now) : [];
        html = '';
        for (i = 0; i < rows.length; i++) {
            row = rows[i];
            html += '<button type="button" data-shop-stock="' + row.id + '"'
                + (this.shopSelStock === row.id ? ' class="is-on"' : '')
                + (row.stock < 1 ? ' disabled' : '') + '>'
                + '<img class="pix" src="' + itemIcon(row.id) + '" alt="">'
                + '<span>' + itemName(row.id) + '</span>'
                + '<span class="shop-meta">' + row.stock + ' · ' + row.buyPrice + 'gp</span>'
                + '</button>';
        }
        this.el.shopStock.innerHTML = html || '<p class="shop-empty">No stock.</p>';
        html = '';
        inv = hero && hero.inventory ? hero.inventory : [];
        for (i = 0; i < inv.length; i++) {
            stack = inv[i];
            if (!stack || !stack.id || stack.id === 'coins') {
                continue;
            }
            sell = typeof itemSellPrice === 'function' ? itemSellPrice(stack.id) : 0;
            if (!(sell > 0)) {
                continue;
            }
            html += '<button type="button" data-shop-inv="' + stack.id + '"'
                + (this.shopSelInv === stack.id ? ' class="is-on"' : '') + '>'
                + '<img class="pix" src="' + itemIcon(stack.id) + '" alt="">'
                + '<span>' + itemName(stack.id) + (stack.qty > 1 ? ' ×' + stack.qty : '') + '</span>'
                + '<span class="shop-meta">' + sell + 'gp</span>'
                + '</button>';
        }
        this.el.shopInv.innerHTML = html || '<p class="shop-empty">Nothing to sell.</p>';
        this.renderHero(hero);
    },

    shopBuy: function (qtyAttr) {
        var hero = this.hero();
        var qty;
        var result;
        var now;
        if (!this.shopOpen() || !this.shopSelStock || !hero) {
            this.log('Select a shop item first.');
            return;
        }
        qty = qtyAttr === 'all' ? 10 : Math.floor(Number(qtyAttr || 1));
        if (!(qty >= 1)) {
            qty = 1;
        }
        now = (window.game && window.game.scene.getScene('WorldScene') && window.game.scene.getScene('WorldScene').time)
            ? window.game.scene.getScene('WorldScene').time.now
            : Date.now();
        result = typeof buyFromShop === 'function'
            ? buyFromShop(hero, this.shopKey, this.shopSelStock, qty, now)
            : null;
        if (!result || !result.ok) {
            if (result && result.gold) {
                this.log('You need more gold.');
            } else if (result && result.full) {
                this.log('inventory full');
            } else if (result && result.stock) {
                this.log('The shop is out of stock.');
            } else {
                this.log('Nothing interesting happens.');
            }
            this.renderShop();
            return;
        }
        this.saveHero(hero);
        this.log('You buy ' + result.qty + ' × ' + itemName(result.id) + ' for ' + result.cost + 'gp.');
        this.renderShop();
    },

    shopSell: function (qtyAttr) {
        var hero = this.hero();
        var qty;
        var have;
        var result;
        if (!this.shopOpen() || !this.shopSelInv || !hero) {
            this.log('Select an inventory item first.');
            return;
        }
        have = typeof itemQty === 'function' ? itemQty(hero, this.shopSelInv) : 0;
        if (qtyAttr === 'all') {
            qty = have;
        } else {
            qty = Math.floor(Number(qtyAttr || 1));
        }
        if (!(qty >= 1)) {
            qty = 1;
        }
        result = typeof sellToShop === 'function'
            ? sellToShop(hero, this.shopKey, this.shopSelInv, qty)
            : null;
        if (!result || !result.ok) {
            if (result && result.unsellable) {
                this.log('The shop will not buy that.');
            } else {
                this.log('Nothing interesting happens.');
            }
            this.renderShop();
            return;
        }
        this.saveHero(hero);
        this.log('You sell ' + result.qty + ' × ' + itemName(result.id) + ' for ' + result.earned + 'gp.');
        if (itemQty(hero, this.shopSelInv) < 1) {
            this.shopSelInv = null;
        }
        this.renderShop();
    },

    showBank: function (def) {
        if (!this.el || !this.el.bank || this.mode !== 'world') {
            return;
        }
        this.hideContextMenu();
        this.hideWorldMap();
        this.hideDialogue();
        this.hideShop();
        this.hideStation();
        var name = def && def.name ? def.name : 'Banker Elise';
        if (this.el.bankSpeaker) {
            this.el.bankSpeaker.textContent = name;
        }
        if (this.el.bankCopy) {
            this.el.bankCopy.textContent = 'Your items are safe with Elise.';
        }
        this.el.bank.hidden = false;
        this.el.bank.setAttribute('data-bank', def && def.key ? def.key : 'banker');
        this.bankSel = null;
        this.bankTab = 'all';
        if (this.el.bankQty) {
            this.el.bankQty.value = '1';
        }
        if (this.el.bankSearch) {
            this.el.bankSearch.value = '';
        }
        this.renderBank();
    },

    hideBank: function () {
        if (this.el && this.el.bank) {
            this.el.bank.hidden = true;
            this.el.bank.removeAttribute('data-bank');
            if (this.el.bankClose) {
                this.el.bankClose.blur();
            }
            if (this.el.bankQty) {
                this.el.bankQty.blur();
            }
            if (this.el.bankSearch) {
                this.el.bankSearch.blur();
            }
        }
        this.bankSel = null;
        this.bankTab = 'all';
    },

    bankOpen: function () {
        return !!(this.el && this.el.bank && !this.el.bank.hidden);
    },

    stationTitleFor: function (kind) {
        if (kind === 'range') {
            return 'Cooking range';
        }
        if (kind === 'fire') {
            return 'Fire';
        }
        if (kind === 'stall') {
            return 'Crafting stall';
        }
        if (kind === 'anvil') {
            return 'Anvil';
        }
        if (kind === 'furnace') {
            return 'Furnace';
        }
        if (kind === 'altar') {
            return 'Rune altar';
        }
        return 'Station';
    },

    stationIsCook: function (kind) {
        return kind === 'range' || kind === 'fire';
    },

    stationCopyFor: function (kind) {
        if (kind === 'range' || kind === 'fire') {
            return 'Select raw food, then cook 1, 5, or all.';
        }
        if (kind === 'stall') {
            return 'Tan hides, fletch bows, or craft tools and gear.';
        }
        if (kind === 'anvil') {
            return 'Hammer bars into tools, weapons, and staves.';
        }
        if (kind === 'furnace') {
            return 'Smelt ore into bars.';
        }
        if (kind === 'altar') {
            return 'Bind rune essence into elemental runes.';
        }
        return 'Choose a recipe.';
    },

    showStation: function (kind, opts) {
        if (!this.el || !this.el.station || this.mode !== 'world') {
            return;
        }
        if (!kind || kind === 'booth') {
            return;
        }
        this.hideContextMenu();
        this.hideWorldMap();
        this.hideDialogue();
        this.hideShop();
        this.hideBank();
        this.pauseWorldForUi();
        this.stationKind = kind;
        this.stationOpts = opts || {};
        this.stationSel = null;
        if (this.el.stationTitle) {
            this.el.stationTitle.textContent = this.stationTitleFor(kind);
        }
        if (this.el.stationCopy) {
            this.el.stationCopy.textContent = this.stationCopyFor(kind);
        }
        if (this.el.stationActions) {
            this.el.stationActions.hidden = !this.stationIsCook(kind);
        }
        this.el.station.hidden = false;
        this.el.station.setAttribute('data-station', kind);
        this.renderStation();
    },

    hideStation: function () {
        if (this.el && this.el.station) {
            this.el.station.hidden = true;
            this.el.station.removeAttribute('data-station');
            if (this.el.stationClose) {
                this.el.stationClose.blur();
            }
        }
        if (this.el && this.el.stationList) {
            this.el.stationList.innerHTML = '';
        }
        if (this.el && this.el.stationActions) {
            this.el.stationActions.hidden = true;
        }
        this.stationKind = null;
        this.stationOpts = null;
        this.stationSel = null;
    },

    stationOpen: function () {
        return !!(this.el && this.el.station && !this.el.station.hidden);
    },

    renderStation: function () {
        var hero = this.hero();
        var rows;
        var html = '';
        var i;
        var cookMode;
        var stillThere = false;
        if (!this.el || !this.el.stationList || !this.stationKind) {
            return;
        }
        cookMode = this.stationIsCook(this.stationKind);
        rows = typeof stationRecipesFor === 'function'
            ? stationRecipesFor(this.stationKind, hero, this.stationOpts || {})
            : [];
        if (cookMode) {
            for (i = 0; i < rows.length; i++) {
                if (rows[i].enabled && rows[i].id === this.stationSel) {
                    stillThere = true;
                    break;
                }
            }
            if (!stillThere) {
                this.stationSel = null;
                for (i = 0; i < rows.length; i++) {
                    if (rows[i].enabled) {
                        this.stationSel = rows[i].id;
                        break;
                    }
                }
            }
        }
        for (i = 0; i < rows.length; i++) {
            var row = rows[i];
            var label = row.label;
            var itemId;
            var qty;
            if (cookMode && row.id && row.id.indexOf('cook:') === 0 && row.enabled) {
                itemId = row.id.split(':')[1];
                qty = typeof itemQty === 'function' ? itemQty(hero, itemId) : 0;
                label = itemName(itemId) + (qty > 0 ? (' ×' + qty) : '');
                html += '<button type="button" data-station-select="' + row.id + '"'
                    + (this.stationSel === row.id ? ' class="is-on"' : '')
                    + '>' + label + '</button>';
            } else {
                html += '<button type="button" data-station-recipe="' + row.id + '"'
                    + (row.enabled ? '' : ' disabled') + '>' + label + '</button>';
            }
        }
        this.el.stationList.innerHTML = html;
        if (this.el.stationActions) {
            this.el.stationActions.hidden = !cookMode;
        }
    },

    chooseStationCook: function (qtyAttr) {
        var hero;
        var recipeId;
        var itemId;
        var have;
        var want;
        var n;
        var i;
        var result;
        var cooked = 0;
        var burned = 0;
        var lastFail = null;
        if (!this.stationOpen() || this.mode !== 'world' || !this.stationIsCook(this.stationKind)) {
            return;
        }
        recipeId = this.stationSel;
        if (!recipeId || recipeId.indexOf('cook:') !== 0) {
            this.log('Select something to cook.');
            return;
        }
        itemId = recipeId.split(':')[1];
        if (!itemId || itemId === 'none') {
            this.log('You have nothing to cook.');
            return;
        }
        hero = this.hero();
        have = typeof itemQty === 'function' ? itemQty(hero, itemId) : 0;
        if (have < 1) {
            this.log('You have nothing to cook.');
            this.renderStation();
            return;
        }
        if (qtyAttr === 'all') {
            want = have;
        } else {
            want = Math.floor(Number(qtyAttr || 1));
            if (!(want > 0)) {
                want = 1;
            }
        }
        n = Math.min(want, have);
        for (i = 0; i < n; i++) {
            result = typeof runStationRecipe === 'function'
                ? runStationRecipe(hero, this.stationKind, recipeId, this.stationOpts || {})
                : null;
            if (!result) {
                lastFail = { ok: false };
                break;
            }
            if (result.empty) {
                lastFail = result;
                break;
            }
            if (!result.ok) {
                lastFail = result;
                break;
            }
            if (result.burned) {
                burned += 1;
            } else if (result.cooked) {
                cooked += 1;
            }
        }
        if (cooked + burned < 1) {
            if (lastFail && lastFail.empty) {
                this.log('You have nothing to cook.');
            } else if (lastFail && lastFail.full) {
                this.log('inventory full');
            } else {
                this.log('Nothing interesting happens.');
            }
            this.renderStation();
            return;
        }
        this.saveHero(hero);
        if (cooked > 0 && burned > 0) {
            this.log('You cook ' + cooked + ' and burn ' + burned + ' x ' + itemName(itemId) + '.');
        } else if (burned > 0) {
            this.log(burned > 1
                ? ('You accidentally burn ' + burned + ' x ' + itemName(itemId) + '.')
                : ('You accidentally burn the ' + itemName(itemId) + '.'));
        } else if (cooked > 1) {
            this.log('You cook ' + cooked + ' x ' + itemName(itemId) + '.');
        } else {
            this.log('You cook the ' + itemName(itemId) + '.');
        }
        this.renderStation();
        this.renderHero(hero);
    },

    chooseStationRecipe: function (recipeId) {
        var hero;
        var result;
        if (!this.stationOpen() || this.mode !== 'world' || !this.stationKind) {
            return;
        }
        if (this.stationIsCook(this.stationKind)) {
            this.stationSel = recipeId;
            this.chooseStationCook(1);
            return;
        }
        hero = this.hero();
        result = typeof runStationRecipe === 'function'
            ? runStationRecipe(hero, this.stationKind, recipeId, this.stationOpts || {})
            : null;
        if (!result) {
            this.log('Nothing interesting happens.');
            this.renderStation();
            return;
        }
        if (result.empty) {
            this.log('You have nothing to cook.');
            this.renderStation();
            return;
        }
        if (result.need === 'ores' || result.need === 'cowhide' || result.need === 'materials' || result.need === 'bar') {
            this.log('You lack the materials.');
            this.renderStation();
            return;
        }
        if (typeof result.need === 'number') {
            this.log(typeof needLevelChat === 'function'
                ? needLevelChat(result.need)
                : ('You need level ' + result.need + '.'));
            this.renderStation();
            return;
        }
        if (!result.ok) {
            this.log(result.full ? 'inventory full' : 'Nothing interesting happens.');
            this.renderStation();
            return;
        }
        this.saveHero(hero);
        if (result.burned) {
            this.log('You accidentally burn the ' + itemName(recipeId.split(':')[1]) + '.');
        } else if (result.cooked) {
            this.log('You cook the ' + itemName(recipeId.split(':')[1]) + '.');
        } else if (result.made === 'leather') {
            this.log('You tan the cowhide.');
        } else if (result.made === 'gloves') {
            this.log('You stitch a pair of leather gloves.');
        } else if (result.made) {
            this.log('You make ' + itemName(result.made) +
                (result.qty > 1 ? (' x' + result.qty) : '') + '.');
        } else {
            this.log('You finish the work.');
        }
        this.renderStation();
        this.renderHero(hero);
    },

    renderBank: function () {
        var hero = this.hero();
        var vault;
        if (!this.el || !this.el.bankInv || !this.el.bankVault) {
            return;
        }
        this.renderBankTabs();
        this.el.bankInv.innerHTML = this.bankGridHtml(hero && hero.inventory, 'inv');
        vault = hero && typeof filterBankStacks === 'function'
            ? filterBankStacks(ensureBank(hero), this.bankTab || 'all', this.readBankSearch())
            : (hero && ensureBank(hero));
        this.el.bankVault.innerHTML = this.bankGridHtml(vault, 'vault');
    },

    renderBankTabs: function () {
        var tab = this.bankTab || 'all';
        var buttons;
        var i;
        if (!this.el || !this.el.bankTabs) {
            return;
        }
        buttons = this.el.bankTabs.querySelectorAll('[data-bank-tab]');
        for (i = 0; i < buttons.length; i++) {
            buttons[i].classList.toggle('is-on', buttons[i].getAttribute('data-bank-tab') === tab);
        }
    },

    readBankSearch: function () {
        var el = this.el && this.el.bankSearch;
        return el && el.value ? String(el.value) : '';
    },

    bankGridHtml: function (list, side) {
        var html = '';
        var i;
        list = list || [];
        for (i = 0; i < 28; i++) {
            var stack = list[i];
            if (stack) {
                var def = ITEM_DB[stack.id] || { name: stack.id };
                var on = this.bankSel === stack.id ? ' is-on' : '';
                html += '<button type="button" class="inv-slot' + on + '" data-bank-side="' + side +
                    '" data-bank-item="' + stack.id + '" title="' + def.name + '">' +
                    '<img class="pix" src="' + itemIcon(stack.id) + '" alt="">' +
                    (stack.qty > 1 ? '<span class="qty">' + stack.qty + '</span>' : '') +
                    '</button>';
            } else {
                html += '<div class="inv-slot"></div>';
            }
        }
        return html;
    },

    chooseBankAction: function (action) {
        if (!this.bankOpen() || this.mode !== 'world') {
            return;
        }
        if (action === 'close') {
            this.hideBank();
            return;
        }
        var hero = this.hero();
        if (!hero) {
            return;
        }
        if (action === 'heal') {
            hero.hp = hero.maxHp;
            this.saveHero(hero);
            var healer = (this.el.bankSpeaker && this.el.bankSpeaker.textContent) || 'Banker Elise';
            this.log(healer + ': Your wounds close. HP restored.');
            return;
        }
        var id = this.bankSel;
        if (action === 'deposit' || action === 'deposit-x' || action === 'deposit-all') {
            if (!id) {
                this.log('Select an inventory item to deposit.');
                return;
            }
            var invStack = typeof findStack === 'function' ? findStack(hero.inventory, id) : null;
            var invHeld = invStack && invStack.qty > 0 ? invStack.qty : 0;
            var depQty = 1;
            if (action === 'deposit-all') {
                depQty = invHeld;
            } else if (action === 'deposit-x') {
                depQty = this.readBankQty();
                if (!(depQty >= 1)) {
                    this.log('Enter how many to deposit.');
                    return;
                }
                if (depQty > invHeld) {
                    depQty = invHeld;
                }
            }
            if (!invHeld || !depositItem(hero, id, depQty)) {
                this.log('You have nothing to deposit.');
                return;
            }
            this.saveHero(hero);
            this.log('You deposit ' + depQty + ' x ' + itemName(id) + '.');
            return;
        }
        if (action === 'withdraw' || action === 'withdraw-x' || action === 'withdraw-all') {
            if (!id) {
                this.log('Select a bank item to withdraw.');
                return;
            }
            var stack = typeof findStack === 'function' ? findStack(ensureBank(hero), id) : null;
            var held = stack && stack.qty > 0 ? stack.qty : 0;
            var qty = 1;
            if (action === 'withdraw-all') {
                qty = held;
            } else if (action === 'withdraw-x') {
                qty = this.readBankQty();
                if (!(qty >= 1)) {
                    this.log('Enter how many to withdraw.');
                    return;
                }
                if (qty > held) {
                    qty = held;
                }
            }
            if (typeof canAddItem === 'function' && !canAddItem(hero, id)) {
                this.log('inventory full');
                return;
            }
            if (!held || !withdrawItem(hero, id, qty)) {
                this.log('The bank is empty.');
                return;
            }
            this.saveHero(hero);
            this.log('You withdraw ' + qty + ' x ' + itemName(id) + '.');
        }
    },

    readBankQty: function () {
        var el = this.el && this.el.bankQty;
        var n = parseInt(el && el.value, 10);
        if (!(n >= 1)) {
            return 0;
        }
        return n;
    },

    chooseContext: function (action, lootIndex) {
        var target = this.ctxTarget;
        var pile = this.ctxLootPile;
        this.hideContextMenu();
        if (this.mode !== 'world' || !target) {
            return;
        }
        var world = window.game && window.game.scene.getScene('WorldScene');
        if (!world || world.encounterLock) {
            return;
        }
        if (action === 'take-loot') {
            var idx = parseInt(lootIndex, 10);
            var drop = pile && pile[idx] ? pile[idx] : null;
            if (drop && world.queueLootTake) {
                world.queueLootTake(drop);
            } else if (drop && world.tryPickup) {
                world.tryPickup(drop);
            }
            return;
        }
        if (action === 'reclaim-grave') {
            if (target.grave && world.queueGraveReclaim) {
                world.queueGraveReclaim(target.grave);
            }
            return;
        }
        if (action === 'examine-grave') {
            this.log('A weathered gravestone. Your lost belongings wait inside.');
            return;
        }
        if (action === 'take') {
            if (target.loot && world.queueLootTake) {
                world.queueLootTake(target.loot);
            } else if (target.loot && world.tryPickup) {
                world.tryPickup(target.loot);
            }
            return;
        }
        if (action === 'talk') {
            var talkNpc = target.npc || (world.pickSprite && world.pickSprite(world.npcs, target.worldX, target.worldY, 18));
            if (talkNpc) {
                world.engageTarget = null;
                world.lootTarget = null;
                world.talkTarget = talkNpc;
                world.setWalk(talkNpc.x, talkNpc.y, { allowEnd: true });
            }
            return;
        }
        if (action === 'attack') {
            var foe = target.mob || (world.pickSprite && world.pickSprite(world.mobs, target.worldX, target.worldY, 18));
            if (foe && foe.aliveMob) {
                if (world.queueAttack) {
                    world.queueAttack(foe);
                } else {
                    world.engageTarget = foe;
                    world.setWalk(foe.x, foe.y, { allowEnd: true });
                    this.log('You target the ' + foe.mobDef.type + '.');
                }
            }
            return;
        }
        if (action === 'examine') {
            if (target.itemId) {
                this.examineItem(target.itemId);
                return;
            }
            if (world.examineAt) {
                world.examineAt(target.worldX, target.worldY);
            }
            return;
        }
        if (action === 'drop') {
            this.dropItem(target.itemId);
            return;
        }
        if (action === 'wield' || action === 'wear') {
            this.equipFromInventory(target.itemId);
            return;
        }
        if (action === 'bury') {
            this.buryFromInventory(target.itemId);
            return;
        }
        if (action === 'tan') {
            this.tanFromInventory(target.itemId);
            return;
        }
        if (action === 'eat') {
            var eatHero = this.hero();
            var eatDef = ITEM_DB[target.itemId];
            if (!eatHero || !eatDef || !eatDef.heal) {
                return;
            }
            if (eatHero.hp >= eatHero.maxHp) {
                this.log('You are already at full health.');
                return;
            }
            var eatenMenu = typeof eatItem === 'function' ? eatItem(eatHero, target.itemId) : null;
            if (!eatenMenu) {
                this.log('You do not have that.');
                return;
            }
            this.saveHero(eatHero);
            this.log('You eat ' + eatenMenu.name + ' and recover ' + eatenMenu.heal + ' HP.');
            return;
        }
        if (action === 'drink') {
            var drinkHero = this.hero();
            var drunkMenu = typeof drinkItem === 'function' ? drinkItem(drinkHero, target.itemId) : null;
            if (!drunkMenu) {
                this.log('You do not have that.');
                return;
            }
            this.saveHero(drinkHero);
            this.log('You drink the ' + drunkMenu.name +
                (drunkMenu.bonus ? (' (+' + drunkMenu.bonus + ' damage briefly).') : '.'));
            return;
        }
        if (action === 'use') {
            this.beginUseOn(target.itemId);
            return;
        }
        if (action === 'remove') {
            this.unequipWorn(target.slot);
            return;
        }
        if (action === 'fish') {
            if (world.clickFishSpot) {
                var fishHit = world.pickScenery(target.worldX, target.worldY);
                if (fishHit && fishHit.kind === 'fishspot') {
                    world.clickFishSpot(fishHit);
                }
            }
            return;
        }
        if (action === 'station') {
            if (world.clickStation) {
                var stationHit = world.pickScenery(target.worldX, target.worldY);
                if (stationHit && typeof isStationKind === 'function' && isStationKind(stationHit.kind)) {
                    world.clickStation(stationHit);
                }
            }
            return;
        }
        if (action === 'trade-stall') {
            if (world.clickStation) {
                var tradeHit = world.pickScenery(target.worldX, target.worldY);
                if (tradeHit && (tradeHit.kind === 'shop-stall' || (tradeHit.interact && tradeHit.interact.verb === 'trade'))) {
                    world.clickStation(tradeHit);
                }
            }
            return;
        }
        if (action === 'talk-post') {
            var postHit = world.pickScenery ? world.pickScenery(target.worldX, target.worldY) : null;
            var postNpc = world.findNpcByKey
                ? world.findNpcByKey((postHit && postHit.interact && postHit.interact.npcKey) || 'guild')
                : null;
            if (postNpc) {
                world.talkTarget = postNpc;
                world.engageTarget = null;
                if (world.clearFish) {
                    world.clearFish();
                }
                if (world.setWalk) {
                    world.setWalk(postNpc.x, postNpc.y, { allowEnd: true });
                }
            }
            return;
        }
        if (action === 'pickpocket') {
            var pickNpc = target.npc;
            if (pickNpc && world.tryPickpocket) {
                world.tryPickpocket(pickNpc);
            }
            return;
        }
        if (action === 'duel') {
            var duelNpc = target.npc;
            if (duelNpc && world.beginFight) {
                var fake = world.physics.add.sprite(duelNpc.x, duelNpc.y, 'mob-chicken', 0);
                fake.mobDef = { type: 'Dummy', hp: 18, damage: 2, xp: 6, gold: 0 };
                fake.aliveMob = true;
                world.beginFight(fake);
            }
            return;
        }
        if (action === 'trade-npc') {
            var trNpc = target.npc;
            if (trNpc && trNpc.npcDef) {
                this.showPlayerTrade(trNpc.npcDef);
            }
            return;
        }
        if (action === 'ge') {
            if (this.showGrandExchange) {
                this.showGrandExchange();
            }
            return;
        }
        if (action === 'stairs') {
            var stairHit = world.pickScenery ? world.pickScenery(target.worldX, target.worldY) : null;
            if (stairHit && world.clickStairs) {
                world.clickStairs(stairHit);
            }
            return;
        }
        if (action === 'mine-boulder') {
            var boulderHit = world.pickScenery ? world.pickScenery(target.worldX, target.worldY) : null;
            if (boulderHit && boulderHit.kind === 'den-boulder' && world.clickMineBoulder) {
                world.clickMineBoulder(boulderHit);
            }
            return;
        }
        if (action !== 'walk-here' || !world.setWalk) {
            return;
        }
        world.engageTarget = null;
        world.talkTarget = null;
        if (world.clearFish) {
            world.clearFish();
        } else {
            world.fishTarget = null;
        }
        world.setWalk(target.worldX, target.worldY, { playerClick: true });
    },

    clickMinimap: function (zoneId) {
        this.hideContextMenu();
        this.hideWorldMap();
        if (this.mode !== 'world') {
            return;
        }
        var world = window.game && window.game.scene.getScene('WorldScene');
        if (!world || !world.walkTowardZone || world.encounterLock) {
            return;
        }
        if (this.interactionPaused && this.interactionPaused()) {
            return;
        }
        world.walkTowardZone(zoneId);
    },

    log: function (line, kind) {
        var vue = this.vueState();
        if (vue) {
            vue.chatLines.push({ text: line, kind: kind || '' });
            while (vue.chatLines.length > 40) {
                vue.chatLines.shift();
            }
            var self = this;
            var scrollChat = function () {
                var logEl = (HudApp.vm && HudApp.vm.$refs && HudApp.vm.$refs.chatLog) || (self.el && self.el.log);
                if (logEl) {
                    logEl.scrollTop = logEl.scrollHeight;
                }
            };
            if (typeof Vue !== 'undefined' && Vue.nextTick) {
                Vue.nextTick(scrollChat);
            } else {
                setTimeout(scrollChat, 0);
            }
            return;
        }
        if (!this.el || !this.el.log) {
            return;
        }
        var p = document.createElement('div');
        p.className = kind ? 'chat-line ' + kind : 'chat-line';
        p.textContent = line;
        this.el.log.appendChild(p);
        this.el.log.scrollTop = this.el.log.scrollHeight;
        while (this.el.log.children.length > 40) {
            this.el.log.removeChild(this.el.log.firstChild);
        }
    },

    setWorld: function (state) {
        var total = state.total != null
            ? state.total
            : (typeof skillTotal === 'function' ? skillTotal(this.hero()) : 0);
        var vue = this.vueState();
        var hpText = state.hp + ' / ' + state.maxHp;
        var xpBar = this.combatXpBar(state.xp);
        if (vue) {
            vue.zone = state.zone;
            vue.zoneId = state.zoneId;
            vue.hp = state.hp;
            vue.maxHp = state.maxHp;
            vue.hpText = hpText;
            vue.gold = state.gold;
            vue.xp = state.xp;
            vue.xpText = xpBar.label;
            vue.xpFillPct = xpBar.pct;
            vue.xpFillColor = '#c9a227';
            vue.level = state.level;
            vue.total = total;
            vue.quest = state.quest;
            if (state.displayName) {
                vue.displayName = state.displayName;
            }
        }
        /* Mirror into DOM immediately so suite/live reads do not wait on Vue flush. */
        if (this.el) {
            if (this.el.zone) {
                this.el.zone.textContent = state.zone;
            }
            if (this.el.hp) {
                this.el.hp.textContent = hpText;
            }
            if (this.el.gold) {
                this.el.gold.textContent = String(state.gold);
            }
            if (this.el.xp) {
                this.el.xp.textContent = xpBar.label;
            }
            if (this.el.level) {
                this.el.level.textContent = String(state.level);
            }
            if (this.el.total) {
                this.el.total.textContent = String(total);
            }
            if (this.el.quest) {
                this.el.quest.textContent = state.quest;
            }
            if (this.el.questTab) {
                this.el.questTab.textContent = state.quest;
            }
        }
        this.highlightMinimap(state.zoneId);
        if (this.el && this.el.worldMap && !this.el.worldMap.hidden) {
            this.renderWorldMap();
        }
        this.paintHpFill(state.hp, state.maxHp);
        this.paintXpBar(state.xp);
        this.renderHero(this.hero());
    },

    paintStatBar: function (fillEl, labelEl, cur, max, color, labelText) {
        var cap = max > 0 ? max : 0;
        var amount = typeof cur === 'number' ? cur : 0;
        var pct = cap ? Math.max(0, Math.min(100, (amount / cap) * 100)) : 0;
        var text = labelText != null
            ? String(labelText)
            : (Math.round(amount) + ' / ' + Math.round(cap));
        if (fillEl) {
            fillEl.style.width = pct + '%';
            if (color) {
                fillEl.style.backgroundColor = color;
            }
        }
        if (labelEl) {
            labelEl.textContent = text;
        }
        return pct;
    },

    combatXpBar: function (xp) {
        var amount = typeof xp === 'number' ? xp : 0;
        var band = 40;
        var next = (Math.floor(amount / band) + 1) * band;
        var into = amount - (next - band);
        var pct = Math.max(0, Math.min(100, (into / band) * 100));
        return {
            xp: amount,
            next: next,
            pct: pct,
            label: amount + ' / ' + next
        };
    },

    paintHpFill: function (hp, maxHp) {
        var ratio = maxHp ? hp / maxHp : 0;
        var pct = Math.max(0, Math.min(100, ratio * 100));
        var color = '#3dcc6a';
        var hpText = hp + ' / ' + maxHp;
        if (ratio < 0.35) {
            color = '#cc3d3d';
        } else if (ratio < 0.65) {
            color = '#d4a017';
        }
        var vue = this.vueState();
        if (vue) {
            vue.hpFillPct = pct;
            vue.hpFillColor = color;
            vue.hpText = hpText;
            vue.hp = hp;
            vue.maxHp = maxHp;
        }
        var fill = document.getElementById('hp-fill');
        var label = document.getElementById('hud-hp');
        if (!vue) {
            this.paintStatBar(fill, label, hp, maxHp, color, hpText);
        } else if (label) {
            label.textContent = hpText;
        }
    },

    paintXpBar: function (xp) {
        var bar = this.combatXpBar(xp);
        var vue = this.vueState();
        if (vue) {
            vue.xp = bar.xp;
            vue.xpText = bar.label;
            vue.xpFillPct = bar.pct;
            vue.xpFillColor = '#c9a227';
        }
        var fill = document.getElementById('xp-fill');
        var label = document.getElementById('hud-xp');
        if (label) {
            label.textContent = bar.label;
        }
        if (fill && !vue) {
            fill.style.width = bar.pct + '%';
            fill.style.backgroundColor = '#c9a227';
        }
    },

    renderHero: function (hero) {
        if (!hero) {
            return;
        }
        var vue = this.vueState();
        var level = typeof combatLevel === 'function' ? combatLevel(hero) : hero.level;
        var total = typeof skillTotal === 'function' ? skillTotal(hero) : 0;
        if (vue) {
            vue.hp = hero.hp;
            vue.maxHp = hero.maxHp;
            vue.hpText = hero.hp + ' / ' + hero.maxHp;
            vue.gold = hero.gold;
            vue.level = level;
            vue.total = total;
        } else if (this.el) {
            this.el.hp.textContent = hero.hp + ' / ' + hero.maxHp;
            this.el.gold.textContent = String(hero.gold);
            if (this.el.level) {
                this.el.level.textContent = String(level);
            }
            if (this.el.total) {
                this.el.total.textContent = String(total);
            }
        }
        this.paintHpFill(hero.hp, hero.maxHp);
        this.paintXpBar(hero.xp);
        this.renderInventory(hero);
        this.renderSkills(hero);
        this.renderEquip(hero);
        this.renderStyles(hero);
        this.renderAutoAttack(hero);
        this.renderAutoAttackRange(hero);
        this.renderAutoRetaliate(hero);
        this.renderAutoPickup(hero);
        this.renderShiftClickDrop(hero);
        this.renderHideBones(hero);
        this.renderCombatVisuals(hero);
        this.renderRangeRings(hero);
        this.renderMobSpawnModifier(hero);
        this.renderTargetTps(hero);
        this.renderGameSpeed(hero);
        this.renderXpMultiplier(hero);
        this.renderPrayers(hero);
        this.renderRun(hero);
        this.renderSpecialEnergy(hero);
        this.renderHiscores();
        this.renderCollisionDebug();
        if (this.bankOpen()) {
            this.renderBank();
        }
    },

    toggleCollisionDebug: function () {
        var world = window.game && window.game.scene && window.game.scene.getScene('WorldScene');
        if (!world || typeof world.setCollisionDebug !== 'function') {
            this.renderCollisionDebug();
            return false;
        }
        world.setCollisionDebug(!world.collisionDebug);
        this.renderCollisionDebug();
        this.log('Collision debug ' + (world.collisionDebug ? 'on' : 'off') + '.');
        return world.collisionDebug;
    },

    renderCollisionDebug: function () {
        var world = window.game && window.game.scene && window.game.scene.getScene('WorldScene');
        var on = !!(world && world.collisionDebug);
        var vue = this.vueState();
        if (vue) {
            vue.collisionDebugOn = on;
            vue.collisionDebugLabel = 'Collision debug: ' + (on ? 'On' : 'Off');
        }
        var buttons = document.querySelectorAll('[data-collision-debug]');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].classList.toggle('is-on', on);
            buttons[i].textContent = 'Collision debug: ' + (on ? 'On' : 'Off');
        }
    },

    toggleRun: function () {
        var hero = this.hero();
        if (!hero) {
            return false;
        }
        if (hero.runEnergy == null) {
            hero.runEnergy = 100;
        }
        if (!hero.running && hero.runEnergy <= 0) {
            this.log('You are too tired to run.');
            this.renderRun(hero);
            return false;
        }
        hero.running = !hero.running;
        this.saveHero(hero);
        this.renderRun(hero);
        this.log(hero.running ? 'You start running.' : 'You start walking.');
        return true;
    },

    paintRunEnergy: function (energy, max, running) {
        var amount = typeof energy === 'number' ? energy : 0;
        var cap = max || 100;
        var ratio = cap ? amount / cap : 0;
        var pct = Math.max(0, Math.min(100, ratio * 100));
        var color = running ? '#e6c56a' : '#6a9ad4';
        var runText = Math.round(amount) + ' / ' + Math.round(cap);
        var vue = this.vueState();
        if (vue) {
            vue.runEnergy = amount;
            vue.runText = runText;
            vue.runFillPct = pct;
            vue.runFillColor = color;
            vue.running = !!running;
        }
        var fill = document.getElementById('run-fill');
        var label = document.getElementById('hud-run');
        var bar = document.getElementById('run-bar');
        if (!vue) {
            this.paintStatBar(fill, label, amount, cap, color, runText);
        } else if (label) {
            label.textContent = runText;
        }
        if (bar) {
            bar.classList.toggle('is-on', !!running);
        }
    },

    renderRun: function (hero) {
        var on = !!(hero && hero.running);
        var energy = hero && hero.runEnergy != null ? hero.runEnergy : 100;
        var vue = this.vueState();
        if (vue) {
            vue.running = on;
            vue.runLabel = 'Run: ' + (on ? 'On' : 'Off');
        }
        var buttons = document.querySelectorAll('.run-mode-btn');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].classList.toggle('is-on', on);
            buttons[i].textContent = 'Run: ' + (on ? 'On' : 'Off');
        }
        this.paintRunEnergy(energy, 100, on);
    },

    invTooltip: function (id, qty) {
        var def = ITEM_DB[id] || {};
        var name = typeof itemName === 'function' ? itemName(id) : (def.name || id);
        var bits = [name];
        if (qty > 1) {
            bits.push('x' + qty);
        }
        if (def.heal) {
            bits.push('heals ' + def.heal);
        }
        if (typeof def.value === 'number') {
            bits.push(def.value + 'gp');
        }
        return bits.join(' · ');
    },

    renderInventory: function (hero) {
        var html = '';
        var i;
        var self = this;
        for (i = 0; i < INVENTORY_CAP; i++) {
            var stack = hero.inventory[i];
            if (stack) {
                var name = typeof itemName === 'function' ? itemName(stack.id) : ((ITEM_DB[stack.id] && ITEM_DB[stack.id].name) || stack.id);
                var tip = this.invTooltip(stack.id, stack.qty);
                html += '<button type="button" class="inv-slot" draggable="true" data-item="' + stack.id +
                    '" data-inv-index="' + i + '" title="' + tip + '">' +
                    '<img class="pix" src="' + itemIcon(stack.id) + '" alt="">' +
                    '<span class="inv-name">' + name + '</span>' +
                    (stack.qty > 1 ? '<span class="qty">' + stack.qty + '</span>' : '') +
                    '</button>';
            } else {
                html += '<div class="inv-slot" data-inv-index="' + i + '"></div>';
            }
        }
        this.el.inv.innerHTML = html;
        if (!this._invDragBound) {
            this._invDragBound = true;
            this.el.inv.addEventListener('dragstart', function (event) {
                var slot = event.target.closest('[data-inv-index]');
                if (!slot || !slot.getAttribute('data-item')) {
                    return;
                }
                event.dataTransfer.setData('text/inv-index', slot.getAttribute('data-inv-index'));
            });
            this.el.inv.addEventListener('dragover', function (event) {
                event.preventDefault();
            });
            this.el.inv.addEventListener('drop', function (event) {
                var from;
                var to;
                var slot;
                var heroNow;
                var inv;
                var moved;
                event.preventDefault();
                from = parseInt(event.dataTransfer.getData('text/inv-index'), 10);
                slot = event.target.closest('[data-inv-index]');
                if (!slot || !(from >= 0)) {
                    return;
                }
                to = parseInt(slot.getAttribute('data-inv-index'), 10);
                if (!(to >= 0) || from === to) {
                    return;
                }
                heroNow = self.hero();
                if (!heroNow || !heroNow.inventory) {
                    return;
                }
                inv = heroNow.inventory;
                if (from >= inv.length) {
                    return;
                }
                moved = inv.splice(from, 1)[0];
                if (!moved) {
                    return;
                }
                if (to > inv.length) {
                    to = inv.length;
                }
                inv.splice(to, 0, moved);
                self.saveHero(heroNow);
                self.renderInventory(heroNow);
            });
        }
    },

    renderSkills: function (hero) {
        var html = '';
        SKILL_NAMES.forEach(function (pair) {
            if (typeof isStretchSkill === 'function' && isStretchSkill(pair[0])) {
                return;
            }
            var skill = hero.skills && hero.skills[pair[0]];
            var level = skill ? skill.level : 1;
            var hint = typeof skillXpText === 'function' ? skillXpText(pair[1], skill) : pair[1];
            var bar = typeof skillXpBar === 'function'
                ? skillXpBar(skill)
                : { pct: 0, label: '0/50' };
            html += '<div class="skill-row" data-skill="' + pair[0] + '" title="' + hint + '">' +
                '<img class="pix" src="' + skillIcon(pair[0]) + '" alt="">' +
                '<span>' + pair[1] + '</span><strong>' + level + '</strong>' +
                '<div class="stat-bar stat-bar--xp">' +
                '<div class="stat-bar-fill" style="width:' + bar.pct + '%;background:#c9a227"></div>' +
                '<strong class="stat-bar-label">' + bar.label + '</strong>' +
                '</div></div>';
        });
        this.el.skills.innerHTML = html;
    },

    renderEquip: function (hero) {
        if (typeof ensureEquipment === 'function') {
            ensureEquipment(hero);
        }
        var slots = typeof EQUIP_SLOTS !== 'undefined' ? EQUIP_SLOTS : [
            ['weapon', 'Weapon'],
            ['shield', 'Shield']
        ];
        var html = '';
        for (var i = 0; i < slots.length; i++) {
            var id = hero.equipment && hero.equipment[slots[i][0]];
            html += '<div class="equip-row"><span>' + slots[i][1] + '</span>';
            if (id) {
                var wornName = itemName(id);
                var wornQty = typeof equippedQty === 'function' ? equippedQty(hero, slots[i][0]) : 0;
                if (slots[i][0] === 'ammo' && wornQty > 0) {
                    wornName += ' x' + wornQty;
                }
                html += '<button type="button" class="equip-item" data-equip-slot="' + slots[i][0] +
                    '" data-item="' + id + '" title="Remove">' +
                    '<img class="pix" src="' + itemIcon(id) + '" alt=""> ' + wornName + '</button>';
            } else {
                html += '<strong>None</strong>';
            }
            html += '</div>';
        }
        this.el.equip.innerHTML = html;
        this.renderEquipStats(hero);
    },

    renderEquipStats: function (hero) {
        if (!this.el.equipStats) {
            return;
        }
        var defence = 0;
        if (typeof equipmentMeleeDefence === 'function') {
            defence = equipmentMeleeDefence(hero);
        } else if (typeof equippedShieldDefence === 'function') {
            defence = equippedShieldDefence(hero);
        }
        var signed = typeof signedStat === 'function' ? signedStat(defence) : String(defence);
        this.el.equipStats.innerHTML =
            '<h4>Equipment stats</h4>' +
            '<div class="equip-stat-row"><span>Melee +defence</span><strong>' + signed + '</strong></div>';
    },

    renderStyles: function (hero) {
        var style = (hero && hero.style) || 'shared';
        var labels = typeof styleLabelsForHero === 'function' ? styleLabelsForHero(hero) : null;
        var cls = typeof heroCombatClass === 'function' ? heroCombatClass(hero) : 'melee';
        var weaponId = hero && hero.equipment ? hero.equipment.weapon : null;
        var weaponName = weaponId && typeof itemName === 'function' ? itemName(weaponId) : 'Unarmed';
        var vue = this.vueState();
        var powerOn = style === 'aggressive' || style === 'rapid' || style === 'blast' || style === 'power';
        if (vue) {
            vue.styleAccurateOn = style === 'accurate';
            vue.styleAggressiveOn = powerOn;
            vue.styleDefensiveOn = style === 'defensive';
            vue.styleSharedOn = style === 'shared';
            if (labels) {
                vue.styleAccurateLabel = labels.accurate;
                vue.stylePowerLabel = labels.power;
                vue.styleDefensiveLabel = labels.defensive;
            }
            vue.combatWeaponLabel = (cls === 'ranged' ? 'Bow — ' : cls === 'magic' ? 'Staff — ' : 'Melee — ') + weaponName;
            vue.styleHint = cls === 'ranged'
                ? 'Accurate→Attack, Ranger→Ranged, Longrange→Defence, Shared splits Attack/Defence/Ranged.'
                : (cls === 'magic'
                    ? 'Accurate→Attack, Mage→Magic, Ward→Defence, Shared splits Attack/Defence/Magic.'
                    : 'Accurate→Attack, Strength→Strength, Defensive→Defence, Shared splits Attack/Defence/Strength.');
        }
        if (this.el && this.el.styles) {
            var buttons = this.el.styles.querySelectorAll('button');
            for (var i = 0; i < buttons.length; i++) {
                var key = buttons[i].getAttribute('data-style');
                buttons[i].classList.toggle('is-on', key === style || (key === 'aggressive' && powerOn));
            }
        }
    },

    renderAutoAttack: function (hero) {
        var on = typeof autoAttackOn === 'function' ? autoAttackOn(hero) : !!(hero && hero.autoAttack);
        var vue = this.vueState();
        if (vue) {
            vue.autoAttackOn = on;
            vue.autoAttackLabel = 'Auto-attack: ' + (on ? 'On' : 'Off');
        }
        var buttons = document.querySelectorAll('[data-auto-attack]');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].classList.toggle('is-on', on);
            buttons[i].textContent = 'Auto-attack: ' + (on ? 'On' : 'Off');
        }
    },


    renderAutoAttackRange: function (hero) {
        var value = typeof autoAttackRangeTiles === 'function'
            ? autoAttackRangeTiles(hero)
            : (hero && typeof hero.autoAttackRange === 'number' ? hero.autoAttackRange : 3);
        var vue = this.vueState();
        var buttons;
        var i;
        var btnVal;
        if (vue) {
            vue.autoAttackRange = value;
        }
        buttons = document.querySelectorAll('[data-auto-attack-range]');
        for (i = 0; i < buttons.length; i++) {
            btnVal = parseInt(buttons[i].getAttribute('data-auto-attack-range'), 10);
            buttons[i].classList.toggle('is-on', btnVal === value);
        }
    },

    renderAutoRetaliate: function (hero) {
        var on = autoRetaliateOn(hero);
        var vue = this.vueState();
        if (vue) {
            vue.autoRetaliateOn = on;
            vue.autoRetaliateLabel = 'Auto-retaliate: ' + (on ? 'On' : 'Off');
        }
        var buttons = document.querySelectorAll('[data-auto-retaliate]');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].classList.toggle('is-on', on);
            buttons[i].textContent = 'Auto-retaliate: ' + (on ? 'On' : 'Off');
        }
    },

    renderAutoPickup: function (hero) {
        var on = !hero || hero.autoPickup !== false;
        var vue = this.vueState();
        if (vue) {
            vue.autoPickupOn = on;
            vue.autoPickupLabel = 'Auto-pickup: ' + (on ? 'On' : 'Off');
        }
        var buttons = document.querySelectorAll('[data-auto-pickup]');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].classList.toggle('is-on', on);
            buttons[i].textContent = 'Auto-pickup: ' + (on ? 'On' : 'Off');
        }
    },

    renderShiftClickDrop: function (hero) {
        var on = !hero || hero.shiftClickDrop !== false;
        var vue = this.vueState();
        if (vue) {
            vue.shiftClickDropOn = on;
            vue.shiftClickDropLabel = 'Shift-click drop: ' + (on ? 'On' : 'Off');
        }
        var buttons = document.querySelectorAll('[data-shift-click-drop]');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].classList.toggle('is-on', on);
            buttons[i].textContent = 'Shift-click drop: ' + (on ? 'On' : 'Off');
        }
    },

    toggleFps: function () {
        var el = document.getElementById('fps-readout');
        if (!el) {
            return;
        }
        el.hidden = !el.hidden;
        this._showFps = !el.hidden;
        this.log('FPS/TPS readout ' + (this._showFps ? 'on' : 'off') + '.');
    },

    applyZoom: function (zoom) {
        var content = document.getElementById('content');
        var z = zoom;
        if (!(z >= 1) || z > 2) {
            z = 1;
        }
        if (content) {
            content.style.transformOrigin = 'center top';
            content.style.transform = z === 1 ? '' : ('scale(' + z + ')');
        }
        if (window.game && window.game.scale && window.game.scale.refresh) {
            window.game.scale.refresh();
        }
    },

    syncHideBones: function () {
        this.renderHideBones(this.hero());
    },

    renderHideBones: function (hero) {
        var on = !!(hero && hero.hideBones);
        var vue = this.vueState();
        if (vue) {
            vue.hideBonesOn = on;
            vue.hideBonesLabel = 'Hide bones: ' + (on ? 'On' : 'Off');
        }
        var buttons = document.querySelectorAll('[data-hide-bones]');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].classList.toggle('is-on', on);
            buttons[i].textContent = 'Hide bones: ' + (on ? 'On' : 'Off');
        }
    },

    renderCombatVisuals: function (hero) {
        var on = typeof showCombatVisualsOn === 'function'
            ? showCombatVisualsOn(hero)
            : (!hero || hero.showCombatVisuals !== false);
        var vue = this.vueState();
        if (vue) {
            vue.combatVisualsOn = on;
            vue.combatVisualsLabel = 'Combat visuals: ' + (on ? 'On' : 'Off');
        }
        var buttons = document.querySelectorAll('[data-combat-visuals]');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].classList.toggle('is-on', on);
            buttons[i].textContent = 'Combat visuals: ' + (on ? 'On' : 'Off');
        }
    },

    renderRangeRings: function (hero) {
        var on = typeof showRangeRingsOn === 'function'
            ? showRangeRingsOn(hero)
            : (!hero || hero.showRangeRings !== false);
        var vue = this.vueState();
        if (vue) {
            vue.rangeRingsOn = on;
            vue.rangeRingsLabel = 'Show range rings: ' + (on ? 'On' : 'Off');
        }
        var buttons = document.querySelectorAll('[data-range-rings]');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].classList.toggle('is-on', on);
            buttons[i].textContent = 'Show range rings: ' + (on ? 'On' : 'Off');
        }
    },

    renderMobSpawnModifier: function (hero) {
        var value = typeof mobSpawnModifierValue === 'function'
            ? mobSpawnModifierValue(hero)
            : (hero && typeof hero.mobSpawnModifier === 'number' && hero.mobSpawnModifier > 0
                ? hero.mobSpawnModifier
                : 1);
        var label = 'Mob spawn: ' + value + '×';
        var vue = this.vueState();
        var buttons;
        var i;
        var btnVal;
        if (vue) {
            vue.mobSpawnModifier = value;
            vue.mobSpawnModifierLabel = label;
        }
        buttons = document.querySelectorAll('[data-mob-spawn-mod]');
        for (i = 0; i < buttons.length; i++) {
            btnVal = parseFloat(buttons[i].getAttribute('data-mob-spawn-mod'));
            buttons[i].classList.toggle('is-on', btnVal === value);
        }
    },

    renderTargetTps: function (hero) {
        var raw = hero && (hero.simTps != null ? hero.simTps : hero.targetTps);
        var value = typeof normalizeTargetTps === 'function'
            ? normalizeTargetTps(raw)
            : (raw === 30 || raw === 120 ? raw : 60);
        var vue = this.vueState();
        var buttons;
        var i;
        var btnVal;
        var current = window.GameClock && typeof GameClock.getTps === 'function'
            ? GameClock.getTps()
            : null;
        if (typeof applyTargetTps === 'function' && current !== value) {
            applyTargetTps(value);
        }
        if (hero) {
            hero.simTps = value;
            hero.targetTps = value;
        }
        if (vue) {
            vue.targetTps = value;
            vue.targetTpsLabel = 'Sim TPS: ' + value;
        }
        buttons = document.querySelectorAll('[data-target-tps]');
        for (i = 0; i < buttons.length; i++) {
            btnVal = parseInt(buttons[i].getAttribute('data-target-tps'), 10);
            buttons[i].classList.toggle('is-on', btnVal === value);
        }
    },

    renderGameSpeed: function (hero) {
        var raw = hero && hero.gameSpeed;
        var value = typeof normalizeGameSpeed === 'function'
            ? normalizeGameSpeed(raw)
            : (raw === 0.5 || raw === 1.5 || raw === 2 ? raw : 1);
        var vue = this.vueState();
        var buttons;
        var i;
        var btnVal;
        var current = window.GameClock && typeof GameClock.getGameSpeed === 'function'
            ? GameClock.getGameSpeed()
            : null;
        if (typeof applyGameSpeed === 'function' && current !== value) {
            applyGameSpeed(value);
        }
        if (hero) {
            hero.gameSpeed = value;
        }
        if (vue) {
            vue.gameSpeed = value;
            vue.gameSpeedLabel = 'Game Speed: ' + value + '×';
        }
        buttons = document.querySelectorAll('[data-game-speed]');
        for (i = 0; i < buttons.length; i++) {
            btnVal = parseFloat(buttons[i].getAttribute('data-game-speed'));
            buttons[i].classList.toggle('is-on', btnVal === value);
        }
    },

    renderXpMultiplier: function (hero) {
        var raw = hero && hero.xpMultiplier;
        var value = typeof normalizeXpMultiplier === 'function'
            ? normalizeXpMultiplier(raw)
            : (raw === 2 || raw === 5 || raw === 10 || raw === 25 ? raw : 1);
        var vue = this.vueState();
        var buttons;
        var i;
        var btnVal;
        if (hero) {
            hero.xpMultiplier = value;
        }
        if (vue) {
            vue.xpMultiplier = value;
            vue.xpMultiplierLabel = 'XP: ' + value + '×';
        }
        buttons = document.querySelectorAll('[data-xp-mult]');
        for (i = 0; i < buttons.length; i++) {
            btnVal = parseFloat(buttons[i].getAttribute('data-xp-mult'));
            buttons[i].classList.toggle('is-on', btnVal === value);
        }
    },

    buildMinimap: function () {
        this.el.minimap.innerHTML = '';
        var order = [
            ['graves', 'northwood', 'highlands'],
            ['westmead', 'haven', 'millfields'],
            ['darkmine', 'southshore', 'mire']
        ];
        var labels = {
            graves: 'Graves', northwood: 'Woods', highlands: 'High',
            westmead: 'Mead', haven: 'Haven', millfields: 'Farm',
            darkmine: 'Mine', southshore: 'Shore', mire: 'Mire'
        };
        for (var r = 0; r < 3; r++) {
            for (var c = 0; c < 3; c++) {
                var cell = document.createElement('div');
                cell.className = 'mm-cell';
                cell.dataset.zone = order[r][c];
                cell.textContent = labels[order[r][c]];
                this.el.minimap.appendChild(cell);
            }
        }
    },

    renderWorldMap: function () {
        var list = this.el && this.el.worldMapList;
        if (!list || typeof ZONE_LIST === 'undefined') {
            return;
        }
        list.hidden = false;
        list.innerHTML = '';
        var head = document.createElement('div');
        head.className = 'wm-row wm-head';
        head.innerHTML = '<span>Land</span><span>Biome</span><span>Danger</span>';
        list.appendChild(head);
        var hereId = null;
        var world = window.game && window.game.scene && window.game.scene.getScene('WorldScene');
        if (world && world.zoneId) {
            hereId = world.zoneId;
        }
        for (var i = 0; i < ZONE_LIST.length; i++) {
            var zone = ZONE_LIST[i];
            if (zone.hidden) {
                continue;
            }
            var row = document.createElement('div');
            row.className = 'wm-row';
            row.setAttribute('data-zone', zone.id);
            if (zone.id === hereId) {
                row.classList.add('is-here');
            }
            var name = document.createElement('span');
            name.className = 'wm-name';
            name.textContent = zone.name;
            var biome = document.createElement('span');
            biome.className = 'wm-biome';
            biome.textContent = zone.biome;
            var danger = document.createElement('span');
            danger.className = 'wm-danger';
            danger.textContent = typeof zoneDanger === 'function' ? zoneDanger(zone.id) : '';
            row.appendChild(name);
            row.appendChild(biome);
            row.appendChild(danger);
            list.appendChild(row);
        }
    },

    highlightMinimap: function (zoneId) {
        var cells = this.el.minimap.querySelectorAll('.mm-cell');
        var world = window.game && window.game.scene.getScene('WorldScene');
        var i;
        for (i = 0; i < cells.length; i++) {
            cells[i].classList.toggle('is-here', cells[i].dataset.zone === zoneId);
            cells[i].querySelectorAll('.mm-dot').forEach(function (dot) {
                dot.remove();
            });
        }
        if (!world || !world.player || world.zoneId !== zoneId) {
            return;
        }
        var here = this.el.minimap.querySelector('.mm-cell.is-here');
        if (!here) {
            return;
        }
        function addDot(cls, wx, wy) {
            var dot = document.createElement('span');
            var px = Math.max(8, Math.min(92, (wx / (MAP_W * 16)) * 100));
            var py = Math.max(8, Math.min(92, (wy / (MAP_H * 16)) * 100));
            dot.className = 'mm-dot ' + cls;
            dot.style.left = px + '%';
            dot.style.top = py + '%';
            here.appendChild(dot);
        }
        addDot('is-player', world.player.x, world.player.y);
        if (world.npcs) {
            world.npcs.children.iterate(function (npc) {
                if (npc) {
                    addDot('is-npc', npc.x, npc.y);
                }
            });
        }
        if (world.mobs) {
            world.mobs.children.iterate(function (mob) {
                if (mob && mob.aliveMob) {
                    addDot('is-mob', mob.x, mob.y);
                }
            });
        }
    },

    showBattle: function (battle) {
        this.hideContextMenu();
        this.hideWorldMap();
        this.hideDialogue();
        this.hideShop();
        this.hideBank();
        this.hideStation();
        this.clearUseOn();
        this.battle = battle;
        this.selectingEnemy = false;
        if (this.el && this.el.battle) {
            this.el.battle.hidden = false;
        }
        this.setMode('battle');
        battle.autoSelectTarget();
        this.renderBattle();
        this.setActionsEnabled(false);
    },

    hideBattle: function () {
        if (this.el && this.el.battle) {
            this.el.battle.hidden = true;
        }
        this.battle = null;
        this.selectingEnemy = false;
        if (this.mode === 'battle') {
            this.setMode('world');
        }
    },

    battleLog: function (text) {
        var vue = this.vueState();
        if (vue) {
            vue.battleMessage = text;
        }
        if (this.el && this.el.message) {
            this.el.message.textContent = text;
        }
        this.log(text);
    },

    livingEnemyIndexes: function () {
        return this.battle ? this.battle.livingEnemyIndexes() : [];
    },

    canBattleAct: function () {
        if (this.worldCombat) {
            return true;
        }
        var battle = this.battle;
        return !!(battle && battle.isPlayerTurn() && battle.waitingForPlayer);
    },

    showOverworldBattle: function (world, mob, fight) {
        this.hideContextMenu();
        this.hideWorldMap();
        this.hideDialogue();
        this.hideShop();
        this.hideBank();
        this.hideStation();
        this.clearUseOn();
        this.battle = null;
        this.worldCombat = { world: world, mob: mob, fight: fight };
        this.selectingEnemy = false;
        if (this.el && this.el.battle) {
            this.el.battle.hidden = false;
        }
        this.setMode('battle');
        this.renderOverworldBattle(fight);
        this.setActionsEnabled(true);
        this.battleLog('You enter combat with ' + mob.mobDef.type + '.');
    },

    hideOverworldBattle: function () {
        this.worldCombat = null;
        this.hideBattle();
    },

    renderOverworldBattle: function (fight) {
        var mob;
        if (!this.el || !this.el.enemies || !fight) {
            return;
        }
        mob = fight.mob;
        this.el.enemies.innerHTML = '';
        if (!mob) {
            return;
        }
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'enemy-btn is-target';
        btn.textContent = mob.mobDef.type + '  ' + fight.hp + '/' + fight.maxHp;
        this.el.enemies.appendChild(btn);
        this.renderHero(this.hero());
        this.renderSpecialEnergy(this.hero());
    },

    renderSpecialEnergy: function (hero) {
        var el = document.getElementById('special-energy');
        var fill = document.getElementById('special-fill');
        var label = document.getElementById('special-label');
        var pct;
        if (!el || !fill) {
            return;
        }
        pct = hero && typeof hero.specialEnergy === 'number' ? hero.specialEnergy : 100;
        pct = Math.max(0, Math.min(100, pct));
        this.paintStatBar(fill, label, pct, 100, '#e8a030', Math.round(pct) + '%');
        el.hidden = false;
    },

    trySpecialAttack: function () {
        var hero = this.hero();
        var wc = this.worldCombat;
        if (!wc || !hero) {
            return false;
        }
        ensureSpecialEnergy(hero);
        if (hero.specialEnergy < 25) {
            this.log('You need at least 25% special attack energy.');
            return false;
        }
        hero.specialEnergy -= 25;
        wc.fight.specialQueued = true;
        this.saveHero(hero);
        this.renderSpecialEnergy(hero);
        wc.world.tickOverworldFight(true);
        return true;
    },

    tryAttack: function () {
        if (this.worldCombat) {
            this.worldCombat.world.tickOverworldFight(true);
            return;
        }
        if (!this.canBattleAct()) {
            return;
        }
        var index = this.battle.autoSelectTarget();
        if (index == null) {
            this.selectingEnemy = true;
            this.battleLog('Click an enemy to attack.');
            this.setActionsEnabled(true);
            return;
        }
        this.selectingEnemy = false;
        this.setActionsEnabled(false);
        this.battle.receivePlayerSelection('attack', index);
    },

    onEnemyPicked: function (index, fromSprite) {
        if (!this.battle || !this.battle.enemies[index] || !this.battle.enemies[index].living) {
            return;
        }
        this.battle.targetIndex = index;
        this.battle.refreshTargetMarker();
        this.renderBattle();
        var canStrike = this.canBattleAct() && !fromSprite;
        if (fromSprite && this.selectingEnemy && this.battle.pickReady && this.canBattleAct()) {
            canStrike = true;
        }
        if (canStrike) {
            this.selectingEnemy = false;
            this.setActionsEnabled(false);
            this.battle.receivePlayerSelection('attack', index);
            return;
        }
        this.battleLog('Target: ' + this.battle.enemies[index].type + '.');
        if (this.canBattleAct()) {
            this.setActionsEnabled(true);
        }
    },

    renderBattle: function () {
        if (!this.battle) {
            return;
        }
        var self = this;
        var selected = this.battle.targetIndex;
        this.el.enemies.innerHTML = '';
        this.battle.enemies.forEach(function (enemy, index) {
            if (!enemy.living) {
                return;
            }
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'enemy-btn' + (index === selected ? ' is-target' : '');
            btn.textContent = '';
            var icon = document.createElement('img');
            icon.className = 'pix';
            icon.alt = '';
            icon.src = 'assets/svg/mobs/' + String(enemy.type).toLowerCase() + '.svg';
            btn.appendChild(icon);
            btn.appendChild(document.createTextNode(' ' + enemy.type + '  ' + enemy.hp + '/' + enemy.maxHp));
            btn.addEventListener('click', function () {
                self.onEnemyPicked(index);
            });
            self.el.enemies.appendChild(btn);
        });
        this.renderHero(this.hero());
    },

    setActionsEnabled: function (on) {
        if (on && !this.canBattleAct()) {
            on = false;
        }
        if (this.worldCombat) {
            on = true;
        }
        var buttons = this.el.actions.querySelectorAll('button[data-action]');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].disabled = !on;
        }
    },

    bindActions: function () {
        var self = this;
        this.el.actions.addEventListener('click', function (event) {
            var btn = event.target.closest('[data-action]');
            var action = btn && btn.getAttribute('data-action');
            if (!action) {
                return;
            }
            if (self.worldCombat) {
                var world = self.worldCombat.world;
                if (action === 'attack') {
                    self.tryAttack();
                    return;
                }
                if (action === 'heal') {
                    world.tryOverworldEat();
                    return;
                }
                if (action === 'flee') {
                    world.tryOverworldFlee();
                }
                return;
            }
            if (!self.battle) {
                return;
            }
            if (!self.canBattleAct()) {
                return;
            }
            if (action === 'attack') {
                self.tryAttack();
                return;
            }
            self.selectingEnemy = false;
            self.setActionsEnabled(false);
            self.battle.receivePlayerSelection(action, self.battle.targetIndex);
        });
    },

    onPlayerTurn: function (battle) {
        this.battle = battle;
        battle.autoSelectTarget();
        this.selectingEnemy = false;
        this.renderBattle();
        this.setActionsEnabled(true);
        var target = battle.enemies[battle.targetIndex];
        this.battleLog(target ? 'Your turn. Target: ' + target.type + '.' : 'Your turn.');
        var hero = this.hero();
        if (hero && autoRetaliateOn(hero) && battle && battle.isPlayerTurn()) {
            var self = this;
            battle.time.delayedCall(180, function () {
                if (self.mode === 'battle' && self.battle === battle && autoRetaliateOn(hero) && battle.isPlayerTurn() && !battle.busy) {
                    self.tryAttack();
                }
            });
        }
    }
};
