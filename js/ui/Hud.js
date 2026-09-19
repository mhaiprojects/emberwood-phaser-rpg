var Hud = {
    mode: 'title',
    battle: null,
    selectingEnemy: false,
    tab: 'inv',

    init: function () {
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
            quest: document.getElementById('hud-quest'),
            questTab: document.getElementById('hud-quest-tab'),
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
            tabs: document.getElementById('tab-bar'),
            styles: document.getElementById('style-row'),
            ctx: document.getElementById('ctx-menu'),
            dialogue: document.getElementById('dialogue-overlay'),
            dialogueSpeaker: document.getElementById('dialogue-speaker'),
            dialogueText: document.getElementById('dialogue-text'),
            dialogueOptions: document.getElementById('dialogue-options'),
            dialogueContinue: document.getElementById('dialogue-continue'),
            shop: document.getElementById('shop-overlay'),
            shopSpeaker: document.getElementById('shop-speaker'),
            shopCopy: document.getElementById('shop-copy'),
            shopClose: document.getElementById('btn-shop-close'),
            bank: document.getElementById('bank-overlay'),
            bankSpeaker: document.getElementById('bank-speaker'),
            bankCopy: document.getElementById('bank-copy'),
            bankInv: document.getElementById('bank-inv-grid'),
            bankVault: document.getElementById('bank-vault-grid'),
            bankClose: document.getElementById('btn-bank-close')
        };
        this.ctxTarget = null;
        this.dialogue = null;
        this.bankSel = null;
        this.buildMinimap();
        this.renderWorldMap();
        this.bindInterface();
        this.bindHudBlur();
        this.hideContextMenu();
        var self = this;
        this.el.start.disabled = true;
        this.el.start.addEventListener('click', function () {
            self.onStart();
        });
        this.el.credits.addEventListener('click', function () {
            self.el.creditText.hidden = !self.el.creditText.hidden;
        });
        this.el.respawn.addEventListener('click', function () {
            self.respawnInHaven();
        });
        this.el.retry.addEventListener('click', function () {
            self.hideDead();
            self.showTitle();
            if (window.game) {
                window.game.scene.getScenes(true).forEach(function (scene) {
                    var key = scene.sys.settings.key;
                    if (key && key !== 'TitleScene') {
                        window.game.scene.stop(key);
                    }
                });
                window.game.scene.start('TitleScene');
            }
        });
        this.showTitle();
        this.showTab('inv');
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
            var hero = self.hero();
            if (!style || !hero) {
                return;
            }
            hero.style = style;
            self.saveHero(hero);
            self.renderStyles(hero);
            self.log('Combat style: ' + style + '.');
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
        this.el.inv.addEventListener('click', function (event) {
            var slot = event.target.closest('[data-item]');
            if (!slot) {
                return;
            }
            self.useItem(slot.getAttribute('data-item'));
        });
        this.el.inv.addEventListener('contextmenu', function (event) {
            event.preventDefault();
            var slot = event.target.closest('[data-item]');
            if (!slot) {
                return;
            }
            self.showInvDropMenu(slot.getAttribute('data-item'), event);
        });
        if (this.el.ctx) {
            this.el.ctx.addEventListener('click', function (event) {
                var btn = event.target.closest('[data-ctx]');
                if (!btn) {
                    return;
                }
                self.chooseContext(btn.getAttribute('data-ctx'));
            });
        }
        document.addEventListener('mousedown', function (event) {
            if (!self.el.ctx || self.el.ctx.hidden) {
                return;
            }
            if (event.button !== 0) {
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
                var btn = event.target && event.target.closest && event.target.closest('[data-shop-action]');
                if (!btn) {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                btn.blur();
                var action = btn.getAttribute('data-shop-action');
                if (action === 'close') {
                    self.hideShop();
                    return;
                }
                if (action === 'buy' || action === 'sell') {
                    if (action === 'buy' && typeof canAddItem === 'function' && !canAddItem(self.hero())) {
                        self.log('inventory full');
                        return;
                    }
                    self.log('The shelves are still being stocked.');
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
        if (this.el.dialogue) {
            this.el.dialogue.addEventListener('click', function (event) {
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
            if (event.code === 'Escape' && self.el.shop && !self.el.shop.hidden) {
                self.hideShop();
                return;
            }
            if (event.code === 'Escape' && self.el.bank && !self.el.bank.hidden) {
                self.hideBank();
                return;
            }
            if (event.code === 'Escape' && self.el.worldMap && !self.el.worldMap.hidden) {
                self.hideWorldMap();
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
                F1: 'combat', F2: 'skills', F3: 'quest', F4: 'inv',
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
            if (event.target && event.target.closest && event.target.closest('#title-overlay, #dead-overlay, #world-map-overlay, #dialogue-overlay, #shop-overlay, #bank-overlay')) {
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
        var panels = document.querySelectorAll('.tab-panel');
        for (var i = 0; i < panels.length; i++) {
            panels[i].hidden = panels[i].id !== 'panel-' + id;
        }
        var buttons = this.el.tabs.querySelectorAll('button');
        for (var b = 0; b < buttons.length; b++) {
            buttons[b].classList.toggle('is-on', buttons[b].getAttribute('data-tab') === id);
        }
    },

    hero: function () {
        return window.game ? window.game.registry.get('hero') : null;
    },

    saveHero: function (hero) {
        if (window.game) {
            window.game.registry.set('hero', hero);
        }
        var world = window.game && window.game.scene.getScene('WorldScene');
        if (world && world.scene.isActive() && world.refreshHud) {
            world.refreshHud();
        } else {
            this.renderHero(hero);
        }
    },

    useItem: function (id) {
        var hero = this.hero();
        if (!hero || !id) {
            return;
        }
        if (this.mode === 'title' || this.mode === 'dead') {
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
        if (def && def.heal) {
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
            return;
        }
        this.log(itemName(id) + '.');
    },

    dropItem: function (id, qty) {
        var world = window.game && window.game.scene.getScene('WorldScene');
        if (!world || !world.dropFromInventory) {
            return false;
        }
        return world.dropFromInventory(id, qty || 1);
    },

    showInvDropMenu: function (id, event) {
        if (this.mode !== 'world' || !id) {
            this.hideContextMenu();
            return;
        }
        this.showContextMenu([{ label: 'Drop', action: 'drop' }], {
            kind: 'inv',
            itemId: id,
            clientX: event && event.clientX != null ? event.clientX : 16,
            clientY: event && event.clientY != null ? event.clientY : 16
        });
    },

    onStart: function () {
        if (this._startHandler) {
            this._startHandler();
        }
    },

    setStartHandler: function (fn) {
        this._startHandler = fn;
        if (this.el && this.el.start) {
            this.el.start.disabled = false;
        }
    },

    showTitle: function () {
        this.mode = 'title';
        this.hideContextMenu();
        this.hideWorldMap();
        this.hideDialogue();
        this.hideShop();
        this.hideBank();
        this.el.title.hidden = false;
        this.el.battle.hidden = true;
        this.el.dead.hidden = true;
        this.el.shell.classList.add('is-title');
    },

    hideTitle: function () {
        this.el.title.hidden = true;
        this.el.shell.classList.remove('is-title');
        this.mode = 'world';
        if (this.el.start) {
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
        this.mode = 'dead';
        this.el.dead.hidden = false;
        document.getElementById('dead-text').textContent = text || 'You have been defeated.';
    },

    hideDead: function () {
        this.el.dead.hidden = true;
    },

    safeDeathHp: function (hero) {
        var maxHp = hero && hero.maxHp > 0 ? hero.maxHp : 10;
        return Math.max(1, Math.floor(maxHp / 10));
    },

    respawnInHaven: function () {
        var hero = this.hero();
        if (hero) {
            hero.hp = this.safeDeathHp(hero);
            this.saveHero(hero);
        }
        this.hideDead();
        this.mode = 'world';
        if (!window.game) {
            return;
        }
        window.game.registry.set('zone', 'haven');
        window.game.registry.set('battleOutcome', null);
        var world = window.game.scene.getScene('WorldScene');
        if (window.game.scene.isActive('WorldScene') && world && world.player && world.respawnInHaven) {
            world.respawnInHaven();
            this.log('You wake in Emberhaven, barely standing.');
            if (window.game.scene.isActive('GameOverScene')) {
                window.game.scene.stop('GameOverScene');
            }
            return;
        }
        window.game.registry.set('respawnAfterDeath', true);
        window.game.scene.getScenes(true).forEach(function (scene) {
            var key = scene.sys.settings.key;
            if (key && key !== 'WorldScene') {
                window.game.scene.stop(key);
            }
        });
        window.game.scene.start('WorldScene');
    },

    showContextMenu: function (items, pos) {
        var menu = this.el && this.el.ctx;
        if (!menu) {
            return;
        }
        this.ctxTarget = pos || null;
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
            btn.setAttribute('data-ctx', item.action);
            menu.appendChild(btn);
        }
        menu.hidden = false;
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
        this.dialogue = { speaker: speaker || '', pages: clean, index: 0, options: options };
        this.renderDialogue(true);
    },

    dialogueOpen: function () {
        return !!(this.dialogue && this.el && this.el.dialogue && !this.el.dialogue.hidden);
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
                ? 'Click to close'
                : 'Click to continue';
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
        if (!this.dialogueOpen()) {
            return false;
        }
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
        this.hideContextMenu();
        this.hideWorldMap();
        this.hideDialogue();
        this.hideBank();
        var name = def && def.name ? def.name : 'Shopkeeper';
        if (this.el.shopSpeaker) {
            this.el.shopSpeaker.textContent = name;
        }
        if (this.el.shopCopy) {
            this.el.shopCopy.textContent = 'The shelves are still being stocked.';
        }
        this.el.shop.hidden = false;
        this.el.shop.setAttribute('data-shop', def && def.key ? def.key : 'shop');
    },

    hideShop: function () {
        if (this.el && this.el.shop) {
            this.el.shop.hidden = true;
            this.el.shop.removeAttribute('data-shop');
            if (this.el.shopClose) {
                this.el.shopClose.blur();
            }
        }
    },

    shopOpen: function () {
        return !!(this.el && this.el.shop && !this.el.shop.hidden);
    },

    showBank: function (def) {
        if (!this.el || !this.el.bank || this.mode !== 'world') {
            return;
        }
        this.hideContextMenu();
        this.hideWorldMap();
        this.hideDialogue();
        this.hideShop();
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
        this.renderBank();
    },

    hideBank: function () {
        if (this.el && this.el.bank) {
            this.el.bank.hidden = true;
            this.el.bank.removeAttribute('data-bank');
            if (this.el.bankClose) {
                this.el.bankClose.blur();
            }
        }
        this.bankSel = null;
    },

    bankOpen: function () {
        return !!(this.el && this.el.bank && !this.el.bank.hidden);
    },

    renderBank: function () {
        var hero = this.hero();
        if (!this.el || !this.el.bankInv || !this.el.bankVault) {
            return;
        }
        this.el.bankInv.innerHTML = this.bankGridHtml(hero && hero.inventory, 'inv');
        this.el.bankVault.innerHTML = this.bankGridHtml(hero && ensureBank(hero), 'vault');
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
        if (!id) {
            this.log(action === 'withdraw' ? 'Select a bank item to withdraw.' : 'Select an inventory item to deposit.');
            return;
        }
        if (action === 'deposit') {
            if (!depositItem(hero, id, 1)) {
                this.log('You have nothing to deposit.');
                return;
            }
            this.saveHero(hero);
            this.log('You deposit 1 x ' + itemName(id) + '.');
            return;
        }
        if (action === 'withdraw') {
            if (typeof canAddItem === 'function' && !canAddItem(hero, id)) {
                this.log('inventory full');
                return;
            }
            if (!withdrawItem(hero, id, 1)) {
                this.log('The bank is empty.');
                return;
            }
            this.saveHero(hero);
            this.log('You withdraw 1 x ' + itemName(id) + '.');
        }
    },

    chooseContext: function (action) {
        var target = this.ctxTarget;
        this.hideContextMenu();
        if (this.mode !== 'world' || !target) {
            return;
        }
        var world = window.game && window.game.scene.getScene('WorldScene');
        if (!world || world.encounterLock) {
            return;
        }
        if (action === 'examine') {
            if (world.examineAt) {
                world.examineAt(target.worldX, target.worldY);
            }
            return;
        }
        if (action === 'drop') {
            this.dropItem(target.itemId);
            return;
        }
        if (action !== 'walk-here' || !world.setWalk) {
            return;
        }
        world.engageTarget = null;
        world.talkTarget = null;
        world.setWalk(target.worldX, target.worldY);
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
        world.walkTowardZone(zoneId);
    },

    log: function (line) {
        var p = document.createElement('div');
        p.className = 'chat-line';
        p.textContent = line;
        this.el.log.appendChild(p);
        this.el.log.scrollTop = this.el.log.scrollHeight;
        while (this.el.log.children.length > 40) {
            this.el.log.removeChild(this.el.log.firstChild);
        }
    },

    setWorld: function (state) {
        this.el.zone.textContent = state.zone;
        this.el.hp.textContent = state.hp + ' / ' + state.maxHp;
        this.el.gold.textContent = String(state.gold);
        this.el.xp.textContent = String(state.xp);
        this.el.level.textContent = String(state.level);
        this.el.quest.textContent = state.quest;
        if (this.el.questTab) {
            this.el.questTab.textContent = state.quest;
        }
        this.highlightMinimap(state.zoneId);
        if (this.el.worldMap && !this.el.worldMap.hidden) {
            this.renderWorldMap();
        }
        this.paintHpFill(state.hp, state.maxHp);
        this.renderHero(this.hero());
    },

    paintHpFill: function (hp, maxHp) {
        var fill = document.getElementById('hp-fill');
        if (!fill) {
            return;
        }
        var ratio = maxHp ? hp / maxHp : 0;
        fill.style.width = Math.max(0, Math.min(100, ratio * 100)) + '%';
        if (ratio < 0.35) {
            fill.style.backgroundColor = '#cc3d3d';
        } else if (ratio < 0.65) {
            fill.style.backgroundColor = '#d4a017';
        } else {
            fill.style.backgroundColor = '#3dcc6a';
        }
    },

    renderHero: function (hero) {
        if (!hero) {
            return;
        }
        this.el.hp.textContent = hero.hp + ' / ' + hero.maxHp;
        this.el.gold.textContent = String(hero.gold);
        if (this.el.level) {
            this.el.level.textContent = String(
                typeof combatLevel === 'function' ? combatLevel(hero) : hero.level
            );
        }
        this.paintHpFill(hero.hp, hero.maxHp);
        this.renderInventory(hero);
        this.renderSkills(hero);
        this.renderEquip(hero);
        this.renderStyles(hero);
        this.renderAutoAttack(hero);
        this.renderAutoRetaliate(hero);
        this.renderAutoPickup(hero);
        this.renderRun(hero);
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
        var fill = document.getElementById('run-fill');
        var label = document.getElementById('hud-run');
        var bar = document.getElementById('run-bar');
        var amount = typeof energy === 'number' ? energy : 0;
        var cap = max || 100;
        if (label) {
            label.textContent = String(Math.round(amount));
        }
        if (fill) {
            var ratio = cap ? amount / cap : 0;
            fill.style.width = Math.max(0, Math.min(100, ratio * 100)) + '%';
            fill.style.backgroundColor = running ? '#e6c56a' : '#6a9ad4';
        }
        if (bar) {
            bar.classList.toggle('is-on', !!running);
        }
    },

    renderRun: function (hero) {
        var on = !!(hero && hero.running);
        var energy = hero && hero.runEnergy != null ? hero.runEnergy : 100;
        var buttons = document.querySelectorAll('.run-mode-btn');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].classList.toggle('is-on', on);
            buttons[i].textContent = 'Run: ' + (on ? 'On' : 'Off');
        }
        this.paintRunEnergy(energy, 100, on);
    },

    renderInventory: function (hero) {
        var html = '';
        var i;
        for (i = 0; i < INVENTORY_CAP; i++) {
            var stack = hero.inventory[i];
            if (stack) {
                var def = ITEM_DB[stack.id] || { name: stack.id, icon: '?' };
                html += '<button type="button" class="inv-slot" data-item="' + stack.id + '" title="' + def.name + '">' +
                    '<img class="pix" src="' + itemIcon(stack.id) + '" alt="">' +
                    (stack.qty > 1 ? '<span class="qty">' + stack.qty + '</span>' : '') +
                    '</button>';
            } else {
                html += '<div class="inv-slot"></div>';
            }
        }
        this.el.inv.innerHTML = html;
    },

    renderSkills: function (hero) {
        var html = '';
        SKILL_NAMES.forEach(function (pair) {
            var skill = hero.skills && hero.skills[pair[0]];
            var level = skill ? skill.level : 1;
            html += '<div class="skill-row"><img class="pix" src="' + skillIcon(pair[0]) + '" alt="">' +
                '<span>' + pair[1] + '</span><strong>' + level + '</strong></div>';
        });
        this.el.skills.innerHTML = html;
    },

    renderEquip: function (hero) {
        var slots = [
            ['weapon', 'Weapon'],
            ['shield', 'Shield']
        ];
        var html = '';
        for (var i = 0; i < slots.length; i++) {
            var id = hero.equipment && hero.equipment[slots[i][0]];
            html += '<div class="equip-row"><span>' + slots[i][1] + '</span><strong>' +
                (id ? '<img class="pix" src="' + itemIcon(id) + '" alt=""> ' + itemName(id) : 'None') + '</strong></div>';
        }
        this.el.equip.innerHTML = html;
    },

    renderStyles: function (hero) {
        var buttons = this.el.styles.querySelectorAll('button');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].classList.toggle('is-on', buttons[i].getAttribute('data-style') === hero.style);
        }
    },

    renderAutoAttack: function (hero) {
        var on = !!(hero && hero.autoAttack);
        var buttons = document.querySelectorAll('[data-auto-attack]');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].classList.toggle('is-on', on);
            buttons[i].textContent = 'Auto-attack: ' + (on ? 'On' : 'Off');
        }
    },

    renderAutoRetaliate: function (hero) {
        var on = autoRetaliateOn(hero);
        var buttons = document.querySelectorAll('[data-auto-retaliate]');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].classList.toggle('is-on', on);
            buttons[i].textContent = 'Auto-retaliate: ' + (on ? 'On' : 'Off');
        }
    },

    renderAutoPickup: function (hero) {
        var on = !hero || hero.autoPickup !== false;
        var buttons = document.querySelectorAll('[data-auto-pickup]');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].classList.toggle('is-on', on);
            buttons[i].textContent = 'Auto-pickup: ' + (on ? 'On' : 'Off');
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
        for (var i = 0; i < cells.length; i++) {
            cells[i].classList.toggle('is-here', cells[i].dataset.zone === zoneId);
        }
    },

    showBattle: function (battle) {
        this.hideContextMenu();
        this.hideWorldMap();
        this.hideDialogue();
        this.hideShop();
        this.hideBank();
        this.battle = battle;
        this.selectingEnemy = false;
        this.el.battle.hidden = false;
        this.mode = 'battle';
        battle.autoSelectTarget();
        this.renderBattle();
        this.setActionsEnabled(false);
    },

    hideBattle: function () {
        this.el.battle.hidden = true;
        this.battle = null;
        this.selectingEnemy = false;
        if (this.mode === 'battle') {
            this.mode = 'world';
        }
    },

    battleLog: function (text) {
        this.el.message.textContent = text;
        this.log(text);
    },

    livingEnemyIndexes: function () {
        return this.battle ? this.battle.livingEnemyIndexes() : [];
    },

    canBattleAct: function () {
        var battle = this.battle;
        return !!(battle && battle.isPlayerTurn() && battle.waitingForPlayer);
    },

    tryAttack: function () {
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
            if (!action || !self.battle) {
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
