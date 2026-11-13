/**
 * Node pack audit: Emberwood vs Blocklands (minecraft) completeness + distinctness.
 *   node tests/pack-content-node.js
 */
var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');
var EW = path.join(ROOT, 'GameWorld', 'emberwood');
var MC = path.join(ROOT, 'GameWorld', 'minecraft');
var fails = [];

function fail(msg) {
    fails.push(msg);
    console.error('FAIL:', msg);
}

function ok(msg) {
    console.log('OK:', msg);
}

function readJson(p) {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function exists(p) {
    return fs.existsSync(p);
}

function fileSha(p) {
    var crypto = require('crypto');
    return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

function main() {
    var catalog = readJson(path.join(ROOT, 'GameWorld', 'catalog.json'));
    var packs = (catalog.packs || []).map(function (p) { return p.id; });
    if (packs.indexOf('emberwood') < 0 || packs.indexOf('minecraft') < 0) {
        fail('catalog.json must list emberwood and minecraft');
    } else {
        ok('catalog lists emberwood + minecraft');
    }

    var packMeta = readJson(path.join(MC, 'pack.json'));
    var fileMap = packMeta.files || {};
    var required = Object.keys(fileMap).map(function (k) { return fileMap[k]; });
    if (!required.length) {
        fail('minecraft pack.json missing files map');
    }
    required.forEach(function (rel) {
        var p = path.join(MC, rel);
        if (!exists(p)) {
            fail('missing pack file ' + rel);
        }
    });
    ['assets/tiles.png', 'assets/player.png'].forEach(function (rel) {
        if (!exists(path.join(MC, rel))) {
            fail('missing asset ' + rel);
        }
    });
    if (!fails.some(function (f) { return f.indexOf('missing') === 0; })) {
        ok('all minecraft pack.files + core assets present (' + required.length + ')');
    }

    var ewZones = readJson(path.join(EW, 'zones.json')).list.map(function (z) { return z.id; }).sort();
    var mcZones = readJson(path.join(MC, 'zones.json')).list.map(function (z) { return z.id; }).sort();
    var sharedZones = ewZones.filter(function (id) { return mcZones.indexOf(id) >= 0; });
    if (sharedZones.length > 1 || (sharedZones.length === 1 && sharedZones[0] !== 'dungeon')) {
        fail('zone id overlap beyond dungeon: ' + sharedZones.join(','));
    } else {
        ok('zone ids distinct (shared: ' + (sharedZones.join(',') || 'none') + ')');
    }

    var ewSkills = (readJson(path.join(EW, 'skills.json')).SKILL_NAMES || []).map(function (row) {
        return row[0];
    });
    var mcSkills = (readJson(path.join(MC, 'skills.json')).SKILL_NAMES || []).map(function (row) {
        return row[0];
    });
    if (JSON.stringify(ewSkills) === JSON.stringify(mcSkills)) {
        fail('skill lists identical');
    } else {
        ok('skills differ (ew=' + ewSkills.length + ' mc=' + mcSkills.length + ')');
    }

    var ewBiome = fs.readFileSync(path.join(EW, 'biome-params.json'), 'utf8');
    var mcBiome = fs.readFileSync(path.join(MC, 'biome-params.json'), 'utf8');
    if (ewBiome === mcBiome) {
        fail('biome-params.json identical — maps will look the same');
    } else {
        ok('biome-params differ');
    }

    var ewSeeds = readJson(path.join(EW, 'zones.json')).list.map(function (z) { return z.seed; }).sort();
    var mcSeeds = readJson(path.join(MC, 'zones.json')).list.map(function (z) { return z.seed; }).sort();
    if (JSON.stringify(ewSeeds) === JSON.stringify(mcSeeds)) {
        fail('zone seeds identical');
    } else {
        ok('zone seeds differ');
    }

    var ewCenter = readJson(path.join(EW, 'map', 'props.json')).TOWN_CENTER_TILE;
    var mcCenter = readJson(path.join(MC, 'map', 'props.json')).TOWN_CENTER_TILE;
    if (ewCenter.x === mcCenter.x && ewCenter.y === mcCenter.y) {
        fail('TOWN_CENTER_TILE identical');
    } else {
        ok('town center differs ew=' + ewCenter.x + ',' + ewCenter.y + ' mc=' + mcCenter.x + ',' + mcCenter.y);
    }

    var tilesEw = path.join(EW, 'assets', 'tiles.png');
    var tilesMc = path.join(MC, 'assets', 'tiles.png');
    if (exists(tilesEw) && exists(tilesMc) && fileSha(tilesEw) === fileSha(tilesMc)) {
        console.log('NOTE: tiles.png still shared (same sheet) — density/seeds/layout must carry distinct look');
    }

    var quests = readJson(path.join(MC, 'quests.json'));
    var qKeys = Object.keys(quests).filter(function (k) {
        return k !== 'meta' && typeof quests[k] === 'object';
    });
    if (!qKeys.length) {
        fail('minecraft quests empty');
    } else {
        ok('minecraft has quests (' + qKeys.length + ')');
    }

    if (fails.length) {
        console.error('\n' + fails.length + ' failure(s)');
        process.exit(1);
    }
    console.log('\nPASS pack-content-node');
    process.exit(0);
}

main();
