import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
import { routes, runItBack, snapFirstRep } from "./page";

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
    page.getByRole("img", {
      name: "Rep 1 final frame with the defense revealed: incomplete. The corner closed on the Left WR and swatted it.",
    }),
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
  await page.getByRole("button", { name: "Skip to result" }).click();
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
  await expect(result.locator(".result-cta")).toHaveText("Share result");
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
  await expect(result.locator(".result-cta")).toHaveText("Share result");
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

test("a thrown ball draws a dashed path from the throw to the catch", async ({
  page,
}) => {
  await snapFirstRep(page, "Out");
  const path = page.locator("[data-ball-path]");
  await expect(path).toHaveAttribute(
    "d",
    /^M201\.5 447\.06\d*L99\.150\d* 238$/,
  );
  await expect(path).toHaveAttribute("stroke-dasharray", "2 5");
});

for (const [leftRoute, footballs] of [
  ["Post", 1],
  ["Out", 0],
] as const) {
  test(`Left WR ${leftRoute} draws ${footballs} football`, async ({ page }) => {
    await snapFirstRep(page, leftRoute);
    await expect(page.locator("[data-football]")).toHaveCount(footballs);
  });
}

test("an interception draws the football where the ball ends", async ({
  page,
}) => {
  await snapFirstRep(page, "Post");
  const football = page.locator("[data-football]");
  await expect(football).toHaveAttribute("cx", /^99\.150\d*$/);
  await expect(football).toHaveAttribute("cy", "238");
});

test("a throwaway's ball path ends past the left sideline", async ({
  page,
}) => {
  await snapFirstRep(page, "Hook");
  await expect(page.locator("[data-ball-path]")).toHaveAttribute(
    "d",
    /L-3\.198\d* 455\.6$/,
  );
});

for (const [leftRoute, paths] of [
  ["In", 0],
  ["Out", 1],
] as const) {
  test(`Left WR ${leftRoute} draws ${paths} ball path`, async ({ page }) => {
    await snapFirstRep(page, leftRoute);
    await expect(page.locator("[data-ball-path]")).toHaveCount(paths);
  });
}

test("a converted rep shows the coverage key pill", async ({ page }) => {
  await snapFirstRep(page, "Comeback");
  await expect(page.getByText("Defense · Cover 1 pressure")).toBeVisible();
});

test("the coverage key pill waits for the fourth rep", async ({ page }) => {
  await snapFirstRep(page, "Out");
  await runItBack(page, "Go");
  await runItBack(page, "In");
  await expect(sheet(page)).toContainText("1 rep left");
  await expect(page.getByText("Defense · Cover 1 pressure")).toHaveCount(0);
  await runItBack(page, "Post");
  await expect(page.getByText("Defense · Cover 1 pressure")).toBeVisible();
});

test("the Final pill shows on desktop only", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await snapFirstRep(page, "Out");
  const final = page.getByText("Final · defense revealed");
  await expect(final).toBeHidden();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(final).toBeVisible();
});

test("desktop stacks the coverage key under the Final pill", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await snapFirstRep(page, "Comeback");
  const stage = await page.locator(".play-stage").boundingBox();
  const final = page.getByText("Final · defense revealed");
  const key = page.getByText("Defense · Cover 1 pressure");
  await expect(final).toHaveCSS("font-size", "13px");
  await expect(key).toHaveCSS("font-weight", "700");
  const finalBox = await final.boundingBox();
  const keyBox = await key.boundingBox();
  expect({
    final: [
      (finalBox?.x ?? 0) - (stage?.x ?? 0),
      (finalBox?.y ?? 0) - (stage?.y ?? 0),
      finalBox?.height,
    ],
    key: [
      (keyBox?.x ?? 0) - (stage?.x ?? 0),
      (keyBox?.y ?? 0) - (stage?.y ?? 0),
      keyBox?.height,
    ],
  }).toEqual({ final: [36, 36, 30], key: [36, 74, 30] });
});
