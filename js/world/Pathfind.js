var PATH_LINE_COLOR = 0xaa66ff;

function tileBlockedByTerrain(index) {
    return index === TILE.WATER || index === TILE.TREE || index === TILE.ROCK || index === TILE.SHRINE;
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
        if (isEnd && allowEnd) {
            return true;
        }
        if (!tileWalkable(grid, tx, ty)) {
            return false;
        }
        if (avoid[tx + ',' + ty]) {
            return false;
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
