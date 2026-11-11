var ITEM_DB = {
    coins: { name: 'Coins', icon: 'assets/svg/items/coins.svg', stack: true, value: 1, examine: 'A small pile of copper and silver coins.' },
    shrimp: { name: 'Cooked shrimp', icon: 'assets/svg/items/shrimp.svg', heal: 12, stack: true, value: 5, buyPrice: 8, sellPrice: 2, examine: 'A cooked shrimp, still warm enough to eat.' },
    rawshrimp: { name: 'Raw shrimp', icon: 'assets/svg/items/rawshrimp.svg', stack: true, cook: 'shrimp', burn: 'burntshrimp', cookXp: 30, value: 5, buyPrice: 6, sellPrice: 1, examine: 'A raw shrimp. It should be cooked.' },
    burntshrimp: { name: 'Burnt shrimp', icon: 'assets/svg/items/burntshrimp.svg', stack: true, value: 1, sellPrice: 1, examine: 'A charred shrimp. Inedible.' },
    rawbeef: { name: 'Raw beef', icon: 'assets/svg/items/rawbeef.svg', stack: true, cook: 'beef', burn: 'burntbeef', cookXp: 30, value: 4, sellPrice: 1, examine: 'A cut of raw beef. Better cooked.' },
    beef: { name: 'Cooked beef', icon: 'assets/svg/items/beef.svg', heal: 16, stack: true, value: 8, buyPrice: 12, sellPrice: 3, examine: 'A seared cut of beef.' },
    burntbeef: { name: 'Burnt beef', icon: 'assets/svg/items/burntbeef.svg', stack: true, value: 1, sellPrice: 1, examine: 'Blackened beef. Best left alone.' },
    bread: { name: 'Bread', icon: 'assets/svg/items/bread.svg', heal: 20, stack: true, value: 12, buyPrice: 16, sellPrice: 4, examine: 'A dense loaf baked for the road.' },
    sword: { name: 'Bronze sword', icon: 'assets/svg/items/sword.svg', slot: 'weapon', damage: 16, attackRange: 24, combatClass: 'melee', tier: 'bronze', value: 26, buyPrice: 40, sellPrice: 10, examine: 'A short bronze blade, nicked but serviceable.' },
    bronzedagger: { name: 'Bronze dagger', icon: 'assets/svg/items/bronzedagger.svg', slot: 'weapon', damage: 10, attackRange: 22, combatClass: 'melee', tier: 'bronze', value: 14, buyPrice: 22, sellPrice: 5, examine: 'A short bronze dagger, freshly forged.' },
    woodclub: { name: 'Wood club', icon: 'assets/svg/items/sword.svg', slot: 'weapon', damage: 8, attackRange: 24, combatClass: 'melee', tier: 'wood', value: 4, buyPrice: 6, sellPrice: 1, examine: 'A crude wooden club.' },
    copperdagger: { name: 'Copper dagger', icon: 'assets/svg/items/bronzedagger.svg', slot: 'weapon', damage: 9, attackRange: 22, combatClass: 'melee', tier: 'copper', value: 10, buyPrice: 14, sellPrice: 3, examine: 'A soft copper dagger.' },
    ironsword: { name: 'Iron sword', icon: 'assets/svg/items/sword.svg', slot: 'weapon', damage: 20, attackRange: 26, combatClass: 'melee', tier: 'iron', value: 40, buyPrice: 60, sellPrice: 16, examine: 'A sturdy iron blade.' },
    shortbow: { name: 'Shortbow', icon: 'assets/svg/items/shortbow.svg', slot: 'weapon', damage: 16, attackRange: 120, combatClass: 'ranged', tier: 'bronze', bowTier: 2, value: 32, buyPrice: 48, sellPrice: 12, examine: 'A shortbow suited to bronze arrows.' },
    woodbow: { name: 'Wood bow', icon: 'assets/svg/items/shortbow.svg', slot: 'weapon', damage: 10, attackRange: 112, combatClass: 'ranged', tier: 'wood', bowTier: 1, value: 12, buyPrice: 18, sellPrice: 4, examine: 'A simple wooden bow.' },
    oakbow: { name: 'Oak bow', icon: 'assets/svg/items/shortbow.svg', slot: 'weapon', damage: 18, attackRange: 128, combatClass: 'ranged', tier: 'iron', bowTier: 3, value: 48, buyPrice: 72, sellPrice: 18, examine: 'An oak bow with a firm draw.' },
    yewbow: { name: 'Yew bow', icon: 'assets/svg/items/shortbow.svg', slot: 'weapon', damage: 24, attackRange: 136, combatClass: 'ranged', tier: 'diamond', bowTier: 4, value: 90, buyPrice: 140, sellPrice: 36, examine: 'A yew war bow.' },
    magicbow: { name: 'Magic bow', icon: 'assets/svg/items/shortbow.svg', slot: 'weapon', damage: 30, attackRange: 144, combatClass: 'ranged', tier: 'dragonite', bowTier: 5, value: 160, buyPrice: 240, sellPrice: 64, examine: 'A rare magic bow.' },
    arrow: { name: 'Bronze arrows', icon: 'assets/svg/items/arrow.svg', slot: 'ammo', stack: true, ammoTier: 2, value: 1, buyPrice: 2, sellPrice: 1, examine: 'A sheaf of bronze arrows with grey-goose fletching.' },
    woodarrow: { name: 'Wooden arrows', icon: 'assets/svg/items/arrow.svg', slot: 'ammo', stack: true, ammoTier: 1, value: 1, buyPrice: 1, sellPrice: 1, examine: 'Simple wooden shafts. Infinite while unequipped ammo.' },
    ironarrow: { name: 'Iron arrows', icon: 'assets/svg/items/arrow.svg', slot: 'ammo', stack: true, ammoTier: 3, value: 2, buyPrice: 4, sellPrice: 1, examine: 'Iron-tipped arrows.' },
    staff: { name: 'Wood staff', icon: 'assets/svg/items/bronzeaxe.svg', slot: 'weapon', damage: 12, attackRange: 104, combatClass: 'magic', tier: 'wood', value: 20, buyPrice: 30, sellPrice: 8, examine: 'A carved staff. Channels Air Strike.' },
    bronzestaff: { name: 'Bronze staff', icon: 'assets/svg/items/bronzeaxe.svg', slot: 'weapon', damage: 16, attackRange: 112, combatClass: 'magic', tier: 'bronze', value: 36, buyPrice: 54, sellPrice: 14, examine: 'A bronze-shod staff.' },
    ironstaff: { name: 'Iron staff', icon: 'assets/svg/items/bronzeaxe.svg', slot: 'weapon', damage: 20, attackRange: 120, combatClass: 'magic', tier: 'iron', value: 55, buyPrice: 80, sellPrice: 22, examine: 'An iron-banded casting staff.' },
    diamondstaff: { name: 'Diamond staff', icon: 'assets/svg/items/bronzeaxe.svg', slot: 'weapon', damage: 26, attackRange: 128, combatClass: 'magic', tier: 'diamond', value: 100, buyPrice: 150, sellPrice: 40, examine: 'A crystal casting staff.' },
    dragonitestaff: { name: 'Dragonite staff', icon: 'assets/svg/items/bronzeaxe.svg', slot: 'weapon', damage: 32, attackRange: 136, combatClass: 'magic', tier: 'dragonite', value: 180, buyPrice: 270, sellPrice: 72, examine: 'A legendary dragonite staff.' },
    wizardhat: { name: 'Wizard hat', icon: 'assets/svg/items/feather.svg', slot: 'head', defence: 0, magicBonus: 1, tier: 'wood', value: 12, buyPrice: 18, sellPrice: 4, examine: 'A soft hat that helps focus spells.' },
    wizardrobe: { name: 'Wizard robe', icon: 'assets/svg/items/gloves.svg', slot: 'body', defence: 1, magicBonus: 2, tier: 'wood', value: 24, buyPrice: 36, sellPrice: 8, examine: 'A light robe for casting.' },
    shield: { name: 'Wooden shield', icon: 'assets/svg/items/shield.svg', slot: 'shield', defence: 1, tier: 'wood', value: 20, buyPrice: 30, sellPrice: 8, examine: 'A round wooden shield bound with iron.' },
    woodaxe: { name: 'Wood axe', icon: 'assets/svg/items/bronzeaxe.svg', tool: 'axe', tier: 'wood', toolTier: 1, value: 6, buyPrice: 8, sellPrice: 2, examine: 'A soft wooden chopping axe.' },
    copperaxe: { name: 'Copper axe', icon: 'assets/svg/items/bronzeaxe.svg', tool: 'axe', tier: 'copper', toolTier: 2, value: 12, buyPrice: 18, sellPrice: 4, examine: 'A copper axe for light chopping.' },
    bronzeaxe: { name: 'Bronze axe', icon: 'assets/svg/items/bronzeaxe.svg', tool: 'axe', tier: 'bronze', toolTier: 3, value: 18, buyPrice: 28, sellPrice: 7, examine: 'A bronze axe for chopping trees.' },
    ironaxe: { name: 'Iron axe', icon: 'assets/svg/items/bronzeaxe.svg', tool: 'axe', tier: 'iron', toolTier: 4, value: 32, buyPrice: 48, sellPrice: 12, examine: 'An iron axe that bites deep.' },
    diamondaxe: { name: 'Diamond axe', icon: 'assets/svg/items/bronzeaxe.svg', tool: 'axe', tier: 'diamond', toolTier: 5, value: 80, buyPrice: 120, sellPrice: 32, examine: 'A glittering diamond axe.' },
    dragoniteaxe: { name: 'Dragonite axe', icon: 'assets/svg/items/bronzeaxe.svg', tool: 'axe', tier: 'dragonite', toolTier: 6, value: 160, buyPrice: 240, sellPrice: 64, examine: 'A dragonite axe of legend.' },
    woodpick: { name: 'Wood pickaxe', icon: 'assets/svg/items/bronzepick.svg', tool: 'pickaxe', tier: 'wood', toolTier: 1, value: 6, buyPrice: 8, sellPrice: 2, examine: 'A soft wooden pick.' },
    copperpick: { name: 'Copper pickaxe', icon: 'assets/svg/items/bronzepick.svg', tool: 'pickaxe', tier: 'copper', toolTier: 2, value: 12, buyPrice: 18, sellPrice: 4, examine: 'A copper pickaxe.' },
    bronzepick: { name: 'Bronze pickaxe', icon: 'assets/svg/items/bronzepick.svg', tool: 'pickaxe', tier: 'bronze', toolTier: 3, value: 18, buyPrice: 28, sellPrice: 7, examine: 'A bronze pickaxe for mining ore.' },
    ironpick: { name: 'Iron pickaxe', icon: 'assets/svg/items/bronzepick.svg', tool: 'pickaxe', tier: 'iron', toolTier: 4, value: 32, buyPrice: 48, sellPrice: 12, examine: 'An iron pickaxe.' },
    diamondpick: { name: 'Diamond pickaxe', icon: 'assets/svg/items/bronzepick.svg', tool: 'pickaxe', tier: 'diamond', toolTier: 5, value: 80, buyPrice: 120, sellPrice: 32, examine: 'A diamond-tipped pick.' },
    dragonitepick: { name: 'Dragonite pickaxe', icon: 'assets/svg/items/bronzepick.svg', tool: 'pickaxe', tier: 'dragonite', toolTier: 6, value: 160, buyPrice: 240, sellPrice: 64, examine: 'A dragonite pickaxe.' },
    net: { name: 'Small fishing net', icon: 'assets/svg/items/net.svg', tool: 'net', value: 8, buyPrice: 12, sellPrice: 3, examine: 'A small fishing net for shrimp.' },
    logs: { name: 'Logs', icon: 'assets/svg/items/logs.svg', stack: true, firemake: true, firemakeXp: 40, value: 2, buyPrice: 4, sellPrice: 1, examine: 'A pile of chopped logs.' },
    oaklogs: { name: 'Oak logs', icon: 'assets/svg/items/logs.svg', stack: true, firemake: true, firemakeXp: 60, value: 6, buyPrice: 10, sellPrice: 2, examine: 'Sturdy oak logs.' },
    yewlogs: { name: 'Yew logs', icon: 'assets/svg/items/logs.svg', stack: true, firemake: true, firemakeXp: 90, value: 14, buyPrice: 24, sellPrice: 5, examine: 'Dense yew logs.' },
    magiclogs: { name: 'Magic logs', icon: 'assets/svg/items/logs.svg', stack: true, firemake: true, firemakeXp: 120, value: 28, buyPrice: 48, sellPrice: 10, examine: 'Logs that hum with latent magic.' },
    copper: { name: 'Copper ore', icon: 'assets/svg/items/copper.svg', stack: true, value: 3, buyPrice: 6, sellPrice: 1, examine: 'A chunk of copper ore.' },
    tin: { name: 'Tin ore', icon: 'assets/svg/items/tin.svg', stack: true, value: 3, buyPrice: 6, sellPrice: 1, examine: 'A chunk of tin ore.' },
    iron: { name: 'Iron ore', icon: 'assets/svg/items/tin.svg', stack: true, value: 8, buyPrice: 14, sellPrice: 3, examine: 'A chunk of iron ore.' },
    diamondore: { name: 'Diamond ore', icon: 'assets/svg/items/copper.svg', stack: true, value: 40, buyPrice: 70, sellPrice: 16, examine: 'Ore glittering with hard crystal.' },
    dragoniteore: { name: 'Dragonite ore', icon: 'assets/svg/items/copper.svg', stack: true, value: 80, buyPrice: 140, sellPrice: 32, examine: 'Rare ore warm with dragonite veins.' },
    runeessence: { name: 'Rune essence', icon: 'assets/svg/items/airrune.svg', stack: true, value: 2, buyPrice: 4, sellPrice: 1, examine: 'Blank essence ready for an altar.' },
    copperbar: { name: 'Copper bar', icon: 'assets/svg/items/bronzebar.svg', stack: true, value: 8, buyPrice: 14, sellPrice: 3, examine: 'A soft copper bar.' },
    bronzebar: { name: 'Bronze bar', icon: 'assets/svg/items/bronzebar.svg', stack: true, value: 12, buyPrice: 20, sellPrice: 4, examine: 'A smelted bronze bar.' },
    ironbar: { name: 'Iron bar', icon: 'assets/svg/items/bronzebar.svg', stack: true, value: 22, buyPrice: 36, sellPrice: 8, examine: 'A sturdy iron bar.' },
    diamondbar: { name: 'Diamond bar', icon: 'assets/svg/items/bronzebar.svg', stack: true, value: 70, buyPrice: 120, sellPrice: 28, examine: 'A crystal-hardened bar.' },
    dragonitebar: { name: 'Dragonite bar', icon: 'assets/svg/items/bronzebar.svg', stack: true, value: 140, buyPrice: 240, sellPrice: 56, examine: 'A legendary dragonite bar.' },
    tinderbox: { name: 'Tinderbox', icon: 'assets/svg/items/tinderbox.svg', value: 5, buyPrice: 8, sellPrice: 2, examine: 'A small box of flint and steel.' },
    bones: { name: 'Bones', icon: 'assets/svg/items/bones.svg', stack: true, bury: true, buryXp: 4, shrineXp: 8, value: 1, sellPrice: 1, examine: 'Dry bones. Someone should bury them.' },
    feather: { name: 'Feathers', icon: 'assets/svg/items/feather.svg', stack: true, value: 1, buyPrice: 2, sellPrice: 1, examine: 'Soft feathers from a bird.' },
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
    guam: { name: 'Guam leaf', icon: 'assets/svg/items/feather.svg', stack: true, value: 2, buyPrice: 5, sellPrice: 1, examine: 'A bitter herb leaf.' },
    attackpot: { name: 'Attack potion', icon: 'assets/svg/items/shrimp.svg', stack: true, drink: true, value: 12, examine: 'A vial boosting attack briefly.' },
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
    { id: 'logs', stock: 12, restockTo: 12, restockMs: 45000 },
    { id: 'oaklogs', stock: 6, restockTo: 6, restockMs: 60000 },
    { id: 'copper', stock: 8, restockTo: 8, restockMs: 45000 },
    { id: 'tin', stock: 8, restockTo: 8, restockMs: 45000 },
    { id: 'iron', stock: 4, restockTo: 4, restockMs: 90000 },
    { id: 'bronzebar', stock: 3, restockTo: 3, restockMs: 90000 },
    { id: 'ironbar', stock: 2, restockTo: 2, restockMs: 120000 },
    { id: 'yewlogs', stock: 3, restockTo: 3, restockMs: 120000 },
    { id: 'magiclogs', stock: 2, restockTo: 2, restockMs: 180000 },
    { id: 'diamondore', stock: 2, restockTo: 2, restockMs: 180000 },
    { id: 'dragoniteore', stock: 1, restockTo: 1, restockMs: 300000 },
    { id: 'runeessence', stock: 20, restockTo: 20, restockMs: 45000 },
    { id: 'guam', stock: 6, restockTo: 6, restockMs: 60000 },
    { id: 'feather', stock: 20, restockTo: 20, restockMs: 45000 },
    { id: 'firerune', stock: 20, restockTo: 20, restockMs: 45000 },
    { id: 'waterrune', stock: 20, restockTo: 20, restockMs: 45000 },
    { id: 'earthrune', stock: 20, restockTo: 20, restockMs: 45000 },
    { id: 'naturerune', stock: 10, restockTo: 10, restockMs: 60000 },
    { id: 'airrune', stock: 20, restockTo: 20, restockMs: 45000 },
    { id: 'mindrune', stock: 20, restockTo: 20, restockMs: 45000 }
];
var WEAPON_SHOP_STOCK = [
    { id: 'bronzedagger', stock: 4, restockTo: 4, restockMs: 90000 },
    { id: 'copperdagger', stock: 3, restockTo: 3, restockMs: 90000 },
    { id: 'woodclub', stock: 3, restockTo: 3, restockMs: 90000 },
    { id: 'sword', stock: 2, restockTo: 2, restockMs: 120000 },
    { id: 'ironsword', stock: 1, restockTo: 1, restockMs: 180000 },
    { id: 'shield', stock: 2, restockTo: 2, restockMs: 120000 },
    { id: 'gloves', stock: 2, restockTo: 2, restockMs: 120000 },
    { id: 'woodbow', stock: 2, restockTo: 2, restockMs: 90000 },
    { id: 'shortbow', stock: 1, restockTo: 1, restockMs: 120000 },
    { id: 'oakbow', stock: 1, restockTo: 1, restockMs: 150000 },
    { id: 'woodarrow', stock: 40, restockTo: 40, restockMs: 45000 },
    { id: 'arrow', stock: 40, restockTo: 40, restockMs: 45000 },
    { id: 'ironarrow', stock: 20, restockTo: 20, restockMs: 60000 },
    { id: 'staff', stock: 2, restockTo: 2, restockMs: 120000 },
    { id: 'bronzestaff', stock: 1, restockTo: 1, restockMs: 150000 },
    { id: 'ironstaff', stock: 1, restockTo: 1, restockMs: 180000 },
    { id: 'wizardhat', stock: 1, restockTo: 1, restockMs: 120000 },
    { id: 'wizardrobe', stock: 1, restockTo: 1, restockMs: 120000 },
    { id: 'airrune', stock: 40, restockTo: 40, restockMs: 45000 },
    { id: 'mindrune', stock: 40, restockTo: 40, restockMs: 45000 },
    { id: 'woodaxe', stock: 2, restockTo: 2, restockMs: 90000 },
    { id: 'woodpick', stock: 2, restockTo: 2, restockMs: 90000 },
    { id: 'copperaxe', stock: 1, restockTo: 1, restockMs: 120000 },
    { id: 'copperpick', stock: 1, restockTo: 1, restockMs: 120000 },
    { id: 'ironaxe', stock: 1, restockTo: 1, restockMs: 180000 },
    { id: 'ironpick', stock: 1, restockTo: 1, restockMs: 180000 },
    { id: 'diamondaxe', stock: 1, restockTo: 1, restockMs: 300000 },
    { id: 'diamondpick', stock: 1, restockTo: 1, restockMs: 300000 },
    { id: 'dragoniteaxe', stock: 1, restockTo: 1, restockMs: 420000 },
    { id: 'dragonitepick', stock: 1, restockTo: 1, restockMs: 420000 },
    { id: 'yewbow', stock: 1, restockTo: 1, restockMs: 240000 },
    { id: 'magicbow', stock: 1, restockTo: 1, restockMs: 360000 },
    { id: 'diamondstaff', stock: 1, restockTo: 1, restockMs: 240000 },
    { id: 'dragonitestaff', stock: 1, restockTo: 1, restockMs: 360000 }
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
    logs: 1,
    oaklogs: 15,
    yewlogs: 40,
    magiclogs: 60,
    copper: 1,
    tin: 1,
    iron: 15,
    runeessence: 1,
    diamondore: 40,
    dragoniteore: 60
};

