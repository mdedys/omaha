import type {
  DefensePlayArt,
  Design,
  Engine,
  Puzzle,
  Rep,
  Score,
} from "../contract";
import { EngineError } from "../error";
import { letters, preSnap, protections, routeMenu } from "./formations";
import { availableDepths, routePath } from "./routes";

export { parsePuzzle } from "./puzzle";

function simulate(puzzle: Puzzle, design: Design): Rep {
  if (!protections(puzzle).includes(design.protection.blockers)) {
    throw new EngineError("Unavailable blocker count");
  }
  const runners = letters.filter(
    (letter) =>
      !(letter === "RB" && design.protection.blockers >= 6) &&
      !(letter === "Y" && design.protection.blockers === 7),
  );
  for (const letter of letters) {
    const call = design.routes[letter];
    if (runners.includes(letter)) {
      if (call === undefined) throw new EngineError("Missing receiver route");
      routePath(puzzle, letter, call);
    } else if (call !== undefined) {
      throw new EngineError("A kept-in receiver cannot run a route");
    }
  }
  if (
    design.readOrder.length === 0 ||
    design.readOrder.length > 3 ||
    new Set(design.readOrder).size !== design.readOrder.length ||
    design.readOrder.some((letter) => !runners.includes(letter))
  ) {
    throw new EngineError("Invalid read order");
  }
  throw new EngineError(
    "v1 simulation is not available before the tick-loop cutover",
  );
}
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
