var TILE_SIZE = 16;
var PLAYER_WORLD_SCALE = 0.9;
var PLAYER_BATTLE_SCALE = 3;
/* ~62–69% of TILE_SIZE so 1-tile corridors stay traversable (was 12×14). */
var PLAYER_BODY_W = 10;
var PLAYER_BODY_H = 11;

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

/* Deep Mine: floor 1 = level 40, then +1 per floor; Dragon every 21st floor. */
var DUNGEON_MOB_BASE_LEVEL = 40;
var DUNGEON_DRAGON_FLOOR_EVERY = 21;

function dungeonMobLevelForFloor(floor) {
    var n = Math.max(1, floor | 0);
    return DUNGEON_MOB_BASE_LEVEL + (n - 1);
}

function dungeonIsDragonFloor(floor) {
    var n = Math.max(1, floor | 0);
    return n % DUNGEON_DRAGON_FLOOR_EVERY === 0;
}

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
    var table = typeof LOOT_TABLE !== 'undefined' ? LOOT_TABLE : null;
    var row;
    var i;
    var ch;
    if (def && def.gold) {
        drops.push({ id: 'coins', qty: def.gold });
    }
    if (!table || table.alwaysBones !== false) {
        drops.push({ id: 'bones', qty: 1 });
    }
    row = table && table.byType && def && def.type ? table.byType[def.type] : null;
    if (row && row.always) {
        for (i = 0; i < row.always.length; i++) {
            drops.push({ id: row.always[i].id, qty: row.always[i].qty || 1 });
        }
    }
    if (row && row.chance) {
        for (i = 0; i < row.chance.length; i++) {
            ch = row.chance[i];
            if (Math.random() < (typeof ch.p === 'number' ? ch.p : 0)) {
                drops.push({ id: ch.id, qty: ch.qty || 1 });
            }
        }
    }
    if (table && typeof table.clueChance === 'number' && Math.random() < table.clueChance) {
        drops.push({ id: 'cluescroll', qty: 1 });
    }
    return drops;
}
