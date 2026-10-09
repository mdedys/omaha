---
name: Omaha
description: A daily football puzzle. Read the defense, draw up one play, out-coach the pros.
colors:
  ink-green: "#244A3E"
  ink-green-deep: "#163028"
  cream: "#F4EFE4"
  paper-white: "#FFFFFF"
  sand-border: "#DCD3C1"
  sand-strong: "#B9AE99"
  sage-muted: "#5A6B62"
  sage-body: "#4A5C53"
  charcoal: "#18201C"
  snap-orange: "#E05A2B"
  snap-orange-deep: "#C94B20"
  snap-orange-text: "#B4441C"
  snap-orange-on-dark: "#F59A72"
  read-gold: "#F4B13E"
  converted-green: "#5CC98A"
  on-orange: "#FFFFFF"
  win-subtext: "#D9E3DC"
  win-muted: "#B3C4BA"
  on-turf-muted: "#B8C7BE"
  on-tile: "#1E2B22"
  share-card-inner: "#2C5649"
  share-card-rule: "#3D6B5B"
  dark-bg: "#18201C"
  dark-surface: "#232C27"
  dark-border: "#34403A"
  dark-muted: "#A3B1A9"
  dark-muted-strong: "#B8C4BD"
  turf: "#0F3A27"
  turf-stripe: "#113F2A"
  turf-stage: "#0C3322"
  end-zone: "#6E2F16"
  sideline-path: "#454B47"
  field-line: "#D5E0D9"
  field-number: "#A7B2AC"
  first-down-line: "#E2C044"
  scrimmage-line: "#3B8EEA"
  scrimmage-label: "#7FB6F2"
  protection-zigzag: "#06100B"
  lineman: "#A4AAAF"
  lineman-stroke: "#DADDE0"
  receiver-fill: "#0E2219"
  receiver-x: "#EAC54F"
  receiver-y: "#8E73F2"
  receiver-y-route: "#B7A6F5"
  receiver-h: "#F0607A"
  receiver-h-route: "#F27C8E"
  receiver-z: "#55AEF5"
  receiver-rb: "#5BDB8C"
  quarterback: "#F2F5F3"
  quarterback-text: "#0A1410"
  defender-fill: "#071710"
  defender-ring: "#F4EFE4"
  defense-path: "#C4CFC8"
  start-dot: "#7E8B85"
  zone-deep: "#3D7BFF"
  zone-flat: "#7FD8FF"
  zone-hook: "#FFD84A"
  zone-curl-flat: "#B57CFF"
  football: "#8B5A2B"
typography:
  hero:
    fontFamily: "Figtree, sans-serif"
    fontSize: "76px"
    fontWeight: 900
    lineHeight: 0.86
    letterSpacing: "-0.02em"
  display:
    fontFamily: "Figtree, sans-serif"
    fontSize: "50px"
    fontWeight: 900
    lineHeight: 0.9
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Figtree, sans-serif"
    fontSize: "40px"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Figtree, sans-serif"
    fontSize: "20px"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.01em"
  stat:
    fontFamily: "Figtree, sans-serif"
    fontSize: "26px"
    fontWeight: 800
    lineHeight: 1
    fontFeature: "tnum"
  body:
    fontFamily: "Figtree, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.4
  body-strong:
    fontFamily: "Figtree, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.2
  label:
    fontFamily: "Figtree, sans-serif"
    fontSize: "12px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.02em"
  button:
    fontFamily: "Figtree, sans-serif"
    fontSize: "19px"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.01em"
  field-label:
    fontFamily: "Figtree, sans-serif"
    fontSize: "6.5px"
    fontWeight: 700
    lineHeight: 1
rounded:
  tile: "8px"
  control-inner: "9px"
  control: "12px"
  cta: "14px"
  cta-result: "16px"
  sheet: "28px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "24px"
  gutter: "16px"
