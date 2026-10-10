import type {
  DefensePlayArt,
  Design,
  Engine,
  Puzzle,
  Rep,
  Score,
} from "../contract";
import { EngineError } from "../error";
import {
  displayName,
  letters,
  preSnap,
  protections,
  routeMenu,
} from "../v1/formations";
import { availableDepths, routePath } from "../v1/routes";
import { scenarios } from "./fixtures";

export { parsePuzzle } from "../v1/puzzle";

function simulate(puzzle: Puzzle, design: Design): Rep {
  if (!engine.protections(puzzle).includes(design.protection.blockers)) {
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
  // X's route selects the authored screen state, not a simulated outcome.
  const scenario =
    scenarios.find(
      (entry) => entry.design.routes.X?.route === design.routes.X?.route,
    ) ?? scenarios[0];
  return structuredClone(scenario.rep);
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
  displayName,
  routeMenu,
  availableDepths,
  protections,
  routePath,
};
