import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import type {
  CauseCode,
  DefensePlayArt,
  Rep,
  Vec,
  ZoneId,
} from "./engine/contract";
import { loadPuzzle } from "./engine";
import { Field, fieldPoint } from "./Field";
import { playback } from "./playback";
import { createPuzzleSession } from "./PuzzleScreen";
import fixture from "../public/puzzles/2.json";
import gunTrey from "./engine/stub/gun-trey.json";
import { scenarios } from "./engine/stub/fixtures";

describe("engine yard projection", () => {
  test.each([
    [
      { x: 0, y: 0 },
      { x: 201.5, y: 366 },
    ],
    [
      { x: 0, y: 10 },
      { x: 201.5, y: 238 },
    ],
    [
      { x: -15.75, y: 0 },
      { x: 0, y: 366 },
    ],
    [
      { x: 15.75, y: 0 },
      { x: 403, y: 366 },
    ],
  ])("maps %j to SVG coordinates", (input, expected) => {
    expect(fieldPoint(input)).toEqual(expected);
  });
});

test("creates an independent fresh puzzle draft", () => {
  const first = createPuzzleSession();
  first.draft.protection.blockers = 7;
  first.draft.routes.X = { route: "Go" };
  first.step = "Read";
  first.selected = "H";
  expect(createPuzzleSession()).toEqual({
    played: [],
    draft: {
      protection: { blockers: 5, lineCall: "man" },
      routes: {},
      readOrder: [],
    },
    step: "Protect",
    selected: null,
  });
});

test("renders the actual hashed quarterback location", async () => {
  const { puzzle, engine } = await loadPuzzle(fixture);
  const html = renderToStaticMarkup(createElement(Field, { puzzle, engine }));
  const qb = /data-player="QB" transform="translate\(([\d.]+) ([\d.]+)\)"/.exec(
    html,
  );
  expect(Number(qb?.[1])).toBeCloseTo(252.6746, 4);
  expect(Number(qb?.[2])).toBe(430);
});

test("renders flipped inside receiver at the engine location", async () => {
  const { puzzle, engine } = await loadPuzzle({
    ...fixture,
    formation: { ...fixture.formation, flip: true },
    situation: { ...fixture.situation, hash: "middle" },
  });
  const html = renderToStaticMarkup(createElement(Field, { puzzle, engine }));
  const y = /data-player="Y" transform="translate\(([\d.]+) ([\d.]+)\)"/.exec(
    html,
  );
  expect(Number(y?.[1])).toBeCloseTo(143.9286, 4);
  expect(Number(y?.[2])).toBe(372.4);
});

test("draws numbered read badges in read order", async () => {
  const { puzzle, engine } = await loadPuzzle(gunTrey);
  const html = renderToStaticMarkup(
    createElement(Field, {
      puzzle,
      engine,
      protection: { blockers: 5, lineCall: "man" },
      routes: scenarios[0].design.routes,
      reads: ["Y", "Z", "X"],
    }),
  );
  const badges = [
    ...html.matchAll(/data-read-badge="(\w+)".*?<text[^>]*>(\d)/g),
  ];
  expect(badges.map(([, letter, number]) => `${letter}${number}`)).toEqual([
    "Y1",
    "Z2",
    "X3",
  ]);
});

test("draws reads' routes at 2.4 and the rest at 2", async () => {
  const { puzzle, engine } = await loadPuzzle(gunTrey);
  const html = renderToStaticMarkup(
    createElement(Field, {
      puzzle,
      engine,
      protection: { blockers: 5, lineCall: "man" },
      routes: scenarios[0].design.routes,
      reads: ["H"],
    }),
  );
  const widths = Object.fromEntries(
    [...html.matchAll(/data-route="(\w+)"[^>]*stroke-width="([\d.]+)"/g)].map(
      ([, letter, width]) => [letter, width],
    ),
  );
  expect(widths).toEqual({ X: "2", Y: "2", Z: "2", H: "2.4", RB: "2" });
});

