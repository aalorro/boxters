import { hexSpiral, hexKey, getNeighbors } from './hex.js';
import { HexCell, Field, Board } from './board.js';
import { dictionary, WORD_LIST } from './dictionary.js';
import { BOARD_WORDS } from './common-words.js';

// Seeded PRNG (mulberry32)
function createRNG(seed) {
    let s = seed | 0;
    return function() {
        s = (s + 0x6D2B79F5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Fisher-Yates shuffle with seeded RNG
function shuffle(arr, rng) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// English letter frequency weights
const LETTER_WEIGHTS = {
    A: 8.2, B: 1.5, C: 2.8, D: 4.3, E: 12.7, F: 2.2, G: 2.0, H: 6.1,
    I: 7.0, J: 0.2, K: 0.8, L: 4.0, M: 2.4, N: 6.7, O: 7.5, P: 1.9,
    Q: 0.1, R: 6.0, S: 6.3, T: 9.1, U: 2.8, V: 1.0, W: 2.4, X: 0.2,
    Y: 2.0, Z: 0.1
};

// Generate a weighted random letter (exported for Chain mode runtime use)
export function randomLetter(rng) {
    const fn = rng || Math.random;
    const entries = Object.entries(LETTER_WEIGHTS);
    const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0);
    let r = fn() * totalWeight;
    for (const [letter, weight] of entries) {
        r -= weight;
        if (r <= 0) return letter;
    }
    return 'E';
}

// Safe random letter for illuminate fill — excludes J, Q, V, X, Z
const SAFE_LETTER_WEIGHTS = {
    A: 8.2, B: 1.5, C: 2.8, D: 4.3, E: 12.7, F: 2.2, G: 2.0, H: 6.1,
    I: 7.0, K: 0.8, L: 4.0, M: 2.4, N: 6.7, O: 7.5, P: 1.9,
    R: 6.0, S: 6.3, T: 9.1, U: 2.8, W: 2.4, Y: 2.0
};
function safeLetter(rng) {
    const entries = Object.entries(SAFE_LETTER_WEIGHTS);
    const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0);
    let r = rng() * totalWeight;
    for (const [letter, weight] of entries) {
        r -= weight;
        if (r <= 0) return letter;
    }
    return 'E';
}

// Generate a balanced letter set for a board
function generateLetters(count, rng) {
    const letters = [];
    const vowels = 'AEIOU';
    const minVowels = Math.ceil(count * 0.35);

    for (let i = 0; i < minVowels; i++) {
        letters.push(vowels[Math.floor(rng() * vowels.length)]);
    }

    while (letters.length < count) {
        const l = randomLetter(rng);
        if ('JQXZ'.includes(l) && count < 30 && rng() > 0.15) continue;
        letters.push(l);
    }

    return shuffle(letters, rng);
}

// ── Level definitions ────────────────────────────────────────────
const LEVEL_DATA = [
    // ── SIMPLE MODE (Levels 0-9) ──
    {
        id: 'simple_01', name: 'First Light', mode: 'simple', tier: 'simple',
        maxMoves: 3, scoreMult: 0.4, twoStarTarget: 60, threeStarTarget: 80,
        tutorial: { message: 'Trace adjacent cells to spell a word. Drag through letters to form a path.' },
        layout: { shape: 'hex2', cellTypes: {} },
        objectives: [
            { type: 'formWord', description: 'Form a valid word (3+ letters)', target: 1, params: { minLength: 3 } }
        ]
    },
    {
        id: 'simple_02', name: 'Gathering Words', mode: 'simple', tier: 'simple',
        maxMoves: 5, scoreMult: 0.5, twoStarTarget: 75, threeStarTarget: 100,
        tutorial: { message: 'Longer words score more points. Try to find 4+ letter words!' },
        layout: { shape: 'hex2', cellTypes: {} },
        objectives: [
            { type: 'formWord', description: 'Form 2 words', target: 2, params: { minLength: 3 } }
        ]
    },
    {
        id: 'simple_03', name: 'Stretch', mode: 'simple', tier: 'simple',
        maxMoves: 6, scoreMult: 0.6, twoStarTarget: 100, threeStarTarget: 155,
        tutorial: { message: 'Look for common prefixes and suffixes like RE-, UN-, -ING, or -TION to build longer words.' },
        layout: { shape: 'hex2', cellTypes: {} },
        objectives: [
            { type: 'formWord', description: 'Form a 4+ letter word', target: 1, params: { minLength: 4 } }
        ]
    },
    {
        id: 'simple_04', name: 'Anchor Point', mode: 'simple', tier: 'simple',
        maxMoves: 6, scoreMult: 0.7, twoStarTarget: 110, threeStarTarget: 170,
        tutorial: { message: 'Anchor cells (red rim) must be used in your words!' },
        layout: { shape: 'hex2', cellTypes: {}, anchors: 1 },
        objectives: [
            { type: 'illuminateAnchors', description: 'Must use the Anchor cell (each word)', target: 1, params: {} }
        ]
    },
    {
        id: 'simple_05', name: 'Bigger Board', mode: 'simple', tier: 'simple',
        maxMoves: 7, scoreMult: 0.75, twoStarTarget: 120, threeStarTarget: 185,
        tutorial: { message: 'A larger board means more letters and longer words!' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'formWord', description: 'Form 2 words of 4+ letters', target: 2, params: { minLength: 4 } }
        ]
    },
    {
        id: 'simple_06', name: 'Wordsmith', mode: 'simple', tier: 'simple',
        maxMoves: 8, scoreMult: 0.8, twoStarTarget: 135, threeStarTarget: 200,
        tutorial: { message: 'Scan the whole board before tracing. The best word isn\'t always the most obvious one.' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'formWord', description: 'Form 3 words of 4+ letters', target: 3, params: { minLength: 4 } }
        ]
    },
    {
        id: 'simple_07', name: 'Twin Anchors', mode: 'simple', tier: 'simple',
        maxMoves: 8, scoreMult: 0.85, twoStarTarget: 145, threeStarTarget: 220,
        tutorial: { message: 'With two anchors, every word must pass through at least one. Plan paths that connect them.' },
        layout: { shape: 'hex3', cellTypes: {}, anchors: 2 },
        objectives: [
            { type: 'illuminateAnchors', description: 'Must use both Anchors (use each in a word)', target: 2, params: {} }
        ]
    },
    {
        id: 'simple_08', name: 'Deep Boxters', mode: 'simple', tier: 'simple',
        maxMoves: 8, scoreMult: 0.9, twoStarTarget: 160, threeStarTarget: 240,
        tutorial: { message: '5-letter words score big. Look for paths that zigzag through the center of the board.' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'formWord', description: 'Form 2 words of 5+ letters', target: 2, params: { minLength: 5 } }
        ]
    },
    {
        id: 'simple_09', name: 'Under Pressure', mode: 'simple', tier: 'simple',
        maxMoves: 8, scoreMult: 0.95, twoStarTarget: 175, threeStarTarget: 260,
        tutorial: { message: 'Every word must use the anchor. Start or end your path at the red-rimmed tile.' },
        layout: { shape: 'hex3', cellTypes: {}, anchors: 1 },
        objectives: [
            { type: 'formWord', description: 'Form 3 words of 4+ letters', target: 3, params: { minLength: 4 } },
            { type: 'illuminateAnchors', description: 'Must use the Anchor cell (each word)', target: 1, params: {} }
        ]
    },
    {
        id: 'simple_10', name: 'Sharp Focus', mode: 'simple', tier: 'simple',
        maxMoves: 7, twoStarTarget: 200, threeStarTarget: 300,
        tutorial: { message: 'Don\'t waste moves on guesses. Invalid words still cost a move!' },
        layout: { shape: 'hex3', cellTypes: {}, anchors: 2 },
        objectives: [
            { type: 'formWord', description: 'Form 3 words of 5+ letters', target: 3, params: { minLength: 5 } },
            { type: 'illuminateAnchors', description: 'Must use both Anchors (use each in a word)', target: 2, params: {} }
        ]
    },

    {
        id: 'simple_11', name: 'Proving Ground', mode: 'simple', tier: 'simple',
        maxMoves: 6, twoStarTarget: 190, threeStarTarget: 280,
        tutorial: { message: 'Fewer moves means every word counts. Aim for 5+ letters on each move.' },
        layout: { shape: 'hex3', cellTypes: {}, anchors: 2 },
        objectives: [
            { type: 'formWord', description: 'Form 3 words of 5+ letters', target: 3, params: { minLength: 5 } },
            { type: 'illuminateAnchors', description: 'Must use both Anchors (use each in a word)', target: 2, params: {} }
        ]
    },
    {
        id: 'simple_12', name: 'Final Exam', mode: 'simple', tier: 'simple',
        maxMoves: 7, twoStarTarget: 210, threeStarTarget: 320,
        tutorial: { message: 'Need a 6-letter word? Try extending a shorter word with a prefix or suffix.' },
        layout: { shape: 'hex3', cellTypes: {}, anchors: 2 },
        objectives: [
            { type: 'formWord', description: 'Form 2 words of 5+ letters', target: 2, params: { minLength: 5 } },
            { type: 'formWord', description: 'Form 1 word of 6+ letters', target: 1, params: { minLength: 6 } },
            { type: 'illuminateAnchors', description: 'Must use both Anchors (use each in a word)', target: 2, params: {} }
        ]
    },
    {
        id: 'simple_13', name: 'Endurance', mode: 'simple', tier: 'simple',
        maxMoves: 6, twoStarTarget: 220, threeStarTarget: 340,
        tutorial: { message: 'Four words in six moves — no room for errors. Plan all your paths before you start.' },
        layout: { shape: 'hex3', cellTypes: {}, anchors: 2 },
        objectives: [
            { type: 'formWord', description: 'Form 4 words of 4+ letters', target: 4, params: { minLength: 4 } },
            { type: 'illuminateAnchors', description: 'Must use both Anchors (use each in a word)', target: 2, params: {} }
        ]
    },
    {
        id: 'simple_14', name: 'Masterclass', mode: 'simple', tier: 'simple',
        maxMoves: 6, twoStarTarget: 240, threeStarTarget: 360,
        tutorial: { message: 'The final challenge. Three anchors, four 5-letter words, six moves. You\'ve got this.' },
        layout: { shape: 'hex3', cellTypes: {}, anchors: 3 },
        objectives: [
            { type: 'formWord', description: 'Form 4 words of 5+ letters', target: 4, params: { minLength: 5 } },
            { type: 'illuminateAnchors', description: 'Must use all 3 Anchors (use each in a word)', target: 3, params: {} }
        ]
    },

    // ── CLEAR MODE ──
    {
        id: 'clear_01', name: 'Clean Sweep', mode: 'clear', tier: 'clear',
        maxMoves: 4, scoreMult: 0.4, twoStarTarget: 80, threeStarTarget: 110,
        tutorial: { message: 'Clear mode! Letters you use get REMOVED. Clear all cells to win!' },
        layout: { shape: 'hex1', cellTypes: {} },
        objectives: [
            { type: 'clearAllCells', description: 'Clear all 7 cells', target: 1, params: {} }
        ]
    },
    {
        id: 'clear_02', name: 'Tidy Up', mode: 'clear', tier: 'clear',
        maxMoves: 5, scoreMult: 0.5, twoStarTarget: 90, threeStarTarget: 125,
        layout: { shape: 'hex1', cellTypes: {} },
        objectives: [
            { type: 'clearAllCells', description: 'Clear all 7 cells', target: 1, params: {} },
            { type: 'formWord', description: 'Use a 4+ letter word', target: 1, params: { minLength: 4 }, isPrimary: false }
        ]
    },
    {
        id: 'clear_03', name: 'Growing Pains', mode: 'clear', tier: 'clear',
        maxMoves: 10, scoreMult: 0.6, twoStarTarget: 150, threeStarTarget: 240,
        tutorial: { message: 'Bigger board now — plan your paths to cover every cell!' },
        layout: { shape: 'hex2', cellTypes: {} },
        objectives: [
            { type: 'clearAllCells', description: 'Clear all 19 cells', target: 1, params: {} }
        ]
    },
    {
        id: 'clear_04', name: 'Shattered Ring', mode: 'clear', tier: 'clear',
        maxMoves: 12, scoreMult: 0.7, twoStarTarget: 170, threeStarTarget: 270,
        tutorial: { message: 'Tip: If only 1 or 2 tiles remain in a cluster with no valid word, they get auto-cleared for you!' },
        layout: { shape: 'hex2', cellTypes: {} },
        objectives: [
            { type: 'clearAllCells', description: 'Clear all 19 cells', target: 1, params: {} }
        ]
    },
    {
        id: 'clear_05', name: 'Wrecking Ball', mode: 'clear', tier: 'clear',
        maxMoves: 10, scoreMult: 0.75, twoStarTarget: 190, threeStarTarget: 300,
        tutorial: { message: 'Tip: If only 1 or 2 tiles remain in a cluster with no valid word, they get auto-cleared for you!' },
        layout: { shape: 'hex2', cellTypes: {} },
        objectives: [
            { type: 'clearAllCells', description: 'Clear all 19 cells', target: 1, params: {} },
            { type: 'formWord', description: 'Use a 4+ letter word', target: 1, params: { minLength: 4 }, isPrimary: false }
        ]
    },
    {
        id: 'clear_06', name: 'Precision Strike', mode: 'clear', tier: 'clear',
        maxMoves: 10, scoreMult: 0.8, twoStarTarget: 210, threeStarTarget: 330,
        tutorial: { message: 'Tip: If only 1 or 2 tiles remain in a cluster with no valid word, they get auto-cleared for you!' },
        layout: { shape: 'hex2', cellTypes: {} },
        objectives: [
            { type: 'clearAllCells', description: 'Clear all 19 cells', target: 1, params: {} },
            { type: 'formWord', description: 'Use a 4+ letter word', target: 1, params: { minLength: 4 }, isPrimary: false }
        ]
    },
    {
        id: 'clear_07', name: 'Demolition', mode: 'clear', tier: 'clear',
        maxMoves: 12, scoreMult: 0.85, twoStarTarget: 240, threeStarTarget: 370,
        tutorial: { message: 'Bigger board! Use long words to clear more tiles per move. Small leftover clusters get auto-cleared.' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'clearAllCells', description: 'Clear all 37 cells', target: 1, params: {} }
        ]
    },
    {
        id: 'clear_08', name: 'Precision', mode: 'clear', tier: 'clear',
        maxMoves: 10, scoreMult: 0.9, twoStarTarget: 265, threeStarTarget: 400,
        tutorial: { message: 'Fewer moves now. Plan your paths to avoid leaving isolated tiles in the middle of the board.' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'clearAllCells', description: 'Clear all 37 cells', target: 1, params: {} }
        ]
    },
    {
        id: 'clear_09', name: 'Scorched Earth', mode: 'clear', tier: 'clear',
        maxMoves: 10, scoreMult: 0.95, twoStarTarget: 290, threeStarTarget: 440,
        tutorial: { message: 'Try clearing from the edges inward. A 5+ letter word earns bonus points and clears a big chunk!' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'clearAllCells', description: 'Clear all 37 cells', target: 1, params: {} },
            { type: 'formWord', description: 'Use a 5+ letter word', target: 1, params: { minLength: 5 }, isPrimary: false }
        ]
    },
    {
        id: 'clear_10', name: 'Total Erasure', mode: 'clear', tier: 'clear',
        maxMoves: 10, twoStarTarget: 320, threeStarTarget: 480,
        tutorial: { message: 'Only 10 moves for 37 tiles. Aim for long words that snake across the board to maximize coverage.' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'clearAllCells', description: 'Clear all 37 cells', target: 1, params: {} },
            { type: 'formWord', description: 'Form 2 words of 5+ letters', target: 2, params: { minLength: 5 }, isPrimary: false }
        ]
    },

    {
        id: 'clear_11', name: 'Methodical', mode: 'clear', tier: 'clear',
        maxMoves: 10, twoStarTarget: 340, threeStarTarget: 500,
        tutorial: { message: 'Work section by section. Clear one area completely before moving to the next to avoid scattered leftovers.' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'clearAllCells', description: 'Clear all 37 cells', target: 1, params: {} },
            { type: 'formWord', description: 'Form 3 words with 5+ letters', target: 3, params: { minLength: 5 } }
        ]
    },
    {
        id: 'clear_12', name: 'Obliterate', mode: 'clear', tier: 'clear',
        maxMoves: 8, twoStarTarget: 360, threeStarTarget: 540,
        tutorial: { message: 'Every move counts. Look for 5+ letter words before settling for shorter ones.' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'clearAllCells', description: 'Clear all 37 cells', target: 1, params: {} },
            { type: 'formWord', description: 'Form 3 words of 5+ letters', target: 3, params: { minLength: 5 } }
        ]
    },
    {
        id: 'clear_13', name: 'Surgical', mode: 'clear', tier: 'clear',
        maxMoves: 9, twoStarTarget: 380, threeStarTarget: 570,
        tutorial: { message: 'With just 9 moves, you need an average of 4+ tiles per word. Think big!' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'clearAllCells', description: 'Clear all 37 cells', target: 1, params: {} },
            { type: 'formWord', description: 'Form 3 words of 4+ letters', target: 3, params: { minLength: 4 }, isPrimary: false }
        ]
    },
    {
        id: 'clear_14', name: 'Annihilation', mode: 'clear', tier: 'clear',
        maxMoves: 8, twoStarTarget: 400, threeStarTarget: 600,
        tutorial: { message: '8 moves, 37 tiles. You need 5+ letter words almost every turn. Scan the whole board before each move!' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'clearAllCells', description: 'Clear all 37 cells', target: 1, params: {} },
            { type: 'formWord', description: 'Form 3 words of 5+ letters', target: 3, params: { minLength: 5 }, isPrimary: false }
        ]
    },

    // ── CHAIN MODE ──
    {
        id: 'chain_01', name: 'First Link', mode: 'chain', tier: 'chain',
        maxMoves: 5, scoreMult: 0.4, twoStarTarget: 100, threeStarTarget: 140,
        tutorial: { message: 'Welcome to Chain mode! Trace a word, then those tiles get fresh letters. Form 3 words to complete this level.' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'formWord', description: 'Form 3 words (3+ letters each)', target: 3, params: { minLength: 3 } }
        ]
    },
    {
        id: 'chain_02', name: 'Overlap', mode: 'chain', tier: 'chain',
        maxMoves: 6, scoreMult: 0.5, twoStarTarget: 120, threeStarTarget: 170,
        tutorial: { message: 'After each word, the tiles you used get new letters and pulse blue. Try using one of those blue tiles in your next word to start a combo!' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'formWord', description: 'Form 4 words (3+ letters each) — try using a blue tile in your next word for bonus points', target: 4, params: { minLength: 3 } }
        ]
    },
    {
        id: 'chain_03', name: 'Linked Up', mode: 'chain', tier: 'chain',
        maxMoves: 10, scoreMult: 0.6, twoStarTarget: 260, threeStarTarget: 420,
        tutorial: { message: 'After each word, those tiles get new letters and pulse blue. Use one of those blue tiles in your next word to build a combo!' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'achieveCombo', description: 'Build a 2x combo — use one of the blue pulsing tiles in your next word', target: 2, params: {} }
        ]
    },
    {
        id: 'chain_04', name: 'Double Down', mode: 'chain', tier: 'chain',
        maxMoves: 10, scoreMult: 0.7, twoStarTarget: 300, threeStarTarget: 480,
        tutorial: { message: 'Keep the chain going! Overlap 3 words in a row through the same tile positions to reach 3x. Look for the blue pulsing tiles.' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'achieveCombo', description: 'Build a 3x combo — overlap 3 consecutive words through shared tile positions', target: 3, params: {} }
        ]
    },
    {
        id: 'chain_05', name: 'Cascade', mode: 'chain', tier: 'chain',
        maxMoves: 10, scoreMult: 0.75, twoStarTarget: 340, threeStarTarget: 540,
        tutorial: { message: 'Tip: You can play a word anywhere if the blue tiles don\'t form a useful word — you\'ll lose the combo but can start a new chain.' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'formWord', description: 'Form 5 words (3+ letters each)', target: 5, params: { minLength: 3 } },
            { type: 'achieveCombo', description: 'Build a 2x combo — overlap consecutive words', target: 2, params: {}, isPrimary: false }
        ]
    },
    {
        id: 'chain_06', name: 'Long Links', mode: 'chain', tier: 'chain',
        maxMoves: 9, scoreMult: 0.8, twoStarTarget: 380, threeStarTarget: 600,
        tutorial: { message: 'Tip: Longer words refresh more tiles at once, giving you better letters to chain with next.' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'achieveCombo', description: 'Build a 3x combo — chain 3 words through shared tiles', target: 3, params: {} },
            { type: 'formWord', description: 'Form 2 words with 4+ letters', target: 2, params: { minLength: 4 } }
        ]
    },
    {
        id: 'chain_07', name: 'Relentless', mode: 'chain', tier: 'chain',
        maxMoves: 9, scoreMult: 0.85, twoStarTarget: 420, threeStarTarget: 660,
        tutorial: { message: 'Anchor tile ahead! At least one of your words must pass through the red-rimmed tile.' },
        layout: { shape: 'hex3', cellTypes: {}, anchors: 1 },
        objectives: [
            { type: 'formWord', description: 'Form 6 words (3+ letters each)', target: 6, params: { minLength: 3 } },
            { type: 'illuminateAnchors', description: 'Use the red Anchor tile in a word', target: 1, params: {} }
        ]
    },
    {
        id: 'chain_08', name: 'Momentum', mode: 'chain', tier: 'chain',
        maxMoves: 8, scoreMult: 0.9, twoStarTarget: 460, threeStarTarget: 720,
        tutorial: { message: 'Tip: To hit max combo (4x), chain 4 words in a row through shared tile positions. Each consecutive overlap increases the multiplier.' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'achieveCombo', description: 'Hit max combo — chain 4 words through shared tiles', target: 4, params: {} },
            { type: 'formWord', description: 'Form 2 words with 4+ letters', target: 2, params: { minLength: 4 }, isPrimary: false }
        ]
    },
    {
        id: 'chain_09', name: 'Overdrive', mode: 'chain', tier: 'chain',
        maxMoves: 7, scoreMult: 0.95, twoStarTarget: 500, threeStarTarget: 780,
        tutorial: { message: 'Tip: With an Anchor and a combo target, try to include the Anchor in your chain path so every word satisfies both goals.' },
        layout: { shape: 'hex3', cellTypes: {}, anchors: 1 },
        objectives: [
            { type: 'formWord', description: 'Form 7 words (3+ letters each)', target: 7, params: { minLength: 3 } },
            { type: 'achieveCombo', description: 'Build a 3x combo — chain 3 words through shared tiles', target: 3, params: {} },
            { type: 'illuminateAnchors', description: 'Use the red Anchor tile in a word', target: 1, params: {} }
        ]
    },
    {
        id: 'chain_10', name: 'Perpetual Motion', mode: 'chain', tier: 'chain',
        maxMoves: 7, twoStarTarget: 540, threeStarTarget: 840,
        tutorial: { message: 'Tip: Start your chain near the Anchor so the blue tiles stay close to it. This makes it easier to thread every word through both.' },
        layout: { shape: 'hex3', cellTypes: {}, anchors: 1 },
        objectives: [
            { type: 'achieveCombo', description: 'Hit max combo — chain 4 words through shared tiles', target: 4, params: {} },
            { type: 'formWord', description: 'Form 3 words with 4+ letters', target: 3, params: { minLength: 4 } },
            { type: 'illuminateAnchors', description: 'Use the red Anchor tile in a word', target: 1, params: {} }
        ]
    },

    {
        id: 'chain_11', name: 'Runaway', mode: 'chain', tier: 'chain',
        maxMoves: 8, twoStarTarget: 560, threeStarTarget: 860,
        tutorial: { message: 'Tip: If you break a chain, don\'t panic. Use the next move to set up a new chain in a different area of the board.' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'formWord', description: 'Form 6 words (3+ letters each)', target: 6, params: { minLength: 3 } },
            { type: 'achieveCombo', description: 'Build a 3x combo — chain 3 words through shared tiles', target: 3, params: {} }
        ]
    },
    {
        id: 'chain_12', name: 'Chain Reaction', mode: 'chain', tier: 'chain',
        maxMoves: 7, twoStarTarget: 580, threeStarTarget: 900,
        tutorial: { message: 'Tip: With only 7 moves, every word counts. Prioritize keeping your chain alive over finding longer words.' },
        layout: { shape: 'hex3', cellTypes: {}, anchors: 1 },
        objectives: [
            { type: 'achieveCombo', description: 'Hit max combo — chain 4 words through shared tiles', target: 4, params: {} },
            { type: 'formWord', description: 'Form 3 words with 4+ letters', target: 3, params: { minLength: 4 } },
            { type: 'illuminateAnchors', description: 'Use the red Anchor tile in a word', target: 1, params: {} }
        ]
    },
    {
        id: 'chain_13', name: 'Unstoppable', mode: 'chain', tier: 'chain',
        maxMoves: 7, twoStarTarget: 600, threeStarTarget: 940,
        tutorial: { message: 'Two Anchors! Your words must pass through both. Try to chain through the area between them.' },
        layout: { shape: 'hex3', cellTypes: {}, anchors: 2 },
        objectives: [
            { type: 'formWord', description: 'Form 7 words (3+ letters each)', target: 7, params: { minLength: 3 } },
            { type: 'achieveCombo', description: 'Hit max combo — chain 4 words through shared tiles', target: 4, params: {} },
            { type: 'illuminateAnchors', description: 'Use both red Anchor tiles in your words', target: 2, params: {} }
        ]
    },
    {
        id: 'chain_14', name: 'Infinite Loop', mode: 'chain', tier: 'chain',
        maxMoves: 6, twoStarTarget: 620, threeStarTarget: 980,
        tutorial: { message: 'The ultimate chain challenge. 6 moves, 2 Anchors, max combo, all 4+ letter words. Scan the whole board before each move!' },
        layout: { shape: 'hex3', cellTypes: {}, anchors: 2 },
        objectives: [
            { type: 'formWord', description: 'Form 6 words with 4+ letters', target: 6, params: { minLength: 4 } },
            { type: 'achieveCombo', description: 'Hit max combo — chain 4 words through shared tiles', target: 4, params: {} },
            { type: 'illuminateAnchors', description: 'Use both red Anchor tiles in your words', target: 2, params: {} }
        ]
    },

    // ── ILLUMINATE MODE ──
    {
        id: 'illuminate_01', name: 'Dawn', mode: 'illuminate', tier: 'illuminate',
        maxMoves: 12, twoStarTarget: 200, threeStarTarget: 320,
        tutorial: { message: 'Illuminate mode! Cells you use glow permanently. Light up EVERY cell to win! You can re-use already lit tiles in new words.' },
        layout: { shape: 'hex2', cellTypes: {} },
        objectives: [
            { type: 'useAllCells', description: 'Illuminate all cells', target: 1, params: {} }
        ]
    },
    {
        id: 'illuminate_02', name: 'Kindling', mode: 'illuminate', tier: 'illuminate',
        maxMoves: 10, twoStarTarget: 220, threeStarTarget: 350,
        tutorial: { message: 'Tip: Longer words light up more tiles per move. You can re-use lit tiles to reach unlit ones!' },
        layout: { shape: 'hex2', cellTypes: {} },
        objectives: [
            { type: 'useAllCells', description: 'Illuminate all cells', target: 1, params: {} },
            { type: 'formWord', description: 'Use a 4+ letter word', target: 1, params: { minLength: 4 }, isPrimary: false }
        ]
    },
    {
        id: 'illuminate_03', name: 'Spreading Light', mode: 'illuminate', tier: 'illuminate',
        maxMoves: 12, twoStarTarget: 250, threeStarTarget: 400,
        tutorial: { message: 'Bigger board! You only need 70% coverage — focus on dense clusters rather than chasing every edge tile.' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'illuminatePercent', description: 'Illuminate 70% of cells', target: 70, params: {} }
        ]
    },
    {
        id: 'illuminate_04', name: 'Brightening', mode: 'illuminate', tier: 'illuminate',
        maxMoves: 11, scoreMult: 0.7, twoStarTarget: 200, threeStarTarget: 310,
        tutorial: { message: 'Tip: 85% coverage needed. Prioritize unlit tiles at the edges — they\'re harder to reach later.' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'illuminatePercent', description: 'Illuminate 85% of cells', target: 85, params: {} }
        ]
    },
    {
        id: 'illuminate_05', name: 'Full Radiance', mode: 'illuminate', tier: 'illuminate',
        maxMoves: 15, scoreMult: 0.75, twoStarTarget: 260, threeStarTarget: 400,
        tutorial: { message: 'Full coverage required! Plan words that snake through unlit areas. Re-use lit tiles as stepping stones to reach dark corners.' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'useAllCells', description: 'Illuminate all cells', target: 1, params: {} }
        ]
    },
    {
        id: 'illuminate_06', name: 'Guided Light', mode: 'illuminate', tier: 'illuminate',
        maxMoves: 15, scoreMult: 0.8, twoStarTarget: 320, threeStarTarget: 500,
        tutorial: { message: 'Tip: A 5+ letter word covers more tiles per move. Look for long paths through dark areas.' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'useAllCells', description: 'Illuminate all cells', target: 1, params: {} },
            { type: 'formWord', description: 'Use a 5+ letter word', target: 1, params: { minLength: 5 }, isPrimary: false }
        ]
    },
    {
        id: 'illuminate_07', name: 'Beacon', mode: 'illuminate', tier: 'illuminate',
        maxMoves: 14, scoreMult: 0.85, twoStarTarget: 380, threeStarTarget: 590,
        tutorial: { message: 'Tip: A 6+ letter word is a big coverage boost. Trace through unlit edges to light them up.' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'useAllCells', description: 'Illuminate all cells', target: 1, params: {} },
            { type: 'formWord', description: 'Use a 6+ letter word', target: 1, params: { minLength: 6 }, isPrimary: false }
        ]
    },
    {
        id: 'illuminate_08', name: 'Burning Bright', mode: 'illuminate', tier: 'illuminate',
        maxMoves: 14, scoreMult: 0.9, twoStarTarget: 440, threeStarTarget: 680,
        tutorial: { message: 'Tip: Start from the edges and work inward. Edge tiles are harder to reach later.' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'useAllCells', description: 'Illuminate all cells', target: 1, params: {} },
            { type: 'formWord', description: 'Form 2 words of 5+ letters', target: 2, params: { minLength: 5 }, isPrimary: false }
        ]
    },
    {
        id: 'illuminate_09', name: 'Solar Flare', mode: 'illuminate', tier: 'illuminate',
        maxMoves: 13, scoreMult: 0.95, twoStarTarget: 500, threeStarTarget: 780,
        tutorial: { message: 'Tip: Mix long words for coverage with shorter words to mop up isolated tiles.' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'useAllCells', description: 'Illuminate all cells', target: 1, params: {} },
            { type: 'formWord', description: 'Form 2 words of 6+ letters', target: 2, params: { minLength: 6 } }
        ]
    },
    {
        id: 'illuminate_10', name: 'Supernova', mode: 'illuminate', tier: 'illuminate',
        maxMoves: 13, twoStarTarget: 560, threeStarTarget: 860,
        tutorial: { message: 'Moves are getting tight. Aim for long words that zigzag through dark areas. Every tile covered counts.' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'useAllCells', description: 'Illuminate all cells', target: 1, params: {} },
            { type: 'formWord', description: 'Form 3 words of 5+ letters', target: 3, params: { minLength: 5 } }
        ]
    },
    {
        id: 'illuminate_11', name: 'Afterglow', mode: 'illuminate', tier: 'illuminate',
        maxMoves: 12, twoStarTarget: 600, threeStarTarget: 920,
        tutorial: { message: 'Tip: Look for words that bridge lit and unlit areas to maximize coverage per move.' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'useAllCells', description: 'Illuminate all cells', target: 1, params: {} },
            { type: 'formWord', description: 'Form 3 words of 6+ letters', target: 3, params: { minLength: 6 } }
        ]
    },
    {
        id: 'illuminate_12', name: 'Blinding', mode: 'illuminate', tier: 'illuminate',
        maxMoves: 12, twoStarTarget: 640, threeStarTarget: 980,
        tutorial: { message: 'You need long words almost every turn. Scan the whole board before each move.' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'useAllCells', description: 'Illuminate all cells', target: 1, params: {} },
            { type: 'formWord', description: 'Form 4 words of 5+ letters', target: 4, params: { minLength: 5 } }
        ]
    },
    {
        id: 'illuminate_13', name: 'White Dwarf', mode: 'illuminate', tier: 'illuminate',
        maxMoves: 11, twoStarTarget: 680, threeStarTarget: 1040,
        tutorial: { message: 'Tip: Almost every move must be a long word. Don\'t waste moves on short words.' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'useAllCells', description: 'Illuminate all cells', target: 1, params: {} },
            { type: 'formWord', description: 'Form 4 words of 6+ letters', target: 4, params: { minLength: 6 } }
        ]
    },
    {
        id: 'illuminate_14', name: 'Eternal Light', mode: 'illuminate', tier: 'illuminate',
        maxMoves: 11, twoStarTarget: 720, threeStarTarget: 1100,
        tutorial: { message: 'The ultimate illuminate challenge. Every move counts — plan your path carefully before you trace!' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'useAllCells', description: 'Illuminate all cells', target: 1, params: {} },
            { type: 'formWord', description: 'Form 5 words of 5+ letters', target: 5, params: { minLength: 5 } }
        ]
    },

    // ── Apex Mode (levels 57-70) ──────────────────────────────
    {
        id: 'apex_01', name: 'First Contact', mode: 'apex', tier: 'apex',
        maxMoves: 9, scoreMult: 0.5, twoStarTarget: 200, threeStarTarget: 320,
        tutorial: { message: 'Apex mode: each word triggers a RANDOM effect — clear, chain, or illuminate. Words must pass through an anchor until the anchor objective is met, then you\'re free!' },
        layout: { shape: 'hex2', cellTypes: {}, anchors: 1 },
        objectives: [
            { type: 'formWord', description: 'Form 2 words', target: 2, params: { minLength: 3 } },
            { type: 'illuminateAnchors', description: 'Use the Anchor cell', target: 1, params: {} }
        ]
    },
    {
        id: 'apex_02', name: 'Shifting Ground', mode: 'apex', tier: 'apex',
        maxMoves: 8, scoreMult: 0.55, twoStarTarget: 240, threeStarTarget: 380,
        tutorial: { message: 'Tip: Watch the effect indicator after each word. Plan your next move based on what happened.' },
        layout: { shape: 'hex2', cellTypes: {} },
        objectives: [
            { type: 'formWord', description: 'Form 2 words of 4+ letters', target: 2, params: { minLength: 4 } },
            { type: 'illuminatePercent', description: 'Illuminate 50% of cells', target: 50, params: {} }
        ]
    },
    {
        id: 'apex_03', name: 'Wild Cards', mode: 'apex', tier: 'apex',
        maxMoves: 8, scoreMult: 0.6, twoStarTarget: 280, threeStarTarget: 440,
        tutorial: { message: 'Two anchors — every word must pass through one until the anchor objective is complete. After that, you\'re free to trace anywhere!' },
        layout: { shape: 'hex2', cellTypes: {}, anchors: 2 },
        objectives: [
            { type: 'formWord', description: 'Form 3 words', target: 3, params: { minLength: 3 } },
            { type: 'illuminateAnchors', description: 'Use both Anchors', target: 2, params: {} }
        ]
    },
    {
        id: 'apex_04', name: 'Fractured', mode: 'apex', tier: 'apex',
        maxMoves: 11, scoreMult: 0.65, twoStarTarget: 340, threeStarTarget: 520,
        tutorial: { message: 'Bigger board now. If tiles get cleared, you lose them. If they chain, new letters appear. Stay flexible.' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'formWord', description: 'Form 3 words of 4+ letters', target: 3, params: { minLength: 4 } },
            { type: 'illuminatePercent', description: 'Illuminate 50% of cells', target: 50, params: {} }
        ]
    },
    {
        id: 'apex_05', name: 'Entropy', mode: 'apex', tier: 'apex',
        maxMoves: 11, scoreMult: 0.7, twoStarTarget: 380, threeStarTarget: 580,
        tutorial: { message: 'Tip: Words must pass through an anchor until the objective is satisfied. Once all anchors are lit, remaining words can go anywhere!' },
        layout: { shape: 'hex3', cellTypes: {}, anchors: 2 },
        objectives: [
            { type: 'formWord', description: 'Form 3 words of 4+ letters', target: 3, params: { minLength: 4 } },
            { type: 'illuminateAnchors', description: 'Use both Anchors', target: 2, params: {} }
        ]
    },
    {
        id: 'apex_06', name: 'Volatile', mode: 'apex', tier: 'apex',
        maxMoves: 10, scoreMult: 0.75, twoStarTarget: 420, threeStarTarget: 640,
        tutorial: { message: 'You need 60% illumination. Chain effects help by giving new letters, but clear effects remove tiles entirely.' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'formWord', description: 'Form 3 words of 5+ letters', target: 3, params: { minLength: 5 } },
            { type: 'illuminatePercent', description: 'Illuminate 60% of cells', target: 60, params: {} }
        ]
    },
    {
        id: 'apex_07', name: 'Fusion Core', mode: 'apex', tier: 'apex',
        maxMoves: 10, scoreMult: 0.8, twoStarTarget: 460, threeStarTarget: 700,
        tutorial: { message: 'Three anchors to hit. Words must pass through one until all anchors are illuminated — then you\'re free to trace anywhere!' },
        layout: { shape: 'hex3', cellTypes: {}, anchors: 3 },
        objectives: [
            { type: 'formWord', description: 'Form 4 words of 4+ letters', target: 4, params: { minLength: 4 } },
            { type: 'illuminateAnchors', description: 'Use all 3 Anchors', target: 3, params: {} }
        ]
    },
    {
        id: 'apex_08', name: 'Singularity', mode: 'apex', tier: 'apex',
        maxMoves: 10, scoreMult: 0.85, twoStarTarget: 500, threeStarTarget: 760,
        tutorial: { message: 'Combos trigger when chain effects overlap your previous word path. Chase them when you can!' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'formWord', description: 'Form 3 words of 5+ letters', target: 3, params: { minLength: 5 } },
            { type: 'achieveCombo', description: 'Achieve a x2 combo', target: 2, params: {} },
            { type: 'illuminatePercent', description: 'Illuminate 60% of cells', target: 60, params: {} }
        ]
    },
    {
        id: 'apex_09', name: 'Quantum Flux', mode: 'apex', tier: 'apex',
        maxMoves: 9, scoreMult: 0.9, twoStarTarget: 540, threeStarTarget: 820,
        tutorial: { message: 'Fewer moves, more anchors. Words must touch an anchor until the objective is met, then you\'re free. Plan two moves ahead.' },
        layout: { shape: 'hex3', cellTypes: {}, anchors: 3 },
        objectives: [
            { type: 'formWord', description: 'Form 4 words of 5+ letters', target: 4, params: { minLength: 5 } },
            { type: 'illuminateAnchors', description: 'Use all 3 Anchors', target: 3, params: {} }
        ]
    },
    {
        id: 'apex_10', name: 'Cataclysm', mode: 'apex', tier: 'apex',
        maxMoves: 10, scoreMult: 0.92, twoStarTarget: 580, threeStarTarget: 880,
        apexWeights: { clear: 0.25, chain: 0.45, illuminate: 0.30 },
        tutorial: { message: 'Combos + illumination together. Chain effects on overlapping paths give combos AND might illuminate cells.' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'formWord', description: 'Form 3 words of 5+ letters', target: 3, params: { minLength: 5 } },
            { type: 'achieveCombo', description: 'Achieve a x2 combo', target: 2, params: {} },
            { type: 'illuminatePercent', description: 'Illuminate 70% of cells', target: 70, params: {} }
        ]
    },
    {
        id: 'apex_11', name: 'Maelstrom', mode: 'apex', tier: 'apex',
        maxMoves: 9, scoreMult: 0.95, twoStarTarget: 620, threeStarTarget: 940,
        apexWeights: { clear: 0.20, chain: 0.40, illuminate: 0.40 },
        tutorial: { message: 'Three anchors, combos required, and tight moves. Once all anchors are illuminated, remaining words are free. This is where Apex gets real.' },
        layout: { shape: 'hex3', cellTypes: {}, anchors: 3 },
        objectives: [
            { type: 'formWord', description: 'Form 4 words of 5+ letters', target: 4, params: { minLength: 5 } },
            { type: 'illuminateAnchors', description: 'Use all 3 Anchors', target: 3, params: {} },
            { type: 'achieveCombo', description: 'Achieve a x2 combo', target: 2, params: {} }
        ]
    },
    {
        id: 'apex_12', name: 'Pandemonium', mode: 'apex', tier: 'apex',
        maxMoves: 8, scoreMult: 0.97, twoStarTarget: 660, threeStarTarget: 1000,
        tutorial: { message: 'Only 7 moves to illuminate 75%. Every word must be long and precise.' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'formWord', description: 'Form 4 words of 5+ letters', target: 4, params: { minLength: 5 } },
            { type: 'illuminatePercent', description: 'Illuminate 75% of cells', target: 75, params: {} }
        ]
    },
    {
        id: 'apex_13', name: 'Oblivion', mode: 'apex', tier: 'apex',
        maxMoves: 10, scoreMult: 0.98, twoStarTarget: 700, threeStarTarget: 1060,
        apexWeights: { clear: 0.10, chain: 0.65, illuminate: 0.25 },
        tutorial: { message: 'Four anchors, x3 combo, 5+ letter words. Once all anchors are lit, you\'re free. The penultimate Apex challenge.' },
        layout: { shape: 'hex3', cellTypes: {}, anchors: 4 },
        objectives: [
            { type: 'formWord', description: 'Form 5 words of 5+ letters', target: 5, params: { minLength: 5 } },
            { type: 'illuminateAnchors', description: 'Use all 4 Anchors', target: 4, params: {} },
            { type: 'achieveCombo', description: 'Achieve a x3 combo', target: 3, params: {} }
        ]
    },
    {
        id: 'apex_14', name: 'Transcendence', mode: 'apex', tier: 'apex',
        maxMoves: 9, scoreMult: 1.0, twoStarTarget: 740, threeStarTarget: 1120,
        apexWeights: { clear: 0.05, chain: 0.65, illuminate: 0.30 },
        tutorial: { message: 'The ultimate challenge. 75% illumination, 6+ letter words, x3 combos. You are the Apex.' },
        layout: { shape: 'hex3', cellTypes: {} },
        objectives: [
            { type: 'formWord', description: 'Form 4 words of 6+ letters', target: 4, params: { minLength: 6 } },
            { type: 'illuminatePercent', description: 'Illuminate 75% of cells', target: 75, params: {} },
            { type: 'achieveCombo', description: 'Achieve a x3 combo', target: 3, params: {} }
        ]
    }
];

