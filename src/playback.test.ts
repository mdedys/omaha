import { describe, expect, test } from "vitest";
import type { Design, Rep, RouteCall } from "./engine/contract";
import { loadPuzzle } from "./engine";
import puzzleOne from "../public/puzzles/1.json";
import { cubicBezier, playback, timeline } from "./playback";

const { puzzle, engine } = await loadPuzzle(puzzleOne);

// Puzzle 1 with the Slot WR read first, then the Left WR.
function slot(route: RouteCall): Design {
  return {
    protection: { blockers: 5, lineCall: "man" },
    routes: {
      X: { route: "Post", depth: 10 },
      Y: { route: "Hitch" },
      H: route,
      Z: { route: "Go" },
      RB: { route: "Flat" },
    },
    readOrder: ["H", "X"],
  };
}

// Thrown to the Slot WR at tick 38 and broken up; motion ends at tick 56.
const breakup = engine.simulate(puzzle, slot({ route: "Out", depth: 10 }));
// The nickel is free and sacks the QB at tick 41.
const sack = engine.simulate(puzzle, slot({ route: "Comeback", depth: 10 }));
// The QB drops 0.2 yards a tick from (0, -5) to (0, -7). He reads the Slot WR,
// then the Left WR from tick 21, and throws to him at tick 40 under pressure;
// the ball lands at tick 59, where motion ends.
const readChange = engine.simulate(puzzle, slot({ route: "Drag" }));

const tick = (ticks: number) => 0.8 + ticks * 0.05;

function at(frame: ReturnType<typeof playback>, id: string) {
  return frame.players.find(([player]) => player === id)?.[1];
}

describe("timeline", () => {
  test("places an incompletion's reveal 0.6s after motion ends", () => {
    const times = timeline(breakup);
    expect(times.snap).toBeCloseTo(0.8);
    expect(times.release).toBeCloseTo(2.7);
    expect(times.outcome).toBeCloseTo(3.6);
    expect(times.revealStart).toBeCloseTo(4.2);
    expect(times.end).toBeCloseTo(4.7);
  });

  test("starts a sack's outcome at the sack", () => {
    const { release, outcome } = timeline(sack);
    expect(release).toBeCloseTo(2.85);
    expect(outcome).toBe(release);
  });
});

describe("players", () => {
  test.each([0, 0.4, 0.79])(
    "hold their pre-snap spots at %fs of Set",
    (time) => {
      const preSnap = new Map(Object.entries(engine.preSnap(puzzle)));
      const frame = playback(breakup, time);
      expect(frame.players).toHaveLength(22);
      for (const [id, spot] of frame.players) {
        expect(spot).toEqual(preSnap.get(id));
      }
    },
  );

  test("advance one tick per TICK_SECONDS after Set", () => {
    expect(at(playback(readChange, tick(3)), "QB")?.y).toBeCloseTo(-5.6);
  });

  test("interpolate between ticks", () => {
    expect(at(playback(readChange, tick(2.5)), "QB")?.y).toBeCloseTo(-5.5);
  });

  test("stop at the last tick", () => {
    expect(at(playback(readChange, 9), "QB")).toEqual({ x: 0, y: -7 });
  });
});

describe("ball", () => {
  test("is not drawn before the throw", () => {
    expect(playback(readChange, tick(39.9)).ball).toBeNull();
  });

  test("leaves the QB's hands only after the throw tick", () => {
    expect(
      [tick(8), tick(8.5)].map((time) => playback(handRep(), time).ball),
    ).toEqual([
      null,
      {
        from: { x: 0, y: -9 },
        at: { x: expect.closeTo(2.5), y: expect.closeTo(-6.75) },
        angle: expect.closeTo(-42.0013, 3),
      },
    ]);
  });

  test("flies from the throw spot to the catch spot", () => {
    const ball = playback(readChange, tick(49.5)).ball;
    expect(ball?.at.x).toBeCloseTo(-2.9052, 4);
    expect(ball?.at.y).toBeCloseTo(4.4698, 4);
  });

  test("rests at the catch spot until the reveal", () => {
    expect(playback(readChange, tick(59) + 0.59).ball?.at).toEqual({
      x: -5.810303038032989,
      y: 15.93969696196701,
    });
  });

  test("hides at the reveal", () => {
    expect(playback(readChange, tick(59) + 0.6).ball).toBeNull();
  });

  test("is rotated along its flight", () => {
    expect(playback(readChange, tick(49.5)).ball?.angle).toBeCloseTo(
      -104.2065,
      3,
    );
  });
});

