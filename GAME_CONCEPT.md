# Omaha

## Concept Statement

Omaha is a daily football puzzle where you are the offensive coordinator for one real, game-deciding play from last week's NFL action. Read the defense, design the play, snap it, and find out whether you out-coached the pros — all from the comfort of your couch.

The name comes from Peyton Manning's famous audible call: the moment a play caller reads the defense and changes the play at the line.

## Genre(s)

- Daily puzzle (Wordle-style: one shared puzzle per day, limited attempts, shareable result)
- Sports strategy / play design
- Light tactics: a single deterministic play, not a full game simulation

## Target Audience

- **Primary:** NFL fans who already play daily puzzles (Wordle, Connections, Immaculate Grid) and want one built around football knowledge instead of trivia.
- **Secondary:** fantasy football players and "armchair quarterbacks" who yell at the TV about play calls and think they could do better.
- **Tertiary:** X's-and-O's enthusiasts and youth/amateur coaches who enjoy playbook tools.
- **Session profile:** 2–5 minutes on a phone, most likely on game-day evenings, Monday/Tuesday after the weekend's games, and commutes.

## Unique Selling Points

- **Design the play, don't pick it.** You build the play — protection, routes, the QB's read — rather than choosing from a menu of calls. The puzzle sets the formation and the defense.
- **Real situations from last week.** Every puzzle recreates a pivotal moment from a recent NFL game, so the game is always topical during the season.
- **"Could you do better than the pros?"** After you finish, Omaha reveals what the real team called and what happened. Beating the real call is the brag.
- **One play, all the stakes.** No drives, no clock management between plays — a single high-pressure snap that rewards reading the defense.
- **Shareable result grid.** A spoiler-free emoji card showing how each attempt went, built for group chats on Sunday nights.

**Competitive landscape:**

