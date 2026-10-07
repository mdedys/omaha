# Live play

## Purpose

Play the rep the player just designed. The snap animates top-down: players move from their pre-snap spots to their end spots, a gold vision cone follows the quarterback's current read, and the ball flies from the throw to the catch point. A caption area narrates each phase in the trash-talk voice. When the play ends, the result appears, the defense's play art fades in, and the last frame is exactly the Result screen (08-result).

The play shows players and the ball only. No route lines and no zones until the reveal.

## Prototypes

| File | Shows |
|---|---|
| `prototype.html` | Phone, 390×844. Rep 1 on a 10 s loop (SVG SMIL + CSS keyframes). Six in protection, line slides left, RB picks up the edge rusher, first read the TE on a corner route, broken up by the safety against Cover 4. The camera pans and the sheet slides up into the cream INCOMPLETE result. From 9.4 s to 9.9 s the prototype reverses the reveal so it can loop; that is prototype-only. |
| `prototype-desktop.html` | Desktop ≥900 px, same rep and the same 10 s timings. Standard field framing with no camera pan. The right panel shows a 56 px caption word and line and a "Skip to result" button with an `Esc` hint. At the reveal the panel swaps to the desktop result panel while the play art fades in. |
| `prototype-dark.html` | Phone, dark theme. Same rep and timings, ending in the dark cream-sheet (failed rep) result. |
| `prototype-desktop-dark.html` | Desktop, dark theme. Same rep and timings, swapping to the dark desktop result panel. |

## Entry and exit

- **Entry:** the Snap button on the Read step (06-read). The rep's design is locked, and the simulation result for it (see Data) must be available before the Set phase starts.
- **Exit (automatic):** at the end of the reveal the screen is the Result screen (08-result) for this rep, with no visible jump. On phone the Result screen's field, pills and sheet match the last frame pixel for pixel. On desktop the field and panel match the desktop Result screen.
- **Exit (Skip):** jumps straight to the Result screen with no reveal animation.
- **Exit (reduced motion):** the Result screen shows at once (see Motion).

## Layout

### Phone (390×844, `prototype.html`)

Field units are SVG units. The phone scale is 390/403 = 0.9677 px per unit.

| Region (top to bottom, by z-order) | Position and size | Notes |
|---|---|---|
| Field | SVG at (0,0), 390×844 px, `viewBox="0 -180 403 872"` | Shows field y −180 to 692: the standard 0–495 field plus 180 units downfield. Turf, stripes, hash marks, yard lines and numbers continue over the extended range. The prototype draws turf from y −300 to 900, stripes also at y −209, −81 and 560 (64 tall), yard lines also at y −209, −145, −81, −17, 496, 560, 624 and 688, and numbers "10" at y −209, "20" at y −81 and "30" at y 560 on both sides. Sidelines at x 1 and 402 run the full height. Line of scrimmage (y 366) and first-down line (y 238) as on every field. |
| Field shade | 390×479 px at (0,0) | Transparent during the play, then the Field shade value `rgba(6,13,10,.22)` after the reveal. It does not move with the camera. |
| Situation pills | `left:12px; right:12px; top:14px`, flex, `justify-content: space-between` | Two `field-pill`s. Fixed during the whole screen and identical to their Result screen position. |
| Live caption bar | `bottom:0`, full width, 92 px tall | Padding `0 14px 0 20px`, gap 12 px, Cream background. Top corners 22 px (DESIGN.md Shapes, live caption bar). Live-play caption bar shadow `0 -8px 24px rgba(0,0,0,.35)`. Holds the caption area (flex-grow, 48 px tall) and the Skip button. |
| Result sheet | Full width, 398 px tall, starts at `bottom:-420px` | Hidden below the screen until the reveal, then `bottom:0`, covering the caption bar. Content and variants per 08-result. |

