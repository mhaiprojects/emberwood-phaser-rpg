var ZONE_LIST = [
    { id: 'graves', name: 'Restless Graves', gx: -1, gy: -1, biome: 'grave', seed: 11 },
    { id: 'northwood', name: 'Northwood', gx: 0, gy: -1, biome: 'forest', seed: 22 },
    { id: 'highlands', name: 'Windrock Highlands', gx: 1, gy: -1, biome: 'hills', seed: 33 },
    { id: 'westmead', name: 'Westmead', gx: -1, gy: 0, biome: 'plains', seed: 44 },
    { id: 'haven', name: 'Emberhaven', gx: 0, gy: 0, biome: 'town', seed: 55 },
    { id: 'millfields', name: 'Millfields', gx: 1, gy: 0, biome: 'farm', seed: 66 },
    { id: 'darkmine', name: 'Darkmine', gx: -1, gy: 1, biome: 'mine', seed: 77 },
    { id: 'southshore', name: 'Southshore', gx: 0, gy: 1, biome: 'shore', seed: 88 },
    { id: 'mire', name: 'Mirefen', gx: 1, gy: 1, biome: 'swamp', seed: 99 }
];

var ZONES = {};
ZONE_LIST.forEach(function (zone) {
    ZONES[zone.id] = zone;
});

var INTERIOR_LIST = [
    { id: 'shop', name: 'Emberhaven Shop', doorTx: 25, doorTy: 11, zoneId: 'haven' },
    { id: 'guild', name: 'Emberhaven Guild Hall', doorTx: 15, doorTy: 20, zoneId: 'haven' },
    {
        id: 'shaft',
        name: 'Darkmine Lower Shaft',
        doorTx: MINE_SHAFT_HOUSE.x + Math.floor(MINE_SHAFT_HOUSE.w / 2),
        doorTy: MINE_SHAFT_HOUSE.y + MINE_SHAFT_HOUSE.h - 1,
        zoneId: 'darkmine'
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
        { key: 'guild', name: 'Guildmaster Bram', x: 210, y: 150, tint: 0xffffff, questGiver: true, options: ['talk', 'quest'], examine: 'A scarred militia captain. He still drills the courtyard.', lines: ['Welcome to Emberhaven, adventurer.', 'Goblins from Northwood raid our stores.', 'Slay 5 goblins and return. The militia will pay.'] },
        { key: 'banker', name: 'Banker Elise', x: 232, y: 184, tint: 0xffffff, options: ['talk', 'bank'], examine: 'The town banker. She minds the courtyard booth.', lines: ['Your coin is safe with me.', 'Deposit what you cannot carry.'] },
        { key: 'guard', name: 'Guard Rowan', x: 252, y: 168, tint: 0xffffff, options: ['talk'], examine: 'A watchful town guard. He knows every path from the gate.', lines: ['Keep to the paths.', 'North is woods. East is farms. South is the sea.'] },
        { key: 'shopkeep', name: 'Shopkeeper Mira', x: 376, y: 216, tint: 0xffffff, texture: 'npc-shopkeeper', options: ['talk', 'trade'], shopKey: 'mira', examine: 'The town shopkeeper. She minds the general store.', lines: ['Take a look at the wares.', 'Bones and spare food fetch a price.'] },
        { key: 'dummy', name: 'Training dummy', x: 280, y: 264, tint: 0xcccccc, texture: 'npc-guard', options: ['talk', 'duel'], examine: 'A straw-filled training dummy for duels.', lines: ['Up for a practice duel?', 'No loot, just honour.'] },
        { key: 'arms', name: 'Armsman Cole', x: 360, y: 200, tint: 0xffffff, texture: 'npc-guard', options: ['talk', 'trade'], shopKey: 'arms', examine: 'A weapons stall keeper. Oil stains his gloves.', lines: ['Blades and bows, if you have the coin.', 'Take a look at the wares.'] },
        { key: 'cook', name: 'Cook Pell', x: 280, y: 280, tint: 0xffffff, options: ['talk'], tutor: 'firemaking', examine: 'The town cook. Flour dusts her sleeves and a ladle never leaves her hand.', lines: ['Take this tinderbox.', 'Use it on logs to light a fire on open ground.', 'Cook raw food on that fire or the town range.', 'Burnt food teaches nothing — keep cooking.'] },
        { key: 'priest', name: 'Priest Alden', x: 296, y: 168, tint: 0xffffff, options: ['talk'], examine: 'A quiet shrine priest. Ash marks the collar of his robe.', lines: ['The shrine still hears a prayer.', 'Bury the bones of the fallen, traveler.'] }
    ],
    northwood: [
        { key: 'ranger', name: 'Ranger Kett', x: 240, y: 200, tint: 0xffffff, options: ['talk'], tutor: 'combat', examine: 'A Northwood ranger. Goblin tracks stain her boots.', lines: ['Goblins nest in these trees.', 'Click a goblin to fight it, like the old days.', 'Open Combat and pick Accurate, Aggressive, or Defensive.', 'Chop the trees with a bronze axe for logs.', 'Accurate trains Attack. Aggressive trains Strength. Defensive trains Defence.'] }
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
        { key: 'miner', name: 'Miner Corb', x: 210, y: 200, tint: 0xffffff, options: ['talk', 'quest'], questGiver: true, sideQuest: 'bats', tutor: 'mining', examine: 'A Darkmine digger. He will not go down the lower shaft.', lines: ['Bats took the lower shaft.', 'Ore waits for someone braver than me.', 'Prospect the rocks if you mean to start mining.', 'Bring a pickaxe. Copper and tin wait in the stone.'] }
    ],
    highlands: [
        { key: 'hermit', name: 'Hermit Ola', x: 240, y: 160, tint: 0xffffff, options: ['talk'], examine: 'A windrock hermit. Drake-scale grit is stuck in her cloak.', lines: ['Drakes nest on the windrock.', 'Bring a stout shield.'] }
    ],
    mire: [
        { key: 'witch', name: 'Fen Witch', x: 200, y: 180, tint: 0xffffff, options: ['talk'], examine: 'A fen healer. Marsh-light clings to her sleeves.', lines: ['The fen drinks the lost.', 'I can stitch wounds... for a price.'] }
    ]
};

