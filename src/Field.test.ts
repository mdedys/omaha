import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { loadPuzzle } from "./engine";
import { Field, fieldPoint } from "./Field";
import { createPuzzleSession } from "./PuzzleScreen";
import fixture from "../public/puzzles/2.json";

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
  expect(createPuzzleSession()).toEqual({
    rep: 1,
    draft: {
      protection: { blockers: 5, lineCall: "man" },
      routes: {},
      readOrder: [],
    },
    step: "Protect",
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
  expect(Number(y?.[1])).toBeCloseTo(150.3254, 4);
  expect(Number(y?.[2])).toBe(366);
});
