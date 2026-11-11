var BootScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function BootScene() {
        Phaser.Scene.call(this, { key: 'BootScene' });
    },

    preload: function () {
        var bar = this.add.text(8, 8, 'Loading Emberwood…', {
            fontFamily: 'Verdana, sans-serif',
            fontSize: '12px',
            color: '#c9a227'
        });
        this.load.on('progress', function (value) {
            bar.setText('Loading Emberwood… ' + Math.floor(value * 100) + '%');
        });
        this.load.image('tiles', 'assets/tiles.png?v=furnace1');
        this.load.spritesheet('player', 'assets/player.png', { frameWidth: 16, frameHeight: 16 });
        this.load.image('slime', 'assets/slime.png');
        this.load.image('bat', 'assets/bat.png');
        this.load.image('drake', 'assets/drake.png');
        this.load.image('sign', 'assets/sign.png');
        this.load.image('npc', 'assets/npc.png');

        var self = this;
        ['chicken', 'goblin', 'cow', 'slime', 'crab', 'bat', 'skeleton', 'drake', 'rabbit'].forEach(function (name) {
            self.load.svg('mob-' + name, 'assets/svg/mobs/' + name + '.svg');
        });
        ['guild', 'banker', 'guard', 'ranger', 'farmer', 'fisher', 'wanderer', 'ghost', 'miner', 'hermit', 'witch', 'cook', 'priest', 'shopkeeper'].forEach(function (name) {
            self.load.svg('npc-' + name, 'assets/svg/npcs/' + name + '.svg');
        });
        ['coins', 'bones', 'shrimp', 'rawshrimp', 'burntshrimp', 'rawbeef', 'beef', 'burntbeef', 'bread', 'sword',
            'bronzedagger', 'shortbow', 'arrow', 'shield',
            'airrune', 'mindrune', 'firerune', 'naturerune', 'cowhide', 'leather', 'string', 'gloves', 'net',
            'bronzeaxe', 'bronzepick', 'logs', 'copper', 'tin', 'bronzebar', 'tinderbox', 'feather', 'rabbitfur',
            'drakescale', 'key'].forEach(function (name) {
            self.load.svg('item-' + name, 'assets/svg/items/' + name + '.svg');
        });
        /* Tier / combat aliases reuse existing SVG art as Phaser textures. */
        self.load.svg('item-woodbow', 'assets/svg/items/shortbow.svg');
        self.load.svg('item-woodarrow', 'assets/svg/items/arrow.svg');
        self.load.svg('item-staff', 'assets/svg/items/bronzeaxe.svg');
        self.load.svg('item-bronzestaff', 'assets/svg/items/bronzeaxe.svg');
        self.load.svg('item-woodaxe', 'assets/svg/items/bronzeaxe.svg');
        self.load.svg('item-woodpick', 'assets/svg/items/bronzepick.svg');
        self.load.svg('item-ironaxe', 'assets/svg/items/bronzeaxe.svg');
        self.load.svg('item-ironpick', 'assets/svg/items/bronzepick.svg');
        self.load.svg('item-wizardhat', 'assets/svg/items/feather.svg');
        self.load.svg('item-wizardrobe', 'assets/svg/items/gloves.svg');
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
