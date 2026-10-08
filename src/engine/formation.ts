import {
  FIELD_HALF_WIDTH,
  GAP_D_OUTSIDE,
  LINE_DEPTH,
  LINE_SPLIT,
  NUMBERS_INSET,
  RB_OFFSET,
  SHOTGUN_DEPTH,
  SLOT_DEPTH,
  TE_SPLIT,
} from "./constants.ts";
import type {
  GapName,
  Letter,
  Lineman,
  OffenseId,
  Side,
  Vec,
} from "./types.ts";
import { vec } from "./vec.ts";

// 3rd and 6 at the offense's own 35, ball on the middle hash.
export const SITUATION = { yardLine: 35, distance: 6 };
export const LINE_TO_GAIN_Y = SITUATION.distance;
export const GOAL_LINE_Y = 100 - SITUATION.yardLine;
export const END_LINE_Y = GOAL_LINE_Y + 10;

export const NUMBERS_X = FIELD_HALF_WIDTH - NUMBERS_INSET;

const tackleX = 2 * LINE_SPLIT;
const teX = tackleX + TE_SPLIT;

// Gun Trey: Y attached right, H in the slot and Z wide right, X alone left.
export const GUN_TREY: Record<OffenseId, Vec> = {
  LT: vec(-tackleX, -LINE_DEPTH),
  LG: vec(-LINE_SPLIT, -LINE_DEPTH),
  C: vec(0, -LINE_DEPTH),
  RG: vec(LINE_SPLIT, -LINE_DEPTH),
  RT: vec(tackleX, -LINE_DEPTH),
  QB: vec(0, -SHOTGUN_DEPTH),
  RB: vec(-RB_OFFSET, -SHOTGUN_DEPTH),
  X: vec(-NUMBERS_X, -LINE_DEPTH),
  Y: vec(teX, -LINE_DEPTH),
  H: vec((teX + NUMBERS_X) / 2, -SLOT_DEPTH),
  Z: vec(NUMBERS_X, -LINE_DEPTH),
};
export const Y_SIDE: Side = "R";

export const LETTERS: readonly Letter[] = ["X", "Y", "H", "Z", "RB"];
export const LINEMEN: readonly Lineman[] = ["LT", "LG", "C", "RG", "RT"];

export const sideSign = (side: Side): 1 | -1 => (side === "L" ? -1 : 1);
export const letterSide = (letter: Letter): Side =>
  GUN_TREY[letter].x < 0 ? "L" : "R";

// C and D sit inside and outside Y; the side without Y spaces them as if he
// were attached there.
function gapPoint(side: Side, gap: "A" | "B" | "C" | "D"): Vec {
  const x = {
    A: LINE_SPLIT / 2,
    B: (LINE_SPLIT + tackleX) / 2,
    C: (tackleX + teX) / 2,
    D: teX + GAP_D_OUTSIDE,
  }[gap];
  return vec(sideSign(side) * x, 0);
}
export const GAPS: Record<GapName, Vec> = {
  "L-A": gapPoint("L", "A"),
  "L-B": gapPoint("L", "B"),
  "L-C": gapPoint("L", "C"),
  "L-D": gapPoint("L", "D"),
  "R-A": gapPoint("R", "A"),
  "R-B": gapPoint("R", "B"),
  "R-C": gapPoint("R", "C"),
  "R-D": gapPoint("R", "D"),
};
export const GAP_NAMES: readonly GapName[] = [
  "L-A",
  "L-B",
  "L-C",
  "L-D",
  "R-A",
  "R-B",
  "R-C",
  "R-D",
];
export const gapDepth = (gap: GapName): number => "ABCD".indexOf(gap[2]);

// The gap point nearest a look spot across the field, a tie going toward the
// ball.
export function nearestGap(spot: Vec): GapName {
  let best: GapName = "L-A";
  let bestDistance = Infinity;
  for (const gap of GAP_NAMES) {
    const d = Math.abs(GAPS[gap].x - spot.x);
    if (
      d < bestDistance ||
      (d === bestDistance && Math.abs(GAPS[gap].x) < Math.abs(GAPS[best].x))
    ) {
      best = gap;
      bestDistance = d;
    }
  }
  return best;
}
