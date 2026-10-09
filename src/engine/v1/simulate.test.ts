import { describe, expect, it } from "vitest";
import type {
  Blockers,
  DefenderId,
  Design,
  FormationId,
  Letter,
  LineCall,
  Puzzle,
  Rep,
  RouteCall,
  Vec,
} from "../contract";
import { formationIds, letters } from "./formations";
import { engine, parsePuzzle } from "./index";
import { simulateWithLog, type LogEvent } from "./simulate";
import { distance, segmentDistance } from "./vec";

type Spot = [DefenderId, number, number, string];
const allIds: DefenderId[] = [
  "DL1",
  "DL2",
  "DL3",
  "DL4",
  "LB1",
  "LB2",
  "LB3",
  "CB1",
  "CB2",
  "NB",
  "DB",
  "S1",
  "S2",
];
// Fills the defense to eleven with deep defenders standing far from play.
function puzzle(
  defense: Spot[],
  options: {
    formation?: FormationId;
    flip?: boolean;
    hash?: string;
  } = {},
): Puzzle {
  const named = new Set(defense.map(([id]) => id));
  const fill = allIds
    .filter((id) => !named.has(id))
    .slice(0, 11 - defense.length)
    .map((id, i): Spot => [id, i * 2 - 6, 50, "zone deep-middle"]);
  return parsePuzzle({
    engine: 1,
    number: 1,
    date: "2026-10-11",
    situation: {
      down: 3,
      distance: 10,
      spot: 45,
      hash: options.hash ?? "middle",
      scoreDiff: 0,
      quarter: 4,
      clock: "1:12",
    },
    goal: "first-down",
    briefing: "",
    formation: {
      id: options.formation ?? "gun-trey",
      flip: options.flip ?? false,
    },
    defense: [...defense, ...fill].map(([id, x, y, assignment]) => ({
      id,
      at: [x, y],
      assignment,
    })),
    coverageName: "Test",
    prosResult: "Incomplete",
  });
}
const goRoutes: Record<Letter, RouteCall> = {
  X: { route: "Go" },
  Y: { route: "Seam" },
  Z: { route: "Go" },
  H: { route: "Seam" },
  RB: { route: "Seam" },
};
function design(
  blockers: Blockers,
  lineCall: LineCall,
  routes: Partial<Record<Letter, RouteCall>> = goRoutes,
  readOrder?: readonly Letter[],
): Design {
  const runners = letters.filter(
    (letter) =>
      !(letter === "RB" && blockers >= 6) &&
      !(letter === "Y" && blockers === 7),
  );
  return {
    protection: { blockers, lineCall },
    routes: Object.fromEntries(
      runners.map((letter) => [letter, routes[letter] ?? goRoutes[letter]]),
    ),
    readOrder: readOrder ?? [runners[0]],
  };
}
const fourDl: Spot[] = [
  ["DL1", -3.6, 1, "rush"],
  ["DL2", -1, 1, "rush"],
  ["DL3", 1.2, 1, "rush"],
  ["DL4", 3.9, 1, "rush"],
];
// One DL in the left guard's area; the idle linemen double him, so the
// sack comes late.
const lateSack: Spot[] = [["DL2", -1, 1, "rush"]];
// A Comeback 15's read opens about 3 s after the snap, so the QB holds the
// ball until then.
const comeback15: RouteCall = { route: "Comeback", depth: 15 };

function blocks(log: LogEvent[]) {
  return log.flatMap((event) =>
    event.kind === "pickup"
      ? [`${event.blocker} on ${event.rusher}`]
      : event.kind === "double"
        ? [`${event.helper} helps ${event.blocker} on ${event.rusher}`]
        : event.kind === "rusher-free"
          ? [`${event.rusher} free`]
          : [],
  );
}
function gapRushers(gaps: string[]): Spot[] {
  const ids: DefenderId[] = ["LB1", "LB2", "LB3", "CB1", "CB2", "NB", "DB"];
  return gaps.map((gap, i) => [ids[i], 0, 5, `rush ${gap}`]);
}

describe("rep assembly", () => {
  const cases = formationIds.flatMap((formation) =>
    [false, true].flatMap((flip) =>
      ["left", "middle", "right"].flatMap((hash) =>
        engine.protections(puzzle(fourDl, { formation })).flatMap((blockers) =>
          (["slide-left", "man", "slide-right"] as const).map((lineCall) => ({
            formation,
            flip,
            hash,
            blockers,
            lineCall,
          })),
        ),
      ),
    ),
  );
  it.each(cases)(
    "tracks all 22 players from the snap: $formation flip $flip, $hash hash, $blockers $lineCall",
    ({ formation, flip, hash, blockers, lineCall }) => {
      const p = puzzle(fourDl, { formation, flip, hash });
      const rep = engine.simulate(p, design(blockers, lineCall));
      const spots = engine.preSnap(p);
      expect(Object.keys(rep.tracks).sort()).toEqual([
        "C",
        "CB1",
        "CB2",
        "DB",
        "DL1",
        "DL2",
        "DL3",
        "DL4",
        "H",
        "LB1",
        "LB2",
        "LB3",
        "LG",
        "LT",
        "NB",
        "QB",
        "RB",
        "RG",
        "RT",
        "X",
        "Y",
        "Z",
      ]);
      for (const track of Object.values(rep.tracks))
        expect(track).toHaveLength(rep.endTick + 1);
      expect(
        Object.fromEntries(
          Object.entries(rep.tracks).map(([id, track]) => [id, track[0]]),
        ),
      ).toEqual(spots);
    },
  );
  it("gives deep-equal reps for the same puzzle and design", () => {
    const p = puzzle(fourDl);
    const d = design(5, "man");
    const first = engine.simulate(p, d);
    const second = engine.simulate(p, d);
    expect(first.endTick).toBe(55);
    expect(second).toEqual(first);
  });
  it("leaves the ball and the read thrown to empty on a sack", () => {
    const rep = engine.simulate(
      puzzle(fourDl.concat([["LB1", 0.5, 4.5, "rush"]])),
      design(5, "man", { X: comeback15 }),
    );
    expect({
      ball: rep.ball,
      carrier: rep.carrier,
      reads: rep.reads,
      thrownToRead: rep.thrownToRead,
      outcome: rep.outcome,
      verdict: rep.verdict,
      timeInPocketTicks: rep.timeInPocketTicks,
    }).toEqual({
      ball: null,
      carrier: null,
      reads: [{ letter: "X", fromTick: 0, toTick: 38 }],
      thrownToRead: null,
      outcome: { kind: "sack", yards: -7 },
      verdict: "failed",
      timeInPocketTicks: 38,
    });
  });
});