Camera: during the play, field y 0 sits 174.2 px below the top of the screen (180 units × 0.9677). The reveal moves the field up by 180 units (174.2 px at 390 wide), so field y 0 meets the top of the screen. Field y 0–495 then fills 390×479 px, which is the Result framing. The sheet top (446 px) overlaps the field's bottom 33 px. At other phone widths, pan by 180 units times the rendered scale.

### Desktop (≥900 px, `prototype-desktop.html`)

| Region | Values |
|---|---|
| Top bar | As the 08-result desktop top bar: 64 px, "OMAHA", "3rd & 10" / "own 45", "#148", "Down 4 · 1:12", and four 9 px pips. The current rep's pip is a 2 px Ink Green ring with no fill; the others are Sand Border. `aria-label="Rep 1 of 4"`. |
| Field stage | Grid column `minmax(0,1fr)`, background #0C3322, padding 24 px, field centred. Field SVG `viewBox="0 0 403 495"` (standard framing, no extended turf, no camera pan), `height: calc(100vh - 112px)`, `width: auto`, `max-width: 100%`, radius 10 px. No field shade, and no pills on the stage during the play. |
| Panel (`<aside aria-label="Live play">`) | 440 px, 1 px Sand Border on the left, `position: relative`, no padding of its own. It holds two stacked layers (`position:absolute; inset:0`), each with padding 28 px and a column layout with a 26 px gap. |
| Live layer (until the reveal) | Caption area 120 px tall. Each phase is a column with a 12 px gap: the phase word at 56 px 900, line-height 0.9, uppercase, Charcoal; the line at 18 px 600, Sage Body. Then a flex-grow spacer. Then the Skip button, full panel width: `button-skip` raised to 52 px tall with a 16 px label reading "Skip to result", followed by `kbd` "Esc" with a Cream background. |
| Result layer (from the reveal) | Identical to the 08-result desktop panel: tile, headline, result line, stat triplet, rep row, actions, and the `R` hint. |

Below 900 px the app uses the phone design (DESIGN.md Layout). The desktop prototype's stacked fallback is not shipped.

### Dark theme (`prototype-dark.html`, `prototype-desktop-dark.html`)

Only what differs from light:
- Page and caption bar background Charcoal (`dark-bg`); the bar keeps its shadow and 22 px corners.
- Phase word Cream; caption line Dark Muted Strong (`dark-muted-strong`), phone and desktop.
- Skip (`button-skip`): Dark Surface (`dark-surface`) fill, 1 px Dark Border (`dark-border`), Cream label and icon. The desktop `Esc` `kbd` has a Charcoal background.
- Desktop top bar and panel: borders Dark Border; spot and meta Dark Muted (`dark-muted`); pips Dark Border with a Cream ring on the current rep.
- The result sheet (phone) and result layer (desktop) follow the 08-result dark theme.
- Unchanged: the field, situation pills, vision cone, ball, play art and badges.

## Content and copy

| Element | Copy | Source |
|---|---|---|
| Situation pill, left (phone) and top-bar situation (desktop) | `3rd & 10 · own 45` (desktop: "3rd & 10" plus "own 45") | Puzzle data (down, distance, spot) |
| Situation pill, right (phone) and top-bar meta (desktop) | `Down 4 · 1:12` | Puzzle data (score margin, clock) |
| Desktop puzzle number | `#148` | Puzzle data |
| Skip button, phone | `Skip` (shown uppercase by CSS), `aria-label="Skip to result"` | Fixed |
| Skip button, desktop | `Skip to result` plus `kbd` `Esc`, `aria-label="Skip to result"` | Fixed |
| Field `aria-label` | Example: "Live play, rep 1: at the snap the line slides left and the quarterback's eyes go to the tight end, his first read; he throws the corner and the safety breaks it up, then the result appears with the defense revealed" | Generated per rep from the design and simulation |

Caption phases. On phone the word is 26 px and the line 13 px 600. On desktop the word is 56 px and the line 18 px 600. Word in Charcoal, line in Sage Body.

