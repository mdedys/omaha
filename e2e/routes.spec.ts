import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import fixture from "../public/puzzles/1.json" with { type: "json" };

async function openRoutes(page: Page) {
  await page.goto("/puzzle/1");
  await page.getByRole("button", { name: "Next: routes" }).click();
  await expect(page.getByRole("heading", { name: "Routes" })).toBeVisible();
}

const menus = [
  {
    receiver: "Left WR",
    routes: [
      "Hitch",
      "Flat",
      "Slant",
      "Comeback",
      "Hook",
      "Out",
      "In",
      "Corner",
      "Post",
      "Go",
      "Drag",
    ],
  },
  {
    receiver: "Slot WR",
    routes: [
      "Hitch",
      "Flat",
      "Slant",
      "Comeback",
      "Hook",
      "Out",
      "In",
      "Corner",
      "Post",
      "Seam",
      "Drag",
      "Wheel",
    ],
  },
  { receiver: "RB", routes: ["Flat", "Hook", "Out", "In", "Seam", "Wheel"] },
];

for (const { receiver, routes } of menus) {
  test(`offers ordered ${receiver} menu`, async ({ page }) => {
    await openRoutes(page);
    await page
      .getByRole("button", { name: `${receiver}, no route`, exact: true })
      .click();
    await expect(page.getByRole("option")).toHaveText(routes);
    await expect(
      page.locator('.route-card svg path[stroke-width="2"]'),
    ).toHaveCount(routes.length * (receiver === "RB" ? 2 : 1));
    await page.getByRole("option", { name: "Out", exact: true }).click();
    await expect(
      page.getByRole("button", {
        name: `${receiver}, Out, 10 yards`,
        exact: true,
      }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("option", { name: "Out", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
  });
}

test("field selection persists through Read", async ({ page }) => {
  await openRoutes(page);
  await expect(page.locator('[data-selection="X"]')).toHaveAttribute("r", "14");
  const slot = page.getByRole("button", { name: "Slot WR, no route" });
  await slot.click();
  await expect(slot).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('[data-selection="H"]')).toHaveAttribute(
    "stroke",
    "#F4B13E",
  );
  await expect(page.locator('[data-receiver-hit="H"]')).toHaveAttribute(
    "r",
    "23",
  );
  await page.getByRole("button", { name: "Next: read" }).click();
  await expect(
    page.getByRole("heading", { name: "Read", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "2 Routes" }).click();
  await expect(slot).toHaveAttribute("aria-pressed", "true");
});

test("native activation keeps selection on retap", async ({ page }) => {
  await openRoutes(page);
  const slot = page.getByRole("button", { name: "Slot WR, no route" });
  await slot.focus();
  await page.keyboard.press("Enter");
  await expect(slot).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Space");
  await expect(slot).toHaveAttribute("aria-pressed", "true");
});

test("depth choices carry across route replacements", async ({ page }) => {
  await openRoutes(page);
  await expect(
    page.getByText("Choose a route to set its depth."),
  ).toBeVisible();
  await page.getByRole("option", { name: "Out", exact: true }).click();
  await expect(page.getByRole("radio", { name: "10 yds" })).toBeChecked();
  await expect(page.locator('[data-route="X"]')).toHaveAttribute("d", / 238L/);
  await page.getByRole("radio", { name: "5 yds", exact: true }).click();
  await page.getByRole("option", { name: "Corner", exact: true }).click();
  await expect(page.getByRole("radio", { name: "10 yds" })).toBeChecked();
  const unavailable = page.getByRole("radio", { name: "5 yds", exact: true });
  await expect(unavailable).toBeDisabled();
  await expect(unavailable).toHaveCSS("opacity", "0.4");
  await unavailable.dispatchEvent("click");
  await expect(page.getByRole("radio", { name: "10 yds" })).toBeChecked();
  await page.getByRole("radio", { name: "15 yds" }).click();
  await page.getByRole("option", { name: "Post", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Left WR, Post, 15 yards" }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("no-depth route replaces depth control", async ({ page }) => {
  await openRoutes(page);
  await page.getByRole("option", { name: "Out", exact: true }).click();
  await page.getByRole("radio", { name: "15 yds" }).click();
  await page.getByRole("option", { name: "Slant", exact: true }).click();
  await expect(page.getByText("No depth for the slant")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Left WR, Slant", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("option", { name: "Out", exact: true }).click();
  await expect(page.getByRole("radio", { name: "10 yds" })).toBeChecked();
});

test("near goal only permits available depths", async ({ page }) => {
  await page.route("**/puzzles/1.json", (route) =>
    route.fulfill({
      json: {
        ...fixture,
        situation: { ...fixture.situation, spot: 99, distance: 1 },
        goal: "touchdown",
      },
    }),
  );
  await openRoutes(page);
  await page.getByRole("option", { name: "Out", exact: true }).click();
  await expect(page.getByRole("radio", { name: "10 yds" })).toBeChecked();
  await expect(page.getByRole("radio", { name: "15 yds" })).toBeDisabled();
  await expect(
    page.getByRole("radio", { name: "5 yds", exact: true }),
  ).toBeEnabled();
});

for (const { receiver, letter, blockers } of [
  { receiver: "RB", letter: "RB", blockers: 6 },
  { receiver: "TE", letter: "Y", blockers: 7 },
]) {
  test(`protection purges ${receiver} route`, async ({ page }) => {
    await openRoutes(page);
    await page.getByRole("option", { name: "Out", exact: true }).click();
    await page
      .getByRole("button", { name: `${receiver}, no route`, exact: true })
      .click();
    await page.getByRole("option", { name: "Out", exact: true }).click();
    await expect(page.locator(`[data-route="${letter}"]`)).toHaveAttribute(
      "stroke-width",
      "2.4",
    );
    await expect(page.locator('[data-route="X"]')).toHaveAttribute(
      "opacity",
      "0.45",
    );
    await page.getByRole("button", { name: "1 Protect" }).click();
    await page.getByRole("radio", { name: `${blockers}-man` }).click();
    await page.getByRole("button", { name: "Next: routes" }).click();
    await expect(page.locator('[data-route="X"]')).toHaveAttribute(
      "stroke-width",
      "2.4",
    );
    await expect(page.locator(`[data-route="${letter}"]`)).toHaveCount(0);
    await page.locator(`[data-player="${letter}"]`).click();
    await expect(
      page.getByRole("listbox", { name: "Routes for Left WR" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "1 Protect" }).click();
    await page.getByRole("radio", { name: "5-man" }).click();
    await page.getByRole("button", { name: "Next: routes" }).click();
    await page
      .getByRole("button", { name: `${receiver}, no route`, exact: true })
      .click();
    await expect(
      page.getByText("Choose a route to set its depth."),
    ).toBeVisible();
  });
}
