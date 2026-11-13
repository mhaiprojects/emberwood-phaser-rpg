var BootScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function BootScene() {
        Phaser.Scene.call(this, { key: 'BootScene' });
    },

    preload: function () {
        var bar = this.add.text(8, 8, 'Loading Emberwood…', {
            fontFamily: 'Alegreya Sans, Trebuchet MS, sans-serif',
            fontSize: '12px',
            color: '#c9a227'
        });
        this.load.on('progress', function (value) {
            bar.setText('Loading Emberwood… ' + Math.floor(value * 100) + '%');
        });
        this.load.image('tiles', 'assets/tiles.png?v=gathervis1');
        this.load.spritesheet('player', 'assets/player.png', { frameWidth: 16, frameHeight: 16 });
        this.load.image('slime', 'assets/slime.png');
        this.load.image('bat', 'assets/bat.png');
        this.load.image('drake', 'assets/drake.png');
        this.load.image('sign', 'assets/sign.png');
        this.load.image('npc', 'assets/npc.png');

        var self = this;
        ['chicken', 'goblin', 'cow', 'slime', 'crab', 'bat', 'skeleton', 'drake', 'dragon', 'rabbit'].forEach(function (name) {
            self.load.svg('mob-' + name, 'assets/svg/mobs/' + name + '.svg');
        });
        ['guild', 'banker', 'guard', 'ranger', 'farmer', 'fisher', 'wanderer', 'ghost', 'miner', 'hermit', 'witch', 'cook', 'herbalist', 'priest', 'shopkeeper', 'dummy', 'arms'].forEach(function (name) {
            self.load.svg('npc-' + name, 'assets/svg/npcs/' + name + '.svg');
        });
        /* Ground loot textures: one Phaser key per inventory icon SVG (ITEM_DB.icon). */
        var itemTex = {};
        Object.keys(ITEM_DB).forEach(function (id) {
            var key = typeof itemTextureKey === 'function' ? itemTextureKey(id) : ('item-' + id);
            var path = typeof itemIcon === 'function' ? itemIcon(id) : null;
            if (!path || itemTex[key]) {
                return;
            }
            itemTex[key] = true;
            self.load.svg(key, path);
        });
    },

    create: function () {
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
        this.registry.set('autoContinueSave', true);
        this.scene.start('TitleScene');
    }
});
