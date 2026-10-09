# Game engine: contracts

The types in `src/engine/contract.ts` and the puzzle file. Decisions and their reasons are in [spec.md](spec.md); the argument is in [Engine contract with the front end](https://github.com/mdedys/omaha/issues/17) and [Puzzle format](https://github.com/mdedys/omaha/issues/18).

## Units

- **Yards** everywhere. x is yards from the middle of the field toward the offense's right; the sidelines are at ±15.75. y is yards downfield from the line of scrimmage; the backfield is negative. The front end converts yards to SVG with one helper.
- **Time** is an integer tick. `TICK_SECONDS = 0.05` is exported. Index 0 is the snap.
- **Yards gained** are whole yards, truncated toward zero: 9.6 is 9, a −6.4 sack is −6.

## Entry point

```ts
// src/engine/index.ts
function loadPuzzle(json: unknown): Promise<{ puzzle: Puzzle; engine: Engine }>;
```

Reads only the integer `engine` field, dynamically imports that version from an explicit map (`{ 1: () => import("./v1/index.ts") }`), and has the version validate the rest. An unknown or missing version throws `EngineError` from the loader.

## Engine

All calls are pure and synchronous.

```ts
interface Engine {
  simulate(puzzle: Puzzle, design: Design): Rep;
  score(puzzle: Puzzle, reps: readonly Rep[]): Score;
  revealedPlayArt(
    playArt: DefensePlayArt,
    failedReps: number,
    puzzleEnded: boolean, // converted, or out of reps
  ): DefensePlayArt;

  // Design-screen helpers
  preSnap(puzzle: Puzzle): Record<PlayerId, Vec>;
  routeMenu(puzzle: Puzzle, letter: Letter): readonly RouteName[];
  availableDepths(puzzle: Puzzle, letter: Letter, route: RouteName): readonly Depth[];
  protections(puzzle: Puzzle): readonly Blockers[];
  routePath(puzzle: Puzzle, letter: Letter, call: RouteCall): RoutePath;
}
```

- `preSnap` gives every player's spot, in yards, as the puzzle lines them up.
- `routeMenu` gives the receiver's menu from the formation catalog, after any flip.
- `availableDepths` drops a depth whose break would land inside the end-line margin; empty for routes with no depth.
- `protections` gives the blocker counts the formation allows: 6 needs an RB in the backfield, 7 also needs Y attached. Every line call is always available.
- `routePath` is the same route function the engine runs, so the drawn route is the simulated one.
- `revealedPlayArt` applies the tier in [rules.md](rules.md#play-art).

## Ids

```ts
type Vec = { readonly x: number; readonly y: number };
type Letter = "X" | "Y" | "Z" | "H" | "RB";
type Lineman = "LT" | "LG" | "C" | "RG" | "RT";
type OffenseId = Letter | Lineman | "QB";
type DefenderId =
  | "DL1" | "DL2" | "DL3" | "DL4"
  | "LB1" | "LB2" | "LB3"
  | "CB1" | "CB2" | "NB" | "DB"
  | "S1" | "S2";
type PlayerId = OffenseId | DefenderId;
type Role = "DL" | "LB" | "CB" | "S"; // NB and DB are CB
```

Linemen are named as drawn after any flip.

## Design

```ts
type Blockers = 5 | 6 | 7;
type LineCall = "slide-left" | "man" | "slide-right";
type Depth = 5 | 10 | 15;

type RouteCall =
  | { route: "In" | "Out" | "Hook"; depth: Depth }
  | { route: "Corner" | "Post" | "Comeback"; depth: 10 | 15 }
  | { route: "Slant" | "Drag" | "Hitch" | "Go" | "Seam" | "Flat" | "Wheel" };
type RouteName = RouteCall["route"];

type Design = {
  protection: { blockers: Blockers; lineCall: LineCall };
  routes: Partial<Record<Letter, RouteCall>>; // exactly the route runners
  readOrder: readonly Letter[]; // 1 to 3 route runners, no repeats
};
```

Go and Seam are the same path; the menu decides which name a receiver sees. 6-man keeps the RB in; 7-man also keeps Y.

`simulate` throws `EngineError` for any design the helpers would never produce: a blocker count `protections` doesn't offer, a route missing for a route runner or given to a kept-in receiver, a route outside the receiver's menu, a depth `availableDepths` doesn't offer, or a read order that's empty, longer than 3, repeats a letter or names a kept-in receiver.

## Route path

```ts
type RoutePath = {
  points: readonly Vec[]; // alignment (or RB release point) to the end
  breaks: readonly { index: number; kind: "hard" | "soft" }[];
  throwIndex: number; // index into points of the throw point
  end: "sit" | "run";
};
```

## Rep

```ts
type Rep = {
  endTick: number; // the dead-ball tick
  tracks: Record<PlayerId, Vec[]>; // one per tick, index 0 = snap
  ball: {
    from: Vec; to: Vec; throwTick: number; arriveTick: number;
    target: Letter | null; // null on a throwaway
  } | null; // null on a sack
  carrier: { letter: Letter; fromTick: number } | null;
  reads: { letter: Letter; fromTick: number; toTick: number }[]; // one per read reached
  thrownToRead: number | null; // index into the read order
  outcome: {
    kind: "completion" | "incompletion" | "interception" | "sack";
    yards: number; // yards gained, whole
  };
  verdict: "converted" | "short" | "failed";
  timeInPocketTicks: number; // snap to the throw, throwaway or sack
  cause: Cause;
  feedback: { letter: Letter; badge: Badge; separation: number; tick: number }[];
  playArt: DefensePlayArt;
};

type Badge = "open" | "contested" | "covered";
```

- `ball.to` is always the catch point (or the throwaway's landing spot). The flight is straight; any arc on screen is front-end cosmetics.
- A touchdown is a completion whose cause is `touchdown`.
- A receiver's best-moment spot is `tracks[letter][tick]`.
- The ball carrier's track continues past the catch to the tackle or touchdown.

## Cause

```ts
type ForcedBy = "pressure" | "out-of-reads";
type CauseCode =
  | "sack-free-rusher" | "sack-beat-block"
  | "throwaway"
  | "breakup-closed" | "breakup-forced"
  | "interception-closed" | "interception-forced"
  | "short" | "converted" | "touchdown";

type Cause = {
  code: CauseCode;
  decisive: DefenderId | null;
  thrownTo: Letter | null;
  forcedBy?: ForcedBy; // present exactly on the two forced codes
};
```

## Play art

```ts
type DefensePlayArt = {
  zones: { defenderId: DefenderId; zone: ZoneId; center: Vec; radii: Vec }[];
  assignments: Partial<Record<DefenderId, "zone" | "man" | "rush">>;
};
```

Drop, man and rush lines are drawn from each defender's track, start dots from track index 0. A blitz is a rush by a non-DL and draws orange. Every revealed rusher's path draws. `coverageName` is puzzle data, not play art.

## Score

```ts
type Score = { base: number; bonus: number; total: number };
```

## Errors

One class, `EngineError`, in `src/engine/error.ts`. Thrown for an invalid puzzle, an unknown version, an impossible design, or a rep reaching the 20 s cap. The front end shows a generic error and doesn't spend the rep.

## Not in the contract

The event log (internal, for tests and a dev overlay), any pros output, and any text.

## Puzzle

```json
{
  "engine": 1,
  "number": 12,
  "date": "2026-10-11",
  "situation": { "down": 3, "distance": 10, "spot": 45, "hash": "left",
                 "scoreDiff": -4, "quarter": 4, "clock": "1:12" },
  "goal": "first-down",
  "briefing": "Sunday night. Down 4 with 1:12 to go…",
  "formation": { "id": "gun-trey", "flip": false },
  "defense": [ { "id": "CB1", "at": [-14, 7], "assignment": "man X" } ],
  "coverageName": "Cover 1",
  "prosResult": "Incomplete"
}
```

- `engine`: the integer version that runs this puzzle.
- `number`: the displayed "Puzzle #N". `date`: reference only; nothing reads it.
- `spot`: the line of scrimmage in yards from the offense's own goal line, from its own 10 to the opponent's 1 (10–99), so a sack can never be a safety. `hash`: `left`, `middle` or `right`. `scoreDiff`: offense minus defense. Timeouts live only in the briefing.
- `goal`: `first-down` or `touchdown`.
- `defense`: eleven defenders. `at` is `[x, y]` in yards from the ball, authored against the formation as flipped; nothing mirrors it.
- `assignment`: `man <letter>`, `zone <zone id>`, `rush` or `rush <gap>`, where a gap is `L-A` … `L-D` or `R-A` … `R-D`.
- `coverageName` and `prosResult`: labels the engine never reads. The pros' result is always a failure to convert, by rule.

`Puzzle` in `contract.ts` is the validated, parsed form of this file, with assignments parsed into tagged objects.

### Validation

`loadPuzzle` throws `EngineError` unless:

- every field above is present with its type, and `formation.id` is in the version's catalog;
- there are exactly 11 defenders with unique ids from the roster above;
- every assignment string parses, every `man` target is an eligible receiver in the formation, and every zone and gap is in the catalog;
- `spot` is from 10 to 99, `spot + distance ≤ 100`, the puzzle is goal-to-go exactly when the sum is 100, and a goal-to-go puzzle's goal is `touchdown`.
