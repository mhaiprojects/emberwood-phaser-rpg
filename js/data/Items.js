var ITEM_DB = {
    coins: { name: 'Coins', icon: 'assets/svg/items/coins.svg', stack: true, value: 1, examine: 'A small pile of copper and silver coins.' },
    shrimp: { name: 'Cooked shrimp', icon: 'assets/svg/items/shrimp.svg', heal: 12, stack: true, value: 5, buyPrice: 8, sellPrice: 2, examine: 'A cooked shrimp, still warm enough to eat.' },
    rawshrimp: { name: 'Raw shrimp', icon: 'assets/svg/items/rawshrimp.svg', stack: true, cook: 'shrimp', burn: 'burntshrimp', cookXp: 30, value: 5, buyPrice: 6, sellPrice: 1, examine: 'A raw shrimp. It should be cooked.' },
    burntshrimp: { name: 'Burnt shrimp', icon: 'assets/svg/items/burntshrimp.svg', stack: true, value: 1, sellPrice: 1, examine: 'A charred shrimp. Inedible.' },
    rawbeef: { name: 'Raw beef', icon: 'assets/svg/items/rawbeef.svg', stack: true, cook: 'beef', burn: 'burntbeef', cookXp: 30, value: 4, sellPrice: 1, examine: 'A cut of raw beef. Better cooked.' },
    beef: { name: 'Cooked beef', icon: 'assets/svg/items/beef.svg', heal: 16, stack: true, value: 8, buyPrice: 12, sellPrice: 3, examine: 'A seared cut of beef.' },
    burntbeef: { name: 'Burnt beef', icon: 'assets/svg/items/burntbeef.svg', stack: true, value: 1, sellPrice: 1, examine: 'Blackened beef. Best left alone.' },
    bread: { name: 'Bread', icon: 'assets/svg/items/bread.svg', heal: 20, stack: true, value: 12, buyPrice: 16, sellPrice: 4, examine: 'A dense loaf baked for the road.' },
    sword: { name: 'Bronze sword', icon: 'assets/svg/items/sword.svg', slot: 'weapon', damage: 16, value: 26, buyPrice: 40, sellPrice: 10, examine: 'A short bronze blade, nicked but serviceable.' },
    bronzedagger: { name: 'Bronze dagger', icon: 'assets/svg/items/bronzedagger.svg', slot: 'weapon', damage: 10, value: 14, buyPrice: 22, sellPrice: 5, examine: 'A short bronze dagger, freshly forged.' },
    shortbow: { name: 'Shortbow', icon: 'assets/svg/items/shortbow.svg', slot: 'weapon', damage: 16, combatClass: 'ranged', value: 32, buyPrice: 48, sellPrice: 12, examine: 'A yew shortbow, light enough for bronze arrows.' },
    arrow: { name: 'Bronze arrows', icon: 'assets/svg/items/arrow.svg', slot: 'ammo', stack: true, value: 1, buyPrice: 2, sellPrice: 1, examine: 'A sheaf of bronze arrows with grey-goose fletching.' },
    shield: { name: 'Wooden shield', icon: 'assets/svg/items/shield.svg', slot: 'shield', defence: 1, value: 20, buyPrice: 30, sellPrice: 8, examine: 'A round wooden shield bound with iron.' },
    bronzeaxe: { name: 'Bronze axe', icon: 'assets/svg/items/bronzeaxe.svg', tool: 'axe', value: 18, buyPrice: 28, sellPrice: 7, examine: 'A bronze axe for chopping trees.' },
    bronzepick: { name: 'Bronze pickaxe', icon: 'assets/svg/items/bronzepick.svg', tool: 'pickaxe', value: 18, buyPrice: 28, sellPrice: 7, examine: 'A bronze pickaxe for mining ore.' },
    net: { name: 'Small fishing net', icon: 'assets/svg/items/net.svg', tool: 'net', value: 8, buyPrice: 12, sellPrice: 3, examine: 'A small fishing net for shrimp.' },
    logs: { name: 'Logs', icon: 'assets/svg/items/logs.svg', stack: true, firemake: true, firemakeXp: 40, value: 2, sellPrice: 1, examine: 'A pile of chopped logs.' },
    copper: { name: 'Copper ore', icon: 'assets/svg/items/copper.svg', stack: true, value: 3, sellPrice: 1, examine: 'A chunk of copper ore.' },
    tin: { name: 'Tin ore', icon: 'assets/svg/items/tin.svg', stack: true, value: 3, sellPrice: 1, examine: 'A chunk of tin ore.' },
    bronzebar: { name: 'Bronze bar', icon: 'assets/svg/items/bronzebar.svg', stack: true, value: 12, sellPrice: 4, examine: 'A smelted bronze bar.' },
    tinderbox: { name: 'Tinderbox', icon: 'assets/svg/items/tinderbox.svg', value: 5, buyPrice: 8, sellPrice: 2, examine: 'A small box of flint and steel.' },
    bones: { name: 'Bones', icon: 'assets/svg/items/bones.svg', stack: true, bury: true, buryXp: 4, shrineXp: 8, value: 1, sellPrice: 1, examine: 'Dry bones. Someone should bury them.' },
    feather: { name: 'Feathers', icon: 'assets/svg/items/feather.svg', stack: true, value: 1, sellPrice: 1, examine: 'Soft feathers from a bird.' },
    rabbitfur: { name: 'Rabbit fur', icon: 'assets/svg/items/rabbitfur.svg', stack: true, value: 3, sellPrice: 1, examine: 'Soft fur from a rabbit. Useful for crafting.' },
    airrune: { name: 'Air rune', icon: 'assets/svg/items/airrune.svg', stack: true, rune: true, value: 4, buyPrice: 6, sellPrice: 1, examine: 'A pale blue rune. It hums with air.' },
    mindrune: { name: 'Mind rune', icon: 'assets/svg/items/mindrune.svg', stack: true, rune: true, value: 3, buyPrice: 5, sellPrice: 1, examine: 'A dull purple rune. It focuses the mind.' },
    key: { name: 'Iron key', icon: 'assets/svg/items/key.svg', value: 1, sellPrice: 1, examine: 'A heavy iron key with a worn bit.' },
    cowhide: { name: 'Cowhide', icon: 'assets/svg/items/cowhide.svg', stack: true, tan: 'leather', tanXp: 14, value: 2, sellPrice: 1, examine: 'A raw cowhide. It can be crafted into leather.' },
    leather: { name: 'Leather', icon: 'assets/svg/items/leather.svg', stack: true, value: 4, sellPrice: 1, examine: 'Soft leather, ready to stitch.' },
    string: { name: 'String', icon: 'assets/svg/items/string.svg', stack: true, value: 1, buyPrice: 2, sellPrice: 1, examine: 'A short length of string for stitching leather.' },
    gloves: { name: 'Leather gloves', icon: 'assets/svg/items/gloves.svg', slot: 'hands', defence: 1, value: 10, buyPrice: 16, sellPrice: 4, examine: 'Stitched leather gloves for the road.' },
    drakescale: { name: 'Drake scale', icon: 'assets/svg/items/drakescale.svg', stack: true, value: 40, sellPrice: 16, examine: 'A warm scale shed by a drake.' },
    firerune: { name: 'Fire rune', icon: 'assets/svg/items/firerune.svg', stack: true, rune: true, value: 4, buyPrice: 6, sellPrice: 1, examine: 'A rune warm to the touch.' },
    waterrune: { name: 'Water rune', icon: 'assets/svg/items/airrune.svg', stack: true, rune: true, value: 4, buyPrice: 6, sellPrice: 1, examine: 'A rune beaded with cold water.' },
    earthrune: { name: 'Earth rune', icon: 'assets/svg/items/mindrune.svg', stack: true, rune: true, value: 4, buyPrice: 6, sellPrice: 1, examine: 'A dusty brown rune.' },
    naturerune: { name: 'Nature rune', icon: 'assets/svg/items/naturerune.svg', stack: true, rune: true, value: 12, buyPrice: 18, sellPrice: 4, examine: 'A green rune used in alchemy.' },
    cluescroll: { name: 'Clue scroll', icon: 'assets/svg/ui/quest.svg', stack: false, questItem: true, value: 0, examine: 'A clue written in fading ink.' },
    guam: { name: 'Guam leaf', icon: 'assets/svg/items/feather.svg', stack: true, value: 2, examine: 'A bitter herb leaf.' },
    attackpot: { name: 'Attack potion', icon: 'assets/svg/items/shrimp.svg', stack: true, value: 12, examine: 'A vial boosting attack briefly.' },
    oakplank: { name: 'Oak plank', icon: 'assets/svg/items/logs.svg', stack: true, value: 6, examine: 'A sawn oak plank.' },
    shortbowunstrung: { name: 'Shortbow (u)', icon: 'assets/svg/items/shortbow.svg', stack: true, value: 8, examine: 'An unstrung shortbow.' },
    shipcrate: { name: 'Lost crate mark', icon: 'assets/svg/items/key.svg', questItem: true, value: 0, examine: 'A wax seal from Ned\'s missing shipment.' },
    batfang: { name: 'Bat fang', icon: 'assets/svg/items/bones.svg', questItem: true, value: 0, examine: 'Proof a Darkmine bat was cleared.' }
};

