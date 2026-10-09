# Landing

## Purpose

The app's home screen. It shows today's puzzle (situation, briefing, goal, reps) and sends the player into it with one tap. Secondary links lead to the puzzle list and the tutorial.

## Prototypes

| File | Shows |
|---|---|
| `prototype.html` | Phone, 390×844, light theme. Today's puzzle not started. |
| `prototype-desktop.html` | Desktop (≥900px), light theme. Hero field art on the stage at left; a 520px panel at right with the wordmark, tagline and puzzle card; "All puzzles" and "How to play" links in the top bar. Same not-started state. |
| `prototype-dark.html` | Phone, dark theme. Same state. |
| `prototype-desktop-dark.html` | Desktop, dark theme. Same state. |

Both light prototypes use Snap Orange Text (`snap-orange-text`, #B4441C) for the "Today's puzzle" label and the goal icon. Where the prototypes and DESIGN.md disagree on a token value (CTA label size), this spec follows DESIGN.md. The in-progress, finished, loading, error and first-visit states are not prototyped; they are described under States.

## Entry and exit

**Entry**
- App launch or opening the site root (including from the installed PWA).
- Back from Puzzles (its header back button links here).
- Close from Share, if Share's close button returns here (open question in the Share spec).

**Exit**
- Primary CTA "Play today's puzzle" → Protect (`04-protect`) for today's puzzle, starting on rep 1 with the defaults set in README Decisions (5-man, man).
- "All puzzles" → Puzzles (`02-puzzles`).
- "How to play" → Tutorial step 1 (`03-tutorial`, `prototype-1.html`).
- In the in-progress and finished states the primary CTA goes elsewhere; see States.

## Layout

Phone baseline 390×844. Background Cream (`cream`), text Ink Green (`ink-green`). The screen does not scroll at 844px tall.

Top to bottom:

1. **Hero field**, absolutely positioned at top 0, 390×520 SVG (viewBox `0 0 390 520`).
   - Turf (`turf`) with Turf Stripe (`turf-stripe`) bands 64px tall at y 0, 128, 256, 384.
   - Yard lines every 64px (`field-line` at 30% opacity, 1px); hash marks at x 136–150 and 240–254 every 13px (`field-line` at 35%).
   - First-down line at y 330 (`first-down-line`, 2px, 90% opacity); line of scrimmage at y 420 (`scrimmage-line`, 2px, 90% opacity).
   - Five linemen (r 8, `lineman` fill, `lineman-stroke` 1.2px) at x 153, 174, 195, 216, 237, y 420.
   - Receivers (r 8.5, `receiver-fill`, 2.2px ring, white 6.5px 700 label): X (`receiver-x`) at 52,422; Y (`receiver-y`) at 258,421; H (`receiver-h`) at 312,442; Z (`receiver-z`) at 372,434; RB (`receiver-rb`) at 168,482. QB (`quarterback` fill, `quarterback-text` label) at 195,482.
   - Routes, 2.4px, round caps and joins, open arrowheads: X out-breaking route (`receiver-x`), Y corner (`receiver-y-route`), H out (`receiver-h-route`), Z go (`receiver-z`), RB check-down (`receiver-rb`). Path data is in the prototype; copy it.
   - Gradient overlay over the whole 390×520 hero: `linear-gradient(180deg, rgba(10,30,20,.86) 0%, rgba(10,30,20,.55) 34%, rgba(10,30,20,0) 58%)`.
   - The prototype draws the hero as fixed decorative art, not derived from the puzzle's formation. Build it that way.
2. **Wordmark block**, absolute, left 24, right 24, top 72; column with 10px gap; text Cream.
   - Wordmark "Omaha", rendered uppercase, Hero type (`hero`: 76px, 900, line-height 0.86, -0.02em).
   - Tagline, 18px, 600, line-height 1.3, color `win-subtext` (#D9E3DC), max-width 280px.
3. **Puzzle card** (`section`), absolute, pinned to the bottom, full width, 392px tall, overlapping the hero's bottom 68px.
   - Background `cream`, top corners `sheet` radius (28px), shadow `0 -12px 32px rgba(0,0,0,.35)`, padding 24px 20px 28px.
   - Column, `justify-content: space-between`: an info group on top and the button group at the bottom.
   - **Info group** (column, 14px gap):
     - Header row (space-between, baseline): "Today's puzzle" label (13px, 800, uppercase, 0.04em, `snap-orange-text`) on the left; "Puzzle #[N]" (13px, 600, `sage-muted`) on the right.
     - Situation group (column, 10px gap):
       - Down and distance + spot on one baseline row with 8px gap: down and distance in Headline type (`headline`: 40px, 900, line-height 1, uppercase, -0.01em); spot in 16px, 800, uppercase, `sage-muted`.
       - Briefing paragraph: 16px, line-height 1.4, `sage-body`.
     - Goal and reps row: space-between, centered, 14px top padding, 1px `sand-border` top border.
       - Left: 18×18 target icon (three concentric circles, stroke 2.2 in `snap-orange-text`, the One Action Rule's status-accent color) + goal text, 8px gap, 14px 700 (Body strong).
       - Right: four 12×12 squares (3px radius, 1.5px `ink-green` border, 4px gap) + "4 reps" (14px 700), 8px gap.
   - **Button group** (column, 10px gap):
     - Primary CTA: full width, 56px tall, `cta-result` radius (16px), `snap-orange` fill, `on-orange` text in `button` type (19px, 900, uppercase, 0.01em; the prototype still shows 18px), an 18px filled play triangle before the label with 8px gap. Hover/pressed `snap-orange-deep`.
     - Secondary row: two equal buttons, 10px gap. Each is 48px tall, 14px radius, 1px `sand-border`, `paper-white` fill, `ink-green` text 14px 800 uppercase, 18px stroke icon before the label with 8px gap. "All puzzles" uses a 2×2 grid icon; "How to play" uses a circled question mark.

### Desktop (`prototype-desktop.html`, ≥900px)

Column: a 64px top bar, then a two-column body that fills the rest of the viewport.

1. **Top bar**: 64px, padding 0 28px, 1px `sand-border` bottom border, space-between, centered.
   - Left: "OMAHA" wordmark, 24px, 900, 0.02em.
   - Right: `nav` with two text links, "All puzzles" and "How to play", 24px gap, 14px 800 uppercase, `ink-green`, no underline. (The prototype links are `href="#"`; they go to Puzzles and Tutorial step 1.)
2. **Body**: grid `minmax(0,1fr) 520px`. This is DESIGN.md's desktop grid with the panel widened from 440px to 520px.
3. **Stage** (left column): `turf-stage` background, 24px padding, content centered. The hero field SVG from the phone (viewBox `0 0 390 520`, same art) at `height: calc(100vh - 112px)`, `width: auto`, `max-width: 100%`, 10px radius. The phone's gradient overlay is not drawn on desktop, and the wordmark is not on the field.
   - The prototype also gives the SVG inline `position: absolute; left: 0; top: 0`, which pins it to the stage's top-left corner instead of centering it. This spec follows the centered `.field` rule (see Open questions).
4. **Panel** (right column, `aside`, `aria-label="Today's puzzle"`): 520px wide, 1px `sand-border` left border, padding 48px 44px, column, 36px gap, content centered vertically. No sheet radius or shadow.
   - **Wordmark group** (column, 14px gap):
     - `h1` "Omaha", 96px, 900, line-height 0.86, -0.02em, uppercase, `ink-green`.
     - Tagline: 20px, 600, line-height 1.35, `sage-body`, max-width 380px.
   - **Puzzle group** (column, 28px gap, 28px top padding, 1px `sand-border` top border):
     - Info group: identical to the phone info group (header row, situation group, goal and reps row).
     - Button group: same structure as the phone. The primary CTA uses DESIGN.md's desktop variant (58px, 10px radius, 19px label). The prototype still renders the phone button (56px, 16px, 18px) because a later CSS rule overrides it. The secondary buttons are the same as on the phone.
   - No keyboard hints (`kbd`) appear on this screen.
5. **Below 900px**: per DESIGN.md, the desktop layout collapses to the phone layout (`prototype.html`).

### Dark theme (`prototype-dark.html`, `prototype-desktop-dark.html`)

Only what differs from light:
- Page, puzzle card and desktop panel background Charcoal (`dark-bg`); text, desktop `h1` and rep squares Cream.
- "Today's puzzle" label and goal icon Snap Orange on Dark (`snap-orange-on-dark`, #F59A72).
- Puzzle number and spot Dark Muted (`dark-muted`); briefing and desktop tagline Dark Muted Strong (`dark-muted-strong`).
- Goal-row rule, desktop top-bar border, panel left border and puzzle-group rule Dark Border (`dark-border`).
- Secondary buttons: Dark Surface (`dark-surface`) fill, 1px Dark Border, Cream text and icons.
- Links Cream; hover Paper White.
- Unchanged: the hero field, the phone gradient overlay, the phone wordmark and `win-subtext` tagline over the hero, the card shadow and the orange CTA.

## Content and copy

Exact strings. Copy marked **[puzzle]** is authored per puzzle and comes from the puzzle JSON.

| Element | Copy | Source |
|---|---|---|
| Wordmark | `Omaha` (displayed uppercase) | static |
| Tagline | `A real situation from last week. Four reps to out-coach the pros.` | static |
| Card label | `Today's puzzle` | static |
| Puzzle number | `Puzzle #[N]` | **[puzzle]** number; `[N]` is replaced by the fixture's numeric ID |
| Down and distance | `3rd & 10` (displayed uppercase) | **[puzzle]** down + distance |
| Spot | `own 45` (displayed uppercase) | **[puzzle]** spot (`own`/`opp` + yard line) |
| Briefing | `Sunday night. Down 4 with 1:12 to go and one timeout left. A field goal won't cut it, so the drive lives or dies on this first down. No pressure.` | **[puzzle]** briefing. Gives score/clock context and stakes in the trash-talk voice. At most four lines on phone (DESIGN.md Body). |
| Goal | `Goal: pick up the first down` | **[puzzle]** goal. Goals vary by puzzle: first down, touchdown, get out of bounds. |
| Reps | `4 reps` | static in the not-started state (every puzzle has 4 reps) |
| Primary CTA | `Play today's puzzle` | static |
| Secondary | `All puzzles`, `How to play` | static |
| Desktop top-bar wordmark | `OMAHA` | static |
| Desktop nav links | `All puzzles`, `How to play` | static |
| Hero `aria-label` | `A play drawn on the field: four receivers' routes and the running back's check-down` | static |
| Card `aria-label` | `Today's puzzle` | static |

The prototype briefing is placeholder content. The situation and briefing must never name a real team or player.

## Components

- **Primary button**: `button-primary-result` on phone (56px, 16px radius, 19px `button` type); DESIGN.md's desktop variant on desktop (58px, 10px radius, 19px). One per screen.
- **Secondary link button**: 48px, 14px radius, white with Sand Border. Not a DESIGN.md component; specific to this screen.
- **Top-bar nav links** (desktop): plain text links, specific to this screen.
- **Rep indicator**: a 12px miniature of DESIGN.md Rep boxes (four boxes, Ink Green border). No number inside.
- **Result sheet** shape (`sheet` radius) for the phone puzzle card, with the Landing/Tutorial sheet shadow (`0 -12px 32px rgba(0,0,0,.35)`) from DESIGN.md Elevation.
- **Field glyphs** for players and routes in the hero (DESIGN.md Field glyphs and Player palette).

## States

1. **Not started (prototyped).** Today's puzzle has no reps used. Rep indicator shows four empty Ink Green outlined squares and "4 reps". CTA "Play today's puzzle" → Protect, rep 1.
2. **In progress (not prototyped).** At least one rep used, puzzle not converted, reps remaining.
   - Rep indicator shows used reps as used and the rest as remaining, following DESIGN.md Rep boxes semantics (used rep: Ink Green border with 12% green fill; unused: outlined). The count text shows reps remaining; exact string is an open question.
   - The CTA resumes the puzzle. Label and destination are open questions.
   - Situation, briefing and goal are unchanged.
3. **Finished, converted (not prototyped).** The puzzle was converted on rep N.
   - The card shows the outcome: converted, on which rep, using the outcome colors from README Decisions (green converted, orange failed, gold short). Exact layout and copy are open questions.
   - The CTA goes to the player's result or to Share; which one, and its label, are open questions.
4. **Finished, out of reps (not prototyped).** Four reps used without converting. Same as state 3 but the outcome is out of reps (all four reps spent, orange/gold per rep). Layout, copy and CTA destination are open questions.
5. **First-ever visit (not prototyped).** No local storage record of any play. Renders as state 1. Whether the app routes first-time players to the Tutorial instead is an open question.
6. **Loading (not prototyped).** While the index or selected puzzle JSON loads, retain the hero, wordmark and secondary navigation. Replace puzzle fields with “Loading today's puzzle…” and “Drawing up the situation.” Do not show the primary CTA.
7. **Puzzle unavailable (not prototyped).** Retain the hero, wordmark and secondary navigation; do not show the primary CTA. A failed fetch or `EngineError` shows “Couldn't load today's puzzle.” and “Please refresh to try again.” An index with no entry dated today or earlier shows “No puzzle available yet.” and “Check back for the next situation.”

## Interactions

- Tap the primary CTA → see Entry and exit / States.
- Tap "All puzzles" → Puzzles.
- Tap "How to play" → Tutorial step 1.
- Nothing else on the screen is interactive. The hero field and the card body are not tappable.
- Hover (pointer devices): primary CTA fill becomes `snap-orange-deep`; text links hover to `ink-green-deep`.
- Keyboard focus order (phone): primary CTA → All puzzles → How to play. Enter or Space activates the focused control. No shortcut keys are defined.
- All controls are links (`<a>`) in the prototype, since each navigates.
- **Desktop:** the top bar adds a second "All puzzles" and "How to play" pair with the same destinations. Focus order: top-bar All puzzles → top-bar How to play → primary CTA → panel All puzzles → panel How to play. The stage field is not interactive.

## Motion

None.

## Accessibility

- Hero SVG: `role="img"` with the `aria-label` listed in Content and copy.
- Wordmark is the page `h1`. The puzzle card is a `section` with `aria-label="Today's puzzle"`. On desktop the whole panel is an `aside` with that label, and the top-bar "OMAHA" is not a heading.
- Decorative icons (play triangle, target, grid, question mark, rep squares) are `aria-hidden="true"`. The rep squares are decorative because "4 reps" carries the meaning; in the in-progress state the text must state reps remaining so the count is not color-only.
- Contrast:
  - "Today's puzzle" in `snap-orange-text` on Cream is 4.84:1: passes AA.
  - White on Snap Orange is 3.71:1. The CTA label at 19px 900 is large text, so it passes AA.
  - Sage Muted on Cream 4.93:1, Sage Body on Cream 6.21:1: pass.
- Touch targets: CTA 56px (58px desktop), secondary buttons 48px tall. Desktop nav links must have a hit area of at least 44×44px (DESIGN.md Touch targets); extend it with padding without changing the look.
- Reduced motion: nothing animates.

## Data

| Field | Source |
|---|---|
| Puzzle number `N` | puzzle JSON |
| Down, distance | puzzle JSON |
| Spot (side `own`/`opp`, yard line) | puzzle JSON |
| Briefing text | puzzle JSON (authored) |
| Goal | puzzle JSON `goal` (engine type: first down / touchdown) and authored `goalText` (complete display copy) |
| Rep count (4) | constant |
| Today's puzzle ID / date | determined by the date in US Eastern time (puzzles publish at midnight ET) |
| Reps used, per-rep outcomes, converted flag, finished flag | local storage, keyed by puzzle |
| Whether the player has ever played or seen the tutorial | local storage (only needed if first-visit routing is adopted) |

## Open questions

- **First-ever visit:** route first-time players to the Tutorial automatically, or always show Landing?
- **In-progress CTA:** label (for example a "resume" wording) and destination. Resume on Protect with the last design loaded (matching Run It Back), or on the last screen the player saw (for example a result they had not acted on)? Does an unsnapped design in progress persist?
- **In-progress reps text:** exact copy for reps remaining (the Puzzles list uses "N reps left").
- **Finished states:** CTA destination (result or Share), CTA label, and how the outcome is drawn on the card (rep tiles like the share card, a text line, or both).
### Resolved shell and Landing decisions

- **Goal row wording:** authored per puzzle, with no new character limit. Allow wrapping beside the rep indicator.
- **Loading, error and off-season:** keep the hero, wordmark and secondary navigation visible. Replace puzzle content with the status copy under States; show the primary CTA only when a puzzle is available.
- **Theme selection:** follow the system setting through `prefers-color-scheme`; no toggle.
- **Desktop duplicate links:** keep both the top-bar navigation pair and the panel pair.
- **Desktop field position:** center the fixed hero art on the field stage; do not copy the prototype's top-left positioning.
- **Delivery scope:** in-progress, finished and first-visit behavior remains deferred to #57. `/puzzles`, `/how-to-play` and `/puzzle/:n` render labelled route placeholders until their screen pieces land; the primary CTA currently navigates to `/puzzle/<n>`, not implemented Protect controls.

## Acceptance criteria

- [ ] At 390×844 the screen matches `prototype.html`: hero 520px tall, puzzle card 392px tall pinned to the bottom with 28px top radius, no page scroll.
- [ ] Wordmark, tagline, card label, CTA and secondary labels match the strings in Content and copy exactly.
- [ ] Puzzle number, down and distance, spot, briefing and goal render from the puzzle JSON; changing the fixture changes the screen.
- [ ] No real team or player name appears in any fixture or static copy.
- [ ] Colors use the DESIGN.md tokens named in Layout: "Today's puzzle" and the goal icon are `snap-orange-text`, and the tagline is `win-subtext` on phone and `sage-body` on desktop. The only raw values are the phone gradient overlay and the 14px secondary-button radius.
- [ ] The primary CTA label is 19px 900 (`button` type) on phone and desktop.
- [ ] At ≥900px the layout matches `prototype-desktop.html`: 64px top bar with wordmark and two nav links; field art centered on a `turf-stage` stage; a 520px panel with the 96px wordmark, tagline and puzzle card; CTA 58px tall with a 10px radius.
- [ ] Below 900px the phone layout is shown.
- [ ] Desktop nav links go to Puzzles and Tutorial step 1, and each has a hit area of at least 44×44px.
- [ ] "Play today's puzzle" navigates to Protect for today's puzzle on rep 1 with 5-man / man selected.
- [ ] "All puzzles" navigates to Puzzles; "How to play" navigates to Tutorial step 1.
- [ ] Focus order is CTA → All puzzles → How to play, and each activates with Enter and Space.
- [ ] Hero SVG has `role="img"` and the specified `aria-label`; decorative icons are `aria-hidden`.
- [ ] With local storage showing reps used and no conversion, the rep indicator and count reflect reps used (state 2), pending the open copy and CTA decisions.
- [ ] With local storage showing a finished puzzle, the card shows the outcome and the CTA no longer starts rep 1 (states 3–4), pending the open decisions.
- [ ] Dark theme matches `prototype-dark.html` and `prototype-desktop-dark.html`; the hero field, gradient overlay and CTA are identical in both themes.
