import type { Engine, Puzzle, Vec } from "./engine/contract";
import type { Played } from "./result";

export type Moment = { name: "Snap" | "Break" | "Throw" | "End"; tick: number };

const distance = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);

// Break is when the first read's receiver reaches the first break of his
// route. Until then he runs the path at one speed, his first step, so he gets
// there on the first tick that covers the path's length to the break; a route
// with no break, or a rep that ends before he gets there, has no Break.
function breakTick(puzzle: Puzzle, engine: Engine, { design, rep }: Played) {
  const letter = design.readOrder[0];
  const call = design.routes[letter];
  if (!call) return -1;
  const path = engine.routePath(puzzle, letter, call);
  if (!path.breaks.length) return -1;
  const [start, first] = rep.tracks[letter];
  const stem = [start, ...path.points.slice(0, path.breaks[0].index + 1)];
  const length = stem
    .slice(1)
    .reduce((sum, at, index) => sum + distance(stem[index], at), 0);
  // A thousandth of a yard absorbs rounding in the summed lengths.
  const tick = Math.ceil((length - 0.001) / distance(start, first));
  return tick <= rep.endTick ? tick : -1;
}

export function moments(
  puzzle: Puzzle,
  engine: Engine,
  played: Played,
): Moment[] {
  const { rep } = played;
  const reached = breakTick(puzzle, engine, played);
  const found: Moment[] = [{ name: "Snap", tick: 0 }];
  if (reached >= 0) found.push({ name: "Break", tick: reached });
  if (rep.ball) found.push({ name: "Throw", tick: rep.ball.throwTick });
  found.push({ name: "End", tick: rep.endTick });
  return found.sort((a, b) => a.tick - b.tick);
}

export function tenths(seconds: number) {
  return (Math.round(seconds * 10) / 10).toFixed(1);
}
