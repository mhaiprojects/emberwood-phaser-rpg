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
     * Content item/zone tables load via *-data.js before Boot (SVG preload).
     * Optional Phaser JSON keys can re-apply overlays when present.
     */
    applyFromScene: function (scene, keys) {
        var cache;
        var bal;
        var pack;
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
        /* Optional runtime overlays (Boot may load more JSON later). */
        if (keys.items && cache.has(keys.items)) {
            pack = cache.get(keys.items);
            if (pack && typeof ITEM_DB !== 'undefined') {
                Object.keys(pack).forEach(function (id) {
                    ITEM_DB[id] = pack[id];
                });
            }
        }
        if (keys.loot && cache.has(keys.loot) && typeof LOOT_TABLE !== 'undefined') {
            window.LOOT_TABLE = cache.get(keys.loot);
        }
        this.ready = true;
        return true;
    }
};

window.ContentRegistry = ContentRegistry;