components:
  button-primary:
    backgroundColor: "{colors.snap-orange}"
    textColor: "{colors.on-orange}"
    typography: "{typography.button}"
    rounded: "{rounded.cta}"
    height: "52px"
  button-primary-hover:
    backgroundColor: "{colors.snap-orange-deep}"
    textColor: "{colors.on-orange}"
  button-primary-result:
    backgroundColor: "{colors.snap-orange}"
    textColor: "{colors.on-orange}"
    typography: "{typography.button}"
    rounded: "{rounded.cta-result}"
    height: "56px"
  button-secondary-square:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.ink-green}"
    rounded: "{rounded.cta-result}"
    size: "56px"
  button-skip:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.ink-green}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 14px"
  segmented-control:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.sage-muted}"
    rounded: "{rounded.control}"
    padding: "3px"
  segmented-option-selected:
    backgroundColor: "{colors.ink-green}"
    textColor: "{colors.cream}"
    rounded: "{rounded.control-inner}"
    height: "40px"
  route-card:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.ink-green}"
    rounded: "{rounded.control}"
    width: "92px"
    height: "88px"
  read-option:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.ink-green}"
    rounded: "{rounded.control}"
    height: "52px"
    padding: "0 12px"
  field-pill:
    backgroundColor: "rgba(6,13,10,.82)"
    textColor: "{colors.cream}"
    rounded: "{rounded.pill}"
    height: "28px"
    padding: "0 11px"
  field-key-pill:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.charcoal}"
    rounded: "{rounded.pill}"
    height: "28px"
    padding: "0 11px"
  result-sheet:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.charcoal}"
    rounded: "{rounded.sheet}"
    padding: "26px 20px 22px"
  result-sheet-win:
    backgroundColor: "{colors.ink-green}"
    textColor: "{colors.cream}"
    rounded: "{rounded.sheet}"
  result-sheet-over:
    backgroundColor: "{colors.charcoal}"
    textColor: "{colors.cream}"
    rounded: "{rounded.sheet}"
  outcome-tile-fail:
    backgroundColor: "{colors.snap-orange}"
    textColor: "{colors.on-orange}"
    rounded: "10px"
    size: "44px"
  outcome-tile-short:
    backgroundColor: "{colors.read-gold}"
    textColor: "{colors.on-tile}"
    rounded: "10px"
    size: "44px"
  rep-box:
    textColor: "{colors.sage-muted}"
    rounded: "{rounded.tile}"
    size: "30px"
  share-card:
    backgroundColor: "{colors.ink-green}"
    textColor: "{colors.cream}"
    rounded: "16px"
    padding: "18px 16px 16px"
---

# Design System: Omaha

## Overview

**Creative North Star: "The Coach's Clipboard"**

Omaha is a coach's clipboard on a Sunday night: a top-down field drawn like a playbook page, clipped to cream paper where the decisions get made. The field is the hero and stays dark, saturated and legible; everything around it is warm paper, green ink and one loud orange that means "do this now". The look borrows from playbook diagrams and all-22 film, not from TV broadcast graphics or video-game HUDs.

The screen is split into two jobs. The field shows what is happening, using a strict color language for players, routes, zones and outcomes. The paper panel below it (or beside it on desktop) holds the controls and the verdict. Density is couch-sized: one hand, big targets, a few words, heavy uppercase type that reads at a glance.

The voice is trash talk everywhere, but every line names the cause before the jab ("Swatted. The safety was parked on that corner."). A player must always learn why a rep failed; the joke is the garnish.

**Key Characteristics:**
- Dark turf field at full phone width; cream paper panels; ink-green text; one orange action.
- Figtree in heavy uppercase for anything that must be read in a glance.
- Player, route and zone colors carry meaning and never decorate.
- Outcomes use the share-card colors everywhere: orange = failed rep, gold = short, green = converted.
- Light (cream) and dark (charcoal) themes share the same field.

## Colors

Warm paper and forest ink around a saturated field, with a single orange for action.

