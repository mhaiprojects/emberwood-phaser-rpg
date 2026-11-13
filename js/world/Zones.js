/* ZONE_LIST from js/content/zones-data.js */
if (typeof ZONE_LIST === 'undefined') { var ZONE_LIST = []; }
var ZONES = {};
ZONE_LIST.forEach(function (zone) {
    ZONES[zone.id] = zone;
});

var DUNGEON_SURFACE_ZONE = 'darkmine';

var INTERIOR_LIST = [
    {
        id: 'shaft',
        name: 'Deep Mine',
        doorTx: MINE_SHAFT_HOUSE.x + Math.floor(MINE_SHAFT_HOUSE.w / 2),
        doorTy: MINE_SHAFT_HOUSE.y + MINE_SHAFT_HOUSE.h - 1,
        zoneId: 'darkmine',
        stairs: 'down',
        dungeon: true,
        enterChat: 'You delve into the Deep Mine…'
    }
];

function interiorById(id) {
    for (var i = 0; i < INTERIOR_LIST.length; i++) {
        if (INTERIOR_LIST[i].id === id) {
            return INTERIOR_LIST[i];
        }
    }
    return null;
}

function interiorAtDoor(tx, ty, zoneId) {
    for (var i = 0; i < INTERIOR_LIST.length; i++) {
        var spec = INTERIOR_LIST[i];
        if (spec.doorTx !== tx || spec.doorTy !== ty) {
            continue;
        }
        if (zoneId && spec.zoneId && spec.zoneId !== zoneId) {
            continue;
        }
        return spec;
    }
    return null;
}

function zoneByGrid(gx, gy) {
    for (var i = 0; i < ZONE_LIST.length; i++) {
        if (ZONE_LIST[i].gx === gx && ZONE_LIST[i].gy === gy) {
            return ZONE_LIST[i];
        }
    }
    return null;
}

function zoneNeighbors(zone) {
    return {
        n: !!zoneByGrid(zone.gx, zone.gy - 1),
        s: !!zoneByGrid(zone.gx, zone.gy + 1),
        e: !!zoneByGrid(zone.gx + 1, zone.gy),
        w: !!zoneByGrid(zone.gx - 1, zone.gy)
    };
}

function neighborId(zone, dir) {
    var dx = { n: 0, s: 0, e: 1, w: -1 }[dir];
    var dy = { n: -1, s: 1, e: 0, w: 0 }[dir];
    var next = zoneByGrid(zone.gx + dx, zone.gy + dy);
    return next ? next.id : null;
}

function zoneDanger(zoneId) {
    var defs = MOB_DEFS[zoneId] || [];
    var seen = {};
    var types = [];
    for (var i = 0; i < defs.length; i++) {
        var type = defs[i] && defs[i].type;
        if (!type || seen[type]) {
            continue;
        }
        seen[type] = true;
        types.push(type);
    }
    return types.length ? types.join(', ') : 'None';
}

var DIALOGUE_OPTION_LABELS = {
    talk: 'Talk',
    trade: 'Trade',
    bank: 'Bank',
    quest: 'Quest'
};

function npcDialogueOptions(def) {
    var raw = def && def.options && def.options.length ? def.options : ['talk'];
    var seen = {};
    var out = [];
    for (var i = 0; i < raw.length; i++) {
        var id = raw[i];
        if (!DIALOGUE_OPTION_LABELS[id] || seen[id]) {
            continue;
        }
        seen[id] = true;
        out.push({ id: id, label: DIALOGUE_OPTION_LABELS[id] });
    }
    return out;
}

function examineNpcText(def) {
    if (!def) {
        return '';
    }
    if (def.examine) {
        return def.examine;
    }
    return def.name ? "It's " + def.name + '.' : '';
}

function applyNpcTutor(hero, def) {
    var gift;
    if (!hero || !def || !def.tutor) {
        return false;
    }
    hero.tutors = hero.tutors || {};
    if (hero.tutors[def.tutor]) {
        return false;
    }
    hero.tutors[def.tutor] = true;
    gift = null;
    if (def.tutor === 'fishing') {
        gift = 'net';
    } else if (def.tutor === 'mining') {
        gift = 'copperpick';
    } else if (def.tutor === 'combat') {
        gift = 'copperaxe';
    } else if (def.tutor === 'cows') {
        gift = 'string';
    } else if (def.tutor === 'firemaking') {
        gift = 'tinderbox';
    } else if (def.tutor === 'herblore') {
        gift = 'guam';
    }
    if (gift && typeof addItem === 'function' && typeof itemQty === 'function' && itemQty(hero, gift) < 1) {
        addItem(hero, gift, gift === 'string' ? 3 : 1);
    }
    return true;
}