| Phase | Word | Prototype line (example) | Inputs the line needs |
|---|---|---|---|
| Set | `Set` (fixed) | "Six in protection. Nobody touches the QB." | Protection: blocker count, line call, who stays in (RB, TE) |
| Snap | `Snap` (fixed) | "Eyes locked on the tight end." | First read receiver |
| Throw | `Throw` (fixed) | "Corner route. Let it rip." | Targeted receiver, their route and depth |
| Outcome | Generated. Example: `Broken up` | "Swatted. The safety was parked there." | Outcome kind, yards gained versus the line to gain, cause (for example the defender role that made the play and how), targeted receiver |

Captions are generated per rep from the design and the simulation. The prototype strings are examples, not final copy. Every line follows the voice rule: cause first, jab second.

The outcome caption is play-by-play, and the sheet headline is the verdict. They differ on purpose: "Broken up" in the caption, "INCOMPLETE" on the sheet. The caption line can be shorter than the sheet's result line ("…parked there." against "…parked on that corner.").

Sheet and result-panel copy: see 08-result.

## Components

- **Field** (DESIGN.md Field palette, Layout › Field geometry). Phone uses the extended viewBox above; desktop uses the standard one.
- **Field glyphs:** players (receivers r=8.5, linemen r=8, defenders r=7.5, QB), **Ball**, **QB vision cone**. Defense play art, the dashed ball path and **Receiver feedback badges** appear only at the reveal and follow the 08-result drawing rules.
- **Situation pill** (`field-pill`), phone only.
- **Live caption bar** (phone). It follows DESIGN.md: 92 px, Cream, 22 px top corners, its own shadow, 26 px word over a 13 px line. Screen-specific values: caption area 48 px tall, 5 px gap between word and line, word line-height 0.9.
- **Skip** (`button-skip`). Phone: 44 px tall, padding `0 14px`, `rounded.control`, 1 px Sand Border, Paper White, Ink Green 14 px 900 uppercase label, 8 px gap, then a 16 px skip icon (play triangle plus bar, `aria-hidden`). Desktop: 52 px tall, 16 px label, full panel width, with an `Esc` `kbd`.
- **Result sheet** on phone (`result-sheet`, `result-sheet-win` or `result-sheet-over` per outcome); the desktop result panel on desktop. Both per 08-result.

**QB vision cone** (DESIGN.md Field glyphs): a wedge 176 units long and ±13° wide, path `M0 0 L176 -41 L176 41 Z`. Its origin is the QB's centre. It is filled with a horizontal linear gradient of Read Gold from 70% opacity at the QB to 0% at the far end. It is drawn above the field markings and below all players.

**Football in flight** (DESIGN.md Ball): ellipse rx 4.2, ry 2.7, Football fill, 0.8 white edge, rotated along its flight direction. The prototypes use a fixed `rotate(-40)`. It is drawn above players.

## States

| State | Prototype time | What shows |
|---|---|---|
| Set | 0–0.8 s | All players at pre-snap spots (the same positions as the Read step). Caption "Set". No cone, no ball. Skip enabled. |
| Snap (play running) | 0.8 s to the throw | Players move along their paths. Cone visible, aimed at the current read. Caption "Snap". |
| Throw (ball in the air) | throw to catch (3.1–3.7 s) | Ball flies from the QB to the catch point. Cone stops turning, then fades. Caption "Throw". |
| Outcome | catch to reveal (3.7–4.8 s) | Ball rests at the catch point. Players finish their paths (motion ends at 4.2 s). Caption shows the outcome word and line. |
| Reveal | 4.8–5.3 s | Phone: sheet slides up, camera pans, shade, play art and badges fade in. Desktop: the panel swaps to the result layer, then play art and badges fade in. See Motion. |
| Done | from 5.3 s | Identical to the Result screen for this rep. Hand off to 08-result. |
| Skipped | any time before the reveal ends | Result screen at once: final frame, play art, badges, the result sheet (phone) or result panel (desktop). No caption sequence. |
| Reduced motion | on entry | Same as Skipped, from the first frame. |
| Interception (not prototyped here) | — | Same sequence. The final frame keeps the football at the interception point, because a result draws the football only on an interception (DESIGN.md Ball). |
| Sack (not prototyped) | — | No throw, so there is no Throw phase and no ball. The outcome phase starts at the sack time from the simulation. When the cone ends is an open question. |
| Converted or final rep (not prototyped here) | — | The last frame must match the Result screen. On a converted rep that means a 3.5 px first-down line. On a converted rep or the final rep it also means the coverage key pill. How they appear during the reveal is an open question. |
| Sheet or panel variant | — | Cream, ink green or charcoal by outcome and reps left, per 08-result. |

