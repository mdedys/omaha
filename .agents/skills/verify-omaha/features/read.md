# Read and snap

**Status:** Live (#64). Read is step 3 of the play screen at `/puzzle/:n`. Snap opens Live play (live-play.md), which ends on Result.

Read is step 3. The player sets a read order: the receivers the QB looks to, first to third, up to three reads. Each read gets a gold ring and a gold numbered badge (1, 2, 3) on the field, and the same number on its option in the panel. Snap unlocks once every route runner has a route and the order holds at least one read. Spec: `design/06-read/spec.md`.

## Sub-features

- `read-add` means tapping an option outside the order adds it at the end, with the next number in the panel and on the field.
- `read-drop` means tapping an option in the order drops it, and the reads after it move up and renumber at once, in the panel and on the field.
- `read-full` means that with three reads, the options outside the order go quiet (`aria-disabled="true"`) and tapping them changes nothing. Dropping a read makes them normal again.
- `read-snap-locked` means that with any runner unassigned or an empty read order, Snap shows `aria-disabled="true"` and does nothing.
- `read-snap` means that once the unlock rule is met, Snap locks the design for the rep and starts the live play.
- `read-carry-over` means rep 2 and later keep the previous order. A read whose receiver is now kept in to block leaves the order, the reads after it move up, and Snap disables if the order empties.

## How to get to it (user POV)

- "Next: read" on Routes.
- "3 Read" in the step bar from Protect or Routes.

## Driving it with drive.mjs

Preconditions:

- `doctor.sh` exits `0`, and Read is reachable through Protect and Routes.

- **Heading.** Run `expect-role=heading:"Who does the QB look to?" expect="Pick in order · up to 3"`.
- **Locked Snap.** Arrive with the order empty. `aria.yml` shows the Snap button with `aria-disabled="true"` and the live text `No reads picked`; the order hint reads `Set every route first` while any route runner has no route, otherwise `Pick a read first`. Run `click=button:Snap shot=still-read`: the screen does not change.
- **Add.** Run `click=button:"TE, Corner" click=button:"Right WR, Go" click=button:"Left WR, In" shot=three-reads`. Use the receiver and route names the screen shows. Only route runners with a route get an option, left to right by field position (a routed RB sits by its x); five options use a three-column phone grid. `aria.yml` shows the group `Read order` with those three buttons pressed and named `…, read 1`, `…, read 2`, `…, read 3`, the remaining option disabled, and the live text `Read order: TE, Right WR, Left WR`. The field `img` label names all three reads in order.
- **Drop.** Run `click=button:"TE, Corner, read 1" shot=dropped`. Right WR becomes read 1, Left WR read 2, and the quiet option is normal again.
- **Snap.** With every route assigned and a read picked, run `click=button:Snap expect-role=complementary:"Live play"`, then `click=button:"Skip to result"` and `expect=` the result headline (see result.md).
- **Desktop keys.** Run with `--viewport desktop`: digits `1`–`N` toggle the option at that place in the list, and `press=Enter` snaps only when unlocked. The hint line reads `1–N add or drop a read`, where N is the number of route runners.

## Gotchas

- Options are toggle buttons with `aria-pressed` in a group named `Read order`, not radios. An option's accessible name changes when it joins the order (`TE, Corner` becomes `TE, Corner, read 1`), so click a read by its current name.
- The disabled Snap and quiet options use `aria-disabled`, not the `disabled` attribute, so Playwright still clicks them. Prove the lock by showing the screen didn't change, not by a click failure.
- The engine rejects an empty read order with `EngineError`; the screen should never let Snap reach it.
- The `field/` prototypes still show the old radio Read panel, and the live-play prototypes throw on the first read, so they never show the QB's cone moving to the next read. Trust `design/06-read/spec.md`.
- The desktop keys are `1`–`N` over the read options in list order, and `Enter` for Snap only when it is unlocked. A focused button keeps its own `Enter`.
- Playwright treats `aria-disabled` controls as not enabled, so `click=` on a quiet option or a locked Snap may time out. Activate them with `press=Enter` after focusing, or prove the lock from `aria.yml`.
