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
    },

    _applyGather: function (data) {
        if (!data) {
            return;
        }
        window.RESOURCE_LEVEL = data.resourceLevel || data.RESOURCE_LEVEL || {};
        window.RESOURCE_TOOL_TIER = data.resourceToolTier || data.RESOURCE_TOOL_TIER || {};
        window.TREE_BY_ZONE = data.treeByZone || data.TREE_BY_ZONE || {};
        window.FISH_BY_ZONE = data.fishByZone || data.FISH_BY_ZONE || {};
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
            window.ZONE_MOB_ROSTER_DATA = zoneMobs.ZONE_MOB_ROSTER_DATA || zoneMobs;
            this._rebuildRoster();
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