describe("routes and the QB's drop", () => {
  const calls: RouteCall[] = [
    { route: "Go" },
    { route: "Seam" },
    { route: "In", depth: 10 },
    { route: "Out", depth: 5 },
    { route: "Hook", depth: 15 },
    { route: "Post", depth: 10 },
    { route: "Corner", depth: 15 },
    { route: "Comeback", depth: 10 },
    { route: "Slant" },
    { route: "Drag" },
    { route: "Hitch" },
    { route: "Flat" },
    { route: "Wheel" },
  ];
  const runs = formationIds.flatMap((formation) =>
    calls.map((call) => ({ formation, call })),
  );
  it.each(runs)(
    "keeps every $call.route runner on his route path in $formation",
    ({ formation, call }) => {
      const p = puzzle(lateSack, { formation });
      const routes = Object.fromEntries(
        letters
          .filter((letter) => engine.routeMenu(p, letter).includes(call.route))
          .map((letter) => [letter, call]),
      );
      const rep = engine.simulate(p, design(5, "man", routes));
      const spots = engine.preSnap(p);
      for (const letter of letters.filter((each) => each in routes)) {
        const path = engine.routePath(p, letter, call);
        // The RB's path starts at his release point; he runs there first.
        const points =
          letter === "RB" ? [spots.RB, ...path.points] : path.points;
        const off = rep.tracks[letter].map((spot) =>
          Math.min(
            ...points
              .slice(1)
              .map((end, i) => segmentDistance(points[i], end, spot)),
          ),
        );
        expect(Math.max(...off)).toBeLessThan(1e-9);
      }
    },
  );
  const sitting: { call: RouteCall; arrives: number }[] = [
    { call: { route: "Hook", depth: 10 }, arrives: 42 },
    { call: { route: "Comeback", depth: 15 }, arrives: 59 },
    { call: { route: "Hitch" }, arrives: 5 },
  ];
  it.each(sitting)(
    "holds a sitting $call.route at its last point from tick $arrives",
    ({ call, arrives }) => {
      const p = puzzle(lateSack);
      const rep = engine.simulate(p, design(5, "man", { X: call }));
      const last = engine.routePath(p, "X", call).points.at(-1);
      const track = rep.tracks.X;
      const arrived = track.findIndex(
        (spot) => spot.x === last?.x && spot.y === last?.y,
      );
      expect(arrived).toBe(arrives);
      expect(track.slice(arrived)).toEqual(
        Array(track.length - arrived).fill(last),
      );
    },
  );
  it.each(["left", "middle", "right"])(
    "sets the shotgun QB at y = -7 on tick 10 from the %s hash",
    (hash) => {
      const p = puzzle(lateSack, { hash });
      const rep = engine.simulate(p, design(5, "man"));
      const x = hash === "left" ? -4 : hash === "right" ? 4 : 0;
      expect(rep.tracks.QB[9].y).toBeCloseTo(-6.8, 9);
      expect(rep.tracks.QB.slice(10)).toEqual(
        Array(rep.endTick - 9).fill({ x, y: -7 }),
      );
    },
  );
});

