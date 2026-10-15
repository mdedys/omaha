import { describe, expect, it } from "vitest";
import type {
  Blockers,
  Design,
  ForcedBy,
  LineCall,
  RouteCall,
} from "./engine/contract";
import { loadPuzzle } from "./engine";
import puzzleOneJson from "../public/puzzles/1.json";
import tutorial from "./tutorial.json";
import { playback } from "./playback";
import { liveCaption, liveLabel, resultSheet } from "./result";
import type { Played } from "./result";

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
const slotDesigns = { breakup, short, sack, interception, converted };

function playSlot(...names: (keyof typeof slotDesigns)[]) {
  return play(puzzleOne, ...names.map((name) => slotDesigns[name]));
}

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

  it.each([
    [["breakup"], []],
    [
      ["breakup", "short"],
      ["DL1", "DL2", "DL3", "DL4", "LB1", "LB2", "LB3"],
    ],
    [
      ["breakup", "short", "sack"],
      [
        "DL1",
        "DL2",
        "DL3",
        "DL4",
        "LB1",
        "LB2",
        "LB3",
        "CB1",
        "CB2",
        "NB",
        "S1",
      ],
    ],
    [
      ["converted"],
      [
        "DL1",
        "DL2",
        "DL3",
        "DL4",
        "LB1",
        "LB2",
        "LB3",
        "CB1",
        "CB2",
        "NB",
        "S1",
      ],
    ],
  ] satisfies [(keyof typeof slotDesigns)[], string[]][])(
    "reveals the play art for the failed reps so far after %j",
    async (reps, revealed) => {
      const { puzzle, engine, played } = await playSlot(...reps);
      expect(
        Object.keys(resultSheet(puzzle, engine, played).playArt.assignments),
      ).toEqual(revealed);
    },
  );

  it.each([
    [
      ["breakup"],
      "Rep 1 final frame with the defense revealed: incomplete. The corner closed on the Slot WR and swatted it.",
    ],
    [
      ["sack"],
      "Rep 1 final frame with the defense revealed: sacked. Nobody blocked the nickel.",
    ],
    [
      ["interception"],
      "Rep 1 final frame with the defense revealed: picked off. The safety jumped the throw to the Slot WR.",
    ],
    [
      ["short"],
      "Rep 1 final frame with the defense revealed: short. The corner stopped the Slot WR 3 yards short.",
    ],
  ] satisfies [(keyof typeof slotDesigns)[], string][])(
    "labels the field with the outcome after %j",
    async (reps, label) => {
      const { puzzle, engine, played } = await playSlot(...reps);
      expect(resultSheet(puzzle, engine, played).fieldLabel).toBe(label);
    },
  );

  it.each([
    [
      ["breakup", "short", "sack"],
      "Rep 3 final frame with the defense revealed: sacked. Nobody blocked the nickel.",
    ],
    [
      ["breakup", "converted"],
      "Rep 2 final frame against Cover 1 pressure: converted. The Slot WR picked up 20 yards.",
    ],
    [
      ["breakup", "short", "sack", "interception"],
      "Rep 4 final frame against Cover 1 pressure: picked off. The safety jumped the throw to the Slot WR.",
    ],
  ] satisfies [(keyof typeof slotDesigns)[], string][])(
    "names the coverage in the field label only once the puzzle ends, after %j",
    async (reps, label) => {
      const { puzzle, engine, played } = await playSlot(...reps);
      expect(resultSheet(puzzle, engine, played).fieldLabel).toBe(label);
    },
  );
});

// The QB reads the Slot WR's drag, moves on to the Left WR at 1.85s and
// forces it to him under pressure.
const readChange = slot({ route: "Drag" });
// The TE's 5-yard out is the only read, and it's covered.
const oneReadThrowaway: Design = {
  ...breakup,
  routes: { ...breakup.routes, Y: { route: "Out", depth: 5 } },
  readOrder: ["Y"],
};

