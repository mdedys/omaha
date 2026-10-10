import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

const routes = [
  ["TE", "Hitch"],
  ["Slot WR", "Out"],
  ["Right WR", "Go"],
  ["RB", "Flat"],
];

async function openRead(page: Page, routed = routes.length) {
  await page.goto("/puzzle/1");
  await page.getByRole("button", { name: "Next: routes" }).click();
  await page.getByRole("option", { name: "Out", exact: true }).click();
  for (const [receiver, route] of routes.slice(0, routed)) {
    await page
      .getByRole("button", { name: `${receiver}, no route`, exact: true })
      .click();
    await page.getByRole("option", { name: route, exact: true }).click();
  }
  await page.getByRole("button", { name: "Next: read" }).click();
  await expect(
    page.getByRole("heading", { name: "Who does the QB look to?" }),
  ).toBeVisible();
}

function labels(locator: Locator) {
  return locator.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("aria-label")),
  );
}

function options(page: Page) {
  return page.getByRole("group", { name: "Read order" }).getByRole("button");
}

async function pick(page: Page, ...names: string[]) {
  for (const name of names) {
    await page.getByRole("button", { name, exact: true }).click();
  }
}

test("offers each routed runner left to right", async ({ page }) => {
  await openRead(page);
  await expect
    .poll(() => labels(options(page)))
    .toEqual([
      "Left WR, Out",
      "RB, Flat",
      "TE, Hitch",
      "Slot WR, Out",
      "Right WR, Go",
    ]);
  await expect(options(page)).toHaveText([
    "Left WROut",
    "RBFlat",
    "TEHitch",
    "Slot WROut",
    "Right WRGo",
  ]);
});

test("leaves a runner without a route out of the options", async ({ page }) => {
  await openRead(page, 1);
  await expect
    .poll(() => labels(options(page)))
    .toEqual(["Left WR, Out", "TE, Hitch"]);
  await expect(page.getByText("Set every route first")).toBeVisible();
});

for (const { blockers, columns } of [
  { blockers: 5, columns: 3 },
  { blockers: 6, columns: 2 },
]) {
  test(`lays ${blockers}-man options in ${columns} phone columns`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openRead(page);
    await page.getByRole("button", { name: "1 Protect" }).click();
    await page.getByRole("radio", { name: `${blockers}-man` }).click();
    await page.getByRole("button", { name: "3 Read" }).click();
    const grid = page.getByRole("group", { name: "Read order" });
    const template = await grid.evaluate(
      (element) => getComputedStyle(element).gridTemplateColumns,
    );
    expect(template.split(" ")).toHaveLength(columns);
    await expect(options(page).first()).toHaveCSS("height", "52px");
    const snap = await page.getByRole("button", { name: "Snap" }).boundingBox();
    expect((snap?.y ?? 0) + (snap?.height ?? 0)).toBeLessThanOrEqual(844 - 22);
  });
}

test("numbers added reads in the panel and on the field", async ({ page }) => {
  await openRead(page);
  await pick(page, "TE, Hitch", "Right WR, Go", "Left WR, Out");
  await expect
    .poll(() =>
      labels(options(page).and(page.locator('[aria-pressed="true"]'))),
    )
    .toEqual([
      "Left WR, Out, read 3",
      "TE, Hitch, read 1",
      "Right WR, Go, read 2",
    ]);
  await expect(page.locator("[data-read-badge]")).toHaveText(["1", "2", "3"]);
  expect(
    await page
      .locator("[data-read-badge]")
      .evaluateAll((badges) =>
        badges.map((badge) => badge.getAttribute("data-read-badge")),
      ),
  ).toEqual(["Y", "Z", "X"]);
  await expect(page.locator("[data-read-ring]")).toHaveCount(3);
  await expect(page.locator("[data-read-ring]").first()).toHaveAttribute(
    "stroke",
    "#F4B13E",
  );
  for (const [letter, width] of [
    ["Y", "2.4"],
    ["Z", "2.4"],
    ["X", "2.4"],
    ["H", "2"],
    ["RB", "2"],
  ]) {
    await expect(page.locator(`[data-route="${letter}"]`)).toHaveAttribute(
      "stroke-width",
      width,
    );
  }
  await expect(
    page.getByText("Read order: TE, Right WR, Left WR"),
  ).toBeAttached();
  await expect(page.getByRole("img", { name: /^Field:/ })).toHaveAttribute(
    "aria-label",
    /Read order TE, then Right WR, then Left WR\.$/,
  );
});

test("dropping a read moves the later reads up", async ({ page }) => {
  await openRead(page);
  await pick(page, "TE, Hitch", "Right WR, Go", "Left WR, Out");
  await pick(page, "TE, Hitch, read 1");
  await expect
    .poll(() =>
      labels(options(page).and(page.locator('[aria-pressed="true"]'))),
    )
    .toEqual(["Left WR, Out, read 2", "Right WR, Go, read 1"]);
  expect(
    await page
      .locator("[data-read-badge]")
      .evaluateAll((badges) =>
        badges.map(
          (badge) =>
            `${badge.getAttribute("data-read-badge")}${badge.textContent}`,
        ),
      ),
  ).toEqual(["Z1", "X2"]);
  await expect(page.locator('[data-route="Y"]')).toHaveAttribute(
    "stroke-width",
    "2",
  );
});

