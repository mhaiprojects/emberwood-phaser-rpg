var TILE = {
    GRASS: 1,
    GRASS2: 2,
    PATH: 3,
    FLOWER: 4,
    WATER: 5,
    TREE: 6,
    ROCK: 7,
    SHRINE: 8,
    STALL: 9,
    RANGE: 10,
    ANVIL: 11,
    BOOTH: 12,
    DOCK: 13,
    BOAT: 14,
    TOMB: 15,
    DOOR: 16,
    WALL: 17,
    FURNACE: 18
};

var MAP_W = 36;
var MAP_H = 28;
/* Shore/Mine openness: ≤30% of *interior* tiles may block pathfinding.
 * Count excludes the 1-tile outer border (edge TREEs kept for zone exits).
 * Matches tileBlockedByTerrain / COLLIDE (WATER, TREE, ROCK, WALL, …). */
var MAX_PATH_BLOCK_RATIO = 0.30;
var HAVEN_GATE_TILE = { x: 23, y: 15 };
var INTERIOR_EXIT_TILE = { x: 18, y: 20 };
var TOWN_PROPS = {
    stall: { x: 16, y: 11 },
    ge: { x: 19, y: 11 },
    range: { x: 16, y: 17 },
    anvil: { x: 21, y: 12 },
    furnace: { x: 22, y: 12 },
    booth: { x: 14, y: 11 },
    shopStall: { x: 16, y: 12 },
    guildPost: { x: 15, y: 18 },
    campfire: { x: 18, y: 15 }
};
var TOWN_CENTER_TILE = { x: 18, y: 15 };
/* Permanent campfires: Haven courtyard + a few along the wild roads. */
var CAMPFIRE_SPOTS = {
    haven: [{ x: 18, y: 15 }],
    northwood: [{ x: 18, y: 16 }],
    westmead: [{ x: 20, y: 14 }],
    southshore: [{ x: 18, y: 18 }],
    highlands: [{ x: 16, y: 12 }],
    graves: [{ x: 18, y: 14 }],
    dragonden: [{ x: 14, y: 14 }]
};
var DUNGEON_ZONE_ID = 'dungeon';
var DUNGEON_FLOOR_SCALE = 1.05;
var DUNGEON_STAIRS_UP = { x: 18, y: 20 };
var DUNGEON_STAIRS_DOWN = { x: 18, y: 8 };
var DUNGEON_SURFACE = { x: 16, y: 20 };
var DUNGEON_CAMPFIRE = { x: 18, y: 14 };
/* Courtyard bank desk: staff behind, booth counter, counter_front + 2-tile apron. */
var BANK_COUNTER = {
    staff: [
        { x: 13, y: 10 },
        { x: 14, y: 10 },
        { x: 15, y: 10 }
    ],
    desk: [
        { x: 13, y: 11 },
        { x: 14, y: 11 },
        { x: 15, y: 11 }
    ],
    front: { x: 14, y: 12 },
    apron: [
        { x: 13, y: 12 },
        { x: 15, y: 12 },
        { x: 13, y: 13 },
        { x: 14, y: 13 },
        { x: 15, y: 13 }
    ]
};
var DEPTH = {
    GROUND: 0,
    PROP: 2,
    PATH_FX: 4,
    LOOT: 5,
    ACTOR: 6,
    LABEL: 7,
    OVERLAY: 20
};
var ZONE_TILE_TAGS = {};
var ZONE_INTERACT = {};
var SHORE_PROPS = {
    dock: { x: 12, y: 22 },
    boat: { x: 11, y: 23 },
    planks: [
        { x: 12, y: 21 },
        { x: 12, y: 22 },
        { x: 12, y: 23 }
    ],
    /* Shore-adjacent water so FISH_RANGE (28px) reaches from land/dock. */
    spots: [
        { x: 13, y: 22 },
        { x: 15, y: 21 },
        { x: 23, y: 21 }
    ]
};
var GRAVE_PROPS = {
    tombs: [
        { x: 8, y: 6 },
        { x: 22, y: 6 },
        { x: 8, y: 18 }
    ]
};
var TOWN_HOUSES = [
    { x: 8, y: 6, w: 6, h: 5 },
    { x: 22, y: 7, w: 7, h: 5 },
    { x: 12, y: 16, w: 6, h: 5 }
];
var FARM_HOUSES = [
    { x: 24, y: 14, w: 5, h: 4 }
];
var LOCKED_DOOR = {
    zoneId: 'millfields',
    tx: FARM_HOUSES[0].x + Math.floor(FARM_HOUSES[0].w / 2),
    ty: FARM_HOUSES[0].y + FARM_HOUSES[0].h - 1,
    keyId: 'key'
};
var AGILITY_SHORTCUT = {
    zoneId: 'millfields',
    tx: LOCKED_DOOR.tx - 1,
    ty: LOCKED_DOOR.ty,
    skill: 'agility',
    level: 5,
    verb: 'squeeze'
};
var MINE_SHAFT_HOUSE = { x: 6, y: 8, w: 6, h: 5 };
/* Highlands cave mouth: diamond-tier pick clears the sealing boulder. */
var DRAGON_DEN_GATE = {
    zoneId: 'highlands',
    boulder: { x: 30, y: 12 },
    seal: [
        { x: 30, y: 11 },
        { x: 30, y: 12 },
        { x: 30, y: 13 }
    ],
    cave: { x: 32, y: 12 },
    alcove: [
        { x: 31, y: 11 },
        { x: 31, y: 12 },
        { x: 31, y: 13 },
        { x: 32, y: 11 },
        { x: 32, y: 12 },
        { x: 32, y: 13 }
    ],
    returnSpawn: { x: 28, y: 12 },
    denExit: { x: 18, y: 24 },
    denSpawn: { x: 18, y: 22 }
};
var DEN_BOULDER_PICK_TIER = 5;
var MINE_PROPS = {
    copper: [
        { x: 14, y: 16 },
        { x: 15, y: 20 }
    ],
    tin: [
        { x: 16, y: 16 },
        { x: 17, y: 20 }
    ],
    iron: [
        { x: 22, y: 16 },
        { x: 24, y: 20 }
    ],
    diamondore: [
        { x: 20, y: 18 },
        { x: 26, y: 14 }
    ],
    dragoniteore: [
        { x: 28, y: 18 },
        { x: 30, y: 16 }
    ],
    runeessence: [
        { x: 12, y: 18 },
        { x: 13, y: 20 },
        { x: 18, y: 22 }
    ]
};
/* Windrock Highlands: fixed nodes so diamond is findable near the den path (plus hash rocks). */
var HIGHLANDS_MINE_PROPS = {
    diamondore: [
        { x: 26, y: 12 },
        { x: 24, y: 10 }
    ],
    iron: [
        { x: 22, y: 14 }
    ]
};
/* Rune altars: shrine tile + interact.kind altar. */
var RUNE_ALTARS = {
    haven: { x: 20, y: 8, rune: 'airrune' },
    graves: { x: 18, y: 10, rune: 'mindrune' },
    southshore: { x: 18, y: 20, rune: 'waterrune' },
    millfields: { x: 18, y: 12, rune: 'earthrune' },
    highlands: { x: 18, y: 10, rune: 'firerune' },
    mire: { x: 16, y: 12, rune: 'naturerune' }
};
var INTERIOR_ROOM = { x: 12, y: 8, w: 12, h: 13 };
var SCENERY_EXAMINE = {
    tree: "It's a tree.",
    rock: "It's a rock.",
    shrine: 'A weathered stone shrine.',
    water: "It's water.",
    wall: "It's a house wall.",
    stall: 'A crafting stall. Leatherwork tools rest on the counter.',
    range: 'A cooking range. Ready for raw food.',
    anvil: 'A well-used smithing anvil.',
    furnace: 'A brick furnace. Ore melts here into bars.',
    fire: 'A crackling fire. Good for cooking.',
    booth: 'A bank counter. Step to the front to bank.',
    ge: 'A Grand Exchange booth. Offers are frozen — use Mira or Cole for trade.',
    'shop-stall': 'Mira\'s courtyard stall. Click to trade.',
    'guild-post': 'Bram\'s muster post. Talk to the Guildmaster nearby.',
    craft: 'A crafting stall. Leatherwork tools rest on the counter.',
    dock: 'A weathered wooden dock. The tide slaps the pilings.',
    boat: 'A fishing boat, tied off and empty.',
    fishspot: 'A fishing spot. Fish dart beneath the surface.',
    tomb: 'A weathered tomb marker. The name is worn away.',
    shortcut: 'A narrow gap beside the locked door. You might squeeze through.',
    gate: 'A wooden courtyard gate. The hinges still work.',
    'door-bank': 'The old bank door. Use the courtyard counter to bank.',
    'door-shop': 'An old shop door. Mira sells from the courtyard stall.',
    'door-guild': 'The guild hall door. Bram drills in the courtyard.',
    'stairs-down': 'Marked stairs down — delve deeper into the Deep Mine.',
    'stairs-up': 'Marked stairs up — climb toward the surface (or the floor above).',
    'surface-portal': 'A rune-cut escape shaft. Escape here to remember this floor for next delve.',
    'dungeon-enter': 'The Deep Mine shaft mouth. Delve here; it drops you at your last escape floor.',
    campfire: 'A warm campfire. Rest here to mend faster.',
    altar: 'A rune altar. Essence pressed here becomes runes.',
    'den-boulder': 'A massive boulder seals a dark cave mouth. Only a diamond pickaxe could crack it.',
    'dragon-den': 'A scorched cave mouth. Heat and sulphur roll out from the Dragon Den.',
    'dragon-den-exit': 'The tunnel back to Windrock Highlands.'
};