var GENERAL_SHOP_KEY = 'mira';
var WEAPON_SHOP_KEY = 'arms';
var GENERAL_SHOP_STOCK = [
    { id: 'shrimp', stock: 10, restockTo: 10, restockMs: 45000 },
    { id: 'bread', stock: 5, restockTo: 5, restockMs: 60000 },
    { id: 'tinderbox', stock: 3, restockTo: 3, restockMs: 90000 },
    { id: 'net', stock: 2, restockTo: 2, restockMs: 90000 },
    { id: 'bronzeaxe', stock: 1, restockTo: 1, restockMs: 120000 },
    { id: 'bronzepick', stock: 1, restockTo: 1, restockMs: 120000 },
    { id: 'string', stock: 8, restockTo: 8, restockMs: 60000 },
    { id: 'firerune', stock: 20, restockTo: 20, restockMs: 45000 },
    { id: 'naturerune', stock: 10, restockTo: 10, restockMs: 60000 }
];
var WEAPON_SHOP_STOCK = [
    { id: 'bronzedagger', stock: 4, restockTo: 4, restockMs: 90000 },
    { id: 'sword', stock: 2, restockTo: 2, restockMs: 120000 },
    { id: 'shield', stock: 2, restockTo: 2, restockMs: 120000 },
    { id: 'shortbow', stock: 1, restockTo: 1, restockMs: 120000 },
    { id: 'arrow', stock: 40, restockTo: 40, restockMs: 45000 }
];
var SHOP_CATALOG = {};
SHOP_CATALOG[GENERAL_SHOP_KEY] = GENERAL_SHOP_STOCK;
SHOP_CATALOG[WEAPON_SHOP_KEY] = WEAPON_SHOP_STOCK;
var shopStates = {};
var HIGH_ALCH_XP = 12;

