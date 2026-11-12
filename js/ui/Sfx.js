var Sfx = {
    muted: false,
    musicMuted: false,
    _ctx: null,
    _musicNodes: null,
    _musicGain: null,
    _musicBiome: null,
    _lastBiome: null,

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

    _resume: function (ctx) {
        if (ctx && ctx.state === 'suspended' && ctx.resume) {
            ctx.resume();
        }
    },

    /* Soft envelope tone; type/slide optional. */
    tone: function (freq, ms, gain, type, slideTo) {
        var ctx;
        var osc;
        var g;
        var now;
        var dur;
        if (this.muted) {
            return;
        }
        ctx = this.context();
        if (!ctx) {
            return;
        }
        this._resume(ctx);
        now = ctx.currentTime;
        dur = Math.max(0.02, (ms || 60) / 1000);
        osc = ctx.createOscillator();
        g = ctx.createGain();
        osc.type = type || 'triangle';
        osc.frequency.setValueAtTime(freq || 440, now);
        if (typeof slideTo === 'number') {
            osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + dur);
        }
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain || 0.03), now + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + dur + 0.02);
    },

    /* Filtered noise burst for hits / feet / wash. */
    noise: function (ms, gain, filterFreq, filterType) {
        var ctx;
        var buffer;
        var src;
        var filter;
        var g;
        var now;
        var dur;
        var i;
        var data;
        if (this.muted) {
            return;
        }
        ctx = this.context();
        if (!ctx) {
            return;
        }
        this._resume(ctx);
        now = ctx.currentTime;
        dur = Math.max(0.02, (ms || 80) / 1000);
        buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * dur)), ctx.sampleRate);
        data = buffer.getChannelData(0);
        for (i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        }
        src = ctx.createBufferSource();
        src.buffer = buffer;
        filter = ctx.createBiquadFilter();
        filter.type = filterType || 'bandpass';
        filter.frequency.value = filterFreq || 800;
        filter.Q.value = 1.2;
        g = ctx.createGain();
        g.gain.setValueAtTime(Math.max(0.0002, gain || 0.04), now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        src.connect(filter);
        filter.connect(g);
        g.connect(ctx.destination);
        src.start(now);
        src.stop(now + dur + 0.02);
    },

    beep: function (freq, ms, gain) {
        this.tone(freq, ms, gain, 'square');
    },

    ui: function () {
        this.tone(740, 28, 0.022, 'triangle');
        var self = this;
        window.setTimeout(function () {
            self.tone(980, 36, 0.018, 'triangle');
        }, 28);
    },

    hit: function () {
        this.noise(70, 0.045, 420, 'bandpass');
        this.tone(160, 90, 0.035, 'sawtooth', 70);
    },

    eat: function () {
        this.tone(420, 50, 0.022, 'sine');
        var self = this;
        window.setTimeout(function () {
            self.tone(560, 70, 0.02, 'triangle');
        }, 40);
    },

    pickup: function () {
        this.tone(660, 40, 0.022, 'triangle');
        var self = this;
        window.setTimeout(function () {
            self.tone(880, 45, 0.02, 'triangle');
        }, 35);
        window.setTimeout(function () {
            self.tone(1180, 55, 0.016, 'sine');
        }, 75);
    },

    death: function () {
        this.tone(180, 160, 0.04, 'sawtooth', 70);
        var self = this;
        window.setTimeout(function () {
            self.tone(90, 220, 0.035, 'triangle', 45);
        }, 90);
    },

    levelUp: function () {
        var self = this;
        this.tone(523, 80, 0.028, 'triangle');
        window.setTimeout(function () {
            self.tone(659, 90, 0.028, 'triangle');
        }, 70);
        window.setTimeout(function () {
            self.tone(784, 120, 0.03, 'sine');
        }, 150);
        window.setTimeout(function () {
            self.tone(1047, 160, 0.024, 'sine');
        }, 240);
    },

    foot: function () {
        this.noise(28, 0.018, 180, 'lowpass');
    },

    chop: function () {
        this.noise(45, 0.03, 280, 'bandpass');
        this.tone(210, 70, 0.028, 'triangle', 140);
    },

    mine: function () {
        this.tone(920, 35, 0.02, 'square');
        this.noise(50, 0.028, 1400, 'bandpass');
        var self = this;
        window.setTimeout(function () {
            self.tone(620, 55, 0.018, 'triangle', 380);
        }, 30);
    },

    fish: function () {
        this.noise(90, 0.028, 900, 'bandpass');
        this.tone(480, 70, 0.016, 'sine', 320);
    },

    gather: function (kind) {
        if (kind === 'mine') {
            this.mine();
            return;
        }
        if (kind === 'fish') {
            this.fish();
            return;
        }
        this.chop();
    },

    _track: function (node) {
        this._musicNodes = this._musicNodes || [];
        this._musicNodes.push(node);
    },

    stopMusic: function () {
        var i;
        var node;
        if (this._musicNodes) {
            for (i = 0; i < this._musicNodes.length; i++) {
                node = this._musicNodes[i];
                try {
                    if (node.stop) {
                        node.stop();
                    }
                } catch (err) {
                    /* already stopped */
                }
                try {
                    node.disconnect();
                } catch (err2) {
                    /* already disconnected */
                }
            }
            this._musicNodes = null;
        }
        if (this._musicGain) {
            try {
                this._musicGain.disconnect();
            } catch (err3) {
                /* already disconnected */
            }
            this._musicGain = null;
        }
        this._musicBiome = null;
    },

    /* Layered procedural bed: root + harmony + optional noise wash. */
    biomeBed: function (biome) {
        if (biome === 'grave' || biome === 'graves') {
            return {
                gain: 0.011,
                layers: [
                    { freq: 73, type: 'sawtooth', mix: 0.55, lfo: 2.1, depth: 0.03 },
                    { freq: 110, type: 'triangle', mix: 0.35, lfo: 0.35, depth: 0.01 },
                    { freq: 147, type: 'sine', mix: 0.2, lfo: 0.18, depth: 0.008 }
                ],
                noise: { gain: 0.004, freq: 220, type: 'lowpass', lfo: 0.4 }
            };
        }
        if (biome === 'shore' || biome === 'coast') {
            return {
                gain: 0.009,
                layers: [
                    { freq: 146, type: 'sine', mix: 0.45, lfo: 0.22, depth: 0.015 },
                    { freq: 220, type: 'triangle', mix: 0.3, lfo: 0.12, depth: 0.01 }
                ],
                noise: { gain: 0.007, freq: 680, type: 'bandpass', lfo: 0.28 }
            };
        }
        if (biome === 'swamp' || biome === 'mire') {
            return {
                gain: 0.01,
                layers: [
                    { freq: 98, type: 'triangle', mix: 0.55, lfo: 0.7, depth: 0.025 },
                    { freq: 147, type: 'sine', mix: 0.35, lfo: 0.25, depth: 0.012 }
                ],
                noise: { gain: 0.0035, freq: 340, type: 'lowpass', lfo: 0.5 }
            };
        }
        if (biome === 'mine' || biome === 'cave' || biome === 'den') {
            return {
                gain: biome === 'den' ? 0.012 : 0.009,
                layers: [
                    { freq: 82, type: 'square', mix: 0.4, lfo: 0.16, depth: 0.008 },
                    { freq: 123, type: 'sawtooth', mix: 0.35, lfo: 0.55, depth: 0.02 },
                    { freq: 246, type: 'sine', mix: 0.2, lfo: 0.09, depth: 0.006 }
                ],
                noise: { gain: 0.003, freq: 180, type: 'lowpass', lfo: 0.2 }
            };
        }
        if (biome === 'forest') {
            return {
                gain: 0.009,
                layers: [
                    { freq: 164, type: 'triangle', mix: 0.5, lfo: 0.4, depth: 0.018 },
                    { freq: 246, type: 'sine', mix: 0.35, lfo: 0.18, depth: 0.01 },
                    { freq: 392, type: 'sine', mix: 0.18, lfo: 0.55, depth: 0.012 }
                ]
            };
        }
        if (biome === 'hills') {
            return {
                gain: 0.0085,
                layers: [
                    { freq: 174, type: 'sine', mix: 0.5, lfo: 0.14, depth: 0.01 },
                    { freq: 261, type: 'triangle', mix: 0.35, lfo: 0.2, depth: 0.012 }
                ]
            };
        }
        if (biome === 'town' || biome === 'haven') {
            return {
                gain: 0.008,
                layers: [
                    { freq: 196, type: 'sine', mix: 0.45, lfo: 0.12, depth: 0.008 },
                    { freq: 247, type: 'triangle', mix: 0.3, lfo: 0.1, depth: 0.006 },
                    { freq: 294, type: 'sine', mix: 0.25, lfo: 0.16, depth: 0.008 }
                ]
            };
        }
        /* plains / farm / default calm */
        return {
            gain: 0.0075,
            layers: [
                { freq: 185, type: 'sine', mix: 0.55, lfo: 0.14, depth: 0.01 },
                { freq: 277, type: 'triangle', mix: 0.3, lfo: 0.11, depth: 0.008 }
            ]
        };
    },

    _startLayer: function (ctx, master, layer) {
        var osc = ctx.createOscillator();
        var g = ctx.createGain();
        var lfo = ctx.createOscillator();
        var lfoGain = ctx.createGain();
        osc.type = layer.type || 'sine';
        osc.frequency.value = layer.freq;
        g.gain.value = layer.mix || 0.4;
        lfo.type = 'sine';
        lfo.frequency.value = layer.lfo || 0.15;
        lfoGain.gain.value = (layer.freq || 200) * (layer.depth || 0.01);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        osc.connect(g);
        g.connect(master);
        osc.start();
        lfo.start();
        this._track(osc);
        this._track(lfo);
        this._track(g);
        this._track(lfoGain);
    },

    _startNoiseWash: function (ctx, master, spec) {
        var seconds = 3;
        var buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
        var data = buffer.getChannelData(0);
        var i;
        var src;
        var filter;
        var g;
        var lfo;
        var lfoGain;
        for (i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        src = ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        filter = ctx.createBiquadFilter();
        filter.type = spec.type || 'bandpass';
        filter.frequency.value = spec.freq || 600;
        filter.Q.value = 0.8;
        g = ctx.createGain();
        g.gain.value = spec.gain || 0.004;
        if (spec.lfo) {
            lfo = ctx.createOscillator();
            lfoGain = ctx.createGain();
            lfo.type = 'sine';
            lfo.frequency.value = spec.lfo;
            lfoGain.gain.value = (spec.gain || 0.004) * 0.55;
            lfo.connect(lfoGain);
            lfoGain.connect(g.gain);
            lfo.start();
            this._track(lfo);
            this._track(lfoGain);
        }
        src.connect(filter);
        filter.connect(g);
        g.connect(master);
        src.start();
        this._track(src);
        this._track(filter);
        this._track(g);
    },

    playBiome: function (biome) {
        var ctx;
        var bed;
        var master;
        var i;
        if (this.musicMuted) {
            this._lastBiome = biome || this._lastBiome;
            this.stopMusic();
            return;
        }
        biome = biome || 'plains';
        this._lastBiome = biome;
        if (this._musicBiome === biome && this._musicGain) {
            return;
        }
        this.stopMusic();
        ctx = this.context();
        if (!ctx) {
            return;
        }
        this._resume(ctx);
        bed = this.biomeBed(biome);
        master = ctx.createGain();
        master.gain.value = bed.gain || 0.008;
        master.connect(ctx.destination);
        this._musicGain = master;
        this._musicNodes = [];
        this._track(master);
        for (i = 0; i < bed.layers.length; i++) {
            this._startLayer(ctx, master, bed.layers[i]);
        }
        if (bed.noise) {
            this._startNoiseWash(ctx, master, bed.noise);
        }
        this._musicBiome = biome;
    },

    setMusicMuted: function (muted) {
        this.musicMuted = !!muted;
        if (this.musicMuted) {
            this.stopMusic();
            return;
        }
        if (this._lastBiome) {
            var biome = this._lastBiome;
            this._musicBiome = null;
            this.playBiome(biome);
        }
    }
};
