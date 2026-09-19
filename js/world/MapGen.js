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
    DOOR: 16
};

var MAP_W = 36;
var MAP_H = 28;
var HAVEN_GATE_TILE = { x: 23, y: 15 };
var INTERIOR_EXIT_TILE = { x: 18, y: 20 };
var TOWN_PROPS = {
    stall: { x: 16, y: 11 },
    range: { x: 16, y: 17 },
    anvil: { x: 21, y: 12 },
    booth: { x: 14, y: 12 }
};
var SHORE_PROPS = {
    dock: { x: 12, y: 22 },
    boat: { x: 11, y: 23 },
    planks: [
        { x: 12, y: 21 },
        { x: 12, y: 22 },
        { x: 12, y: 23 }
    ],
    spots: [
        { x: 16, y: 24 },
        { x: 20, y: 24 },
        { x: 24, y: 23 }
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
    ]
};
var INTERIOR_ROOM = { x: 12, y: 8, w: 12, h: 13 };
var SCENERY_EXAMINE = {
    tree: "It's a tree.",
    rock: "It's a rock.",
    shrine: 'A weathered stone shrine.',
    water: "It's water.",
    wall: "It's a house wall.",
    stall: 'A market stall. The grocer is away.',
    range: 'A cooking range. The fire is out.',
    anvil: 'A well-used smithing anvil.',
    booth: 'A bank booth. The clerk is away.',
    dock: 'A weathered wooden dock. The tide slaps the pilings.',
    boat: 'A fishing boat, tied off and empty.',
    fishspot: 'A fishing spot. Fish dart beneath the surface.',
    tomb: 'A weathered tomb marker. The name is worn away.',
    shortcut: 'A narrow gap beside the locked door. You might squeeze through.',
    gate: 'A wooden courtyard gate. The hinges still work.',
    'door-bank': 'The bank door. Elise keeps the ledgers inside.',
    'door-shop': 'The shop door. A faded sign hangs above it.',
    'door-guild': 'The guild hall door. Bram drills the militia inside.'
};

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

function house(grid, x, y, w, h) {
    var ix;
    var iy;
    for (iy = y; iy < y + h; iy++) {
        for (ix = x; ix < x + w; ix++) {
            var edge = ix === x || iy === y || ix === x + w - 1 || iy === y + h - 1;
            setCell(grid, ix, iy, edge ? TILE.ROCK : TILE.PATH);
        }
    }
    setCell(grid, x + Math.floor(w / 2), y + h - 1, TILE.PATH);
}

