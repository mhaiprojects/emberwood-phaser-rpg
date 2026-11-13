var BootScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function BootScene() {
        Phaser.Scene.call(this, { key: 'BootScene' });
    },

    preload: function () {
        var self = this;
        var bar = this.add.text(8, 8, 'Loading…', {
            fontFamily: 'Alegreya Sans, Trebuchet MS, sans-serif',
            fontSize: '12px',
            color: '#c9a227'
        });
        this.load.on('progress', function (value) {
            bar.setText('Loading… ' + Math.floor(value * 100) + '%');
        });

        if (typeof GameDataPack !== 'undefined' && GameDataPack.resolveFromQuery) {
            GameDataPack.resolveFromQuery();
        }

        this._bootBar = bar;
        this._packWave = 'meta';

        /* Shared catalog + Wave A1: pack.json */
        this.load.json('packCatalog', 'GameWorld/catalog.json');
        this.load.json('packMeta', typeof GameDataPack !== 'undefined'
            ? GameDataPack.packJsonUrl()
            : 'GameWorld/emberwood/pack.json');
    },

    create: function () {
        var self = this;
        var meta;

        if (this._packWave === 'meta') {
            if (this.cache.json.has('packCatalog')) {
                window.PACK_CATALOG = this.cache.json.get('packCatalog') || { packs: [] };
            }
            meta = this.cache.json.get('packMeta');
            if (!meta) {
                this._bootBar.setText('Missing pack.json');
                return;
            }
            if (typeof GameDataPack !== 'undefined') {
                GameDataPack.setMeta(meta);
                if (meta.title && typeof document !== 'undefined') {
                    document.title = meta.title;
                }
                this._bootBar.setText('Loading ' + (meta.title || 'pack') + '…');
            }
            this._packWave = 'json';
            if (this.load && typeof this.load.reset === 'function') {
                this.load.reset();
            }
            if (typeof GameDataPack !== 'undefined') {
                GameDataPack.loadJsonWave(this, meta);
            }
            this.load.once('complete', function () {
                self.create();
            });
            this.load.start();
            return;
        }

        if (this._packWave === 'json') {
            var missing = this._missingPackFiles();
            if (missing.length) {
                this._bootBar.setText('Pack incomplete: missing ' + missing.join(', '));
                console.error('[Boot] Pack missing required JSON:', missing);
                return;
            }
            if (typeof ContentRegistry !== 'undefined' && ContentRegistry.applyPack) {
                ContentRegistry.applyPack(this.cache.json);
            }
            if (typeof GameDataPack !== 'undefined' && GameDataPack.rewriteDomAssets) {
                GameDataPack.rewriteDomAssets(document);
            }
            this._packWave = 'art';
            if (this.load && typeof this.load.reset === 'function') {
                this.load.reset();
            }
            this._queueArtLoads();
            this.load.once('complete', function () {
                self.create();
            });
            this.load.start();
            return;
        }

        /* Art ready → animations + title */
        this._createAnims();
        this.registry.set('autoContinueSave', true);
        this.registry.set('packId', typeof GameDataPack !== 'undefined'
            ? GameDataPack.getActive()
            : 'emberwood');
        this.scene.start('TitleScene');
    },

    _missingPackFiles: function () {
        var meta = typeof GameDataPack !== 'undefined' ? GameDataPack.getMeta() : null;
        var files = (meta && meta.files) || {};
        var key;
        var missing = [];
        var cache = this.cache && this.cache.json;
        for (key in files) {
            if (!Object.prototype.hasOwnProperty.call(files, key)) {
                continue;
            }
            if (!files[key]) {
                continue;
            }
            if (!cache || typeof cache.has !== 'function' || !cache.has(key) || !cache.get(key)) {
                missing.push(key + ' (' + files[key] + ')');
            }
        }
        return missing;
    },

    _queueArtLoads: function () {
        var self = this;
        var art = typeof ART_MANIFEST !== 'undefined' ? ART_MANIFEST : null;
        var gdp = typeof GameDataPack !== 'undefined' ? GameDataPack : null;
        var url = function (rel) {
            return gdp ? gdp.assetUrl(rel) : rel;
        };
        var i;
        var row;
        var name;
        var itemTex;
        var id;
        var key;
        var path;

        if (art && art.tiles) {
            this.load.image(art.tiles.key || 'tiles', url(art.tiles.path || 'assets/tiles.png'));
        } else {
            this.load.image('tiles', url('assets/tiles.png'));
        }

        if (art && art.player) {
            this.load.spritesheet(
                art.player.key || 'player',
                url(art.player.path || 'assets/player.png'),
                {
                    frameWidth: art.player.frameWidth || 16,
                    frameHeight: art.player.frameHeight || 16
                }
            );
        } else {
            this.load.spritesheet('player', url('assets/player.png'), {
                frameWidth: 16,
                frameHeight: 16
            });
        }

        if (art && art.images) {
            for (i = 0; i < art.images.length; i++) {
                row = art.images[i];
                if (row && row.key && row.path) {
                    this.load.image(row.key, url(row.path));
                }
            }
        }

        (art && art.mobSvgs ? art.mobSvgs : []).forEach(function (n) {
            self.load.svg('mob-' + n, url('assets/svg/mobs/' + n + '.svg'));
        });
        (art && art.npcSvgs ? art.npcSvgs : []).forEach(function (n) {
            self.load.svg('npc-' + n, url('assets/svg/npcs/' + n + '.svg'));
        });

        itemTex = {};
        if (typeof ITEM_DB !== 'undefined') {
            Object.keys(ITEM_DB).forEach(function (itemId) {
                key = typeof itemTextureKey === 'function' ? itemTextureKey(itemId) : ('item-' + itemId);
                path = typeof itemIcon === 'function' ? itemIcon(itemId) : null;
                if (!path || itemTex[key]) {
                    return;
                }
                itemTex[key] = true;
                /* itemIcon already returns pack-resolved URL */
                self.load.svg(key, path);
            });
        }
    },

    _createAnims: function () {
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('player', { frames: [1, 7, 1, 13] }),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('player', { frames: [1, 7, 1, 13] }),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: 'up',
            frames: this.anims.generateFrameNumbers('player', { frames: [2, 8, 2, 14] }),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: 'down',
            frames: this.anims.generateFrameNumbers('player', { frames: [0, 6, 0, 12] }),
            frameRate: 8,
            repeat: -1
        });
    }
});
