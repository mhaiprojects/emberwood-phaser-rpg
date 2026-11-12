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

var NPC_DEFS = {
    /* Haven — world px (tile*16+8). Keep ≥4 tiles apart in the courtyard. */
    haven: [
        /* Near guild post / south yard */
        { key: 'guild', name: 'Guildmaster Bram', x: 168, y: 296, tint: 0xffffff, questGiver: true, options: ['talk', 'quest'], examine: 'A scarred militia captain. He still drills the courtyard.', lines: ['Welcome to Emberhaven, adventurer.', 'Goblins from Northwood raid our stores.', 'Slay 5 goblins and return. The militia will pay.'] },
        /* Bank staff row (must stay behind counter) */
        { key: 'banker', name: 'Banker Elise', x: 232, y: 168, tint: 0xffffff, options: ['talk', 'bank'], examine: 'The town banker. She stands behind the courtyard counter.', lines: ['Your coin is safe with me.', 'Deposit what you cannot carry.', 'Step up to the counter when you need the vault.'] },
        /* East path toward Millfields */
        { key: 'guard', name: 'Guard Rowan', x: 424, y: 248, tint: 0xffffff, options: ['talk'], examine: 'A watchful town guard. He knows every path from the gate.', lines: ['Keep to the paths.', 'North is woods. East is farms. South is the sea.'] },
        /* South of shop stall */
        { key: 'shopkeep', name: 'Shopkeeper Mira', x: 264, y: 216, tint: 0xffffff, texture: 'npc-shopkeeper', options: ['talk', 'trade'], shopKey: 'mira', examine: 'The town shopkeeper. She minds the courtyard stall.', lines: ['Take a look at the wares.', 'Bones and spare food fetch a price.'] },
        /* SE training pad */
        { key: 'dummy', name: 'Training dummy', x: 360, y: 296, tint: 0xffffff, texture: 'npc-dummy', options: ['talk', 'duel'], examine: 'A straw-filled training dummy for duels.', lines: ['Up for a practice duel?', 'No loot, just honour.'] },
        /* By GE / arms stall */
        { key: 'arms', name: 'Armsman Cole', x: 328, y: 200, tint: 0xffffff, texture: 'npc-arms', options: ['talk', 'trade'], shopKey: 'arms', examine: 'A weapons stall keeper. Oil stains his gloves.', lines: ['Blades, bows, and staves, if you have the coin.', 'Take a look at the wares.', 'A copper bow trains Ranged; a staff needs Air runes for Air Strike.'] },
        /* South of courtyard house / near range approach */
        { key: 'cook', name: 'Cook Pell', x: 296, y: 328, tint: 0xffffff, options: ['talk'], tutor: 'firemaking', examine: 'The town cook. Flour dusts her sleeves and a ladle never leaves her hand.', lines: ['Take this tinderbox.', 'Use it on logs to light a fire on open ground.', 'Cook raw food on that fire or the town range.', 'If you burn a meal it is ruined — nothing left to keep.'] },
        /* West courtyard */
        { key: 'herbalist', name: 'Herbalist Ivy', x: 168, y: 216, tint: 0xffffff, options: ['talk'], tutor: 'herblore', examine: 'Emberhaven\'s herbalist. Bundles of guam hang by her stall.', lines: ['Guam grows easily if you have a seed.', 'Mix a leaf into an attack potion here.', 'Bring guam and I will show you the craft.'] },
        /* North courtyard between houses */
        { key: 'priest', name: 'Priest Alden', x: 296, y: 152, tint: 0xffffff, options: ['talk'], examine: 'A quiet shrine priest. Ash marks the collar of his robe.', lines: ['The shrine still hears a prayer.', 'Bury the bones of the fallen, traveler.'] }
    ],
    northwood: [
        { key: 'ranger', name: 'Ranger Kett', x: 240, y: 200, tint: 0xffffff, options: ['talk'], tutor: 'combat', examine: 'A Northwood ranger. Goblin tracks stain her boots.', lines: ['Goblins nest in these trees.', 'Click a goblin to fight it, like the old days.', 'Wield a bow from Armsman Cole — leave ammo empty for infinite wooden arrows, or equip copper arrows.', 'A wood staff plus an Air rune casts Air Strike.', 'Shared splits XP; Strength, Ranger, or Mage train from your weapon.'] }
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

/*
 * Single source of truth: zone ↔ level band ↔ mob spawn roster.
 * Labels (border / enter / shaft) and MOB_DEFS both derive from this.
 * `band` drives zoneBandLevel; extras.levelFor may pin specific spots (haven exits, den).
 */
var ZONE_MOB_ROSTER = {
    /* Haven — Chickens; Lv1 ring + Lv3 exit approaches. */
    haven: {
        band: [1, 3],
        mobs: [{
            type: 'Chicken',
            texture: 'mob-chicken',
            spots: [
                /* Lv1 ring (cheb 6–7 from center 18,15) — first 6 kept at 1× with 4 exits */
                [12, 15], [18, 9], [24, 15], [18, 21], [12, 11], [24, 19],
                /* Lv3 near zone exits */
                [18, 3], [18, 24], [3, 14], [33, 14],
                /* Extra Lv1 for 2× pool */
                [11, 13], [11, 17], [25, 13], [25, 17], [15, 9], [21, 9],
                [15, 21], [21, 21], [12, 12], [24, 18]
            ],
            extras: {
                levelFor: function (i) {
                    return (i >= 6 && i <= 9) ? 3 : 1;
                }
            }
        }]
    },
    millfields: {
        band: [1, 5],
        mobs: [{
            type: 'Cow',
            texture: 'mob-cow',
            spots: [
                [8, 12], [12, 8], [18, 7], [24, 9], [28, 12], [30, 16], [26, 18], [20, 20],
                [14, 19], [9, 16], [11, 11], [16, 14], [22, 11], [27, 8], [31, 14], [19, 16],
                [13, 17], [25, 15]
            ],
            extras: { tints: [0xffffff, 0xffffff, 0xeeddcc] }
        }]
    },
    mire: {
        band: [6, 10],
        mobs: [{
            type: 'Slime',
            texture: 'mob-slime',
            spots: [
                [9, 9], [13, 11], [17, 8], [21, 12], [25, 10], [29, 13], [31, 17], [27, 19],
                [23, 20], [19, 16], [15, 18], [11, 15]
            ],
            extras: { tints: [0xffffff, 0x88ffaa, 0xffffff] }
        }]
    },
    southshore: {
        band: [11, 15],
        mobs: [{
            type: 'Crab',
            texture: 'mob-crab',
            spots: [
                [8, 14], [12, 12], [16, 10], [20, 11], [24, 9], [28, 12], [31, 15], [26, 17],
                [22, 19], [18, 16], [14, 18], [10, 17], [27, 14], [19, 14]
            ],
            extras: { tints: [0xffffff, 0xffccaa, 0xffffff] }
        }]
    },
    northwood: {
        band: [16, 20],
        mobs: [{
            type: 'Goblin',
            texture: 'mob-goblin',
            spots: [
                [8, 8], [12, 10], [16, 7], [20, 9], [24, 8], [28, 11], [31, 14], [26, 16],
                [22, 18], [18, 20], [14, 17], [10, 19], [9, 13], [15, 14], [21, 13], [27, 19]
            ],
            extras: { tints: [0xffffff, 0xffffff, 0xbbffbb, 0xffffff] }
        }]
    },
    graves: {
        band: [21, 25],
        mobs: [{
            type: 'Skeleton',
            texture: 'mob-skeleton',
            spots: [
                [9, 9], [13, 12], [17, 8], [21, 11], [25, 9], [29, 13], [31, 16], [26, 19],
                [22, 20], [18, 17], [14, 15], [10, 18]
            ],
            extras: { tints: [0xffffff, 0xffffff, 0xeeeeff] }
        }]
    },
    westmead: {
        band: [26, 30],
        mobs: [
            {
                type: 'Rabbit',
                texture: 'mob-rabbit',
                spots: [
                    [10, 10], [14, 8], [18, 11], [22, 9], [26, 12], [30, 10], [28, 16], [24, 18],
                    [20, 20], [16, 17], [12, 15], [8, 18], [11, 20], [15, 14], [19, 9], [23, 16],
                    [27, 11], [29, 19]
                ],
                extras: { tints: [0xffffff, 0xffffff, 0xeeddcc] }
            },
            {
                type: 'Goblin',
                texture: 'mob-goblin',
                spots: [
                    [9, 13], [15, 12], [21, 14], [27, 13], [25, 20], [17, 8],
                    [12, 19], [19, 16], [23, 10], [30, 17]
                ]
            }
        ]
    },
    darkmine: {
        band: [31, 35],
        mobs: [{
            type: 'Bat',
            texture: 'mob-bat',
            spots: [
                [8, 8], [12, 11], [16, 9], [20, 12], [24, 10], [28, 13], [31, 16], [26, 18],
                [22, 20], [18, 17], [14, 19], [10, 15], [17, 14], [25, 15]
            ],
            extras: { tints: [0xffffff, 0xffffff, 0xddbbff, 0xffffff] }
        }]
    },
    highlands: {
        band: [36, 40],
        mobs: [{
            type: 'Drake',
            texture: 'mob-drake',
            spots: [
                [10, 10], [16, 9], [22, 12], [28, 11], [30, 16], [24, 18], [18, 20], [12, 17],
                [20, 14], [26, 15]
            ]
        }]
    },
    /* Den — Dragons fixed Lv 60 (band matches spawn levels). */
    dragonden: {
        band: [60, 60],
        mobs: [{
            type: 'Dragon',
            texture: 'mob-dragon',
            spots: [
                [12, 10], [20, 12], [28, 14], [18, 18]
            ],
            extras: {
                alwaysAgro: true,
                tints: [0xffffff, 0xffffff, 0xffffff, 0xffffff],
                levelFor: function () {
                    return 60;
                },
                attackRangeFor: function (i) {
                    return i === 3 ? 120 : 110;
                }
            }
        }]
    }
};

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