var QUEST_HEAD_BANG = 0xffdd33;
var QUEST_HEAD_QUEST_GREY = 0x9a9a9a;
var QUEST_HEAD_QUEST_GREEN = 0x33cc55;
/* Legacy aliases kept for older tests / call sites. */
var QUEST_HEAD_STAR = QUEST_HEAD_BANG;
var QUEST_HEAD_COMPASS = QUEST_HEAD_QUEST_GREY;

function questHeadIconFor(def, quest, hero) {
    var stage;
    var side;
    if (!def || !def.questGiver) {
        return null;
    }
    if (def.sideQuest && hero && hero.sideQuests && hero.sideQuests[def.sideQuest]) {
        side = hero.sideQuests[def.sideQuest];
        stage = side.stage != null ? side.stage : 0;
    } else {
        stage = quest && quest.stage != null ? quest.stage : 0;
    }
    if (stage >= 3) {
        return null;
    }
    if (stage <= 0) {
        return { kind: 'bang', color: QUEST_HEAD_BANG };
    }
    if (stage === 2) {
        return { kind: 'quest', color: QUEST_HEAD_QUEST_GREEN };
    }
    return { kind: 'quest', color: QUEST_HEAD_QUEST_GREY };
}

/**
 * True when the NPC opens a shop (Trade). Used for nameplate shop icon prefix.
 */
function npcHasShop(def) {
    if (!def) {
        return false;
    }
    if (def.shopKey) {
        return true;
    }
    return !!(def.options && def.options.indexOf('trade') !== -1);
}

/* NPC_DEFS from js/content/npcs-data.js */
if (typeof NPC_DEFS === 'undefined') { var NPC_DEFS = {}; }
;

/*
 * Single source of truth: zone ↔ level band ↔ mob spawn roster.
 * Labels (border / enter / shaft) and MOB_DEFS both derive from this.
 * `band` drives zoneBandLevel; extras.levelFor may pin specific spots (haven exits, den).
 */
/* ZONE_MOB_ROSTER from zone-mobs-data.js + data-rule adapters */
function buildZoneMobRoster(data) {
    var out = {};
    var zoneId;
    var entry;
    var mi;
    var mob;
    var extras;
    var copy;
    var levels;
    var ranges;
    if (!data) {
        return out;
    }
    for (zoneId in data) {
        if (!Object.prototype.hasOwnProperty.call(data, zoneId)) {
            continue;
        }
        entry = data[zoneId];
        copy = {
            band: (entry.band || [1, 5]).slice(),
            mobs: []
        };
        (entry.mobs || []).forEach(function (mob) {
            extras = mob.extras ? Object.assign({}, mob.extras) : {};
            levels = extras.spotLevels;
            ranges = extras.attackRangeBySpot;
            if (levels && levels.length) {
                extras.levelFor = function (idx) {
                    if (idx >= 0 && idx < levels.length) {
                        return levels[idx];
                    }
                    return levels[levels.length - 1];
                };
                delete extras.spotLevels;
            }
            if (ranges && ranges.length) {
                extras.attackRangeFor = function (idx) {
                    if (idx >= 0 && idx < ranges.length) {
                        return ranges[idx];
                    }
                    return ranges[ranges.length - 1];
                };
                delete extras.attackRangeBySpot;
            }
            copy.mobs.push({
                type: mob.type,
                texture: mob.texture,
                spots: (mob.spots || []).map(function (s) { return s.slice(); }),
                extras: extras
            });
        });
        out[zoneId] = copy;
    }
    return out;
}
var ZONE_MOB_ROSTER = buildZoneMobRoster(
    typeof ZONE_MOB_ROSTER_DATA !== 'undefined' ? ZONE_MOB_ROSTER_DATA : {}
);


