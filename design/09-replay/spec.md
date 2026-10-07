# Replay

## Purpose

A video-style replay of the rep just played, so the player can study why it worked or failed. They can play, pause, scrub, step frame by frame, change speed and jump to key moments. The field shows players, defenders and the ball only: no route lines, zones or other play art.

## Prototypes

| File | Shows |
|---|---|
| `prototype.html` | Light theme, phone 390×844. Rep 1 replay, paused at the throw (2.3s of 3.4s), speed 0.5×. Ball in flight toward the TE. "Throw" moment selected. |
| `prototype-dark.html` | Same state in the dark theme. |
| `prototype-desktop.html` | Same state at ≥900px: field stage with the replay pill, 440px panel with scrubber, time and speed, transport controls, a vertical "Jump to" list, the button with an `Enter` hint, and a keyboard hint line. |
| `prototype-desktop-dark.html` | Same desktop state in the dark theme. |

## Entry and exit

Entry:
- Only from the result screen's replay button (08-result, `button-secondary-square`, `aria-label="Watch the replay again"`). The replay never opens on its own.

Exit:
- "Back to the result" returns to the result screen for the same rep, in the state the player left it.

## Layout

### Phone (390×844)

Root: flex column, Cream `#F4EFE4`, Ink Green `#244A3E` text, `overflow: hidden`.

1. **Header**, 52px. Same as the design steps (04-protect), except the rep dots show the rep as used: `aria-label="Rep 1 used, 3 left"`, used dot filled Sage Muted `#5A6B62` with no ring, remaining dots Sand Border `#DCD3C1`.
2. **Field wrapper**: `position: relative`, `flex-shrink: 0`. Field SVG 390×479, `viewBox 0 0 403 495`.
   - **Replay pill** absolutely positioned at `left: 12px; top: 12px`: 26px tall, padding `0 10px`, radius 13px, background `rgba(10,20,16,.78)`, Cream text, 12px 600, flex centered with gap 6px. Leading pause glyph: SVG 10×10, two Cream rects (`x=1.5` and `x=6.1`, `y=1`, 2.4×8, `rx=0.6`), `aria-hidden`.
3. **Panel** (`footer aria-label="Playback"`): `flex-grow: 1` (313px), padding `16px 16px 22px`, flex column `justify-content: space-between`, four rows:
   1. **Scrubber group** (column, gap 10px):
      - Track row, 14px tall, `position: relative`.
      - Time and speed row: flex `space-between`, centered. Time on the left, speed control on the right.
   2. **Transport row**: flex centered, gap 20px: back one frame, play/pause, forward one frame.
   3. **Jump-to row** (`role="group" aria-label="Jump to a moment"`): flex, gap 8px, four equal buttons.
   4. **Primary button**.

### Desktop (≥900px, `prototype-desktop.html`)

DESIGN.md "Layout › Desktop" and its desktop control variants (58px button, 30px field pill) apply.

- **Top bar** 64px: as in 05-routes desktop (`OMAHA`, situation, meta with `#148`, `Down 4 · 1:12`, pips). Pips: `aria-label="Rep 1 used, 3 left"`, used pip filled Sage Muted.
- **Stage**: `#0C3322`, padding 24px, field `calc(100vh - 112px)` tall, radius 10px. Replay pill at `top: 36px; left: 36px`: 30px tall, padding `0 12px`, radius 15px, `rgba(6,13,10,.82)`, Cream 13px 700, gap 7px, same pause glyph.
- **Panel** (`aside aria-label="Playback"`): 1px Sand Border left, padding 28px, flex column, gap 22px:
  1. Scrubber group (column, gap 12px): track (14px), then the time and speed row.
  2. Transport row: centered, gap 24px.
  3. Jump-to group (column, gap 10px): label `Jump to` (13px 800 uppercase, `letter-spacing .04em`), then a vertical list (column, gap 8px).
  4. Spacer (`flex-grow: 1`).
  5. Button group (column, gap 10px): primary button, then hint line.
- **Below 900px:** collapses as in 05-routes (one column, panel padding 16px, hints and `kbd` hidden). The pill moves to `top: 12px` (left stays 36px).

### Dark theme (`prototype-dark.html`, `prototype-desktop-dark.html`)

Phone: background Charcoal `#18201C`; text Cream. Header border Dark Border `#34403A`. Used rep dot Dark Muted `#A3B1A9`, remaining dots Dark Border. Played track segments and thumb Cream; unplayed segment Dark Border. Total time and moment times Dark Muted. Speed track Dark Surface `#232C27` with a Dark Border border; unselected speed options Dark Muted; selected Cream fill with Charcoal text. Frame-step icons Cream; play button Cream fill with a Charcoal icon. Jump-to buttons Dark Surface with a Dark Border border, Cream labels; selected border 2px Cream. Field, pill and primary button unchanged.

