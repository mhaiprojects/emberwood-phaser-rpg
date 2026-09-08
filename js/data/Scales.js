var TILE_SIZE = 16;
var PLAYER_WORLD_SCALE = 1;
var PLAYER_BATTLE_SCALE = 3;
var PLAYER_BODY_W = 12;
var PLAYER_BODY_H = 14;

var MOB_SCALES = {
    Chicken: { world: 0.75, battle: 2 },
    Crab: { world: 0.75, battle: 2 },
    Bat: { world: 0.75, battle: 2 },
    Goblin: { world: 1, battle: 2 },
    Skeleton: { world: 1, battle: 2 },
    Slime: { world: 1, battle: 2 },
    Cow: { world: 1.25, battle: 3 },
    Drake: { world: 2, battle: 3 }
};

var GIANT_MOB_TYPES = {
    Drake: true
};

function isGiantMob(type) {
    return !!(type && GIANT_MOB_TYPES[type]);
}

function mobScaleFor(type, mode) {
    var row = MOB_SCALES[type];
    if (row) {
        return row[mode] || 1;
    }
    if (type === 'Drake' || (typeof type === 'string' && type.toLowerCase() === 'drake')) {
        return mode === 'battle' ? 3 : 2;
    }
    return mode === 'battle' ? 2 : 1;
}

function worldBodySizeFor(type) {
    if (isGiantMob(type)) {
        return { w: 28, h: 28 };
    }
    if (type === 'Cow') {
        return { w: 14, h: 14 };
    }
    if (type === 'Chicken' || type === 'Crab' || type === 'Bat') {
        return { w: 10, h: 10 };
    }
    return { w: 12, h: 14 };
}

function applyWorldBody(sprite, worldW, worldH) {
    if (!sprite || !sprite.body) {
        return;
    }
    sprite.body.setSize(worldW, worldH, true);
}

function applyPlayerWorldBody(sprite) {
    applyWorldBody(sprite, PLAYER_BODY_W, PLAYER_BODY_H);
}

function applyMobWorldBody(sprite, type) {
    var size = worldBodySizeFor(type);
    applyWorldBody(sprite, size.w, size.h);
}

function isUniqueMobTexture(texture) {
    return typeof texture === 'string' && texture.indexOf('mob-') === 0;
}

function lootForMob(def) {
    var drops = [];
    if (def && def.gold) {
        drops.push({ id: 'coins', qty: def.gold });
    }
    drops.push({ id: 'bones', qty: 1 });
    if (def && def.type === 'Chicken') {
        drops.push({ id: 'shrimp', qty: 1 });
    } else if (def && def.type === 'Cow') {
        drops.push({ id: 'bread', qty: 1 });
    } else if (def && def.type === 'Crab') {
        drops.push({ id: 'shrimp', qty: 1 });
    }
    return drops;
}