/** Derived from ZONE_MOB_ROSTER.band — keep for older call sites / docs. */
var ZONE_LEVEL_BAND = {};
(function initZoneLevelBand() {
    var id;
    for (id in ZONE_MOB_ROSTER) {
        if (!Object.prototype.hasOwnProperty.call(ZONE_MOB_ROSTER, id)) {
            continue;
        }
        ZONE_LEVEL_BAND[id] = ZONE_MOB_ROSTER[id].band.slice();
    }
}());

/** Level for spawn index — cycles lo..hi (legacy). Prefer zoneBandLevelSpread for pools. */
function zoneBandLevel(zoneId, index) {
    var band = ZONE_LEVEL_BAND[zoneId] || [1, 5];
    var lo = band[0];
    var hi = band[1];
    var span = Math.max(0, hi - lo);
    return lo + ((index | 0) % (span + 1));
}

/** Spread levels evenly across band endpoints so labels match the full roster band. */
function zoneBandLevelSpread(zoneId, index, count) {
    var band = ZONE_LEVEL_BAND[zoneId] || [1, 5];
    var lo = band[0];
    var hi = band[1];
    var span = Math.max(0, hi - lo);
    var n = Math.max(1, count | 0);
    var i = index | 0;
    if (n <= 1 || span <= 0) {
        return lo;
    }
    return lo + Math.round(i * span / (n - 1));
}

function mobTypeLabelPlural(type) {
    if (!type) {
        return '';
    }
    if (type.charAt(type.length - 1) === 's') {
        return type;
    }
    return type + 's';
}

/** Distinct mob types for a zone, roster order (falls back to MOB_DEFS). */
function zoneMobTypeList(zoneId) {
    var roster = ZONE_MOB_ROSTER[zoneId];
    var types = [];
    var seen = {};
    var i;
    var t;
    var defs;
    if (roster && roster.mobs && roster.mobs.length) {
        for (i = 0; i < roster.mobs.length; i++) {
            t = roster.mobs[i] && roster.mobs[i].type;
            if (!t || seen[t]) {
                continue;
            }
            seen[t] = true;
            types.push(t);
        }
        return types;
    }
    defs = typeof MOB_DEFS !== 'undefined' ? (MOB_DEFS[zoneId] || []) : [];
    for (i = 0; i < defs.length; i++) {
        t = defs[i] && defs[i].type;
        if (!t || seen[t]) {
            continue;
        }
        seen[t] = true;
        types.push(t);
    }
    return types;
}

/** Actual min/max spawn levels in MOB_DEFS (after levelFor); else roster band. */
function zoneSpawnLevelRange(zoneId) {
    var defs = typeof MOB_DEFS !== 'undefined' ? (MOB_DEFS[zoneId] || []) : [];
    var lo = Infinity;
    var hi = -Infinity;
    var i;
    var lv;
    var band;
    for (i = 0; i < defs.length; i++) {
        lv = defs[i] && (defs[i].level | 0);
        if (!lv) {
            continue;
        }
        if (lv < lo) {
            lo = lv;
        }
        if (lv > hi) {
            hi = lv;
        }
    }
    if (isFinite(lo) && isFinite(hi)) {
        return [lo, hi];
    }
    band = ZONE_LEVEL_BAND[zoneId];
    if (band && band.length >= 2) {
        return [band[0], band[1]];
    }
    return null;
}

function formatZoneMobBand(lo, hi) {
    if (lo == null || lo === '') {
        return '';
    }
    if (hi == null || hi === lo) {
        return 'Lv ' + lo;
    }
    return 'Lv ' + lo + '–' + hi;
}

/** Short mob-band line for UI (e.g. "Lv 16–20"). Deep Mine uses Scales base. */
function zoneMobBandLabel(zoneId) {
    var range;
    var base;
    if (zoneId === 'dungeon') {
        base = typeof DUNGEON_MOB_BASE_LEVEL === 'number' ? DUNGEON_MOB_BASE_LEVEL : 40;
        return 'Lv ' + base + '+';
    }
    range = zoneSpawnLevelRange(zoneId);
    if (!range) {
        return '';
    }
    return formatZoneMobBand(range[0], range[1]);
}

