import { describe, expect, expectTypeOf, it } from "vitest";
import type {
  DefensePlayArt,
  Design,
  Engine,
  FormationId,
  Letter,
  LineCall,
  Puzzle,
  Rep,
  RouteCall,
  Vec,
} from "../contract";
import { EngineError } from "../error";
import { loadPuzzle } from "../index";
import { formationIds, gapPoints, letters } from "./formations";
import { engine, parsePuzzle } from "./index";
import { zoneCatalog } from "./zones";

const receiverAlignments: Record<
  FormationId,
  {
    Y: { x: number; y: number };
    H: { x: number; y: number };
    RB: { x: number; y: number };
  }
> = {
  "gun-trey": {
    Y: { x: 4.5, y: -0.5 },
    H: { x: 8.125, y: -1.5 },
    RB: { x: -1.5, y: -5 },
  },
  "gun-doubles": {
    Y: { x: 4.5, y: -0.5 },
    H: { x: -7.375, y: -1.5 },
    RB: { x: -1.5, y: -5 },
  },
  "gun-trips": {
    Y: { x: 5.916666666666666, y: -1.5 },
    H: { x: 8.833333333333332, y: -1.5 },
    RB: { x: -1.5, y: -5 },
  },
  "gun-spread": {
    Y: { x: -7.375, y: -1.5 },
    H: { x: 7.375, y: -1.5 },
    RB: { x: -1.5, y: -5 },
  },
  "gun-empty": {
    Y: { x: 5.916666666666666, y: -1.5 },
    H: { x: 8.833333333333332, y: -1.5 },
    RB: { x: -7.375, y: -1.5 },
  },
  "gun-doubles-12": {
    Y: { x: 4.5, y: -0.5 },
    H: { x: -7.375, y: -1.5 },
    RB: { x: -1.5, y: -5 },
  },
  ace: { Y: { x: 4.5, y: -0.5 }, H: { x: -4.5, y: -0.5 }, RB: { x: 0, y: -7 } },
};

type RawDefender = {
  id: string;
  look?: { on?: string; x?: number; y?: number };
  assignment: string;
};
function rawPuzzle() {
  return {
    engine: 1,
    number: 12,
    date: "2026-10-11",
    situation: {
      down: 3,
      distance: 10,
      spot: 45,
      hash: "middle",
      scoreDiff: -4,
      quarter: 4,
      clock: "1:12",
    },
    goal: "first-down",
    briefing: "One play",
    formation: { id: "gun-trey", flip: false },
    defense: [
      "DL1",
      "DL2",
      "DL3",
      "DL4",
      "LB1",
      "LB2",
      "LB3",
      "CB1",
      "CB2",
      "S1",
      "S2",
    ].map((id, i): RawDefender => ({
      id,
      look: { on: "ball", x: i - 5, y: 7 },
      assignment: "rush",
    })),
    coverageName: "Cover 1",
    prosResult: "Incomplete",
  };
}
function puzzle(): Puzzle {
  return parsePuzzle(rawPuzzle());
}
function design(): Design {
  return {
    protection: { blockers: 5, lineCall: "man" },
    routes: {
      X: { route: "Go" },
      Y: { route: "Seam" },
      Z: { route: "Go" },
      H: { route: "Seam" },
      RB: { route: "Flat" },
    },
    readOrder: ["X"],
  };
}
const wr = [
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
];
const inside = [
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
];
const rb = ["Flat", "Hook", "Out", "In", "Seam", "Wheel"];
const calls: readonly RouteCall[] = [
  { route: "Go" },
  { route: "Seam" },
  { route: "In", depth: 10 },
  { route: "Out", depth: 10 },
  { route: "Hook", depth: 10 },
  { route: "Post", depth: 10 },
  { route: "Corner", depth: 10 },
  { route: "Comeback", depth: 10 },
  { route: "Slant" },
  { route: "Drag" },
  { route: "Hitch" },
  { route: "Flat" },
  { route: "Wheel" },
];

