# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

TypeScript + React + SVG, no game engine. React renders the briefing, menus and result screens; SVG renders and animates the field. Static hosting, with each day's puzzle shipped as a JSON file. A small anonymous results API on Cloudflare (Worker + D1). No accounts at launch; stats and streaks live in local storage. Installable as a PWA. A native wrapper may come later, but it keeps the web design language.

## Users

- **Primary:** NFL fans who already play daily puzzles (Wordle, Connections, Immaculate Grid) and want one built on football knowledge instead of trivia.
- **Secondary:** fantasy players and "armchair quarterbacks" who second-guess play calls from the couch.
- **Tertiary:** X's-and-O's enthusiasts and youth/amateur coaches who use playbook tools.
- **Situation:** a 2–5 minute session on a phone, usually muted. Most likely on game-day evenings, Monday/Tuesday after the weekend's games, and commutes.
- **Job:** read the defense, design one play, snap it, and prove they'd have out-coached the pros. Then share the result in a group chat.

## Product Purpose

Omaha is a daily football puzzle. Each day's puzzle recreates one game-deciding play from the past week of the NFL. The player is the offensive coordinator: they design a pass play (protection, routes, primary read) from the puzzle's set formation against a hidden defensive call and get up to 4 reps to convert. A deterministic simulation resolves each rep. Then the game reveals what the real team called and the percentage of players who beat it.

Success means a daily habit during the NFL season, measured in streaks, return visits and share cards posted to group chats.

## Positioning

- **You design the play; you don't pick it from a menu.**
- **One play from a real situation last week.** Not a full drive, and not trivia.
- **The comparison with the real call is the payoff:** "Could you do better than the pros?"

The nearest competitor is Monday QB (monday-qb.com). It covers a whole drive and has players select plays. Omaha's difference has to be obvious within the first 30 seconds of play.

## Operating Context

- **Daily ritual:** one shared puzzle per day, published at midnight US Eastern so every time zone gets it at the same moment.
- **Season-bound:** puzzles track the current NFL week, Thursday night through Monday night, and the season ends at the Super Bowl.
- **Sharing:** a spoiler-free emoji share card, one tile per rep showing its outcome (incomplete / short / converted), shared through the native share sheet on mobile.
- **Phone-first touch input:** three steps in a bottom bar. Protect (blocker count and line call toggles), Routes (tap a receiver on the field, swipe a carousel of route cards, pick a 5/10/15-yard depth), Read (pick the first read), then a large Snap button. On desktop the mouse does the same things.
- **Replays:** replay, slow-mo and scrub controls after each rep, so the player can study why a play worked or failed.

## Capabilities and Constraints

**MVP:**

- Daily puzzle with up to 4 reps.
- Pass plays only.
- A small formation set (each puzzle sets its formation; the player never picks one), a route tree, basic protection options and a primary read.
- A handful of coverages (Cover 0/1/2/3/4, man and zone) with a pre-snap disguise.
- A result screen with the real-call reveal and the share card.
- The "% beat the pros" stat.
- Local streaks.

**Rules:**

- The simulation is deterministic and rule-based, with no randomness. The same design always produces the same result.
- **Rep outcomes:** completion with yards gained, incompletion, interception, or sack.
- **Receiver feedback:** each receiver is marked open, contested or covered.
- **Scoring:** 100 / 75 / 50 / 25 for solving on rep 1–4, 0 when out of reps, plus a bonus on the converting rep: +20 for a touchdown when the goal is a first down, otherwise +1 per whole yard past the line to gain, up to +10. Fewer reps always wins, and the top score is 120.

**Terminology:**

- **Rep:** one attempt.
- **Briefing:** the situation shown before designing.
- **Real-call reveal:** what the pros called and what happened.
- **Coach Rating:** the season average.
- **Beat the pros:** solving the puzzle. Puzzles only feature plays the real offense failed to convert.

**Hard constraints:**

- No real team names, logos, uniforms, or player names or likenesses. Situations are described generically ("the home team", "their star receiver").
- Audio is optional; everything must work muted.
- Solo creator, with a target ship date of early November 2026. Puzzle authoring must be fast.

**Post-MVP:**

- The Omaha audible: the defense shifts its pre-snap look, and the player gets one audible per puzzle.
- Run plays.
- Archive, practice mode and hard mode.
- Leaderboards, which require accounts.
- Native apps.

**Undecided:**

- How much a failed rep reveals about the defense beyond what the result screen already shows (the defense's play art; the coverage name appears only on the final rep or once solved). This will be settled in playtesting.
- Whether difficulty ramps through the NFL week.

## Brand Commitments

- **Name:** Omaha is the committed name. It comes from Peyton Manning's audible call at the line. The Omaha Productions trademark check is still pending, but Mike has chosen to commit to the name.
- **Voice:** trash talk everywhere, aimed at the pros and at the player's own mistakes. Every line names the cause first, then the jab ("Swatted. The safety was parked on that corner."), so a failed rep always explains itself.
- **Visual direction:** a playbook-diagram field (top-down, all-22 style) on cream paper with ink-green text and one orange action color, set in Figtree. The full system is in [design/DESIGN.md](design/DESIGN.md). Pixel-art and low-poly skins remain possible variants to test later.

## Evidence on Hand

None yet. There are no puzzles, players, results, testimonials or press. The "% beat the pros" figure, streak counts and any player numbers must come from the live results API and never be invented for mockups shown as real. Real-call reveals rest on public game facts and must be described without NFL marks.

## Product Principles

1. **Read the defense.** The skill being tested is recognizing the coverage and attacking its weakness. Everything serves that read.
2. **Legible over realistic.** The player must be able to see at a glance why every rep failed. If they can't, the puzzle is unfair.
3. **Deterministic and fair.** Same design, same result, so every player's score can be compared with everyone else's.
4. **Topical.** The puzzles follow the real NFL week. Freshness is part of the product.
5. **Couch-sized.** One play, 2–5 minutes, one hand, sound off.

## Accessibility & Inclusion

- Receiver feedback must be colorblind-safe: shapes or patterns in addition to green/yellow/red. In the app, share-card tiles also carry a label or icon; the pasted emoji text relies on the result line beside it.
- Fully playable with sound off.
- Readable and operable at phone width with touch targets sized for thumbs.