/** "Goblins Lv 16–20" / "Rabbits & Goblins Lv 26–30" / "Dragons Lv 60". */
function zoneMobSummaryLabel(zoneId) {
    var types = zoneMobTypeList(zoneId);
    var band = zoneMobBandLabel(zoneId);
    var names = [];
    var i;
    for (i = 0; i < types.length; i++) {
        names.push(mobTypeLabelPlural(types[i]));
    }
    if (names.length && band) {
        return names.join(' & ') + ' ' + band;
    }
    return band || names.join(' & ') || '';
}

/** Two-line border cue: display name + mob summary. */
function zoneBorderLabelText(zoneId) {
    var zone = ZONES[zoneId];
    var name = (zone && zone.name) || zoneId || '';
    var summary = zoneMobSummaryLabel(zoneId);
    if (!name) {
        return '';
    }
    return summary ? (name + '\n' + summary) : name;
}

/** Enter chat: "You enter Northwood (Goblins Lv 16–20)." */
function zoneEnterChat(zoneId) {
    var zone = ZONES[zoneId];
    var name = (zone && zone.name) || zoneId || 'the wilds';
    var summary = zoneMobSummaryLabel(zoneId);
    if (zoneId === 'dungeon') {
        return 'You enter the Deep Mine (mobs ' + zoneMobBandLabel('dungeon') + ', +1 per floor).';
    }
    if (summary) {
        return 'You enter ' + name + ' (' + summary + ').';
    }
    return 'You enter ' + name + '.';
}

/** Shaft / den marker label + approach — MapGen colors stay local; text from roster. */
function zoneShaftMarkerOverlay(kind) {
    var summary;
    if (kind === 'dungeon-enter') {
        return {
            label: 'Deep Mine\n' + zoneMobBandLabel('dungeon'),
            approach: 'A marked shaft mouth — the Deep Mine (mobs ' + zoneMobBandLabel('dungeon') +
                ', +1 per floor). Click or step in to delve.'
        };
    }
    if (kind === 'den-boulder') {
        summary = zoneMobSummaryLabel('dragonden');
        return {
            label: 'Sealed Den\n' + summary,
            approach: 'A sealing boulder — mine it with a diamond pickaxe to open the Dragon Den (' +
                summary + ').'
        };
    }
    if (kind === 'dragon-den') {
        summary = zoneMobSummaryLabel('dragonden');
        return {
            label: zoneBorderLabelText('dragonden'),
            approach: 'Scorched cave mouth — Dragon Den (' + summary + '). Click or step in to enter.'
        };
    }
    if (kind === 'dragon-den-exit') {
        summary = zoneMobSummaryLabel('highlands');
        return {
            label: zoneBorderLabelText('highlands'),
            approach: 'Tunnel back to Windrock Highlands (' + summary +
                ') — click or step on it to leave.'
        };
    }
    return null;
}

/** World-pixel center for a faint label just inside a map-edge exit. */
function zoneExitLabelPos(dir) {
    var midx = Math.floor(MAP_W / 2);
    var midy = Math.floor(MAP_H / 2);
    if (dir === 'n') {
        return tileCenter(midx, 1);
    }
    if (dir === 's') {
        return tileCenter(midx, MAP_H - 2);
    }
    if (dir === 'w') {
        return tileCenter(1, midy);
    }
    if (dir === 'e') {
        return tileCenter(MAP_W - 2, midy);
    }
    return tileCenter(midx, midy);
}