describe("v1 puzzle boundary", () => {
  it("exports the loader's version-module shape", async () => {
    expectTypeOf(engine).toEqualTypeOf<Engine>();
    expectTypeOf(parsePuzzle).toEqualTypeOf<(json: unknown) => Puzzle>();
    const loaded = await loadPuzzle(rawPuzzle());
    expect(loaded.engine.preSnap(loaded.puzzle).Y).toEqual({ x: 4.5, y: -0.5 });
    expect(engine.preSnap(puzzle()).Y).toEqual({ x: 4.5, y: -0.5 });
  });
  it.each(formationIds)("parses both orientations of %s", (id) => {
    for (const flip of [false, true]) {
      const raw = rawPuzzle();
      raw.formation = { id, flip };
      const parsed = parsePuzzle(raw);
      expect(parsed.formation).toEqual({ id, flip });
      expect(parsed.defense[0]).toEqual({
        id: "DL1",
        look: { on: "ball", x: -5, y: 7 },
        assignment: { kind: "rush" },
      });
    }
  });
  const fields = [
    "engine",
    "number",
    "date",
    "situation",
    "goal",
    "briefing",
    "formation",
    "defense",
    "coverageName",
    "prosResult",
    "situation.down",
    "situation.distance",
    "situation.spot",
    "situation.hash",
    "situation.scoreDiff",
    "situation.quarter",
    "situation.clock",
    "formation.id",
    "formation.flip",
    "defense.0.id",
    "defense.0.look",
    "defense.0.look.on",
    "defense.0.look.x",
    "defense.0.look.y",
    "defense.0.assignment",
  ];
  it.each(fields)("rejects absent or mistyped %s", (path) => {
    for (const value of [undefined, null, {}, []]) {
      const raw = rawPuzzle();
      const keys = path.split(".");
      let owner: object = raw;
      for (const key of keys.slice(0, -1)) {
        const next: unknown = Reflect.get(owner, key);
        if (typeof next !== "object" || next === null)
          throw new Error("Bad test path");
        owner = next;
      }
      Reflect.set(owner, keys[keys.length - 1], value);
      expect(() => parsePuzzle(raw)).toThrow(EngineError);
    }
  });
  it.each([
    "formation",
    "ten",
    "twelve",
    "duplicate",
    "roster",
    "assignment",
    "man",
    "zone",
    "gap",
    "low",
    "high",
    "overflow",
    "first-down-at-goal",
  ])("rejects isolated %s violation", (rule) => {
    const raw = rawPuzzle();
    switch (rule) {
      case "formation":
        raw.formation.id = "unknown";
        break;
      case "ten":
        raw.defense.pop();
        break;
      case "twelve":
        raw.defense.push({
          id: "NB",
          look: { on: "ball", x: 0, y: 0 },
          assignment: "rush",
        });
        break;
      case "duplicate":
        raw.defense[1].id = "DL1";
        break;
      case "roster":
        raw.defense[0].id = "DL5";
        break;
      case "assignment":
        raw.defense[0].assignment = "rush L-A extra";
        break;
      case "man":
        raw.defense[0].assignment = "man QB";
        break;
      case "zone":
        raw.defense[0].assignment = "zone unknown";
        break;
      case "gap":
        raw.defense[0].assignment = "rush L-E";
        break;
      case "low":
        raw.situation.spot = 9;
        break;
      case "high":
        raw.situation.spot = 100;
        raw.situation.distance = 0;
        raw.goal = "touchdown";
        break;
      case "overflow":
        raw.situation.spot = 95;
        break;
      case "first-down-at-goal":
        raw.situation.spot = 90;
        break;
    }
    expect(() => parsePuzzle(raw)).toThrow(EngineError);
  });
  it("parses the defensive assignment language", () => {
    const raw = rawPuzzle();
    raw.defense[0].assignment = "man RB";
    raw.defense[1].assignment = "zone deep-quarter-4";
    raw.defense[2].assignment = "rush R-D";
    expect(
      parsePuzzle(raw)
        .defense.slice(0, 4)
        .map((d) => d.assignment),
    ).toEqual([
      { kind: "man", target: "RB" },
      { kind: "zone", zone: "deep-quarter-4" },
      { kind: "rush", gap: "R-D" },
      { kind: "rush" },
    ]);
  });
  it.each(["zone hook-R", "rush"])(
    "rejects a DL on %s without on, x and y in his look",
    (call) => {
      const full = { on: "ball", x: -5, y: 1 };
      for (const look of [
        undefined,
        { x: -5, y: 1 },
        { on: "ball", y: 1 },
        { on: "ball", x: -5 },
      ]) {
        const raw = rawPuzzle();
        raw.defense[0] = { id: "DL1", look, assignment: call };
        expect(() => parsePuzzle(raw)).toThrow(EngineError);
      }
      const raw = rawPuzzle();
      raw.defense[0] = { id: "DL1", look: full, assignment: call };
      expect(parsePuzzle(raw).defense[0].look).toEqual(full);
    },
  );
  it.each([
    ["right", { on: "Z", x: 4 }, { on: "Z", x: 4.5 }],
    ["left", { on: "field", x: -15.75 }, { on: "field", x: -16 }],
  ] as const)(
    "on the %s hash, accepts a corner at look %o on the sideline but not %o past it",
    (hash, onLine, past) => {
      const raw = rawPuzzle();
      raw.situation.hash = hash;
      raw.defense[7] = { id: "CB1", look: onLine, assignment: "man Z" };
      expect(parsePuzzle(raw).defense[7].look).toEqual(onLine);
      raw.defense[7] = { id: "CB1", look: past, assignment: "man Z" };
      expect(() => parsePuzzle(raw)).toThrow(EngineError);
    },
  );
  it.each([
    [{ y: 8 }, { y: 7.99 }],
    [{ x: 2 }, { x: 1.99 }],
    [{ y: 8 }, undefined],
  ] as const)(
    "accepts a second man on H at look %o, 1 yd from the first, but not at %o",
    (apart, close) => {
      const raw = rawPuzzle();
      raw.defense[7] = { id: "CB1", look: undefined, assignment: "man H" };
      raw.defense[8] = { id: "CB2", look: apart, assignment: "man H" };
      expect(parsePuzzle(raw).defense[8].look).toEqual(apart);
      raw.defense[8] = { id: "CB2", look: close, assignment: "man H" };
      expect(() => parsePuzzle(raw)).toThrow(EngineError);
    },
  );
  it.each([-5, 0, 0.5])("rejects distance %s below one yard", (distance) => {
    const raw = rawPuzzle();
    raw.situation.distance = distance;
    expect(() => parsePuzzle(raw)).toThrow(EngineError);
  });
  it("accepts a one-yard first-down distance", () => {
    const raw = rawPuzzle();
    raw.situation.distance = 1;
    const parsed = parsePuzzle(raw);
    expect(parsed.situation.distance).toBe(1);
    expect(parsed.goal).toBe("first-down");
  });
  it("accepts a touchdown goal short of goal-to-go", () => {
    const raw = rawPuzzle();
    raw.goal = "touchdown";
    raw.situation.spot = 80;
    raw.situation.distance = 5;
    const parsed = parsePuzzle(raw);
    expect(parsed.goal).toBe("touchdown");
    expect(parsed.situation.distance).toBe(5);
  });
  it("accepts goal-to-go at both field limits", () => {
    for (const spot of [10, 99]) {
      const raw = rawPuzzle();
      raw.goal = "touchdown";
      raw.situation.spot = spot;
      raw.situation.distance = 100 - spot;
      expect(parsePuzzle(raw).goal).toBe("touchdown");
    }
  });
});

