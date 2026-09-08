var MenuItem = new Phaser.Class({
    Extends: Phaser.GameObjects.Text,

    initialize: function MenuItem(x, y, text, scene) {
        Phaser.GameObjects.Text.call(this, scene, x, y, text, {
            color: '#ffffff',
            align: 'left',
            fontSize: '11px',
            fontFamily: '"Courier New", Courier, monospace'
        });
    },

    select: function () {
        this.setColor('#f8ff38');
    },

    deselect: function () {
        this.setColor('#ffffff');
    },

    unitKilled: function () {
        this.active = false;
        this.visible = false;
    }
});

var Menu = new Phaser.Class({
    Extends: Phaser.GameObjects.Container,

    initialize: function Menu(x, y, scene) {
        Phaser.GameObjects.Container.call(this, scene, x, y);
        this.menuItems = [];
        this.menuItemIndex = 0;
        this.selected = false;
    },

    addMenuItem: function (unit) {
        var menuItem = new MenuItem(0, this.menuItems.length * 16, unit, this.scene);
        this.scene.add.existing(menuItem);
        this.menuItems.push(menuItem);
        this.add(menuItem);
        return menuItem;
    },

    moveSelectionUp: function () {
        if (!this.hasActiveItem()) {
            return;
        }
        this.menuItems[this.menuItemIndex].deselect();
        do {
            this.menuItemIndex--;
            if (this.menuItemIndex < 0) {
                this.menuItemIndex = this.menuItems.length - 1;
            }
        } while (!this.menuItems[this.menuItemIndex].active);
        this.menuItems[this.menuItemIndex].select();
    },

    moveSelectionDown: function () {
        if (!this.hasActiveItem()) {
            return;
        }
        this.menuItems[this.menuItemIndex].deselect();
        do {
            this.menuItemIndex++;
            if (this.menuItemIndex >= this.menuItems.length) {
                this.menuItemIndex = 0;
            }
        } while (!this.menuItems[this.menuItemIndex].active);
        this.menuItems[this.menuItemIndex].select();
    },

    hasActiveItem: function () {
        for (var i = 0; i < this.menuItems.length; i++) {
            if (this.menuItems[i].active) {
                return true;
            }
        }
        return false;
    },

    select: function (index) {
        if (index === undefined) {
            index = 0;
        }
        if (this.menuItems[this.menuItemIndex]) {
            this.menuItems[this.menuItemIndex].deselect();
        }
        this.menuItemIndex = index;
        if (!this.menuItems.length) {
            this.selected = false;
            return;
        }
        var start = index;
        while (!this.menuItems[this.menuItemIndex].active) {
            this.menuItemIndex++;
            if (this.menuItemIndex >= this.menuItems.length) {
                this.menuItemIndex = 0;
            }
            if (this.menuItemIndex === start) {
                this.selected = false;
                return;
            }
        }
        this.menuItems[this.menuItemIndex].select();
        this.selected = true;
    },

    deselect: function () {
        if (this.menuItems[this.menuItemIndex]) {
            this.menuItems[this.menuItemIndex].deselect();
        }
        this.menuItemIndex = 0;
        this.selected = false;
    },

    confirm: function () {
    },

    clear: function () {
        for (var i = 0; i < this.menuItems.length; i++) {
            this.menuItems[i].destroy();
        }
        this.menuItems.length = 0;
        this.menuItemIndex = 0;
    },

    remap: function (units) {
        this.clear();
        for (var i = 0; i < units.length; i++) {
            units[i].setMenuItem(this.addMenuItem(units[i].type));
        }
        this.menuItemIndex = 0;
    }
});

var HeroesMenu = new Phaser.Class({
    Extends: Menu,

    initialize: function HeroesMenu(x, y, scene) {
        Menu.call(this, x, y, scene);
    }
});

var ActionsMenu = new Phaser.Class({
    Extends: Menu,

    initialize: function ActionsMenu(x, y, scene) {
        Menu.call(this, x, y, scene);
        this.addMenuItem('Attack');
        this.addMenuItem('Heal');
        this.addMenuItem('Flee');
    },

    confirm: function () {
        this.selected = false;
        this.scene.events.emit('SelectedAction', this.menuItemIndex);
    }
});

var EnemiesMenu = new Phaser.Class({
    Extends: Menu,

    initialize: function EnemiesMenu(x, y, scene) {
        Menu.call(this, x, y, scene);
    },

    confirm: function () {
        this.selected = false;
        this.scene.events.emit('Enemy', this.menuItemIndex);
    }
});
