# The engine derives each defender's look spot from the offense

A defense lines up against the offense: corners on the outside receivers, the nickel on the slot, the front on the gaps. The engine places each defender from his role and assignment, measured from where the offense lines up for the puzzle's formation, hash and flip, so the same defense file lines up correctly on every hash. A puzzle adds a `look` (`on`, `x`, `y`, each optional) only to disguise a defender or to place one whose role and assignment give no default, such as a DL dropping into a zone or a gapless rusher. A partial `look` keeps the default for every field it leaves out. The puzzle format has no raw coordinates and no fallback for them.

## Considered Options

- **Hand-authored coordinates from the ball.** Simple to read, but receivers don't all move with the ball: wideouts stay on the numbers on every hash, so a puzzle written for the middle put a corner past the sideline on the right hash.
- **Coordinates per hash.** Correct, but triples the authoring and still drifts when a formation's spacing is tuned.
- **Nudging defenders apart when their spots collide.** Hides authoring mistakes and moves a defender somewhere the author never chose.

## Consequences

- The default spots are gameplay rules: a man defender's leverage and cushion, man protection by area and a gapless rusher's gap all read the look spot, so tuning a role depth changes how reps play.
- The validator rejects a defender with no default and an incomplete `look`, a spot past a sideline, and two spots less than 1 yd apart. The author separates defenders with a `look`.
- Disguise stays an authoring tool, and it is visible in the file: a `look` marks a disguise, a defender with no default, or two defenders the author separated.