### Primary
- **Snap Orange** (#E05A2B): the action color. Primary buttons (Snap, Next, Run It Back, Share), the failed-rep outcome tile, blitz arrows on the field. Hover/pressed is Snap Orange Deep (#C94B20). Text on orange is white, weight 900, at least 19px: white on Snap Orange is 3.71:1, which passes WCAG AA only as large text.
- **Snap Orange Text** (#B4441C): orange used as text or a thin border on cream (the "Today's puzzle" label, the Puzzles "N reps left" chip). Snap Orange itself is too light for small text on cream. On turf or ink green, orange text uses **Snap Orange on Dark** (#F59A72).
- **Ink Green** (#244A3E): the brand ink. Body text and headings in light mode, selected segmented options (with cream text), the converted result panel, the share card background.

### Secondary
- **Read Gold** (#F4B13E): the quarterback's read. The selected-receiver halo, the "1" read badge, the QB vision cone, the short-of-the-sticks outcome tile. On ink-green surfaces (the win panel, the share card) gold is also the accent: stat numbers, down and distance, the "Beat the pros" chip.
- **Converted Green** (#5CC98A): the converted tile on the share card only.

### Neutral
- **Cream** (#F4EFE4): light-mode page and panel background; text on ink-green and charcoal panels; defender rings.
- **Paper White** (#FFFFFF): raised controls on cream (segmented tracks, route cards, read options, secondary buttons).
- **Sand Border** (#DCD3C1): 1px borders and rules on cream, unselected step bars, empty rep boxes.
- **Sage Muted** (#5A6B62): secondary labels and meta text. **Sage Body** (#4A5C53): supporting sentences.
- **Charcoal** (#18201C): failed-rep headlines and stat numbers, the out-of-reps panel, and the dark-mode background.
- **Sand Strong** (#B9AE99): the border of a "Missed" status chip and dividing chevrons on cream.
- **Ink Green Deep** (#163028): link hover on cream.
- **On Turf Muted** (#B8C7BE): secondary text over the field or on dark green cards. **Win Muted** (#B3C4BA): secondary text on the ink-green panel and share card, including reps not needed. **On Tile** (#1E2B22): icons and text on gold and green tiles.
- **Share card inner** (#2C5649) and **Share card rule** (#3D6B5B): the inset tile panel, its divider and the dashed outline of reps not needed.

### Dark theme
Every page has a dark prototype (`prototype-dark.html`, `prototype-desktop-dark.html`, and `-dark` result states). Dark mode swaps the paper for charcoal and keeps the field, the orange and the gold untouched.
- **Surfaces:** background Charcoal (#18201C), raised controls Dark Surface (#232C27), borders Dark Border (#34403A), muted text Dark Muted (#A3B1A9), supporting text Dark Muted Strong (#B8C4BD).
- **Ink:** Cream becomes the text color. Failed-rep headlines and stat numbers are Cream.
- **Selection inverts:** a selected segmented option, a won status chip, a done step number and the "You" comparison box are a Cream fill with Charcoal text.
- **Orange as text** (the "Today's puzzle" label, the open chip text and border) uses Snap Orange on Dark (#F59A72). The "Missed" chip border uses Sage Muted (#5A6B62). Links hover to Paper White.
- **Unchanged in both themes:** the field and everything drawn on it, situation and key pills, the Landing and Puzzles hero art, the share card, and the ink-green converted panel.
- **Out of reps:** the charcoal panel matches the dark page, so in dark mode it adds the orange ✕ outcome tile beside a 44px headline to keep it reading as the end of the puzzle.

### Field palette
- **Turf** (#0F3A27) with **Turf Stripe** (#113F2A) bands every 5 yards, counted from the nearer goal line: 0–5 is Turf, 5–10 Turf Stripe, and so on to the 45–50 stripe. **Turf Stage** (#0C3322) is the desktop stage beside the field.
- **Field Line** (#D5E0D9 at 45% opacity) yard lines, sidelines and hash marks; **Field Number** (#A7B2AC at 80%) yard numbers at the 10s only. Nothing marks the goal line itself: no "G", no direction arrows, no try line.
- **Goal line and end line:** Field Line at 85%, 2px.
- **End zones:** painted **End Zone** burnt orange (#6E2F16), with no stripe bands, hash marks or numbers. The only marking is the OMAHA wordmark, Figtree 900 uppercase at 70 units with 3 units of letter spacing, Snap Orange on Dark at 16%, centered in the end zone. It reads upright in the end zone the offense attacks and turns 180° in its own. It stays quieter than every player, route and zone. No team names or logos.
- **Past the end line:** a 2-yard **Sideline Path** (#454B47), a 4.8-unit wall in Defender Fill (#071710), then the crowd. On desktop the path, wall and crowd span the full stage width; the field SVG draws them past its viewBox with `overflow="visible"` and the stage clips them.
- **Crowd:** static pixel-art stands drawn with `shape-rendering="crispEdges"` on a 3.2-unit grid (a quarter yard), the whole group at 60% opacity. Each fan is a 2×2-cell head over a 3×2-cell shirt, 4 cells apart, with about 14% of seats empty. Rows are 5 cells deep, alternate Turf Stage and #0A2D1E, and offset by half a fan. Shirts are mostly home orange (#C9572A, #A8481F), with #E8E1D2, Sand Strong, Charcoal, #2E5E4F and Sage Muted. Heads use #E3BF98, #C6956A, #946042 and #5E3B26. Each seat is a fixed hash of its row and column, so the crowd never changes and phone and desktop match seat for seat. No receiver, zone or read colors, and no team uniforms.
- **First-down line** (#E2C044, 2px; 3.5px on a converted result) and **line of scrimmage** (#3B8EEA, 2px). When labeled (tutorial), the line-of-scrimmage label uses **Scrimmage Label** (#7FB6F2) and the first-down label uses the first-down color.
- **The yellow line is the line to gain.** On a touchdown goal, whether goal to go or from farther out, it sits on the goal line in place of the white one, and no first-down line is drawn.
- **Protection zigzag** (#06100B): the pass-protection zigzag under the offensive line.

### Player palette
Each eligible receiver keeps one color from the first screen to the last; routes use a lighter tint where the ring color would vanish.
- **X** (outside WR) #EAC54F · **Y** (TE) #8E73F2 (route #B7A6F5) · **H** (slot WR or second TE) #F0607A (route #F27C8E) · **Z** (outside WR) #55AEF5 · **RB** #5BDB8C.
- Colors follow the receiver letter, never the side of the field. In a flipped formation X lines up on the right and stays yellow; the formation supplies display names such as "Right WR".
- Receivers: filled #0E2219 with a 2.2px ring in their color and a white position label.
- **Linemen:** solid #A4AAAF discs with a #DADDE0 stroke. **QB:** solid #F2F5F3 disc with dark label.
- **Defenders:** #071710 disc with a 2.2px cream ring, no label.

### Coverage palette (result screens only)
Madden zone colors, because players already know them:
- **Deep zone** #3D7BFF · **Flat zone** #7FD8FF · **Hook/curl zone** #FFD84A · **Curl-flat zone** #B57CFF.
- Zones are ellipses at 30% fill / 85% stroke; the defender's drop line uses the same color.
- Man coverage and rush paths are #C4CFC8 lines with open arrowheads. Draw a rush path only where the rush matters to the outcome (an edge rush, the sacker); interior linemen engaged at the line get none. Blitz paths are Snap Orange, 2.4px.
- Pre-snap position of every defender with a path: 3px ring in #7E8B85.

### Named Rules
**The One Action Rule.** One orange button per screen. Elsewhere orange is limited to outcome tiles, blitz arrows, large stat numbers on cream (share, pros reveal) and on charcoal (out of reps), and small status accents in Snap Orange Text (a "today" or "open" label, the goal icon). The End Zone paint and the crowd's home-orange shirts are field surfaces, not Snap Orange, and never carry a signal. On a failed-rep panel, stat numbers turn charcoal so orange keeps meaning "failed" and "do this next".

**The Color Means Something Rule.** Player, route, zone and outcome colors are a language. Never reuse a receiver color, a zone color or gold for decoration.

**The Green Is Winning Rule.** A green panel means the puzzle was converted. Failed reps never use green headlines.

## Typography

**Display and body font:** Figtree (Google Fonts, weights 500–900), fallback `sans-serif`.

**Character:** one geometric sans in two registers: heavy 900 uppercase for verdicts and situations, 500–700 sentence case for explanation. No second family.

### Hierarchy
- **Hero** (900, 76px, 0.86, -0.02em, uppercase): the OMAHA wordmark on Landing only.
- **Display** (900, 50px, 0.9, -0.01em, uppercase): the result verdict (INCOMPLETE, CONVERTED). Drops to 44px when an outcome tile sits beside it; desktop uses 46px beside a 52px tile.
- **Headline** (900, 40px, 1, uppercase): the down and distance on Landing and the Puzzles hero card; the live-play caption word at 26px in its compact bar.
- **Title** (900, 20px, uppercase): the down and distance in the play-screen header ("3RD & 10"), with the spot in 13px 800 Sage Muted ("OWN 45").
- **Stat** (800, 26px, tabular numerals): result stats; desktop 900 at 32px.
- **Body** (500, 16–17px, 1.35–1.45): result lines, briefings, tutorial copy. Result lines stay within two lines on phone; puzzle briefings may run to four.
- **Body strong** (700, 14–15px): reps-left counts, goal rows, list titles.
- **Label** (800, 11–13px, 0.02–0.06em, uppercase): step names, control labels, segmented options (14px), comparison box headers.
- **Field label** (700, 6.5px, in SVG units): WR/TE/RB/QB inside player rings.

### Named Rules
**The Glance Rule.** Anything the player must read mid-decision (verdicts, situation, control options) is uppercase 800–900. Explanations are sentence case and never uppercase.

**The Fit Rule.** Stats and labels never wrap. Use short forms ("RWR", "TE") rather than letting a stat column break onto two lines.

## Layout

**Phone (baseline 390×844):**
- Play screens stack a 52px header, the field at full width (390×479, SVG viewBox 0 0 403 495), and a bottom panel that fills the rest with 14–22px padding and 16px side gutters.
- Result screens put the field at the top with situation pills over it, and a 398px result sheet that overlaps the field's bottom 33px with a 28px top radius. The pros reveal uses a 420px sheet.
- Live play: the field fills the screen (viewBox shows 180 extra units downfield) above a 92px caption bar; at the reveal the camera pans back to the result framing as the sheet slides up.
- Controls inside the panel: 8px between options, 12–16px between groups, the primary button pinned at the bottom.

**Desktop (≥900px):** every screen has a desktop prototype.
- 64px top bar (wordmark, situation, meta), then a two-column grid: field stage `minmax(0,1fr)` on #0C3322 with the field at `calc(100vh - 112px)` tall, and a 440px paper panel with 28px padding and a 1px Sand Border on its left. Landing widens the panel to 520px; Puzzles is a single centered column, max 760px.
- Desktop control variants: primary button 58px tall with a 10px radius and 19px label; secondary square 58px, 10px radius, 2px border; outcome tile 52px with a 12px radius; step bars 4px with done bars at 45% opacity; route cards in a 3×3 grid with a 10px radius, 2px border and a filled Ink Green label band when selected; field pills 30px with 13px text; rep boxes 34px; result line 18px 600 Sage Muted.
- Desktop result screens show the field without the shade and add a "Final · defense revealed" pill. Live play on desktop keeps the standard field framing (no camera pan) and swaps the panel from captions to the result at the reveal.
- Keyboard hints (`kbd`) sit in the primary button and under it.
- Below 900px the app uses the phone screen designs. (The desktop prototypes include a simplified stacked fallback; it is not the shipped layout.)

**Touch targets:** at least 44×44px everywhere. Where the visual is smaller (segmented options, replay speed options, the scrubber thumb, field players), extend the hit area without changing the drawing; receivers get a hit circle of at least r=23 SVG units.

**Field geometry (SVG units, viewBox 0 0 403 495):** line of scrimmage y=366; first-down line y=238 (10 yards = 128 units, 1 yard ≈ 12.8); yard lines every 64 units; hash marks at x 141–155 and 247–261. Offensive line at x 160–244.
- The viewBox width is the engine's 31.5-yard field, sideline to sideline. The field is full length with 10-yard end zones, and the yard numbers sit 4 yards inside each sideline.
- The line of scrimmage is at y=366 in every puzzle, so a point n yards downfield is at y = 366 − 12.8n. The goal line is at 366 − 12.8 × (yards to goal) and the end line 128 units beyond it. The sideline path runs 25.6 units past the end line, the wall 4.8 units past that, and the crowd fills the rest.
- Goal to go from the 10 puts the end line at y 110; from the 1, at y 225, leaving the top 45% for the path and the crowd. Phone and desktop use the same viewBox, so the framing is identical.
- Backed up at the offense's own 10, its goal line falls on the bottom edge (y 494), so its end zone shows only where the camera reaches farther back, as in live play.
- Prototypes: [field/prototype-goal-to-go.html](field/prototype-goal-to-go.html) (phone) and [field/prototype-goal-to-go-desktop.html](field/prototype-goal-to-go-desktop.html), 2nd & goal from the 6.

## Elevation & Depth

Flat by default. Depth comes from the paper-on-turf split, not shadows. Two exceptions, both structural:
- **Sheet shadow:** `0 -12px 32px rgba(0,0,0,.45)` for result sheets, which sit on a dimmed field; `0 -12px 32px rgba(0,0,0,.35)` for the Landing and Tutorial sheets; `0 -8px 24px rgba(0,0,0,.35)` for the live-play caption bar.
- **Field shade** (`rgba(6,13,10,.22)` overlay): dims the field under a result sheet so play art reads as a diagram.

The replay scrubber thumb uses `0 1px 4px rgba(0,0,0,.5)`. Nothing else casts a shadow.

## Shapes

Soft rectangles, round players. Controls at 12px radius (9px for the inner segmented pill), primary buttons 14px (16px on result screens), outcome tiles 10px, rep boxes 8px, sheets 28px and the live caption bar 22px on the top corners only, field pills fully round. On the field everything is a circle, a line or an ellipse; arrowheads are open chevrons (defense play art 5 units at ±38°, routes about 9 units at ±40°).

## Components

### Buttons
- **Primary** (`button-primary`): Snap Orange, white uppercase 900 text at 19px, 52px tall on play screens and 56px on result screens, full width or flex-grow beside a square secondary. One per screen.
- **Secondary square** (`button-secondary-square`): 56×56 white with a Sand Border, icon only (replay), always with an `aria-label`. On green or charcoal panels it turns transparent with a cream 35% border.
- **Skip** (`button-skip`): 44px white outlined button with label and skip icon; live play only.

### Step bar
Three equal steps (Protect, Routes, Read) with a 3px bar over a 12px uppercase label. Done and current bars are Ink Green; the current label is Ink Green, others Sage Muted.

### Segmented control
White track, Sand Border, 3px padding; options 38–40px tall, 800 uppercase 14px. Selected = Ink Green fill with cream text (dark mode: cream fill, charcoal text). Used for blocker count, line call, route depth (5/10/15 yds) and playback speed.

### Route card carousel
92×88 cards: a mini turf diagram of the route in the selected receiver's colors above an uppercase name. Selected card has a 2px Ink Green border. The carousel scrolls horizontally and bleeds off both edges.

### Read option
52px white option with the receiver's ring swatch, name and route; selected gets a 2px Ink Green border and a filled check.

### Field pills
- **Situation pill** (`field-pill`): translucent near-black, cream 12px text. Used for "3rd & 10 · own 45", "Down 4 · 1:12", "Rep 1 replay".
- **Key pill** (`field-key-pill`): cream with charcoal 800 uppercase text, stacked under the situation pill: "Defense · Cover 4", "The pros' call · Four verticals". Shown only when the coverage may be revealed (see Do's and Don'ts).

### Result sheet
Three panels, one rule each:
- **Cream** (`result-sheet`): a rep failed or fell short, reps remain. Charcoal headline with an outcome tile on its left; stats in charcoal; rep boxes; replay square + Run It Back.
- **Ink green** (`result-sheet-win`): converted. Cream headline, no tile, gold stats, a cream check in the winning rep box, dashed boxes for reps not needed; CTA "See how the pros did".
- **Charcoal** (`result-sheet-over`): out of reps. Cream headline, orange stats, all rep boxes spent; CTA "See how the pros did".

### Outcome tile
44×44, 10px radius, beside the headline. Orange with a white ✕ for incomplete, sack and interception; gold with the yards ("+7") for short. Matches the share card tiles.

### Rep boxes
Four 30px boxes. Used rep: Ink Green border, 12% green fill and a ✕, or the yards for a short rep. Next rep: Ink Green border and number. Unused: Sand Border. On the win panel: winning rep is a cream box with a green check; reps not needed are dashed.

### Stat triplet
Three equal columns between 1px rules: value (Stat) over a 12px Sage Muted label. Values never wrap.

### Live caption bar
92px cream bar with a 26px uppercase phase word (Set, Snap, Throw, then the outcome) over a 13px line, and Skip on the right. Swaps text in step with the play.

### Share card
Ink-green card: "OMAHA #N", down and distance in gold, one tile per rep (orange ✕ incomplete/sack/interception, gold short, green ✓ converted, dashed for reps not needed) each labeled "Rep N" plus a short result, then a gold "Beat the pros" chip and the score. The 1200×630 link-preview image uses the same card.

### Field glyphs
- **Players** as listed in the player palette: receivers r=8.5, linemen r=8, defenders r=7.5.
- **Routes** (design screens): 2px lines in the route color with an open arrowhead about 9 units long at ±40°; on the pros reveal they use the 5-unit play-art arrowhead so they read as part of the diagram; the selected receiver's route is 2.4px and the others drop to 45% opacity. Route-card mini diagrams use a 6–7 unit arrowhead.
- **Protection:** zigzag in Protection zigzag (#06100B) under the line for pass protection, a Lineman stroke (#DADDE0) arrow for the slide direction, and the RB's block as a green line ending in a T at the edge opposite the slide.
- **Read:** gold 14-unit ring around the selected receiver and a gold "1" badge.
- **Receiver feedback badges** (result screens): r=7 badge offset up-right of the receiver. Open = solid white disc with a dark check. Contested = dark disc, white ring, white wave. Covered = dark disc, grey ring, white ✕. Shape carries the meaning, so color is never the only cue.
- **Ball:** dashed white path (2 on, 5 off) from the QB's position at the throw to the catch point, at 70% opacity on result screens and full opacity in the replay; the football is a brown #8B5A2B ellipse (rx 4.2, ry 2.7) with a 0.8 white edge, rotated along its flight. It is drawn in flight during the live play and the replay, and on a result only for an interception.
- **QB vision cone:** gold wedge (gradient 70% → 0%, 176 units long, ±13°) from the QB aimed at his current read's position, fading in at the snap and out within 0.3s after the throw.

### Motion
- **Live play** loops in the prototype; in the app it plays once. Phases: set (0.8s), the play (3.4s, with the throw at 2.3s and the ball in the air 0.6s), then the reveal.
- **Reveal:** the result sheet slides up over 0.5s with `cubic-bezier(.2,.8,.2,1)` while the field shade and play art fade in and the camera pans to the result framing.
- **Reduced motion:** skip the animation and show the final frame with the result sheet already up.

## Do's and Don'ts

### Do:
- **Do** keep each receiver's color identical across the design screens, the live play, the result and the share card.
- **Do** put the cause first in every result line, then the jab ("Thrown right to the safety. He says thanks.").
- **Do** show defense play art (zones, paths, start dots) only on result screens and the pros reveal.
- **Do** show the coverage name only on the final rep, a converted result and the pros reveal.
- **Do** pair every outcome color with a shape or label (✕, check, wave, "+7").
- **Do** keep the field full width on phones and the result framing identical between the live play's last frame and the result screen.

### Don't:
- **Don't** draw routes or zones during the live play or the replay; players and the ball only.
- **Don't** use green for a failed rep. Don't use gold on cream for anything but the read and a short rep; on ink-green surfaces it is the accent.
- **Don't** put more than one orange button on a screen.
- **Don't** use real team names, logos, uniforms or player names anywhere, including art and copy.
- **Don't** invent stats in shipped UI: the "% beat the pros", streaks and scores come from the results API and local storage. Prototype numbers (38%, 77, 4-day streak) are placeholders.
- **Don't** let trash talk hide the reason. If a line only insults, rewrite it.
