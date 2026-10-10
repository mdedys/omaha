# Share

## Purpose

The end of the daily loop. It states the final result, previews the share card (one tile per rep), compares the player's result with the pros', shows score, streak and "% beat the pros", lets the player copy or share a spoiler-free result, and counts down to the next puzzle. This spec also covers the 1200×630 link-preview image.

## Prototypes

| File | Shows |
|---|---|
| `prototype.html` | Phone, 390×844, light theme. Converted on rep 2 (+12 yards) after an incomplete on rep 1; beat the pros; 77 pts. |
| `prototype-dark.html` | Same content in the dark theme. |
| `prototype-desktop.html` | Desktop (≥900px): 64px top bar and a two-column layout, card on the left, result and actions on the right. Collapses to one column below 900px. |
| `prototype-desktop-dark.html` | Same desktop content in the dark theme. |
| `share-card.html` | The 1200×630 link-preview (Open Graph) image for the same result. |

All numbers in the prototypes are placeholders: puzzle #148, 77 pts, 4-day streak, 38% beat the pros, +12 yards, the countdown 07:42:19. Where the prototypes and DESIGN.md disagree on a token (the not-needed label color), this spec follows DESIGN.md.

## Entry and exit

**Entry**
- "Share result" on Pros reveal (`10-pros-reveal`). Pros reveal is reached after the final rep or a converted rep.
- Until Pros reveal exists, "Share result" on Result's ink-green and charcoal sheets opens Share directly (Decisions 2).
- Possibly from Landing's finished state or a finished row on Puzzles (open questions in those specs).

**Exit**
- Close (header ✕) → Landing (`/`) (Decisions 4).
- Copy → stays on the screen; text copied to the clipboard.
- Share result → native share sheet; the screen stays underneath.
- System/browser back → the finished Result sheet, unchanged (Decisions 4).

## Layout

### Phone (390×844, light)

Background `cream`, text `ink-green`. Column; no page scroll at 844px.

1. **Header**, 56px, no shrink, padding 0 16px, 1px `sand-border` bottom border, space-between.
   - Wordmark "OMAHA": 22px, 900, 0.02em.
   - Close button: 44×44, transparent, 20px ✕ icon (stroke 2.4, round caps), `aria-label="Close"`.
2. **Main**, fills the rest, padding 20px 16px 22px, column, `justify-content: space-between`. Five groups top to bottom:
   1. **Headline block** (column, 6px gap):
      - Headline `h1` "CONVERTED": 52px, 900, line-height 0.9, -0.01em.
      - Result line: 16px, 600, `sage-muted`.
   2. **Share card preview** (`section`, `aria-label="Share card preview"`): `share-card` token — `ink-green` background, `cream` text, 16px radius, padding 18px 16px 16px; column, 14px gap.
      - Top row (space-between, baseline): "OMAHA #[N]" 18px 900 0.02em; down and distance 13px 800 `read-gold`, uppercase.
      - Tile row: centered, 14px gap, one column per rep (four). Each column: tile above a two-line label, 11px gap.
        - Tile 64×64, 12px radius.
          - Failed (incomplete, sack, interception): `snap-orange` fill, white ✕ icon 24px (stroke 2.8).
          - Converted: `converted-green` fill, check icon 26px, stroke `on-tile` 2.8.
          - Short: `read-gold` fill with the rep's signed yards ("+7") inside in `on-tile`, as on Result (Decisions 7).
          - Not needed: transparent, 2px dashed `share-card-rule` border.
        - Label: 11px, 800, 0.04em, uppercase, line-height 1.15, centered. Line 1 "Rep N"; line 2 the rep's short result. `cream` for played reps, `win-muted` for reps not needed (the prototypes still show #7F978B).
      - Footer row: space-between, centered, 12px top padding, 1px `share-card-rule` top border.
        - "Beat the pros" chip: 28px tall, padding 0 12px, 14px radius, 1.5px `read-gold` border, `read-gold` text 12px 800 uppercase 0.04em.
        - Score: 15px 800, e.g. "77 pts".
   3. **Pros vs you** (row, 8px gap): two equal boxes, 12px radius, padding 12px, column, 6px gap. Box header 11px 800 0.06em uppercase line-height 1; value 17px 900 uppercase line-height 1.1.
      - "The pros" box: `paper-white`, 1px `sand-border`, header `sage-muted`, value `ink-green`.
      - "You" box: `ink-green` fill, header `win-muted`, value `cream`.
   4. **Stats** (row, 12px gap, padding 14px 0, 1px `sand-border` top and bottom): three equal columns, 6px gap. Value 28px 900 line-height 1, `snap-orange`. Label 12px 600 `sage-muted`, lowercase.
   5. **Actions** (column, 10px gap):
      - Button row (8px gap): Copy square button 56×56, 10px radius, 2px `sand-border`, `paper-white`, `ink-green` 20px copy icon; Share button, grows, 56px, 10px radius, `snap-orange`, white 19px 900 uppercase 0.01em, 20px share icon, 10px gap.
      - Countdown: centered, 13px 600 `sage-muted`, tabular numerals.

