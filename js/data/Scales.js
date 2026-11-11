var TILE_SIZE = 16;
var PLAYER_WORLD_SCALE = 1;
var PLAYER_BATTLE_SCALE = 3;
var PLAYER_BODY_W = 12;
var PLAYER_BODY_H = 14;

var MOB_SCALES = {
    Chicken: { world: 0.75, battle: 2 },
    Crab: { world: 0.75, battle: 2 },
    Bat: { world: 0.75, battle: 2 },
    Rabbit: { world: 0.7, battle: 2 },
    Goblin: { world: 1, battle: 2 },
    Skeleton: { world: 1, battle: 2 },
    Slime: { world: 1, battle: 2 },
    Cow: { world: 1.25, battle: 3 },
    Drake: { world: 2, battle: 3 },
    Dragon: { world: 2.35, battle: 3.4 }
};

var GIANT_MOB_TYPES = {
    Drake: true,
    Dragon: true
};
var GIANT_FOOTPRINT_TILES = 2;

function isGiantMob(type) {
    return !!(type && GIANT_MOB_TYPES[type]);
}

function giantFootprintTiles(wx, wy) {
    var size = typeof TILE_SIZE === 'number' ? TILE_SIZE : 16;
    var n = GIANT_FOOTPRINT_TILES;
    var half = Math.floor(n / 2);
    var tx0 = Math.round(wx / size) - half;
    var ty0 = Math.round(wy / size) - half;
    var tiles = [];
    var dy;
    var dx;
    for (dy = 0; dy < n; dy++) {
        for (dx = 0; dx < n; dx++) {
            tiles.push({ tx: tx0 + dx, ty: ty0 + dy });
        }
    }
    return tiles;
}

function mobScaleFor(type, mode) {
    var row = MOB_SCALES[type];
    if (row) {
        return row[mode] || 1;
    }
    if (type === 'Dragon' || (typeof type === 'string' && type.toLowerCase() === 'dragon')) {
        return mode === 'battle' ? 3.4 : 2.35;
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
    if (type === 'Chicken' || type === 'Crab' || type === 'Bat' || type === 'Rabbit') {
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
    var roll = Math.random();
    if (def && def.gold) {
        drops.push({ id: 'coins', qty: def.gold });
    }
    drops.push({ id: 'bones', qty: 1 });
    if (def && def.type === 'Chicken') {
        drops.push({ id: 'feather', qty: 3 });
    } else if (def && def.type === 'Cow') {
        drops.push({ id: 'rawbeef', qty: 1 });
        drops.push({ id: 'cowhide', qty: 1 });
    } else if (def && def.type === 'Crab') {
        drops.push({ id: 'rawshrimp', qty: 1 });
    } else if (def && def.type === 'Rabbit') {
        drops.push({ id: 'rabbitfur', qty: 1 });
    } else if (def && def.type === 'Goblin') {
        if (roll < 0.35) {
            drops.push({ id: roll < 0.18 ? 'copper' : 'tin', qty: 1 });
        }
        if (Math.random() < 0.2) {
            drops.push({ id: 'airrune', qty: 2 });
        }
        if (Math.random() < 0.08) {
            drops.push({ id: 'logs', qty: 1 });
        }
    } else if (def && def.type === 'Skeleton') {
        if (roll < 0.3) {
            drops.push({ id: 'iron', qty: 1 });
        }
        if (Math.random() < 0.25) {
            drops.push({ id: 'mindrune', qty: 2 });
        }
        if (Math.random() < 0.05) {
            drops.push({ id: 'key', qty: 1 });
        }
    } else if (def && def.type === 'Bat') {
        if (roll < 0.4) {
            drops.push({ id: 'runeessence', qty: 2 });
        }
        if (Math.random() < 0.2) {
            drops.push({ id: 'airrune', qty: 1 });
        }
    } else if (def && def.type === 'Slime') {
        if (roll < 0.3) {
            drops.push({ id: 'earthrune', qty: 2 });
        }
        if (Math.random() < 0.15) {
            drops.push({ id: 'waterrune', qty: 1 });
        }
    } else if (def && def.type === 'Drake') {
        if (Math.random() < 0.28) {
            drops.push({ id: 'drakescale', qty: 1 });
        }
        if (Math.random() < 0.2) {
            drops.push({ id: 'diamondore', qty: 1 });
        }
        if (Math.random() < 0.1) {
            drops.push({ id: 'dragoniteore', qty: 1 });
        }
        if (Math.random() < 0.2) {
            drops.push({ id: 'firerune', qty: 3 });
        }
    } else if (def && def.type === 'Dragon') {
        drops.push({ id: 'drakescale', qty: 1 + (Math.random() < 0.5 ? 1 : 0) });
        if (Math.random() < 0.55) {
            drops.push({ id: 'dragoniteore', qty: 1 });
        }
        if (Math.random() < 0.35) {
            drops.push({ id: 'diamondore', qty: 1 });
        }
        if (Math.random() < 0.4) {
            drops.push({ id: 'firerune', qty: 5 });
        }
    }
    return drops;
}
