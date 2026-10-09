import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import touchdown from "../public/puzzles/2.json" with { type: "json" };

const heroName =
  "A play drawn on the field: four receivers' routes and the running back's check-down";

async function ready(page: Page) {
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Play today's puzzle" }),
  ).toBeVisible();
}

async function expectStatus(page: Page, message: string) {
  await expect(page.getByRole("status")).toContainText(message);
  await expect(
    page.getByRole("heading", { name: "Omaha", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("img", { name: heroName })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "All puzzles" }).last(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "How to play" }).last(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Play today's puzzle" }),
  ).toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-09T16:00:00Z") });
});

test("renders the published touchdown situation", async ({ page }) => {
  await ready(page);
  await expect(page.getByText("Puzzle #2", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "2nd & goal" })).toBeVisible();
  await expect(page.getByText("opp 6", { exact: true })).toBeVisible();
  await expect(
    page.getByText(
      "Friday night. Down 5 with 28 seconds left. Six yards from the end zone. Find the window before the defense shuts it. Your clipboard, your problem.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByText("Goal: score a touchdown", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("4 reps", { exact: true })).toBeVisible();
});

test("renders the published first-down situation", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-08T16:00:00Z"));
  await ready(page);
  await expect(page.getByText("Puzzle #1", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "3rd & 10" })).toBeVisible();
  await expect(page.getByText("own 45", { exact: true })).toBeVisible();
  await expect(
    page.getByText(
      "Sunday night. Down 4 with 1:12 to go and one timeout left. A field goal won't cut it, so the drive lives or dies on this first down. No pressure.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByText("Goal: pick up the first down", { exact: true }),
  ).toBeVisible();
});

for (const boundary of [
  {
    time: "2026-10-09T03:59:00Z",
    date: "2026-10-08",
    next: "2026-10-09",
  },
  {
    time: "2026-10-09T04:00:00Z",
    date: "2026-10-09",
    next: "2026-10-10",
  },
  {
    time: "2026-01-09T04:59:00Z",
    date: "2026-01-08",
    next: "2026-01-09",
  },
  {
    time: "2026-01-09T05:00:00Z",
    date: "2026-01-09",
    next: "2026-01-10",
  },
]) {
  test(`selects newest eligible Eastern entry at ${boundary.time}`, async ({
    page,
  }) => {
    await page.clock.setFixedTime(new Date(boundary.time));
    await page.route("**/puzzles/index.json", (route) =>
      route.fulfill({
        json: [
          { number: 99, date: boundary.next },
          { number: 2, date: boundary.date },
          { number: 1, date: "2025-12-01" },
        ],
      }),
    );
    await ready(page);
    await expect(page.getByText("Puzzle #2", { exact: true })).toBeVisible();
  });
}

test("updates the rendered card from changed puzzle JSON", async ({ page }) => {
  await page.route("**/puzzles/2.json", (route) =>
    route.fulfill({
      json: {
        ...touchdown,
        number: 77,
        situation: { ...touchdown.situation, down: 4, distance: 3, spot: 62 },
        briefing: "One chance to keep the drive alive. Make it count.",
        goal: "first-down",
        goalText: "Goal: move the chains before the clock runs out",
      },
    }),
  );
  await ready(page);
  await expect(page.getByText("Puzzle #77", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "4th & 3" })).toBeVisible();
  await expect(page.getByText("opp 38", { exact: true })).toBeVisible();
  await expect(
    page.getByText("One chance to keep the drive alive. Make it count."),
  ).toBeVisible();
  await expect(
    page.getByText("Goal: move the chains before the clock runs out"),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Play today's puzzle" }),
  ).toHaveAttribute("href", "/puzzle/77");
});

