/**
 * Combat acquire / intent / lifecycle helpers for overworld fights.
 *
 * Layers (see .cursor/plans/combat-intent-redesign.plan.md):
 *   PlayerIntent  — what the player is trying to do (world.playerIntent)
 *   CombatController — acquire policy + intent writers + fight lifecycle hooks
 *   MobAgroAI     — leash / safe / chase on WorldScene; calls onLeashRelease
 *
 * Range metrics (do not mix):
 *   weaponRangePx / mobAttackRangePx — Euclidean px (engage + swings)
 *   autoAcquireRangeTiles — Chebyshev tiles (auto-attack acquire only)
 *
 * Legacy mirrors (kept for Hud / scattered readers):
 *   engageTarget ⇄ intent.kind === 'attack' && intent.target
 *   playerClickWalkActive ⇄ intent.pauseAutos
 */
var CombatController = {
    idleIntent: function () {
        return {
            kind: 'idle',
            target: null,
            dest: null,
            pauseAutos: false,
            silent: false,
            source: null
        };
    },

    /** Alias: engage + swing range (Euclidean px). */
    weaponRangePx: function (hero) {
        if (typeof weaponAttackRangePx === 'function') {
            return weaponAttackRangePx(hero);
        }
        return typeof DEFAULT_MELEE_ATTACK_RANGE === 'number' ? DEFAULT_MELEE_ATTACK_RANGE : 24;
    },

    autoAcquireRangeTiles: function (hero) {
        if (typeof autoAttackRangeTiles === 'function') {
            return autoAttackRangeTiles(hero);
        }
        return typeof DEFAULT_AUTO_ATTACK_RANGE_TILES === 'number' ? DEFAULT_AUTO_ATTACK_RANGE_TILES : 3;
    },

    standForTarget: function (grid, target, rangePx) {
        if (!target) {
            return null;
        }
        if (typeof standInRangeWorld === 'function') {
            return standInRangeWorld(grid, target.x, target.y, rangePx);
        }
        return { x: target.x, y: target.y };
    },

    /**
     * Acquire policy — autos only affect starting fights / chase, never swings.
     * @param {'click'|'autoAttack'|'retaliate'} source
     */
    canAcquire: function (source, world, mob) {
        if (!world || !mob || !mob.aliveMob) {
            return { ok: false, reason: 'dead' };
        }
        if (world.encounterLock || (typeof world.uiPaused === 'function' && world.uiPaused())) {
            return { ok: false, reason: 'paused' };
        }
        if (world.time && world.engageGrace && world.time.now < world.engageGrace) {
            if (source !== 'click') {
                return { ok: false, reason: 'grace' };
            }
        }
        if (source === 'click') {
            return { ok: true };
        }
        if (CombatController.autosPaused(world)) {
            return { ok: false, reason: 'click-walk' };
        }
        if (source === 'autoAttack') {
            if (typeof world.autoAttackOn === 'function' ? !world.autoAttackOn() : true) {
                return { ok: false, reason: 'auto-off' };
            }
            return { ok: true };
        }
        if (source === 'retaliate') {
            if (typeof world.autoRetaliateOn === 'function' ? !world.autoRetaliateOn() : true) {
                return { ok: false, reason: 'retaliate-off' };
            }
            if (!mob.agroChasing && !(world.overworldFight && world.overworldFight.mob === mob)) {
                return { ok: false, reason: 'not-agro' };
            }
            return { ok: true };
        }
        return { ok: false, reason: 'unknown-source' };
    },

    /** Living attack target from intent, with legacy engageTarget fallback. */
    attackTarget: function (world) {
        var intent;
        var t;
        if (!world) {
            return null;
        }
        intent = world.playerIntent;
        if (intent && intent.kind === 'attack' && intent.target && intent.target.aliveMob) {
            return intent.target;
        }
        t = world.engageTarget;
        if (t && t.aliveMob) {
            return t;
        }
        return null;
    },

    autosPaused: function (world) {
        if (!world) {
            return false;
        }
        if (world.playerIntent && world.playerIntent.pauseAutos) {
            return true;
        }
        return !!world.playerClickWalkActive;
    },

    /**
     * Single writer for intent. Always mirrors engageTarget / playerClickWalkActive.
     */
    applyIntent: function (world, next) {
        var intent;
        if (!world) {
            return null;
        }
        intent = next || CombatController.idleIntent();
        world.playerIntent = intent;
        if (intent.kind === 'attack' && intent.target) {
            world.engageTarget = intent.target;
            world.playerClickWalkActive = false;
        } else if (intent.kind === 'walk') {
            world.playerClickWalkActive = !!intent.pauseAutos;
            if (intent.pauseAutos) {
                world.engageTarget = null;
            }
        } else if (intent.kind === 'talk') {
            world.engageTarget = null;
            world.talkTarget = intent.target;
            world.playerClickWalkActive = false;
        } else if (intent.kind === 'loot') {
            world.engageTarget = null;
            world.lootTarget = intent.target;
            world.playerClickWalkActive = false;
        } else {
            /* idle / gather kinds — drop attack chase pause */
            if (intent.kind === 'idle') {
                world.engageTarget = null;
            }
            world.playerClickWalkActive = false;
        }
        return intent;
    },

    /** Clear attack engage (keeps walk/talk/loot unless clearWalk). */
    clearAttack: function (world, opts) {
        opts = opts || {};
        if (!world) {
            return;
        }
        world.engageTarget = null;
        world._fightPlayerClose = false;
        if (world.playerIntent && world.playerIntent.kind === 'attack') {
            world.playerIntent = CombatController.idleIntent();
        } else if (world.playerIntent) {
            world.playerIntent.pauseAutos = world.playerIntent.kind === 'walk'
                ? !!world.playerIntent.pauseAutos
                : false;
        } else {
            world.playerIntent = CombatController.idleIntent();
        }
        world.playerClickWalkActive = !!(world.playerIntent && world.playerIntent.pauseAutos);
        if (opts.clearWalk && typeof world.clearWalk === 'function') {
            world.clearWalk(opts.clearWalkOpts || {});
        }
    },

    /** Hard cancel: idle intent + no engage (WASD / Esc). */
    cancelPlayerCombat: function (world) {
        if (!world) {
            return;
        }
        world.engageTarget = null;
        world._fightPlayerClose = false;
        world.playerClickWalkActive = false;
        world.playerIntent = CombatController.idleIntent();
    },

    /** Fight starting — intent idle; overworldFight becomes source of truth. */
    onBeginFight: function (world, mob) {
        if (!world) {
            return;
        }
        world.lootTarget = null;
        world.engageTarget = null;
        world._fightPlayerClose = false;
        world.playerClickWalkActive = false;
        world.playerIntent = CombatController.idleIntent();
        world.lastFought = mob || world.lastFought;
    },

    /** Fight ended — drop close-in; leave walk alone. */
    onEndFight: function (world) {
        if (!world) {
            return;
        }
        world._fightPlayerClose = false;
        if (world.playerIntent && world.playerIntent.kind === 'attack') {
            world.playerIntent = CombatController.idleIntent();
            world.engageTarget = null;
        }
    },

    /**
     * Leash / haven-safe release: clear attack intent + walk if chasing this mob,
     * and end fight if this is the fight mob (caller still ends fight).
     */
    onLeashRelease: function (world, mob) {
        var fighting;
        if (!world || !mob) {
            return { clearedEngage: false, wasFight: false };
        }
        fighting = !!(world.overworldFight && world.overworldFight.mob === mob);
        if (CombatController.attackTarget(world) === mob || world.engageTarget === mob) {
            CombatController.clearAttack(world, { clearWalk: true });
            return { clearedEngage: true, wasFight: fighting };
        }
        return { clearedEngage: false, wasFight: fighting };
    },

    /** Sync intent from legacy flags if intent missing (boot / old saves mid-session). */
    ensureIntent: function (world) {
        if (!world) {
            return CombatController.idleIntent();
        }
        if (world.playerIntent && world.playerIntent.kind) {
            return world.playerIntent;
        }
        if (world.engageTarget && world.engageTarget.aliveMob) {
            return CombatController.applyIntent(world, {
                kind: 'attack',
                target: world.engageTarget,
                dest: world.walkTarget ? { x: world.walkTarget.x, y: world.walkTarget.y } : null,
                pauseAutos: false,
                silent: false,
                source: 'legacy'
            });
        }
        if (world.playerClickWalkActive && world.walkTarget) {
            return CombatController.applyIntent(world, {
                kind: 'walk',
                target: null,
                dest: { x: world.walkTarget.x, y: world.walkTarget.y },
                pauseAutos: true,
                silent: false,
                source: 'legacy'
            });
        }
        world.playerIntent = CombatController.idleIntent();
        return world.playerIntent;
    }
};

window.CombatController = CombatController;
