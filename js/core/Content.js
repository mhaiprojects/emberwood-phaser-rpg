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

    defaultZoneId: function () {
        var meta = this.getMeta();
        return (meta && meta.defaultZoneId) || 'haven';
    },

    defaultQuestId: function () {
        var meta = this.getMeta();
        return (meta && meta.defaultQuestId) || 'goblins';
    },

    getItem: function (id) {
        return (typeof ITEM_DB !== 'undefined' && ITEM_DB && id) ? ITEM_DB[id] : null;
    },

    allItems: function () {
        return typeof ITEM_DB !== 'undefined' ? ITEM_DB : {};
    },

    itemIcon: function (id) {
        if (typeof itemIcon === 'function') {
            return itemIcon(id);
        }
        var def = this.getItem(id);
        var rel = def && def.icon ? def.icon : 'assets/svg/items/coins.svg';
        return this.assetUrl(rel);
    },

    itemTextureKey: function (id) {
        if (typeof itemTextureKey === 'function') {
            return itemTextureKey(id);
        }
        return id ? ('item-' + String(id)) : 'item-coins';
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

    getNpc: function (zoneId, key) {
        var list = this.listNpcs(zoneId);
        var i;
        if (!list || !list.length) {
            return null;
        }
        for (i = 0; i < list.length; i++) {
            if (list[i] && list[i].key === key) {
                return list[i];
            }
        }
        return null;
    },

    getMobDefs: function (zoneId) {
        if (typeof MOB_DEFS !== 'undefined' && MOB_DEFS && zoneId) {
            return MOB_DEFS[zoneId] || [];
        }
        return [];
    },

    getMobRoster: function (zoneId) {
        if (typeof ZONE_MOB_ROSTER !== 'undefined' && ZONE_MOB_ROSTER && zoneId) {
            return ZONE_MOB_ROSTER[zoneId] || null;
        }
        return null;
    },

    lootForMob: function (def) {
        if (typeof lootForMob === 'function') {
            return lootForMob(def);
        }
        return [];
    },

    getRecipe: function (kind, id) {
        var list;
        if (kind === 'smelt') {
            list = typeof SMELT_RECIPES !== 'undefined' ? SMELT_RECIPES : [];
        } else if (kind === 'smith') {
            list = typeof SMITH_RECIPES !== 'undefined' ? SMITH_RECIPES : [];
        } else if (kind === 'craft') {
            list = typeof CRAFT_RECIPES !== 'undefined' ? CRAFT_RECIPES : [];
        } else {
            return null;
        }
        var i;
        for (i = 0; i < list.length; i++) {
            if (list[i] && (list[i].id === id || list[i].out === id || list[i].input === id)) {
                return list[i];
            }
        }
        return null;
    },

    getShop: function (key) {
        if (typeof SHOP_CATALOG !== 'undefined' && SHOP_CATALOG && key) {
            return SHOP_CATALOG[key] || null;
        }
        return null;
    },

    gatherSpec: function (zoneId) {
        return {
            tree: (typeof TREE_BY_ZONE !== 'undefined' && TREE_BY_ZONE) ? TREE_BY_ZONE[zoneId] : null,
            fish: (typeof FISH_BY_ZONE !== 'undefined' && FISH_BY_ZONE) ? FISH_BY_ZONE[zoneId] : null,
            resourceLevel: typeof RESOURCE_LEVEL !== 'undefined' ? RESOURCE_LEVEL : {},
            resourceToolTier: typeof RESOURCE_TOOL_TIER !== 'undefined' ? RESOURCE_TOOL_TIER : {}
        };
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

    makeDefaultQuest: function () {
        var id = this.defaultQuestId();
        var def = this.getQuest(id) || {};
        return {
            id: id,
            stage: 0,
            progress: 0,
            goal: typeof def.goal === 'number' ? def.goal : 5,
            points: 0
        };
    },

    findQuestByNpc: function (npcKey) {
        var all = typeof QUESTS !== 'undefined' ? QUESTS : null;
        var id;
        var def;
        if (!all || !npcKey) {
            return null;
        }
        for (id in all) {
            if (!Object.prototype.hasOwnProperty.call(all, id)) {
                continue;
            }
            def = all[id];
            if (def && def.npcKey === npcKey) {
                return def;
            }
        }
        return null;
    },

    _formatQuestText: function (tpl, ctx) {
        if (!tpl) {
            return '';
        }
        return String(tpl)
            .replace(/\{progress\}/g, String(ctx.progress != null ? ctx.progress : 0))
            .replace(/\{goal\}/g, String(ctx.goal != null ? ctx.goal : 0));
    },

    journalSteps: function (quest) {
        var def = this.getQuest(quest && quest.id ? quest.id : this.defaultQuestId());
        var journal = (def && def.journal) || [];
        var stage = quest && quest.stage != null ? quest.stage : 0;
        var progress = quest && quest.progress != null ? quest.progress : 0;
        var goal = quest && quest.goal != null ? quest.goal : (def && def.goal) || 5;
        var ctx = { progress: Math.min(progress, goal), goal: goal };
        var steps = [];
        var i;
        for (i = 0; i < journal.length; i++) {
            steps.push({
                label: this._formatQuestText(journal[i], ctx),
                done: stage > i || (i === 1 && stage === 1 && progress >= goal)
                    || (i === 1 && stage >= 2)
            });
        }
        /* Match legacy journal done flags when pack has 3 steps */
        if (steps.length >= 3) {
            steps[0].done = stage >= 1;
            steps[1].done = stage >= 2 || (stage === 1 && progress >= goal);
            steps[2].done = stage >= 3;
        }
        return steps;
    },

    /**
     * Pack-driven quest talk stage machine.
     * Mutates quest (main) and/or hero.sideQuests. Returns null if NPC has no quest.
     */
    applyNpcQuestTalk: function (npcKey, quest, hero) {
        var def = this.findQuestByNpc(npcKey);
        var state;
        var stage;
        var stageObj;
        var pages;
        var rewards;
        var skill;
        var toast = null;
        var qpTarget;
        if (!def || !hero) {
            return null;
        }
        if (def.sideKey) {
            if (!hero.sideQuests) {
                hero.sideQuests = {};
            }
            if (!hero.sideQuests[def.sideKey]) {
                hero.sideQuests[def.sideKey] = {
                    stage: 0,
                    progress: 0,
                    goal: def.goal || 1
                };
            }
            state = hero.sideQuests[def.sideKey];
            qpTarget = quest;
        } else {
            state = quest;
            if (state && !state.id) {
                state.id = def.id;
            }
            qpTarget = state;
        }
        if (typeof state.goal !== 'number' && typeof def.goal === 'number') {
            state.goal = def.goal;
        }
        stage = state.stage || 0;
        stageObj = (def.stages && def.stages[String(stage)]) || null;
        if (!stageObj) {
            return { pages: null, toast: null, useNpcLines: !!def.sideKey, leveled: false };
        }
        if (stageObj.progressLine) {
            pages = [this._formatQuestText(stageObj.progressLine, state)];
        } else if (stageObj.lines && stageObj.lines.length) {
            pages = stageObj.lines.slice();
        } else {
            pages = [];
        }
        if (typeof stageObj.advanceTo === 'number') {
            state.stage = stageObj.advanceTo;
            if (stageObj.advanceTo === 1) {
                state.progress = 0;
            }
        }
        if (stageObj.complete) {
            if (typeof stageObj.questPoints === 'number' && qpTarget) {
                qpTarget.points = (qpTarget.points || 0) + stageObj.questPoints;
            }
            rewards = stageObj.rewards || {};
            if (rewards.coins && typeof addItem === 'function') {
                addItem(hero, 'coins', rewards.coins);
            }
            if (rewards.skills && typeof gainSkillXp === 'function') {
                for (skill in rewards.skills) {
                    if (Object.prototype.hasOwnProperty.call(rewards.skills, skill)) {
                        gainSkillXp(hero, skill, rewards.skills[skill]);
                    }
                }
            }
            if (stageObj.toastTitle || stageObj.toastBody) {
                toast = {
                    title: stageObj.toastTitle || 'Quest complete',
                    body: stageObj.toastBody || ''
                };
            }
        }
        if (def.sideKey && state.stage >= 3 && (!pages || !pages.length)) {
            return { pages: null, toast: toast, useNpcLines: true, leveled: !!stageObj.complete };
        }
        return {
            pages: pages,
            toast: toast,
            useNpcLines: false,
            leveled: !!(stageObj.complete && !def.sideKey)
        };
    },

    mapProps: function () {
        return {
            campfires: typeof CAMPFIRE_SPOTS !== 'undefined' ? CAMPFIRE_SPOTS : null,
            town: typeof TOWN_PROPS !== 'undefined' ? TOWN_PROPS : null,
            shore: typeof SHORE_PROPS !== 'undefined' ? SHORE_PROPS : null
        };
    },

    mapSpecials: function () {
        return typeof MAP_SPECIALS !== 'undefined' ? MAP_SPECIALS : null;
    },

    biomeParams: function () {
        return typeof BIOME_PARAMS !== 'undefined' ? BIOME_PARAMS : null;
    },

    getArtManifest: function () {
        return typeof ART_MANIFEST !== 'undefined' ? ART_MANIFEST : null;
    },

    getHeroDefaults: function () {
        return typeof HERO_DEFAULTS !== 'undefined' ? HERO_DEFAULTS : null;
    },

    getSkills: function () {
        return typeof SKILL_NAMES !== 'undefined' ? SKILL_NAMES : [];
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

    policy: {
        safeZone: function (zoneId) {
            return Content.safeZonePolicy(zoneId);
        }
    },

    assetUrl: function (rel) {
        if (typeof GameDataPack !== 'undefined' && GameDataPack.assetUrl) {
            return GameDataPack.assetUrl(rel);
        }
        return rel;
    }
};

window.Content = Content;
