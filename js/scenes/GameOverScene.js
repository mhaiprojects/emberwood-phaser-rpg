var GameOverScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function GameOverScene() {
        Phaser.Scene.call(this, { key: 'GameOverScene' });
    },

    create: function () {
        this.cameras.main.setBackgroundColor('#14080c');
        var hero = this.registry.get('hero') || { level: 1 };
        Hud.hideBattle();
        Hud.showDead('Combat level ' + hero.level + '. Emberwood claimed another traveller.');
        Hud.log('You died. Return to title to try again.');
    }
});
