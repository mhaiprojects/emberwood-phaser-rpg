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
        warrior.refreshHpBar();
        this.add.existing(warrior);
        this.heroes = [warrior];

        var pending = this.registry.get('pendingEncounter') || { enemies: [{ type: 'Goblin', texture: 'player', frame: 4, tint: 0x5aa33a, hp: 28, damage: 8 }] };
        this.enemies = [];
        var slots = [{ x: 110, y: 80 }, { x: 150, y: 150 }];
        for (var i = 0; i < pending.enemies.length; i++) {
            var spec = pending.enemies[i];
            var enemy = new Enemy(this, slots[i].x, slots[i].y, spec.texture, spec.frame || 0, spec.type, spec.hp, spec.damage);
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
        var self = this;
        this.time.delayedCall(180, function () {
            self.pickReady = true;
        });
        Hud.showBattle(this);
        this.scene.run('UIScene');
        var self = this;
        this.time.delayedCall(0, function () {
            if (self.index < 0) {
                self.nextTurn();
            } else if (self.waitingForPlayer) {
                Hud.onPlayerTurn(self);
            }
        });
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
            var target = this.heroes[0];
            unit.attack(target);
            this.queueTurn(900);
        }
    },

    queueTurn: function (delay) {
        if (this.turnTimer) {
            this.turnTimer.remove(false);
        }
        this.turnTimer = this.time.addEvent({
            delay: delay,
            callback: this.nextTurn,
            callbackScope: this
        });
    },

    receivePlayerSelection: function (action, targetIndex, itemId) {
        if (this.busy) {
            return;
        }
        var actor = this.units && this.units[this.index];
        if (!(actor instanceof PlayerCharacter) || !actor.living) {
            return;
        }
        this.waitingForPlayer = false;
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
            this.busy = true;
            this.targetIndex = targetIndex;
            this.refreshTargetMarker();
            actor.attack(target);
            this.queueTurn(900);
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
            this.queueTurn(800);
        } else if (action === 'flee') {
            if (Phaser.Math.Between(0, 99) < 70) {
                this.events.emit('Message', 'You run from the fight.');
                this.outcome = 'flee';
                this.time.delayedCall(500, this.endBattle, [], this);
            } else {
                this.events.emit('Message', 'You fail to get away!');
                this.queueTurn(800);
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
            this.scene.stop('UIScene');
            this.scene.stop('WorldScene');
            this.scene.start('GameOverScene');
        } else {
            this.scene.switch('WorldScene');
        }
    },

    update: function () {
        if (!this.units) {
            return;
        }
        for (var i = 0; i < this.units.length; i++) {
            if (this.units[i] && this.units[i].syncHud) {
                this.units[i].syncHud();
            }
        }
        this.refreshTargetMarker();
    }
});
