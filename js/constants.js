// Game modes
export const MODES = {
    SIMPLE: 'simple',
    CLEAR: 'clear',
    CHAIN: 'chain',
    ILLUMINATE: 'illuminate'
};

// Chain mode combo multipliers
export const COMBO = {
    multipliers: [1.0, 1.5, 2.0, 2.5, 3.0],
    maxCombo: 4
};

// Color palettes
export const COLORS = {
    background: { dark: '#050520', mid: '#0a0a2e', light: '#0f0f3d' },
    board: {
        fill: '#fdf4e3',
        stroke: '#ffd700',
        glow: 'rgba(255, 215, 0, 0.6)',
        text: '#fdf4e3',
        highlight: '#ff6b6b',
        dim: 'rgba(253, 244, 227, 0.3)'
    },
    trace: {
        valid: '#ffd700',
        invalid: '#ff4444',
        prefix: '#66ccff'
    },
    ui: {
        text: '#e0e0e8',
        textDim: 'rgba(224, 224, 232, 0.6)',
        accent: '#ffd700',
        success: '#4ade80',
        warning: '#f97316',
        error: '#ef4444',
        panel: 'rgba(10, 10, 46, 0.85)',
        panelBorder: 'rgba(255, 215, 0, 0.2)'
    },
    stars: ['#ffffff', '#ffd700', '#87ceeb', '#dda0dd', '#98fb98'],
    anchor: { rim: '#ff6b6b', fill: '#2a1a1a' },
    twin: { rim: '#4ade80', fill: '#1a2a1a' },
    prism: { rim: '#60a5fa', fill: '#1a1a2a' },
    modes: {
        simple: { accent: '#ffd700', glow: 'rgba(255, 215, 0, 0.6)' },
        clear: { accent: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)' },
        chain: { accent: '#4ade80', glow: 'rgba(74, 222, 128, 0.5)', combo: '#22c55e' },
        illuminate: { accent: '#f59e0b', glow: 'rgba(245, 158, 11, 0.6)', lit: 'rgba(255, 215, 0, 0.25)' }
    }
};

// Hex geometry
export const HEX = {
    defaultSize: 38,
    minSize: 24,
    maxSize: 50,
    padding: 4,
    letterSize: 0.675,
    glowRadius: 12,
    rimWidth: 2.5
};

// Letter point values
export const LETTER_VALUES = {
    A: 5, B: 15, C: 10, D: 10, E: 5, F: 15, G: 10, H: 12,
    I: 5, J: 25, K: 20, L: 8, M: 10, N: 8, O: 5, P: 10,
    Q: 30, R: 8, S: 5, T: 5, U: 8, V: 18, W: 15, X: 25,
    Y: 12, Z: 30
};

// Scoring
export const SCORING = {
    baseTier: { simple: 50, clear: 60, chain: 70, illuminate: 80 },
    multiplierTier: { simple: 1.0, clear: 1.2, chain: 1.4, illuminate: 1.6 },
    efficiencyPerMove: 15,
    secondaryCompletionBonus: 30,
    discoveryBonus: 5
};

// Timing
export const TIMING = {
    traceAnimDuration: 200,
    submitAnimDuration: 600,
    victoryAnimDuration: 1500,
    particleFadeTime: 2000
};

// Game states
export const STATES = {
    LOADING: 'loading',
    MENU: 'menu',
    LEVEL_INTRO: 'level_intro',
    PLAYING: 'playing',
    SUBMITTING: 'submitting',
    VICTORY: 'victory',
    DEFEAT: 'defeat',
    GAME_OVER: 'game_over',
    COOLDOWN: 'cooldown'
};
