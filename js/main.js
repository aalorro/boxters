import { STATES, MODES, COMBO } from './constants.js';
import { Renderer } from './renderer.js';
import { InputManager } from './input.js';
import { WordTracer } from './tracer.js';
import { ParticleSystem } from './particles.js';
import { AudioManager } from './audio.js';
import { initDictionary, dictionary } from './dictionary.js';
import { loadLevel, loadLevelWithBoard, getLevelCount, getLevelData, getFirstLevelForMode, getLevelsForMode } from './levels.js';
import { hexSpiral, hexKey } from './hex.js';
import { ObjectiveTracker } from './objectives.js';
import { calculateLevelScore, calculateMoveScore, getStars } from './scoring.js';

// ── Player Profile (localStorage) ──────────────────────────────
const STORAGE_KEY = 'boxters_player';

function loadProfile() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const profile = JSON.parse(raw);
        if (!profile.currentLevels) {
            profile.currentLevels = {};
        }
        // Migrate: compute unlockedModes from existing progress
        if (!profile.unlockedModes) {
            const modes = ['simple'];
            const modeOrder = ['simple', 'clear', 'chain', 'illuminate'];
            if (profile.highestLevels) {
                for (const mode of modeOrder) {
                    if (profile.highestLevels[mode] !== undefined && !modes.includes(mode)) {
                        modes.push(mode);
                    }
                }
            }
            profile.unlockedModes = modes;
            saveProfile(profile);
        }
        return profile;
    } catch { return null; }
}

function saveProfile(profile) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

function createProfile(name) {
    const profile = {
        name,
        createdAt: new Date().toISOString(),
        totalScore: 0,
        bestScore: 0,
        levelsCompleted: 0,
        gamesPlayed: 0,
        currentLevels: {},
        unlockedModes: ['simple']
    };
    saveProfile(profile);
    return profile;
}