function tagKey(tx, ty) {
    return tx + ',' + ty;
}

function clearZoneTags(zoneId) {
    ZONE_TILE_TAGS[zoneId] = {};
    ZONE_INTERACT[zoneId] = {};
}

function setTileTag(zoneId, tx, ty, tag) {
    var key;
    var row;
    if (!ZONE_TILE_TAGS[zoneId]) {
        ZONE_TILE_TAGS[zoneId] = {};
    }
    key = tagKey(tx, ty);
    row = ZONE_TILE_TAGS[zoneId][key] || {};
    row[tag] = true;
    ZONE_TILE_TAGS[zoneId][key] = row;
}

function getTileTags(zoneId, tx, ty) {
    var bag = ZONE_TILE_TAGS[zoneId];
    return bag ? bag[tagKey(tx, ty)] || null : null;
}

function tileHasTag(zoneId, tx, ty, tag) {
    var row = getTileTags(zoneId, tx, ty);
    return !!(row && row[tag]);
}

function setTileInteract(zoneId, tx, ty, spec) {
    if (!ZONE_INTERACT[zoneId]) {
        ZONE_INTERACT[zoneId] = {};
    }
    ZONE_INTERACT[zoneId][tagKey(tx, ty)] = spec;
}

function getTileInteract(zoneId, tx, ty) {
    var bag = ZONE_INTERACT[zoneId];
    return bag ? bag[tagKey(tx, ty)] || null : null;
}

function paintBankCounter(grid, zoneId) {
    var i;
    var cell;
    for (i = 0; i < BANK_COUNTER.staff.length; i++) {
        cell = BANK_COUNTER.staff[i];
        setCell(grid, cell.x, cell.y, TILE.WALL);
        setTileTag(zoneId, cell.x, cell.y, 'blocked_npc');
        setTileTag(zoneId, cell.x, cell.y, 'staff');
        setTileInteract(zoneId, cell.x, cell.y, {
            kind: 'staff',
            verb: null,
            npcKey: 'banker',
            playerBlocked: true
        });
    }
    for (i = 0; i < BANK_COUNTER.desk.length; i++) {
        cell = BANK_COUNTER.desk[i];
        setCell(grid, cell.x, cell.y, TILE.BOOTH);
        setTileTag(zoneId, cell.x, cell.y, 'counter');
        setTileTag(zoneId, cell.x, cell.y, 'blocked_npc');
    }
    setCell(grid, BANK_COUNTER.front.x, BANK_COUNTER.front.y, TILE.PATH);
    setTileTag(zoneId, BANK_COUNTER.front.x, BANK_COUNTER.front.y, 'counter_front');
    setTileTag(zoneId, BANK_COUNTER.front.x, BANK_COUNTER.front.y, 'blocked_npc');
    setTileInteract(zoneId, BANK_COUNTER.front.x, BANK_COUNTER.front.y, {
        kind: 'booth',
        verb: 'bank',
        npcKey: 'banker'
    });
    for (i = 0; i < BANK_COUNTER.apron.length; i++) {
        cell = BANK_COUNTER.apron[i];
        setCell(grid, cell.x, cell.y, TILE.PATH);
        setTileTag(zoneId, cell.x, cell.y, 'apron');
    }
}

var TOWN_DOOR_KINDS = ['door-bank', 'door-shop', 'door-guild'];

function townHouseDoorTile(rect) {
    return { x: rect.x + Math.floor(rect.w / 2), y: rect.y + rect.h - 1 };
}

function townDoorKindAt(tx, ty) {
    var i;
    for (i = 0; i < TOWN_HOUSES.length; i++) {
        var door = townHouseDoorTile(TOWN_HOUSES[i]);
        if (door.x === tx && door.y === ty) {
            return TOWN_DOOR_KINDS[i] || null;
        }
    }
    return null;
}

function isWalkableExamineKind(kind) {
    return kind === 'gate' || kind === 'door-bank' || kind === 'door-shop' || kind === 'door-guild';
}

function tileCenter(tx, ty) {
    var size = typeof TILE_SIZE === 'number' ? TILE_SIZE : 16;
    return { x: tx * size + size / 2, y: ty * size + size / 2 };
}

function hash2(x, y, seed) {
    return (x * 374761393 + y * 668265263 + seed * 1274126177) >>> 0;
}

function makeGrid(fill) {
    var grid = [];
    for (var y = 0; y < MAP_H; y++) {
        grid[y] = [];
        for (var x = 0; x < MAP_W; x++) {
            grid[y][x] = fill;
        }
    }
    return grid;
}

function inBounds(x, y) {
    return x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;
}

function setCell(grid, x, y, value) {
    if (inBounds(x, y)) {
        grid[y][x] = value;
    }
}

function carveOpening(grid, dir) {
    var midx = Math.floor(MAP_W / 2);
    var midy = Math.floor(MAP_H / 2);
    if (dir === 'n') {
        for (var x = midx - 2; x <= midx + 2; x++) {
            setCell(grid, x, 0, TILE.PATH);
            setCell(grid, x, 1, TILE.PATH);
        }
    } else if (dir === 's') {
        for (var x = midx - 2; x <= midx + 2; x++) {
            setCell(grid, x, MAP_H - 1, TILE.PATH);
            setCell(grid, x, MAP_H - 2, TILE.PATH);
        }
    } else if (dir === 'w') {
        for (var y = midy - 2; y <= midy + 2; y++) {
            setCell(grid, 0, y, TILE.PATH);
            setCell(grid, 1, y, TILE.PATH);
        }
    } else if (dir === 'e') {
        for (var y = midy - 2; y <= midy + 2; y++) {
            setCell(grid, MAP_W - 1, y, TILE.PATH);
            setCell(grid, MAP_W - 2, y, TILE.PATH);
        }
    }
}

