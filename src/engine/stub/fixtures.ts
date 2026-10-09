import type {
  Cause,
  CauseCode,
  DefensePlayArt,
  Design,
  PlayerId,
  Rep,
  RouteCall,
  Vec,
} from "../contract";
import { preSnap } from "./catalog";
import puzzleJson from "./gun-trey.json";
import { parsePuzzle } from "./puzzle";

const puzzle = parsePuzzle(puzzleJson);
const playArt: DefensePlayArt = {
  assignments: {},
  zones: [],
};
for (const defender of puzzle.defense) {
  playArt.assignments[defender.id] = defender.assignment.kind;
  if (defender.assignment.kind === "zone") {
    playArt.zones.push({
      defenderId: defender.id,
      zone: defender.assignment.zone,
      center: { x: defender.at.x, y: defender.id === "S1" ? 25 : 10 },
      radii: { x: 5, y: defender.id === "S1" ? 10 : 4 },
    });
  }
}

// These are authored replay fixtures, not a model of the defense's decisions.
function fixture(
  cause: Cause,
  kind: Rep["outcome"]["kind"],
  yards: number,
): Rep {
  const sack = kind === "sack";
  const completion = kind === "completion";
  const endTick = sack ? 40 : completion ? 80 : 60;
  const positions = preSnap(puzzle);
  const tracks: Record<PlayerId, Vec[]> = {
    X: [],
    Y: [],
    Z: [],
    H: [],
    RB: [],
    QB: [],
    LT: [],
    LG: [],
    C: [],
    RG: [],
    RT: [],
    DL1: [],
    DL2: [],
    DL3: [],
    DL4: [],
    LB1: [],
    LB2: [],
    LB3: [],
    CB1: [],
    CB2: [],
    NB: [],
    DB: [],
    S1: [],
    S2: [],
  };
  Reflect.deleteProperty(tracks, "DB");
  Reflect.deleteProperty(tracks, "S2");
  const ids: PlayerId[] = [
    "X",
    "Y",
    "Z",
    "H",
    "RB",
    "QB",
    "LT",
    "LG",
    "C",
    "RG",
    "RT",
    ...puzzle.defense.map((defender) => defender.id),
  ];
  const catchPoint = { x: -8, y: completion ? Math.min(yards, 10) : 10 };
  for (const id of ids) {
    const start = positions[id];
    let finish: Vec = start;
    if (id === "X") finish = { x: -8, y: sack ? 5 : completion ? yards : 10 };
    else if (id === "QB") finish = { x: 0, y: -7 };
    else if (["Y", "Z", "H", "RB"].includes(id)) {
      finish = { x: start.x, y: 12 };
    } else if (id === cause.decisive) {
      finish = sack ? { x: 0, y: -7 } : { x: -8, y: completion ? yards : 10 };
    }
    for (let tick = 0; tick <= endTick; tick++) {
      const progress = tick / endTick;
      if (id === "X" && completion) {
        const from = tick <= 60 ? start : catchPoint;
        const to = tick <= 60 ? catchPoint : finish;
        const fraction = tick <= 60 ? tick / 60 : (tick - 60) / 20;
        tracks[id].push({
          x: from.x + (to.x - from.x) * fraction,
          y: from.y + (to.y - from.y) * fraction,
        });
      } else {
        tracks[id].push({
          x: start.x + (finish.x - start.x) * progress,
          y: start.y + (finish.y - start.y) * progress,
        });
      }
    }
  }
  return {
    endTick,
    tracks,
    ball: sack
      ? null
      : {
          from: tracks.QB[40],
          to: cause.code === "throwaway" ? { x: -16, y: -7 } : catchPoint,
          throwTick: 40,
          arriveTick: 60,
          target: cause.thrownTo,
        },
    carrier: completion ? { letter: "X", fromTick: 60 } : null,
    reads: [{ letter: "X", fromTick: 0, toTick: 40 }],
    thrownToRead: cause.thrownTo === null ? null : 0,
    outcome: { kind, yards },
    verdict: completion
      ? cause.code === "short"
        ? "short"
        : "converted"
      : "failed",
    timeInPocketTicks: 40,
    cause,
    feedback: [
      {
        letter: "X",
        badge: completion ? "open" : "covered",
        separation: completion ? 4 : 0.5,
        tick: sack ? 40 : 60,
      },
      { letter: "Y", badge: "contested", separation: 2, tick: 40 },
      { letter: "Z", badge: "covered", separation: 0.5, tick: 40 },
      { letter: "H", badge: "open", separation: 4, tick: 40 },
      { letter: "RB", badge: "contested", separation: 2, tick: 40 },
    ],
    playArt,
  };
}

const rows: readonly {
  code: CauseCode;
  call: RouteCall;
  kind: Rep["outcome"]["kind"];
  yards: number;
  decisive: Cause["decisive"];
  forcedBy?: Cause["forcedBy"];
}[] = [
  {
    code: "sack-free-rusher",
    call: { route: "In", depth: 5 },
    kind: "sack",
    yards: -7,
    decisive: "NB",
  },
  {
    code: "sack-beat-block",
    call: { route: "Slant" },
    kind: "sack",
    yards: -7,
    decisive: "DL1",
  },
  {
    code: "throwaway",
    call: { route: "Hook", depth: 5 },
    kind: "incompletion",
    yards: 0,
    decisive: null,
  },
  {
    code: "breakup-closed",
    call: { route: "Out", depth: 5 },
    kind: "incompletion",
    yards: 0,
    decisive: "CB1",
  },
  {
    code: "breakup-forced",
    call: { route: "Corner", depth: 10 },
    kind: "incompletion",
    yards: 0,
    decisive: "CB1",
    forcedBy: "pressure",
  },
  {
    code: "interception-closed",
    call: { route: "Post", depth: 10 },
    kind: "interception",
    yards: 0,
    decisive: "S1",
  },
  {
    code: "interception-forced",
    call: { route: "Drag" },
    kind: "interception",
    yards: 0,
    decisive: "LB1",
    forcedBy: "out-of-reads",
  },
  {
    code: "short",
    call: { route: "Go" },
    kind: "completion",
    yards: 7,
    decisive: "CB1",
  },
  {
    code: "converted",
    call: { route: "Comeback", depth: 10 },
    kind: "completion",
    yards: 13,
    decisive: null,
  },
  {
    code: "touchdown",
    call: { route: "Flat" },
    kind: "completion",
    yards: 55,
    decisive: null,
  },
];

type Scenario = { design: Design; rep: Rep };

export const scenarios: readonly Scenario[] = rows.map((row) => {
  const cause: Cause = {
    code: row.code,
    decisive: row.decisive,
    thrownTo: row.kind === "sack" || row.code === "throwaway" ? null : "X",
    ...(row.forcedBy === undefined ? {} : { forcedBy: row.forcedBy }),
  };
  return {
    design: {
      protection: { blockers: 5, lineCall: "man" },
      routes: {
        X: row.call,
        Y: { route: "Seam" },
        Z: { route: "Go" },
        H: { route: "Seam" },
        RB: { route: "Flat" },
      },
      readOrder: ["X"],
    },
    rep: fixture(cause, row.kind, row.yards),
  };
});
