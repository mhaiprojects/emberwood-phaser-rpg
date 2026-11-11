var OW_COMBAT_TICK_MS = 600;
var POISON_MOB_TYPES = { Slime: true, Skeleton: true, Drake: true };
var COMBAT_POISON_CHANCE = 35;

function showWorldHitSplat(scene, x, y, text, kind) {
    if (!scene) {
        return;
    }
    kind = kind || (String(text).charAt(0) === '+' ? 'heal' : 'hit');
    var fill = kind === 'heal' ? 0x1e4a32 : 0x7a1c1c;
    var stroke = kind === 'heal' ? 0x7dffb3 : 0xff6b6b;
    var color = kind === 'heal' ? '#7dffb3' : '#ff6b6b';
    var py = y - 24;
    var disc = scene.add.circle(x, py, 11, fill, 0.92);
    disc.setStrokeStyle(2, stroke);
    disc.setDepth(29);
    disc.isHitSplat = true;
    disc.splatKind = kind;
    var label = scene.add.text(x, py, text, {
        fontSize: '10px',
        fontFamily: '"Courier New", Courier, monospace',
        color: color
    }).setOrigin(0.5);
    label.setDepth(30);
    label.isHitSplat = true;
    label.splatKind = kind;
    scene.tweens.add({
        targets: [disc, label],
        y: py - 16,
        alpha: 0,
        duration: 700,
        ease: 'Quad.easeOut',
        onComplete: function () {
            disc.destroy();
            label.destroy();
        }
    });
}

function mobPoisonChance(def) {
    if (!def || !def.type) {
        return false;
    }
    return !!POISON_MOB_TYPES[def.type];
}

function ensureSpecialEnergy(hero) {
    if (!hero) {
        return 0;
    }
    if (typeof hero.specialEnergy !== 'number') {
        hero.specialEnergy = 100;
    }
    return hero.specialEnergy;
}

function rollOverworldDamage(attacker, defender, hero, opts) {
    opts = opts || {};
    var amount = 8;
    if (attacker === 'player' && hero) {
        amount = hero.damage;
        amount = hero.damage;
        if (typeof equippedWeaponDamage === 'function') {
            amount = equippedWeaponDamage(hero, amount);
        }
        if (opts.special) {
            amount = Math.floor(amount * 1.5);
        }
        if (hero.prayers && hero.prayers.burststrength) {
            amount += 2;
        }
    } else if (attacker && attacker.mobDef && typeof attacker.mobDef.damage === 'number') {
        amount = attacker.mobDef.damage;
    }
    if (defender === 'player' && hero && hero.prayers && hero.prayers.thickskin) {
        amount = Math.max(1, amount - 1);
    }
    if (typeof triangleHit === 'function' && typeof combatClass === 'function') {
        var atkClass = attacker === 'player' ? combatClass(hero) : combatClass(attacker);
        var defClass = defender === 'player' ? combatClass(hero) : combatClass(defender);
        amount = triangleHit(amount, atkClass, defClass);
    }
    var defence = 0;
    if (defender === 'player' && typeof equippedShieldDefence === 'function') {
        defence = equippedShieldDefence(hero);
    }
    var variance = Phaser.Math.Between(-2, 2);
    return Math.max(0, Math.max(1, amount - defence + variance));
}

function overworldXpTarget(fight, mob) {
    return {
        hp: fight.hp,
        maxHp: fight.maxHp,
        xp: mob && mob.mobDef && typeof mob.mobDef.xp === 'number' ? mob.mobDef.xp : 10,
        mobDef: mob && mob.mobDef
    };
}

function grantOverworldHitXp(hero, fight, mob, dealt, hpBefore) {
    if (typeof grantStyleHitXp !== 'function') {
        return;
    }
    var proxy = overworldXpTarget(fight, mob);
    grantStyleHitXp(hero, proxy, dealt, hpBefore);
}

function tickHeroPoison(hero, scene) {
    if (!hero || !hero.poison || hero.poison.ticks < 1 || hero.hp <= 0) {
        return;
    }
    hero.poison.ticks -= 1;
    var dmg = typeof hero.poison.damage === 'number' ? hero.poison.damage : 2;
    hero.hp = Math.max(0, hero.hp - dmg);
    if (scene && scene.player) {
        showWorldHitSplat(scene, scene.player.x, scene.player.y, '-' + dmg, 'hit');
    }
    if (hero.hp <= 0 && scene && scene.endOverworldFight) {
        scene.endOverworldFight('lose');
    }
}

function applyHeroPoison(hero, sourceType) {
    if (!hero || !mobPoisonChance({ type: sourceType })) {
        return;
    }
    if (Phaser.Math.Between(0, 99) >= COMBAT_POISON_CHANCE) {
        return;
    }
    hero.poison = { ticks: 6, damage: 2 };
    if (typeof Hud !== 'undefined' && Hud.log) {
        Hud.log('You have been poisoned!');
    }
}
