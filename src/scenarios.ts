import { CONTEST_RADIUS } from "./engine/constants.ts";
import type {
  Assignment,
  CauseCode,
  Defender,
  DefRole,
  Defense,
  Design,
  Letter,
  Rep,
  ZoneName,
} from "./engine/types.ts";
import { distance, vec } from "./engine/vec.ts";

export type Scenario = {
  name: string;
  defense: Defense;
  design: Design;
  expected: string;
  met: (rep: Rep, defense: Defense) => boolean;
};

const d = (
  id: string,
  role: DefRole,
  x: number,
  y: number,
  assignment: Assignment,
): Defender => ({ id, role, spot: vec(x, y), assignment });

const rush: Assignment = { kind: "rush" };
const man = (letter: Letter): Assignment => ({ kind: "man", letter });
const zone = (name: ZoneName): Assignment => ({ kind: "zone", zone: name });

const replace = (defenders: Defender[], ...changes: Defender[]) =>
  defenders.map((x) => changes.find((c) => c.id === x.id) ?? x);

const FOUR_DL = [
  d("DL1", "DL", -3.6, 1, rush),
  d("DL2", "DL", -1, 1, rush),
  d("DL3", "DL", 1.2, 1, rush),
  d("DL4", "DL", 3.9, 1, rush),
];

const COVER_1 = [
  ...FOUR_DL,
  d("LB1", "LB", 2, 4.5, man("Y")),
  d("LB2", "LB", -2, 4.5, man("RB")),
  d("CB1", "CB", -11.25, 6, man("X")),
  d("CB2", "CB", 11.25, 6, man("Z")),
  d("NB", "CB", 7.5, 4, man("H")),
  d("S1", "S", 0, 13, zone("deep-middle")),
  d("S2", "S", -4, 9, zone("hook-M")),
];

const COVER_2 = [
  ...FOUR_DL,
  d("LB1", "LB", -4, 4.5, zone("hook-L")),
  d("LB2", "LB", 1, 5, zone("hook-M")),
  d("NB", "CB", 7.5, 4, zone("hook-R")),
  d("CB1", "CB", -12.25, 5, zone("flat-L")),
  d("CB2", "CB", 12.25, 5, zone("flat-R")),
  d("S1", "S", -8, 12, zone("deep-half-L")),
  d("S2", "S", 8, 12, zone("deep-half-R")),
];

const COVER_3 = [
  ...FOUR_DL,
  d("LB1", "LB", -4, 4.5, zone("hook-L")),
  d("LB2", "LB", 2, 4.5, zone("hook-R")),
  d("NB", "CB", 7.5, 4, zone("curl-flat-R")),
  d("CB1", "CB", -11.25, 7, zone("deep-third-L")),
  d("CB2", "CB", 11.25, 7, zone("deep-third-R")),
  d("S1", "S", 0, 13, zone("deep-third-M")),
  d("S2", "S", -7, 8, zone("curl-flat-L")),
];

const causeIs =
  (...codes: CauseCode[]) =>
  (rep: Rep) =>
    codes.includes(rep.cause.code);
const has = (rep: Rep, kind: Rep["events"][number]["kind"]) =>
  rep.events.some((e) => e.kind === kind);

const frozenSeparation = (rep: Rep, defense: Defense, letter: Letter) =>
  Math.min(
    ...defense.defenders.map((x) =>
      distance(
        rep.tracks[letter][rep.lastTick],
        rep.tracks[x.id][rep.lastTick],
      ),
    ),
  );

