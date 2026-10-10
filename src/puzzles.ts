import type { Puzzle } from "./engine/contract";
import { EngineError } from "./engine/error";
import { loadPuzzle } from "./engine";

export type LandingPuzzle = Puzzle & { goalText: string };
type Situation = Pick<Puzzle["situation"], "down" | "distance" | "spot">;
export type IndexEntry = Situation & {
  number: number;
  date: string;
  label: string;
};

export function downAndDistance({ down, distance, spot }: Situation) {
  const ordinal = ["", "1st", "2nd", "3rd", "4th"][down];
  return `${ordinal} & ${distance >= 100 - spot ? "goal" : distance}`;
}

export function spotText(spot: number) {
  return spot <= 50 ? `own ${spot}` : `opp ${100 - spot}`;
}

function isWhole(value: unknown, min: number, max: number): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= min &&
    value <= max
  );
}

function parseIndex(json: unknown): IndexEntry[] {
  if (!Array.isArray(json)) throw new Error("Expected a puzzle index");
  return json.map((entry: unknown) => {
    if (
      typeof entry !== "object" ||
      entry === null ||
      !("number" in entry) ||
      !isWhole(entry.number, 1, Infinity) ||
      !("date" in entry) ||
      typeof entry.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(entry.date) ||
      !("down" in entry) ||
      !isWhole(entry.down, 1, 4) ||
      !("distance" in entry) ||
      !isWhole(entry.distance, 1, 99) ||
      !("spot" in entry) ||
      !isWhole(entry.spot, 1, 99) ||
      !("label" in entry) ||
      typeof entry.label !== "string"
    ) {
      throw new Error("Invalid puzzle index entry");
    }
    return {
      number: entry.number,
      date: entry.date,
      down: entry.down,
      distance: entry.distance,
      spot: entry.spot,
      label: entry.label,
    };
  });
}

async function fetchJson(path: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(path, { signal });
  if (!response.ok) throw new Error("Puzzle fetch failed");
  return response.json();
}

export async function loadNumberedPuzzle(number: number, signal: AbortSignal) {
  return loadPuzzle(await fetchJson(`/puzzles/${number}.json`, signal));
}

// Newest first; entries sharing a date keep their index order.
export function publishedPuzzles(index: IndexEntry[], today: string) {
  return index
    .filter((entry) => entry.date <= today)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export async function loadPublishedPuzzles(signal: AbortSignal) {
  const index = parseIndex(await fetchJson("/puzzles/index.json", signal));
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return publishedPuzzles(index, today);
}

export async function todaysPuzzleNumber(
  signal: AbortSignal,
): Promise<number | null> {
  const [today] = await loadPublishedPuzzles(signal);
  return today ? today.number : null;
}

export async function loadTodaysPuzzle(
  signal: AbortSignal,
): Promise<LandingPuzzle | null> {
  const number = await todaysPuzzleNumber(signal);
  if (number === null) return null;
  const json = await fetchJson(`/puzzles/${number}.json`, signal);
  const { puzzle } = await loadPuzzle(json);
  if (
    typeof json !== "object" ||
    json === null ||
    !("goalText" in json) ||
    typeof json.goalText !== "string"
  ) {
    throw new EngineError("Expected authored goal text");
  }
  return { ...puzzle, goalText: json.goalText };
}
