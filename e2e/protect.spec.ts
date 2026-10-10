import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import type { FormationId } from "../src/engine/contract";
import fixture from "../public/puzzles/1.json" with { type: "json" };

async function openProtect(page: Page) {
  await page.goto("/puzzle/1");
  await expect(
    page.getByRole("radiogroup", { name: "Blockers" }),
  ).toBeVisible();
}

const formations: { id: FormationId; options: string[] }[] = [
  { id: "gun-trey", options: ["5-man", "6-man", "7-man"] },
  { id: "gun-doubles", options: ["5-man", "6-man", "7-man"] },
  { id: "gun-trips", options: ["5-man", "6-man"] },
  { id: "gun-spread", options: ["5-man", "6-man"] },
  { id: "gun-empty", options: ["5-man"] },
  { id: "gun-doubles-12", options: ["5-man", "6-man", "7-man"] },
  { id: "ace", options: ["5-man", "6-man", "7-man"] },
];

for (const formation of formations) {
  for (const flip of [false, true]) {
    test(`offers equal-width counts for ${formation.id}, flip ${flip}`, async ({
      page,
    }) => {
      await page.route("**/puzzles/1.json", (route) =>
        route.fulfill({
          json: { ...fixture, formation: { id: formation.id, flip } },
        }),
      );
      await openProtect(page);
      const group = page.getByRole("radiogroup", { name: "Blockers" });
      const radios = group.getByRole("radio");
      await expect(radios).toHaveText(formation.options);
      const widths = await radios.evaluateAll((elements) =>
        elements.map((element) => element.getBoundingClientRect().width),
      );
      const groupWidth = await group.evaluate(
        (element) => element.getBoundingClientRect().width,
      );
      for (const width of widths) {
        expect(width).toBeCloseTo(
          (groupWidth - 8 - (formation.options.length - 1) * 3) /
            formation.options.length,
          1,
        );
      }
    });
  }
}

for (const blockers of [5, 6, 7]) {
  for (const call of ["Slide left", "Man", "Slide right"]) {
    test(`selects ${blockers}-man ${call} immediately`, async ({ page }) => {
      await openProtect(page);
      await page.getByRole("radio", { name: `${blockers}-man` }).click();
      await page.getByRole("radio", { name: call, exact: true }).click();
      await expect(
        page.getByRole("radio", { name: `${blockers}-man` }),
      ).toBeChecked();
      await expect(
        page.getByRole("radio", { name: call, exact: true }),
      ).toBeChecked();
      const blockersCopy =
        blockers === 5
          ? "Line stays in"
          : blockers === 6
            ? "Line + RB stay in"
            : "Line + RB + TE stay in";
      const lineCopy =
        call === "Man"
          ? blockers === 5
            ? "Line takes defensive linemen"
            : "Line takes defensive linemen. Backs take remaining rushers inside-out."
          : blockers === 5
            ? call === "Slide left"
              ? "Line slides left"
              : "Line slides right"
            : call === "Slide left"
              ? "RB takes the right edge"
              : "RB takes the left edge";
      await expect(page.getByText(blockersCopy, { exact: true })).toBeVisible();
      await expect(page.getByText(lineCopy, { exact: true })).toBeVisible();
      await expect(page.getByRole("img", { name: /^Field:/ })).toHaveAttribute(
        "aria-label",
        `Field: 3rd and 10, own 45. Pre-snap offense and defense; blue line of scrimmage, yellow line to gain. ${blockers}-man protection. ${blockersCopy}. ${lineCopy}${lineCopy.endsWith(".") ? "" : "."}`,
      );
    });

    test(`Next retains ${blockers}-man ${call} in Routes`, async ({ page }) => {
      await openProtect(page);
      await page.getByRole("radio", { name: `${blockers}-man` }).click();
      await page.getByRole("radio", { name: call, exact: true }).click();
      const next = page.getByRole("button", { name: "Next: routes" });
      await expect(next).toBeEnabled();
      await next.click();
      await expect(page.getByRole("heading", { name: "Routes" })).toBeVisible();
      const storedCall =
        call === "Man"
          ? "man"
          : call === "Slide left"
            ? "slide-left"
            : "slide-right";
      await expect(page.locator(".draft-summary")).toHaveText(
        `Current draft: ${blockers}-man · ${storedCall}. No routes or reads set.`,
      );
      await page.getByRole("button", { name: "3 Read" }).click();
      await expect(page.locator(".draft-summary")).toHaveText(
        `Current draft: ${blockers}-man · ${storedCall}. No routes or reads set.`,
      );
      await page.getByRole("button", { name: "1 Protect" }).click();
      await expect(
        page.getByRole("radio", { name: `${blockers}-man` }),
      ).toBeChecked();
      await expect(
        page.getByRole("radio", { name: call, exact: true }),
      ).toBeChecked();
    });
  }
}

