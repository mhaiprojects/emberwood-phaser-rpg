/* ITEM_DB / shops / recipes / gather maps from js/content/*-data.js */
if (typeof ITEM_DB === 'undefined') { var ITEM_DB = {}; }
if (typeof GENERAL_SHOP_KEY === 'undefined') { var GENERAL_SHOP_KEY = 'mira'; }
if (typeof WEAPON_SHOP_KEY === 'undefined') { var WEAPON_SHOP_KEY = 'arms'; }
if (typeof GENERAL_SHOP_STOCK === 'undefined') { var GENERAL_SHOP_STOCK = []; }
if (typeof WEAPON_SHOP_STOCK === 'undefined') { var WEAPON_SHOP_STOCK = []; }
if (typeof RESOURCE_LEVEL === 'undefined') { var RESOURCE_LEVEL = {}; }
if (typeof RESOURCE_TOOL_TIER === 'undefined') { var RESOURCE_TOOL_TIER = {}; }
if (typeof TREE_BY_ZONE === 'undefined') { var TREE_BY_ZONE = {}; }
if (typeof FISH_BY_ZONE === 'undefined') { var FISH_BY_ZONE = {}; }
if (typeof SMELT_RECIPES === 'undefined') { var SMELT_RECIPES = []; }
if (typeof SMITH_RECIPES === 'undefined') { var SMITH_RECIPES = []; }
if (typeof CRAFT_RECIPES === 'undefined') { var CRAFT_RECIPES = []; }

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
/* Gather/craft timings + XP amounts: Balance syncs FISH_* / WOODCUT_* / MINE_* / FIRE_* globals. */
var FISH_CATCH_ID = 'rawshrimp';
var FISH_NET_ID = 'net';
var WOODCUT_LOG_ID = 'logs';
var WOODCUT_AXE_ID = 'copperaxe';
var MINE_PICK_ID = 'copperpick';
var COOK_BURN_BASE = 0.52;
var COOK_BURN_PER_LEVEL = 0.045;
/* Min toolTier for gather jobs (higher tiers always OK). */
/* Align woodcutting with zone difficulty bands. */
/* Primary fish catch per zone (spots added in MapGen/WorldScene). */
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
    ['cape', 'Cape'],
    ['neck', 'Neck'],
    ['ammo', 'Ammo'],
    ['weapon', 'Weapon'],
    ['armour', 'Armour'],
    ['shield', 'Shield'],
    ['hands', 'Hands'],
    ['feet', 'Feet'],
    ['ring', 'Ring']
];

var LEGACY_ITEM_ID_MAP = {
    sword: 'coppersword',
    bronzedagger: 'copperdagger',
    bronzeaxe: 'copperaxe',
    bronzepick: 'copperpick',
    bronzestaff: 'copperstaff',
    bronzebar: 'copperbar',
    shortbow: 'copperbow',
    arrow: 'copperarrow',
    tin: 'copper',
    mindrune: 'airrune',
    naturerune: 'firerune',
    wizardhat: 'wizardrobe',
    ironhelm: 'ironarmour',
    ironbody: 'ironarmour',
    ironlegs: 'ironarmour',
    diamondhelm: 'diamondarmour',
    diamondbody: 'diamondarmour',
    diamondlegs: 'diamondarmour',
    dragonitehelm: 'dragonitearmour',
    dragonitebody: 'dragonitearmour',
    dragonitelegs: 'dragonitearmour',
    burntshrimp: null,
    burntbeef: null,
    shipcrate: null
};

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

function magicWeaponEquipped(hero) {
    if (!hero || !hero.equipment || !hero.equipment.weapon) {
        return false;
    }
    var def = ITEM_DB[hero.equipment.weapon];
    return !!(def && def.combatClass === 'magic');
}

function bowTier(hero) {
    var def = hero && hero.equipment && ITEM_DB[hero.equipment.weapon];
    return def && typeof def.bowTier === 'number' ? def.bowTier : 1;
}

function ammoTier(id) {
    var def = ITEM_DB[id];
    return def && typeof def.ammoTier === 'number' ? def.ammoTier : 1;
}

/* No equipped ammo → infinite wooden arrows. Other ammo is consumed. */
function usingInfiniteWoodArrows(hero) {
    if (!rangedWeaponEquipped(hero)) {
        return false;
    }
    ensureEquipment(hero);
    return !hero.equipment.ammo;
}

function canShoot(hero) {
    var ammoId;
    if (!rangedWeaponEquipped(hero)) {
        return false;
    }
    if (usingInfiniteWoodArrows(hero)) {
        return true;
    }
    ammoId = hero.equipment.ammo;
    if (!ammoId || equippedQty(hero, 'ammo') < 1) {
        return false;
    }
    if (ammoTier(ammoId) > bowTier(hero)) {
        return false;
    }
    return true;
}