test("flips a read badge that would cross the right sideline", async () => {
  const { puzzle, engine } = await loadPuzzle(gunTrey);
  const html = renderToStaticMarkup(
    createElement(Field, {
      puzzle,
      engine: {
        ...engine,
        preSnap: (target) => ({
          ...engine.preSnap(target),
          Z: { x: 15, y: 0 },
        }),
      },
      protection: { blockers: 5, lineCall: "man" },
      routes: scenarios[0].design.routes,
      reads: ["Z", "X"],
    }),
  );
  const badgeX = (letter: string) =>
    Number(
      new RegExp(
        `data-read-badge="${letter}" transform="translate\\(([\\d.]+)`,
      ).exec(html)?.[1],
    );
  expect(badgeX("Z")).toBeCloseTo(380.4048, 4);
  expect(badgeX("X")).toBeCloseTo(64.1746, 4);
});

test("places every player at the rep's final tick", async () => {
  const { puzzle, engine } = await loadPuzzle(gunTrey);
  const html = renderToStaticMarkup(
    createElement(Field, {
      puzzle,
      engine,
      frame: { rep: scenarios[0].rep, playArt: { zones: [], assignments: {} } },
    }),
  );
  expect(html).toContain('data-player="QB" transform="translate(201.5 455.6)"');
  expect(html).toContain('data-player="NB" transform="translate(201.5 455.6)"');
  expect([...html.matchAll(/data-player=/g)]).toHaveLength(22);
});

function causeRep(code: CauseCode): Rep {
  const scenario = scenarios.find((entry) => entry.rep.cause.code === code);
  if (!scenario) throw new Error(`No stub scenario for ${code}`);
  return structuredClone(scenario.rep);
}

async function resultField(rep: Rep, playArt: DefensePlayArt = rep.playArt) {
  const { puzzle, engine } = await loadPuzzle(gunTrey);
  return renderToStaticMarkup(
    createElement(Field, { puzzle, engine, frame: { rep, playArt } }),
  );
}

function tag(html: string, attribute: string) {
  const match = new RegExp(`<\\w+ ${attribute}[^>]*>`).exec(html);
  if (!match) throw new Error(`No element with ${attribute}`);
  return match[0];
}

function attr(element: string, name: string) {
  return new RegExp(` ${name}="([^"]*)"`).exec(element)?.[1];
}

function pathPoints(d: string | undefined) {
  return (d ?? "")
    .split("M")
    .slice(1)
    .map((subpath) =>
      subpath.split("L").map((pair) => {
        const [x, y] = pair.trim().split(" ").map(Number);
        return { x, y };
      }),
    );
}

const distance = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);