function pathToEdges(grid, neighbors) {
    var cx = Math.floor(MAP_W / 2);
    var cy = Math.floor(MAP_H / 2);
    var x;
    var y;
    if (neighbors.n) {
        for (y = 0; y <= cy; y++) {
            setCell(grid, cx, y, TILE.PATH);
            setCell(grid, cx - 1, y, TILE.PATH);
        }
    }
    if (neighbors.s) {
        for (y = cy; y < MAP_H; y++) {
            setCell(grid, cx, y, TILE.PATH);
            setCell(grid, cx - 1, y, TILE.PATH);
        }
    }
    if (neighbors.w) {
        for (x = 0; x <= cx; x++) {
            setCell(grid, x, cy, TILE.PATH);
            setCell(grid, x, cy - 1, TILE.PATH);
        }
    }
    if (neighbors.e) {
        for (x = cx; x < MAP_W; x++) {
            setCell(grid, x, cy, TILE.PATH);
            setCell(grid, x, cy - 1, TILE.PATH);
        }
    }
}

function scatter(grid, tile, count, seed, avoidPath) {
    var i = 0;
    var guard = 0;
    while (i < count && guard < count * 24) {
        guard++;
        var hx = (hash2(guard, seed, i * 17 + 31) ^ 0x9e3779b9) >>> 0;
        var hy = (hash2(i, seed + 19, guard * 13 + 7) ^ 0x85ebca6b) >>> 0;
        hx = Math.imul(hx ^ (hx >>> 16), 0x85ebca6b) >>> 0;
        hy = Math.imul(hy ^ (hy >>> 13), 0xc2b2ae35) >>> 0;
        var x = 2 + (hx % (MAP_W - 4));
        var y = 2 + (hy % (MAP_H - 4));
        if (avoidPath && grid[y][x] === TILE.PATH) {
            continue;
        }
        if (grid[y][x] === tile) {
            continue;
        }
        grid[y][x] = tile;
        i++;
    }
}

function mapTileBlocksPath(index) {
    if (typeof tileBlockedByTerrain === 'function') {
        return tileBlockedByTerrain(index);
    }
    return index === TILE.WATER || index === TILE.TREE || index === TILE.ROCK || index === TILE.SHRINE
        || index === TILE.STALL || index === TILE.RANGE || index === TILE.ANVIL || index === TILE.BOOTH
        || index === TILE.FURNACE
        || index === TILE.BOAT || index === TILE.TOMB
        || index === TILE.DOOR || index === TILE.WALL;
}

function isMapBorderTile(x, y) {
    return x === 0 || y === 0 || x === MAP_W - 1 || y === MAP_H - 1;
}

function isProtectedPathBlocker(x, y, zoneId) {
    var i;
    var k;
    var list;
    var kinds;
    var altar;
    var rect;
    if (isMapBorderTile(x, y)) {
        return true;
    }
    if (zoneId === 'southshore' && SHORE_PROPS) {
        if (SHORE_PROPS.boat && SHORE_PROPS.boat.x === x && SHORE_PROPS.boat.y === y) {
            return true;
        }
        if (SHORE_PROPS.dock && SHORE_PROPS.dock.x === x && SHORE_PROPS.dock.y === y) {
            return true;
        }
        if (SHORE_PROPS.planks) {
            for (i = 0; i < SHORE_PROPS.planks.length; i++) {
                if (SHORE_PROPS.planks[i].x === x && SHORE_PROPS.planks[i].y === y) {
                    return true;
                }
            }
        }
        if (SHORE_PROPS.spots) {
            for (i = 0; i < SHORE_PROPS.spots.length; i++) {
                if (SHORE_PROPS.spots[i].x === x && SHORE_PROPS.spots[i].y === y) {
                    return true;
                }
            }
        }
    }
    if (zoneId === 'darkmine' && MINE_SHAFT_HOUSE) {
        rect = MINE_SHAFT_HOUSE;
        if (x >= rect.x && y >= rect.y && x < rect.x + rect.w && y < rect.y + rect.h) {
            return true;
        }
        if (MINE_PROPS) {
            kinds = ['copper', 'tin', 'iron', 'diamondore', 'dragoniteore', 'runeessence'];
            for (k = 0; k < kinds.length; k++) {
                list = MINE_PROPS[kinds[k]];
                if (!list) {
                    continue;
                }
                for (i = 0; i < list.length; i++) {
                    if (list[i].x === x && list[i].y === y) {
                        return true;
                    }
                }
            }
        }
    }
    altar = RUNE_ALTARS && zoneId ? RUNE_ALTARS[zoneId] : null;
    if (altar && altar.x === x && altar.y === y) {
        return true;
    }
    return false;
}

/**
 * After scatter, convert excess interior blockers to grass until ≤ MAX_PATH_BLOCK_RATIO.
 * Prefer clearing TREE/ROCK; only then non-spot WATER. Border + key props stay.
 */
function enforcePathBlockCap(grid, seed, zoneId) {
    var x;
    var y;
    var interior = 0;
    var blocked = 0;
    var maxBlocked;
    var candidates;
    var waterCandidates;
    var i;
    var cell;
    var index;
    var score;
    if (!grid || !zoneId) {
        return;
    }
    if (zoneId !== 'southshore' && zoneId !== 'darkmine') {
        return;
    }
    for (y = 0; y < MAP_H; y++) {
        for (x = 0; x < MAP_W; x++) {
            if (isMapBorderTile(x, y)) {
                continue;
            }
            interior++;
            if (mapTileBlocksPath(grid[y][x])) {
                blocked++;
            }
        }
    }
    maxBlocked = Math.floor(interior * MAX_PATH_BLOCK_RATIO);
    if (blocked <= maxBlocked) {
        return;
    }
    candidates = [];
    waterCandidates = [];
    for (y = 1; y < MAP_H - 1; y++) {
        for (x = 1; x < MAP_W - 1; x++) {
            index = grid[y][x];
            if (!mapTileBlocksPath(index) || isProtectedPathBlocker(x, y, zoneId)) {
                continue;
            }
            score = hash2(x, y, seed + 401);
            if (index === TILE.TREE || index === TILE.ROCK) {
                candidates.push({ x: x, y: y, score: score, tile: index });
            } else if (index === TILE.WATER) {
                waterCandidates.push({ x: x, y: y, score: score });
            }
        }
    }
    candidates.sort(function (a, b) {
        if (a.tile !== b.tile) {
            /* Clear ROCK before TREE so gather trees linger a bit longer. */
            return a.tile === TILE.ROCK ? -1 : 1;
        }
        return a.score - b.score;
    });
    waterCandidates.sort(function (a, b) {
        return a.score - b.score;
    });
    for (i = 0; i < candidates.length && blocked > maxBlocked; i++) {
        cell = candidates[i];
        if (!mapTileBlocksPath(grid[cell.y][cell.x])) {
            continue;
        }
        grid[cell.y][cell.x] = TILE.GRASS;
        blocked--;
    }
    for (i = 0; i < waterCandidates.length && blocked > maxBlocked; i++) {
        cell = waterCandidates[i];
        if (grid[cell.y][cell.x] !== TILE.WATER) {
            continue;
        }
        grid[cell.y][cell.x] = TILE.GRASS;
        blocked--;
    }
}

