/**
 * Fixed simulation clock: TPS (resolution) + gameSpeed (feel).
 * Movement authors as tiles/sec; durations as game-seconds at speed 1.
 */
var DEFAULT_SIM_TPS = 60;
var MIN_SIM_TPS = 20;
var MAX_SIM_TPS = 120;
var DEFAULT_GAME_SPEED = 1;
var MIN_GAME_SPEED = 0.5;
var MAX_GAME_SPEED = 2;
var GAME_CLOCK_MAX_CATCHUP = 8;

var GameClock = {
    _tps: DEFAULT_SIM_TPS,
    _speed: DEFAULT_GAME_SPEED,
    _accum: 0,
    _listeners: [],
    _tickCount: 0,

    normalizeTps: function (value) {
        var n = typeof value === 'number' ? value : parseFloat(value);
        if (!(n > 0) || !isFinite(n)) {
            return DEFAULT_SIM_TPS;
        }
        n = Math.round(n);
        if (n === 30 || n === 60 || n === 120) {
            return n;
        }
        if (n < MIN_SIM_TPS) {
            return MIN_SIM_TPS;
        }
        if (n > MAX_SIM_TPS) {
            return MAX_SIM_TPS;
        }
        return n;
    },

    normalizeGameSpeed: function (value) {
        var n = typeof value === 'number' ? value : parseFloat(value);
        if (!(n > 0) || !isFinite(n)) {
            return DEFAULT_GAME_SPEED;
        }
        if (n === 0.5 || n === 1 || n === 1.5 || n === 2) {
            return n;
        }
        n = Math.round(n * 100) / 100;
        if (n < MIN_GAME_SPEED) {
            return MIN_GAME_SPEED;
        }
        if (n > MAX_GAME_SPEED) {
            return MAX_GAME_SPEED;
        }
        return n;
    },

    getTps: function () {
        return this._tps;
    },

    setTps: function (value) {
        var next = this.normalizeTps(value);
        if (next !== this._tps) {
            this._tps = next;
            this._accum = 0;
        }
        return this._tps;
    },

    getGameSpeed: function () {
        return this._speed;
    },

    setGameSpeed: function (value) {
        var next = this.normalizeGameSpeed(value);
        if (next !== this._speed) {
            this._speed = next;
        }
        return this._speed;
    },

    stepMs: function () {
        return 1000 / this._tps;
    },

    /** Game-seconds at speed 1 → sim ticks at current TPS and gameSpeed. */
    secondsToTicks: function (sec) {
        var s = typeof sec === 'number' && sec > 0 ? sec : 0;
        var ticks = Math.round((s / this._speed) * this._tps);
        return Math.max(1, ticks);
    },

    /** Ticks remaining → game-seconds at speed 1 (for recomputes). */
    ticksToSeconds: function (ticks) {
        var t = typeof ticks === 'number' && ticks > 0 ? ticks : 0;
        return (t * this._speed) / this._tps;
    },

    effectiveTilesPerSec: function (tilesPerSec) {
        var base = typeof tilesPerSec === 'number' && isFinite(tilesPerSec) ? tilesPerSec : 0;
        return base * this._speed;
    },

    tilesPerTick: function (tilesPerSec) {
        return this.effectiveTilesPerSec(tilesPerSec) / this._tps;
    },

    pxPerTick: function (tilesPerSec) {
        var tile = typeof TILE_SIZE === 'number' ? TILE_SIZE : 16;
        return this.tilesPerTick(tilesPerSec) * tile;
    },

    /** Wall-clock px/sec for arcade setVelocity at current speed. */
    pxPerSec: function (tilesPerSec) {
        var tile = typeof TILE_SIZE === 'number' ? TILE_SIZE : 16;
        return this.effectiveTilesPerSec(tilesPerSec) * tile;
    },

    onTick: function (fn) {
        if (typeof fn === 'function') {
            this._listeners.push(fn);
        }
        return fn;
    },

    offTick: function (fn) {
        var i;
        for (i = this._listeners.length - 1; i >= 0; i--) {
            if (this._listeners[i] === fn) {
                this._listeners.splice(i, 1);
            }
        }
    },

    clearListeners: function () {
        this._listeners.length = 0;
    },

    /**
     * Advance simulation from render delta (ms). Returns number of sim ticks run.
     */
    advance: function (deltaMs) {
        var step = this.stepMs();
        var ran = 0;
        var i;
        var d = typeof deltaMs === 'number' && isFinite(deltaMs) && deltaMs > 0 ? deltaMs : 0;
        if (!(step > 0)) {
            return 0;
        }
        this._accum += Math.min(d, step * GAME_CLOCK_MAX_CATCHUP);
        while (this._accum >= step && ran < GAME_CLOCK_MAX_CATCHUP) {
            this._accum -= step;
            this._tickCount += 1;
            ran += 1;
            for (i = 0; i < this._listeners.length; i++) {
                try {
                    this._listeners[i](1 / this._tps);
                } catch (err) {
                    /* keep clock running */
                }
            }
        }
        if (this._accum > step * 2) {
            this._accum = 0;
        }
        return ran;
    },

    consumeSimTicks: function () {
        return this._tickCount;
    },

    /**
     * Recompute a countdown after TPS/speed change, preserving remaining game-seconds.
     * Pass the TPS/speed that were active when ticksLeft was last set.
     */
    recomputeTicks: function (ticksLeft, fromTps, fromSpeed) {
        var t = typeof ticksLeft === 'number' && ticksLeft > 0 ? ticksLeft : 0;
        var ft = this.normalizeTps(fromTps != null ? fromTps : this._tps);
        var fs = this.normalizeGameSpeed(fromSpeed != null ? fromSpeed : this._speed);
        var remainSec;
        if (!(t > 0) || !(ft > 0) || !(fs > 0)) {
            return 0;
        }
        remainSec = (t * fs) / ft;
        return this.secondsToTicks(remainSec);
    },

    /** Game-seconds advanced per sim tick (at current speed). */
    gameSecondsPerTick: function () {
        return this._speed / this._tps;
    },

    /** Sync from hero save fields. */
    applyFromHero: function (hero) {
        if (!hero) {
            return;
        }
        if (hero.simTps != null) {
            this.setTps(hero.simTps);
        } else if (hero.targetTps != null) {
            this.setTps(hero.targetTps);
        }
        if (hero.gameSpeed != null) {
            this.setGameSpeed(hero.gameSpeed);
        }
        hero.simTps = this._tps;
        hero.targetTps = this._tps;
        hero.gameSpeed = this._speed;
    }
};

window.GameClock = GameClock;
window.normalizeTargetTps = function (value) {
    return GameClock.normalizeTps(value);
};
window.normalizeSimTps = window.normalizeTargetTps;
window.normalizeGameSpeed = function (value) {
    return GameClock.normalizeGameSpeed(value);
};
