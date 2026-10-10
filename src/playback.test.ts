import { describe, expect, test } from "vitest";
import type { Rep, Vec } from "./engine/contract";
import { loadPuzzle } from "./engine";
import gunTrey from "./engine/stub/gun-trey.json";
import { scenarios } from "./engine/stub/fixtures";
import { cubicBezier, playback, timeline } from "./playback";

function stubRep(route: string): Rep {
  const scenario = scenarios.find(
    (entry) => entry.design.routes.X?.route === route,
  );
  if (!scenario) throw new Error(`No stub scenario for ${route}`);
  return scenario.rep;
}

const still = (at: Vec) => Array.from({ length: 13 }, () => at);

// Twelve ticks: the QB drops half a yard a tick from (0, -5), X waits up and
// to his left, Y up and to his right. The QB reads X, then Y from tick 3, and
// throws to Y at tick 8; the ball lands at tick 10.
function handRep(overrides: Partial<Rep> = {}): Rep {
  const base = stubRep("Out");
  return {
    ...base,
    endTick: 12,
    tracks: {
      ...base.tracks,
      QB: Array.from({ length: 13 }, (_, tick) => ({ x: 0, y: -5 - tick / 2 })),
      X: still({ x: -10, y: 0 }),
      Y: still({ x: 10, y: 0 }),
    },
    reads: [
      { letter: "X", fromTick: 0, toTick: 3 },
      { letter: "Y", fromTick: 3, toTick: 8 },
    ],
    ball: {
      from: { x: 0, y: -9 },
      to: { x: 10, y: 0 },
      throwTick: 8,
      arriveTick: 10,
      target: "Y",
    },
    timeInPocketTicks: 8,
    ...overrides,
  };
}

const tick = (ticks: number) => 0.8 + ticks * 0.05;

function at(frame: ReturnType<typeof playback>, id: string) {
  return frame.players.find(([player]) => player === id)?.[1];
}

describe("timeline", () => {
  test("places a stub incompletion's reveal 0.6s after motion ends", () => {
    const times = timeline(stubRep("Out"));
    expect(times.snap).toBeCloseTo(0.8);
    expect(times.release).toBeCloseTo(2.8);
    expect(times.outcome).toBeCloseTo(3.8);
    expect(times.revealStart).toBeCloseTo(4.4);
    expect(times.end).toBeCloseTo(4.9);
  });

  test("starts a sack's outcome at the sack", () => {
    const { release, outcome } = timeline(stubRep("In"));
    expect(release).toBeCloseTo(2.8);
    expect(outcome).toBe(release);
  });
});

describe("players", () => {
  test.each([0, 0.4, 0.79])(
    "hold their pre-snap spots at %fs of Set",
    async (time) => {
      const { puzzle, engine } = await loadPuzzle(gunTrey);
      const preSnap = new Map(Object.entries(engine.preSnap(puzzle)));
      const frame = playback(stubRep("Out"), time);
      expect(frame.players).toHaveLength(22);
      for (const [id, spot] of frame.players) {
        expect(spot).toEqual(preSnap.get(id));
      }
    },
  );

  test("advance one tick per TICK_SECONDS after Set", () => {
    expect(at(playback(handRep(), tick(3)), "QB")?.y).toBeCloseTo(-6.5);
  });

  test("interpolate between ticks", () => {
    expect(at(playback(handRep(), tick(2.5)), "QB")?.y).toBeCloseTo(-6.25);
  });

  test("stop at the last tick", () => {
    expect(at(playback(handRep(), 9), "QB")).toEqual({ x: 0, y: -11 });
  });
});

