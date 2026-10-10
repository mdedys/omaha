import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import touchdown from "../public/puzzles/2.json" with { type: "json" };

async function openPuzzle(page: Page, number = 2) {
  await page.goto(`/puzzle/${number}`);
  await expect(
    page.getByRole("navigation", { name: "Play steps" }),
  ).toBeVisible();
}

for (const fixture of [
  { number: 1, heading: "3rd & 10", spot: "own 45", score: "Down 4 · 1:12" },
  { number: 2, heading: "2nd & goal", spot: "opp 6", score: "Down 5 · 0:28" },
]) {
  test(`loads numbered puzzle ${fixture.number}`, async ({ page }) => {
    await openPuzzle(page, fixture.number);
    await expect(
      page.getByRole("heading", { name: fixture.heading }),
    ).toBeVisible();
    await expect(page.getByText(fixture.spot, { exact: true })).toBeVisible();
    await expect(page.getByText(fixture.score, { exact: true })).toBeVisible();
    await expect(page.getByRole("img", { name: /^Field:/ })).toHaveAttribute(
      "viewBox",
      "0 0 403 495",
    );
    await expect(page.locator("[data-player]")).toHaveCount(22);
  });
}

test("retains loading until the numbered fixture arrives", async ({ page }) => {
  const gate = Promise.withResolvers<void>();
  await page.route("**/puzzles/2.json", async (route) => {
    await gate.promise;
    await route.continue();
  });
  await page.goto("/puzzle/2");
  await expect(page.getByRole("status")).toContainText("Loading puzzle…");
  gate.resolve();
  await expect(page.getByRole("heading", { name: "2nd & goal" })).toBeVisible();
});

for (const failure of ["network", "http", "engine"]) {
  test(`shows recoverable ${failure} error`, async ({ page }) => {
    await page.route("**/puzzles/2.json", (route) => {
      if (failure === "network") return route.abort();
      if (failure === "http") return route.fulfill({ status: 404 });
      return route.fulfill({ json: { ...touchdown, engine: 999 } });
    });
    await page.goto("/puzzle/2");
    await expect(page.getByRole("status")).toContainText(
      "Couldn't load puzzle.",
    );
    await expect(page.getByRole("status")).toContainText(
      "Please refresh to try again.",
    );
    await page.unroute("**/puzzles/2.json");
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "2nd & goal" }),
    ).toBeVisible();
  });
}

for (const goal of [
  { number: 1, line: "M0 238H403", stadium: 0 },
  { number: 2, line: "M0 289.2H403", stadium: 1 },
]) {
  test(`draws puzzle ${goal.number} line to gain`, async ({ page }) => {
    await openPuzzle(page, goal.number);
    await expect(
      page.locator('[data-field-layer="scrimmage"]'),
    ).toHaveAttribute("d", "M0 366H403");
    await expect(
      page.locator('[data-field-layer="line-to-gain"]'),
    ).toHaveAttribute("d", goal.line);
    await expect(page.locator('[data-field-layer="stadium"]')).toHaveCount(
      goal.stadium,
    );
    if (goal.stadium) {
      await expect(
        page.locator('[data-field-layer="end-line"]'),
      ).toHaveAttribute("d", "M0 161.2H403");
      await expect(
        page.locator('[data-field-layer="end-zone"] text'),
      ).toHaveText("OMAHA");
      await expect(page.locator('[data-field-layer="path"]')).toHaveAttribute(
        "height",
        "25.6",
      );
      await expect(page.locator('[data-field-layer="wall"]')).toHaveAttribute(
        "height",
        "4.8",
      );
    } else {
      await expect(page.locator('[data-field-layer="end-zone"]')).toHaveCount(
        0,
      );
    }
  });
}

test("farther touchdown goal uses the goal line instead of sticks", async ({
  page,
}) => {
  await page.route("**/puzzles/2.json", (route) =>
    route.fulfill({
      json: {
        ...touchdown,
        situation: { ...touchdown.situation, spot: 80, distance: 20 },
      },
    }),
  );
  await openPuzzle(page);
  await expect(
    page.locator('[data-field-layer="line-to-gain"]'),
  ).toHaveAttribute("d", "M0 110H403");
  await expect(page.locator('[data-field-layer="line-to-gain"]')).toHaveCount(
    1,
  );
});

