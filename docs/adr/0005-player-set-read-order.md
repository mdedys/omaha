# The QB reads a player-set order and only throws to an open receiver

The player sets a read order of up to three route runners, and the QB works through it one read time at a time, throwing only when his read is open. When the order runs out he throws the ball away instead of forcing it, and only pressure lowers his bar to a contested receiver. This keeps the QB fully explained by the player's design: every rep reads as "this receiver was open" or "your reads were covered", and a sack always means the protection failed.

## Considered Options

- **A QB who always throws to the first read on time.** The simplest and most literal model, but he throws into double coverage with receivers open elsewhere, and the receiver feedback from rep 1 makes rep 2 close to trivial.
- **A first read with judgment and nothing after it.** Still simple, but every covered first read becomes a throwaway or a sack, which reads as a broken QB rather than a bad design.
- **Holding the ball until the sack when every read is covered.** It turns good coverage into sacks, mixing two failures into one outcome, and needs a deadline anyway because a doubled rush can hold for longer than the engine runs.

## Consequences

- The Read step takes an ordered pick of up to three reads instead of one.
- Sacks come only from a free rusher, a rusher released by the hold time, or a hug rush, never from the QB waiting on covered receivers.
