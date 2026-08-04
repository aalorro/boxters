# Lexicon Eclipse

## Product Specification

**Genre:** Strategic word puzzle adventure  
**Platforms:** iOS, Android, tablet, and web  
**Session length:** 3–12 minutes per level  
**Audience:** Players who enjoy wordplay, deduction, spatial strategy, and mastery-based progression  
**Tagline:** *Every word casts a shadow.*

---

## 1. Product Vision

**Lexicon Eclipse** is a word puzzle game in which every word placed in the visible world creates a second, transformed word in a hidden “shadow” world. A level is won only when the player satisfies the goals of both worlds.

The central challenge is not simply finding a valid word. Players must predict how each word changes the board, manage limited energy, manipulate letter relationships, and solve two interdependent puzzles at once.

The intended experience is:

- Immediately understandable at the first difficulty tier.
- Deep enough to support expert-level competitive play.
- Challenging because of deduction and planning, not obscure vocabulary.
- Visually recognizable from a single screenshot.
- Generous with feedback while avoiding automatic solutions.

### Original Design Pillars

1. **Dual-word causality:** Every move affects a visible board and a shadow board.
2. **Transformation as strategy:** Letters may mirror, echo, decay, rotate, or inherit properties.
3. **Meaningful difficulty:** Higher tiers introduce new interactions rather than merely longer words.
4. **No throwaway moves:** Placement, direction, timing, and transformations all matter.
5. **Mastery over luck:** Randomness creates variety but never makes a level unsolvable.

---

## 2. Core Puzzle Concept

Each level contains two overlapping hexagonal letter fields:

- **The Lumen Field:** The bright, visible layer where the player forms words.
- **The Umbra Field:** A shadow layer affected by every Lumen word.

The player selects a continuous path of letter cells in the Lumen Field. The submitted word triggers the level's active **Eclipse Rule**, which generates or modifies letters in the Umbra Field.

Example:

> The player forms **STONE** in Lumen.  
> The active rule, **Reverse Reflection**, produces **ENOTS** as a letter trail in Umbra.  
> Although ENOTS is not a word, its letters connect with existing Umbra letters to complete **TONE** and activate an objective.

Words in the Umbra layer are usually assembled indirectly. On advanced levels, the player can briefly rotate the board and play directly in Umbra, causing a reciprocal effect in Lumen.

### Why the Mechanic Has Depth

A valid Lumen word may still be a poor move if its shadow:

- Blocks a required Umbra route.
- Awakens a hazardous cell.
- Consumes a scarce letter.
- Breaks a multiplier chain.
- Causes the two fields to fall out of balance.

The best move solves multiple constraints in both layers.

---

## 3. Core Gameplay Loop

1. Review the two field objectives and active Eclipse Rules.
2. Trace a valid word through adjacent cells.
3. Preview its predicted shadow transformation.
4. Submit the word and watch both fields react.
5. Collect energy, stabilize anomalies, and unlock routes.
6. Complete both field objectives before moves or stability run out.
7. Earn points, stars, mastery bonuses, and progression rewards.
8. Replay for a better solution, fewer moves, rarer words, or a higher score.

### Controls

- Drag across adjacent hex cells to trace a word.
- Drag backward one cell to undo the most recent letter.
- Hold a cell to inspect its state and transformation behavior.
- Tap the eclipse icon to swap field emphasis when allowed.
- Two-finger rotate on touch devices, or use rotation controls on web.
- All essential actions must also work with keyboard and screen readers.

---

## 4. Board and Letter Rules

### Board Structure

- Boards use an irregular hex-cell constellation rather than a rectangular grid.
- Levels contain 19–91 active cells, depending on tier.
- Paths may travel through any adjacent active cell.
- A cell cannot be reused within the same word unless a specific modifier permits it.
- Word length is normally 3–12 letters.
- The game validates inflections and common proper gameplay terms according to the selected language dictionary.

### Cell Types