function itemBuyPrice(id) {
    var def = ITEM_DB[id];
    if (!def || id === 'coins') {
        return 0;
    }
    if (typeof def.buyPrice === 'number') {
        return def.buyPrice;
    }
    if (typeof def.value === 'number') {
        return Math.max(1, def.value * 2);
    }
    return 0;
}

function isQuestItem(id) {
    var def = ITEM_DB[id];
    return !!(def && def.questItem);
}

function itemSellPrice(id) {
    var def = ITEM_DB[id];
    if (!def || id === 'coins' || def.questItem) {
        return 0;
    }
    if (typeof def.sellPrice === 'number') {
        return def.sellPrice;
    }
    if (typeof def.value === 'number') {
        return Math.max(1, Math.floor(def.value * 0.4));
    }
    return 0;
}

function ensureShopState(key) {
    var i;
    var row;
    var state;
    var catalog;
    key = key || GENERAL_SHOP_KEY;
    state = shopStates[key];
    if (!state) {
        catalog = SHOP_CATALOG[key] || GENERAL_SHOP_STOCK;
        state = { key: key, rows: [] };
        for (i = 0; i < catalog.length; i++) {
            row = catalog[i];
            state.rows.push({
                id: row.id,
                stock: row.stock,
                restockTo: row.restockTo,
                restockMs: row.restockMs,
                nextRestock: 0
            });
        }
        shopStates[key] = state;
    }
    return state;
}

function tickShopRestock(key, now) {
    var state = ensureShopState(key);
    var i;
    var row;
    now = typeof now === 'number' ? now : Date.now();
    for (i = 0; i < state.rows.length; i++) {
        row = state.rows[i];
        if (row.stock >= row.restockTo) {
            row.nextRestock = 0;
            continue;
        }
        if (!row.nextRestock) {
            row.nextRestock = now + row.restockMs;
            continue;
        }
        if (now >= row.nextRestock) {
            row.stock += 1;
            row.nextRestock = row.stock >= row.restockTo ? 0 : now + row.restockMs;
        }
    }
    return state;
}

function shopStockRows(key, now) {
    var state = tickShopRestock(key, now);
    var out = [];
    var i;
    var row;
    for (i = 0; i < state.rows.length; i++) {
        row = state.rows[i];
        out.push({
            id: row.id,
            stock: row.stock,
            buyPrice: itemBuyPrice(row.id),
            name: itemName(row.id)
        });
    }
    return out;
}

