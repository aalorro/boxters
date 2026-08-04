# CLAUDE.md — Project Guide for Lexicon

## Overview

Lexicon is a hex-grid word puzzle game built with vanilla JS and HTML5 Canvas. No frameworks, no build step, no dependencies. Serve statically and open in a browser.

## Key Commands

```bash
# Run locally (any static server works)
python -m http.server 8000
npx serve .
```

There are no tests, linters, or build scripts. Changes take effect on browser reload.

## Cache Busting

The script tag in `index.html` uses a query string for cache busting:
```html
<script type="module" src="js/main.js?v=13">
```
**Bump the version number** after any JS change to ensure browsers pick up the new code. Same for `style.css?v=7`.

## Architecture

### Entry Point
- `index.html` — contains HTML overlays (loading, register, welcome screens), the info dialog, and inline JS for the dialog. Loads `js/main.js` as an ES module.

### Core Files
| File | Role |
|------|------|
| `js/main.js` | Game class — state machine, game loop, event wiring, all game logic |
| `js/renderer.js` | All canvas drawing — board, hexes, UI bar, tooltips, overlays, effects |
| `js/input.js` | InputManager — pointer events, tracing, hover, button hit detection |
| `js/levels.js` | LEVEL_DATA array (56 levels), board generation (random + word-first), `loadLevel()` |
| `js/board.js` | Data structures: HexCell, Field (hex grid), Board (game state) |
| `js/hex.js` | Hex math — axial coordinates, pixel conversion, neighbor calculation, spiral generation |
| `js/scoring.js` | `calculateLevelScore()`, `calculateMoveScore()`, `getStars()` |
| `js/objectives.js` | Objective tracker — formWord, clearAllCells, useAllCells, achieveCombo, illuminateAnchors, illuminatePercent |
| `js/constants.js` | All config: MODES, COLORS, HEX geometry, LETTER_VALUES, SCORING, STATES |
| `js/tracer.js` | Word path tracing logic |
| `js/particles.js` | Particle effect system for visual feedback |
| `js/dictionary.js` | Word list array and dictionary lookup |

### Game States
`LOADING → MENU → LEVEL_INTRO → PLAYING → SUBMITTING → VICTORY/DEFEAT → GAME_OVER → COOLDOWN`

### Game Modes
- **simple** — form words, tiles persist
- **clear** — form words, tiles removed; clusters <3 auto-clear
- **chain** — tiles get new letters after each word; overlap positions for combos
- **illuminate** — tiles light up permanently when used; cover all to win

### Hex System
Pointy-top hexagons using axial coordinates (q, r). Board sizes: hex1 (7 cells, radius 1), hex2 (19 cells, radius 2), hex3 (37 cells, radius 3).

### Scoring
`score = (baseTier + letterTotal + unusedMoves×15 + secondaryBonus) × tierMultiplier × levelScoreMult`

Each level has a `scoreMult` field (0.4 for level 1, ramping to 1.0 by level 10) so early levels produce proportionally lower scores.

### Persistence
Player profile stored in `localStorage` key `lexicon_player`. Contains: name, gamesPlayed, levelsCompleted, totalScore, currentLevels, highestLevels, cooldownUntil, sessionActive, unlockedModes.

## Important Patterns

- **Renderer draws in CSS pixels** — DPR scaling is handled via canvas transform, so all coordinates are CSS pixels.
- **InputManager uses pointer capture** — `setPointerCapture` on pointerdown. Must call `cancelTrace()` before handling UI button clicks (info, logout, back, forward).
- **Board generation**: Simple mode uses word-first generation (places dictionary words then fills gaps). Other modes use random letters + solvability check with retry loop.
- **Canvas UI buttons** (info, logout, back, forward) are drawn by renderer and hit-tested in main.js traceStart handler. They are not DOM elements.

## Style Conventions

- Vanilla ES modules with `import`/`export`
- No TypeScript, no JSDoc
- Constants in UPPER_SNAKE_CASE
- Private methods prefixed with `_`
- CSS uses hex colors matching the COLORS constant palette