| Cell | Behavior |
|---|---|
| Plain Glyph | Standard letter cell. |
| Twin | Copies its letter to the corresponding cell in the other field. |
| Prism | Changes the shadow letter according to a displayed cycle. |
| Anchor | Cannot move, rotate, or decay. |
| Echo | Repeats the previous letter in the shadow transformation. |
| Rift | Transfers the word path to a different board region. |
| Wild Rune | May represent one of two displayed letters; worth fewer base points. |
| Bloom | Creates a new neighboring cell after use. |
| Void | Absorbs one transformed letter and then becomes playable. |
| Pulse | Must be used on a specific beat in timed levels. |
| Relic | Contains a fixed fragment such as **TH**, **ING**, or **QU**. |
| Paradox | Exists in only one field; using it changes the level rule. |

### Eclipse Rules

Each level clearly displays one or more transformations:

- **Reverse Reflection:** Shadow letters appear in reverse order.
- **Alphabet Orbit:** Each shadow letter shifts forward or backward in the alphabet.
- **Vowel Phase:** Vowels rotate through A → E → I → O → U.
- **Consonant Kin:** Consonants transform into a paired sound or shape family.
- **Length Gravity:** Short words push shadow cells outward; long words pull them inward.
- **Semantic Resonance:** Words in a shown theme energize matching cells.
- **Anagram Scatter:** Shadow letters appear in a predictable positional pattern.
- **Syllable Split:** Each syllable is sent to a different Umbra region.
- **Reciprocal Eclipse:** A change in either field immediately alters the other.

Players always receive a complete visual preview of deterministic changes before committing a move.

---

## 5. Level Objectives

A level combines one primary goal with up to three secondary constraints.

### Primary Goals

- Form one or more target-pattern words without being shown the answers.
- Illuminate all Lumen constellations.
- Construct a valid Umbra word indirectly.
- Bring both fields to equal energy.
- Rescue trapped glyphs by connecting themed words.
- Seal all Rifts in a required order.
- Reach a target score within a move limit.
- Survive a sequence of mutations.
- Defeat a Warden by discovering its linguistic rule.

### Secondary Constraints

- Use exactly a specified number of words.
- Finish with equal vowel counts in both fields.
- Avoid a forbidden letter or cell.
- Include a word with a displayed prefix, suffix, pattern, or meaning.
- Use every Anchor exactly once.
- Never repeat a word family.
- Keep instability below a threshold.
- Complete an optional hidden “elegant solution.”

---

## 6. Difficulty Tiers

Difficulty is driven by strategic complexity, interacting rules, information pressure, and solution elegance. It must not rely primarily on rare words.

| Tier | Name | Intended Skill | Board and Rule Design | Typical Limits |
|---|---|---|---|---|
| 1 | **Spark** | Learn tracing and simple reflection. | Small field, one objective, one transformation, full previews. | 8–12 moves; 3–5 letter words. |
| 2 | **Glow** | Plan one move ahead. | Twin cells, simple Umbra goals, optional score challenges. | 7–11 moves; 3–6 letter words. |
| 3 | **Flare** | Manage resources and routes. | Two cell modifiers, limited energy, partial obstacles. | 6–10 moves; 4–7 letter words. |
| 4 | **Orbit** | Coordinate both fields. | Direct field swapping, two Eclipse Rules, order-sensitive goals. | 6–9 moves; 4–8 letter words. |
| 5 | **Corona** | Build multi-move combinations. | Board rotation, decaying cells, chained objectives, stricter balance. | 5–8 moves; 5–9 letter words. |
| 6 | **Umbra** | Deduce hidden behavior. | One partially concealed rule that can be inferred safely through feedback. | 5–8 moves; 5–10 letter words. |
| 7 | **Totality** | Optimize a complex system. | Three interacting rules, reciprocal effects, dangerous Paradox cells. | 4–7 moves; 6–11 letter words. |
| 8 | **Singularity** | Demonstrate mastery. | Hand-authored puzzle logic, minimal redundancy, multiple valid but unequal solutions. | 3–6 moves; 6–12 letter words. |