function mobStatsFor(type, level) {
    var lv = Math.max(1, level | 0);
    if (type === 'Chicken') {
        return { hp: 10 + lv * 2, damage: 2 + Math.ceil(lv / 2), gold: 1, xp: 3 + lv };
    }
    if (type === 'Rabbit') {
        return { hp: 8 + lv * 2, damage: 1 + Math.ceil(lv / 2), gold: 1, xp: 4 + lv };
    }
    if (type === 'Cow') {
        return { hp: 16 + lv * 2, damage: 3 + Math.ceil(lv / 2), gold: 2 + Math.floor(lv / 3), xp: 5 + lv };
    }
    if (type === 'Crab') {
        return { hp: 14 + lv * 2, damage: 4 + Math.floor(lv / 2), gold: 3 + Math.floor(lv / 4), xp: 4 + lv };
    }
    if (type === 'Bat') {
        return { hp: 10 + lv * 2, damage: 4 + Math.floor(lv / 2), gold: 3 + Math.floor(lv / 4), xp: 4 + lv };
    }
    if (type === 'Goblin') {
        return { hp: 14 + lv * 2, damage: 4 + Math.floor(lv / 2), gold: 3 + Math.floor(lv / 3), xp: 5 + lv };
    }
    if (type === 'Slime') {
        return { hp: 12 + lv * 2, damage: 4 + Math.floor(lv / 2), gold: 3 + Math.floor(lv / 4), xp: 4 + lv };
    }
    if (type === 'Skeleton') {
        return { hp: 16 + lv * 2, damage: 5 + Math.floor(lv / 2), gold: 5 + Math.floor(lv / 3), xp: 6 + lv };
    }
    if (type === 'Drake') {
        return { hp: 20 + lv, damage: 6 + Math.floor(lv / 3), gold: 10 + Math.floor(lv / 2), xp: 12 + Math.floor(lv / 2) };
    }
    if (type === 'Dragon') {
        return { hp: 40 + lv * 2, damage: 10 + Math.floor(lv / 3), gold: 40 + lv, xp: 50 + lv };
    }
    return { hp: 12 + lv, damage: 3 + Math.floor(lv / 2), gold: 2, xp: 4 + lv };
}

/*
 * Combat-tier spawn pyramid (highest → lowest).
 * Base count per type = 1 + stepsBelowDragon (Dragon=1, Drake=2, … Chicken=10).
 * Final overworld count ≈ max(1, round(pyramidBase * mobSpawnModifier)).
 */
var MOB_TIER_ORDER = [
    'Dragon', 'Drake', 'Skeleton', 'Slime', 'Goblin',
    'Bat', 'Crab', 'Cow', 'Rabbit', 'Chicken'
];
/** Default global multiplier; hero.mobSpawnModifier overrides when set. */
var MOB_SPAWN_MODIFIER = 1.0;
var MOB_SPAWN_MODIFIER_OPTIONS = [0.5, 1, 1.5, 2];
/** Pool capacity for Settings max (2×) so runtime can slice without regenerating tiles. */
var MOB_SPAWN_POOL_MODIFIER = 2;

function pyramidBaseCount(type) {
    var idx = MOB_TIER_ORDER.indexOf(type);
    if (idx < 0) {
        idx = MOB_TIER_ORDER.length - 1;
    }
    return 1 + idx;
}

function mobSpawnModifierValue(hero) {
    var v = hero && typeof hero.mobSpawnModifier === 'number'
        ? hero.mobSpawnModifier
        : MOB_SPAWN_MODIFIER;
    if (!(v > 0)) {
        v = MOB_SPAWN_MODIFIER;
    }
    return v;
}

function scaledMobSpawnCount(type, modifier) {
    var base = pyramidBaseCount(type);
    var mod = typeof modifier === 'number' && modifier > 0 ? modifier : MOB_SPAWN_MODIFIER;
    if (base < 1) {
        return 0;
    }
    return Math.max(1, Math.round(base * mod));
}

/** Fill short hand-authored pools with deterministic inset tiles (tx 2..33, ty 2..25). */
function expandMobSpotPool(pool, need, zoneId) {
    var out = (pool && pool.length) ? pool.slice() : [];
    var margin = typeof MOB_EDGE_MARGIN_TILES === 'number' ? MOB_EDGE_MARGIN_TILES : 2;
    var mw = typeof MAP_W === 'number' ? MAP_W : 36;
    var mh = typeof MAP_H === 'number' ? MAP_H : 28;
    var innerW = Math.max(1, mw - margin * 2);
    var innerH = Math.max(1, mh - margin * 2);
    var i;
    var tx;
    var ty;
    var key;
    var seen = {};
    for (i = 0; i < out.length; i++) {
        seen[out[i][0] + ',' + out[i][1]] = true;
    }
    i = 0;
    while (out.length < need && i < need * 80) {
        tx = margin + ((i * 7 + 3) % innerW);
        ty = margin + ((i * 11 + 5) % innerH);
        key = tx + ',' + ty;
        i += 1;
        if (seen[key]) {
            continue;
        }
        if (typeof mobForbiddenTile === 'function' && mobForbiddenTile(tx, ty, zoneId)) {
            continue;
        }
        seen[key] = true;
        out.push([tx, ty]);
    }
    return out.slice(0, need);
}

