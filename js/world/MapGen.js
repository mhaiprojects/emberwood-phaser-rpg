var TILE = {
    GRASS: 1,
    GRASS2: 2,
    PATH: 3,
    FLOWER: 4,
    WATER: 5,
    TREE: 6,
    ROCK: 7,
    SHRINE: 8
};

var MAP_W = 36;
var MAP_H = 28;
var HAVEN_GATE_TILE = { x: 23, y: 15 };
var INTERIOR_EXIT_TILE = { x: 18, y: 20 };

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
        house(grid, 8, 6, 6, 5);
        house(grid, 22, 7, 7, 5);
        house(grid, 12, 16, 6, 5);
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
    } else if (biome === 'forest') {
        scatter(grid, TILE.TREE, 70, seed, true);
        scatter(grid, TILE.FLOWER, 12, seed + 1, true);
    } else if (biome === 'hills') {
        scatter(grid, TILE.ROCK, 36, seed, true);
        scatter(grid, TILE.TREE, 16, seed + 2, true);
    } else if (biome === 'farm') {
        scatter(grid, TILE.FLOWER, 40, seed, true);
        scatter(grid, TILE.TREE, 10, seed + 3, true);
        house(grid, 24, 14, 5, 4);
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
    } else if (biome === 'mine') {
        scatter(grid, TILE.ROCK, 55, seed, true);
        scatter(grid, TILE.TREE, 8, seed + 5, true);
    } else if (biome === 'plains') {
        scatter(grid, TILE.FLOWER, 24, seed, true);
        scatter(grid, TILE.TREE, 14, seed + 6, true);
    } else if (biome === 'grave') {
        scatter(grid, TILE.ROCK, 22, seed, true);
        scatter(grid, TILE.TREE, 18, seed + 7, true);
    }

    return grid;
}

function generateInterior(kind) {
    var grid = makeGrid(TILE.ROCK);
    var x0 = 12;
    var y0 = 8;
    var w = 12;
    var h = 13;
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
        setCell(grid, x0 + 3, y0 + 4, TILE.SHRINE);
    } else if (kind === 'shop') {
        setCell(grid, x0 + 3, y0 + 5, TILE.FLOWER);
        setCell(grid, x0 + 8, y0 + 5, TILE.FLOWER);
    } else if (kind === 'guild') {
        setCell(grid, x0 + Math.floor(w / 2), y0 + 2, TILE.SHRINE);
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
