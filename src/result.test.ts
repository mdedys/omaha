import { describe, expect, it } from "vitest";
import type {
  Blockers,
  Design,
  ForcedBy,
  LineCall,
  Rep,
  RouteName,
} from "./engine/contract";
import { loadPuzzle } from "./engine";
import gunTrey from "./engine/stub/gun-trey.json";
import { scenarios } from "./engine/stub/fixtures";
import { liveCaption, liveLabel, resultSheet } from "./result";
import type { Played } from "./result";

async function play(...routes: RouteName[]) {
  const { puzzle, engine } = await loadPuzzle(gunTrey);
  const played: Played[] = routes.map((route) => {
    const scenario = scenarios.find(
      (entry) => entry.design.routes.X?.route === route,
    );
    if (!scenario) throw new Error(`No stub scenario for ${route}`);
    const design: Design = {
      ...scenario.design,
      readOrder: ["Y", "X", "Z"],
    };
    return { design, rep: engine.simulate(puzzle, design) };
  });
  return { puzzle, engine, played };
}

describe("copy deck", () => {
  it.each([
    ["In", "SACKED", "Nobody blocked the nickel. Count the rushers next time."],
    [
      "Slant",
      "SACKED",
      "The lineman beat his block before a read came open. Your QB never had a chance.",
    ],
    [
      "Hook",
      "INCOMPLETE",
      "All three reads were covered, so he threw it away. Give him someone to throw to.",
    ],
    [
      "Out",
      "INCOMPLETE",
      "The corner closed on the Left WR and swatted it. Get it there sooner.",
    ],
    [
      "Corner",
      "INCOMPLETE",
      "Pressure forced the throw to the Left WR, and the corner swatted it. Buy him more time.",
    ],
    [
      "Post",
      "PICKED OFF",
      "The safety jumped the throw to the Left WR. He says thanks.",
    ],
    [
      "Drag",
      "PICKED OFF",
      "Out of reads, he forced it to the Left WR and the linebacker picked it. Nobody was open.",
    ],
    [
      "Go",
      "SHORT",
      "The corner stopped the Left WR 3 yards short. Close doesn't count.",
    ],
    [
      "Comeback",
      "CONVERTED",
      "The Left WR picked up 13 yards. Take notes, real OC.",
    ],
    [
      "Flat",
      "CONVERTED",
      "The Left WR took it 55 yards to the house. Take a bow.",
    ],
  ] satisfies [RouteName, string, string][])(
    "states the cause of the stub's %s design",
    async (route, headline, line) => {
      const { puzzle, engine, played } = await play(route);
      expect(resultSheet(puzzle, engine, played)).toMatchObject({
        headline,
        line,
      });
    },
  );

  it.each([
    [
      "Corner",
      "out-of-reads",
      "Out of reads, he forced it to the Left WR and the corner swatted it. Nobody was open.",
    ],
    [
      "Drag",
      "pressure",
      "Pressure forced the throw to the Left WR, and the linebacker picked it. He says thanks.",
    ],
  ] satisfies [RouteName, ForcedBy, string][])(
    "words a %s forced throw by %s",
    async (route, forcedBy, line) => {
      const { puzzle, engine, played } = await play(route);
      const { rep } = played[0];
      const forced = { ...rep, cause: { ...rep.cause, forcedBy } };
      expect(
        resultSheet(puzzle, engine, [{ ...played[0], rep: forced }]).line,
      ).toBe(line);
    },
  );
});

