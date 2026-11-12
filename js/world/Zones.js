var ZONE_LIST = [
    { id: 'graves', name: 'Restless Graves', gx: -1, gy: -1, biome: 'grave', seed: 11 },
    { id: 'northwood', name: 'Northwood', gx: 0, gy: -1, biome: 'forest', seed: 22 },
    { id: 'highlands', name: 'Windrock Highlands', gx: 1, gy: -1, biome: 'hills', seed: 33 },
    { id: 'westmead', name: 'Westmead', gx: -1, gy: 0, biome: 'plains', seed: 44 },
    { id: 'haven', name: 'Emberhaven', gx: 0, gy: 0, biome: 'town', seed: 55 },
    { id: 'millfields', name: 'Millfields', gx: 1, gy: 0, biome: 'farm', seed: 66 },
    { id: 'darkmine', name: 'Darkmine', gx: -1, gy: 1, biome: 'mine', seed: 77 },
    { id: 'southshore', name: 'Southshore', gx: 0, gy: 1, biome: 'shore', seed: 88 },
    { id: 'mire', name: 'Mirefen', gx: 1, gy: 1, biome: 'swamp', seed: 99 },
    { id: 'dungeon', name: 'Deep Mine', gx: -99, gy: -99, biome: 'mine', seed: 9001, hidden: true },
    { id: 'dragonden', name: 'Dragon Den', gx: 99, gy: 99, biome: 'den', seed: 4242, hidden: true }
];

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
        gift = 'bronzepick';
    } else if (def.tutor === 'combat') {
        gift = 'bronzeaxe';
    } else if (def.tutor === 'cows') {
        gift = 'string';
    } else if (def.tutor === 'firemaking') {
        gift = 'tinderbox';
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

var NPC_DEFS = {
    haven: [
        { key: 'guild', name: 'Guildmaster Bram', x: 248, y: 280, tint: 0xffffff, questGiver: true, options: ['talk', 'quest'], examine: 'A scarred militia captain. He still drills the courtyard.', lines: ['Welcome to Emberhaven, adventurer.', 'Goblins from Northwood raid our stores.', 'Slay 5 goblins and return. The militia will pay.'] },
        { key: 'banker', name: 'Banker Elise', x: 232, y: 168, tint: 0xffffff, options: ['talk', 'bank'], examine: 'The town banker. She stands behind the courtyard counter.', lines: ['Your coin is safe with me.', 'Deposit what you cannot carry.', 'Step up to the counter when you need the vault.'] },
        { key: 'guard', name: 'Guard Rowan', x: 252, y: 168, tint: 0xffffff, options: ['talk'], examine: 'A watchful town guard. He knows every path from the gate.', lines: ['Keep to the paths.', 'North is woods. East is farms. South is the sea.'] },
        { key: 'shopkeep', name: 'Shopkeeper Mira', x: 264, y: 184, tint: 0xffffff, texture: 'npc-shopkeeper', options: ['talk', 'trade'], shopKey: 'mira', examine: 'The town shopkeeper. She minds the courtyard stall.', lines: ['Take a look at the wares.', 'Bones and spare food fetch a price.'] },
        { key: 'dummy', name: 'Training dummy', x: 280, y: 264, tint: 0xcccccc, texture: 'npc-guard', options: ['talk', 'duel'], examine: 'A straw-filled training dummy for duels.', lines: ['Up for a practice duel?', 'No loot, just honour.'] },
        { key: 'arms', name: 'Armsman Cole', x: 312, y: 200, tint: 0xffffff, texture: 'npc-guard', options: ['talk', 'trade'], shopKey: 'arms', examine: 'A weapons stall keeper. Oil stains his gloves.', lines: ['Blades, bows, and staves, if you have the coin.', 'Take a look at the wares.', 'A shortbow trains Ranged; a staff needs Air and Mind runes.'] },
        { key: 'cook', name: 'Cook Pell', x: 280, y: 280, tint: 0xffffff, options: ['talk'], tutor: 'firemaking', examine: 'The town cook. Flour dusts her sleeves and a ladle never leaves her hand.', lines: ['Take this tinderbox.', 'Use it on logs to light a fire on open ground.', 'Cook raw food on that fire or the town range.', 'Burnt food teaches nothing — keep cooking.'] },
        { key: 'priest', name: 'Priest Alden', x: 296, y: 168, tint: 0xffffff, options: ['talk'], examine: 'A quiet shrine priest. Ash marks the collar of his robe.', lines: ['The shrine still hears a prayer.', 'Bury the bones of the fallen, traveler.'] }
    ],
    northwood: [
        { key: 'ranger', name: 'Ranger Kett', x: 240, y: 200, tint: 0xffffff, options: ['talk'], tutor: 'combat', examine: 'A Northwood ranger. Goblin tracks stain her boots.', lines: ['Goblins nest in these trees.', 'Click a goblin to fight it, like the old days.', 'Wield a bow from Armsman Cole — leave ammo empty for infinite wooden arrows, or equip bronze arrows.', 'A wood staff plus Air and Mind runes casts Air Strike.', 'Shared splits XP; Strength, Ranger, or Mage train from your weapon.'] }
    ],
    millfields: [
        { key: 'farmer', name: 'Farmer Willa', x: 200, y: 180, tint: 0xffffff, options: ['talk'], tutor: 'cows', examine: 'A Millfields farmer. Cabbage stains her apron.', lines: ['Cows got into the cabbages again.', 'The mill road runs back to Emberhaven.', 'Click a cow when you need hide and beef.', 'They kick, so keep a combat style ready.'] }
    ],
    southshore: [
        { key: 'fisher', name: 'Fisher Ned', x: 220, y: 160, tint: 0xffffff, options: ['talk', 'quest'], questGiver: true, sideQuest: 'shipment', tutor: 'fishing', examine: 'An old shore fisher. Salt and rope have worn his hands.', lines: ['Crabs pinch harder than they look.', 'Ships used to stop here. Not anymore.', 'Click the fishing spots along the shore and cast a net.', 'You will need a small fishing net first.'] }
    ],
    westmead: [
        { key: 'wanderer', name: 'Wanderer Sila', x: 180, y: 190, tint: 0xffffff, options: ['talk'], examine: 'A plains wanderer. Her cloak is dusted with Westmead grass.', lines: ['Plains look empty until they are not.', 'Graves lie north-west. Do not linger.'] }
    ],
    graves: [
        { key: 'ghost', name: 'Wisp', x: 200, y: 170, tint: 0xffffff, options: ['talk'], examine: 'A restless grave-wisp. Cold light pools where a face should be.', lines: ['The dead remember steel.', 'Turn back unless you seek bones.'] }
    ],
    darkmine: [
        { key: 'miner', name: 'Miner Corb', x: 210, y: 200, tint: 0xffffff, options: ['talk', 'quest'], questGiver: true, sideQuest: 'bats', tutor: 'mining', examine: 'A Darkmine digger. He will not go down the Deep Mine.', lines: ['That shaft leads to the Deep Mine. Floor one starts at level 40 — each floor adds one.', 'Every twenty-first floor wakes a dragon. Escape marks the floor for next time.', 'Every fifth floor has a campfire. Ore still waits up here with a pickaxe.'] }
    ],
    highlands: [
        { key: 'hermit', name: 'Hermit Ola', x: 240, y: 160, tint: 0xffffff, options: ['talk'], examine: 'A windrock hermit. Drake-scale grit is stuck in her cloak.', lines: ['Drakes nest on the windrock.', 'Bring a stout shield.', 'East of here a boulder seals a deeper den — only a diamond pickaxe cracks it.'] }
    ],
    mire: [
        { key: 'witch', name: 'Fen Witch', x: 200, y: 180, tint: 0xffffff, options: ['talk'], examine: 'A fen healer. Marsh-light clings to her sleeves.', lines: ['The fen drinks the lost.', 'I can stitch wounds... for a price.'] }
    ]
};

/* Per-zone combat bands. Haven 1–3; progression climbs through Farm→High; Den dragons fixed Lv 60. */
var ZONE_LEVEL_BAND = {
    haven: [1, 3],
    millfields: [1, 5],
    mire: [6, 10],
    southshore: [11, 15],
    northwood: [16, 20],
    graves: [21, 25],
    westmead: [26, 30],
    darkmine: [31, 35],
    highlands: [36, 40],
    dragonden: [40, 45]
};

function zoneBandLevel(zoneId, index) {
    var band = ZONE_LEVEL_BAND[zoneId] || [1, 5];
    var lo = band[0];
    var hi = band[1];
    var span = Math.max(0, hi - lo);
    return lo + ((index | 0) % (span + 1));
}

/** Short mob-band line for UI (e.g. "Lv 6–10"). Deep Mine is special. */
function zoneMobBandLabel(zoneId) {
    var band;
    if (zoneId === 'dungeon') {
        return 'Lv 40+';
    }
    band = ZONE_LEVEL_BAND[zoneId];
    if (!band || band.length < 2) {
        return '';
    }
    return 'Lv ' + band[0] + '–' + band[1];
}

/** Two-line border cue: display name + band. */
function zoneBorderLabelText(zoneId) {
    var zone = ZONES[zoneId];
    var name = (zone && zone.name) || zoneId || '';
    var band = zoneMobBandLabel(zoneId);
    if (!name) {
        return '';
    }
    return band ? (name + '\n' + band) : name;
}

/** Enter chat with optional mob band: "You enter Northwood (mobs Lv 6–10)." */
function zoneEnterChat(zoneId) {
    var zone = ZONES[zoneId];
    var name = (zone && zone.name) || zoneId || 'the wilds';
    var band = zoneMobBandLabel(zoneId);
    if (zoneId === 'dungeon') {
        return 'You enter the Deep Mine (mobs Lv 40+, +1 per floor).';
    }
    if (zoneId === 'dragonden') {
        return 'You enter Dragon Den (mobs Lv 40–45; Dragons Lv 60).';
    }
    if (band) {
        return 'You enter ' + name + ' (mobs ' + band + ').';
    }
    return 'You enter ' + name + '.';
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
        level = zoneBandLevel(zoneId, i);
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

var MOB_DEFS = {
    /* Band 1–3 — Haven; pyramid → Chicken 10 @ 1×.
     * Chebyshev-safe courtyard (r≤5 from TOWN_CENTER); Lv1 ring just outside;
     * Lv3 at N/S/E/W exit approaches (still inside 2-tile edge inset). */
    haven: buildBandMobs('haven', 'Chicken', 'mob-chicken', [
        /* Lv1 ring (cheb 6–7 from center 18,15) — first 6 kept at 1× with 4 exits */
        [12, 15], [18, 9], [24, 15], [18, 21], [12, 11], [24, 19],
        /* Lv3 near zone exits */
        [18, 3], [18, 24], [3, 14], [33, 14],
        /* Extra Lv1 for 2× pool */
        [11, 13], [11, 17], [25, 13], [25, 17], [15, 9], [21, 9],
        [15, 21], [21, 21], [12, 12], [24, 18]
    ], {
        levelFor: function (i) {
            return (i >= 6 && i <= 9) ? 3 : 1;
        }
    }),
    /* Band 1–5 — Farm. */
    millfields: buildBandMobs('millfields', 'Cow', 'mob-cow', [
        [8, 12], [12, 8], [18, 7], [24, 9], [28, 12], [30, 16], [26, 18], [20, 20],
        [14, 19], [9, 16], [11, 11], [16, 14], [22, 11], [27, 8], [31, 14], [19, 16],
        [13, 17], [25, 15]
    ], { tints: [0xffffff, 0xffffff, 0xeeddcc] }),
    /* Band 6–10 — Mire. */
    mire: buildBandMobs('mire', 'Slime', 'mob-slime', [
        [9, 9], [13, 11], [17, 8], [21, 12], [25, 10], [29, 13], [31, 17], [27, 19],
        [23, 20], [19, 16], [15, 18], [11, 15]
    ], { tints: [0xffffff, 0x88ffaa, 0xffffff] }),
    /* Band 11–15 — Shore. */
    southshore: buildBandMobs('southshore', 'Crab', 'mob-crab', [
        [8, 14], [12, 12], [16, 10], [20, 11], [24, 9], [28, 12], [31, 15], [26, 17],
        [22, 19], [18, 16], [14, 18], [10, 17], [27, 14], [19, 14]
    ], { tints: [0xffffff, 0xffccaa, 0xffffff] }),
    /* Band 16–20 — Woods. */
    northwood: buildBandMobs('northwood', 'Goblin', 'mob-goblin', [
        [8, 8], [12, 10], [16, 7], [20, 9], [24, 8], [28, 11], [31, 14], [26, 16],
        [22, 18], [18, 20], [14, 17], [10, 19], [9, 13], [15, 14], [21, 13], [27, 19]
    ], { tints: [0xffffff, 0xffffff, 0xbbffbb, 0xffffff] }),
    /* Band 21–25 — Graves. */
    graves: buildBandMobs('graves', 'Skeleton', 'mob-skeleton', [
        [9, 9], [13, 12], [17, 8], [21, 11], [25, 9], [29, 13], [31, 16], [26, 19],
        [22, 20], [18, 17], [14, 15], [10, 18]
    ], { tints: [0xffffff, 0xffffff, 0xeeeeff] }),
    /* Band 26–30 — Mead. */
    westmead: buildBandMobs('westmead', 'Rabbit', 'mob-rabbit', [
        [10, 10], [14, 8], [18, 11], [22, 9], [26, 12], [30, 10], [28, 16], [24, 18],
        [20, 20], [16, 17], [12, 15], [8, 18], [11, 20], [15, 14], [19, 9], [23, 16],
        [27, 11], [29, 19]
    ], { tints: [0xffffff, 0xffffff, 0xeeddcc] }).concat(
        buildBandMobs('westmead', 'Goblin', 'mob-goblin', [
            [9, 13], [15, 12], [21, 14], [27, 13], [25, 20], [17, 8],
            [12, 19], [19, 16], [23, 10], [30, 17]
        ])
    ),
    /* Band 31–35 — Mine; Deep Mine shaft. */
    darkmine: buildBandMobs('darkmine', 'Bat', 'mob-bat', [
        [8, 8], [12, 11], [16, 9], [20, 12], [24, 10], [28, 13], [31, 16], [26, 18],
        [22, 20], [18, 17], [14, 19], [10, 15], [17, 14], [25, 15]
    ], { tints: [0xffffff, 0xffffff, 0xddbbff, 0xffffff] }),
    /* Band 36–40 — High. */
    highlands: buildBandMobs('highlands', 'Drake', 'mob-drake', [
        [10, 10], [16, 9], [22, 12], [28, 11], [30, 16], [24, 18], [18, 20], [12, 17],
        [20, 14], [26, 15]
    ]),
    /* Band 40–45 — Den; Dragons fixed at Lv 60; alwaysAgro kept. Pyramid base = 1. */
    dragonden: buildBandMobs('dragonden', 'Dragon', 'mob-drake', [
        [12, 10], [20, 12], [28, 14], [18, 18]
    ], {
        alwaysAgro: true,
        tints: [0xff6644, 0xff4422, 0xdd2200, 0xff5533],
        levelFor: function () {
            return 60;
        },
        attackRangeFor: function (i) {
            return i === 3 ? 120 : 110;
        }
    })
};

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