// Session seed
const SESSION_SEED = Date.now() ^ (Math.random() * 0xFFFFFFFF >>> 0);
let boardAttempt = 0;

// Hex distance from origin in axial coordinates
function hexDist(q, r) {
    return (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
}

// Pick N random positions as anchors, restricted to inner cells (not on the perimeter)
function pickRandomAnchors(positions, count, rng) {
    if (count <= 0) return {};
    const radius = Math.max(...positions.map(p => hexDist(p.q, p.r)));
    // Only filter perimeter for boards large enough (radius >= 2)
    const inner = radius >= 2
        ? positions.filter(p => hexDist(p.q, p.r) < radius)
        : positions;
    const keys = shuffle(inner.map(p => hexKey(p.q, p.r)), rng);
    const cellTypes = {};
    for (let i = 0; i < Math.min(count, keys.length); i++) {
        cellTypes[keys[i]] = 'anchor';
    }
    return cellTypes;
}

// ── Word-first board generation (Simple mode) ──────────────────

// Pick candidate words — prefer common everyday words, rarely use obscure ones
const COMMON_SET = new Set(BOARD_WORDS);
function pickCandidateWords(minLength, maxLength, count, rng) {
    const common = BOARD_WORDS.filter(w => w.length >= minLength && w.length <= maxLength);
    const shuffled = shuffle(common, rng);

    // ~5% chance to swap one candidate for an uncommon word (for variety)
    if (shuffled.length >= count && rng() < 0.05) {
        const all = WORD_LIST.filter(w => w.length >= minLength && w.length <= maxLength && !COMMON_SET.has(w));
        if (all.length > 0) {
            const idx = Math.floor(rng() * all.length);
            shuffled[shuffled.length - 1] = all[idx];
        }
    }

    const result = shuffled.slice(0, count);

    // If not enough common words, fill from full dictionary
    if (result.length < count) {
        const used = new Set(result);
        const extra = WORD_LIST.filter(w => w.length >= minLength && w.length <= maxLength && !used.has(w));
        result.push(...shuffle(extra, rng).slice(0, count - result.length));
    }

    return result;
}

// Try to place a single word on the grid as an adjacent hex path
// Returns the path (array of {q,r}) if successful, null if failed
function placeWordOnGrid(positionSet, letterMap, word, anchorKeys, rng) {
    const upperWord = word.toUpperCase();
    const posArray = Array.from(positionSet);

    // Build start candidates: cells matching first letter or empty cells
    let starts = [];

    // If anchors need covering, strongly prefer anchor starts when first letter can go there
    if (anchorKeys.length > 0) {
        const uncoveredAnchors = anchorKeys.filter(k => !letterMap.has(k) || letterMap.get(k) === upperWord[0]);
        for (const k of uncoveredAnchors) {
            starts.push(k);
        }
    }

    // Add cells that already have the matching first letter (sharing)
    for (const pos of posArray) {
        const k = hexKey(pos.q, pos.r);
        if (letterMap.has(k) && letterMap.get(k) === upperWord[0]) {
            if (!starts.includes(k)) starts.push(k);
        }
    }

    // Add empty cells
    const emptyStarts = posArray
        .map(p => hexKey(p.q, p.r))
        .filter(k => !letterMap.has(k));
    starts.push(...shuffle(emptyStarts, rng));

    // Limit attempts
    const maxStarts = Math.min(starts.length, 15);

    for (let si = 0; si < maxStarts; si++) {
        const startKey = starts[si];
        const [sq, sr] = startKey.split(',').map(Number);
        const path = [{ q: sq, r: sr }];
        const usedInPath = new Set([startKey]);
        let success = true;

        for (let i = 1; i < upperWord.length; i++) {
            const last = path[path.length - 1];
            const neighbors = getNeighbors(last.q, last.r);

            // Filter to valid next cells
            let candidates = [];
            for (const n of neighbors) {
                const nk = hexKey(n.q, n.r);
                if (!positionSet.has(nk)) continue; // not on grid
                if (usedInPath.has(nk)) continue; // already in this word's path

                const hasLetter = letterMap.has(nk);
                if (hasLetter && letterMap.get(nk) === upperWord[i]) {
                    candidates.push({ q: n.q, r: n.r, key: nk, sharing: true });
                } else if (!hasLetter) {
                    candidates.push({ q: n.q, r: n.r, key: nk, sharing: false });
                }
                // Skip cells with a different letter
            }

            if (candidates.length === 0) {
                success = false;
                break;
            }

            // Prefer empty cells to avoid over-sharing, but allow sharing
            candidates.sort((a, b) => (a.sharing ? 1 : 0) - (b.sharing ? 1 : 0));
            // Add slight randomness among same-priority candidates
            const emptyCount = candidates.filter(c => !c.sharing).length;
            let pick;
            if (emptyCount > 0) {
                pick = candidates[Math.floor(rng() * emptyCount)];
            } else {
                pick = candidates[Math.floor(rng() * candidates.length)];
            }

            path.push({ q: pick.q, r: pick.r });
            usedInPath.add(pick.key);
        }

        if (success && path.length === upperWord.length) {
            // Assign letters to cells
            for (let i = 0; i < path.length; i++) {
                letterMap.set(hexKey(path[i].q, path[i].r), upperWord[i]);
            }
            return path;
        }
    }

    return null; // placement failed
}

// Place a word so that it passes through a specific cell (at any letter position)
// Used to guarantee anchors are covered by at least one valid word
function placeWordThroughCell(positionSet, letterMap, word, targetKey, rng) {
    const upperWord = word.toUpperCase();
    const [tq, tr] = targetKey.split(',').map(Number);

    // Try each position in the word for the target cell
    const indices = shuffle(Array.from({ length: upperWord.length }, (_, i) => i), rng);
    for (const idx of indices) {
        // Check if target cell is compatible (empty or has matching letter)
        if (letterMap.has(targetKey) && letterMap.get(targetKey) !== upperWord[idx]) continue;

        // Build path forwards from idx and backwards from idx through the target cell
        // Start by placing target cell at position idx
        const path = new Array(upperWord.length);
        path[idx] = { q: tq, r: tr };
        const usedInPath = new Set([targetKey]);
        let success = true;

        // Expand forward from idx+1
        for (let i = idx + 1; i < upperWord.length; i++) {
            const prev = path[i - 1];
            const neighbors = shuffle(getNeighbors(prev.q, prev.r), rng);
            let placed = false;
            for (const n of neighbors) {
                const nk = hexKey(n.q, n.r);
                if (!positionSet.has(nk) || usedInPath.has(nk)) continue;
                if (letterMap.has(nk) && letterMap.get(nk) !== upperWord[i]) continue;
                path[i] = { q: n.q, r: n.r };
                usedInPath.add(nk);
                placed = true;
                break;
            }
            if (!placed) { success = false; break; }
        }
        if (!success) continue;

        // Expand backward from idx-1
        for (let i = idx - 1; i >= 0; i--) {
            const next = path[i + 1];
            const neighbors = shuffle(getNeighbors(next.q, next.r), rng);
            let placed = false;
            for (const n of neighbors) {
                const nk = hexKey(n.q, n.r);
                if (!positionSet.has(nk) || usedInPath.has(nk)) continue;
                if (letterMap.has(nk) && letterMap.get(nk) !== upperWord[i]) continue;
                path[i] = { q: n.q, r: n.r };
                usedInPath.add(nk);
                placed = true;
                break;
            }
            if (!placed) { success = false; break; }
        }
        if (!success) continue;

        // All letters placed — commit to letterMap
        for (let i = 0; i < path.length; i++) {
            letterMap.set(hexKey(path[i].q, path[i].r), upperWord[i]);
        }
        return path;
    }
    return null;
}

// Build a board by placing real dictionary words first, then filling gaps
function buildBoardWordFirst(data, seed) {
    const rng = createRNG(seed);

    const board = new Board();
    board.maxMoves = data.maxMoves;
    board.movesRemaining = data.maxMoves;
    board.mode = data.mode;

    const radius = parseInt(data.layout.shape.replace('hex', ''));
    const positions = hexSpiral({ q: 0, r: 0 }, radius);

    // Build a set of valid position keys for quick lookup
    const positionSet = new Set(positions.map(p => hexKey(p.q, p.r)));

    // Randomize anchor positions
    const anchorCount = data.layout.anchors || 0;
    const randomCellTypes = pickRandomAnchors(positions, anchorCount, rng);

    // Determine word requirements from objectives
    const objectives = data.objectives.filter(o => o.isPrimary !== false);
    let wordCount = 1;
    let minLength = 3;
    for (const obj of objectives) {
        if (obj.type === 'formWord' || obj.type === 'formWordLength') {
            wordCount = Math.max(wordCount, obj.target || 1);
            if (obj.params && obj.params.minLength) {
                minLength = Math.max(minLength, obj.params.minLength);
            }
        }
    }

    // Identify anchor cells
    const anchorKeys = Object.entries(randomCellTypes)
        .filter(([, type]) => type === 'anchor')
        .map(([key]) => key);

    // Pick extra candidates to handle placement failures
    const candidates = pickCandidateWords(minLength, Math.min(8, positions.length), wordCount + 5, rng);

    // Place words on grid
    const letterMap = new Map(); // hexKey -> letter
    const placedPaths = [];

    for (const word of candidates) {
        if (placedPaths.length >= wordCount) break;
        const path = placeWordOnGrid(positionSet, letterMap, word, anchorKeys, rng);
        if (path) {
            placedPaths.push({ word: word.toUpperCase(), path });
        }
    }

    // If we couldn't place enough words, try more candidates
    if (placedPaths.length < wordCount) {
        const moreCandidates = pickCandidateWords(minLength, Math.min(8, positions.length), wordCount * 3, rng);
        for (const word of moreCandidates) {
            if (placedPaths.length >= wordCount) break;
            if (candidates.includes(word)) continue;
            const path = placeWordOnGrid(positionSet, letterMap, word, anchorKeys, rng);
            if (path) {
                placedPaths.push({ word: word.toUpperCase(), path });
            }
        }
    }

    // Ensure every anchor is covered by at least one word path
    const coveredKeys = new Set();
    for (const p of placedPaths) {
        for (const cell of p.path) coveredKeys.add(hexKey(cell.q, cell.r));
    }
    const uncoveredAnchors = anchorKeys.filter(k => !coveredKeys.has(k));
    if (uncoveredAnchors.length > 0) {
        // Place extra words routed through each uncovered anchor
        const extraWords = pickCandidateWords(3, Math.min(8, positions.length), 50, rng);
        for (const ak of uncoveredAnchors) {
            for (const word of extraWords) {
                const path = placeWordThroughCell(positionSet, letterMap, word, ak, rng);
                if (path) {
                    placedPaths.push({ word: word.toUpperCase(), path });
                    break;
                }
            }
        }
    }

    // Create cells: placed letters + fill remaining (guarantee ≥35% vowels in unfilled)
    const unfilledPos = positions.filter(p => !letterMap.has(hexKey(p.q, p.r)));
    const _vowels = 'AEIOU';
    const _minV = Math.ceil(unfilledPos.length * 0.35);
    let _vc = 0;
    const _fills = [];
    for (let i = 0; i < unfilledPos.length; i++) {
        let l = randomLetter(rng);
        if (_minV - _vc >= unfilledPos.length - i) l = _vowels[Math.floor(rng() * _vowels.length)];
        if (_vowels.includes(l)) _vc++;
        _fills.push(l);
    }
    let _fi = 0;
    for (const pos of positions) {
        const key = hexKey(pos.q, pos.r);
        const cellType = randomCellTypes[key] || 'plain';
        const letter = letterMap.has(key) ? letterMap.get(key) : _fills[_fi++];
        const cell = new HexCell({ q: pos.q, r: pos.r, letter, cellType });
        board.field.addCell(cell);
    }

    return board;
}

// ── Word-first board generation (Clear mode) ───────────────────
// Clear mode: words can't share cells (each gets removed).
// Must tile the entire grid with non-overlapping word paths.

// Place a word on the grid using only uncovered cells
function placeWordClear(uncoveredSet, allPositionSet, word, anchorKeys, rng) {
    const upperWord = word.toUpperCase();

    // Build start candidates from uncovered cells only
    let starts = [];

    // Prefer anchor cells if they're uncovered
    for (const k of anchorKeys) {
        if (uncoveredSet.has(k)) starts.push(k);
    }

    // Add remaining uncovered cells, shuffled
    const rest = shuffle(Array.from(uncoveredSet), rng).filter(k => !starts.includes(k));
    starts.push(...rest);

    const maxStarts = Math.min(starts.length, 20);

    for (let si = 0; si < maxStarts; si++) {
        const startKey = starts[si];
        const [sq, sr] = startKey.split(',').map(Number);
        const path = [{ q: sq, r: sr, key: startKey }];
        const usedInPath = new Set([startKey]);
        let success = true;

        for (let i = 1; i < upperWord.length; i++) {
            const last = path[path.length - 1];
            const neighbors = getNeighbors(last.q, last.r);

            // Only uncovered cells not already in this path
            let candidates = [];
            for (const n of neighbors) {
                const nk = hexKey(n.q, n.r);
                if (!allPositionSet.has(nk)) continue;
                if (!uncoveredSet.has(nk)) continue; // must be uncovered
                if (usedInPath.has(nk)) continue;
                candidates.push({ q: n.q, r: n.r, key: nk });
            }

            if (candidates.length === 0) {
                success = false;
                break;
            }

            // Pick randomly
            const pick = candidates[Math.floor(rng() * candidates.length)];
            path.push(pick);
            usedInPath.add(pick.key);
        }

        if (success && path.length === upperWord.length) {
            return path;
        }
    }

    return null;
}

function buildBoardClearMode(data, seed) {
    const rng = createRNG(seed);

    const board = new Board();
    board.maxMoves = data.maxMoves;
    board.movesRemaining = data.maxMoves;
    board.mode = data.mode;

    const radius = parseInt(data.layout.shape.replace('hex', ''));
    const positions = hexSpiral({ q: 0, r: 0 }, radius);
    const totalCells = positions.length;

    const allPositionSet = new Set(positions.map(p => hexKey(p.q, p.r)));
    const uncoveredSet = new Set(allPositionSet);

    // Randomize anchor positions
    const anchorCount = data.layout.anchors || 0;
    const randomCellTypes = pickRandomAnchors(positions, anchorCount, rng);
    const anchorKeys = Object.entries(randomCellTypes)
        .filter(([, type]) => type === 'anchor')
        .map(([key]) => key);

    // Determine min word length from objectives
    const objectives = data.objectives.filter(o => o.isPrimary !== false);
    let minLength = 3;
    for (const obj of objectives) {
        if ((obj.type === 'formWord' || obj.type === 'formWordLength') && obj.params && obj.params.minLength) {
            minLength = Math.max(minLength, obj.params.minLength);
        }
    }

    // Place non-overlapping words to cover all cells
    const letterMap = new Map();
    const placedPaths = [];

    // Keep placing words until all cells are covered (or nearly — <3 left triggers auto-clear)
    let attempts = 0;
    const maxAttempts = 100;

    while (uncoveredSet.size >= 3 && attempts < maxAttempts) {
        attempts++;

        // Pick word length: prefer lengths that divide remaining cells well
        // Use lengths between minLength and min(8, remaining cells)
        const maxWordLen = Math.min(8, uncoveredSet.size);
        if (maxWordLen < 3) break;

        const wordLen = Math.max(3, Math.min(maxWordLen, minLength + Math.floor(rng() * (maxWordLen - minLength + 1))));
        const candidates = pickCandidateWords(wordLen, wordLen, 10, rng);

        let placed = false;
        for (const word of candidates) {
            const path = placeWordClear(uncoveredSet, allPositionSet, word, anchorKeys, rng);
            if (path) {
                // Assign letters and remove from uncovered
                const upperWord = word.toUpperCase();
                for (let i = 0; i < path.length; i++) {
                    letterMap.set(path[i].key, upperWord[i]);
                    uncoveredSet.delete(path[i].key);
                }
                placedPaths.push({ word: upperWord, path });
                placed = true;
                break;
            }
        }

        // If no word of that length worked, try shorter
        if (!placed && wordLen > 3) {
            const shorterCandidates = pickCandidateWords(3, wordLen - 1, 15, rng);
            for (const word of shorterCandidates) {
                const path = placeWordClear(uncoveredSet, allPositionSet, word, anchorKeys, rng);
                if (path) {
                    const upperWord = word.toUpperCase();
                    for (let i = 0; i < path.length; i++) {
                        letterMap.set(path[i].key, upperWord[i]);
                        uncoveredSet.delete(path[i].key);
                    }
                    placedPaths.push({ word: upperWord, path });
                    placed = true;
                    break;
                }
            }
        }

        // If still not placed, the remaining cells may be isolated — fill and break
        if (!placed) break;
    }

    // Create cells: placed letters + fill remaining (guarantee ≥35% vowels in unfilled)
    const unfilledPosClear = positions.filter(p => !letterMap.has(hexKey(p.q, p.r)));
    const vowelsClear = 'AEIOU';
    const minVClear = Math.ceil(unfilledPosClear.length * 0.35);
    let vcClear = 0;
    const fillsClear = [];
    for (let i = 0; i < unfilledPosClear.length; i++) {
        let l = randomLetter(rng);
        if (minVClear - vcClear >= unfilledPosClear.length - i) l = vowelsClear[Math.floor(rng() * vowelsClear.length)];
        if (vowelsClear.includes(l)) vcClear++;
        fillsClear.push(l);
    }
    let fiClear = 0;
    for (const pos of positions) {
        const key = hexKey(pos.q, pos.r);
        const cellType = randomCellTypes[key] || 'plain';
        const letter = letterMap.has(key) ? letterMap.get(key) : fillsClear[fiClear++];
        const cell = new HexCell({ q: pos.q, r: pos.r, letter, cellType });
        board.field.addCell(cell);
    }

    return board;
}

// ── Word-first board generation (Illuminate mode) ───────────────
// Illuminate mode: words CAN share cells (tiles stay). Must ensure all cells
// are covered by at least one word path so the board is guaranteed solvable.
function buildBoardIlluminate(data, seed) {
    const rng = createRNG(seed);

    const board = new Board();
    board.maxMoves = data.maxMoves;
    board.movesRemaining = data.maxMoves;
    board.mode = data.mode;

    const radius = parseInt(data.layout.shape.replace('hex', ''));
    const positions = hexSpiral({ q: 0, r: 0 }, radius);
    const totalCells = positions.length;

    const allPositionSet = new Set(positions.map(p => hexKey(p.q, p.r)));
    const uncoveredSet = new Set(allPositionSet);

    // Randomize anchor positions
    const anchorCount = data.layout.anchors || 0;
    const randomCellTypes = pickRandomAnchors(positions, anchorCount, rng);
    const anchorKeys = Object.entries(randomCellTypes)
        .filter(([, type]) => type === 'anchor')
        .map(([key]) => key);

    // Determine min word length from objectives
    const objectives = data.objectives.filter(o => o.isPrimary !== false);
    let minLength = 3;
    for (const obj of objectives) {
        if ((obj.type === 'formWord' || obj.type === 'formWordLength') && obj.params && obj.params.minLength) {
            minLength = Math.max(minLength, obj.params.minLength);
        }
    }

    // Place overlapping words to cover all cells
    const letterMap = new Map(); // hexKey -> letter
    const placedPaths = [];

    let attempts = 0;
    const maxAttempts = 200;

    while (uncoveredSet.size > 0 && attempts < maxAttempts) {
        attempts++;

        const maxWordLen = Math.min(8, totalCells);
        const wordLen = Math.max(3, minLength + Math.floor(rng() * (maxWordLen - minLength + 1)));
        const candidates = pickCandidateWords(Math.min(wordLen, 3), wordLen, 15, rng);

        let placed = false;
        for (const word of candidates) {
            // Try to place starting from or passing through uncovered cells
            const path = placeWordOnGrid(allPositionSet, letterMap, word, anchorKeys, rng);
            if (path) {
                const upperWord = word.toUpperCase();
                // Check if this word covers at least one uncovered cell
                const coversNew = path.some(p => uncoveredSet.has(hexKey(p.q, p.r)));
                if (!coversNew) continue;

                for (let i = 0; i < path.length; i++) {
                    const k = hexKey(path[i].q, path[i].r);
                    letterMap.set(k, upperWord[i]);
                    uncoveredSet.delete(k);
                }
                placedPaths.push({ word: upperWord, path });
                placed = true;
                break;
            }
        }

        // If standard placement didn't cover new cells, try targeting uncovered cells directly
        if (!placed && uncoveredSet.size > 0) {
            const uncoveredArr = shuffle(Array.from(uncoveredSet), rng);
            const targetKey = uncoveredArr[0];
            const shortWords = pickCandidateWords(3, 5, 30, rng);
            for (const word of shortWords) {
                const path = placeWordThroughCell(allPositionSet, letterMap, word, targetKey, rng);
                if (path) {
                    const upperWord = word.toUpperCase();
                    for (let i = 0; i < path.length; i++) {
                        const k = hexKey(path[i].q, path[i].r);
                        letterMap.set(k, upperWord[i]);
                        uncoveredSet.delete(k);
                    }
                    placedPaths.push({ word: upperWord, path });
                    placed = true;
                    break;
                }
            }
        }

        if (!placed) break;
    }

    // Create cells: placed letters + fill remaining with safe letters (no J/Q/V/X/Z)
    for (const pos of positions) {
        const key = hexKey(pos.q, pos.r);
        const cellType = randomCellTypes[key] || 'plain';
        const letter = letterMap.has(key) ? letterMap.get(key) : safeLetter(rng);
        const cell = new HexCell({ q: pos.q, r: pos.r, letter, cellType });
        board.field.addCell(cell);
    }

    return board;
}

// Count how many cells are coverable by at least one valid word
function _countCoverableCells(board, dict) {
    const allCells = board.field.getAllCells().filter(c => c.letter && c.isActive);
    const covered = new Set();
    const seen = new Set();
    for (const startCell of allCells) {
        board.field._traceForCoverage(startCell, [startCell], dict, covered, seen, allCells.length);
        if (covered.size >= allCells.length) break;
    }
    return covered.size;
}

// Swap letters on uncoverable cells until all cells are coverable
function _fixUncoverableCells(board, dict) {
    const commonLetters = ['E','A','S','T','R','O','I','N','L','D','H','C','U','M','W','G','P','B','Y','F','K'];
    for (let pass = 0; pass < 5; pass++) {
        const allCells = board.field.getAllCells().filter(c => c.letter && c.isActive);
        const covered = new Set();
        const seen = new Set();
        for (const startCell of allCells) {
            board.field._traceForCoverage(startCell, [startCell], dict, covered, seen, allCells.length);
        }
        if (covered.size >= allCells.length) return; // all covered

        // Find uncovered cells and try swapping their letters
        const uncovered = allCells.filter(c => !covered.has(c.key));
        for (const cell of uncovered) {
            for (const letter of commonLetters) {
                cell.letter = letter;
                // Quick check: is this cell now coverable?
                const testCovered = new Set();
                const testSeen = new Set();
                board.field._traceForCoverage(cell, [cell], dict, testCovered, testSeen, 1);
                if (testCovered.has(cell.key)) break; // found a working letter
            }
        }
    }
}

// Build a single board from a seed (used for chain mode)
function buildBoard(data, seed) {
    const rng = createRNG(seed);

    const board = new Board();
    board.maxMoves = data.maxMoves;
    board.movesRemaining = data.maxMoves;
    board.mode = data.mode;

    const radius = parseInt(data.layout.shape.replace('hex', ''));
    const positions = hexSpiral({ q: 0, r: 0 }, radius);
    const letters = generateLetters(positions.length, rng);

    // Randomize anchor positions
    const anchorCount = data.layout.anchors || 0;
    const randomCellTypes = pickRandomAnchors(positions, anchorCount, rng);

    for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        const key = hexKey(pos.q, pos.r);
        const cellType = randomCellTypes[key] || 'plain';
        const cell = new HexCell({
            q: pos.q, r: pos.r,
            letter: letters[i],
            cellType
        });
        board.field.addCell(cell);
    }

    return board;
}

