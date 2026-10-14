import type { CauseCode, Engine, Puzzle, Rep } from "./engine/contract";
import { downAndDistance } from "./puzzles";
import { signed } from "./result";

type PlayedTile =
  | { kind: "fail"; label: "Incomplete" | "Sacked" | "Picked" }
  | { kind: "short"; label: "Short"; yards: string }
  | { kind: "converted"; label: "Converted" };
export type ShareTile = PlayedTile | { kind: "not needed" };

export type ShareResult = {
  variant: "win" | "over";
  number: number;
  situation: string;
  headline: string;
  status: string;
  line: string;
  tiles: ShareTile[];
  tilesLabel: string;
  chip: string;
  points: number;
  pros: string;
  you: string;
  text: string;
};

const incomplete: PlayedTile = { kind: "fail", label: "Incomplete" };
const sacked: PlayedTile = { kind: "fail", label: "Sacked" };
const picked: PlayedTile = { kind: "fail", label: "Picked" };
const converted: PlayedTile = { kind: "converted", label: "Converted" };

const tiles: Record<CauseCode, (rep: Rep) => PlayedTile> = {
  "sack-free-rusher": () => sacked,
  "sack-beat-block": () => sacked,
  throwaway: () => incomplete,
  "breakup-closed": () => incomplete,
  "breakup-forced": () => incomplete,
  "interception-closed": () => picked,
  "interception-forced": () => picked,
  short: (rep) => ({
    kind: "short",
    label: "Short",
    yards: signed(rep.outcome.yards),
  }),
  converted: () => converted,
  touchdown: () => converted,
};

const emoji: Record<PlayedTile["kind"], string> = {
  fail: "🟥",
  short: "🟨",
  converted: "🟩",
};

function tileWords(entry: ShareTile, index: number) {
  const words =
    entry.kind === "short"
      ? `short, ${entry.yards}`
      : entry.kind === "not needed"
        ? "not needed"
        : entry.label.toLowerCase();
  return `${index === 0 ? "Rep" : "rep"} ${index + 1} ${words}`;
}

// Only reached once the puzzle has ended: a converted rep or four reps.
export function shareResult(
  puzzle: Puzzle,
  engine: Engine,
  reps: readonly Rep[],
): ShareResult {
  const last = reps[reps.length - 1];
  const won = last.verdict === "converted";
  const situation = downAndDistance(puzzle.situation);
  const played = reps.map((rep) => tiles[rep.cause.code](rep));
  const shown: ShareTile[] = [0, 1, 2, 3].map(
    (index) => played[index] ?? { kind: "not needed" },
  );
  const points = engine.score(puzzle, reps).total;
  const count = reps.length;
  const goal = puzzle.goal === "touchdown" ? "touchdown" : "first down";
  const yards = last.outcome.yards;
  const status = won ? `Converted in ${count}` : "Out of reps";
  return {
    variant: won ? "win" : "over",
    number: puzzle.number,
    situation,
    headline: won ? "CONVERTED" : "OUT OF REPS",
    status,
    line: won
      ? `${situation} · in ${count} ${count === 1 ? "rep" : "reps"} · ${signed(yards)} ${Math.abs(yards) === 1 ? "yard" : "yards"}`
      : `${situation} · ${count} reps · no ${goal}`,
    tiles: shown,
    tilesLabel: shown.map(tileWords).join(", "),
    chip: won ? "Beat the pros" : "Didn't beat the pros",
    points,
    pros: puzzle.prosResult,
    you: won
      ? `${signed(yards)} · ${puzzle.goal === "touchdown" ? "Touchdown" : "1st down"}`
      : `No ${goal}`,
    text: [
      `Omaha #${puzzle.number} · ${situation}`,
      played.map((entry) => emoji[entry.kind]).join(""),
      `${won ? `${status} · Beat the pros` : status} · ${points} pts`,
    ].join("\n"),
  };
}

const eastern = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
});

// US Eastern wall-clock time at `ms`, as if it were UTC.
function easternWall(ms: number) {
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(
      eastern.formatToParts(ms).find((entry) => entry.type === type)?.value,
    );
  return Date.UTC(
    part("year"),
    part("month") - 1,
    part("day"),
    part("hour"),
    part("minute"),
    part("second"),
    ms % 1000,
  );
}

// US clocks change at 2am, so the offset just before a midnight is its own.
export function nextPuzzleAt(now: number) {
  const wall = new Date(easternWall(now));
  const midnight = Date.UTC(
    wall.getUTCFullYear(),
    wall.getUTCMonth(),
    wall.getUTCDate() + 1,
  );
  const guess = midnight - (wall.getTime() - now);
  return midnight - (easternWall(guess) - guess);
}

export function countdown(ms: number) {
  const seconds = Math.ceil(ms / 1000);
  return [
    Math.floor(seconds / 3600),
    Math.floor(seconds / 60) % 60,
    seconds % 60,
  ]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}