### Difficulty Integrity Rules

- Every level must be solvable using common or intermediate vocabulary.
- A valid solution cannot depend on an undocumented dictionary edge case.
- Tier 1–3 levels allow recovery from at least two non-optimal moves.
- Tier 4–6 levels allow recovery from at least one non-optimal move.
- Tier 7–8 levels may require exact planning but must support unlimited restarts.
- No objective may become impossible without immediate, clear feedback.
- Procedural levels must be solver-verified before presentation.

---

## 7. Level Win, Loss, and Scoring

### Win Condition

The player wins when all primary goals in both fields are completed within the move, energy, time, or stability limits shown at level start.

### Loss Conditions

- Moves reach zero before all primary objectives are complete.
- Eclipse stability reaches zero.
- A protected cell is destroyed.
- A timed constellation closes before completion.

There are no lives. Players can restart immediately without waiting or paying.

### Points Awarded on Every Win

Every completed level awards points. There is no zero-point victory.

**Level Score**

```text
Level Score =
Base Victory Points
+ Letter Value
+ Objective Bonuses
+ Efficiency Bonus
+ Eclipse Chain Bonus
+ Discovery Bonus
+ Difficulty Multiplier
- Assist Adjustment
```

### Base Victory Points

| Tier | Base Points |
|---|---:|
| Spark | 500 |
| Glow | 800 |
| Flare | 1,200 |
| Orbit | 1,800 |
| Corona | 2,600 |
| Umbra | 3,600 |
| Totality | 5,000 |
| Singularity | 7,500 |

### Score Components

- **Letter Value:** Common letters score 5–10 each; strategically scarce letters score 15–30.
- **Dual Completion:** 300–2,000 points for completing objectives in both fields with one move.
- **Efficiency:** 150 points per unused move, scaled by tier.
- **Eclipse Chain:** Successive moves that advance both fields build a ×1.1 to ×3.0 multiplier.
- **Discovery:** First-time use of a valid word grants a modest bonus.
- **Elegant Solution:** A hand-authored or solver-detected minimum-move route grants a major bonus.
- **No-Restart Bonus:** Granted only as a score bonus, never as progression gating.
- **Difficulty Multiplier:** Spark ×1.0, Glow ×1.15, Flare ×1.35, Orbit ×1.6, Corona ×1.9, Umbra ×2.25, Totality ×2.7, Singularity ×3.25.

### Stars and Mastery

- **1 Star — Victory:** Complete all primary objectives.
- **2 Stars — Resonance:** Meet the level's displayed score target.
- **3 Stars — Total Eclipse:** Complete its mastery constraint.
- **Prismatic Crown:** Beat the expert target without direct hints.

Stars unlock new chapters. Score drives leaderboards and personal bests. Crowns unlock cosmetic effects and lore, never gameplay advantages.

---

## 8. Hint and Assistance System

Hints should teach reasoning rather than reveal a word immediately.

1. **Field Pulse:** Highlights which field needs attention.
2. **Rule Reminder:** Animates the transformation with neutral example letters.
3. **Cell Nudge:** Highlights two or three strategically useful cells.
4. **Pattern Reveal:** Shows a useful form such as `_ A _ E`.
5. **Word Reveal:** Shows one valid move as the final assistance level.

Using assistance never prevents a win or the base point award. It reduces only bonus scoring:

- Field Pulse: no adjustment.
- Rule Reminder: −5% bonus points.
- Cell Nudge: −10% bonus points.
- Pattern Reveal: −20% bonus points.
- Word Reveal: −35% bonus points.

Accessibility settings never affect score.

---

## 9. Progression Structure

### Campaign: The Broken Lexicon

The campaign follows a dying language-star whose meanings have fractured into Lumen and Umbra.