### Dark theme (`prototype-dark.html`, `prototype-desktop-dark.html`)

Same layout. Differences:
- Page background `dark-bg`; ink `cream`; header and stats rules `dark-border`.
- Result line, stat labels and countdown `dark-muted`.
- Copy button: `dark-surface` fill, 2px `dark-border`, `cream` icon.
- "The pros" box: `dark-surface`, 1px `dark-border`, header `dark-muted`, value `cream`.
- "You" box: `cream` fill, header `sage-muted`, value `charcoal`.
- Share card, stat values (orange) and the Share button are unchanged. The share card is identical in both themes (README Decisions).
- Desktop: the same mapping, plus the top-bar border `dark-border` and the countdown `dark-muted`.

### Desktop (`prototype-desktop.html`, ≥900px)

- Top bar 64px, padding 0 28px, 1px `sand-border` bottom: "OMAHA" 24px 900 0.02em on the left, Close (44×44) on the right.
- Main: grid of two equal columns (`minmax(0,1fr) minmax(0,1fr)`), 48px gap, vertically centered, max-width 1120px, centered, padding 48px 32px.
- **Left column**: share card at desktop scale — 20px radius, padding 28px, 20px gap; top row 24px / 15px; tiles 84×84, 15px radius, 18px gap between columns, 14px gap to labels; icons 30px (✕) and 32px (check); labels 13px; footer 16px top padding; chip 32px tall, padding 0 14px, 16px radius, 13px; score 18px.
- **Right column** (column, 24px gap):
  - Headline 72px with result line 18px (8px gap).
  - Pros vs you: 10px gap, boxes padding 14px with 7px gap, header 12px, value 19px. Pros box value uses the default ink (`ink-green`).
  - Stats: padding 16px 0, values 32px (`stat` desktop size), labels 13px.
  - Buttons: 10px gap, Copy 58×58, Share 58px tall, both 10px radius, Share label 19px with 12px icon gap.
  - Countdown: left-aligned, 12px 600 `sage-muted`, tabular numerals.
- No keyboard hints (`kbd`) are shown on this screen.
- **Below 900px**: one column, 24px gap, padding 20px 16px, top bar padding 0 16px. The prototype puts the card first; the app uses the phone layout below 900px, headline first (Decisions 9).

### Link-preview image (`share-card.html`, 1200×630)

A static image, rendered on a server or at build time, never by the client at share time. Background `ink-green`, padding 64px 72px, row, space-between, centered, 56px gap.
- **Left column** (full height, space-between):
  - Top group (column, 22px gap): "OMAHA" 148px 900 line-height 0.82 -0.01em `cream`; result line 30px 800 `read-gold` 0.01em; tagline 30px 600 `win-muted`.
  - Bottom row (centered, 18px gap): a button graphic "Play today's puzzle" (58px tall, padding 0 28px, 10px radius, `snap-orange`, white 22px 900 uppercase 0.01em) and the domain 22px 700 `win-muted`.
- **Right panel**: `share-card-inner` fill, 28px radius, padding 36px, column, 14px gap.
  - Tile row: 16px gap; tiles 92×92, 17px radius; icons 36px (✕) and 38px (check); labels 16px 800 0.04em uppercase, 13px gap; same color rules as the in-app card.
  - Footer: 18px top padding, 6px top margin, 2px `share-card-rule` top border; chip 40px tall, padding 0 18px, 20px radius, 2px `read-gold` border, 17px 800 uppercase; score 24px 900.
- Figtree (weights 600, 800, 900) must be available to the renderer.
- Output: 1200×630 raster image referenced by the shared page's Open Graph and Twitter card image tags.

## Content and copy

**[puzzle]** = puzzle JSON. **[result]** = this player's result (local storage / game state). **[api]** = results API. **[local]** = local storage.

