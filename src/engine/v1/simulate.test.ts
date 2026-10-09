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
    spot?: number;
    distance?: number;
  } = {},
): Puzzle {
  const spot = options.spot ?? 45;
  const distance = options.distance ?? 10;
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
      distance,
      spot,
      hash: options.hash ?? "middle",
      scoreDiff: 0,
      quarter: 4,
      clock: "1:12",
    },
    goal: spot + distance === 100 ? "touchdown" : "first-down",
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
    expect(first.endTick).toBe(169);
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
        const off = rep.tracks[letter]
          .slice(0, coverageEnd(rep) + 1)
          .map((spot) =>
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
      const track = rep.tracks.X.slice(0, coverageEnd(rep) + 1);
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
      badge: "open",
      separation: Math.sqrt(1.5 * 1.5 + 3 * 3),
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
    expect(z?.separation).toBeCloseTo(4.935901640024852, 9);
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
// The catch tick, after which coverage gives way to pursuit, or the end of a
// rep with no catch.
const coverageEnd = (rep: Rep) => rep.carrier?.fromTick ?? rep.endTick;

// X's Comeback 15 is the only read, so the ball comes out at tick 59, far
// from the right-side zones.
const xComeback: Partial<Record<Letter, RouteCall>> = { X: comeback15 };
const zoneEvents = (log: LogEvent[], defender: DefenderId) =>
  log.filter(
    (event) =>
      ((event.kind === "defender-react" && event.reason === "zone") ||
        event.kind === "zone-choose" ||
        event.kind === "carry") &&
      event.defender === defender,
  );
const lbStep = 5.49 * 0.05;
const cbStep = 6.5 * 0.05;

describe("man coverage", () => {
  it("keeps his pre-snap inside offset from the receiver", () => {
    const rep = engine.simulate(
      puzzle([...lateSack, ["CB1", -9.75, 7, "man X"]]),
      design(5, "man", {}, ["Z"]),
    );
    expect(
      rep.tracks.CB1.slice(0, coverageEnd(rep) + 1).map(
        (spot, i) => spot.x - rep.tracks.X[i].x,
      ),
    ).toEqual(Array(coverageEnd(rep) + 1).fill(2));
  });
  it("holds his depth until the receiver eats the cushion, then trails by the trail distance", () => {
    const rep = engine.simulate(
      puzzle([...lateSack, ["CB1", -11.75, 7, "man X"]]),
      design(5, "man", {}, ["Z"]),
    );
    const { CB1, X } = rep.tracks;
    const end = coverageEnd(rep);
    expect(CB1.slice(1, end + 1).map((spot) => spot.y)).toEqual(
      X.slice(0, end).map((spot) => expect.closeTo(Math.max(7, spot.y + 1), 9)),
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
    expect(rep.tracks.X[coverageEnd(rep)]).toEqual({ x: -11.75, y: 1 });
    expect(rep.tracks.CB1[coverageEnd(rep)]).toEqual({ x: -11.75, y: 2 });
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
      CB1: rep.tracks.CB1[coverageEnd(rep)],
      S1: rep.tracks.S1[coverageEnd(rep)],
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
    for (const tick of ticksFrom(49, coverageEnd(rep)))
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

describe("underneath zones", () => {
  // LB1 drops into hook-M, which no route crosses; LB2 sits on the hook-R
  // landmark as Y's Seam runs through it.
  const seamThroughHook = () =>
    simulateWithLog(
      puzzle([
        ...lateSack,
        ["LB1", 0, 1, "zone hook-M"],
        ["LB2", 5, 6.5, "zone hook-R"],
      ]),
      design(
        6,
        "man",
        { ...xComeback, Y: { route: "Seam" }, H: { route: "Flat" } },
        ["X"],
      ),
    );
  // LB2 starts above hook-R and reaches its landmark at tick 15. Y's Hook 5
  // enters first; H's Seam and Z's Slant cross the zone while Y is in it.
  const threeThroughHook = () =>
    simulateWithLog(
      puzzle([...lateSack, ["LB2", 5, 10.5, "zone hook-R"]]),
      design(
        6,
        "man",
        {
          ...xComeback,
          Y: { route: "Hook", depth: 5 },
          H: { route: "Seam" },
          Z: { route: "Slant" },
        },
        ["X"],
      ),
    );
  const inHookR = (spot: Vec) => distance(spot, { x: 5, y: 6.5 }) <= 3.5 + 1e-9;

  it("drops to his landmark at his role speed", () => {
    const { LB1 } = seamThroughHook().rep.tracks;
    expect(ticksFrom(1, 21).map((tick) => LB1[tick])).toEqual([
      ...ticksFrom(1, 20).map((tick) => close({ x: 0, y: 1 + tick * lbStep })),
      { x: 0, y: 6.5 },
    ]);
  });
  it("sits at his landmark with no receiver in his zone", () => {
    const { rep } = seamThroughHook();
    expect(
      ticksFrom(21, coverageEnd(rep)).map((tick) => rep.tracks.LB1[tick]),
    ).toEqual(Array(coverageEnd(rep) - 20).fill({ x: 0, y: 6.5 }));
  });
  it("plays a receiver in his zone after the reaction delay", () => {
    const { rep, log } = seamThroughHook();
    const { LB2, Y } = rep.tracks;
    // Y is in hook-R from tick 13 to 36.
    expect(zoneEvents(log, "LB2")[0]).toEqual({
      tick: 20,
      kind: "defender-react",
      defender: "LB2",
      reason: "zone",
    });
    for (const tick of ticksFrom(20, 37))
      expect(LB2[tick]).toEqual(
        close(toward(LB2[tick - 1], Y[tick - 1], lbStep)),
      );
  });
  it("holds inside his zone while the receiver he played runs out of it", () => {
    const { LB2, Y } = seamThroughHook().rep.tracks;
    expect([inHookR(Y[36]), inHookR(Y[37])]).toEqual([true, false]);
    expect(ticksFrom(38, 43).map((tick) => LB2[tick])).toEqual(
      Array(6).fill(Y[36]),
    );
  });
  it("lets the receiver go and returns to his landmark", () => {
    const { rep, log } = seamThroughHook();
    const { LB2 } = rep.tracks;
    expect(zoneEvents(log, "LB2")[1]).toEqual({
      tick: 44,
      kind: "defender-react",
      defender: "LB2",
      reason: "zone",
    });
    for (const tick of ticksFrom(44, coverageEnd(rep)))
      expect(LB2[tick]).toEqual(
        close(toward(LB2[tick - 1], { x: 5, y: 6.5 }, lbStep)),
      );
  });
  it("locks onto the nearest receiver shallower than him over a nearer deeper one", () => {
    // At tick 32, Y's Flat is 2.43 yd away and shallower than NB, H's Out
    // 1.89 yd away and deeper.
    const { log } = simulateWithLog(
      puzzle([...lateSack, ["NB", 13.25, 4, "zone flat-R"]]),
      design(
        6,
        "man",
        {
          ...xComeback,
          Y: { route: "Flat" },
          H: { route: "Out", depth: 5 },
          Z: { route: "Hook", depth: 5 },
        },
        ["X"],
      ),
    );
    expect(log.filter((event) => event.kind === "zone-choose")).toEqual([
      {
        tick: 33,
        kind: "zone-choose",
        defender: "NB",
        chosen: "Y",
        over: ["H"],
      },
    ]);
  });
  it("takes the nearer receiver when none is shallower than him", () => {
    // When Y leaves at tick 29, Z (4.0 yd) and H (5.6 yd) are both deeper.
    const { log } = threeThroughHook();
    expect(log.filter((event) => event.kind === "zone-choose")).toEqual([
      {
        tick: 30,
        kind: "zone-choose",
        defender: "LB2",
        chosen: "Z",
        over: ["H"],
      },
    ]);
  });
  it("keeps his receiver while others enter, re-picking only when he leaves", () => {
    const { rep, log } = threeThroughHook();
    const { H, Y } = rep.tracks;
    expect([
      inHookR(H[19]),
      inHookR(H[20]),
      inHookR(Y[28]),
      inHookR(Y[29]),
    ]).toEqual([false, true, true, false]);
    expect(
      zoneEvents(log, "LB2").map((event) => [event.tick, event.kind]),
    ).toEqual([
      [20, "defender-react"],
      [30, "zone-choose"],
      [36, "defender-react"],
      [50, "defender-react"],
    ]);
  });
  it("never leaves his zone once at his landmark", () => {
    const { rep } = threeThroughHook();
    const { LB2 } = rep.tracks;
    expect({
      arrival: LB2.findIndex((spot) => spot.x === 5 && spot.y === 6.5),
      outside: ticksFrom(15, coverageEnd(rep)).filter(
        (tick) => !inHookR(LB2[tick]),
      ),
    }).toEqual({ arrival: 15, outside: [] });
  });
});

describe("deep zones", () => {
  // CB2 sits on the deep-third-R landmark. Z's In 10 comes within 6 yd of his
  // depth at tick 30 and leaves the zone at tick 51; Y's Comeback 15 turns
  // across CB2's path at tick 54. The ball is out at tick 59.
  const inCarried = () =>
    simulateWithLog(
      puzzle([...lateSack, ["CB2", 10.5, 15, "zone deep-third-R"]]),
      design(
        6,
        "man",
        {
          ...xComeback,
          Y: comeback15,
          H: { route: "Flat" },
          Z: { route: "In", depth: 10 },
        },
        ["X"],
      ),
    );
  // Where CB2 trails Z: his offset from Z when the carry starts at tick 37,
  // and the 5 yd from Z's depth to his own.
  const trail = (rep: Rep, tick: number) => ({
    x: rep.tracks.Z[tick - 1].x + 10.5 - rep.tracks.Z[36].x,
    y: rep.tracks.Z[tick - 1].y + 5,
  });

  it.each([
    {
      how: "in",
      // Z is in deep-third-R from tick 25 and 9.25 yd deep at tick 30.
      defender: ["CB2", 10.5, 15, "zone deep-third-R"] as Spot,
      routes: { Z: { route: "In", depth: 10 } } as Partial<
        Record<Letter, RouteCall>
      >,
      carry: { tick: 37, kind: "carry", defender: "CB2", letter: "Z" },
    },
    {
      how: "entering",
      // H's In 10 runs 10 yd deep and enters deep-third-M at tick 50.
      defender: ["S1", 0, 15, "zone deep-third-M"] as Spot,
      routes: { H: { route: "In", depth: 10 } } as Partial<
        Record<Letter, RouteCall>
      >,
      carry: { tick: 57, kind: "carry", defender: "S1", letter: "H" },
    },
  ])(
    "carries a receiver $how his zone within the carry distance of his depth",
    ({ defender, routes, carry }) => {
      const { log } = simulateWithLog(
        puzzle([...lateSack, defender]),
        design(
          6,
          "man",
          {
            ...xComeback,
            Y: { route: "Out", depth: 5 },
            H: { route: "Flat" },
            Z: { route: "Out", depth: 5 },
            ...routes,
          },
          ["X"],
        ),
      );
      expect(log.filter((event) => event.kind === "carry")).toEqual([carry]);
    },
  );
  it("trails the receiver he carries like man, out of his zone", () => {
    const { rep } = inCarried();
    // Deep-third-R's inside edge is 5.25 yd from the middle at his depth.
    expect(
      ticksFrom(54, 58).map((tick) => rep.tracks.CB2[tick].x < 5.25),
    ).toEqual(Array(5).fill(true));
    for (const tick of ticksFrom(38, 58))
      expect(rep.tracks.CB2[tick]).toEqual(close(trail(rep, tick)));
  });
  it("keeps carrying after the throw", () => {
    const { rep } = inCarried();
    expect(rep.ball?.throwTick).toBe(59);
    for (const tick of ticksFrom(60, coverageEnd(rep)))
      expect(rep.tracks.CB2[tick]).toEqual(close(trail(rep, tick)));
  });
  it("starts no carry after the throw", () => {
    // CB2 drops from 50 yd; without the throw at tick 59, Z's Go would come
    // within 6 yd of his depth at tick 69.
    const { rep, log } = simulateWithLog(
      puzzle([...lateSack, ["CB2", 10.5, 50, "zone deep-third-R"]]),
      design(
        6,
        "man",
        { ...xComeback, Y: { route: "Out", depth: 5 }, H: { route: "Flat" } },
        ["X"],
      ),
    );
    expect({
      carries: log.filter((event) => event.kind === "carry"),
      end: rep.tracks.CB2[coverageEnd(rep)],
    }).toEqual({
      carries: [],
      end: close({ x: 10.5, y: 50 - coverageEnd(rep) * cbStep }),
    });
  });
  it("carries the deeper of two deep threats", () => {
    // At tick 33, H's Seam (9.225 yd) and Y's (9.037 yd) both come within
    // 6 yd of S1's depth; Y is nearer the middle.
    const { log } = simulateWithLog(
      puzzle([...lateSack, ["S1", 7.875, 15, "zone deep-half-R"]]),
      design(
        6,
        "man",
        {
          ...xComeback,
          Y: { route: "Seam" },
          H: { route: "Seam" },
          Z: { route: "Out", depth: 5 },
        },
        ["X"],
      ),
    );
    expect(log.filter((event) => event.kind === "carry")).toEqual([
      { tick: 40, kind: "carry", defender: "S1", letter: "H" },
    ]);
  });
  it("carries the deep threat nearer the middle when two are level", () => {
    // S1 drops from 31.5 yd; at tick 50 H's and Z's Ins are both 10 yd deep
    // in deep-middle and come within 6 yd of his depth.
    const { rep, log } = simulateWithLog(
      puzzle([...lateSack, ["S1", 0, 31.5, "zone deep-middle"]]),
      design(
        6,
        "man",
        {
          ...xComeback,
          Y: { route: "Out", depth: 5 },
          H: { route: "In", depth: 10 },
          Z: { route: "In", depth: 10 },
        },
        ["X"],
      ),
    );
    expect([rep.tracks.H[50].y, rep.tracks.Z[50].y]).toEqual([10, 10]);
    expect(log.filter((event) => event.kind === "carry")).toEqual([
      { tick: 57, kind: "carry", defender: "S1", letter: "H" },
    ]);
  });
});

describe("zone drops and the rub", () => {
  it("drops a DL with a zone assignment to his landmark", () => {
    const { rep, log } = simulateWithLog(
      puzzle([...lateSack, ["DL1", -3.6, 1, "zone hook-L"]]),
      design(6, "man", xComeback, ["X"]),
    );
    const step = 4.77 * 0.05;
    expect({
      first: rep.tracks.DL1[1],
      end: rep.tracks.DL1[coverageEnd(rep)],
      blocked: blocks(log).filter((block) => block.includes("DL1")),
    }).toEqual({
      first: close(toward({ x: -3.6, y: 1 }, { x: -5, y: 6.5 }, step)),
      end: { x: -5, y: 6.5 },
      blocked: [],
    });
  });
  it.each([
    {
      who: "an underneath defender",
      // LB2 leaves Y for Z at tick 36, stepping within 0.4 yd of Y.
      defender: ["LB2", 5, 10.5, "zone hook-R"] as Spot,
      routes: {
        Y: { route: "Hook", depth: 5 },
        H: { route: "Seam" },
        Z: { route: "Slant" },
      } as Partial<Record<Letter, RouteCall>>,
      id: "LB2" as DefenderId,
      ticks: [36, 37],
      step: lbStep,
    },
    {
      who: "a carrying defender",
      // CB2 carries Z's In across Y's Comeback at tick 54.
      defender: ["CB2", 10.5, 15, "zone deep-third-R"] as Spot,
      routes: {
        Y: comeback15,
        H: { route: "Flat" },
        Z: { route: "In", depth: 10 },
      } as Partial<Record<Letter, RouteCall>>,
      id: "CB2" as DefenderId,
      ticks: [54, 55, 56, 57],
      step: cbStep,
    },
  ])("$who is never rubbed", ({ defender, routes, id, ticks, step }) => {
    const { rep, log } = simulateWithLog(
      puzzle([...lateSack, defender]),
      design(6, "man", { ...xComeback, ...routes }, ["X"]),
    );
    const track = rep.tracks[id];
    for (const tick of ticks)
      expect(
        segmentDistance(track[tick - 1], track[tick], rep.tracks.Y[tick - 1]),
      ).toBeLessThan(0.75);
    expect({
      rubbed: log.filter((event) => event.kind === "rubbed"),
      steps: ticks.map((tick) => distance(track[tick - 1], track[tick])),
    }).toEqual({
      rubbed: [],
      steps: ticks.map(() => expect.closeTo(step, 9)),
    });
  });
  it.each([
    {
      events: "a zone choice and a carry",
      defense: [
        ["LB2", 5, 10.5, "zone hook-R"],
        ["S1", 0, 15, "zone deep-middle"],
      ] as Spot[],
      routes: {
        ...xComeback,
        Y: { route: "Hook", depth: 5 },
        H: { route: "Seam" },
        Z: { route: "Slant" },
      } as Partial<Record<Letter, RouteCall>>,
      read: "X" as Letter,
      supporting: ["zone-choose LB2 at 30", "carry S1 at 44"],
    },
    {
      events: "a rub and a carry",
      defense: [
        ["LB1", 13.75, 1, "man Z"],
        ["CB1", -10.5, 15, "zone deep-third-L"],
      ] as Spot[],
      routes: {
        X: { route: "Go" },
        Y: comeback15,
        H: { route: "Hook", depth: 5 },
        Z: { route: "Drag" },
      } as Partial<Record<Letter, RouteCall>>,
      read: "Y" as Letter,
      supporting: ["rubbed LB1 at 37", "carry CB1 at 37"],
    },
  ])(
    "keeps $events out of the cause",
    ({ defense, routes, read, supporting }) => {
      const { rep, log } = simulateWithLog(
        puzzle([...lateSack, ...defense]),
        design(6, "man", routes, [read]),
      );
      expect(
        log.flatMap((event) =>
          event.kind === "zone-choose" ||
          event.kind === "carry" ||
          event.kind === "rubbed"
            ? [`${event.kind} ${event.defender} at ${event.tick}`]
            : [],
        ),
      ).toEqual(supporting);
      expect(rep.cause).toEqual({
        code: "converted",
        decisive: null,
        thrownTo: read,
      });
    },
  );
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
});

// Each tick's step of the ball carrier after the catch, as runs of
// [heading, ticks]: upfield, or 45° inside or outside, at his step length.
function carrierRuns(
  rep: Rep,
  inside: number,
  step: number,
): [string, number][] {
  const runs: [string, number][] = [];
  if (rep.carrier === null) return runs;
  const track = rep.tracks[rep.carrier.letter];
  for (const tick of ticksFrom(rep.carrier.fromTick + 1, rep.endTick)) {
    const dx = track[tick].x - track[tick - 1].x;
    const dy = track[tick].y - track[tick - 1].y;
    const diagonal = step * Math.sqrt(0.5);
    const label =
      Math.abs(dx) < 1e-9 && Math.abs(dy - step) < 1e-9
        ? "upfield"
        : Math.abs(Math.abs(dx) - diagonal) < 1e-9 &&
            Math.abs(dy - diagonal) < 1e-9
          ? Math.sign(dx) === inside
            ? "inside"
            : "outside"
          : `step ${dx}, ${dy}`;
    const last = runs.at(-1);
    if (last?.[0] === label) last[1]++;
    else runs.push([label, 1]);
  }
  return runs;
}
const cuts = (log: LogEvent[]) =>
  log.flatMap((event) =>
    event.kind === "cut" ? [[event.tick, event.heading]] : [],
  );
// Where a pursuer meets a carrier who keeps his velocity, or the carrier's
// spot when he never can.
function meeting(carrier: Vec, velocity: Vec, from: Vec, step: number): Vec {
  const w = { x: carrier.x - from.x, y: carrier.y - from.y };
  const a = velocity.x ** 2 + velocity.y ** 2 - step ** 2;
  const b = 2 * (w.x * velocity.x + w.y * velocity.y);
  const c = w.x ** 2 + w.y ** 2;
  const disc = b * b - 4 * a * c;
  const times =
    disc < 0
      ? []
      : [(-b - Math.sqrt(disc)) / (2 * a), (-b + Math.sqrt(disc)) / (2 * a)];
  const time = Math.min(...times.filter((each) => each > 0));
  return Number.isFinite(time)
    ? { x: carrier.x + velocity.x * time, y: carrier.y + velocity.y * time }
    : carrier;
}
// A pursuer's spot after one step at the intercept point, read from the
// previous two snapshots of the carrier.
function pursued(
  rep: Rep,
  letter: Letter,
  id: DefenderId,
  tick: number,
  step: number,
): Vec {
  const now = rep.tracks[letter][tick - 1];
  const before = rep.tracks[letter][tick - 2];
  const from = rep.tracks[id][tick - 1];
  return toward(
    from,
    meeting(now, { x: now.x - before.x, y: now.y - before.y }, from, step),
    step,
  );
}
const wrStep = 6.5 * 0.05;
const teStep = 5.78 * 0.05;
const sStep = 6.21 * 0.05;
const dlStep = 4.77 * 0.05;
// X's Hitch is caught at (-11.75, 1) on tick 22 with nobody near; the deep
// fillers come up from 50 yd to tackle him.
const openHitch = () =>
  simulateWithLog(puzzle(lateSack), design(5, "man", { X: hitch }));
// X's Slant is caught at tick 22, 5 yd short of the line to gain, with S1
// dropping to curl-flat-L above him.
const slantUnderCurl = () =>
  simulateWithLog(
    puzzle([...lateSack, ["S1", -14, 21, "zone curl-flat-L"]]),
    design(5, "man", { X: { route: "Slant" } }),
  );
// LB3 mans X's Hitch from 8 yd off and is 3.6 yd away at the catch.
const hitchUnderLb = (options: { spot?: number; distance?: number } = {}) =>
  simulateWithLog(
    puzzle([...lateSack, ["LB3", -12, 9, "man X"]], options),
    design(5, "man", { X: hitch }),
  );

describe("the ball carrier", () => {
  it.each([
    {
      what: "X after an open Hitch",
      run: openHitch,
      inside: 1,
      step: wrStep,
      runs: [
        ["upfield", 65],
        ["outside", 6],
        ["upfield", 7],
      ],
    },
    {
      what: "Y after a Drag across the middle",
      run: () =>
        simulateWithLog(
          puzzle([...lateSack, ["DL3", 4, 21, "zone deep-middle"]]),
          design(5, "man", { Y: { route: "Drag" } }, ["Y"]),
        ),
      inside: -1,
      step: teStep,
      runs: [
        ["inside", 12],
        ["outside", 6],
        ["upfield", 16],
      ],
    },
  ])(
    "steps straight upfield or 45° inside or outside every tick: $what",
    ({ run, inside, step, runs }) => {
      expect(carrierRuns(run().rep, inside, step)).toEqual(runs);
    },
  );
  it("runs at the line to gain until he crosses it", () => {
    // Straight upfield reaches the line before S1 can cut him off; only past
    // it does he turn 45° inside, toward the goal line.
    const { rep, log } = slantUnderCurl();
    const { X } = rep.tracks;
    expect({
      cuts: cuts(log),
      crossed: [X[36].y < 10, X[37].y >= 10],
    }).toEqual({ cuts: [[38, "inside"]], crossed: [true, true] });
  });
  it("runs on for the goal line once past the line to gain", () => {
    const { rep } = openHitch();
    const { X } = rep.tracks;
    expect({
      crossed: [X[49].y < 10, X[50].y >= 10],
      upfield: ticksFrom(51, 87).every(
        (tick) => X[tick].x === -11.75 && X[tick].y > X[tick - 1].y,
      ),
    }).toEqual({ crossed: [true, true], upfield: true });
  });
  it("runs at the goal line from the catch on a touchdown goal", () => {
    // The goal line is 8 yd past the line of scrimmage.
    const { rep } = simulateWithLog(
      puzzle(lateSack, { spot: 92, distance: 8 }),
      design(5, "man", { X: hitch }),
    );
    expect({
      runs: carrierRuns(rep, 1, wrStep),
      end: rep.tracks.X[rep.endTick],
      code: rep.cause.code,
    }).toEqual({
      runs: [["upfield", 22]],
      end: { x: -11.75, y: expect.closeTo(8.15, 9) },
      code: "touchdown",
    });
  });
  it("breaks a tie between the 45° headings toward the middle", () => {
    // Y's Drag carries him past the middle at tick 30; both 45° headings
    // reach the line to gain before DL3 and upfield doesn't, so he turns
    // back toward the middle, now on his outside.
    const { rep, log } = simulateWithLog(
      puzzle([...lateSack, ["DL3", 4, 21, "zone deep-middle"]]),
      design(5, "man", { Y: { route: "Drag" } }, ["Y"]),
    );
    expect({ x: rep.tracks.Y[30].x < 0, cuts: cuts(log) }).toEqual({
      x: true,
      cuts: [
        [19, "inside"],
        [31, "outside"],
        [37, "upfield"],
      ],
    });
  });
  it("drops a heading whose next step would cross the boundary margin", () => {
    // X runs 45° outside to the margin, then on upfield along it.
    const { rep, log } = simulateWithLog(
      puzzle([...lateSack, ["S1", 4, 19, "zone deep-third-L"]]),
      design(5, "man", { X: { route: "Slant" } }),
    );
    const { X } = rep.tracks;
    expect({
      cuts: cuts(log),
      edge: X[63].x - wrStep * Math.sqrt(0.5) < -14.75,
      x: ticksFrom(64, rep.endTick).map((tick) => X[tick].x),
    }).toEqual({
      cuts: [
        [38, "outside"],
        [64, "upfield"],
      ],
      edge: true,
      x: Array(rep.endTick - 63).fill(X[63].x),
    });
  });
  it("keeps a new heading for the cut hold", () => {
    // He cuts inside away from LB3 at tick 23 and would turn upfield at 28.
    const { rep, log } = hitchUnderLb();
    expect({
      cuts: cuts(log),
      runs: carrierRuns(rep, 1, wrStep),
    }).toEqual({
      cuts: [
        [23, "inside"],
        [29, "upfield"],
      ],
      runs: [
        ["inside", 6],
        ["upfield", 2],
      ],
    });
  });
  it("ends the cut hold early at the boundary margin", () => {
    // Z cuts outside at tick 86 and reaches the margin before the hold ends.
    const { rep, log } = simulateWithLog(
      puzzle([...lateSack, ["DL3", 10, 3, "zone deep-third-R"]]),
      design(5, "man", { Z: hitch }, ["Z"]),
    );
    const { Z } = rep.tracks;
    expect({
      cuts: cuts(log),
      edge: Z[90].x + wrStep * Math.sqrt(0.5) > 14.75,
    }).toEqual({
      cuts: [
        [23, "outside"],
        [31, "upfield"],
        [86, "outside"],
        [91, "upfield"],
      ],
      edge: true,
    });
  });
});

describe("pursuit", () => {
  it("ends every block at the catch", () => {
    // DL2 is doubled and held until tick 100; from the catch he heads for
    // the QB until he pursues.
    const { rep } = openHitch();
    const { DL2, QB } = rep.tracks;
    expect({
      held: DL2[21],
      caught: DL2[22],
      after: DL2[23],
    }).toEqual({
      held: DL2[20],
      caught: DL2[21],
      after: close(toward(DL2[22], QB[22], dlStep)),
    });
  });
  it("aims at the intercept point from the carrier's velocity", () => {
    // S1 pursues from tick 28 while X runs straight upfield.
    const { rep } = slantUnderCurl();
    expect(ticksFrom(28, 37).map((tick) => rep.tracks.S1[tick])).toEqual(
      ticksFrom(28, 37).map((tick) =>
        close(pursued(rep, "X", "S1", tick, sStep)),
      ),
    );
  });
  it("aims at the carrier's spot when he can't reach him", () => {
    // DL2 is slower than X and behind him.
    const { rep } = openHitch();
    const { DL2, X } = rep.tracks;
    expect(ticksFrom(28, 40).map((tick) => DL2[tick])).toEqual(
      ticksFrom(28, 40).map((tick) =>
        close(toward(DL2[tick - 1], X[tick - 1], dlStep)),
      ),
    );
  });
  it("pursues from the catch tick after breaking on the ball, otherwise after the reaction delay", () => {
    // LB3 breaks on the throw to Y's Drag, caught at tick 18; the filler DL1
    // keeps dropping to deep-middle until tick 24.
    const { rep, log } = simulateWithLog(
      puzzle([...lateSack, ["LB3", 2, 7, "man Y"]]),
      design(5, "man", { Y: { route: "Drag" } }, ["Y"]),
    );
    const { DL1, LB3 } = rep.tracks;
    const landmark = { x: 0, y: 15 };
    expect({
      broke: log.some(
        (event) =>
          event.kind === "defender-react" &&
          event.reason === "throw" &&
          event.defender === "LB3",
      ),
      catchTick: rep.carrier?.fromTick,
      LB3: LB3[19],
      DL1: ticksFrom(19, 24).map((tick) => DL1[tick]),
    }).toEqual({
      broke: true,
      catchTick: 18,
      LB3: close(pursued(rep, "Y", "LB3", 19, lbStep)),
      DL1: [
        ...ticksFrom(19, 23).map((tick) =>
          close(toward(DL1[tick - 1], landmark, dlStep)),
        ),
        close(pursued(rep, "Y", "DL1", 24, dlStep)),
      ],
    });
  });
});

describe("tackle and touchdown", () => {
  it("ends the rep on the first tick a defender is within the tackle radius", () => {
    const { rep } = hitchUnderLb();
    const gap = (tick: number) =>
      distance(rep.tracks.LB3[tick], rep.tracks.X[tick]);
    expect({
      endTick: rep.endTick,
      before: gap(29) > 1,
      at: gap(30) <= 1,
      yards: rep.outcome.yards,
      spot: rep.tracks.X[30],
    }).toEqual({
      endTick: 30,
      before: true,
      at: true,
      yards: 3,
      spot: { x: expect.closeTo(-10.371, 3), y: expect.closeTo(3.029, 3) },
    });
  });
  it("scores a catch in the end zone on the catch tick", () => {
    // Z's In 10 is caught 2 yd deep in the end zone.
    const rep = engine.simulate(
      puzzle(lateSack, { spot: 92, distance: 8 }),
      design(5, "man", { Z: { route: "In", depth: 10 } }, ["Z"]),
    );
    expect({
      catchY: rep.ball?.to.y,
      endTick: rep.endTick,
      code: rep.cause.code,
    }).toEqual({
      catchY: 10,
      endTick: rep.ball?.arriveTick,
      code: "touchdown",
    });
  });
  it("scores on the tick the carrier reaches the goal line", () => {
    // The goal line is 15 yd past the line of scrimmage.
    const rep = engine.simulate(
      puzzle(lateSack, { spot: 85 }),
      design(5, "man", { X: hitch }),
    );
    const { X } = rep.tracks;
    expect({
      reached: [X[rep.endTick - 1].y < 15, X[rep.endTick].y >= 15],
      code: rep.cause.code,
    }).toEqual({ reached: [true, true], code: "touchdown" });
  });
  it("checks the touchdown before the tackle", () => {
    // S1 is within the tackle radius on the tick Y reaches the goal line.
    const rep = engine.simulate(
      puzzle([...lateSack, ["S1", -12, 15, "zone hook-M"]], { spot: 85 }),
      design(5, "man", { Y: hitch }, ["Y"]),
    );
    const { S1, Y } = rep.tracks;
    expect({
      tackleRange: distance(S1[rep.endTick], Y[rep.endTick]) <= 1,
      goalLine: Y[rep.endTick].y >= 15,
      code: rep.cause.code,
    }).toEqual({ tackleRange: true, goalLine: true, code: "touchdown" });
  });
});

describe("the completed rep", () => {
  it.each([
    { what: "an open Hitch", run: openHitch, letter: "X", fromTick: 22 },
    { what: "a Slant", run: slantUnderCurl, letter: "X", fromTick: 22 },
    {
      what: "a Drag",
      run: () =>
        simulateWithLog(
          puzzle([...lateSack, ["S1", 8, 3, "zone curl-flat-L"]]),
          design(5, "man", { Y: { route: "Drag" } }, ["Y"]),
        ),
      letter: "Y",
      fromTick: 28,
    },
  ])(
    "names the receiver caught as the carrier from the catch tick: $what",
    ({ run, letter, fromTick }) => {
      const { rep } = run();
      expect({
        carrier: rep.carrier,
        arriveTick: rep.ball?.arriveTick,
      }).toEqual({ carrier: { letter, fromTick }, arriveTick: fromTick });
    },
  );
  it("tracks the carrier past the catch to the end of the rep", () => {
    // X's Hitch sits at (-11.75, 1); he carries on to the tackle.
    const { rep } = hitchUnderLb();
    expect({
      length: rep.tracks.X.length,
      end: rep.tracks.X[rep.endTick],
    }).toEqual({
      length: 31,
      end: { x: expect.closeTo(-10.371, 3), y: expect.closeTo(3.029, 3) },
    });
  });
  it("truncates the yards gained toward zero", () => {
    // S1 tackles Y 2.8 yd past the line of scrimmage.
    const rep = engine.simulate(
      puzzle([...lateSack, ["S1", 8, 3, "zone curl-flat-L"]]),
      design(5, "man", { Y: { route: "Drag" } }, ["Y"]),
    );
    expect({
      spot: rep.tracks.Y[rep.endTick].y,
      yards: rep.outcome.yards,
    }).toEqual({ spot: expect.closeTo(2.817, 3), yards: 2 });
  });
  it("converts a tackle at the line to gain, naming nobody", () => {
    const { rep } = slantUnderCurl();
    expect({
      outcome: rep.outcome,
      verdict: rep.verdict,
      cause: rep.cause,
    }).toEqual({
      outcome: { kind: "completion", yards: 10 },
      verdict: "converted",
      cause: { code: "converted", decisive: null, thrownTo: "X" },
    });
  });
  it.each([
    { goal: "first-down", options: {} },
    { goal: "touchdown", options: { spot: 92, distance: 8 } },
  ])(
    "calls a tackle short of the goal short, naming the tackler, on a $goal goal",
    ({ options }) => {
      const { rep } = hitchUnderLb(options);
      expect({
        outcome: rep.outcome,
        verdict: rep.verdict,
        cause: rep.cause,
      }).toEqual({
        outcome: { kind: "completion", yards: 3 },
        verdict: "short",
        cause: { code: "short", decisive: "LB3", thrownTo: "X" },
      });
    },
  );
  it.each([
    { goal: "first-down", options: { spot: 85 }, yards: 15 },
    { goal: "touchdown", options: { spot: 92, distance: 8 }, yards: 8 },
  ])(
    "converts a touchdown on a $goal goal, naming nobody",
    ({ options, yards }) => {
      const rep = engine.simulate(
        puzzle(lateSack, options),
        design(5, "man", { X: hitch }),
      );
      expect({
        outcome: rep.outcome,
        verdict: rep.verdict,
        cause: rep.cause,
      }).toEqual({
        outcome: { kind: "completion", yards },
        verdict: "converted",
        cause: { code: "touchdown", decisive: null, thrownTo: "X" },
      });
    },
  );
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
    for (const tick of ticksFrom(34, coverageEnd(rep)))
      expect(gap(rep, tick)).toBeLessThanOrEqual(1.5);
    expect(
      log.filter((event) => event.kind === "pressure" || event.kind === "sack"),
    ).toEqual([{ tick: 31, kind: "pressure", rusher: "LB1" }]);
  });
});