/* Spread spawn tiles inside the 2-tile mob edge inset (tx 2..33, ty 2..25).
 * Builds a pool sized for MOB_SPAWN_POOL_MODIFIER; runtime slices via mobDefsForZone. */
function buildBandMobs(zoneId, type, texture, spots, extras) {
    var out = [];
    var i;
    var level;
    var stats;
    var center;
    var def;
    var tintCycle = (extras && extras.tints) || [0xffffff];
    var poolNeed = scaledMobSpawnCount(type, MOB_SPAWN_POOL_MODIFIER);
    var useSpots = expandMobSpotPool(spots || [], poolNeed, zoneId);
    for (i = 0; i < useSpots.length; i++) {
        level = zoneBandLevelSpread(zoneId, i, useSpots.length);
        if (extras && typeof extras.levelFor === 'function') {
            level = extras.levelFor(i, level, useSpots[i]);
        }
        stats = mobStatsFor(type, level);
        center = tileCenter(useSpots[i][0], useSpots[i][1]);
        def = {
            type: type,
            texture: texture,
            tint: tintCycle[i % tintCycle.length],
            level: level,
            hp: stats.hp,
            damage: stats.damage,
            gold: stats.gold,
            xp: stats.xp,
            x: center.x,
            y: center.y
        };
        if (extras) {
            if (extras.alwaysAgro) {
                def.alwaysAgro = true;
            }
            if (typeof extras.attackRange === 'number') {
                def.attackRange = extras.attackRange;
            }
            if (typeof extras.attackRangeFor === 'function') {
                def.attackRange = extras.attackRangeFor(i, level);
            }
        }
        out.push(def);
    }
    return out;
}

/**
 * Overworld defs for a zone after applying the global spawn modifier.
 * Counts are per mob type (not a shared zone total): max(1, round(pyramidBase * mod)).
 */
function mobDefsForZone(zoneId, hero) {
    var all = MOB_DEFS[zoneId] || [];
    var mod = mobSpawnModifierValue(hero);
    var byType = {};
    var order = [];
    var out = [];
    var i;
    var def;
    var type;
    var keep;
    var list;
    for (i = 0; i < all.length; i++) {
        def = all[i];
        type = def && def.type;
        if (!type) {
            continue;
        }
        if (!byType[type]) {
            byType[type] = [];
            order.push(type);
        }
        byType[type].push(def);
    }
    for (i = 0; i < order.length; i++) {
        type = order[i];
        keep = scaledMobSpawnCount(type, mod);
        list = byType[type];
        out = out.concat(list.slice(0, Math.min(keep, list.length)));
    }
    return out;
}

/** Built from ZONE_MOB_ROSTER — do not hand-author parallel spawn tables. */
var MOB_DEFS = {};
(function buildMobDefsFromRoster() {
    var zoneId;
    var roster;
    var defs;
    var i;
    var mob;
    for (zoneId in ZONE_MOB_ROSTER) {
        if (!Object.prototype.hasOwnProperty.call(ZONE_MOB_ROSTER, zoneId)) {
            continue;
        }
        roster = ZONE_MOB_ROSTER[zoneId];
        defs = [];
        if (!roster || !roster.mobs) {
            MOB_DEFS[zoneId] = defs;
            continue;
        }
        for (i = 0; i < roster.mobs.length; i++) {
            mob = roster.mobs[i];
            if (!mob || !mob.type) {
                continue;
            }
            defs = defs.concat(buildBandMobs(
                zoneId,
                mob.type,
                mob.texture,
                mob.spots,
                mob.extras
            ));
        }
        MOB_DEFS[zoneId] = defs;
    }
}());

function defaultWorldSpawn() {
    return tileCenter(20, 15);
}

function spawnPointForEntry(dir) {
    var cx = (MAP_W / 2) * 16;
    var cy = (MAP_H / 2) * 16;
    if (dir === 'n') {
        return { x: cx, y: (MAP_H - 3) * 16 };
    }
    if (dir === 's') {
        return { x: cx, y: 3 * 16 };
    }
    if (dir === 'w') {
        return { x: (MAP_W - 3) * 16, y: cy };
    }
    if (dir === 'e') {
        return { x: 3 * 16, y: cy };
    }
    return defaultWorldSpawn();
}
