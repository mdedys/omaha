import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { loadPuzzle } from "./engine";
import { Field } from "./Field";
import fixture from "../public/puzzles/1.json";

test("anchors five-yard stripes to the nearer goal line", async () => {
  const { puzzle, engine } = await loadPuzzle(fixture);
  const html = renderToStaticMarkup(createElement(Field, { puzzle, engine }));
  expect(html).toContain('y="174" width="403" height="64" fill="#0F3A27"');
  expect(html).toContain('y="238" width="403" height="64" fill="#113F2A"');
});

test("draws ten-yard numbers four yards inside the sidelines", async () => {
  const { puzzle, engine } = await loadPuzzle(fixture);
  const html = renderToStaticMarkup(createElement(Field, { puzzle, engine }));
  expect(html).toContain('<text x="51.2" y="294">50</text>');
  expect(html).toContain('<text x="351.8" y="294">50</text>');
});

test("draws hashes at each visible yard", async () => {
  const { puzzle, engine } = await loadPuzzle(fixture);
  const html = renderToStaticMarkup(createElement(Field, { puzzle, engine }));
  expect(html).toContain('d="M141 366H155M247 366H261"');
  expect(html).toContain('d="M141 302H155M247 302H261"');
});
