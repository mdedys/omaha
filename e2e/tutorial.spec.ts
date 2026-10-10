import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const steps = [
  {
    title: "Read the situation",
    field:
      "The field at your own 45: the blue line of scrimmage and the yellow first-down line ten yards ahead",
  },
  {
    title: "Draw up the play",
    field:
      "A full play drawn: the line sliding left, four routes, and the tight end marked as the first read",
  },
  {
    title: "Snap it, then run it back",
    field:
      "The result of rep 1: the defense revealed, the throw to the Left WR",
  },
];

function heading(page: Page, step: number) {
  return page.getByRole("heading", {
    level: 1,
    name: steps[step - 1].title,
    exact: true,
  });
}

async function openStep(page: Page, step: number) {
  await page.goto("/how-to-play");
  for (let next = 2; next <= step; next++) {
    await page.getByRole("button", { name: "Next", exact: true }).click();
  }
  await expect(heading(page, step)).toBeVisible();
}

function dotWidths(page: Page) {
  return page
    .locator(".tutorial-dots i")
    .evaluateAll((dots) =>
      dots.map((dot) => dot.getBoundingClientRect().width),
    );
}

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-09T16:00:00Z") });
});

test("opens on step 1", async ({ page }) => {
  await page.goto("/how-to-play");
  await expect(heading(page, 1)).toBeVisible();
  await expect(page.getByLabel("Step 1 of 3")).toBeVisible();
});

test("Next moves to steps 2 and 3", async ({ page }) => {
  await page.goto("/how-to-play");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(heading(page, 2)).toBeVisible();
  await expect(page.getByLabel("Step 2 of 3")).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(heading(page, 3)).toBeVisible();
  await expect(page.getByLabel("Step 3 of 3")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Next", exact: true }),
  ).toHaveCount(0);
});

for (const [step, widths] of [
  [1, [24, 8, 8]],
  [2, [8, 24, 8]],
  [3, [8, 8, 24]],
] as const) {
  test(`step ${step} widens its own dot`, async ({ page }) => {
    await openStep(page, step);
    expect(await dotWidths(page)).toEqual(widths);
  });
}

for (const [step, layer] of [
  [1, '[data-field-layer="line-to-gain"]'],
  [2, '[data-read-badge="Y"]'],
  [3, '[data-field-layer="play-art"]'],
] as const) {
  test(`step ${step} draws its example on the shared field`, async ({
    page,
  }) => {
    await openStep(page, step);
    const field = page.getByRole("img", { name: steps[step - 1].field });
    await expect(field).toHaveAttribute("viewBox", "0 0 403 495");
    await expect(field.locator(layer)).toHaveCount(1);
  });
}

test("step 2 draws four routes", async ({ page }) => {
  await openStep(page, 2);
  await expect(page.locator("[data-route]")).toHaveCount(4);
});

// Today's puzzle number arrives after the step renders.
async function follow(page: Page, name: string, number: number) {
  const link = page.getByRole("link", { name, exact: true });
  await expect(link).toHaveAttribute("href", `/puzzle/${number}`);
  await link.click();
  await expect(page).toHaveURL(`/puzzle/${number}`);
}

for (const step of [1, 2, 3]) {
  test(`Skip on step ${step} opens today's puzzle`, async ({ page }) => {
    await openStep(page, step);
    await follow(page, "Skip", 2);
    await expect(
      page.getByRole("heading", { name: "2nd & goal" }),
    ).toBeVisible();
  });
}

test("Play today's puzzle opens today's puzzle", async ({ page }) => {
  await openStep(page, 3);
  await follow(page, "Play today's puzzle", 2);
  await expect(page.getByRole("heading", { name: "2nd & goal" })).toBeVisible();
});

test("Skip follows the newest published date", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-08T16:00:00Z"));
  await openStep(page, 1);
  await follow(page, "Skip", 1);
  await expect(page.getByRole("heading", { name: "3rd & 10" })).toBeVisible();
});

test("Skip falls back to Landing when today's puzzle can't load", async ({
  page,
}) => {
  await page.route("**/puzzles/index.json", (route) =>
    route.fulfill({ status: 500 }),
  );
  await openStep(page, 1);
  await page.getByRole("link", { name: "Skip", exact: true }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("status")).toContainText(
    "Couldn't load today's puzzle.",
  );
});

test("Skip sits in the top bar on desktop", async ({ page }, testInfo) => {
  await openStep(page, 1);
  const header = page.locator("header");
  if (testInfo.project.name === "desktop") {
    await expect(header.getByRole("link", { name: "Skip" })).toBeVisible();
  } else {
    await expect(header).toBeHidden();
    await expect(page.getByRole("link", { name: "Skip" })).toBeVisible();
  }
});

for (const step of [2, 3]) {
  test(`Back on step ${step} returns one step`, async ({ page }) => {
    await openStep(page, step);
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await expect(heading(page, step - 1)).toBeVisible();
    await expect(page.getByLabel(`Step ${step - 1} of 3`)).toBeVisible();
    await expect(page).toHaveURL("/how-to-play");
  });
}

test("step 1 has no Back", async ({ page }) => {
  await openStep(page, 2);
  await expect(
    page.getByRole("button", { name: "Back", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(heading(page, 1)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Back", exact: true }),
  ).toHaveCount(0);
});

test("system back from step 3 leaves to the page before", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "How to play" }).last().click();
  await expect(heading(page, 1)).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(heading(page, 3)).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("heading", { name: "Omaha", exact: true }),
  ).toBeVisible();
});

test("a step change moves focus to the new heading", async ({ page }) => {
  await page.goto("/how-to-play");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(heading(page, 2)).toBeFocused();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(heading(page, 1)).toBeFocused();
});