describe("formation helpers", () => {
  it.each(formationIds)("places %s on every hash and orientation", (id) => {
    for (const hash of ["left", "middle", "right"] as const) {
      for (const flip of [false, true]) {
        const p = puzzle();
        p.formation = { id, flip };
        p.situation.hash = hash;
        const spots = engine.preSnap(p);
        const ball = hash === "left" ? -4 : hash === "right" ? 4 : 0;
        expect(Object.keys(spots).length).toBe(22);
        expect(spots.LT).toEqual({ x: ball - 3, y: -0.5 });
        expect(spots.RT).toEqual({ x: ball + 3, y: -0.5 });
        expect(spots.X).toEqual({ x: flip ? 11.75 : -11.75, y: -0.5 });
        expect(spots.Z).toEqual({ x: flip ? -11.75 : 11.75, y: -0.5 });
        expect(spots.QB).toEqual({ x: ball, y: id === "ace" ? -1 : -5 });
        expect(spots.DL1).toEqual({ x: ball - 5, y: 7 });
      }
    }
  });
  it.each(formationIds)("offers %s letter menus in both orientations", (id) => {
    for (const flip of [false, true]) {
      const p = puzzle();
      p.formation = { id, flip };
      for (const letter of letters) {
        expect(engine.routeMenu(p, letter)).toEqual(
          letter === "RB"
            ? id === "gun-empty"
              ? inside
              : rb
            : letter === "X" || letter === "Z"
              ? wr
              : inside,
        );
      }
    }
  });
  it.each(formationIds)(
    "offers %s protection counts in both orientations",
    (id) => {
      for (const flip of [false, true]) {
        const p = puzzle();
        p.formation = { id, flip };
        expect(engine.protections(p)).toEqual(
          id === "gun-empty"
            ? [5]
            : ["gun-trey", "gun-doubles", "gun-doubles-12", "ace"].includes(id)
              ? [5, 6, 7]
              : [5, 6],
        );
      }
    },
  );
  it("places Ace's RB seven yards behind the ball", () => {
    const p = puzzle();
    p.formation.id = "ace";
    p.situation.hash = "right";
    expect(engine.preSnap(p).RB).toEqual({ x: 4, y: -7 });
  });
  it("places the Gun Doubles attached Y opposite the slot", () => {
    const p = puzzle();
    p.formation.id = "gun-doubles";
    expect(engine.preSnap(p).Y).toEqual({ x: 4.5, y: -0.5 });
    expect(engine.preSnap(p).H).toEqual({ x: -7.375, y: -1.5 });
  });
  it("places Gun Doubles 12's detached H opposite attached Y", () => {
    const p = puzzle();
    p.formation.id = "gun-doubles-12";
    expect(engine.preSnap(p).Y).toEqual({ x: 4.5, y: -0.5 });
    expect(engine.preSnap(p).H).toEqual({ x: -7.375, y: -1.5 });
  });
  it.each(formationIds)(
    "places %s receivers in both middle-hash orientations",
    (id) => {
      for (const flip of [false, true]) {
        const p = puzzle();
        p.formation = { id, flip };
        for (const letter of ["Y", "H", "RB"] as const) {
          const expected = receiverAlignments[id][letter];
          expect(engine.preSnap(p)[letter]).toEqual({
            x: expected.x === 0 ? 0 : expected.x * (flip ? -1 : 1),
            y: expected.y,
          });
        }
      }
    },
  );
  it.each(calls)("offers the depth class for $route", (call) => {
    const p = puzzle();
    const expected = ["In", "Out", "Hook"].includes(call.route)
      ? [5, 10, 15]
      : ["Corner", "Post", "Comeback"].includes(call.route)
        ? [10, 15]
        : [];
    expect(engine.availableDepths(p, "X", call.route)).toEqual(expected);
    p.situation.spot = 95;
    expect(engine.availableDepths(p, "X", call.route)).toEqual(
      expected.filter((d) => d <= 14),
    );
    if (expected.length === 0) {
      expect(engine.availableDepths(p, "X", "In")).toEqual([5, 10]);
    }
  });
});