describe("result play art", () => {
  test.each([
    [
      "the full art",
      undefined,
      ["hook-R", "hook-L", "hook-M", "deep-middle", "NB"],
    ],
    ["hidden art", { zones: [], assignments: {} }, []],
  ])("draws only %s it is given", async (_, playArt, drawn) => {
    const html = await resultField(causeRep("sack-free-rusher"), playArt);
    expect(
      [...html.matchAll(/data-(?:zone|defense-path)="([^"]+)"/g)].map(
        ([, id]) => id,
      ),
    ).toEqual(drawn);
  });

  test.each([
    ["deep-third-L", "#3D7BFF"],
    ["flat-R", "#7FD8FF"],
    ["hook-M", "#FFD84A"],
    ["curl-flat-L", "#B57CFF"],
  ] as const)(
    "fills a %s zone in its Madden colour at 30%% and strokes it at 85%%",
    async (zone: ZoneId, color) => {
      const html = await resultField(causeRep("converted"), {
        zones: [
          {
            defenderId: "LB2",
            zone,
            center: { x: 0, y: 8 },
            radii: { x: 4, y: 3 },
          },
        ],
        assignments: { LB2: "zone" },
      });
      const ellipse = tag(html, `data-zone="${zone}"`);
      expect({
        fill: attr(ellipse, "fill"),
        fillOpacity: attr(ellipse, "fill-opacity"),
        stroke: attr(ellipse, "stroke"),
        strokeOpacity: attr(ellipse, "stroke-opacity"),
      }).toEqual({
        fill: color,
        fillOpacity: ".3",
        stroke: color,
        strokeOpacity: ".85",
      });
    },
  );

  test("places a zone at its engine centre and radii", async () => {
    const html = await resultField(causeRep("converted"));
    const ellipse = tag(html, 'data-zone="hook-L"');
    expect(Number(attr(ellipse, "cx"))).toBeCloseTo(150.3254, 4);
    expect(Number(attr(ellipse, "cy"))).toBe(238);
    expect(Number(attr(ellipse, "rx"))).toBeCloseTo(63.9683, 4);
    expect(Number(attr(ellipse, "ry"))).toBe(51.2);
  });

  test.each([
    ["interception-closed", "S1", "drop", "#3D7BFF", "1.8", 1],
    ["interception-forced", "LB1", "drop", "#FFD84A", "1.8", 1],
    ["breakup-closed", "CB1", "man", "#C4CFC8", "1.8", 2],
    ["sack-beat-block", "DL1", "rush", "#C4CFC8", "1.8", 2],
    ["sack-free-rusher", "NB", "blitz", "#E05A2B", "2.4", 2],
  ] as const)(
    "draws the %s defender %s's track as a %s line",
    async (code, id, kind, stroke, width, subpaths) => {
      const path = tag(
        await resultField(causeRep(code)),
        `data-defense-path="${id}"`,
      );
      expect({
        kind: attr(path, "data-path-kind"),
        stroke: attr(path, "stroke"),
        width: attr(path, "stroke-width"),
        subpaths: pathPoints(attr(path, "d")).length,
      }).toEqual({ kind, stroke, width, subpaths });
    },
  );

  test("starts a defender's line at its track's first point", async () => {
    const path = tag(
      await resultField(causeRep("interception-closed")),
      'data-defense-path="S1"',
    );
    expect(pathPoints(attr(path, "d"))[0][0]).toEqual({ x: 201.5, y: 174 });
  });

  test("ends a defender's line 10.5 short of its final spot", async () => {
    const path = tag(
      await resultField(causeRep("interception-closed")),
      'data-defense-path="S1"',
    );
    const line = pathPoints(attr(path, "d"))[0];
    expect(
      distance(line[line.length - 1], { x: 99.15079365079364, y: 238 }),
    ).toBeCloseTo(10.5, 6);
  });

  test("draws an open arrowhead with 5-unit arms at 38 degrees", async () => {
    const path = tag(
      await resultField(causeRep("breakup-closed")),
      'data-defense-path="CB1"',
    );
    const [line, [left, tip, right]] = pathPoints(attr(path, "d"));
    const before = line[line.length - 2];
    const back = Math.atan2(before.y - tip.y, before.x - tip.x);
    const angle = (arm: Vec) => {
      const turn =
        ((Math.atan2(arm.y - tip.y, arm.x - tip.x) - back) * 180) / Math.PI;
      return Math.abs(((turn + 540) % 360) - 180);
    };
    expect(tip).toEqual(line[line.length - 1]);
    expect(distance(left, tip)).toBeCloseTo(5, 6);
    expect(distance(right, tip)).toBeCloseTo(5, 6);
    expect(angle(left)).toBeCloseTo(38, 6);
    expect(angle(right)).toBeCloseTo(38, 6);
  });

  test.each([
    ["DL1", true],
    ["NB", false],
  ] as const)(
    "draws a moving lineman's rush only when he made the sack (sacker %s)",
    async (decisive, drawn) => {
      const rep = causeRep("sack-beat-block");
      rep.cause.decisive = decisive;
      const html = await resultField(rep);
      expect(html.includes('data-defense-path="DL1"')).toBe(drawn);
    },
  );

  test("puts a start dot only on defenders with a line", async () => {
    const rep = causeRep("sack-free-rusher");
    rep.tracks.DL1 = causeRep("sack-beat-block").tracks.DL1;
    const html = await resultField(rep);
    expect(
      [
        ...html.matchAll(/data-start-dot="(\w+)" cx="([\d.]+)" cy="([\d.]+)"/g),
      ].map(([, id, x, y]) => [id, Number(x), Number(y)]),
    ).toEqual([["NB", 303.8492063492064, 302]]);
  });
});

