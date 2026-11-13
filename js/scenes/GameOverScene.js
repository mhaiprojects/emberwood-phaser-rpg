var GameOverScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function GameOverScene() {
        Phaser.Scene.call(this, { key: 'GameOverScene' });
    },

    create: function () {
        this.cameras.main.setBackgroundColor('#14080c');
        var hero = this.registry.get('hero') || { level: 1 };
        var level = typeof combatLevel === 'function' ? combatLevel(hero) : (hero.level || 1);
        var title;
        var logLine;
        Hud.hideBattle();
        title = (typeof Content !== 'undefined' && Content.onboardingLine)
            ? Content.onboardingLine('deathTitle', { level: level })
            : '';
        logLine = (typeof Content !== 'undefined' && Content.onboardingLine)
            ? Content.onboardingLine('deathLog')
            : '';
        Hud.showDead(title || ('Level ' + level + '. You have fallen.'));
        Hud.log(logLine || 'You died. Respawn to reclaim your gravestone.');
    }
});
