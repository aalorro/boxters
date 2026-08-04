# Changelog

All notable changes to Lexicon will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
