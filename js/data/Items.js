var ITEM_DB = {
    coins: { name: 'Coins', icon: 'assets/svg/items/coins.svg', stack: true, examine: 'A small pile of copper and silver coins.' },
    shrimp: { name: 'Cooked shrimp', icon: 'assets/svg/items/shrimp.svg', heal: 12, stack: true, examine: 'A cooked shrimp, still warm enough to eat.' },
    rawshrimp: { name: 'Raw shrimp', icon: 'assets/svg/items/rawshrimp.svg', stack: true, cook: 'shrimp', examine: 'A raw shrimp. It should be cooked.' },
    bread: { name: 'Bread', icon: 'assets/svg/items/bread.svg', heal: 20, stack: true, examine: 'A dense loaf baked for the road.' },
    sword: { name: 'Bronze sword', icon: 'assets/svg/items/sword.svg', slot: 'weapon', damage: 16, examine: 'A short bronze blade, nicked but serviceable.' },
    shield: { name: 'Wooden shield', icon: 'assets/svg/items/shield.svg', slot: 'shield', defence: 1, examine: 'A round wooden shield bound with iron.' },
    bones: { name: 'Bones', icon: 'assets/svg/items/bones.svg', stack: true, bury: true, examine: 'Dry bones. Someone should bury them.' },
    key: { name: 'Iron key', icon: 'assets/svg/items/key.svg', examine: 'A heavy iron key with a worn bit.' }
};

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
    ['crafting', 'Crafting']
];

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
        return hero.equipment;
    }
    for (var i = 0; i < EQUIP_SLOTS.length; i++) {
        var key = EQUIP_SLOTS[i][0];
        if (!Object.prototype.hasOwnProperty.call(hero.equipment, key)) {
            hero.equipment[key] = null;
        }
    }
    return hero.equipment;
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
        return 'fire';
    }
    return kind || '';
}

function useItemOnScenery(hero, id, kind) {
    var def = ITEM_DB[id];
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
    return { ok: true, id: id, kind: kind, cooked: def.cook || null };
}

function buryItem(hero, id) {
    var def = ITEM_DB[id];
    if (!hero || !id || !def || !def.bury) {
        return false;
    }
    return takeItem(hero, id, 1);
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
    if (current === id) {
        if (heroHasItem(hero, id)) {
            return takeItem(hero, id, 1);
        }
        return false;
    }
    if (!heroHasItem(hero, id)) {
        return false;
    }
    if (!takeItem(hero, id, 1)) {
        return false;
    }
    if (current) {
        if (!canAddItem(hero, current)) {
            addItem(hero, id, 1);
            return false;
        }
        addItem(hero, current, 1);
    }
    hero.equipment[slot] = id;
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
    if (heroHasItem(hero, id)) {
        hero.equipment[slot] = null;
        return true;
    }
    if (!canAddItem(hero, id)) {
        return false;
    }
    addItem(hero, id, 1);
    hero.equipment[slot] = null;
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
    ['food', 'Food']
];

function bankItemTab(id) {
    var def = ITEM_DB[id];
    if (def && def.heal) {
        return 'food';
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
            Hud.log(named[1] + ' increased to ' + s.level + '.');
        }
    }
    applyCombatLevel(hero, true);
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

function normalizeCombatClass(value) {
    if (value === 'ranged' || value === 'magic') {
        return value;
    }
    return 'melee';
}

function heroCombatClass(hero) {
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