function house(grid, x, y, w, h) {
    var ix;
    var iy;
    for (iy = y; iy < y + h; iy++) {
        for (ix = x; ix < x + w; ix++) {
            var edge = ix === x || iy === y || ix === x + w - 1 || iy === y + h - 1;
            setCell(grid, ix, iy, edge ? TILE.WALL : TILE.PATH);
        }
    }
    setCell(grid, x + Math.floor(w / 2), y + h - 1, TILE.PATH);
}

function paintCampfireSpots(grid, zoneId) {
    var spots;
    var i;
    var cell;
    if (!zoneId || !CAMPFIRE_SPOTS[zoneId]) {
        return;
    }
    spots = CAMPFIRE_SPOTS[zoneId];
    for (i = 0; i < spots.length; i++) {
        cell = spots[i];
        setCell(grid, cell.x, cell.y, TILE.PATH);
        setTileInteract(zoneId, cell.x, cell.y, { kind: 'campfire', verb: 'rest' });
    }
}

function generateMap(seed, biome, neighbors, zoneId) {
    var grid = makeGrid(TILE.GRASS);
    var x;
    var y;
    for (y = 0; y < MAP_H; y++) {
        for (x = 0; x < MAP_W; x++) {
            var n = hash2(x, y, seed) % 11;
            if (biome === 'swamp') {
                grid[y][x] = n < 3 ? TILE.WATER : (n === 3 ? TILE.FLOWER : TILE.GRASS2);
            } else if (biome === 'shore') {
                /* Thinner coast band so interior path-block stays under 30%. */
                grid[y][x] = y > MAP_H - 6 ? TILE.WATER : (n === 0 ? TILE.FLOWER : TILE.GRASS);
            } else if (biome === 'hills') {
                grid[y][x] = n === 0 ? TILE.GRASS2 : TILE.GRASS;
            } else if (biome === 'grave') {
                grid[y][x] = n < 2 ? TILE.GRASS2 : TILE.GRASS;
            } else {
                grid[y][x] = n === 0 ? TILE.GRASS2 : TILE.GRASS;
            }
        }
    }

    for (x = 0; x < MAP_W; x++) {
        grid[0][x] = TILE.TREE;
        grid[MAP_H - 1][x] = TILE.TREE;
    }
    for (y = 0; y < MAP_H; y++) {
        grid[y][0] = TILE.TREE;
        grid[y][MAP_W - 1] = TILE.TREE;
    }

    pathToEdges(grid, neighbors);
    if (neighbors.n) { carveOpening(grid, 'n'); }
    if (neighbors.s) { carveOpening(grid, 's'); }
    if (neighbors.e) { carveOpening(grid, 'e'); }
    if (neighbors.w) { carveOpening(grid, 'w'); }

    if (biome === 'town') {
        var hi;
        var townZoneId = zoneId || 'haven';
        clearZoneTags(townZoneId);
        for (hi = 0; hi < TOWN_HOUSES.length; hi++) {
            house(grid, TOWN_HOUSES[hi].x, TOWN_HOUSES[hi].y, TOWN_HOUSES[hi].w, TOWN_HOUSES[hi].h);
        }
        var px;
        var py;
        for (py = 10; py <= 18; py++) {
            for (px = 14; px <= 22; px++) {
                setCell(grid, px, py, TILE.PATH);
            }
        }
        setCell(grid, 18, 8, TILE.SHRINE);
        scatter(grid, TILE.FLOWER, 18, seed, true);
        setCell(grid, HAVEN_GATE_TILE.x, HAVEN_GATE_TILE.y - 2, TILE.ROCK);
        setCell(grid, HAVEN_GATE_TILE.x, HAVEN_GATE_TILE.y - 1, TILE.ROCK);
        setCell(grid, HAVEN_GATE_TILE.x, HAVEN_GATE_TILE.y, TILE.PATH);
        setCell(grid, HAVEN_GATE_TILE.x, HAVEN_GATE_TILE.y + 1, TILE.ROCK);
        setCell(grid, HAVEN_GATE_TILE.x, HAVEN_GATE_TILE.y + 2, TILE.ROCK);
        setCell(grid, TOWN_PROPS.stall.x, TOWN_PROPS.stall.y, TILE.STALL);
        setCell(grid, TOWN_PROPS.ge.x, TOWN_PROPS.ge.y, TILE.STALL);
        setCell(grid, TOWN_PROPS.range.x, TOWN_PROPS.range.y, TILE.RANGE);
        setCell(grid, TOWN_PROPS.anvil.x, TOWN_PROPS.anvil.y, TILE.ANVIL);
        setCell(grid, TOWN_PROPS.furnace.x, TOWN_PROPS.furnace.y, TILE.FURNACE);
        if (TOWN_PROPS.shopStall) {
            setCell(grid, TOWN_PROPS.shopStall.x, TOWN_PROPS.shopStall.y, TILE.STALL);
            setTileInteract(townZoneId, TOWN_PROPS.shopStall.x, TOWN_PROPS.shopStall.y, {
                kind: 'shop-stall',
                verb: 'trade',
                npcKey: 'shopkeep',
                shopKey: 'mira'
            });
        }
        if (TOWN_PROPS.guildPost) {
            setCell(grid, TOWN_PROPS.guildPost.x, TOWN_PROPS.guildPost.y, TILE.SHRINE);
            setTileInteract(townZoneId, TOWN_PROPS.guildPost.x, TOWN_PROPS.guildPost.y, {
                kind: 'guild-post',
                verb: 'talk',
                npcKey: 'guild'
            });
        }
        paintBankCounter(grid, townZoneId);
        setTileInteract(townZoneId, TOWN_PROPS.stall.x, TOWN_PROPS.stall.y, { kind: 'stall', verb: 'craft' });
        setTileInteract(townZoneId, TOWN_PROPS.range.x, TOWN_PROPS.range.y, { kind: 'range', verb: 'cook' });
        setTileInteract(townZoneId, TOWN_PROPS.anvil.x, TOWN_PROPS.anvil.y, { kind: 'anvil', verb: 'smith' });
        setTileInteract(townZoneId, TOWN_PROPS.furnace.x, TOWN_PROPS.furnace.y, { kind: 'furnace', verb: 'smelt' });
    } else if (biome === 'forest') {
        scatter(grid, TILE.TREE, 70, seed, true);
        scatter(grid, TILE.ROCK, 10, seed + 11, true);
        scatter(grid, TILE.FLOWER, 12, seed + 1, true);
    } else if (biome === 'hills') {
        scatter(grid, TILE.ROCK, 36, seed, true);
        scatter(grid, TILE.TREE, 16, seed + 2, true);
        placeHighlandsMineOres(grid);
        placeDragonDenGate(grid, zoneId || 'highlands', false);
    } else if (biome === 'den') {
        generateDragonDenMap(grid, seed, zoneId || 'dragonden');
    } else if (biome === 'farm') {
        scatter(grid, TILE.FLOWER, 40, seed, true);
        scatter(grid, TILE.TREE, 10, seed + 3, true);
        scatter(grid, TILE.ROCK, 6, seed + 12, true);
        house(grid, FARM_HOUSES[0].x, FARM_HOUSES[0].y, FARM_HOUSES[0].w, FARM_HOUSES[0].h);
        setCell(grid, LOCKED_DOOR.tx, LOCKED_DOOR.ty, TILE.DOOR);
    } else if (biome === 'swamp') {
        scatter(grid, TILE.WATER, 28, seed, true);
        scatter(grid, TILE.TREE, 22, seed + 4, true);
        scatter(grid, TILE.ROCK, 12, seed + 13, true);
    } else if (biome === 'shore') {
        for (x = 1; x < MAP_W - 1; x++) {
            if (x > 14 && x < 22) {
                continue;
            }
            setCell(grid, x, MAP_H - 7, TILE.PATH);
        }
        /* Low TREE/ROCK scatter — keep dock / boat / fish spots; cap enforces ≤30%. */
        scatter(grid, TILE.ROCK, 4, seed, true);
        scatter(grid, TILE.TREE, 4, seed + 14, true);
        var di;
        for (di = 0; di < SHORE_PROPS.planks.length; di++) {
            setCell(grid, SHORE_PROPS.planks[di].x, SHORE_PROPS.planks[di].y, TILE.DOCK);
        }
        setCell(grid, SHORE_PROPS.boat.x, SHORE_PROPS.boat.y, TILE.BOAT);
        var si;
        for (si = 0; si < SHORE_PROPS.spots.length; si++) {
            setCell(grid, SHORE_PROPS.spots[si].x, SHORE_PROPS.spots[si].y, TILE.WATER);
        }
    } else if (biome === 'mine') {
        /* Sparse rocks so corridors stay open; ore nodes + shaft house placed after. */
        scatter(grid, TILE.ROCK, 18, seed, true);
        scatter(grid, TILE.TREE, 4, seed + 5, true);
        house(grid, MINE_SHAFT_HOUSE.x, MINE_SHAFT_HOUSE.y, MINE_SHAFT_HOUSE.w, MINE_SHAFT_HOUSE.h);
        placeMineOres(grid);
        clearZoneTags('darkmine');
        var shaftDoor = {
            x: MINE_SHAFT_HOUSE.x + Math.floor(MINE_SHAFT_HOUSE.w / 2),
            y: MINE_SHAFT_HOUSE.y + MINE_SHAFT_HOUSE.h - 1
        };
        setTileTag('darkmine', shaftDoor.x, shaftDoor.y, 'stairs_down');
        setTileInteract('darkmine', shaftDoor.x, shaftDoor.y, {
            kind: 'dungeon-enter',
            verb: 'delve',
            stairs: 'down'
        });
        /* Keep doorway walkable; WorldScene paints a shaft marker + label on top. */
    } else if (biome === 'plains') {
        scatter(grid, TILE.FLOWER, 24, seed, true);
        scatter(grid, TILE.TREE, 14, seed + 6, true);
        scatter(grid, TILE.ROCK, 8, seed + 15, true);
    } else if (biome === 'grave') {
        scatter(grid, TILE.ROCK, 22, seed, true);
        scatter(grid, TILE.TREE, 18, seed + 7, true);
        var ti;
        for (ti = 0; ti < GRAVE_PROPS.tombs.length; ti++) {
            setCell(grid, GRAVE_PROPS.tombs[ti].x, GRAVE_PROPS.tombs[ti].y, TILE.TOMB);
        }
    }

    paintCampfireSpots(grid, zoneId || (biome === 'town' ? 'haven' : null));
    if (zoneId) {
        placeRuneAltar(grid, zoneId);
    } else if (biome === 'town') {
        placeRuneAltar(grid, 'haven');
    }
    if (zoneId === 'southshore' || zoneId === 'darkmine') {
        enforcePathBlockCap(grid, seed, zoneId);
    }
    return grid;
}

