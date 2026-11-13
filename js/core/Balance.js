/**
 * Tunable gameplay numbers. Defaults match legacy WorldScene/Items/OverworldCombat.
 * BootScene may overwrite via ContentRegistry + js/content/balance.json.
 */
var Balance = {
    _data: null,

    DEFAULTS: {
        move: {
            walkPxPerSec: 90,
            runPxPerSec: 180,
            runEnergyMax: 100,
            runDrainPerSec: 25,
            runRestorePerSec: 15
        },
        combat: {
            tickSec: 0.6,
            meleeEngagePx: 24,
            mobAggroRangePx: 112,
            mobLeashTiles: 4,
            mobRespawnSec: 18,
            fleePushPx: 32,
            fleeGraceMs: 1100,
            poisonChance: 35
        },
        regen: {
            baseSec: 4.5,
            townSec: 1.8,
            campSec: 1.1,
            campfireRangeTiles: 5
        },
        interact: {
            fishRangePx: 28,
            stationRangePx: 28,
            lootPickupPx: 12,
            graveRangePx: 28,
            talkAwayPx: 40,
            talkWallPx: 48,
            longPressMs: 2000,
            longPressSlop: 8,
            doorAnimMs: 220,
            groundFireMs: 45000
        },
        npc: {
            wanderChance: 80,
            wanderSpeed: 12,
            leashPx: 16,
            busyPx: 32
        },
        gather: {
            fish: { xp: 10, msMin: 3000, msMax: 5000 },
            woodcut: { xp: 10, msMin: 3000, msMax: 5000, respawnMs: 12000 },
            mine: { xp: 10, msMin: 3000, msMax: 5000, respawnMs: 10000 }
        },
        craft: {
            fireDurationMs: 45000,
            firemakeXp: 40,
            hunterKillXp: 12,
            craftHideXp: 14,
            craftLeatherXp: 25,
            smithDaggerXp: 22
        }
    },

    /** Deep-get dotted path; falls back to DEFAULTS then `fb`. */
    get: function (path, fb) {
        var cur = this._data || this.DEFAULTS;
        var parts;
        var i;
        var key;
        if (!path) {
            return fb;
        }
        parts = String(path).split('.');
        for (i = 0; i < parts.length; i++) {
            key = parts[i];
            if (!cur || typeof cur !== 'object' || cur[key] === undefined) {
                cur = this._lookupDefaults(parts);
                break;
            }
            cur = cur[key];
        }
        if (cur === undefined || cur === null) {
            return fb;
        }
        return cur;
    },

    _lookupDefaults: function (parts) {
        var cur = this.DEFAULTS;
        var i;
        for (i = 0; i < parts.length; i++) {
            if (!cur || typeof cur !== 'object' || cur[parts[i]] === undefined) {
                return undefined;
            }
            cur = cur[parts[i]];
        }
        return cur;
    },

    _merge: function (base, over) {
        var out = {};
        var k;
        var bv;
        var ov;
        for (k in base) {
            if (!Object.prototype.hasOwnProperty.call(base, k)) {
                continue;
            }
            out[k] = base[k];
        }
        if (!over || typeof over !== 'object') {
            return out;
        }
        for (k in over) {
            if (!Object.prototype.hasOwnProperty.call(over, k)) {
                continue;
            }
            bv = out[k];
            ov = over[k];
            if (bv && typeof bv === 'object' && !Array.isArray(bv)
                    && ov && typeof ov === 'object' && !Array.isArray(ov)) {
                out[k] = this._merge(bv, ov);
            } else {
                out[k] = ov;
            }
        }
        return out;
    },

    /**
     * Merge optional JSON over defaults, then sync legacy global aliases
     * (WALK_TILES_PER_SEC, FISH_ACTION_MS_MIN, OW_COMBAT_TICK_SEC, …).
     */
    apply: function (data) {
        this._data = this._merge(this.DEFAULTS, data || {});
        this.syncGlobals();
        return this._data;
    },

    syncGlobals: function () {
        var tile = typeof TILE_SIZE === 'number' ? TILE_SIZE : 16;
        var walkPx = this.get('move.walkPxPerSec', 90);
        var runPx = this.get('move.runPxPerSec', 180);
        var tickSec = this.get('combat.tickSec', 0.6);
        var respawnSec = this.get('combat.mobRespawnSec', 18);
        var campTiles = this.get('regen.campfireRangeTiles', 5);

        WALK_TILES_PER_SEC = walkPx / tile;
        RUN_TILES_PER_SEC = runPx / tile;
        WALK_SPEED = walkPx;
        RUN_SPEED = runPx;
        MOB_MOVE_TILES_PER_SEC = WALK_TILES_PER_SEC / 2;
        MOB_MOVE_SPEED = MOB_MOVE_TILES_PER_SEC * tile;

        RUN_ENERGY_MAX = this.get('move.runEnergyMax', 100);
        RUN_DRAIN_PER_SEC = this.get('move.runDrainPerSec', 25);
        RUN_RESTORE_PER_SEC = this.get('move.runRestorePerSec', 15);

        OW_COMBAT_TICK_SEC = tickSec;
        OW_COMBAT_TICK_MS = Math.round(tickSec * 1000);
        MELEE_ENGAGE_PX = this.get('combat.meleeEngagePx', 24);
        MOB_AGGRO_RANGE_PX = this.get('combat.mobAggroRangePx', 112);
        MOB_LEASH_TILES = this.get('combat.mobLeashTiles', 4);
        MOB_RESPAWN_SEC = respawnSec;
        MOB_RESPAWN_MS = respawnSec * 1000;
        FLEE_PUSH_PX = this.get('combat.fleePushPx', 32);
        FLEE_GRACE_MS = this.get('combat.fleeGraceMs', 1100);
        COMBAT_POISON_CHANCE = this.get('combat.poisonChance', 35);

        HP_REGEN_BASE_SEC = this.get('regen.baseSec', 4.5);
        HP_REGEN_TOWN_SEC = this.get('regen.townSec', 1.8);
        HP_REGEN_CAMP_SEC = this.get('regen.campSec', 1.1);
        HP_REGEN_BASE_MS = HP_REGEN_BASE_SEC * 1000;
        HP_REGEN_TOWN_MS = HP_REGEN_TOWN_SEC * 1000;
        HP_REGEN_CAMP_MS = HP_REGEN_CAMP_SEC * 1000;
        CAMPFIRE_REGEN_RANGE = tile * campTiles;

        FISH_RANGE = this.get('interact.fishRangePx', 28);
        STATION_RANGE = this.get('interact.stationRangePx', 28);
        LOOT_PICKUP_PX = this.get('interact.lootPickupPx', 12);
        GRAVE_RANGE_PX = this.get('interact.graveRangePx', 28);
        TALK_AWAY_PX = this.get('interact.talkAwayPx', 40);
        TALK_WALL_PX = this.get('interact.talkWallPx', 48);
        LONG_PRESS_MS = this.get('interact.longPressMs', 2000);
        LONG_PRESS_SLOP = this.get('interact.longPressSlop', 8);
        DOOR_ANIM_MS = this.get('interact.doorAnimMs', 220);
        GROUND_FIRE_MS = this.get('interact.groundFireMs', 45000);

        NPC_WANDER_CHANCE = this.get('npc.wanderChance', 80);
        NPC_WANDER_SPEED = this.get('npc.wanderSpeed', 12);
        NPC_LEASH_PX = this.get('npc.leashPx', 16);
        NPC_BUSY_PX = this.get('npc.busyPx', 32);

        FISH_SPOT_XP = this.get('gather.fish.xp', 10);
        FISH_ACTION_MS_MIN = this.get('gather.fish.msMin', 3000);
        FISH_ACTION_MS_MAX = this.get('gather.fish.msMax', 5000);
        WOODCUT_TREE_XP = this.get('gather.woodcut.xp', 10);
        WOODCUT_ACTION_MS_MIN = this.get('gather.woodcut.msMin', 3000);
        WOODCUT_ACTION_MS_MAX = this.get('gather.woodcut.msMax', 5000);
        WOODCUT_RESPAWN_MS = this.get('gather.woodcut.respawnMs', 12000);
        MINE_ROCK_XP = this.get('gather.mine.xp', 10);
        MINE_ACTION_MS_MIN = this.get('gather.mine.msMin', 3000);
        MINE_ACTION_MS_MAX = this.get('gather.mine.msMax', 5000);
        MINE_RESPAWN_MS = this.get('gather.mine.respawnMs', 10000);

        FIRE_DURATION_MS = this.get('craft.fireDurationMs', 45000);
        FIREMAKE_XP = this.get('craft.firemakeXp', 40);
        HUNTER_KILL_XP = this.get('craft.hunterKillXp', 12);
        CRAFT_HIDE_XP = this.get('craft.craftHideXp', 14);
        CRAFT_LEATHER_XP = this.get('craft.craftLeatherXp', 25);
        SMITH_DAGGER_XP = this.get('craft.smithDaggerXp', 22);

        MOB_CHASE_SPEED = MOB_MOVE_SPEED;
    }
};

Balance.apply(null);
window.Balance = Balance;
