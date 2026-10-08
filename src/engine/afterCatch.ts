import {
  BOUNDARY_MARGIN,
  FIELD_HALF_WIDTH,
  TACKLE_RADIUS,
} from "./constants.ts";
import type { Heading, Vec } from "./types.ts";
import { add, dot, firstPositiveRoot, length, scale, sub, vec } from "./vec.ts";

const SIDELINE_LIMIT = FIELD_HALF_WIDTH - BOUNDARY_MARGIN;

export type Runner = { pos: Vec; step: number };

// How far the carrier runs along a heading before some defender, running
// straight at full speed, could get within tackle range of that spot first.
function freeRun(carrier: Runner, dir: Vec, defender: Runner): number {
  const w = sub(carrier.pos, defender.pos);
  if (length(w) <= TACKLE_RADIUS) return 0;
  const k = defender.step / carrier.step;
  return firstPositiveRoot(
    1 - k * k,
    2 * (dot(w, dir) - TACKLE_RADIUS * k),
    dot(w, w) - TACKLE_RADIUS * TACKLE_RADIUS,
  );
}

// How far along dir the carrier can run before crossing the boundary margin.
function room(carrier: Runner, dir: Vec): number {
  return dir.x === 0
    ? Infinity
    : (Math.sign(dir.x) * SIDELINE_LIMIT - carrier.pos.x) / dir.x;
}

export const staysInside = (carrier: Runner, dir: Vec): boolean =>
  room(carrier, dir) >= carrier.step;

export function headingVector(heading: Heading, insideSign: number): Vec {
  if (heading === "upfield") return vec(0, 1);
  const sx = heading === "inside" ? insideSign : -insideSign;
  return vec(sx * Math.SQRT1_2, Math.SQRT1_2);
}

// The heading whose free run reaches the target line first, else the one
// that gains the most ground; ties go upfield, then toward the middle.
export function chooseHeading(
  carrier: Runner,
  insideSign: number,
  defenders: readonly Runner[],
  targetY: number,
): Heading {
  const towardMiddle: Heading =
    carrier.pos.x === 0 || Math.sign(carrier.pos.x) === -insideSign
      ? "inside"
      : "outside";
  const order: Heading[] = [
    "upfield",
    towardMiddle,
    towardMiddle === "inside" ? "outside" : "inside",
  ];
  const options = order.flatMap((heading) => {
    const dir = headingVector(heading, insideSign);
    if (!staysInside(carrier, dir)) return [];
    const run = Math.min(
      room(carrier, dir),
      ...defenders.map((d) => freeRun(carrier, dir, d)),
    );
    const needed = (targetY - carrier.pos.y) / dir.y;
    return [{ heading, run, needed, gain: run * dir.y }];
  });
  const reaching = options.filter((o) => o.run >= o.needed);
  if (reaching.length) {
    return reaching.reduce((best, o) => (o.needed < best.needed ? o : best))
      .heading;
  }
  return options.reduce((best, o) => (o.gain > best.gain ? o : best)).heading;
}

// Where a pursuer meets the carrier if the carrier keeps his last velocity;
// the carrier's spot when he can't.
export function interceptPoint(
  carrier: Vec,
  velocity: Vec,
  pursuer: Runner,
): Vec {
  const w = sub(carrier, pursuer.pos);
  const ticks = firstPositiveRoot(
    dot(velocity, velocity) - pursuer.step * pursuer.step,
    2 * dot(w, velocity),
    dot(w, w),
  );
  return Number.isFinite(ticks)
    ? add(carrier, scale(velocity, ticks))
    : carrier;
}
