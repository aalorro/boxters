# Lexicon

A word puzzle game where you trace paths across a hexagonal board to form words. Challenge yourself across four unique game modes, each with its own twist on word-finding strategy.

Built with HTML5 Canvas. No frameworks, no dependencies, no build tools.

## How to Play

Drag through adjacent hexagonal tiles to spell words. Each tile can only be used once per word. Words must be at least 3 letters and exist in the dictionary.

### Game Modes

- **Simple** — Form the required words to complete each level. Tiles stay on the board and can be reused across words.
- **Clear** — Sweep the board clean. Each word removes its tiles. Small leftover clusters (1-2 tiles) are auto-cleared.
- **Chain** — Form words one at a time. Used tiles get new random letters and pulse blue. Reuse those tile positions in your next word to build combos (up to 4x multiplier).
- **Illuminate** — Light up the board by using tiles in words. Cover every tile to win.

### Anchors

Some levels have **Anchor cells** (red rim). Every word must pass through an anchor tile.

### Scoring

Points are based on letter values, word length, unused moves, and mode difficulty. Each level has a difficulty multiplier that scales with progression — early levels produce lower scores, harder levels reward more. Earn 1-3 stars per level.

### Lives

You start with 3 lives. Failing a level costs a life. Lose all 3 and there's a 5-minute cooldown before you can retry.

## Running Locally

Lexicon is a static web app — no build step required.

1. Serve the project directory with any HTTP server:
   ```bash
   # Python
   python -m http.server 8000

   # Node.js
   npx serve .
   ```
2. Open `http://localhost:8000` in a browser.

> A local server is required because the app uses ES modules (`import`/`export`).

## Project Structure

```
lexicon/
  index.html          # Entry point, info dialog, loading/register/welcome screens
  style.css           # All CSS (overlay screens, dialogs, buttons)
  sfx/                # Sound effects (fail, clapping, victory MP3s)
  js/
    main.js           # Game loop, state machine, event handling, board persistence
    renderer.js       # Canvas rendering (board, UI, effects, overlays, ghost board, version footer)
    input.js          # Pointer/touch input handling with pointer capture
    levels.js         # 56 level definitions + board generation (word-first & retry-based)
    board.js          # HexCell, Field, Board data structures
    hex.js            # Hex math (axial coords, pixel conversion, neighbors, spiral)
    scoring.js        # Score calculation, star ratings
    objectives.js     # Objective tracking (formWord, clearAll, combos, illuminate, etc.)
    constants.js      # Modes, colors, hex geometry, letter values, scoring config, states
    tracer.js         # Word tracing path logic
    particles.js      # Particle effects (burst, clear, chain, illuminate, confetti)
    audio.js          # Web Audio API (synth tones, fanfare) + MP3 SFX (fail, clap, victory)
    dictionary.js     # 170K+ word list (ENABLE1-based) and Trie lookup
```

## Architecture

### Game States

`LOADING → MENU → LEVEL_INTRO → PLAYING → SUBMITTING → VICTORY/DEFEAT → GAME_OVER → COOLDOWN`

### Board Generation

Each game mode uses a tailored board generation strategy:

| Mode | Generator | Strategy |
|------|-----------|----------|
| Simple | `buildBoardWordFirst` | Places real dictionary words on the grid, fills gaps with frequency-weighted letters |
| Clear | `buildBoardClearMode` | Dedicated generator for clearable boards |
| Chain | `buildBoard` | Random letters (35% vowel floor) + solvability retry loop |
| Illuminate | `buildBoardIlluminate` | Word-first + safe letter fills (excludes J/Q/V/X/Z) + solvability verification |

### Hex System

Pointy-top hexagons using axial coordinates (q, r). Board sizes: hex1 (7 cells), hex2 (19 cells), hex3 (37 cells).

### Persistence

- **Player profile**: `localStorage` key `lexicon_player` — name, scores, levels completed, unlocked modes, cooldown
- **Board state**: `localStorage` key `lexicon_board_state_<mode>` — per-mode snapshots preserve board, score, and objectives across menu navigation

### Audio

- **Synth sounds** (Web Audio API oscillators): letter tones, word chords, error buzz, 6-second victory fanfare with harmony pads
- **SFX files** (preloaded MP3 AudioBuffers): 3 random fail sounds on defeat, 3 random clapping sounds on victory, special victory SFX on mode completion
- **Mode completion** (level 14 of any mode): fanfare + clapping + victory SFX + confetti

### Canvas UI

Info, logout, back, and forward buttons are drawn on the canvas by the renderer and hit-tested in the game loop — they are not DOM elements. DPR scaling is handled via canvas transform; all coordinates are in CSS pixels.

## Tech Stack

- Vanilla JavaScript (ES modules)
- HTML5 Canvas 2D with DPR-aware rendering
- Web Audio API for synth sounds and MP3 playback
- No frameworks, no dependencies, no build tools
- localStorage for persistence

## Privacy

No data is collected, transmitted, or shared. No cookies, analytics, or tracking. All progress is stored locally in your browser. To reset: `localStorage.removeItem('lexicon_player')`.

## License

All rights reserved.