- **8 regions**, each introducing one difficulty tier.
- **24 core levels per region**.
- **4 challenge levels per region**.
- **1 Warden encounter per region**.
- **232 launch campaign levels**.

### Wardens

Wardens are boss puzzles whose behavior must be inferred through language:

- **The Palindrome Serpent:** Reflects paths and punishes asymmetry.
- **The Vowel Thief:** Removes the least protected vowel after each move.
- **The False Friend:** Creates misleading letter twins between fields.
- **The Grammarian:** Changes allowed word forms every turn.
- **The Redactor:** Conceals portions of previous moves.
- **The Homophone Choir:** Reacts to sound rather than spelling.
- **The Name Eater:** Forbids repeated roots and word families.
- **The Silent Sun:** Combines all mastered transformations.

### Additional Modes

- **Daily Eclipse:** One globally shared puzzle with normalized scoring.
- **Constellation Run:** A sequence of five levels with persistent energy.
- **Infinite Rift:** Solver-verified procedural levels that increase in complexity.
- **Duel of Shadows:** Asynchronous competition on identical boards; each player submits independently.
- **Forge:** A level editor that validates solvability and enables share codes.
- **Zen Orbit:** No score pressure, generous undo, ambient visuals, and vocabulary discovery.

---

## 10. Visual and Graphic Direction

### Core Art Concept

The interface resembles a living celestial manuscript: ink, starlight, stained glass, and astronomical instruments fused into one world.

The board is not a generic tile grid. Each letter inhabits a translucent **glyph-lens**, a layered hexagonal shard with:

- An illuminated engraved letter.
- A subtle animated ink current.
- A shadow counterpart visible beneath the surface.
- A unique rim pattern identifying its cell behavior without relying on color.

The Lumen and Umbra fields occupy the same physical space. Sliding the Eclipse Dial causes one layer to refract through the other, creating a dramatic but readable dimensional transition.

### Signature Visual Moments

- Tracing a word pulls a ribbon of liquid light through its cells.
- A submitted word rises as luminous calligraphy before folding into its shadow form.
- Dual-objective moves cause the two fields to align into a brief solar eclipse.
- A level victory turns completed words into a permanent constellation.
- Perfect victories fracture the eclipse into a slow burst of prismatic letterforms.
- Warden levels feature enormous typographic creatures whose bodies are made from reactive fragments of words.

### Color System

| Purpose | Palette |
|---|---|
| Lumen | Warm ivory, solar gold, coral, and cyan highlights. |
| Umbra | Midnight indigo, black violet, ultraviolet, and silver. |
| Stable State | Teal-white glow with calm concentric motion. |
| Warning State | Vermilion edges plus angular motion and haptic pulses. |
| Success | Full-spectrum prism traveling from both fields to the center. |

Color must be reinforced through shape, texture, icons, and motion for color-vision accessibility.

### Typography

- Titles: custom high-contrast display serif inspired by celestial charts.
- Board letters: highly legible geometric capitals with distinct I/L, O/Q, and M/N forms.
- UI text: clean humanist sans serif.
- Important words may briefly render as expressive calligraphy, but never at the expense of readability.

### Motion Principles

- Motion communicates board causality.
- Transformation sequences remain under 900 ms during normal play.
- Players may tap to accelerate or disable decorative motion.
- Reduced-motion mode replaces spatial effects with fades, outlines, and state labels.

### Audio Direction

- Each letter has a soft tonal interval based on its alphabet family.
- Valid words resolve into a chord.
- Shadow transformations replay that chord reversed, shifted, or fractured according to the rule.
- Dual-field success produces a distinct harmonic cadence.
- Music layers increase with the Eclipse Chain without becoming stressful.

---

## 11. User Interface Specification

### Primary Gameplay Screen

