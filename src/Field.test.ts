import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { loadPuzzle } from "./engine";
import { Field, fieldPoint } from "./Field";
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
    createElement(Field, { puzzle, engine, frame: scenarios[0].rep }),
  );
  expect(html).toContain('data-player="QB" transform="translate(201.5 455.6)"');
  expect(html).toContain('data-player="NB" transform="translate(201.5 455.6)"');
  expect([...html.matchAll(/data-player=/g)]).toHaveLength(22);
});
