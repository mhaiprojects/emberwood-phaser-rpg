var ITEM_DB = {
    coins: { name: 'Coins', icon: 'assets/svg/items/coins.svg', stack: true, value: 1, examine: 'A small pile of copper and silver coins.' },
    shrimp: { name: 'Cooked shrimp', icon: 'assets/svg/items/shrimp.svg', heal: 12, stack: true, value: 5, examine: 'A cooked shrimp, still warm enough to eat.' },
    rawshrimp: { name: 'Raw shrimp', icon: 'assets/svg/items/rawshrimp.svg', stack: true, cook: 'shrimp', cookXp: 30, value: 5, examine: 'A raw shrimp. It should be cooked.' },
    rawbeef: { name: 'Raw beef', icon: 'assets/svg/items/rawbeef.svg', stack: true, value: 4, examine: 'A cut of raw beef. Better cooked.' },
    bread: { name: 'Bread', icon: 'assets/svg/items/bread.svg', heal: 20, stack: true, value: 12, examine: 'A dense loaf baked for the road.' },
    sword: { name: 'Bronze sword', icon: 'assets/svg/items/sword.svg', slot: 'weapon', damage: 16, value: 26, examine: 'A short bronze blade, nicked but serviceable.' },
    shortbow: { name: 'Shortbow', icon: 'assets/svg/items/shortbow.svg', slot: 'weapon', damage: 16, combatClass: 'ranged', value: 32, examine: 'A yew shortbow, light enough for bronze arrows.' },
    arrow: { name: 'Bronze arrows', icon: 'assets/svg/items/arrow.svg', slot: 'ammo', stack: true, value: 1, examine: 'A sheaf of bronze arrows with grey-goose fletching.' },
    shield: { name: 'Wooden shield', icon: 'assets/svg/items/shield.svg', slot: 'shield', defence: 1, value: 20, examine: 'A round wooden shield bound with iron.' },
    bronzeaxe: { name: 'Bronze axe', icon: 'assets/svg/items/bronzeaxe.svg', tool: 'axe', value: 18, examine: 'A bronze axe for chopping trees.' },
    bronzepick: { name: 'Bronze pickaxe', icon: 'assets/svg/items/bronzepick.svg', tool: 'pickaxe', value: 18, examine: 'A bronze pickaxe for mining ore.' },
    net: { name: 'Small fishing net', icon: 'assets/svg/items/net.svg', tool: 'net', value: 8, examine: 'A small fishing net for shrimp.' },
    logs: { name: 'Logs', icon: 'assets/svg/items/logs.svg', stack: true, value: 2, examine: 'A pile of chopped logs.' },
    copper: { name: 'Copper ore', icon: 'assets/svg/items/copper.svg', stack: true, value: 3, examine: 'A chunk of copper ore.' },
    tin: { name: 'Tin ore', icon: 'assets/svg/items/tin.svg', stack: true, value: 3, examine: 'A chunk of tin ore.' },
    bronzebar: { name: 'Bronze bar', icon: 'assets/svg/items/bronzebar.svg', stack: true, value: 12, examine: 'A smelted bronze bar.' },
    tinderbox: { name: 'Tinderbox', icon: 'assets/svg/items/tinderbox.svg', value: 5, examine: 'A small box of flint and steel.' },
    bones: { name: 'Bones', icon: 'assets/svg/items/bones.svg', stack: true, bury: true, buryXp: 4, value: 1, examine: 'Dry bones. Someone should bury them.' },
    feather: { name: 'Feathers', icon: 'assets/svg/items/feather.svg', stack: true, value: 1, examine: 'Soft feathers from a bird.' },
    rabbitfur: { name: 'Rabbit fur', icon: 'assets/svg/items/rabbitfur.svg', stack: true, value: 3, examine: 'Soft fur from a rabbit. Useful for crafting.' },
    airrune: { name: 'Air rune', icon: 'assets/svg/items/airrune.svg', stack: true, rune: true, value: 4, examine: 'A pale blue rune. It hums with air.' },
    mindrune: { name: 'Mind rune', icon: 'assets/svg/items/mindrune.svg', stack: true, rune: true, value: 3, examine: 'A dull purple rune. It focuses the mind.' },
    key: { name: 'Iron key', icon: 'assets/svg/items/key.svg', value: 1, examine: 'A heavy iron key with a worn bit.' },
    cowhide: { name: 'Cowhide', icon: 'assets/svg/items/cowhide.svg', stack: true, tan: 'leather', tanXp: 14, value: 2, examine: 'A raw cowhide. It can be crafted into leather.' },
    leather: { name: 'Leather', icon: 'assets/svg/items/leather.svg', stack: true, value: 4, examine: 'Soft leather, ready to stitch.' },
    string: { name: 'String', icon: 'assets/svg/items/string.svg', stack: true, value: 1, examine: 'A short length of string for stitching leather.' },
    gloves: { name: 'Leather gloves', icon: 'assets/svg/items/gloves.svg', slot: 'hands', defence: 1, value: 10, examine: 'Stitched leather gloves for the road.' }
};

