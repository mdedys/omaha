import type { DefensePlayArt, Engine, Puzzle, Rep, Score } from "../contract";
import { preSnap, protections, routeMenu } from "./formations";
import { availableDepths, routePath } from "./routes";
import { simulate } from "./simulate";

export { parsePuzzle } from "./puzzle";

function score(puzzle: Puzzle, reps: readonly Rep[]): Score {
  const index = reps.findIndex((rep) => rep.verdict === "converted");
  if (index < 0 || index >= 4) return { base: 0, bonus: 0, total: 0 };
  const rep = reps[index];
  const base = 100 - index * 25;
  const bonus =
    puzzle.goal === "touchdown"
      ? 0
      : rep.cause.code === "touchdown"
        ? 20
        : Math.min(
            10,
            Math.max(
              0,
              Math.trunc(rep.outcome.yards) - puzzle.situation.distance,
            ),
          );
  return { base, bonus, total: base + bonus };
}
function revealedPlayArt(
  playArt: DefensePlayArt,
  failedReps: number,
  puzzleEnded: boolean,
): DefensePlayArt {
  if (puzzleEnded || failedReps >= 3) return structuredClone(playArt);
  if (failedReps < 2) return { zones: [], assignments: {} };
  const visible = (id: string) => id.startsWith("DL") || id.startsWith("LB");
  return {
    zones: structuredClone(
      playArt.zones.filter((zone) => visible(zone.defenderId)),
    ),
    assignments: Object.fromEntries(
      Object.entries(playArt.assignments).filter(([id]) => visible(id)),
    ),
  };
}
export const engine: Engine = {
  simulate,
  score,
  revealedPlayArt,
  preSnap,
  routeMenu,
  availableDepths,
  protections,
  routePath,
};