function generateInterior(kind) {
    var grid = makeGrid(TILE.ROCK);
    var x0 = INTERIOR_ROOM.x;
    var y0 = INTERIOR_ROOM.y;
    var w = INTERIOR_ROOM.w;
    var h = INTERIOR_ROOM.h;
    var ix;
    var iy;
    for (iy = y0; iy < y0 + h; iy++) {
        for (ix = x0; ix < x0 + w; ix++) {
            var edge = ix === x0 || iy === y0 || ix === x0 + w - 1 || iy === y0 + h - 1;
            setCell(grid, ix, iy, edge ? TILE.WALL : TILE.PATH);
        }
    }
    setCell(grid, INTERIOR_EXIT_TILE.x, INTERIOR_EXIT_TILE.y, TILE.PATH);
    for (ix = x0 + 2; ix < x0 + w - 2; ix++) {
        setCell(grid, ix, y0 + 2, TILE.WALL);
    }
    setCell(grid, x0 + Math.floor(w / 2), y0 + 2, TILE.PATH);
    if (kind === 'shaft') {
        setCell(grid, x0 + 3, y0 + 5, TILE.ROCK);
        setCell(grid, x0 + 8, y0 + 5, TILE.ROCK);
        setCell(grid, x0 + 3, y0 + 8, TILE.ROCK);
        setCell(grid, x0 + 8, y0 + 8, TILE.ROCK);
    }
    return grid;
}

function dungeonFloorScale(floor) {
    var n = typeof floor === 'number' && floor > 0 ? floor : 1;
    return Math.pow(DUNGEON_FLOOR_SCALE, n - 1);
}

function generateDungeonFloor(floor) {
    var seed = 9000 + (floor | 0) * 97;
    var grid = makeGrid(TILE.ROCK);
    var meta;
    var x;
    var y;
    var i;
    var room;
    var rooms;
    clearZoneTags(DUNGEON_ZONE_ID);
    /* Carve a few linked chambers. */
    rooms = [
        { x: 14, y: 16, w: 9, h: 7 },
        { x: 8, y: 10, w: 7, h: 6 },
        { x: 21, y: 9, w: 7, h: 6 },
        { x: 14, y: 6, w: 9, h: 5 }
    ];
    for (i = 0; i < rooms.length; i++) {
        room = rooms[i];
        for (y = room.y; y < room.y + room.h; y++) {
            for (x = room.x; x < room.x + room.w; x++) {
                setCell(grid, x, y, TILE.PATH);
            }
        }
    }
    for (x = 16; x <= 20; x++) {
        setCell(grid, x, 13, TILE.PATH);
        setCell(grid, x, 12, TILE.PATH);
    }
    for (y = 8; y <= 20; y++) {
        setCell(grid, 18, y, TILE.PATH);
        setCell(grid, 17, y, TILE.PATH);
        setCell(grid, 19, y, TILE.PATH);
    }
    /* Stairs-up stays walkable PATH (stand to climb); down/escape stay click scenery. */
    setCell(grid, DUNGEON_STAIRS_UP.x, DUNGEON_STAIRS_UP.y, TILE.PATH);
    setCell(grid, DUNGEON_STAIRS_DOWN.x, DUNGEON_STAIRS_DOWN.y, TILE.DOOR);
    setCell(grid, DUNGEON_SURFACE.x, DUNGEON_SURFACE.y, TILE.SHRINE);
    setTileTag(DUNGEON_ZONE_ID, DUNGEON_STAIRS_UP.x, DUNGEON_STAIRS_UP.y, 'stairs_up');
    setTileTag(DUNGEON_ZONE_ID, DUNGEON_STAIRS_DOWN.x, DUNGEON_STAIRS_DOWN.y, 'stairs_down');
    setTileInteract(DUNGEON_ZONE_ID, DUNGEON_STAIRS_UP.x, DUNGEON_STAIRS_UP.y, {
        kind: 'stairs-up',
        verb: 'climb',
        stairs: 'up'
    });
    setTileInteract(DUNGEON_ZONE_ID, DUNGEON_STAIRS_DOWN.x, DUNGEON_STAIRS_DOWN.y, {
        kind: 'stairs-down',
        verb: 'delve',
        stairs: 'down'
    });
    setTileInteract(DUNGEON_ZONE_ID, DUNGEON_SURFACE.x, DUNGEON_SURFACE.y, {
        kind: 'surface-portal',
        verb: 'escape'
    });
    meta = {
        stairsUp: DUNGEON_STAIRS_UP,
        stairsDown: DUNGEON_STAIRS_DOWN,
        surface: DUNGEON_SURFACE,
        campfire: null,
        seed: seed,
        floor: floor | 0
    };
    if ((floor | 0) > 0 && (floor | 0) % 5 === 0) {
        setCell(grid, DUNGEON_CAMPFIRE.x, DUNGEON_CAMPFIRE.y, TILE.PATH);
        setTileInteract(DUNGEON_ZONE_ID, DUNGEON_CAMPFIRE.x, DUNGEON_CAMPFIRE.y, {
            kind: 'campfire',
            verb: 'rest'
        });
        meta.campfire = { x: DUNGEON_CAMPFIRE.x, y: DUNGEON_CAMPFIRE.y };
    }
    return { grid: grid, meta: meta };
}