var TREE_BY_ZONE = {
    haven: { log: 'logs', level: 1 },
    millfields: { log: 'logs', level: 1 },
    westmead: { log: 'logs', level: 1 },
    southshore: { log: 'logs', level: 1 },
    northwood: { log: 'oaklogs', level: 15 },
    mire: { log: 'oaklogs', level: 15 },
    highlands: { log: 'yewlogs', level: 40 },
    graves: { log: 'magiclogs', level: 60 },
    darkmine: { log: 'logs', level: 1 }
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

function makeHero() {
    var hero = {
        hp: 100,
        maxHp: 100,
        damage: 16,
        gold: 8,
        xp: 0,
        level: 1,
        style: 'shared',
        stance: 'melee',
        autoAttack: true,
        autoRetaliate: true,
        autoPickup: true,
        shiftClickDrop: true,
        hideBones: false,
        showCombatVisuals: true,
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
            eq.weapon = 'sword';
            eq.shield = 'shield';
            return eq;
        }()),
        equipmentQty: {},
        inventory: [
            { id: 'coins', qty: 8 },
            { id: 'sword', qty: 1 },
            { id: 'shield', qty: 1 },
            { id: 'shortbow', qty: 1 },
            { id: 'staff', qty: 1 },
            { id: 'bronzeaxe', qty: 1 },
            { id: 'bronzepick', qty: 1 },
            { id: 'airrune', qty: 30 },
            { id: 'mindrune', qty: 30 },
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
    if (id === 'copper' || id === 'tin' || id === 'iron' || id === 'diamondore' || id === 'dragoniteore') {
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
    if (id === 'coins' || id === 'burntshrimp' || id === 'burntbeef' || id === 'key') {
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
    if (!opts.skipTool && !hasAnyToolKind(hero, 'axe')) {
        return { ok: false, needTool: WOODCUT_AXE_ID, toolName: 'an axe' };
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
    if (!opts.skipTool && !hasAnyToolKind(hero, 'pickaxe')) {
        return { ok: false, needTool: MINE_PICK_ID, toolName: 'a pickaxe', ore: ore };
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

var SMELT_RECIPES = [
    { id: 'copperbar', label: 'Smelt copper bar', inputs: [['copper', 1]], xp: 12, need: 1 },
    { id: 'bronzebar', label: 'Smelt bronze bar (copper + tin)', inputs: [['copper', 1], ['tin', 1]], xp: SMELT_BRONZE_XP, need: 1 },
    { id: 'ironbar', label: 'Smelt iron bar', inputs: [['iron', 1]], xp: 25, need: 15 },
    { id: 'diamondbar', label: 'Smelt diamond bar', inputs: [['diamondore', 1]], xp: 50, need: 40 },
    { id: 'dragonitebar', label: 'Smelt dragonite bar', inputs: [['dragoniteore', 1]], xp: 70, need: 60 }
];

var SMITH_RECIPES = [
    { id: 'copperdagger', label: 'Smith copper dagger', bar: 'copperbar', bars: 1, xp: 14, need: 1 },
    { id: 'copperaxe', label: 'Smith copper axe', bar: 'copperbar', bars: 1, xp: 16, need: 1 },
    { id: 'copperpick', label: 'Smith copper pickaxe', bar: 'copperbar', bars: 1, xp: 16, need: 1 },
    { id: 'bronzedagger', label: 'Smith bronze dagger', bar: 'bronzebar', bars: 1, xp: SMITH_DAGGER_XP, need: 1 },
    { id: 'sword', label: 'Smith bronze sword', bar: 'bronzebar', bars: 2, xp: 28, need: 5 },
    { id: 'bronzeaxe', label: 'Smith bronze axe', bar: 'bronzebar', bars: 1, xp: 24, need: 5 },
    { id: 'bronzepick', label: 'Smith bronze pickaxe', bar: 'bronzebar', bars: 1, xp: 24, need: 5 },
    { id: 'bronzestaff', label: 'Smith bronze staff', bar: 'bronzebar', bars: 2, extra: [['logs', 1]], xp: 30, need: 8 },
    { id: 'ironsword', label: 'Smith iron sword', bar: 'ironbar', bars: 2, xp: 40, need: 15 },
    { id: 'ironaxe', label: 'Smith iron axe', bar: 'ironbar', bars: 1, xp: 36, need: 15 },
    { id: 'ironpick', label: 'Smith iron pickaxe', bar: 'ironbar', bars: 1, xp: 36, need: 15 },
    { id: 'ironstaff', label: 'Smith iron staff', bar: 'ironbar', bars: 2, extra: [['oaklogs', 1]], xp: 44, need: 20 },
    { id: 'diamondaxe', label: 'Smith diamond axe', bar: 'diamondbar', bars: 1, xp: 70, need: 40 },
    { id: 'diamondpick', label: 'Smith diamond pickaxe', bar: 'diamondbar', bars: 1, xp: 70, need: 40 },
    { id: 'diamondstaff', label: 'Smith diamond staff', bar: 'diamondbar', bars: 2, extra: [['yewlogs', 1]], xp: 80, need: 45 },
    { id: 'dragoniteaxe', label: 'Smith dragonite axe', bar: 'dragonitebar', bars: 1, xp: 100, need: 60 },
    { id: 'dragonitepick', label: 'Smith dragonite pickaxe', bar: 'dragonitebar', bars: 1, xp: 100, need: 60 },
    { id: 'dragonitestaff', label: 'Smith dragonite staff', bar: 'dragonitebar', bars: 2, extra: [['magiclogs', 1]], xp: 120, need: 65 }
];

var CRAFT_RECIPES = [
    { id: 'tan:cowhide', label: 'Tan cowhide', kind: 'tan', xpSkill: 'crafting' },
    { id: 'string:fur', label: 'Spin string from rabbit fur', inputs: [['rabbitfur', 1]], output: 'string', qty: 1, xp: 8, xpSkill: 'crafting', need: 1 },
    { id: 'stitch:gloves', label: 'Stitch leather gloves', inputs: [['leather', 1], ['string', 1]], output: 'gloves', qty: 1, xp: CRAFT_LEATHER_XP, xpSkill: 'crafting', need: 1 },
    { id: 'net', label: 'Weave fishing net', inputs: [['string', 3]], output: 'net', qty: 1, xp: 18, xpSkill: 'crafting', need: 1 },
    { id: 'woodclub', label: 'Carve wood club', inputs: [['logs', 1]], output: 'woodclub', qty: 1, xp: 12, xpSkill: 'crafting', need: 1 },
    { id: 'shield', label: 'Carve wooden shield', inputs: [['logs', 2]], output: 'shield', qty: 1, xp: 20, xpSkill: 'crafting', need: 1 },
    { id: 'woodaxe', label: 'Carve wood axe', inputs: [['logs', 2]], output: 'woodaxe', qty: 1, xp: 14, xpSkill: 'crafting', need: 1 },
    { id: 'woodpick', label: 'Carve wood pickaxe', inputs: [['logs', 2]], output: 'woodpick', qty: 1, xp: 14, xpSkill: 'crafting', need: 1 },
    { id: 'staff', label: 'Carve wood staff', inputs: [['logs', 2]], output: 'staff', qty: 1, xp: 18, xpSkill: 'crafting', need: 1 },
    { id: 'wizardhat', label: 'Sew wizard hat', inputs: [['leather', 1], ['feather', 2]], output: 'wizardhat', qty: 1, xp: 22, xpSkill: 'crafting', need: 5 },
    { id: 'wizardrobe', label: 'Sew wizard robe', inputs: [['leather', 2], ['string', 1]], output: 'wizardrobe', qty: 1, xp: 28, xpSkill: 'crafting', need: 8 },
    { id: 'woodbow', label: 'Fletch wood bow', inputs: [['logs', 1], ['string', 1]], output: 'woodbow', qty: 1, xp: 16, xpSkill: 'fletching', need: 1 },
    { id: 'shortbow', label: 'Fletch shortbow', inputs: [['logs', 1], ['string', 1]], output: 'shortbow', qty: 1, xp: 22, xpSkill: 'fletching', need: 5 },
    { id: 'oakbow', label: 'Fletch oak bow', inputs: [['oaklogs', 1], ['string', 1]], output: 'oakbow', qty: 1, xp: 36, xpSkill: 'fletching', need: 15 },
    { id: 'yewbow', label: 'Fletch yew bow', inputs: [['yewlogs', 1], ['string', 1]], output: 'yewbow', qty: 1, xp: 60, xpSkill: 'fletching', need: 40 },
    { id: 'magicbow', label: 'Fletch magic bow', inputs: [['magiclogs', 1], ['string', 1]], output: 'magicbow', qty: 1, xp: 90, xpSkill: 'fletching', need: 60 },
    { id: 'woodarrow', label: 'Fletch wooden arrows (x10)', inputs: [['logs', 1], ['feather', 1]], output: 'woodarrow', qty: 10, xp: 10, xpSkill: 'fletching', need: 1 },
    { id: 'arrow', label: 'Fletch bronze arrows (x10)', inputs: [['bronzebar', 1], ['feather', 1]], output: 'arrow', qty: 10, xp: 18, xpSkill: 'fletching', need: 5 },
    { id: 'ironarrow', label: 'Fletch iron arrows (x10)', inputs: [['ironbar', 1], ['feather', 1]], output: 'ironarrow', qty: 10, xp: 30, xpSkill: 'fletching', need: 15 },
    { id: 'shortbowunstrung', label: 'Fletch shortbow (u)', inputs: [['logs', 1]], output: 'shortbowunstrung', qty: 1, xp: 14, xpSkill: 'fletching', need: 1 },
    { id: 'oakplank', label: 'Saw oak plank', inputs: [['oaklogs', 1]], output: 'oakplank', qty: 1, xp: 20, xpSkill: 'construction', need: 1 }
];

var RUNE_ALTAR_TYPES = {
    airrune: { label: 'Craft air runes', need: 1, xp: 10 },
    mindrune: { label: 'Craft mind runes', need: 1, xp: 10 },
    waterrune: { label: 'Craft water runes', need: 5, xp: 12 },
    earthrune: { label: 'Craft earth runes', need: 5, xp: 12 },
    firerune: { label: 'Craft fire runes', need: 10, xp: 14 },
    naturerune: { label: 'Craft nature runes', need: 20, xp: 20 }
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
    return smeltRecipe(hero, findSmeltRecipe('bronzebar'));
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
    return smithRecipe(hero, findSmithRecipe('bronzedagger'));
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

function consumeAirStrikeRunes(hero) {
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
    return true;
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

function equippedWeaponDamage(hero, fallback) {
    var base = typeof fallback === 'number' ? fallback : 0;
    var def;
    var id;
    if (!hero || !hero.equipment) {
        return base + attackPotionBonus(hero);
    }
    id = hero.equipment.weapon;
    if (!id) {
        return base + attackPotionBonus(hero);
    }
    def = ITEM_DB[id];
    if (def && typeof def.damage === 'number') {
        return def.damage + attackPotionBonus(hero);
    }
    return base + attackPotionBonus(hero);
}

var DEFAULT_MELEE_ATTACK_RANGE = 24;
var DEFAULT_RANGED_ATTACK_RANGE = 120;
var DEFAULT_MAGIC_ATTACK_RANGE = 104;

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

function normalizeHeroCombat(hero) {
    var labels;
    if (!hero) {
        return hero;
    }
    if (!hero.flags) {
        hero.flags = {};
    }
    if (typeof hero.flags.dragonDenOpen !== 'boolean') {
        hero.flags.dragonDenOpen = !!hero.flags.dragonDenOpen;
    }
    if (typeof hero.showCombatVisuals !== 'boolean') {
        hero.showCombatVisuals = true;
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