describe("protection by ownership", () => {
  const eight = ["L-A", "L-B", "L-C", "L-D", "R-A", "R-B", "R-C", "R-D"];
  it("slides left: C L-A, LG L-B, LT L-C, RG R-A, RT R-B, RB R-C", () => {
    const { log } = simulateWithLog(
      puzzle(gapRushers(eight.slice(0, 7)).concat([["S1", 0, 5, "rush R-D"]])),
      design(6, "slide-left"),
    );
    expect(blocks(log)).toEqual([
      "C on LB1",
      "LG on LB2",
      "LT on LB3",
      "CB1 free",
      "RG on CB2",
      "RT on NB",
      "RB on DB",
      "S1 free",
    ]);
  });
  it("slides right: C R-A, RG R-B, RT R-C, LG L-A, LT L-B, RB L-C", () => {
    const { log } = simulateWithLog(
      puzzle(gapRushers(eight.slice(0, 7)).concat([["S1", 0, 5, "rush R-D"]])),
      design(6, "slide-right"),
    );
    expect(blocks(log)).toEqual([
      "LG on LB1",
      "LT on LB2",
      "RB on LB3",
      "CB1 free",
      "C on CB2",
      "RG on NB",
      "RT on DB",
      "S1 free",
    ]);
  });
  it("leaves the slide-side D gap open at 7-man on a slide away from Y", () => {
    const { log } = simulateWithLog(
      puzzle(gapRushers(["L-D", "R-D"])),
      design(7, "slide-left"),
    );
    expect(blocks(log)).toEqual(["LB1 free", "Y on LB2"]);
  });
  it("covers both D gaps at 7-man on a slide toward Y", () => {
    const { log } = simulateWithLog(
      puzzle(gapRushers(["L-D", "R-D"])),
      design(7, "slide-right"),
    );
    expect(blocks(log)).toEqual(["RB on LB1", "Y on LB2"]);
  });
  const twoRushers: { name: string; rushers: Spot[] }[] = [
    {
      name: "the innermost gap",
      rushers: [
        ["LB1", 6, 1, "rush R-D"],
        ["LB2", 6, 3, "rush R-C"],
      ],
    },
    {
      name: "the one nearer the line",
      rushers: [
        ["LB1", 4, 3, "rush R-C"],
        ["LB2", 5, 1, "rush R-C"],
      ],
    },
    {
      name: "the one nearer the ball",
      rushers: [
        ["LB1", 5, 2, "rush R-C"],
        ["LB2", 4, 2, "rush R-C"],
      ],
    },
  ];
  it.each(twoRushers)(
    "gives a slide owner with two rushers $name",
    ({ rushers }) => {
      const { log } = simulateWithLog(puzzle(rushers), design(6, "slide-left"));
      expect(blocks(log)).toEqual(["LB1 free", "RB on LB2"]);
    },
  );
  it("blocks each DL with the lineman whose area he stands in", () => {
    const { log } = simulateWithLog(
      puzzle([
        ["DL1", -3.6, 1, "rush"],
        ["DL2", -1, 1, "rush"],
        ["DL3", 0.2, 1, "rush"],
        ["DL4", 1.2, 1, "rush"],
        ["LB1", 3.9, 1, "rush"],
      ]),
      design(5, "man"),
    );
    expect(blocks(log)).toEqual([
      "LT on DL1",
      "LG on DL2",
      "C on DL3",
      "RG on DL4",
      "RT helps RG on DL4",
      "LB1 free",
    ]);
  });
  it("gives a DL on a gap point to the inside lineman", () => {
    const { log } = simulateWithLog(
      puzzle([
        ["DL1", 2.25, 1, "rush"],
        ["DL2", -0.75, 1, "rush"],
      ]),
      design(5, "man"),
    );
    expect(blocks(log).filter((b) => !b.includes("helps"))).toEqual([
      "RG on DL1",
      "C on DL2",
    ]);
  });
  it("passes the outer of two DL to the next lineman out when he has none", () => {
    const { log } = simulateWithLog(
      puzzle([
        ["DL1", 1.0, 1, "rush"],
        ["DL2", 2.0, 1, "rush"],
      ]),
      design(5, "man"),
    );
    expect(blocks(log).filter((b) => !b.includes("helps"))).toEqual([
      "RG on DL1",
      "RT on DL2",
    ]);
  });
  it("leaves the outer of two DL over when the next lineman out has his own", () => {
    const { log } = simulateWithLog(
      puzzle([
        ["DL1", 1.0, 1, "rush"],
        ["DL2", 2.0, 1, "rush"],
        ["DL3", 3.9, 1, "rush"],
      ]),
      design(5, "man"),
    );
    expect(blocks(log).filter((b) => !b.includes("helps"))).toEqual([
      "RG on DL1",
      "DL2 free",
      "RT on DL3",
    ]);
  });
  it("has Y take the first leftover on his side, inside-out, at 7-man", () => {
    const { log } = simulateWithLog(
      puzzle([
        ["LB1", 6, 2, "rush R-D"],
        ["LB2", 4, 2, "rush R-C"],
        ["LB3", -4, 2, "rush L-C"],
      ]),
      design(7, "man"),
    );
    expect(blocks(log)).toEqual(["LB1 free", "Y on LB2", "RB on LB3"]);
  });
  it("has the RB take the first leftover, ties away from Y", () => {
    const { log } = simulateWithLog(
      puzzle([
        ["LB1", 4, 2, "rush R-C"],
        ["LB2", -4, 2, "rush L-C"],
        ["LB3", -1, 2, "rush L-B"],
      ]),
      design(6, "man"),
    );
    expect(blocks(log)).toEqual(["LB1 free", "LB2 free", "RB on LB3"]);
  });
  it("has the RB break a gap tie away from Y", () => {
    const { log } = simulateWithLog(
      puzzle([
        ["LB1", 4, 2, "rush R-C"],
        ["LB2", -4, 2, "rush L-C"],
      ]),
      design(6, "man"),
    );
    expect(blocks(log)).toEqual(["LB1 free", "RB on LB2"]);
  });
  it("counts only DL as a lineman's man", () => {
    const { log } = simulateWithLog(
      puzzle([["LB1", -1, 1, "rush"]]),
      design(5, "man"),
    );
    expect(blocks(log)).toEqual(["LB1 free"]);
  });
  it("doubles from the center out, one helper per rusher", () => {
    const { log } = simulateWithLog(
      puzzle([
        ["DL1", -3.6, 1, "rush"],
        ["DL2", 3.9, 1, "rush"],
      ]),
      design(5, "man"),
    );
    expect(blocks(log)).toEqual([
      "LT on DL1",
      "C helps LT on DL1",
      "RT on DL2",
      "LG helps RT on DL2",
    ]);
  });
  it("leaves an idle lineman standing once every block is doubled", () => {
    const { log } = simulateWithLog(puzzle(lateSack), design(5, "man"));
    expect(blocks(log)).toEqual(["LG on DL2", "C helps LG on DL2"]);
  });
  it("releases a doubled rusher at twice the hold time", () => {
    const { log } = simulateWithLog(
      puzzle([
        ...lateSack,
        ["CB1", -11.75, -0.5, "man X"],
        ["LB1", 4.5, -0.5, "man Y"],
        ["CB2", 11.75, -0.5, "man Z"],
      ]),
      design(
        5,
        "man",
        { X: comeback15, Y: comeback15, Z: comeback15, H: comeback15 },
        ["Y", "X", "Z"],
      ),
    );
    expect(log.filter((event) => event.kind === "hold-release")).toEqual([
      { tick: 100, kind: "hold-release", rusher: "DL2" },
    ]);
  });
  it("has a kept-in receiver with no rusher pick up his hug rusher", () => {
    const { log } = simulateWithLog(
      puzzle([["LB1", -2, 4, "man RB"]]),
      design(6, "man"),
    );
    expect(log.filter((event) => event.tick === 6)).toEqual([
      { tick: 6, kind: "hug-rush", defender: "LB1", letter: "RB" },
      { tick: 6, kind: "pickup", blocker: "RB", rusher: "LB1" },
    ]);
  });
  it("lets a hug rusher come free when his receiver already has a rusher", () => {
    const { rep, log } = simulateWithLog(
      puzzle([
        ["LB1", -2, 4, "man RB"],
        ["LB2", 1, 3, "rush L-A"],
      ]),
      design(6, "man", { X: comeback15 }),
    );
    expect(log.filter((event) => event.tick === 6)).toEqual([
      { tick: 6, kind: "hug-rush", defender: "LB1", letter: "RB" },
      { tick: 6, kind: "rusher-free", rusher: "LB1" },
    ]);
    expect(rep.cause).toEqual({
      code: "sack-free-rusher",
      decisive: "LB1",
      thrownTo: null,
    });
  });
});