function dungeonMobDefsForFloor(floor) {
    var n = Math.max(1, floor | 0);
    var level = typeof dungeonMobLevelForFloor === 'function'
        ? dungeonMobLevelForFloor(n)
        : (40 + (n - 1));
    var dragonFloor = typeof dungeonIsDragonFloor === 'function'
        ? dungeonIsDragonFloor(n)
        : (n % 21 === 0);
    var templates = [
        { type: 'Bat', texture: 'mob-bat' },
        { type: 'Goblin', texture: 'mob-goblin' },
        { type: 'Skeleton', texture: 'mob-skeleton' },
        { type: 'Slime', texture: 'mob-slime' }
    ];
    var spots = [
        { x: 200, y: 180 },
        { x: 280, y: 200 },
        { x: 340, y: 160 },
        { x: 240, y: 240 },
        { x: 300, y: 260 },
        { x: 160, y: 220 },
        { x: 220, y: 150 },
        { x: 320, y: 230 },
        { x: 180, y: 190 },
        { x: 260, y: 170 },
        { x: 310, y: 210 },
        { x: 190, y: 250 }
    ];
    var floorCount = 3 + Math.min(3, Math.floor((n - 1) / 4));
    var hero = (typeof Hud !== 'undefined' && Hud.hero) ? Hud.hero() : null;
    var mod = typeof mobSpawnModifierValue === 'function'
        ? mobSpawnModifierValue(hero)
        : (typeof MOB_SPAWN_MODIFIER === 'number' ? MOB_SPAWN_MODIFIER : 1);
    var count = Math.min(spots.length, Math.max(1, Math.round(floorCount * mod)));
    var out = [];
    var i;
    var base;
    var def;
    var stats;
    var type;
    if (n >= 8) {
        templates.push({ type: 'Drake', texture: 'mob-drake' });
    }
    for (i = 0; i < count; i++) {
        base = templates[(n + i * 3) % templates.length];
        type = base.type;
        if (dragonFloor && i === 0) {
            type = 'Dragon';
            base = { type: 'Dragon', texture: 'mob-drake' };
        }
        stats = typeof mobStatsFor === 'function'
            ? mobStatsFor(type, level)
            : { hp: 12 + level, damage: 3 + Math.floor(level / 2), gold: 2, xp: 4 + level };
        def = {
            type: type,
            texture: base.texture,
            tint: type === 'Dragon' ? 0xff4422 : 0xffffff,
            level: level,
            hp: stats.hp,
            damage: stats.damage,
            gold: stats.gold,
            xp: stats.xp,
            x: spots[i].x,
            y: spots[i].y,
            attackRange: type === 'Bat' ? 96
                : (type === 'Dragon' ? 120
                    : (type === 'Drake' || type === 'Slime' ? 80 : 24))
        };
        if (type === 'Dragon') {
            def.alwaysAgro = true;
        }
        out.push(def);
    }
    return out;
}

function interiorSpawnPoint() {
    return tileCenter(INTERIOR_EXIT_TILE.x, INTERIOR_EXIT_TILE.y - 1);
}

function flattenMap(grid) {
    var data = [];
    for (var y = 0; y < MAP_H; y++) {
        data.push(grid[y].slice());
    }
    return data;
}

function housesForBiome(biome) {
    if (biome === 'town') {
        return TOWN_HOUSES;
    }
    if (biome === 'farm') {
        return FARM_HOUSES;
    }
    if (biome === 'mine') {
        return [MINE_SHAFT_HOUSE];
    }
    return [];
}

function isHouseWallAt(grid, tx, ty, rects) {
    if (!inBounds(tx, ty) || !grid || !grid[ty]) {
        return false;
    }
    var index = grid[ty][tx];
    if (index !== TILE.WALL && index !== TILE.ROCK) {
        return false;
    }
    if (index === TILE.WALL) {
        return true;
    }
    rects = rects || [];
    var i;
    for (i = 0; i < rects.length; i++) {
        var rect = rects[i];
        if (tx < rect.x || ty < rect.y || tx >= rect.x + rect.w || ty >= rect.y + rect.h) {
            continue;
        }
        if (tx === rect.x || ty === rect.y || tx === rect.x + rect.w - 1 || ty === rect.y + rect.h - 1) {
            return true;
        }
    }
    return false;
}

function fishingSpotAt(tx, ty, zoneId) {
    if (zoneId !== 'southshore' || !SHORE_PROPS || !SHORE_PROPS.spots) {
        return null;
    }
    var i;
    for (i = 0; i < SHORE_PROPS.spots.length; i++) {
        if (SHORE_PROPS.spots[i].x === tx && SHORE_PROPS.spots[i].y === ty) {
            return SHORE_PROPS.spots[i];
        }
    }
    return null;
}

function woodcutTreeAt(tx, ty, zoneId, grid) {
    var spec;
    if (!inBounds(tx, ty) || zoneId === 'dungeon') {
        return null;
    }
    if (grid) {
        if (!grid[ty] || grid[ty][tx] !== TILE.TREE) {
            return null;
        }
    }
    spec = typeof treeSpecForZone === 'function'
        ? treeSpecForZone(zoneId)
        : { log: 'logs', level: 1 };
    return {
        x: tx,
        y: ty,
        log: spec.log || 'logs',
        level: typeof spec.level === 'number' ? spec.level : 1
    };
}

function oreFromPropTable(table, tx, ty) {
    var kinds = ['dragoniteore', 'diamondore', 'iron', 'runeessence', 'tin', 'copper'];
    var k;
    var i;
    var list;
    if (!table) {
        return null;
    }
    for (k = 0; k < kinds.length; k++) {
        list = table[kinds[k]];
        if (!list) {
            continue;
        }
        for (i = 0; i < list.length; i++) {
            if (list[i].x === tx && list[i].y === ty) {
                return kinds[k];
            }
        }
    }
    return null;
}

function mineOreAt(tx, ty) {
    var ore = oreFromPropTable(MINE_PROPS, tx, ty);
    if (ore) {
        return ore;
    }
    return (tx + ty) % 2 === 0 ? 'copper' : 'tin';
}

function highlandsOreAt(tx, ty) {
    var ore = oreFromPropTable(HIGHLANDS_MINE_PROPS, tx, ty);
    if (ore) {
        return ore;
    }
    if ((tx + ty) % 5 === 0) {
        return 'diamondore';
    }
    if ((tx + ty) % 2 === 0) {
        return 'iron';
    }
    return 'copper';
}

var ORE_NODE_COLORS = {
    copper: 0xc47a3a,
    tin: 0xb0bcc8,
    iron: 0x8a9098,
    diamondore: 0x6ec8ff,
    dragoniteore: 0xe85d3a,
    runeessence: 0xc9a0ff
};