function shopFindRow(key, id) {
    var state = ensureShopState(key);
    var i;
    for (i = 0; i < state.rows.length; i++) {
        if (state.rows[i].id === id) {
            return state.rows[i];
        }
    }
    return null;
}

function buyFromShop(hero, key, id, qty, now) {
    var row;
    var price;
    var cost;
    var i;
    qty = Math.floor(Number(qty == null ? 1 : qty));
    if (!hero || !id || !(qty >= 1)) {
        return { ok: false };
    }
    tickShopRestock(key, now);
    row = shopFindRow(key, id);
    if (!row) {
        return { ok: false, missing: true };
    }
    if (row.stock < qty) {
        return { ok: false, stock: true };
    }
    price = itemBuyPrice(id);
    if (!(price > 0)) {
        return { ok: false };
    }
    cost = price * qty;
    if (hero.gold < cost) {
        return { ok: false, gold: true, need: cost };
    }
    if (!canAddItem(hero, id)) {
        return { ok: false, full: true };
    }
    if (!takeItem(hero, 'coins', cost)) {
        return { ok: false, gold: true, need: cost };
    }
    if (!addItem(hero, id, qty)) {
        addItem(hero, 'coins', cost);
        return { ok: false, full: true };
    }
    row.stock -= qty;
    if (row.stock < row.restockTo && !row.nextRestock) {
        row.nextRestock = (typeof now === 'number' ? now : Date.now()) + row.restockMs;
    }
    syncCoins(hero);
    return { ok: true, id: id, qty: qty, cost: cost, stock: row.stock };
}

function sellToShop(hero, key, id, qty) {
    var row;
    var price;
    var earned;
    qty = Math.floor(Number(qty == null ? 1 : qty));
    if (!hero || !id || id === 'coins' || !(qty >= 1)) {
        return { ok: false };
    }
    price = itemSellPrice(id);
    if (!(price > 0)) {
        return { ok: false, unsellable: true };
    }
    if (itemQty(hero, id) < qty) {
        return { ok: false, need: true };
    }
    if (!takeItem(hero, id, qty)) {
        return { ok: false, need: true };
    }
    earned = price * qty;
    addItem(hero, 'coins', earned);
    row = shopFindRow(key, id);
    if (row) {
        row.stock += qty;
    }
    syncCoins(hero);
    return { ok: true, id: id, qty: qty, earned: earned };
}

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
var SMELT_BRONZE_XP = 18;
var SMITH_DAGGER_XP = 22;
var FIREMAKE_XP = 40;
var FIRE_DURATION_MS = 45000;
var COOK_BURN_BASE = 0.52;
var COOK_BURN_PER_LEVEL = 0.045;
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
    ['smithing', 'Smithing'],
    ['hunter', 'Hunter'],
    ['agility', 'Agility'],
    ['thieving', 'Thieving'],
    ['slayer', 'Slayer'],
    ['runecraft', 'Runecraft'],
    ['farming', 'Farming'],
    ['herblore', 'Herblore'],
    ['fletching', 'Fletching'],
    ['construction', 'Construction']
];

var STRETCH_SKILL_NAMES = [];

function isStretchSkill(id) {
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
        hideBones: false,
        displayName: 'Adventurer',
        ironman: false,
        prayerPoints: 1,
        maxPrayerPoints: 1,
        specialEnergy: 100,
        poison: null,
        slayerTask: null,
        clueStep: 0,
        clanTag: 'ember',
        prayers: { thickskin: false, burststrength: false },
        hiscores: { kills: 0, quests: 0 },
        sideQuests: {
            shipment: { stage: 0, progress: 0, goal: 3 },
            bats: { stage: 0, progress: 0, goal: 4 }
        },
        diary: { bram: false, eat: false, bury: false, complete: false },
        tutorials: {},
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
            smithing: { level: 1, xp: 0 },
            hunter: { level: 1, xp: 0 },
            agility: { level: 1, xp: 0 },
            thieving: { level: 1, xp: 0 },
            slayer: { level: 1, xp: 0 },
            runecraft: { level: 1, xp: 0 },
            farming: { level: 1, xp: 0 },
            herblore: { level: 1, xp: 0 },
            fletching: { level: 1, xp: 0 },
            construction: { level: 1, xp: 0 }
        }
    };
    applyCombatLevel(hero, false);
    return hero;
}

function makeIronmanHero() {
    var hero = makeHero();
    hero.ironman = true;
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
        return kind === 'range' ? 'range' : 'fire';
    }
    return kind || '';
}

