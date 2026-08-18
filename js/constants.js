// Game modes
export const MODES = {
    SIMPLE: 'simple',
    CLEAR: 'clear',
    CHAIN: 'chain',
    ILLUMINATE: 'illuminate',
    APEX: 'apex'
};

// Chain mode combo multipliers
export const COMBO = {
    multipliers: [1.0, 1.5, 2.0, 2.5, 3.0],
    maxCombo: 4
};

// Color palettes — dark and light themes
const DARK_THEME = {
    background: { dark: '#050520', mid: '#0a0a2e', light: '#0f0f3d' },
    board: {
        fill: '#fdf4e3', stroke: '#ffd700', glow: 'rgba(255, 215, 0, 0.6)',
        text: '#fdf4e3', highlight: '#ff6b6b', dim: 'rgba(253, 244, 227, 0.3)'
    },
    trace: { valid: '#ffd700', invalid: '#ff4444', prefix: '#66ccff' },
    ui: {
        text: '#e0e0e8', textDim: 'rgba(224, 224, 232, 0.6)',
        accent: '#ffd700', success: '#4ade80', warning: '#f97316', error: '#ef4444',
        panel: 'rgba(10, 10, 46, 0.85)', panelBorder: 'rgba(255, 215, 0, 0.2)'
    },
    stars: ['#ffffff', '#ffd700', '#87ceeb', '#dda0dd', '#98fb98'],
    anchor: { rim: '#ff6b6b', fill: '#2a1a1a' },
    twin: { rim: '#4ade80', fill: '#1a2a1a' },
    prism: { rim: '#60a5fa', fill: '#1a1a2a' },
    modes: {
        simple: { accent: '#ffd700', glow: 'rgba(255, 215, 0, 0.6)' },
        clear: { accent: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)' },
        chain: { accent: '#4ade80', glow: 'rgba(74, 222, 128, 0.5)', combo: '#22c55e' },
        illuminate: { accent: '#f59e0b', glow: 'rgba(245, 158, 11, 0.6)', lit: 'rgba(255, 215, 0, 0.25)' },
        apex: { accent: '#e879f9', glow: 'rgba(232, 121, 249, 0.6)', lit: 'rgba(232, 121, 249, 0.25)' }
    },
    canvas: {
        overlayDim: 'rgba(5, 5, 32, 0.7)', overlayDimLight: 'rgba(5, 5, 32, 0.45)',
        overlayDimHeavy: 'rgba(5, 5, 32, 0.92)',
        panelBg: 'rgba(10, 10, 46, 0.85)', panelBgLight: 'rgba(10, 10, 46, 0.3)',
        panelBgMedium: 'rgba(10, 10, 46, 0.75)',
        tooltipBg: 'rgba(10, 10, 46, 0.95)', tooltipBorder: 'rgba(255, 215, 0, 0.5)',
        pillBorder: 'rgba(255, 215, 0, 0.3)', feedbackShadow: 'rgba(255, 215, 0, 0.4)'
    },
    button: {
        bg: 'rgba(255, 255, 255, 0.06)', stroke: 'rgba(255, 215, 0, 0.7)',
        icon: '#ffd700', infoBg: 'rgba(255, 215, 0, 0.1)'
    },
    hex: {
        defaultFill: 'rgba(253, 244, 227, 0.08)', traceFill: 'rgba(255, 215, 0, 0.3)',
        illuminatedFill: 'rgba(255, 215, 0, 0.2)',
        letterDefault: '#ffdd00', letterTrace: '#ffffff',
        ghostFill: 'rgba(253, 244, 227, 0.08)', ghostStroke: 'rgba(253, 244, 227, 0.35)',
        ghostLetter: 'rgba(255, 221, 0, 0.65)',
        unlitFill: 'rgba(255, 80, 80, 0.08)', unlitStroke: 'rgba(255, 80, 80, 0.4)',
        unlitShadow: 'rgba(255, 80, 80, 0.6)', unlitLetter: 'rgba(255, 100, 100, 0.6)',
        chainPulse: 'rgba(100, 200, 255, 0.5)', chainPulseStroke: 'rgba(100, 200, 255, 0.5)',
        solutionFill: 'rgba(255, 215, 0, 0.15)', solutionStroke: '#ffd700',
        solutionShadow: 'rgba(255, 215, 0, 0.5)', solutionPathShadow: 'rgba(255, 215, 0, 0.6)'
    },
    footer: { copyright: 'rgba(192, 192, 220, 0.45)', version: 'rgba(255, 215, 0, 0.75)' }
};