Desktop: the same mapping (scrubber, time, speed control, transport buttons, `Jump to` rows with Dark Muted times), plus top-bar and panel borders Dark Border; spot and meta Dark Muted; used pip Dark Muted, other pips Dark Border; hint line Dark Muted with `kbd` keys on Dark Surface, 1px Dark Border, Cream text. Links Cream, hover Paper White. Stage, field and pill unchanged.

## Content and copy

| Element | String | Source |
|---|---|---|
| Header | `3rd & 10`, `own 45`, `Down 4 · 1:12` | Puzzle data |
| Rep dots label | `Rep 1 used, 3 left` | Rep state |
| Pill | `Rep 1 replay` | Rep index |
| Current time | `2.3s` | Playback position, one decimal |
| Total time | `/ 3.4s` | Simulation duration, one decimal |
| Speed options | `0.25×`, `0.5×`, `1×` (multiplication sign U+00D7) | Static |
| Transport labels | `Back one frame`, `Play`, `Forward one frame` (accessible names only) | Static |
| Moment labels | `Snap`, `Break`, `Throw`, `End` (rendered uppercase) | Static labels |
| Moment times | `0.0s`, `1.6s`, `2.3s`, `3.4s` | Simulation output |
| Primary button | `Back to the result` (rendered uppercase) | Static |
| Desktop button hint | `Enter` | Static |
| Desktop hint line | `Space` play/pause · `,` `.` step a frame (each key in a `kbd`) | Static |
| Desktop jump label | `Jump to` | Static |
| Slider value text (phone) | `2.3 seconds, throw` | Playback position and moment |
| Field `aria-label` (example) | `Replay paused at the throw: both teams moving, no play art; the ball is on its way to the tight end` | Built from playback state |

## Components

- **Field pill** (`field-pill`), screen variant: phone 26px tall, radius 13px, padding `0 10px`, `rgba(10,20,16,.78)`, 12px 600; desktop 30px, radius 15px, padding `0 12px`, `rgba(6,13,10,.82)`, 13px 700 (DESIGN.md "Layout › Desktop" pill variant). The phone values come from the prototype and differ from DESIGN.md `field-pill` (28px, `rgba(6,13,10,.82)`, padding `0 11px`).
- **Scrubber** (phase segments):
  - Three segments, 4px tall, radius 2px, at `top: 5px`, split at the Break and Throw times with 2px gaps. Prototype geometry (Break 1.6s ≈ 47%, Throw 2.3s ≈ 68% of 3.4s): `left 0; width calc(47% - 1px)`, `left calc(47% + 1px); width calc(21% - 2px)`, `left calc(68% + 1px); right 0`.
  - Played track Ink Green; unplayed track Sand Border.
  - Thumb: 14×14px circle, radius 7px, Ink Green, at `left: calc(<position%> - 7px); top: 0`. Phone thumb has `box-shadow: 0 1px 4px rgba(0,0,0,.5)` (DESIGN.md "Elevation"); the desktop prototype omits the shadow.
- **Time readout**: phone 13px 600 tabular numerals, total in 500 Sage Muted; desktop 14px 700, total in 600 Sage Muted.
- **Segmented control** (`segmented-control`), playback-speed variant:
  - Phone: track Paper White, 1px Sand Border, radius 10px, padding 2px, gap 2px; options 28px tall, padding `0 9px`, radius 8px, Figtree 800 12px uppercase, Sage Muted; selected Ink Green with Cream text.
  - Desktop: standard track (radius 12px, padding 3px, gap 3px), width 180px, options `flex: 1`, 32px tall, 800 14px.
- **Transport buttons**:
  - Frame step: transparent circles, Ink Green icon, no border. Phone 48×48px with a 22px icon; desktop 52×52px with a 24px icon. Back icon (`viewBox 0 0 24 24`, `fill: currentColor`): `rect x=5 y=5 w=2.4 h=14 rx=1` + `M19 5v14L9 12z`. Forward: `rect x=16.6 y=5 w=2.4 h=14 rx=1` + `M5 5v14l10-7z`.
  - Play/pause: Ink Green filled circle, Cream icon. Phone 60×60px with a 22px icon; desktop 68×68px with a 26px icon. Play icon `M7 4.5v15l12-7.5z`. The pause icon (shown while playing) is not prototyped.