## Interactions

- **Skip:** tap, click, or Enter/Space while focused → the Result screen at once (state Skipped). It is available from entry until the reveal starts. On phone the sheet then covers it; on desktop the panel swaps away from it.
- **Desktop `Esc`:** same as Skip, until the reveal starts.
- The field is not interactive.
- **Focus:** on entry, focus moves to Skip, the only focusable element. When the Result screen takes over, focus follows the 08-result rule (the result heading).

## Motion

The prototypes loop every 10 s. The app plays once. Times are from screen entry.

| Time | Event | Prototype detail |
|---|---|---|
| 0 | Set caption, pre-snap frame | — |
| 0.8 s | Snap: caption "Snap". All players start moving. The cone appears on the QB, aimed at the first read. | Cone opacity 0→1 over 0.8–0.9 s. |
| 0.8–4.2 s | Players move from their first to last waypoint | Prototype: every player starts and ends together and moves at constant speed along a straight-segment path (SMIL `calcMode="linear"`). The QB drops 9 units (y 431→440). Linemen drop 4 units (y 366→370). |
| 0.8 s → throw | Cone tracks the current read's position | Prototype keyframes: −45.9° at 0.8 s, −64.5° at 2.425 s, −61.5° at 3.1 s, which is the TE's position at those moments. The angle then holds. |
| 3.1 s (snap + 2.3 s) | Throw: caption "Throw". The ball appears at the QB's position. | Appears instantly. |
| throw → throw + 0.3 s | Cone fades out, finishing within 0.3 s of the throw | Prototype fades 1→0 over 3.2–3.4 s. |
| 3.1–3.7 s | Ball flight, 0.6 s, along the quadratic ball path | Linear timing. Prototype path `M201 432 Q246 300 312 257`. |
| 3.7 s | Catch: the outcome caption shows | Caption swaps are instant, with no fade. |
| 4.2 s | All motion ends | — |
| 4.8 s (motion end + 0.6 s) | Reveal starts. The in-flight football hides, except on an interception. | The football disappears instantly. |
| 4.8–5.3 s, phone | Result sheet `bottom:-420px → 0` | 0.5 s, `cubic-bezier(.2,.8,.2,1)` |
| 4.8–5.3 s, phone | Camera pans 180 units up (−174.2 px) | 0.5 s, `cubic-bezier(.2,.8,.2,1)` |
| 4.8–5.3 s, phone | Field shade alpha 0 → .22 | 0.5 s. The prototype uses the CSS default timing (`ease`). |
| 4.8 s, desktop | Panel swaps from the live layer to the result layer | Instant `visibility` switch. No slide and no shade. |
| 4.8–5.3 s, both | Play art (ball path, zones, start dots, drop, man, rush and blitz paths) and receiver badges opacity 0→1 | 0.5 s, linear |
| 5.3 s | Result screen | — |

Timing rule for the app: Set (0.8 s), the 0.6 s pause after motion ends and the 0.5 s reveal are fixed design values. Throw time, catch time, flight time, motion end and sack time come from the simulation. The prototype values (throw at snap + 2.3 s, 0.6 s flight, 3.4 s of play) match DESIGN.md Motion and serve as the fixture.

