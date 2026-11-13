/**
 * Content Pack API façade over globals filled by ContentRegistry.applyPack.
 * Engine code should prefer these helpers over raw window tables when practical.
 */
var Content = {
    ready: function () {
        return !!(typeof ContentRegistry !== 'undefined' && ContentRegistry.ready);
    },

    getMeta: function () {
        if (typeof GameDataPack !== 'undefined' && GameDataPack.getMeta) {
            return GameDataPack.getMeta() || {};
        }
        return {};
    },

    getItem: function (id) {
        return (typeof ITEM_DB !== 'undefined' && ITEM_DB && id) ? ITEM_DB[id] : null;
    },

    allItems: function () {
        return typeof ITEM_DB !== 'undefined' ? ITEM_DB : {};
    },

    getZone: function (id) {
        return (typeof ZONES !== 'undefined' && ZONES) ? ZONES[id] : null;
    },

    listZones: function () {
        return (typeof ZONE_LIST !== 'undefined' && ZONE_LIST) ? ZONE_LIST : [];
    },

    listNpcs: function (zoneId) {
        var defs = typeof NPC_DEFS !== 'undefined' ? NPC_DEFS : null;
        if (!defs) {
            return [];
        }
        if (zoneId) {
            return defs[zoneId] || [];
        }
        return defs;
    },

    getMobDefs: function (zoneId) {
        if (typeof MOB_DEFS !== 'undefined' && MOB_DEFS && zoneId) {
            return MOB_DEFS[zoneId] || [];
        }
        return [];
    },

    getBalance: function (path) {
        if (typeof Balance !== 'undefined' && Balance.get) {
            return Balance.get(path);
        }
        return undefined;
    },

    getMobCombat: function (type) {
        var table = typeof MOB_COMBAT !== 'undefined' ? MOB_COMBAT : null;
        if (!table || !type) {
            return null;
        }
        return {
            baseLevel: table.MOB_BASE_LEVEL ? table.MOB_BASE_LEVEL[type] : null,
            attackRange: table.MOB_TYPE_ATTACK_RANGE ? table.MOB_TYPE_ATTACK_RANGE[type] : null,
            poison: !!(table.POISON_MOB_TYPES && table.POISON_MOB_TYPES[type]),
            moveFactor: table.MOB_MOVE_SPEED_FACTOR ? table.MOB_MOVE_SPEED_FACTOR[type] : null
        };
    },

    getQuest: function (id) {
        var q = typeof QUESTS !== 'undefined' ? QUESTS : null;
        return q && id ? q[id] : null;
    },

    mapSpecials: function () {
        return typeof MAP_SPECIALS !== 'undefined' ? MAP_SPECIALS : null;
    },

    biomeParams: function () {
        return typeof BIOME_PARAMS !== 'undefined' ? BIOME_PARAMS : null;
    },

    zoneHasFeature: function (zoneId, feature) {
        var specials = this.mapSpecials();
        var list;
        if (!specials || !specials.features || !zoneId || !feature) {
            return false;
        }
        list = specials.features[zoneId];
        return !!(list && list.indexOf(feature) >= 0);
    },

    /** Safe-zone policy for pathfind / mob AI (pack-driven). */
    safeZonePolicy: function (zoneId) {
        var specials = this.mapSpecials();
        var entry;
        var center;
        if (!specials || !specials.safeZones || !zoneId) {
            return null;
        }
        entry = specials.safeZones[zoneId];
        if (!entry) {
            return null;
        }
        if (entry.centerFrom === 'TOWN_CENTER_TILE'
                && typeof TOWN_CENTER_TILE !== 'undefined' && TOWN_CENTER_TILE) {
            center = TOWN_CENTER_TILE;
        } else if (entry.center) {
            center = entry.center;
        } else {
            center = { x: 18, y: 15 };
        }
        return {
            center: center,
            radiusTiles: typeof entry.radiusTiles === 'number' ? entry.radiusTiles : 5
        };
    },

    assetUrl: function (rel) {
        if (typeof GameDataPack !== 'undefined' && GameDataPack.assetUrl) {
            return GameDataPack.assetUrl(rel);
        }
        return rel;
    }
};

window.Content = Content;
