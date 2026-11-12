/**
 * Vue 3 CDN display mirror for the Emberwood HUD.
 * Phaser owns all game logic/data; this app only reflects snapshots pushed via Hud.
 */
var HudApp = {
    app: null,
    vm: null,
    state: null,

    createState: function () {
        return {
            mode: 'title',
            zone: 'Emberhaven',
            zoneId: 'haven',
            hp: 100,
            maxHp: 100,
            hpText: '100 / 100',
            hpFillPct: 100,
            hpFillColor: '#3dcc6a',
            gold: 0,
            xp: 0,
            xpText: '0 / 40',
            xpFillPct: 0,
            xpFillColor: '#c9a227',
            level: 3,
            displayName: 'Adventurer',
            total: 22,
            runEnergy: 100,
            runText: '100 / 100',
            runFillPct: 100,
            runFillColor: '#6a9ad4',
            running: false,
            quest: 'Talk to Guildmaster Bram in Emberhaven.',
            tab: 'inv',
            chatLines: [],
            startEnabled: false,
            continueEnabled: false,
            creditsOpen: false,
            titleVisible: true,
            deadVisible: false,
            deadText: 'You have been defeated.',
            battleVisible: false,
            battleMessage: 'A foe approaches.',
            shellTitle: true,
            autoAttackLabel: 'Auto-attack: Off',
            autoAttackOn: false,
            autoAttackRange: 3,
            autoRetaliateLabel: 'Auto-retaliate: Off',
            autoRetaliateOn: false,
            autoPickupLabel: 'Auto-pickup: On',
            autoPickupOn: true,
            shiftClickDropLabel: 'Shift-click drop: On',
            shiftClickDropOn: true,
            hideBonesLabel: 'Hide bones: Off',
            hideBonesOn: false,
            combatVisualsLabel: 'Combat visuals: On',
            combatVisualsOn: true,
            rangeRingsLabel: 'Show range rings: On',
            rangeRingsOn: true,
            mobSpawnModifier: 1,
            mobSpawnModifierLabel: 'Mob spawn: 1×',
            runLabel: 'Run: Off',
            collisionDebugLabel: 'Collision debug: Off',
            collisionDebugOn: false,
            styleAccurateOn: false,
            styleAggressiveOn: false,
            styleDefensiveOn: false,
            styleSharedOn: true,
            styleAccurateLabel: 'Accurate',
            stylePowerLabel: 'Strength',
            styleDefensiveLabel: 'Defensive',
            styleHint: 'Shared splits XP between Attack, Defence, and Strength / Ranger / Mage.',
            combatWeaponLabel: 'Melee'
        };
    },

    mount: function () {
        var self = this;
        if (this.vm || typeof Vue === 'undefined') {
            return this.vm;
        }
        var initial = this.createState();
        this.app = Vue.createApp({
            data: function () {
                return initial;
            },
            methods: {
                onStart: function () {
                    if (window.Hud && Hud.onStart) {
                        Hud.onStart();
                    }
                },
                onContinue: function () {
                    if (window.Hud && Hud.onContinue) {
                        Hud.onContinue();
                    }
                },
                onCredits: function () {
                    this.creditsOpen = !this.creditsOpen;
                    var credit = document.getElementById('credit-text');
                    if (credit) {
                        credit.hidden = !this.creditsOpen;
                    }
                },
                onRespawn: function () {
                    if (window.Hud && Hud.respawnInHaven) {
                        Hud.respawnInHaven();
                    }
                },
                onRetry: function () {
                    if (window.Hud && Hud.hideDead) {
                        Hud.hideDead();
                    }
                    if (window.Hud && Hud.showTitle) {
                        Hud.showTitle();
                    }
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
                },
                onTab: function (id) {
                    if (window.Hud && Hud.showTab) {
                        Hud.showTab(id);
                    }
                },
                onRunToggle: function () {
                    if (window.Hud && Hud.toggleRun) {
                        Hud.toggleRun();
                    }
                },
                onStyle: function (style) {
                    if (window.Hud && Hud.setStyle) {
                        Hud.setStyle(style);
                    } else if (window.Hud && Hud.hero) {
                        var hero = Hud.hero();
                        if (hero && style) {
                            hero.style = style;
                            if (Hud.saveHero) {
                                Hud.saveHero(hero);
                            } else if (Hud.renderStyles) {
                                Hud.renderStyles(hero);
                            }
                        }
                    }
                },
                onAutoAttack: function () {
                    if (window.Hud && Hud.toggleAutoAttack) {
                        Hud.toggleAutoAttack();
                    }
                },
                onAutoRetaliate: function () {
                    if (window.Hud && Hud.toggleAutoRetaliate) {
                        Hud.toggleAutoRetaliate();
                    }
                },
                onAutoPickup: function () {
                    if (window.Hud && Hud.toggleAutoPickup) {
                        Hud.toggleAutoPickup();
                    }
                },
                onShiftClickDrop: function () {
                    if (window.Hud && Hud.toggleShiftClickDrop) {
                        Hud.toggleShiftClickDrop();
                    }
                },
                onCollisionDebug: function () {
                    if (window.Hud && Hud.toggleCollisionDebug) {
                        Hud.toggleCollisionDebug();
                    }
                },
                onWindStrike: function () {
                    if (window.Hud && Hud.castWindStrike) {
                        Hud.castWindStrike();
                    }
                },
                onLevelUpClose: function () {
                    if (window.Hud && Hud.hideLevelUp) {
                        Hud.hideLevelUp();
                    }
                },
                onWorldMapClose: function () {
                    if (window.Hud && Hud.hideWorldMap) {
                        Hud.hideWorldMap();
                    }
                },
                onShopClose: function () {
                    if (window.Hud && Hud.hideShop) {
                        Hud.hideShop();
                    }
                },
                onBankClose: function () {
                    if (window.Hud && Hud.hideBank) {
                        Hud.hideBank();
                    }
                }
            },
            mounted: function () {
                self.vm = this;
                // Use the component proxy so assignments stay reactive.
                self.state = this;
                if (window.Hud && Hud.onVueMounted) {
                    Hud.onVueMounted();
                }
            }
        });

        this.app.directive('manual', {
            mounted: function (el) {
                el.__hudManual = document.createDocumentFragment();
            },
            beforeUpdate: function (el) {
                var frag = el.__hudManual;
                if (!frag) {
                    return;
                }
                while (el.firstChild) {
                    frag.appendChild(el.firstChild);
                }
            },
            updated: function (el) {
                var frag = el.__hudManual;
                if (!frag) {
                    return;
                }
                el.appendChild(frag);
            }
        });

        this.vm = this.app.mount('#hud-root');
        this.state = this.vm;
        return this.vm;
    },

    syncMode: function (mode) {
        if (!this.state) {
            return;
        }
        this.state.mode = mode;
        this.state.titleVisible = mode === 'title';
        this.state.deadVisible = mode === 'dead';
        this.state.battleVisible = mode === 'battle';
        this.state.shellTitle = mode === 'title';
    }
};