// Literal route-table oracle at spot 45; the end line is y=64.
function expectedPath(x: number, y: number, call: RouteCall) {
  const side = x < 0 ? -1 : 1;
  const out = ["Out", "Corner", "Comeback", "Flat", "Wheel"].includes(
    call.route,
  );
  const direction = out ? side : -side;
  const start = { x, y };
  const depth =
    "depth" in call
      ? call.depth
      : ["Slant", "Drag"].includes(call.route)
        ? 2
        : 1;
  const turn = { x, y: depth };
  switch (call.route) {
    case "Go":
    case "Seam":
      return {
        points: [start, { x, y: 10 }, { x, y: 64 }],
        breaks: [],
        throwIndex: 1,
        end: "run",
      };
    case "Hitch":
      return {
        points: [start, turn],
        breaks: [{ index: 1, kind: "hard" }],
        throwIndex: 1,
        end: "sit",
      };
    case "Hook":
      return {
        points: [start, turn, { x, y: 9 }, { x: x - side, y: 8 }],
        breaks: [{ index: 1, kind: "hard" }],
        throwIndex: 3,
        end: "sit",
      };
    case "Comeback":
      return {
        points: [start, turn, { x: x + side * 2, y: 8 }],
        breaks: [{ index: 1, kind: "hard" }],
        throwIndex: 2,
        end: "sit",
      };
    case "Wheel":
      return {
        points: [
          start,
          turn,
          { x: side * 11.75, y: 1 },
          { x: side * 11.75, y: 64 },
        ],
        breaks: [
          { index: 1, kind: "soft" },
          { index: 2, kind: "soft" },
        ],
        throwIndex: 2,
        end: "run",
      };
    case "Slant":
    case "Post":
    case "Corner": {
      const travel = Math.min(64 - depth, 14.75 - direction * x);
      return {
        points: [start, turn, { x: x + direction * travel, y: depth + travel }],
        breaks: [{ index: 1, kind: "soft" }],
        throwIndex: 1,
        end: "run",
      };
    }
    default:
      return {
        points: [start, turn, { x: direction * 14.75, y: depth }],
        breaks: [{ index: 1, kind: call.route === "Flat" ? "soft" : "hard" }],
        throwIndex: 1,
        end: "run",
      };
  }
}
describe("default alignment", () => {
  const cases = formationIds.flatMap((id) =>
    (["left", "middle", "right"] as const).flatMap((hash) =>
      [false, true].map((flip) => ({
        id,
        hash,
        flip,
        ball: hash === "left" ? -4 : hash === "right" ? 4 : 0,
      })),
    ),
  );
  type Case = (typeof cases)[number];
  const middleTrey: Case = {
    id: "gun-trey",
    hash: "middle",
    flip: false,
    ball: 0,
  };
  function lineUp(c: Case, defense: Puzzle["defense"]) {
    const p = puzzle();
    p.formation = { id: c.id, flip: c.flip };
    p.situation.hash = c.hash;
    p.defense = defense;
    return engine.preSnap(p);
  }
  // Each letter's side of the ball, unflipped; a backfield RB is "back".
  const sides: Record<FormationId, Record<Letter, -1 | 1 | "back">> = {
    "gun-trey": { X: -1, Y: 1, Z: 1, H: 1, RB: "back" },
    "gun-doubles": { X: -1, Y: 1, Z: 1, H: -1, RB: "back" },
    "gun-trips": { X: -1, Y: 1, Z: 1, H: 1, RB: "back" },
    "gun-spread": { X: -1, Y: -1, Z: 1, H: 1, RB: "back" },
    "gun-empty": { X: -1, Y: 1, Z: 1, H: 1, RB: -1 },
    "gun-doubles-12": { X: -1, Y: 1, Z: 1, H: -1, RB: "back" },
    ace: { X: -1, Y: 1, Z: 1, H: -1, RB: "back" },
  };
  // 1 yd outside the receiver, or 1 yd toward the ball from a backfield RB.
  function manX(c: Case, spots: Record<string, Vec>, letter: Letter) {
    const side = sides[c.id][letter];
    if (side !== "back") return spots[letter].x + side * (c.flip ? -1 : 1);
    if (c.id === "ace") return c.ball;
    return c.ball + (c.flip ? 0.5 : -0.5);
  }
  it.each([
    ["L-A", -0.75],
    ["L-B", -2.25],
    ["L-C", -3.75],
    ["L-D", -5.25],
    ["R-A", 0.75],
    ["R-B", 2.25],
    ["R-C", 3.75],
    ["R-D", 5.25],
  ] as const)(
    "lines a DL rushing %s up on the gap point 1 yd off the ball",
    (gap, offset) => {
      for (const c of cases) {
        const spots = lineUp(c, [
          { id: "DL1", assignment: { kind: "rush", gap } },
        ]);
        expect(spots.DL1).toEqual({ x: c.ball + offset, y: 1 });
      }
    },
  );
  it.each([
    ["LB1", 5],
    ["NB", 5],
    ["DB", 5],
    ["S1", 10],
  ] as const)("lines %s up over his rush gap %s yd deep", (id, depth) => {
    for (const c of cases) {
      const spots = lineUp(c, [
        { id, assignment: { kind: "rush", gap: "R-B" } },
      ]);
      expect(spots[id]).toEqual({ x: c.ball + 2.25, y: depth });
    }
  });
  it.each([
    ["CB1", 7],
    ["NB", 5],
    ["DB", 5],
    ["LB1", 5],
    ["S1", 10],
    ["DL1", 1],
  ] as const)(
    "lines %s up in man 1 yd outside his receiver, %s yd deep",
    (id, depth) => {
      for (const c of cases) {
        for (const letter of letters) {
          const spots = lineUp(c, [
            { id, assignment: { kind: "man", target: letter } },
          ]);
          expect(spots[id]).toEqual({ x: manX(c, spots, letter), y: depth });
        }
      }
    },
  );
  it.each([
    ["deep-half-L", -11.75],
    ["deep-third-L", -11.75],
    ["deep-quarter-1", -11.75],
    ["curl-flat-L", -11.75],
    ["flat-L", -11.75],
    ["deep-half-R", 11.75],
    ["deep-third-R", 11.75],
    ["deep-quarter-4", 11.75],
    ["curl-flat-R", 11.75],
    ["flat-R", 11.75],
  ] as const)(
    "lines a corner in %s up over the wideout at x %s, 7 yd deep",
    (zone, x) => {
      for (const c of cases) {
        const spots = lineUp(c, [
          { id: "CB1", assignment: { kind: "zone", zone } },
        ]);
        expect(spots.CB1).toEqual({ x, y: 7 });
      }
    },
  );
  // The receiver next inside the outermost one on each side, unflipped.
  const secondFromOutside: Record<
    FormationId,
    { L: Letter | null; R: Letter | null }
  > = {
    "gun-trey": { L: null, R: "H" },
    "gun-doubles": { L: "H", R: "Y" },
    "gun-trips": { L: null, R: "H" },
    "gun-spread": { L: "Y", R: "H" },
    "gun-empty": { L: "RB", R: "H" },
    "gun-doubles-12": { L: "H", R: "Y" },
    ace: { L: "H", R: "Y" },
  };
  it.each([
    ["NB", "curl-flat-L"],
    ["NB", "flat-R"],
    ["DB", "curl-flat-R"],
    ["DB", "flat-L"],
  ] as const)(
    "lines %s in %s up over the next receiver inside, 5 yd deep",
    (id, zone) => {
      for (const c of cases) {
        const fieldSide = zone.endsWith("L") ? "L" : "R";
        const formationSide = c.flip
          ? fieldSide === "L"
            ? "R"
            : "L"
          : fieldSide;
        const letter = secondFromOutside[c.id][formationSide];
        const defense: Puzzle["defense"] = [
          { id, assignment: { kind: "zone", zone } },
        ];
        if (letter === null) {
          expect(() => lineUp(c, defense)).toThrow(EngineError);
          continue;
        }
        const spots = lineUp(c, defense);
        expect(spots[id]).toEqual({ x: spots[letter].x, y: 5 });
      }
    },
  );
  it.each([
    ["hook-L", { left: -9, middle: -5, right: -1 }],
    ["hook-M", { left: -4, middle: 0, right: 4 }],
    ["hook-R", { left: 1, middle: 5, right: 9 }],
    ["curl-flat-L", { left: -12, middle: -10, right: -8 }],
    ["curl-flat-R", { left: 8, middle: 10, right: 12 }],
  ] as const)("lines an LB in %s up at its landmark, 5 yd deep", (zone, x) => {
    for (const c of cases) {
      const spots = lineUp(c, [
        { id: "LB1", assignment: { kind: "zone", zone } },
      ]);
      expect(spots.LB1).toEqual({ x: x[c.hash], y: 5 });
    }
  });
  it.each([
    ["deep-middle", 0],
    ["deep-half-L", -7.875],
    ["deep-half-R", 7.875],
    ["deep-third-L", -10.5],
    ["deep-third-M", 0],
    ["deep-third-R", 10.5],
    ["deep-quarter-1", -11.8125],
    ["deep-quarter-2", -3.9375],
    ["deep-quarter-3", 3.9375],
    ["deep-quarter-4", 11.8125],
  ] as const)(
    "lines a safety in %s up at its landmark x %s, 12 yd deep",
    (zone, x) => {
      for (const c of cases) {
        const spots = lineUp(c, [
          { id: "S1", assignment: { kind: "zone", zone } },
        ]);
        expect(spots.S1).toEqual({ x, y: 12 });
      }
    },
  );
  it.each([
    ["DL1", { kind: "zone", zone: "hook-R" }],
    ["DL1", { kind: "rush" }],
    ["S1", { kind: "rush" }],
    ["CB1", { kind: "rush", gap: "R-A" }],
    ["CB1", { kind: "zone", zone: "hook-M" }],
    ["NB", { kind: "zone", zone: "deep-third-M" }],
    ["LB1", { kind: "zone", zone: "flat-R" }],
    ["S1", { kind: "zone", zone: "hook-L" }],
  ] as const)("gives %s on %o no default spot", (id, assignment) => {
    const defense: Puzzle["defense"] = [{ id, assignment }];
    expect(() => lineUp(middleTrey, defense)).toThrow(EngineError);
    defense[0].look = { on: "ball", x: 2, y: 3 };
    expect(lineUp(middleTrey, defense)[id]).toEqual({ x: 2, y: 3 });
  });
  it("lines man H up 1 yd outside H, 1 yd deep, with a look of y 1", () => {
    for (const c of cases) {
      const spots = lineUp(c, [
        { id: "NB", look: { y: 1 }, assignment: { kind: "man", target: "H" } },
      ]);
      expect(spots.NB).toEqual({ x: manX(c, spots, "H"), y: 1 });
    }
  });
  it.each([
    [{ y: 1 }, { x: 9.125, y: 1 }],
    [{ x: -2 }, { x: 6.125, y: 5 }],
    [{ on: "Y" }, { x: 5.5, y: 5 }],
    [
      { on: "ball", x: 3 },
      { x: 3, y: 5 },
    ],
    [
      { on: "field", x: -1, y: 2 },
      { x: -1, y: 2 },
    ],
  ] as const)("overrides only the fields %o names", (look, spot) => {
    const spots = lineUp(middleTrey, [
      { id: "NB", look, assignment: { kind: "man", target: "H" } },
    ]);
    expect(spots.NB).toEqual(spot);
  });
});