// Score how close a board is to being solvable (higher = better)
function boardSolvabilityScore(board, data) {
    const objectives = data.objectives.filter(o => o.isPrimary !== false);
    const hasAnchors = board.field.getAllCells().some(c => c.isAnchor);
    const minLength = objectives.reduce((max, o) => {
        if ((o.type === 'formWord' || o.type === 'formWordLength') && o.params && o.params.minLength) {
            return Math.max(max, o.params.minLength);
        }
        return max;
    }, 3);

    let words = board.field.findWordsWithPaths(dictionary, 50);
    if (hasAnchors) {
        words = words.filter(sol =>
            sol.path.some(p => {
                const cell = board.field.getCell(p.q, p.r);
                return cell && cell.isAnchor;
            })
        );
    }
    const qualifying = words.filter(w => w.word.length >= minLength);
    return qualifying.length;
}

// Check if a board has solutions that satisfy the level's objectives
function isBoardSolvable(board, data) {
    const objectives = data.objectives.filter(o => o.isPrimary !== false);
    const hasAnchors = board.field.getAllCells().some(c => c.isAnchor);
    const needsAnchor = objectives.some(o => o.type === 'illuminateAnchors');
    const minLength = objectives.reduce((max, o) => {
        if ((o.type === 'formWord' || o.type === 'formWordLength') && o.params && o.params.minLength) {
            return Math.max(max, o.params.minLength);
        }
        return max;
    }, 3);
    const wordTarget = objectives.reduce((max, o) => {
        if (o.type === 'formWord' || o.type === 'formWordLength') {
            return Math.max(max, o.target || 1);
        }
        return max;
    }, 1);

    let words = board.field.findWordsWithPaths(dictionary, 50);

    // If the board has anchors, every word must touch at least one anchor
    if (hasAnchors) {
        words = words.filter(sol =>
            sol.path.some(p => {
                const cell = board.field.getCell(p.q, p.r);
                return cell && cell.isAnchor;
            })
        );
    }

    // Filter by minimum length
    const qualifyingWords = words.filter(w => w.word.length >= minLength);

    // Must have enough qualifying words to meet the target
    if (qualifyingWords.length < wordTarget) return false;

    // Must have words passing through all anchor cells if required
    if (needsAnchor) {
        const anchors = board.field.getAllCells().filter(c => c.isAnchor);
        const coveredAnchors = new Set();
        for (const sol of qualifyingWords) {
            for (const p of sol.path) {
                const cell = board.field.getCell(p.q, p.r);
                if (cell && cell.isAnchor) coveredAnchors.add(cell.key);
            }
        }
        if (coveredAnchors.size < anchors.length) return false;
    }

    // For clear mode, check coverage via word list
    if (data.mode === 'clear') {
        const totalCells = board.field.getAllCells().length;
        const coveredCells = new Set();
        for (const sol of words) {
            for (const p of sol.path) {
                coveredCells.add(hexKey(p.q, p.r));
            }
        }
        if (coveredCells.size < totalCells) return false;
    }

    // For illuminate/apex mode, verify every cell is reachable by at least one valid word
    if (data.mode === 'illuminate' || data.mode === 'apex') {
        if (!board.field.allCellsCoverable(dictionary)) return false;
    }

    return true;
}

