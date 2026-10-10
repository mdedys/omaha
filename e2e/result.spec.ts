import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

const routes = [
  ["TE", "Hitch"],
  ["Slot WR", "Out"],
  ["Right WR", "Go"],
  ["RB", "Flat"],
];

async function snapFirstRep(page: Page, leftRoute: string) {
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
}

async function runItBack(page: Page, leftRoute: string) {
  await page.getByRole("button", { name: "Run it back" }).click();
  await page.getByRole("button", { name: "Next: routes" }).click();
  await page.getByRole("button", { name: /^Left WR,/ }).click();
  await page.getByRole("option", { name: leftRoute, exact: true }).click();
  await page.getByRole("button", { name: "Next: read" }).click();
  await page.getByRole("button", { name: "Snap" }).click();
}

function labels(locator: Locator) {
  return locator.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("aria-label")),
  );
}

function sheet(page: Page) {
  return page.getByLabel("Rep result");
}

test("Snap shows the rep's result sheet", async ({ page }) => {
  await snapFirstRep(page, "Out");
  const result = sheet(page);
  await expect(result.getByRole("heading", { level: 1 })).toHaveText(
    "INCOMPLETE",
  );
  await expect(result.getByRole("heading", { level: 1 })).toBeFocused();
  await expect(result).toContainText(
    "The corner closed on the Left WR and swatted it. Get it there sooner.",
  );
  await expect(result.locator(".result-stat")).toHaveText([
    "0yards gained",
    "2.0sin the pocket",
    "WR1st read",
  ]);
  await expect(
    result.getByRole("group", {
      name: "Reps: rep 1 no gain, rep 2 next, rep 3 unused, rep 4 unused",
    }),
  ).toBeVisible();
  await expect(result).toContainText("3 reps left");
  await expect(
    result.getByRole("button", { name: "Run it back" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: /^Rep 1 final frame:/ }),
  ).toBeVisible();
});

test("the result field shows every player at the final tick", async ({
  page,
}) => {
  await snapFirstRep(page, "Out");
  await expect(page.locator('[data-player="QB"]')).toHaveAttribute(
    "transform",
    "translate(201.5 455.6)",
  );
  await expect(page.locator('[data-player="CB1"]')).toHaveAttribute(
    "transform",
    /^translate\(99\.150\d* 238\)$/,
  );
  await expect(page.locator("[data-player]")).toHaveCount(22);
  await expect(page.locator("[data-route]")).toHaveCount(0);
});

