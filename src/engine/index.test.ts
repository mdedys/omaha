import { describe, expect, expectTypeOf, it } from "vitest";
import type { Design, Engine, Rep } from "./contract";
import { EngineError } from "./error";
import { loadPuzzle } from "./index";
import gunTrey from "./stub/gun-trey.json";

describe("loadPuzzle", () => {
  it.each([
    { name: "missing engine", json: {} },
    { name: "string engine", json: { ...gunTrey, engine: "1" } },
    { name: "fractional engine", json: { ...gunTrey, engine: 1.5 } },
    { name: "unsupported engine", json: { ...gunTrey, engine: 2 } },
  ])("rejects $name with an EngineError", async ({ json }) => {
    const loaded = loadPuzzle(json);

    await expect(loaded).rejects.toBeInstanceOf(EngineError);
    await expect(loaded).rejects.toMatchObject({
      name: "EngineError",
      message: "Missing or unsupported engine version",
    });
  });

  it("loads the committed version 1 puzzle with a usable Engine", async () => {
    const { puzzle, engine } = await loadPuzzle(gunTrey);
    expectTypeOf(engine).toEqualTypeOf<Engine>();
    expect(puzzle).toMatchObject({
      engine: 1,
      formation: { id: "gun-trey", flip: false },
      defense: expect.arrayContaining([
        {
          id: "DL1",
          at: { x: -3, y: 1 },
          assignment: { kind: "rush", gap: "L-C" },
        },
      ]),
    });

    const design: Design = {
      protection: { blockers: 5, lineCall: "man" },
      routes: {
        X: { route: "Slant" },
        Y: { route: "Seam" },
        Z: { route: "Go" },
        H: { route: "Drag" },
        RB: { route: "Flat" },
      },
      readOrder: ["X", "Y", "RB"],
    };
    const rep: Rep = engine.simulate(puzzle, design);
    expectTypeOf(rep).toEqualTypeOf<Rep>();
    expect(rep).toMatchObject({
      endTick: expect.any(Number),
      tracks: { QB: expect.any(Array) },
      outcome: {
        kind: expect.stringMatching(
          /^(completion|incompletion|interception|sack)$/,
        ),
        yards: expect.any(Number),
      },
      verdict: expect.stringMatching(/^(converted|short|failed)$/),
    });
  });
});

describe("routeMenu", () => {
  it.each([
    {
      letters: ["X", "Z"] as const,
      menu: [
        "Hitch",
        "Flat",
        "Slant",
        "Comeback",
        "Hook",
        "Out",
        "In",
        "Corner",
        "Post",
        "Go",
        "Drag",
      ],
    },
    {
      letters: ["Y", "H"] as const,
      menu: [
        "Hitch",
        "Flat",
        "Slant",
        "Comeback",
        "Hook",
        "Out",
        "In",
        "Corner",
        "Post",
        "Seam",
        "Drag",
        "Wheel",
      ],
    },
    {
      letters: ["RB"] as const,
      menu: ["Flat", "Hook", "Out", "In", "Seam", "Wheel"],
    },
  ])("lists $letters routes in route-tree order", async ({ letters, menu }) => {
    const { puzzle, engine } = await loadPuzzle(gunTrey);
    for (const letter of letters) {
      expect(engine.routeMenu(puzzle, letter)).toEqual(menu);
    }
  });
});
