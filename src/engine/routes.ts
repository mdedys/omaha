import {
  BOUNDARY_MARGIN,
  BREAK_SPEED_FACTOR,
  COMEBACK_BACK,
  COMEBACK_OUTSIDE,
  FIELD_HALF_WIDTH,
  FLAT_DEPTH,
  GO_THROW_DEPTH,
  HARD_BREAK_TIME,
  HITCH_DEPTH,
  HOOK_BACK,
  HOOK_INSIDE,
  RB_RELEASE_OUTSIDE,
  SHORT_BREAK_DEPTH,
  SOFT_BREAK_TIME,
  TICK,
  toTicks,
} from "./constants.ts";
import { END_LINE_Y, GUN_TREY, NUMBERS_X, sideSign } from "./formation.ts";
import type { BreakKind, RouteCall, RoutePath, Side, Vec } from "./types.ts";
import { add, distance, scale, stepToward, vec } from "./vec.ts";

const SIDELINE_LIMIT = FIELD_HALF_WIDTH - BOUNDARY_MARGIN;
const END_LIMIT = END_LINE_Y - BOUNDARY_MARGIN;

const diagonal = (sx: number): Vec => vec(sx * Math.SQRT1_2, Math.SQRT1_2);

function toBoundary(from: Vec, dir: Vec): Vec {
  const limits: number[] = [];
  if (dir.y > 0) limits.push((END_LIMIT - from.y) / dir.y);
  if (dir.x !== 0) {
    limits.push((Math.sign(dir.x) * SIDELINE_LIMIT - from.x) / dir.x);
  }
  return add(from, scale(dir, Math.min(...limits)));
}

// Waypoints in yards for one receiver's route, computed at the snap. The QB
// leads along it and the viewer draws it.
export function routePath(
  alignment: Vec,
  side: Side,
  isBack: boolean,
  call: RouteCall,
): RoutePath {
  const out = sideSign(side);
  const inside = -out;
  const lead = isBack
    ? [alignment, vec(out * (GUN_TREY.RT.x + RB_RELEASE_OUTSIDE), 0)]
    : [alignment];
  const x = lead[lead.length - 1].x;
  const at = (y: number) => vec(x, y);

  type Shape = {
    points: Vec[];
    breaks: { index: number; kind: BreakKind }[];
    throwIndex: number;
    end: "sit" | "run";
  };
  const breakAt = (depth: number, dir: Vec, kind: BreakKind): Shape => {
    const corner = at(depth);
    return {
      points: [corner, toBoundary(corner, dir)],
      breaks: [{ index: 0, kind }],
      throwIndex: 0,
      end: "run",
    };
  };
  const square = (depth: number, sx: number) =>
    breakAt(depth, vec(sx, 0), "hard");
  const slanted = (depth: number, sx: number) =>
    breakAt(depth, diagonal(sx), "soft");

  const shape = (): Shape => {
    switch (call.route) {
      case "Go":
      case "Seam": {
        const throwPoint = at(GO_THROW_DEPTH);
        return {
          points: [throwPoint, toBoundary(throwPoint, vec(0, 1))],
          breaks: [],
          throwIndex: 0,
          end: "run",
        };
      }
      case "In":
      case "Out":
        return square(call.depth, call.route === "Out" ? out : inside);
      case "Drag":
        return square(SHORT_BREAK_DEPTH, inside);
      case "Post":
      case "Corner":
        return slanted(call.depth, call.route === "Corner" ? out : inside);
      case "Slant":
        return slanted(SHORT_BREAK_DEPTH, inside);
      case "Hook":
      case "Comeback": {
        const settle =
          call.route === "Hook"
            ? vec(x + inside * HOOK_INSIDE, call.depth - HOOK_BACK)
            : vec(x + out * COMEBACK_OUTSIDE, call.depth - COMEBACK_BACK);
        return {
          points: [at(call.depth), settle],
          breaks: [{ index: 0, kind: "hard" }],
          throwIndex: 1,
          end: "sit",
        };
      }
      case "Hitch":
        return {
          points: [at(HITCH_DEPTH)],
          breaks: [{ index: 0, kind: "hard" }],
          throwIndex: 0,
          end: "sit",
        };
      case "Flat":
        return breakAt(FLAT_DEPTH, vec(out, 0), "soft");
      case "Wheel": {
        const turn = vec(out * NUMBERS_X, FLAT_DEPTH);
        return {
          points: [at(FLAT_DEPTH), turn, toBoundary(turn, vec(0, 1))],
          breaks: [
            { index: 0, kind: "soft" },
            { index: 1, kind: "soft" },
          ],
          throwIndex: 1,
          end: "run",
        };
      }
    }
  };

  const route = shape();
  const offset = lead.length;
  return {
    points: [...lead, ...route.points],
    breaks: route.breaks.map((b) => ({ ...b, index: b.index + offset })),
    throwIndex: route.throwIndex + offset,
    end: route.end,
  };
}

const BREAK_TICKS: Record<BreakKind, number> = {
  hard: toTicks(HARD_BREAK_TIME),
  soft: toTicks(SOFT_BREAK_TIME),
};

// The receiver's position on every tick and the tick he reaches his throw
// point. Nothing about a route reacts to the defense, so this is his track.
export function routeTrack(
  path: RoutePath,
  speed: number,
  lastTick: number,
): { track: Vec[]; throwTick: number } {
  let pos = path.points[0];
  let next = 1;
  let slowTicks = 0;
  let throwTick = Infinity;
  const track = [pos];
  for (let t = 1; t <= lastTick; t++) {
    let budget = speed * TICK * (slowTicks > 0 ? BREAK_SPEED_FACTOR : 1);
    if (slowTicks > 0) slowTicks--;
    while (budget > 0 && next < path.points.length) {
      const target = path.points[next];
      const gap = distance(pos, target);
      if (gap > budget) {
        pos = stepToward(pos, target, budget);
        break;
      }
      pos = target;
      budget -= gap;
      if (next === path.throwIndex) throwTick = Math.min(throwTick, t);
      const brk = path.breaks.find((b) => b.index === next);
      if (brk) {
        slowTicks = BREAK_TICKS[brk.kind];
        budget *= BREAK_SPEED_FACTOR;
      }
      next++;
    }
    track.push(pos);
  }
  return { track, throwTick };
}
