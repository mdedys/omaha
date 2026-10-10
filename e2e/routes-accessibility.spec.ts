import { expect, test } from "@playwright/test";
import fixture from "../public/puzzles/1.json" with { type: "json" };

test("flipped first entry selects leftmost runner", async ({ page }) => {
  await page.route("**/puzzles/1.json", (route) =>
    route.fulfill({
      json: { ...fixture, formation: { id: "gun-trey", flip: true } },
    }),
  );
  await page.goto("/puzzle/1");
  await page.getByRole("button", { name: "2 Routes" }).click();
  await expect(page.locator('[data-selection="Z"]')).toHaveAttribute(
    "stroke",
    "#F4B13E",
  );
  await expect(
    page.getByRole("button", { name: "Left WR, no route", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("listbox arrows assign routes locally", async ({ page }) => {
  await page.goto("/puzzle/1");
  await page.getByRole("button", { name: "Next: routes" }).click();
  await page.getByRole("option", { name: "Hook", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("option", { name: "Out", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("button", { name: "Left WR, Out, 10 yards" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "2 Routes" })).toHaveAttribute(
    "aria-current",
    "step",
  );
});

test("depth arrows skip unavailable options", async ({ page }) => {
  await page.goto("/puzzle/1");
  await page.getByRole("button", { name: "Next: routes" }).click();
  await page.getByRole("option", { name: "Corner", exact: true }).click();
  await page.getByRole("radio", { name: "10 yds" }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("radio", { name: "15 yds" })).toBeChecked();
  await expect(page.getByRole("radio", { name: "15 yds" })).toBeFocused();
  await expect(
    page.getByRole("button", { name: "Left WR, Corner, 15 yards" }),
  ).toHaveAttribute("aria-pressed", "true");
});