for (const group of ["Blockers", "Line call"]) {
  for (const key of ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]) {
    test(`${group} selects locally with ${key}`, async ({ page }) => {
      await openProtect(page);
      const radios = page.getByRole("radiogroup", { name: group });
      const start = group === "Blockers" ? "5-man" : "Man";
      const forward = key === "ArrowRight" || key === "ArrowDown";
      const end =
        group === "Blockers"
          ? forward
            ? "6-man"
            : "7-man"
          : forward
            ? "Slide right"
            : "Slide left";
      await radios.getByRole("radio", { name: start, exact: true }).focus();
      await page.keyboard.press(key);
      const selected = radios.getByRole("radio", { name: end, exact: true });
      await expect(selected).toBeChecked();
      await expect(selected).toBeFocused();
      if (group === "Blockers") {
        await expect(
          page.getByRole("radio", { name: "Man", exact: true }),
        ).toBeChecked();
      }
      await page.keyboard.press(key);
      await page.keyboard.press(key);
      await expect(
        radios.getByRole("radio", { name: start, exact: true }),
      ).toBeChecked();
    });
  }
}

test("Tab enters only checked radios in play flow order", async ({ page }) => {
  await openProtect(page);
  await page.getByRole("radio", { name: "7-man" }).click();
  await page.getByRole("radio", { name: "Slide right" }).click();
  await page.getByRole("button", { name: "1 Protect" }).focus();
  for (const control of [
    { role: "button", name: "2 Routes" },
    { role: "button", name: "3 Read" },
    { role: "radio", name: "7-man" },
    { role: "radio", name: "Slide right" },
    { role: "button", name: "Next: routes" },
  ] as const) {
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole(control.role, { name: control.name }),
    ).toBeFocused();
  }
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Routes" })).toBeVisible();
});

test("Space selects a focused radio", async ({ page }) => {
  await openProtect(page);
  await page.getByRole("radio", { name: "6-man" }).focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("radio", { name: "6-man" })).toBeChecked();
  await expect(
    page.getByText("Line + RB stay in", { exact: true }),
  ).toBeVisible();
});

for (const width of [899, 900, 1280]) {
  test(`desktop shortcuts respect ${width}px boundary`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await openProtect(page);
    await page.keyboard.press("6");
    await page.keyboard.press("ArrowLeft");
    await expect(
      page.getByRole("radio", { name: width < 900 ? "5-man" : "6-man" }),
    ).toBeChecked();
    await expect(
      page.getByRole("radio", {
        name: width < 900 ? "Man" : "Slide left",
        exact: true,
      }),
    ).toBeChecked();
    await page.keyboard.press("7");
    await page.keyboard.press("ArrowRight");
    await expect(
      page.getByRole("radio", { name: width < 900 ? "5-man" : "7-man" }),
    ).toBeChecked();
    await expect(
      page.getByRole("radio", {
        name: width < 900 ? "Man" : "Slide right",
        exact: true,
      }),
    ).toBeChecked();
    await page.keyboard.press("5");
    await page.keyboard.press("m");
    await expect(page.getByRole("radio", { name: "5-man" })).toBeChecked();
    await expect(
      page.getByRole("radio", { name: "Man", exact: true }),
    ).toBeChecked();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("button", {
        name: width < 900 ? "1 Protect" : "2 Routes",
      }),
    ).toHaveAttribute("aria-current", "step");
  });
}