var WIND_STRIKE_XP = 5;
var WIND_STRIKE_DAMAGE = 2;
var FISH_SPOT_XP = 10;
var FISH_CATCH_ID = 'rawshrimp';
var FISH_NET_ID = 'net';
var FISH_ACTION_MS_MIN = 3000;
var FISH_ACTION_MS_MAX = 5000;
var WOODCUT_TREE_XP = 10;
var WOODCUT_LOG_ID = 'logs';
var WOODCUT_AXE_ID = 'bronzeaxe';
var WOODCUT_ACTION_MS_MIN = 3000;
var WOODCUT_ACTION_MS_MAX = 5000;
var WOODCUT_RESPAWN_MS = 12000;
var MINE_ROCK_XP = 10;
var MINE_PICK_ID = 'bronzepick';
var MINE_ACTION_MS_MIN = 3000;
var MINE_ACTION_MS_MAX = 5000;
var MINE_RESPAWN_MS = 10000;
var HUNTER_KILL_XP = 12;
var CRAFT_HIDE_XP = 14;
var CRAFT_LEATHER_XP = 25;
var FIREMAKE_XP = 10;
var RESOURCE_LEVEL = {
    copper: 1,
    tin: 1,
    iron: 15
};

function resourceNeedLevel(id) {
    var need = RESOURCE_LEVEL[id];
    if (typeof need === 'number') {
        return need;
    }
    return RESOURCE_LEVEL.copper;
}

function needLevelChat(need) {
    return 'You need level ' + need + '.';
}

function resourceLevelGate(hero, skill, id) {
    var need = resourceNeedLevel(id);
    var have = heroSkillLevel(hero, skill);
    if (have < need) {
        return { ok: false, need: need, have: have };
    }
    return { ok: true, need: need, have: have };
}

var SKILL_NAMES = [
    ['attack', 'Attack'],
    ['strength', 'Strength'],
    ['defence', 'Defence'],
    ['hitpoints', 'Hitpoints'],
    ['ranged', 'Ranged'],
    ['prayer', 'Prayer'],
    ['magic', 'Magic'],
    ['cooking', 'Cooking'],
    ['fishing', 'Fishing'],
    ['woodcutting', 'Woodcutting'],
    ['mining', 'Mining'],
    ['crafting', 'Crafting'],
    ['firemaking', 'Firemaking'],
    ['hunter', 'Hunter']
];

// Unused OSRS cousins stay Stretch backlog — never stub empty Skills-tab rows.
var STRETCH_SKILL_NAMES = [
    ['agility', 'Agility'],
    ['thieving', 'Thieving'],
    ['slayer', 'Slayer'],
    ['runecraft', 'Runecraft'],
    ['farming', 'Farming'],
    ['herblore', 'Herblore'],
    ['fletching', 'Fletching'],
    ['construction', 'Construction']
];

function isStretchSkill(id) {
    var i;
    if (!id) {
        return false;
    }
    for (i = 0; i < STRETCH_SKILL_NAMES.length; i++) {
        if (STRETCH_SKILL_NAMES[i][0] === id) {
            return true;
        }
    }
    return false;
}

var EQUIP_SLOTS = [
    ['head', 'Head'],
    ['cape', 'Cape'],
    ['neck', 'Neck'],
    ['ammo', 'Ammo'],
    ['weapon', 'Weapon'],
    ['body', 'Body'],
    ['shield', 'Shield'],
    ['legs', 'Legs'],
    ['hands', 'Hands'],
    ['feet', 'Feet'],
    ['ring', 'Ring']
];

function emptyEquipment() {
    var equipment = {};
    for (var i = 0; i < EQUIP_SLOTS.length; i++) {
        equipment[EQUIP_SLOTS[i][0]] = null;
    }
    return equipment;
}

function ensureEquipment(hero) {
    if (!hero) {
        return emptyEquipment();
    }
    if (!hero.equipment) {
        hero.equipment = emptyEquipment();
    } else {
        for (var i = 0; i < EQUIP_SLOTS.length; i++) {
            var key = EQUIP_SLOTS[i][0];
            if (!Object.prototype.hasOwnProperty.call(hero.equipment, key)) {
                hero.equipment[key] = null;
            }
        }
    }
    ensureEquipmentQty(hero);
    return hero.equipment;
}

function ensureEquipmentQty(hero) {
    if (!hero) {
        return {};
    }
    if (!hero.equipmentQty) {
        hero.equipmentQty = {};
    }
    return hero.equipmentQty;
}

function equippedQty(hero, slot) {
    if (!hero || !slot || !hero.equipment || !hero.equipment[slot]) {
        return 0;
    }
    var qty = hero.equipmentQty && hero.equipmentQty[slot];
    if (typeof qty === 'number' && qty > 0) {
        return qty;
    }
    return 1;
}

function rangedWeaponEquipped(hero) {
    if (!hero || !hero.equipment || !hero.equipment.weapon) {
        return false;
    }
    var def = ITEM_DB[hero.equipment.weapon];
    return !!(def && def.combatClass === 'ranged');
}

