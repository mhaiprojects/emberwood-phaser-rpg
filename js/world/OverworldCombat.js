var OW_COMBAT_TICK_MS = 600;
var POISON_MOB_TYPES = { Slime: true, Skeleton: true, Drake: true, Dragon: true };
var COMBAT_POISON_CHANCE = 35;
var MOB_CHASE_SPEED = 78;
/* Detection radius for mob-initiated agro (chase / open fight). */
var MOB_AGGRO_RANGE_PX = 112;
var MOB_BASE_LEVEL = {
    Chicken: 1,
    Rabbit: 1,
    Cow: 3,
    Crab: 5,
    Bat: 7,
    Goblin: 9,
    Slime: 10,
    Skeleton: 14,
    Drake: 28,
    Dragon: 50
};
var MOB_TYPE_ATTACK_RANGE = {
    Chicken: 22,
    Rabbit: 20,
    Cow: 26,
    Goblin: 24,
    Crab: 24,
    Skeleton: 26,
    Bat: 96,
    Slime: 72,
    Drake: 100,
    Dragon: 120
};

function mobLevel(def) {
    var type;
    if (!def) {
        return 1;
    }
    if (typeof def.level === 'number' && def.level > 0) {
        return Math.floor(def.level);
    }
    type = def.type;
    if (type && MOB_BASE_LEVEL[type] != null) {
        return MOB_BASE_LEVEL[type];
    }
    return 1;
}

function mobAlwaysAgro(def) {
    return !!(def && (def.alwaysAgro || def.alwaysAggro));
}

function heroCombatLevelForAgro(hero) {
    if (!hero) {
        return 1;
    }
    if (typeof combatLevel === 'function') {
        return Math.max(1, combatLevel(hero) | 0);
    }
    if (typeof hero.level === 'number' && hero.level > 0) {
        return Math.floor(hero.level);
    }
    return 1;
}

/* Mob initiates on the player only if alwaysAgro, or mob level is strictly higher. */
function mobShouldAgroHero(def, hero) {
    if (mobAlwaysAgro(def)) {
        return true;
    }
    return mobLevel(def) > heroCombatLevelForAgro(hero);
}

function mobLabelText(def) {
    var type = (def && def.type) || 'Foe';
    return type + ' (Lvl ' + mobLevel(def) + ')';
}

function mobAttackRangePx(mob) {
    var def = mob && (mob.mobDef || mob);
    var type;
    var cls;
    if (def && typeof def.attackRange === 'number') {
        return def.attackRange;
    }
    type = def && def.type;
    if (type && MOB_TYPE_ATTACK_RANGE[type] != null) {
        return MOB_TYPE_ATTACK_RANGE[type];
    }
    cls = typeof mobCombatClass === 'function' ? mobCombatClass(def) : 'melee';
    if (cls === 'ranged') {
        return typeof DEFAULT_RANGED_ATTACK_RANGE === 'number' ? DEFAULT_RANGED_ATTACK_RANGE : 96;
    }
    if (cls === 'magic') {
        return typeof DEFAULT_MAGIC_ATTACK_RANGE === 'number' ? DEFAULT_MAGIC_ATTACK_RANGE : 88;
    }
    return typeof DEFAULT_MELEE_ATTACK_RANGE === 'number' ? DEFAULT_MELEE_ATTACK_RANGE : 24;
}

function combatDistancePx(a, b) {
    if (!a || !b) {
        return Infinity;
    }
    return Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
}

function inAttackRange(attacker, defender, rangePx) {
    var range = typeof rangePx === 'number' ? rangePx : 24;
    return combatDistancePx(attacker, defender) <= range;
}

function combatProjectileKind(attacker, hero) {
    var def;
    var cls;
    if (attacker === 'player') {
        if (typeof magicWeaponEquipped === 'function' && magicWeaponEquipped(hero)) {
            return 'magic';
        }
        if (typeof rangedWeaponEquipped === 'function' && rangedWeaponEquipped(hero)) {
            return 'arrow';
        }
        return null;
    }
    def = attacker && (attacker.mobDef || attacker);
    cls = typeof mobCombatClass === 'function' ? mobCombatClass(def) : 'melee';
    if (cls === 'ranged' || cls === 'magic') {
        return cls === 'magic' ? 'magic' : 'arrow';
    }
    if (def && (def.type === 'Bat' || def.type === 'Slime' || def.type === 'Drake' || def.type === 'Dragon')) {
        return def.type === 'Bat' || def.type === 'Drake' || def.type === 'Dragon' ? 'arrow' : 'magic';
    }
    return null;
}

function spawnCombatProjectile(scene, fromX, fromY, toX, toY, kind) {
    var color;
    var size;
    var disc;
    var duration;
    var dx;
    var dy;
    var dist;
    if (!scene || !kind) {
        return null;
    }
    if (kind === 'magic') {
        color = 0x66ccff;
        size = 5;
    } else {
        color = 0xd4a35a;
        size = 3;
    }
    dx = toX - fromX;
    dy = toY - fromY;
    dist = Math.sqrt(dx * dx + dy * dy) || 1;
    duration = Math.min(280, Math.max(90, Math.round(dist * 1.1)));
    disc = scene.add.circle(fromX, fromY, size, color, 0.95);
    disc.setDepth(28);
    disc.setStrokeStyle(1, kind === 'magic' ? 0xb8ecff : 0x8a6230, 0.9);
    scene.tweens.add({
        targets: disc,
        x: toX,
        y: toY,
        duration: duration,
        ease: 'Quad.easeOut',
        onComplete: function () {
            if (disc && disc.destroy) {
                disc.destroy();
            }
        }
    });
    return disc;
}

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