var MOB_DEFS = {
    haven: [
        { type: 'Chicken', texture: 'mob-chicken', tint: 0xffffff, hp: 12, damage: 3, gold: 1, xp: 4, x: 400, y: 250 },
        { type: 'Chicken', texture: 'mob-chicken', tint: 0xffffff, hp: 12, damage: 3, gold: 1, xp: 4, x: 420, y: 190 }
    ],
    northwood: [
        { type: 'Goblin', texture: 'mob-goblin', tint: 0xffffff, hp: 28, damage: 8, gold: 6, xp: 12, x: 160, y: 120 },
        { type: 'Goblin', texture: 'mob-goblin', tint: 0xffffff, hp: 28, damage: 8, gold: 6, xp: 12, x: 300, y: 140 },
        { type: 'Goblin', texture: 'mob-goblin', tint: 0xbbffbb, hp: 30, damage: 9, gold: 7, xp: 12, x: 400, y: 260 },
        { type: 'Goblin', texture: 'mob-goblin', tint: 0xffffff, hp: 28, damage: 8, gold: 6, xp: 12, x: 220, y: 300 }
    ],
    highlands: [
        { type: 'Drake', texture: 'mob-drake', tint: 0xffffff, hp: 48, damage: 13, gold: 18, xp: 28, x: 180, y: 160 },
        { type: 'Drake', texture: 'mob-drake', tint: 0xffffff, hp: 52, damage: 14, gold: 20, xp: 30, x: 380, y: 220 }
    ],
    millfields: [
        { type: 'Cow', texture: 'mob-cow', tint: 0xffffff, hp: 22, damage: 5, gold: 3, xp: 8, x: 150, y: 200 },
        { type: 'Cow', texture: 'mob-cow', tint: 0xffffff, hp: 22, damage: 5, gold: 3, xp: 8, x: 300, y: 120 },
        { type: 'Cow', texture: 'mob-cow', tint: 0xeeddcc, hp: 24, damage: 6, gold: 3, xp: 8, x: 400, y: 260 }
    ],
    mire: [
        { type: 'Slime', texture: 'mob-slime', tint: 0xffffff, hp: 26, damage: 7, gold: 5, xp: 10, x: 160, y: 140 },
        { type: 'Slime', texture: 'mob-slime', tint: 0x88ffaa, hp: 28, damage: 8, gold: 5, xp: 10, x: 320, y: 200 },
        { type: 'Slime', texture: 'mob-slime', tint: 0xffffff, hp: 26, damage: 7, gold: 5, xp: 10, x: 420, y: 280 }
    ],
    southshore: [
        { type: 'Crab', texture: 'mob-crab', tint: 0xffffff, hp: 24, damage: 7, gold: 4, xp: 9, x: 140, y: 180 },
        { type: 'Crab', texture: 'mob-crab', tint: 0xffccaa, hp: 26, damage: 8, gold: 5, xp: 9, x: 280, y: 200 },
        { type: 'Crab', texture: 'mob-crab', tint: 0xffffff, hp: 24, damage: 7, gold: 4, xp: 9, x: 400, y: 160 }
    ],
    darkmine: [
        { type: 'Bat', texture: 'mob-bat', tint: 0xffffff, hp: 20, damage: 8, gold: 4, xp: 10, x: 150, y: 120 },
        { type: 'Bat', texture: 'mob-bat', tint: 0xffffff, hp: 20, damage: 8, gold: 4, xp: 10, x: 260, y: 180 },
        { type: 'Bat', texture: 'mob-bat', tint: 0xddbbff, hp: 22, damage: 9, gold: 5, xp: 11, x: 380, y: 240 },
        { type: 'Bat', texture: 'mob-bat', tint: 0xffffff, hp: 20, damage: 8, gold: 4, xp: 10, x: 200, y: 300 }
    ],
    westmead: [
        { type: 'Goblin', texture: 'mob-goblin', tint: 0xffffff, hp: 26, damage: 7, gold: 5, xp: 11, x: 180, y: 140 },
        { type: 'Goblin', texture: 'mob-goblin', tint: 0xffffff, hp: 26, damage: 8, gold: 5, xp: 11, x: 340, y: 220 },
        { type: 'Rabbit', texture: 'mob-rabbit', tint: 0xffffff, hp: 10, damage: 2, gold: 1, xp: 5, x: 260, y: 180 },
        { type: 'Rabbit', texture: 'mob-rabbit', tint: 0xffffff, hp: 10, damage: 2, gold: 1, xp: 5, x: 380, y: 160 },
        { type: 'Rabbit', texture: 'mob-rabbit', tint: 0xeeddcc, hp: 12, damage: 2, gold: 1, xp: 6, x: 420, y: 280 }
    ],
    graves: [
        { type: 'Skeleton', texture: 'mob-skeleton', tint: 0xffffff, hp: 34, damage: 10, gold: 8, xp: 16, x: 160, y: 150 },
        { type: 'Skeleton', texture: 'mob-skeleton', tint: 0xffffff, hp: 36, damage: 11, gold: 9, xp: 16, x: 300, y: 210 },
        { type: 'Skeleton', texture: 'mob-skeleton', tint: 0xeeeeff, hp: 34, damage: 10, gold: 8, xp: 16, x: 400, y: 120 }
    ]
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