function consumeAmmo(hero) {
    if (!hero) {
        return false;
    }
    ensureEquipment(hero);
    if (!hero.equipment.ammo) {
        return false;
    }
    var qty = equippedQty(hero, 'ammo');
    if (qty < 1) {
        hero.equipment.ammo = null;
        hero.equipmentQty.ammo = 0;
        return false;
    }
    qty -= 1;
    hero.equipmentQty.ammo = qty;
    if (qty < 1) {
        hero.equipment.ammo = null;
        hero.equipmentQty.ammo = 0;
    }
    return true;
}

function makeHero() {
    var hero = {
        hp: 100,
        maxHp: 100,
        damage: 16,
        gold: 8,
        xp: 0,
        level: 1,
        style: 'accurate',
        stance: 'melee',
        autoAttack: true,
        autoRetaliate: true,
        autoPickup: true,
        shiftClickDrop: true,
        running: false,
        runEnergy: 100,
        equipment: (function () {
            var eq = emptyEquipment();
            eq.weapon = 'sword';
            eq.shield = 'shield';
            return eq;
        }()),
        equipmentQty: {},
        inventory: [
            { id: 'coins', qty: 8 },
            { id: 'sword', qty: 1 },
            { id: 'shield', qty: 1 },
            { id: 'shrimp', qty: 8 },
            { id: 'bread', qty: 3 }
        ],
        bank: [],
        tutors: {},
        skills: {
            attack: { level: 1, xp: 0 },
            strength: { level: 1, xp: 0 },
            defence: { level: 1, xp: 0 },
            hitpoints: { level: 10, xp: 1154 },
            ranged: { level: 1, xp: 0 },
            prayer: { level: 1, xp: 0 },
            magic: { level: 1, xp: 0 },
            cooking: { level: 1, xp: 0 },
            fishing: { level: 1, xp: 0 },
            woodcutting: { level: 1, xp: 0 },
            mining: { level: 1, xp: 0 },
            crafting: { level: 1, xp: 0 },
            firemaking: { level: 1, xp: 0 },
            hunter: { level: 1, xp: 0 },
            agility: { level: 1, xp: 0 }
        }
    };
    applyCombatLevel(hero, false);
    return hero;
}

function autoRetaliateOn(hero) {
    if (!hero) {
        return false;
    }
    if (hero.autoRetaliate == null) {
        return !!hero.autoAttack;
    }
    return !!hero.autoRetaliate;
}

function shiftClickDropOn(hero) {
    return !!(hero && hero.shiftClickDrop !== false);
}

var INVENTORY_CAP = 28;

function canAddItem(hero, id) {
    if (!hero || !hero.inventory) {
        return false;
    }
    if (id && findStack(hero.inventory, id)) {
        return true;
    }
    if (id === 'coins' && hero.gold > 0) {
        return true;
    }
    return hero.inventory.length < INVENTORY_CAP;
}

function addItem(hero, id, qty) {
    qty = qty || 1;
    if (!hero || !id) {
        return false;
    }
    if (!canAddItem(hero, id)) {
        return false;
    }
    if (id === 'coins') {
        hero.gold += qty;
        syncCoins(hero);
        return true;
    }
    var stack = findStack(hero.inventory, id);
    if (stack) {
        stack.qty += qty;
        return true;
    }
    hero.inventory.push({ id: id, qty: qty });
    return true;
}

function heroHasItem(hero, id) {
    if (!hero || !hero.inventory) {
        return false;
    }
    for (var i = 0; i < hero.inventory.length; i++) {
        if (hero.inventory[i].id === id && hero.inventory[i].qty > 0) {
            return true;
        }
    }
    return false;
}

function itemEquipSlot(id) {
    var def = ITEM_DB[id];
    return def && def.slot ? def.slot : null;
}

function knownEquipSlot(slot) {
    if (!slot) {
        return false;
    }
    for (var i = 0; i < EQUIP_SLOTS.length; i++) {
        if (EQUIP_SLOTS[i][0] === slot) {
            return true;
        }
    }
    return false;
}

function itemEquipVerb(id) {
    var slot = itemEquipSlot(id);
    if (!knownEquipSlot(slot)) {
        return null;
    }
    if (slot === 'weapon') {
        return 'wield';
    }
    return 'wear';
}

function itemDefaultVerb(id) {
    var def = ITEM_DB[id];
    if (!def) {
        return null;
    }
    if (def.heal) {
        return 'eat';
    }
    var equip = itemEquipVerb(id);
    if (equip) {
        return equip;
    }
    if (def.bury) {
        return 'bury';
    }
    if (def.tan) {
        return 'tan';
    }
    return 'drop';
}

function itemUseOnKinds(id) {
    var def = ITEM_DB[id];
    var kinds = [];
    if (!def) {
        return kinds;
    }
    if (def.cook) {
        kinds.push('fire', 'range');
    }
    if (def.firemake) {
        kinds.push('fire', 'range');
    }
    if (def.bury) {
        kinds.push('shrine');
    }
    return kinds;
}

function itemCanUseOn(id, kind) {
    if (!kind) {
        return false;
    }
    var kinds = itemUseOnKinds(id);
    return kinds.indexOf(kind) !== -1;
}

function itemUseTargetName(kind) {
    if (kind === 'range' || kind === 'fire') {
        return 'fire';
    }
    return kind || '';
}

