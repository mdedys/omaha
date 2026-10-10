import { expect, test } from "@playwright/test";
import type { Browser, Page } from "@playwright/test";
import { rendered, screenMarkup } from "./page";

const routes = [
  ["TE", "Hitch"],
  ["Slot WR", "Out"],
  ["Right WR", "Go"],
  ["RB", "Flat"],
];

// Under the stub, Left WR's route picks the outcome. Times are seconds from
// Snap: Set ends at 0.8, the throw is at 2.8 and the catch at 3.8. The reveal
// starts at 4.4 on an incompletion and 5.4 on a completion, for 0.5s.
async function designPlay(page: Page, leftRoute: string) {
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
  await page
    .getByRole("button", { name: `Left WR, ${leftRoute}`, exact: true })
    .click();
}

// Snaps with the page clock paused on a 16 ms frame boundary and returns a
// function that plays the rep up to a moment, in seconds from Snap.
async function snapPaused(page: Page, leftRoute: string) {
  await page.clock.install({ time: 0 });
  await designPlay(page, leftRoute);
  await page.clock.pauseAt(64_000);
  await page.getByRole("button", { name: "Snap" }).click();
  await page.clock.runFor(16);
  let now = 0;
  return async (seconds: number) => {
    await page.clock.runFor(Math.round((seconds - now) * 1000));
    now = seconds;
    await rendered(page);
  };
}

// Share of pixels whose color differs by more than 8 in a channel, decoded in
// the page because Node has no PNG decoder here.
async function changedPixels(page: Page, a: Buffer, b: Buffer) {
  return page.evaluate(
    async ([first, second]) => {
      const pixels = async (data: string) => {
        const image = new Image();
        image.src = `data:image/png;base64,${data}`;
        await image.decode();
        const canvas = new OffscreenCanvas(image.width, image.height);
        const context = canvas.getContext("2d");
        context?.drawImage(image, 0, 0);
        return context?.getImageData(0, 0, image.width, image.height).data;
      };
      const [x, y] = [await pixels(first), await pixels(second)];
      if (!x || !y || x.length !== y.length) return 1;
      let changed = 0;
      for (let index = 0; index < x.length; index += 4) {
        if (
          [0, 1, 2].some(
            (channel) => Math.abs(x[index + channel] - y[index + channel]) > 8,
          )
        ) {
          changed++;
        }
      }
      return changed / (x.length / 4);
    },
    [a.toString("base64"), b.toString("base64")],
  );
}

// A new player in a new browser context, at this project's viewport.
async function newPlayer(browser: Browser) {
  const { baseURL, viewport, hasTouch } = test.info().project.use;
  const context = await browser.newContext({ baseURL, viewport, hasTouch });
  return context.newPage();
}

function livePanel(page: Page) {
  return page.getByRole("complementary", { name: "Live play" });
}

function caption(page: Page) {
  return livePanel(page).locator('[aria-live="polite"]');
}

function heading(page: Page) {
  return page.getByLabel("Rep result").getByRole("heading", { level: 1 });
}

const desktop = { width: 1280, height: 800 };
const phone = { width: 390, height: 844 };

test("Snap opens Live play on the Set caption with Skip focused", async ({
  page,
}) => {
  await snapPaused(page, "Out");
  await expect(caption(page).locator("b")).toHaveText("Set");
  await expect(caption(page).locator("span")).toHaveText(
    "Five in protection. Man up front.",
  );
  await expect(
    page.getByRole("button", { name: "Skip to result" }),
  ).toBeFocused();
  await expect(page.getByLabel("Rep result")).toHaveCount(0);
});

test("the caption region holds only the current phase", async ({ page }) => {
  const playTo = await snapPaused(page, "Out");
  await playTo(1.5);
  await expect(caption(page).locator(":scope > *")).toHaveText([
    "Snap",
    "Eyes locked on the Left WR.",
  ]);
});

test("the field is an image summing up the rep", async ({ page }) => {
  await snapPaused(page, "Out");
  await expect(
    page.getByRole("img", {
      name: "Live play, rep 1: Five in protection. Man up front. The quarterback looks to the Left WR. Let it rip to the Left WR. Broken up. Swatted. The corner closed on it. Then the result appears.",
      exact: true,
    }),
  ).toBeVisible();
});

