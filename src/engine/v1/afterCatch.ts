import type { Vec } from "../contract";
import * as t from "./tuning";
import { distance } from "./vec";

export type Heading = "upfield" | "inside" | "outside";
// A player's spot on the snapshot and how far he moves in one tick.
export type Mover = { at: Vec; step: number };

const sidelineLimit = t.FIELD_HALF_WIDTH_YARDS - t.BOUNDARY_MARGIN_YARDS;
const diagonal = Math.sqrt(0.5);

// The smallest positive root of a·s² + b·s + c, or Infinity when none is.
function firstPositiveRoot(a: number, b: number, c: number): number {
  if (Math.abs(a) < 1e-9) {
    const s = b === 0 ? -1 : -c / b;
    return s > 0 ? s : Infinity;
  }
  const disc = b * b - 4 * a * c;
  if (disc < 0) return Infinity;
  const root = Math.sqrt(disc);
  const roots = [(-b - root) / (2 * a), (-b + root) / (2 * a)].filter(
    (s) => s > 0,
  );
  return roots.length > 0 ? Math.min(...roots) : Infinity;
}

// Inside is the sign of x toward the ball from the carrier's own side.
export function headingVector(heading: Heading, inside: number): Vec {
  if (heading === "upfield") return { x: 0, y: 1 };
  const x = heading === "inside" ? inside : -inside;
  return { x: x * diagonal, y: diagonal };
}
// How far along a heading he runs before crossing the boundary margin.
function room(carrier: Mover, heading: Vec): number {
  return heading.x === 0
    ? Infinity
    : (Math.sign(heading.x) * sidelineLimit - carrier.at.x) / heading.x;
}
export function staysInside(carrier: Mover, heading: Vec): boolean {
  return room(carrier, heading) >= carrier.step;
}
// How far he runs along a heading before the defender, running straight at
// his own speed, could get within the tackle radius of that spot first.
function freeRun(carrier: Mover, heading: Vec, defender: Mover): number {
  const w = {
    x: carrier.at.x - defender.at.x,
    y: carrier.at.y - defender.at.y,
  };
  const r = t.TACKLE_RADIUS_YARDS;
  if (distance(carrier.at, defender.at) <= r) return 0;
  const k = defender.step / carrier.step;
  return firstPositiveRoot(
    1 - k * k,
    2 * (w.x * heading.x + w.y * heading.y - r * k),
    w.x * w.x + w.y * w.y - r * r,
  );
}

// The heading whose free run reaches the target line soonest, else the one
// that gains the most ground before he is cut off; ties go upfield, then
// toward the middle. Headings that cross the boundary margin are dropped.
export function chooseHeading(
  carrier: Mover,
  inside: number,
  defenders: readonly Mover[],
  targetY: number,
): Heading {
  const middle: Heading =
    carrier.at.x === 0 || Math.sign(carrier.at.x) === -inside
      ? "inside"
      : "outside";
  const order: Heading[] = [
    "upfield",
    middle,
    middle === "inside" ? "outside" : "inside",
  ];
  const options = order.flatMap((heading) => {
    const dir = headingVector(heading, inside);
    if (!staysInside(carrier, dir)) return [];
    const run = Math.min(
      room(carrier, dir),
      ...defenders.map((defender) => freeRun(carrier, dir, defender)),
    );
    const needed = (targetY - carrier.at.y) / dir.y;
    return [{ heading, run, needed, gain: run * dir.y }];
  });
  const reaching = options.filter((option) => option.run >= option.needed);
  if (reaching.length > 0)
    return reaching.reduce((best, option) =>
      option.needed < best.needed ? option : best,
    ).heading;
  return options.reduce((best, option) =>
    option.gain > best.gain ? option : best,
  ).heading;
}

// Where the pursuer meets the carrier if the carrier keeps his velocity per
// tick, or the carrier's spot when he never can.
export function interceptPoint(
  carrier: Vec,
  velocity: Vec,
  pursuer: Mover,
): Vec {
  const w = { x: carrier.x - pursuer.at.x, y: carrier.y - pursuer.at.y };
  const ticks = firstPositiveRoot(
    velocity.x * velocity.x +
      velocity.y * velocity.y -
      pursuer.step * pursuer.step,
    2 * (w.x * velocity.x + w.y * velocity.y),
    w.x * w.x + w.y * w.y,
  );
  return Number.isFinite(ticks)
    ? { x: carrier.x + velocity.x * ticks, y: carrier.y + velocity.y * ticks }
    : carrier;
}
