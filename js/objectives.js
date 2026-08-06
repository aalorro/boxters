// Objective tracking system

export class Objective {
    constructor({ type, description, target, params = {}, isPrimary }) {
        this.type = type;
        this.description = description;
        this.target = target;
        this.params = params;
        this.isPrimary = isPrimary;
        this.progress = 0;
        this.completed = false;
    }

    check(board, lastMove) {
        switch (this.type) {
            case 'formWord':
                return this._checkFormWord(board, lastMove);
            case 'formWordLength':
                return this._checkFormWordLength(board, lastMove);
            case 'illuminateAnchors':
                return this._checkAnchors(board);
            case 'useAllCells':
                return this._checkAllCells(board);
            case 'totalWords':
                return this._checkTotalWords(board);
            case 'clearAllCells':
                return this._checkClearAllCells(board);
            case 'achieveCombo':
                return this._checkAchieveCombo(board);
            case 'illuminatePercent':
                return this._checkIlluminatePercent(board);
            default:
                return false;
        }
    }

    _checkFormWord(board, lastMove) {
        if (lastMove && lastMove.word.length >= (this.params.minLength || 3)) {
            this.progress++;
            if (this.progress >= this.target) {
                this.completed = true;
            }
        }
        return this.completed;
    }

    _checkFormWordLength(board, lastMove) {
        if (lastMove && lastMove.word.length >= this.params.minLength) {
            this.progress++;
            if (this.progress >= this.target) {
                this.completed = true;
            }
        }
        return this.completed;
    }

    _checkAnchors(board) {
        const anchors = board.field.getAllCells().filter(c => c.isAnchor);
        const illuminated = anchors.filter(c => c.isIlluminated || c.usedInMove);
        this.progress = illuminated.length;
        this.target = anchors.length;
        this.completed = illuminated.length >= anchors.length;
        return this.completed;
    }

    _checkAllCells(board) {
        const total = board.field.getAllCells().length;
        const illuminated = board.field.getAllCells().filter(c => c.isIlluminated).length;
        this.progress = illuminated;
        this.target = total;
        this.completed = illuminated >= total;
        return this.completed;
    }

    _checkTotalWords(board) {
        this.progress = board.moveHistory.length;
        this.completed = this.progress >= this.target;
        return this.completed;
    }

    _checkClearAllCells(board) {
        const total = board.field.getAllCells().length;
        const cleared = board.field.getAllCells().filter(c => c.isCleared).length;
        this.progress = cleared;
        this.target = total;
        this.completed = cleared >= total;
        return this.completed;
    }

    _checkAchieveCombo(board) {
        this.progress = Math.max(this.progress, board.comboCount);
        this.completed = this.progress >= this.target;
        return this.completed;
    }

    _checkIlluminatePercent(board) {
        const allCells = board.field.getAllCells();
        const illuminated = allCells.filter(c => c.isIlluminated).length;
        const pct = allCells.length > 0 ? Math.floor((illuminated / allCells.length) * 100) : 0;
        this.progress = pct;
        this.completed = pct >= this.target;
        return this.completed;
    }
}

export class ObjectiveTracker {
    constructor(objectives = []) {
        this.primary = objectives.filter(o => o.isPrimary !== false).map(o => new Objective(o));
        this.secondary = objectives.filter(o => o.isPrimary === false).map(o => new Objective(o));
    }

    checkAll(board, lastMove) {
        // For formWord objectives, a word should only count toward ONE objective
        // (the most specific matching incomplete one, i.e. highest minLength first)
        const allObjs = [...this.primary, ...this.secondary];
        const formWordObjs = allObjs.filter(o =>
            (o.type === 'formWord' || o.type === 'formWordLength') && !o.completed
        );

        let wordClaimed = false;
        if (lastMove && formWordObjs.length > 1) {
            // Sort by minLength descending so most specific matches first
            const sorted = [...formWordObjs].sort((a, b) =>
                ((b.params && b.params.minLength) || 3) - ((a.params && a.params.minLength) || 3)
            );
            for (const obj of sorted) {
                const minLen = (obj.params && obj.params.minLength) || 3;
                if (lastMove.word.length >= minLen && !wordClaimed) {
                    obj.check(board, lastMove);
                    wordClaimed = true;
                }
            }
        }

        for (const obj of this.primary) {
            if (wordClaimed && (obj.type === 'formWord' || obj.type === 'formWordLength')) continue;
            obj.check(board, lastMove);
        }
        for (const obj of this.secondary) {
            if (wordClaimed && (obj.type === 'formWord' || obj.type === 'formWordLength')) continue;
            obj.check(board, lastMove);
        }
    }

    get allPrimaryComplete() {
        return this.primary.every(o => o.completed);
    }

    get allSecondaryComplete() {
        return this.secondary.every(o => o.completed);
    }

    get allObjectives() {
        return [...this.primary, ...this.secondary];
    }
}
