var PlayerCharacter = new Phaser.Class({
    Extends: Unit,

    initialize: function PlayerCharacter(scene, x, y, texture, frame, type, hp, damage) {
        Unit.call(this, scene, x, y, texture, frame, type, hp, damage);
        this.flipX = true;
        this.setScale(PLAYER_BATTLE_SCALE);
        this.syncHud();
    },

    syncHud: function () {
        if (!this.hpBarBg) {
            return;
        }
        var barY = this.y - Math.round(this.displayHeight / 2) - 8;
        var labelY = this.y + Math.round(this.displayHeight / 2) + 4;
        this.hpBarBg.setPosition(this.x - 14, barY);
        this.hpBarFill.setPosition(this.x - 14, barY);
        this.hpLabel.setPosition(this.x, labelY);
    }
});
