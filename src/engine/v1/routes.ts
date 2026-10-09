import {
  TICK_SECONDS,
  type Depth,
  type Letter,
  type Puzzle,
  type RouteCall,
  type RouteName,
  type RoutePath,
  type Vec,
} from "../contract";
import { EngineError } from "../error";
import { ballX, receiverSpot, routeMenu } from "./formations";
import * as t from "./tuning";
import { distance, stepToward } from "./vec";

export function availableDepths(
  puzzle: Puzzle,
  _letter: Letter,
  route: RouteName,
): readonly Depth[] {
  const depths: readonly Depth[] =
    route === "In" || route === "Out" || route === "Hook"
      ? t.SHORT_DEPTHS_YARDS
      : route === "Corner" || route === "Post" || route === "Comeback"
        ? t.LONG_DEPTHS_YARDS
        : [];
  const end =
    t.FIELD_LENGTH_YARDS +
    t.END_ZONE_YARDS -
    t.BOUNDARY_MARGIN_YARDS -
    puzzle.situation.spot;
  return depths.filter((depth) => depth <= end);
}
// The sign of x toward a receiver's own sideline from the ball.
export function outsideSign(puzzle: Puzzle, letter: Letter): number {
  return (
    Math.sign(receiverSpot(puzzle, letter).x - ballX(puzzle)) ||
    (puzzle.formation.flip ? 1 : -1)
  );
}
export function routePath(
  puzzle: Puzzle,
  letter: Letter,
  call: RouteCall,
): RoutePath {
  if (!routeMenu(puzzle, letter).includes(call.route)) {
    throw new EngineError("Route is not on this receiver's menu");
  }
  const depthRoute = [
    "In",
    "Out",
    "Hook",
    "Corner",
    "Post",
    "Comeback",
  ].includes(call.route);
  if (depthRoute) {
    if (
      !("depth" in call) ||
      !availableDepths(puzzle, letter, call.route).includes(call.depth)
    ) {
      throw new EngineError("Unavailable route depth");
    }
  } else if ("depth" in call) {
    throw new EngineError("This route has no depth");
  }
  const alignment = receiverSpot(puzzle, letter);
  const ball = ballX(puzzle);
  const side = outsideSign(puzzle, letter);
  const start =
    letter === "RB"
      ? {
          x:
            ball + side * (2 * t.LINE_SPLIT_YARDS + t.RB_RELEASE_OUTSIDE_YARDS),
          y: 0,
        }
      : alignment;
  const limitX = t.FIELD_HALF_WIDTH_YARDS - t.BOUNDARY_MARGIN_YARDS;
  const limitY =
    t.FIELD_LENGTH_YARDS +
    t.END_ZONE_YARDS -
    t.BOUNDARY_MARGIN_YARDS -
    puzzle.situation.spot;
  const points: Vec[] = [{ ...start }];
  const breaks: RoutePath["breaks"][number][] = [];
  let throwIndex = 1;
  let end: RoutePath["end"] = "run";
  const outside = ["Out", "Corner", "Comeback", "Flat", "Wheel"].includes(
    call.route,
  );
  const direction = outside ? side : -side;
  if (call.route === "Go" || call.route === "Seam") {
    points.push({ x: start.x, y: t.GO_THROW_DEPTH_YARDS });
    if (limitY !== t.GO_THROW_DEPTH_YARDS)
      points.push({ x: start.x, y: limitY });
  } else if (call.route === "Hitch") {
    points.push({ x: start.x, y: t.HITCH_DEPTH_YARDS });
    breaks.push({ index: 1, kind: "hard" });
    end = "sit";
  } else {
    const depth =
      "depth" in call
        ? call.depth
        : call.route === "Slant" || call.route === "Drag"
          ? t.SHORT_BREAK_DEPTH_YARDS
          : t.FLAT_DEPTH_YARDS;
    points.push({ x: start.x, y: depth });
    breaks.push({
      index: 1,
      kind: ["In", "Out", "Drag", "Hook", "Comeback"].includes(call.route)
        ? "hard"
        : "soft",
    });
    if (call.route === "Hook") {
      // Split the 2-back/1-inside settle into axial and exact 45° segments.
      points.push({
        x: start.x,
        y: depth - t.HOOK_BACK_YARDS + t.HOOK_INSIDE_YARDS,
      });
      points.push({
        x: start.x - side * t.HOOK_INSIDE_YARDS,
        y: depth - t.HOOK_BACK_YARDS,
      });
      throwIndex = 3;
      end = "sit";
    } else if (call.route === "Comeback") {
      const travel = Math.min(
        t.COMEBACK_OUTSIDE_YARDS,
        limitX - Math.abs(start.x),
      );
      points.push({
        x: start.x + side * travel,
        y: depth - (travel * t.COMEBACK_BACK_YARDS) / t.COMEBACK_OUTSIDE_YARDS,
      });
      throwIndex = 2;
      end = "sit";
    } else if (call.route === "Wheel") {
      const x = side * (t.FIELD_HALF_WIDTH_YARDS - t.NUMBERS_INSET_YARDS);
      points.push({ x, y: depth }, { x, y: limitY });
      breaks.push({ index: 2, kind: "soft" });
      throwIndex = 2;
    } else if (["Slant", "Post", "Corner"].includes(call.route)) {
      const travel = Math.min(limitY - depth, limitX - direction * start.x);
      points.push({ x: start.x + direction * travel, y: depth + travel });
    } else {
      points.push({ x: direction * limitX, y: depth });
    }
  }
  return { points, breaks, throwIndex, end };
}
// A route runner's position on every tick up to the cap, from his alignment
// along the path, and the tick he first reaches the throw point.
export function routeTrack(
  alignment: Vec,
  path: RoutePath,
  speedYardsPerSecond: number,
  ticks: number,
): { track: Vec[]; throwTick: number } {
  const points = [alignment, ...path.points];
  const breakTicks = {
    hard: Math.round(t.HARD_BREAK_SECONDS / TICK_SECONDS),
    soft: Math.round(t.SOFT_BREAK_SECONDS / TICK_SECONDS),
  };
  let pos = alignment;
  let next = 1;
  let slowTicks = 0;
  let throwTick = Infinity;
  const track = [pos];
  for (let tick = 1; tick <= ticks; tick++) {
    let budget =
      speedYardsPerSecond *
      TICK_SECONDS *
      (slowTicks > 0 ? t.BREAK_SPEED_FACTOR : 1);
    if (slowTicks > 0) slowTicks--;
    while (budget > 0 && next < points.length) {
      const gap = distance(pos, points[next]);
      if (gap > budget) {
        pos = stepToward(pos, points[next], budget);
        break;
      }
      pos = points[next];
      budget -= gap;
      if (next === path.throwIndex + 1) throwTick = tick;
      const brk = path.breaks.find((b) => b.index + 1 === next);
      if (brk) {
        slowTicks = breakTicks[brk.kind];
        budget *= t.BREAK_SPEED_FACTOR;
      }
      next++;
    }
    track.push(pos);
  }
  return { track, throwTick };
}
