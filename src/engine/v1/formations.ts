import type {
  Blockers,
  DefenderId,
  FormationId,
  Gap,
  Letter,
  PlayerId,
  Puzzle,
  RouteName,
  Vec,
} from "../contract";
import * as t from "./tuning";

export const defenderIds: readonly DefenderId[] = [
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
  "DB",
  "S1",
  "S2",
];
export const letters: readonly Letter[] = ["X", "Y", "Z", "H", "RB"];
type Alignment =
  | "wide-left"
  | "wide-right"
  | "slot-left"
  | "slot-right"
  | "inner-right"
  | "attached-left"
  | "attached-right"
  | "back";
type Formation = {
  names: Record<Letter, string>;
  alignment: Record<Letter, Alignment>;
  menus?: Partial<Record<Letter, "WR" | "Inside" | "RB">>;
  rbInBackfield: boolean;
  yAttached: boolean;
  shotgun: boolean;
};
const names = {
  X: "Left WR",
  Y: "Tight end",
  Z: "Right WR",
  H: "Slot",
  RB: "Running back",
};
export const formations: Record<FormationId, Formation> = {
  "gun-trey": {
    names,
    alignment: {
      X: "wide-left",
      Y: "attached-right",
      Z: "wide-right",
      H: "slot-right",
      RB: "back",
    },
    rbInBackfield: true,
    yAttached: true,
    shotgun: true,
  },
  "gun-doubles": {
    names,
    alignment: {
      X: "wide-left",
      Y: "attached-right",
      Z: "wide-right",
      H: "slot-left",
      RB: "back",
    },
    rbInBackfield: true,
    yAttached: true,
    shotgun: true,
  },
  "gun-trips": {
    names,
    alignment: {
      X: "wide-left",
      Y: "inner-right",
      Z: "wide-right",
      H: "slot-right",
      RB: "back",
    },
    rbInBackfield: true,
    yAttached: false,
    shotgun: true,
  },
  "gun-spread": {
    names,
    alignment: {
      X: "wide-left",
      Y: "slot-left",
      Z: "wide-right",
      H: "slot-right",
      RB: "back",
    },
    rbInBackfield: true,
    yAttached: false,
    shotgun: true,
  },
  "gun-empty": {
    names,
    menus: { RB: "Inside" },
    alignment: {
      X: "wide-left",
      Y: "inner-right",
      Z: "wide-right",
      H: "slot-right",
      RB: "slot-left",
    },
    rbInBackfield: false,
    yAttached: false,
    shotgun: true,
  },
  "gun-doubles-12": {
    names: { ...names, H: "Left tight end" },
    alignment: {
      X: "wide-left",
      Y: "attached-right",
      Z: "wide-right",
      H: "slot-left",
      RB: "back",
    },
    rbInBackfield: true,
    yAttached: true,
    shotgun: true,
  },
  ace: {
    names: { ...names, H: "Left tight end" },
    menus: { H: "Inside" },
    alignment: {
      X: "wide-left",
      Y: "attached-right",
      Z: "wide-right",
      H: "attached-left",
      RB: "back",
    },
    rbInBackfield: true,
    yAttached: true,
    shotgun: false,
  },
};
export const formationIds: readonly FormationId[] = [
  "gun-trey",
  "gun-doubles",
  "gun-trips",
  "gun-spread",
  "gun-empty",
  "gun-doubles-12",
  "ace",
];
const wr: readonly RouteName[] = [
  "Hitch",
  "Flat",
  "Slant",
  "Comeback",
  "Hook",
  "Out",
  "In",
  "Corner",
  "Post",
  "Go",
  "Drag",
];
const inside: readonly RouteName[] = [
  ...wr.map((route) => (route === "Go" ? "Seam" : route)),
  "Wheel",
];
const rb: readonly RouteName[] = ["Flat", "Hook", "Out", "In", "Seam", "Wheel"];
export function routeMenu(
  puzzle: Puzzle,
  letter: Letter,
): readonly RouteName[] {
  const menu =
    formations[puzzle.formation.id].menus?.[letter] ??
    (letter === "RB"
      ? "RB"
      : letter === "X" || letter === "Z"
        ? "WR"
        : "Inside");
  return [...(menu === "RB" ? rb : menu === "WR" ? wr : inside)];
}
export function ballX(puzzle: Puzzle): number {
  return puzzle.situation.hash === "left"
    ? -t.HASH_OFFSET_YARDS
    : puzzle.situation.hash === "right"
      ? t.HASH_OFFSET_YARDS
      : 0;
}
export function protections(puzzle: Puzzle): readonly Blockers[] {
  const formation = formations[puzzle.formation.id];
  return !formation.rbInBackfield
    ? [5]
    : formation.yAttached
      ? [5, 6, 7]
      : [5, 6];
}
export function receiverSpot(puzzle: Puzzle, letter: Letter): Vec {
  const formation = formations[puzzle.formation.id];
  const alignment = formation.alignment[letter];
  const ball = ballX(puzzle);
  const mirror = puzzle.formation.flip ? -1 : 1;
  const numbers = t.FIELD_HALF_WIDTH_YARDS - t.NUMBERS_INSET_YARDS;
  const tackle = 2 * t.LINE_SPLIT_YARDS;
  if (alignment === "back")
    return {
      x: formation.shotgun ? ball - mirror * t.RB_OFFSET_YARDS : ball,
      y: -(formation.shotgun ? t.SHOTGUN_DEPTH_YARDS : t.ACE_RB_DEPTH_YARDS),
    };
  const side = (alignment.endsWith("left") ? -1 : 1) * mirror;
  if (alignment.startsWith("wide"))
    return { x: side * numbers, y: -t.LINE_DEPTH_YARDS };
  if (alignment.startsWith("attached"))
    return {
      x: ball + side * (tackle + t.TE_SPLIT_YARDS),
      y: -t.LINE_DEPTH_YARDS,
    };
  const attached = side * mirror < 0 ? "attached-left" : "attached-right";
  const attachedOnSide =
    formation.alignment.Y === attached || formation.alignment.H === attached;
  const inner =
    ball + side * (attachedOnSide ? tackle + t.TE_SPLIT_YARDS : tackle);
  const outer = side * numbers;
  const twoSlots =
    alignment === "inner-right" ||
    ((puzzle.formation.id === "gun-trips" ||
      puzzle.formation.id === "gun-empty") &&
      letter === "H");
  const fraction = twoSlots
    ? alignment === "inner-right"
      ? 1 / 3
      : 2 / 3
    : 1 / 2;
  return { x: inner + (outer - inner) * fraction, y: -t.SLOT_DEPTH_YARDS };
}
export function preSnap(puzzle: Puzzle): Record<PlayerId, Vec> {
  const ball = ballX(puzzle);
  const line = (split: number): Vec => ({
    x: ball + split * t.LINE_SPLIT_YARDS,
    y: -t.LINE_DEPTH_YARDS,
  });
  const unusedDefender = { x: ball, y: 0 };
  const positions: Record<PlayerId, Vec> = {
    X: receiverSpot(puzzle, "X"),
    Y: receiverSpot(puzzle, "Y"),
    Z: receiverSpot(puzzle, "Z"),
    H: receiverSpot(puzzle, "H"),
    RB: receiverSpot(puzzle, "RB"),
    QB: {
      x: ball,
      y: -(formations[puzzle.formation.id].shotgun
        ? t.SHOTGUN_DEPTH_YARDS
        : t.UNDER_CENTER_DEPTH_YARDS),
    },
    LT: line(-2),
    LG: line(-1),
    C: line(0),
    RG: line(1),
    RT: line(2),
    DL1: unusedDefender,
    DL2: unusedDefender,
    DL3: unusedDefender,
    DL4: unusedDefender,
    LB1: unusedDefender,
    LB2: unusedDefender,
    LB3: unusedDefender,
    CB1: unusedDefender,
    CB2: unusedDefender,
    NB: unusedDefender,
    DB: unusedDefender,
    S1: unusedDefender,
    S2: unusedDefender,
  };
  for (const id of defenderIds) Reflect.deleteProperty(positions, id);
  for (const defender of puzzle.defense)
    positions[defender.id] = { x: ball + defender.at.x, y: defender.at.y };
  return positions;
}
export const gapIds: readonly Gap[] = [
  "L-A",
  "L-B",
  "L-C",
  "L-D",
  "R-A",
  "R-B",
  "R-C",
  "R-D",
];
export function gapPoints(puzzle: Puzzle): Record<Gap, Vec> {
  const ball = ballX(puzzle);
  const tackle = 2 * t.LINE_SPLIT_YARDS;
  const te = tackle + t.TE_SPLIT_YARDS;
  const point = (side: number, x: number): Vec => ({
    x: ball + side * x,
    y: 0,
  });
  return {
    "L-A": point(-1, t.LINE_SPLIT_YARDS / 2),
    "R-A": point(1, t.LINE_SPLIT_YARDS / 2),
    "L-B": point(-1, (t.LINE_SPLIT_YARDS + tackle) / 2),
    "R-B": point(1, (t.LINE_SPLIT_YARDS + tackle) / 2),
    "L-C": point(-1, (tackle + te) / 2),
    "R-C": point(1, (tackle + te) / 2),
    "L-D": point(-1, te + t.GAP_D_OUTSIDE_YARDS),
    "R-D": point(1, te + t.GAP_D_OUTSIDE_YARDS),
  };
}
