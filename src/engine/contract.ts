export const TICK_SECONDS = 0.05;

export type Vec = { readonly x: number; readonly y: number };
export type Letter = "X" | "Y" | "Z" | "H" | "RB";
export type Lineman = "LT" | "LG" | "C" | "RG" | "RT";
export type OffenseId = Letter | Lineman | "QB";
export type DefenderId =
  | "DL1"
  | "DL2"
  | "DL3"
  | "DL4"
  | "LB1"
  | "LB2"
  | "LB3"
  | "CB1"
  | "CB2"
  | "NB"
  | "DB"
  | "S1"
  | "S2";
export type PlayerId = OffenseId | DefenderId;
export type Role = "DL" | "LB" | "CB" | "S";
export type ZoneId =
  | "deep-half-L"
  | "deep-half-R"
  | "deep-third-L"
  | "deep-third-M"
  | "deep-third-R"
  | "deep-quarter-1"
  | "deep-quarter-2"
  | "deep-quarter-3"
  | "deep-quarter-4"
  | "deep-middle"
  | "hook-L"
  | "hook-M"
  | "hook-R"
  | "curl-flat-L"
  | "curl-flat-R"
  | "flat-L"
  | "flat-R";
export type Gap = "L-A" | "L-B" | "L-C" | "L-D" | "R-A" | "R-B" | "R-C" | "R-D";
export type Assignment =
  | { kind: "man"; target: Letter }
  | { kind: "zone"; zone: ZoneId }
  | { kind: "rush"; gap?: Gap };
export type FormationId =
  | "gun-trey"
  | "gun-doubles"
  | "gun-trips"
  | "gun-spread"
  | "gun-empty"
  | "gun-doubles-12"
  | "ace";
export type Puzzle = {
  engine: number;
  number: number;
  date: string;
  situation: {
    down: number;
    distance: number;
    spot: number;
    hash: "left" | "middle" | "right";
    scoreDiff: number;
    quarter: number;
    clock: string;
  };
  goal: "first-down" | "touchdown";
  briefing: string;
  formation: { id: FormationId; flip: boolean };
  defense: { id: DefenderId; at: Vec; assignment: Assignment }[];
  coverageName: string;
  prosResult: string;
};

export type Blockers = 5 | 6 | 7;
export type LineCall = "slide-left" | "man" | "slide-right";
export type Depth = 5 | 10 | 15;
export type RouteCall =
  | { route: "In" | "Out" | "Hook"; depth: Depth }
  | { route: "Corner" | "Post" | "Comeback"; depth: 10 | 15 }
  | {
      route: "Slant" | "Drag" | "Hitch" | "Go" | "Seam" | "Flat" | "Wheel";
    };
export type RouteName = RouteCall["route"];
export type Design = {
  protection: { blockers: Blockers; lineCall: LineCall };
  routes: Partial<Record<Letter, RouteCall>>;
  readOrder: readonly Letter[];
};
export type RoutePath = {
  points: readonly Vec[];
  breaks: readonly { index: number; kind: "hard" | "soft" }[];
  throwIndex: number;
  end: "sit" | "run";
};
export type Badge = "open" | "contested" | "covered";
export type ForcedBy = "pressure" | "out-of-reads";
export type CauseCode =
  | "sack-free-rusher"
  | "sack-beat-block"
  | "throwaway"
  | "breakup-closed"
  | "breakup-forced"
  | "interception-closed"
  | "interception-forced"
  | "short"
  | "converted"
  | "touchdown";
export type Cause = {
  code: CauseCode;
  decisive: DefenderId | null;
  thrownTo: Letter | null;
  forcedBy?: ForcedBy;
};
export type DefensePlayArt = {
  zones: {
    defenderId: DefenderId;
    zone: ZoneId;
    center: Vec;
    radii: Vec;
  }[];
  assignments: Partial<Record<DefenderId, "zone" | "man" | "rush">>;
};
export type Rep = {
  endTick: number;
  tracks: Record<PlayerId, Vec[]>;
  ball: {
    from: Vec;
    to: Vec;
    throwTick: number;
    arriveTick: number;
    target: Letter | null;
  } | null;
  carrier: { letter: Letter; fromTick: number } | null;
  reads: { letter: Letter; fromTick: number; toTick: number }[];
  thrownToRead: number | null;
  outcome: {
    kind: "completion" | "incompletion" | "interception" | "sack";
    yards: number;
  };
  verdict: "converted" | "short" | "failed";
  timeInPocketTicks: number;
  cause: Cause;
  feedback: {
    letter: Letter;
    badge: Badge;
    separation: number;
    tick: number;
  }[];
  playArt: DefensePlayArt;
};
export type Score = { base: number; bonus: number; total: number };
export interface Engine {
  simulate(puzzle: Puzzle, design: Design): Rep;
  score(puzzle: Puzzle, reps: readonly Rep[]): Score;
  revealedPlayArt(
    playArt: DefensePlayArt,
    failedReps: number,
    puzzleEnded: boolean,
  ): DefensePlayArt;
  preSnap(puzzle: Puzzle): Record<PlayerId, Vec>;
  routeMenu(puzzle: Puzzle, letter: Letter): readonly RouteName[];
  availableDepths(
    puzzle: Puzzle,
    letter: Letter,
    route: RouteName,
  ): readonly Depth[];
  protections(puzzle: Puzzle): readonly Blockers[];
  routePath(puzzle: Puzzle, letter: Letter, call: RouteCall): RoutePath;
}
