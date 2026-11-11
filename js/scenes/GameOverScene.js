var GameOverScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function GameOverScene() {
        Phaser.Scene.call(this, { key: 'GameOverScene' });
    },

    create: function () {
        this.cameras.main.setBackgroundColor('#14080c');
        var hero = this.registry.get('hero') || { level: 1 };
        var level = typeof combatLevel === 'function' ? combatLevel(hero) : (hero.level || 1);
        Hud.hideBattle();
        Hud.showDead('Combat level ' + level + '. Emberwood claimed another traveller.');
        Hud.log('You died. Your items lie in a gravestone — respawn in Emberhaven, then click it to reclaim them. Return to title abandons the run.');
    }
});
