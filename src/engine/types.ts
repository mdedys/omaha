import type { ZONES } from "./constants.ts";

export type Vec = { readonly x: number; readonly y: number };

export type Letter = "X" | "Y" | "H" | "Z" | "RB";
export type Lineman = "LT" | "LG" | "C" | "RG" | "RT";
export type OffenseId = Letter | Lineman | "QB";
export type DefenderId = string;
export type PlayerId = OffenseId | DefenderId;

export type Side = "L" | "R";
export type GapName = `${Side}-${"A" | "B" | "C" | "D"}`;
export type ZoneName = keyof typeof ZONES;

export type DefRole = "DL" | "LB" | "CB" | "S";
export type Assignment =
  | { kind: "man"; letter: Letter }
  | { kind: "zone"; zone: ZoneName }
  | { kind: "rush"; gap?: GapName };
export type Defender = {
  id: DefenderId;
  role: DefRole;
  spot: Vec;
  assignment: Assignment;
};
export type Defense = {
  coverageName: "Cover 1" | "Cover 2" | "Cover 3";
  defenders: readonly Defender[];
};

export type RouteCall =
  | { route: "In" | "Out" | "Hook"; depth: 5 | 10 | 15 }
  | { route: "Corner" | "Post" | "Comeback"; depth: 10 | 15 }
  | {
      route: "Slant" | "Drag" | "Hitch" | "Go" | "Seam" | "Flat" | "Wheel";
    };
export type RouteName = RouteCall["route"];

export type Protection = {
  blockers: 5 | 6 | 7;
  call: "slide-left" | "slide-right" | "man";
};
export type Design = {
  protection: Protection;
  routes: Partial<Record<Letter, RouteCall>>;
  readOrder: readonly Letter[];
};

export type BreakKind = "hard" | "soft";
export type RoutePath = {
  points: readonly Vec[];
  breaks: readonly { index: number; kind: BreakKind }[];
  throwIndex: number;
  end: "sit" | "run";
};

export type Heading = "upfield" | "inside" | "outside";

export type ForceReason = "pressure" | "out-of-reads";

export type GameEvent = { tick: number } & (
  | { kind: "pickup"; blocker: OffenseId; rusher: DefenderId }
  | { kind: "double"; helper: Lineman; blocker: OffenseId; rusher: DefenderId }
  | { kind: "rusher-free"; rusher: DefenderId; gap: GapName | "hug" }
  | { kind: "hug-rush"; defender: DefenderId; letter: Letter }
  | { kind: "hold-release"; rusher: DefenderId }
  | { kind: "pressure"; rusher: DefenderId; distance: number }
  | { kind: "sack"; rusher: DefenderId }
  | { kind: "read"; letter: Letter }
  | { kind: "read-next"; from: Letter; to: Letter }
  | {
      kind: "throw";
      letter: Letter;
      separation: number;
      forced: ForceReason | null;
    }
  | { kind: "throwaway" }
  | {
      kind: "defender-react";
      defender: DefenderId;
      reason: "break" | "zone" | "throw";
    }
  | {
      kind: "zone-choose";
      defender: DefenderId;
      chosen: Letter;
      over: readonly Letter[];
    }
  | { kind: "carry"; defender: DefenderId; letter: Letter }
  | { kind: "rubbed"; defender: DefenderId; by: Letter }
  | { kind: "catch"; letter: Letter; separation: number }
  | { kind: "breakup"; defender: DefenderId; letter: Letter }
  | { kind: "interception"; defender: DefenderId; letter: Letter }
  | { kind: "cut"; letter: Letter; heading: Heading }
  | { kind: "tackle"; defender: DefenderId; letter: Letter; yards: number }
  | { kind: "touchdown"; letter: Letter }
);

type ForcedCode = "breakup-forced" | "interception-forced";
export type CauseCode =
  | "sack-free-rusher"
  | "sack-beat-block"
  | "throwaway"
  | "breakup-closed"
  | "interception-closed"
  | ForcedCode
  | "short"
  | "converted"
  | "touchdown";
export type Cause = { decisive: DefenderId | null; thrownTo: Letter | null } & (
  | { code: Exclude<CauseCode, ForcedCode> }
  | { code: ForcedCode; forcedBy: ForceReason }
);

export type Badge = "open" | "contested" | "covered";
export type Feedback = {
  letter: Letter;
  badge: Badge;
  separation: number;
  tick: number;
};

export type BallFlight = {
  from: Vec;
  to: Vec;
  throwTick: number;
  arriveTick: number;
  target: Letter | null;
};

export type Rep = {
  lastTick: number;
  tracks: Record<PlayerId, Vec[]>;
  ball: Vec[];
  flight: BallFlight | null;
  events: GameEvent[];
  cause: Cause;
  feedback: Feedback[];
  routes: Partial<Record<Letter, RoutePath>>;
  carrier: { letter: Letter; fromTick: number } | null;
};
