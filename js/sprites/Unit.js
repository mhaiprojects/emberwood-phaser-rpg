function unitHero(unit) {
    if (!unit || typeof PlayerCharacter === 'undefined' || !(unit instanceof PlayerCharacter)) {
        return null;
    }
    var scene = unit.scene;
    if (!scene || !scene.registry || typeof scene.registry.get !== 'function') {
        return null;
    }
    return scene.registry.get('hero') || null;
}

var Unit = new Phaser.Class({
    Extends: Phaser.GameObjects.Sprite,

    initialize: function Unit(scene, x, y, texture, frame, type, hp, damage) {
        Phaser.GameObjects.Sprite.call(this, scene, x, y, texture, frame);
        this.type = type;
        this.maxHp = hp;
        this.hp = hp;
        this.damage = damage;
        this.living = true;
        this.menuItem = null;
        this.hpBarBg = scene.add.rectangle(x - 14, y - 20, 28, 4, 0x1a0a12).setOrigin(0, 0.5);
        this.hpBarFill = scene.add.rectangle(x - 14, y - 20, 28, 4, 0x3dcc6a).setOrigin(0, 0.5);
        this.hpLabel = scene.add.text(x, y + 18, type, {
            fontSize: '8px',
            fontFamily: '"Courier New", Courier, monospace',
            color: '#f4e8c1'
        }).setOrigin(0.5, 0);
        this.refreshHpBar();
    },

    setMenuItem: function (item) {
        this.menuItem = item;
    },

    syncHud: function () {
        if (!this.hpBarBg) {
            return;
        }
        var barY = this.y - Math.round((this.displayHeight || 16) / 2) - 8;
        var labelY = this.y + Math.round((this.displayHeight || 16) / 2) + 4;
        this.hpBarBg.setPosition(this.x - 14, barY);
        this.hpBarFill.setPosition(this.x - 14, barY);
        this.hpLabel.setPosition(this.x, labelY);
    },

    refreshHpBar: function () {
        var ratio = this.maxHp <= 0 ? 0 : this.hp / this.maxHp;
        this.hpBarFill.width = Math.max(0, 28 * ratio);
        if (ratio < 0.35) {
            this.hpBarFill.fillColor = 0xcc3d3d;
        } else if (ratio < 0.65) {
            this.hpBarFill.fillColor = 0xd4a017;
        } else {
            this.hpBarFill.fillColor = 0x3dcc6a;
        }
    },

    showFloater: function (text, color) {
        var kind = String(text).charAt(0) === '+' ? 'heal' : 'hit';
        var fill = kind === 'heal' ? 0x1e4a32 : 0x7a1c1c;
        var stroke = kind === 'heal' ? 0x7dffb3 : 0xff6b6b;
        var y = this.y - 24;
        var disc = this.scene.add.circle(this.x, y, 11, fill, 0.92);
        disc.setStrokeStyle(2, stroke);
        disc.setDepth(29);
        disc.isHitSplat = true;
        disc.splatKind = kind;
        var label = this.scene.add.text(this.x, y, text, {
            fontSize: '10px',
            fontFamily: '"Courier New", Courier, monospace',
            color: color
        }).setOrigin(0.5);
        label.setDepth(30);
        label.isHitSplat = true;
        label.splatKind = kind;
        this.scene.tweens.add({
            targets: [disc, label],
            y: y - 16,
            alpha: 0,
            duration: 700,
            ease: 'Quad.easeOut',
            onComplete: function () {
                disc.destroy();
                label.destroy();
            }
        });
    },

    attack: function (target) {
        if (!target.living) {
            return;
        }
        var scene = this.scene;
        var originX = this.x;
        var bump = this instanceof PlayerCharacter ? -18 : 18;
        var self = this;
        scene.tweens.add({
            targets: this,
            x: originX + bump,
            duration: 120,
            yoyo: true,
            onYoyo: function () {
                if (!self.scene || !self.active || !target.active) {
                    return;
                }
                var amount = self.damage;
                if (typeof equippedWeaponDamage === 'function') {
                    amount = equippedWeaponDamage(unitHero(self), self.damage);
                }
                if (typeof triangleHit === 'function' && typeof combatClass === 'function') {
                    amount = triangleHit(amount, combatClass(self), combatClass(target));
                }
                var dealt = target.takeDamage(amount);
                if (self.scene && self.scene.events) {
                    var verb = self.type === 'You' ? ' hit ' : ' hits ';
                    self.scene.events.emit('Message', self.type + verb + target.type + ' for ' + dealt);
                }
            }
        });
    },

    takeDamage: function (amount) {
        if (!this.living) {
            return 0;
        }
        var defence = 0;
        if (typeof equippedShieldDefence === 'function') {
            defence = equippedShieldDefence(unitHero(this));
        }
        var variance = Phaser.Math.Between(-2, 2);
        var dealt = Math.max(1, amount - defence + variance);
        this.hp = Math.max(0, this.hp - dealt);
        this.setTint(0xff5555);
        this.showFloater('-' + dealt, '#ff6b6b');
        this.refreshHpBar();
        var self = this;
        this.scene.time.delayedCall(180, function () {
            if (self.living) {
                self.clearTint();
            }
        });
        if (this.hp <= 0) {
            this.die();
        }
        return dealt;
    },

    heal: function (amount) {
        if (!this.living) {
            return 0;
        }
        var before = this.hp;
        this.hp = Math.min(this.maxHp, this.hp + amount);
        var restored = this.hp - before;
        this.setTint(0x88ffaa);
        this.showFloater('+' + restored, '#7dffb3');
        this.refreshHpBar();
        var self = this;
        this.scene.time.delayedCall(180, function () {
            if (self.living) {
                self.clearTint();
            }
        });
        return restored;
    },

    die: function () {
        this.hp = 0;
        this.living = false;
        this.visible = false;
        this.disableInteractive();
        this.hpBarBg.visible = false;
        this.hpBarFill.visible = false;
        this.hpLabel.visible = false;
        if (this.menuItem) {
            this.menuItem.unitKilled();
            this.menuItem = null;
        }
    },

    destroy: function (fromScene) {
        if (this.hpBarBg) {
            this.hpBarBg.destroy();
        }
        if (this.hpBarFill) {
            this.hpBarFill.destroy();
        }
        if (this.hpLabel) {
            this.hpLabel.destroy();
        }
        Phaser.GameObjects.Sprite.prototype.destroy.call(this, fromScene);
    }
});