for (const resource of ["index.json", "2.json"]) {
  test(`keeps loading visible until ${resource} arrives`, async ({ page }) => {
    const gate = Promise.withResolvers<void>();
    await page.route(`**/puzzles/${resource}`, async (route) => {
      await gate.promise;
      await route.continue();
    });
    await page.goto("/");
    await expectStatus(page, "Loading today's puzzle…");
    gate.resolve();
    await expect(
      page.getByRole("link", { name: "Play today's puzzle" }),
    ).toBeVisible();
    await expect(page.getByText("Puzzle #2", { exact: true })).toBeVisible();
  });
  for (const failure of ["network", "http"]) {
    test(`shows error for ${resource} ${failure} failure`, async ({ page }) => {
      await page.route(`**/puzzles/${resource}`, (route) =>
        failure === "network"
          ? route.abort("failed")
          : route.fulfill({ status: 503 }),
      );
      await page.goto("/");
      await expectStatus(page, "Couldn't load today's puzzle.");
      await expect(
        page.getByText("Please refresh to try again."),
      ).toBeVisible();
      await page.unroute(`**/puzzles/${resource}`);
      await page.reload();
      await expect(
        page.getByRole("link", { name: "Play today's puzzle" }),
      ).toBeVisible();
    });
  }
}

for (const json of [
  { ...touchdown, engine: 999 },
  { ...touchdown, defense: [] },
]) {
  test(`shows an error for invalid engine puzzle ${json.engine}/${json.defense.length}`, async ({
    page,
  }) => {
    await page.route("**/puzzles/2.json", (route) => route.fulfill({ json }));
    await page.goto("/");
    await expectStatus(page, "Couldn't load today's puzzle.");
    await page.unroute("**/puzzles/2.json");
    await page.reload();
    await expect(page.getByText("Puzzle #2", { exact: true })).toBeVisible();
  });
}

for (const index of [[], [{ number: 1, date: "2026-10-10" }]]) {
  test(`shows no-puzzle for ${index.length === 0 ? "empty" : "future-only"} index`, async ({
    page,
  }) => {
    await page.route("**/puzzles/index.json", (route) =>
      route.fulfill({ json: index }),
    );
    await page.goto("/");
    await expectStatus(page, "No puzzle available yet.");
    await page.unroute("**/puzzles/index.json");
    await page.reload();
    await expect(
      page.getByRole("link", { name: "Play today's puzzle" }),
    ).toBeVisible();
  });
}

for (const destination of [
  { name: "Play today's puzzle", path: "/puzzle/2", title: "2nd & goal" },
  { name: "All puzzles", path: "/puzzles", title: "All puzzles" },
  { name: "How to play", path: "/how-to-play", title: "How to play" },
]) {
  for (const activation of ["click", "Enter", "Space"]) {
    test(`${destination.name} navigates via ${activation} without reloading`, async ({
      page,
    }) => {
      await ready(page);
      await page.evaluate(() => {
        document.documentElement.dataset.documentMarker = "same-document";
      });
      const links = page.getByRole("link", {
        name: destination.name,
        exact: true,
      });
      const count = await links.count();
      for (let index = 0; index < count; index++) {
        const link = links.nth(index);
        if (activation === "click") {
          await link.click();
        } else {
          await link.focus();
          await page.keyboard.press(activation);
        }
        await expect(page).toHaveURL(destination.path);
        await expect(
          page.getByRole("heading", { name: destination.title, exact: true }),
        ).toBeVisible();
        expect(
          await page.evaluate(
            () => document.documentElement.dataset.documentMarker,
          ),
        ).toBe("same-document");
        await page.goBack();
        await expect(
          page.getByRole("heading", { name: "Omaha", exact: true }),
        ).toBeVisible();
        await page.goForward();
        await expect(
          page.getByRole("heading", { name: destination.title, exact: true }),
        ).toBeVisible();
        await page.goBack();
        await expect(
          page.getByRole("link", { name: "Play today's puzzle" }),
        ).toBeVisible();
      }
    });
  }
  test(`direct entry renders ${destination.path}`, async ({ page }) => {
    await page.goto(destination.path);
    await expect(
      page.getByRole("heading", { name: destination.title, exact: true }),
    ).toBeVisible();
    if (destination.path === "/puzzle/2") {
      await page.goto("/");
    } else {
      await page.getByRole("link", { name: "Back to Landing" }).click();
    }
    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("heading", { name: "Omaha", exact: true }),
    ).toBeVisible();
  });
}

