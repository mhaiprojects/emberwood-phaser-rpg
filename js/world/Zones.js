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
    { id: 'dungeon', name: 'Endless Mine', gx: -99, gy: -99, biome: 'mine', seed: 9001, hidden: true },
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
        name: 'Endless Mine',
        doorTx: MINE_SHAFT_HOUSE.x + Math.floor(MINE_SHAFT_HOUSE.w / 2),
        doorTy: MINE_SHAFT_HOUSE.y + MINE_SHAFT_HOUSE.h - 1,
        zoneId: 'darkmine',
        stairs: 'down',
        dungeon: true,
        enterChat: 'You delve into the Endless Mine…'
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
        { key: 'miner', name: 'Miner Corb', x: 210, y: 200, tint: 0xffffff, options: ['talk', 'quest'], questGiver: true, sideQuest: 'bats', tutor: 'mining', examine: 'A Darkmine digger. He will not go down the Endless Mine.', lines: ['That shaft leads to the Endless Mine. Floor one starts at level 20 — each floor adds one.', 'Every twenty-first floor wakes a dragon. Escape marks the floor for next time.', 'Every fifth floor has a campfire. Ore still waits up here with a pickaxe.'] }
    ],
    highlands: [
        { key: 'hermit', name: 'Hermit Ola', x: 240, y: 160, tint: 0xffffff, options: ['talk'], examine: 'A windrock hermit. Drake-scale grit is stuck in her cloak.', lines: ['Drakes nest on the windrock.', 'Bring a stout shield.', 'East of here a boulder seals a deeper den — only a diamond pickaxe cracks it.'] }
    ],
    mire: [
        { key: 'witch', name: 'Fen Witch', x: 200, y: 180, tint: 0xffffff, options: ['talk'], examine: 'A fen healer. Marsh-light clings to her sleeves.', lines: ['The fen drinks the lost.', 'I can stitch wounds... for a price.'] }
    ]
};

/* Per-zone combat bands (5 levels). Starter wilds share 1–5; Mine is hardest overworld. */
var ZONE_LEVEL_BAND = {
    haven: [1, 5],
    millfields: [1, 5],
    westmead: [1, 5],
    southshore: [6, 10],
    northwood: [6, 10],
    mire: [11, 15],
    graves: [16, 20],
    highlands: [26, 30],
    darkmine: [36, 40],
    dragonden: [51, 55]
};

