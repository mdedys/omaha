import { describe, expect, test } from "vitest";
import type { Design, Letter, RouteCall } from "./engine/contract";
import { loadPuzzle } from "./engine";
import { puzzleOne } from "./pinnedPuzzleOne";
import blitz from "./engine/v1/scenarios/a-gap-blitz-man-protection.json";
import { moments, tenths } from "./moments";

const one = await loadPuzzle(puzzleOne);

// Puzzle 1 under 5-man Man protection with the Slot WR on the given route,
// read first and then the Left WR unless another read order is given.
function slot(route: RouteCall, readOrder: Letter[] = ["H", "X"]): Design {
  return {
    protection: { blockers: 5, lineCall: "man" },
    routes: {
      X: { route: "Post", depth: 10 },
      Y: { route: "Hitch" },
      H: route,
      Z: { route: "Go" },
      RB: { route: "Flat" },
    },
    readOrder,
  };
}

function replayed(design: Design, { puzzle, engine } = one) {
  return moments(puzzle, engine, {
    design,
    rep: engine.simulate(puzzle, design),
  });
}

describe("moments", () => {
  // Thrown to the Slot WR and broken up.
  test("mark the snap, the first read's break, the throw and the end", () => {
    expect(replayed(slot({ route: "Out", depth: 10 }))).toEqual([
      { name: "Snap", tick: 0 },
      { name: "Break", tick: 36 },
      { name: "Throw", tick: 38 },
      { name: "End", tick: 56 },
    ]);
  });

  // The nickel is free and sacks the QB.
  test("leave out the throw on a sack", () => {
    expect(replayed(slot({ route: "Comeback", depth: 10 }))).toEqual([
      { name: "Snap", tick: 0 },
      { name: "Break", tick: 36 },
      { name: "End", tick: 41 },
    ]);
  });

  // The Hook comes back underneath its break on the tick he reaches it.
  test("time a break the route turns back from", () => {
    expect(
      replayed(slot({ route: "Hook", depth: 10 })).find(
        ({ name }) => name === "Break",
      ),
    ).toEqual({ name: "Break", tick: 36 });
  });

  test("time the break from the first read, not the Slot WR", () => {
    expect(replayed(slot({ route: "Out", depth: 10 }, ["Y", "H"]))[1]).toEqual({
      name: "Break",
      tick: 6,
    });
  });

  test("leave out the break when the first read's route has none", () => {
    expect(replayed(slot({ route: "Seam" })).map(({ name }) => name)).toEqual([
      "Snap",
      "Throw",
      "End",
    ]);
  });

  // The sack comes before the Slot WR's 15-yard stem is run.
  test("leave out the break when the rep ends before the read gets there", () => {
    expect(
      replayed(slot({ route: "Comeback", depth: 15 })).map(({ name }) => name),
    ).toEqual(["Snap", "End"]);
  });

  // A 5-yard Out's throw point is its break.
  test("list a break on the throw's tick before the throw", () => {
    expect(replayed(slot({ route: "Out", depth: 5 }))).toEqual([
      { name: "Snap", tick: 0 },
      { name: "Break", tick: 20 },
      { name: "Throw", tick: 20 },
      { name: "End", tick: 34 },
    ]);
  });

  // The A-gap blitz sacks the QB as the Left WR reaches his break.
  test("list a break on the end's tick before the end", async () => {
    const scenario = await loadPuzzle(blitz.puzzle);
    const design: Design = {
      protection: { blockers: 5, lineCall: "slide-left" },
      routes: {
        X: { route: "Comeback", depth: 10 },
        Y: { route: "Hitch" },
        H: { route: "Hitch" },
        Z: { route: "Hitch" },
        RB: { route: "Flat" },
      },
      readOrder: ["X"],
    };
    expect(replayed(design, scenario)).toEqual([
      { name: "Snap", tick: 0 },
      { name: "Break", tick: 33 },
      { name: "End", tick: 33 },
    ]);
  });
});

test.each([
  [0, "0.0"],
  [0.95, "1.0"],
  [2.3, "2.3"],
  [19 * 0.05, "1.0"],
])("tenths(%f) reads %s", (seconds, text) => {
  expect(tenths(seconds)).toBe(text);
});