// Check if a board has too many uncommon words (> 5% of traceable words)
function hasTooManyUncommonWords(board) {
    const words = board.field.findWordsWithPaths(dictionary, 200);
    if (words.length === 0) return false;
    const uncommon = words.filter(w => !COMMON_SET.has(w.word.toLowerCase()));
    return uncommon.length / words.length > 0.05;
}

// Build a board, retrying until solvable
export function loadLevel(levelIndex) {
    if (levelIndex >= LEVEL_DATA.length) levelIndex = levelIndex % LEVEL_DATA.length;
    const data = LEVEL_DATA[levelIndex];
    if (!data) return null;

    // Simple mode: word-first generation (guaranteed solvable)
    if (data.mode === 'simple') {
        let best = null;
        for (let i = 0; i < 10; i++) {
            boardAttempt++;
            const seed = SESSION_SEED ^ (levelIndex * 2654435761) ^ (boardAttempt * 1103515245);
            best = buildBoardWordFirst(data, seed);
            if (!hasTooManyUncommonWords(best)) break;
        }
        return { board: best, levelData: data, levelIndex };
    }

    // Clear mode: word-first with full coverage (non-overlapping paths)
    if (data.mode === 'clear') {
        let best = null;
        for (let i = 0; i < 10; i++) {
            boardAttempt++;
            const seed = SESSION_SEED ^ (levelIndex * 2654435761) ^ (boardAttempt * 1103515245);
            best = buildBoardClearMode(data, seed);
            if (!hasTooManyUncommonWords(best)) break;
        }
        return { board: best, levelData: data, levelIndex };
    }

    // Apex mode: same generation as illuminate (word-first + safeLetter fills)
    if (data.mode === 'apex') {
        let bestBoard = null;
        let bestCoverage = -1;
        for (let i = 0; i < 100; i++) {
            boardAttempt++;
            const seed = SESSION_SEED ^ (levelIndex * 2654435761) ^ (boardAttempt * 1103515245);
            const board = buildBoardIlluminate(data, seed);
            if (board.field.allCellsCoverable(dictionary) && !hasTooManyUncommonWords(board)) {
                return { board, levelData: data, levelIndex };
            }
            const coverage = _countCoverableCells(board, dictionary);
            if (coverage > bestCoverage) {
                bestCoverage = coverage;
                bestBoard = board;
            }
        }
        if (bestBoard) {
            _fixUncoverableCells(bestBoard, dictionary);
        }
        return { board: bestBoard, levelData: data, levelIndex };
    }

    // Illuminate mode: word-first with overlapping coverage + solvability retry
    if (data.mode === 'illuminate') {
        let bestBoard = null;
        let bestCoverage = -1;
        for (let i = 0; i < 100; i++) {
            boardAttempt++;
            const seed = SESSION_SEED ^ (levelIndex * 2654435761) ^ (boardAttempt * 1103515245);
            const board = buildBoardIlluminate(data, seed);
            if (board.field.allCellsCoverable(dictionary) && !hasTooManyUncommonWords(board)) {
                return { board, levelData: data, levelIndex };
            }
            // Track board with best coverage for fallback
            const coverage = _countCoverableCells(board, dictionary);
            if (coverage > bestCoverage) {
                bestCoverage = coverage;
                bestBoard = board;
            }
        }
        // Last resort: swap uncoverable letters with common ones
        if (bestBoard) {
            _fixUncoverableCells(bestBoard, dictionary);
        }
        return { board: bestBoard, levelData: data, levelIndex };
    }

    // Other modes (chain): retry-based generation
    const maxAttempts = 200;
    let bestBoard = null;
    let bestScore = -1;

    for (let i = 0; i < maxAttempts; i++) {
        boardAttempt++;
        const seed = SESSION_SEED ^ (levelIndex * 2654435761) ^ (boardAttempt * 1103515245);
        const board = buildBoard(data, seed);

        if (isBoardSolvable(board, data) && !hasTooManyUncommonWords(board)) {
            return { board, levelData: data, levelIndex };
        }

        // Track best near-miss for fallback
        const score = boardSolvabilityScore(board, data);
        if (score > bestScore) {
            bestScore = score;
            bestBoard = board;
        }
    }

    // Return the best board found (closest to solvable)
    return { board: bestBoard, levelData: data, levelIndex };
}