function translate(element: string) {
  const [x, y] = (/translate\(([^)]+)\)/.exec(element)?.[1] ?? "")
    .split(" ")
    .map(Number);
  return { x, y };
}

describe("receiver feedback badges", () => {
  test.each([
    ["X", "covered", "M-2.6 -2.6L2.6 2.6M2.6 -2.6L-2.6 2.6"],
    ["Y", "contested", "M-3.6 0.6Q-1.8 -2.2 0 0.4T3.6 0"],
    ["H", "open", "M-3.2 0.2L-1 2.5L3.3 -2.3"],
  ])("draws %s's %s badge by its glyph", async (letter, badge, glyph) => {
    const html = await resultField(causeRep("breakup-closed"));
    const group = new RegExp(
      `data-feedback-badge="${letter}" data-badge="([a-z]+)"[^>]*>.*?<path d="([^"]+)"`,
    ).exec(html);
    expect([group?.[1], group?.[2]]).toEqual([badge, glyph]);
  });

  test("offsets a badge up and right of its receiver", async () => {
    const html = await resultField(causeRep("breakup-closed"));
    const at = translate(tag(html, 'data-feedback-badge="Y"'));
    expect(at.x).toBeCloseTo(259.0714 + 11, 4);
    expect(at.y).toBeCloseTo(212.4 - 11, 4);
  });

  test.each([
    ["the right sideline", { x: 15, y: 12 }, { x: 393.4048, y: 212.4 }],
    ["a player", { x: 0, y: 12 }, { x: 201.5, y: 212.4 }],
  ])(
    "flips a badge up-left when up-right would cover %s",
    async (_, spot, receiver) => {
      const rep = causeRep("breakup-closed");
      rep.tracks.Z = rep.tracks.Z.map(() => spot);
      rep.tracks.CB2 = rep.tracks.CB2.map(() => ({ x: 0.86, y: 12.86 }));
      const at = translate(
        tag(await resultField(rep), 'data-feedback-badge="Z"'),
      );
      expect(at.x).toBeCloseTo(receiver.x - 11, 4);
      expect(at.y).toBeCloseTo(receiver.y - 11, 4);
    },
  );
});

describe("result ball", () => {
  test("draws a dashed path from the throw to the ball's end", async () => {
    const path = tag(
      await resultField(causeRep("breakup-closed")),
      "data-ball-path",
    );
    expect([attr(path, "d"), attr(path, "stroke-dasharray")]).toEqual([
      "M201.5 447.06666666666666L99.15079365079364 238",
      "2 5",
    ]);
  });

  test("ends a throwaway's path at its landing spot past the sideline", async () => {
    const path = tag(
      await resultField(causeRep("throwaway")),
      "data-ball-path",
    );
    const points = pathPoints(attr(path, "d"))[0];
    expect(points[points.length - 1].x).toBeCloseTo(-3.1984, 4);
    expect(points[points.length - 1].y).toBeCloseTo(455.6, 4);
  });

  test.each([
    ["sack-free-rusher", 0],
    ["sack-beat-block", 0],
    ["throwaway", 1],
    ["breakup-closed", 1],
    ["breakup-forced", 1],
    ["interception-closed", 1],
    ["interception-forced", 1],
    ["short", 1],
    ["converted", 1],
    ["touchdown", 1],
  ] as const)("draws %s with %i ball paths", async (code, count) => {
    const html = await resultField(causeRep(code));
    expect([...html.matchAll(/data-ball-path/g)]).toHaveLength(count);
  });

  test.each([
    ["sack-free-rusher", 0],
    ["throwaway", 0],
    ["breakup-closed", 0],
    ["breakup-forced", 0],
    ["interception-closed", 1],
    ["interception-forced", 1],
    ["short", 0],
    ["converted", 0],
  ] as const)("draws %s with %i footballs", async (code, count) => {
    const html = await resultField(causeRep(code));
    expect([...html.matchAll(/data-football/g)]).toHaveLength(count);
  });

  test("draws an interception's football at the ball's end", async () => {
    const football = tag(
      await resultField(causeRep("interception-closed")),
      "data-football",
    );
    expect([attr(football, "cx"), attr(football, "cy")]).toEqual([
      "99.15079365079364",
      "238",
    ]);
  });
});

