var BootScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function BootScene() {
        Phaser.Scene.call(this, { key: 'BootScene' });
    },

    preload: function () {
        this.load.image('tiles', 'assets/tiles.png');
        this.load.spritesheet('player', 'assets/player.png', { frameWidth: 16, frameHeight: 16 });
        this.load.image('slime', 'assets/slime.png');
        this.load.image('bat', 'assets/bat.png');
        this.load.image('drake', 'assets/drake.png');
        this.load.image('sign', 'assets/sign.png');
        this.load.image('npc', 'assets/npc.png');

        var self = this;
        ['chicken', 'goblin', 'cow', 'slime', 'crab', 'bat', 'skeleton', 'drake'].forEach(function (name) {
            self.load.svg('mob-' + name, 'assets/svg/mobs/' + name + '.svg');
        });
        ['guild', 'banker', 'guard', 'ranger', 'farmer', 'fisher', 'wanderer', 'ghost', 'miner', 'hermit', 'witch', 'cook', 'priest', 'shopkeeper'].forEach(function (name) {
            self.load.svg('npc-' + name, 'assets/svg/npcs/' + name + '.svg');
        });
        ['coins', 'bones', 'shrimp', 'bread'].forEach(function (name) {
            self.load.svg('item-' + name, 'assets/svg/items/' + name + '.svg');
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
        this.scene.start('TitleScene');
    }
});
