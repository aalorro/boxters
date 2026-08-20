import { hexKey, getNeighbors } from './hex.js';
import { COMBO } from './constants.js';
import { randomLetter } from './levels.js';

export class HexCell {
    constructor({ q, r, letter = null, cellType = 'plain' }) {
        this.q = q;
        this.r = r;
        this.key = hexKey(q, r);
        this.letter = letter;
        this.cellType = cellType;
        this.isActive = true;
        this.isCleared = false;
        this.isIlluminated = false;
        this.energy = 0;
        this.usedInMove = false;
        // Visual state
        this.glowIntensity = 0;
        this.shakeOffset = { x: 0, y: 0 };
        this.scale = 1;
    }

    get isAnchor() { return this.cellType === 'anchor'; }
}

export class Field {
    constructor() {
        this.cells = new Map();
        this.wordsFormed = [];
    }

    addCell(cell) {
        this.cells.set(cell.key, cell);
    }

    getCell(q, r) {
        return this.cells.get(hexKey(q, r));
    }

    getCellByKey(key) {
        return this.cells.get(key);
    }

    hasCell(q, r) {
        return this.cells.has(hexKey(q, r));
    }

    getNeighborCells(q, r) {
        return getNeighbors(q, r)
            .map(n => this.cells.get(hexKey(n.q, n.r)))
            .filter(Boolean);
    }

    getAllCells() {
        return Array.from(this.cells.values());
    }

    getActiveCells() {
        return this.getAllCells().filter(c => c.isActive && !c.isCleared);
    }

    // Find all valid words with their cell paths (for solution display)
    findWordsWithPaths(dictionary, maxResults = 8) {
        const results = [];
        const seen = new Set();
        const allCells = this.getAllCells().filter(c => c.letter && c.isActive);

        for (const startCell of allCells) {
            this._traceWordsWithPaths(startCell, [startCell], dictionary, results, seen);
        }

        results.sort((a, b) => b.word.length - a.word.length);
        return results.slice(0, maxResults);
    }

    // Check if every active cell appears in at least one valid word path
    allCellsCoverable(dictionary) {
        const allCells = this.getAllCells().filter(c => c.letter && c.isActive);
        const covered = new Set();
        const total = allCells.length;
        const seen = new Set();

        for (const startCell of allCells) {
            if (covered.size >= total) return true;
            this._traceForCoverage(startCell, [startCell], dictionary, covered, seen, total);
        }

        return covered.size >= total;
    }

    _traceForCoverage(current, path, dictionary, covered, seen, total) {
        if (covered.size >= total) return;
        const word = path.map(c => c.letter).join('');
        if (word.length >= 3 && dictionary.isWord(word) && !seen.has(word)) {
            seen.add(word);
            for (const c of path) {
                covered.add(c.key);
            }
            if (covered.size >= total) return;
        }
        if (word.length >= 8 || !dictionary.isPrefix(word)) return;

        const neighbors = this.getNeighborCells(current.q, current.r);
        for (const next of neighbors) {
            if (next.letter && next.isActive && !path.includes(next)) {
                path.push(next);
                this._traceForCoverage(next, path, dictionary, covered, seen, total);
                path.pop();
                if (covered.size >= total) return;
            }
        }
    }

    _traceWordsWithPaths(current, path, dictionary, found, seen) {
        const word = path.map(c => c.letter).join('');
        if (word.length >= 3 && dictionary.isWord(word) && !seen.has(word)) {
            seen.add(word);
            found.push({ word, path: path.map(c => ({ q: c.q, r: c.r })) });
        }
        if (word.length >= 8 || !dictionary.isPrefix(word)) return;

        const neighbors = this.getNeighborCells(current.q, current.r);
        for (const next of neighbors) {
            if (next.letter && next.isActive && !path.includes(next)) {
                path.push(next);
                this._traceWordsWithPaths(next, path, dictionary, found, seen);
                path.pop();
            }
        }
    }
}

