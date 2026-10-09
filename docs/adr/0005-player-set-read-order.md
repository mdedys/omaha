# The QB reads a player-set order and never throws to a covered receiver

The player sets a read order of up to three route runners, and the QB works through it one read time at a time, throwing only when his read is open. Pressure lowers his bar to a contested receiver. When the order runs out he throws to the least-covered read in it if that read is at least contested, and throws the ball away when every read is covered. This keeps the QB fully explained by the player's design: every rep reads as "this receiver was open", "this was the best you gave him" or "your reads were covered".

## Considered Options

- **A QB who always throws to the first read on time.** The simplest and most literal model, but he throws into double coverage with receivers open elsewhere, and the receiver feedback from rep 1 makes rep 2 close to trivial.
- **A first read with judgment and nothing after it.** Still simple, but every covered first read becomes a throwaway or a sack, which reads as a broken QB rather than a bad design.
- **Holding the ball until the sack when every read is covered.** It turns good coverage into sacks, mixing two failures into one outcome, and needs a deadline anyway because a doubled rush can hold for longer than the engine runs.
- **Always throwing it away when the order runs out.** Clean, but a read order with a contested receiver in it ends in a throwaway that feels too timid; the legibility prototype showed it.
- **Throwing to the least-covered route runner anywhere when the order runs out.** It undercuts the order the player set.

## Consequences

- The Read step takes an ordered pick of up to three reads instead of one.
- A contested ball is thrown either under pressure or when the order runs out, and both are forced throws.
- Sacks come only from a free rusher, a rusher released by the hold time while the QB is still reading, or a hug rush. Once the order runs out the QB never holds the ball.
