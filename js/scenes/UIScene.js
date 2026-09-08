var UIScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function UIScene() {
        Phaser.Scene.call(this, { key: 'UIScene' });
    },

    create: function () {
        this.battleScene = this.scene.get('BattleScene');
        this.bindBattle();
        this.sys.events.off('wake', this.bindBattle, this);
        this.sys.events.on('wake', this.bindBattle, this);
        Hud.showBattle(this.battleScene);
    },

    bindBattle: function () {
        this.battleScene = this.scene.get('BattleScene');
        this.battleScene.events.off('PlayerSelect', this.onPlayerSelect, this);
        this.battleScene.events.off('Message', this.onMessage, this);
        this.battleScene.events.on('PlayerSelect', this.onPlayerSelect, this);
        this.battleScene.events.on('Message', this.onMessage, this);
        Hud.showBattle(this.battleScene);
        if (this.battleScene.waitingForPlayer) {
            Hud.onPlayerTurn(this.battleScene);
        }
    },

    onPlayerSelect: function () {
        Hud.onPlayerTurn(this.battleScene);
    },

    onMessage: function (text) {
        Hud.battleLog(text);
        Hud.renderBattle();
    }
});
