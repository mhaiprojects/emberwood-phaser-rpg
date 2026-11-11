var PATH_LINE_COLOR = 0xaa66ff;

function tileBlockedByTerrain(index) {
    return index === TILE.WATER || index === TILE.TREE || index === TILE.ROCK || index === TILE.SHRINE
        || index === TILE.STALL || index === TILE.RANGE || index === TILE.ANVIL || index === TILE.BOOTH
        || index === TILE.FURNACE
        || index === TILE.DOCK || index === TILE.BOAT || index === TILE.TOMB
        || index === TILE.DOOR || index === TILE.WALL;
}

function worldToTile(wx, wy) {
    var size = typeof TILE_SIZE === 'number' ? TILE_SIZE : 16;
    return {
        tx: Math.floor(wx / size),
        ty: Math.floor(wy / size)
    };
}

function tileWalkable(grid, tx, ty) {
    if (!grid || ty < 0 || tx < 0 || ty >= grid.length || !grid[ty] || tx >= grid[ty].length) {
        return false;
    }
    return !tileBlockedByTerrain(grid[ty][tx]);
}

/**
 * Loot "ground": walkable open tiles (grass / grass2 / path / flower, …).
 * Excludes rocks, trees, water, walls, doors, stalls, ranges, anvils, booths,
 * shrines, furnaces, tombs, docks, boats, and other blocked scenery.
 */
function isGroundTile(grid, tx, ty) {
    return tileWalkable(grid, tx, ty);
}

function nearestWalkableTile(grid, tx, ty) {
    if (tileWalkable(grid, tx, ty)) {
        return { tx: tx, ty: ty };
    }
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    var queue = [{ tx: tx, ty: ty }];
    var seen = {};
    seen[tx + ',' + ty] = true;
    var i = 0;
    while (i < queue.length && i < 800) {
        var cur = queue[i++];
        if (tileWalkable(grid, cur.tx, cur.ty)) {
            return { tx: cur.tx, ty: cur.ty };
        }
        for (var d = 0; d < dirs.length; d++) {
            var nx = cur.tx + dirs[d][0];
            var ny = cur.ty + dirs[d][1];
            var key = nx + ',' + ny;
            if (seen[key]) {
                continue;
            }
            if (ny < 0 || nx < 0 || ny >= grid.length || !grid[ny] || nx >= grid[ny].length) {
                continue;
            }
            seen[key] = true;
            queue.push({ tx: nx, ty: ny });
        }
    }
    return null;
}

function nearestGroundTile(grid, tx, ty) {
    return nearestWalkableTile(grid, tx, ty);
}

/** World center of the nearest ground tile to (wx, wy). Null if none found. */
function nearestGroundLootWorld(grid, wx, wy) {
    if (!grid || typeof worldToTile !== 'function') {
        return null;
    }
    var tile = worldToTile(wx, wy);
    var near = nearestGroundTile(grid, tile.tx, tile.ty);
    if (!near || typeof tileCenter !== 'function') {
        return null;
    }
    return tileCenter(near.tx, near.ty);
}