describe("ball", () => {
  test("is not drawn before the throw", () => {
    expect(playback(handRep(), tick(7.9)).ball).toBeNull();
  });

  test("flies from the throw spot to the catch spot", () => {
    const ball = playback(handRep(), tick(9)).ball;
    expect(ball?.at.x).toBeCloseTo(5);
    expect(ball?.at.y).toBeCloseTo(-4.5);
  });

  test("rests at the catch spot until the reveal", () => {
    expect(playback(handRep(), tick(12) + 0.59).ball?.at).toEqual({
      x: 10,
      y: 0,
    });
  });

  test("hides at the reveal", () => {
    expect(playback(handRep(), tick(12) + 0.6).ball).toBeNull();
  });

  test("is rotated along its flight", () => {
    expect(playback(handRep(), tick(9)).ball?.angle).toBeCloseTo(-42.0013, 3);
  });
});

describe("phases", () => {
  const phases = (rep: Rep) => [
    ...new Set(
      Array.from(
        { length: 120 },
        (_, step) => playback(rep, step * 0.025).phase,
      ),
    ),
  ];

  test("run from Set through a throw to the reveal", () => {
    expect(phases(handRep())).toEqual([
      "set",
      "snap",
      "throw",
      "outcome",
      "reveal",
      "done",
    ]);
  });

  test("skip the throw on a sack", () => {
    expect(phases(handRep({ ball: null }))).toEqual([
      "set",
      "snap",
      "outcome",
      "reveal",
      "done",
    ]);
  });
});

describe("reads", () => {
  test.each([
    [tick(2), "X"],
    [tick(5), "Y"],
    [tick(11), "Y"],
  ] as const)("at %fs the QB is on %s", (time, letter) => {
    expect(playback(handRep(), time).read).toBe(letter);
  });
});

describe("vision cone", () => {
  test("is hidden during Set", () => {
    expect(playback(handRep(), 0.7).cone).toBeNull();
  });

  test("fades in at the snap", () => {
    expect(playback(handRep(), 0.85).cone?.opacity).toBeCloseTo(0.5);
  });

  test("aims at the first read", () => {
    expect(playback(handRep(), tick(2)).cone?.angle).toBeCloseTo(-149.0237, 3);
  });

  test("aims at the next read once it has turned", () => {
    expect(playback(handRep(), tick(7)).cone?.angle).toBeCloseTo(-40.3786, 3);
  });

  test("turns to the next read along the shorter arc", () => {
    const angle = playback(handRep(), tick(4.5)).cone?.angle ?? Number.NaN;
    expect(angle).toBeGreaterThan(-144.0444);
    expect(angle).toBeLessThan(-35.9556);
  });

  test("holds its aim after the throw", () => {
    const moving = handRep({
      tracks: {
        ...handRep().tracks,
        Y: Array.from({ length: 13 }, (_, at) => ({ x: 10 - at, y: 0 })),
      },
    });
    expect(playback(moving, tick(8) + 0.2).cone?.angle).toBe(
      playback(moving, tick(8)).cone?.angle,
    );
  });

  test.each([
    [0, 1],
    [0.15, 0.5],
  ])("%fs after the throw is at opacity %f", (after, opacity) => {
    expect(playback(handRep(), tick(8) + after).cone?.opacity).toBeCloseTo(
      opacity,
    );
  });

  test("is gone 0.3s after the throw", () => {
    expect(playback(handRep(), tick(8) + 0.3).cone).toBeNull();
  });

  test("is gone 0.3s after a sack", () => {
    const sack = handRep({ ball: null, timeInPocketTicks: 5 });
    expect(playback(sack, tick(5) + 0.29).cone?.opacity).toBeGreaterThan(0);
    expect(playback(sack, tick(5) + 0.3).cone).toBeNull();
  });
});

test("reveal progresses linearly over 0.5s", () => {
  expect(playback(handRep(), tick(12) + 0.6 + 0.25).reveal).toBeCloseTo(0.5);
});

test.each([
  [0.25, 0.4085],
  [0.5, 0.8024],
  [0.75, 0.9604],
])("cubicBezier(.25,.1,.25,1) at %f is %f", (x, y) => {
  expect(cubicBezier(0.25, 0.1, 0.25, 1)(x)).toBeCloseTo(y, 3);
});
