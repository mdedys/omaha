import type { Vec } from "../contract";

export function distance(a: Vec, b: Vec): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}
// Lands exactly on the target when it is within the step.
export function stepToward(from: Vec, to: Vec, step: number): Vec {
  const gap = distance(from, to);
  if (gap <= step) return to;
  const share = step / gap;
  return {
    x: from.x + (to.x - from.x) * share,
    y: from.y + (to.y - from.y) * share,
  };
}