describe("pressure and the sack", () => {
  const blitz: Spot[] = [...fourDl, ["NB", 8.8, 4, "rush R-A"]];
  const holdBall = design(6, "man", { Y: comeback15 }, ["Y"]);
  it("holds a blocked rusher at the pass-set depth until tick 50", () => {
    const rep = engine.simulate(
      puzzle(blitz, { formation: "gun-trips" }),
      holdBall,
    );
    expect(rep.tracks.NB[49]).toEqual({ x: 0.75, y: -1 });
    expect(rep.tracks.NB[50].y).toBeLessThan(-1);
  });
  it("logs pressure on the first tick a rusher is within 2 yd", () => {
    const { rep, log } = simulateWithLog(
      puzzle(blitz, { formation: "gun-trips" }),
      holdBall,
    );
    const near = (tick: number) =>
      distance(rep.tracks.NB[tick], rep.tracks.QB[tick]);
    expect(
      log.filter((event) => event.kind === "pressure" && event.rusher === "NB"),
    ).toEqual([{ tick: 62, kind: "pressure", rusher: "NB" }]);
    expect(near(61)).toBeGreaterThan(2);
    expect(near(62)).toBeLessThanOrEqual(2);
  });
  it("names the blocked rusher who beats his block as the sacker", () => {
    const rep = engine.simulate(
      puzzle(blitz, { formation: "gun-trips" }),
      holdBall,
    );
    expect({ endTick: rep.endTick, cause: rep.cause }).toEqual({
      endTick: 63,
      cause: { code: "sack-beat-block", decisive: "NB", thrownTo: null },
    });
  });
  it("truncates sack yards toward zero where the QB stands", () => {
    const rep = engine.simulate(
      puzzle([...fourDl, ["LB1", 0.5, 2, "rush"]], { formation: "ace" }),
      design(5, "man"),
    );
    expect(rep.tracks.QB[rep.endTick].y).toBeCloseTo(-5.8, 9);
    expect(rep.outcome).toEqual({ kind: "sack", yards: -5 });
  });
});

describe("receiver feedback", () => {
  it("measures the receiver thrown to on the arrival tick", () => {
    const rep = engine.simulate(
      puzzle([...lateSack, ["S1", -8.75, 20, "man X"]]),
      design(5, "man"),
    );
    expect(separation(rep, "X", 32)).toBeGreaterThan(3);
    expect(rep.feedback.find((each) => each.letter === "X")).toEqual({
      letter: "X",
      badge: "covered",
      separation: 0,
      tick: 55,
    });
  });
  it("measures every other runner at his best moment until the throw", () => {
    const rep = engine.simulate(
      puzzle(fourDl),
      design(5, "man", { Y: { route: "Flat" } }),
    );
    const y = rep.feedback.find((each) => each.letter === "Y");
    expect(y).toEqual({
      letter: "Y",
      badge: "open",
      separation: separation(rep, "Y", 33),
      tick: 33,
    });
    expect(separation(rep, "Y", 36)).toBeGreaterThan(separation(rep, "Y", 33));
  });
  it.each([
    { ballOut: "throw", pressed: [] as Spot[], tick: 33 },
    {
      ballOut: "throwaway",
      // X and Z are pressed on Go routes, under 1 yd all play.
      pressed: [
        ["CB1", -11.75, 0, "man X"],
        ["CB2", 11.75, 0, "man Z"],
      ] as Spot[],
      tick: 53,
    },
  ])(
    "measures a runner who never became throwable on the $ballOut tick",
    ({ pressed, tick }) => {
      const rep = engine.simulate(
        puzzle([...lateSack, ...pressed]),
        design(5, "man", { H: comeback15 }, ["X", "Z"]),
      );
      expect({
        ballOut: rep.ball?.throwTick,
        H: rep.feedback.find((each) => each.letter === "H")?.tick,
      }).toEqual({ ballOut: tick, H: tick });
    },
  );
  it("measures a runner at his best moment once the QB is set", () => {
    const rep = engine.simulate(
      puzzle([...lateSack, ["CB1", -11.75, 3.5, "zone flat-L"]]),
      design(5, "man", { X: { route: "Hitch" } }, ["Z"]),
    );
    expect(rep.feedback.find((each) => each.letter === "X")).toEqual({
      letter: "X",
      badge: "contested",
      separation: 2.5,
      tick: 10,
    });
  });
  it("measures a runner from the tick he reaches his throw point", () => {
    const rep = engine.simulate(
      puzzle([...lateSack, ["CB2", 11.75, 25, "zone deep-third-R"]]),
      design(5, "man"),
    );
    const z = rep.feedback.find((each) => each.letter === "Z");
    expect(z?.tick).toBe(33);
    expect(z?.badge).toBe("open");
    expect(z?.separation).toBeCloseTo(14.775, 9);
  });
  it("measures a runner who never became throwable on the sack tick", () => {
    const rep = engine.simulate(
      puzzle(fourDl.concat([["LB1", 0.5, 4.5, "rush"]])),
      design(5, "man", { X: { route: "Comeback", depth: 15 } }),
    );
    expect(rep.feedback.find((each) => each.letter === "X")?.tick).toBe(
      rep.endTick,
    );
    expect(rep.endTick).toBe(38);
  });
});

