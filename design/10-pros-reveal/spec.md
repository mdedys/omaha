# Pros reveal

## Purpose

The payoff. After the puzzle ends, show what the real offense called and what happened, drawn on the same field against the same defense. Then put the player's result next to the pros' and give the share of players who beat the pros. The screen answers "Could you do better than the pros?" and hands off to Share.

## Prototypes

| File | Shows |
|---|---|
| `prototype.html` | Phone, 390×844, light. The pros ran four verticals into Cover 4: every receiver covered, deep ball to the right receiver incomplete, they punted. The player converted. Sheet headline "THEY PUNTED.", comparison boxes, "38%" (placeholder), SHARE RESULT. |
| `prototype-desktop.html` | Desktop ≥900 px, same content. Field stage with the two key pills, and a 440 px panel with a 56 px headline, the story line, comparison boxes, the 38% row and Share with an `Enter` hint. |
| `prototype-dark.html` | Phone, dark theme, same content. |
| `prototype-desktop-dark.html` | Desktop, dark theme, same content. |

## Entry and exit

- **Entry:** SEE HOW THE PROS DID on the Result screen (08-result). It appears only on a converted result or after the final rep (out of reps).
- **Exit:** SHARE RESULT → Share (11-share).
- The prototype has no replay, back or close control (see Open questions).

## Layout

Phone baseline 390×844.

| Region (top to bottom) | Position and size | Notes |
|---|---|---|
| Field | SVG at (0,0), 390×479 px, `viewBox="0 0 403 495"` | The pros' play, final frame (see Components). |
| Field shade | 390×479 px over the SVG | `rgba(6,13,10,.22)` |
| Situation pills | `left:12px; right:12px; top:14px`, flex, `space-between` | Two `field-pill`s, as on the Result screen. |
| Key pill 1 | `left:12px; top:50px` | `field-key-pill`: the pros' call |
| Key pill 2 | `left:12px; top:86px` | `field-key-pill`: the defense (28 px pill plus 8 px gap below pill 1) |
| Sheet (`<section aria-label="How the pros did">`) | `bottom:0`, full width, **420 px** tall | Cream, padding `26px 20px 22px`, top corners 28 px, Sheet shadow `0 -12px 32px rgba(0,0,0,.45)`, flex column with `justify-content: space-between`. The sheet top sits at 424 px, overlapping the field's bottom 55 px. |

Sheet groups, top to bottom:

