import { describe, expect, it } from "vitest";
import type { Blockers, Design, Letter, RouteCall } from "./engine/contract";
import { loadPuzzle } from "./engine";
import { engine as v1 } from "./engine/v1";
import gunTrey from "./engine/stub/gun-trey.json";
import {
  changeProtection,
  chooseRoute,
  routeRunners,
  toggleRead,
} from "./routes";

const names: {
  letter: Letter;
  name: string;
  flipped: string;
  short: string;
}[] = [
  { letter: "X", name: "Left WR", flipped: "Right WR", short: "WR" },
  { letter: "Y", name: "TE", flipped: "TE", short: "TE" },
  { letter: "Z", name: "Right WR", flipped: "Left WR", short: "WR" },
  { letter: "H", name: "Slot WR", flipped: "Slot WR", short: "WR" },
  { letter: "RB", name: "RB", flipped: "RB", short: "RB" },
];

describe("receiver display names", () => {
  for (const { letter, name, flipped, short } of names) {
    it.each([false, true])(`${letter} follows flip %s`, async (flip) => {
      const { puzzle, engine } = await loadPuzzle({
        ...gunTrey,
        formation: { id: "gun-trey", flip },
      });
      for (const implementation of [engine, v1]) {
        expect(implementation.displayName(puzzle, letter)).toEqual({
          name: flip ? flipped : name,
          short,
        });
      }
    });
  }
});

it.each([
  { previous: undefined, route: "Out", expected: { route: "Out", depth: 10 } },
  {
    previous: { route: "Out", depth: 15 },
    route: "Post",
    expected: { route: "Post", depth: 15 },
  },
  {
    previous: { route: "Out", depth: 5 },
    route: "Corner",
    expected: { route: "Corner", depth: 10 },
  },
  {
    previous: { route: "Post", depth: 15 },
    route: "Slant",
    expected: { route: "Slant" },
  },
] satisfies {
  previous: RouteCall | undefined;
  route: RouteCall["route"];
  expected: RouteCall;
}[])(
  "assigns $route with carried depth",
  async ({ previous, route, expected }) => {
    const { puzzle, engine } = await loadPuzzle(gunTrey);
    expect(chooseRoute(engine, puzzle, "X", route, previous)).toEqual(expected);
  },
);

it("carries to the nearest available depth at the goal", async () => {
  const { puzzle, engine } = await loadPuzzle({
    ...gunTrey,
    situation: { ...gunTrey.situation, spot: 99, distance: 1 },
    goal: "touchdown",
  });
  expect(
    chooseRoute(engine, puzzle, "X", "Out", { route: "Out", depth: 15 }),
  ).toEqual({ route: "Out", depth: 10 });
});

it("chooses the shallower available depth on a tie", async () => {
  const { puzzle, engine } = await loadPuzzle(gunTrey);
  expect(
    chooseRoute(
      { ...engine, availableDepths: () => [5, 15] },
      puzzle,
      "X",
      "Out",
    ),
  ).toEqual({ route: "Out", depth: 5 });
});

it.each([5, 6, 7] satisfies Blockers[])(
  "complete %s-man assignments pass the simulation design check",
  async (blockers) => {
    const { puzzle, engine } = await loadPuzzle(gunTrey);
    const protection = { blockers, lineCall: "man" } as const;
    const draft: Design = { protection, routes: {}, readOrder: ["X"] };
    for (const letter of routeRunners(protection)) {
      draft.routes[letter] = chooseRoute(
        engine,
        puzzle,
        letter,
        engine.routeMenu(puzzle, letter)[0],
      );
    }
    expect(engine.simulate(puzzle, draft).outcome).toEqual({
      kind: "sack",
      yards: -7,
    });
  },
);

it("protection removes assignments without resurrecting them", () => {
  const draft: Design = {
    protection: { blockers: 5, lineCall: "man" },
    routes: {
      X: { route: "Out", depth: 10 },
      Y: { route: "Seam" },
      RB: { route: "Flat" },
    },
    readOrder: ["X", "Y", "RB"],
  };
  const blocked = changeProtection(draft, { blockers: 7, lineCall: "man" });
  expect(blocked).toEqual({
    protection: { blockers: 7, lineCall: "man" },
    routes: { X: { route: "Out", depth: 10 } },
    readOrder: ["X"],
  });
  expect(changeProtection(blocked, draft.protection)).toEqual({
    protection: { blockers: 5, lineCall: "man" },
    routes: { X: { route: "Out", depth: 10 } },
    readOrder: ["X"],
  });
});

it.each([
  { order: [], letter: "Y", expected: ["Y"] },
  { order: ["Y", "Z"], letter: "X", expected: ["Y", "Z", "X"] },
  { order: ["Y", "Z", "X"], letter: "Y", expected: ["Z", "X"] },
  { order: ["Y", "Z", "X"], letter: "H", expected: ["Y", "Z", "X"] },
] satisfies { order: Letter[]; letter: Letter; expected: Letter[] }[])(
  "toggling $letter in $order gives $expected",
  ({ order, letter, expected }) => {
    expect(toggleRead(order, letter)).toEqual(expected);
  },
);

it("keeping a read's receiver in moves the later reads up", () => {
  const draft: Design = {
    protection: { blockers: 5, lineCall: "man" },
    routes: {
      X: { route: "Out", depth: 10 },
      Y: { route: "Seam" },
      RB: { route: "Flat" },
    },
    readOrder: ["Y", "RB", "X"],
  };
  expect(
    changeProtection(draft, { blockers: 6, lineCall: "man" }).readOrder,
  ).toEqual(["Y", "X"]);
});