describe("result sheet", () => {
  it("shows a sack's yards, pocket time and the read the QB was on", async () => {
    const { puzzle, engine, played } = await play("In");
    expect(resultSheet(puzzle, engine, played)).toMatchObject({
      variant: "cream",
      tile: { kind: "fail" },
      stats: [
        { value: "−7", label: "yards" },
        { value: "2.0s", label: "in the pocket" },
        { value: "WR", label: "on 1st read", receiver: "X" },
      ],
      status: "3 reps left",
    });
  });

  it("shows a throwaway as thrown away", async () => {
    const { puzzle, engine, played } = await play("Hook");
    expect(resultSheet(puzzle, engine, played).stats[2]).toEqual({
      value: "—",
      label: "thrown away",
    });
  });

  it("shows a short rep's yards on a gold tile and its box", async () => {
    const { puzzle, engine, played } = await play("Out", "Go");
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
    const { puzzle, engine, played } = await play("Out", "Post", "In");
    expect(resultSheet(puzzle, engine, played).status).toBe("1 rep left");
  });

  it("scores a conversion and shows the streak as unavailable", async () => {
    const { puzzle, engine, played } = await play("Out", "Comeback");
    expect(resultSheet(puzzle, engine, played)).toMatchObject({
      variant: "win",
      ended: true,
      tile: null,
      stats: [
        { value: "+13", label: "yards gained" },
        { value: "78", label: "points" },
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
    const { puzzle, engine, played } = await play("Out", "Go", "In", "Post");
    expect(resultSheet(puzzle, engine, played)).toMatchObject({
      variant: "over",
      ended: true,
      headline: "OUT OF REPS",
      line: "The safety jumped the throw to the Left WR. Four reps, no first down.",
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
    const { puzzle, engine, played } = await play("In", "Slant", "In", "In");
    expect(resultSheet(puzzle, engine, played).stats[1]).toEqual({
      value: "−7",
      label: "best rep",
    });
  });

  it.each([
    [["Out"], []],
    [
      ["Out", "Go"],
      ["DL1", "DL2", "DL3", "DL4", "LB1", "LB2", "LB3"],
    ],
    [
      ["Out", "Go", "In"],
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
      ["Comeback"],
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
  ] as const)(
    "reveals the play art for the failed reps so far after %j",
    async (reps, revealed) => {
      const { puzzle, engine, played } = await play(...reps);
      expect(
        Object.keys(resultSheet(puzzle, engine, played).playArt.assignments),
      ).toEqual(revealed);
    },
  );

  it.each([
    [
      ["Out"],
      "Rep 1 final frame with the defense revealed: incomplete. The corner closed on the Left WR and swatted it.",
    ],
    [
      ["In"],
      "Rep 1 final frame with the defense revealed: sacked. Nobody blocked the nickel.",
    ],
    [
      ["Post"],
      "Rep 1 final frame with the defense revealed: picked off. The safety jumped the throw to the Left WR.",
    ],
    [
      ["Go"],
      "Rep 1 final frame with the defense revealed: short. The corner stopped the Left WR 3 yards short.",
    ],
  ] as const)(
    "labels the field with the outcome after %j",
    async (reps, label) => {
      const { puzzle, engine, played } = await play(...reps);
      expect(resultSheet(puzzle, engine, played).fieldLabel).toBe(label);
    },
  );

  it.each([
    [
      ["Out", "Go", "In"],
      "Rep 3 final frame with the defense revealed: sacked. Nobody blocked the nickel.",
    ],
    [
      ["Out", "Comeback"],
      "Rep 2 final frame against Cover 1 pressure: converted. The Left WR picked up 13 yards.",
    ],
    [
      ["Out", "Go", "In", "Post"],
      "Rep 4 final frame against Cover 1 pressure: picked off. The safety jumped the throw to the Left WR.",
    ],
  ] as const)(
    "names the coverage in the field label only once the puzzle ends, after %j",
    async (reps, label) => {
      const { puzzle, engine, played } = await play(...reps);
      expect(resultSheet(puzzle, engine, played).fieldLabel).toBe(label);
    },
  );
});

describe("live captions", () => {
  it.each([
    [5, "man", "Five in protection. Man up front."],
    [6, "slide-left", "Six in protection. Line slides left."],
    [7, "slide-right", "Seven in protection. Line slides right."],
  ] satisfies [Blockers, LineCall, string][])(
    "sets %i blockers with %s",
    async (blockers, lineCall, line) => {
      const { puzzle, engine, played } = await play("Out");
      const design = {
        ...played[0].design,
        protection: { blockers, lineCall },
      };
      expect(
        liveCaption(
          puzzle,
          engine,
          { ...played[0], design },
          { phase: "set", read: "X" },
        ),
      ).toEqual({ word: "Set", line });
    },
  );

  it("locks the QB's eyes on his first read at the snap", async () => {
    const { puzzle, engine, played } = await play("Out");
    expect(
      liveCaption(puzzle, engine, played[0], { phase: "snap", read: "X" }),
    ).toEqual({ word: "Snap", line: "Eyes locked on the Left WR." });
  });

  it("names the new read when the QB moves on", async () => {
    const { puzzle, engine, played } = await play("Out");
    const rep = {
      ...played[0].rep,
      reads: [
        { letter: "X", fromTick: 0, toTick: 20 },
        { letter: "Y", fromTick: 20, toTick: 40 },
      ],
    } satisfies Rep;
    expect(
      liveCaption(
        puzzle,
        engine,
        { ...played[0], rep },
        { phase: "snap", read: "Y" },
      ),
    ).toEqual({ word: "Snap", line: "Nothing there. Eyes to the TE." });
  });

  it.each([
    ["Out", "Let it rip to the Left WR."],
    ["Hook", "Nobody open. Into the seats."],
    ["Corner", "Heat's coming. He forces it to the Left WR."],
    ["Drag", "Nothing clean. He forces it to the Left WR."],
  ] satisfies [RouteName, string][])(
    "calls the stub's %s throw",
    async (route, line) => {
      const { puzzle, engine, played } = await play(route);
      expect(
        liveCaption(puzzle, engine, played[0], { phase: "throw", read: "X" }),
      ).toEqual({ word: "Throw", line });
    },
  );

  it.each([
    ["In", "Sacked", "Nobody blocked the nickel."],
    ["Slant", "Sacked", "The lineman beat his block."],
    ["Hook", "Thrown away", "Every read was covered."],
    ["Out", "Broken up", "Swatted. The corner closed on it."],
    ["Corner", "Broken up", "Swatted. The corner was waiting."],
    ["Post", "Picked off", "The safety jumped the throw."],
    ["Drag", "Picked off", "The linebacker was sitting on it."],
    ["Go", "Stopped short", "3 yards shy of the sticks."],
    ["Comeback", "First down", "The Left WR moves the chains."],
    ["Flat", "Touchdown", "The Left WR takes it to the house."],
  ] satisfies [RouteName, string, string][])(
    "calls the stub's %s outcome %s",
    async (route, word, line) => {
      const { puzzle, engine, played } = await play(route);
      expect(
        liveCaption(puzzle, engine, played[0], {
          phase: "outcome",
          read: "X",
        }),
      ).toEqual({ word, line });
    },
  );

  it("keeps a touchdown's sheet headline at CONVERTED", async () => {
    const { puzzle, engine, played } = await play("Flat");
    expect([
      liveCaption(puzzle, engine, played[0], { phase: "outcome", read: "X" })
        .word,
      resultSheet(puzzle, engine, played).headline,
    ]).toEqual(["Touchdown", "CONVERTED"]);
  });

  it("says a throwaway with one read covered that read", async () => {
    const { puzzle, engine, played } = await play("Hook");
    const design = { ...played[0].design, readOrder: ["X"] } satisfies Design;
    expect(
      liveCaption(
        puzzle,
        engine,
        { ...played[0], design },
        { phase: "outcome", read: "X" },
      ).line,
    ).toBe("His only read was covered.");
  });
});

describe("live field label", () => {
  it("sums up a thrown rep", async () => {
    const { puzzle, engine, played } = await play("Out");
    expect(liveLabel(puzzle, engine, played)).toBe(
      "Live play, rep 1: Five in protection. Man up front. The quarterback looks to the Left WR. Let it rip to the Left WR. Broken up. Swatted. The corner closed on it. Then the result appears.",
    );
  });

  it("sums up a sack without a throw", async () => {
    const { puzzle, engine, played } = await play("Out", "In");
    expect(liveLabel(puzzle, engine, played)).toBe(
      "Live play, rep 2: Five in protection. Man up front. The quarterback looks to the Left WR. Sacked. Nobody blocked the nickel. Then the result appears.",
    );
  });
});
