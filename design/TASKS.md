# Implementation queue

Agent-sized tasks for building the Omaha front end from this design folder. Work top to bottom; a task can start once everything in **Depends on** is done. Each task's "Done when" includes the acceptance criteria in the linked spec.

The game engine (simulation, read progression, scoring rules) belongs to a separate session. Front-end tasks run against the fixture puzzle and stubbed simulation output from T03 until the engine lands.

Stack per PRODUCT.md: TypeScript, React, SVG for the field, static hosting, PWA. No game engine library.

## Foundation

### T01 · App scaffold
- **Depends on:** none
- **Scope:** React + TypeScript project (Vite proposed; confirm before starting), client-side routing for every screen in [README.md](README.md#screens), Figtree loaded from Google Fonts, PWA manifest stub.
- **Done when:** each route renders a placeholder with its screen name; `npm run build` passes.

### T02 · Design tokens and themes
- **Depends on:** T01
- **Scope:** every token in [DESIGN.md](DESIGN.md) frontmatter as CSS custom properties; light theme on cream, dark theme on charcoal; follows `prefers-color-scheme` with a stored override.
- **Done when:** a token test page shows each color, type style and radius in both themes, matching DESIGN.md values.

### T03 · Fixture puzzle and stub simulation
- **Depends on:** T01
- **Scope:** typed data for the prototype puzzle (3rd & 10, own 45): formation, defense pre-snap alignment and Cover 4 assignments, briefing line, goal, puzzle-list label, the pros' call and result. Stub simulation outputs for the six end states in [08-result/states](08-result/states/) (per-player paths with timestamps, ball path, throw/catch times, read target over time, receiver feedback, outcome, stats). Use the data contracts proposed in [07-live-play/spec.md](07-live-play/spec.md) and [08-result/spec.md](08-result/spec.md).
- **Done when:** fixtures type-check and feeding them to T04/T05 reproduces the prototype field frames.

### T04 · Field renderer
- **Depends on:** T02, T03
- **Scope:** SVG field per DESIGN.md "Field palette" and "Layout › Field geometry": turf and stripes, yard lines, hash marks, numbers, line of scrimmage, first-down line, optional extended viewBox for live play. Player glyphs per "Player palette" (receivers with rings and labels, linemen, QB, defenders).
- **Done when:** given the fixture, it renders the pre-snap frame of [04-protect/prototype.html](04-protect/prototype.html) to within a few pixels at 390px wide, and scales to the desktop stage.

### T05 · Field overlays
- **Depends on:** T04
- **Scope:** routes with arrowheads (selected vs faded), protection art (zigzag, slide arrow, RB block T), read ring and "1" badge, defense play art (zone ellipses by type, same-color drop lines, man and rush arrows, orange blitz arrows, start dots), receiver feedback badges, dashed ball path and football, QB vision cone. All per DESIGN.md "Field glyphs" and "Coverage palette".
- **Done when:** the four [08-result/coverages](08-result/coverages/) frames render from data.

### T06 · Shared UI components
- **Depends on:** T02
- **Scope:** primary, secondary-square and skip buttons; segmented control; step bar; route card; read option; field pills (situation and key); result sheet (cream, win, over); outcome tile; rep boxes; stat triplet; live caption bar; share card. Light and dark.
- **Done when:** a component gallery shows every component and variant in both themes, matching the prototypes.

### T07 · Design state store
- **Depends on:** T03
- **Scope:** protection (default 5-man, man), routes and depths per receiver, first read, rep history and outcomes; 7-man hidden rule; snap unlock rule; the design carries over between reps; persisted to local storage per puzzle.
- **Done when:** unit tests cover the defaults, the 7-man rule, the snap unlock rule and carry-over between reps.

## Play loop

### T08 · Protect screen
- **Depends on:** T05, T06, T07 · **Spec:** [04-protect/spec.md](04-protect/spec.md)

### T09 · Routes screen
- **Depends on:** T08 · **Spec:** [05-routes/spec.md](05-routes/spec.md)

### T10 · Read screen and snap
- **Depends on:** T09 · **Spec:** [06-read/spec.md](06-read/spec.md)

### T11 · Live play
- **Depends on:** T10 · **Spec:** [07-live-play/spec.md](07-live-play/spec.md)
- **Note:** plays once in the app (the prototype loops); the reveal hands off to T12 with no visible jump.

### T12 · Result screen
- **Depends on:** T11 · **Spec:** [08-result/spec.md](08-result/spec.md)
- **Note:** all six end states; coverage key pill only on the final rep and converted.

### T13 · Replay screen
- **Depends on:** T12 · **Spec:** [09-replay/spec.md](09-replay/spec.md)

### T14 · Pros reveal
- **Depends on:** T12 · **Spec:** [10-pros-reveal/spec.md](10-pros-reveal/spec.md)

### T15 · Share screen and share text
- **Depends on:** T14 · **Spec:** [11-share/spec.md](11-share/spec.md)

### T16 · Link-preview image
- **Depends on:** T15 · **Spec:** [11-share/spec.md](11-share/spec.md) (share-card.html)

## Around the play

### T17 · Landing
- **Depends on:** T06, T07 · **Spec:** [01-landing/spec.md](01-landing/spec.md)

### T18 · Puzzle list
- **Depends on:** T17 · **Spec:** [02-puzzles/spec.md](02-puzzles/spec.md)
- **Note:** blocked on the archive scope question in the spec.

### T19 · Tutorial
- **Depends on:** T06 · **Spec:** [03-tutorial/spec.md](03-tutorial/spec.md)

## Finish

### T20 · Desktop layout
- **Depends on:** T08–T19
- **Scope:** the ≥900px layouts from every screen's `prototype-desktop.html` (two-column play screens, wide Landing panel, centered Puzzles column), keyboard hints and shortcuts; below 900px the phone designs apply.

### T21 · Dark theme pass
- **Depends on:** T08–T19
- **Scope:** every screen in dark theme on phone and desktop, compared against the `prototype-dark.html` and `prototype-desktop-dark.html` files and the `-dark` result states, following DESIGN.md "Dark theme" (including the out-of-reps tile rule).

### T22 · Accessibility and QA pass
- **Depends on:** T20, T21
- **Scope:** every spec's accessibility section, reduced motion, focus order, contrast in both themes, touch targets, 390px and 1440px screenshots of every screen against its prototype.