test("Set holds every player at the Read step's spots for 0.8s", async ({
  page,
}) => {
  await page.clock.install({ time: 0 });
  await designPlay(page, "Out");
  const players = page.locator("[data-player]");
  const transforms = () =>
    players.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("transform")),
    );
  const read = await transforms();
  const qb = await page.locator('[data-player="QB"]').getAttribute("transform");
  await page.clock.pauseAt(64_000);
  await page.getByRole("button", { name: "Snap" }).click();
  await page.clock.runFor(16 + 750);
  await expect(caption(page).locator("b")).toHaveText("Set");
  expect(await transforms()).toEqual(read);
  await page.clock.runFor(250);
  await expect(caption(page).locator("b")).toHaveText("Snap");
  await expect(page.locator('[data-player="QB"]')).not.toHaveAttribute(
    "transform",
    qb ?? "",
  );
});

for (const [route, moments] of [
  [
    "Out",
    [
      [0.4, "Set", "Five in protection. Man up front."],
      [1.5, "Snap", "Eyes locked on the Left WR."],
      [3.3, "Throw", "Let it rip to the Left WR."],
      [4.0, "Broken up", "Swatted. The corner closed on it."],
    ],
  ],
  [
    "In",
    [
      [2.75, "Snap", "Eyes locked on the Left WR."],
      [2.85, "Sacked", "Nobody blocked the nickel."],
    ],
  ],
  [
    "Hook",
    [
      [3.3, "Throw", "Nobody open. Into the seats."],
      [4.0, "Thrown away", "His only read was covered."],
    ],
  ],
  [
    "Corner",
    [
      [3.3, "Throw", "Heat's coming. He forces it to the Left WR."],
      [4.0, "Broken up", "Swatted. The corner was waiting."],
    ],
  ],
  [
    "Flat",
    [
      [3.3, "Throw", "Let it rip to the Left WR."],
      [4.0, "Touchdown", "The Left WR takes it to the house."],
    ],
  ],
] as const) {
  test(`the caption calls a Left WR ${route} rep`, async ({ page }) => {
    const playTo = await snapPaused(page, route);
    for (const [seconds, word, line] of moments) {
      await playTo(seconds);
      await expect(caption(page).locator("b")).toHaveText(word);
      await expect(caption(page).locator("span")).toHaveText(line);
    }
  });
}

test("a touchdown's sheet still reads CONVERTED", async ({ page }) => {
  const playTo = await snapPaused(page, "Flat");
  await playTo(4);
  await expect(caption(page).locator("b")).toHaveText("Touchdown");
  await playTo(6);
  await expect(heading(page)).toHaveText("CONVERTED");
});

test("the cone follows the read and is gone 0.3s after the throw", async ({
  page,
}) => {
  const playTo = await snapPaused(page, "Out");
  const cone = page.locator("[data-vision-cone]");
  await playTo(0.7);
  await expect(cone).toHaveCount(0);
  await playTo(1.5);
  await expect(cone).toHaveAttribute("data-vision-cone", "X");
  await playTo(2.75);
  await expect(cone).toHaveCount(1);
  await playTo(3.15);
  await expect(cone).toHaveCount(0);
});

test("the cone is gone 0.3s after a sack", async ({ page }) => {
  const playTo = await snapPaused(page, "In");
  const cone = page.locator("[data-vision-cone]");
  await playTo(2.75);
  await expect(cone).toHaveCount(1);
  await playTo(3.15);
  await expect(cone).toHaveCount(0);
});

test("the ball flies from the throw to the catch", async ({ page }) => {
  const playTo = await snapPaused(page, "Out");
  const football = page.locator('[data-football="in-flight"]');
  await playTo(2.7);
  await expect(football).toHaveCount(0);
  await playTo(3.3);
  const cx = Number(await football.getAttribute("cx"));
  expect(cx).toBeGreaterThan(99.15);
  expect(cx).toBeLessThan(201.5);
  await playTo(4.0);
  await expect(football).toHaveAttribute("cx", /^99\.150\d*$/);
  await expect(football).toHaveAttribute("cy", "238");
});

