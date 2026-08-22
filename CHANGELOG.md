# Changelog

All notable changes to Boxters will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.2] - 2026-08-22

### Changed
- **Best-per-level scoring** — Total score is now the sum of your best score per level. Replaying a level only increases your total if you beat your previous best. Victory overlay shows feedback on whether the score counted.
- **Anti-cheat** — Per-level scores stored in Firestore with security rules: per-write delta capped at 2500, monotonic totalScore, immutable baseScore for legacy migration. `syncProfile()` recomputes totalScore from levelScores on load.
- **Dictionary** — Added hiphop, copish.
- **Version footer** — Updated to v1.3.2.

## [1.3.1] - 2026-08-21

### Changed
- **Apex moves** — Added +1 move to all 14 apex levels for better balance.
- **Game Complete screen** — Special celebration overlay with looping music, badge display, and three action buttons (Play Any Level, Random Challenge, Leaderboard) when completing apex_14.
- **Uncommon word filter** — Board generation now rejects boards where >5% of traceable words are uncommon (all modes).
- **SEO** — Updated meta tags for five modes, 70 levels, and global leaderboard.
- **Dictionary** — Added rebase, rebased, rebases.
- **Version footer** — Updated to v1.3.1.

## [1.3.0] - 2026-08-18

### Added
- **Apex mode** — The 5th and ultimate game mode. Each word triggers a random effect (clear, chain, or illuminate). Players must adapt to unpredictable tile behaviors while completing mixed objectives.
- **14 Apex levels** — From "First Contact" (hex2) to "Transcendence" (hex3), with progressively harder objectives combining anchors, illuminate percentages, combos, and long words.
- **Gauntlet system** — Players who complete Illuminate but haven't reached 20,000 total score enter a gauntlet of random high-level games (level 7+) from any mode. Scores accumulate until the threshold is reached.
- **Apex unlock celebration** — Special purple-themed overlay with crown emoji and confetti when Apex mode is unlocked.
- **Dictionary words** — Added fest, bestie, besties, bff.

### Changed
- **Anchor freedom in Apex** — Once the anchor objective is met, remaining words no longer need to pass through anchors (Apex mode only).
- **Apex illumination** — All words in Apex mode always illuminate tiles first, then apply the random effect. This ensures illuminate% objectives are achievable.
- **HUD improvements** — % lit counter only shows when there's an illuminatePercent objective. Combo and % lit stack vertically when both active.
- **Tutorial updates** — Apex anchor levels explain that words are free after anchor objective is met.
- **Version footer** — Updated to v1.3.0.

### Fixed
- **Touch dead zone on hex3 boards** — Hidden solution modal's child element (`pointer-events: auto`) was intercepting touches at the bottom of the screen. Added `visibility: hidden` to all hidden overlays.
- **Premature level completion** — Apex levels 8 and 11 had secondary objectives that didn't block victory. All objectives are now primary.

## [1.2.1] - 2026-08-16

### Added
- **Leaderboard** — Global leaderboard powered by Firebase Firestore. Scores submit automatically on level completion. Top 30 players displayed with rank medals, mode badges, and "YOU" indicator for the current player.
- **Leaderboard modal** — Trophy icon button on the welcome screen opens a dedicated leaderboard dialog.
- **Leaders tab** — New tab in the info dialog for quick leaderboard access during gameplay.
- **Firebase integration** — New `js/firebase.js` module handles Firestore init, score submission, leaderboard fetching, player ID management, and offline caching.

### Changed
- **Mobile nav** — Nav buttons moved to bottom-right stack for better mobile ergonomics.
- **Welcome screen** — Info button replaced with a row of two icon buttons (trophy for leaderboard, info for about).
- **Privacy policy** — Updated to disclose Firebase Firestore leaderboard data collection.
- **Version footer** — Updated to v1.2.1.

## [1.2.0] - 2026-08-07

### Added
- **Board sharing** — Share button (bottom-right of board) copies a URL to the clipboard. Opening the link loads the exact same board layout so friends can compare scores.
- **Sound toggle** — Mute/unmute button on the board to control audio.
- **Google Analytics** — Anonymous usage tracking via Google Analytics (gtag.js).
- **Tutorial tips** — All Simple mode levels now have tutorial tips with strategic advice.
- **SEO improvements** — Keywords, author meta, Apple mobile web app tags, expanded Open Graph and structured data, OG image converted to PNG for social platform compatibility.
- **Info dialog X button** — Close button at top-right of info panel for quick dismissal without scrolling.
- **Hex logo** — SVG favicon displayed on welcome screen above the title.
- **Copyright footer** — "© 2026 ArtMondo — MIT License" above version number.

### Changed
- **Mode celebration** — Confetti, fanfare, and special overlay only trigger the first time a player completes level 14 of each mode. Replaying shows normal victory.
- **Info button repositioned** — Moved from top-left area to bottom-right of the board, above the share button.
- **Locked mode buttons** — Gold-tinted border and increased opacity for better visibility.
- **Hex tile size** — Increased ~23% for better mobile usability.
- **Privacy policy** — Updated to disclose Google Analytics usage and cookies.
- **Version footer** — Updated to v1.2.0.

### Fixed
- **Blank shared boards** — `HexCell` constructor was called with positional args instead of object destructuring, causing empty boards when loading shared URLs.
- **No-vowel boards** — Board generation now guarantees ≥35% vowels in unfilled cells (Simple & Clear modes).
- **formWord double-counting** — A word no longer counts toward multiple formWord objectives simultaneously; routed to the most specific matching incomplete objective.
- **formWord min length** — Changed from `Math.max` to `Math.min` across incomplete objectives so valid shorter words are accepted.
- **Missing objective counter** — formWord objectives with target=1 now show progress counter.
- **Level balance** — Swapped Simple levels 11/12 objectives so difficulty ramps correctly. Differentiated level 11 from level 9.

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
- **Privacy-first design** — all progress stored locally in browser.