function zoneBandLevel(zoneId, index) {
    var band = ZONE_LEVEL_BAND[zoneId] || [1, 5];
    var lo = band[0];
    var hi = band[1];
    var span = Math.max(0, hi - lo);
    return lo + ((index | 0) % (span + 1));
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

/* Spread spawn tiles inside the 2-tile mob edge inset (tx 2..33, ty 2..25). */
function buildBandMobs(zoneId, type, texture, spots, extras) {
    var out = [];
    var i;
    var level;
    var stats;
    var center;
    var def;
    var tintCycle = (extras && extras.tints) || [0xffffff];
    for (i = 0; i < spots.length; i++) {
        level = zoneBandLevel(zoneId, i);
        if (extras && typeof extras.levelFor === 'function') {
            level = extras.levelFor(i, level);
        }
        stats = mobStatsFor(type, level);
        center = tileCenter(spots[i][0], spots[i][1]);
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

var MOB_DEFS = {
    /* Band 1–5 — starter wilds; lean high counts. */
    haven: buildBandMobs('haven', 'Chicken', 'mob-chicken', [
        [24, 14], [26, 11], [28, 13], [30, 10], [25, 17], [27, 16], [29, 18], [22, 12],
        [31, 15], [23, 19], [26, 20], [28, 9], [21, 15], [30, 19], [24, 8], [27, 14],
        [29, 12], [25, 11], [22, 18], [31, 17]
    ]),
    millfields: buildBandMobs('millfields', 'Cow', 'mob-cow', [
        [8, 12], [12, 8], [18, 7], [24, 9], [28, 12], [30, 16], [26, 18], [20, 20],
        [14, 19], [9, 16], [11, 11], [16, 14], [22, 11], [27, 8], [31, 14], [19, 16],
        [13, 17], [25, 15]
    ], { tints: [0xffffff, 0xffffff, 0xeeddcc] }),
    westmead: buildBandMobs('westmead', 'Rabbit', 'mob-rabbit', [
        [10, 10], [14, 8], [18, 11], [22, 9], [26, 12], [30, 10], [28, 16], [24, 18],
        [20, 20], [16, 17], [12, 15], [8, 18]
    ], { tints: [0xffffff, 0xffffff, 0xeeddcc] }).concat(
        buildBandMobs('westmead', 'Goblin', 'mob-goblin', [
            [9, 13], [15, 12], [21, 14], [27, 13], [25, 20], [17, 8]
        ], {
            levelFor: function (i, bandLevel) {
                /* Soft starter goblins: upper half of the 1–5 band. */
                return Math.max(3, bandLevel);
            }
        })
    ),
    /* Band 6–10 — next ring. */
    southshore: buildBandMobs('southshore', 'Crab', 'mob-crab', [
        [8, 14], [12, 12], [16, 10], [20, 11], [24, 9], [28, 12], [31, 15], [26, 17],
        [22, 19], [18, 16], [14, 18], [10, 17], [27, 14], [19, 14]
    ], { tints: [0xffffff, 0xffccaa, 0xffffff] }),
    northwood: buildBandMobs('northwood', 'Goblin', 'mob-goblin', [
        [8, 8], [12, 10], [16, 7], [20, 9], [24, 8], [28, 11], [31, 14], [26, 16],
        [22, 18], [18, 20], [14, 17], [10, 19], [9, 13], [15, 14], [21, 13], [27, 19]
    ], { tints: [0xffffff, 0xffffff, 0xbbffbb, 0xffffff] }),
    /* Band 11–15 / 16–20 — outer danger. */
    mire: buildBandMobs('mire', 'Slime', 'mob-slime', [
        [9, 9], [13, 11], [17, 8], [21, 12], [25, 10], [29, 13], [31, 17], [27, 19],
        [23, 20], [19, 16], [15, 18], [11, 15]
    ], { tints: [0xffffff, 0x88ffaa, 0xffffff] }),
    graves: buildBandMobs('graves', 'Skeleton', 'mob-skeleton', [
        [9, 9], [13, 12], [17, 8], [21, 11], [25, 9], [29, 13], [31, 16], [26, 19],
        [22, 20], [18, 17], [14, 15], [10, 18]
    ], { tints: [0xffffff, 0xffffff, 0xeeeeff] }),
    /* Band 26–30 — highlands. */
    highlands: buildBandMobs('highlands', 'Drake', 'mob-drake', [
        [10, 10], [16, 9], [22, 12], [28, 11], [30, 16], [24, 18], [18, 20], [12, 17],
        [20, 14], [26, 15]
    ]),
    /* Band 36–40 — Mine (hardest overworld); Endless Mine shaft. */
    darkmine: buildBandMobs('darkmine', 'Bat', 'mob-bat', [
        [8, 8], [12, 11], [16, 9], [20, 12], [24, 10], [28, 13], [31, 16], [26, 18],
        [22, 20], [18, 17], [14, 19], [10, 15], [17, 14], [25, 15]
    ], { tints: [0xffffff, 0xffffff, 0xddbbff, 0xffffff] }),
    /* Band 51–55 — den stays sparse; alwaysAgro kept. */
    dragonden: buildBandMobs('dragonden', 'Dragon', 'mob-drake', [
        [12, 10], [20, 12], [28, 14], [18, 18]
    ], {
        alwaysAgro: true,
        tints: [0xff6644, 0xff4422, 0xdd2200, 0xff5533],
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
