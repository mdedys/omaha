import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { indexEntry } from "./page";

function stubIndex(page: Page, json: unknown) {
  return page.route("**/puzzles/index.json", (route) =>
    route.fulfill({ json }),
  );
}

function rows(page: Page) {
  return page.getByRole("region", { name: "Earlier" }).getByRole("link");
}

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-09T16:00:00Z") });
});

test("Back goes to Landing", async ({ page }) => {
  await page.goto("/puzzles");
  await page.getByRole("link", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("heading", { name: "Omaha", exact: true }),
  ).toBeVisible();
});

test("the header stays put while the list scrolls", async ({ page }) => {
  await stubIndex(
    page,
    Array.from({ length: 30 }, (_, index) =>
      indexEntry(index + 1, `2026-09-${String(index + 1).padStart(2, "0")}`),
    ),
  );
  await page.goto("/puzzles");
  const header = page.locator("header");
  const today = page.getByRole("link", { name: /^Today's puzzle:/ });
  await expect(today).toBeInViewport();
  await rows(page).last().scrollIntoViewIfNeeded();
  await expect(rows(page).last()).toBeInViewport();
  await expect(today).not.toBeInViewport();
  expect(await header.boundingBox()).toMatchObject({ y: 0 });
  await expect(header.getByRole("heading", { name: "Puzzles" })).toBeVisible();
});

test("the today card shows the newest published entry", async ({ page }) => {
  await page.goto("/puzzles");
  const card = page.getByRole("link", {
    name: "Today's puzzle: 2nd and goal, opp 6. Six yards. Don't choke",
    exact: true,
  });
  await expect(card).toHaveText(
    "Today2nd & goalopp 6Six yards. Don't choke.Play",
  );
  await expect(card).toHaveAttribute("href", "/puzzle/2");
});

test("the today card skips entries dated after today", async ({ page }) => {
  await stubIndex(page, [
    indexEntry(3, "2026-10-10", "Not yet."),
    { ...indexEntry(2, "2026-10-09"), down: 4, distance: 2, spot: 59 },
    indexEntry(1, "2026-10-08"),
  ]);
  await page.goto("/puzzles");
  await expect(
    page.getByRole("link", { name: /^Today's puzzle:/ }),
  ).toHaveAccessibleName(
    "Today's puzzle: 4th and 2, opp 41. Field goal won't cut it",
  );
});

test("the today card opens today's puzzle", async ({ page }) => {
  await page.goto("/puzzles");
  await page.getByRole("link", { name: /^Today's puzzle:/ }).click();
  await expect(page).toHaveURL("/puzzle/2");
  await expect(page.getByRole("heading", { name: "2nd & goal" })).toBeVisible();
});

test("the earlier list shows older entries newest first", async ({ page }) => {
  await stubIndex(page, [
    indexEntry(1, "2026-10-05", "First."),
    indexEntry(5, "2026-10-12", "Future."),
    indexEntry(3, "2026-10-07", "Third."),
    indexEntry(4, "2026-10-09", "Today."),
    indexEntry(2, "2026-10-06", "Second."),
  ]);
  await page.goto("/puzzles");
  await expect(rows(page)).toHaveText([
    "3rd & 10own 45Third.#3",
    "3rd & 10own 45Second.#2",
    "3rd & 10own 45First.#1",
  ]);
});

test("each earlier row is named by its puzzle", async ({ page }) => {
  await page.goto("/puzzles");
  await expect(rows(page)).toHaveAccessibleName(
    "Puzzle 1: 3rd and 10, own 45. Field goal won't cut it",
  );
});

test("an earlier row opens its puzzle", async ({ page }) => {
  await page.goto("/puzzles");
  await rows(page).click();
  await expect(page).toHaveURL("/puzzle/1");
  await expect(page.getByRole("heading", { name: "3rd & 10" })).toBeVisible();
});

test("a long row label stays on one line with an ellipsis", async ({
  page,
}) => {
  const label = "No timeouts left, so it's all on you. ".repeat(4).trim();
  await stubIndex(page, [
    indexEntry(2, "2026-10-09"),
    indexEntry(1, "2026-10-08", label),
  ]);
  await page.goto("/puzzles");
  const shown = rows(page).getByText(label, { exact: true });
  const box = await shown.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      lines: Math.round(
        element.getBoundingClientRect().height / parseFloat(style.lineHeight),
      ),
      clipped: element.scrollWidth > element.clientWidth,
      overflow: style.textOverflow,
    };
  });
  expect(box).toEqual({ lines: 1, clipped: true, overflow: "ellipsis" });
});

for (const row of [
  { spot: 45, lines: ["M0 20H56", "M0 44H56"] },
  { spot: 85, lines: ["M0 20H56", "M0 44H56", "M0 8H56"] },
]) {
  test(`a row thumbnail at spot ${row.spot} draws its lines to scale`, async ({
    page,
  }) => {
    await stubIndex(page, [
      indexEntry(2, "2026-10-09"),
      { ...indexEntry(1, "2026-10-08"), down: 1, spot: row.spot },
    ]);
    await page.goto("/puzzles");
    await expect(rows(page)).toHaveCount(1);
    const drawn = await rows(page)
      .locator("svg path")
      .evaluateAll((paths) => paths.map((path) => path.getAttribute("d")));
    expect(drawn).toEqual(row.lines);
  });
}

test("only today's entry shows the no-earlier state", async ({ page }) => {
  await stubIndex(page, [indexEntry(1, "2026-10-09")]);
  await page.goto("/puzzles");
  await expect(page.getByRole("region", { name: "Earlier" })).toHaveText(
    "EarlierNo earlier puzzles yet. Come back tomorrow.",
  );
});

test("keeps Landing's loading state until the index arrives", async ({
  page,
}) => {
  const gate = Promise.withResolvers<void>();
  await page.route("**/puzzles/index.json", async (route) => {
    await gate.promise;
    await route.continue();
  });
  await page.goto("/puzzles");
  await expect(page.getByRole("status")).toHaveText(
    "Today's puzzleLoading today's puzzle…Drawing up the situation.",
  );
  gate.resolve();
  await expect(
    page.getByRole("link", { name: /^Today's puzzle:/ }),
  ).toBeVisible();
});

for (const failure of ["network", "http"]) {
  test(`shows Landing's error state for a ${failure} failure`, async ({
    page,
  }) => {
    await page.route("**/puzzles/index.json", (route) =>
      failure === "network"
        ? route.abort("failed")
        : route.fulfill({ status: 503 }),
    );
    await page.goto("/puzzles");
    await expect(page.getByRole("status")).toHaveText(
      "Today's puzzleCouldn't load today's puzzle.Please refresh to try again.",
    );
  });
}

test("shows Landing's no-puzzle state before the season", async ({ page }) => {
  await stubIndex(page, [indexEntry(1, "2026-10-10")]);
  await page.goto("/puzzles");
  await expect(page.getByRole("status")).toHaveText(
    "Today's puzzleNo puzzle available yet.Check back for the next situation.",
  );
});