describe("route paths", () => {
  it.each(formationIds)(
    "draws %s route-table paths in both orientations",
    (id) => {
      for (const letter of letters) {
        for (const call of calls) {
          const menu =
            letter === "RB"
              ? id === "gun-empty"
                ? inside
                : rb
              : letter === "X" || letter === "Z"
                ? wr
                : inside;
          if (!menu.includes(call.route)) continue;
          for (const flip of [false, true]) {
            const p = puzzle();
            p.formation = { id, flip };
            const start =
              letter === "X"
                ? { x: -11.75, y: -0.5 }
                : letter === "Z"
                  ? { x: 11.75, y: -0.5 }
                  : letter === "RB"
                    ? { x: -4, y: 0 }
                    : receiverAlignments[id][letter];
            const x = start.x * (flip ? -1 : 1);
            expect(engine.routePath(p, letter, call)).toEqual(
              expectedPath(x, start.y, call),
            );
          }
        }
      }
    },
  );
  it.each(calls)(
    "draws $route on both sides for every eligible letter",
    (call) => {
      for (const letter of letters) {
        for (const flip of [false, true]) {
          const p = puzzle();
          p.formation.flip = flip;
          if (!engine.routeMenu(p, letter).includes(call.route)) continue;
          const x =
            (letter === "X"
              ? -11.75
              : letter === "Z"
                ? 11.75
                : letter === "Y"
                  ? 4.5
                  : letter === "H"
                    ? 8.125
                    : -4) * (flip ? -1 : 1);
          const y = letter === "RB" ? 0 : letter === "H" ? -1.5 : -0.5;
          const path = engine.routePath(p, letter, call);
          expect(path).toEqual(expectedPath(x, y, call));
          for (let i = 1; i < path.points.length; i++) {
            const dx = Math.abs(path.points[i].x - path.points[i - 1].x);
            const dy = Math.abs(path.points[i].y - path.points[i - 1].y);
            expect(dx === 0 || dy === 0 || dx === dy).toBe(true);
          }
        }
      }
    },
  );
  it.each([5, 10, 15] as const)(
    "turns at requested short depth %s",
    (depth) => {
      for (const route of ["In", "Out", "Hook"] as const)
        expect(
          engine.routePath(puzzle(), "X", { route, depth }).points[1],
        ).toEqual({ x: -11.75, y: depth });
    },
  );
  it.each([10, 15] as const)("turns at requested long depth %s", (depth) => {
    for (const route of ["Post", "Corner", "Comeback"] as const)
      expect(
        engine.routePath(puzzle(), "X", { route, depth }).points[1],
      ).toEqual({ x: -11.75, y: depth });
  });
  it("ends a diagonal run at the end-line margin near the goal", () => {
    const p = puzzle();
    p.situation.spot = 95;
    expect(engine.routePath(p, "X", { route: "Slant" })).toEqual({
      points: [
        { x: -11.75, y: -0.5 },
        { x: -11.75, y: 2 },
        { x: 0.25, y: 14 },
      ],
      breaks: [{ index: 1, kind: "soft" }],
      throwIndex: 1,
      end: "run",
    });
  });
  it("ends a straight run at the end-line margin near the goal", () => {
    const p = puzzle();
    p.situation.spot = 95;
    expect(engine.routePath(p, "X", { route: "Go" })).toEqual({
      points: [
        { x: -11.75, y: -0.5 },
        { x: -11.75, y: 10 },
        { x: -11.75, y: 14 },
      ],
      breaks: [],
      throwIndex: 1,
      end: "run",
    });
  });
});

