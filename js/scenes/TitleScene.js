var TitleScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function TitleScene() {
        Phaser.Scene.call(this, { key: 'TitleScene' });
    },

    create: function () {
        this.cameras.main.setBackgroundColor('#0b0a12');
        var g = this.add.graphics();
        g.fillStyle(0x14261c, 1);
        g.fillRect(0, 200, 512, 120);
        g.fillStyle(0x1d3a28, 1);
        g.fillTriangle(0, 200, 140, 60, 280, 200);
        g.fillTriangle(180, 200, 340, 40, 500, 200);

        var self = this;
        Hud.setStartHandler(function () {
            self.startGame();
        });
        Hud.showTitle();
        Hud.log('Click “Click here to play”, then click the world to walk.');
    },

    startGame: function () {
        var hero = (window.Hud && Hud._ironmanNewGame && typeof makeIronmanHero === 'function')
            ? makeIronmanHero()
            : makeHero();
        if (window.Hud) {
            Hud._ironmanNewGame = false;
        }
        this.registry.set('hero', hero);
        this.registry.set('quest', { id: 'goblins', stage: 0, progress: 0, goal: 5, points: 0 });
        this.registry.set('zone', 'haven');
        this.registry.set('battleOutcome', null);
        if (Hud.applyPendingSave) {
            Hud.applyPendingSave(this.registry);
        }
        Hud.hideTitle();
        this.scene.start('WorldScene');
    }
});
