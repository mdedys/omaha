# Omaha design

The visual spec for Omaha. Start with [DESIGN.md](DESIGN.md) (tokens, type, components, field-art rules), then the folder for the screen you are building.

Product context lives in [../PRODUCT.md](../PRODUCT.md) and [../GAME_CONCEPT.md](../GAME_CONCEPT.md).

## Screens

| Folder | Screen | Prototypes |
|---|---|---|
| [01-landing](01-landing/spec.md) | Landing with today's puzzle | phone, desktop · light and dark |
| [02-puzzles](02-puzzles/spec.md) | Puzzle list | phone, desktop · light and dark |
| [03-tutorial](03-tutorial/spec.md) | Three-step how-to-play | phone ×3, desktop ×3 · light and dark |
| [04-protect](04-protect/spec.md) | Step 1: protection | phone, desktop · light and dark |
| [05-routes](05-routes/spec.md) | Step 2: routes | phone, desktop · light and dark |
| [06-read](06-read/spec.md) | Step 3: first read and snap | phone, desktop · light and dark |
| [07-live-play](07-live-play/spec.md) | The animated snap, flowing into the result | phone, desktop (animated) · light and dark |
| [08-result](08-result/spec.md) | Rep result with defense play art | phone, desktop · light and dark; 6 end states (light and dark); 4 coverages |
| [09-replay](09-replay/spec.md) | Video-style replay | phone, desktop · light and dark |
| [10-pros-reveal](10-pros-reveal/spec.md) | How the pros did | phone, desktop · light and dark |
| [11-share](11-share/spec.md) | Share result and link-preview card | phone, desktop · light and dark; 1200×630 card |

Field art that applies to every screen lives in [field/](field/): `prototype-goal-to-go.html` (phone) and `prototype-goal-to-go-desktop.html` show the end zone, the goal line as the line to gain, the end line, the sideline path and the crowd at 2nd & goal from the 6 (light). The rules are in DESIGN.md's Field palette and Layout › Field geometry.

Open any `*.html` directly in a browser; each file is self-contained apart from the Google Fonts link. Phone prototypes are fixed at 390×844. Desktop prototypes need a window at least 900px wide.

The prototypes are snapshots of the design canvas at https://claude.ai/artifact/5whUJ41gEbZ2b2Mt9vQ8j6. If the canvas and these files disagree, these files and the specs win.

Every screen has light and dark prototypes on phone and desktop: `prototype.html`, `prototype-dark.html`, `prototype-desktop.html`, `prototype-desktop-dark.html` (Tutorial numbers each step, e.g. `prototype-2-desktop-dark.html`; Result states have `-dark` twins).

### Reading the prototypes

The prototypes are hand-built mockups, not reference code. Where a prototype and DESIGN.md disagree on a value, DESIGN.md wins; where a prototype and its spec disagree on behavior, the spec wins. Known drawing inaccuracies to ignore:
- Field positions are hand-placed. In the shipped app, routes, player paths and the ball come from puzzle data and the simulation (the Left WR's In breaks at about 10.7 yards in the drawings; 10 yards is y 238).
- The Puzzles list thumbnails use an uneven yard scale.
- Some files carry unused CSS (route chips, share-card helpers, play-screen rules in the desktop share file).
- The phone and dark prototypes animate or hold one example state; the specs list every state.

## Flow

```
Landing ─┬─ Puzzles ── (pick a puzzle)
         └─ How to play (Tutorial 1–3)
            │
Protect → Routes → Read + Snap → Live play ──(auto)──> Result
                                                       ├─ Replay ──> back to Result
                                                       ├─ Run it back (reps left) ──> Protect, previous design kept
                                                       └─ See how the pros did (final rep or converted) ──> Pros reveal ──> Share
```

## Decisions

These are settled for the UX, and specs assume them. Game rules in this table (protection, routes, reps, interceptions, when the coverage name shows) are proposals; the game engine work owns them and may change them.

| Topic | Decision |
|---|---|
| Formation and defense | Set by the puzzle. The player never picks a formation. |
| Protection | Blocker count (5-, 6-, 7-man) and line call (slide left, man, slide right). 6-man always keeps the RB in; 7-man also keeps the TE and is hidden when there is no TE or the TE is split out. |
| Routes | Tap a receiver on the field, pick a route from a carousel, pick a depth from 5/10/15 yards. No freehand drawing. |
| Read | The player picks the first read. |
| Snap unlock | Protection starts on 5-man, man. Snap unlocks once every route runner has a route and a first read is picked. |
| Between reps | Run It Back reopens the previous design for editing. |
| Live play | Plays once, no route lines or zones, QB vision cone on the current read, compact caption bar, then slides into the result automatically. Skip jumps to the result. |
| Result | Shows the defense's play art (Madden zone colors), receiver feedback badges, and the outcome. |
| Coverage name | Shown only on the final rep, a converted result and the pros reveal. Earlier reps show play art without the name. |
| Interception | A failed rep, like an incomplete or a sack. |
| Pros reveal | The pros' play drawn on the same field against the same defense, a story line, your result next to theirs, and the % who beat the pros. |
| Voice | Trash talk everywhere, cause first, jab second. |
| Themes | Light (cream) and dark (charcoal). The field and the share card are identical in both. |
| Sharing | One tile per rep: orange incomplete/sack/interception, gold short, green converted. |
| Line to gain | The yellow line marks what converts the puzzle: the first-down line, or the goal line on a touchdown goal. |
| End zones | Burnt orange paint with a faint OMAHA wordmark, never a team name or logo. The line of scrimmage stays put in goal to go; past the end line are a grey sideline path and a static pixel-art crowd. |

## Open questions (owned by the game engine work)

Tracked on the game engine's `wayfinder:map` issue on GitHub.

- **Read progression after the first read.** Leaning toward the player setting a 1-2-3 order in the Read step. If adopted, the Read step and the vision cone need an update.
- **Touchdown result.** A converted rep that also scores needs its own headline and bonus display.
- **How much a failed rep reveals** beyond the defense play art already shown.
- **Difficulty ramp** through the NFL week.

## Spec format

Every `spec.md` uses the same sections: Purpose, Prototypes, Entry and exit, Layout, Content and copy, Components, States, Interactions, Motion, Accessibility, Data, Open questions, Acceptance criteria. Components are named as in DESIGN.md.
