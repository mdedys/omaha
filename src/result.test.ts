import { describe, expect, it } from "vitest";
import type { Design, ForcedBy, RouteCall } from "./engine/contract";
import { loadPuzzle } from "./engine";
import puzzleOne from "../public/puzzles/1.json";
import { resultSheet } from "./result";
import type { Played } from "./result";

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

async function play(puzzleJson: unknown, ...designs: Design[]) {
  const { puzzle, engine } = await loadPuzzle(puzzleJson);
  const played: Played[] = designs.map((design) => ({
    design,
    rep: engine.simulate(puzzle, design),
  }));
  return { puzzle, engine, played };
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
const sackAgain = slot({ route: "Hook", depth: 10 });
const interception = slot({ route: "Post", depth: 10 });
const converted = slot({ route: "In", depth: 10 });

describe("copy deck", () => {
  it.each([
    [
      "sack-free-rusher-man",
      "SACKED",
      "Nobody blocked the linebacker. Count the rushers next time.",
    ],
    [
      "sack-beat-block",
      "SACKED",
      "The nickel beat his block before a read came open. Your QB never had a chance.",
    ],
    [
      "throwaway",
      "INCOMPLETE",
      "Both reads were covered, so he threw it away. Give him someone to throw to.",
    ],
    [
      "breakup-closed",
      "INCOMPLETE",
      "The corner closed on the Left WR and swatted it. Get it there sooner.",
    ],
    [
      "breakup-forced-pressure",
      "INCOMPLETE",
      "Pressure forced the throw to the Left WR, and the corner swatted it. Buy him more time.",
    ],
    [
      "interception-closed",
      "PICKED OFF",
      "The safety jumped the throw to the Left WR. He says thanks.",
    ],
    [
      "interception-forced-out-of-reads",
      "PICKED OFF",
      "Out of reads, he forced it to the Left WR and the corner picked it. Nobody was open.",
    ],
    [
      "short",
      "SHORT",
      "The nickel stopped the TE 5 yards short. Close doesn't count.",
    ],
    [
      "converted-cover-1",
      "CONVERTED",
      "The TE picked up 12 yards. Take notes, real OC.",
    ],
    [
      "touchdown-first-down",
      "CONVERTED",
      "The Slot WR took it 25 yards to the house. Take a bow.",
    ],
  ])("states the cause of v1's %s design", async (name, headline, line) => {
    const { puzzle, design } = scenario(name);
    const { engine, played, puzzle: parsed } = await play(puzzle, design);
    expect(resultSheet(parsed, engine, played)).toMatchObject({
      headline,
      line,
    });
  });

  it.each([
    [
      1,
      puzzleOne,
      {
        protection: { blockers: 7, lineCall: "slide-right" },
        routes: {
          X: { route: "In", depth: 10 },
          Z: { route: "Go" },
          H: { route: "Hitch" },
        },
        readOrder: ["Z"],
      },
      "Your only read was covered, so he threw it away. Give him someone to throw to.",
    ],
    [
      3,
      scenario("throwaway").puzzle,
      {
        protection: { blockers: 6, lineCall: "man" },
        routes: {
          X: { route: "Slant" },
          Y: { route: "Post", depth: 10 },
          Z: { route: "Go" },
          H: { route: "Hook", depth: 5 },
        },
        readOrder: ["X", "Y", "Z"],
      },
      "All three reads were covered, so he threw it away. Give him someone to throw to.",
    ],
  ] satisfies [number, unknown, Design, string][])(
    "counts %i covered reads on a throwaway",
    async (_reads, puzzleJson, design, line) => {
      const { puzzle, engine, played } = await play(puzzleJson, design);
      expect(resultSheet(puzzle, engine, played).line).toBe(line);
    },
  );

  it.each([
    [
      "breakup",
      "out-of-reads",
      {
        protection: { blockers: 7, lineCall: "slide-left" },
        routes: {
          X: { route: "Go" },
          Z: { route: "Corner", depth: 10 },
          H: { route: "Hook", depth: 10 },
        },
        readOrder: ["Z", "X", "H"],
      },
      "Out of reads, he forced it to the Right WR and the corner swatted it. Nobody was open.",
    ],
    [
      "interception",
      "pressure",
      {
        protection: { blockers: 5, lineCall: "slide-left" },
        routes: {
          X: { route: "Go" },
          Y: { route: "Hook", depth: 10 },
          Z: { route: "Slant" },
          H: { route: "Post", depth: 10 },
          RB: { route: "Seam" },
        },
        readOrder: ["H", "X", "Z"],
      },
      "Pressure forced the throw to the Slot WR, and the safety picked it. He says thanks.",
    ],
  ] satisfies [string, ForcedBy, Design, string][])(
    "words a forced %s by %s",
    async (_cause, forcedBy, design, line) => {
      const { puzzle, engine, played } = await play(puzzleOne, design);
      expect(played[0].rep.cause.forcedBy).toBe(forcedBy);
      expect(resultSheet(puzzle, engine, played).line).toBe(line);
    },
  );
});

describe("result sheet", () => {
  it("shows a sack's yards, pocket time and the read the QB was on", async () => {
    const { puzzle, engine, played } = await play(puzzleOne, sack);
    expect(resultSheet(puzzle, engine, played)).toMatchObject({
      variant: "cream",
      tile: { kind: "fail" },
      stats: [
        { value: "−7", label: "yards" },
        { value: "2.1s", label: "in the pocket" },
        { value: "WR", label: "on 1st read", receiver: "H" },
      ],
      status: "3 reps left",
    });
  });

  it("shows a throwaway as thrown away", async () => {
    const { puzzle, design } = scenario("throwaway");
    const { engine, played, puzzle: parsed } = await play(puzzle, design);
    expect(resultSheet(parsed, engine, played).stats[2]).toEqual({
      value: "—",
      label: "thrown away",
    });
  });

  it("shows a short rep's yards on a gold tile and its box", async () => {
    const { puzzle, engine, played } = await play(puzzleOne, breakup, short);
    expect(resultSheet(puzzle, engine, played)).toMatchObject({
      variant: "cream",
      tile: { kind: "short", yards: "+7" },
      boxes: [
        { state: "no gain" },
        { state: "short", yards: "+7" },
        { state: "next" },
        { state: "unused" },
      ],
      status: "2 reps left",
    });
  });

  it("counts down to one rep left", async () => {
    const { puzzle, engine, played } = await play(
      puzzleOne,
      breakup,
      interception,
      sack,
    );
    expect(resultSheet(puzzle, engine, played).status).toBe("1 rep left");
  });

  it("scores a conversion and shows the streak as unavailable", async () => {
    const { puzzle, engine, played } = await play(
      puzzleOne,
      breakup,
      converted,
    );
    expect(resultSheet(puzzle, engine, played)).toMatchObject({
      variant: "win",
      ended: true,
      tile: null,
      stats: [
        { value: "+20", label: "yards gained" },
        { value: "85", label: "points" },
        { value: "—", label: "day streak" },
      ],
      boxes: [
        { state: "no gain" },
        { state: "converted" },
        { state: "not needed" },
        { state: "not needed" },
      ],
      status: "Converted in 2",
    });
  });

  it("ends the puzzle out of reps after a fourth failed rep", async () => {
    const { puzzle, engine, played } = await play(
      puzzleOne,
      breakup,
      short,
      sack,
      interception,
    );
    expect(resultSheet(puzzle, engine, played)).toMatchObject({
      variant: "over",
      ended: true,
      headline: "OUT OF REPS",
      line: "The safety jumped the throw to the Slot WR. Four reps, no first down.",
      stats: [
        { value: "0", label: "points" },
        { value: "+7", label: "best rep" },
        { value: "4", label: "reps used" },
      ],
      boxes: [
        { state: "no gain" },
        { state: "short", yards: "+7" },
        { state: "no gain" },
        { state: "no gain" },
      ],
      status: "No reps left",
    });
  });

  it("signs the best rep when every rep lost yards", async () => {
    const { puzzle, engine, played } = await play(
      puzzleOne,
      sack,
      sackAgain,
      sack,
      sack,
    );
    expect(resultSheet(puzzle, engine, played).stats[1]).toEqual({
      value: "−7",
      label: "best rep",
    });
  });
});
