/**
 * Boot-time content pack applicator (Phase 0 stub).
 * Loads JSON via Phaser cache keys and hands tables to core adapters.
 */
var ContentRegistry = {
    ready: false,
    lastKeys: null,

    /**
     * @param {Phaser.Scene} scene BootScene (or any scene with cache.json)
     * @param {{ balance?: string }} keys cache keys; defaults balance → 'balance'
     */
    applyFromScene: function (scene, keys) {
        var cache;
        var bal;
        keys = keys || {};
        this.lastKeys = keys;
        if (!scene || !scene.cache || !scene.cache.json) {
            this.ready = false;
            return false;
        }
        cache = scene.cache.json;
        if (typeof Balance !== 'undefined' && Balance.apply) {
            bal = keys.balance || 'balance';
            if (cache.has(bal)) {
                Balance.apply(cache.get(bal));
            } else {
                Balance.apply(null);
            }
        }
        this.ready = true;
        return true;
    }
};

window.ContentRegistry = ContentRegistry;