const LIGHT_THEME = {
    background: { dark: '#e8f0fe', mid: '#f0f6ff', light: '#f8faff' },
    board: {
        fill: '#2d2d44', stroke: '#ff8c00', glow: 'rgba(255, 140, 0, 0.5)',
        text: '#2d2d44', highlight: '#ff4d6a', dim: 'rgba(45, 45, 68, 0.3)'
    },
    trace: { valid: '#ff8c00', invalid: '#e53e3e', prefix: '#3182ce' },
    ui: {
        text: '#2d2d44', textDim: 'rgba(45, 45, 68, 0.5)',
        accent: '#ff8c00', success: '#22c55e', warning: '#f97316', error: '#e53e3e',
        panel: 'rgba(255, 255, 255, 0.92)', panelBorder: 'rgba(255, 140, 0, 0.25)'
    },
    stars: ['#ff8c00', '#ffd700', '#3182ce', '#e879f9', '#22c55e'],
    anchor: { rim: '#ff4d6a', fill: '#fff0f0' },
    twin: { rim: '#22c55e', fill: '#f0fff0' },
    prism: { rim: '#3182ce', fill: '#f0f0ff' },
    modes: {
        simple: { accent: '#ff8c00', glow: 'rgba(255, 140, 0, 0.5)' },
        clear: { accent: '#e53e3e', glow: 'rgba(229, 62, 62, 0.4)' },
        chain: { accent: '#22c55e', glow: 'rgba(34, 197, 94, 0.4)', combo: '#16a34a' },
        illuminate: { accent: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)', lit: 'rgba(255, 200, 50, 0.3)' },
        apex: { accent: '#a855f7', glow: 'rgba(168, 85, 247, 0.5)', lit: 'rgba(168, 85, 247, 0.3)' }
    },
    canvas: {
        overlayDim: 'rgba(255, 255, 255, 0.75)', overlayDimLight: 'rgba(255, 255, 255, 0.5)',
        overlayDimHeavy: 'rgba(255, 255, 255, 0.92)',
        panelBg: 'rgba(255, 255, 255, 0.92)', panelBgLight: 'rgba(255, 255, 255, 0.5)',
        panelBgMedium: 'rgba(255, 255, 255, 0.8)',
        tooltipBg: 'rgba(255, 255, 255, 0.95)', tooltipBorder: 'rgba(255, 140, 0, 0.5)',
        pillBorder: 'rgba(255, 140, 0, 0.3)', feedbackShadow: 'rgba(255, 140, 0, 0.4)'
    },
    button: {
        bg: 'rgba(0, 0, 0, 0.06)', stroke: 'rgba(255, 140, 0, 0.7)',
        icon: '#ff8c00', infoBg: 'rgba(255, 140, 0, 0.12)'
    },
    hex: {
        defaultFill: 'rgba(45, 45, 68, 0.06)', traceFill: 'rgba(255, 140, 0, 0.25)',
        illuminatedFill: 'rgba(255, 200, 50, 0.2)',
        letterDefault: '#ff8c00', letterTrace: '#ffffff',
        ghostFill: 'rgba(45, 45, 68, 0.04)', ghostStroke: 'rgba(45, 45, 68, 0.25)',
        ghostLetter: 'rgba(255, 140, 0, 0.65)',
        unlitFill: 'rgba(255, 80, 80, 0.1)', unlitStroke: 'rgba(255, 80, 80, 0.5)',
        unlitShadow: 'rgba(255, 80, 80, 0.6)', unlitLetter: 'rgba(255, 100, 100, 0.7)',
        chainPulse: 'rgba(60, 160, 255, 0.5)', chainPulseStroke: 'rgba(60, 160, 255, 0.5)',
        solutionFill: 'rgba(255, 140, 0, 0.15)', solutionStroke: '#ff8c00',
        solutionShadow: 'rgba(255, 140, 0, 0.5)', solutionPathShadow: 'rgba(255, 140, 0, 0.6)'
    },
    footer: { copyright: 'rgba(45, 45, 68, 0.45)', version: 'rgba(255, 140, 0, 0.75)' }
};

// Mutable COLORS object — mutated in-place by setTheme()
export const COLORS = structuredClone(DARK_THEME);

function deepAssign(target, source) {
    for (const key of Object.keys(source)) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
            if (!target[key]) target[key] = {};
            deepAssign(target[key], source[key]);
        } else {
            target[key] = Array.isArray(source[key]) ? [...source[key]] : source[key];
        }
    }
}

export function setTheme(themeName) {
    const theme = themeName === 'light' ? LIGHT_THEME : DARK_THEME;
    deepAssign(COLORS, theme);
}

export function getCurrentTheme() {
    return COLORS.background.dark === DARK_THEME.background.dark ? 'dark' : 'light';
}

// Hex geometry
export const HEX = {
    defaultSize: 47,
    minSize: 30,
    maxSize: 62,
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
    baseTier: { simple: 50, clear: 60, chain: 70, illuminate: 80, apex: 90 },
    multiplierTier: { simple: 1.0, clear: 1.2, chain: 1.4, illuminate: 1.6, apex: 1.8 },
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
    COOLDOWN: 'cooldown',
    GAUNTLET_INTRO: 'gauntlet_intro',
    APEX_UNLOCK: 'apex_unlock'
};

// Apex mode unlock threshold
export const APEX_UNLOCK_SCORE = 20000;
