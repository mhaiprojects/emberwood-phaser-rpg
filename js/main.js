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
    fps: {
        target: 60,
        limit: 60
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false,
            fps: 60
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

(function bindPerfReadout(game) {
    var frameCount = 0;
    var tickCount = 0;
    var lastSample = (typeof performance !== 'undefined' && performance.now)
        ? performance.now()
        : Date.now();
    var el = null;

    function sampleNow() {
        return (typeof performance !== 'undefined' && performance.now)
            ? performance.now()
            : Date.now();
    }

    function readoutEl() {
        if (!el) {
            el = document.getElementById('fps-readout');
        }
        return el;
    }

    game.events.on('step', function () {
        tickCount += 1;
    });

    game.events.on('postrender', function () {
        frameCount += 1;
        var now = sampleNow();
        var elapsed = now - lastSample;
        if (elapsed < 250) {
            return;
        }
        var fps = Math.round((frameCount * 1000) / elapsed);
        var tps = Math.round((tickCount * 1000) / elapsed);
        frameCount = 0;
        tickCount = 0;
        lastSample = now;
        var node = readoutEl();
        if (!node || node.hidden) {
            return;
        }
        node.textContent = 'FPS ' + fps + ' | TPS ' + tps;
    });
})(window.game);
