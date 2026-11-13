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

WorldScene.prototype.refreshWildernessFlag = function () {
    if (this.wildSkull) {
        this.wildSkull.destroy();
        this.wildSkull = null;
    }
    if (!(typeof Content !== 'undefined' && Content.zoneHasFeature
            && Content.zoneHasFeature(this.zoneId, 'wildSkull'))) {
        return;
    }
    this.wildSkull = this.add.text(this.player.x + 12, this.player.y - 22, '☠', {
        fontSize: '10px',
        color: '#ff6666'
    }).setDepth(12);
};

WorldScene.prototype.maybeRandomEvent = function () {
    var ob;
    var ev;
    var npc;
    var gifts;
    var chance;
    var self;
    var x;
    var y;
    var sprite;
    var label;
    var tex;
    if (this.encounterLock || this.randomEventNpc
            || (typeof Content !== 'undefined' && Content.zoneHasFeature
                && Content.zoneHasFeature(this.zoneId, 'noRandomEvents'))) {
        return;
    }
    ob = typeof Content !== 'undefined' && Content.getOnboarding
        ? Content.getOnboarding() : null;
    ev = ob && ob.randomEvent ? ob.randomEvent : null;
    chance = ev && typeof ev.chance === 'number' ? ev.chance : RANDOM_EVENT_CHANCE;
    if (Math.random() > chance) {
        return;
    }
    if (!ev || !ev.npc) {
        return;
    }
    self = this;
    npc = ev.npc;
    x = this.player.x + Phaser.Math.Between(-40, 40);
    y = this.player.y + Phaser.Math.Between(-20, 20);
    tex = npc.texture || 'npc-guard';
    sprite = this.physics.add.sprite(x, y, tex, 0);
    sprite.setImmovable(true);
    sprite.npcDef = {
        key: npc.key || 'event',
        name: npc.name || 'Stranger',
        options: npc.options || ['talk'],
        lines: npc.lines || []
    };
    label = this.add.text(x, y - 14, npc.label || npc.name || '?', {
        fontSize: '8px',
        color: '#ffe08a'
    }).setOrigin(0.5);
    sprite.nameLabel = label;
    sprite.setInteractive({ useHandCursor: true });
    gifts = ev.gifts || [];
    sprite.on('pointerdown', function () {
        var hero = self.registry.get('hero');
        var i;
        var gift;
        var gave = false;
        for (i = 0; i < gifts.length; i++) {
            gift = gifts[i];
            if (!gift || !gift.id) {
                continue;
            }
            if (gift.onlyIfMissing && typeof heroHasItem === 'function' && heroHasItem(hero, gift.id)) {
                continue;
            }
            if (typeof addItem === 'function' && addItem(hero, gift.id, gift.qty || 1)) {
                if (gift.line) {
                    Hud.log(gift.line);
                }
                gave = true;
                break;
            }
        }
        if (!gave && gifts.length && typeof Hud !== 'undefined' && Hud.log) {
            Hud.log('Nothing happens.');
        }
        if (typeof syncCoins === 'function') {
            syncCoins(hero);
        }
        self.registry.set('hero', hero);
        self.dismissRandomEvent(sprite);
    });
    this.randomEventNpc = sprite;
    if (ev.appearLine) {
        Hud.log(ev.appearLine);
    }
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
        Hud.log('The clue points to ' + (spot && spot.zone === this.zoneId
            ? 'somewhere nearby.'
            : ((spot && spot.zone) || 'elsewhere') + '.'));
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
    Hud.log('You find nothing worth stealing.');
    return false;
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
    } else if (skillId === 'crafting' && typeof fletchShortbow === 'function') {
        ok = fletchShortbow(hero) || (typeof buildOakBench === 'function' && buildOakBench(hero));
        Hud.log(ok ? 'You craft something useful.' : 'You lack materials.');
    }
    if (ok) {
        this.registry.set('hero', hero);
        this.refreshHud();
    }
    return ok;
};