describe("zone and gap placement", () => {
  it("reproduces every middle-hash zone ellipse", () => {
    expect(zoneCatalog(puzzle())).toEqual({
      "deep-middle": { center: { x: 0, y: 15 }, radii: { x: 10, y: 8 } },
      "deep-half-L": {
        center: { x: -7.875, y: 15 },
        radii: { x: 7.875, y: 8 },
      },
      "deep-half-R": { center: { x: 7.875, y: 15 }, radii: { x: 7.875, y: 8 } },
      "deep-third-L": { center: { x: -10.5, y: 15 }, radii: { x: 5.25, y: 8 } },
      "deep-third-M": { center: { x: 0, y: 15 }, radii: { x: 5.25, y: 8 } },
      "deep-third-R": { center: { x: 10.5, y: 15 }, radii: { x: 5.25, y: 8 } },
      "deep-quarter-1": {
        center: { x: -11.8125, y: 15 },
        radii: { x: 3.9375, y: 8 },
      },
      "deep-quarter-2": {
        center: { x: -3.9375, y: 15 },
        radii: { x: 3.9375, y: 8 },
      },
      "deep-quarter-3": {
        center: { x: 3.9375, y: 15 },
        radii: { x: 3.9375, y: 8 },
      },
      "deep-quarter-4": {
        center: { x: 11.8125, y: 15 },
        radii: { x: 3.9375, y: 8 },
      },
      "hook-L": { center: { x: -5, y: 6.5 }, radii: { x: 3.5, y: 3.5 } },
      "hook-M": { center: { x: 0, y: 6.5 }, radii: { x: 3, y: 3.5 } },
      "hook-R": { center: { x: 5, y: 6.5 }, radii: { x: 3.5, y: 3.5 } },
      "curl-flat-L": { center: { x: -10, y: 7 }, radii: { x: 3.5, y: 4 } },
      "curl-flat-R": { center: { x: 10, y: 7 }, radii: { x: 3.5, y: 4 } },
      "flat-L": { center: { x: -13.25, y: 4 }, radii: { x: 2.5, y: 4 } },
      "flat-R": { center: { x: 13.25, y: 4 }, radii: { x: 2.5, y: 4 } },
    });
  });
  it.each(["left", "right"] as const)("shifts hooks on the %s hash", (hash) => {
    const p = puzzle();
    p.situation.hash = hash;
    const catalog = zoneCatalog(p);
    const ball = hash === "left" ? -4 : 4;
    expect(catalog["hook-L"]).toEqual({
      center: { x: ball - 5, y: 6.5 },
      radii: { x: 3.5, y: 3.5 },
    });
    expect(catalog["hook-M"]).toEqual({
      center: { x: ball, y: 6.5 },
      radii: { x: 3, y: 3.5 },
    });
    expect(catalog["hook-R"]).toEqual({
      center: { x: ball + 5, y: 6.5 },
      radii: { x: 3.5, y: 3.5 },
    });
    expect(catalog["deep-third-L"]).toEqual({
      center: { x: -10.5, y: 15 },
      radii: { x: 5.25, y: 8 },
    });
    expect(catalog["deep-third-M"]).toEqual({
      center: { x: 0, y: 15 },
      radii: { x: 5.25, y: 8 },
    });
    expect(catalog["deep-third-R"]).toEqual({
      center: { x: 10.5, y: 15 },
      radii: { x: 5.25, y: 8 },
    });
  });
  it.each(formationIds)("names %s gaps as drawn", (id) => {
    for (const flip of [false, true]) {
      for (const hash of ["left", "middle", "right"] as const) {
        const p = puzzle();
        p.formation = { id, flip };
        p.situation.hash = hash;
        const ball = hash === "left" ? -4 : hash === "right" ? 4 : 0;
        expect(gapPoints(p)).toEqual({
          "L-A": { x: ball - 0.75, y: 0 },
          "R-A": { x: ball + 0.75, y: 0 },
          "L-B": { x: ball - 2.25, y: 0 },
          "R-B": { x: ball + 2.25, y: 0 },
          "L-C": { x: ball - 3.75, y: 0 },
          "R-C": { x: ball + 3.75, y: 0 },
          "L-D": { x: ball - 5.25, y: 0 },
          "R-D": { x: ball + 5.25, y: 0 },
        });
      }
    }
  });
});

