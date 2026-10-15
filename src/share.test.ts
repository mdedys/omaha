import { describe, expect, it } from "vitest";
import type { Design, RouteCall } from "./engine/contract";
import { loadPuzzle } from "./engine";
import puzzleOneJson from "../public/puzzles/1.json";
import tutorial from "./tutorial.json";
import { countdown, nextPuzzleAt, shareResult } from "./share";

// Puzzle 1's situation against the tutorial's fixed defense, so these reps
// don't change when puzzle 1's defense does.
const puzzleOne = { ...puzzleOneJson, defense: tutorial.defense };

type Scenario = { puzzle: unknown; design: Design };
const scenarios = import.meta.glob<Scenario>("./engine/v1/scenarios/*.json", {
  eager: true,
  import: "default",
});

function scenario(name: string): Scenario {
  const found = scenarios[`./engine/v1/scenarios/${name}.json`];
  if (!found) throw new Error(`No v1 scenario named ${name}`);
  return found;
}

async function share(puzzleJson: unknown, ...designs: Design[]) {
  const { puzzle, engine } = await loadPuzzle(puzzleJson);
  const reps = designs.map((design) => engine.simulate(puzzle, design));
  return shareResult(puzzle, engine, reps);
}

// Puzzle 1 with the Slot WR read first; the Slot WR's route picks the outcome.
function slot(route: RouteCall): Design {
  return {
    protection: { blockers: 5, lineCall: "man" },
    routes: {
      X: { route: "Post", depth: 10 },
      Y: { route: "Hitch" },
      H: route,
      Z: { route: "Go" },
      RB: { route: "Flat" },
    },
    readOrder: ["H", "X"],
  };
}
const breakup = slot({ route: "Out", depth: 10 });
const short = slot({ route: "Hitch" });
const sack = slot({ route: "Comeback", depth: 10 });
const interception = slot({ route: "Post", depth: 10 });
const converted = slot({ route: "In", depth: 10 });

describe("share result", () => {
  it("shows a conversion that beat the pros", async () => {
    expect(await share(puzzleOne, breakup, converted)).toMatchObject({
      variant: "win",
      number: 1,
      situation: "3rd & 10",
      headline: "CONVERTED",
      status: "Converted in 2",
      line: "3rd & 10 · in 2 reps · +20 yards",
      tiles: [
        { kind: "fail", label: "Incomplete" },
        { kind: "converted", label: "Converted" },
        { kind: "not needed" },
        { kind: "not needed" },
      ],
      tilesLabel:
        "Rep 1 incomplete, rep 2 converted, rep 3 not needed, rep 4 not needed",
      chip: "Beat the pros",
      points: 85,
      pros: "Incomplete",
      you: "+20 · 1st down",
    });
  });

  it("writes the pasted text for a conversion", async () => {
    expect((await share(puzzleOne, breakup, converted)).text).toBe(
      "Omaha #1 · 3rd & 10\n🟥🟩\nConverted in 2 · Beat the pros · 85 pts",
    );
  });

  it("shows four spent reps as out of reps", async () => {
    expect(
      await share(puzzleOne, breakup, short, sack, interception),
    ).toMatchObject({
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
    expect(
      (await share(puzzleOne, breakup, short, sack, interception)).text,
    ).toBe("Omaha #1 · 3rd & 10\n🟥🟨🟥🟥\nOut of reps · 0 pts");
  });

  it.each([
    ["sack-free-rusher-man", { kind: "fail", label: "Sacked" }],
    ["sack-beat-block", { kind: "fail", label: "Sacked" }],
    ["throwaway", { kind: "fail", label: "Incomplete" }],
    ["breakup-closed", { kind: "fail", label: "Incomplete" }],
    ["breakup-forced-pressure", { kind: "fail", label: "Incomplete" }],
    ["interception-closed", { kind: "fail", label: "Picked" }],
    ["interception-forced-out-of-reads", { kind: "fail", label: "Picked" }],
    ["short", { kind: "short", label: "Short", yards: "+5" }],
    ["converted-cover-1", { kind: "converted", label: "Converted" }],
    ["touchdown-first-down", { kind: "converted", label: "Converted" }],
  ])("labels a rep played with v1's %s design", async (name, tile) => {
    const { puzzle, design } = scenario(name);
    const result = await share(puzzle, design);
    expect(result.tiles[0]).toEqual(tile);
  });

  // The breakup-closed design is broken up on this puzzle too.
  it("shows a touchdown as a conversion", async () => {
    const { puzzle, design } = scenario("touchdown-first-down");
    expect(
      await share(puzzle, scenario("breakup-closed").design, design),
    ).toMatchObject({
      headline: "CONVERTED",
      chip: "Beat the pros",
      you: "+25 · 1st down",
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