| Element | Copy (prototype) | Source |
|---|---|---|
| Header wordmark | `OMAHA` | static |
| Close label | `Close` (aria-label) | static |
| Headline | `CONVERTED`, or `OUT OF REPS` | **[result]** (Decisions 3) |
| Result line | `3rd & 10 · in 2 reps · +12 yards` | down & distance **[puzzle]**; reps and yards **[result]** |
| Card title | `OMAHA #148` → `OMAHA #[N]` | **[puzzle]** number |
| Card situation | `3RD & 10` | **[puzzle]** |
| Tile labels | `Rep 1` / `Inc`, `Rep 2` / `+12`, `Rep 3` / `—`, `Rep 4` / `—` | **[result]** per rep |
| Tile row aria-label | `Rep 1 incomplete, rep 2 converted for 12 yards, reps 3 and 4 not needed` | built from **[result]** |
| Chip | `Beat the pros` | **[result]** compared with the pros' result |
| Score | `77 pts` | **[result]** score |
| Pros box | `The pros` / `Incomplete` | **[puzzle]** pros' outcome |
| You box | `You` / `+12 · 1st down` | **[result]** |
| Stat 1 | `77` / `score` | **[result]** |
| Stat 2 | `4` / `day streak` | **[local]** streak |
| Stat 3 | `38%` / `beat the pros` | **[api]** |
| Copy button label | `Copy result` (aria-label) | static |
| Share button | `Share result` | static |
| Countdown | `Next puzzle in 07:42:19` (`HH:MM:SS`) | time until the next midnight US Eastern |
| OG result line | `#148 · 3RD & 10 · CONVERTED IN 2` | **[puzzle]** + **[result]** |
| OG tagline | `Can you out-coach the pros?` | static |
| OG button | `Play today's puzzle` | static |
| OG domain | `[your-domain]` | placeholder; real domain not chosen |

Tile second-line labels seen in prototypes: `Inc` (incomplete), `+12` (yards on the converting rep), `—` (not needed). The built labels are in Decisions 7.

### Pasted share text

Settled in Decisions 1. It is what Copy writes to the clipboard and what Share passes to the share sheet. It is spoiler-free: no defense, coverage, routes or the pros' call.

Template:

```
Omaha #[N] · [down & distance]
[one emoji per rep played, in order]
[result] · [score] pts
```

- Emoji per rep: 🟥 incomplete, sack or interception; 🟨 short; 🟩 converted. Reps not needed are omitted.
- `[result]`: `Converted in [reps]` when converted, followed by ` · Beat the pros` when earned. Out of reps reads `Out of reps · 0 pts`.
- No link line until the domain and link format are decided.

Example (prototype result):

```
Omaha #148 · 3rd & 10
🟥🟩
Converted in 2 · Beat the pros · 77 pts
```

PRODUCT.md notes the pasted emoji text has no shapes, so the result line beside it carries the meaning for colorblind readers.

## Components

- **Share card** (`share-card`), with the in-app tile size of 64px (84px desktop, 92px OG). Tiles follow DESIGN.md Share card colors; Converted Green appears only here.
- **Outcome tile** colors and icons, at share-card size.
- **Primary button**: Share result, 19px `button` type. Desktop matches DESIGN.md's desktop variant (58px, 10px radius). Phone is 56px with `cta-result`'s 16px radius (Decisions 9; the prototype shows 10px).
- **Secondary square** (`button-secondary-square`): Copy, 1px border and 16px radius on phone, 2px and 10px on desktop (Decisions 9; the phone prototype shows 2px / 10px).
- **Stat triplet**: values at DESIGN.md's `stat`, 26px (32px desktop), gold on a converted result and Snap Orange out of reps (Decisions 9; the prototype shows 28px orange).
- **Pros vs you boxes**: same component as on Pros reveal (`.vs`), not named in DESIGN.md.
- **Display** type for the headline at 50px (72px desktop) (Decisions 9; the phone prototype shows 52px).

## States

1. **Converted, beat the pros (prototyped).** As described. Tiles: failed reps orange, the converting rep green, later reps dashed. Chip shown.
2. **Converted, did not beat the pros (not prototyped).** Same layout. Whether the chip is hidden or replaced is an open question. Comparison boxes show both outcomes.
3. **Out of reps (not prototyped).** Four played tiles (orange or gold), no dashed tiles, no converted tile. Under PRODUCT.md's definition ("solving in a way that beats the real result"), the chip does not apply. Settled in Decisions 3.
4. **Converted with a touchdown (not prototyped).** README lists the touchdown result as open. For now it shows the same headline, chip, "You" box and tile as a converted result (Decisions 3); how a touchdown should display stays open.
5. **Copied (not prototyped).** After Copy, the player needs confirmation. Settled in Decisions 5.
6. **Share unavailable (not prototyped).** Browsers without the Web Share API (most desktop browsers). Share copies the text, as Copy does (Decisions 5).
7. **Share sheet dismissed.** No change to the screen.
8. **Stats unavailable (not prototyped).** The results API fails or is slow: "% beat the pros" has no value. It shows `—` (Decisions 10). Streak and score are local and always available.
9. **Countdown reaches zero (not prototyped).** The line reads `New puzzle is out` and links to Landing (Decisions 6).
10. **Off-season (not prototyped).** After the last puzzle of the season there is no next puzzle; countdown behavior is open.
11. **Revisited later (not prototyped).** If Share is reopened from Landing or Puzzles, the content is the stored result; the countdown is always to the next puzzle from now. For an earlier puzzle opened from Puzzles, whether the countdown shows is open.