- **Monday QB** (monday-qb.com, live since around June 2026) — daily browser game; you call every play of a game-winning drive and are graded on decision quality. Omaha differs by being a single play, _designed_ rather than selected, and grounded in a real recent game.
- **Daily NFL trivia games** (NFL Grids, PFN's guessing game, Stick to the Model) — compete for the same daily-habit slot but test memory, not play design.

## Player Experience and Game POV

- **Fantasy:** "I'm the OC with the game on the line, and I'd have called it better."
- **Feel:** tense and quick. The briefing builds pressure ("4th & 3, down 4, 0:58 left, one timeout"), the design phase is a thoughtful chalkboard moment, and the snap pays off in a few seconds of animation.
- **POV:** top-down, all-22-style view of the field, like a playbook diagram or coaches' film. Pre-snap you see the defense's alignment; post-snap you watch the play unfold.
- **Design pillars:**
  1. **Read the defense** — the skill being tested is recognizing the coverage and attacking its weakness.
  2. **Legible over realistic** — every failure must be explainable at a glance. If players can't see _why_ a play failed, the puzzle is unfair.
  3. **Deterministic and fair** — the same design against the same puzzle always produces the same result, so everyone's score is comparable.
  4. **Topical** — puzzles track the real NFL week.

## Visual and Audio Style

- **MVP:** playbook-diagram look — X's and O's, route lines, and arrows on a clean field or whiteboard. Cheapest to build, most legible, and it reads like the playbook-designer tools fans already know.
- **Variants to test:** pixel art and low-poly 3D skins on the same top-down view. A/B test against the playbook style for clarity and shareability before investing in art.
- **Difficulty readability:** visual cues (e.g., how clearly the defense's pre-snap disguise is shown) can double as a difficulty lever.
- **Audio:** crowd noise that swells during the briefing, a generic QB cadence on the snap ("Omaha! Set, hut!"), whistles, marker squeaks during design. Audio must be optional — most mobile sessions are muted.
- **No real team logos, uniforms, or player likenesses** (see Risks).

- **Mood and palette:** a coach's clipboard. A dark turf field drawn like a playbook page, cream paper panels, ink-green text and one orange action color, set in Figtree. Zones on result screens use Madden's colors. See [design/DESIGN.md](design/DESIGN.md).

## Game World Fiction

Light, grounded fiction. The "world" is the real NFL season happening this week.

- The player is an armchair offensive coordinator, called in from the couch for one play.
- Each puzzle is framed as a broadcast moment: down and distance, score, time, field position, and a one-line setup ("A playoff contender, down 4, facing 4th & 3 on Sunday Night").
- Teams and players are described generically (e.g., "the home team," "their star receiver") rather than by name.
- Tone: trash talk everywhere, at the pros and at the player — "The real OC ran a QB sneak. It got stuffed. You converted in two reps." Every line still names the cause first ("Swatted. The safety was parked on that corner.").

## Monetization

Free. No ads, no paid tier, no paywalled puzzles.

## Platform(s), Technology, and Scope

**Platforms:**

- Web first: responsive mobile-browser game, installable as a PWA.
- Native iOS/Android via a wrapper later, only if traction justifies app-store work.

**Technology:**

- TypeScript + React + SVG. React handles the menus, briefing, and result screens; SVG renders and animates the field. No game engine.
- Static hosting; each day's puzzle ships as a JSON file.
- A single small results API that collects anonymous results to power the "% of players who beat the pros" stat, hosted on Cloudflare (Worker + D1).
- No accounts at launch; streaks and stats live in local storage. Leaderboards would require accounts later.
- A deterministic, rule-based play simulation (routes, coverage assignments, pass-rush timing vs. protection, throw timing) — no randomness.

**Scope:**

- Solo project, shipped ASAP to catch the rest of the 2026 NFL regular season and playoffs.
- **MVP:**
  - Daily puzzle with up to 4 reps
  - Pass plays only
  - A small set of formations (set per puzzle), a route tree, basic protection options, and a primary read
  - A handful of defensive coverages (e.g., Cover 0/1/2/3/4, man and zone) with pre-snap disguise
  - Result screen with the real-call reveal and share card
  - Results API for the "% beat the pros" stat
  - Local streaks
- **Post-MVP:** the Omaha audible (see Interactivity), run plays and QB sneaks, archive, practice mode, hard mode, leaderboards, art variants, native apps.
- **Target ship date:** early November 2026, leaving roughly 9–10 regular-season weeks plus the full playoffs.

**Risks:**

- **Name.** Peyton Manning's media company is Omaha Productions, named after the same audible, and holds a USPTO trademark for "OMAHA PRODUCTIONS" covering entertainment services. Get a trademark check before launch, and have a fallback name ready.
- **NFL intellectual property.** Team names, logos, uniforms, and player names and likenesses are licensed by the NFL and NFLPA. Game situations are facts, but describe them without marks.
- **Content pipeline.** One solo creator authoring 7 puzzles a week during the season is the real bottleneck. Puzzle authoring tools must be fast.
- **Competition.** Monday QB already occupies nearby space; the differentiation above has to show up in the first 30 seconds of play.

## Core Loops

**Moment-to-moment (one rep, ~30–60 seconds):**

1. Read the defense's pre-snap look.
2. Design the play: protection, routes, primary read.
3. Snap.
4. Watch the play resolve.
5. Get per-receiver feedback.

**Daily session (2–5 minutes):**

1. Briefing on the real situation.
2. Up to 4 reps to convert, learning more about the defense with each failed rep.
3. Result and score.
4. Real-call reveal: what the pros called and what happened, plus the percentage of players who beat it.
5. Share card.

**Long-term (weekly / season):**

- Daily streaks
- Running Coach Rating
- Puzzles tied to the current NFL week (Thursday-night through Monday-night games)
- Season résumé at the Super Bowl

## Objectives and Progression

- **Daily objective:** convert the situation. Each puzzle names its goal: a first down or a touchdown.
- **Score:** reps used plus a bonus.
  - Base: 1 rep = 100, 2 reps = 75, 3 reps = 50, 4 reps = 25, out of reps = 0.
  - Bonus on the converting rep: +20 for a touchdown when the goal is a first down, otherwise +1 per whole yard past the line to gain, up to +10. A touchdown-goal puzzle earns no bonus. The top score is 120.
  - The bonus never closes the 25-point gap between reps, so solving in fewer reps always beats a flashier play in more reps.
- **Progression:** Wordle-light, not RPG.
  - Streak (consecutive days solved)
  - Win distribution by reps
  - Coach Rating (season average)
  - "Beat the pros" count
- **Difficulty:** each puzzle shows a difficulty rating. Proposal: ramp difficulty through the NFL week, the way the NYT crossword gets harder through the week. No hard mode at launch; revisit if experienced players ask for one.

## Game Systems

**Player-facing:**

- **Situation briefing** — down, distance, score, time, timeouts, field position, and a one-line real-world setup.
- **Play designer**
  - The puzzle sets the formation; the player doesn't choose it.
  - Assign each eligible receiver a route from the route tree (go, slant, out, curl, post, corner, flat, wheel, etc.).
  - Set protection: a blocker count (5-man, 6-man, 7-man) and a line call (slide left, man, slide right).
    - 5-man: the line only; the RB and TE run routes.
    - 6-man: the RB always stays in as the 6th blocker.
    - 7-man: the RB and TE stay in. Hidden when the formation has no TE, or the TE is lined up outside.
  - Choose the QB's primary read.
- **Defense** — a hidden defensive call (coverage plus pressure) fixed for the puzzle, shown to the player only as a pre-snap alignment that may disguise the real call.
- **Play resolution** — a deterministic simulation animates the play top-down and produces an outcome: completion with yards gained, incompletion, interception, or sack.
- **Rep feedback** — after each rep, each receiver is marked open, contested or covered with a shape badge (check, wave, ✕), and the result screen draws the defense's play art so the post-snap coverage is visible. `TODO:` how much a failed rep reveals is the key balance question — too much and rep 2 is trivial, too little and it's guesswork. Settle it in playtesting.
- **Scoring and share card** — one emoji tile per rep showing that rep's outcome (🟥 incomplete, sack or interception · 🟨 gained yards but short · 🟩 converted), plus the result and score. Spoiler-free.
- **Real-call reveal** — after the puzzle ends, a text description of what the real offense called and the real result, plus the percentage of players who beat it (from the results API).
- **Stats and streaks** — stored locally at launch.

**Behind the scenes:**

- **Puzzle authoring tool** — reuses the play designer to set the offensive formation, place the defense, set the hidden call and success condition, and record the real-world reveal text.
- **Solvability check** — before publishing, the author confirms at least one design converts the puzzle in the simulation.
- **Daily scheduler** — publishes the new puzzle at midnight US Eastern, so every player gets it at the same moment and group chats across time zones don't spoil it.
- **Results API** — records each anonymous result and returns the day's "% beat the pros" figure.

## Interactivity

- **Input:** touch first; mouse on desktop uses the same interactions.
  - The design happens in three steps in a bottom bar: Protect, Routes, Read.
  - Protect: pick a blocker count and a line call from two rows of toggles.
  - Routes: tap a receiver on the field, swipe a carousel of route cards, then pick a set depth (5, 10 or 15 yards) from a toggle row. Snapping to a route tree instead of freehand drawing keeps phones precise and keeps the simulation tractable. Freehand drawing could be a later expert mode.
  - Read: pick the receiver the QB looks to first.
  - A large "Snap" button.
- **Watching:** replay controls (replay, slow-mo, scrub) after each rep, so the player can study why a play worked or failed.
- **Feedback:** short text callouts at the decisive moment ("Safety rotated down — Cover 3"), color-coded receivers, and an end-of-rep summary.
- **Sharing:** one-tap copy of the share card via the native share sheet on mobile.
- **Accessibility:** colorblind-safe feedback (shapes or patterns in addition to green/yellow/red), playable with sound off, readable at phone width.

**Post-MVP — the Omaha audible:** after the player locks in a design, the defense shifts its pre-snap look, and the player gets one audible per puzzle to change a route or the read before the snap. It ties the name to the gameplay, but every puzzle needs a second defensive look authored, so it ships after the core game.
