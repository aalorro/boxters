import { axialToPixel, hexCorners, hexKey } from './hex.js';
import { COLORS, HEX, COMBO } from './constants.js';

// Polyfill roundRect for older browsers
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (typeof r === 'number') r = [r, r, r, r];
        const [tl, tr, br, bl] = r;
        this.moveTo(x + tl, y);
        this.lineTo(x + w - tr, y);
        this.quadraticCurveTo(x + w, y, x + w, y + tr);
        this.lineTo(x + w, y + h - br);
        this.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
        this.lineTo(x + bl, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - bl);
        this.lineTo(x, y + tl);
        this.quadraticCurveTo(x, y, x + tl, y);
        this.closePath();
        return this;
    };
}

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = 0;
        this.height = 0;
        this.hexSize = HEX.defaultSize;
        this.boardCenter = { x: 0, y: 0 };
        this.time = 0;
        this.traceGlowPhase = 0;
        this.resize();
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.displayWidth = rect.width;
        this.displayHeight = rect.height;
        this.boardCenter = { x: rect.width / 2, y: rect.height * 0.43 };
    }

    calculateHexSize(cellCount) {
        const minDim = Math.min(this.displayWidth, this.displayHeight);
        const radius = Math.ceil(Math.sqrt(cellCount / 3));
        const maxFit = (minDim * 0.38) / (radius * 1.8);
        this.hexSize = Math.max(HEX.minSize, Math.min(HEX.maxSize, maxFit));
        return this.hexSize;
    }

    get boardOffset() {
        return this.boardCenter;
    }

    render(gameState, dt, particles) {
        this.time += dt;
        this.traceGlowPhase += dt * 3;
        const ctx = this.ctx;

        // Keep board position fixed regardless of tutorial visibility
        this.boardCenter.y = this.displayHeight * 0.48;

        ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);
        this._drawBackground(ctx);

        if (particles) {
            particles.renderStars(ctx, this.displayWidth, this.displayHeight, this.time);
        }

        if (gameState.board) {
            this._drawField(ctx, gameState.board.field, gameState);
        }

        if (gameState.tracer && gameState.tracer.isActive && gameState.tracer.path.length > 0) {
            this._drawTrace(ctx, gameState.tracer, gameState);
        }

        if (particles) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            particles.renderParticles(ctx);
            ctx.restore();
        }

        this._drawUI(ctx, gameState);

        if (gameState.tutorialMessage) {
            this._drawTutorial(ctx, gameState.tutorialMessage);
        }

        if (gameState.feedbackMessage && gameState.feedbackTimer > 0) {
            this._drawFeedback(ctx, gameState.feedbackMessage, gameState.feedbackTimer);
        }

        // Draw info, logout, back, and forward buttons on canvas
        if (gameState.state === 'playing') {
            this._drawInfoButton(ctx);
            this._drawLogoutButton(ctx);
            this._drawBackButton(ctx, gameState);
            this._drawForwardButton(ctx, gameState);
            if (gameState.hoveredButton) {
                this._drawButtonTooltip(ctx, gameState.hoveredButton);
            }
        }

        if (gameState.state === 'victory') {
            this._drawVictoryOverlay(ctx, gameState);
        } else if (gameState.state === 'game_over') {
            this._drawGameOverOverlay(ctx, gameState);
        } else if (gameState.state === 'defeat') {
            this._drawDefeatOverlay(ctx, gameState);
        } else if (gameState.state === 'cooldown') {
            this._drawCooldownOverlay(ctx, gameState);
        }

        // Version footer
        ctx.font = "16px 'Inter', sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = 'rgba(255, 215, 0, 0.75)';
        ctx.fillText('v1.1.0', this.displayWidth / 2, this.displayHeight - 6);
    }

    _drawBackground(ctx) {
        const grad = ctx.createRadialGradient(
            this.displayWidth / 2, this.displayHeight / 2, 0,
            this.displayWidth / 2, this.displayHeight / 2, this.displayWidth * 0.7
        );
        grad.addColorStop(0, COLORS.background.mid);
        grad.addColorStop(1, COLORS.background.dark);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);
    }

    _drawField(ctx, field, gameState) {
        for (const cell of field.getAllCells()) {
            if (cell.isCleared) continue;
            this._drawHexCell(ctx, cell, gameState);
        }
    }

    _drawHexCell(ctx, cell, gameState) {
        const pos = axialToPixel(cell.q, cell.r, this.hexSize);
        const cx = this.boardCenter.x + pos.x;
        const cy = this.boardCenter.y + pos.y;
        const corners = hexCorners(cx, cy, this.hexSize - HEX.padding);

        const isInTrace = gameState.tracer && gameState.tracer.path.some(c => c.key === cell.key);
        const mode = gameState.board ? gameState.board.mode : 'simple';
        const isLastWordCell = mode === 'chain' && gameState.board &&
            gameState.board.lastWordCellKeys && gameState.board.lastWordCellKeys.has(cell.key);

        // Draw hex background
        ctx.beginPath();
        ctx.moveTo(corners[0].x, corners[0].y);
        for (let i = 1; i < 6; i++) {
            ctx.lineTo(corners[i].x, corners[i].y);
        }
        ctx.closePath();

        // Fill based on state
        if (isInTrace) {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        } else if (isLastWordCell) {
            const pulse = 0.12 + 0.06 * Math.sin(this.time * 3);
            ctx.fillStyle = `rgba(100, 200, 255, ${pulse})`;
        } else if (cell.isIlluminated && mode === 'illuminate') {
            ctx.fillStyle = COLORS.modes.illuminate.lit;
        } else if (cell.isIlluminated) {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        } else {
            ctx.fillStyle = 'rgba(253, 244, 227, 0.08)';
        }
        ctx.fill();

        // Glow effect
        if (cell.glowIntensity > 0) {
            ctx.shadowBlur = HEX.glowRadius * cell.glowIntensity;
            ctx.shadowColor = COLORS.board.glow;
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Border
        if (isInTrace) {
            ctx.strokeStyle = COLORS.board.stroke;
            ctx.lineWidth = HEX.rimWidth + 1.5;
        } else if (isLastWordCell) {
            const pulseAlpha = 0.5 + 0.3 * Math.sin(this.time * 3);
            ctx.strokeStyle = `rgba(100, 200, 255, ${pulseAlpha})`;
            ctx.lineWidth = HEX.rimWidth + 1.5;
        } else {
            ctx.strokeStyle = this._getCellRimColor(cell);
            ctx.lineWidth = cell.isAnchor ? HEX.rimWidth + 1 : HEX.rimWidth;
        }
        ctx.stroke();

        // Cell type indicator
        if (cell.isAnchor) {
            this._drawCellTypeIndicator(ctx, cx, cy, COLORS.anchor.rim, 'anchor');
        }

        // Letter
        if (cell.letter) {
            const fontSize = this.hexSize * HEX.letterSize;
            ctx.font = `bold ${fontSize}px 'Inter', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            if (isInTrace) {
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 8;
                ctx.shadowColor = COLORS.board.glow;
            } else {
                ctx.fillStyle = '#ffdd00';
                ctx.shadowBlur = 4;
                ctx.shadowColor = COLORS.board.glow;
            }

            ctx.fillText(cell.letter, cx, cy);
            ctx.shadowBlur = 0;
        }
    }

    _getCellRimColor(cell) {
        if (cell.isAnchor) return COLORS.anchor.rim;
        return COLORS.board.stroke + '80';
    }

    _drawCellTypeIndicator(ctx, cx, cy, color, type) {
        const y = cy + this.hexSize * 0.55;
        ctx.fillStyle = color;
        if (type === 'anchor') {
            const s = 4;
            ctx.beginPath();
            ctx.moveTo(cx, y - s);
            ctx.lineTo(cx + s, y);
            ctx.lineTo(cx, y + s);
            ctx.lineTo(cx - s, y);
            ctx.closePath();
            ctx.fill();
        }
    }

    _drawTrace(ctx, tracer) {
        if (tracer.path.length < 1) return;

        const points = tracer.path.map(cell => {
            const pos = axialToPixel(cell.q, cell.r, this.hexSize);
            return { x: this.boardCenter.x + pos.x, y: this.boardCenter.y + pos.y };
        });

        let traceColor;
        if (tracer.isValidWord) {
            traceColor = COLORS.trace.valid;
        } else if (tracer.isValidPrefix) {
            traceColor = COLORS.trace.prefix;
        } else {
            traceColor = COLORS.trace.invalid;
        }

        ctx.save();

        if (points.length >= 2) {
            // Outer glow
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.strokeStyle = traceColor;
            ctx.lineWidth = 10;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalAlpha = 0.35;
            ctx.shadowBlur = 20;
            ctx.shadowColor = traceColor;
            ctx.stroke();

            // Core line
            ctx.globalAlpha = 1.0;
            ctx.lineWidth = 5;
            ctx.shadowBlur = 15;
            ctx.stroke();

            // Animated highlight dot
            const highlightPos = (this.traceGlowPhase % 1);
            const totalLen = points.length - 1;
            const segIdx = Math.floor(highlightPos * totalLen);
            const segT = (highlightPos * totalLen) - segIdx;
            if (segIdx < points.length - 1) {
                const hx = points[segIdx].x + (points[segIdx + 1].x - points[segIdx].x) * segT;
                const hy = points[segIdx].y + (points[segIdx + 1].y - points[segIdx].y) * segT;
                ctx.beginPath();
                ctx.arc(hx, hy, 7, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 25;
                ctx.shadowColor = traceColor;
                ctx.fill();
            }
        }

        // Node dots at each cell
        for (let i = 0; i < points.length; i++) {
            ctx.beginPath();
            ctx.arc(points[i].x, points[i].y, 6, 0, Math.PI * 2);
            ctx.fillStyle = traceColor;
            ctx.globalAlpha = 1.0;
            ctx.shadowBlur = 12;
            ctx.shadowColor = traceColor;
            ctx.fill();

            // White center dot
            ctx.beginPath();
            ctx.arc(points[i].x, points[i].y, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 0;
            ctx.fill();
        }

        ctx.restore();
    }

    _drawUI(ctx, gameState) {
        if (!gameState.levelData) return;

        const padding = 20;

        // Top bar background
        ctx.fillStyle = COLORS.ui.panel;
        ctx.fillRect(0, 0, this.displayWidth, 75);
        ctx.strokeStyle = COLORS.ui.panelBorder;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 75);
        ctx.lineTo(this.displayWidth, 75);
        ctx.stroke();

        // Level name
        ctx.font = "bold 21px 'Cinzel', serif";
        ctx.fillStyle = COLORS.ui.accent;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(gameState.levelData.name, padding, 26);

        // Mode badge with level number
        const mode = gameState.board ? gameState.board.mode : 'simple';
        const modeColor = COLORS.modes[mode]?.accent || COLORS.ui.textDim;
        const lvlNum = gameState.modeLevelNum || '';
        ctx.font = "16px 'Inter', sans-serif";
        ctx.fillStyle = modeColor;
        ctx.fillText(`${mode.toUpperCase()}${lvlNum ? ` (LVL ${lvlNum})` : ''}`, padding, 56);

        // Right column — all right-aligned
        ctx.textAlign = 'right';
        const rightX = this.displayWidth - padding;

        // Lives (top right row)
        if (gameState.lives !== undefined) {
            ctx.font = "20px sans-serif";
            const livesStr = '♥'.repeat(gameState.lives) + '♡'.repeat(gameState.maxLives - gameState.lives);
            ctx.fillStyle = COLORS.ui.error;
            ctx.fillText(livesStr, rightX, 16);
        }

        // Moves remaining
        ctx.font = "bold 20px 'Inter', sans-serif";
        ctx.fillStyle = COLORS.ui.text;
        const movesText = `${gameState.board ? gameState.board.movesRemaining : 0} moves`;
        ctx.fillText(movesText, rightX, 36);

        // Running total score
        ctx.font = "16px 'Inter', sans-serif";
        ctx.fillStyle = COLORS.ui.accent;
        const totalDisplay = (gameState.totalScore || 0) + (gameState.score || 0);
        ctx.fillText(`Total: ${totalDisplay}`, rightX, 54);

        // Level score
        ctx.font = "13px 'Inter', sans-serif";
        ctx.fillStyle = COLORS.ui.textDim;
        ctx.fillText(`Level: ${gameState.score || 0}`, rightX, 69);

        // Mode-specific HUD elements (center area)
        if (gameState.board) {
            ctx.textAlign = 'center';
            if (mode === 'chain' && gameState.board.comboCount > 0) {
                ctx.font = "bold 20px 'Inter', sans-serif";
                ctx.fillStyle = COLORS.modes.chain.combo;
                const comboMult = COMBO.multipliers[Math.min(gameState.board.comboCount, COMBO.maxCombo)];
                ctx.fillText(`COMBO x${comboMult}`, this.displayWidth / 2, 56);
            }

            if (mode === 'illuminate') {
                const allCells = gameState.board.field.getAllCells();
                const illuminated = allCells.filter(c => c.isIlluminated).length;
                const pct = Math.floor((illuminated / allCells.length) * 100);
                ctx.font = "18px 'Inter', sans-serif";
                ctx.fillStyle = COLORS.modes.illuminate.accent;
                ctx.textAlign = 'center';
                ctx.fillText(`${pct}% lit`, this.displayWidth / 2, 56);
            }

            if (mode === 'clear') {
                const allCells = gameState.board.field.getAllCells();
                const cleared = allCells.filter(c => c.isCleared).length;
                const remaining = allCells.length - cleared;
                ctx.font = "18px 'Inter', sans-serif";
                ctx.fillStyle = COLORS.modes.clear.accent;
                ctx.textAlign = 'center';
                ctx.fillText(`${remaining} cells left`, this.displayWidth / 2, 56);
            }
        }

        // Objectives panel (bottom)
        this._drawObjectives(ctx, gameState);

        // Words formed list (above objectives)
        if (gameState.wordsFormed && gameState.wordsFormed.length > 0) {
            this._drawWordsFormed(ctx, gameState);
        }

        // Word tray
        if (gameState.tracer && gameState.tracer.isActive && gameState.tracer.path.length > 0) {
            this._drawWordTray(ctx, gameState.tracer);
        }
    }

    _drawObjectives(ctx, gameState) {
        if (!gameState.objectives) return;

        const allObjs = gameState.objectives.allObjectives;
        if (allObjs.length === 0) return;

        const y = this.displayHeight - 90;
        const padding = 16;

        ctx.fillStyle = COLORS.ui.panel;
        ctx.fillRect(0, y - 10, this.displayWidth, 100);
        ctx.strokeStyle = COLORS.ui.panelBorder;
        ctx.beginPath();
        ctx.moveTo(0, y - 10);
        ctx.lineTo(this.displayWidth, y - 10);
        ctx.stroke();

        ctx.font = "18px 'Inter', sans-serif";
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        for (let i = 0; i < allObjs.length; i++) {
            const obj = allObjs[i];
            const ox = padding;
            const oy = y + i * 30 + 15;

            if (obj.completed) {
                ctx.fillStyle = COLORS.ui.success;
                ctx.fillText('✓', ox, oy);
            } else {
                ctx.fillStyle = COLORS.ui.textDim;
                ctx.fillText('○', ox, oy);
            }

            ctx.fillStyle = obj.completed ? COLORS.ui.success : COLORS.ui.text;
            ctx.fillText(obj.description, ox + 24, oy);

            if (obj.target > 1) {
                ctx.fillStyle = obj.completed ? COLORS.ui.success : COLORS.ui.accent;
                ctx.textAlign = 'right';
                ctx.fillText(`(${obj.progress}/${obj.target})`, this.displayWidth - padding, oy);
                ctx.textAlign = 'left';
            }
        }
    }

    _drawWordsFormed(ctx, gameState) {
        const words = gameState.wordsFormed;
        const centerX = this.displayWidth / 2;
        // Position above the objectives panel
        const baseY = this.displayHeight - 110;

        ctx.font = "bold 16px 'Inter', sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Lay out words as numbered pills in a row, wrapping if needed
        const pillPadding = 12;
        const pillGap = 8;
        const pillHeight = 27;
        const rowGap = 8;

        // Measure all pills
        const pills = words.map((w, i) => {
            const label = `${i + 1}. ${w}`;
            const tw = ctx.measureText(label).width + pillPadding * 2;
            return { label, width: tw };
        });

        // Arrange into rows
        const maxRowWidth = this.displayWidth - 40;
        const rows = [];
        let currentRow = [];
        let currentWidth = 0;
        for (const pill of pills) {
            if (currentRow.length > 0 && currentWidth + pillGap + pill.width > maxRowWidth) {
                rows.push(currentRow);
                currentRow = [pill];
                currentWidth = pill.width;
            } else {
                if (currentRow.length > 0) currentWidth += pillGap;
                currentRow.push(pill);
                currentWidth += pill.width;
            }
        }
        if (currentRow.length > 0) rows.push(currentRow);

        // Draw rows from bottom up (newest words at bottom, near objectives)
        const totalHeight = rows.length * (pillHeight + rowGap) - rowGap;
        let drawY = baseY - totalHeight;

        for (const row of rows) {
            const rowWidth = row.reduce((s, p) => s + p.width, 0) + (row.length - 1) * pillGap;
            let x = centerX - rowWidth / 2;

            for (const pill of row) {
                ctx.fillStyle = 'rgba(10, 10, 46, 0.75)';
                ctx.beginPath();
                ctx.roundRect(x, drawY, pill.width, pillHeight, pillHeight / 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.fillStyle = COLORS.ui.accent;
                ctx.fillText(pill.label, x + pill.width / 2, drawY + pillHeight / 2);

                x += pill.width + pillGap;
            }
            drawY += pillHeight + rowGap;
        }
    }

    _drawWordTray(ctx, tracer) {
        const word = tracer.currentWord;
        const centerX = this.displayWidth / 2;
        const y = this.displayHeight - 130;

        const textWidth = word.length * 27 + 45;
        ctx.fillStyle = COLORS.ui.panel;
        ctx.beginPath();
        ctx.roundRect(centerX - textWidth / 2, y - 22, textWidth, 44, 22);
        ctx.fill();

        if (tracer.isValidWord) {
            ctx.strokeStyle = COLORS.ui.success;
        } else if (tracer.isValidPrefix) {
            ctx.strokeStyle = COLORS.trace.prefix;
        } else {
            ctx.strokeStyle = COLORS.ui.error;
        }
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = "bold 27px 'Inter', sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = tracer.isValidWord ? COLORS.ui.success : COLORS.ui.text;
        ctx.fillText(word, centerX, y);
    }

    _drawTutorial(ctx, message) {
        const centerX = this.displayWidth / 2;
        const maxWidth = this.displayWidth - 48;
        const lineHeight = 24;
        const paddingX = 18;
        const paddingY = 12;
        const topY = 88;

        ctx.font = "18px 'Inter', sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Word-wrap the message
        const words = message.split(' ');
        const lines = [];
        let currentLine = words[0];
        for (let i = 1; i < words.length; i++) {
            const test = currentLine + ' ' + words[i];
            if (ctx.measureText(test).width <= maxWidth) {
                currentLine = test;
            } else {
                lines.push(currentLine);
                currentLine = words[i];
            }
        }
        lines.push(currentLine);

        const boxW = Math.min(maxWidth + paddingX * 2,
            Math.max(...lines.map(l => ctx.measureText(l).width)) + paddingX * 2);
        const boxH = lines.length * lineHeight + paddingY * 2;

        ctx.fillStyle = 'rgba(10, 10, 46, 0.9)';
        ctx.beginPath();
        ctx.roundRect(centerX - boxW / 2, topY, boxW, boxH, 12);
        ctx.fill();
        ctx.strokeStyle = COLORS.ui.panelBorder;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = COLORS.ui.text;
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], centerX, topY + paddingY + i * lineHeight + lineHeight / 2);
        }
    }

    _drawVictoryOverlay(ctx, gameState) {
        ctx.fillStyle = 'rgba(5, 5, 32, 0.7)';
        ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);

        const centerX = this.displayWidth / 2;
        const centerY = this.displayHeight / 2;
        const isUltimate = gameState.isUltimateVictory;

        if (isUltimate) {
            // Mode completion — final level of any mode
            const mode = gameState.board?.mode || 'simple';
            const titles = {
                simple: 'WORD MASTER',
                clear: 'BOARD SWEEPER',
                chain: 'CHAIN LEGEND',
                illuminate: 'MASTER OF LIGHT'
            };
            const subtitles = {
                simple: 'You have conquered every Simple challenge!',
                clear: 'You have swept every Clear challenge!',
                chain: 'You have chained every Chain challenge!',
                illuminate: 'You have conquered every Illuminate challenge!'
            };
            const accent = COLORS.modes[mode]?.accent || '#ffd700';
            const glow = COLORS.modes[mode]?.glow || 'rgba(255, 215, 0, 0.8)';
            const pulse = 0.5 + 0.5 * Math.sin(this.time * 2);

            ctx.font = "bold 44px 'Cinzel', serif";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = accent;
            ctx.shadowBlur = 25 + 10 * pulse;
            ctx.shadowColor = glow;
            ctx.fillText(titles[mode], centerX, centerY - 80);
            ctx.shadowBlur = 0;

            ctx.font = "20px 'Inter', sans-serif";
            ctx.fillStyle = accent;
            ctx.globalAlpha = 0.8;
            ctx.fillText(subtitles[mode], centerX, centerY - 30);
            ctx.globalAlpha = 1;

            ctx.font = "30px 'Inter', sans-serif";
            ctx.fillStyle = COLORS.ui.text;
            ctx.fillText(`Score: ${gameState.score || 0}`, centerX, centerY + 20);

            const stars = gameState.stars || 1;
            ctx.font = "42px sans-serif";
            const starText = '\u2605'.repeat(stars) + '\u2606'.repeat(3 - stars);
            ctx.fillStyle = COLORS.ui.accent;
            ctx.fillText(starText, centerX, centerY + 75);

            ctx.font = "21px 'Inter', sans-serif";
            ctx.fillStyle = COLORS.ui.textDim;
            ctx.fillText('Click anywhere to continue', centerX, centerY + 130);
        } else {
            const modeNames = { simple: 'COMPLETE', clear: 'CLEARED', chain: 'CHAINED', illuminate: 'ILLUMINATED' };
            const mode = gameState.board?.mode || 'simple';

            ctx.font = "bold 54px 'Cinzel', serif";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = COLORS.modes[mode]?.accent || COLORS.ui.accent;
            ctx.shadowBlur = 20;
            ctx.shadowColor = COLORS.modes[mode]?.glow || COLORS.board.glow;
            ctx.fillText(modeNames[mode] || 'COMPLETE', centerX, centerY - 55);
            ctx.shadowBlur = 0;

            ctx.font = "30px 'Inter', sans-serif";
            ctx.fillStyle = COLORS.ui.text;
            ctx.fillText(`Score: ${gameState.score || 0}`, centerX, centerY + 5);

            const stars = gameState.stars || 1;
            ctx.font = "42px sans-serif";
            const starText = '\u2605'.repeat(stars) + '\u2606'.repeat(3 - stars);
            ctx.fillStyle = COLORS.ui.accent;
            ctx.fillText(starText, centerX, centerY + 60);

            ctx.font = "21px 'Inter', sans-serif";
            ctx.fillStyle = COLORS.ui.textDim;
            ctx.fillText('Click anywhere to continue', centerX, centerY + 115);
        }
    }

    _hexToPixel(q, r) {
        const pos = axialToPixel(q, r, this.hexSize);
        return { x: this.boardCenter.x + pos.x, y: this.boardCenter.y + pos.y };
    }

    _drawSolutionHighlight(ctx, solution) {
        if (!solution || !solution.path || solution.path.length === 0) return;

        ctx.save();

        ctx.beginPath();
        const first = this._hexToPixel(solution.path[0].q, solution.path[0].r);
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < solution.path.length; i++) {
            const pos = this._hexToPixel(solution.path[i].q, solution.path[i].r);
            ctx.lineTo(pos.x, pos.y);
        }
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 12;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
        ctx.stroke();

        for (let i = 0; i < solution.path.length; i++) {
            const pos = this._hexToPixel(solution.path[i].q, solution.path[i].r);

            ctx.beginPath();
            ctx.arc(pos.x, pos.y, this.hexSize * 0.42, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
            ctx.fill();
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2.5;
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
            ctx.stroke();

            ctx.shadowBlur = 0;
            ctx.font = "bold 15px 'Inter', sans-serif";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffd700';
            ctx.fillText(String(i + 1), pos.x + this.hexSize * 0.32, pos.y - this.hexSize * 0.32);
        }

        ctx.restore();
    }

    _drawDefeatOverlay(ctx, gameState) {
        ctx.fillStyle = 'rgba(5, 5, 32, 0.45)';
        ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);

        if (gameState.board) {
            this._drawBoardGhost(ctx, gameState.board);
        }

        if (gameState.hoveredSolution) {
            this._drawSolutionHighlight(ctx, gameState.hoveredSolution);
        }
    }

    _drawGameOverOverlay(ctx, gameState) {
        ctx.fillStyle = 'rgba(5, 5, 32, 0.5)';
        ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);

        if (gameState.board) {
            this._drawBoardGhost(ctx, gameState.board);
        }

        if (gameState.hoveredSolution) {
            this._drawSolutionHighlight(ctx, gameState.hoveredSolution);
        }
    }

    _drawBoardGhost(ctx, board) {
        const field = board.field;
        const isIlluminate = board.mode === 'illuminate';
        ctx.save();
        for (const cell of field.getAllCells()) {
            if (cell.isCleared) continue;
            const pos = axialToPixel(cell.q, cell.r, this.hexSize);
            const cx = this.boardCenter.x + pos.x;
            const cy = this.boardCenter.y + pos.y;
            const corners = hexCorners(cx, cy, this.hexSize - HEX.padding);
            const unlit = isIlluminate && !cell.isIlluminated;
            const pulse = unlit ? 0.5 + 0.5 * Math.sin(this.time * 3) : 0;

            // Hex outline
            ctx.beginPath();
            ctx.moveTo(corners[0].x, corners[0].y);
            for (let i = 1; i < 6; i++) {
                ctx.lineTo(corners[i].x, corners[i].y);
            }
            ctx.closePath();

            if (unlit) {
                ctx.fillStyle = `rgba(255, 80, 80, ${0.08 + 0.12 * pulse})`;
                ctx.fill();
                ctx.strokeStyle = `rgba(255, 80, 80, ${0.4 + 0.4 * pulse})`;
                ctx.lineWidth = HEX.rimWidth + 1;
                ctx.shadowBlur = 8 * pulse;
                ctx.shadowColor = 'rgba(255, 80, 80, 0.6)';
            } else {
                ctx.fillStyle = 'rgba(253, 244, 227, 0.08)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(253, 244, 227, 0.35)';
                ctx.lineWidth = HEX.rimWidth;
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Letter
            if (cell.letter) {
                const fontSize = this.hexSize * HEX.letterSize;
                ctx.font = `bold ${fontSize}px 'Inter', sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                if (unlit) {
                    ctx.fillStyle = `rgba(255, 100, 100, ${0.6 + 0.4 * pulse})`;
                } else {
                    ctx.fillStyle = 'rgba(255, 221, 0, 0.65)';
                }
                ctx.fillText(cell.letter, cx, cy);
            }
        }
        ctx.restore();
    }

    _drawCooldownOverlay(ctx, gameState) {
        ctx.fillStyle = 'rgba(5, 5, 32, 0.92)';
        ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);

        const centerX = this.displayWidth / 2;
        const centerY = this.displayHeight / 2;

        // Title
        ctx.font = "bold 32px 'Cinzel', serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = COLORS.ui.error;
        ctx.fillText('Out of Lives', centerX, centerY - 60);

        // Countdown
        const remaining = Math.max(0, (gameState.cooldownUntil || 0) - Date.now());
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

        if (remaining > 0) {
            ctx.font = "18px 'Inter', sans-serif";
            ctx.fillStyle = COLORS.ui.textDim;
            ctx.fillText('Take a break. You can retry in', centerX, centerY - 10);

            ctx.font = "bold 48px 'Cinzel', serif";
            ctx.fillStyle = COLORS.ui.accent;
            ctx.shadowBlur = 16;
            ctx.shadowColor = 'rgba(255, 215, 0, 0.3)';
            ctx.fillText(timeStr, centerX, centerY + 45);
            ctx.shadowBlur = 0;
        } else {
            ctx.font = "20px 'Inter', sans-serif";
            ctx.fillStyle = COLORS.ui.accent;
            ctx.fillText('Click anywhere to continue', centerX, centerY + 10);
        }
    }

    _drawFeedback(ctx, message, timer) {
        const alpha = Math.min(1, timer);
        const centerX = this.displayWidth / 2;
        const y = this.displayHeight * 0.28;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = "bold 22px 'Inter', sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const metrics = ctx.measureText(message);
        const tw = metrics.width + 36;
        ctx.fillStyle = 'rgba(10, 10, 46, 0.85)';
        ctx.beginPath();
        ctx.roundRect(centerX - tw / 2, y - 18, tw, 36, 18);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.4)';
        ctx.fillText(message, centerX, y);
        ctx.restore();
    }

    _drawInfoButton(ctx) {
        const r = 14;
        // Position to the left of the right-column scores
        ctx.font = "16px 'Inter', sans-serif";
        const sampleWidth = ctx.measureText('Total: 00000').width;
        const cx = this.displayWidth - 20 - sampleWidth - r - 10;
        const cy = 54;
        this._infoBtnPos = { x: cx, y: cy, r: r };

        ctx.save();

        // Circle background
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // "i" letter in gold
        ctx.font = "bold 16px 'Inter', sans-serif";
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('i', cx, cy + 1);

        ctx.restore();
    }

    _drawLogoutButton(ctx) {
        if (!this._infoBtnPos) return;
        const r = 14;
        const cx = this._infoBtnPos.x - r * 2 - 8;
        const cy = this._infoBtnPos.y;
        this._logoutBtnPos = { x: cx, y: cy, r: r };

        ctx.save();

        // Circle background
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Door-exit arrow icon
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        // Arrow pointing right
        ctx.beginPath();
        ctx.moveTo(cx + 1, cy);
        ctx.lineTo(cx + 7, cy);
        ctx.moveTo(cx + 4, cy - 4);
        ctx.lineTo(cx + 7, cy);
        ctx.lineTo(cx + 4, cy + 4);
        ctx.stroke();
        // Door frame
        ctx.beginPath();
        ctx.moveTo(cx - 1, cy - 7);
        ctx.lineTo(cx - 6, cy - 7);
        ctx.lineTo(cx - 6, cy + 7);
        ctx.lineTo(cx - 1, cy + 7);
        ctx.stroke();

        ctx.restore();
    }

    _drawBackButton(ctx, gameState) {
        if (!this._logoutBtnPos) return;
        // Hide when on first level or when moves are in progress
        if (gameState.modeLevelNum <= 1 || gameState.hasMovesInProgress) {
            this._backBtnPos = null;
            return;
        }
        const r = 14;
        const cx = this._logoutBtnPos.x - r * 2 - 8;
        const cy = this._logoutBtnPos.y;
        this._backBtnPos = { x: cx, y: cy, r: r };

        ctx.save();

        // Circle background
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Left arrow icon
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(cx + 5, cy);
        ctx.lineTo(cx - 5, cy);
        ctx.moveTo(cx - 2, cy - 4);
        ctx.lineTo(cx - 5, cy);
        ctx.lineTo(cx - 2, cy + 4);
        ctx.stroke();

        ctx.restore();
    }

    isBackButtonHit(x, y) {
        if (!this._backBtnPos) return false;
        const dx = x - this._backBtnPos.x;
        const dy = y - this._backBtnPos.y;
        return (dx * dx + dy * dy) <= (this._backBtnPos.r + 8) * (this._backBtnPos.r + 8);
    }

    _drawForwardButton(ctx, gameState) {
        if (!this._logoutBtnPos) return;
        // Hide when at highest level or when moves are in progress
        if (!gameState.canGoForward || gameState.hasMovesInProgress) {
            this._forwardBtnPos = null;
            return;
        }
        const r = 14;
        // Position to the left of back button (or logout if back is hidden)
        const anchor = this._backBtnPos || this._logoutBtnPos;
        const cx = anchor.x - r * 2 - 8;
        const cy = anchor.y;
        this._forwardBtnPos = { x: cx, y: cy, r: r };

        ctx.save();

        // Circle background
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Right arrow icon
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - 5, cy);
        ctx.lineTo(cx + 5, cy);
        ctx.moveTo(cx + 2, cy - 4);
        ctx.lineTo(cx + 5, cy);
        ctx.lineTo(cx + 2, cy + 4);
        ctx.stroke();

        ctx.restore();
    }

    isForwardButtonHit(x, y) {
        if (!this._forwardBtnPos) return false;
        const dx = x - this._forwardBtnPos.x;
        const dy = y - this._forwardBtnPos.y;
        return (dx * dx + dy * dy) <= (this._forwardBtnPos.r + 8) * (this._forwardBtnPos.r + 8);
    }

    _drawButtonTooltip(ctx, which) {
        let pos, label;
        if (which === 'info') { pos = this._infoBtnPos; label = 'Info'; }
        else if (which === 'logout') { pos = this._logoutBtnPos; label = 'Menu'; }
        else if (which === 'back') { pos = this._backBtnPos; label = 'Prev Level'; }
        else if (which === 'forward') { pos = this._forwardBtnPos; label = 'Next Level'; }
        if (!pos) return;

        ctx.save();
        ctx.font = "12px 'Inter', sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        const tw = ctx.measureText(label).width + 12;
        const th = 22;
        const tx = pos.x;
        const ty = pos.y + pos.r + 6;

        ctx.fillStyle = 'rgba(10, 10, 46, 0.95)';
        ctx.beginPath();
        ctx.roundRect(tx - tw / 2, ty, tw, th, 4);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#ffd700';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, tx, ty + th / 2);
        ctx.restore();
    }

    isInfoButtonHit(x, y) {
        if (!this._infoBtnPos) return false;
        const dx = x - this._infoBtnPos.x;
        const dy = y - this._infoBtnPos.y;
        return (dx * dx + dy * dy) <= (this._infoBtnPos.r + 8) * (this._infoBtnPos.r + 8);
    }

    isLogoutButtonHit(x, y) {
        if (!this._logoutBtnPos) return false;
        const dx = x - this._logoutBtnPos.x;
        const dy = y - this._logoutBtnPos.y;
        return (dx * dx + dy * dy) <= (this._logoutBtnPos.r + 8) * (this._logoutBtnPos.r + 8);
    }

    getCellPixelPos(q, r) {
        const pos = axialToPixel(q, r, this.hexSize);
        return { x: this.boardCenter.x + pos.x, y: this.boardCenter.y + pos.y };
    }
}
