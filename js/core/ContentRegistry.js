/**
 * Applies GameDataPack JSON from Phaser cache into engine globals.
 */
var ContentRegistry = {
    ready: false,
    lastKeys: null,

    _get: function (cache, key) {
        if (!cache || !key || typeof cache.has !== 'function' || !cache.has(key)) {
            return null;
        }
        return cache.get(key);
    },

    _applyShops: function (data) {
        if (!data) {
            return;
        }
        window.GENERAL_SHOP_KEY = data.generalKey || data.GENERAL_SHOP_KEY || 'mira';
        window.WEAPON_SHOP_KEY = data.weaponKey || data.WEAPON_SHOP_KEY || 'arms';
        window.GENERAL_SHOP_STOCK = data.general || data.GENERAL_SHOP_STOCK || [];
        window.WEAPON_SHOP_STOCK = data.weapons || data.WEAPON_SHOP_STOCK || [];
        window.SHOP_CATALOG = window.SHOP_CATALOG || {};
        window.SHOP_CATALOG[window.GENERAL_SHOP_KEY] = window.GENERAL_SHOP_STOCK;
        window.SHOP_CATALOG[window.WEAPON_SHOP_KEY] = window.WEAPON_SHOP_STOCK;
    },

    _applyRecipes: function (data) {
        if (!data) {
            return;
        }
        window.SMELT_RECIPES = data.smelt || data.SMELT_RECIPES || [];
        window.SMITH_RECIPES = data.smith || data.SMITH_RECIPES || [];
        window.CRAFT_RECIPES = data.craft || data.CRAFT_RECIPES || [];
        window.RUNE_ALTAR_TYPES = data.altarRunes || data.RUNE_ALTAR_TYPES || {};
        window.ITEM_COMBOS = data.itemCombos || data.ITEM_COMBOS || [];
        window.QUICK_CRAFT = data.quickCraft || data.QUICK_CRAFT || {};
    },

    _applySpells: function (data) {
        if (!data) {
            return;
        }
        window.SPELLS = data.spells || data.SPELLS || {};
        if (typeof data.highAlchXp === 'number') {
            window.HIGH_ALCH_XP = data.highAlchXp;
        }
    },

    _applyInteriors: function (data) {
        var list;
        if (!data) {
            return;
        }
        list = Array.isArray(data) ? data : (data.list || data.INTERIOR_LIST || []);
        window.INTERIOR_LIST = list;
    },

    _applyGather: function (data) {
        if (!data) {
            return;
        }
        window.RESOURCE_LEVEL = data.resourceLevel || data.RESOURCE_LEVEL || {};
        window.RESOURCE_TOOL_TIER = data.resourceToolTier || data.RESOURCE_TOOL_TIER || {};
        window.TREE_BY_ZONE = data.treeByZone || data.TREE_BY_ZONE || {};
        window.FISH_BY_ZONE = data.fishByZone || data.FISH_BY_ZONE || {};
        window.GATHER_TILE_BINDINGS = data.tileBindings || data.GATHER_TILE_BINDINGS || {};
        window.ORE_BY_ZONE = data.oreByZone || data.ORE_BY_ZONE || {};
        window.FISH_SPOTS_BY_ZONE = data.fishSpotsByZone || data.FISH_SPOTS_BY_ZONE || {};
    },

    _copyKeys: function (data) {
        var k;
        if (!data) {
            return;
        }
        for (k in data) {
            if (Object.prototype.hasOwnProperty.call(data, k)) {
                window[k] = data[k];
            }
        }
    },

    _rebuildZones: function () {
        var list = window.ZONE_LIST;
        var z = {};
        var i;
        if (!list || !list.length) {
            return;
        }
        for (i = 0; i < list.length; i++) {
            if (list[i] && list[i].id) {
                z[list[i].id] = list[i];
            }
        }
        window.ZONES = z;
    },

    _rebuildRoster: function () {
        if (typeof rebuildZoneMobContent === 'function') {
            rebuildZoneMobContent();
            return;
        }
        if (typeof buildZoneMobRoster === 'function' && window.ZONE_MOB_ROSTER_DATA) {
            window.ZONE_MOB_ROSTER = buildZoneMobRoster(window.ZONE_MOB_ROSTER_DATA);
        }
        if (typeof rebuildInteriorDoors === 'function') {
            rebuildInteriorDoors();
        }
    },

    applyPack: function (cache) {
        var items;
        var shops;
        var recipes;
        var gather;
        var loot;
        var zones;
        var npcs;
        var zoneMobs;
        var skills;
        var mobScales;
        var heroDefaults;
        var art;
        var mapDim;
        var mapProps;
        var mapSpecials;
        var mobCombat;
        var quests;
        var biomeParams;
        var bal;

        if (!cache) {
            this.ready = false;
            return false;
        }

        bal = this._get(cache, 'balance');
        if (typeof Balance !== 'undefined' && Balance.apply) {
            Balance.apply(bal);
        }

        items = this._get(cache, 'items');
        if (items) {
            window.ITEM_DB = items;
        }

        shops = this._get(cache, 'shops');
        if (shops) {
            this._applyShops(shops);
        }

        recipes = this._get(cache, 'recipes');
        if (recipes) {
            this._applyRecipes(recipes);
        }

        gather = this._get(cache, 'gather');
        if (gather) {
            this._applyGather(gather);
        }

        loot = this._get(cache, 'loot');
        if (loot) {
            window.LOOT_TABLE = loot;
        }

        zones = this._get(cache, 'zones');
        if (zones) {
            window.ZONE_LIST = Array.isArray(zones) ? zones : (zones.list || zones.ZONE_LIST || []);
            this._rebuildZones();
        }

        npcs = this._get(cache, 'npcs');
        if (npcs) {
            window.NPC_DEFS = npcs.NPC_DEFS || npcs;
        }

        zoneMobs = this._get(cache, 'zoneMobs');
        if (zoneMobs) {
            /* Data only here — rebuild after mobCombat / map dims so pyramid
             * tier order and tile helpers exist (else spawn counts collapse to 0). */
            window.ZONE_MOB_ROSTER_DATA = zoneMobs.ZONE_MOB_ROSTER_DATA || zoneMobs;
        }

        skills = this._get(cache, 'skills');
        if (skills) {
            if (skills.SKILL_NAMES) {
                window.SKILL_NAMES = skills.SKILL_NAMES;
            }
            if (skills.STRETCH_SKILL_NAMES) {
                window.STRETCH_SKILL_NAMES = skills.STRETCH_SKILL_NAMES;
            }
            if (skills.EQUIP_SLOTS) {
                window.EQUIP_SLOTS = skills.EQUIP_SLOTS;
            }
            if (skills.slayer) {
                window.SLAYER_CONFIG = skills.slayer;
            }
            if (skills.clickActions) {
                window.SKILL_CLICK_ACTIONS = skills.clickActions;
            } else {
                window.SKILL_CLICK_ACTIONS = [];
            }
        }

        mobScales = this._get(cache, 'mobScales');
        if (mobScales) {
            this._copyKeys(mobScales);
        }

        heroDefaults = this._get(cache, 'heroDefaults');
        if (heroDefaults) {
            window.HERO_DEFAULTS = heroDefaults;
        }

        art = this._get(cache, 'artManifest');
        if (art) {
            window.ART_MANIFEST = art;
        }

        mapDim = this._get(cache, 'mapDimensions');
        if (mapDim) {
            this._copyKeys(mapDim);
        }

        mapProps = this._get(cache, 'mapProps');
        if (mapProps) {
            this._copyKeys(mapProps);
        }

        mapSpecials = this._get(cache, 'mapSpecials');
        if (mapSpecials) {
            window.MAP_SPECIALS = mapSpecials;
            if (mapSpecials.safeZones && mapSpecials.safeZones.haven
                    && typeof mapSpecials.safeZones.haven.radiusTiles === 'number') {
                window.HAVEN_SAFE_RADIUS_TILES = mapSpecials.safeZones.haven.radiusTiles;
            }
            if (mapSpecials.dungeon && mapSpecials.dungeon.surfaceZoneId) {
                window.DUNGEON_SURFACE_ZONE = mapSpecials.dungeon.surfaceZoneId;
            }
            if (mapSpecials.dungeon && mapSpecials.dungeon.zoneId) {
                window.DUNGEON_ZONE_ID = mapSpecials.dungeon.zoneId;
            }
            if (mapSpecials.shaftMarkers) {
                window.SHAFT_MARKER_STYLE = mapSpecials.shaftMarkers;
            }
        }

        mobCombat = this._get(cache, 'mobCombat');
        if (mobCombat) {
            window.MOB_COMBAT = mobCombat;
            if (mobCombat.MOB_BASE_LEVEL) {
                window.MOB_BASE_LEVEL = mobCombat.MOB_BASE_LEVEL;
            }
            if (mobCombat.MOB_TYPE_ATTACK_RANGE) {
                window.MOB_TYPE_ATTACK_RANGE = mobCombat.MOB_TYPE_ATTACK_RANGE;
            }
            if (mobCombat.POISON_MOB_TYPES) {
                window.POISON_MOB_TYPES = mobCombat.POISON_MOB_TYPES;
            }
            if (mobCombat.MOB_MOVE_SPEED_FACTOR) {
                window.MOB_MOVE_SPEED_FACTOR = mobCombat.MOB_MOVE_SPEED_FACTOR;
            }
            if (mobCombat.MOB_TIER_ORDER) {
                window.MOB_TIER_ORDER = mobCombat.MOB_TIER_ORDER;
            }
            if (typeof mobCombat.MOB_SPAWN_MODIFIER === 'number') {
                window.MOB_SPAWN_MODIFIER = mobCombat.MOB_SPAWN_MODIFIER;
            }
            if (mobCombat.MOB_SPAWN_MODIFIER_OPTIONS) {
                window.MOB_SPAWN_MODIFIER_OPTIONS = mobCombat.MOB_SPAWN_MODIFIER_OPTIONS;
            }
            if (typeof mobCombat.MOB_SPAWN_POOL_MODIFIER === 'number') {
                window.MOB_SPAWN_POOL_MODIFIER = mobCombat.MOB_SPAWN_POOL_MODIFIER;
            }
            if (mobCombat.statsByType) {
                window.MOB_STATS_BY_TYPE = mobCombat.statsByType;
            }
            if (mobCombat.statsDefault) {
                window.MOB_STATS_DEFAULT = mobCombat.statsDefault;
            }
        }

        quests = this._get(cache, 'quests');
        if (quests) {
            window.QUESTS = quests;
        }

        biomeParams = this._get(cache, 'biomeParams');
        if (biomeParams) {
            window.BIOME_PARAMS = biomeParams;
            if (typeof biomeParams.maxPathBlockRatio === 'number') {
                window.MAX_PATH_BLOCK_RATIO = biomeParams.maxPathBlockRatio;
            }
        }

        this._applySpells(this._get(cache, 'spells'));
        this._applyInteriors(this._get(cache, 'mapInteriors'));

        var clues = this._get(cache, 'clues');
        if (clues) {
            window.CLUE_CONFIG = clues;
            window.CLUE_DIG_SPOTS = clues.digSpots || clues.CLUE_DIG_SPOTS || [];
        }

        var legacy = this._get(cache, 'legacyMigrations');
        if (legacy) {
            window.LEGACY_ITEM_ID_MAP = legacy.itemIds || legacy.LEGACY_ITEM_ID_MAP || legacy || {};
        }

        var onboarding = this._get(cache, 'onboarding');
        if (onboarding) {
            window.ONBOARDING = onboarding;
        }

        if (window.ZONE_MOB_ROSTER_DATA) {
            this._rebuildRoster();
        }

        this.ready = true;
        return true;
    },

    applyFromScene: function (scene, keys) {
        if (!scene || !scene.cache || !scene.cache.json) {
            this.ready = false;
            return false;
        }
        this.lastKeys = keys || {};
        return this.applyPack(scene.cache.json);
    }
};

window.ContentRegistry = ContentRegistry;
