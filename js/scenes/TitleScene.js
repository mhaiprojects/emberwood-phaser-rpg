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
        /* Auto-continue: do not call showTitle first. Re-showing the title scrim then
           relying on hideTitle raced Vue v-show vs [hidden], leaving the dark
           rgba(8,6,10,0.82) layer over WorldScene after refresh. startGame→hideTitle
           clears the boot-time title from Hud.onVueMounted. */
        if (this.registry.get('autoContinueSave') && typeof hasSave === 'function' && hasSave()) {
            this.registry.set('autoContinueSave', false);
            Hud.log('Continuing your ' + this._packTitle() + ' save…');
            if (Hud.onContinue) {
                Hud.onContinue();
            }
            return;
        }
        this.registry.set('autoContinueSave', false);
        Hud.showTitle();
        Hud.log('Click “Click here to play”, then click the world to walk.');
    },

    _packTitle: function () {
        if (typeof Content !== 'undefined' && Content.getMeta) {
            var meta = Content.getMeta();
            if (meta && meta.title) {
                return meta.title;
            }
        }
        return 'Emberwood';
    },

    startGame: function () {
        var hero = (window.Hud && Hud._ironmanNewGame && typeof makeIronmanHero === 'function')
            ? makeIronmanHero()
            : makeHero();
        var startQuest = (typeof Content !== 'undefined' && Content.makeDefaultQuest)
            ? Content.makeDefaultQuest()
            : { id: 'goblins', stage: 0, progress: 0, goal: 5, points: 0 };
        var startZone = (typeof Content !== 'undefined' && Content.defaultZoneId)
            ? Content.defaultZoneId()
            : 'haven';
        if (window.Hud) {
            Hud._ironmanNewGame = false;
        }
        this.registry.set('hero', hero);
        this.registry.set('quest', startQuest);
        this.registry.set('zone', startZone);
        this.registry.set('battleOutcome', null);
        if (Hud.applyPendingSave) {
            Hud.applyPendingSave(this.registry);
        }
        Hud.hideTitle();
        this.scene.start('WorldScene');
    }
});