function cookBurnChance(hero, id) {
    var level = heroSkillLevel(hero, 'cooking');
    var chance = COOK_BURN_BASE - (level - 1) * COOK_BURN_PER_LEVEL;
    if (chance < 0) {
        chance = 0;
    }
    if (chance > 0.85) {
        chance = 0.85;
    }
    return chance;
}

function cookRollBurn(hero, id, rand) {
    var roll = typeof rand === 'function' ? rand() : (typeof rand === 'number' ? rand : Math.random());
    return roll < cookBurnChance(hero, id);
}

function useItemOnScenery(hero, id, kind, opts) {
    var def = ITEM_DB[id];
    var xp;
    var product;
    var burned;
    if (!hero || !id || !def || !itemCanUseOn(id, kind)) {
        return null;
    }
    if (!takeItem(hero, id, 1)) {
        return null;
    }
    if (def.bury && kind === 'shrine') {
        xp = typeof def.shrineXp === 'number' ? def.shrineXp : (typeof def.buryXp === 'number' ? def.buryXp : 0);
        if (xp > 0) {
            gainSkillXp(hero, 'prayer', xp);
        }
        return { ok: true, id: id, kind: kind, buried: true, xp: xp };
    }
    if (def.cook && (kind === 'range' || kind === 'fire')) {
        burned = cookRollBurn(hero, id, opts && opts.rand);
        product = burned ? (def.burn || null) : def.cook;
        if (!product) {
            addItem(hero, id, 1);
            return { ok: false };
        }
        if (!addItem(hero, product, 1)) {
            addItem(hero, id, 1);
            return { ok: false, full: true };
        }
        if (!burned) {
            xp = typeof def.cookXp === 'number' ? def.cookXp : 0;
            if (xp > 0) {
                gainSkillXp(hero, 'cooking', xp);
            }
        }
        return {
            ok: true,
            id: id,
            kind: kind,
            cooked: burned ? null : def.cook,
            burned: burned ? product : null,
            xp: burned ? 0 : xp
        };
    }
    return { ok: true, id: id, kind: kind, cooked: null };
}

function lightGroundFire(hero) {
    var xp;
    if (!hero) {
        return null;
    }
    if (!heroHasItem(hero, 'tinderbox')) {
        return { ok: false, need: 'tinderbox' };
    }
    if (itemQty(hero, 'logs') < 1) {
        return { ok: false, need: 'logs' };
    }
    if (!takeItem(hero, 'logs', 1)) {
        return { ok: false, need: 'logs' };
    }
    xp = FIREMAKE_XP;
    if (ITEM_DB.logs && typeof ITEM_DB.logs.firemakeXp === 'number') {
        xp = ITEM_DB.logs.firemakeXp;
    }
    if (xp > 0) {
        gainSkillXp(hero, 'firemaking', xp);
    }
    return { ok: true, groundFire: true, xp: xp, durationMs: FIRE_DURATION_MS };
}

function firemakeAt(hero) {
    return lightGroundFire(hero);
}

