import { describe, expect, it } from "vitest";
import type { RouteName } from "./engine/contract";
import { loadPuzzle } from "./engine";
import gunTrey from "./engine/stub/gun-trey.json";
import { scenarios } from "./engine/stub/fixtures";
import { countdown, nextPuzzleAt, shareResult } from "./share";

async function share(...routes: RouteName[]) {
  const { puzzle, engine } = await loadPuzzle(gunTrey);
  const reps = routes.map((route) => {
    const scenario = scenarios.find(
      (entry) => entry.design.routes.X?.route === route,
    );
    if (!scenario) throw new Error(`No stub scenario for ${route}`);
    return engine.simulate(puzzle, scenario.design);
  });
  return shareResult(puzzle, engine, reps);
}

describe("share result", () => {
  it("shows a conversion that beat the pros", async () => {
    expect(await share("Out", "Comeback")).toMatchObject({
      variant: "win",
      number: 12,
      situation: "3rd & 10",
      headline: "CONVERTED",
      status: "Converted in 2",
      line: "3rd & 10 · in 2 reps · +13 yards",
      tiles: [
        { kind: "fail", label: "Incomplete" },
        { kind: "converted", label: "Converted" },
        { kind: "not needed" },
        { kind: "not needed" },
      ],
      tilesLabel:
        "Rep 1 incomplete, rep 2 converted, rep 3 not needed, rep 4 not needed",
      chip: "Beat the pros",
      points: 78,
      pros: "Incomplete",
      you: "+13 · 1st down",
    });
  });

  it("writes the pasted text for a conversion", async () => {
    expect((await share("Out", "Comeback")).text).toBe(
      "Omaha #12 · 3rd & 10\n🟥🟩\nConverted in 2 · Beat the pros · 78 pts",
    );
  });

  it("shows four spent reps as out of reps", async () => {
    expect(await share("Out", "Go", "In", "Post")).toMatchObject({
      variant: "over",
      headline: "OUT OF REPS",
      status: "Out of reps",
      line: "3rd & 10 · 4 reps · no first down",
      tiles: [
        { kind: "fail", label: "Incomplete" },
        { kind: "short", label: "Short", yards: "+7" },
        { kind: "fail", label: "Sacked" },
        { kind: "fail", label: "Picked" },
      ],
      tilesLabel:
        "Rep 1 incomplete, rep 2 short, +7, rep 3 sacked, rep 4 picked",
      chip: "Didn't beat the pros",
      points: 0,
      you: "No first down",
    });
  });

  it("writes the pasted text for out of reps", async () => {
    expect((await share("Out", "Go", "In", "Post")).text).toBe(
      "Omaha #12 · 3rd & 10\n🟥🟨🟥🟥\nOut of reps · 0 pts",
    );
  });

  it.each([
    ["In", { kind: "fail", label: "Sacked" }],
    ["Slant", { kind: "fail", label: "Sacked" }],
    ["Hook", { kind: "fail", label: "Incomplete" }],
    ["Out", { kind: "fail", label: "Incomplete" }],
    ["Corner", { kind: "fail", label: "Incomplete" }],
    ["Post", { kind: "fail", label: "Picked" }],
    ["Drag", { kind: "fail", label: "Picked" }],
    ["Go", { kind: "short", label: "Short", yards: "+7" }],
    ["Comeback", { kind: "converted", label: "Converted" }],
    ["Flat", { kind: "converted", label: "Converted" }],
  ] satisfies [RouteName, object][])(
    "labels a rep played with %s",
    async (route, tile) => {
      const result = await share(route);
      expect(result.tiles[0]).toEqual(tile);
    },
  );

  it("shows a touchdown as a conversion", async () => {
    expect(await share("Out", "Flat")).toMatchObject({
      headline: "CONVERTED",
      chip: "Beat the pros",
      you: "+55 · 1st down",
      tiles: [
        { kind: "fail", label: "Incomplete" },
        { kind: "converted", label: "Converted" },
        { kind: "not needed" },
        { kind: "not needed" },
      ],
    });
  });
});

describe("next puzzle", () => {
  it.each([
    ["an evening in daylight time", "2026-10-10T23:17:41Z", 16_939],
    [
      "a moment partway through a second",
      "2026-10-10T23:17:41.250Z",
      16_938.75,
    ],
    ["just after midnight", "2026-10-10T04:00:01Z", 86_399],
    ["exactly midnight", "2026-10-10T04:00:00Z", 86_400],
    ["the night clocks fall back", "2026-11-01T05:00:00Z", 86_400],
    ["the night clocks spring forward", "2027-03-14T05:00:00Z", 82_800],
  ])("counts %s to the next US Eastern midnight", (_, now, seconds) => {
    const start = Date.parse(now);
    expect((nextPuzzleAt(start) - start) / 1000).toBe(seconds);
  });

  it.each([
    [16_939_000, "04:42:19"],
    [16_938_200, "04:42:19"],
    [1_000, "00:00:01"],
    [86_400_000, "24:00:00"],
  ])("formats %i ms as %s", (ms, text) => {
    expect(countdown(ms)).toBe(text);
  });
});