## Interactions

- Tap Close → Landing (`/`).
- Tap Copy → writes the pasted share text to the clipboard; shows the Copied state.
- Tap Share result → on devices with the Web Share API, opens the native share sheet with the pasted share text (and link). Without it, see state 6.
- The share card preview, comparison and stats are not interactive.
- Countdown updates once per second.
- Hover: Share button `snap-orange-deep`.
- Keyboard focus order: Close → Copy → Share result. Enter or Space activates. No shortcut keys are defined.

## Motion

None. The countdown text changes every second; that is not an animation.

## Accessibility

- Headline "CONVERTED" is the `h1`.
- The share card preview is a `section` labeled "Share card preview". Its tile row has an `aria-label` that spells out each rep's outcome (built from the result); tile icons are `aria-hidden`.
- Copy is icon-only and has `aria-label="Copy result"`. The Copied confirmation is announced through a polite live region.
- The countdown must not be a live region (it would announce every second). Expose it as plain text.
- Outcome tiles pair color with shape (✕, check, dashed outline) and a text label, per DESIGN.md.
- Contrast:
  - Stat values Snap Orange on Cream 3.23:1 at 28px 900: passes as large text.
  - Share button white on Snap Orange 3.71:1 at 19px 900: passes as large text.
  - Not-needed tile labels `win-muted` on Ink Green 5.42:1: passes AA.
  - Dashed tile border `share-card-rule` on Ink Green 1.63:1; the "—" label carries the meaning.
  - Gold on Ink Green 5.28:1, Win Muted on Ink Green 5.42:1, Cream on Ink Green 8.62:1: pass.
  - Dark: Dark Muted on charcoal 7.46:1; Snap Orange on charcoal 4.49:1 at 28px: passes as large text.
- Touch targets: Close 44×44, Copy 56×56, Share 56px tall.
- Reduced motion: nothing animates.
- OG image: it is an image for link previews; the shared page should carry an image alt description where the platform supports it (`og:image:alt`), built from the same result text.

## Data

| Field | Source |
|---|---|
| Puzzle number, down, distance | puzzle JSON |
| Pros' outcome ("Incomplete") | puzzle JSON |
| Per-rep outcomes (failed type, short yards, converted yards), reps used | game state, persisted in local storage |
| Converted flag, rep converted on | game state / local storage |
| Score (100 / 75 / 50 / 25 by reps + quality bonus up to +20; 0 if failed) | computed by the game engine; stored locally |
| Beat the pros (boolean) | computed by the game engine against the pros' result |
| Day streak | local storage |
| % beat the pros | results API (Cloudflare Worker + D1) |
| Next puzzle time | next midnight US Eastern |
| Link URL, domain | not decided |
| OG image inputs | puzzle number, situation, result, tiles, chip, score — see Open questions on how they reach the renderer |

## Decisions

Settled with Mike before building:

