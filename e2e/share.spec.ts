import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { runItBack, snapFirstRep } from "./page";

const convertedText =
  "Omaha #1 · 3rd & 10\n🟥🟩\nConverted in 2 · Beat the pros · 78 pts";

async function convert(page: Page) {
  await snapFirstRep(page, "Out");
  await runItBack(page, "Comeback");
}

async function runOutOfReps(page: Page) {
  await snapFirstRep(page, "Out");
  await runItBack(page, "Go");
  await runItBack(page, "In");
  await runItBack(page, "Post");
}

async function openShare(page: Page) {
  await page
    .getByLabel("Rep result")
    .getByRole("button", { name: "Share result" })
    .click();
}

function card(page: Page) {
  return page.getByRole("region", { name: "Share card preview" });
}

function liveRegion(page: Page) {
  return page.locator("[aria-live=polite]");
}

async function grantClipboard(page: Page) {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
}

function clipboard(page: Page) {
  return page.evaluate(() => navigator.clipboard.readText());
}

test("the converted sheet's Share result opens Share for the puzzle", async ({
  page,
}) => {
  await convert(page);
  await openShare(page);
  await expect(page).toHaveURL("/puzzle/1/share");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("CONVERTED");
  await expect(
    page.getByText("3rd & 10 · in 2 reps · +13 yards"),
  ).toBeVisible();
  await expect(card(page).locator(".share-card-top")).toHaveText(
    "OMAHA #13rd & 10",
  );
  await expect(card(page).locator(".share-card-footer")).toHaveText(
    "Beat the pros78 pts",
  );
});

test("the out-of-reps sheet's Share result opens Share for the puzzle", async ({
  page,
}) => {
  await runOutOfReps(page);
  await openShare(page);
  await expect(page).toHaveURL("/puzzle/1/share");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "OUT OF REPS",
  );
  await expect(card(page).locator(".share-card-footer")).toHaveText(
    "Didn't beat the pros0 pts",
  );
  await expect(page.locator(".share-you")).toHaveText("YouNo first down");
});

test("a converted card shows a tile for each rep, labelled", async ({
  page,
}) => {
  await convert(page);
  await openShare(page);
  const tiles = card(page).getByRole("img", {
    name: "Rep 1 incomplete, rep 2 converted, rep 3 not needed, rep 4 not needed",
  });
  await expect(tiles.locator(".share-rep-label")).toHaveText([
    "Rep 1Incomplete",
    "Rep 2Converted",
    "Rep 3—",
    "Rep 4—",
  ]);
  const faces = tiles.locator(".share-tile");
  await expect(faces.nth(0)).toHaveCSS("background-color", "rgb(224, 90, 43)");
  await expect(faces.nth(1)).toHaveCSS("background-color", "rgb(92, 201, 138)");
  await expect(faces.nth(2)).toHaveCSS("border-style", "dashed");
  await expect(faces.nth(3)).toHaveCSS("border-style", "dashed");
});

test("an out-of-reps card shows each failed and short rep, labelled", async ({
  page,
}) => {
  await runOutOfReps(page);
  await openShare(page);
  const tiles = card(page).getByRole("img", {
    name: "Rep 1 incomplete, rep 2 short, +7, rep 3 sacked, rep 4 picked",
  });
  await expect(tiles.locator(".share-rep-label")).toHaveText([
    "Rep 1Incomplete",
    "Rep 2Short",
    "Rep 3Sacked",
    "Rep 4Picked",
  ]);
  const faces = tiles.locator(".share-tile");
  await expect(faces.nth(1)).toHaveText("+7");
  await expect(faces.nth(1)).toHaveCSS("background-color", "rgb(244, 177, 62)");
  for (const index of [0, 2, 3]) {
    await expect(faces.nth(index)).toHaveCSS(
      "background-color",
      "rgb(224, 90, 43)",
    );
  }
});

test("score and the pros come from the result, other stats unavailable", async ({
  page,
}) => {
  await convert(page);
  await openShare(page);
  await expect(page.locator(".share-pros")).toHaveText("The prosIncomplete");
  await expect(page.locator(".share-stat")).toHaveText([
    "78score",
    "—day streak",
    "—beat the pros",
  ]);
});

test("Copy writes the result to the clipboard and confirms it", async ({
  page,
}) => {
  await grantClipboard(page);
  await convert(page);
  await openShare(page);
  const copy = page.getByRole("button", { name: "Copy result" });
  await copy.click();
  await expect(copy).toHaveText("Copied");
  await expect(liveRegion(page)).toHaveText("Copied to clipboard");
  expect(await clipboard(page)).toBe(convertedText);
});