function findTilePath(grid, startTx, startTy, endTx, endTy, options) {
    options = options || {};
    var avoid = options.avoid || {};
    var allowEnd = options.allowEnd !== false;
    if (!grid || !grid.length || !grid[0]) {
        return null;
    }
    var height = grid.length;
    var width = grid[0].length;

    function inMap(tx, ty) {
        return tx >= 0 && ty >= 0 && tx < width && ty < height;
    }

    function passable(tx, ty, isEnd) {
        if (!inMap(tx, ty)) {
            return false;
        }
        /* Terrain (tree/rock/water/wall/…) always blocks, including the end tile. */
        if (!tileWalkable(grid, tx, ty)) {
            return false;
        }
        if (avoid[tx + ',' + ty]) {
            /* allowEnd only waives NPC/mob occupancy so talk/fight can finish on target. */
            return !!(isEnd && allowEnd);
        }
        return true;
    }

    if (!inMap(startTx, startTy) || !inMap(endTx, endTy)) {
        return null;
    }
    if (startTx === endTx && startTy === endTy) {
        return [{ tx: startTx, ty: startTy }];
    }

    var dirs = [
        [1, 0, 10], [-1, 0, 10], [0, 1, 10], [0, -1, 10],
        [1, 1, 14], [1, -1, 14], [-1, 1, 14], [-1, -1, 14]
    ];

    function heur(tx, ty) {
        var dx = Math.abs(tx - endTx);
        var dy = Math.abs(ty - endTy);
        return 10 * (dx + dy) + (14 - 20) * Math.min(dx, dy);
    }

    function reconstruct(tx, ty) {
        var path = [{ tx: tx, ty: ty }];
        var step = came[tx + ',' + ty];
        while (step) {
            path.push(step);
            step = came[step.tx + ',' + step.ty];
        }
        path.reverse();
        return path;
    }

    var open = [{ tx: startTx, ty: startTy, g: 0, f: heur(startTx, startTy) }];
    var bestG = {};
    bestG[startTx + ',' + startTy] = 0;
    var came = {};
    var closed = {};
    var guard = 0;
    var nearest = { tx: startTx, ty: startTy, h: heur(startTx, startTy) };
    var wantNearest = !!options.nearest;

    while (open.length && guard++ < 2500) {
        var best = 0;
        for (var i = 1; i < open.length; i++) {
            if (open[i].f < open[best].f) {
                best = i;
            }
        }
        var cur = open.splice(best, 1)[0];
        var ck = cur.tx + ',' + cur.ty;
        if (closed[ck]) {
            continue;
        }
        closed[ck] = true;
        var curH = heur(cur.tx, cur.ty);
        if (curH < nearest.h) {
            nearest = { tx: cur.tx, ty: cur.ty, h: curH };
        }
        if (cur.tx === endTx && cur.ty === endTy) {
            return reconstruct(endTx, endTy);
        }
        for (var d = 0; d < dirs.length; d++) {
            var nx = cur.tx + dirs[d][0];
            var ny = cur.ty + dirs[d][1];
            var isEnd = nx === endTx && ny === endTy;
            if (!passable(nx, ny, isEnd)) {
                continue;
            }
            if (dirs[d][0] !== 0 && dirs[d][1] !== 0) {
                if (!tileWalkable(grid, cur.tx + dirs[d][0], cur.ty)) {
                    continue;
                }
                if (!tileWalkable(grid, cur.tx, cur.ty + dirs[d][1])) {
                    continue;
                }
            }
            var nk = nx + ',' + ny;
            if (closed[nk]) {
                continue;
            }
            var g = cur.g + dirs[d][2];
            if (bestG[nk] !== undefined && g >= bestG[nk]) {
                continue;
            }
            bestG[nk] = g;
            came[nk] = { tx: cur.tx, ty: cur.ty };
            open.push({ tx: nx, ty: ny, g: g, f: g + heur(nx, ny) });
        }
    }
    if (wantNearest) {
        return reconstruct(nearest.tx, nearest.ty);
    }
    return null;
}

function isOneTileGapX(grid, tx, ty) {
    return tileWalkable(grid, tx, ty)
        && !tileWalkable(grid, tx, ty - 1)
        && !tileWalkable(grid, tx, ty + 1);
}

function isOneTileGapY(grid, tx, ty) {
    return tileWalkable(grid, tx, ty)
        && !tileWalkable(grid, tx - 1, ty)
        && !tileWalkable(grid, tx + 1, ty);
}

function isOneTileOpening(grid, tx, ty) {
    return isOneTileGapX(grid, tx, ty) || isOneTileGapY(grid, tx, ty);
}

function giantBlockedAt(grid, wx, wy, zoneId) {
    if (!grid) {
        return false;
    }
    var tiles = typeof giantFootprintTiles === 'function'
        ? giantFootprintTiles(wx, wy)
        : [worldToTile(wx, wy)];
    var i;
    for (i = 0; i < tiles.length; i++) {
        var tile = tiles[i];
        if (isOneTileOpening(grid, tile.tx, tile.ty)) {
            return true;
        }
        if (typeof interiorAtDoor === 'function' && interiorAtDoor(tile.tx, tile.ty, zoneId)) {
            return true;
        }
    }
    return false;
}