function useItemOnScenery(hero, id, kind) {
    var def = ITEM_DB[id];
    var xp;
    if (!hero || !id || !def || !itemCanUseOn(id, kind)) {
        return null;
    }
    if (!takeItem(hero, id, 1)) {
        return null;
    }
    if (def.cook && !addItem(hero, def.cook, 1)) {
        addItem(hero, id, 1);
        return { ok: false, full: true };
    }
    if (def.cook && (kind === 'range' || kind === 'fire')) {
        xp = typeof def.cookXp === 'number' ? def.cookXp : 0;
        if (xp > 0) {
            gainSkillXp(hero, 'cooking', xp);
        }
    }
    if (!def.cook && def.firemake && (kind === 'range' || kind === 'fire')) {
        xp = typeof def.firemakeXp === 'number' ? def.firemakeXp : FIREMAKE_XP;
        if (xp > 0) {
            gainSkillXp(hero, 'firemaking', xp);
        }
        return { ok: true, id: id, kind: kind, cooked: null, firemade: true, xp: xp };
    }
    return { ok: true, id: id, kind: kind, cooked: def.cook || null };
}

function firemakeAt(hero) {
    if (!hero || !hero.skills || !hero.skills.firemaking) {
        return null;
    }
    gainSkillXp(hero, 'firemaking', FIREMAKE_XP);
    return { ok: true, xp: FIREMAKE_XP };
}

function lightFire(hero) {
    return firemakeAt(hero);
}

function fishRoll(rand) {
    if (typeof rand === 'function') {
        return rand();
    }
    if (typeof rand === 'number') {
        return rand;
    }
    return Math.random();
}

function fishActionMs(rand) {
    var span = FISH_ACTION_MS_MAX - FISH_ACTION_MS_MIN;
    var ms = FISH_ACTION_MS_MIN + Math.floor(fishRoll(rand) * (span + 1));
    if (ms < FISH_ACTION_MS_MIN) {
        return FISH_ACTION_MS_MIN;
    }
    if (ms > FISH_ACTION_MS_MAX) {
        return FISH_ACTION_MS_MAX;
    }
    return ms;
}

function skillActionMs(minMs, maxMs, rand) {
    var lo = typeof minMs === 'number' ? minMs : 3000;
    var hi = typeof maxMs === 'number' ? maxMs : 5000;
    var span = hi - lo;
    var ms = lo + Math.floor(fishRoll(rand) * (span + 1));
    if (ms < lo) {
        return lo;
    }
    if (ms > hi) {
        return hi;
    }
    return ms;
}

function hasTool(hero, tool) {
    if (!hero || !tool) {
        return false;
    }
    if (itemQty(hero, tool) > 0) {
        return true;
    }
    if (hero.equipment) {
        if (hero.equipment.weapon === tool || hero.equipment.hands === tool) {
            return true;
        }
    }
    return false;
}

function fishCatchChance(hero) {
    var level = heroSkillLevel(hero, 'fishing') || 1;
    return Math.min(0.95, 0.35 + level * 0.03);
}

function catchFish(hero, opts) {
    var chance;
    var rand;
    if (!hero || !hero.skills || !hero.skills.fishing) {
        return null;
    }
    opts = opts || {};
    if (!opts.skipTool && !hasTool(hero, FISH_NET_ID)) {
        return { ok: false, needTool: FISH_NET_ID, toolName: 'fishing net' };
    }
    rand = opts.rand;
    chance = typeof opts.chance === 'number' ? opts.chance : fishCatchChance(hero);
    if (!(fishRoll(rand) < chance)) {
        return { ok: false, miss: true };
    }
    if (!addItem(hero, FISH_CATCH_ID, 1)) {
        return { ok: false, full: true };
    }
    gainSkillXp(hero, 'fishing', FISH_SPOT_XP);
    return { ok: true, id: FISH_CATCH_ID, xp: FISH_SPOT_XP };
}

function fishAtSpot(hero, opts) {
    return catchFish(hero, opts);
}

function chopAtTree(hero, opts) {
    opts = opts || {};
    if (!hero || !hero.skills || !hero.skills.woodcutting) {
        return null;
    }
    if (!opts.skipTool && !hasTool(hero, WOODCUT_AXE_ID)) {
        return { ok: false, needTool: WOODCUT_AXE_ID, toolName: 'bronze axe' };
    }
    if (!opts.skipItem) {
        if (!addItem(hero, WOODCUT_LOG_ID, 1)) {
            return { ok: false, full: true };
        }
    }
    gainSkillXp(hero, 'woodcutting', WOODCUT_TREE_XP);
    return { ok: true, id: WOODCUT_LOG_ID, xp: WOODCUT_TREE_XP };
}

function mineAtRock(hero, ore, opts) {
    opts = opts || {};
    if (!hero || !hero.skills || !hero.skills.mining) {
        return null;
    }
    ore = ore || 'copper';
    var gate = resourceLevelGate(hero, 'mining', ore);
    if (!gate.ok) {
        return { ok: false, need: gate.need, ore: ore };
    }
    if (!opts.skipTool && !hasTool(hero, MINE_PICK_ID)) {
        return { ok: false, needTool: MINE_PICK_ID, toolName: 'bronze pickaxe', ore: ore };
    }
    if (!opts.skipItem) {
        if (!addItem(hero, ore, 1)) {
            return { ok: false, full: true, ore: ore };
        }
    }
    gainSkillXp(hero, 'mining', MINE_ROCK_XP);
    return { ok: true, xp: MINE_ROCK_XP, ore: ore, id: ore };
}

