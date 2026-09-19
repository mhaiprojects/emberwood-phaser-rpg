var Keys = {
    down: {},
    pressed: {},

    init: function () {
        if (this._ready) {
            return;
        }
        this._ready = true;
        var self = this;
        window.addEventListener('keydown', function (event) {
            self.onKey(event, true);
        }, true);
        window.addEventListener('keyup', function (event) {
            self.onKey(event, false);
        }, true);
        window.addEventListener('keydown', function (event) {
            if (self.typing(event)) {
                return;
            }
            if (self.shouldBlockBrowser(event)) {
                event.preventDefault();
            }
        }, false);
        window.addEventListener('blur', function () {
            self.down = {};
            self.pressed = {};
        });
    },

    typing: function (event) {
        var el = (event && event.target) || document.activeElement;
        if (!el) {
            return false;
        }
        var tag = (el.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') {
            return true;
        }
        return !!el.isContentEditable;
    },

    shouldBlockBrowser: function (event) {
        if (!window.Hud || Hud.mode === 'title' || Hud.mode === 'dead') {
            return false;
        }
        var code = event.code || '';
        return code === 'ArrowUp' || code === 'ArrowDown' || code === 'ArrowLeft' ||
            code === 'ArrowRight' || code === 'Space';
    },

    namesFor: function (event) {
        var names = [];
        var seen = {};
        var add = function (name) {
            if (name && !seen[name]) {
                seen[name] = true;
                names.push(name);
            }
        };
        var code = event.code || '';
        var key = (event.key || '').toLowerCase();
        var keyCode = event.keyCode || event.which || 0;
        add(code);
        if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
            add('Key' + key.toUpperCase());
        }
        if (key === 'arrowup') { add('ArrowUp'); }
        if (key === 'arrowdown') { add('ArrowDown'); }
        if (key === 'arrowleft') { add('ArrowLeft'); }
        if (key === 'arrowright') { add('ArrowRight'); }
        if (key === ' ' || key === 'spacebar' || key === 'space') { add('Space'); }
        if (key === 'escape') { add('Escape'); }
        if (key === 'control') { add('Control'); }
        if (code === 'ControlLeft' || code === 'ControlRight') { add('Control'); }
        if (keyCode === 87) { add('KeyW'); }
        if (keyCode === 65) { add('KeyA'); }
        if (keyCode === 83) { add('KeyS'); }
        if (keyCode === 68) { add('KeyD'); }
        if (keyCode === 37) { add('ArrowLeft'); }
        if (keyCode === 38) { add('ArrowUp'); }
        if (keyCode === 39) { add('ArrowRight'); }
        if (keyCode === 40) { add('ArrowDown'); }
        if (keyCode === 32) { add('Space'); }
        if (keyCode === 27) { add('Escape'); }
        if (keyCode === 17) { add('Control'); }
        return names;
    },

    onKey: function (event, isDown) {
        if (isDown && this.typing(event)) {
            return;
        }
        this.note(event, isDown);
    },

    note: function (event, isDown) {
        var names = this.namesFor(event);
        var i;
        for (i = 0; i < names.length; i++) {
            if (isDown) {
                if (!this.down[names[i]] && !event.repeat) {
                    this.pressed[names[i]] = true;
                }
                this.down[names[i]] = true;
            } else {
                this.down[names[i]] = false;
            }
        }
    },

    isDown: function (code) {
        return !!this.down[code];
    },

    justPressed: function (code) {
        if (this.pressed[code]) {
            this.pressed[code] = false;
            return true;
        }
        return false;
    },

    left: function () {
        return this.isDown('ArrowLeft') || this.isDown('KeyA');
    },

    right: function () {
        return this.isDown('ArrowRight') || this.isDown('KeyD');
    },

    up: function () {
        return this.isDown('ArrowUp') || this.isDown('KeyW');
    },

    downArrow: function () {
        return this.isDown('ArrowDown') || this.isDown('KeyS');
    },

    moving: function () {
        return this.left() || this.right() || this.up() || this.downArrow();
    },

    runTogglePressed: function () {
        return this.justPressed('Control');
    }
};
