var Sfx = {
    muted: false,
    musicMuted: false,
    _ctx: null,
    _musicOsc: null,
    _musicGain: null,
    _musicLfo: null,
    _musicBiome: null,

    context: function () {
        if (this._ctx) {
            return this._ctx;
        }
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) {
            return null;
        }
        this._ctx = new AC();
        return this._ctx;
    },

    beep: function (freq, ms, gain) {
        var ctx;
        var osc;
        var g;
        var now;
        if (this.muted) {
            return;
        }
        ctx = this.context();
        if (!ctx) {
            return;
        }
        if (ctx.state === 'suspended' && ctx.resume) {
            ctx.resume();
        }
        now = ctx.currentTime;
        osc = ctx.createOscillator();
        g = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq || 440;
        g.gain.value = typeof gain === 'number' ? gain : 0.03;
        g.gain.exponentialRampToValueAtTime(0.0001, now + (ms || 60) / 1000);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + (ms || 60) / 1000);
    },

    ui: function () {
        this.beep(660, 40, 0.025);
    },

    hit: function () {
        this.beep(180, 80, 0.04);
    },

    eat: function () {
        this.beep(520, 70, 0.03);
    },

    pickup: function () {
        this.beep(880, 50, 0.03);
    },

    death: function () {
        this.beep(110, 220, 0.05);
    },

    levelUp: function () {
        this.beep(740, 90, 0.035);
        var self = this;
        window.setTimeout(function () {
            self.beep(990, 120, 0.035);
        }, 90);
    },

    foot: function () {
        this.beep(140, 30, 0.015);
    },

    stopMusic: function () {
        if (this._musicOsc) {
            try {
                this._musicOsc.stop();
            } catch (err) {
                /* already stopped */
            }
            this._musicOsc.disconnect();
            this._musicOsc = null;
        }
        if (this._musicLfo) {
            try {
                this._musicLfo.stop();
            } catch (err2) {
                /* already stopped */
            }
            this._musicLfo.disconnect();
            this._musicLfo = null;
        }
        if (this._musicGain) {
            this._musicGain.disconnect();
            this._musicGain = null;
        }
        this._musicBiome = null;
    },

    biomeTone: function (biome) {
        if (biome === 'grave' || biome === 'graves') {
            return { freq: 98, type: 'sawtooth', gain: 0.012, lfo: 2.4 };
        }
        if (biome === 'shore' || biome === 'coast') {
            return { freq: 174, type: 'sine', gain: 0.01, lfo: 0.35 };
        }
        if (biome === 'swamp' || biome === 'mire') {
            return { freq: 130, type: 'triangle', gain: 0.011, lfo: 0.9 };
        }
        if (biome === 'mine' || biome === 'cave') {
            return { freq: 110, type: 'square', gain: 0.008, lfo: 0.2 };
        }
        if (biome === 'forest') {
            return { freq: 196, type: 'triangle', gain: 0.009, lfo: 0.45 };
        }
        /* haven / plains / farm calm */
        return { freq: 220, type: 'sine', gain: 0.008, lfo: 0.15 };
    },

    playBiome: function (biome) {
        var ctx;
        var tone;
        var osc;
        var gain;
        var lfo;
        var lfoGain;
        if (this.musicMuted) {
            this.stopMusic();
            return;
        }
        biome = biome || 'plains';
        if (this._musicBiome === biome && this._musicOsc) {
            return;
        }
        this.stopMusic();
        ctx = this.context();
        if (!ctx) {
            return;
        }
        if (ctx.state === 'suspended' && ctx.resume) {
            ctx.resume();
        }
        tone = this.biomeTone(biome);
        osc = ctx.createOscillator();
        gain = ctx.createGain();
        lfo = ctx.createOscillator();
        lfoGain = ctx.createGain();
        osc.type = tone.type;
        osc.frequency.value = tone.freq;
        gain.gain.value = tone.gain;
        lfo.type = 'sine';
        lfo.frequency.value = tone.lfo;
        lfoGain.gain.value = tone.freq * 0.02;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        lfo.start();
        this._musicOsc = osc;
        this._musicGain = gain;
        this._musicLfo = lfo;
        this._musicBiome = biome;
    },

    setMusicMuted: function (muted) {
        this.musicMuted = !!muted;
        if (this.musicMuted) {
            this.stopMusic();
        } else if (this._musicBiome) {
            var biome = this._musicBiome;
            this._musicBiome = null;
            this.playBiome(biome);
        }
    }
};
