import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
import { rendered, screenMarkup } from "./page";

const routes = [
  ["TE", "Hitch"],
  ["Slot WR", "Out"],
  ["Right WR", "Go"],
  ["RB", "Flat"],
];

// Under the stub, Left WR's route picks the outcome. With the Left WR as the
// first read, a 5-yard Out breaks at 1.6s, throws at 2.0s and ends at 3.0s;
// a Slant is a sack that breaks at 0.95s and ends at 2.0s.
async function playRep(page: Page, leftRoute: "Out" | "Slant") {
  await page.getByRole("button", { name: "Next: routes" }).click();
  await page.getByRole("button", { name: /^Left WR, / }).click();
  await page.getByRole("option", { name: leftRoute, exact: true }).click();
  if (leftRoute === "Out") {
    await page.getByRole("radio", { name: "5 yds", exact: true }).click();
  }
  for (const [receiver, route] of routes) {
    const runner = page.getByRole("button", { name: `${receiver}, no route` });
    if (await runner.count()) {
      await runner.click();
      await page.getByRole("option", { name: route, exact: true }).click();
    }
  }
  await page.getByRole("button", { name: "Next: read" }).click();
  const read = page.getByRole("button", { name: /^Left WR, / });
  if ((await read.getAttribute("aria-pressed")) !== "true") await read.click();
  await page.getByRole("button", { name: "Snap" }).click();
  await page.getByRole("button", { name: "Skip to result" }).click();
}

// Opens Replay from Result with the page clock paused, so playback only
// moves when a test runs the clock.
async function openReplay(page: Page, leftRoute: "Out" | "Slant" = "Out") {
  await page.clock.install({ time: 0 });
  await page.goto("/puzzle/1");
  await page.clock.pauseAt(64_000);
  await playRep(page, leftRoute);
  await page.getByRole("button", { name: "Watch the replay again" }).click();
}

async function run(page: Page, ms: number) {
  await page.clock.runFor(ms);
  await rendered(page);
}

function panel(page: Page) {
  return page.getByLabel("Playback", { exact: true });
}

function slider(page: Page) {
  return page.getByRole("slider", { name: "Replay position" });
}

function playButton(page: Page) {
  return panel(page).locator(".replay-play");
}

function readout(page: Page) {
  return page.locator(".replay-time");
}

function moments(page: Page) {
  return page
    .getByRole("group", { name: "Jump to a moment" })
    .getByRole("button");
}

function pressed(locator: Locator) {
  return locator.evaluateAll((buttons) =>
    buttons.map((button) => button.getAttribute("aria-pressed")),
  );
}

function transforms(page: Page) {
  return page
    .locator("[data-player]")
    .evaluateAll((players) =>
      players.map((player) => [
        player.getAttribute("data-player"),
        player.getAttribute("transform"),
      ]),
    );
}

test("the replay square opens Replay for the rep", async ({ page }) => {
  await openReplay(page);
  await expect(page.getByLabel("Rep result")).toHaveCount(0);
  await expect(panel(page)).toBeVisible();
  await expect(slider(page)).toBeVisible();
  await expect(page.locator(".replay-pill")).toHaveText("Rep 1 replay");
  await expect(
    page.getByRole("group", { name: "Rep 1 used, 3 left" }),
  ).toBeAttached();
});

test("Back to the result returns to Result as it was left", async ({
  page,
}) => {
  await page.goto("/puzzle/1");
  await playRep(page, "Out");
  const heading = page.getByLabel("Rep result").getByRole("heading");
  await expect(heading).toBeFocused();
  const result = await screenMarkup(page);
  await page.getByRole("button", { name: "Watch the replay again" }).click();
  await page.getByRole("button", { name: "End" }).click();
  await page.getByRole("button", { name: "Back to the result" }).click();
  await expect(heading).toBeFocused();
  expect(await screenMarkup(page)).toBe(result);
});

