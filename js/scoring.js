import { LETTER_VALUES, SCORING, COMBO } from './constants.js';

export function calculateMoveScore(word, tier, comboCount = 0) {
    let letterScore = 0;
    for (const ch of word.toUpperCase()) {
        letterScore += LETTER_VALUES[ch] || 5;
    }
    if (tier === 'chain' && comboCount > 0) {
        const comboMult = COMBO.multipliers[Math.min(comboCount, COMBO.maxCombo)];
        letterScore = Math.floor(letterScore * comboMult);
    }
    return letterScore;
}

export function calculateLevelScore(board, tier, objectivesTracker, levelData) {
    const base = SCORING.baseTier[tier] || 500;
    const multiplier = SCORING.multiplierTier[tier] || 1.0;
    const levelMult = (levelData && levelData.scoreMult) || 1.0;

    let letterTotal = 0;
    for (const move of board.moveHistory) {
        for (const ch of move.word.toUpperCase()) {
            letterTotal += LETTER_VALUES[ch] || 5;
        }
    }

    const efficiency = board.movesRemaining * SCORING.efficiencyPerMove;
    const secondaryBonus = objectivesTracker.allSecondaryComplete ? SCORING.secondaryCompletionBonus : 0;

    const rawScore = (base + letterTotal + efficiency + secondaryBonus) * multiplier * levelMult;
    return Math.floor(rawScore);
}

export function getStars(score, level) {
    let stars = 1;
    if (score >= level.twoStarTarget) stars = 2;
    if (score >= level.threeStarTarget) stars = 3;
    return stars;
}