export class Board {
    constructor() {
        this.field = new Field();
        this.moveHistory = [];
        this.movesRemaining = 10;
        this.maxMoves = 10;
        this.mode = 'simple';
        this.comboCount = 0;
        this.lastWordCellKeys = new Set();
        this.lastApexEffect = null;
        this.apexWeights = null; // optional { clear, chain, illuminate } weights
    }

    executeMove(word, path) {
        this.moveHistory.push({ word, path: path.map(c => ({ q: c.q, r: c.r })) });
        this.movesRemaining--;

        for (const cell of path) {
            cell.usedInMove = true;
        }

        const result = { cleared: [], replaced: [], illuminated: [] };

        switch (this.mode) {
            case 'simple':
                for (const cell of path) {
                    cell.isIlluminated = true;
                    cell.glowIntensity = 1.0;
                    result.illuminated.push({ q: cell.q, r: cell.r });
                }
                break;

            case 'clear':
                for (const cell of path) {
                    result.cleared.push({ q: cell.q, r: cell.r });
                    cell.letter = null;
                    cell.isCleared = true;
                    cell.isActive = false;
                }
                break;

            case 'chain': {
                const currentKeys = new Set(path.map(c => c.key));
                const hasOverlap = [...currentKeys].some(k => this.lastWordCellKeys.has(k));

                if (hasOverlap && this.lastWordCellKeys.size > 0) {
                    this.comboCount = Math.min(this.comboCount + 1, COMBO.maxCombo);
                } else {
                    this.comboCount = 0;
                }
                this.lastWordCellKeys = currentKeys;

                for (const cell of path) {
                    const newLetter = randomLetter();
                    cell.letter = newLetter;
                    cell.glowIntensity = 1.0;
                    result.replaced.push({ q: cell.q, r: cell.r, letter: newLetter });
                }
                break;
            }

            case 'illuminate':
                for (const cell of path) {
                    cell.isIlluminated = true;
                    cell.glowIntensity = 1.0;
                    result.illuminated.push({ q: cell.q, r: cell.r });
                }
                break;

            case 'apex': {
                let chosenEffect;
                if (this.apexWeights) {
                    const r = Math.random();
                    const w = this.apexWeights;
                    chosenEffect = r < w.clear ? 'clear' : r < w.clear + w.chain ? 'chain' : 'illuminate';
                } else {
                    const effects = ['clear', 'chain', 'illuminate'];
                    chosenEffect = effects[Math.floor(Math.random() * 3)];
                }
                this.lastApexEffect = chosenEffect;

                // All tiles are always illuminated first (counts toward % lit)
                for (const cell of path) {
                    cell.isIlluminated = true;
                    cell.glowIntensity = 1.0;
                }

                // Then apply the random effect on top
                switch (chosenEffect) {
                    case 'clear':
                        for (const cell of path) {
                            if (cell.isAnchor) {
                                // Anchor cells can't be cleared — stay illuminated
                                result.illuminated.push({ q: cell.q, r: cell.r });
                            } else {
                                result.cleared.push({ q: cell.q, r: cell.r });
                                cell.letter = null;
                                cell.isCleared = true;
                                cell.isActive = false;
                            }
                        }
                        break;
                    case 'chain': {
                        const currentKeys = new Set(path.map(c => c.key));
                        const hasOverlap = [...currentKeys].some(k => this.lastWordCellKeys.has(k));
                        if (hasOverlap && this.lastWordCellKeys.size > 0) {
                            this.comboCount = Math.min(this.comboCount + 1, COMBO.maxCombo);
                        } else {
                            this.comboCount = 0;
                        }
                        this.lastWordCellKeys = currentKeys;
                        for (const cell of path) {
                            const newLetter = randomLetter();
                            cell.letter = newLetter;
                            result.replaced.push({ q: cell.q, r: cell.r, letter: newLetter });
                        }
                        break;
                    }
                    case 'illuminate':
                        for (const cell of path) {
                            result.illuminated.push({ q: cell.q, r: cell.r });
                        }
                        break;
                }
                break;
            }
        }

        return result;
    }

    reset() {
        this.moveHistory = [];
        this.movesRemaining = this.maxMoves;
        this.comboCount = 0;
        this.lastWordCellKeys = new Set();
    }
}