test("Replay opens paused at 0.0s at 0.5×", async ({ page }) => {
  await openReplay(page);
  await run(page, 2000);
  await expect(slider(page)).toHaveAttribute("aria-valuenow", "0");
  await expect(readout(page)).toHaveText("0.0s / 3.0s");
  await expect(playButton(page)).toHaveAttribute("aria-label", "Play");
  await expect(page.getByRole("radio", { name: "0.5×" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
});

test("Replay opens at 0.0s again after it was moved", async ({ page }) => {
  await openReplay(page);
  await page.getByRole("button", { name: "Throw" }).click();
  await page.getByRole("radio", { name: "1×" }).click();
  await page.getByRole("button", { name: "Back to the result" }).click();
  await page.getByRole("button", { name: "Watch the replay again" }).click();
  await expect(slider(page)).toHaveAttribute("aria-valuenow", "0");
  await expect(page.getByRole("radio", { name: "0.5×" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
});

test("Play moves the readout and thumb with the clock", async ({ page }) => {
  await openReplay(page);
  await playButton(page).click();
  await run(page, 1016);
  await expect(readout(page)).toHaveText("0.5s / 3.0s");
  const thumb = await page.locator(".replay-thumb").boundingBox();
  const track = await slider(page).boundingBox();
  expect(
    ((thumb?.x ?? 0) + 7 - (track?.x ?? 0)) / (track?.width ?? 1),
  ).toBeCloseTo(0.5 / 3, 2);
});

test("Play and Pause swap the button's label and icon", async ({ page }) => {
  await openReplay(page);
  const button = playButton(page);
  await expect(button.locator("[data-glyph]")).toHaveAttribute(
    "data-glyph",
    "play",
  );
  await button.click();
  await expect(button).toHaveAttribute("aria-label", "Pause");
  await expect(button.locator("[data-glyph]")).toHaveAttribute(
    "data-glyph",
    "pause",
  );
  await button.click();
  await expect(button).toHaveAttribute("aria-label", "Play");
  await expect(button.locator("[data-glyph]")).toHaveAttribute(
    "data-glyph",
    "play",
  );
});

test("Pause holds the position", async ({ page }) => {
  await openReplay(page);
  await playButton(page).click();
  await run(page, 1016);
  await playButton(page).click();
  const paused = await slider(page).getAttribute("aria-valuenow");
  await run(page, 1000);
  await expect(slider(page)).toHaveAttribute("aria-valuenow", paused ?? "");
});

test("the pill shows the play glyph while playing", async ({ page }) => {
  await openReplay(page);
  const glyph = page.locator(".replay-pill [data-glyph]");
  await expect(glyph).toHaveAttribute("data-glyph", "pause");
  await playButton(page).click();
  await expect(glyph).toHaveAttribute("data-glyph", "play");
});

test("the pill names the rep being replayed", async ({ page }) => {
  await page.clock.install({ time: 0 });
  await page.goto("/puzzle/1");
  await page.clock.pauseAt(64_000);
  await playRep(page, "Out");
  await page.getByRole("button", { name: "Run it back" }).click();
  await playRep(page, "Slant");
  await page.getByRole("button", { name: "Watch the replay again" }).click();
  await expect(page.locator(".replay-pill")).toHaveText("Rep 2 replay");
  await expect(
    page.getByRole("group", { name: "Rep 2 used, 2 left" }),
  ).toBeAttached();
});

for (const [speed, ms, shown] of [
  ["0.25×", 2016, "0.5s"],
  ["0.5×", 2016, "1.0s"],
  ["1×", 2016, "2.0s"],
] as const) {
  test(`${speed} plays ${shown} in ${ms - 16} ms`, async ({ page }) => {
    await openReplay(page);
    await page.getByRole("radio", { name: speed }).click();
    await playButton(page).click();
    await run(page, ms);
    await expect(readout(page)).toHaveText(`${shown} / 3.0s`);
  });
}

test("playback stops at the end and shows Play", async ({ page }) => {
  await openReplay(page);
  await page.getByRole("radio", { name: "1×" }).click();
  await playButton(page).click();
  await run(page, 3500);
  await expect(playButton(page)).toHaveAttribute("aria-label", "Play");
  await expect(slider(page)).toHaveAttribute("aria-valuenow", "3");
  await run(page, 500);
  await expect(slider(page)).toHaveAttribute("aria-valuenow", "3");
});

test("Play at the end restarts from 0.0s", async ({ page }) => {
  await openReplay(page);
  await page.getByRole("button", { name: "End" }).click();
  await page.getByRole("radio", { name: "1×" }).click();
  await playButton(page).click();
  await run(page, 516);
  await expect(playButton(page)).toHaveAttribute("aria-label", "Pause");
  await expect(readout(page)).toHaveText("0.5s / 3.0s");
});

for (const [action, act] of [
  [
    "a frame step",
    (page: Page) =>
      page.getByRole("button", { name: "Forward one frame" }).click(),
  ],
  [
    "a jump-to moment",
    (page: Page) => page.getByRole("button", { name: "Break" }).click(),
  ],
  [
    "scrubbing the track",
    (page: Page) => slider(page).click({ position: { x: 10, y: 7 } }),
  ],
  ["the slider's arrow key", (page: Page) => slider(page).press("ArrowRight")],
] as const) {
  test(`${action} while playing pauses`, async ({ page }) => {
    await openReplay(page);
    await playButton(page).click();
    await run(page, 516);
    await act(page);
    await expect(playButton(page)).toHaveAttribute("aria-label", "Play");
    const at = await slider(page).getAttribute("aria-valuenow");
    await run(page, 1000);
    await expect(slider(page)).toHaveAttribute("aria-valuenow", at ?? "");
  });
}

test("the slider runs from tick 0 to the rep's end", async ({ page }) => {
  await openReplay(page);
  await expect(slider(page)).toHaveAttribute("aria-valuemin", "0");
  await expect(slider(page)).toHaveAttribute("aria-valuemax", "3");
  await slider(page).press("End");
  await expect(slider(page)).toHaveAttribute("aria-valuenow", "3");
  await slider(page).press("Home");
  await expect(slider(page)).toHaveAttribute("aria-valuenow", "0");
});

test("a sack's slider ends at the sack", async ({ page }) => {
  await openReplay(page, "Slant");
  await expect(slider(page)).toHaveAttribute("aria-valuemax", "2");
});

test("the frame buttons move exactly one tick", async ({ page }) => {
  await openReplay(page);
  await page.getByRole("button", { name: "Throw" }).click();
  await page.getByRole("button", { name: "Forward one frame" }).click();
  await expect(slider(page)).toHaveAttribute("aria-valuenow", "2.05");
  await page.getByRole("button", { name: "Back one frame" }).click();
  await page.getByRole("button", { name: "Back one frame" }).click();
  await expect(slider(page)).toHaveAttribute("aria-valuenow", "1.95");
});

test("a frame step moves every player one tick", async ({ page }) => {
  await openReplay(page);
  await page.getByRole("button", { name: "End" }).click();
  const end = await transforms(page);
  await page.getByRole("button", { name: "Back one frame" }).click();
  const before = await transforms(page);
  await page.getByRole("button", { name: "Forward one frame" }).click();
  expect(await transforms(page)).toEqual(end);
  expect(before).not.toEqual(end);
});

test("the frame buttons stop at 0 and the end", async ({ page }) => {
  await openReplay(page);
  await page.getByRole("button", { name: "Back one frame" }).click();
  await expect(slider(page)).toHaveAttribute("aria-valuenow", "0");
  await page.getByRole("button", { name: "End" }).click();
  await page.getByRole("button", { name: "Forward one frame" }).click();
  await expect(slider(page)).toHaveAttribute("aria-valuenow", "3");
});

test("the slider's arrow keys move one tick", async ({ page }) => {
  await openReplay(page);
  await slider(page).press("ArrowRight");
  await expect(slider(page)).toHaveAttribute("aria-valuenow", "0.05");
  await expect(slider(page)).toHaveAttribute("aria-valuetext", "0.1 seconds");
  await slider(page).press("ArrowLeft");
  await expect(slider(page)).toHaveAttribute("aria-valuenow", "0");
});

test("tapping the track moves there", async ({ page }) => {
  await openReplay(page);
  const box = await slider(page).boundingBox();
  await slider(page).click({ position: { x: (box?.width ?? 0) / 2, y: 7 } });
  await expect(slider(page)).toHaveAttribute("aria-valuenow", "1.5");
});

test("the jump-to row lists the snap, break, throw and end", async ({
  page,
}) => {
  await openReplay(page);
  await expect(moments(page)).toHaveText([
    "Snap0.0s",
    "Break1.6s",
    "Throw2.0s",
    "End3.0s",
  ]);
});

test("a sack's jump-to row has no Throw", async ({ page }) => {
  await openReplay(page, "Slant");
  await expect(moments(page)).toHaveText(["Snap0.0s", "Break1.0s", "End2.0s"]);
});

for (const [name, seconds, index] of [
  ["Snap", "0", 0],
  ["Break", "1.6", 1],
  ["Throw", "2", 2],
  ["End", "3", 3],
] as const) {
  test(`${name} jumps to ${seconds}s and is selected`, async ({ page }) => {
    await openReplay(page);
    await page.getByRole("button", { name: "End" }).click();
    await page.getByRole("button", { name }).click();
    await expect(slider(page)).toHaveAttribute("aria-valuenow", seconds);
    expect(await pressed(moments(page))).toEqual(
      [0, 1, 2, 3].map((at) => String(at === index)),
    );
  });
}

test("no moment is selected between moments", async ({ page }) => {
  await openReplay(page);
  await expect(page.getByRole("button", { name: "Snap" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Forward one frame" }).click();
  expect(await pressed(moments(page))).toEqual([
    "false",
    "false",
    "false",
    "false",
  ]);
});

test("the slider names the moment it rests on", async ({ page }) => {
  await openReplay(page);
  await page.getByRole("button", { name: "Throw" }).click();
  await expect(slider(page)).toHaveAttribute(
    "aria-valuetext",
    "2.0 seconds, throw",
  );
});

// Each segment's left and right edge as a share of the track.
async function segments(page: Page) {
  const track = await slider(page).boundingBox();
  const boxes = await page
    .locator(".replay-segment")
    .evaluateAll((spans) =>
      spans.map((span) => span.getBoundingClientRect().toJSON()),
    );
  return boxes.map(({ left, right }) => [
    Math.round(left - (track?.x ?? 0)),
    Math.round(right - (track?.x ?? 0)),
  ]);
}

test("the scrubber splits into phases at the break and the throw", async ({
  page,
}) => {
  await openReplay(page);
  const width = (await slider(page).boundingBox())?.width ?? 0;
  expect(await segments(page)).toEqual([
    [0, Math.round(width * (32 / 60) - 1)],
    [Math.round(width * (32 / 60) + 1), Math.round(width * (40 / 60) - 1)],
    [Math.round(width * (40 / 60) + 1), Math.round(width)],
  ]);
});

test("a sack's scrubber splits into two phases at the break", async ({
  page,
}) => {
  await openReplay(page, "Slant");
  const width = (await slider(page).boundingBox())?.width ?? 0;
  expect(await segments(page)).toEqual([
    [0, Math.round(width * (19 / 40) - 1)],
    [Math.round(width * (19 / 40) + 1), Math.round(width)],
  ]);
});

test("at the throw the QB still holds the ball", async ({ page }) => {
  await openReplay(page);
  await page.getByRole("button", { name: "Throw" }).click();
  await expect(page.locator("[data-football]")).toHaveCount(0);
  await expect(page.locator("[data-ball-path]")).toHaveCount(0);
  await page.getByRole("button", { name: "Forward one frame" }).click();
  await expect(page.locator("[data-football]")).toHaveCount(1);
  await expect(page.locator("[data-ball-path]")).toHaveAttribute(
    "d",
    /^M201\.5 447\.06\d*L196\.38\d* 436\.61\d*$/,
  );
});

test("at the end the ball rests at the catch with its whole path", async ({
  page,
}) => {
  await openReplay(page);
  await page.getByRole("button", { name: "End" }).click();
  const football = page.locator('[data-football="in-flight"]');
  await expect(football).toHaveAttribute("cx", /^99\.150\d*$/);
  await expect(football).toHaveAttribute("cy", "238");
  await expect(page.locator("[data-ball-path]")).toHaveAttribute(
    "d",
    /^M201\.5 447\.06\d*L99\.150\d* 238$/,
  );
  await expect(page.locator("[data-ball-path]")).not.toHaveAttribute(
    "stroke-opacity",
    /./,
  );
});

test("a sack never shows the ball", async ({ page }) => {
  await openReplay(page, "Slant");
  for (const name of ["Snap", "Break", "End"]) {
    await page.getByRole("button", { name }).click();
    await expect(page.locator("[data-player]")).toHaveCount(22);
    await expect(page.locator("[data-football]")).toHaveCount(0);
  }
});

test("at 0.0s every player is on his pre-snap spot", async ({ page }) => {
  await page.clock.install({ time: 0 });
  await page.goto("/puzzle/1");
  await expect(page.locator("[data-player]")).toHaveCount(22);
  const preSnap = await transforms(page);
  await page.clock.pauseAt(64_000);
  await playRep(page, "Out");
  await page.getByRole("button", { name: "Watch the replay again" }).click();
  expect(await transforms(page)).toEqual(preSnap);
});

test("at the end every player is where Result draws him", async ({ page }) => {
  await openReplay(page);
  await page.getByRole("button", { name: "Back to the result" }).click();
  const result = await transforms(page);
  await page.getByRole("button", { name: "Watch the replay again" }).click();
  await page.getByRole("button", { name: "End" }).click();
  expect(await transforms(page)).toEqual(result);
});

const art = [
  "[data-route]",
  "[data-zone]",
  "[data-defense-path]",
  "[data-start-dot]",
  "[data-feedback-badge]",
  "[data-vision-cone]",
  "[data-read-ring]",
  "[data-protection]",
];

for (const name of ["Break", "End"]) {
  test(`at ${name} the field draws only players and the ball`, async ({
    page,
  }) => {
    await openReplay(page);
    await page.getByRole("button", { name }).click();
    const counts = await Promise.all(
      [...art, "[data-player]"].map((selector) =>
        page.locator(selector).count(),
      ),
    );
    expect(counts).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 22]);
  });
}

test("every Playback button is at least 44×44", async ({ page }) => {
  await openReplay(page);
  const boxes = await page
    .getByLabel("Playback")
    .getByRole("button")
    .evaluateAll((buttons) =>
      buttons.map((button) => {
        const { width, height } = button.getBoundingClientRect();
        return [
          button.textContent || button.getAttribute("aria-label"),
          width >= 44 && height >= 44,
        ];
      }),
    );
  expect(boxes.filter(([, big]) => !big)).toEqual([]);
  expect(boxes).toHaveLength(8);
});

// What a tap lands on 21.5px above, below, left and right of a control's
// centre.
async function hitArea(page: Page, control: Locator) {
  const box = await control.boundingBox();
  const x = (box?.x ?? 0) + (box?.width ?? 0) / 2;
  const y = (box?.y ?? 0) + (box?.height ?? 0) / 2;
  return page.evaluate(
    (points) =>
      points.map(([px, py]) =>
        document.elementFromPoint(px, py)?.getAttribute("role"),
      ),
    [
      [x, y - 21.5],
      [x, y + 21.5],
      [x - 21.5, y],
      [x + 21.5, y],
    ],
  );
}

test("the slider's hit area is at least 44px tall", async ({ page }) => {
  await openReplay(page);
  await slider(page).press("End");
  await slider(page).press("Home");
  const thumb = page.locator(".replay-thumb");
  const box = await slider(page).boundingBox();
  const thumbBox = await thumb.boundingBox();
  const hits = await page.evaluate(
    ({ x, y }) =>
      [y - 21.5, y + 21.5].map((at) =>
        document.elementFromPoint(x, at)?.getAttribute("role"),
      ),
    {
      x: (box?.x ?? 0) + (box?.width ?? 0) / 2,
      y: (thumbBox?.y ?? 0) + 7,
    },
  );
  expect(hits).toEqual(["slider", "slider"]);
});

for (const speed of ["0.25×", "0.5×", "1×"]) {
  test(`the ${speed} option's hit area is at least 44×44`, async ({ page }) => {
    await openReplay(page);
    expect(
      await hitArea(page, page.getByRole("radio", { name: speed })),
    ).toEqual(["radio", "radio", "radio", "radio"]);
  });
}

test.describe("desktop keyboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openReplay(page);
  });

  test("Space toggles play", async ({ page }) => {
    await page.keyboard.press(" ");
    await expect(playButton(page)).toHaveAttribute("aria-label", "Pause");
    await page.keyboard.press(" ");
    await expect(playButton(page)).toHaveAttribute("aria-label", "Play");
  });

  test(". and , step one frame", async ({ page }) => {
    await page.keyboard.press(".");
    await page.keyboard.press(".");
    await expect(slider(page)).toHaveAttribute("aria-valuenow", "0.1");
    await page.keyboard.press(",");
    await expect(slider(page)).toHaveAttribute("aria-valuenow", "0.05");
  });

  test("Enter returns to the result", async ({ page }) => {
    await page.keyboard.press("Enter");
    await expect(
      page.getByLabel("Rep result").getByRole("heading"),
    ).toBeFocused();
  });

  test("a focused button keeps Space and Enter", async ({ page }) => {
    await page.getByRole("button", { name: "End" }).focus();
    await page.keyboard.press(" ");
    await expect(slider(page)).toHaveAttribute("aria-valuenow", "3");
    await expect(playButton(page)).toHaveAttribute("aria-label", "Play");
    await page.getByRole("button", { name: "Snap" }).focus();
    await page.keyboard.press("Enter");
    await expect(slider(page)).toHaveAttribute("aria-valuenow", "0");
    await expect(panel(page)).toBeVisible();
  });

  test("the focused slider keeps its keys", async ({ page }) => {
    await slider(page).focus();
    await page.keyboard.press(".");
    await page.keyboard.press(" ");
    await page.keyboard.press("Enter");
    await expect(slider(page)).toHaveAttribute("aria-valuenow", "0");
    await expect(playButton(page)).toHaveAttribute("aria-label", "Play");
    await expect(panel(page)).toBeVisible();
  });
});

test("phone lays Replay out as the design does", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openReplay(page);
  const box = async (locator: Locator) => {
    const found = await locator.boundingBox();
    return [found?.x, found?.y, found?.width, found?.height].map((value) =>
      Math.round(value ?? -1),
    );
  };
  expect(await box(page.locator(".puzzle-field"))).toEqual([0, 52, 390, 479]);
  expect(await box(page.locator(".replay-pill"))).toEqual([
    12,
    64,
    expect.any(Number),
    26,
  ]);
  expect(await box(panel(page))).toEqual([0, 531, 390, 313]);
  expect((await box(page.getByLabel("Back one frame"))).slice(2)).toEqual([
    48, 48,
  ]);
  expect((await box(playButton(page))).slice(2)).toEqual([60, 60]);
  expect((await box(moments(page).first())).slice(3)).toEqual([46]);
  expect(
    (await box(page.getByRole("button", { name: "Back to the result" }))).slice(
      3,
    ),
  ).toEqual([52]);
  await expect(page.locator(".replay-jump-label")).toBeHidden();
});

test("desktop lays Replay out as the design does", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openReplay(page);
  const stage = await page.locator(".play-stage").boundingBox();
  const pill = await page.locator(".replay-pill").boundingBox();
  expect([
    (pill?.x ?? 0) - (stage?.x ?? 0),
    (pill?.y ?? 0) - (stage?.y ?? 0),
    pill?.height,
  ]).toEqual([36, 36, 30]);
  const size = async (locator: Locator) => {
    const found = await locator.boundingBox();
    return [found?.width, found?.height];
  };
  expect(await size(panel(page))).toEqual([440, 736]);
  expect(
    (await size(page.getByRole("radiogroup", { name: "Playback speed" })))[0],
  ).toBe(180);
  expect((await size(page.getByRole("radio", { name: "1×" })))[1]).toBe(32);
  expect(await size(page.getByLabel("Back one frame"))).toEqual([52, 52]);
  expect(await size(playButton(page))).toEqual([68, 68]);
  expect((await size(moments(page).first()))[1]).toBe(52);
  expect(
    (await size(page.getByRole("button", { name: "Back to the result" })))[1],
  ).toBe(58);
  await expect(page.getByText("Jump to", { exact: true })).toBeVisible();
  await expect(page.locator(".replay-actions .protect-hint")).toHaveText(
    "Space play/pause · , . step a frame",
  );
});

for (const [theme, ink, page_] of [
  ["light", "rgb(36, 74, 62)", "rgb(244, 239, 228)"],
  ["dark", "rgb(244, 239, 228)", "rgb(24, 32, 28)"],
] as const) {
  test(`the ${theme} theme colors the controls`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await openReplay(page);
    await expect(playButton(page)).toHaveCSS("background-color", ink);
    await expect(playButton(page)).toHaveCSS("color", page_);
    await expect(page.locator(".replay-thumb")).toHaveCSS(
      "background-color",
      ink,
    );
    await expect(page.getByRole("radio", { name: "0.5×" })).toHaveCSS(
      "background-color",
      ink,
    );
    await expect(page.getByRole("button", { name: "Snap" })).toHaveCSS(
      "border-top-color",
      ink,
    );
    await expect(page.locator(".replay-pill")).toHaveCSS(
      "color",
      "rgb(244, 239, 228)",
    );
  });
}