for (const formation of ["gun-trips", "gun-empty"]) {
  test(`unavailable numeric shortcut leaves ${formation} unchanged`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 900, height: 800 });
    await page.route("**/puzzles/1.json", (route) =>
      route.fulfill({
        json: { ...fixture, formation: { id: formation, flip: false } },
      }),
    );
    await openProtect(page);
    await page.keyboard.press("7");
    await expect(page.getByRole("radio", { name: "5-man" })).toBeChecked();
    await page.keyboard.press("6");
    await expect(
      page.getByRole("radio", {
        name: formation === "gun-empty" ? "5-man" : "6-man",
      }),
    ).toBeChecked();
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("radio", { name: "Slide left" })).toBeChecked();
  });
}

test("focused step Enter takes precedence over Next shortcut", async ({
  page,
}) => {
  await page.setViewportSize({ width: 900, height: 800 });
  await openProtect(page);
  await page.getByRole("button", { name: "3 Read" }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Read", exact: true }),
  ).toBeVisible();
});

for (const theme of ["light", "dark"] as const) {
  test(`selected radios use ${theme} theme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await openProtect(page);
    await page.getByRole("radio", { name: "6-man" }).click();
    const selected = page.getByRole("radio", { name: "6-man" });
    await expect(selected).toHaveCSS(
      "background-color",
      theme === "light" ? "rgb(36, 74, 62)" : "rgb(244, 239, 228)",
    );
    await expect(selected).toHaveCSS(
      "color",
      theme === "light" ? "rgb(244, 239, 228)" : "rgb(24, 32, 28)",
    );
  });
}

test("Landing enters usable Protect controls", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-09T16:00:00Z") });
  await page.goto("/");
  await page.getByRole("link", { name: "Play today's puzzle" }).click();
  await page.getByRole("radio", { name: "6-man" }).click();
  await expect(
    page.getByText("Line + RB stay in", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next: routes" }).click();
  await expect(page.locator(".draft-summary")).toHaveText(
    "Current draft: 6-man · man. No routes or reads set.",
  );
});

test("Man adds block marks only for players staying in", async ({ page }) => {
  await openProtect(page);
  const art = page.locator('[data-field-layer="protection"]');
  await expect(art.locator("path")).toHaveCount(5);
  // v1 C is (0, -0.5) yards: SVG (201.5, 372.4). The Man
  // stem is 30 units upfield and its 12-unit bar is 12 units upfield.
  await expect(page.locator('[data-player="C"]')).toHaveAttribute(
    "transform",
    "translate(201.5 372.4)",
  );
  await expect(art.locator('[data-protection="C"]')).toHaveAttribute(
    "d",
    "M201.5 342.4V360.4M195.5 360.4H207.5",
  );
  await page.getByRole("radio", { name: "7-man" }).click();
  await expect(art.locator("path")).toHaveCount(7);
  await expect(art.locator('[data-protection="RB"]')).toHaveAttribute(
    "stroke",
    "#5BDB8C",
  );
  await expect(art.locator('[data-protection="Y"]')).toHaveAttribute(
    "stroke",
    "#DADDE0",
  );
  await page.getByRole("radio", { name: "5-man" }).click();
  await expect(art.locator("path")).toHaveCount(5);
});

test("Man marks follow the flipped formation on the right hash", async ({
  page,
}) => {
  await page.route("**/puzzles/1.json", (route) =>
    route.fulfill({
      json: {
        ...fixture,
        situation: { ...fixture.situation, hash: "right" },
        formation: { id: "gun-trey", flip: true },
      },
    }),
  );
  await openProtect(page);
  await page.getByRole("radio", { name: "7-man" }).click();
  // Right hash ball x=4 yards; flipped Y x=-0.5, RB x=5.5.
  // Project independently at 403/31.5 units per yard, y=366-12.8*yards.
  const art = page.locator('[data-field-layer="protection"]');
  for (const mark of [
    { id: "C", x: 252.67460317460316, y: 372.4 },
    { id: "Y", x: 195.1031746031746, y: 372.4 },
    { id: "RB", x: 271.86507936507934, y: 430 },
  ]) {
    const coordinates = await art
      .locator(`[data-protection="${mark.id}"]`)
      .evaluate((element) =>
        element
          .getAttribute("d")
          ?.match(/-?\d+(?:\.\d+)?/g)
          ?.map(Number),
      );
    if (!coordinates) throw new Error(`Missing ${mark.id} Man mark`);
    expect(coordinates).toHaveLength(6);
    expect(coordinates[0]).toBeCloseTo(mark.x, 8);
    expect(coordinates[1]).toBeCloseTo(mark.y - 30, 8);
    expect(coordinates[2]).toBeCloseTo(mark.y - 12, 8);
    expect(coordinates[3]).toBeCloseTo(mark.x - 6, 8);
    expect(coordinates[4]).toBeCloseTo(mark.y - 12, 8);
    expect(coordinates[5]).toBeCloseTo(mark.x + 6, 8);
  }
});

for (const call of ["Slide left", "Slide right"]) {
  test(`${call} draws directional arrows with opposite RB edge`, async ({
    page,
  }) => {
    await openProtect(page);
    await page.getByRole("radio", { name: "7-man" }).click();
    await page.getByRole("radio", { name: call }).click();
    const art = page.locator('[data-field-layer="protection"]');
    await expect(art.locator("path")).toHaveCount(3);
    const diagram = await art.evaluate((element) => {
      const slide = element.querySelector('[data-protection="slide"]');
      const rb = element.querySelector('[data-protection="RB"]');
      const te = element.querySelector('[data-protection="Y"]');
      return {
        slide: slide
          ?.getAttribute("d")
          ?.match(/-?\d+(?:\.\d+)?/g)
          ?.map(Number),
        rb: rb
          ?.getAttribute("d")
          ?.match(/-?\d+(?:\.\d+)?/g)
          ?.map(Number),
        te: te
          ?.getAttribute("d")
          ?.match(/-?\d+(?:\.\d+)?/g)
          ?.map(Number),
      };
    });
    if (!diagram.slide || !diagram.rb || !diagram.te) {
      throw new Error("Missing visible protection artwork");
    }
    if (call === "Slide left") {
      expect(diagram.slide[2]).toBeLessThan(diagram.slide[0]);
      expect(diagram.rb[2]).toBeGreaterThan(diagram.rb[0]);
      expect(diagram.te[2]).toBeLessThan(diagram.te[0]);
    } else {
      expect(diagram.slide[2]).toBeGreaterThan(diagram.slide[0]);
      expect(diagram.rb[2]).toBeLessThan(diagram.rb[0]);
      expect(diagram.te[2]).toBeGreaterThan(diagram.te[0]);
    }
    await page.getByRole("radio", { name: "5-man" }).click();
    await expect(art.locator("path")).toHaveCount(1);
    await expect(art.locator('[data-protection="slide"]')).toHaveAttribute(
      "stroke",
      "#DADDE0",
    );
  });
}

test("focused radio Enter activates that option instead of Next", async ({
  page,
}) => {
  await page.setViewportSize({ width: 900, height: 800 });
  await openProtect(page);
  await page.getByRole("radio", { name: "6-man" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("radio", { name: "6-man" })).toBeChecked();
  await expect(
    page.getByText("Line + RB stay in", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "1 Protect" })).toHaveAttribute(
    "aria-current",
    "step",
  );
});

for (const formation of formations) {
  test(`radio arrows wrap over available ${formation.id} counts`, async ({
    page,
  }) => {
    await page.route("**/puzzles/1.json", (route) =>
      route.fulfill({
        json: { ...fixture, formation: { id: formation.id, flip: false } },
      }),
    );
    await openProtect(page);
    await page.getByRole("radio", { name: "5-man" }).focus();
    await page.keyboard.press("ArrowLeft");
    const last = formation.options[formation.options.length - 1];
    await expect(page.getByRole("radio", { name: last })).toBeChecked();
    await expect(page.getByRole("radio", { name: last })).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("radio", { name: "5-man" })).toBeChecked();
    await expect(page.getByRole("radio", { name: "5-man" })).toBeFocused();
  });

  test(`Next opens Routes for ${formation.id}`, async ({ page }) => {
    await page.route("**/puzzles/1.json", (route) =>
      route.fulfill({
        json: { ...fixture, formation: { id: formation.id, flip: false } },
      }),
    );
    await openProtect(page);
    const next = page.getByRole("button", { name: "Next: routes" });
    await expect(next).toBeEnabled();
    await next.click();
    await expect(page.getByRole("heading", { name: "Routes" })).toBeVisible();
    await expect(page.locator(".draft-summary")).toHaveText(
      "Current draft: 5-man · man. No routes or reads set.",
    );
  });
}