test.each([
  ["converted", "3.5"],
  ["short", "2"],
  ["breakup-closed", "2"],
] as const)("draws a %s rep's line to gain at %s", async (code, width) => {
  const line = tag(
    await resultField(causeRep(code)),
    'data-field-layer="line-to-gain"',
  );
  expect(attr(line, "stroke-width")).toBe(width);
});

async function field(props: Partial<Parameters<typeof Field>[0]>) {
  const { puzzle, engine } = await loadPuzzle(gunTrey);
  return renderToStaticMarkup(
    createElement(Field, { puzzle, engine, ...props }),
  );
}

describe("live play field", () => {
  test.each([
    "data-zone",
    "data-defense-path",
    "data-start-dot",
    "data-feedback-badge",
    "data-ball-path",
  ])("draws %s only once the reveal starts", async (attribute) => {
    const rep = causeRep("breakup-closed");
    const playing = await field({ live: playback(rep, 4.3) });
    const revealing = await field({
      frame: { rep, playArt: rep.playArt },
      reveal: 0,
    });
    expect([
      playing.includes(attribute),
      revealing.includes(attribute),
    ]).toEqual([false, true]);
  });

  test("draws the players where the clock has them", async () => {
    const html = await field({
      live: playback(causeRep("breakup-closed"), 0.8 + 30 * 0.05),
    });
    expect(attr(tag(html, 'data-player="QB"'), "transform")).toBe(
      "translate(201.5 442.8)",
    );
  });

  test("draws the football in flight", async () => {
    const football = tag(
      await field({ live: playback(causeRep("breakup-closed"), 3.3) }),
      'data-football="in-flight"',
    );
    expect(Number(attr(football, "cx"))).toBeCloseTo(150.3254, 3);
    expect(Number(attr(football, "cy"))).toBeCloseTo(342.5333, 3);
  });

  test("draws the vision cone on the current read", async () => {
    const html = await field({
      live: playback(causeRep("breakup-closed"), 1.5),
    });
    expect(attr(tag(html, "data-vision-cone"), "data-vision-cone")).toBe("X");
  });

  test.each([
    [0, "0 -180 403 872"],
    [0.5, "0 -90 403 872"],
    [1, "0 0 403 872"],
  ])("pans the phone camera at %f to %s", async (pan, viewBox) => {
    expect(
      attr(tag(await field({ pan }), 'class="puzzle-field"'), "viewBox"),
    ).toBe(viewBox);
  });

  test.each(["M0 -18H403", "M0 814H403"])(
    "continues the yard lines over the phone's extra range with %s",
    async (line) => {
      expect([
        (await field({ pan: 0 })).includes(`d="${line}"`),
        (await field({})).includes(`d="${line}"`),
      ]).toEqual([true, false]);
    },
  );

  test("fades a converted line in with the play art", async () => {
    const rep = causeRep("converted");
    const html = await field({
      frame: { rep, playArt: rep.playArt },
      reveal: 0.4,
    });
    expect({
      line: attr(tag(html, 'data-field-layer="line-to-gain"'), "stroke-width"),
      converted: [
        attr(tag(html, 'data-field-layer="converted-line"'), "stroke-width"),
        attr(tag(html, 'data-field-layer="converted-line"'), "opacity"),
      ],
      zone: attr(tag(html, "data-zone"), "opacity"),
    }).toEqual({ line: "2", converted: ["3.5", "0.4"], zone: "0.4" });
  });

  test("keeps an interception's football solid while the art fades", async () => {
    const rep = causeRep("interception-closed");
    const html = await field({
      frame: { rep, playArt: rep.playArt },
      reveal: 0.3,
    });
    expect([
      attr(tag(html, "data-ball-path"), "opacity"),
      attr(tag(html, "data-football"), "opacity"),
    ]).toEqual(["0.3", undefined]);
  });
});
