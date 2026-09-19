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
            enemies: document.getElementById('battle-enemies'),
            actions: document.getElementById('battle-actions'),
            message: document.getElementById('battle-message'),
            start: document.getElementById('btn-start'),
            credits: document.getElementById('btn-credits'),
            creditText: document.getElementById('credit-text'),
            retry: document.getElementById('btn-retry'),
            inv: document.getElementById('inv-grid'),
            skills: document.getElementById('skills-list'),
            equip: document.getElementById('equip-grid'),
            tabs: document.getElementById('tab-bar'),
            styles: document.getElementById('style-row'),
            ctx: document.getElementById('ctx-menu')
        };
        this.ctxTarget = null;
        this.buildMinimap();
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
        this.el.inv.addEventListener('click', function (event) {
            var slot = event.target.closest('[data-item]');
            if (!slot) {
                return;
            }
            self.useItem(slot.getAttribute('data-item'));
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
                if (!zoneId) {
                    return;
                }
                self.clickMinimap(zoneId);
            });
        }
        window.addEventListener('keydown', function (event) {
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
            if (event.target && event.target.closest && event.target.closest('#title-overlay, #dead-overlay')) {
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
        if (this.mode === 'battle') {
            this.log('Use Eat food on your combat turn.');
            return;
        }
        if (this.mode === 'title' || this.mode === 'dead') {
            return;
        }
        var def = ITEM_DB[id];
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
        this.mode = 'dead';
        this.el.dead.hidden = false;
        document.getElementById('dead-text').textContent = text || 'You have been defeated.';
    },

    hideDead: function () {
        this.el.dead.hidden = true;
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

    chooseContext: function (action) {
        var target = this.ctxTarget;
        this.hideContextMenu();
        if (action !== 'walk-here' || !target) {
            return;
        }
        if (this.mode !== 'world') {
            return;
        }
        var world = window.game && window.game.scene.getScene('WorldScene');
        if (!world || !world.setWalk || world.encounterLock) {
            return;
        }
        world.engageTarget = null;
        world.talkTarget = null;
        world.setWalk(target.worldX, target.worldY);
    },

    clickMinimap: function (zoneId) {
        this.hideContextMenu();
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
        this.paintHpFill(hero.hp, hero.maxHp);
        this.renderInventory(hero);
        this.renderSkills(hero);
        this.renderEquip(hero);
        this.renderStyles(hero);
        this.renderAutoAttack(hero);
        this.renderAutoPickup(hero);
        this.renderRun(hero);
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
        for (i = 0; i < 28; i++) {
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
                var cell = document.createElement('button');
                cell.type = 'button';
                cell.className = 'mm-cell';
                cell.dataset.zone = order[r][c];
                cell.textContent = labels[order[r][c]];
                this.el.minimap.appendChild(cell);
            }
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

    tryAttack: function () {
        if (!this.battle || this.battle.busy) {
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
        var canStrike = this.battle.isPlayerTurn() && !fromSprite;
        if (fromSprite && this.selectingEnemy && this.battle.pickReady && this.battle.isPlayerTurn()) {
            canStrike = true;
        }
        if (canStrike) {
            this.selectingEnemy = false;
            this.setActionsEnabled(false);
            this.battle.receivePlayerSelection('attack', index);
            return;
        }
        this.battleLog('Target: ' + this.battle.enemies[index].type + '.');
        if (this.battle.isPlayerTurn()) {
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
        if (hero && hero.autoAttack && battle && battle.isPlayerTurn()) {
            var self = this;
            battle.time.delayedCall(180, function () {
                if (self.mode === 'battle' && self.battle === battle && hero.autoAttack && battle.isPlayerTurn() && !battle.busy) {
                    self.tryAttack();
                }
            });
        }
    }
};