1. **Top bar:** level number, difficulty tier, score, and remaining moves.
2. **Objective rail:** compact goals with progress indicators.
3. **Central field:** layered constellation board occupying at least 60% of the display.
4. **Eclipse Dial:** draggable control showing current Lumen/Umbra emphasis.
5. **Word tray:** selected letters, validity, projected points, and transformation preview.
6. **Utility row:** undo, rule reference, hint, pause, and accessibility shortcut.

### Required Feedback

- Valid path: continuous light ribbon and gentle rising tone.
- Invalid adjacency: path resists movement and affected edge pulses.
- Invalid word: clear explanation such as “not in dictionary” or “minimum 4 letters.”
- Objective progress: immediate animation localized to the relevant objective.
- Irreversible danger: confirmation preview embedded in the transformation visualization.
- Newly impossible state: prompt to undo or restart with an explanation.

---

## 12. Onboarding

The first six levels teach through interaction:

1. Trace a three-letter word.
2. Observe Reverse Reflection.
3. Use a shadow letter to complete an Umbra objective.
4. Plan a move using the preview.
5. Use a Twin cell.
6. Complete both fields with one move.

Onboarding rules:

- Never show more than one new concept per early level.
- Avoid long text panels.
- Allow experimentation before move limits begin.
- Use common words and high-contrast boards.
- Provide a replayable rule laboratory from the settings menu.

---

## 13. Accessibility and Language

- Full screen-reader descriptions of board coordinates, cell types, adjacency, and projected transformations.
- Keyboard, controller, switch-control, and touch support.
- Adjustable text size and letter spacing.
- High-contrast and color-vision modes.
- Reduced motion, reduced flashes, and adjustable haptics.
- Optional dyslexia-friendly board typeface.
- Unlimited planning time outside explicitly labeled timed challenges.
- Profanity and sensitive-word filters.
- Regional dictionaries selectable by the player.
- Localized rule design must be reviewed per language; transformations that fail linguistically are replaced rather than translated literally.

---

## 14. Fairness, Dictionary, and Puzzle Generation

### Dictionary Policy

- Use a curated play dictionary rather than an unrestricted reference dictionary.
- Display definitions for accepted uncommon words after the move.
- Never require a word marked obscure, archaic, offensive, or highly technical in the main campaign.
- Provide a transparent word-challenge process for Daily Eclipse results.

### Procedural Puzzle Pipeline

1. Generate board topology and letter distribution.
2. Select compatible Eclipse Rules.
3. Plant multiple candidate solution families.
4. Run a solver across all field states.
5. Reject levels with no solution, excessive obscurity, or unavoidable guessing.
6. Rate complexity using branching factor, required foresight, rule count, and recovery margin.
7. Human-review representative and high-tier levels.

---

## 15. Economy and Monetization

Recommended model: premium purchase or subscription-library release.

If free-to-play:

- No lives or energy timers.
- No pay-to-win boosts.
- No paid hints required for progression.
- Monetize cosmetic Eclipse Dials, field themes, constellation frames, and optional campaign expansions.
- Rewarded ads, if included, are limited to cosmetic currency and can be disabled with purchase.
- Children’s privacy and regional consumer-protection requirements must be respected.

---

## 16. Social and Competitive Features

- Friends and global leaderboards by level, daily puzzle, and difficulty tier.
- Replay visualization showing a path without exposing it before the player finishes.
- Shareable victory card containing the final constellation, score, tier, and move count—but not the solution words.
- Weekly guild constellation assembled through individual puzzle completions.
- Duel mode uses identical inputs, fixed dictionaries, and separate play to prevent griefing.
- Competitive scores are separated by assistance category.

---

## 17. Content and Live Operations

- Daily handcrafted or editor-approved puzzle.
- Weekly rule remix that combines two previously learned mechanics.
- Monthly Warden variant.
- Seasonal visual constellations with no gameplay advantage.
- Community Forge spotlight after automated and human moderation.
- New transformations introduced in limited laboratories before entering ranked play.

---

## 18. Technical Requirements

### Client

