import type { Assignment, Gap, Letter, Puzzle, ZoneId } from "../contract";
import { EngineError } from "../error";
import { defenderIds, letters } from "./catalog";

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

const zones: readonly ZoneId[] = [
  "deep-half-L",
  "deep-half-R",
  "deep-third-L",
  "deep-third-M",
  "deep-third-R",
  "deep-quarter-1",
  "deep-quarter-2",
  "deep-quarter-3",
  "deep-quarter-4",
  "deep-middle",
  "hook-L",
  "hook-M",
  "hook-R",
  "curl-flat-L",
  "curl-flat-R",
  "flat-L",
  "flat-R",
];
const gaps: readonly Gap[] = [
  "L-A",
  "L-B",
  "L-C",
  "L-D",
  "R-A",
  "R-B",
  "R-C",
  "R-D",
];

function assignment(value: unknown): Assignment {
  const parts = text(value).split(" ");
  if (parts.length === 2 && parts[0] === "man") {
    return { kind: "man", target: member<Letter>(parts[1], letters) };
  }
  if (parts.length === 2 && parts[0] === "zone") {
    return { kind: "zone", zone: member(parts[1], zones) };
  }
  if (parts[0] === "rush") {
    if (parts.length === 1) return { kind: "rush" };
    if (parts.length === 2)
      return { kind: "rush", gap: member(parts[1], gaps) };
  }
  throw new EngineError("Unknown defensive assignment");
}

export function parsePuzzle(json: unknown): Puzzle {
  const raw = object(json);
  const situation = object(raw.situation);
  const formation = object(raw.formation);
  if (typeof formation.flip !== "boolean" || !Array.isArray(raw.defense)) {
    throw new EngineError("Expected formation flip and defense array");
  }
  return {
    engine: number(raw.engine),
    number: number(raw.number),
    date: text(raw.date),
    situation: {
      down: number(situation.down),
      distance: number(situation.distance),
      spot: number(situation.spot),
      hash: member(situation.hash, ["left", "middle", "right"]),
      scoreDiff: number(situation.scoreDiff),
      quarter: number(situation.quarter),
      clock: text(situation.clock),
    },
    goal: member(raw.goal, ["first-down", "touchdown"]),
    briefing: text(raw.briefing),
    formation: {
      id: member(formation.id, ["gun-trey"]),
      flip: formation.flip,
    },
    defense: raw.defense.map((value: unknown) => {
      const defender = object(value);
      if (!Array.isArray(defender.at) || defender.at.length !== 2) {
        throw new EngineError("Expected a defender coordinate pair");
      }
      return {
        id: member(defender.id, defenderIds),
        at: { x: number(defender.at[0]), y: number(defender.at[1]) },
        assignment: assignment(defender.assignment),
      };
    }),
    coverageName: text(raw.coverageName),
    prosResult: text(raw.prosResult),
  };
}
