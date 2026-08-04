import { areAdjacent, hexKey } from './hex.js';

export class WordTracer {
    constructor(field, dictionary) {
        this.field = field;
        this.dictionary = dictionary;
        this.path = [];
        this.isActive = false;
    }

    setField(field) {
        this.field = field;
    }

    start(hexCoord) {
        const cell = this.field.getCell(hexCoord.q, hexCoord.r);
        if (!cell || !cell.letter || !cell.isActive) return false;

        this.path = [cell];
        this.isActive = true;
        return true;
    }

    extend(hexCoord) {
        if (!this.isActive || this.path.length === 0) return 'none';

        const cell = this.field.getCell(hexCoord.q, hexCoord.r);
        if (!cell || !cell.letter || !cell.isActive) return 'none';

        const lastCell = this.path[this.path.length - 1];

        // Same cell as last — ignore
        if (cell.key === lastCell.key) return 'none';

        // Backtrack: if this is the second-to-last cell, pop the last
        if (this.path.length >= 2) {
            const prevCell = this.path[this.path.length - 2];
            if (cell.key === prevCell.key) {
                this.path.pop();
                return 'backtrack';
            }
        }

        // Check adjacency to last cell
        if (!areAdjacent(lastCell, cell)) return 'none';

        // Check not already in path
        if (this.path.some(c => c.key === cell.key)) return 'none';

        // Valid extension
        this.path.push(cell);
        return 'extended';
    }

    end() {
        this.isActive = false;
        const result = {
            path: [...this.path],
            word: this.currentWord,
            isValid: this.isValidWord,
            isPrefix: this.isValidPrefix
        };
        this.path = [];
        return result;
    }

    cancel() {
        this.isActive = false;
        this.path = [];
    }

    get currentWord() {
        return this.path.map(c => c.letter).join('');
    }

    get isValidWord() {
        const word = this.currentWord;
        return word.length >= 3 && this.dictionary.isWord(word);
    }

    get isValidPrefix() {
        const word = this.currentWord;
        return word.length > 0 && this.dictionary.isPrefix(word);
    }

    get lastCell() {
        return this.path.length > 0 ? this.path[this.path.length - 1] : null;
    }

    get pathLength() {
        return this.path.length;
    }
}
