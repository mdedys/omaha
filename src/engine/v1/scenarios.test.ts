import { describe, expect, it } from "vitest";
import {
  TICK_SECONDS,
  type Badge,
  type CauseCode,
  type DefenderId,
  type Design,
  type ForcedBy,
  type Letter,
  type PlayerId,
  type Rep,
} from "../contract";
import { loadPuzzle } from "../index";
import { defenderIds, letters } from "./formations";
import { linemen } from "./protection";
import { simulateWithLog, type LogEvent } from "./simulate";

type Range = [number, number];
const moments = ["throw", "sack", "catch"] as const;
type Moment = (typeof moments)[number];
type Expected = {
  cause: CauseCode;
  decisive: DefenderId | null;
  yards: number;
  forcedBy?: ForcedBy;
  badges?: Partial<Record<Letter, Badge>>;
  target?: Letter | null;
  times?: Partial<Record<Moment, Range>>;
  events?: Partial<LogEvent>[];
};
type Scenario = { puzzle: unknown; design: Design; expect: Expected };

const files = import.meta.glob<Scenario>("./scenarios/*.json", {
  eager: true,
  import: "default",
});
const storedHashes = import.meta.glob<string>("./scenarios/*.sha256", {
  eager: true,
  query: "?raw",
  import: "default",
});
const scenarios = Object.entries(files).map(([path, scenario]) => ({
  name: path.slice("./scenarios/".length, -".json".length),
  ...scenario,
}));

const ticksPerSecond = Math.round(1 / TICK_SECONDS);
function momentTick(rep: Rep, moment: Moment): number | null {
  if (moment === "sack")
    return rep.outcome.kind === "sack" ? rep.endTick : null;
  if (moment === "throw") return rep.ball?.throwTick ?? null;
  return rep.outcome.kind === "completion" && rep.ball !== null
    ? rep.ball.arriveTick
    : null;
}
// A time inside its expected range reads as the range, so a miss shows the
// actual seconds.
function observedTimes(
  rep: Rep,
  ranges: Partial<Record<Moment, Range>>,
): Partial<Record<Moment, Range | number | null>> {
  const times: Partial<Record<Moment, Range | number | null>> = {};
  for (const moment of moments) {
    const range = ranges[moment];
    if (range === undefined) continue;
    const tick = momentTick(rep, moment);
    const seconds = tick === null ? null : tick / ticksPerSecond;
    times[moment] =
      seconds !== null && seconds >= range[0] && seconds <= range[1]
        ? range
        : seconds;
  }
  return times;
}
// An expected event matches a logged one with the same value for each field
// it names.
const logged = (log: LogEvent[], event: Partial<LogEvent>) =>
  log.some((each) =>
    Object.entries(event).every(
      ([key, value]) =>
        JSON.stringify(Reflect.get(each, key)) === JSON.stringify(value),
    ),
  );
function observed(rep: Rep, log: LogEvent[], wanted: Expected) {
  return {
    cause: rep.cause.code,
    decisive: rep.cause.decisive,
    yards: rep.outcome.yards,
    ...(wanted.forcedBy !== undefined ? { forcedBy: rep.cause.forcedBy } : {}),
    ...(wanted.target !== undefined
      ? { target: rep.ball?.target ?? null }
      : {}),
    ...(wanted.badges !== undefined
      ? {
          badges: Object.fromEntries(
            Object.keys(wanted.badges).map((letter) => [
              letter,
              rep.feedback.find((each) => each.letter === letter)?.badge,
            ]),
          ),
        }
      : {}),
    ...(wanted.times !== undefined
      ? { times: observedTimes(rep, wanted.times) }
      : {}),
    ...(wanted.events !== undefined
      ? { events: wanted.events.filter((event) => logged(log, event)) }
      : {}),
  };
}

const playerOrder: readonly PlayerId[] = [
  ...letters,
  "QB",
  ...linemen,
  ...defenderIds,
];
// Each tick's state as every player's x and y, then the ball's flight from
// the throw on, float64 little-endian, in a fixed order.
async function tickHashes(rep: Rep): Promise<string[]> {
  const ids = playerOrder.filter((id) => Object.hasOwn(rep.tracks, id));
  const hashes: string[] = [];
  for (let tick = 0; tick <= rep.endTick; tick++) {
    const spots = ids.map((id) => rep.tracks[id][tick]);
    if (rep.ball !== null && tick >= rep.ball.throwTick)
      spots.push(rep.ball.from, rep.ball.to);
    const bytes = new DataView(new ArrayBuffer(spots.length * 16));
    spots.forEach((spot, index) => {
      bytes.setFloat64(index * 16, spot.x, true);
      bytes.setFloat64(index * 16 + 8, spot.y, true);
    });
    const digest = new Uint8Array(
      await crypto.subtle.digest("SHA-256", bytes.buffer),
    );
    const hex = [...digest]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    hashes.push(`${tick} ${hex}`);
  }
  return hashes;
}
function firstDifference(stored: string | undefined, hashes: string[]) {
  if (stored === undefined) return "no stored hashes";
  const lines = stored.trimEnd().split("\n");
  for (let tick = 0; tick < Math.max(lines.length, hashes.length); tick++)
    if (lines[tick] !== hashes[tick]) return `first differing tick: ${tick}`;
  return "no differing tick";
}

describe("v1 scenarios", () => {
  it.each(scenarios)(
    "$name gives its expected rep",
    async ({ puzzle: json, design, expect: wanted }) => {
      const { puzzle, engine } = await loadPuzzle(json);
      const rep = engine.simulate(puzzle, design);
      const { log } = simulateWithLog(puzzle, design);
      expect(observed(rep, log, wanted)).toEqual(wanted);
    },
  );
  it.each(scenarios)(
    "$name matches its golden hashes",
    async ({ name, puzzle: json, design }) => {
      const { puzzle, engine } = await loadPuzzle(json);
      const rep = engine.simulate(puzzle, design);
      const hashes = await tickHashes(rep);
      const file = `./scenarios/${name}.sha256`;
      await expect(`${hashes.join("\n")}\n`).toMatchFileSnapshot(
        file,
        firstDifference(storedHashes[file], hashes),
      );
    },
  );
});