function grantHunterXp(hero, amount) {
    amount = typeof amount === 'number' ? amount : HUNTER_KILL_XP;
    if (!hero || !hero.skills) {
        return null;
    }
    if (!hero.skills.hunter) {
        hero.skills.hunter = { level: 1, xp: 0 };
    }
    if (amount > 0) {
        gainSkillXp(hero, 'hunter', amount);
    }
    return { ok: true, xp: amount };
}

function tanCowhide(hero, id) {
    id = id || 'cowhide';
    var def = ITEM_DB[id];
    var xp;
    if (!hero || !id || !def || !def.tan) {
        return null;
    }
    if (!takeItem(hero, id, 1)) {
        return null;
    }
    if (!addItem(hero, def.tan, 1)) {
        addItem(hero, id, 1);
        return { ok: false, full: true };
    }
    xp = typeof def.tanXp === 'number' ? def.tanXp : CRAFT_HIDE_XP;
    if (xp > 0) {
        gainSkillXp(hero, 'crafting', xp);
    }
    return { ok: true, id: id, made: def.tan, xp: xp };
}

function stitchLeather(hero) {
    if (!hero || itemQty(hero, 'string') < 1 || itemQty(hero, 'leather') < 1) {
        return null;
    }
    if (!takeItem(hero, 'string', 1)) {
        return null;
    }
    if (!takeItem(hero, 'leather', 1)) {
        addItem(hero, 'string', 1);
        return null;
    }
    if (!addItem(hero, 'gloves', 1)) {
        addItem(hero, 'string', 1);
        addItem(hero, 'leather', 1);
        return { ok: false, full: true };
    }
    if (CRAFT_LEATHER_XP > 0) {
        gainSkillXp(hero, 'crafting', CRAFT_LEATHER_XP);
    }
    return { ok: true, from: 'string', on: 'leather', made: 'gloves', xp: CRAFT_LEATHER_XP };
}

function useItemOnItem(hero, fromId, onId) {
    if (!hero || !fromId || !onId || fromId === onId) {
        return null;
    }
    if ((fromId === 'string' && onId === 'leather') || (fromId === 'leather' && onId === 'string')) {
        return stitchLeather(hero);
    }
    return null;
}

function buryItem(hero, id) {
    var def = ITEM_DB[id];
    var xp;
    if (!hero || !id || !def || !def.bury) {
        return false;
    }
    if (!takeItem(hero, id, 1)) {
        return false;
    }
    xp = typeof def.buryXp === 'number' ? def.buryXp : 0;
    if (xp > 0) {
        gainSkillXp(hero, 'prayer', xp);
    }
    return true;
}

function itemQty(hero, id) {
    if (!hero || !id) {
        return 0;
    }
    var stack = findStack(hero.inventory, id);
    return stack && stack.qty > 0 ? stack.qty : 0;
}

function hasWindStrikeRunes(hero) {
    return itemQty(hero, 'airrune') >= 1 && itemQty(hero, 'mindrune') >= 1;
}

function windStrike(hero) {
    if (!hero || !hasWindStrikeRunes(hero)) {
        return false;
    }
    if (!takeItem(hero, 'airrune', 1)) {
        return false;
    }
    if (!takeItem(hero, 'mindrune', 1)) {
        addItem(hero, 'airrune', 1);
        return false;
    }
    if (WIND_STRIKE_XP > 0) {
        gainSkillXp(hero, 'magic', WIND_STRIKE_XP);
    }
    return true;
}

function equippedWeaponDamage(hero, fallback) {
    var base = typeof fallback === 'number' ? fallback : 0;
    if (!hero || !hero.equipment) {
        return base;
    }
    var id = hero.equipment.weapon;
    if (!id) {
        return base;
    }
    var def = ITEM_DB[id];
    if (def && typeof def.damage === 'number') {
        return def.damage;
    }
    return base;
}

function equippedShieldDefence(hero) {
    if (!hero || !hero.equipment) {
        return 0;
    }
    var id = hero.equipment.shield;
    if (!id) {
        return 0;
    }
    var def = ITEM_DB[id];
    if (def && typeof def.defence === 'number') {
        return def.defence;
    }
    return 0;
}

function equipmentMeleeDefence(hero) {
    if (!hero) {
        return 0;
    }
    ensureEquipment(hero);
    var total = 0;
    for (var i = 0; i < EQUIP_SLOTS.length; i++) {
        var id = hero.equipment[EQUIP_SLOTS[i][0]];
        if (!id) {
            continue;
        }
        var def = ITEM_DB[id];
        if (def && typeof def.defence === 'number') {
            total += def.defence;
        }
    }
    return total;
}

function signedStat(n) {
    n = Number(n) || 0;
    return (n >= 0 ? '+' : '') + String(n);
}

