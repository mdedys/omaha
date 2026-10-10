import { describe, expect, test } from "vitest";
import type { Design, Letter, Rep, RouteCall } from "./engine/contract";
import { loadPuzzle } from "./engine";
import gunTrey from "./engine/stub/gun-trey.json";
import { scenarios } from "./engine/stub/fixtures";
import { moments, tenths } from "./moments";

// Plays the stub rep that Left WR's route picks, with the given first read
// and that read's route.
async function replayed(leftRoute: string, read: Letter, call?: RouteCall) {
  const { puzzle, engine } = await loadPuzzle(gunTrey);
  const scenario = scenarios.find(
    (entry) => entry.design.routes.X?.route === leftRoute,
  );
  if (!scenario) throw new Error(`No stub scenario for ${leftRoute}`);
  const design: Design = {
    ...scenario.design,
    routes: { ...scenario.design.routes, ...(call ? { [read]: call } : {}) },
    readOrder: [read],
  };
  const rep: Rep = engine.simulate(puzzle, design);
  return { puzzle, engine, played: { design, rep } };
}

describe("moments", () => {
  test("mark the snap, the first read's break, the throw and the end", async () => {
    const { puzzle, engine, played } = await replayed("Out", "X");
    expect(moments(puzzle, engine, played)).toEqual([
      { name: "Snap", tick: 0 },
      { name: "Break", tick: 32 },
      { name: "Throw", tick: 40 },
      { name: "End", tick: 60 },
    ]);
  });

  test("leave out the throw on a sack", async () => {
    const { puzzle, engine, played } = await replayed("Slant", "X");
    expect(moments(puzzle, engine, played)).toEqual([
      { name: "Snap", tick: 0 },
      { name: "Break", tick: 19 },
      { name: "End", tick: 40 },
    ]);
  });

  test("time the break from the first read, not the Left WR", async () => {
    const { puzzle, engine, played } = await replayed("Out", "Y", {
      route: "Hitch",
    });
    expect(moments(puzzle, engine, played)[1]).toEqual({
      name: "Break",
      tick: 8,
    });
  });

  test("leave out the break when the first read's route has none", async () => {
    const { puzzle, engine, played } = await replayed("Out", "Z");
    expect(moments(puzzle, engine, played).map(({ name }) => name)).toEqual([
      "Snap",
      "Throw",
      "End",
    ]);
  });

  test("leave out the break when the rep ends before the read gets there", async () => {
    const { puzzle, engine, played } = await replayed("Slant", "Y", {
      route: "Hook",
      depth: 15,
    });
    expect(moments(puzzle, engine, played).map(({ name }) => name)).toEqual([
      "Snap",
      "End",
    ]);
  });

  test("order a break after the throw by time", async () => {
    const { puzzle, engine, played } = await replayed("Out", "H", {
      route: "Out",
      depth: 10,
    });
    expect(moments(puzzle, engine, played)).toEqual([
      { name: "Snap", tick: 0 },
      { name: "Throw", tick: 40 },
      { name: "Break", tick: 52 },
      { name: "End", tick: 60 },
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