// ── Game ────────────────────────────────────────────────────────
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        this.particles = new ParticleSystem();
        this.audio = new AudioManager();
        this.input = null;
        this.tracer = null;
        this.player = null;

        // Game state
        this.state = STATES.LOADING;
        this.board = null;
        this.levelData = null;
        this.levelIndex = 0;
        this.objectives = null;
        this.score = 0;
        this.totalScore = 0;
        this.stars = 0;
        this.tutorialMessage = null;
        this.wordsUsed = new Set();
        this.feedbackMessage = null;
        this.feedbackTimer = 0;
        this.levelTransitionTimer = 0;
        this.lives = 3;
        this.maxLives = 3;
        this.solutionWords = [];
        this.hoveredSolution = null;
        this.selectedMode = MODES.SIMPLE;
        this.hoveredButton = null; // 'info' | 'logout' | null

        // Timing
        this.lastTime = 0;
        this._boundLoop = this._gameLoop.bind(this);
    }

    async init() {
        initDictionary();
        this.audio.init();
        this._checkSharedBoardParams();

        // Prevent browser refresh while a game is in progress (moves made)
        window.addEventListener('keydown', (e) => {
            if ((e.key === 'F5' || (e.ctrlKey && e.key === 'r')) && this._hasMovesInProgress()) {
                e.preventDefault();
            }
        });
        window.addEventListener('beforeunload', (e) => {
            if (this._hasMovesInProgress()) {
                this._saveBoardState();
                e.preventDefault();
            }
        });

        window.addEventListener('resize', () => {
            this.renderer.resize();
            if (this.board) {
                const cellCount = this.board.field.getAllCells().length;
                this.renderer.calculateHexSize(cellCount);
            }
            if (this.input) {
                this.input.updateLayout(this.renderer.hexSize, this.renderer.boardOffset);
            }
        });

        const loading = document.getElementById('loading-screen');
        setTimeout(() => {
            loading.classList.add('hidden');
            this._showEntryScreen();
        }, 600);
    }

    // ── Entry flow ──────────────────────────────────────────────
    _checkSharedBoardParams() {
        const params = new URLSearchParams(window.location.search);
        const l = params.get('l');
        const b = params.get('b');
        if (l !== null && b) {
            this._sharedBoard = {
                levelIndex: parseInt(l),
                letters: b.toUpperCase(),
                anchors: params.get('a') ? params.get('a').split(',').map(Number) : []
            };
            // Clear URL params without reload
            window.history.replaceState({}, '', window.location.pathname);
        }
    }

    _showEntryScreen() {
        this.player = loadProfile();
        if (this.player) {
            if (this._sharedBoard) {
                this.selectedMode = getLevelData(this._sharedBoard.levelIndex).mode;
            }
            this._showWelcomeScreen();
        } else {
            this._showRegisterScreen();
        }
    }

    _showRegisterScreen() {
        const screen = document.getElementById('register-screen');
        screen.classList.remove('hidden');

        const form = document.getElementById('register-form');
        const input = document.getElementById('player-name');
        input.focus();

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = input.value.trim();
            if (!name) return;

            this.player = createProfile(name);
            screen.classList.add('hidden');
            this._showWelcomeScreen();
        }, { once: true });
    }

    _showWelcomeScreen() {
        const screen = document.getElementById('welcome-screen');
        screen.classList.remove('hidden');

        document.getElementById('welcome-name').textContent = this.player.name;
        document.getElementById('stat-games').textContent = this.player.gamesPlayed;
        document.getElementById('stat-levels').textContent = this.player.levelsCompleted;
        document.getElementById('stat-score').textContent = this.player.totalScore || 0;

        // Restore last played mode, or default to simple (must be unlocked)
        const lastMode = this.player.lastMode || MODES.SIMPLE;
        this.selectedMode = (this.player.unlockedModes && this.player.unlockedModes.includes(lastMode))
            ? lastMode : MODES.SIMPLE;

        // Setup mode buttons
        this._setupModeButtons();

        document.getElementById('play-btn').addEventListener('click', () => {
            this.audio.init();
            this.audio.resume();
            screen.classList.add('hidden');
            this._startGame();
        }, { once: true });

    }

    _setupModeButtons() {
        const modeOrder = [MODES.SIMPLE, MODES.CLEAR, MODES.CHAIN, MODES.ILLUMINATE];
        const unlocked = this.player.unlockedModes || ['simple'];
        const container = document.getElementById('mode-select');
        if (!container) return;

        container.innerHTML = '';
        for (const mode of modeOrder) {
            const btn = document.createElement('button');
            const isUnlocked = unlocked.includes(mode);
            btn.className = 'mode-btn ' + (isUnlocked ? 'unlocked' : 'locked');
            btn.dataset.mode = mode;
            btn.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);

            if (isUnlocked && mode === this.selectedMode) {
                btn.classList.add('active');
            }
            if (isUnlocked) {
                btn.addEventListener('click', () => {
                    this.selectedMode = mode;
                    container.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                });
            }

            container.appendChild(btn);
        }
    }

    _startGame() {
        this.totalScore = this.player.totalScore || 0;
        // Only count as a new game if not resuming from a reload
        if (!this.player.sessionActive) {
            this.player.gamesPlayed++;
        }
        this.player.sessionActive = true;
        this.player.lastMode = this.selectedMode;
        saveProfile(this.player);

        this.input = new InputManager(this.canvas, this.renderer.hexSize, this.renderer.boardOffset);
        this._setupInputHandlers();

        // Check if player is still in cooldown from a previous session
        if (this.player.cooldownUntil && Date.now() < this.player.cooldownUntil) {
            const savedLevel = this.player.currentLevels[this.selectedMode];
            const startLevel = (savedLevel !== undefined) ? savedLevel : getFirstLevelForMode(this.selectedMode);
            this._loadLevel(startLevel);
            this.cooldownUntil = this.player.cooldownUntil;
            this.lives = 0;
            this.state = STATES.COOLDOWN;
        } else if (this._sharedBoard) {
            // Load shared board directly
            this._clearBoardState();
            this._loadLevel(this._sharedBoard.levelIndex);
            this.state = STATES.PLAYING;
        } else {
            // Try to restore an in-progress board from a previous session
            const snapshot = this._loadBoardState();
            if (snapshot && snapshot.selectedMode === this.selectedMode &&
                snapshot.moveHistory && snapshot.moveHistory.length > 0) {
                if (this._restoreFromSnapshot(snapshot)) {
                    this._showFeedback('Resuming where you left off');
                    this.state = STATES.PLAYING;
                } else {
                    const savedLevel = this.player.currentLevels[this.selectedMode];
                    const startLevel = (savedLevel !== undefined) ? savedLevel : getFirstLevelForMode(this.selectedMode);
                    this._loadLevel(startLevel);
                    this.state = STATES.PLAYING;
                }
            } else {
                this._clearBoardState();
                const savedLevel = this.player.currentLevels[this.selectedMode];
                const startLevel = (savedLevel !== undefined) ? savedLevel : getFirstLevelForMode(this.selectedMode);
                this._loadLevel(startLevel);
                this.state = STATES.PLAYING;
            }
        }
        this.lastTime = performance.now();
        requestAnimationFrame(this._boundLoop);
    }

    // ── Level management ────────────────────────────────────────
    _loadLevel(index) {
        // Clear any lingering particles/confetti from previous level
        this.particles.particles = [];
        if (this._confettiInterval) {
            clearInterval(this._confettiInterval);
            this._confettiInterval = null;
        }
        // Check if we've gone past the current mode's last level
        const modeLevels = getLevelsForMode(this.selectedMode);
        const modeEnd = modeLevels.length > 0 ? modeLevels[modeLevels.length - 1].index + 1 : getLevelCount();
        if (index >= modeEnd || index >= getLevelCount()) {
            // Advance to the next mode if unlocked
            const modeOrder = ['simple', 'clear', 'chain', 'illuminate'];
            const unlocked = this.player.unlockedModes || ['simple'];
            const currentModeIdx = modeOrder.indexOf(this.selectedMode);
            const nextMode = currentModeIdx < modeOrder.length - 1 ? modeOrder[currentModeIdx + 1] : null;
            if (nextMode && unlocked.includes(nextMode)) {
                this.selectedMode = nextMode;
                this.player.lastMode = this.selectedMode;
                index = getFirstLevelForMode(this.selectedMode);
                this._showFeedback(`Advancing to ${this.selectedMode.toUpperCase()} mode!`);
            } else {
                // Mode not unlocked or last mode — wrap back to current mode start
                index = getFirstLevelForMode(this.selectedMode);
            }
        }
        let result;
        if (this._sharedBoard && this._sharedBoard.levelIndex === index) {
            result = loadLevelWithBoard(index, this._sharedBoard.letters, this._sharedBoard.anchors);
            this._sharedBoard = null;
        } else {
            result = loadLevel(index);
        }
        if (!result) {
            this.state = STATES.MENU;
            return;
        }

        this.board = result.board;
        this.levelData = result.levelData;
        this.levelIndex = index;
        this.score = 0;

        // Save current level for resume, and track highest reached
        if (this.player) {
            this.player.currentLevels[this.selectedMode] = index;
            if (!this.player.highestLevels) this.player.highestLevels = {};
            const prev = this.player.highestLevels[this.selectedMode];
            if (prev === undefined || index > prev) {
                this.player.highestLevels[this.selectedMode] = index;
            }
            saveProfile(this.player);
        }
        this.stars = 0;
        this.wordsUsed = new Set();
        this.feedbackMessage = null;
        this.solutionWords = [];
        this.hoveredSolution = null;

        this.objectives = new ObjectiveTracker(this.levelData.objectives);

        const cellCount = this.board.field.getAllCells().length;
        this.renderer.calculateHexSize(cellCount);

        this.tracer = new WordTracer(this.board.field, dictionary);

        this.input.updateLayout(this.renderer.hexSize, this.renderer.boardOffset);

        if (this.levelData.tutorial) {
            this.tutorialMessage = this.levelData.tutorial.message;
        } else {
            this.tutorialMessage = null;
        }

        this.state = STATES.PLAYING;
    }

    // ── Input handlers ──────────────────────────────────────────
    _setupInputHandlers() {
        this.input.on('traceStart', (data) => {
            if (this.state !== STATES.PLAYING) return;

            // Check if contact button was tapped
            if (this.renderer.isContactButtonHit(data.pos.x, data.pos.y)) {
                this.input.cancelTrace();
                const dlg = document.getElementById('contact-dialog');
                if (dlg) dlg.showModal();
                return;
            }

            // Check if info button was tapped
            if (this.renderer.isInfoButtonHit(data.pos.x, data.pos.y)) {
                this.input.cancelTrace();
                if (window.showInfoDialog) window.showInfoDialog('gameplay');
                return;
            }

            // Check if logout button was tapped
            if (this.renderer.isLogoutButtonHit(data.pos.x, data.pos.y)) {
                this.input.cancelTrace();
                this._returnToWelcome();
                return;
            }

            // Check if sound button was tapped
            if (this.renderer.isSoundButtonHit(data.pos.x, data.pos.y)) {
                this.input.cancelTrace();
                this.audio.toggle();
                return;
            }

            // Check if share button was tapped
            if (this.renderer.isShareButtonHit(data.pos.x, data.pos.y)) {
                this.input.cancelTrace();
                this._shareBoard();
                return;
            }

            // Check if back button was tapped (disabled when moves in progress)
            if (!this._hasMovesInProgress() && this.renderer.isBackButtonHit(data.pos.x, data.pos.y)) {
                this.input.cancelTrace();
                this._goBackLevel();
                return;
            }

            // Check if forward button was tapped (disabled when moves in progress)
            if (!this._hasMovesInProgress() && this.renderer.isForwardButtonHit(data.pos.x, data.pos.y)) {
                this.input.cancelTrace();
                this._goForwardLevel();
                return;
            }

            this.audio.resume();
            this.audio.init();

            if (this.tutorialMessage) {
                this.tutorialMessage = null;
            }

            if (this.tracer.start(data.hex)) {
                const cell = this.board.field.getCell(data.hex.q, data.hex.r);
                if (cell && cell.letter) {
                    this.audio.playTone(cell.letter);
                }
            }
        });

        this.input.on('hover', (data) => {
            if (this.state !== STATES.PLAYING) {
                this.hoveredButton = null;
                return;
            }
            if (this.renderer.isContactButtonHit(data.pos.x, data.pos.y)) {
                this.hoveredButton = 'contact';
            } else if (this.renderer.isInfoButtonHit(data.pos.x, data.pos.y)) {
                this.hoveredButton = 'info';
            } else if (this.renderer.isLogoutButtonHit(data.pos.x, data.pos.y)) {
                this.hoveredButton = 'logout';
            } else if (!this._hasMovesInProgress() && this.renderer.isBackButtonHit(data.pos.x, data.pos.y)) {
                this.hoveredButton = 'back';
            } else if (!this._hasMovesInProgress() && this.renderer.isForwardButtonHit(data.pos.x, data.pos.y)) {
                this.hoveredButton = 'forward';
            } else if (this.renderer.isShareButtonHit(data.pos.x, data.pos.y)) {
                this.hoveredButton = 'share';
            } else {
                this.hoveredButton = null;
            }
        });

        this.input.on('traceMove', (data) => {
            if (this.state !== STATES.PLAYING || !this.tracer.isActive) return;

            const result = this.tracer.extend(data.hex);
            if (result === 'extended') {
                const cell = this.board.field.getCell(data.hex.q, data.hex.r);
                if (cell && cell.letter) {
                    this.audio.playTone(cell.letter);
                }
            }
        });

        this.input.on('traceEnd', (data) => {
            // Cooldown: allow resume when timer expires
            if (this.state === STATES.COOLDOWN) {
                if (!this.cooldownUntil || Date.now() >= this.cooldownUntil) {
                    this.lives = this.maxLives;
                    this.cooldownUntil = null;
                    this.player.cooldownUntil = null;
                    saveProfile(this.player);
                    this._loadLevel(this.levelIndex);
                }
                return;
            }

            // Defeat/game-over handled by solution modal
            if (this.state === STATES.GAME_OVER || this.state === STATES.DEFEAT) return;

            if (this.state === STATES.VICTORY) {
                if (this.levelTransitionTimer <= 0) {
                    this.isUltimateVictory = false;
                    this._loadLevel(this.levelIndex + 1);
                }
                return;
            }

            if (this.state !== STATES.PLAYING || !this.tracer.isActive) return;

            const result = this.tracer.end();

            if (result.isValid) {
                this._submitWord(result);
            } else if (result.word.length >= 3) {
                this.board.movesRemaining--;
                this.audio.playError();
                this._showFeedback(`"${result.word}" is not in the dictionary  (-1 move)`);

                if (this.board.movesRemaining <= 0) {
                    this._handleDefeat();
                }
            } else if (result.word.length > 0) {
                this._showFeedback('Words must be at least 3 letters');
            }
        });
    }

    // ── Gameplay ────────────────────────────────────────────────
    _submitWord(result) {
        const { word, path } = result;

        if (this.wordsUsed.has(word.toUpperCase())) {
            this._showFeedback(`"${word}" already used this level`);
            this.audio.playError();
            return;
        }

        // Enforce minimum word length only while formWord objectives are incomplete
        const wordLenObjectives = this.objectives.allObjectives
            .filter(o => (o.type === 'formWord' || o.type === 'formWordLength') && !o.completed);
        if (wordLenObjectives.length > 0) {
            const minLength = wordLenObjectives
                .reduce((min, o) => Math.min(min, (o.params && o.params.minLength) || 3), Infinity);
            if (word.length < minLength) {
                this._showFeedback(`Words must be at least ${minLength} letters!`);
                this.audio.playError();
                return;
            }
        }

        // Reject words that don't touch any anchor if the board has anchor cells
        const anchorCells = this.board.field.getAllCells().filter(c => c.isAnchor);
        if (anchorCells.length > 0) {
            const touchesAnchor = path.some(cell => cell.isAnchor);
            if (!touchesAnchor) {
                this._showFeedback('Word must pass through an Anchor cell!');
                this.audio.playError();
                return;
            }
        }

        this.wordsUsed.add(word.toUpperCase());

        const moveResult = this.board.executeMove(word, path);

        // Auto-clear isolated clusters of 1-2 cells in clear mode (can't form a 3-letter word)
        if (this.board.mode === 'clear') {
            const remaining = this.board.field.getAllCells().filter(c => !c.isCleared);
            if (remaining.length > 0) {
                const remainSet = new Set(remaining.map(c => `${c.q},${c.r}`));
                const visited = new Set();
                for (const cell of remaining) {
                    const key = `${cell.q},${cell.r}`;
                    if (visited.has(key)) continue;
                    // BFS to find this connected component
                    const component = [];
                    const queue = [cell];
                    visited.add(key);
                    while (queue.length > 0) {
                        const cur = queue.shift();
                        component.push(cur);
                        for (const nb of this.board.field.getNeighborCells(cur.q, cur.r)) {
                            const nk = `${nb.q},${nb.r}`;
                            if (!nb.isCleared && remainSet.has(nk) && !visited.has(nk)) {
                                visited.add(nk);
                                queue.push(nb);
                            }
                        }
                    }
                    // Auto-clear clusters too small to form a word
                    if (component.length < 3) {
                        for (const c of component) {
                            c.letter = null;
                            c.isCleared = true;
                            c.isActive = false;
                            const pos = this.renderer.getCellPixelPos(c.q, c.r);
                            this.particles.emitClearEffect(pos.x, pos.y);
                        }
                    }
                }
            }
        }

        this.audio.playWordChord(word);

        // Mode-specific particles
        const mode = this.board.mode;
        for (const cell of path) {
            const pos = this.renderer.getCellPixelPos(cell.q, cell.r);
            if (mode === 'clear') {
                this.particles.emitClearEffect(pos.x, pos.y);
            } else if (mode === 'chain') {
                this.particles.emitChainReplace(pos.x, pos.y);
            } else if (mode === 'illuminate') {
                this.particles.emitIlluminate(pos.x, pos.y);
            } else {
                this.particles.emit(pos.x, pos.y, 6, {
                    speed: 1.5, color: '#ffd700', life: 0.8, decay: 0.02
                });
            }
        }

        const moveScore = calculateMoveScore(word, this.levelData.tier, this.board.comboCount);
        this.score += moveScore;

        let feedbackMsg = `${word} — +${moveScore} pts`;
        if (mode === 'chain' && this.board.comboCount > 0) {
            const comboMult = COMBO.multipliers[Math.min(this.board.comboCount, COMBO.maxCombo)];
            feedbackMsg += ` (x${comboMult} combo!)`;
        }
        this._showFeedback(feedbackMsg);

        // For chain mode, need to rebuild tracer since letters changed
        if (mode === 'chain') {
            this.tracer = new WordTracer(this.board.field, dictionary);
        }

        const lastMove = { word, path: path.map(c => ({ q: c.q, r: c.r })) };
        this.objectives.checkAll(this.board, lastMove);

        if (this.objectives.allPrimaryComplete) {
            this._handleVictory();
            return;
        }

        // Save board state after each move for resume on close
        this._saveBoardState();

        if (this.board.movesRemaining <= 0) {
            // Re-check board-state objectives (auto-clear may have completed clearAllCells)
            for (const obj of this.objectives.allObjectives) {
                if (obj.type === 'clearAllCells' || obj.type === 'useAllCells' ||
                    obj.type === 'illuminatePercent' || obj.type === 'illuminateAnchors') {
                    obj.check(this.board, lastMove);
                }
            }
            if (this.objectives.allPrimaryComplete) {
                this._handleVictory();
            } else {
                this._handleDefeat();
            }
        }
    }

    _handleVictory() {
        this._clearBoardState();
        this.state = STATES.VICTORY;
        this.levelTransitionTimer = 1.2;
        this.score = calculateLevelScore(this.board, this.levelData.tier, this.objectives, this.levelData);
        this.stars = getStars(this.score, this.levelData);
        this.totalScore += this.score;

        this.player.levelsCompleted++;
        this.player.totalScore = this.totalScore;

        saveProfile(this.player);

        const cx = this.renderer.displayWidth / 2;
        const cy = this.renderer.displayHeight / 2;

        // Check if this is the final level of any mode (level 14)
        const finalLevels = ['simple_14', 'clear_14', 'chain_14', 'illuminate_14'];
        const isFinalLevel = finalLevels.includes(this.levelData.id);
        if (!this.player.celebratedModes) this.player.celebratedModes = [];
        const alreadyCelebrated = this.player.celebratedModes.includes(this.board.mode);
        this.isUltimateVictory = isFinalLevel && !alreadyCelebrated;

        if (isFinalLevel) {
            // Unlock the next mode
            const modeOrder = ['simple', 'clear', 'chain', 'illuminate'];
            const idx = modeOrder.indexOf(this.board.mode);
            if (idx >= 0 && idx < modeOrder.length - 1) {
                const nextMode = modeOrder[idx + 1];
                if (!this.player.unlockedModes) this.player.unlockedModes = ['simple'];
                if (!this.player.unlockedModes.includes(nextMode)) {
                    this.player.unlockedModes.push(nextMode);
                }
            }
            // Mark mode as celebrated so it only happens once
            if (!alreadyCelebrated) {
                this.player.celebratedModes.push(this.board.mode);
            }
            saveProfile(this.player);
        }

        if (this.isUltimateVictory) {
            this.audio.playUltimateVictory();
            this.particles.emitVictoryBurst(cx, cy);
            this.particles.emitConfetti(this.renderer.displayWidth, this.renderer.displayHeight);
            this._confettiInterval = setInterval(() => {
                if (this.state === STATES.VICTORY) {
                    this.particles.emitConfetti(this.renderer.displayWidth, this.renderer.displayHeight);
                } else {
                    clearInterval(this._confettiInterval);
                    this._confettiInterval = null;
                }
            }, 2000);
        } else {
            this.audio.playVictory();
            this.particles.emitVictoryBurst(cx, cy);
        }
    }

    _handleDefeat() {
        this._clearBoardState();
        // Find solution words filtered by objectives
        const maxSolutions = this.board.mode === 'illuminate' ? 999 : 12;
        let solutions = this.board.field.findWordsWithPaths(dictionary, maxSolutions);

        const objectives = this.levelData.objectives.filter(o => o.isPrimary !== false);
        const minLength = objectives.reduce((max, o) => {
            if ((o.type === 'formWord' || o.type === 'formWordLength') && o.params && o.params.minLength) {
                return Math.max(max, o.params.minLength);
            }
            return max;
        }, 3);

        // If the board has anchors, only show words that touch at least one anchor
        const hasAnchors = this.board.field.getAllCells().some(c => c.isAnchor);
        if (hasAnchors) {
            solutions = solutions.filter(sol =>
                sol.path.some(p => {
                    const cell = this.board.field.getCell(p.q, p.r);
                    return cell && cell.isAnchor;
                })
            );
        }

        // In illuminate mode, only show words that include at least one unlit tile
        // and skip the minLength filter so 3/4/5-letter words are shown too
        if (this.board.mode === 'illuminate') {
            solutions = solutions.filter(sol =>
                sol.path.some(p => {
                    const cell = this.board.field.getCell(p.q, p.r);
                    return cell && !cell.isIlluminated;
                })
            );
            // Sort by number of unlit tiles covered (most useful first)
            solutions.sort((a, b) => {
                const unlitA = a.path.filter(p => { const c = this.board.field.getCell(p.q, p.r); return c && !c.isIlluminated; }).length;
                const unlitB = b.path.filter(p => { const c = this.board.field.getCell(p.q, p.r); return c && !c.isIlluminated; }).length;
                return unlitB - unlitA || b.word.length - a.word.length;
            });
        } else if (minLength > 3) {
            solutions = solutions.filter(sol => sol.word.length >= minLength);
        }

        const displayLimit = this.board.mode === 'illuminate' ? 12 : 6;
        this.solutionWords = solutions.slice(0, displayLimit);

        // Don't lose a life if the board had no valid solutions
        if (this.solutionWords.length > 0) {
            this.lives--;
        } else {
            this._showFeedback('No valid solutions existed — no life lost');
        }

        if (this.lives <= 0) {
            this.state = STATES.GAME_OVER;
            this.cooldownUntil = Date.now() + 5 * 60 * 1000; // 5 minute cooldown
            this.player.cooldownUntil = this.cooldownUntil;
            saveProfile(this.player);
        } else {
            this.state = STATES.DEFEAT;
        }
        this.levelTransitionTimer = 2.0;
        this.audio.playFail();

        this._showSolutionModal();
    }

    _showSolutionModal() {
        const modal = document.getElementById('solution-modal');
        const wordList = document.getElementById('solution-word-list');
        const continueBtn = document.getElementById('solution-continue-btn');

        wordList.innerHTML = '';
        this.hoveredSolution = null;

        for (const sol of this.solutionWords) {
            const item = document.createElement('div');
            item.className = 'solution-word-item';
            item.textContent = sol.word;

            item.addEventListener('mouseenter', () => {
                this.hoveredSolution = sol;
            });
            item.addEventListener('mouseleave', () => {
                this.hoveredSolution = null;
            });
            item.addEventListener('touchstart', () => {
                this.hoveredSolution = sol;
            });

            wordList.appendChild(item);
        }

        if (this.solutionWords.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'solution-word-item';
            empty.textContent = 'No solution found';
            empty.style.opacity = '0.5';
            wordList.appendChild(empty);
        }

        if (this.state === STATES.GAME_OVER) {
            continueBtn.textContent = 'Retry Level';
        } else {
            continueBtn.textContent = `Continue (${this.lives} ${this.lives === 1 ? 'life' : 'lives'} left)`;
        }

        modal.classList.remove('hidden');

        const handleContinue = () => {
            if (this.state === STATES.GAME_OVER && this.cooldownUntil && Date.now() < this.cooldownUntil) {
                // Show cooldown state
                this.state = STATES.COOLDOWN;
                modal.classList.add('hidden');
                this.hoveredSolution = null;
                this.solutionWords = [];
                return;
            }

            modal.classList.add('hidden');
            this.hoveredSolution = null;
            this.solutionWords = [];

            if (this.state === STATES.GAME_OVER) {
                this.lives = this.maxLives;
                this.cooldownUntil = null;
                this.player.cooldownUntil = null;
                saveProfile(this.player);
                this._loadLevel(this.levelIndex);
            } else {
                this._loadLevel(this.levelIndex);
            }
        };
        continueBtn.addEventListener('click', handleContinue, { once: true });
    }

    _goBackLevel() {
        const firstLevel = getFirstLevelForMode(this.selectedMode);
        if (this.levelIndex > firstLevel) {
            this._clearBoardState();
            this._loadLevel(this.levelIndex - 1);
        }
    }

    _goForwardLevel() {
        const highest = this.player.highestLevels && this.player.highestLevels[this.selectedMode];
        if (highest !== undefined && this.levelIndex < highest) {
            this._clearBoardState();
            this._loadLevel(this.levelIndex + 1);
        }
    }

    _shareBoard() {
        if (!this.board) return;
        const cells = this.board.field.getAllCells();
        const radius = parseInt(this.levelData.layout.shape.replace('hex', ''));
        const positions = hexSpiral({ q: 0, r: 0 }, radius);

        let letters = '';
        const anchors = [];
        for (let i = 0; i < positions.length; i++) {
            const pos = positions[i];
            const cell = this.board.field.getCell(pos.q, pos.r);
            letters += cell ? (cell.letter || 'A') : 'A';
            if (cell && cell.isAnchor) anchors.push(i);
        }

        const params = new URLSearchParams();
        params.set('l', this.levelIndex);
        params.set('b', letters);
        if (anchors.length > 0) params.set('a', anchors.join(','));

        const url = window.location.origin + window.location.pathname + '?' + params.toString();
        navigator.clipboard.writeText(url).then(() => {
            this._showFeedback('Link copied!');
        }).catch(() => {
            this._showFeedback('Could not copy link');
        });
    }

    _returnToWelcome() {
        // Save board state if moves in progress, otherwise clear it
        if (this._hasMovesInProgress()) {
            this._saveBoardState();
        } else {
            this._clearBoardState();
        }
        // Save current progress and end session
        this.player.currentLevels[this.selectedMode] = this.levelIndex;
        this.player.sessionActive = false;
        saveProfile(this.player);

        // Reset game state
        this.particles.particles = [];
        if (this._confettiInterval) {
            clearInterval(this._confettiInterval);
            this._confettiInterval = null;
        }
        this.state = STATES.MENU;
        this.board = null;
        this.tracer = null;
        this.objectives = null;
        this.score = 0;
        this.lives = this.maxLives;
        this.cooldownUntil = null;
        this.solutionWords = [];
        this.hoveredSolution = null;
        this.feedbackMessage = null;
        this.wordsUsed = new Set();

        // Hide solution modal if visible
        document.getElementById('solution-modal').classList.add('hidden');

        // Show welcome screen
        this._showWelcomeScreen();
    }

    // ── Board state persistence ────────────────────────────────
    _hasMovesInProgress() {
        return this.state === STATES.PLAYING && this.board &&
            this.board.moveHistory.length > 0;
    }

    _boardStateKey(mode) {
        return 'boxters_board_state_' + (mode || this.selectedMode);
    }

    _saveBoardState() {
        if (!this.board || !this.player) return;
        const cells = this.board.field.getAllCells().map(c => ({
            q: c.q, r: c.r, letter: c.letter, cellType: c.cellType,
            isActive: c.isActive, isCleared: c.isCleared,
            isIlluminated: c.isIlluminated, usedInMove: c.usedInMove
        }));
        const objectivesState = this.objectives ? this.objectives.allObjectives.map(o => ({
            progress: o.progress, completed: o.completed
        })) : [];
        const snapshot = {
            levelIndex: this.levelIndex,
            selectedMode: this.selectedMode,
            cells,
            moveHistory: this.board.moveHistory,
            movesRemaining: this.board.movesRemaining,
            maxMoves: this.board.maxMoves,
            mode: this.board.mode,
            comboCount: this.board.comboCount,
            lastWordCellKeys: Array.from(this.board.lastWordCellKeys),
            wordsUsed: Array.from(this.wordsUsed),
            lives: this.lives,
            totalScore: this.totalScore,
            score: this.score,
            objectivesState
        };
        localStorage.setItem(this._boardStateKey(), JSON.stringify(snapshot));
    }

    _loadBoardState() {
        try {
            const raw = localStorage.getItem(this._boardStateKey());
            if (!raw) return null;
            return JSON.parse(raw);
        } catch { return null; }
    }

    _clearBoardState() {
        localStorage.removeItem(this._boardStateKey());
    }

    _restoreFromSnapshot(snapshot) {
        // Load the level structure (for levelData, objectives definitions, etc.)
        const result = loadLevel(snapshot.levelIndex);
        if (!result) return false;

        this.levelData = result.levelData;
        this.levelIndex = snapshot.levelIndex;
        this.selectedMode = snapshot.selectedMode;

        // Rebuild board from snapshot
        const board = result.board;
        board.moveHistory = snapshot.moveHistory || [];
        board.movesRemaining = snapshot.movesRemaining;
        board.maxMoves = snapshot.maxMoves;
        board.comboCount = snapshot.comboCount || 0;
        board.lastWordCellKeys = new Set(snapshot.lastWordCellKeys || []);

        // Restore cell state
        for (const saved of snapshot.cells) {
            const cell = board.field.getCell(saved.q, saved.r);
            if (cell) {
                cell.letter = saved.letter;
                cell.cellType = saved.cellType;
                cell.isActive = saved.isActive;
                cell.isCleared = saved.isCleared;
                cell.isIlluminated = saved.isIlluminated;
                cell.usedInMove = saved.usedInMove;
            }
        }

        this.board = board;
        this.wordsUsed = new Set(snapshot.wordsUsed || []);
        this.lives = snapshot.lives;
        this.totalScore = snapshot.totalScore || 0;

        // Restore objectives
        this.objectives = new ObjectiveTracker(this.levelData.objectives);
        if (snapshot.objectivesState) {
            const allObjs = this.objectives.allObjectives;
            for (let i = 0; i < Math.min(allObjs.length, snapshot.objectivesState.length); i++) {
                allObjs[i].progress = snapshot.objectivesState[i].progress;
                allObjs[i].completed = snapshot.objectivesState[i].completed;
            }
        }

        // Setup rendering
        const cellCount = this.board.field.getAllCells().length;
        this.renderer.calculateHexSize(cellCount);
        this.tracer = new WordTracer(this.board.field, dictionary);
        this.input.updateLayout(this.renderer.hexSize, this.renderer.boardOffset);

        this.score = snapshot.score || 0;
        this.stars = 0;
        this.tutorialMessage = null;
        this.feedbackMessage = null;
        this.solutionWords = [];
        this.hoveredSolution = null;
        return true;
    }

    _showFeedback(message) {
        this.feedbackMessage = message;
        this.feedbackTimer = 2.0;
    }

    // ── Game loop ───────────────────────────────────────────────
    _gameLoop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;

        this.particles.update(dt);

        if (this.board) {
            for (const cell of this.board.field.getAllCells()) {
                if (cell.glowIntensity > 0) {
                    cell.glowIntensity = Math.max(0, cell.glowIntensity - dt * 0.5);
                }
            }
        }

        if (this.feedbackTimer > 0) {
            this.feedbackTimer -= dt;
            if (this.feedbackTimer <= 0) {
                this.feedbackMessage = null;
            }
        }

        if (this.levelTransitionTimer > 0) {
            this.levelTransitionTimer -= dt;
        }

        const gameState = {
            state: this.state,
            board: this.board,
            levelData: this.levelData,
            tracer: this.tracer,
            objectives: this.objectives,
            score: this.score,
            totalScore: this.totalScore,
            stars: this.stars,
            lives: this.lives,
            maxLives: this.maxLives,
            playerName: this.player ? this.player.name : '',
            solutionWords: this.solutionWords,
            tutorialMessage: this.tutorialMessage,
            wordsFormed: Array.from(this.wordsUsed),
            modeLevelNum: this.levelIndex - getFirstLevelForMode(this.selectedMode) + 1,
            feedbackMessage: this.feedbackMessage,
            feedbackTimer: this.feedbackTimer,
            hoveredButton: this.hoveredButton,
            canGoForward: this.player && this.player.highestLevels
                && this.player.highestLevels[this.selectedMode] !== undefined
                && this.levelIndex < this.player.highestLevels[this.selectedMode],
            hoveredSolution: this.hoveredSolution,
            cooldownUntil: this.cooldownUntil,
            hasMovesInProgress: this._hasMovesInProgress(),
            isUltimateVictory: this.isUltimateVictory || false,
            audioEnabled: this.audio.enabled
        };

        this.renderer.render(gameState, dt, this.particles);

        requestAnimationFrame(this._boundLoop);
    }
}

// Boot
const game = new Game();
game.init().catch(err => console.error('Failed to initialize game:', err));