**Reduced motion** (`prefers-reduced-motion: reduce`): skip the animation and show the Result screen exactly as it ends, with play art, badges, shade and pills on phone, and the result panel on desktop. The prototypes have no reduced-motion handling.

## Accessibility

- Field SVG: `role="img"` with a generated `aria-label` that summarises the rep (example in Content and copy).
- Caption area (phone bar, desktop panel): `aria-live="polite"`. Only the active phase is in the accessibility tree. The prototypes hide inactive phases with `visibility:hidden`.
- Desktop panel: `<aside aria-label="Live play">`. After the swap, the result layer carries the 08-result labels.
- Skip: a native `<button>` with accessible name "Skip to result". The phone shows "Skip" as visible text, which is part of that name. Icon `aria-hidden="true"`. The target is 44 px tall on phone and 52 px on desktop.
- Phone result sheet: `<section aria-label="Rep result">`, per 08-result.
- Contrast: phase word Charcoal on Cream, line Sage Body on Cream (6.2:1), Skip Ink Green on Paper White (9.9:1). Situation pill text is Cream on `rgba(6,13,10,.82)`.
- Reduced motion: as above.
- Everything works muted. No audio is required.

## Data

**Proposal for the engine session.** The prototypes hand-author every path. The engine should supply the following per rep. Coordinates are field units (`viewBox 0 0 403 495`; y grows toward the offense's own end zone). Times are seconds from the snap.

```ts
type Point = { x: number; y: number };
type Waypoint = Point & { t: number }; // t = seconds from snap

type PlayerRole = 'QB' | 'OL' | 'WR' | 'TE' | 'RB' | 'DL' | 'LB' | 'CB' | 'S';

interface PlayerTrack {
  id: string;                 // stable across design screens, live play, result, replay
  side: 'offense' | 'defense';
  role: PlayerRole;
  receiverSlot?: 'leftWR' | 'TE' | 'slotWR' | 'rightWR' | 'RB'; // picks the player palette colour
  path: Waypoint[];           // first = pre-snap spot at t=0, last = final-frame spot; positions interpolate linearly between waypoints
}

interface BallFlight {
  throwAt: number;            // prototype 2.3
  catchAt: number;            // prototype 2.9 (0.6 s flight)
  from: Point;                // the QB's position at throwAt
  control: Point;             // quadratic control point; the result screen draws the same curve dashed
  to: Point;                  // catch, breakup or interception point
}

interface ReadSpan { from: number; to: number; targetId: string } // the cone aims at targetId's current position

interface RepPlayback {
  duration: number;           // snap to end of all motion; prototype 3.4
  players: PlayerTrack[];
  ball: BallFlight | null;    // null on a sack
  sackAt?: number;            // set on a sack
  reads: ReadSpan[];          // MVP: one span, first read, 0 → throwAt
  outcome: RepOutcome;        // shared with 08-result
  receiverFeedback: { receiverId: string; status: 'open' | 'contested' | 'covered' }[];
  playArt: DefensePlayArt;    // defined in 08-result
}

interface RepOutcome {
  kind: 'incomplete' | 'short' | 'converted' | 'sack' | 'interception';
  yards: number;              // signed; 0 on incomplete and interception
  timeInPocket: number;       // seconds, snap to throw or sack
  targetId?: string;
  cause: string;              // machine code for the decisive reason (e.g. 'safety-breakup'); drives captions and the result line
  decisiveDefenderId?: string;
}
```

Other inputs:

| Field | Source |
|---|---|
| Situation strings, puzzle number, line of scrimmage y, first-down line y, yard numbers | Puzzle data |
| Pre-snap positions | Puzzle data (formation and defensive alignment). They equal each track's first waypoint. |
| Protection summary, first read, routes and depths | The player's design (design state store) |
| Caption words and lines | Generated per rep from the design and `RepPlayback` (owner open) |
| Rep number, reps left (for the sheet, panel and pips) | Design state store |

## Open questions

1. **Read progression** (README, engine session). If the player sets a 1-2-3 order, the cone moves between reads. `reads` already allows several spans. The Read step and the cone behaviour need confirming.
2. **Play length.** Is the play always 3.4 s with the throw at 2.3 s, or does each simulation set its own timing?
3. **Captions.** Does the engine or the front end write the caption lines and the result line? What is the set of outcome words? They are play-by-play by design ("Broken up"), separate from the sheet verdict ("INCOMPLETE").
4. **Sack sequence.** Confirm Set → Snap → outcome with no Throw phase, and say whether the cone runs until the sack.
5. **Converted and final-rep reveal.** How do the 3.5 px first-down line and the coverage key pill arrive in the reveal (fade with the play art, or appear at the end)?
6. **Desktop "Final · defense revealed" pill.** The desktop Result screen shows it; `prototype-desktop.html` never does, even after the swap. When does it appear?
7. **Touchdown** (README). A rep that scores needs its own outcome caption and result treatment.
8. **Back navigation.** What do the browser and OS back actions do during live play?

## Acceptance criteria

- [ ] Phone: on Snap, the screen shows the field at 390×844 with `viewBox 0 -180 403 872`, extended turf, yard lines and numbers above and below the standard field, the two situation pills at top 14 px, and the 92 px caption bar with 22 px top corners.
- [ ] Desktop (≥900 px): the screen matches `prototype-desktop.html`. The field uses the standard `viewBox 0 0 403 495` with no camera pan and no shade. The 440 px panel shows a 56 px phase word, an 18 px line and a full-width "Skip to result" button with an `Esc` hint.
- [ ] Below 900 px the phone design renders, not the desktop stack.
- [ ] No route lines, zones, start dots, badges or ball path are visible before the reveal starts.
- [ ] Caption sequence on the prototype fixture: "Set" 0–0.8 s, "Snap" 0.8–3.1 s, "Throw" 3.1–3.7 s, the outcome from 3.7 s. Each swap is instant and announced through `aria-live="polite"`.
- [ ] Players start at their pre-snap spots (matching 06-read) and end at the final-frame spots (matching 08-result), moving between `PlayerTrack` waypoints.
- [ ] The vision cone (176 units, ±13°, gold 70%→0%) appears at the snap, always aims at the current read target's current position, stops turning at the throw, and has fully faded within 0.3 s after the throw.
- [ ] The football (rx 4.2, ry 2.7, rotated along its flight) appears at the QB's position at the throw, follows the quadratic ball path in exactly `catchAt − throwAt` seconds, and rests at the end point until the reveal.
- [ ] Phone reveal: starts 0.6 s after motion ends and lasts 0.5 s. The sheet rises from −420 px with `cubic-bezier(.2,.8,.2,1)`, the camera pans 180 field units, the shade reaches `rgba(6,13,10,.22)`, and play art and badges fade 0→1.
- [ ] Desktop reveal: at the same moment the panel switches to the 08-result desktop panel, and play art and badges fade in over 0.5 s.
- [ ] A screenshot of the final frame matches the 08-result screenshot for the same rep, outcome and viewport.
- [ ] Skip (click, tap, Enter or Space) and desktop `Esc`, at any point before the reveal, show the Result screen at once with no animation.
- [ ] With `prefers-reduced-motion: reduce`, the Result screen shows immediately, with no movement.
- [ ] A sack fixture shows no ball and no "Throw" caption.
- [ ] An interception fixture ends with the football at the interception point.
- [ ] The animation plays once and does not loop.
- [ ] Skip has accessible name "Skip to result" and receives focus on entry.
- [ ] Dark theme matches `prototype-dark.html` and `prototype-desktop-dark.html`; the field, pills, cone and ball are identical in both themes.
