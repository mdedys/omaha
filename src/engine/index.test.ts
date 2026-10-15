import { describe, expect, expectTypeOf, it } from "vitest";
import type { Design, Engine, Rep } from "./contract";
import { EngineError } from "./error";
import { loadPuzzle } from "./index";
import gunTrey from "../../public/puzzles/1.json";
import goalLine from "../../public/puzzles/2.json";

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

  it("lines puzzle 2's corners up 1 yd outside their wideouts on the right hash", async () => {
    const { puzzle, engine } = await loadPuzzle(goalLine);
    const spots = engine.preSnap(puzzle);
    expect(puzzle.situation.hash).toBe("right");
    expect({ CB1: spots.CB1, X: spots.X, CB2: spots.CB2, Z: spots.Z }).toEqual({
      CB1: { x: -12.75, y: 7 },
      X: { x: -11.75, y: -0.5 },
      CB2: { x: 12.75, y: 7 },
      Z: { x: 11.75, y: -0.5 },
    });
  });

  it.each([
    { name: "1", json: gunTrey, ball: 0 },
    { name: "2", json: goalLine, ball: 4 },
  ])(
    "loads puzzle $name with its defense lined up from the ball",
    async ({ json, ball }) => {
      const { puzzle, engine } = await loadPuzzle(json);
      const spots = engine.preSnap(puzzle);
      expect(
        Object.fromEntries(
          puzzle.defense.map(({ id }) => [
            id,
            { x: spots[id].x - ball, y: spots[id].y },
          ]),
        ),
      ).toEqual({
        DL1: { x: -3.75, y: 1 },
        DL2: { x: -0.75, y: 1 },
        DL3: { x: 0.75, y: 1 },
        DL4: { x: 3, y: 1 },
        LB1: { x: -5, y: 5 },
        LB2: { x: 0, y: 5 },
        LB3: { x: 4, y: 5 },
        CB1: { x: -12.75 - ball, y: 7 },
        CB2: { x: 12.75 - ball, y: 7 },
        NB: { x: 5.25, y: 5 },
        S1: { x: 0 - ball, y: 12 },
      });
    },
  );

  it.each([
    { id: "gun-trey", counts: [5, 6, 7] },
    { id: "gun-doubles", counts: [5, 6, 7] },
    { id: "gun-trips", counts: [5, 6] },
    { id: "gun-spread", counts: [5, 6] },
    { id: "gun-empty", counts: [5] },
    { id: "gun-doubles-12", counts: [5, 6, 7] },
    { id: "ace", counts: [5, 6, 7] },
  ])("loads $id with its offered blocker counts", async ({ id, counts }) => {
    for (const flip of [false, true]) {
      const { puzzle, engine } = await loadPuzzle({
        ...gunTrey,
        formation: { id, flip },
      });
      expect(engine.protections(puzzle)).toEqual(counts);
    }
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