test("Copy writes the out-of-reps result", async ({ page }) => {
  await grantClipboard(page);
  await runOutOfReps(page);
  await openShare(page);
  await page.getByRole("button", { name: "Copy result" }).click();
  await expect(liveRegion(page)).toHaveText("Copied to clipboard");
  expect(await clipboard(page)).toBe(
    "Omaha #1 · 3rd & 10\n🟥🟨🟥🟥\nOut of reps · 0 pts",
  );
});

test("Copied shows for 2 seconds, then the button goes back", async ({
  page,
}) => {
  await grantClipboard(page);
  await page.clock.install({ time: new Date("2026-10-10T16:00:00Z") });
  await convert(page);
  await openShare(page);
  await page.clock.pauseAt(new Date("2026-10-10T17:00:00Z"));
  const copy = page.getByRole("button", { name: "Copy result" });
  await copy.click();
  await expect(copy).toHaveText("Copied");
  await page.clock.runFor(1999);
  await expect(copy).toHaveText("Copied");
  await page.clock.runFor(1);
  await expect(copy).toHaveText("");
  await expect(liveRegion(page)).toHaveText("");
});

test("Share hands the result to the share sheet where it exists", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      value: (data: ShareData) => {
        Object.assign(window, { shared: data });
        return Promise.resolve();
      },
    });
  });
  await convert(page);
  await openShare(page);
  await page.getByRole("button", { name: "Share result" }).click();
  expect(
    await page.evaluate(() => ("shared" in window ? window.shared : null)),
  ).toEqual({ text: convertedText });
  await expect(page.getByRole("button", { name: "Share result" })).toHaveText(
    "Share result",
  );
});

test("Share copies the result where the share sheet is missing", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Reflect.deleteProperty(Navigator.prototype, "share");
  });
  await grantClipboard(page);
  await convert(page);
  await openShare(page);
  const share = page.locator(".share-cta");
  await share.click();
  await expect(share).toHaveText("Copied");
  await expect(liveRegion(page)).toHaveText("Copied to clipboard");
  expect(await clipboard(page)).toBe(convertedText);
});

test("the countdown runs to midnight US Eastern, then links to Landing", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-11T03:58:00Z") });
  await convert(page);
  await openShare(page);
  await page.clock.setFixedTime(new Date("2026-10-11T03:59:50Z"));
  await expect(page.getByText("Next puzzle in 00:00:10")).toBeVisible();
  await page.clock.setFixedTime(new Date("2026-10-11T04:00:00Z"));
  await page.getByRole("link", { name: "New puzzle is out" }).click();
  await expect(page).toHaveURL("/");
});

test("Close goes to Landing", async ({ page }) => {
  await convert(page);
  await openShare(page);
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Omaha");
});

test("back from Share shows the same finished result", async ({ page }) => {
  await convert(page);
  await openShare(page);
  await page.goBack();
  await expect(page).toHaveURL("/puzzle/1");
  const result = page.getByLabel("Rep result");
  await expect(result.getByRole("heading", { level: 1 })).toHaveText(
    "CONVERTED",
  );
  await expect(
    result.getByRole("group", {
      name: "Reps: rep 1 no gain, rep 2 converted, rep 3 not needed, rep 4 not needed",
    }),
  ).toBeVisible();
});

test("Share without a finished puzzle opens the puzzle", async ({ page }) => {
  await page.goto("/puzzle/1/share");
  await expect(page).toHaveURL("/puzzle/1");
  await expect(page.getByRole("button", { name: "1 Protect" })).toHaveAttribute(
    "aria-current",
    "step",
  );
});

test("the share card is the same in light and dark", async ({ page }) => {
  await convert(page);
  await openShare(page);
  const box = await card(page).boundingBox();
  if (!box) throw new Error("The share card isn't visible");
  // Inset past the rounded corners, where the page shows through.
  const clip = { ...box, x: box.x + 20, width: box.width - 40 };
  await page.emulateMedia({ colorScheme: "light" });
  const light = await page.screenshot({ clip });
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator(".share-screen")).toHaveCSS(
    "background-color",
    "rgb(24, 32, 28)",
  );
  expect(await page.screenshot({ clip })).toEqual(light);
});

test("the link-preview card renders at 1200×630 from the reps", async ({
  page,
}) => {
  await page.goto("/e2e/link-preview.html?routes=Out,Comeback");
  const preview = page.locator(".link-preview");
  await expect(preview).toContainText("#12 · 3rd & 10 · Converted in 2");
  expect(await preview.boundingBox()).toEqual({
    x: 0,
    y: 0,
    width: 1200,
    height: 630,
  });
  await expect(
    preview.getByRole("img", {
      name: "Rep 1 incomplete, rep 2 converted, rep 3 not needed, rep 4 not needed",
    }),
  ).toBeVisible();
  await expect(preview.locator(".share-card-footer")).toHaveText(
    "Beat the pros78 pts",
  );
});