function equipItem(hero, id) {
    if (!hero || !id) {
        return false;
    }
    var slot = itemEquipSlot(id);
    if (!knownEquipSlot(slot)) {
        return false;
    }
    ensureEquipment(hero);
    var current = hero.equipment[slot] || null;
    var takeQty = 1;
    if (slot === 'ammo') {
        var held = findStack(hero.inventory, id);
        takeQty = held ? held.qty : 0;
        if (takeQty < 1) {
            return false;
        }
    }
    if (current === id) {
        if (slot === 'ammo') {
            if (!takeItem(hero, id, takeQty)) {
                return false;
            }
            hero.equipmentQty[slot] = equippedQty(hero, slot) + takeQty;
            return true;
        }
        if (heroHasItem(hero, id)) {
            return takeItem(hero, id, 1);
        }
        return false;
    }
    if (!heroHasItem(hero, id)) {
        return false;
    }
    if (!takeItem(hero, id, takeQty)) {
        return false;
    }
    if (current) {
        var giveQty = slot === 'ammo' ? equippedQty(hero, slot) : 1;
        if (!canAddItem(hero, current)) {
            addItem(hero, id, takeQty);
            return false;
        }
        addItem(hero, current, giveQty);
    }
    hero.equipment[slot] = id;
    hero.equipmentQty[slot] = slot === 'ammo' ? takeQty : 1;
    return true;
}

function unequipItem(hero, slot) {
    if (!hero || !slot) {
        return false;
    }
    if (!knownEquipSlot(slot)) {
        return false;
    }
    ensureEquipment(hero);
    var id = hero.equipment[slot];
    if (!id) {
        return false;
    }
    var qty = equippedQty(hero, slot);
    if (slot === 'ammo') {
        if (!canAddItem(hero, id)) {
            return false;
        }
        addItem(hero, id, qty);
        hero.equipment[slot] = null;
        hero.equipmentQty[slot] = 0;
        return true;
    }
    if (heroHasItem(hero, id)) {
        hero.equipment[slot] = null;
        hero.equipmentQty[slot] = 0;
        return true;
    }
    if (!canAddItem(hero, id)) {
        return false;
    }
    addItem(hero, id, 1);
    hero.equipment[slot] = null;
    hero.equipmentQty[slot] = 0;
    return true;
}

function takeItem(hero, id, qty) {
    qty = qty || 1;
    for (var i = 0; i < hero.inventory.length; i++) {
        if (hero.inventory[i].id === id && hero.inventory[i].qty >= qty) {
            hero.inventory[i].qty -= qty;
            if (hero.inventory[i].qty <= 0) {
                hero.inventory.splice(i, 1);
            }
            if (id === 'coins') {
                hero.gold = Math.max(0, hero.gold - qty);
                syncCoins(hero);
            }
            return true;
        }
    }
    return false;
}

function ensureBank(hero) {
    if (!hero.bank) {
        hero.bank = [];
    }
    return hero.bank;
}

var BANK_TABS = [
    ['all', 'All'],
    ['food', 'Food'],
    ['gear', 'Gear']
];

function bankItemTab(id) {
    var def = ITEM_DB[id];
    if (def && def.heal) {
        return 'food';
    }
    if (def && (def.slot || def.tool || def.damage || def.defence)) {
        return 'gear';
    }
    return 'all';
}

function bankStackMatches(stack, tab, query) {
    if (!stack || !stack.id) {
        return false;
    }
    tab = tab || 'all';
    if (tab !== 'all' && bankItemTab(stack.id) !== tab) {
        return false;
    }
    var q = query == null ? '' : String(query).trim().toLowerCase();
    if (!q) {
        return true;
    }
    var name = itemName(stack.id).toLowerCase();
    return name.indexOf(q) !== -1 || String(stack.id).toLowerCase().indexOf(q) !== -1;
}

function filterBankStacks(list, tab, query) {
    var out = [];
    var i;
    list = list || [];
    for (i = 0; i < list.length; i++) {
        if (bankStackMatches(list[i], tab, query)) {
            out.push(list[i]);
        }
    }
    return out;
}

function findStack(list, id) {
    if (!list) {
        return null;
    }
    for (var i = 0; i < list.length; i++) {
        if (list[i].id === id) {
            return list[i];
        }
    }
    return null;
}

function depositItem(hero, id, qty) {
    qty = qty || 1;
    if (!hero || !id || qty < 1) {
        return false;
    }
    if (!takeItem(hero, id, qty)) {
        return false;
    }
    var bank = ensureBank(hero);
    var stack = findStack(bank, id);
    if (stack) {
        stack.qty += qty;
    } else {
        bank.push({ id: id, qty: qty });
    }
    return true;
}

function withdrawItem(hero, id, qty) {
    qty = Math.floor(Number(qty == null ? 1 : qty));
    if (!hero || !id || !(qty >= 1)) {
        return false;
    }
    var bank = ensureBank(hero);
    var stack = findStack(bank, id);
    if (!stack || stack.qty < qty) {
        return false;
    }
    if (!canAddItem(hero, id)) {
        return false;
    }
    stack.qty -= qty;
    if (stack.qty <= 0) {
        bank.splice(bank.indexOf(stack), 1);
    }
    addItem(hero, id, qty);
    return true;
}