function lightFire(hero) {
    return lightGroundFire(hero);
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

function useItemOnItem(hero, fromId, onId, opts) {
    if (!hero || !fromId || !onId || fromId === onId) {
        return null;
    }
    if ((fromId === 'string' && onId === 'leather') || (fromId === 'leather' && onId === 'string')) {
        return stitchLeather(hero);
    }
    if ((fromId === 'tinderbox' && onId === 'logs') || (fromId === 'logs' && onId === 'tinderbox')) {
        if (opts && opts.canLightFire === false) {
            return { ok: false, blocked: true };
        }
        return lightGroundFire(hero);
    }
    return null;
}

function listCookableIds(hero) {
    var out = [];
    var inv = hero && hero.inventory ? hero.inventory : [];
    var seen = {};
    var i;
    for (i = 0; i < inv.length; i++) {
        var stack = inv[i];
        if (!stack || !stack.id || seen[stack.id]) {
            continue;
        }
        var def = ITEM_DB[stack.id];
        if (def && def.cook) {
            seen[stack.id] = true;
            out.push(stack.id);
        }
    }
    return out;
}

function cookAtStation(hero, id, kind) {
    return useItemOnScenery(hero, id, kind || 'range');
}

function smeltBronze(hero) {
    if (!hero) {
        return null;
    }
    if (itemQty(hero, 'copper') < 1 || itemQty(hero, 'tin') < 1) {
        return { ok: false, need: 'ores' };
    }
    if (!takeItem(hero, 'copper', 1)) {
        return null;
    }
    if (!takeItem(hero, 'tin', 1)) {
        addItem(hero, 'copper', 1);
        return null;
    }
    if (!addItem(hero, 'bronzebar', 1)) {
        addItem(hero, 'copper', 1);
        addItem(hero, 'tin', 1);
        return { ok: false, full: true };
    }
    if (SMELT_BRONZE_XP > 0) {
        gainSkillXp(hero, 'smithing', SMELT_BRONZE_XP);
    }
    return { ok: true, made: 'bronzebar', xp: SMELT_BRONZE_XP };
}

function smithBronzeDagger(hero) {
    if (!hero) {
        return null;
    }
    if (itemQty(hero, 'bronzebar') < 1) {
        return { ok: false, need: 'bar' };
    }
    if (!takeItem(hero, 'bronzebar', 1)) {
        return null;
    }
    if (!addItem(hero, 'bronzedagger', 1)) {
        addItem(hero, 'bronzebar', 1);
        return { ok: false, full: true };
    }
    if (SMITH_DAGGER_XP > 0) {
        gainSkillXp(hero, 'smithing', SMITH_DAGGER_XP);
    }
    return { ok: true, made: 'bronzedagger', xp: SMITH_DAGGER_XP };
}

function stationRecipesFor(kind, hero) {
    var rows = [];
    var i;
    if (kind === 'range' || kind === 'fire') {
        var cookIds = listCookableIds(hero);
        for (i = 0; i < cookIds.length; i++) {
            var cid = cookIds[i];
            var cdef = ITEM_DB[cid] || {};
            rows.push({
                id: 'cook:' + cid,
                label: 'Cook ' + (cdef.name || cid),
                enabled: true
            });
        }
        if (!rows.length) {
            rows.push({ id: 'cook:none', label: 'No raw food to cook', enabled: false });
        }
        return rows;
    }
    if (kind === 'stall') {
        rows.push({
            id: 'tan:cowhide',
            label: 'Tan cowhide',
            enabled: itemQty(hero, 'cowhide') > 0
        });
        rows.push({
            id: 'stitch:gloves',
            label: 'Stitch leather gloves',
            enabled: itemQty(hero, 'leather') > 0 && itemQty(hero, 'string') > 0
        });
        return rows;
    }
    if (kind === 'furnace') {
        rows.push({
            id: 'smelt:bronzebar',
            label: 'Smelt bronze bar (copper + tin)',
            enabled: itemQty(hero, 'copper') > 0 && itemQty(hero, 'tin') > 0
        });
        return rows;
    }
    if (kind === 'anvil') {
        rows.push({
            id: 'smith:bronzedagger',
            label: 'Smith bronze dagger (1 bar)',
            enabled: itemQty(hero, 'bronzebar') > 0
        });
        return rows;
    }
    return rows;
}

function runStationRecipe(hero, kind, recipeId) {
    var parts;
    var result;
    if (!hero || !kind || !recipeId) {
        return null;
    }
    if ((kind === 'range' || kind === 'fire') && recipeId.indexOf('cook:') === 0) {
        parts = recipeId.split(':');
        if (!parts[1] || parts[1] === 'none') {
            return { ok: false, empty: true };
        }
        result = cookAtStation(hero, parts[1], kind === 'fire' ? 'fire' : 'range');
        if (!result) {
            return { ok: false };
        }
        return result;
    }
    if (kind === 'stall') {
        if (recipeId === 'tan:cowhide') {
            result = tanCowhide(hero, 'cowhide');
            if (!result) {
                return { ok: false, need: 'cowhide' };
            }
            return result;
        }
        if (recipeId === 'stitch:gloves') {
            result = stitchLeather(hero);
            if (!result) {
                return { ok: false, need: 'materials' };
            }
            return result;
        }
    }
    if (kind === 'furnace' && recipeId === 'smelt:bronzebar') {
        return smeltBronze(hero);
    }
    if (kind === 'anvil' && recipeId === 'smith:bronzedagger') {
        return smithBronzeDagger(hero);
    }
    return null;
}

function buryItem(hero, id) {
    var def = ITEM_DB[id];
    var xp;
    var level;
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
    level = heroSkillLevel(hero, 'prayer');
    hero.maxPrayerPoints = level;
    if (typeof hero.prayerPoints !== 'number' || hero.prayerPoints < level) {
        hero.prayerPoints = level;
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

function hasHighAlchRunes(hero) {
    return itemQty(hero, 'firerune') >= 5 && itemQty(hero, 'naturerune') >= 1;
}

function highAlchValue(id) {
    var def = ITEM_DB[id];
    var value;
    if (!def || id === 'coins' || id === 'naturerune' || id === 'firerune') {
        return 0;
    }
    value = typeof def.value === 'number' ? def.value : 0;
    return Math.max(1, Math.floor(value * 0.6));
}

function highAlchItem(hero, id) {
    var coins;
    if (!hero || !id) {
        return null;
    }
    if (!hasHighAlchRunes(hero)) {
        return { ok: false, need: 'runes' };
    }
    coins = highAlchValue(id);
    if (!(coins > 0) || !heroHasItem(hero, id)) {
        return { ok: false };
    }
    if (!takeItem(hero, 'naturerune', 1)) {
        return { ok: false, need: 'runes' };
    }
    if (!takeItem(hero, 'firerune', 5)) {
        addItem(hero, 'naturerune', 1);
        return { ok: false, need: 'runes' };
    }
    if (!takeItem(hero, id, 1)) {
        addItem(hero, 'naturerune', 1);
        addItem(hero, 'firerune', 5);
        return { ok: false };
    }
    addItem(hero, 'coins', coins);
    if (HIGH_ALCH_XP > 0) {
        gainSkillXp(hero, 'magic', HIGH_ALCH_XP);
    }
    syncCoins(hero);
    return { ok: true, id: id, coins: coins, xp: HIGH_ALCH_XP };
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

var WATER_STRIKE_XP = 6;
var EARTH_STRIKE_XP = 7;
var FIRE_STRIKE_XP = 8;
var WATER_STRIKE_DAMAGE = 4;
var EARTH_STRIKE_DAMAGE = 5;
var FIRE_STRIKE_DAMAGE = 6;

function hasWaterStrikeRunes(hero) {
    return itemQty(hero, 'airrune') >= 1 && itemQty(hero, 'waterrune') >= 1;
}

function waterStrike(hero) {
    if (!hero || !hasWaterStrikeRunes(hero)) {
        return false;
    }
    if (!takeItem(hero, 'airrune', 1) || !takeItem(hero, 'waterrune', 1)) {
        return false;
    }
    gainSkillXp(hero, 'magic', WATER_STRIKE_XP);
    return true;
}

function hasEarthStrikeRunes(hero) {
    return itemQty(hero, 'airrune') >= 1 && itemQty(hero, 'earthrune') >= 1;
}

function earthStrike(hero) {
    if (!hero || !hasEarthStrikeRunes(hero)) {
        return false;
    }
    if (!takeItem(hero, 'airrune', 1) || !takeItem(hero, 'earthrune', 1)) {
        return false;
    }
    gainSkillXp(hero, 'magic', EARTH_STRIKE_XP);
    return true;
}

function hasFireStrikeRunes(hero) {
    return itemQty(hero, 'airrune') >= 1 && itemQty(hero, 'firerune') >= 1;
}

function fireStrike(hero) {
    if (!hero || !hasFireStrikeRunes(hero)) {
        return false;
    }
    if (!takeItem(hero, 'airrune', 1) || !takeItem(hero, 'firerune', 1)) {
        return false;
    }
    gainSkillXp(hero, 'magic', FIRE_STRIKE_XP);
    return true;
}

function spellCastFn(spellId) {
    var map = {
        windstrike: {
            label: 'Wind Strike',
            damage: typeof WIND_STRIKE_DAMAGE === 'number' ? WIND_STRIKE_DAMAGE : 2,
            xp: typeof WIND_STRIKE_XP === 'number' ? WIND_STRIKE_XP : 0,
            needMsg: 'You do not have the runes for Wind Strike.',
            fn: windStrike
        },
        waterstrike: {
            label: 'Water Strike',
            damage: WATER_STRIKE_DAMAGE,
            xp: WATER_STRIKE_XP,
            needMsg: 'You need Air and Water runes.',
            fn: waterStrike
        },
        earthstrike: {
            label: 'Earth Strike',
            damage: EARTH_STRIKE_DAMAGE,
            xp: EARTH_STRIKE_XP,
            needMsg: 'You need Air and Earth runes.',
            fn: earthStrike
        },
        firestrike: {
            label: 'Fire Strike',
            damage: FIRE_STRIKE_DAMAGE,
            xp: FIRE_STRIKE_XP,
            needMsg: 'You need Air and Fire runes.',
            fn: fireStrike
        }
    };
    var spec = map[spellId];
    if (!spec) {
        return null;
    }
    return function (hero) {
        if (!spec.fn(hero)) {
            return null;
        }
        return spec;
    };
}

function pickpocketNpc(hero) {
    if (!hero) {
        return false;
    }
    if (hero.ironman) {
        return false;
    }
    var gold = Phaser.Math.Between(2, 12);
    if (!addItem(hero, 'coins', gold)) {
        return false;
    }
    syncCoins(hero);
    gainSkillXp(hero, 'thieving', 12);
    return gold;
}

function assignSlayerTask(hero) {
    if (!hero) {
        return null;
    }
    var types = ['Goblin', 'Chicken', 'Skeleton', 'Bat'];
    var pick = types[Phaser.Math.Between(0, types.length - 1)];
    hero.slayerTask = { type: pick, left: 3, total: 3 };
    return hero.slayerTask;
}

function noteSlayerKill(hero, mobType) {
    if (!hero || !hero.slayerTask || hero.slayerTask.type !== mobType) {
        return false;
    }
    hero.slayerTask.left = Math.max(0, hero.slayerTask.left - 1);
    gainSkillXp(hero, 'slayer', 15);
    if (hero.slayerTask.left === 0) {
        addItem(hero, 'coins', 25);
        syncCoins(hero);
        hero.slayerTask = null;
        return true;
    }
    return false;
}

function craftAirRune(hero) {
    if (!hero || hero.gold < 1) {
        return false;
    }
    hero.gold -= 1;
    syncCoins(hero);
    if (!addItem(hero, 'airrune', 1)) {
        hero.gold += 1;
        syncCoins(hero);
        return false;
    }
    gainSkillXp(hero, 'runecraft', 10);
    return true;
}

function plantGuamSeed(hero) {
    if (!hero) {
        return false;
    }
    gainSkillXp(hero, 'farming', 14);
    if (!addItem(hero, 'guam', 1)) {
        return false;
    }
    return true;
}

function mixAttackPotion(hero) {
    if (!hero || itemQty(hero, 'guam') < 1) {
        return false;
    }
    takeItem(hero, 'guam', 1);
    if (!addItem(hero, 'attackpot', 1)) {
        addItem(hero, 'guam', 1);
        return false;
    }
    gainSkillXp(hero, 'herblore', 18);
    return true;
}

function fletchShortbow(hero) {
    if (!hero || itemQty(hero, 'logs') < 1 || itemQty(hero, 'string') < 1) {
        return false;
    }
    takeItem(hero, 'logs', 1);
    takeItem(hero, 'string', 1);
    if (!addItem(hero, 'shortbowunstrung', 1)) {
        addItem(hero, 'logs', 1);
        addItem(hero, 'string', 1);
        return false;
    }
    gainSkillXp(hero, 'fletching', 16);
    return true;
}

function buildOakBench(hero) {
    if (!hero || itemQty(hero, 'logs') < 3) {
        return false;
    }
    takeItem(hero, 'logs', 3);
    if (!addItem(hero, 'oakplank', 1)) {
        addItem(hero, 'logs', 3);
        return false;
    }
    gainSkillXp(hero, 'construction', 20);
    return true;
}

var CLUE_DIG_SPOTS = [
    { zone: 'haven', x: 400, y: 250 },
    { zone: 'northwood', x: 160, y: 120 },
    { zone: 'graves', x: 300, y: 210 }
];

function clueDigSpot(hero) {
    var step = hero && typeof hero.clueStep === 'number' ? hero.clueStep : 0;
    return CLUE_DIG_SPOTS[step % CLUE_DIG_SPOTS.length];
}

function advanceClueDig(hero, world) {
    if (!hero || !world || itemQty(hero, 'cluescroll') < 1) {
        return false;
    }
    var spot = clueDigSpot(hero);
    if (world.zoneId !== spot.zone) {
        return false;
    }
    if (Phaser.Math.Distance.Between(world.player.x, world.player.y, spot.x, spot.y) > 28) {
        return false;
    }
    hero.clueStep += 1;
    if (hero.clueStep >= CLUE_DIG_SPOTS.length) {
        takeItem(hero, 'cluescroll', 1);
        addItem(hero, 'coins', 50);
        syncCoins(hero);
        hero.clueStep = 0;
        return 'casket';
    }
    return 'step';
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

function ensureSkill(hero, skill) {
    if (!hero) {
        return null;
    }
    if (!hero.skills) {
        hero.skills = {};
    }
    if (!hero.skills[skill]) {
        hero.skills[skill] = { level: 1, xp: 0 };
    }
    return hero.skills[skill];
}

function gainSkillXp(hero, skill, amount) {
    var s = ensureSkill(hero, skill);
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