1. **Header** (column, gap 8 px): headline, 46 px 900, letter-spacing −0.01em, line-height 0.9, Charcoal. Story line, 17 px 500, line-height 1.35, Sage Body.
2. **Comparison** (row, gap 8 px): two equal boxes, each flex 1, radius 12 px, padding 12 px, column gap 6 px. Label 11 px 800, letter-spacing .06em, uppercase, line-height 1. Value 17 px 900, uppercase, line-height 1.1.
   - "The pros" box: Paper White, 1 px Sand Border, label Sage Muted, value Charcoal.
   - "You" box: Ink Green fill, label Win Muted (#B3C4BA), value Cream.
3. **Beat-the-pros row**: flex, centred vertically, gap 12 px, padding `14px 0`, 1 px Sand Border rules top and bottom. Percentage 30 px 900, line-height 1, tabular numerals, Snap Orange. The One Action Rule allows a large stat number in orange on cream here. Sentence 14 px 600, line-height 1.3, Sage Body.
4. **CTA**: full-width `button-primary-result`, 56 px tall, radius 16 px, Snap Orange, white 900 uppercase text at 19 px (`typography.button`). Inside, centred with a 10 px gap: a 20 px share icon (arrow up out of a tray, stroke 2.4, `currentColor`, `aria-hidden`), then the label.

### Desktop (≥900 px, `prototype-desktop.html`)

These values follow DESIGN.md Layout › Desktop control variants (58 px primary with a 10 px radius and 19 px label, 30 px field pills with 13 px text).

| Region | Values |
|---|---|
| Top bar | As the 08-result desktop top bar: 64 px, "OMAHA", "3rd & 10" / "own 45", "#148", "Down 4 · 1:12", and four 9 px pips. Prototype pips: rep 1 #5A6B62, rep 2 Ink Green (the converting rep), reps 3 and 4 Sand Border. `aria-label="Converted on rep 2"`. |
| Field stage | Grid column `minmax(0,1fr)`, background #0C3322, padding 24 px, field centred. Field `viewBox="0 0 403 495"`, `height: calc(100vh - 112px)`, `width: auto`, `max-width: 100%`, radius 10 px. Field content is the same as on phone. No field shade and no situation pills on the stage (the situation is in the top bar). |
| Key pills | `field-key-pill` at desktop size (30 px tall, padding `0 12px`, 13 px, Cream fill, Charcoal 800 uppercase, letter-spacing .02em): "The pros' call · Four verticals" at `left:36px; top:36px`, "Defense · Cover 4" at `left:36px; top:74px`. |
| Panel (`<aside aria-label="How the pros did">`) | 440 px, 1 px Sand Border on the left, padding 28 px, flex column, gap 26 px, Cream. |
| Panel header | Column, gap 10 px, padding-top 12 px. Headline 56 px 900, line-height 0.9, letter-spacing −0.01em, Charcoal. Story line 18 px 500, line-height 1.4, Sage Body. |
| Comparison | Row, gap 10 px. Boxes: radius 12 px, padding 14 px, column gap 7 px. Label 12 px 800, letter-spacing .06em, uppercase. Value 19 px 900, line-height 1.1, uppercase. Box colours as on phone. |
| Beat-the-pros row | 1 px Sand Border rules top and bottom, padding `16px 0`, gap 16 px. "38%" 36 px 900, tabular, Snap Orange. Sentence 15 px 600, line-height 1.35, Sage Body. |
| Spacer | Flex-grow. |
| CTA | Full width, 58 px, radius 10 px, Snap Orange, 19 px 900 uppercase, gap 12 px: the share icon (20 px), "Share result", then `kbd` "Enter" (11 px 700, padding `3px 7px`, radius 5 px, `rgba(255,255,255,.22)`). |

Below 900 px the app uses the phone design. The desktop prototype's stacked fallback is not shipped.

### Dark theme (`prototype-dark.html`, `prototype-desktop-dark.html`)

Only what differs from light:
- Page, sheet and desktop panel background Charcoal (`dark-bg`); headline Cream.
- Story line and the beat-the-pros sentence: Dark Muted Strong (`dark-muted-strong`).
- Rules, desktop top-bar border and panel left border: Dark Border (`dark-border`).
- "The pros" box: Dark Surface (`dark-surface`) fill, 1 px Dark Border, label Dark Muted (`dark-muted`), value Cream.
- "You" box (converted): Cream fill, label Sage Muted (`sage-muted`), value Charcoal.
- Desktop top bar: spot and meta Dark Muted; pips rep 1 Dark Muted, rep 2 (converting) Cream, reps 3 and 4 Dark Border.
- Unchanged: the field, situation and key pills, the Snap Orange "38%", the sheet shadow and the CTA.

## Content and copy

Legend: **[P]** authored puzzle data, **[A]** results API, **[R]** the player's rep history, **[G]** chosen by combination.

| Slot | Prototype copy | Source |
|---|---|---|
| Situation pills | `3rd & 10 · own 45`, `Down 4 · 1:12` | [P] |
| Key pill 1 | `The pros' call · ` + call name → `The pros' call · Four verticals` (shown uppercase by CSS) | [P] call name |
| Key pill 2 | `Defense · ` + coverage name → `Defense · Cover 4` | [P] |
| Headline | `THEY PUNTED.` | [P] real result |
| Story line | "Four verticals into quarters. It ate them alive. Punt." | [P] real call, cause, jab |
| Pros box label | `The pros` | Fixed |
| Pros box value | `Incomplete` | [P] real result summary |
| You box label | `You` | Fixed |
| You box value | `+12 · 1st down` | [R] the player's result: yards, then the outcome |
| Percentage | `38%` | [A]. Placeholder; never ship an invented number. |
| Sentence | "of players beat the pros today." + jab "You're one of them. Act like you've been here before." | Fixed lead plus a [G] jab |
| CTA | `SHARE RESULT` (desktop: "Share result" uppercased by CSS, plus `kbd` `Enter`) | Fixed |
| Field `aria-label` | "The pros' call: four verticals against Cover 4; every receiver is covered and the deep ball to the right receiver falls incomplete" | Generated or authored [P] |

### Copy slots by combination

The prototype shows only the first row. The other rows give the slots that change. Every line in them is an **EXAMPLE in the trash-talk voice, not final copy**. All copy follows cause first, jab second. Whether the headline and story line stay fixed per puzzle or change with the player's result is an open question.

| Combination | Headline | Story line | Pros box | You box | Jab after "of players beat the pros today." |
|---|---|---|---|---|---|
| You converted, pros failed (prototype) | `THEY PUNTED.` | "Four verticals into quarters. It ate them alive. Punt." | `Incomplete` | `+12 · 1st down` | "You're one of them. Act like you've been here before." |
| You converted, pros converted | EXAMPLE `THEY GOT IT TOO.` | EXAMPLE "Stick concept against quarters. The flat was free. First down." | EXAMPLE `+6 · 1st down` | EXAMPLE `+12 · 1st down` | If you beat them, EXAMPLE "You're one of them. Bigger gain, same result." If not, EXAMPLE "You're not one of them. They did it in one rep." |
| You out of reps, pros converted | EXAMPLE `THEY CONVERTED.` | EXAMPLE "Mesh against quarters. Two crossers, one first down." | EXAMPLE `+6 · 1st down` | EXAMPLE `+7 · Short` (best rep) | EXAMPLE "You're not one of them. Four reps, and the pros needed one." |
| Both failed | EXAMPLE `THEY PUNTED.` | EXAMPLE "Four verticals into quarters. It ate them alive. Punt." | EXAMPLE `Incomplete` | EXAMPLE `+7 · Short` | EXAMPLE "You're not one of them. Nobody moved the chains today." |

## Components

- **Field** with **Field glyphs**: players at final spots, **Routes**, **Ball** path, **Receiver feedback badges**, and defense play art drawn by the 08-result rules (zones, start dots, drop, rush and blitz paths, trimming, arrowheads).
- **Field shade**.
- **Situation pill** (`field-pill`) ×2. **Key pill** (`field-key-pill`) ×2, stacked.
- **Result sheet** in its cream form (`result-sheet`), 420 px tall on this screen (DESIGN.md Layout: the pros reveal uses a 420 px sheet). No outcome tile, stat triplet or rep boxes.
- Comparison boxes. They are not a named DESIGN.md component. DESIGN.md's Label entry mentions "comparison box headers". Values as in Layout.
- **Primary** (`button-primary-result`) with a leading icon.

### Field content (the pros' play)

Draw order, back to front, as in `prototype.html`:

1. Field. First-down line 2 px in the prototype, where the pros failed.
2. Ball path (dashed, as in 08-result). Prototype `M201 432 Q330 262 383 178` to the right receiver. No football drawn.
3. Zones, start dots, zone drop lines, rush paths, blitz paths, all from the defense's response to the pros' play. The prototype uses the same Cover 4 zones as the player's reps, with drops ending at different spots: corner 54,338→88,158, safety 262,238→284,192, and so on.
4. Defenders, then linemen, at final spots.
5. **Routes**, one per route-running receiver in the route colour of its receiver letter: X #EAC54F, Y #B7A6F5 (Receiver Y Route), H #F27C8E (Receiver H Route), Z #55AEF5, RB #5BDB8C. Width 2, round caps and joins, full opacity, no selected or faded state. A route starts 9 units from the receiver's pre-snap centre along the route and ends 10.5 units short of the final centre, with the DESIGN.md route arrowhead: an open chevron about 9 units long at ±40° (Field glyphs › Routes; the same head as 05-routes). Prototype (pre-snap → final): Left WR 54,368→56,188 · TE 265,367→268,214 · Slot 321,389→326,206 · Right WR 385,381→385,168. The RB stays in to block (266,389) and has no route.
6. Receivers, RB and QB at final spots.
7. Badges, with the placement rules from 08-result. Prototype: all four receivers covered.

## States

| State | Description |
|---|---|
| You converted, pros failed | Prototyped. You box Ink Green. |
| You converted, pros converted | Not prototyped. Copy slots above. Box styling for a converted pros result is an open question. |
| You out of reps, pros converted | Not prototyped. Copy slots above. The You box must not be green (Green Is Winning Rule); its styling is an open question. |
| Both failed | Not prototyped. Copy slots above. The You box must not be green. |
| Percentage loading | Not prototyped. What shows while the results API responds is an open question. |
| Percentage unavailable (offline, API error) | Not prototyped. Open question. A made-up value must never show. |
| Pros' real call converted with a touchdown | Not prototyped (see the README Touchdown question). |

## Interactions

| Control | Action |
|---|---|
| SHARE RESULT (tap, click, Enter or Space when focused) | Open Share (11-share) |

- The field is not interactive.
- Focus: on entry, focus moves to the sheet's `h1` (`tabindex="-1"`). Tab order: SHARE RESULT.
- Desktop `Enter`: activates SHARE RESULT. The `kbd` hint sits in the button and shows only at ≥900 px.

## Motion

None in the prototype. The transition from the Result screen is not prototyped (see Open questions). Hover on the CTA: Snap Orange Deep.

## Accessibility

- Field SVG: `role="img"` with an `aria-label` naming the pros' call, the coverage and what happened (example in Content and copy).
- Sheet: `<section aria-label="How the pros did">` on phone, `<aside aria-label="How the pros did">` on desktop. The headline is the `h1`.
- Comparison boxes: each label and value read as a pair (for example "The pros: Incomplete", "You: +12 · 1st down"). Do not rely on box colour to say who won.
- Beat-the-pros row: the percentage and the sentence form one text run, so it reads "38% of players beat the pros today. You're one of them…".
- Share icon `aria-hidden="true"`. The button's name is "Share result".
- Contrast (measured): Sage Body on Cream 6.2:1, Win Muted on Ink Green 5.4:1, Snap Orange "38%" on Cream 3.2:1 (passes only as large text, 30 px 900), white on Snap Orange 3.7:1, which passes as large text only; the CTA label is therefore 19 px 900 (`typography.button`). Desktop "38%" is 36 px.
- The CTA target is 56 px tall.

## Data

| Field | Source |
|---|---|
| Situation strings, coverage name | Puzzle data |
| Pros' call name ("Four verticals") | Authored per puzzle |
| Headline and story line | Authored per puzzle (real call and result, described without NFL marks) |
| Pros' play diagram: routes per receiver, protection | Authored per puzzle |
| Pros' final frame: player positions, ball path, receiver feedback, defense play art | Authored per puzzle, or produced by running the pros' design through the simulation (open) |
| Real result: kind, yards, converted or not, summary string ("Incomplete") | Authored per puzzle |
| The player's result: converted or not, converting rep, yards, best rep | Rep history |
| Did the player beat the pros | Derived. The definition is open when the pros converted. |
| % of players who beat the pros | Results API (`38%` is a placeholder) |

Proposed shape, for the engine and authoring session to confirm:

```ts
interface ProsReveal {
  callName: string;                 // key pill: "Four verticals"
  headline: string;                 // "THEY PUNTED."
  storyLine: string;                // cause first, jab second
  resultSummary: string;            // pros box value: "Incomplete"
  converted: boolean;
  routes: { receiverId: string; points: { x: number; y: number }[] }[]; // pre-snap spot first, final spot last
  finalFrame: {                     // same shapes as 07-live-play / 08-result
    players: { id: string; x: number; y: number }[];
    ball: { from: { x: number; y: number }; control: { x: number; y: number }; to: { x: number; y: number } } | null;
    receiverFeedback: { receiverId: string; status: 'open' | 'contested' | 'covered' }[];
    playArt: DefensePlayArt;
  };
}
```

## Open questions

1. **Definition of "beat the pros"** when the pros converted. Fewer reps, more yards, or the score? This decides the jab and the percentage.
2. **Pros' final frame source.** Authored, or simulated from the pros' design? If simulated, must the simulation reproduce the real result?
3. **Headline and story line by combination.** Fixed per puzzle, or changed by the player's result (for example "THEY PUNTED TOO.")?
4. **Comparison box styling** when the pros converted, and the You box when the player failed. Only the converted-You, failed-pros styling is prototyped.
5. **You box value format** for failed puzzles (best rep? last rep?) and for sack or interception outcomes.
6. **Percentage loading and unavailable states.**
7. **Navigation.** Is there a way back to the Result or a replay of the pros' play? What do the browser and OS back actions do?
8. **Transition** from the Result screen.
9. **Touchdown** (README) as a real result or a player result.

## Acceptance criteria

- [ ] Reached only from SEE HOW THE PROS DID on a converted or out-of-reps result.
- [ ] At 390×844 the screen matches `prototype.html`: shaded field, two situation pills, key pills "The pros' call · Four verticals" at top 50 px and "Defense · Cover 4" at top 86 px, a 420 px sheet.
- [ ] The field draws the pros' routes in route colours (2 px, open arrowheads about 9 units at ±40°, starting 9 units from pre-snap and ending 10.5 units short), the defense play art per the 08-result rules, the dashed ball path, and badges, all from data.
- [ ] At ≥900 px the screen matches `prototype-desktop.html`: 64 px top bar, stage on #0C3322 with the two 30 px key pills at 36 px and 74 px and no shade, 440 px panel with a 56 px headline, 19 px comparison values, a 36 px percentage, and a 58 px Share button with an `Enter` hint. `Enter` triggers Share.
- [ ] Below 900 px the phone design renders, not the desktop stack.
- [ ] The CTA label is 19 px 900 on phone and desktop.
- [ ] Headline, story line, pros box value and call name come from puzzle data. The You box comes from rep history.
- [ ] The percentage comes from the results API. No hard-coded value ships.
- [ ] The jab after "of players beat the pros today." changes with whether the player beat the pros.
- [ ] The You box is Ink Green (dark: Cream with Charcoal text) only when the player converted.
- [ ] SHARE RESULT opens Share.
- [ ] Focus lands on the headline on entry (the sheet `h1` on phone, the panel `h1` on desktop). The CTA's accessible name is "Share result". The share icon is hidden from assistive tech.
- [ ] No real team or player names appear anywhere on the screen.
- [ ] Dark theme matches `prototype-dark.html` and `prototype-desktop-dark.html`; the field and pills are identical in both themes.
