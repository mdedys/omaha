import type { Engine, Puzzle } from "./contract";
import { EngineError } from "./error";

const versions: Record<
  number,
  () => Promise<{ parsePuzzle(json: unknown): Puzzle; engine: Engine }>
> = {
  1: () => import("./stub"),
};

export async function loadPuzzle(
  json: unknown,
): Promise<{ puzzle: Puzzle; engine: Engine }> {
  if (
    typeof json !== "object" ||
    json === null ||
    !("engine" in json) ||
    typeof json.engine !== "number" ||
    !Number.isInteger(json.engine) ||
    !Object.hasOwn(versions, json.engine)
  ) {
    throw new EngineError("Missing or unsupported engine version");
  }
  const version = await versions[json.engine]();
  return { puzzle: version.parsePuzzle(json), engine: version.engine };
}
