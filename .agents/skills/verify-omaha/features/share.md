# Share

**Status:** Live (#68). "Share result" on Result's ink-green (converted) and charcoal (out-of-reps) sheets opens Share at `/puzzle/:n/share`, on the same play screen session. The real "% beat the pros" and the streak wait for the results API and stored progress (#57), and serving the link-preview image is a later map. Spec: `design/11-share/spec.md`, whose Decisions section settles the behaviour.

Share is the end of the daily loop. A header holds the OMAHA wordmark and Close. The screen states the final result (headline and result line), previews the ink-green share card ("OMAHA #N", down and distance, one labelled tile per rep, the beat-the-pros chip and the score), compares the pros' result with yours, shows score, day streak and "% beat the pros", and offers Copy and Share result above a countdown to the next puzzle. The card looks the same in both themes.

## Sub-features

- `share-open` means "Share result" on the ink-green or charcoal Result sheet opens Share for the finished puzzle at `/puzzle/:n/share`. The cream sheet has no Share; its CTA is "Run it back".
- `share-converted` means a conversion shows the headline `CONVERTED`, a result line like `3rd & 10 · in 2 reps · +13 yards`, the chip `Beat the pros`, the "You" box like `+13 · 1st down` and the score from `score(puzzle, reps)` (`78 pts` for Out then Comeback). A touchdown shows the same.
- `share-out-of-reps` means four failed reps show `OUT OF REPS`, `3rd & 10 · 4 reps · no first down`, the chip `Didn't beat the pros`, the "You" box `No first down` and `0 pts`.
- `share-tiles` means the card has one tile per rep inside an `img` named like `Rep 1 incomplete, rep 2 converted, rep 3 not needed, rep 4 not needed`: an orange ✕ for a failed rep, a gold tile with the signed yards (`+7`) for short, a green ✓ for converted and a dashed outline for reps not needed. Each tile has a two-line label, `Rep N` over `Incomplete`, `Sacked`, `Picked`, `Short`, `Converted` or `—`.
- `share-stats` means "The pros" box shows the puzzle's `prosResult` (`Incomplete` in the fixture), and the stats show the score, `—` day streak and `—` beat the pros. Converted stats are gold; out-of-reps stats are orange.
- `share-copy` means `Copy result` writes the pasted text to the clipboard, the button shows a check and `Copied` for 2s, and a polite live region says "Copied to clipboard". The text is three lines: `Omaha #N · 3rd & 10`, one emoji per rep played (🟥 failed, 🟨 short, 🟩 converted), then `Converted in R · Beat the pros · S pts` or `Out of reps · 0 pts`.
- `share-native` means Share result calls `navigator.share({ text })` where it exists. Without it, Share result copies the text and confirms it the same way as Copy.
- `share-countdown` means `Next puzzle in HH:MM:SS` counts to the next midnight US Eastern, once a second, and at zero reads `New puzzle is out` as a link to Landing. It is not a live region.
- `share-close` means Close goes to Landing (`/`), and browser back from Share shows the same finished Result sheet.
- `share-layout` means phone shows the 56px header and one column, headline first. At 900px and wider the 64px top bar sits over two columns, the card on the left and the result, comparison, stats and buttons on the right.
- `share-link-preview` means `LinkPreviewCard` in `src/ShareCard.tsx` renders a 1200×630 card from a puzzle, the engine and its reps. Nothing in the app shows it yet; `e2e/link-preview.html?routes=Out,Comeback` renders it from the stub plays, one Left WR route per rep.

## How to get to it (user POV)

- Finish the puzzle (convert, or use all four reps), then tap "Share result" on the Result sheet (result.md).
- Browser forward from the finished Result after going back from Share.
- Opening `/puzzle/:n/share` without a finished puzzle in the session opens the puzzle at Protect: nothing stores the result yet.

## Driving it with drive.mjs

Preconditions:

- `doctor.sh` exits `0`, and Result is reachable (result.md).

- **Converted.** Design Left WR `Out`, the others TE Hitch, Slot WR Out, Right WR Go and RB Flat, TE Hitch as the read, Snap and skip; then `click=button:"Run it back" click=button:"Next: routes" click=button:"Left WR," click=option:Comeback click=button:"Next: read" click=button:Snap click=button:"Skip to result" shot=result click=button:"Share result" expect-role=region:"Share card preview" shot=share`. `aria.yml` has the heading `CONVERTED`, the `img` named `Rep 1 incomplete, rep 2 converted, rep 3 not needed, rep 4 not needed`, the `Copy result` and `Share result` buttons and the countdown paragraph.
- **Out of reps.** Run it back with `Go`, `In` and `Post` after the first `Out` rep, then tap Share result. The tiles read Incomplete, Short (`+7`), Sacked, Picked.
- **Copy.** Don't drive it: `drive.mjs` can't grant clipboard permission, so `Copy result` fails with the page error "Write permission denied" and the drive fails. `e2e/share.spec.ts` grants the permission and checks the text, the `Copied` state and the live region.
- **Close.** `click=button:Close expect-role=heading:Omaha` lands on Landing. `drive.mjs` has no back step; `e2e/share.spec.ts` covers browser back.
- **Themes and sizes.** Repeat with `--theme dark` and `--viewport desktop`. The card's pixels match across themes.
- **Link preview.** `--viewport desktop goto=/e2e/link-preview.html?routes=Out,Comeback expect="Can you out-coach" shot=card`. Try `Out,Go,In,Post` for out of reps.

## Gotchas

- Share has its own `Share result` button. Once Share is open, `click=button:"Share result"` presses that one, not the Result CTA.
- Headless Chromium may or may not expose `navigator.share`. Prove the native and fallback paths with `e2e/share.spec.ts`, which defines or removes it.
- The countdown depends on the clock. `e2e/share.spec.ts` fixes the page clock to prove `00:00:10` and the zero state; `drive.mjs` shows real time.
- Nothing persists the result (#57): a reload or a new context loses it, and Share falls back to the puzzle.
- Under the stub only X's route picks the rep (result.md Gotchas).
