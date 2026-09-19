Keys.init();
Hud.init();
Hud.bindActions();

var config = {
    type: Phaser.AUTO,
    parent: 'content',
    width: 512,
    height: 320,
    pixelArt: true,
    roundPixels: true,
    backgroundColor: '#0b0a12',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    input: {
        keyboard: false
    },
    audio: { noAudio: true },
    scene: [
        BootScene,
        TitleScene,
        WorldScene,
        BattleScene,
        UIScene,
        GameOverScene
    ]
};

window.game = new Phaser.Game(config);
Keys.keepPhaserKeyboardOff();
window.game.events.on('ready', function () {
    Keys.keepPhaserKeyboardOff();
});