function generateMap(seed, biome, neighbors) {
    var grid = makeGrid(TILE.GRASS);
    var x;
    var y;
    for (y = 0; y < MAP_H; y++) {
        for (x = 0; x < MAP_W; x++) {
            var n = hash2(x, y, seed) % 11;
            if (biome === 'swamp') {
                grid[y][x] = n < 3 ? TILE.WATER : (n === 3 ? TILE.FLOWER : TILE.GRASS2);
            } else if (biome === 'shore') {
                grid[y][x] = y > MAP_H - 8 ? TILE.WATER : (n === 0 ? TILE.FLOWER : TILE.GRASS);
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
        setCell(grid, TOWN_PROPS.range.x, TOWN_PROPS.range.y, TILE.RANGE);
        setCell(grid, TOWN_PROPS.anvil.x, TOWN_PROPS.anvil.y, TILE.ANVIL);
        setCell(grid, TOWN_PROPS.booth.x, TOWN_PROPS.booth.y, TILE.BOOTH);
    } else if (biome === 'forest') {
        scatter(grid, TILE.TREE, 70, seed, true);
        scatter(grid, TILE.FLOWER, 12, seed + 1, true);
    } else if (biome === 'hills') {
        scatter(grid, TILE.ROCK, 36, seed, true);
        scatter(grid, TILE.TREE, 16, seed + 2, true);
    } else if (biome === 'farm') {
        scatter(grid, TILE.FLOWER, 40, seed, true);
        scatter(grid, TILE.TREE, 10, seed + 3, true);
        house(grid, FARM_HOUSES[0].x, FARM_HOUSES[0].y, FARM_HOUSES[0].w, FARM_HOUSES[0].h);
        setCell(grid, LOCKED_DOOR.tx, LOCKED_DOOR.ty, TILE.DOOR);
    } else if (biome === 'swamp') {
        scatter(grid, TILE.WATER, 28, seed, true);
        scatter(grid, TILE.TREE, 22, seed + 4, true);
    } else if (biome === 'shore') {
        for (x = 1; x < MAP_W - 1; x++) {
            if (x > 14 && x < 22) {
                continue;
            }
            setCell(grid, x, MAP_H - 7, TILE.PATH);
        }
        scatter(grid, TILE.ROCK, 8, seed, true);
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
        scatter(grid, TILE.ROCK, 55, seed, true);
        scatter(grid, TILE.TREE, 8, seed + 5, true);
        house(grid, MINE_SHAFT_HOUSE.x, MINE_SHAFT_HOUSE.y, MINE_SHAFT_HOUSE.w, MINE_SHAFT_HOUSE.h);
        placeMineOres(grid);
    } else if (biome === 'plains') {
        scatter(grid, TILE.FLOWER, 24, seed, true);
        scatter(grid, TILE.TREE, 14, seed + 6, true);
    } else if (biome === 'grave') {
        scatter(grid, TILE.ROCK, 22, seed, true);
        scatter(grid, TILE.TREE, 18, seed + 7, true);
        var ti;
        for (ti = 0; ti < GRAVE_PROPS.tombs.length; ti++) {
            setCell(grid, GRAVE_PROPS.tombs[ti].x, GRAVE_PROPS.tombs[ti].y, TILE.TOMB);
        }
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
            setCell(grid, ix, iy, edge ? TILE.ROCK : TILE.PATH);
        }
    }
    setCell(grid, INTERIOR_EXIT_TILE.x, INTERIOR_EXIT_TILE.y, TILE.PATH);
    for (ix = x0 + 2; ix < x0 + w - 2; ix++) {
        setCell(grid, ix, y0 + 2, TILE.ROCK);
    }
    setCell(grid, x0 + Math.floor(w / 2), y0 + 2, TILE.PATH);
    if (kind === 'bank') {
        setCell(grid, x0 + 3, y0 + 4, TILE.BOOTH);
    } else if (kind === 'shop') {
        setCell(grid, x0 + 3, y0 + 5, TILE.FLOWER);
        setCell(grid, x0 + 8, y0 + 5, TILE.FLOWER);
    } else if (kind === 'guild') {
        setCell(grid, x0 + Math.floor(w / 2), y0 + 2, TILE.SHRINE);
    } else if (kind === 'shaft') {
        setCell(grid, x0 + 3, y0 + 5, TILE.ROCK);
        setCell(grid, x0 + 8, y0 + 5, TILE.ROCK);
        setCell(grid, x0 + 3, y0 + 8, TILE.ROCK);
        setCell(grid, x0 + 8, y0 + 8, TILE.ROCK);
    }
    return grid;
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
    if (!inBounds(tx, ty) || !grid || !grid[ty] || grid[ty][tx] !== TILE.ROCK) {
        return false;
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
    if (zoneId !== 'northwood' || !inBounds(tx, ty)) {
        return null;
    }
    if (grid) {
        if (!grid[ty] || grid[ty][tx] !== TILE.TREE) {
            return null;
        }
    }
    return { x: tx, y: ty };
}

function mineOreAt(tx, ty) {
    var kinds = ['iron', 'tin', 'copper'];
    var k;
    var i;
    for (k = 0; k < kinds.length; k++) {
        var list = MINE_PROPS && MINE_PROPS[kinds[k]];
        if (!list) {
            continue;
        }
        for (i = 0; i < list.length; i++) {
            if (list[i].x === tx && list[i].y === ty) {
                return kinds[k];
            }
        }
    }
    return (tx + ty) % 2 === 0 ? 'copper' : 'tin';
}

function placeMineOres(grid) {
    var kinds = ['copper', 'tin', 'iron'];
    var k;
    var i;
    for (k = 0; k < kinds.length; k++) {
        var list = MINE_PROPS && MINE_PROPS[kinds[k]];
        if (!list) {
            continue;
        }
        for (i = 0; i < list.length; i++) {
            setCell(grid, list[i].x, list[i].y, TILE.ROCK);
        }
    }
}

function mineRockAt(tx, ty, zoneId, grid, opts) {
    if (zoneId !== 'darkmine' || !inBounds(tx, ty)) {
        return null;
    }
    opts = opts || {};
    if (opts.interior) {
        return null;
    }
    if (grid) {
        if (!grid[ty] || grid[ty][tx] !== TILE.ROCK) {
            return null;
        }
        var houseRects = opts.houseRects;
        if (!houseRects && typeof housesForBiome === 'function') {
            houseRects = housesForBiome('mine');
        }
        if (sceneryKindAt(grid, tx, ty, {
            houseRects: houseRects,
            interior: false,
            zoneId: zoneId
        }) !== 'rock') {
            return null;
        }
    }
    var ore = mineOreAt(tx, ty);
    var level = typeof resourceNeedLevel === 'function' ? resourceNeedLevel(ore) : (ore === 'iron' ? 15 : 1);
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
    if (!inBounds(tx, ty) || !grid || !grid[ty]) {
        return null;
    }
    if (agilityShortcutAt(tx, ty, opts.zoneId)) {
        return 'shortcut';
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
