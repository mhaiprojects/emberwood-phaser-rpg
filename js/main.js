Keys.init();
Hud.init();
Hud.bindActions();

var DEFAULT_TARGET_TPS = 60;

var config = {
    type: Phaser.AUTO,
    parent: 'content',
    width: 512,
    height: 320,
    pixelArt: true,
    roundPixels: true,
    backgroundColor: '#0b0a12',
    fps: {
        target: DEFAULT_TARGET_TPS,
        limit: DEFAULT_TARGET_TPS
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
            fps: DEFAULT_TARGET_TPS
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

/**
 * TPS here = Phaser game-loop steps per second (same loop that drives postrender FPS).
 * Not overworld combat ticks (those stay ~600ms via OW_COMBAT_TICK_MS).
 */
window.normalizeTargetTps = function (value) {
    var n = typeof value === 'number' ? value : parseInt(value, 10);
    if (n === 30 || n === 60) {
        return n;
    }
    return DEFAULT_TARGET_TPS;
};

window.applyTargetTps = function (value) {
    var rate = window.normalizeTargetTps(value);
    var game = window.game;
    var loop;
    var scenes;
    var i;
    var world;
    if (!game) {
        return rate;
    }
    loop = game.loop;
    if (loop) {
        loop.targetFps = rate;
        loop.fpsLimit = rate;
        /* Phaser sets _limitRate only in the TimeStep ctor; keep it in sync for stepLimitFPS. */
        loop._limitRate = 1000 / rate;
        if (!loop.hasFpsLimit && rate > 0) {
            loop.hasFpsLimit = true;
        }
    }
    if (game.scene && typeof game.scene.getScenes === 'function') {
        scenes = game.scene.getScenes(true);
        for (i = 0; i < scenes.length; i++) {
            world = scenes[i].physics && scenes[i].physics.world;
            if (world && typeof world.setFPS === 'function') {
                world.setFPS(rate);
            }
        }
    }
    return rate;
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
    var smoothFps = DEFAULT_TARGET_TPS;
    var smoothTps = DEFAULT_TARGET_TPS;
    var el = null;
    /* Short windows (~250ms) + Math.round made a steady 60 look like 56–64 from boundary noise. */
    var SAMPLE_MS = 1000;
    var EMA = 0.35;

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
        var fpsInst;
        var tpsInst;
        var node;
        if (elapsed < SAMPLE_MS) {
            return;
        }
        fpsInst = (frameCount * 1000) / elapsed;
        tpsInst = (tickCount * 1000) / elapsed;
        frameCount = 0;
        tickCount = 0;
        lastSample = now;
        smoothFps = (smoothFps * (1 - EMA)) + (fpsInst * EMA);
        smoothTps = (smoothTps * (1 - EMA)) + (tpsInst * EMA);
        node = readoutEl();
        if (!node || node.hidden) {
            return;
        }
        node.textContent = 'FPS ' + Math.round(smoothFps) + ' | TPS ' + Math.round(smoothTps);
    });
})(window.game);