1. **Pasted text:** the template under Pasted share text. Reps not needed are omitted, with no ⬜ padding. 🟥 for a failed rep (incomplete, sack, interception, throwaway), 🟨 short, 🟩 converted. Down and distance are included. Out of reps reads `Out of reps · 0 pts`. No link line until the domain and link format are decided.
2. **CTA until Pros reveal exists:** Result's ink-green and charcoal sheets read `Share result` and open Share. Pros reveal changes it back to "See how the pros did".
3. **Variants:** out of reps shows the headline `OUT OF REPS`, the chip `Didn't beat the pros`, the "You" box `No first down` and `0 pts`. A touchdown shows the same as converted; the touchdown display stays open.
4. **Close** goes to Landing (`/`). Opening Share adds a history entry (`/puzzle/N/share`), so browser and OS back return to the finished Result.
5. **Without the Web Share API,** Share copies the text, as Copy does. After either, the pressed button shows a check and `Copied` for 2s, and a polite live region announces "Copied to clipboard".
6. **Countdown at zero:** the line becomes `New puzzle is out`, linking to Landing. Off-season and earlier puzzles opened from Puzzles wait until there is data for them.
7. **Tile labels:** `Incomplete` (incomplete or throwaway), `Sacked`, `Picked`, `Short` and `Converted` (converted or touchdown), and `—` for reps not needed. The short tile shows the rep's signed yards ("+7"), as on Result.
8. **Pros-vs-you boxes** stay on Share for now. Pros reveal decides whether they stay.
9. **DESIGN.md wins on visual values.** Converted stats are gold, not orange; out-of-reps stats stay orange. On phone the headline is `display` (50px), Share is 56px with a 16px radius, Copy is 56×56 with a 1px border and 16px radius, and stats are 26px. Desktop uses DESIGN.md's desktop variants: 58px buttons with a 10px radius, Copy with a 2px border, and 32px stats. Below 900px the phone layout applies, headline before the card.
10. **Unavailable stats** ("% beat the pros", streak) show `—`, as the day streak does on Result.

Settled while building:

- **Beat the pros** means converting, per PRODUCT.md ("Puzzles only feature plays the real offense failed to convert"), so the chip reads `Beat the pros` on every conversion.
- **Out-of-reps result line:** `3rd & 10 · 4 reps · no first down`. The `Didn't beat the pros` chip uses `win-muted` for its border and text, so gold stays for a win.
- **Share without a finished result:** nothing stores results yet, so opening `/puzzle/N/share` without a finished puzzle in the current session opens the puzzle instead.
- **Tile spacing:** each tile column is as wide as the tile plus its gap or its longest label, so four `Incomplete` labels never touch. On the link-preview card the labels are 14px with 12px between tiles, so the panel fits the 1200×630 frame.
- **Link-preview domain** is left off until a domain is chosen.

## Open questions

- **Converted, did not beat the pros** (state 2): whether the chip is hidden or replaced. Under PRODUCT.md every conversion beats the pros, so this can't happen yet.
- **Touchdown display:** headline and "You" box wording for a touchdown.
- **OG image: per result or generic?** The prototype image contains one player's result (tiles, score, chip). That requires the link to encode the result and a server (e.g. the Cloudflare Worker) to render the image per link. A build-rendered image can only be per puzzle or generic. Which?
- **Link format and domain:** `[your-domain]` and `[link]` are placeholders.
- **OG button copy** "Play today's puzzle" is wrong when a preview is seen on a later day.
- **Streak definition:** consecutive days played or consecutive days converted? Does an earlier puzzle played from Puzzles count?
- **Off-season** countdown, and whether the countdown shows for an earlier puzzle opened from Puzzles.

## Acceptance criteria

- [ ] At 390×844 the light screen matches `prototype.html` and the dark screen matches `prototype-dark.html`.
- [ ] At ≥900px the dark theme matches `prototype-desktop-dark.html`.
- [ ] At ≥900px the layout matches `prototype-desktop.html` (64px top bar, two equal columns, max-width 1120px); below 900px it collapses to one column.
- [ ] The share card is identical in light and dark themes.
- [ ] Tiles render one per rep from the stored result: orange ✕ for incomplete/sack/interception, gold for short, green ✓ for converted, dashed for reps not needed; each with "Rep N" and a second-line label.
- [ ] The tile row's `aria-label` lists every rep's outcome in words.
- [ ] Card colors use tokens: `win-muted` for not-needed labels, `share-card-rule` for dashed tiles and the footer rule, `on-tile` for the check, `share-card-inner` for the OG panel. Gold (`read-gold`) is the accent on the ink-green card.
- [ ] Headline, result line, card title, situation, score, comparison values and stats come from puzzle JSON, game state, local storage and the results API as listed in Data; no hard-coded 148, 77, 4 or 38%.
- [ ] Copy writes the pasted share text (per the format, once approved) to the clipboard and announces confirmation via a polite live region.
- [ ] Share result opens the native share sheet with the same text where the Web Share API exists.
- [ ] The pasted text contains no coverage name, defense description, route or pros' call.
- [ ] The countdown shows `Next puzzle in HH:MM:SS` to the next midnight US Eastern, updates every second, uses tabular numerals and is not a live region.
- [ ] Focus order is Close → Copy → Share result; Copy has `aria-label="Copy result"`; Close has `aria-label="Close"`.
- [ ] The link-preview image renders at 1200×630 matching `share-card.html`, with Figtree, outside the client, and is referenced by the shared page's Open Graph image tag.
- [ ] No real team or player name appears in any copy, fixture or image.
