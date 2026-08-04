# Lexicon

A word puzzle game where you trace paths across a hexagonal board to form words. Challenge yourself across four unique game modes, each with its own twist on word-finding strategy.

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
  js/
    main.js           # Game loop, state machine, event handling
    renderer.js       # Canvas rendering (board, UI, effects, tooltips)
    input.js          # Pointer/touch input handling
    levels.js         # 56 level definitions + board generation
    board.js          # HexCell, Field, Board data structures
    hex.js            # Hex math (axial coords, pixel conversion, neighbors)
    scoring.js        # Score calculation, star ratings
    objectives.js     # Objective tracking (formWord, clearAll, combos, etc.)
    constants.js      # Colors, hex geometry, letter values, scoring config
    tracer.js         # Word tracing path logic
    particles.js      # Particle effect system
    audio.js          # Audio manager (placeholder)
    dictionary.js     # Word list and lookup
```

## Tech Stack

- Vanilla JavaScript (ES modules)
- HTML5 Canvas 2D with DPR-aware rendering
- No frameworks, no dependencies, no build tools
- localStorage for persistence

## Privacy

No data is collected, transmitted, or shared. No cookies, analytics, or tracking. All progress is stored locally in your browser. To reset: `localStorage.removeItem('lexicon_player')`.

## License

All rights reserved.
