# Defensive calls are per-defender assignments

A puzzle's defensive call gives each of the 11 defenders a spot in the look and one assignment: man on a receiver, a zone from a fixed catalog, or rush. The engine never reads the coverage name, so "Cover 3" means nothing to it. Every defender's behavior is explicit and drawable, and any real play can be recreated, even one no textbook coverage fits.

## Considered Options

- **Coverage templates.** A puzzle names "Cover 3, rush 4" and the engine hands out assignments by counting receivers. It is faster to author, but each template needs rules for all seven formations and their flips, and a real call that bends a template can't be recreated.

## Consequences

- Authoring speed comes from templates in the authoring tool, which fill in assignments the author can then change.
- A rush attacks one gap, derived from the defender's look spot unless the puzzle names it, as in `rush R-A`. See [ADR 0004](0004-protection-by-ownership.md).