- 60 FPS target on supported mid-range devices.
- Board interactions respond within 100 ms.
- Offline access to campaign and recent daily puzzles.
- Cloud save with conflict-safe merge for scores and progression.
- Deterministic replay format storing seed, dictionary version, rules, and moves.

### Services

- Account and cross-device progression.
- Versioned dictionary validation.
- Daily-puzzle distribution.
- Leaderboard validation and anti-cheat checks.
- Forge storage, moderation, and share codes.
- Analytics with privacy-respecting consent controls.

### Solver

The internal solver must:

- Enumerate legal paths and transformations.
- Model both fields and all modifier states.
- Verify at least one valid completion.
- Determine approximate minimum moves.
- Detect trivial loops and scoring exploits.
- Estimate vocabulary rarity.
- Produce non-spoiler hint stages.

---

## 19. Analytics and Success Metrics

### Product Metrics

- Tutorial completion rate.
- First-session level completion.
- Day 1, Day 7, and Day 30 retention.
- Average attempts per tier.
- Hint use by hint stage.
- Restart and abandonment points.
- Percentage of wins advancing both fields on the final move.
- Daily Eclipse participation and completion.
- Forge creation, sharing, and completion rates.

### Puzzle Quality Signals

- Levels with unusually high failure after a specific move.
- Solutions dominated by obscure words.
- Levels with a single unintuitive path.
- Discrepancy between predicted and observed difficulty.
- Excessive use of full word reveals.
- Score exploits or infinite chains.

---

## 20. Launch Scope

### Minimum Lovable Product

- Spark through Orbit tiers.
- 96 handcrafted campaign levels.
- 4 Wardens.
- Daily Eclipse.
- 8 cell types.
- 5 Eclipse Rules.
- Full scoring, stars, hints, accessibility, and cloud saves.
- One complete celestial-manuscript visual theme.

### Version 1.0

- All 8 difficulty tiers.
- 232 campaign levels.
- All 8 Wardens.
- 12 cell types and 9 Eclipse Rules.
- Constellation Run and Infinite Rift.
- Asynchronous Duel.
- Forge and share codes.
- Cosmetic progression and seasonal constellations.

---

## 21. Acceptance Criteria

The product is ready for release when:

- New players can explain Lumen-to-Umbra transformation after three tutorial levels.
- At least 90% of testers can complete Spark without external help.
- Expert testers find Totality and Singularity challenging after understanding all rules.
- Every campaign level is solver-verified and human-playtested.
- Every win awards the displayed base points plus applicable bonuses.
- Score calculation is deterministic and reproducible from a replay.
- No main-path level requires an obscure word.
- All board states are distinguishable without color.
- Decorative motion can be reduced or skipped.
- A screenshot is recognizable as Lexicon Eclipse without its logo.
- No purchased item provides a competitive or progression advantage.

---

## 22. One-Level Example

### Level 4-12: “A Mirror Remembers”

**Tier:** Orbit  
**Board:** 37 Lumen cells and 31 Umbra cells  
**Rules:** Reverse Reflection + Vowel Phase  
**Moves:** 7  
**Primary goals:**

- Activate three Lumen Anchors.
- Indirectly form one five-letter Umbra word.
- Finish with equal energy in both fields.

**Secondary mastery goal:** Complete two objectives with the same final word.

The player sees that entering **TRACE** sends transformed letters in reverse order while cycling its vowels. The resulting shadow trail does not directly spell a valid word; it joins existing Anchors to create one. A seemingly higher-scoring Lumen word may consume the only route to the balanced ending, so the level rewards preview use and multi-turn planning.

**Base victory:** 1,800 points  
**Expected first-clear score:** 3,200–5,000 points  
**Expert target:** 7,500 points  
**Prismatic Crown:** Win in five moves without a pattern or word hint.

---

## Product Promise

**Lexicon Eclipse** makes each word a strategic event. Players do not merely search a board for vocabulary; they predict consequences, shape two connected realities, and transform language into a living celestial machine.