describe("play art", () => {
  it("gives every defender's kind and every zone defender's zone", () => {
    const p = puzzle([
      ["DL1", -1, 1, "rush"],
      ["LB1", 0, 5, "zone hook-M"],
      ["CB1", -11, 6, "man X"],
      ["S1", 0, 13, "zone deep-middle"],
      ["S2", 6, 8, "zone curl-flat-R"],
      ["LB2", 2, 5, "rush R-A"],
      ["LB3", -2, 5, "zone hook-L"],
      ["CB2", 11, 6, "man Z"],
      ["NB", 7, 4, "man H"],
      ["DL2", 1, 1, "rush"],
      ["DL3", 3, 1, "rush"],
    ]);
    const art = engine.simulate(p, design(5, "man")).playArt;
    expect(art.assignments).toEqual({
      DL1: "rush",
      LB1: "zone",
      CB1: "man",
      S1: "zone",
      S2: "zone",
      LB2: "rush",
      LB3: "zone",
      CB2: "man",
      NB: "man",
      DL2: "rush",
      DL3: "rush",
    });
    expect(art.zones).toEqual([
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
      {
        defenderId: "S2",
        zone: "curl-flat-R",
        center: { x: 10, y: 7 },
        radii: { x: 3.5, y: 4 },
      },
      {
        defenderId: "LB3",
        zone: "hook-L",
        center: { x: -5, y: 6.5 },
        radii: { x: 3.5, y: 3.5 },
      },
    ]);
  });
});

const hitch: RouteCall = { route: "Hitch" };
function separation(rep: Rep, letter: Letter, tick: number): number {
  return Math.min(
    ...allIds
      .filter((id) => Object.hasOwn(rep.tracks, id))
      .map((id) => distance(rep.tracks[letter][tick], rep.tracks[id][tick])),
  );
}
// Where a player stepping the given length from one spot toward another ends.
function toward(from: Vec, to: Vec, length: number): Vec {
  const gap = distance(from, to);
  if (gap <= length) return to;
  return {
    x: from.x + ((to.x - from.x) * length) / gap,
    y: from.y + ((to.y - from.y) * length) / gap,
  };
}
const close = (spot: Vec) => ({
  x: expect.closeTo(spot.x, 9),
  y: expect.closeTo(spot.y, 9),
});
const ticksFrom = (first: number, last: number) =>
  Array.from({ length: last - first + 1 }, (_, i) => first + i);

describe("man coverage", () => {
  it("keeps his pre-snap inside offset from the receiver", () => {
    const rep = engine.simulate(
      puzzle([...lateSack, ["CB1", -9.75, 7, "man X"]]),
      design(5, "man", {}, ["Z"]),
    );
    expect(rep.tracks.CB1.map((spot, i) => spot.x - rep.tracks.X[i].x)).toEqual(
      Array(rep.endTick + 1).fill(2),
    );
  });
  it("holds his depth until the receiver eats the cushion, then trails by the trail distance", () => {
    const rep = engine.simulate(
      puzzle([...lateSack, ["CB1", -11.75, 7, "man X"]]),
      design(5, "man", {}, ["Z"]),
    );
    const { CB1, X } = rep.tracks;
    expect(CB1.slice(1).map((spot) => spot.y)).toEqual(
      X.slice(0, -1).map((spot) => expect.closeTo(Math.max(7, spot.y + 1), 9)),
    );
  });
  it("keeps the shrunk cushion while a Comeback comes back toward the line", () => {
    const rep = engine.simulate(
      puzzle([...lateSack, ["CB1", -11.75, 15, "man X"]]),
      design(5, "man", { X: comeback15, Y: comeback15 }, ["Y"]),
    );
    const { CB1, X } = rep.tracks;
    // After his reaction ends at tick 56, X is still coming back until 59.
    expect(X[58]).not.toEqual(X[57]);
    for (const tick of [56, 57, 58])
      expect(CB1[tick]).toEqual(
        close(
          toward(
            CB1[tick - 1],
            { x: X[tick - 1].x, y: X[tick - 1].y + 1 },
            6.5 * 0.05,
          ),
        ),
      );
  });
  it("closes on a sitting receiver to the trail distance", () => {
    const rep = engine.simulate(
      puzzle([...lateSack, ["CB1", -11.75, 7, "man X"]]),
      design(5, "man", { X: hitch }, ["Z"]),
    );
    expect(rep.tracks.X[rep.endTick]).toEqual({ x: -11.75, y: 1 });
    expect(rep.tracks.CB1[rep.endTick]).toEqual({ x: -11.75, y: 2 });
  });
  it.each([
    { call: { route: "Slant" } as RouteCall, turn: "45°", react: 16 },
    { call: { route: "Out", depth: 10 } as RouteCall, turn: "90°", react: 40 },
    { call: comeback15, turn: "135°", react: 56 },
  ])(
    "holds his old heading for the reaction delay after a $turn turn ($call.route)",
    ({ call, react }) => {
      const { rep, log } = simulateWithLog(
        puzzle([...lateSack, ["CB1", -11.75, 5, "man X"]]),
        design(5, "man", { X: call, Y: comeback15 }, ["Y"]),
      );
      const { CB1 } = rep.tracks;
      const step = (tick: number) => ({
        x: CB1[tick].x - CB1[tick - 1].x,
        y: CB1[tick].y - CB1[tick - 1].y,
      });
      const before = step(react - 7);
      const length = distance(CB1[react - 8], CB1[react - 7]);
      const held = {
        x: (before.x * 6.5 * 0.05) / length,
        y: (before.y * 6.5 * 0.05) / length,
      };
      expect(
        log.filter(
          (event) =>
            event.kind === "defender-react" && event.reason === "break",
        ),
      ).toEqual([
        {
          tick: react,
          kind: "defender-react",
          defender: "CB1",
          reason: "break",
        },
      ]);
      expect(ticksFrom(react - 6, react - 1).map(step)).toEqual(
        Array(6).fill(close(held)),
      );
    },
  );
  it("lets two defenders man one receiver, each from his own offset", () => {
    const rep = engine.simulate(
      puzzle([
        ...lateSack,
        ["CB1", -11.75, 7, "man X"],
        ["S1", -8.75, 10, "man X"],
      ]),
      design(5, "man", { X: hitch }, ["Z"]),
    );
    expect({
      CB1: rep.tracks.CB1[rep.endTick],
      S1: rep.tracks.S1[rep.endTick],
    }).toEqual({ CB1: { x: -11.75, y: 2 }, S1: { x: -8.75, y: 2 } });
  });
});