function oreNodeColor(ore) {
    return (ORE_NODE_COLORS && ORE_NODE_COLORS[ore]) || 0x9a9088;
}

/* Shaft / stairs / escape cues — colors/glyphs local; zone labels from Zones.js roster. */
var SHAFT_MARKER_STYLE = {
    'dungeon-enter': {
        color: 0x9b6cff,
        label: 'Deep Mine\nLv 40+',
        glyph: '▼',
        labelColor: '#dcc8ff',
        approach: 'A marked shaft mouth — the Deep Mine (mobs Lv 40+, +1 per floor). Click or step in to delve.'
    },
    'stairs-down': {
        color: 0xe07030,
        label: 'Deeper',
        glyph: '▼',
        labelColor: '#ffd0a8',
        approach: 'Stairs marked Deeper — click to descend another floor.'
    },
    'stairs-up': {
        color: 0xe8c050,
        label: 'Climb',
        glyph: '▲',
        labelColor: '#ffe9a0',
        approach: 'Stairs marked Climb — step on them to go up (floor 1 exits to Darkmine).'
    },
    'surface-portal': {
        color: 0x6ec8ff,
        label: 'Escape',
        glyph: '◎',
        labelColor: '#b8e8ff',
        approach: 'Escape shaft — click to return to Darkmine; it remembers this floor.'
    },
    'den-boulder': {
        color: 0xc07040,
        label: 'Sealed Den\nDragons Lv 60',
        glyph: '◆',
        labelColor: '#ffd0a8',
        approach: 'A sealing boulder — mine it with a diamond pickaxe to open the Dragon Den (Dragons Lv 60).'
    },
    'dragon-den': {
        color: 0xe85d3a,
        label: 'Dragon Den\nDragons Lv 60',
        glyph: '▼',
        labelColor: '#ffb090',
        approach: 'Scorched cave mouth — Dragon Den (Dragons Lv 60). Click or step in to enter.'
    },
    'dragon-den-exit': {
        color: 0x6ec8ff,
        label: 'Windrock Highlands\nDrakes Lv 36–40',
        glyph: '▲',
        labelColor: '#b8e8ff',
        approach: 'Tunnel back to Windrock Highlands (Drakes Lv 36–40) — click or step on it to leave.'
    }
};

function shaftMarkerStyle(kind) {
    var base = (SHAFT_MARKER_STYLE && SHAFT_MARKER_STYLE[kind]) || null;
    var over;
    var out;
    var key;
    if (!base) {
        return null;
    }
    if (typeof zoneShaftMarkerOverlay !== 'function') {
        return base;
    }
    over = zoneShaftMarkerOverlay(kind);
    if (!over) {
        return base;
    }
    out = {};
    for (key in base) {
        if (Object.prototype.hasOwnProperty.call(base, key)) {
            out[key] = base[key];
        }
    }
    if (over.label) {
        out.label = over.label;
    }
    if (over.approach) {
        out.approach = over.approach;
    }
    return out;
}

function oreNodeLabel(ore) {
    if (!ore) {
        return 'rock';
    }
    if (ore === 'runeessence') {
        return 'rune essence';
    }
    if (typeof itemName === 'function') {
        return String(itemName(ore) || ore).replace(/\s+ore$/i, '').toLowerCase();
    }
    return String(ore).replace(/ore$/i, '');
}

function examineMineRockText(ore) {
    var label = oreNodeLabel(ore);
    if (!ore) {
        return "It's a rock.";
    }
    if (ore === 'runeessence') {
        return 'Rune essence speckles this rock.';
    }
    return 'This rock is laced with ' + label + ' ore.';
}

function placeOrePropTable(grid, table) {
    var kinds = ['copper', 'tin', 'iron', 'diamondore', 'dragoniteore', 'runeessence'];
    var k;
    var i;
    var list;
    if (!grid || !table) {
        return;
    }
    for (k = 0; k < kinds.length; k++) {
        list = table[kinds[k]];
        if (!list) {
            continue;
        }
        for (i = 0; i < list.length; i++) {
            setCell(grid, list[i].x, list[i].y, TILE.ROCK);
        }
    }
}

function placeMineOres(grid) {
    placeOrePropTable(grid, MINE_PROPS);
}

function placeHighlandsMineOres(grid) {
    placeOrePropTable(grid, HIGHLANDS_MINE_PROPS);
}

function placeRuneAltar(grid, zoneId) {
    var altar = RUNE_ALTARS && RUNE_ALTARS[zoneId];
    if (!altar || !grid) {
        return;
    }
    setCell(grid, altar.x, altar.y, TILE.SHRINE);
    setTileInteract(zoneId, altar.x, altar.y, {
        kind: 'altar',
        verb: 'craft',
        rune: altar.rune
    });
}

function isDragonDenOpen(hero) {
    return !!(hero && hero.flags && hero.flags.dragonDenOpen);
}

function markDragonDenOpen(hero) {
    if (!hero) {
        return false;
    }
    if (!hero.flags) {
        hero.flags = {};
    }
    hero.flags.dragonDenOpen = true;
    return true;
}

function clearTileInteract(zoneId, tx, ty) {
    var bag;
    if (!zoneId || typeof ZONE_INTERACT === 'undefined') {
        return;
    }
    bag = ZONE_INTERACT[zoneId];
    if (!bag) {
        return;
    }
    delete bag[tagKey(tx, ty)];
}

function placeDragonDenGate(grid, zoneId, cleared) {
    var gate = DRAGON_DEN_GATE;
    var i;
    var cell;
    if (!grid || !gate || zoneId !== gate.zoneId) {
        return;
    }
    for (i = 0; i < gate.alcove.length; i++) {
        cell = gate.alcove[i];
        setCell(grid, cell.x, cell.y, TILE.PATH);
    }
    setCell(grid, gate.cave.x, gate.cave.y, TILE.PATH);
    if (cleared) {
        for (i = 0; i < gate.seal.length; i++) {
            cell = gate.seal[i];
            setCell(grid, cell.x, cell.y, TILE.PATH);
            clearTileInteract(zoneId, cell.x, cell.y);
        }
        clearTileInteract(zoneId, gate.boulder.x, gate.boulder.y);
        setTileInteract(zoneId, gate.cave.x, gate.cave.y, {
            kind: 'dragon-den',
            verb: 'enter'
        });
    } else {
        for (i = 0; i < gate.seal.length; i++) {
            cell = gate.seal[i];
            setCell(grid, cell.x, cell.y, TILE.ROCK);
        }
        setCell(grid, gate.boulder.x, gate.boulder.y, TILE.ROCK);
        clearTileInteract(zoneId, gate.cave.x, gate.cave.y);
        setTileInteract(zoneId, gate.boulder.x, gate.boulder.y, {
            kind: 'den-boulder',
            verb: 'mine',
            needPickTier: DEN_BOULDER_PICK_TIER
        });
    }
}

function applyDragonDenGateState(grid, zoneId, hero) {
    if (!grid || zoneId !== (DRAGON_DEN_GATE && DRAGON_DEN_GATE.zoneId)) {
        return;
    }
    placeDragonDenGate(grid, zoneId, isDragonDenOpen(hero));
}