test("starts Protect with the fresh draft", async ({ page }) => {
  await openPuzzle(page);
  await expect(page.getByRole("button", { name: "1 Protect" })).toHaveAttribute(
    "aria-current",
    "step",
  );
  await expect(page.getByRole("radio", { name: "5-man" })).toBeChecked();
  await expect(
    page.getByRole("radio", { name: "Man", exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole("group", { name: "Rep 1 of 4" }).locator("i"),
  ).toHaveCount(4);
  await expect(page.locator(".play-reps .current")).toHaveCount(1);
  await expect(page.locator(".play-reps .current")).toHaveCSS(
    "border-top-style",
    "solid",
  );
});

for (const activation of ["click", "Enter", "Space"]) {
  test(`moves between ungated steps by ${activation}`, async ({ page }) => {
    await openPuzzle(page);
    for (const step of ["3 Read", "2 Routes", "1 Protect"]) {
      const button = page.getByRole("button", { name: step });
      if (activation === "click") await button.click();
      else {
        await button.focus();
        await expect(button).toBeFocused();
        await page.keyboard.press(activation);
      }
      await expect(button).toHaveAttribute("aria-current", "step");
      await expect(
        page.getByRole("heading", {
          name: step === "3 Read" ? "Who does the QB look to?" : step.slice(2),
          exact: true,
        }),
      ).toBeVisible();
      if (step === "1 Protect") {
        await expect(page.getByRole("radio", { name: "5-man" })).toBeChecked();
        await expect(
          page.getByRole("radio", { name: "Man", exact: true }),
        ).toBeChecked();
      } else if (step === "2 Routes") {
        await expect(
          page.getByRole("listbox", { name: "Routes for Left WR" }),
        ).toBeVisible();
        await expect(
          page.getByText("Choose a route to set its depth."),
        ).toBeVisible();
      } else {
        await expect(page.getByText("Set every route first")).toBeVisible();
      }
    }
  });
}

test("browser back returns to the Landing origin", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-09T16:00:00Z") });
  await page.goto("/");
  await page.getByRole("link", { name: "Play today's puzzle" }).click();
  await expect(page.getByRole("heading", { name: "2nd & goal" })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("heading", { name: "Omaha", exact: true }),
  ).toBeVisible();
});

test("browser back preserves a different origin", async ({ page }) => {
  await page.goto("/how-to-play");
  await page.goto("/puzzle/1");
  await expect(page.getByRole("heading", { name: "3rd & 10" })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL("/how-to-play");
  await expect(
    page.getByRole("heading", { name: "How to play" }),
  ).toBeVisible();
});

test("reload restarts the in-memory session", async ({ page }) => {
  await openPuzzle(page);
  await page.getByRole("button", { name: "3 Read" }).click();
  await expect(
    page.getByRole("heading", { name: "Who does the QB look to?" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "1 Protect" })).toHaveAttribute(
    "aria-current",
    "step",
  );
  await expect(page.getByRole("group", { name: "Rep 1 of 4" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "5-man" })).toBeChecked();
  await expect(
    page.getByRole("radio", { name: "Man", exact: true }),
  ).toBeChecked();
});

test("field stays identical through themes and viewport changes", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await openPuzzle(page);
  const field = page.locator(".puzzle-field");
  const markup = await field.innerHTML();
  await page.emulateMedia({ colorScheme: "dark" });
  expect(await field.innerHTML()).toBe(markup);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await field.innerHTML()).toBe(markup);
  await page.setViewportSize({ width: 1280, height: 800 });
  expect(await field.innerHTML()).toBe(markup);
  await page.getByRole("button", { name: "2 Routes" }).click();
  await expect(field).toHaveAttribute("role", "group");
  await expect(page.locator('[data-selection="X"]')).toHaveAttribute(
    "stroke",
    "#F4B13E",
  );
  await page.getByRole("button", { name: "1 Protect" }).click();
  await expect(field).toHaveAttribute("role", "img");
  expect(await field.innerHTML()).toBe(markup);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Protect" })).toBeVisible();
  expect(await field.innerHTML()).toBe(markup);
});

test("frame responds to system theme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await openPuzzle(page);
  const header = page.locator(".play-header");
  await expect(header).toHaveCSS("border-bottom-color", "rgb(220, 211, 193)");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(header).toHaveCSS("border-bottom-color", "rgb(52, 64, 58)");
});

test("frame follows phone and desktop geometry", async ({ page }, testInfo) => {
  await openPuzzle(page);
  const desktop = testInfo.project.name === "desktop";
  await expect(page.locator(".play-header")).toHaveCSS(
    "height",
    desktop ? "64px" : "52px",
  );
  const panel = page.getByRole("complementary", { name: "Design the play" });
  if (desktop) await expect(panel).toHaveCSS("width", "440px");
  else {
    const field = await page
      .getByRole("img", { name: /^Field:/ })
      .boundingBox();
    expect(field?.width).toBe(390);
    expect(field?.height).toBeCloseTo(479.03, 1);
    const nav = await page
      .getByRole("navigation", { name: "Play steps" })
      .boundingBox();
    expect(nav?.y).toBeCloseTo(545.03, 1);
  }
});

test("step controls have touch-sized keyboard focus affordances", async ({
  page,
}) => {
  await openPuzzle(page);
  const buttons = page
    .getByRole("navigation", { name: "Play steps" })
    .getByRole("button");
  for (const button of await buttons.all()) {
    const box = await button.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
    await button.focus();
    await expect(button).toHaveCSS("outline-style", "solid");
    await expect(button).toHaveCSS("outline-width", "3px");
  }
});

test("field name includes protection but no assignments", async ({ page }) => {
  await openPuzzle(page);
  await expect(page.getByRole("img", { name: /^Field:/ })).toHaveAttribute(
    "aria-label",
    "Field: 2nd and goal, opponent 6. Pre-snap offense and defense; blue line of scrimmage, yellow line to gain. 5-man protection. Line stays in. Line takes defensive linemen.",
  );
});

test("stadium decoration spans the desktop stage", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openPuzzle(page);
  const stage = await page.locator(".play-stage").boundingBox();
  const field = await page.getByRole("img", { name: /^Field:/ }).boundingBox();
  expect(field?.height).toBe(688);
  for (const layer of ["path", "wall", "crowd"]) {
    const box = await page
      .locator(`[data-field-layer="${layer}"]`)
      .boundingBox();
    expect(box?.x).toBeLessThanOrEqual(stage?.x ?? 0);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeGreaterThanOrEqual(
      (stage?.x ?? 0) + (stage?.width ?? 0),
    );
  }
  await expect(page.locator(".play-stage")).toHaveCSS("overflow", "hidden");
});
