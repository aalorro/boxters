# Boxters

A word puzzle game where you trace paths across a hexagonal board to form words. Challenge yourself across five unique game modes, each with its own twist on word-finding strategy.

Built with HTML5 Canvas. No frameworks, no dependencies, no build tools.

## How to Play

Drag through adjacent hexagonal tiles to spell words. Each tile can only be used once per word. Words must be at least 3 letters and exist in the dictionary.

### Game Modes

- **Simple** — Form the required words to complete each level. Tiles stay on the board and can be reused across words.
- **Clear** — Sweep the board clean. Each word removes its tiles. Small leftover clusters (1-2 tiles) are auto-cleared.
- **Chain** — Form words one at a time. Used tiles get new random letters and pulse blue. Reuse those tile positions in your next word to build combos (up to 4x multiplier).
- **Illuminate** — Light up the board by using tiles in words. Cover every tile to win.
- **Apex** — The ultimate challenge. Each word triggers a random effect (clear, chain, or illuminate). Adapt your strategy on the fly while completing mixed objectives. Unlocked after completing Illuminate with 20,000+ total score.

### Anchors

Some levels have **Anchor cells** (red rim). Every word must pass through an anchor tile.

### Share a Board

Tap the share button (bottom-right of the board) to copy a link. Anyone who opens it gets the exact same board layout — compare scores with friends!

### Leaderboard

Tap the trophy icon on the welcome screen to view the global leaderboard. Scores are stored in Firebase Firestore and sync across devices. Your entry is highlighted with a "YOU" badge. Mode badges show each player's highest unlocked mode (🌱 Simple, 🧹 Clear, 🔗 Chain, 💡 Illuminate, 👑 Apex).

### Settings

Tap the gear icon on the welcome screen to access settings:
- **Change username** — with case-insensitive availability check against the leaderboard
- **Theme** — toggle between dark and light mode
- **Gender & Age group** — optional demographic info
- **Export Profile** — download a signed `.bxp` file containing all progress
- **Import Profile** — restore a previously exported profile on another browser or device

### Profile Transfer

Export your profile from Settings to create a `.bxp` file. Import it on another browser or device to continue playing with the same progress, scores, and leaderboard identity. Files are SHA-256 signed to prevent tampering.

### Scoring

Points are based on letter values, word length, unused moves, and mode difficulty. Each level has a difficulty multiplier that scales with progression — early levels produce lower scores, harder levels reward more. Earn 1-3 stars per level.

### Lives

You start with 3 lives. Failing a level costs a life. Lose all 3 and there's a 5-minute cooldown before you can retry.

## Running Locally

Boxters is a static web app — no build step required.

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
boxters/
  index.html          # Entry point, dialogs, loading/register/welcome screens
  style.css           # All CSS (overlay screens, dialogs, buttons)
  privacy.html        # Privacy policy page
  sfx/                # Sound effects (fail, clapping, victory MP3s)
  js/
    main.js           # Game loop, state machine, event handling, board persistence
    renderer.js       # Canvas rendering (board, UI, effects, overlays, ghost board, version footer)
    input.js          # Pointer/touch input handling with pointer capture
    levels.js         # 70 level definitions + board generation (word-first & retry-based)
    board.js          # HexCell, Field, Board data structures
    hex.js            # Hex math (axial coords, pixel conversion, neighbors, spiral)
    scoring.js        # Score calculation, star ratings
    objectives.js     # Objective tracking (formWord, clearAll, combos, illuminate, etc.)
    constants.js      # Modes, colors, hex geometry, letter values, scoring config, states
    tracer.js         # Word tracing path logic
    particles.js      # Particle effects (burst, clear, chain, illuminate, confetti)
    audio.js          # Web Audio API (synth tones, fanfare) + MP3 SFX (fail, clap, victory)
    firebase.js       # Firebase Firestore — leaderboard, score sync, name check, profile sync
    dictionary.js     # 170K+ word list (ENABLE1-based) and Trie lookup
```

## Architecture

### Game States

`LOADING → MENU → LEVEL_INTRO → PLAYING → SUBMITTING → VICTORY/DEFEAT → GAME_OVER → COOLDOWN → GAUNTLET_INTRO → APEX_UNLOCK → GAME_COMPLETE`

### Board Generation

Each game mode uses a tailored board generation strategy:

| Mode | Generator | Strategy |
|------|-----------|----------|
| Simple | `buildBoardWordFirst` | Places real dictionary words on the grid, fills gaps with frequency-weighted letters |
| Clear | `buildBoardClearMode` | Dedicated generator for clearable boards |
| Chain | `buildBoard` | Random letters (35% vowel floor) + solvability retry loop |
| Illuminate | `buildBoardIlluminate` | Word-first + safe letter fills (excludes J/Q/V/X/Z) + solvability verification |
| Apex | `buildBoardIlluminate` | Reuses illuminate generation; each word triggers a random effect (clear/chain/illuminate) |

### Hex System

Pointy-top hexagons using axial coordinates (q, r). Board sizes: hex1 (7 cells), hex2 (19 cells), hex3 (37 cells).

### Persistence

- **Player profile**: `localStorage` key `boxters_player` — name, scores, levels completed, unlocked modes, cooldown, gender, age group
- **Board state**: `localStorage` key `boxters_board_state_<mode>` — per-mode snapshots preserve board, score, and objectives across menu navigation
- **Player ID**: `localStorage` key `boxters_player_id` — anonymous UUID for leaderboard identity
- **Theme**: `localStorage` key `boxters_theme` — dark/light preference
- **Leaderboard cache**: `localStorage` key `boxters_leaderboard_cache` — offline fallback for leaderboard data
- **Cloud sync**: On app load, local scores are reconciled with Firebase Firestore (highest values kept)

### Audio

- **Synth sounds** (Web Audio API oscillators): letter tones, word chords, error buzz, 6-second victory fanfare with harmony pads
- **SFX files** (preloaded MP3 AudioBuffers): 3 random fail sounds on defeat, 3 random clapping sounds on victory, special victory SFX on mode completion
- **Mode completion** (level 14 of any mode): fanfare + clapping + victory SFX + confetti

### Canvas UI

Info, logout, sound, back, forward, and share buttons are drawn on the canvas by the renderer and hit-tested in the game loop — they are not DOM elements. DPR scaling is handled via canvas transform; all coordinates are in CSS pixels.

## Tech Stack

- Vanilla JavaScript (ES modules)
- HTML5 Canvas 2D with DPR-aware rendering
- Web Audio API for synth sounds and MP3 playback
- Firebase Firestore (compat SDK via CDN) for leaderboard and cloud sync
- Google Analytics (gtag.js) for anonymous usage data
- No frameworks, no build tools
- localStorage for persistence

## Privacy

Game progress is stored locally in your browser via `localStorage`. Google Analytics is used for anonymous usage data. Firebase Firestore stores leaderboard data (player name, scores, levels completed, optional gender/age group) linked to an anonymous UUID — no email, IP, or personal accounts. See [Privacy Policy](privacy.html) for full details. To reset progress: `localStorage.removeItem('boxters_player')`.

## License

All rights reserved.
