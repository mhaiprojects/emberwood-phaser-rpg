var GHOST_PLAYERS = [
    { name: 'Ash_walker', x: 360, y: 230 },
    { name: 'Moss019', x: 300, y: 280 }
];
var RANDOM_EVENT_CHANCE = 0.0012;

WorldScene.prototype.tickPrayerDrainLite = function (dt) {
    var hero = this.registry.get('hero');
    var anyOn;
    var drain;
    if (!hero || !hero.prayers) {
        return;
    }
    anyOn = hero.prayers.thickskin || hero.prayers.burststrength;
    if (!anyOn) {
        return;
    }
    this._prayerAcc = (this._prayerAcc || 0) + dt;
    if (this._prayerAcc < 3) {
        return;
    }
    this._prayerAcc = 0;
    drain = 1;
    hero.prayerPoints = Math.max(0, (hero.prayerPoints || 0) - drain);
    if (hero.prayerPoints < 1) {
        hero.prayers.thickskin = false;
        hero.prayers.burststrength = false;
        if (typeof Hud !== 'undefined' && Hud.log) {
            Hud.log('You run out of prayer points.');
        }
    }
    this.registry.set('hero', hero);
    if (typeof Hud !== 'undefined' && Hud.renderPrayers) {
        Hud.renderPrayers(hero);
    }
};

WorldScene.prototype.spawnGhostPlayers = function () {
    var self = this;
    this.ghostSprites = this.ghostSprites || [];
    this.ghostSprites.forEach(function (g) {
        if (g && g.destroy) {
            g.destroy();
        }
    });
    this.ghostSprites = [];
    if (this.zoneId !== 'haven') {
        return;
    }
    GHOST_PLAYERS.forEach(function (spec) {
        var sprite = self.add.sprite(spec.x, spec.y, 'player', 2);
        sprite.setTint(0xaaccff);
        sprite.setAlpha(0.55);
        sprite.setDepth(5);
        var label = self.add.text(spec.x, spec.y - 18, spec.name, {
            fontSize: '7px',
            color: '#c8e0ff'
        }).setOrigin(0.5).setDepth(6);
        sprite.ghostLabel = label;
        self.ghostSprites.push(sprite);
    });
};

WorldScene.prototype.refreshWildernessFlag = function () {
    if (this.wildSkull) {
        this.wildSkull.destroy();
        this.wildSkull = null;
    }
    if (this.zoneId !== 'graves') {
        return;
    }
    this.wildSkull = this.add.text(this.player.x + 12, this.player.y - 22, '☠', {
        fontSize: '10px',
        color: '#ff6666'
    }).setDepth(12);
};

WorldScene.prototype.maybeRandomEvent = function () {
    if (this.encounterLock || this.randomEventNpc || this.zoneId === 'haven') {
        return;
    }
    if (Math.random() > RANDOM_EVENT_CHANCE) {
        return;
    }
    var self = this;
    var x = this.player.x + Phaser.Math.Between(-40, 40);
    var y = this.player.y + Phaser.Math.Between(-20, 20);
    var sprite = this.physics.add.sprite(x, y, 'npc-guard', 0);
    sprite.setImmovable(true);
    sprite.npcDef = {
        key: 'genie',
        name: 'Mysterious Genie',
        options: ['talk'],
        lines: ['A gift for the weary adventurer!', 'Take this and be on your way.']
    };
    var label = this.add.text(x, y - 14, 'Genie', {
        fontSize: '8px',
        color: '#ffe08a'
    }).setOrigin(0.5);
    sprite.nameLabel = label;
    sprite.setInteractive({ useHandCursor: true });
    sprite.on('pointerdown', function () {
        var hero = self.registry.get('hero');
        if (addItem(hero, 'coins', 20)) {
            syncCoins(hero);
            self.registry.set('hero', hero);
            Hud.log('The genie grants you 20 coins.');
        }
        self.dismissRandomEvent(sprite);
    });
    this.randomEventNpc = sprite;
    Hud.log('A genie appears nearby!');
};

WorldScene.prototype.dismissRandomEvent = function (sprite) {
    if (sprite && sprite.nameLabel) {
        sprite.nameLabel.destroy();
    }
    if (sprite) {
        sprite.destroy();
    }
    if (this.randomEventNpc === sprite) {
        this.randomEventNpc = null;
    }
};

WorldScene.prototype.tryDigClue = function () {
    var hero = this.registry.get('hero');
    var result;
    if (typeof advanceClueDig !== 'function') {
        return false;
    }
    result = advanceClueDig(hero, this);
    if (!result) {
        return false;
    }
    this.registry.set('hero', hero);
    if (result === 'casket') {
        Hud.log('You complete the clue scroll and claim a reward!');
    } else {
        var spot = clueDigSpot(hero);
        Hud.log('The clue points to ' + (spot.zone === this.zoneId ? 'somewhere nearby.' : spot.zone + '.'));
    }
    this.refreshHud();
    return true;
};

WorldScene.prototype.tryPickpocket = function (npc) {
    var hero = this.registry.get('hero');
    if (!npc || !hero) {
        return false;
    }
    if (Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y) > 24) {
        return false;
    }
    if (typeof pickpocketNpc !== 'function' || !pickpocketNpc(hero)) {
        Hud.log('You fail to pick the pocket.');
        return false;
    }
    this.registry.set('hero', hero);
    Hud.log('You pick a pocket for some coins.');
    this.refreshHud();
    return true;
};

WorldScene.prototype.tryStretchSkillAction = function (skillId) {
    var hero = this.registry.get('hero');
  var ok = false;
    if (!hero) {
        return false;
    }
    if (skillId === 'runecraft' && typeof craftAirRune === 'function') {
        ok = craftAirRune(hero);
        Hud.log(ok ? 'You craft an air rune.' : 'You need rune essence (and Runecraft level).');
    } else if (skillId === 'farming' && typeof plantGuamSeed === 'function') {
        ok = plantGuamSeed(hero);
        Hud.log(ok ? 'You harvest a guam leaf from your patch.' : 'Your inventory is full.');
    } else if (skillId === 'herblore' && typeof mixAttackPotion === 'function') {
        ok = mixAttackPotion(hero);
        Hud.log(ok ? 'You mix an attack potion.' : 'You need a guam leaf.');
    } else if (skillId === 'fletching' && typeof fletchShortbow === 'function') {
        ok = fletchShortbow(hero);
        Hud.log(ok ? 'You fletch a shortbow (u).' : 'You need logs and string.');
    } else if (skillId === 'construction' && typeof buildOakBench === 'function') {
        ok = buildOakBench(hero);
        Hud.log(ok ? 'You construct an oak plank bench.' : 'You need 3 logs.');
    } else if (skillId === 'slayer' && typeof assignSlayerTask === 'function') {
        var task = assignSlayerTask(hero);
        ok = !!task;
        Hud.log('Slayer task: kill 3 ' + task.type + 's.');
    }
    if (ok) {
        this.registry.set('hero', hero);
        this.refreshHud();
    }
    return ok;
};
