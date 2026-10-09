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
// The nearest the segment from a to b comes to p.
export function segmentDistance(a: Vec, b: Vec, p: Vec): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const length2 = abx * abx + aby * aby;
  const share =
    length2 === 0
      ? 0
      : Math.max(
          0,
          Math.min(1, ((p.x - a.x) * abx + (p.y - a.y) * aby) / length2),
        );
  return distance({ x: a.x + abx * share, y: a.y + aby * share }, p);
}
// The unit vector from one point toward another, or null when they coincide.
export function direction(from: Vec, to: Vec): Vec | null {
  const gap = distance(from, to);
  return gap === 0
    ? null
    : { x: (to.x - from.x) / gap, y: (to.y - from.y) / gap };
}
