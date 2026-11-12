// Combat stays turn-based. Attack/enemy turns queue the next actor after 0.9 game-seconds.
var BATTLE_TURN_QUEUE_SEC = 0.9;
var BATTLE_TURN_QUEUE_MS = 900;
var BATTLE_HEAL_QUEUE_SEC = 0.8;
var BATTLE_FLEE_END_SEC = 0.5;
var BATTLE_PICK_READY_SEC = 0.18;

var BattleScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function BattleScene() {
        Phaser.Scene.call(this, { key: 'BattleScene' });
    },

    create: function () {
        this.cameras.main.setBackgroundColor('#163822');
        this.drawArena();
        this.turnTimer = null;
        this.busy = false;
        this.sys.events.off('wake', this.startBattle, this);
        this.startBattle();
        this.sys.events.on('wake', this.startBattle, this);
    },

    drawArena: function () {
        var g = this.add.graphics();
        g.fillStyle(0x0e2a18, 1);
        g.fillRect(0, 0, 512, 220);
        g.fillStyle(0x1d4a2c, 1);
        g.fillTriangle(-10, 220, 90, 40, 210, 220);
        g.fillTriangle(140, 220, 280, 20, 420, 220);
        g.fillTriangle(320, 220, 470, 50, 540, 220);
        g.fillStyle(0x163822, 1);
        g.fillRect(0, 200, 512, 40);
    },

    startBattle: function () {
        this.clearUnits();
        this.busy = false;
        this.waitingForPlayer = false;
        this.index = -1;
        this.outcome = null;

        var heroData = this.registry.get('hero');
        var warrior = new PlayerCharacter(this, 390, 90, 'player', 1, 'You', heroData.maxHp, heroData.damage);
        warrior.hp = heroData.hp;
        warrior.combatClass = typeof heroCombatClass === 'function' ? heroCombatClass(heroData) : 'melee';
        warrior.refreshHpBar();
        this.add.existing(warrior);
        this.heroes = [warrior];

        var pending = this.registry.get('pendingEncounter') || { enemies: [{ type: 'Goblin', texture: 'player', frame: 4, tint: 0x5aa33a, hp: 28, damage: 8 }] };
        this.enemies = [];
        var slots = [{ x: 110, y: 80 }, { x: 150, y: 150 }];
        for (var i = 0; i < pending.enemies.length; i++) {
            var spec = pending.enemies[i];
            var enemy = new Enemy(this, slots[i].x, slots[i].y, spec.texture, spec.frame || 0, spec.type, spec.hp, spec.damage);
            enemy.xp = typeof spec.xp === 'number' ? spec.xp : 10;
            enemy.combatClass = typeof mobCombatClass === 'function' ? mobCombatClass(spec) : 'melee';
            if (spec.tint && spec.tint !== 0xffffff && !isUniqueMobTexture(spec.texture)) {
                enemy.setTint(spec.tint);
            }
            this.add.existing(enemy);
            this.enemies.push(enemy);
            this.wireEnemyInput(enemy, i);
        }

        this.units = this.heroes.concat(this.enemies);
        this.targetIndex = this.livingEnemyIndexes()[0];
        if (this.targetIndex == null) {
            this.targetIndex = null;
        }
        this.refreshTargetMarker();
        this.pickReady = false;
        this.turnTicksLeft = 0;
        this.endBattleTicksLeft = 0;
        this.pickReadyTicksLeft = this.secondsToSimTicks(BATTLE_PICK_READY_SEC);
        this._pendingStartTurn = true;
        Hud.showBattle(this);
        this.scene.run('UIScene');
    },

    secondsToSimTicks: function (sec) {
        if (window.GameClock && typeof GameClock.secondsToTicks === 'function') {
            return GameClock.secondsToTicks(sec);
        }
        return Math.max(1, Math.round((sec || 0) * 60));
    },

    recomputeSimCountdowns: function (fromTps, fromSpeed) {
        var clock = window.GameClock;
        if (!clock || typeof clock.recomputeTicks !== 'function') {
            return;
        }
        if (this.turnTicksLeft > 0) {
            this.turnTicksLeft = clock.recomputeTicks(this.turnTicksLeft, fromTps, fromSpeed);
        }
        if (this.endBattleTicksLeft > 0) {
            this.endBattleTicksLeft = clock.recomputeTicks(this.endBattleTicksLeft, fromTps, fromSpeed);
        }
        if (this.pickReadyTicksLeft > 0) {
            this.pickReadyTicksLeft = clock.recomputeTicks(this.pickReadyTicksLeft, fromTps, fromSpeed);
        }
    },

    livingEnemyIndexes: function () {
        var list = [];
        for (var i = 0; i < this.enemies.length; i++) {
            if (this.enemies[i] && this.enemies[i].living) {
                list.push(i);
            }
        }
        return list;
    },

    isPlayerTurn: function () {
        if (this.busy || this.outcome) {
            return false;
        }
        var unit = this.units && this.units[this.index];
        return !!(unit && unit.living && unit instanceof PlayerCharacter);
    },

    autoSelectTarget: function () {
        var living = this.livingEnemyIndexes();
        if (this.targetIndex != null && this.enemies[this.targetIndex] && this.enemies[this.targetIndex].living) {
            return this.targetIndex;
        }
        this.targetIndex = living.length ? living[0] : null;
        this.refreshTargetMarker();
        return this.targetIndex;
    },

    refreshTargetMarker: function () {
        if (!this.targetMarker) {
            this.targetMarker = this.add.rectangle(0, 0, 40, 40)
                .setStrokeStyle(2, 0xf0d060)
                .setFillStyle(0x000000, 0)
                .setDepth(20);
        }
        var target = this.enemies && this.enemies[this.targetIndex];
        if (!target || !target.living) {
            this.targetMarker.setVisible(false);
            return;
        }
        this.targetMarker.setPosition(target.x, target.y).setVisible(true);
    },

    wireEnemyInput: function (enemy, index) {
        var self = this;
        enemy.setInteractive({ useHandCursor: true });
        enemy.on('pointerdown', function () {
            if (!self.pickReady) {
                return;
            }
            Hud.onEnemyPicked(index, true);
        });
    },

    clearUnits: function () {
        if (this.tweens) {
            this.tweens.killAll();
        }
        if (this.children && this.children.list) {
            var leftover = this.children.list.slice();
            for (var s = 0; s < leftover.length; s++) {
                if (leftover[s] && leftover[s].isHitSplat) {
                    leftover[s].destroy();
                }
            }
        }
        if (this.turnTimer) {
            this.turnTimer.remove(false);
            this.turnTimer = null;
        }
        if (this.units) {
            for (var i = 0; i < this.units.length; i++) {
                if (this.units[i]) {
                    this.units[i].destroy();
                }
            }
        }
        this.heroes = [];
        this.enemies = [];
        this.units = [];
        if (this.targetMarker) {
            this.targetMarker.destroy();
            this.targetMarker = null;
        }
        this.targetIndex = null;
        this.waitingForPlayer = false;
    },

    nextTurn: function () {
        if (this.waitingForPlayer) {
            return;
        }
        if (this.checkEndBattle()) {
            this.endBattle();
            return;
        }
        do {
            this.index++;
            if (this.index >= this.units.length) {
                this.index = 0;
            }
        } while (!this.units[this.index].living);

        this.busy = false;
        var unit = this.units[this.index];
        if (unit instanceof PlayerCharacter) {
            this.waitingForPlayer = true;
            this.events.emit('PlayerSelect', this.index);
        } else {
            this.busy = true;
            Hud.setActionsEnabled(false);
            var target = this.heroes[0];
            unit.attack(target);
            this.queueTurn(BATTLE_TURN_QUEUE_SEC);
        }
    },

    queueTurn: function (delaySecOrMs) {
        var sec;
        if (this.turnTimer) {
            this.turnTimer.remove(false);
            this.turnTimer = null;
        }
        /* Accept legacy ms (>10) or game-seconds. */
        if (typeof delaySecOrMs === 'number' && delaySecOrMs > 10) {
            sec = delaySecOrMs / 1000;
        } else {
            sec = typeof delaySecOrMs === 'number' ? delaySecOrMs : BATTLE_TURN_QUEUE_SEC;
        }
        this.turnTicksLeft = this.secondsToSimTicks(sec);
    },

    receivePlayerSelection: function (action, targetIndex, itemId) {
        if (this.busy || this.outcome || !this.waitingForPlayer) {
            return;
        }
        var actor = this.units && this.units[this.index];
        if (!(actor instanceof PlayerCharacter) || !actor.living) {
            return;
        }
        this.waitingForPlayer = false;
        Hud.setActionsEnabled(false);
        if (action === 'attack') {
            if (targetIndex == null) {
                targetIndex = this.autoSelectTarget();
            }
            var target = this.enemies[targetIndex];
            if (!target || !target.living) {
                this.waitingForPlayer = true;
                Hud.selectingEnemy = true;
                this.events.emit('Message', 'Select a target.');
                Hud.setActionsEnabled(true);
                return;
            }
            var hero = this.registry.get('hero');
            if (typeof rangedWeaponEquipped === 'function' && rangedWeaponEquipped(hero) &&
                typeof equippedQty === 'function' && equippedQty(hero, 'ammo') < 1) {
                this.waitingForPlayer = true;
                this.events.emit('Message', 'You have no ammo.');
                Hud.setActionsEnabled(true);
                return;
            }
            this.busy = true;
            this.targetIndex = targetIndex;
            this.refreshTargetMarker();
            actor.attack(target);
            this.queueTurn(BATTLE_TURN_QUEUE_SEC);
            return;
        }
        this.busy = true;
        if (action === 'heal') {
            var hero = this.registry.get('hero');
            if (hero.hp >= hero.maxHp) {
                this.waitingForPlayer = true;
                this.events.emit('Message', 'You are already at full health.');
                this.busy = false;
                Hud.setActionsEnabled(true);
                return;
            }
            var eaten = itemId ? eatItem(hero, itemId) : eatBestFood(hero);
            if (!eaten) {
                this.waitingForPlayer = true;
                this.events.emit('Message', itemId ? 'You do not have that.' : 'You have no food.');
                this.busy = false;
                Hud.setActionsEnabled(true);
                return;
            }
            var restored = actor.heal(eaten.amount);
            hero.hp = actor.hp;
            this.registry.set('hero', hero);
            Hud.renderHero(hero);
            this.events.emit('Message', 'You eat ' + eaten.name + ' and recover ' + restored + ' HP.');
            this.queueTurn(BATTLE_HEAL_QUEUE_SEC);
        } else if (action === 'windstrike') {
            var hero = this.registry.get('hero');
            if (targetIndex == null) {
                targetIndex = this.autoSelectTarget();
            }
            var target = this.enemies[targetIndex];
            if (typeof hasWindStrikeRunes === 'function' && !hasWindStrikeRunes(hero)) {
                this.waitingForPlayer = true;
                this.events.emit('Message', 'You do not have the runes for Wind Strike.');
                this.busy = false;
                Hud.setActionsEnabled(true);
                return;
            }
            if (!target || !target.living) {
                this.waitingForPlayer = true;
                Hud.selectingEnemy = true;
                this.events.emit('Message', 'Select a target.');
                this.busy = false;
                Hud.setActionsEnabled(true);
                return;
            }
            if (typeof windStrike !== 'function' || !windStrike(hero)) {
                this.waitingForPlayer = true;
                this.events.emit('Message', 'You do not have the runes for Wind Strike.');
                this.busy = false;
                Hud.setActionsEnabled(true);
                return;
            }
            this.registry.set('hero', hero);
            if (typeof Hud !== 'undefined' && Hud.renderHero) {
                Hud.renderHero(hero);
            }
            this.busy = true;
            this.targetIndex = targetIndex;
            this.refreshTargetMarker();
            var amount = typeof WIND_STRIKE_DAMAGE === 'number' ? WIND_STRIKE_DAMAGE : 2;
            var dealt = target.takeDamage(amount);
            this.events.emit('Message', 'You cast Wind Strike on ' + target.type + ' for ' + dealt);
            this.queueTurn(BATTLE_TURN_QUEUE_SEC);
        } else if (action === 'flee') {
            if (Phaser.Math.Between(0, 99) < 70) {
                this.events.emit('Message', 'You run from the fight.');
                this.outcome = 'flee';
                this.endBattleTicksLeft = this.secondsToSimTicks(BATTLE_FLEE_END_SEC);
            } else {
                this.events.emit('Message', 'You fail to get away!');
                this.queueTurn(BATTLE_HEAL_QUEUE_SEC);
            }
        } else {
            this.waitingForPlayer = true;
            this.busy = false;
            Hud.setActionsEnabled(true);
        }
    },

    checkEndBattle: function () {
        var victory = true;
        for (var i = 0; i < this.enemies.length; i++) {
            if (this.enemies[i].living) {
                victory = false;
            }
        }
        var defeat = true;
        for (var h = 0; h < this.heroes.length; h++) {
            if (this.heroes[h].living) {
                defeat = false;
            }
        }
        if (victory) {
            this.outcome = 'win';
        } else if (defeat) {
            this.outcome = 'lose';
        }
        return victory || defeat;
    },

    persistHero: function () {
        var hero = this.registry.get('hero');
        if (this.heroes[0]) {
            hero.hp = this.heroes[0].hp;
        }
        this.registry.set('hero', hero);
        this.registry.set('battleOutcome', this.outcome);
    },

    endBattle: function () {
        if (this.turnTimer) {
            this.turnTimer.remove(false);
            this.turnTimer = null;
        }
        this.persistHero();
        this.clearUnits();
        Hud.hideBattle();
        this.scene.sleep('UIScene');
        if (this.outcome === 'lose') {
            var world = this.scene.get('WorldScene');
            if (world && world.spawnDeathGravestone) {
                world.spawnDeathGravestone();
            }
            this.scene.stop('UIScene');
            this.scene.stop('WorldScene');
            this.scene.start('GameOverScene');
        } else {
            this.scene.switch('WorldScene');
        }
    },

    simTickBattle: function () {
        if (this.pickReadyTicksLeft > 0) {
            this.pickReadyTicksLeft -= 1;
            if (this.pickReadyTicksLeft <= 0) {
                this.pickReady = true;
            }
        }
        if (this._pendingStartTurn) {
            this._pendingStartTurn = false;
            if (this.index < 0) {
                this.nextTurn();
            } else if (this.waitingForPlayer) {
                Hud.onPlayerTurn(this);
            }
        }
        if (this.endBattleTicksLeft > 0) {
            this.endBattleTicksLeft -= 1;
            if (this.endBattleTicksLeft <= 0) {
                this.endBattle();
                return;
            }
        }
        if (this.turnTicksLeft > 0) {
            this.turnTicksLeft -= 1;
            if (this.turnTicksLeft <= 0) {
                this.nextTurn();
            }
        }
    },

    update: function (time, delta) {
        var ran;
        var i;
        if (!this.units) {
            return;
        }
        if (window.GameClock && typeof GameClock.advance === 'function') {
            ran = GameClock.advance(typeof delta === 'number' ? Math.min(delta, 80) : 0);
            for (i = 0; i < ran; i++) {
                this.simTickBattle();
            }
        }
        for (i = 0; i < this.units.length; i++) {
            if (this.units[i] && this.units[i].syncHud) {
                this.units[i].syncHud();
            }
        }
        this.refreshTargetMarker();
    }
});