function consumeAmmo(hero) {
    if (!hero) {
        return false;
    }
    ensureEquipment(hero);
    if (usingInfiniteWoodArrows(hero)) {
        return true;
    }
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

/* Chebyshev tiles for proximity auto-attack engage (not weapon attack range). */
var DEFAULT_AUTO_ATTACK_RANGE_TILES = 3;
var AUTO_ATTACK_RANGE_MIN = 1;
var AUTO_ATTACK_RANGE_MAX = 5;

function makeHero() {
    var hero = {
        hp: 100,
        maxHp: 100,
        damage: 16,
        gold: 8,
        level: 1,
        style: 'shared',
        stance: 'melee',
        autoAttack: false,
        autoAttackRange: DEFAULT_AUTO_ATTACK_RANGE_TILES,
        autoRetaliate: false,
        autoPickup: true,
        shiftClickDrop: true,
        hideBones: false,
        showCombatVisuals: true,
        showRangeRings: true,
        mobSpawnModifier: typeof MOB_SPAWN_MODIFIER === 'number' ? MOB_SPAWN_MODIFIER : 1,
        simTps: typeof normalizeTargetTps === 'function' ? normalizeTargetTps(60) : 60,
        targetTps: typeof normalizeTargetTps === 'function' ? normalizeTargetTps(60) : 60,
        gameSpeed: typeof normalizeGameSpeed === 'function' ? normalizeGameSpeed(1) : 1,
        xpMultiplier: typeof normalizeXpMultiplier === 'function' ? normalizeXpMultiplier(1) : 1,
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
        flags: { dragonDenOpen: false },
        tutorials: {},
        running: false,
        runEnergy: 100,
        equipment: (function () {
            var eq = emptyEquipment();
            eq.weapon = 'coppersword';
            eq.shield = 'shield';
            return eq;
        }()),
        equipmentQty: {},
        inventory: [
            { id: 'coins', qty: 8 },
            { id: 'coppersword', qty: 1 },
            { id: 'shield', qty: 1 },
            { id: 'copperbow', qty: 1 },
            { id: 'staff', qty: 1 },
            { id: 'copperaxe', qty: 1 },
            { id: 'copperpick', qty: 1 },
            { id: 'airrune', qty: 40 },
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
    return normalizeHeroCombat(hero);
}

function makeIronmanHero() {
    var hero = makeHero();
    hero.ironman = true;
    return hero;
}

function autoRetaliateOn(hero) {
    return !!(hero && hero.autoRetaliate);
}

function autoAttackOn(hero) {
    return !!(hero && hero.autoAttack);
}

function autoAttackRangeTiles(hero) {
    var v = hero && typeof hero.autoAttackRange === 'number'
        ? hero.autoAttackRange
        : DEFAULT_AUTO_ATTACK_RANGE_TILES;
    if (!(v >= AUTO_ATTACK_RANGE_MIN) || v > AUTO_ATTACK_RANGE_MAX) {
        return DEFAULT_AUTO_ATTACK_RANGE_TILES;
    }
    return Math.floor(v);
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

function itemIsMaterial(id) {
    var def = ITEM_DB[id];
    if (!def || !id) {
        return false;
    }
    if (def.tool || def.cook || def.firemake || def.rune || def.tan) {
        return true;
    }
    if (id === 'tinderbox' || id === 'string' || id === 'leather' || id === 'feather'
            || id === 'rabbitfur' || id === 'guam' || id === 'drakescale'
            || id === 'runeessence' || id === 'oakplank' || id === 'shortbowunstrung') {
        return true;
    }
    if (id === 'copper' || id === 'iron' || id === 'diamondore' || id === 'dragoniteore') {
        return true;
    }
    if (id.indexOf('bar') === id.length - 3 || id.indexOf('logs') >= 0) {
        return true;
    }
    return false;
}

function itemDefaultVerb(id) {
    var def = ITEM_DB[id];
    var equip;
    if (!def) {
        return null;
    }
    if (def.heal) {
        return 'eat';
    }
    if (def.drink || id === 'attackpot') {
        return 'drink';
    }
    equip = itemEquipVerb(id);
    if (equip) {
        return equip;
    }
    if (def.bury) {
        return 'bury';
    }
    if (def.tan) {
        return 'tan';
    }
    if (def.questItem) {
        return 'examine';
    }
    if (id === 'coins' || id === 'key') {
        return 'examine';
    }
    if (def.tool || itemIsMaterial(id)) {
        return 'use';
    }
    return 'use';
}

function itemDefaultVerbLabel(verb) {
    if (verb === 'eat') {
        return 'Eat';
    }
    if (verb === 'drink') {
        return 'Drink';
    }
    if (verb === 'wield') {
        return 'Wield';
    }
    if (verb === 'wear') {
        return 'Wear';
    }
    if (verb === 'bury') {
        return 'Bury';
    }
    if (verb === 'tan') {
        return 'Tan';
    }
    if (verb === 'examine') {
        return 'Examine';
    }
    if (verb === 'use') {
        return 'Use';
    }
    if (verb === 'drop') {
        return 'Drop';
    }
    return verb ? (verb.charAt(0).toUpperCase() + verb.slice(1)) : 'Use';
}

function drinkItem(hero, id) {
    var def = ITEM_DB[id];
    if (!hero || !def || !(def.drink || id === 'attackpot')) {
        return null;
    }
    if (!takeItem(hero, id, 1)) {
        return null;
    }
    if (id === 'attackpot') {
        hero.attackPotUntil = Date.now() + 60000;
        hero.attackPotBonus = 3;
    }
    return { name: def.name, id: id, bonus: hero.attackPotBonus || 0 };
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
        if (burned) {
            /* L9: cook fail auto-discards — no burnt item created. */
            return {
                ok: true,
                id: id,
                kind: kind,
                cooked: null,
                burned: true,
                discarded: true,
                xp: 0
            };
        }
        product = def.cook;
        if (!product) {
            addItem(hero, id, 1);
            return { ok: false };
        }
        if (!addItem(hero, product, 1)) {
            addItem(hero, id, 1);
            return { ok: false, full: true };
        }
        xp = typeof def.cookXp === 'number' ? def.cookXp : 0;
        if (xp > 0) {
            gainSkillXp(hero, 'cooking', xp);
        }
        return {
            ok: true,
            id: id,
            kind: kind,
            cooked: def.cook,
            burned: null,
            xp: xp
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

function toolKindOf(id) {
    var def = ITEM_DB[id];
    return def && def.tool ? def.tool : null;
}

function toolTierOf(id) {
    var def = ITEM_DB[id];
    if (!def) {
        return 0;
    }
    if (typeof def.toolTier === 'number') {
        return def.toolTier;
    }
    return 0;
}

function ownedItemIds(hero) {
    var ids = [];
    var i;
    var id;
    if (!hero) {
        return ids;
    }
    if (hero.inventory) {
        for (i = 0; i < hero.inventory.length; i++) {
            if (hero.inventory[i] && hero.inventory[i].id && hero.inventory[i].qty > 0) {
                ids.push(hero.inventory[i].id);
            }
        }
    }
    if (hero.equipment) {
        for (id in hero.equipment) {
            if (hero.equipment[id]) {
                ids.push(hero.equipment[id]);
            }
        }
    }
    return ids;
}

function bestOwnedTool(hero, kind) {
    var ids = ownedItemIds(hero);
    var best = null;
    var bestTier = -1;
    var i;
    var id;
    var tier;
    for (i = 0; i < ids.length; i++) {
        id = ids[i];
        if (toolKindOf(id) !== kind) {
            continue;
        }
        tier = toolTierOf(id);
        if (tier > bestTier) {
            bestTier = tier;
            best = id;
        }
    }
    return best;
}

function hasAnyToolKind(hero, kind) {
    return !!bestOwnedTool(hero, kind);
}

function hasToolTierAtLeast(hero, kind, needTier) {
    var best = bestOwnedTool(hero, kind);
    var need = typeof needTier === 'number' ? needTier : 1;
    if (!best) {
        return false;
    }
    return toolTierOf(best) >= need;
}

function hasDiamondPickOrBetter(hero) {
    var need = typeof DEN_BOULDER_PICK_TIER === 'number' ? DEN_BOULDER_PICK_TIER : 5;
    return hasToolTierAtLeast(hero, 'pickaxe', need);
}

function fishCatchChance(hero) {
    var level = heroSkillLevel(hero, 'fishing') || 1;
    return Math.min(0.95, 0.35 + level * 0.03);
}

function fishCatchForZone(zoneId) {
    if (FISH_BY_ZONE && zoneId && FISH_BY_ZONE[zoneId]) {
        return FISH_BY_ZONE[zoneId];
    }
    return FISH_CATCH_ID;
}

function resourceToolNeed(id) {
    if (RESOURCE_TOOL_TIER && typeof RESOURCE_TOOL_TIER[id] === 'number') {
        return RESOURCE_TOOL_TIER[id];
    }
    return 1;
}

function catchFish(hero, opts) {
    var chance;
    var rand;
    var catchId;
    var needTier;
    var gate;
    if (!hero || !hero.skills || !hero.skills.fishing) {
        return null;
    }
    opts = opts || {};
    catchId = opts.catchId || opts.id || FISH_CATCH_ID;
    needTier = resourceToolNeed(catchId);
    gate = resourceLevelGate(hero, 'fishing', catchId);
    if (!gate.ok) {
        return { ok: false, need: gate.need, id: catchId };
    }
    if (!opts.skipTool && !hasToolTierAtLeast(hero, 'net', needTier)) {
        return { ok: false, needTool: FISH_NET_ID, toolName: 'a stronger fishing net', needTier: needTier };
    }
    rand = opts.rand;
    chance = typeof opts.chance === 'number' ? opts.chance : fishCatchChance(hero);
    if (!(fishRoll(rand) < chance)) {
        return { ok: false, miss: true };
    }
    if (!addItem(hero, catchId, 1)) {
        return { ok: false, full: true };
    }
    gainSkillXp(hero, 'fishing', FISH_SPOT_XP + Math.max(0, resourceNeedLevel(catchId) - 1));
    return { ok: true, id: catchId, xp: FISH_SPOT_XP };
}

function fishAtSpot(hero, opts) {
    return catchFish(hero, opts);
}

function treeSpecForZone(zoneId) {
    var spec = TREE_BY_ZONE && TREE_BY_ZONE[zoneId];
    if (spec && spec.log) {
        return { log: spec.log, level: typeof spec.level === 'number' ? spec.level : resourceNeedLevel(spec.log) };
    }
    return { log: WOODCUT_LOG_ID, level: 1 };
}

function chopAtTree(hero, opts) {
    var logId;
    var gate;
    var xp;
    opts = opts || {};
    if (!hero || !hero.skills || !hero.skills.woodcutting) {
        return null;
    }
    logId = opts.log || opts.logId || WOODCUT_LOG_ID;
    gate = resourceLevelGate(hero, 'woodcutting', logId);
    if (!gate.ok) {
        return { ok: false, need: gate.need, id: logId };
    }
    if (!opts.skipTool && !hasToolTierAtLeast(hero, 'axe', resourceToolNeed(logId))) {
        return { ok: false, needTool: WOODCUT_AXE_ID, toolName: 'a stronger axe', needTier: resourceToolNeed(logId) };
    }
    if (!opts.skipItem) {
        if (!addItem(hero, logId, 1)) {
            return { ok: false, full: true, id: logId };
        }
    }
    xp = WOODCUT_TREE_XP + Math.max(0, (resourceNeedLevel(logId) - 1));
    gainSkillXp(hero, 'woodcutting', xp);
    return { ok: true, id: logId, xp: xp };
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
    if (!opts.skipTool && !hasToolTierAtLeast(hero, 'pickaxe', resourceToolNeed(ore))) {
        return { ok: false, needTool: MINE_PICK_ID, toolName: 'a stronger pickaxe', ore: ore, needTier: resourceToolNeed(ore) };
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

var RUNE_ALTAR_TYPES = {
    airrune: { label: 'Craft air runes', need: 1, xp: 10 },
    waterrune: { label: 'Craft water runes', need: 5, xp: 12 },
    earthrune: { label: 'Craft earth runes', need: 15, xp: 14 },
    firerune: { label: 'Craft fire runes', need: 30, xp: 20 }
};

function recipeHasInputs(hero, inputs) {
    var i;
    if (!inputs || !inputs.length) {
        return true;
    }
    for (i = 0; i < inputs.length; i++) {
        if (itemQty(hero, inputs[i][0]) < inputs[i][1]) {
            return false;
        }
    }
    return true;
}

function takeRecipeInputs(hero, inputs) {
    var taken = [];
    var i;
    for (i = 0; i < inputs.length; i++) {
        if (!takeItem(hero, inputs[i][0], inputs[i][1])) {
            while (taken.length) {
                var back = taken.pop();
                addItem(hero, back[0], back[1]);
            }
            return false;
        }
        taken.push(inputs[i]);
    }
    return true;
}

function findSmeltRecipe(id) {
    var i;
    for (i = 0; i < SMELT_RECIPES.length; i++) {
        if (SMELT_RECIPES[i].id === id) {
            return SMELT_RECIPES[i];
        }
    }
    return null;
}

function findSmithRecipe(id) {
    var i;
    for (i = 0; i < SMITH_RECIPES.length; i++) {
        if (SMITH_RECIPES[i].id === id) {
            return SMITH_RECIPES[i];
        }
    }
    return null;
}

function findCraftRecipe(id) {
    var i;
    for (i = 0; i < CRAFT_RECIPES.length; i++) {
        if (CRAFT_RECIPES[i].id === id) {
            return CRAFT_RECIPES[i];
        }
    }
    return null;
}

function smeltRecipe(hero, recipe) {
    var level;
    if (!hero || !recipe) {
        return null;
    }
    level = heroSkillLevel(hero, 'smithing');
    if (level < (recipe.need || 1)) {
        return { ok: false, need: recipe.need || 1 };
    }
    if (!recipeHasInputs(hero, recipe.inputs)) {
        return { ok: false, need: 'ores' };
    }
    if (!takeRecipeInputs(hero, recipe.inputs)) {
        return null;
    }
    if (!addItem(hero, recipe.id, 1)) {
        var i;
        for (i = 0; i < recipe.inputs.length; i++) {
            addItem(hero, recipe.inputs[i][0], recipe.inputs[i][1]);
        }
        return { ok: false, full: true };
    }
    if (recipe.xp > 0) {
        gainSkillXp(hero, 'smithing', recipe.xp);
    }
    return { ok: true, made: recipe.id, xp: recipe.xp };
}

function smeltBronze(hero) {
    return smeltRecipe(hero, findSmeltRecipe('copperbar'));
}

function smithRecipe(hero, recipe) {
    var inputs;
    var level;
    var i;
    if (!hero || !recipe) {
        return null;
    }
    level = heroSkillLevel(hero, 'smithing');
    if (level < (recipe.need || 1)) {
        return { ok: false, need: recipe.need || 1 };
    }
    inputs = [[recipe.bar, recipe.bars || 1]];
    if (recipe.extra) {
        for (i = 0; i < recipe.extra.length; i++) {
            inputs.push(recipe.extra[i]);
        }
    }
    if (!recipeHasInputs(hero, inputs)) {
        return { ok: false, need: 'bar' };
    }
    if (!takeRecipeInputs(hero, inputs)) {
        return null;
    }
    if (!addItem(hero, recipe.id, 1)) {
        for (i = 0; i < inputs.length; i++) {
            addItem(hero, inputs[i][0], inputs[i][1]);
        }
        return { ok: false, full: true };
    }
    if (recipe.xp > 0) {
        gainSkillXp(hero, 'smithing', recipe.xp);
    }
    return { ok: true, made: recipe.id, xp: recipe.xp };
}

function smithBronzeDagger(hero) {
    return smithRecipe(hero, findSmithRecipe('copperdagger'));
}

function craftStationRecipe(hero, recipe) {
    var level;
    var skill;
    var qty;
    if (!hero || !recipe) {
        return null;
    }
    if (recipe.kind === 'tan') {
        return tanCowhide(hero, 'cowhide') || { ok: false, need: 'cowhide' };
    }
    if (recipe.id === 'stitch:gloves') {
        return stitchLeather(hero) || { ok: false, need: 'materials' };
    }
    skill = recipe.xpSkill || 'crafting';
    level = heroSkillLevel(hero, skill);
    if (level < (recipe.need || 1)) {
        return { ok: false, need: recipe.need || 1 };
    }
    if (!recipeHasInputs(hero, recipe.inputs)) {
        return { ok: false, need: 'materials' };
    }
    if (!takeRecipeInputs(hero, recipe.inputs)) {
        return null;
    }
    qty = recipe.qty || 1;
    if (!addItem(hero, recipe.output, qty)) {
        var i;
        for (i = 0; i < recipe.inputs.length; i++) {
            addItem(hero, recipe.inputs[i][0], recipe.inputs[i][1]);
        }
        return { ok: false, full: true };
    }
    if (recipe.xp > 0) {
        gainSkillXp(hero, skill, recipe.xp);
    }
    return { ok: true, made: recipe.output, xp: recipe.xp, qty: qty };
}

function craftRuneAtAltar(hero, runeId) {
    var spec = RUNE_ALTAR_TYPES[runeId];
    var level;
    if (!hero || !spec) {
        return null;
    }
    level = heroSkillLevel(hero, 'runecraft');
    if (level < (spec.need || 1)) {
        return { ok: false, need: spec.need || 1 };
    }
    if (itemQty(hero, 'runeessence') < 1) {
        return { ok: false, need: 'materials' };
    }
    if (!takeItem(hero, 'runeessence', 1)) {
        return null;
    }
    if (!addItem(hero, runeId, 1)) {
        addItem(hero, 'runeessence', 1);
        return { ok: false, full: true };
    }
    gainSkillXp(hero, 'runecraft', spec.xp || 10);
    return { ok: true, made: runeId, xp: spec.xp || 10 };
}

function stationRecipesFor(kind, hero, opts) {
    var rows = [];
    var i;
    var row;
    var inputs;
    var level;
    var skill;
    opts = opts || {};
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
        for (i = 0; i < CRAFT_RECIPES.length; i++) {
            row = CRAFT_RECIPES[i];
            skill = row.xpSkill || 'crafting';
            level = heroSkillLevel(hero, skill);
            if (row.kind === 'tan') {
                rows.push({
                    id: row.id,
                    label: row.label,
                    enabled: itemQty(hero, 'cowhide') > 0
                });
                continue;
            }
            if (row.id === 'stitch:gloves') {
                rows.push({
                    id: row.id,
                    label: row.label,
                    enabled: itemQty(hero, 'leather') > 0 && itemQty(hero, 'string') > 0 && level >= (row.need || 1)
                });
                continue;
            }
            rows.push({
                id: row.id,
                label: row.label,
                enabled: level >= (row.need || 1) && recipeHasInputs(hero, row.inputs)
            });
        }
        return rows;
    }
    if (kind === 'furnace') {
        level = heroSkillLevel(hero, 'smithing');
        for (i = 0; i < SMELT_RECIPES.length; i++) {
            row = SMELT_RECIPES[i];
            rows.push({
                id: 'smelt:' + row.id,
                label: row.label,
                enabled: level >= (row.need || 1) && recipeHasInputs(hero, row.inputs)
            });
        }
        return rows;
    }
    if (kind === 'anvil') {
        level = heroSkillLevel(hero, 'smithing');
        for (i = 0; i < SMITH_RECIPES.length; i++) {
            row = SMITH_RECIPES[i];
            inputs = [[row.bar, row.bars || 1]];
            if (row.extra) {
                inputs = inputs.concat(row.extra);
            }
            rows.push({
                id: 'smith:' + row.id,
                label: row.label,
                enabled: level >= (row.need || 1) && recipeHasInputs(hero, inputs)
            });
        }
        return rows;
    }
    if (kind === 'altar') {
        var runeId = opts.rune || opts.runeId || 'airrune';
        var spec = RUNE_ALTAR_TYPES[runeId];
        if (!spec) {
            return rows;
        }
        level = heroSkillLevel(hero, 'runecraft');
        rows.push({
            id: 'rune:' + runeId,
            label: spec.label + ' (1 essence)',
            enabled: level >= (spec.need || 1) && itemQty(hero, 'runeessence') > 0
        });
        return rows;
    }
    return rows;
}

function runStationRecipe(hero, kind, recipeId, opts) {
    var parts;
    var result;
    var recipe;
    opts = opts || {};
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
        recipe = findCraftRecipe(recipeId);
        if (!recipe) {
            return null;
        }
        return craftStationRecipe(hero, recipe);
    }
    if (kind === 'furnace' && recipeId.indexOf('smelt:') === 0) {
        recipe = findSmeltRecipe(recipeId.split(':')[1]);
        return smeltRecipe(hero, recipe);
    }
    if (kind === 'anvil' && recipeId.indexOf('smith:') === 0) {
        recipe = findSmithRecipe(recipeId.split(':')[1]);
        return smithRecipe(hero, recipe);
    }
    if (kind === 'altar' && recipeId.indexOf('rune:') === 0) {
        return craftRuneAtAltar(hero, recipeId.split(':')[1]);
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
    return itemQty(hero, 'firerune') >= 5;
}

function highAlchValue(id) {
    var def = ITEM_DB[id];
    var value;
    if (!def || id === 'coins' || id === 'firerune') {
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
    if (!takeItem(hero, 'firerune', 5)) {
        return { ok: false, need: 'runes' };
    }
    if (!takeItem(hero, id, 1)) {
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
    return itemQty(hero, 'airrune') >= 1;
}

function consumeAirStrikeRunes(hero) {
    if (!hero || !hasWindStrikeRunes(hero)) {
        return false;
    }
    return !!takeItem(hero, 'airrune', 1);
}

function windStrike(hero) {
    if (!consumeAirStrikeRunes(hero)) {
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
    var result = craftRuneAtAltar(hero, 'airrune');
    return !!(result && result.ok);
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
    /* L2: string an unstrung bow, or fletch oak+string into copper bow. */
    if (!hero) {
        return false;
    }
    if (itemQty(hero, 'shortbowunstrung') >= 1 && itemQty(hero, 'string') >= 1) {
        takeItem(hero, 'shortbowunstrung', 1);
        takeItem(hero, 'string', 1);
        if (!addItem(hero, 'copperbow', 1)) {
            addItem(hero, 'shortbowunstrung', 1);
            addItem(hero, 'string', 1);
            return false;
        }
        gainSkillXp(hero, 'fletching', 10);
        return true;
    }
    if (itemQty(hero, 'oaklogs') >= 1 && itemQty(hero, 'string') >= 1) {
        takeItem(hero, 'oaklogs', 1);
        takeItem(hero, 'string', 1);
        if (!addItem(hero, 'copperbow', 1)) {
            addItem(hero, 'oaklogs', 1);
            addItem(hero, 'string', 1);
            return false;
        }
        gainSkillXp(hero, 'fletching', 22);
        return true;
    }
    return false;
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

function attackPotionBonus(hero) {
    if (!hero || typeof hero.attackPotBonus !== 'number' || hero.attackPotBonus < 1) {
        return 0;
    }
    if (typeof hero.attackPotUntil === 'number' && Date.now() > hero.attackPotUntil) {
        hero.attackPotBonus = 0;
        hero.attackPotUntil = 0;
        return 0;
    }
    return hero.attackPotBonus;
}

/**
 * Offensive skill for the equipped weapon's class:
 * melee → Strength, ranged → Ranged, magic → Magic.
 * Bonus = 0.1 × that skill level (floored into final damage via callers).
 */
function weaponDamageSkillId(hero) {
    var id;
    var def;
    var cls;
    if (!hero || !hero.equipment || !hero.equipment.weapon) {
        return 'strength';
    }
    id = hero.equipment.weapon;
    def = ITEM_DB[id];
    cls = def && def.combatClass ? def.combatClass : 'melee';
    if (cls === 'ranged') {
        return 'ranged';
    }
    if (cls === 'magic') {
        return 'magic';
    }
    return 'strength';
}

function weaponSkillDamageBonus(hero) {
    var skillId;
    var skill;
    var level;
    if (!hero) {
        return 0;
    }
    skillId = weaponDamageSkillId(hero);
    skill = hero.skills && hero.skills[skillId];
    level = skill && typeof skill.level === 'number' ? skill.level : 1;
    if (!(level > 0)) {
        level = 1;
    }
    return level * 0.1;
}

function equippedWeaponDamage(hero, fallback) {
    var base = typeof fallback === 'number' ? fallback : 0;
    var def;
    var id;
    var skillBonus = weaponSkillDamageBonus(hero);
    if (!hero || !hero.equipment) {
        return base + attackPotionBonus(hero) + skillBonus;
    }
    id = hero.equipment.weapon;
    if (!id) {
        return base + attackPotionBonus(hero) + skillBonus;
    }
    def = ITEM_DB[id];
    if (def && typeof def.damage === 'number') {
        return def.damage + attackPotionBonus(hero) + skillBonus;
    }
    return base + attackPotionBonus(hero) + skillBonus;
}

var DEFAULT_MELEE_ATTACK_RANGE = 24;
/* 4 tiles at TILE_SIZE 16. */
var DEFAULT_RANGED_ATTACK_RANGE = 64;
var DEFAULT_MAGIC_ATTACK_RANGE = 64;

function weaponAttackRangePx(hero) {
    var id;
    var def;
    if (!hero || !hero.equipment || !hero.equipment.weapon) {
        return DEFAULT_MELEE_ATTACK_RANGE;
    }
    id = hero.equipment.weapon;
    def = ITEM_DB[id];
    if (def && typeof def.attackRange === 'number') {
        return def.attackRange;
    }
    if (def && def.combatClass === 'ranged') {
        return DEFAULT_RANGED_ATTACK_RANGE;
    }
    if (def && def.combatClass === 'magic') {
        return DEFAULT_MAGIC_ATTACK_RANGE;
    }
    return DEFAULT_MELEE_ATTACK_RANGE;
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

function mergeDropStack(list, id, qty) {
    var stack;
    qty = qty || 0;
    if (!id || !(qty > 0)) {
        return;
    }
    stack = findStack(list, id);
    if (stack) {
        stack.qty += qty;
    } else {
        list.push({ id: id, qty: qty });
    }
}

/* Strip inventory + worn gear into a reclaim list. Quest items stay on the hero. */
function stripHeroForGravestone(hero) {
    var dropped = [];
    var kept = [];
    var i;
    var stack;
    var slot;
    var id;
    var qty;
    var gold;
    if (!hero) {
        return dropped;
    }
    ensureEquipment(hero);
    for (i = 0; i < EQUIP_SLOTS.length; i++) {
        slot = EQUIP_SLOTS[i][0];
        id = hero.equipment[slot];
        if (!id) {
            continue;
        }
        qty = equippedQty(hero, slot);
        if (!(qty > 0)) {
            qty = 1;
        }
        if (isQuestItem(id)) {
            mergeDropStack(kept, id, qty);
        } else {
            mergeDropStack(dropped, id, qty);
        }
        hero.equipment[slot] = null;
        hero.equipmentQty[slot] = 0;
    }
    gold = typeof hero.gold === 'number' ? Math.max(0, hero.gold) : 0;
    for (i = 0; i < (hero.inventory || []).length; i++) {
        stack = hero.inventory[i];
        if (!stack || !stack.id || !(stack.qty > 0)) {
            continue;
        }
        if (stack.id === 'coins') {
            continue;
        }
        if (isQuestItem(stack.id)) {
            kept.push({ id: stack.id, qty: stack.qty });
        } else {
            mergeDropStack(dropped, stack.id, stack.qty);
        }
    }
    hero.inventory = kept;
    hero.gold = 0;
    if (gold > 0) {
        mergeDropStack(dropped, 'coins', gold);
    }
    syncCoins(hero);
    return dropped;
}

function reclaimGravestoneItems(hero, items) {
    var remain = [];
    var i;
    var row;
    items = items || [];
    for (i = 0; i < items.length; i++) {
        row = items[i];
        if (!row || !row.id || !(row.qty > 0)) {
            continue;
        }
        if (addItem(hero, row.id, row.qty)) {
            continue;
        }
        remain.push({ id: row.id, qty: row.qty });
    }
    return remain;
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

/** Combat skills averaged for Hero level (no separate Hero XP). */
var COMBAT_SKILL_IDS = [
    'attack', 'strength', 'defence', 'hitpoints', 'ranged', 'magic', 'prayer'
];

function combatLevel(hero) {
    var i;
    var sum = 0;
    var n = COMBAT_SKILL_IDS.length;
    for (i = 0; i < n; i++) {
        sum += heroSkillLevel(hero, COMBAT_SKILL_IDS[i]);
    }
    return Math.max(1, Math.floor(sum / n));
}

function applyCombatLevel(hero, announce) {
    if (!hero) {
        return 1;
    }
    var next = combatLevel(hero);
    var prev = typeof hero.level === 'number' ? hero.level : 0;
    hero.level = next;
    /* Drop legacy Hero XP pool — level is combat-skill average only. */
    if (hero.xp != null) {
        delete hero.xp;
    }
    if (announce && next > prev && typeof Hud !== 'undefined' && Hud.log) {
        Hud.log('Your level is now ' + next + '.');
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

/* Settings / testing: allowed XP gain multipliers (default 1×). */
var XP_MULTIPLIER_OPTIONS = [1, 2, 5, 10, 25, 50, 100, 200];

function normalizeXpMultiplier(value) {
    var n = typeof value === 'number' ? value : parseFloat(value);
    var i;
    if (!(n > 0) || !isFinite(n)) {
        return 1;
    }
    for (i = 0; i < XP_MULTIPLIER_OPTIONS.length; i++) {
        if (n === XP_MULTIPLIER_OPTIONS[i]) {
            return n;
        }
    }
    return 1;
}

function xpMultiplierFor(hero) {
    if (!hero) {
        return 1;
    }
    return normalizeXpMultiplier(hero.xpMultiplier);
}

function gainSkillXp(hero, skill, amount) {
    var s = ensureSkill(hero, skill);
    var gain;
    var next;
    var named;
    if (!s) {
        return;
    }
    gain = Math.max(0, Math.round(Number(amount) || 0));
    if (gain > 0) {
        gain = Math.max(1, Math.round(gain * xpMultiplierFor(hero)));
    }
    s.xp += gain;
    next = 1 + Math.floor(Math.sqrt(s.xp / 50));
    if (skill === 'hitpoints') {
        next = Math.max(10, next);
    }
    if (next > s.level) {
        s.level = next;
        if (skill === 'hitpoints') {
            hero.maxHp = 10 * s.level;
        }
        named = SKILL_NAMES.filter(function (n) { return n[0] === skill; })[0];
        if (named) {
            if (typeof showLevelUpModal === 'function') {
                showLevelUpModal(skill, named[1], s.level);
            } else if (typeof Hud !== 'undefined' && Hud.log) {
                Hud.log(named[1] + ' increased to ' + s.level + '.');
            }
        }
    }
    if (gain > 0 && typeof xpDropFloater === 'function') {
        xpDropFloater(skill, gain);
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

function skillXpBar(skill) {
    var xp = skill && typeof skill.xp === 'number' ? skill.xp : 0;
    var level = skill && typeof skill.level === 'number' && skill.level >= 1
        ? Math.floor(skill.level)
        : 1;
    var next = xpForNextSkillLevel(level);
    var pct = next > 0 ? Math.max(0, Math.min(100, (xp / next) * 100)) : 0;
    return {
        xp: xp,
        next: next,
        pct: pct,
        label: xp + '/' + next
    };
}

function skillXpText(name, skill) {
    var xp = skill && typeof skill.xp === 'number' ? skill.xp : 0;
    return name + ': ' + xp + ' XP (' + skillXpToNext(skill) + ' XP to next level)';
}

function itemName(id) {
    return (ITEM_DB[id] && ITEM_DB[id].name) || id;
}

function itemExamineShopText(id, def) {
    var bits = [];
    var buy;
    var sell;
    if (!def) {
        return '';
    }
    if (id === 'coins') {
        return typeof def.value === 'number' ? ('Value ' + def.value) : '';
    }
    if (typeof def.value === 'number') {
        bits.push('Value ' + def.value);
    }
    buy = typeof itemBuyPrice === 'function' ? itemBuyPrice(id) : 0;
    sell = typeof itemSellPrice === 'function' ? itemSellPrice(id) : 0;
    if (buy > 0) {
        bits.push('Buy ' + buy);
    }
    if (sell > 0) {
        bits.push('Sell ' + sell);
    }
    return bits.join(', ');
}

function itemExamineEffectText(id, def) {
    var parts = [];
    if (!def) {
        return '';
    }
    if (typeof def.heal === 'number' && def.heal > 0) {
        parts.push('Heals ' + def.heal + ' health');
    }
    if (typeof def.damage === 'number' && def.damage > 0) {
        parts.push('Damage ' + def.damage);
    }
    if (typeof def.defence === 'number' && def.defence > 0) {
        parts.push('Defence ' + def.defence);
    }
    if (typeof def.magicBonus === 'number' && def.magicBonus > 0) {
        parts.push('Magic bonus ' + def.magicBonus);
    }
    if (def.drink || id === 'attackpot') {
        if (id === 'attackpot') {
            parts.push('Boosts attack by 3');
        } else {
            parts.push('Drinkable');
        }
    }
    return parts.join('. ');
}

function itemExamineText(id) {
    var def = ITEM_DB[id];
    var line;
    var shop;
    var effect;
    if (def && def.examine) {
        line = def.examine;
    } else {
        var name = itemName(id);
        line = name ? "It's " + name + '.' : '';
    }
    if (!line || !def) {
        return line;
    }
    shop = itemExamineShopText(id, def);
    effect = itemExamineEffectText(id, def);
    if (shop) {
        line += ' ' + shop + '.';
    }
    if (effect) {
        line += ' ' + effect + '.';
    }
    return line;
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

/** Phaser texture key for ground loot — same SVG basename as inventory `itemIcon`. */
function itemTextureKey(id) {
    var icon = itemIcon(id);
    var file = String(icon).split('/').pop() || 'coins.svg';
    var base = file.replace(/\.svg$/i, '') || 'coins';
    return 'item-' + base;
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

function combatPowerSkill(hero) {
    var cls = heroCombatClass(hero);
    if (cls === 'ranged') {
        return 'ranged';
    }
    if (cls === 'magic') {
        return 'magic';
    }
    return 'strength';
}

function combatSkill(hero) {
    var style = hero && hero.style ? hero.style : 'shared';
    if (style === 'defensive') {
        return 'defence';
    }
    if (style === 'accurate') {
        return 'attack';
    }
    if (style === 'aggressive' || style === 'power' || style === 'rapid' || style === 'blast') {
        return combatPowerSkill(hero);
    }
    /* shared — handled in grantStyleHitXp */
    return 'shared';
}

function styleLabelsForHero(hero) {
    var cls = heroCombatClass(hero);
    if (cls === 'ranged') {
        return {
            accurate: 'Accurate',
            power: 'Ranger',
            defensive: 'Longrange',
            shared: 'Shared',
            powerKey: 'rapid'
        };
    }
    if (cls === 'magic') {
        return {
            accurate: 'Accurate',
            power: 'Mage',
            defensive: 'Ward',
            shared: 'Shared',
            powerKey: 'blast'
        };
    }
    return {
        accurate: 'Accurate',
        power: 'Strength',
        defensive: 'Defensive',
        shared: 'Shared',
        powerKey: 'aggressive'
    };
}

function showCombatVisualsOn(hero) {
    return !hero || hero.showCombatVisuals !== false;
}

function showRangeRingsOn(hero) {
    return !hero || hero.showRangeRings !== false;
}


function remapLegacyItemId(id) {
    if (!id || typeof LEGACY_ITEM_ID_MAP === 'undefined') {
        return id;
    }
    if (!Object.prototype.hasOwnProperty.call(LEGACY_ITEM_ID_MAP, id)) {
        return id;
    }
    return LEGACY_ITEM_ID_MAP[id];
}

function migrateContainerItemIds(list) {
    var i;
    var row;
    var next;
    var merged;
    if (!list || !list.length) {
        return;
    }
    for (i = list.length - 1; i >= 0; i--) {
        row = list[i];
        if (!row || !row.id) {
            continue;
        }
        next = remapLegacyItemId(row.id);
        if (next === null) {
            list.splice(i, 1);
            continue;
        }
        if (next === row.id) {
            continue;
        }
        row.id = next;
    }
    merged = {};
    for (i = 0; i < list.length; i++) {
        row = list[i];
        if (!row || !row.id) {
            continue;
        }
        if (!merged[row.id]) {
            merged[row.id] = { id: row.id, qty: 0 };
        }
        merged[row.id].qty += row.qty > 0 ? row.qty : 0;
    }
    list.length = 0;
    for (i in merged) {
        if (merged[i].qty > 0) {
            list.push(merged[i]);
        }
    }
}

function migrateLegacyHeroItems(hero) {
    var eq;
    var slot;
    var next;
    var head;
    var body;
    var legs;
    if (!hero) {
        return hero;
    }
    migrateContainerItemIds(hero.inventory);
    migrateContainerItemIds(hero.bank);
    eq = ensureEquipment(hero);
    /* Collapse legacy plate slots into armour. */
    head = eq.head;
    body = eq.body;
    legs = eq.legs;
    if (!eq.armour) {
        if (body) {
            eq.armour = remapLegacyItemId(body) || body;
        } else if (head) {
            eq.armour = remapLegacyItemId(head) || head;
        } else if (legs) {
            eq.armour = remapLegacyItemId(legs) || legs;
        }
    }
    delete eq.head;
    delete eq.body;
    delete eq.legs;
    for (slot in eq) {
        if (!eq[slot]) {
            continue;
        }
        next = remapLegacyItemId(eq[slot]);
        if (next === null) {
            eq[slot] = null;
        } else {
            eq[slot] = next;
        }
    }
    ensureEquipment(hero);
    return hero;
}

function normalizeHeroCombat(hero) {
    var labels;
    if (!hero) {
        return hero;
    }
    migrateLegacyHeroItems(hero);
    if (!hero.flags) {
        hero.flags = {};
    }
    if (typeof hero.flags.dragonDenOpen !== 'boolean') {
        hero.flags.dragonDenOpen = !!hero.flags.dragonDenOpen;
    }
    if (typeof SettingsRegistry !== 'undefined' && SettingsRegistry.normalizeHero) {
        SettingsRegistry.normalizeHero(hero);
    }
    if (typeof hero.showCombatVisuals !== 'boolean') {
        hero.showCombatVisuals = true;
    }
    if (typeof hero.showRangeRings !== 'boolean') {
        hero.showRangeRings = true;
    }
    if (typeof hero.mobSpawnModifier !== 'number' || !(hero.mobSpawnModifier > 0)) {
        hero.mobSpawnModifier = typeof MOB_SPAWN_MODIFIER === 'number' ? MOB_SPAWN_MODIFIER : 1;
    }
    if (hero.simTps == null && hero.targetTps != null) {
        hero.simTps = hero.targetTps;
    }
    if (typeof normalizeTargetTps === 'function') {
        hero.simTps = normalizeTargetTps(hero.simTps != null ? hero.simTps : hero.targetTps);
        hero.targetTps = hero.simTps;
    } else if (hero.simTps !== 30 && hero.simTps !== 60 && hero.simTps !== 120) {
        hero.simTps = 60;
        hero.targetTps = 60;
    } else {
        hero.targetTps = hero.simTps;
    }
    if (typeof normalizeGameSpeed === 'function') {
        hero.gameSpeed = normalizeGameSpeed(hero.gameSpeed);
    } else if (hero.gameSpeed !== 0.5 && hero.gameSpeed !== 1 && hero.gameSpeed !== 1.5 && hero.gameSpeed !== 2) {
        hero.gameSpeed = 1;
    }
    if (typeof normalizeXpMultiplier === 'function') {
        hero.xpMultiplier = normalizeXpMultiplier(hero.xpMultiplier);
    } else if (hero.xpMultiplier !== 2 && hero.xpMultiplier !== 5
            && hero.xpMultiplier !== 10 && hero.xpMultiplier !== 25
            && hero.xpMultiplier !== 50 && hero.xpMultiplier !== 100
            && hero.xpMultiplier !== 200) {
        hero.xpMultiplier = 1;
    }
    if (hero.xp != null) {
        delete hero.xp;
    }
    if (typeof applyCombatLevel === 'function') {
        applyCombatLevel(hero, false);
    }
    if (hero.autoAttack == null) {
        hero.autoAttack = false;
    }
    if (typeof hero.autoAttackRange !== 'number'
            || !(hero.autoAttackRange >= AUTO_ATTACK_RANGE_MIN)
            || hero.autoAttackRange > AUTO_ATTACK_RANGE_MAX) {
        hero.autoAttackRange = DEFAULT_AUTO_ATTACK_RANGE_TILES;
    } else {
        hero.autoAttackRange = Math.floor(hero.autoAttackRange);
    }
    if (hero.autoRetaliate == null) {
        hero.autoRetaliate = false;
    }
    if (!hero.style) {
        hero.style = 'shared';
    }
    labels = styleLabelsForHero(hero);
    if (hero.style === 'aggressive' || hero.style === 'power') {
        hero.style = labels.powerKey;
    } else if (hero.style === 'rapid' || hero.style === 'blast') {
        if (labels.powerKey !== hero.style) {
            hero.style = labels.powerKey;
        }
    }
    return hero;
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
    var skill;
    var power;
    var share;
    var hpAmount;
    if (amount < 1) {
        return 0;
    }
    skill = combatSkill(hero);
    if (skill === 'shared') {
        share = Math.max(1, Math.floor(amount / 3));
        power = combatPowerSkill(hero);
        gainSkillXp(hero, 'attack', share);
        gainSkillXp(hero, 'defence', share);
        gainSkillXp(hero, power, Math.max(1, amount - share * 2));
    } else {
        gainSkillXp(hero, skill, amount);
    }
    hpAmount = hitpointsHitXp(mobXp, scored, maxHp);
    if (hpAmount > 0) {
        gainSkillXp(hero, 'hitpoints', hpAmount);
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
    if (magicWeaponEquipped(hero)) {
        return 'magic';
    }
    return 'melee';
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
