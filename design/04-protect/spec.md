# Step 1: Protect

## Purpose

First of the three design steps. The player sets pass protection for the puzzle's fixed formation: how many players block and the offensive line's call. The field shows the defense's pre-snap alignment so the player can match protection to the pressure they expect. The progression is **Protect → Routes → Read → Snap**.

## Prototypes and source precedence

| File | Shows |
|---|---|
| `prototype.html` | Light theme, phone 390×844, 6-man / Slide left example |
| `prototype-dark.html` | Same composition in dark theme |
| `prototype-desktop.html` | Desktop stage and 440px control panel |
| `prototype-desktop-dark.html` | Same desktop composition in dark theme |

DESIGN.md owns tokens, typography and field geometry. These prototypes illustrate composition, not production coordinates. Mike's approved decisions supersede their zigzag, assumed option availability and unfinished artwork: **no zigzag**, directional arrows for slides, upside-down T marks without arrows for Man, and the blocking TE follows the offensive line's artwork. Derive all artwork from engine pre-snap positions, including hash shifts and formation flips.

## Entry and exit

- Landing's “Play today's puzzle” opens the numbered puzzle on Protect.
- Numbered `/puzzle/:n` links load through the engine loader.
- “1 Protect” from Routes or Read restores the current draft.
- Puzzles and Tutorial entries are planned in their own pieces.
- Result's “Run it back” is owned by Read/result, not this piece.
- “Next: routes” always opens Routes. All three step buttons activate without gating, including the selected step.
- **Puzzle exit is browser Back only.** No header exit/menu control and no history replacement. Back returns to the actual originating page.
- The in-memory session starts at rep 1 with 5-man / Man, no routes and no reads. Step changes retain the draft; reload starts a fresh session.

## Layout

### Phone (390×844; below 900px)

- Cream page, Ink Green text; flex-column play frame.
- Header: 52px, horizontal padding 16px, 1px Sand Border bottom. Down/distance 20px 900 uppercase, spot 13px 800 uppercase muted; score/clock 13px muted tabular figures. Header and field are not focusable.
- Four rep dots: 8px diameter, 5px gaps; current ring 2px Ink Green, future Sand Border, used muted. Accessible group “Rep N of 4”.
- Full-width field with `viewBox="0 0 403 495"`, approximately 390×479 at this viewport. No prototype geometry is copied.
- Panel fills the remaining space, padding 14px 16px 22px. Step buttons retain their 44px touch targets; compact gaps preserve room for controls and the primary action. Long approved Man helpers may wrap; shorter viewports/content may extend vertically rather than clip controls.
- Blockers and Line call sections: 16px separation; 8px label/control gap. Label 13px 600; helper 13px muted, sentence case, right-aligned.
- Segmented track: Paper White, 1px Sand Border, 12px radius, 3px padding and gaps. Offered options share the width equally. Visual option height 40px; extend pointer hit areas to at least 44px. Figtree 800 14px uppercase, 9px radius. Selected Ink Green with Cream text.
- Primary action pinned to panel bottom: “Next: routes”, 52px height, 14px radius, Snap Orange, white 19px 900 uppercase. Hover/pressed Snap Orange Deep. Always enabled.
- Hide wordmark, puzzle number, Enter badge and shortcut hints.

### Desktop (900px and wider)

- Top bar 64px, padding 0 28px, 1px border. OMAHA wordmark 24px 900; situation 20px 900 with 14px 800 spot; meta 14px 600 with puzzle number, score/clock and 9px rep dots.
- Body grid `minmax(0,1fr) 440px`; turf stage `#0C3322`, padding 24px, centered field, radius 10px, sized to available height and width. Stadium decoration remains anchored to field geometry.
- Named aside “Design the play”: 1px left border, padding 28px, 22px group gaps. Desktop step bars 4px; all step buttons at least 44px tall.
- Group labels 13px 800 uppercase with .04em tracking; helpers 13px 700 sentence case. Option height 42px with extended hit areas.
- Bottom action 58px, 10px radius, 19px 900, Enter badge. Muted 12px 600 shortcut hint below. Show only offered numeric keys, then `← M →` line call.
- Below 900px use the phone layout, keeping the spot visible; do not use the prototype's simplified fallback.

### Themes

Use the shared theme tokens: dark page Charcoal `#18201C`, text Cream, borders Dark Border `#34403A`, muted text Dark Muted `#A3B1A9`, track Dark Surface `#232C27`. Selected options are Cream with Charcoal text. Primary action and field art are identical across themes. Focus-visible controls use a 3px accent outline; native buttons preserve keyboard activation. No animation.

## Content and copy (approved)

| State | Blockers helper |
|---|---|
| 5-man | Line stays in |
| 6-man | Line + RB stay in |
| 7-man | Line + RB + TE stay in |

| Call | Line call helper |
|---|---|
| 5-man / Slide left | Line slides left |
| 5-man / Slide right | Line slides right |
| 6- or 7-man / Slide left | RB takes the right edge |
| 6- or 7-man / Slide right | RB takes the left edge |
| 5-man / Man | Line takes defensive linemen |
| 6- or 7-man / Man | Line takes defensive linemen. Backs take remaining rushers inside-out. |

