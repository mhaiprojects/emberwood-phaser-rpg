/**
 * Combat acquire / intent helpers for overworld fights.
 *
 * Layers (see .cursor/plans/combat-intent-redesign.plan.md):
 *   PlayerIntent  — what the player is trying to do
 *   CombatController — how fights are acquired / maintained
 *   MobAgroAI     — still lives on WorldScene (leash / safe / chase)
 *
 * Range metrics (do not mix):
 *   weaponRangePx / mobAttackRangePx — Euclidean px (engage + swings)
 *   autoAcquireRangeTiles — Chebyshev tiles (auto-attack acquire only)
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
        if (world.playerIntent && world.playerIntent.pauseAutos) {
            return { ok: false, reason: 'click-walk' };
        }
        /* Legacy mirror until playerIntent fully owns pause. */
        if (world.playerClickWalkActive) {
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

    /**
     * Dual-write intent onto the world scene (mirrors engageTarget / click-walk flags).
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
                /* Ground / kite walk clears combat engage intent. */
                world.engageTarget = null;
            }
        } else if (intent.kind === 'idle') {
            world.playerClickWalkActive = false;
        } else if (intent.kind === 'talk') {
            world.engageTarget = null;
            world.talkTarget = intent.target;
            world.playerClickWalkActive = false;
        } else if (intent.kind === 'loot') {
            world.engageTarget = null;
            world.lootTarget = intent.target;
            world.playerClickWalkActive = false;
        }
        return intent;
    },

    /** Sync intent from legacy flags (during dual-write migration). */
    syncFromLegacy: function (world) {
        if (!world) {
            return CombatController.idleIntent();
        }
        if (world.engageTarget && world.engageTarget.aliveMob) {
            world.playerIntent = {
                kind: 'attack',
                target: world.engageTarget,
                dest: world.walkTarget ? { x: world.walkTarget.x, y: world.walkTarget.y } : null,
                pauseAutos: false,
                silent: false,
                source: 'legacy'
            };
            return world.playerIntent;
        }
        if (world.playerClickWalkActive && world.walkTarget) {
            world.playerIntent = {
                kind: 'walk',
                target: null,
                dest: { x: world.walkTarget.x, y: world.walkTarget.y },
                pauseAutos: true,
                silent: false,
                source: 'legacy'
            };
            return world.playerIntent;
        }
        if (!world.playerIntent) {
            world.playerIntent = CombatController.idleIntent();
        }
        return world.playerIntent;
    },

    autosPaused: function (world) {
        if (!world) {
            return false;
        }
        if (world.playerIntent && world.playerIntent.pauseAutos) {
            return true;
        }
        return !!world.playerClickWalkActive;
    }
};

window.CombatController = CombatController;