test("a sack never shows the ball", async ({ page }) => {
  const playTo = await snapPaused(page, "In");
  for (const seconds of [1.5, 2.5, 2.9, 3.3]) {
    await playTo(seconds);
    await expect(livePanel(page)).toBeVisible();
    await expect(page.locator('[data-football="in-flight"]')).toHaveCount(0);
  }
});

const playArt = ["[data-zone]", "[data-feedback-badge]", "[data-ball-path]"];

test("play art waits for the reveal", async ({ page }) => {
  const playTo = await snapPaused(page, "Comeback");
  await playTo(5.3);
  const counts = () =>
    Promise.all(
      [...playArt, "[data-route]"].map((selector) =>
        page.locator(selector).count(),
      ),
    );
  expect(await counts()).toEqual([0, 0, 0, 0]);
  await playTo(5.6);
  await expect(page.locator("[data-ball-path]")).toHaveCount(1);
  expect(await counts()).toEqual([4, 5, 1, 0]);
});

for (const seconds of [0.4, 2.0, 4.3]) {
  test(`Skip at ${seconds}s shows Result at once`, async ({ page }) => {
    const playTo = await snapPaused(page, "Out");
    await playTo(seconds);
    await page.getByRole("button", { name: "Skip to result" }).click();
    await expect(heading(page)).toHaveText("INCOMPLETE");
    await expect(heading(page)).toBeFocused();
    await expect(livePanel(page)).toHaveCount(0);
    await expect(page.locator("[data-ball-path]")).not.toHaveAttribute(
      "opacity",
      /./,
    );
  });
}

for (const seconds of [0.4, 2.0, 4.6]) {
  test(`desktop Esc at ${seconds}s shows Result at once`, async ({ page }) => {
    await page.setViewportSize(desktop);
    const playTo = await snapPaused(page, "Out");
    await playTo(seconds);
    await expect(
      seconds < 4.4
        ? livePanel(page)
        : page.locator('[data-ball-path][opacity^="0."]'),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(heading(page)).toHaveText("INCOMPLETE");
    await expect(heading(page)).toBeFocused();
    await expect(livePanel(page)).toHaveCount(0);
    await expect(page.locator("[data-ball-path]")).not.toHaveAttribute(
      "opacity",
      /./,
    );
  });
}

test("reduced motion shows Result from the start", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await snapPaused(page, "Out");
  await expect(heading(page)).toHaveText("INCOMPLETE");
  await expect(heading(page)).toBeFocused();
  await expect(livePanel(page)).toHaveCount(0);
});

test("the screen after the reveal matches Result's", async ({ browser }) => {
  const played = await newPlayer(browser);
  const playTo = await snapPaused(played, "Out");
  await playTo(5);
  await expect(heading(played)).toBeFocused();
  const skipped = await newPlayer(browser);
  await snapPaused(skipped, "Out");
  await skipped.getByRole("button", { name: "Skip to result" }).click();
  await expect(heading(skipped)).toBeFocused();
  expect(await screenMarkup(played)).toBe(await screenMarkup(skipped));
  expect(
    await changedPixels(
      played,
      await played.screenshot(),
      await skipped.screenshot(),
    ),
  ).toBeLessThan(0.001);
});

test("the same design plays the same frames every time", async ({
  browser,
}) => {
  const moments = [0.4, 1.5, 3.3, 4.0, 4.5];
  const frames = async () => {
    const page = await newPlayer(browser);
    const playTo = await snapPaused(page, "Out");
    const markup: string[] = [];
    for (const seconds of moments) {
      await playTo(seconds);
      markup.push(await screenMarkup(page));
    }
    return markup;
  };
  const first = await frames();
  expect(new Set(first).size).toBe(moments.length);
  expect(await frames()).toEqual(first);
});

test("phone frames the play 180 units downfield", async ({ page }) => {
  await page.setViewportSize(phone);
  await snapPaused(page, "Out");
  const field = page.locator("svg.puzzle-field");
  await expect(field).toHaveAttribute("viewBox", "0 -180 403 872");
  const box = await field.boundingBox();
  expect([box?.width, Math.round(box?.height ?? 0)]).toEqual([390, 844]);
  const bar = await livePanel(page).boundingBox();
  expect([bar?.y, bar?.height]).toEqual([752, 92]);
  await expect(livePanel(page)).toHaveCSS("border-top-left-radius", "22px");
  await expect(
    livePanel(page).getByRole("button", { name: "Skip to result" }),
  ).toHaveText("SKIP", { useInnerText: true });
});

