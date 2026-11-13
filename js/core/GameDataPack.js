/**
 * Active game content pack (JSON + assets under game-data/{id}/).
 * Engine code resolves all content URLs through this module.
 */
var GameDataPack = {
    DEFAULT_ID: 'game1',
    BASE: 'game-data',
    _id: 'game1',
    _meta: null,
    _version: '1',

    resolveFromQuery: function () {
        var q;
        var fromWin;
        var id;
        fromWin = typeof window !== 'undefined' && window.EMBERWOOD_PACK
            ? String(window.EMBERWOOD_PACK).trim()
            : '';
        if (fromWin) {
            this.setActive(fromWin);
            return this._id;
        }
        if (typeof location !== 'undefined' && location.search) {
            q = /[?&]pack=([^&]+)/.exec(location.search);
            if (q && q[1]) {
                id = decodeURIComponent(q[1]).replace(/[^a-zA-Z0-9_-]/g, '');
                if (id) {
                    this.setActive(id);
                }
            }
        }
        return this._id;
    },

    setActive: function (id) {
        id = String(id || this.DEFAULT_ID).replace(/[^a-zA-Z0-9_-]/g, '');
        this._id = id || this.DEFAULT_ID;
        this._meta = null;
        return this._id;
    },

    getActive: function () {
        return this._id || this.DEFAULT_ID;
    },

    rootUrl: function () {
        return this.BASE + '/' + this.getActive() + '/';
    },

    setMeta: function (meta) {
        this._meta = meta || null;
        if (meta && meta.version != null) {
            this._version = String(meta.version);
        }
        if (meta && meta.id) {
            this._id = String(meta.id);
        }
        return this._meta;
    },

    getMeta: function () {
        return this._meta;
    },

    version: function () {
        return this._version || '1';
    },

    saveKey: function () {
        if (this._meta && this._meta.saveKey) {
            return this._meta.saveKey;
        }
        return 'emberwood-save-' + this.getActive();
    },

    legacySaveKeys: function () {
        return (this._meta && this._meta.legacySaveKeys) || [];
    },

    /**
     * Pack-root-relative URL with cache-bust query.
     * @param {string} rel e.g. balance.json or assets/tiles.png
     */
    url: function (rel) {
        var clean = String(rel || '').replace(/^\/+/, '');
        if (!clean) {
            return this.rootUrl() + '?v=' + encodeURIComponent(this.version());
        }
        if (/^https?:\/\//i.test(clean) || clean.indexOf('game-data/') === 0) {
            return clean.indexOf('?') >= 0
                ? clean
                : (clean + '?v=' + encodeURIComponent(this.version()));
        }
        return this.rootUrl() + clean + '?v=' + encodeURIComponent(this.version());
    },

    /** Alias for art / icon paths (same as url). */
    assetUrl: function (rel) {
        return this.url(rel);
    },

    /**
     * If path is already absolute/http or pack-rooted, return as assetUrl;
     * otherwise treat as pack-relative.
     */
    resolvePath: function (path) {
        if (!path) {
            return this.assetUrl('assets/svg/items/coins.svg');
        }
        path = String(path);
        if (/^https?:\/\//i.test(path)) {
            return path;
        }
        if (path.indexOf('game-data/') === 0) {
            return path.indexOf('?') >= 0 ? path : (path + '?v=' + encodeURIComponent(this.version()));
        }
        return this.assetUrl(path.replace(/^\/+/, ''));
    },

    packJsonUrl: function () {
        return this.url('pack.json');
    },

    /**
     * Queue all pack.files JSON entries on a Phaser loader (after pack meta is known).
     * @param {Phaser.Scene} scene
     * @param {object} meta pack.json object
     */
    loadJsonWave: function (scene, meta) {
        var files;
        var key;
        var rel;
        if (!scene || !scene.load || !meta) {
            return false;
        }
        this.setMeta(meta);
        files = meta.files || {};
        for (key in files) {
            if (!Object.prototype.hasOwnProperty.call(files, key)) {
                continue;
            }
            rel = files[key];
            if (!rel) {
                continue;
            }
            scene.load.json(key, this.url(rel));
        }
        return true;
    },

    /** Rewrite DOM imgs that still point at legacy root assets/… */
    rewriteDomAssets: function (root) {
        var scope = root || (typeof document !== 'undefined' ? document : null);
        var nodes;
        var i;
        var el;
        var src;
        var href;
        if (!scope || !scope.querySelectorAll) {
            return;
        }
        nodes = scope.querySelectorAll('img[src], link[rel="icon"]');
        for (i = 0; i < nodes.length; i++) {
            el = nodes[i];
            if (el.tagName === 'IMG') {
                src = el.getAttribute('src');
                if (src && src.indexOf('assets/') === 0) {
                    el.setAttribute('src', this.assetUrl(src));
                }
            } else if (el.tagName === 'LINK') {
                href = el.getAttribute('href');
                if (href && href.indexOf('assets/') === 0) {
                    el.setAttribute('href', this.assetUrl(href));
                }
            }
        }
    }
};

window.GameDataPack = GameDataPack;