describe("design validation before simulation", () => {
  const invalid = [
    {
      name: "unavailable blockers",
      message: "Unavailable blocker count",
      change: (p: Puzzle, d: Design) => {
        p.formation.id = "gun-empty";
        d.protection.blockers = 6;
        delete d.routes.RB;
      },
    },
    {
      name: "seven without attached Y",
      message: "Unavailable blocker count",
      change: (p: Puzzle, d: Design) => {
        p.formation.id = "gun-spread";
        d.protection.blockers = 7;
        delete d.routes.RB;
        delete d.routes.Y;
      },
    },
    {
      name: "missing route",
      message: "Missing receiver route",
      change: (_p: Puzzle, d: Design) => {
        delete d.routes.X;
      },
    },
    {
      name: "kept RB route",
      message: "A kept-in receiver cannot run a route",
      change: (_p: Puzzle, d: Design) => {
        d.protection.blockers = 6;
      },
    },
    {
      name: "kept Y route",
      message: "A kept-in receiver cannot run a route",
      change: (_p: Puzzle, d: Design) => {
        d.protection.blockers = 7;
        delete d.routes.RB;
      },
    },
    {
      name: "off-menu route",
      message: "Route is not on this receiver's menu",
      change: (_p: Puzzle, d: Design) => {
        d.routes.X = { route: "Wheel" };
      },
    },
    {
      name: "unavailable depth",
      message: "Unavailable route depth",
      change: (p: Puzzle, d: Design) => {
        p.situation.spot = 95;
        d.routes.X = { route: "In", depth: 15 };
      },
    },
    {
      name: "missing depth",
      message: "Unavailable route depth",
      change: (_p: Puzzle, d: Design) => {
        const call = { route: "In", depth: 10 } satisfies RouteCall;
        Reflect.deleteProperty(call, "depth");
        d.routes.X = call;
      },
    },
    {
      name: "extra depth",
      message: "This route has no depth",
      change: (_p: Puzzle, d: Design) => {
        const call = { route: "Go" } satisfies RouteCall;
        Reflect.set(call, "depth", 10);
        d.routes.X = call;
      },
    },
    {
      name: "short Corner depth",
      message: "Unavailable route depth",
      change: (_p: Puzzle, d: Design) => {
        const call = { route: "Corner", depth: 10 } satisfies RouteCall;
        Reflect.set(call, "depth", 5);
        d.routes.X = call;
      },
    },
    {
      name: "empty reads",
      message: "Invalid read order",
      change: (_p: Puzzle, d: Design) => {
        d.readOrder = [];
      },
    },
    {
      name: "four reads",
      message: "Invalid read order",
      change: (_p: Puzzle, d: Design) => {
        d.readOrder = ["X", "Y", "Z", "H"];
      },
    },
    {
      name: "repeated read",
      message: "Invalid read order",
      change: (_p: Puzzle, d: Design) => {
        d.readOrder = ["X", "X"];
      },
    },
    {
      name: "kept RB read",
      message: "Invalid read order",
      change: (_p: Puzzle, d: Design) => {
        d.protection.blockers = 6;
        delete d.routes.RB;
        d.readOrder = ["RB"];
      },
    },
    {
      name: "kept Y read",
      message: "Invalid read order",
      change: (_p: Puzzle, d: Design) => {
        d.protection.blockers = 7;
        delete d.routes.RB;
        delete d.routes.Y;
        d.readOrder = ["Y"];
      },
    },
  ];
  it.each(invalid)(
    "rejects $name with the specific design error",
    ({ change, message }) => {
      for (const lineCall of [
        "man",
        "slide-left",
        "slide-right",
      ] satisfies LineCall[]) {
        const p = puzzle();
        const d = design();
        d.protection.lineCall = lineCall;
        change(p, d);
        expect(() => engine.simulate(p, d)).toThrow(new EngineError(message));
      }
    },
  );
});