describe("the rub", () => {
  // LB1 trails Z's Drag 2 yd outside him; H sits on his Hook 5 in LB1's path.
  const rub = () =>
    simulateWithLog(
      puzzle([...lateSack, ["LB1", 13.75, 1, "man Z"]]),
      design(
        5,
        "man",
        { H: { route: "Hook", depth: 5 }, Z: { route: "Drag" }, Y: comeback15 },
        ["Y"],
      ),
    );
  const lbStep = 5.49 * 0.05;
  it("logs a rub when a chase step would pass within the contact radius of another route runner", () => {
    const { log } = rub();
    expect(log.filter((event) => event.kind === "rubbed")).toEqual([
      { tick: 37, kind: "rubbed", defender: "LB1", by: "H" },
    ]);
  });
  it("steers around the runner outside the contact radius", () => {
    const { rep } = rub();
    const { LB1, H } = rep.tracks;
    expect([LB1[36].x > H[36].x, LB1[49].x < H[49].x]).toEqual([true, true]);
    for (const tick of ticksFrom(36, 49))
      expect(distance(LB1[tick], H[tick])).toBeGreaterThanOrEqual(0.75 - 1e-9);
  });
  it("moves at half speed for the rub time", () => {
    const { rep } = rub();
    const { LB1 } = rep.tracks;
    expect(
      ticksFrom(35, 50).map((tick) => distance(LB1[tick - 1], LB1[tick])),
    ).toEqual([
      ...Array(2).fill(expect.closeTo(lbStep, 9)),
      ...Array(12).fill(expect.closeTo(lbStep / 2, 9)),
      ...Array(2).fill(expect.closeTo(lbStep, 9)),
    ]);
  });
  it("rejoins his chase once the rub time is over", () => {
    const { rep } = rub();
    const { LB1, Z } = rep.tracks;
    for (const tick of ticksFrom(49, rep.endTick))
      expect(LB1[tick]).toEqual(
        close(
          toward(
            LB1[tick - 1],
            { x: Z[tick - 1].x + 2, y: Z[tick - 1].y + 1 },
            lbStep,
          ),
        ),
      );
  });
});

describe("reads", () => {
  // CB1 closes on X's Hitch from 3 yd, so X is never open; Z's Hitch is.
  const secondRead = () =>
    engine.simulate(
      puzzle([...lateSack, ["CB1", -11.75, 3, "man X"]]),
      design(5, "man", { X: hitch, Z: hitch }, ["X", "Z"]),
    );
  it("looks at the first read from the snap", () => {
    expect(secondRead().reads[0]).toEqual({
      letter: "X",
      fromTick: 0,
      toTick: 20,
    });
  });
  it.each([
    {
      latest: "the receiver reaching his throw point",
      rep: () => engine.simulate(puzzle(lateSack), design(5, "man")),
      throwTick: 33,
    },
    {
      latest: "the QB being set",
      rep: () =>
        engine.simulate(puzzle(lateSack), design(5, "man", { X: hitch })),
      throwTick: 10,
    },
    { latest: "reaching that read", rep: secondRead, throwTick: 20 },
  ])("opens a read's time at $latest", ({ rep, throwTick }) => {
    expect(rep().ball?.throwTick).toBe(throwTick);
  });
  it("throws on the first tick in the read time that the read is 3 yd clear in the snapshot", () => {
    const rep = engine.simulate(
      puzzle([...lateSack, ["CB1", -11.75, 1, "man X"]]),
      design(5, "man", { X: { route: "Out", depth: 5 } }),
    );
    // X reaches his throw point, the break 5 yd past the line, on tick 17.
    expect([rep.tracks.X[16].y < 5, rep.tracks.X[17].y]).toEqual([true, 5]);
    expect(rep.ball?.throwTick).toBe(25);
    expect(
      ticksFrom(17, 25).map((tick) => separation(rep, "X", tick - 1) >= 3),
    ).toEqual([...Array(8).fill(false), true]);
  });
  it("accepts a contested read once pressure is logged", () => {
    const { rep, log } = simulateWithLog(
      puzzle([
        ...lateSack,
        ["CB1", -10.25, 1, "man X"],
        ["CB2", 11.75, 1, "man Z"],
        ["LB1", 0, 1, "rush"],
      ]),
      design(5, "man", { X: hitch, Z: hitch }, ["Z", "X"]),
    );
    expect(log.find((event) => event.kind === "pressure")).toEqual({
      tick: 24,
      kind: "pressure",
      rusher: "LB1",
    });
    expect(separation(rep, "X", 24)).toBeCloseTo(Math.sqrt(1.5 ** 2 + 1), 9);
    expect({ throwTick: rep.ball?.throwTick, cause: rep.cause }).toEqual({
      throwTick: 25,
      cause: {
        code: "breakup-forced",
        decisive: "CB1",
        thrownTo: "X",
        forcedBy: "pressure",
      },
    });
  });
  // Gun Spread is symmetric, so mirrored coverage gives X and Z exactly the
  // same separation.
  const spread = (zOffset: number) =>
    puzzle(
      [
        ...lateSack,
        ["CB1", -10.25, 1, "man X"],
        ["CB2", 11.75 - zOffset, 1, "man Z"],
      ],
      { formation: "gun-spread" },
    );
  it("forces the read with the most separation when he runs out of reads", () => {
    const rep = engine.simulate(
      spread(2.5),
      design(5, "man", { X: hitch, Z: hitch }, ["X", "Z"]),
    );
    expect(separation(rep, "X", 29)).toBeCloseTo(Math.sqrt(1.5 ** 2 + 1), 9);
    expect(separation(rep, "Z", 29)).toBeCloseTo(Math.sqrt(2.5 ** 2 + 1), 9);
    expect({
      throwTick: rep.ball?.throwTick,
      target: rep.ball?.target,
      forcedBy: rep.cause.forcedBy,
    }).toEqual({ throwTick: 30, target: "Z", forcedBy: "out-of-reads" });
  });
  it.each([
    { readOrder: ["X", "Z"] as Letter[], target: "X" },
    { readOrder: ["Z", "X"] as Letter[], target: "Z" },
  ])(
    "breaks an out-of-reads tie toward the earlier read: $readOrder",
    ({ readOrder, target }) => {
      const rep = engine.simulate(
        spread(1.5),
        design(5, "man", { X: hitch, Z: hitch }, readOrder),
      );
      expect(separation(rep, "X", 29)).toBe(separation(rep, "Z", 29));
      expect({
        target: rep.ball?.target,
        forcedBy: rep.cause.forcedBy,
      }).toEqual({ target, forcedBy: "out-of-reads" });
    },
  );
  it.each([
    { hash: "left", ball: -4, sideline: -16.75 },
    { hash: "middle", ball: 0, sideline: 16.75 },
    { hash: "right", ball: 4, sideline: 16.75 },
  ])(
    "throws it away past the nearest sideline from the $hash hash when every read is covered",
    ({ hash, ball, sideline }) => {
      // Both outside receivers are pressed on Go routes, under 1 yd all play.
      const rep = engine.simulate(
        puzzle(
          [
            ...lateSack,
            ["CB1", -11.75 - ball, 0, "man X"],
            ["CB2", 11.75 - ball, 0, "man Z"],
          ],
          { hash },
        ),
        design(5, "man", {}, ["X", "Z"]),
      );
      const flight = Math.ceil(Math.abs(sideline - ball) / (25 * 0.05));
      expect({
        endTick: rep.endTick,
        ball: rep.ball,
        outcome: rep.outcome,
        cause: rep.cause,
      }).toEqual({
        endTick: 53 + flight,
        ball: {
          from: { x: ball, y: -7 },
          to: { x: sideline, y: -7 },
          throwTick: 53,
          arriveTick: 53 + flight,
          target: null,
        },
        outcome: { kind: "incompletion", yards: 0 },
        cause: { code: "throwaway", decisive: null, thrownTo: null },
      });
    },
  );
});

