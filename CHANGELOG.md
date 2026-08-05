# Changelog

All notable changes to Boxters will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-08-05

### Added
- **Sound effects** — fail SFX (3 random clips) on level defeat, clapping SFX on victory, and a special victory SFX for mode completion.
- **Victory fanfare** — 6-second celebratory music with harmony pads, shimmer effects, and clapping on every win.
- **Mode completion celebration** — completing level 14 of any mode triggers a special overlay with confetti, victory SFX, and mode-specific title (Word Master, Board Sweeper, Chain Legend, Master of Light).
- **Confetti particle effect** — falling multicolored confetti with continuous waves during mode completion.
- **Solution panel improvements** — illuminate mode now shows 3/4/5-letter words with unlit tiles (not just 6+), up to 12 solutions sorted by unlit tile coverage.
- **Solution panel translucency** — panel background reduced to 35% opacity so the board is visible behind it.
- **Ghost board enhancements** — brighter hex outlines and letters behind defeat/game-over overlays.
- **Version footer** — v1.1.0 displayed in gold at the bottom of every screen.
- **SFX assets** — `sfx/` folder with fail, clapping, and victory MP3 files.

### Changed
- **Illuminate tutorial wording** — removed hardcoded move counts from levels 9-14 tutorials to prevent staleness when moves are adjusted.
- **Defeat overlay** — reduced darkness (0.7 → 0.45) for better board visibility.
- **Game-over overlay** — reduced darkness (0.85 → 0.5) for better board visibility.

### Fixed
- **Illuminate solutions missing short words** — `findWordsWithPaths` was capping results by length before the unlit-tile filter ran; now returns all words for illuminate mode filtering.

## [1.0.0] - 2026-08-01

### Added
- **Four game modes** with 14 levels each (56 levels total):
  - **Simple** — Form required words on a hex board. Tiles stay and can be reused across words.
  - **Clear** — Remove tiles by forming words. Clear the entire board to win.
  - **Chain** — Form words sequentially; used tiles get new letters. Overlap tile positions to build combo multipliers (up to 4x).
  - **Illuminate** — Light up tiles by using them in words. Cover every tile to win.
- **Hexagonal grid** with pointy-top layout, two board sizes (hex2 = 19 cells, hex3 = 37 cells).
- **Anchor cells** (red rim) that constrain word paths — every word must pass through an anchor.
- **Chain mode combo system** with blue pulsing tiles showing previous word positions.
- **Auto-clear** in Clear mode: isolated clusters of 1-2 tiles are automatically cleared.
- **Scoring system** with per-level difficulty multipliers (0.4x for level 1 up to 1.0x for level 10+), tier multipliers, letter values, and efficiency bonuses.
- **Star ratings** (1-3 stars) per level based on score thresholds.
- **Lives system** — 3 lives per session; 5-minute cooldown period after losing all lives (persists across browser reloads).
- **Player profile** stored in localStorage — name, stats, progress, highest levels reached.
- **Level navigation** — back/forward buttons to replay earlier levels or advance to highest reached.
- **In-game UI** — info button, logout button, hover tooltips, tutorial messages with word-wrap.
- **Info dialog** with About, Game Play, and Privacy tabs.
- **Particle effects** on word submission and tile clearing.
- **Word-first board generation** for Simple mode — places real dictionary words on the grid first, then fills remaining cells.
- **Solution viewer** — shows playable words after level failure.
- **Session tracking** — games count only increments on fresh sessions, not browser reloads.
- **Responsive canvas** with DPR-aware rendering, dynamic board positioning when tutorials are shown.
- **Privacy-first design** — no analytics, no cookies, no data collection. Everything stored locally.
