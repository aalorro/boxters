import { pixelToAxial, hexKey } from './hex.js';

export class InputManager {
    constructor(canvas, hexSize, boardOffset) {
        this.canvas = canvas;
        this.hexSize = hexSize;
        this.boardOffset = boardOffset;
        this.isTracing = false;
        this._activePointerId = null;
        this.listeners = {
            traceStart: [],
            traceMove: [],
            traceEnd: [],
            hover: [],
            click: [],
            dialDrag: []
        };
        this._pointerPos = { x: 0, y: 0 };
        this._setupEvents();
    }

    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    _emit(event, data) {
        for (const cb of this.listeners[event] || []) {
            cb(data);
        }
    }

    updateLayout(hexSize, boardOffset) {
        this.hexSize = hexSize;
        this.boardOffset = boardOffset;
    }

    _getCanvasPos(e) {
        const rect = this.canvas.getBoundingClientRect();

        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        // Return CSS-pixel coordinates (renderer draws in CSS pixels via DPR transform)
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    _canvasPosToHex(canvasPos) {
        // Convert canvas pixel position to hex axial coordinates
        const relX = canvasPos.x - this.boardOffset.x;
        const relY = canvasPos.y - this.boardOffset.y;
        return pixelToAxial(relX, relY, this.hexSize);
    }

    _setupEvents() {
        this._abortController = new AbortController();
        const opts = { signal: this._abortController.signal };

        // Use pointer events for unified mouse/touch handling
        this.canvas.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.canvas.setPointerCapture(e.pointerId);
            this._activePointerId = e.pointerId;
            this.isTracing = true;
            const pos = this._getCanvasPos(e);
            this._pointerPos = pos;
            const hex = this._canvasPosToHex(pos);
            this._emit('traceStart', { hex, pos, key: hexKey(hex.q, hex.r) });
        }, opts);

        this.canvas.addEventListener('pointermove', (e) => {
            e.preventDefault();
            const pos = this._getCanvasPos(e);
            this._pointerPos = pos;
            if (this.isTracing) {
                const hex = this._canvasPosToHex(pos);
                this._emit('traceMove', { hex, pos, key: hexKey(hex.q, hex.r) });
            } else {
                this._emit('hover', { pos });
            }
        }, opts);

        this.canvas.addEventListener('pointerup', (e) => {
            e.preventDefault();
            if (this.isTracing) {
                this.isTracing = false;
                const pos = this._getCanvasPos(e);
                const hex = this._canvasPosToHex(pos);
                this._emit('traceEnd', { hex, pos, key: hexKey(hex.q, hex.r) });
            }
        }, opts);

        this.canvas.addEventListener('pointercancel', (e) => {
            if (this.isTracing) {
                this.isTracing = false;
                this._emit('traceEnd', { hex: { q: 0, r: 0 }, pos: this._pointerPos, key: '0,0', cancelled: true });
            }
        }, opts);

        // Prevent context menu on long press
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault(), opts);
    }

    destroy() {
        if (this._abortController) {
            this._abortController.abort();
            this._abortController = null;
        }
        this.listeners = { traceStart: [], traceMove: [], traceEnd: [], hover: [], click: [], dialDrag: [] };
    }

    cancelTrace() {
        this.isTracing = false;
        if (this._activePointerId != null) {
            try { this.canvas.releasePointerCapture(this._activePointerId); } catch (e) {}
            this._activePointerId = null;
        }
    }

    get pointerPosition() {
        return this._pointerPos;
    }
}