export const SCENARIOS: Scenario[] = [
  {
    name: "Free rusher off the far edge",
    expected: "sack-free-rusher, the unblocked edge rusher (S2) decisive",
    met: (rep) =>
      rep.cause.code === "sack-free-rusher" && rep.cause.decisive === "S2",
    defense: {
      coverageName: "Cover 1",
      defenders: [
        ...replace(FOUR_DL, d("DL4", "DL", 2.5, 1, rush)),
        d("LB2", "LB", 4.3, 2, rush),
        d("S2", "S", 6.5, 2.5, rush),
        d("LB1", "LB", 1, 5, man("Y")),
        d("CB1", "CB", -11.25, 6, man("X")),
        d("CB2", "CB", 11.25, 6, man("Z")),
        d("NB", "CB", 7.5, 4, man("H")),
        d("S1", "S", 0, 13, zone("deep-middle")),
      ],
    },
    design: {
      protection: { blockers: 6, call: "slide-left" },
      routes: {
        X: { route: "Hook", depth: 10 },
        Y: { route: "Seam" },
        H: { route: "Out", depth: 10 },
        Z: { route: "Comeback", depth: 15 },
      },
      readOrder: ["X", "H", "Z"],
    },
  },
  {
    name: "A-gap blitz against man protection",
    expected:
      "the RB picks up the A-gap blitzer (LB1) and a double team shows; any outcome",
    met: (rep) =>
      rep.events.some(
        (e) => e.kind === "pickup" && e.blocker === "RB" && e.rusher === "LB1",
      ) && has(rep, "double"),
    defense: {
      coverageName: "Cover 1",
      defenders: [
        d("DL1", "DL", -3.6, 1, rush),
        d("DL2", "DL", 0, 1, rush),
        d("DL3", "DL", 3.6, 1, rush),
        d("LB1", "LB", -1, 4.5, rush),
        d("LB2", "LB", 3, 4.5, man("Y")),
        d("LB3", "LB", -4, 4.5, zone("hook-L")),
        d("CB1", "CB", -11.25, 6, man("X")),
        d("CB2", "CB", 11.25, 6, man("Z")),
        d("NB", "CB", 7.5, 4, man("H")),
        d("S1", "S", 0, 13, zone("deep-middle")),
        d("S2", "S", 3, 9, zone("hook-M")),
      ],
    },
    design: {
      protection: { blockers: 6, call: "man" },
      routes: {
        X: { route: "Slant" },
        Y: { route: "Out", depth: 5 },
        H: { route: "Hook", depth: 10 },
        Z: { route: "Go" },
      },
      readOrder: ["H", "X", "Y"],
    },
  },
  {
    name: "Hold-time sack",
    expected: "sack-beat-block",
    met: causeIs("sack-beat-block"),
    defense: { coverageName: "Cover 3", defenders: COVER_3 },
    design: {
      protection: { blockers: 7, call: "man" },
      routes: {
        X: { route: "Hook", depth: 10 },
        H: { route: "Hook", depth: 10 },
        Z: { route: "Corner", depth: 15 },
      },
      readOrder: ["Z", "H", "X"],
    },
  },
  {
    name: "Second read open",
    expected:
      "a throw to the second read (Z), converted or short; a receiver open while throwable looks covered on the frozen frame",
    met: (rep, defense) =>
      rep.cause.thrownTo === "Z" &&
      rep.events.some((e) => e.kind === "read-next" && e.to === "Z") &&
      ["converted", "short"].includes(rep.cause.code) &&
      rep.feedback.some(
        (f) =>
          f.letter !== "Z" &&
          f.badge === "open" &&
          frozenSeparation(rep, defense, f.letter) < CONTEST_RADIUS,
      ),
    defense: { coverageName: "Cover 3", defenders: COVER_3 },
    design: {
      protection: { blockers: 5, call: "man" },
      routes: {
        X: { route: "In", depth: 5 },
        Y: { route: "Hook", depth: 10 },
        H: { route: "In", depth: 5 },
        Z: { route: "Hitch" },
        RB: { route: "Flat" },
      },
      readOrder: ["X", "Z", "Y"],
    },
  },
  {
    name: "Whole read order covered",
    expected: "throwaway",
    met: causeIs("throwaway"),
    defense: { coverageName: "Cover 1", defenders: COVER_1 },
    design: {
      protection: { blockers: 5, call: "man" },
      routes: {
        X: { route: "Go" },
        Y: { route: "Seam" },
        H: { route: "Seam" },
        Z: { route: "Go" },
        RB: { route: "Flat" },
      },
      readOrder: ["X", "Z", "H"],
    },
  },
  {
    name: "Breakup by a disguised defender",
    expected: "breakup-closed, the rotating safety (S2) decisive",
    met: (rep) =>
      rep.cause.code === "breakup-closed" && rep.cause.decisive === "S2",
    defense: {
      coverageName: "Cover 3",
      defenders: [
        ...FOUR_DL,
        d("LB1", "LB", -4, 4.5, zone("hook-L")),
        d("LB2", "LB", 2, 4.5, zone("hook-R")),
        d("NB", "CB", -7.5, 4, zone("curl-flat-L")),
        d("CB1", "CB", -11.25, 7, zone("deep-third-L")),
        d("CB2", "CB", 11.25, 7, zone("deep-third-R")),
        d("S1", "S", -5, 12, zone("deep-third-M")),
        d("S2", "S", 2, 12, zone("curl-flat-R")),
      ],
    },
    design: {
      protection: { blockers: 6, call: "man" },
      routes: {
        X: { route: "In", depth: 5 },
        Y: { route: "Seam" },
        H: { route: "Out", depth: 10 },
        Z: { route: "Go" },
      },
      readOrder: ["X", "H", "Y"],
    },
  },
  {
    name: "Undercut interception",
    expected: "interception-closed",
    met: causeIs("interception-closed"),
    defense: { coverageName: "Cover 2", defenders: COVER_2 },
    design: {
      protection: { blockers: 6, call: "man" },
      routes: {
        X: { route: "Slant" },
        Y: { route: "Seam" },
        H: { route: "Go" },
        Z: { route: "Go" },
      },
      readOrder: ["X", "Y", "Z"],
    },
  },
  {
    name: "Hitch against an off corner",
    expected: "the ball carrier cuts 45° inside; converted or short",
    met: (rep) =>
      rep.events.some((e) => e.kind === "cut" && e.heading === "inside") &&
      ["converted", "short"].includes(rep.cause.code),
    defense: {
      coverageName: "Cover 1",
      defenders: replace(COVER_1, d("CB2", "CB", 12.75, 7.5, man("Z"))),
    },
    design: {
      protection: { blockers: 5, call: "man" },
      routes: {
        X: { route: "Go" },
        Y: { route: "Seam" },
        H: { route: "Go" },
        Z: { route: "Hitch" },
        RB: { route: "Flat" },
      },
      readOrder: ["Z", "X", "H"],
    },
  },
  {
    name: "Rub",
    expected: "a rubbed event and the crosser open; any outcome",
    met: (rep) => has(rep, "rubbed"),
    defense: {
      coverageName: "Cover 1",
      defenders: replace(COVER_1, d("LB1", "LB", 4.5, 0, man("Y"))),
    },
    design: {
      protection: { blockers: 5, call: "man" },
      routes: {
        X: { route: "Drag" },
        Y: { route: "Drag" },
        H: { route: "Hook", depth: 10 },
        Z: { route: "Go" },
        RB: { route: "Flat" },
      },
      readOrder: ["H", "Y", "X"],
    },
  },
  {
    name: "Zone choice and carry",
    expected: "zone-choose in a hook zone and a seam carried deep; any outcome",
    met: (rep) => has(rep, "zone-choose") && has(rep, "carry"),
    defense: { coverageName: "Cover 3", defenders: COVER_3 },
    design: {
      protection: { blockers: 5, call: "man" },
      routes: {
        X: { route: "Hook", depth: 10 },
        Y: { route: "Seam" },
        H: { route: "In", depth: 5 },
        Z: { route: "Slant" },
        RB: { route: "Flat" },
      },
      readOrder: ["X", "Z", "H"],
    },
  },
];
