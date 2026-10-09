# Each engine version is a frozen full copy with no shared code

A puzzle names the engine version it was published against, and every released version stays in the build so an old puzzle replays exactly as it did on its day. Each version is a self-contained folder holding its own rules, catalogs, tuning, validator, scenarios and golden hashes, and a new version starts as a copy of the latest. Versions share no runtime code, so a change made for a later version can never quietly change an earlier one. The only shared files are the `EngineError` class and the types-only contract the front end codes against, since neither can change how a rep plays out.

## Considered Options

- **A shared core with per-version overrides.** Less duplication, but every change to the core must be checked against every frozen version's golden hashes, and a missed check silently changes old puzzles.
- **One engine that never versions.** The simplest, but any rule or tuning change would alter the result of every puzzle already played.

## Consequences

- The duplicated folders are deliberate. Don't factor code out of them into a shared module.
- A version freezes when the first puzzle naming it is published. Until then it is edited freely and its golden hashes re-blessed.
- A version that needs a different contract with the front end is a front-end change too.
