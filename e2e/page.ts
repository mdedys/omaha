import type { Page } from "@playwright/test";
import puzzleOne from "../public/puzzles/1.json" with { type: "json" };
import tutorial from "../src/tutorial.json" with { type: "json" };

// Serves puzzle 1 against the tutorial's fixed defense, so the reps these
// tests pin don't change when puzzle 1's defense does.
export function pinPuzzleOne(page: Page) {
  return page.route("**/puzzles/1.json", (route) =>
    route.fulfill({ json: { ...puzzleOne, defense: tutorial.defense } }),
  );
}

// Resolves after the tasks already queued, such as React's render of the
// last animation frame. The page clock doesn't fake message channels.
export function rendered(page: Page) {
  return page.evaluate(
    () =>
      new Promise((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = resolve;
        channel.port2.postMessage(null);
      }),
  );
}

// The screen as markup: React leaves an empty style attribute where an inline
// style was removed, which draws nothing.
export function screenMarkup(page: Page) {
  return page
    .locator("main")
    .evaluate((main) => main.outerHTML.replaceAll(' style=""', ""));
}

// A puzzle index entry at 3rd & 10 from the own 45.
export function indexEntry(
  number: number,
  date: string,
  label = "Field goal won't cut it.",
) {
  return { number, date, down: 3, distance: 10, spot: 45, label };
}

export const routes = [
  ["TE", "Hitch"],
  ["Right WR", "Go"],
  ["RB", "Flat"],
];

// On puzzle 1, with the Slot WR read first, the Slot WR's route picks the
// outcome: Out breaks up, Hitch is short, Comeback is sacked, Post is
// intercepted and In converts.
export async function snapFirstRep(
  page: Page,
  slotRoute: string,
  reads = [`Slot WR, ${slotRoute}`, "Left WR, Post"],
) {
  await page.goto("/puzzle/1");
  await page.getByRole("button", { name: "Next: routes" }).click();
  await page.getByRole("option", { name: "Post", exact: true }).click();
  for (const [receiver, route] of [...routes, ["Slot WR", slotRoute]]) {
    await page
      .getByRole("button", { name: `${receiver}, no route`, exact: true })
      .click();
    await page.getByRole("option", { name: route, exact: true }).click();
  }
  await page.getByRole("button", { name: "Next: read" }).click();
  for (const read of reads) {
    await page.getByRole("button", { name: read, exact: true }).click();
  }
  await page.getByRole("button", { name: "Snap" }).click();
  await page.getByRole("button", { name: "Skip to result" }).click();
}

export async function runItBack(page: Page, slotRoute: string) {
  await page.getByRole("button", { name: "Run it back" }).click();
  await page.getByRole("button", { name: "Next: routes" }).click();
  await page.getByRole("button", { name: /^Slot WR,/ }).click();
  await page.getByRole("option", { name: slotRoute, exact: true }).click();
  await page.getByRole("button", { name: "Next: read" }).click();
  await page.getByRole("button", { name: "Snap" }).click();
  await page.getByRole("button", { name: "Skip to result" }).click();
}