function generateDragonDenMap(grid, seed, zoneId) {
    var x;
    var y;
    var gate = DRAGON_DEN_GATE;
    clearZoneTags(zoneId);
    for (y = 0; y < MAP_H; y++) {
        for (x = 0; x < MAP_W; x++) {
            setCell(grid, x, y, TILE.ROCK);
        }
    }
    for (y = 6; y < MAP_H - 3; y++) {
        for (x = 8; x < MAP_W - 8; x++) {
            if (hash2(x, y, seed) % 7 === 0) {
                continue;
            }
            setCell(grid, x, y, TILE.PATH);
        }
    }
    for (x = 16; x <= 20; x++) {
        setCell(grid, x, MAP_H - 4, TILE.PATH);
        setCell(grid, x, MAP_H - 3, TILE.PATH);
    }
    setCell(grid, gate.denExit.x, gate.denExit.y, TILE.PATH);
    setTileInteract(zoneId, gate.denExit.x, gate.denExit.y, {
        kind: 'dragon-den-exit',
        verb: 'leave'
    });
    setCell(grid, 18, 10, TILE.SHRINE);
    setTileInteract(zoneId, 18, 10, {
        kind: 'altar',
        verb: 'craft',
        rune: 'firerune'
    });
}

function mineRockAt(tx, ty, zoneId, grid, opts) {
    var houseRects;
    var ore;
    var level;
    var biome;
    opts = opts || {};
    if (!inBounds(tx, ty) || zoneId === 'dungeon' || opts.interior) {
        return null;
    }
    if (grid) {
        if (!grid[ty] || grid[ty][tx] !== TILE.ROCK) {
            return null;
        }
        houseRects = opts.houseRects;
        if (!houseRects && typeof housesForBiome === 'function') {
            biome = (typeof ZONES !== 'undefined' && ZONES[zoneId] && ZONES[zoneId].biome) || 'mine';
            houseRects = housesForBiome(biome);
        }
        if (sceneryKindAt(grid, tx, ty, {
            houseRects: houseRects,
            interior: false,
            zoneId: zoneId
        }) !== 'rock') {
            return null;
        }
    }
    if (zoneId === 'darkmine') {
        ore = mineOreAt(tx, ty);
    } else if (zoneId === 'highlands') {
        ore = highlandsOreAt(tx, ty);
    } else if (zoneId === 'graves' || zoneId === 'mire') {
        /* Mid bands: iron mix with early ores. */
        ore = (tx + ty) % 4 === 0 ? 'iron' : ((tx + ty) % 2 === 0 ? 'copper' : 'tin');
    } else if (zoneId === 'northwood') {
        ore = (tx + ty) % 5 === 0 ? 'iron' : ((tx + ty) % 2 === 0 ? 'copper' : 'tin');
    } else {
        /* Early wilds / shore / farm / plains: copper & tin. */
        ore = (tx + ty) % 2 === 0 ? 'copper' : 'tin';
    }
    level = typeof resourceNeedLevel === 'function' ? resourceNeedLevel(ore) : (ore === 'iron' ? 15 : 1);
    return { x: tx, y: ty, ore: ore, level: level };
}

function agilityShortcutAt(tx, ty, zoneId) {
    if (!AGILITY_SHORTCUT) {
        return null;
    }
    if (zoneId && AGILITY_SHORTCUT.zoneId && zoneId !== AGILITY_SHORTCUT.zoneId) {
        return null;
    }
    if (tx !== AGILITY_SHORTCUT.tx || ty !== AGILITY_SHORTCUT.ty) {
        return null;
    }
    return AGILITY_SHORTCUT;
}

function sceneryKindAt(grid, tx, ty, opts) {
    opts = opts || {};
    var interact;
    if (!inBounds(tx, ty) || !grid || !grid[ty]) {
        return null;
    }
    if (agilityShortcutAt(tx, ty, opts.zoneId)) {
        return 'shortcut';
    }
    interact = opts.zoneId ? getTileInteract(opts.zoneId, tx, ty) : null;
    if (interact && interact.kind) {
        return interact.kind;
    }
    if (opts.zoneId === 'haven' && TOWN_PROPS.ge && tx === TOWN_PROPS.ge.x && ty === TOWN_PROPS.ge.y) {
        return 'ge';
    }
    var index = grid[ty][tx];
    if (index === TILE.TREE) {
        return 'tree';
    }
    if (fishingSpotAt(tx, ty, opts.zoneId)) {
        return 'fishspot';
    }
    if (index === TILE.WATER) {
        return 'water';
    }
    if (index === TILE.SHRINE) {
        return 'shrine';
    }
    if (index === TILE.STALL) {
        return 'stall';
    }
    if (index === TILE.RANGE) {
        return 'range';
    }
    if (index === TILE.ANVIL) {
        return 'anvil';
    }
    if (index === TILE.FURNACE) {
        return 'furnace';
    }
    if (index === TILE.BOOTH) {
        return 'booth';
    }
    if (index === TILE.DOCK) {
        return 'dock';
    }
    if (index === TILE.BOAT) {
        return 'boat';
    }
    if (index === TILE.TOMB) {
        return 'tomb';
    }
    if (index === TILE.WALL) {
        return 'wall';
    }
    if (index === TILE.ROCK) {
        if (opts.interior || isHouseWallAt(grid, tx, ty, opts.houseRects)) {
            return 'wall';
        }
        return 'rock';
    }
    if (index === TILE.PATH) {
        if (opts.interior) {
            return null;
        }
        if (opts.zoneId && opts.zoneId !== 'haven') {
            return null;
        }
        if (tx === HAVEN_GATE_TILE.x && ty === HAVEN_GATE_TILE.y) {
            return 'gate';
        }
        return townDoorKindAt(tx, ty);
    }
    return null;
}

function examineSceneryText(kind) {
    return (SCENERY_EXAMINE && SCENERY_EXAMINE[kind]) || '';
}

function sceneryPrimaryAction(kind) {
    if (kind === 'fishspot') {
        return { label: 'Fish', action: 'fish' };
    }
    if (kind === 'range') {
        return { label: 'Cook', action: 'station' };
    }
    if (kind === 'stall') {
        return { label: 'Craft', action: 'station' };
    }
    if (kind === 'shop-stall') {
        return { label: 'Trade', action: 'trade-stall' };
    }
    if (kind === 'guild-post') {
        return { label: 'Talk', action: 'talk-post' };
    }
    if (kind === 'anvil') {
        return { label: 'Smith', action: 'station' };
    }
    if (kind === 'furnace') {
        return { label: 'Smelt', action: 'station' };
    }
    if (kind === 'fire') {
        return { label: 'Cook', action: 'station' };
    }
    if (kind === 'booth') {
        return { label: 'Bank', action: 'station' };
    }
    if (kind === 'ge') {
        return { label: 'Exchange', action: 'ge' };
    }
    if (kind === 'stairs-down' || kind === 'dungeon-enter') {
        return { label: 'Delve', action: 'stairs' };
    }
    if (kind === 'stairs-up') {
        return { label: 'Climb', action: 'stairs' };
    }
    if (kind === 'surface-portal') {
        return { label: 'Surface', action: 'stairs' };
    }
    if (kind === 'campfire') {
        return { label: 'Rest', action: 'examine' };
    }
    if (kind === 'altar') {
        return { label: 'Craft runes', action: 'station' };
    }
    if (kind === 'den-boulder') {
        return { label: 'Mine boulder', action: 'mine-boulder' };
    }
    if (kind === 'dragon-den') {
        return { label: 'Enter den', action: 'stairs' };
    }
    if (kind === 'dragon-den-exit') {
        return { label: 'Leave den', action: 'stairs' };
    }
    return null;
}

function isStationKind(kind) {
    return kind === 'range' || kind === 'stall' || kind === 'anvil' || kind === 'furnace'
        || kind === 'fire' || kind === 'booth' || kind === 'shop-stall' || kind === 'altar';
}
