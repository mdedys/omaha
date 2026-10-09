# Read and snap

**Status:** Not built (#64). Read is a step of the play screen at `/puzzle/:n`, which shows a placeholder panel for it until #64 lands. Report this feature as skipped until the screen exists.

Read is step 3. The player sets a read order: the receivers the QB looks to, first to third, up to three reads. Each read gets a gold ring and a gold numbered badge (1, 2, 3) on the field, and the same number on its option in the panel. Snap unlocks once every route runner has a route and the order holds at least one read. Spec: `design/06-read/spec.md`.

## Sub-features

- `read-add` means tapping an option outside the order adds it at the end, with the next number in the panel and on the field.
- `read-drop` means tapping an option in the order drops it, and the reads after it move up and renumber at once, in the panel and on the field.
- `read-full` means that with three reads, the options outside the order go quiet (`aria-disabled="true"`) and tapping them changes nothing. Dropping a read makes them normal again.
- `read-snap-locked` means that with any runner unassigned or an empty read order, Snap shows `aria-disabled="true"` and does nothing.
- `read-snap` means that once the unlock rule is met, Snap locks the design for the rep. Until Live play lands (#66), Snap opens Result directly; after it, Snap starts the live play.
- `read-carry-over` means rep 2 and later keep the previous order. A read whose receiver is now kept in to block leaves the order, the reads after it move up, and Snap disables if the order empties.

## How to get to it (user POV)

- "Next: read" on Routes.
- "3 Read" in the step bar from Protect or Routes.

## Driving it with drive.mjs

Preconditions:

- `doctor.sh` exits `0`, and Read is reachable through Protect and Routes.

- **Heading.** Run `expect-role=heading:"Who does the QB look to?" expect="Pick in order · up to 3"`.
- **Locked Snap.** Arrive with the order empty. `aria.yml` shows the Snap button disabled and the live text `No reads picked`. Run `click=button:Snap shot=still-read`: the screen does not change.
- **Add.** Run `click=button:"TE, Corner" click=button:"Right WR, Go" click=button:"Left WR, In" shot=three-reads`. Use the receiver and route names the screen shows. `aria.yml` shows the group `Read order` with those three buttons pressed and named `…, read 1`, `…, read 2`, `…, read 3`, the remaining option disabled, and the live text `Read order: TE, Right WR, Left WR`. The field `img` label names all three reads in order.
- **Drop.** Run `click=button:"TE, Corner, read 1" shot=dropped`. Right WR becomes read 1, Left WR read 2, and the quiet option is normal again.
- **Snap.** With every route assigned and a read picked, run `click=button:Snap` and `expect=` the result headline (see result.md).
- **Desktop keys.** Run with `--viewport desktop`: digits `1`–`N` toggle the option at that place in the list, and `press=Enter` snaps only when unlocked. The hint line reads `1–N add or drop a read`, where N is the number of route runners.

## Gotchas

- Options are toggle buttons with `aria-pressed` in a group named `Read order`, not radios. An option's accessible name changes when it joins the order (`TE, Corner` becomes `TE, Corner, read 1`), so click a read by its current name.
- The disabled Snap and quiet options use `aria-disabled`, not the `disabled` attribute, so Playwright still clicks them. Prove the lock by showing the screen didn't change, not by a click failure.
- The engine rejects an empty read order with `EngineError`; the screen should never let Snap reach it.
- The `field/` prototypes still show the old radio Read panel, and the live-play prototypes throw on the first read, so they never show the QB's cone moving to the next read. Trust `design/06-read/spec.md`.
- The desktop keys are a proposal, and the five-runner phone layout, option order and disabled-Snap hint are open questions that #64 settles. Recheck the recipe once it lands.
