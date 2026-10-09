import type { Puzzle } from "./engine/contract";
import { EngineError } from "./engine/error";
import { loadPuzzle } from "./engine";

export type LandingPuzzle = Puzzle & { goalText: string };
type IndexEntry = { number: number; date: string };

function parseIndex(json: unknown): IndexEntry[] {
  if (!Array.isArray(json)) throw new Error("Expected a puzzle index");
  return json.map((entry: unknown) => {
    if (
      typeof entry !== "object" ||
      entry === null ||
      !("number" in entry) ||
      typeof entry.number !== "number" ||
      !Number.isInteger(entry.number) ||
      entry.number < 1 ||
      !("date" in entry) ||
      typeof entry.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)
    ) {
      throw new Error("Invalid puzzle index entry");
    }
    return { number: entry.number, date: entry.date };
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

export async function loadTodaysPuzzle(
  signal: AbortSignal,
): Promise<LandingPuzzle | null> {
  const index = parseIndex(await fetchJson("/puzzles/index.json", signal));
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  let latest: IndexEntry | undefined;
  for (const entry of index) {
    if (entry.date <= today && (!latest || entry.date > latest.date)) {
      latest = entry;
    }
  }
  if (!latest) return null;
  const json = await fetchJson(`/puzzles/${latest.number}.json`, signal);
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
