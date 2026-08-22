// Web Audio API: letter tones, word chords, and sound effects

export class AudioManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.masterGain = null;
        this.initialized = false;
        // Pentatonic scale frequencies mapped to letters
        this.letterFreqs = this._buildFrequencyMap();
        // SFX buffers (loaded on init)
        this.failBuffers = [];
        this.clapBuffers = [];
        this.victoryBuffer = null;
        this.puzzleBuffer = null;
        this._puzzleSource = null;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.ctx.destination);
            this.initialized = true;
            this._loadFailSfx();
            this._loadClapSfx();
            this._loadVictorySfx();
            this._loadPuzzleSfx();
        } catch (e) {
            this.enabled = false;
        }
    }

    _loadFailSfx() {
        const files = ['sfx/fails01.MP3', 'sfx/fails02.MP3', 'sfx/fails03.MP3'];
        for (const file of files) {
            fetch(file)
                .then(r => r.arrayBuffer())
                .then(buf => this.ctx.decodeAudioData(buf))
                .then(decoded => this.failBuffers.push(decoded))
                .catch(() => {});
        }
    }

    _loadClapSfx() {
        const files = ['sfx/clapping01.MP3', 'sfx/clapping02.MP3', 'sfx/clapping03.MP3'];
        for (const file of files) {
            fetch(file)
                .then(r => r.arrayBuffer())
                .then(buf => this.ctx.decodeAudioData(buf))
                .then(decoded => this.clapBuffers.push(decoded))
                .catch(() => {});
        }
    }

    _loadVictorySfx() {
        fetch('sfx/victory.mp3')
            .then(r => r.arrayBuffer())
            .then(buf => this.ctx.decodeAudioData(buf))
            .then(decoded => { this.victoryBuffer = decoded; })
            .catch(() => {});
    }

    _loadPuzzleSfx() {
        fetch('sfx/puzzle.mp3')
            .then(r => r.arrayBuffer())
            .then(buf => this.ctx.decodeAudioData(buf))
            .then(decoded => { this.puzzleBuffer = decoded; })
            .catch(() => {});
    }

    playPuzzleLoop() {
        if (!this.enabled || !this.initialized || !this.puzzleBuffer) return;
        this.stopPuzzleLoop();
        this.resume();
        const source = this.ctx.createBufferSource();
        source.buffer = this.puzzleBuffer;
        source.loop = true;
        source.connect(this.masterGain);
        source.start();
        this._puzzleSource = source;
    }

    stopPuzzleLoop() {
        if (this._puzzleSource) {
            try { this._puzzleSource.stop(); } catch (e) {}
            this._puzzleSource = null;
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    _buildFrequencyMap() {
        // Map A-Z to frequencies using a pentatonic scale spread across 2 octaves
        const pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00]; // C D E G A
        const freqs = {};
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let i = 0; i < 26; i++) {
            const octave = Math.floor(i / 5);
            const note = i % 5;
            freqs[letters[i]] = pentatonic[note] * Math.pow(2, octave * 0.5);
        }
        return freqs;
    }

    playTone(letter, duration = 0.12) {
        if (!this.enabled || !this.initialized) return;
        this.resume();

        const freq = this.letterFreqs[letter.toUpperCase()] || 440;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + duration);
    }

    playWordChord(word, duration = 0.4) {
        if (!this.enabled || !this.initialized) return;
        this.resume();

        const uniqueLetters = [...new Set(word.toUpperCase().split(''))].slice(0, 4);
        const now = this.ctx.currentTime;

        for (const letter of uniqueLetters) {
            const freq = this.letterFreqs[letter] || 440;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now);
            osc.stop(now + duration);
        }
    }

    playError() {
        if (!this.enabled || !this.initialized) return;
        this.resume();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.value = 150;

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    playVictory() {
        if (!this.enabled || !this.initialized) return;
        this.resume();

        const now = this.ctx.currentTime;

        // Phase 1: Opening fanfare (0–1.5s)
        const fanfare = [
            { freq: 523.25, time: 0,    dur: 0.20 },  // C5
            { freq: 659.25, time: 0.20, dur: 0.20 },  // E5
            { freq: 783.99, time: 0.40, dur: 0.20 },  // G5
            { freq: 1046.50, time: 0.60, dur: 0.50 },  // C6 (hold)
        ];

        // Phase 2: Triumphant melody (1.3–3.5s)
        const melody = [
            { freq: 783.99, time: 1.3, dur: 0.20 },  // G5
            { freq: 880.00, time: 1.5, dur: 0.20 },  // A5
            { freq: 1046.50, time: 1.7, dur: 0.30 },  // C6
            { freq: 987.77, time: 2.1, dur: 0.20 },  // B5
            { freq: 1046.50, time: 2.3, dur: 0.20 },  // C6
            { freq: 1174.66, time: 2.5, dur: 0.20 },  // D6
            { freq: 1318.51, time: 2.8, dur: 0.70 },  // E6 (hold)
        ];

        // Phase 3: Closing flourish (3.8–5.2s)
        const flourish = [
            { freq: 1318.51, time: 3.8, dur: 0.15 },  // E6
            { freq: 1174.66, time: 3.95, dur: 0.15 }, // D6
            { freq: 1318.51, time: 4.1, dur: 0.15 },  // E6
            { freq: 1567.98, time: 4.3, dur: 0.90 },  // G6 (hold)
        ];

        const allNotes = [...fanfare, ...melody, ...flourish];

        // Play melody notes
        for (const note of allNotes) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = note.freq;
            const start = now + note.time;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.20, start + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, start + note.dur + 0.4);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(start);
            osc.stop(start + note.dur + 0.45);
        }

        // Harmony pad — shifts chords over time
        const chords = [
            { notes: [261.63, 329.63, 392.00], time: 0,   dur: 2.0 },  // C major
            { notes: [349.23, 440.00, 523.25], time: 2.0, dur: 2.0 },  // F major
            { notes: [261.63, 329.63, 392.00], time: 4.0, dur: 2.0 },  // C major
        ];

        for (const chord of chords) {
            for (const freq of chord.notes) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.value = freq;
                const start = now + chord.time;
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(0.07, start + 0.15);
                gain.gain.setValueAtTime(0.07, start + chord.dur - 0.4);
                gain.gain.exponentialRampToValueAtTime(0.001, start + chord.dur);
                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start(start);
                osc.stop(start + chord.dur + 0.05);
            }
        }

        // Shimmer sparkles at two points
        const shimmerTimes = [1.1, 3.5, 5.2];
        for (const t of shimmerTimes) {
            for (let i = 0; i < 4; i++) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = 2400 + i * 500;
                const start = now + t + i * 0.05;
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(0.05, start + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start(start);
                osc.stop(start + 0.4);
            }
        }

        // Play a random clapping SFX alongside the fanfare
        if (this.clapBuffers.length > 0) {
            const buffer = this.clapBuffers[Math.floor(Math.random() * this.clapBuffers.length)];
            const source = this.ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(this.masterGain);
            source.start(now + 0.5);
        }
    }

    playUltimateVictory() {
        this.playVictory();
        if (!this.enabled || !this.initialized || !this.victoryBuffer) return;
        this.resume();
        const source = this.ctx.createBufferSource();
        source.buffer = this.victoryBuffer;
        source.connect(this.masterGain);
        source.start(this.ctx.currentTime + 0.3);
    }

    playFail() {
        if (!this.enabled || !this.initialized || this.failBuffers.length === 0) return;
        this.resume();
        const buffer = this.failBuffers[Math.floor(Math.random() * this.failBuffers.length)];
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.masterGain);
        source.start();
    }

    toggle() {
        this.enabled = !this.enabled;
        if (this.masterGain) {
            this.masterGain.gain.value = this.enabled ? 0.3 : 0;
        }
    }
}
