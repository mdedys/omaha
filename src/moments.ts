import type { Engine, Puzzle } from "./engine/contract";
import type { Played } from "./result";

export type Moment = { name: "Snap" | "Break" | "Throw" | "End"; tick: number };

// Break is when the first read's receiver reaches the first break of his
// route. Every first break tops a straight stem, so he reaches it on the first
// tick his track is that deep; a route with no break, or a rep that ends
// before he gets there, has no Break.
function breakTick(puzzle: Puzzle, engine: Engine, { design, rep }: Played) {
  const letter = design.readOrder[0];
  const call = design.routes[letter];
  if (!call) return -1;
  const path = engine.routePath(puzzle, letter, call);
  if (!path.breaks.length) return -1;
  const depth = path.points[path.breaks[0].index].y;
  return rep.tracks[letter]
    .slice(0, rep.endTick + 1)
    .findIndex((at) => at.y >= depth);
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