const art: DefensePlayArt = {
  zones: [
    {
      defenderId: "DL1",
      zone: "hook-L",
      center: { x: -5, y: 6.5 },
      radii: { x: 3.5, y: 3.5 },
    },
    {
      defenderId: "LB1",
      zone: "hook-M",
      center: { x: 0, y: 6.5 },
      radii: { x: 3, y: 3.5 },
    },
    {
      defenderId: "S1",
      zone: "deep-middle",
      center: { x: 0, y: 15 },
      radii: { x: 10, y: 8 },
    },
  ],
  assignments: { DL1: "zone", LB1: "zone", CB1: "man", NB: "rush", S1: "zone" },
};
function rep(verdict: Rep["verdict"], yards = 10, touchdown = false): Rep {
  const spots = engine.preSnap(puzzle());
  return {
    endTick: 0,
    tracks: {
      X: [spots.X],
      Y: [spots.Y],
      Z: [spots.Z],
      H: [spots.H],
      RB: [spots.RB],
      QB: [spots.QB],
      LT: [spots.LT],
      LG: [spots.LG],
      C: [spots.C],
      RG: [spots.RG],
      RT: [spots.RT],
      DL1: [spots.DL1],
      DL2: [spots.DL2],
      DL3: [spots.DL3],
      DL4: [spots.DL4],
      LB1: [spots.LB1],
      LB2: [spots.LB2],
      LB3: [spots.LB3],
      CB1: [spots.CB1],
      CB2: [spots.CB2],
      NB: [],
      DB: [],
      S1: [spots.S1],
      S2: [spots.S2],
    },
    ball: null,
    carrier: null,
    reads: [],
    thrownToRead: null,
    outcome: {
      kind: verdict === "failed" ? "incompletion" : "completion",
      yards,
    },
    verdict,
    timeInPocketTicks: 0,
    cause: {
      code: touchdown
        ? "touchdown"
        : verdict === "converted"
          ? "converted"
          : "short",
      decisive: null,
      thrownTo: null,
    },
    feedback: [],
    playArt: structuredClone(art),
  };
}
describe("score", () => {
  it.each([
    { attempt: 1, base: 100 },
    { attempt: 2, base: 75 },
    { attempt: 3, base: 50 },
    { attempt: 4, base: 25 },
    { attempt: 5, base: 0 },
  ])("scores conversion on rep $attempt", ({ attempt, base }) => {
    const reps = Array.from({ length: attempt - 1 }, () => rep("failed"));
    reps.push(rep("converted"));
    expect(engine.score(puzzle(), reps)).toEqual({
      base,
      bonus: 0,
      total: base,
    });
  });
  it("scores zero without a conversion", () => {
    expect(engine.score(puzzle(), [rep("short", 9), rep("failed")])).toEqual({
      base: 0,
      bonus: 0,
      total: 0,
    });
  });
  it("uses the first conversion only", () => {
    expect(
      engine.score(puzzle(), [
        rep("short"),
        rep("converted", 13),
        rep("converted", 30),
      ]),
    ).toEqual({ base: 75, bonus: 3, total: 78 });
  });
  it.each([
    { yards: 10.9, bonus: 0 },
    { yards: 15.9, bonus: 5 },
    { yards: 30, bonus: 10 },
  ])("bonuses whole excess yards at $yards", ({ yards, bonus }) => {
    expect(engine.score(puzzle(), [rep("converted", yards)])).toEqual({
      base: 100,
      bonus,
      total: 100 + bonus,
    });
  });
  it("bonuses a touchdown on a first-down goal", () => {
    expect(engine.score(puzzle(), [rep("converted", 55, true)])).toEqual({
      base: 100,
      bonus: 20,
      total: 120,
    });
  });
  it("gives no bonus on a touchdown goal", () => {
    const p = puzzle();
    p.goal = "touchdown";
    expect(engine.score(p, [rep("converted", 55, true)])).toEqual({
      base: 100,
      bonus: 0,
      total: 100,
    });
  });
});
describe("revealed play art", () => {
  it.each([0, 1])("hides the defense after %s failures", (failures) => {
    expect(engine.revealedPlayArt(art, failures, false)).toEqual({
      zones: [],
      assignments: {},
    });
    expect(engine.revealedPlayArt(art, failures, true).assignments).toEqual({
      DL1: "zone",
      LB1: "zone",
      CB1: "man",
      NB: "rush",
      S1: "zone",
    });
  });
  it("reveals DL and LB roles after two failures", () => {
    expect(engine.revealedPlayArt(art, 2, false)).toEqual({
      zones: [
        {
          defenderId: "DL1",
          zone: "hook-L",
          center: { x: -5, y: 6.5 },
          radii: { x: 3.5, y: 3.5 },
        },
        {
          defenderId: "LB1",
          zone: "hook-M",
          center: { x: 0, y: 6.5 },
          radii: { x: 3, y: 3.5 },
        },
      ],
      assignments: { DL1: "zone", LB1: "zone" },
    });
  });
  it.each([3, 4, 9])("reveals every role after %s failures", (failures) => {
    expect(engine.revealedPlayArt(art, failures, false).assignments).toEqual({
      DL1: "zone",
      LB1: "zone",
      CB1: "man",
      NB: "rush",
      S1: "zone",
    });
    expect(engine.revealedPlayArt(art, failures, false).zones[2]).toEqual({
      defenderId: "S1",
      zone: "deep-middle",
      center: { x: 0, y: 15 },
      radii: { x: 10, y: 8 },
    });
  });
  it.each([2, 3])("returns isolated art at tier %s", (failures) => {
    const source = structuredClone(art);
    const result = engine.revealedPlayArt(source, failures, false);
    result.assignments.DL1 = "rush";
    result.zones[0].center = { x: 99, y: 99 };
    expect(source.assignments.DL1).toBe("zone");
    expect(source.zones[0].center).toEqual({ x: -5, y: 6.5 });
  });
});