describe("the throw", () => {
  it("flies at the ball speed to the first spot on the receiver's path it can reach in time", () => {
    const rep = engine.simulate(puzzle(lateSack), design(5, "man"));
    const from = { x: 0, y: -7 };
    expect(rep.ball).toEqual({
      from,
      to: rep.tracks.X[55],
      throwTick: 33,
      arriveTick: 55,
      target: "X",
    });
    expect(
      ticksFrom(34, 55).map(
        (tick) => distance(from, rep.tracks.X[tick]) <= (tick - 33) * 1.25,
      ),
    ).toEqual([...Array(21).fill(false), true]);
  });
  it("throws to a stopped receiver where he stands", () => {
    const rep = engine.simulate(
      puzzle(lateSack),
      design(5, "man", { X: hitch }),
    );
    expect(rep.ball).toEqual({
      from: { x: 0, y: -7 },
      to: { x: -11.75, y: 1 },
      throwTick: 10,
      arriveTick: 22,
      target: "X",
    });
    expect(rep.tracks.X[10]).toEqual({ x: -11.75, y: 1 });
  });
});

describe("breaking on the ball", () => {
  // S1 mans X from 20 yd deep; CB2 presses Z on the far side.
  const deepBall = () =>
    simulateWithLog(
      puzzle([
        ...lateSack,
        ["S1", -8.75, 20, "man X"],
        ["CB2", 11.75, 1, "man Z"],
      ]),
      design(5, "man"),
    );
  it("sends a defender within the ball-break radius at the throw plus the reaction delay to the catch point", () => {
    const { rep, log } = deepBall();
    const { S1 } = rep.tracks;
    const to = { x: -11.75, y: 17.375 };
    expect(rep.ball?.throwTick).toBe(33);
    expect(distance(S1[38], to)).toBeLessThanOrEqual(6);
    expect(
      log.filter(
        (event) => event.kind === "defender-react" && event.reason === "throw",
      ),
    ).toEqual([
      { tick: 39, kind: "defender-react", defender: "S1", reason: "throw" },
    ]);
    for (const tick of ticksFrom(39, rep.endTick))
      expect(S1[tick]).toEqual(close(toward(S1[tick - 1], to, 6.21 * 0.05)));
  });
  it("leaves a defender outside the ball-break radius on his assignment", () => {
    const { rep } = deepBall();
    const { CB2, Z } = rep.tracks;
    expect(distance(CB2[38], { x: -11.75, y: 17.375 })).toBeGreaterThan(6);
    for (const tick of ticksFrom(39, rep.endTick))
      expect(CB2[tick]).toEqual(
        close({ x: Z[tick - 1].x, y: Z[tick - 1].y + 1 }),
      );
  });
});

