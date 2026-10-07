# Read and snap

**Status:** Not built (T10). The route path is not decided yet. Report this feature as skipped until the screen exists.

Read is step 3. The player picks which route runner the QB looks to first, and the field marks that receiver with a gold ring and a "1" badge. Snap unlocks only once every route runner has a route and a first read is picked. Snap starts the live play. Spec: `design/06-read/spec.md`.

## Sub-features

- `read-pick` means picking an option checks it, unchecks the others, and draws the ring and "1" badge on that receiver.
- `read-snap-locked` means that with any runner unassigned or no read picked, Snap shows `aria-disabled="true"` and does nothing.
- `read-snap` means that once the unlock rule is met, Snap opens the live play.
- `read-carry-over` means a carried-over read stays checked on rep 2 and later, if that receiver still runs a route.

## How to get to it (user POV)

- "Next: read" on Routes.
- "3 Read" in the step bar from Protect or Routes.

## Driving it with drive.mjs

Preconditions:

- `doctor.sh` exits `0`, and Read is reachable through Protect and Routes.

- **Heading.** Run `expect-role=heading:"Who does the QB look to first?"`.
- **Locked Snap.** Arrive with a runner unassigned. `aria.yml` shows the Snap button disabled. Run `click=button:Snap shot=still-read`: the screen does not change.
- **Pick.** Run `click=radio:"TE, Corner" shot=te-first`. The option's accessible name is the receiver plus the route. `aria.yml` shows that radio checked, and the field `img` aria-label names the TE as the first read.
- **Snap.** With every route assigned and a read picked, run `click=button:Snap wait=500 shot=snapped`. Live play is running.
- **Desktop keys.** Run with `--viewport desktop`: digit keys pick reads in list order, and `press=Enter` snaps only when unlocked.

## Gotchas

- The disabled Snap uses `aria-disabled`, not the `disabled` attribute, so Playwright still clicks it. Prove the lock by showing the screen didn't change, not by a click failure.
- Read progression past the first read is an open engine question. Don't verify a 1-2-3 order until the spec adopts it.
- Snap starts an animation. Use `expect=` on the result headline (see result.md) instead of a long `wait=`.
