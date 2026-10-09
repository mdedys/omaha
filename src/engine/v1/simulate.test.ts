import { describe, expect, it } from "vitest";
import type {
  Blockers,
  DefenderId,
  Design,
  FormationId,
  Letter,
  LineCall,
  Puzzle,
  RouteCall,
  Vec,
} from "../contract";
import { EngineError } from "../error";
import { formationIds, letters } from "./formations";
import { engine, parsePuzzle } from "./index";
import { simulateWithLog, type LogEvent } from "./simulate";
import { distance } from "./vec";

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
    readOrder: [runners[0]],
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
function segmentDistance(a: Vec, b: Vec, p: Vec): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const length2 = abx * abx + aby * aby;
  const share =
    length2 === 0
      ? 0
      : Math.max(
          0,
          Math.min(1, ((p.x - a.x) * abx + (p.y - a.y) * aby) / length2),
        );
  return distance({ x: a.x + abx * share, y: a.y + aby * share }, p);
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
    expect(first.endTick).toBe(69);
    expect(second).toEqual(first);
  });
  it("ends every rep in a failed sack with no ball", () => {
    const rep = engine.simulate(puzzle(fourDl), design(5, "man"));
    expect({
      ball: rep.ball,
      carrier: rep.carrier,
      thrownToRead: rep.thrownToRead,
      outcome: rep.outcome,
      verdict: rep.verdict,
      timeInPocketTicks: rep.timeInPocketTicks,
    }).toEqual({
      ball: null,
      carrier: null,
      thrownToRead: null,
      outcome: { kind: "sack", yards: -7 },
      verdict: "failed",
      timeInPocketTicks: 69,
    });
  });
  it("throws EngineError at the 20 s cap when nobody rushes", () => {
    const p = puzzle([["DL1", 0, 1, "zone hook-M"]]);
    expect(() => engine.simulate(p, design(5, "man"))).toThrow(
      new EngineError("Rep reached the 20 s cap"),
    );
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
    const { log } = simulateWithLog(puzzle(lateSack), design(5, "man"));
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
      design(6, "man"),
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
  it("holds a blocked rusher at the pass-set depth until tick 50", () => {
    const rep = engine.simulate(
      puzzle(blitz, { formation: "gun-trips" }),
      design(6, "man"),
    );
    expect(rep.tracks.NB[49]).toEqual({ x: 0.75, y: -1 });
    expect(rep.tracks.NB[50].y).toBeLessThan(-1);
  });
  it("logs pressure on the first tick a rusher is within 2 yd", () => {
    const { rep, log } = simulateWithLog(
      puzzle(blitz, { formation: "gun-trips" }),
      design(6, "man"),
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
      design(6, "man"),
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
  it("measures a runner at his best moment once the QB is set", () => {
    const rep = engine.simulate(
      puzzle([...lateSack, ["CB1", -11.75, 3.5, "zone flat-L"]]),
      design(5, "man", { X: { route: "Hitch" } }),
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
