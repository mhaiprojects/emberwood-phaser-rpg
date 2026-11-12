Keys.init();
Hud.init();
Hud.bindActions();

var DEFAULT_TARGET_TPS = 60;
var RENDER_FPS_CAP = 60;

var config = {
    type: Phaser.AUTO,
    parent: 'content',
    width: 512,
    height: 320,
    pixelArt: true,
    roundPixels: true,
    backgroundColor: '#0b0a12',
    fps: {
        target: RENDER_FPS_CAP,
        limit: RENDER_FPS_CAP
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
            fps: RENDER_FPS_CAP
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
 * Simulation TPS (GameClock). Render FPS stays capped at 60.
 * Legacy name normalizeTargetTps / applyTargetTps kept for Settings + saves.
 */
window.normalizeTargetTps = function (value) {
    if (window.GameClock && typeof GameClock.normalizeTps === 'function') {
        return GameClock.normalizeTps(value);
    }
    var n = typeof value === 'number' ? value : parseInt(value, 10);
    if (n === 30 || n === 60 || n === 120) {
        return n;
    }
    return DEFAULT_TARGET_TPS;
};

window.applyTargetTps = function (value) {
    var rate = window.normalizeTargetTps(value);
    if (window.GameClock && typeof GameClock.setTps === 'function') {
        GameClock.setTps(rate);
    }
    return rate;
};

window.applyGameSpeed = function (value) {
    var speed = typeof normalizeGameSpeed === 'function'
        ? normalizeGameSpeed(value)
        : (parseFloat(value) || 1);
    if (window.GameClock && typeof GameClock.setGameSpeed === 'function') {
        speed = GameClock.setGameSpeed(speed);
    }
    return speed;
};

window.recomputeOpenSimCountdowns = function (fromTps, fromSpeed) {
    var game = window.game;
    var scenes;
    var i;
    var scene;
    if (!game || !game.scene || typeof game.scene.getScenes !== 'function') {
        return;
    }
    scenes = game.scene.getScenes(true);
    for (i = 0; i < scenes.length; i++) {
        scene = scenes[i];
        if (scene && typeof scene.recomputeSimCountdowns === 'function') {
            scene.recomputeSimCountdowns(fromTps, fromSpeed);
        }
    }
};

window.game = new Phaser.Game(config);
Keys.keepPhaserKeyboardOff();
window.game.events.on('ready', function () {
    Keys.keepPhaserKeyboardOff();
});

(function bindPerfReadout(game) {
    var frameCount = 0;
    var simTickCount = 0;
    var lastSimSeen = 0;
    var lastSample = (typeof performance !== 'undefined' && performance.now)
        ? performance.now()
        : Date.now();
    var smoothFps = RENDER_FPS_CAP;
    var smoothTps = DEFAULT_TARGET_TPS;
    var el = null;
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

    game.events.on('postrender', function () {
        frameCount += 1;
        if (window.GameClock && typeof GameClock.consumeSimTicks === 'function') {
            var total = GameClock.consumeSimTicks();
            if (total >= lastSimSeen) {
                simTickCount += total - lastSimSeen;
            }
            lastSimSeen = total;
        }
        var now = sampleNow();
        var elapsed = now - lastSample;
        var fpsInst;
        var tpsInst;
        var node;
        var configured;
        if (elapsed < SAMPLE_MS) {
            return;
        }
        fpsInst = (frameCount * 1000) / elapsed;
        tpsInst = (simTickCount * 1000) / elapsed;
        frameCount = 0;
        simTickCount = 0;
        lastSample = now;
        smoothFps = (smoothFps * (1 - EMA)) + (fpsInst * EMA);
        smoothTps = (smoothTps * (1 - EMA)) + (tpsInst * EMA);
        node = readoutEl();
        if (!node || node.hidden) {
            return;
        }
        configured = window.GameClock && typeof GameClock.getTps === 'function'
            ? GameClock.getTps()
            : DEFAULT_TARGET_TPS;
        node.textContent = 'FPS ' + Math.round(smoothFps) + ' | TPS ' + Math.round(smoothTps)
            + ' (' + configured + ')';
    });
})(window.game);
