import type { Assignment, Look, LookAnchor, Puzzle } from "../contract";
import { EngineError } from "../error";
import {
  defenderIds,
  formationIds,
  gapIds,
  letters,
  preSnap,
} from "./formations";
import { linemen } from "./protection";
import { zoneIds } from "./zones";
import {
  DEFENDER_SPACING_YARDS,
  FIELD_HALF_WIDTH_YARDS,
  FIELD_LENGTH_YARDS,
  MAX_SPOT_YARDS,
  MIN_SPOT_YARDS,
} from "./tuning";
import { distance } from "./vec";

const lookAnchors: readonly LookAnchor[] = [
  ...letters,
  ...linemen,
  "QB",
  "ball",
  "field",
];

function object(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new EngineError("Expected a puzzle object");
  }
  return Object.fromEntries(Object.entries(value));
}
function text(value: unknown): string {
  if (typeof value !== "string") throw new EngineError("Expected puzzle text");
  return value;
}
function number(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new EngineError("Expected a puzzle number");
  }
  return value;
}
function member<T extends string>(value: unknown, options: readonly T[]): T {
  const match = options.find((option) => option === value);
  if (match === undefined) throw new EngineError("Unknown puzzle value");
  return match;
}
function assignment(value: unknown): Assignment {
  const parts = text(value).split(" ");
  if (parts.length === 2 && parts[0] === "man") {
    return { kind: "man", target: member(parts[1], letters) };
  }
  if (parts.length === 2 && parts[0] === "zone") {
    return { kind: "zone", zone: member(parts[1], zoneIds) };
  }
  if (parts[0] === "rush") {
    if (parts.length === 1) return { kind: "rush" };
    if (parts.length === 2)
      return { kind: "rush", gap: member(parts[1], gapIds) };
  }
  throw new EngineError("Unknown defensive assignment");
}
function look(value: unknown): Look | undefined {
  if (value === undefined) return undefined;
  const raw = object(value);
  return {
    on: raw.on === undefined ? undefined : member(raw.on, lookAnchors),
    x: raw.x === undefined ? undefined : number(raw.x),
    y: raw.y === undefined ? undefined : number(raw.y),
  };
}
// Each defender's resolved spot is on the field and at least the spacing from
// every other defender's.
function checkAlignment(puzzle: Puzzle) {
  const spots = preSnap(puzzle);
  const placed = puzzle.defense.map((defender) => spots[defender.id]);
  if (placed.some((spot) => Math.abs(spot.x) > FIELD_HALF_WIDTH_YARDS)) {
    throw new EngineError("A defender lines up past a sideline");
  }
  placed.forEach((spot, i) => {
    if (
      placed
        .slice(i + 1)
        .some((other) => distance(spot, other) < DEFENDER_SPACING_YARDS)
    ) {
      throw new EngineError("Two defenders line up within a yard");
    }
  });
}
export function parsePuzzle(json: unknown): Puzzle {
  const raw = object(json);
  const situation = object(raw.situation);
  const formation = object(raw.formation);
  if (typeof formation.flip !== "boolean" || !Array.isArray(raw.defense)) {
    throw new EngineError("Expected formation flip and defense array");
  }
  if (raw.defense.length !== 11) {
    throw new EngineError("Expected exactly 11 defenders");
  }
  const spot = number(situation.spot);
  const distance = number(situation.distance);
  const goal = member(raw.goal, ["first-down", "touchdown"]);
  if (
    distance < 1 ||
    spot < MIN_SPOT_YARDS ||
    spot > MAX_SPOT_YARDS ||
    spot + distance > FIELD_LENGTH_YARDS
  ) {
    throw new EngineError("Invalid field situation");
  }
  if (spot + distance === FIELD_LENGTH_YARDS && goal !== "touchdown") {
    throw new EngineError("A goal-to-go puzzle must have a touchdown goal");
  }
  const version = number(raw.engine);
  if (version !== 1) throw new EngineError("Unsupported v1 puzzle version");
  const seen = new Set<string>();
  const puzzle: Puzzle = {
    engine: version,
    number: number(raw.number),
    date: text(raw.date),
    situation: {
      down: number(situation.down),
      distance,
      spot,
      hash: member(situation.hash, ["left", "middle", "right"]),
      scoreDiff: number(situation.scoreDiff),
      quarter: number(situation.quarter),
      clock: text(situation.clock),
    },
    goal,
    briefing: text(raw.briefing),
    formation: { id: member(formation.id, formationIds), flip: formation.flip },
    defense: raw.defense.map((value: unknown) => {
      const defender = object(value);
      const id = member(defender.id, defenderIds);
      if (seen.has(id)) throw new EngineError("Duplicate defender id");
      seen.add(id);
      return {
        id,
        look: look(defender.look),
        assignment: assignment(defender.assignment),
      };
    }),
    coverageName: text(raw.coverageName),
    prosResult: text(raw.prosResult),
  };
  checkAlignment(puzzle);
  return puzzle;
}
