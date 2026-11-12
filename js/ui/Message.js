var Message = new Phaser.Class({
    Extends: Phaser.GameObjects.Container,

    initialize: function Message(scene, events) {
        Phaser.GameObjects.Container.call(this, scene, 160, 28);
        var graphics = scene.add.graphics();
        this.add(graphics);
        graphics.lineStyle(1, 0xf4e8c1, 0.9);
        graphics.fillStyle(0x031f4c, 0.82);
        graphics.strokeRect(-110, -16, 220, 32);
        graphics.fillRect(-110, -16, 220, 32);
        this.text = scene.add.text(0, 0, ' ', {
            color: '#ffffff',
            align: 'center',
            fontSize: '10px',
            fontFamily: 'Alegreya Sans, Trebuchet MS, sans-serif',
            wordWrap: { width: 200, useAdvancedWrap: true }
        });
        this.add(this.text);
        this.text.setOrigin(0.5);
        this.bus = events;
        this.bus.off('Message', this.showMessage, this);
        this.bus.on('Message', this.showMessage, this);
        this.visible = false;
    },

    showMessage: function (text) {
        if (!this.scene || !this.text || !this.scene.sys.isActive()) {
            return;
        }
        this.text.setText(text);
        this.visible = true;
        if (this.hideEvent) {
            this.hideEvent.remove(false);
        }
        this.hideEvent = this.scene.time.addEvent({
            delay: 1800,
            callback: this.hideMessage,
            callbackScope: this
        });
    },

    hideMessage: function () {
        this.hideEvent = null;
        this.visible = false;
    },

    destroy: function (fromScene) {
        if (this.bus) {
            this.bus.off('Message', this.showMessage, this);
        }
        Phaser.GameObjects.Container.prototype.destroy.call(this, fromScene);
    }
});