function overlapRange(a0, a1, b0, b1) {
    return Math.min(a1, b1) - Math.max(a0, b0);
}

function slideIntoOneTileGap(grid, x, y, bodyW, bodyH, vx, vy) {
    if (!grid || (!vx && !vy)) {
        return { x: x, y: y, vx: vx, vy: vy };
    }
    var size = typeof TILE_SIZE === 'number' ? TILE_SIZE : 16;
    var hw = bodyW / 2;
    var hh = bodyH / 2;
    var outX = x;
    var outY = y;
    var outVx = vx;
    var outVy = vy;

    if (vx !== 0) {
        var lookX = outX + (vx > 0 ? hw + 2 : -hw - 2);
        var tx = Math.floor(lookX / size);
        var bodyTop = outY - hh;
        var bodyBot = outY + hh;
        var ty0 = Math.floor(bodyTop / size) - 1;
        var ty1 = Math.floor((bodyBot - 0.001) / size) + 1;
        var bestTy = null;
        var bestOv = 0;
        var ty;
        for (ty = ty0; ty <= ty1; ty++) {
            if (!isOneTileGapX(grid, tx, ty)) {
                continue;
            }
            var gTop = ty * size;
            var ov = overlapRange(bodyTop, bodyBot, gTop, gTop + size);
            if (ov > bestOv) {
                bestOv = ov;
                bestTy = ty;
            }
        }
        if (bestTy !== null && bestOv > 0.5) {
            var gapTop = bestTy * size;
            var minY = gapTop + hh;
            var maxY = gapTop + size - hh;
            if (minY <= maxY) {
                if (outY < minY) {
                    outY = minY;
                } else if (outY > maxY) {
                    outY = maxY;
                }
                if (outVy < 0 && outY <= minY + 0.25) {
                    outVy = 0;
                } else if (outVy > 0 && outY >= maxY - 0.25) {
                    outVy = 0;
                }
            }
        }
    }

    if (vy !== 0) {
        var lookY = outY + (vy > 0 ? hh + 2 : -hh - 2);
        var lookTy = Math.floor(lookY / size);
        var bodyLeft = outX - hw;
        var bodyRight = outX + hw;
        var tx0 = Math.floor(bodyLeft / size) - 1;
        var tx1 = Math.floor((bodyRight - 0.001) / size) + 1;
        var bestTx = null;
        var bestOvX = 0;
        var txScan;
        for (txScan = tx0; txScan <= tx1; txScan++) {
            if (!isOneTileGapY(grid, txScan, lookTy)) {
                continue;
            }
            var gLeft = txScan * size;
            var ovx = overlapRange(bodyLeft, bodyRight, gLeft, gLeft + size);
            if (ovx > bestOvX) {
                bestOvX = ovx;
                bestTx = txScan;
            }
        }
        if (bestTx !== null && bestOvX > 0.5) {
            var gapLeft = bestTx * size;
            var minX = gapLeft + hw;
            var maxX = gapLeft + size - hw;
            if (minX <= maxX) {
                if (outX < minX) {
                    outX = minX;
                } else if (outX > maxX) {
                    outX = maxX;
                }
                if (outVx < 0 && outX <= minX + 0.25) {
                    outVx = 0;
                } else if (outVx > 0 && outX >= maxX - 0.25) {
                    outVx = 0;
                }
            }
        }
    }

    return { x: outX, y: outY, vx: outVx, vy: outVy };
}

function tilesToWorldPath(tiles, toWx, toWy) {
    if (!tiles || !tiles.length) {
        return [{ x: toWx, y: toWy }];
    }
    var points = [];
    var start = tiles.length === 1 ? 0 : 1;
    for (var i = start; i < tiles.length; i++) {
        var center = tileCenter(tiles[i].tx, tiles[i].ty);
        points.push({ x: center.x, y: center.y });
    }
    if (!points.length) {
        points.push({ x: toWx, y: toWy });
    } else {
        points[points.length - 1] = { x: toWx, y: toWy };
    }
    return points;
}