export function getLevelCount() {
    return LEVEL_DATA.length;
}

export function getLevelData(index) {
    return LEVEL_DATA[index];
}

export function loadLevelWithBoard(levelIndex, letters, anchorIndices) {
    if (levelIndex >= LEVEL_DATA.length) levelIndex = levelIndex % LEVEL_DATA.length;
    const data = LEVEL_DATA[levelIndex];
    if (!data) return null;

    const board = new Board();
    board.maxMoves = data.maxMoves;
    board.movesRemaining = data.maxMoves;
    board.mode = data.mode;

    const radius = parseInt(data.layout.shape.replace('hex', ''));
    const positions = hexSpiral({ q: 0, r: 0 }, radius);
    const anchorSet = new Set(anchorIndices);

    for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        const cell = new HexCell({
            q: pos.q,
            r: pos.r,
            letter: letters[i] || 'A',
            cellType: anchorSet.has(i) ? 'anchor' : 'plain'
        });
        board.field.addCell(cell);
    }

    return { board, levelData: data, levelIndex };
}

// Get levels filtered by mode
export function getLevelsForMode(mode) {
    return LEVEL_DATA
        .map((data, index) => ({ ...data, index }))
        .filter(d => d.mode === mode);
}

// Get the first level index for a given mode
export function getFirstLevelForMode(mode) {
    const idx = LEVEL_DATA.findIndex(d => d.mode === mode);
    return idx >= 0 ? idx : 0;
}