for (const theme of ["light", "dark"] as const) {
  test(`a failed rep shows the cream sheet in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await snapFirstRep(page, "Out");
    await expect(sheet(page)).toHaveCSS(
      "background-color",
      theme === "light" ? "rgb(244, 239, 228)" : "rgb(24, 32, 28)",
    );
    await expect(sheet(page).getByRole("heading", { level: 1 })).toHaveCSS(
      "color",
      theme === "light" ? "rgb(24, 32, 28)" : "rgb(244, 239, 228)",
    );
  });
}

test("a short rep shows its yards on a gold tile", async ({ page }) => {
  await snapFirstRep(page, "Go");
  await expect(sheet(page).getByRole("heading", { level: 1 })).toHaveText(
    "SHORT",
  );
  const tile = sheet(page).locator(".outcome-tile");
  await expect(tile).toHaveText("+7");
  await expect(tile).toHaveCSS("background-color", "rgb(244, 177, 62)");
});

test("Run it back opens Protect with the previous design", async ({ page }) => {
  await page.goto("/puzzle/1");
  await page.getByRole("radio", { name: "Slide left" }).click();
  await page.getByRole("button", { name: "Next: routes" }).click();
  await page.getByRole("option", { name: "Out", exact: true }).click();
  for (const [receiver, route] of routes) {
    await page
      .getByRole("button", { name: `${receiver}, no route`, exact: true })
      .click();
    await page.getByRole("option", { name: route, exact: true }).click();
  }
  await page.getByRole("button", { name: "Next: read" }).click();
  await page.getByRole("button", { name: "TE, Hitch", exact: true }).click();
  await page.getByRole("button", { name: "Right WR, Go", exact: true }).click();
  await page.getByRole("button", { name: "Snap" }).click();
  await page.getByRole("button", { name: "Run it back" }).click();
  await expect(page.getByRole("button", { name: "1 Protect" })).toHaveAttribute(
    "aria-current",
    "step",
  );
  await expect(page.getByRole("group", { name: "Rep 2 of 4" })).toBeAttached();
  await expect(page.getByRole("radio", { name: "Slide left" })).toBeChecked();
  await page.getByRole("button", { name: "3 Read" }).click();
  await expect
    .poll(() =>
      labels(
        page
          .getByRole("group", { name: "Read order" })
          .locator('[aria-pressed="true"]'),
      ),
    )
    .toEqual(["TE, Hitch, read 1", "Right WR, Go, read 2"]);
  await expect(page.getByRole("button", { name: "Snap" })).toHaveAttribute(
    "aria-disabled",
    "false",
  );
});

test("a read kept in to block leaves the carried-over order", async ({
  page,
}) => {
  await snapFirstRep(page, "Out");
  await page.getByRole("button", { name: "Run it back" }).click();
  await page.getByRole("radio", { name: "7-man" }).click();
  await page.getByRole("button", { name: "3 Read" }).click();
  await expect(page.getByRole("button", { name: /^TE,/ })).toHaveCount(0);
  await expect(page.getByText("No reads picked")).toBeAttached();
  await expect(page.getByRole("button", { name: "Snap" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
});

test("plays to a converted finish", async ({ page }) => {
  await snapFirstRep(page, "Out");
  await runItBack(page, "Comeback");
  const result = sheet(page);
  await expect(result.getByRole("heading", { level: 1 })).toHaveText(
    "CONVERTED",
  );
  await expect(result).toHaveCSS("background-color", "rgb(36, 74, 62)");
  await expect(result.locator(".result-stat")).toHaveText([
    "+13yards gained",
    "78points",
    "—day streak",
  ]);
  await expect(
    result.getByRole("group", {
      name: "Reps: rep 1 no gain, rep 2 converted, rep 3 not needed, rep 4 not needed",
    }),
  ).toBeVisible();
  await expect(result).toContainText("Converted in 2");
  await expect(result.getByRole("button", { name: "Run it back" })).toHaveCount(
    0,
  );
  await expect(
    result.getByRole("button", { name: "See how the pros did" }),
  ).toHaveAttribute("aria-disabled", "true");
});

test("plays to an out-of-reps finish", async ({ page }) => {
  await snapFirstRep(page, "Out");
  await runItBack(page, "Go");
  await expect(sheet(page)).toContainText("2 reps left");
  await runItBack(page, "In");
  await expect(sheet(page)).toContainText("1 rep left");
  await runItBack(page, "Post");
  const result = sheet(page);
  await expect(result.getByRole("heading", { level: 1 })).toHaveText(
    "OUT OF REPS",
  );
  await expect(result).toContainText(
    "The safety jumped the throw to the Left WR. Four reps, no first down.",
  );
  await expect(result).toHaveCSS("background-color", "rgb(24, 32, 28)");
  await expect(result.locator(".result-stat")).toHaveText([
    "0points",
    "+7best rep",
    "4reps used",
  ]);
  await expect(
    result.getByRole("group", {
      name: "Reps: rep 1 no gain, rep 2 short, rep 3 no gain, rep 4 no gain",
    }),
  ).toBeVisible();
  await expect(result).toContainText("No reps left");
  await expect(result.getByRole("button", { name: "Run it back" })).toHaveCount(
    0,
  );
  await expect(
    result.getByRole("button", { name: "See how the pros did" }),
  ).toBeVisible();
});

test("desktop Enter runs it back", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await snapFirstRep(page, "Out");
  await expect(
    page.getByRole("complementary", { name: "Rep result" }),
  ).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "1 Protect" })).toHaveAttribute(
    "aria-current",
    "step",
  );
});
