import type { IndexEntry } from "./puzzles";

export const scrimmageY = 44;

// 2.4 units per yard, never closer than 10 units so short yardage stays legible.
function yAhead(yards: number) {
  return Math.round((scrimmageY - Math.max(10, 2.4 * yards)) * 10) / 10;
}

export function thumbnailLines({
  distance,
  spot,
}: Pick<IndexEntry, "distance" | "spot">) {
  const goalLine = yAhead(100 - spot);
  return {
    lineToGain: yAhead(Math.min(distance, 100 - spot)),
    goalLine: goalLine >= 0 ? goalLine : null,
  };
}
