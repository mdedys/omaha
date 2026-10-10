import type { Page } from "@playwright/test";

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
  ["Slot WR", "Out"],
  ["Right WR", "Go"],
  ["RB", "Flat"],
];

export async function snapFirstRep(page: Page, leftRoute: string) {
  await page.goto("/puzzle/1");
  await page.getByRole("button", { name: "Next: routes" }).click();
  await page.getByRole("option", { name: leftRoute, exact: true }).click();
  for (const [receiver, route] of routes) {
    await page
      .getByRole("button", { name: `${receiver}, no route`, exact: true })
      .click();
    await page.getByRole("option", { name: route, exact: true }).click();
  }
  await page.getByRole("button", { name: "Next: read" }).click();
  await page.getByRole("button", { name: "TE, Hitch", exact: true }).click();
  await page.getByRole("button", { name: "Snap" }).click();
  await page.getByRole("button", { name: "Skip to result" }).click();
}

export async function runItBack(page: Page, leftRoute: string) {
  await page.getByRole("button", { name: "Run it back" }).click();
  await page.getByRole("button", { name: "Next: routes" }).click();
  await page.getByRole("button", { name: /^Left WR,/ }).click();
  await page.getByRole("option", { name: leftRoute, exact: true }).click();
  await page.getByRole("button", { name: "Next: read" }).click();
  await page.getByRole("button", { name: "Snap" }).click();
  await page.getByRole("button", { name: "Skip to result" }).click();
}