Control accessible names: “Blockers”, “Line call”; options “5-man”, “6-man”, “7-man”, “Slide left”, “Man”, “Slide right”. Slides display “Slide” with an aria-hidden 16×12 directional SVG icon. The field accessible description retains down, distance, spot and pre-snap context, then states the blocker count and both helper descriptions. It never reveals hidden coverage or assignments.

## Field artwork

- Preserve the puzzle field, line of scrimmage, line to gain and all 22 player glyphs. Protection is painted before player glyphs. No protection zigzag.
- **Slide:** Lineman-stroke `#DADDE0`, 2px horizontal arrow below the line; endpoints derived from the actual outside tackles, direction matching Slide left/right.
- **RB on slides:** In 6- and 7-man, Receiver RB `#5BDB8C`, 2px line from the actual RB position to the edge opposite the slide, ending with a 12-unit perpendicular T cap. Edge location is just outside the actual opposite tackle, not a fixed prototype coordinate. In 5-man the RB block mark is absent.
- **Man:** No arrows. Each offensive lineman has an upside-down T mark (`⊥`) immediately in front of the player: stem extending upfield with the horizontal bar nearest the player. The blocking RB gets the same mark in RB green. This communicates inside-out man responsibilities without inventing a specific defensive assignment.
- **TE in 7-man:** Y follows the offensive-lineman drawing rule, in lineman stroke: a directional slide arrow in slide calls and an upside-down T in Man. Keep the TE player glyph and its purple ring. Its artwork follows its actual engine position, including flipped formations. In 5-/6-man no TE block mark is shown.
- Protect shows protection only, not routes drawn in another step. Routes and reads remain in the shared draft unchanged when protection changes; their pruning belongs to the Routes/Read pieces.

## Interactions and accessibility

- Offer **exactly** `engine.protections(puzzle)`: `[5]` fills the track, `[5,6]` halves, `[5,6,7]` thirds. Do not render disabled unavailable choices.
- Pointer or keyboard selection updates the shared protection draft, checked radio, helpers and field immediately. Default is 5-man / Man.
- Both segmented controls use ARIA radiogroups with radio buttons and checked-only roving tabindex. Tab enters at the checked option. Left/up move backward; right/down move forward, wrapping over offered options, moving focus and selecting. Space activates the focused option.
- Focus order: **Protect → Routes → Read → checked Blockers option → checked Line call option → Next: routes**. All step buttons, including Protect, remain reachable. The approved flow does not remove any controls from Tab order.
- At ≥900px: offered `5`/`6`/`7` set blockers, `←` sets Slide left, `M` sets Man, `→` sets Slide right, Enter advances to Routes.
- Unavailable numeric keys do nothing. Focused radio arrow keys retain local group behavior. Enter on a focused native button or link activates that control, rather than advancing globally (including radio buttons). Otherwise Enter advances. Editable elements and modified shortcuts do not trigger desktop actions. Below 900px only native keyboard behavior applies.
- Primary action is never gated; moving steps never prunes the draft.
- Everything works without sound.

## Settled decisions and scope

Mike approved helper copy, removal of the zigzag, slide arrows plus RB lines, upside-down T Man marks without arrows, and TE artwork following the line. He approved browser-Back-only exit and exactly offered equal-width counts, including Gun Empty's `[5]`.

Mike did not require custom keyboard functionality; standard accessibility is retained with the explicit defaults recorded above: local radio arrow precedence, native focused button Enter precedence, unavailable numeric keys inert, global shortcuts desktop-only. All three step buttons remain keyboard reachable. These approvals supersede conflicting issue/prototype wording.

The artwork geometry decision is positional: use engine pre-snap coordinates so both slide directions, hashes, mirrored formations and under-center RBs work. Man does not infer hidden assignments. Protect does not display prior routes. Changing protection does not drop routes or read selections here: that is explicitly out of scope, along with Run it back restoration.

The active version-1 loader retains fixture-backed simulation but uses the existing v1 puzzle validator and all design helpers. All seven formations, both flips and all three hashes therefore use the same catalog for availability and field alignment; there is no formation-specific loader fallback. Gun Empty offers `[5]`, Gun Trips and Gun Spread offer `[5,6]`, and Gun Trey, Gun Doubles, Gun Doubles 12 and Ace offer `[5,6,7]`. Fixture replay outcomes remain authored for Gun Trey, not a full simulation of these formations.

## Acceptance and verification

- New puzzles open with checked 5-man / Man controls.
- Exact offered counts share the track width, including the single-option formation.
- Every offered count/call selection updates helpers, field description and artwork immediately and retains the draft across step navigation.
- Slides draw directionally; blocking RB takes the opposite edge. Man draws upside-down T marks without arrows. TE follows the line when blocking. No zigzag.
- Radio keyboard navigation, checked-only Tab entry, all reachable step buttons, always-enabled Next and approved desktop shortcut precedence work.
- Both themes and phone/desktop layouts follow DESIGN.md and the approved composition above.
- `pnpm test:e2e` covers available counts, selection, radio navigation, Next, shared-draft retention, keyboard boundary/precedence and theme treatment.
- Independent checks: `pnpm lint`, `pnpm fmt:check`, `pnpm build`, `pnpm test`, `pnpm test:e2e`, plus running UI evidence for both viewport/theme combinations.

The play-screen frame loads numbered puzzles using the engine-backed loader and maintains an in-memory session. Routes and Read remain explicitly unavailable-control placeholders until their pieces land; their step navigation is already live. No persisted session or result flow is claimed by Protect.