function syncCoins(hero) {
    var found = false;
    for (var i = 0; i < hero.inventory.length; i++) {
        if (hero.inventory[i].id === 'coins') {
            hero.inventory[i].qty = hero.gold;
            found = true;
            if (hero.gold <= 0) {
                hero.inventory.splice(i, 1);
            }
            break;
        }
    }
    if (!found && hero.gold > 0 && hero.inventory.length < INVENTORY_CAP) {
        hero.inventory.unshift({ id: 'coins', qty: hero.gold });
    }
}

function heroSkillLevel(hero, skill) {
    if (!hero || !hero.skills || !hero.skills[skill]) {
        return 1;
    }
    var level = hero.skills[skill].level;
    if (typeof level !== 'number' || level < 1) {
        return 1;
    }
    return level;
}

function skillTotal(hero) {
    var total = 0;
    var i;
    for (i = 0; i < SKILL_NAMES.length; i++) {
        total += heroSkillLevel(hero, SKILL_NAMES[i][0]);
    }
    return total;
}

function combatLevel(hero) {
    var attack = heroSkillLevel(hero, 'attack');
    var strength = heroSkillLevel(hero, 'strength');
    var defence = heroSkillLevel(hero, 'defence');
    var hitpoints = heroSkillLevel(hero, 'hitpoints');
    var prayer = heroSkillLevel(hero, 'prayer');
    var ranged = heroSkillLevel(hero, 'ranged');
    var magic = heroSkillLevel(hero, 'magic');
    var base = 0.25 * (defence + hitpoints + Math.floor(prayer / 2));
    var melee = 0.325 * (attack + strength);
    var range = 0.325 * Math.floor(ranged * 1.5);
    var mage = 0.325 * Math.floor(magic * 1.5);
    var power = melee;
    if (range > power) {
        power = range;
    }
    if (mage > power) {
        power = mage;
    }
    return Math.floor(base + power);
}

function applyCombatLevel(hero, announce) {
    if (!hero) {
        return 1;
    }
    var next = combatLevel(hero);
    var prev = typeof hero.level === 'number' ? hero.level : 0;
    hero.level = next;
    if (announce && next > prev && typeof Hud !== 'undefined' && Hud.log) {
        Hud.log('Your combat level is now ' + next + '.');
    }
    return next;
}

function gainSkillXp(hero, skill, amount) {
    var s = hero.skills[skill];
    if (!s) {
        return;
    }
    s.xp += amount;
    var next = 1 + Math.floor(Math.sqrt(s.xp / 50));
    if (skill === 'hitpoints') {
        next = Math.max(10, next);
    }
    if (next > s.level) {
        s.level = next;
        if (skill === 'hitpoints') {
            hero.maxHp = 10 * s.level;
        }
        var named = SKILL_NAMES.filter(function (n) { return n[0] === skill; })[0];
        if (named) {
            if (typeof showLevelUpModal === 'function') {
                showLevelUpModal(skill, named[1], s.level);
            } else if (typeof Hud !== 'undefined' && Hud.log) {
                Hud.log(named[1] + ' increased to ' + s.level + '.');
            }
        }
    }
    if (amount > 0 && typeof xpDropFloater === 'function') {
        xpDropFloater(skill, amount);
    }
    applyCombatLevel(hero, true);
}

function showLevelUpModal(skill, name, level) {
    if (typeof Hud !== 'undefined' && Hud.showLevelUp) {
        return Hud.showLevelUp(skill, name, level);
    }
    return null;
}

function xpDropFloater(skill, amount) {
    if (typeof Hud !== 'undefined' && Hud.showXpDrop) {
        return Hud.showXpDrop(skill, amount);
    }
    return null;
}

function xpForNextSkillLevel(level) {
    var n = typeof level === 'number' && level >= 1 ? Math.floor(level) : 1;
    return 50 * n * n;
}

function skillXpToNext(skill) {
    var xp = skill && typeof skill.xp === 'number' ? skill.xp : 0;
    var level = skill && typeof skill.level === 'number' && skill.level >= 1
        ? Math.floor(skill.level)
        : 1;
    var remain = xpForNextSkillLevel(level) - xp;
    return remain > 0 ? remain : 0;
}

function skillXpText(name, skill) {
    var xp = skill && typeof skill.xp === 'number' ? skill.xp : 0;
    return name + ': ' + xp + ' XP (' + skillXpToNext(skill) + ' XP to next level)';
}

function itemName(id) {
    return (ITEM_DB[id] && ITEM_DB[id].name) || id;
}

function itemExamineText(id) {
    var def = ITEM_DB[id];
    if (def && def.examine) {
        return def.examine;
    }
    var name = itemName(id);
    return name ? "It's " + name + '.' : '';
}

function itemValue(id) {
    var def = ITEM_DB[id];
    var n = def && def.value;
    if (typeof n !== 'number' || !(n >= 0) || n !== Math.floor(n)) {
        return 0;
    }
    return n;
}

function itemIcon(id) {
    var def = ITEM_DB[id];
    return (def && def.icon) || 'assets/svg/items/coins.svg';
}

function skillIcon(id) {
    return 'assets/svg/skills/' + id + '.svg';
}