test("a full order quiets the other options", async ({ page }) => {
  await openRead(page);
  await pick(page, "TE, Hitch", "Right WR, Go", "Left WR, Out");
  const slot = page.getByRole("button", { name: "Slot WR, Out", exact: true });
  await expect(slot).toHaveAttribute("aria-disabled", "true");
  await slot.dispatchEvent("click");
  await slot.focus();
  await page.keyboard.press("Enter");
  await expect(slot).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("[data-read-badge]")).toHaveCount(3);
  await pick(page, "Right WR, Go, read 2");
  await expect(slot).not.toHaveAttribute("aria-disabled");
  await slot.click();
  await expect(
    page.getByRole("button", { name: "Slot WR, Out, read 3" }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("Snap stays locked until every runner has a route", async ({ page }) => {
  await openRead(page, 3);
  await pick(page, "Left WR, Out");
  const snap = page.getByRole("button", { name: "Snap" });
  await expect(snap).toHaveAttribute("aria-disabled", "true");
  await expect(page.getByText("Set every route first")).toBeVisible();
  await snap.dispatchEvent("click");
  await snap.focus();
  await expect(snap).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Rep result")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "3 Read" })).toHaveAttribute(
    "aria-current",
    "step",
  );
});

test("Snap stays locked until a read is picked", async ({ page }) => {
  await openRead(page);
  const snap = page.getByRole("button", { name: "Snap" });
  await expect(snap).toHaveAttribute("aria-disabled", "true");
  await expect(page.getByText("Pick a read first")).toBeVisible();
  await expect(page.getByText("No reads picked")).toBeAttached();
  await snap.dispatchEvent("click");
  await snap.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Rep result")).toHaveCount(0);
  await pick(page, "Slot WR, Out");
  await expect(snap).toHaveAttribute("aria-disabled", "false");
  await expect(page.getByText("Pick in order · up to 3")).toBeVisible();
});

for (const theme of ["light", "dark"] as const) {
  test(`locked Snap uses the ${theme} disabled style`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await openRead(page);
    const snap = page.getByRole("button", { name: "Snap" });
    await expect(snap).toHaveCSS(
      "background-color",
      theme === "light" ? "rgb(220, 211, 193)" : "rgb(52, 64, 58)",
    );
    await expect(snap).toHaveCSS(
      "color",
      theme === "light" ? "rgb(90, 107, 98)" : "rgb(163, 177, 169)",
    );
    await pick(page, "TE, Hitch");
    await expect(snap).toHaveCSS("background-color", "rgb(224, 90, 43)");
  });
}

test("a read kept in to block leaves the order", async ({ page }) => {
  await openRead(page);
  await pick(page, "RB, Flat", "TE, Hitch", "Left WR, Out");
  await page.getByRole("button", { name: "1 Protect" }).click();
  await page.getByRole("radio", { name: "6-man" }).click();
  await page.getByRole("button", { name: "3 Read" }).click();
  await expect
    .poll(() =>
      labels(options(page).and(page.locator('[aria-pressed="true"]'))),
    )
    .toEqual(["Left WR, Out, read 2", "TE, Hitch, read 1"]);
  await expect(page.getByRole("button", { name: /^RB,/ })).toHaveCount(0);
  await expect(page.locator("[data-read-badge]")).toHaveText(["1", "2"]);
});

test("a failed simulation keeps Read open with an error", async ({ page }) => {
  await page.route(/\/src\/engine\/stub\/index\.ts/, async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      "function simulate(puzzle, design) {",
      'function simulate(puzzle, design) {\n  throw new EngineError("Rep reached the time cap");',
    );
    await route.fulfill({ response, body });
  });
  await openRead(page);
  await pick(page, "TE, Hitch");
  await page.getByRole("button", { name: "Snap" }).click();
  await expect(page.getByRole("alert")).toHaveText("Snap failed. Try again.");
  await expect(page.getByRole("group", { name: "Rep 1 of 4" })).toBeAttached();
  await expect(page.getByLabel("Rep result")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "TE, Hitch, read 1" }),
  ).toBeVisible();
});

test("desktop digits toggle reads and Enter snaps when unlocked", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openRead(page);
  await expect(page.getByText("1–5 add or drop a read")).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Rep result")).toHaveCount(0);
  await page.keyboard.press("3");
  await page.keyboard.press("1");
  await expect
    .poll(() =>
      labels(options(page).and(page.locator('[aria-pressed="true"]'))),
    )
    .toEqual(["Left WR, Out, read 2", "TE, Hitch, read 1"]);
  await page.keyboard.press("3");
  await expect(
    page.getByRole("button", { name: "Left WR, Out, read 1" }),
  ).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "INCOMPLETE" })).toBeVisible();
});