- **Jump-to moments**:
  - Phone: buttons `flex: 1`, 46px tall, radius 12px, 1px Sand Border, Paper White, column centered with gap 3px. Label 13px 800 uppercase; time 11px Sage Muted, tabular numerals. Selected: 2px Ink Green border, `aria-pressed="true"`.
  - Desktop: vertical list of 52px rows, radius 10px, 1px Sand Border, Paper White, padding `0 16px`, label left (14px 800 uppercase) and time right (13px 600 Sage Muted, tabular). Selected: 2px Ink Green border, padding `0 15px`.
- **Primary button** (`button-primary`): phone 52px, radius 14px, Snap Orange, white Figtree 900 19px uppercase (DESIGN.md `typography.button`; the phone prototypes still show 16px, follow DESIGN.md). Hover/pressed Snap Orange Deep `#C94B20`. Desktop variant: 58px, radius 10px, 19px, with `kbd` `Enter` (as in 05-routes).
- **Desktop hint line**: 12px 600 Sage Muted, centered; `kbd`s Paper White, 1px Sand Border, Ink Green, 700 11px, padding `3px 7px`, radius 5px.
- **Field** (DESIGN.md "Field glyphs"), drawn from simulation positions at the current time, in paint order:
  1. Field base (line of scrimmage and first-down line at their pre-snap positions).
  2. Defenders: r=7.5, `#071710`, Cream ring 2.2, no label.
  3. Ball path (after the throw): quadratic path from the QB's release point to the ball's current position, no fill, stroke `#F2F5F3`, width 1.8, `stroke-dasharray: 2 5`, round caps, full opacity (DESIGN.md "Field glyphs › Ball": full opacity in the replay, 70% on result screens).
  4. Football (after the throw): ellipse rx=4, ry=2.6, rotated along the flight direction (−42° in the prototype), fill `#8B5A2B`, stroke `#F2F5F3` 0.8.
  5. Linemen.
  6. Receivers and QB with ring colors and labels.
  - **Not drawn:** routes, zones, protection zigzag, slide arrow, RB block line, read ring and badge, QB vision cone, receiver feedback badges, defense play art, field shade.

## States

| State | Description |
|---|---|
| **Paused at a moment** (prototyped) | Thumb at the moment's time; matching jump-to button selected (`aria-pressed="true"`); play button shows the play icon with `aria-label="Play"`; pill shows the pause glyph. |
| **Paused between moments** | Not prototyped. Whether any jump-to button is selected is open. |
| **Playing** | Not prototyped. Field animates at the selected speed; time readout and thumb update; play button shows a pause icon and `aria-label="Pause"`. The pill glyph while playing is open. |
| **At the start** (0.0s) | Pre-snap alignment. No ball drawn (the QB holds it, as in the live play). |
| **At the end** | Final positions; full ball path drawn if the ball was thrown. |
| **No throw** (sack) | Not prototyped. The Throw moment and the Break–Throw split depend on a throw; what the scrubber and jump-to row show is open. |
| **Speed** | One of 0.25×, 0.5×, 1× selected. |
| **Dark** | Per Layout › Dark theme. |

## Interactions

- **Play/pause button**: toggles playback from the current position at the selected speed. At 1× the play runs in real time (3.4s in the prototype). Between simulation samples, positions are interpolated linearly (the live play prototype uses linear motion).
- **Back / forward one frame**: move the position one frame back or forward, clamped to 0 and the end.
- **Scrubber**: drag the thumb or tap the track to set the position.
- **Speed option**: changes the playback rate; the position is kept.
- **Jump-to button**: moves the position to that moment's time and marks the button selected.
- **Back to the result**: exit to the result screen.
- **Desktop keyboard** (proposal; from the hint line and button): `Space` play/pause; `,` back one frame; `.` forward one frame; `Enter` Back to the result.
- **Focus order**: scrubber (slider) → speed group → back one frame → play/pause → forward one frame → jump-to buttons (Snap, Break, Throw, End) → Back to the result.

## Motion

- Playback animates the simulation output: every player and the ball move along their simulated paths at the selected rate (0.25×, 0.5× or 1× real time).
- The ball path grows from the release point as the ball travels.
- No other motion. Jump-to and frame steps change the frame instantly.

## Accessibility