describe("phases", () => {
  const phases = (rep: Rep) => [
    ...new Set(
      Array.from(
        { length: 320 },
        (_, step) => playback(rep, step * 0.025).phase,
      ),
    ),
  ];

  test("run from Set through a throw to the reveal", () => {
    expect(phases(readChange)).toEqual([
      "set",
      "snap",
      "throw",
      "outcome",
      "reveal",
      "done",
    ]);
  });

  test("skip the throw on a sack", () => {
    expect(phases(sack)).toEqual(["set", "snap", "outcome", "reveal", "done"]);
  });
});

describe("reads", () => {
  test.each([
    [tick(10), "H"],
    [tick(30), "X"],
    [tick(50), "X"],
  ] as const)("at %fs the QB is on %s", (time, letter) => {
    expect(playback(readChange, time).read).toBe(letter);
  });
});

describe("vision cone", () => {
  test("is hidden during Set", () => {
    expect(playback(readChange, 0.7).cone).toBeNull();
  });

  test("fades in at the snap", () => {
    expect(playback(readChange, 0.85).cone?.opacity).toBeCloseTo(0.5);
  });

  test("aims at the first read", () => {
    expect(playback(readChange, tick(10)).cone?.angle).toBeCloseTo(-47.1353, 3);
  });

  test("aims at the next read once it has turned", () => {
    expect(playback(readChange, tick(30)).cone?.angle).toBeCloseTo(
      -125.8563,
      3,
    );
  });

  // Halfway through the turn the Slot WR is at -61.7538 degrees from the QB
  // and the Left WR at -130.3731.
  test("turns to the next read along the shorter arc", () => {
    const angle =
      playback(readChange, tick(21) + 0.075).cone?.angle ?? Number.NaN;
    expect(angle).toBeGreaterThan(-130.3731);
    expect(angle).toBeLessThan(-61.7538);
  });

  test.each([tick(40), tick(40) + 0.2])(
    "holds its aim after the throw at %fs",
    (time) => {
      expect(playback(readChange, time).cone?.angle).toBeCloseTo(-118.7072, 3);
    },
  );

  test.each([
    [0, 1],
    [0.15, 0.5],
  ])("%fs after the throw is at opacity %f", (after, opacity) => {
    expect(playback(readChange, tick(40) + after).cone?.opacity).toBeCloseTo(
      opacity,
    );
  });

  test.each([
    ["Slot WR's", breakup, 3],
    ["Left WR's", readChange, 3.1],
  ] as const)("is gone 0.3s after the %s throw", (_receiver, rep, time) => {
    expect(playback(rep, time).cone).toBeNull();
  });

  test("is gone 0.3s after a sack", () => {
    expect(playback(sack, 3.14).cone?.opacity).toBeGreaterThan(0);
    expect(playback(sack, 3.15).cone).toBeNull();
  });
});

test("reveal progresses linearly over 0.5s", () => {
  expect(playback(readChange, tick(59) + 0.6 + 0.25).reveal).toBeCloseTo(0.5);
});

test.each([
  [0.25, 0.4085],
  [0.5, 0.8024],
  [0.75, 0.9604],
])("cubicBezier(.25,.1,.25,1) at %f is %f", (x, y) => {
  expect(cubicBezier(0.25, 0.1, 0.25, 1)(x)).toBeCloseTo(y, 3);
});