describe("live captions", () => {
  it.each([
    [5, "man", "Five in protection. Man up front."],
    [6, "slide-left", "Six in protection. Line slides left."],
    [7, "slide-right", "Seven in protection. Line slides right."],
  ] satisfies [Blockers, LineCall, string][])(
    "sets %i blockers with %s",
    async (blockers, lineCall, line) => {
      const { puzzle, engine, played } = await play(puzzleOne, breakup);
      const design = {
        ...played[0].design,
        protection: { blockers, lineCall },
      };
      expect(
        liveCaption(
          puzzle,
          engine,
          { ...played[0], design },
          { phase: "set", read: "H" },
        ),
      ).toEqual({ word: "Set", line });
    },
  );

  it("locks the QB's eyes on his first read at the snap", async () => {
    const { puzzle, engine, played } = await play(puzzleOne, breakup);
    expect(
      liveCaption(puzzle, engine, played[0], { phase: "snap", read: "H" }),
    ).toEqual({ word: "Snap", line: "Eyes locked on the Slot WR." });
  });

  it("names the new read when the QB moves on", async () => {
    const { puzzle, engine, played } = await play(puzzleOne, readChange);
    expect(
      liveCaption(puzzle, engine, played[0], playback(played[0].rep, 2.3)),
    ).toEqual({ word: "Snap", line: "Nothing there. Eyes to the Left WR." });
  });

  it.each([
    ["breakup-closed", "Let it rip to the Left WR."],
    ["throwaway", "Nobody open. Into the seats."],
    ["breakup-forced-pressure", "Heat's coming. He forces it to the Left WR."],
    [
      "interception-forced-out-of-reads",
      "Nothing clean. He forces it to the Left WR.",
    ],
  ])("calls the throw in v1's %s design", async (name, line) => {
    const { puzzle, design } = scenario(name);
    const { engine, played, puzzle: parsed } = await play(puzzle, design);
    expect(
      liveCaption(parsed, engine, played[0], { phase: "throw", read: "X" }),
    ).toEqual({ word: "Throw", line });
  });

  it.each([
    ["sack-free-rusher-man", "Sacked", "Nobody blocked the linebacker."],
    ["sack-beat-block", "Sacked", "The nickel beat his block."],
    ["throwaway", "Thrown away", "Every read was covered."],
    ["breakup-closed", "Broken up", "Swatted. The corner closed on it."],
    [
      "breakup-forced-pressure",
      "Broken up",
      "Swatted. The corner was waiting.",
    ],
    ["interception-closed", "Picked off", "The safety jumped the throw."],
    [
      "interception-forced-out-of-reads",
      "Picked off",
      "The corner was sitting on it.",
    ],
    ["short", "Stopped short", "5 yards shy of the sticks."],
    ["converted-cover-1", "First down", "The TE moves the chains."],
    ["touchdown-first-down", "Touchdown", "The Slot WR takes it to the house."],
  ])("calls the outcome of v1's %s design %s", async (name, word, line) => {
    const { puzzle, design } = scenario(name);
    const { engine, played, puzzle: parsed } = await play(puzzle, design);
    expect(
      liveCaption(parsed, engine, played[0], {
        phase: "outcome",
        read: "X",
      }),
    ).toEqual({ word, line });
  });

  it("keeps a touchdown's sheet headline at CONVERTED", async () => {
    const { puzzle, design } = scenario("touchdown-first-down");
    const { engine, played, puzzle: parsed } = await play(puzzle, design);
    expect([
      liveCaption(parsed, engine, played[0], { phase: "outcome", read: "H" })
        .word,
      resultSheet(parsed, engine, played).headline,
    ]).toEqual(["Touchdown", "CONVERTED"]);
  });

  it("says a throwaway with one read covered that read", async () => {
    const { puzzle, engine, played } = await play(puzzleOne, oneReadThrowaway);
    expect(
      liveCaption(puzzle, engine, played[0], { phase: "outcome", read: "Y" })
        .line,
    ).toBe("His only read was covered.");
  });
});

describe("live field label", () => {
  it("sums up a thrown rep", async () => {
    const { puzzle, engine, played } = await play(puzzleOne, breakup);
    expect(liveLabel(puzzle, engine, played)).toBe(
      "Live play, rep 1: Five in protection. Man up front. The quarterback looks to the Slot WR. Let it rip to the Slot WR. Broken up. Swatted. The corner closed on it. Then the result appears.",
    );
  });

  it("sums up a sack without a throw", async () => {
    const { puzzle, engine, played } = await play(puzzleOne, breakup, sack);
    expect(liveLabel(puzzle, engine, played)).toBe(
      "Live play, rep 2: Five in protection. Man up front. The quarterback looks to the Slot WR. Sacked. Nobody blocked the nickel. Then the result appears.",
    );
  });
});