- Field SVG: `role="img"` with an `aria-label` that describes the current frame (example in Content and copy). Update it when playback pauses, not on every frame.
- Scrubber: `role="slider"`, `aria-label="Replay position"`, `aria-valuemin="0"`, `aria-valuemax` = duration, `aria-valuenow` = position, `aria-valuetext` such as `2.3 seconds, throw` (the phone prototype has it; the desktop prototype leaves it out, but it is required on both), `tabindex="0"`. Arrow keys move the position.
- Speed: `role="radiogroup"` with `aria-label="Playback speed"`; options `role="radio"` with `aria-checked`.
- Transport buttons have `aria-label`s (`Back one frame`, `Play`/`Pause`, `Forward one frame`); icons `aria-hidden`.
- Jump-to buttons: group `aria-label="Jump to a moment"`; the current one has `aria-pressed="true"`.
- Rep dots: `aria-label="Rep N used, M left"`.
- Touch targets (DESIGN.md "Layout › Touch targets"): at least 44×44px. The thumb and track row are 14px, so extend the scrubber hit area to at least 44px tall without changing its look. Speed options are 28px tall on phone; extend their hit area to at least 44px. Transport (48/60px) and jump-to (46px) meet 44px.
- Contrast as on the design steps. White on Snap Orange is 3.7:1; the 19px 900 button label counts as large text and passes AA.
- Playback only runs when the player starts it, and it can always be paused.

## Data

- **Puzzle JSON:** header values; puzzle number (desktop); field window (yard lines, first-down line).
- **Rep state:** rep index (pill, rep dots) and reps used/left.
- **Simulation output for the rep** (the same output the live play and result use):
  - Duration in seconds (3.4s in the prototype).
  - Time-sampled positions for all 22 players and the ball.
  - Ball release time and point, and its flight path (when thrown).
  - Moment times: snap (0.0s), break (1.6s), throw (2.3s), end (3.4s).
- **Playback state (UI):** position (seconds), playing or paused, speed (0.25 | 0.5 | 1).

## Open questions

- Initial state on entry: start position (0.0s?), playing or paused, and default speed. The prototype shows a paused frame at 0.5×.
- What one "frame" is for frame stepping and slider arrow keys (a fixed time step or one simulation tick).
- What playback does at the end (stop, or restart from 0 when Play is pressed again).
- Whether scrubbing, frame stepping or picking a jump-to moment while playing keeps playing or pauses.
- Which jump-to button is selected when the position is between moments (none, or the last one passed).
- Pause icon for the play button and the pill glyph while playing (not prototyped).
- How a sack (no throw) shows on the scrubber and in the jump-to row.
- What "Break" marks when several receivers break at different times (simulation definition).
- Prototype frame accuracy: at the Throw moment (2.3s) the prototype shows the ball already halfway to the TE, but in the live play the ball leaves the QB at 2.3s.
- Desktop keyboard: how `Space` and `Enter` interact with a focused button (both activate buttons natively).
- Whether reduced-motion preferences change anything here, given that playback is started by the player.

## Acceptance criteria

- [ ] The replay opens only from the result screen's replay button and returns to the same result with "Back to the result".
- [ ] Phone layout matches `prototype.html` at 390×844: 52px header with used-rep dots, 390×479 field with the `Rep N replay` pill at 12/12, panel padding 16/16/22 with four rows spaced `space-between`.
- [ ] The field draws only the field base, defenders, linemen, receivers, QB and the ball (with its dashed path after the throw); no routes, zones, protection marks, read marks, vision cone or feedback badges.
- [ ] The scrubber shows three phase segments split at the Break and Throw times with 2px gaps; the track is Ink Green left of the thumb and Sand Border to its right; the thumb is 14px.
- [ ] The time readout shows the position and duration with one decimal, for example `2.3s / 3.4s`.
- [ ] The speed control offers `0.25×`, `0.5×`, `1×`, and playback runs at that rate (1× = real time).
- [ ] Play/pause toggles playback and swaps its `aria-label` between `Play` and `Pause`; the frame buttons step one frame and stop at 0 and the end.
- [ ] Jump-to buttons show `Snap`, `Break`, `Throw`, `End` with times from the simulation; tapping one moves the position there and marks it `aria-pressed="true"` with a 2px border.
- [ ] Desktop (≥900px) matches `prototype-desktop.html`: pill at 36/36 on the stage, 180px speed control with 32px options, 52/68px transport buttons, vertical `Jump to` list with 52px rows, 58px button with `Enter`, hint line `Space play/pause · , . step a frame`.
- [ ] On desktop (proposed shortcuts), `Space` toggles play, `,` and `.` step a frame, and `Enter` returns to the result.
- [ ] The slider exposes `aria-valuenow`, `aria-valuemax` and `aria-valuetext` on phone and desktop, and moves with arrow keys.
- [ ] Scrubber and speed options have hit areas at least 44px tall.
- [ ] Dark theme matches `prototype-dark.html` and `prototype-desktop-dark.html`; the field and pill are identical between themes.
