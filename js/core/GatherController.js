/**
 * Shared timed gather pipeline (fish / chop / mine).
 * WorldScene owns click/scenery + domain finish handlers; this owns action state + ticks.
 */
var GatherController = {
    KINDS: ['fish', 'chop', 'mine'],

    actionKey: function (kind) {
        return kind + 'Action';
    },

    targetKey: function (kind) {
        if (kind === 'fish') {
            return 'fishTarget';
        }
        if (kind === 'chop') {
            return 'chopTarget';
        }
        return 'mineTarget';
    },

    clear: function (world, kind) {
        var key;
        if (!world || !kind) {
            return;
        }
        key = this.actionKey(kind);
        world[key] = null;
        if (kind === 'fish' || kind === 'chop' || kind === 'mine') {
            if (typeof world.clearGatherFx === 'function') {
                world.clearGatherFx();
            }
        }
        if (kind === 'mine' && typeof world.clearMineFx === 'function') {
            world.clearMineFx();
        }
    },

    clearAll: function (world) {
        var i;
        if (!world) {
            return;
        }
        for (i = 0; i < this.KINDS.length; i++) {
            this.clear(world, this.KINDS[i]);
        }
        world.fishTarget = null;
        world.chopTarget = null;
        world.mineTarget = null;
    },

    clearSiblings: function (world, keepKind) {
        var i;
        var kind;
        for (i = 0; i < this.KINDS.length; i++) {
            kind = this.KINDS[i];
            if (kind !== keepKind) {
                this.clear(world, kind);
            }
        }
    },

    /** One chat line + clear action/target for hard fails (no tool / level). */
    hardFail: function (world, kind, message) {
        if (window.Hud && Hud.log && message) {
            Hud.log(message);
        }
        this.clear(world, kind);
        if (world) {
            world[this.targetKey(kind)] = null;
        }
        return false;
    },

    isBusy: function (world, kind) {
        var act = world && world[this.actionKey(kind)];
        return !!(act && act.ticksLeft > 0);
    },

    /**
     * Start a timed gather. Clears sibling gathers, stops walk, sets action ticks.
     * @param {object} opts { ms, target, denBoulder?, onStart? }
     */
    startTimed: function (world, kind, opts) {
        var ms;
        var sec;
        var action;
        opts = opts || {};
        if (!world || !kind) {
            return false;
        }
        if (world.encounterLock || (window.Hud && Hud.mode === 'battle')) {
            return false;
        }
        if (this.isBusy(world, kind)) {
            return true;
        }
        ms = typeof opts.ms === 'number' ? opts.ms : 4000;
        if (ms < 1000) {
            ms = 1000;
        }
        sec = ms / 1000;
        if (world.player && world.player.body) {
            world.player.body.setVelocity(0);
        }
        if (typeof world.clearWalk === 'function') {
            world.clearWalk();
        }
        this.clearSiblings(world, kind);
        world[this.targetKey(kind)] = opts.target || null;
        action = {
            hit: opts.target || null,
            authoredSec: sec,
            ticksLeft: typeof world.secondsToSimTicks === 'function'
                ? world.secondsToSimTicks(sec)
                : Math.max(1, Math.round(sec * 60))
        };
        if (opts.denBoulder) {
            action.denBoulder = true;
        }
        world[this.actionKey(kind)] = action;
        if (typeof opts.onStart === 'function') {
            opts.onStart(action);
        }
        return true;
    },

    /**
     * Decrement gather ticks; invoke finish callbacks when due.
     * @param {object} handlers { fish, chop, mine, mineBoulder }
     */
    tick: function (world, handlers) {
        var act;
        handlers = handlers || {};
        if (!world) {
            return;
        }
        act = world.fishAction;
        if (act && act.ticksLeft > 0) {
            act.ticksLeft -= 1;
            if (act.ticksLeft <= 0 && typeof handlers.fish === 'function') {
                handlers.fish();
            }
        }
        act = world.chopAction;
        if (act && act.ticksLeft > 0) {
            act.ticksLeft -= 1;
            if (act.ticksLeft <= 0 && typeof handlers.chop === 'function') {
                handlers.chop();
            }
        }
        act = world.mineAction;
        if (act && act.ticksLeft > 0) {
            act.ticksLeft -= 1;
            if (act.ticksLeft <= 0) {
                if (act.denBoulder && typeof handlers.mineBoulder === 'function') {
                    handlers.mineBoulder();
                } else if (typeof handlers.mine === 'function') {
                    handlers.mine();
                }
            }
        }
    },

    recomputeTicks: function (world, recompute) {
        if (!world || typeof recompute !== 'function') {
            return;
        }
        if (world.fishAction && world.fishAction.ticksLeft > 0) {
            world.fishAction.ticksLeft = recompute(world.fishAction.ticksLeft);
        }
        if (world.chopAction && world.chopAction.ticksLeft > 0) {
            world.chopAction.ticksLeft = recompute(world.chopAction.ticksLeft);
        }
        if (world.mineAction && world.mineAction.ticksLeft > 0) {
            world.mineAction.ticksLeft = recompute(world.mineAction.ticksLeft);
        }
    }
};

window.GatherController = GatherController;