describe("ball arrival", () => {
  it("is a catch when no defender is within the contest radius", () => {
    const rep = engine.simulate(puzzle(fourDl), design(5, "man"));
    expect(
      Math.min(
        ...allIds
          .filter((id) => Object.hasOwn(rep.tracks, id))
          .map((id) => distance(rep.tracks[id][55], rep.tracks.X[55])),
      ),
    ).toBeGreaterThan(1);
    expect(rep.outcome.kind).toBe("completion");
  });
  it("intercepts when a defender who broke on the ball was strictly nearer the catch point the tick before", () => {
    const rep = engine.simulate(
      puzzle([...lateSack, ["S1", -8.75, 20, "man X"]]),
      design(5, "man"),
    );
    const to = { x: -11.75, y: 17.375 };
    expect(distance(rep.tracks.S1[54], to)).toBeLessThan(
      distance(rep.tracks.X[54], to),
    );
    expect({ outcome: rep.outcome, cause: rep.cause }).toEqual({
      outcome: { kind: "interception", yards: 0 },
      cause: { code: "interception-closed", decisive: "S1", thrownTo: "X" },
    });
  });
  it("ends an interception at the catch point with no return", () => {
    const rep = engine.simulate(
      puzzle([...lateSack, ["S1", -8.75, 20, "man X"]]),
      design(5, "man"),
    );
    expect({
      endTick: rep.endTick,
      interceptor: rep.tracks.S1[rep.endTick],
      carrier: rep.carrier,
    }).toEqual({
      endTick: 55,
      interceptor: rep.ball?.to,
      carrier: null,
    });
  });
  it("breaks up a ball when the defender is no nearer the catch point than a receiver standing on it", () => {
    const { rep, log } = simulateWithLog(
      puzzle([...lateSack, ["CB1", -11.75, 3, "man X"]]),
      design(5, "man", { X: hitch }),
    );
    expect(
      log.some(
        (event) => event.kind === "defender-react" && event.reason === "throw",
      ),
    ).toBe(true);
    expect(rep.tracks.CB1[31]).toEqual(rep.ball?.to);
    expect(rep.tracks.X[31]).toEqual(rep.ball?.to);
    expect({ outcome: rep.outcome, cause: rep.cause }).toEqual({
      outcome: { kind: "incompletion", yards: 0 },
      cause: {
        code: "breakup-forced",
        decisive: "CB1",
        thrownTo: "X",
        forcedBy: "out-of-reads",
      },
    });
  });
  it.each([
    { inside: "CB1" as const, outside: "S1" as const },
    { inside: "S1" as const, outside: "CB1" as const },
  ])(
    "gives a tie for nearest to the first defender in id order: $inside inside",
    ({ inside, outside }) => {
      // Listed S1 first so the puzzle's own order can't decide it.
      const rep = engine.simulate(
        puzzle([
          ...lateSack,
          ["S1", inside === "S1" ? -11.25 : -12.25, 3, "man X"],
          ["CB1", inside === "CB1" ? -11.25 : -12.25, 3, "man X"],
        ]),
        design(5, "man", { X: hitch }),
      );
      expect(
        [inside, outside].map((id) => rep.tracks[id][rep.endTick]),
      ).toEqual([rep.ball?.to, rep.ball?.to]);
      expect(rep.cause.decisive).toBe("CB1");
    },
  );
});

describe("rep fields", () => {
  it("records each read reached, the read thrown to and the time in the pocket", () => {
    const rep = engine.simulate(
      puzzle([...lateSack, ["CB1", -11.75, 3, "man X"]]),
      design(5, "man", { X: hitch, Z: hitch }, ["X", "Z"]),
    );
    expect({
      reads: rep.reads,
      thrownToRead: rep.thrownToRead,
      timeInPocketTicks: rep.timeInPocketTicks,
      thrownTo: rep.cause.thrownTo,
    }).toEqual({
      reads: [
        { letter: "X", fromTick: 0, toTick: 20 },
        { letter: "Z", fromTick: 20, toTick: 20 },
      ],
      thrownToRead: 1,
      timeInPocketTicks: 20,
      thrownTo: "Z",
    });
  });
  it.each([
    { yards: 17, verdict: "converted", routes: {} },
    { yards: 1, verdict: "short", routes: { X: hitch } },
  ])(
    "calls a catch $verdict by where it is caught",
    ({ yards, verdict, routes }) => {
      const rep = engine.simulate(puzzle(lateSack), design(5, "man", routes));
      expect({
        yards: rep.outcome.yards,
        verdict: rep.verdict,
        cause: rep.cause,
      }).toEqual({
        yards,
        verdict,
        cause: { code: verdict, decisive: null, thrownTo: "X" },
      });
    },
  );
});

describe("a catch", () => {
  it("ends the rep at the catch point on the arrival tick, yards truncated", () => {
    const rep = engine.simulate(
      puzzle(lateSack, { hash: "left" }),
      design(5, "man"),
    );
    expect(rep.ball?.to).toEqual({ x: -11.75, y: expect.closeTo(16.725, 9) });
    expect({ endTick: rep.endTick, outcome: rep.outcome }).toEqual({
      endTick: rep.ball?.arriveTick,
      outcome: { kind: "completion", yards: 16 },
    });
    expect(rep.endTick).toBe(53);
  });
});

describe("throw beats the rush", () => {
  // LB1 runs free at the QB as X's Go is thrown.
  const race = () =>
    simulateWithLog(
      puzzle([...lateSack, ["LB1", 0, 3, "rush"]]),
      design(5, "man"),
    );
  const gap = (rep: Rep, tick: number) =>
    distance(rep.tracks.LB1[tick], rep.tracks.QB[tick]);
  it("lets a throw on the tick a rusher first comes within the sack radius beat the sack", () => {
    const { rep } = race();
    expect([gap(rep, 32) > 1.5, gap(rep, 33) <= 1.5]).toEqual([true, true]);
    expect({
      throwTick: rep.ball?.throwTick,
      outcome: rep.outcome.kind,
    }).toEqual({ throwTick: 33, outcome: "completion" });
  });
  it("logs no sack or pressure once the ball is out", () => {
    const { rep, log } = race();
    for (const tick of ticksFrom(34, rep.endTick))
      expect(gap(rep, tick)).toBeLessThanOrEqual(1.5);
    expect(
      log.filter((event) => event.kind === "pressure" || event.kind === "sack"),
    ).toEqual([{ tick: 31, kind: "pressure", rusher: "LB1" }]);
  });
});