test("phone pills stay where Result puts them", async ({ page }) => {
  await page.setViewportSize(phone);
  await snapPaused(page, "Out");
  const pills = page.locator(".result-pills span");
  const boxes = () =>
    pills.evaluateAll((elements) =>
      elements.map((element) => {
        const { x, y, width, height } = element.getBoundingClientRect();
        return [x, y, width, height];
      }),
    );
  const live = await boxes();
  await page.getByRole("button", { name: "Skip to result" }).click();
  await expect(heading(page)).toBeVisible();
  expect(await boxes()).toEqual(live);
  expect(live[0][1]).toBe(14);
});

test("phone reveal raises the sheet as the camera pans", async ({ page }) => {
  await page.setViewportSize(phone);
  const playTo = await snapPaused(page, "Out");
  await playTo(4.4 + 0.125);
  const sheet = page.locator("section.result-sheet");
  const bottom = Number.parseFloat(
    await sheet.evaluate((element) => element.style.bottom),
  );
  const top = Number(
    (await page.locator("svg.puzzle-field").getAttribute("viewBox"))?.split(
      " ",
    )[1],
  );
  expect(bottom).toBeLessThan(0);
  expect(1 - bottom / -420).toBeGreaterThan(0.5);
  const pill = await page.locator(".result-pills span").first().boundingBox();
  expect([pill?.x, pill?.y]).toEqual([12, 14]);
  expect(1 - bottom / -420).toBeCloseTo(1 - top / -180, 5);
  await playTo(5);
  await expect(sheet).toHaveCSS("bottom", "0px");
  await expect(page.locator("svg.puzzle-field")).toHaveAttribute(
    "viewBox",
    "0 0 403 495",
  );
});

test("desktop plays the standard field beside the live panel", async ({
  page,
}) => {
  await page.setViewportSize(desktop);
  await snapPaused(page, "Out");
  await expect(page.locator("svg.puzzle-field")).toHaveAttribute(
    "viewBox",
    "0 0 403 495",
  );
  await expect(page.getByRole("group", { name: "Rep 1 of 4" })).toBeVisible();
  const panel = await livePanel(page).boundingBox();
  const skip = livePanel(page).getByRole("button", { name: "Skip to result" });
  const skipBox = await skip.boundingBox();
  expect([panel?.width, skipBox?.width, skipBox?.height]).toEqual([
    440, 383, 52,
  ]);
  await expect(skip).toHaveText("Skip to resultEsc");
  await expect(skip.locator("kbd")).toBeVisible();
  await expect(caption(page).locator("b")).toHaveCSS("font-size", "56px");
});

test("desktop reveal swaps the panel to the result", async ({ page }) => {
  await page.setViewportSize(desktop);
  const playTo = await snapPaused(page, "Out");
  await playTo(4.35);
  await expect(livePanel(page)).toBeVisible();
  await playTo(4.45);
  await expect(livePanel(page)).toHaveCount(0);
  await expect(
    page.getByRole("complementary", { name: "Rep result" }),
  ).toBeVisible();
  await expect(page.locator("svg.puzzle-field")).toHaveAttribute(
    "viewBox",
    "0 0 403 495",
  );
});

for (const [theme, colors] of [
  [
    "light",
    {
      bar: "rgb(244, 239, 228)",
      word: "rgb(24, 32, 28)",
      line: "rgb(74, 92, 83)",
      skip: ["rgb(255, 255, 255)", "rgb(220, 211, 193)", "rgb(36, 74, 62)"],
      kbd: "rgb(244, 239, 228)",
    },
  ],
  [
    "dark",
    {
      bar: "rgb(24, 32, 28)",
      word: "rgb(244, 239, 228)",
      line: "rgb(184, 196, 189)",
      skip: ["rgb(35, 44, 39)", "rgb(52, 64, 58)", "rgb(244, 239, 228)"],
      kbd: "rgb(24, 32, 28)",
    },
  ],
] as const) {
  for (const [size, viewport] of [
    ["phone", phone],
    ["desktop", desktop],
  ] as const) {
    test(`the ${size} live panel uses the ${theme} colors`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.setViewportSize(viewport);
      await snapPaused(page, "Out");
      const skip = livePanel(page).getByRole("button", {
        name: "Skip to result",
      });
      await expect(livePanel(page)).toHaveCSS("background-color", colors.bar);
      await expect(caption(page).locator("b")).toHaveCSS("color", colors.word);
      await expect(caption(page).locator("span")).toHaveCSS(
        "color",
        colors.line,
      );
      await expect(skip).toHaveCSS("background-color", colors.skip[0]);
      await expect(skip).toHaveCSS("border-top-color", colors.skip[1]);
      await expect(skip).toHaveCSS("color", colors.skip[2]);
      if (size === "desktop") {
        await expect(skip.locator("kbd")).toHaveCSS(
          "background-color",
          colors.kbd,
        );
      }
    });
  }
}