function eatItem(hero, id) {
    var def = ITEM_DB[id];
    if (!def || !def.heal) {
        return null;
    }
    if (hero.hp >= hero.maxHp) {
        return null;
    }
    if (!takeItem(hero, id, 1)) {
        return null;
    }
    var healed = Math.min(def.heal, hero.maxHp - hero.hp);
    hero.hp += healed;
    return { name: def.name, heal: healed, amount: def.heal };
}

function eatBestFood(hero) {
    var order = ['shrimp', 'bread'];
    for (var i = 0; i < order.length; i++) {
        var eaten = eatItem(hero, order[i]);
        if (eaten) {
            return eaten;
        }
    }
    return null;
}

function combatSkill(hero) {
    var cls = heroCombatClass(hero);
    if (cls === 'ranged') {
        return 'ranged';
    }
    if (cls === 'magic') {
        return 'magic';
    }
    if (hero && hero.style === 'aggressive') {
        return 'strength';
    }
    if (hero && hero.style === 'defensive') {
        return 'defence';
    }
    return 'attack';
}

function styleHitXp(mobXp, dealt, maxHp) {
    var xp = typeof mobXp === 'number' && mobXp > 0 ? mobXp : 0;
    var hp = typeof maxHp === 'number' && maxHp > 0 ? maxHp : 0;
    var scored = typeof dealt === 'number' ? dealt : 0;
    if (scored < 1 || hp < 1 || xp < 1) {
        return 0;
    }
    if (scored > hp) {
        scored = hp;
    }
    return Math.max(1, Math.round(xp * scored / hp));
}

function hitpointsHitXp(mobXp, dealt, maxHp) {
    var style = styleHitXp(mobXp, dealt, maxHp);
    if (style < 1) {
        return 0;
    }
    return Math.max(1, Math.ceil(style / 3));
}

function enemyMobXp(target) {
    if (target && typeof target.xp === 'number') {
        return target.xp;
    }
    var scene = target && target.scene;
    var world = scene && scene.scene && typeof scene.scene.getScene === 'function'
        ? scene.scene.getScene('WorldScene')
        : null;
    var def = world && world.lastFought && world.lastFought.mobDef;
    if (def && typeof def.xp === 'number') {
        return def.xp;
    }
    return 10;
}

function grantStyleHitXp(hero, target, dealt, hpBefore) {
    if (!hero || !hero.skills) {
        return 0;
    }
    var remaining = typeof hpBefore === 'number' ? hpBefore : (target && target.hp);
    var scored = Math.min(dealt, remaining);
    var mobXp = enemyMobXp(target);
    var maxHp = target && target.maxHp;
    var amount = styleHitXp(mobXp, scored, maxHp);
    if (amount < 1) {
        return 0;
    }
    var skill = combatSkill(hero);
    gainSkillXp(hero, skill, amount);
    if (skill === 'attack' || skill === 'strength' || skill === 'defence' || skill === 'ranged') {
        var hpAmount = hitpointsHitXp(mobXp, scored, maxHp);
        if (hpAmount > 0) {
            gainSkillXp(hero, 'hitpoints', hpAmount);
        }
    }
    if (target && target.scene && target.scene.registry) {
        target.scene.registry.set('hero', hero);
    }
    if (typeof Hud !== 'undefined' && Hud.renderHero) {
        Hud.renderHero(hero);
    }
    return amount;
}

function normalizeCombatClass(value) {
    if (value === 'ranged' || value === 'magic') {
        return value;
    }
    return 'melee';
}

function heroCombatClass(hero) {
    if (rangedWeaponEquipped(hero)) {
        return 'ranged';
    }
    return normalizeCombatClass(hero && hero.stance);
}

function mobCombatClass(spec) {
    if (!spec) {
        return 'melee';
    }
    if (typeof spec === 'string') {
        spec = { type: spec };
    }
    if (spec.combatClass) {
        return normalizeCombatClass(spec.combatClass);
    }
    var type = spec.type;
    if (type === 'Bat') {
        return 'ranged';
    }
    if (type === 'Slime' || type === 'Drake') {
        return 'magic';
    }
    return 'melee';
}

function combatClass(source) {
    if (!source) {
        return 'melee';
    }
    if (source.skills) {
        return heroCombatClass(source);
    }
    if (source.combatClass) {
        return normalizeCombatClass(source.combatClass);
    }
    if (source.mobDef) {
        return mobCombatClass(source.mobDef);
    }
    if (source.type && source.type !== 'You') {
        return mobCombatClass(source);
    }
    return heroCombatClass(source);
}

function triangleMultiplier(attackerClass, defenderClass) {
    var atk = normalizeCombatClass(attackerClass);
    var def = normalizeCombatClass(defenderClass);
    if (atk === def) {
        return 1;
    }
    if ((atk === 'melee' && def === 'ranged') ||
        (atk === 'ranged' && def === 'magic') ||
        (atk === 'magic' && def === 'melee')) {
        return 1.25;
    }
    return 0.75;
}

function triangleHit(amount, attackerClass, defenderClass) {
    var n = Number(amount);
    if (!(n >= 0)) {
        n = 0;
    }
    return Math.max(1, Math.round(n * triangleMultiplier(attackerClass, defenderClass)));
}