test("unknown URL renders Landing", async ({ page }) => {
  await page.goto("/not-a-screen");
  await expect(
    page.getByRole("heading", { name: "Omaha", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Puzzle #2", { exact: true })).toBeVisible();
});

test("keyboard focus follows the viewport navigation order", async ({
  page,
}, testInfo) => {
  await ready(page);
  const names =
    testInfo.project.name === "desktop"
      ? [
          "All puzzles",
          "How to play",
          "Play today's puzzle",
          "All puzzles",
          "How to play",
        ]
      : ["Play today's puzzle", "All puzzles", "How to play"];
  const links = page.getByRole("link");
  for (const [index, name] of names.entries()) {
    await page.keyboard.press("Tab");
    await expect(links.nth(index)).toBeFocused();
    await expect(links.nth(index)).toHaveAccessibleName(name);
  }
});

test("the wordmark is the page heading", async ({ page }) => {
  await ready(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Omaha");
});

test("the hero exposes its field description", async ({ page }) => {
  await ready(page);
  await expect(page.getByRole("img", { name: heroName })).toBeVisible();
});

test("Landing renders its static introduction", async ({ page }) => {
  await ready(page);
  await expect(
    page.getByText(
      "A real situation from last week. Four reps to out-coach the pros.",
    ),
  ).toBeVisible();
  await expect(page.getByText("Today's puzzle", { exact: true })).toBeVisible();
});

test("decorative icons are hidden from assistive technology", async ({
  page,
}) => {
  await ready(page);
  expect(
    await page
      .locator(".puzzle-card svg")
      .evaluateAll((icons) =>
        icons.map((icon) => icon.getAttribute("aria-hidden")),
      ),
  ).toEqual(["true", "true", "true", "true"]);
  await expect(page.getByText("4 reps", { exact: true })).toBeVisible();
});

test("layout follows phone or desktop geometry", async ({ page }, testInfo) => {
  await ready(page);
  const card = await page.locator(".puzzle-card").boundingBox();
  const field = await page.getByRole("img", { name: heroName }).boundingBox();
  if (!card || !field) throw new Error("Landing geometry is unavailable");
  if (testInfo.project.name === "phone") {
    expect({ y: card.y, height: card.height, width: card.width }).toEqual({
      y: 452,
      height: 392,
      width: 390,
    });
    expect(field.height).toBe(520);
    expect(
      await page.evaluate(() => document.documentElement.scrollHeight),
    ).toBe(844);
  } else {
    const panel = await page.locator(".landing-panel").boundingBox();
    const stage = await page.locator(".field-stage").boundingBox();
    const bar = await page.locator(".top-bar").boundingBox();
    if (!panel || !stage || !bar) {
      throw new Error("Desktop geometry is unavailable");
    }
    expect({ width: panel.width, top: panel.y, bar: bar.height }).toEqual({
      width: 520,
      top: 64,
      bar: 64,
    });
    expect(field.x + field.width / 2).toBeCloseTo(stage.x + stage.width / 2, 1);
    expect(field.y + field.height / 2).toBeCloseTo(
      stage.y + stage.height / 2,
      1,
    );
    for (const link of await page
      .getByRole("navigation")
      .getByRole("link")
      .all()) {
      const bounds = await link.boundingBox();
      if (!bounds) throw new Error("Navigation target is unavailable");
      expect(bounds.height).toBeGreaterThanOrEqual(44);
      expect(bounds.width).toBeGreaterThanOrEqual(44);
    }
  }
});

test("system theme changes the paper without changing the field", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await ready(page);
  await expect(page.locator(".puzzle-card")).toHaveCSS(
    "background-color",
    "rgb(244, 239, 228)",
  );
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator(".puzzle-card")).toHaveCSS(
    "background-color",
    "rgb(24, 32, 28)",
  );
  await expect(
    page.getByRole("link", { name: "Play today's puzzle" }),
  ).toHaveCSS("background-color", "rgb(224, 90, 43)");
  await expect(page.locator(".hero-field > rect")).toHaveCSS(
    "fill",
    "rgb(15, 58, 39)",
  );
});