test("the field looks the same in light and dark", async ({ browser }) => {
  const field = async (colorScheme: "light" | "dark") => {
    const page = await newPlayer(browser);
    await page.emulateMedia({ colorScheme });
    const playTo = await snapPaused(page, "Out");
    await playTo(3.3);
    const stage = await page.locator(".play-stage").boundingBox();
    const panel = await livePanel(page).boundingBox();
    if (!stage || !panel) throw new Error("Live play is not on screen");
    const covered = panel.x < stage.x + stage.width;
    return {
      page,
      shot: await page.screenshot({
        clip: {
          ...stage,
          height: covered ? panel.y - stage.y : stage.height,
        },
      }),
    };
  };
  const light = await field("light");
  const dark = await field("dark");
  expect(await changedPixels(dark.page, dark.shot, light.shot)).toBeLessThan(
    0.001,
  );
});

test("browser back during Live play leaves the puzzle", async ({ page }) => {
  await page.goto("/how-to-play");
  await designPlay(page, "Out");
  await page.getByRole("button", { name: "Snap" }).click();
  await expect(livePanel(page)).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL("/how-to-play");
  await expect(
    page.getByRole("heading", { name: "How to play" }),
  ).toBeVisible();
});

const fading = (page: Page) =>
  Promise.all([
    page.locator('[data-field-layer="converted-line"]').getAttribute("opacity"),
    page.locator("[data-zone]").first().getAttribute("opacity"),
    page.locator(".result-keys").evaluate((element) => element.style.opacity),
  ]);

test("a converted rep fades in its line and key pill with the play art", async ({
  page,
}) => {
  await page.setViewportSize(phone);
  const playTo = await snapPaused(page, "Comeback");
  const line = page.locator('[data-field-layer="line-to-gain"]');
  const key = page.getByText("Defense · Cover 1 pressure");
  await playTo(5.3);
  await expect(line).toHaveAttribute("stroke-width", "2");
  await expect(key).toHaveCount(0);
  await playTo(5.65);
  await expect(key).toBeVisible();
  const [converted, zone, pill] = (await fading(page)).map(Number);
  expect(converted).toBeGreaterThan(0.2);
  expect(converted).toBeLessThan(0.8);
  expect(zone).toBe(converted);
  expect(pill).toBeCloseTo(converted, 5);
  await playTo(6);
  await expect(line).toHaveAttribute("stroke-width", "3.5");
  await expect(page.locator('[data-field-layer="converted-line"]')).toHaveCount(
    0,
  );
});

test("desktop fades in the Final pill with the play art", async ({ page }) => {
  await page.setViewportSize(desktop);
  const playTo = await snapPaused(page, "Comeback");
  const final = page.getByText("Final · defense revealed");
  const key = page.getByText("Defense · Cover 1 pressure");
  await playTo(5.3);
  await expect(final).toHaveCount(0);
  await playTo(5.65);
  await expect(final).toBeVisible();
  const [converted, zone, pills] = (await fading(page)).map(Number);
  expect(zone).toBeGreaterThan(0.2);
  expect(zone).toBeLessThan(0.8);
  expect(converted).toBe(zone);
  expect(pills).toBeCloseTo(zone, 5);
  const finalBox = await final.boundingBox();
  const keyBox = await key.boundingBox();
  expect((keyBox?.y ?? 0) - (finalBox?.y ?? 0) - (finalBox?.height ?? 0)).toBe(
    8,
  );
});
