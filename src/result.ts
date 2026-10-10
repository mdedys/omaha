import { TICK_SECONDS } from "./engine/contract";
import type {
  CauseCode,
  DefenderId,
  DefensePlayArt,
  Design,
  Engine,
  ForcedBy,
  Letter,
  Puzzle,
  Rep,
} from "./engine/contract";

export type Played = { design: Design; rep: Rep };
export type RepBox =
  | { state: "no gain" | "converted" | "next" | "unused" | "not needed" }
  | { state: "short"; yards: string };
type Stat = { value: string; label: string; receiver?: Letter };
type Tile = { kind: "fail" } | { kind: "short"; yards: string } | null;

const headlines: Record<CauseCode, string> = {
  "sack-free-rusher": "SACKED",
  "sack-beat-block": "SACKED",
  throwaway: "INCOMPLETE",
  "breakup-closed": "INCOMPLETE",
  "breakup-forced": "INCOMPLETE",
  "interception-closed": "PICKED OFF",
  "interception-forced": "PICKED OFF",
  short: "SHORT",
  converted: "CONVERTED",
  touchdown: "CONVERTED",
};

const roles: Record<DefenderId, string> = {
  DL1: "lineman",
  DL2: "lineman",
  DL3: "lineman",
  DL4: "lineman",
  LB1: "linebacker",
  LB2: "linebacker",
  LB3: "linebacker",
  CB1: "corner",
  CB2: "corner",
  NB: "nickel",
  DB: "dime back",
  S1: "safety",
  S2: "safety",
};

type Facts = {
  defender: string;
  receiver: string;
  yards: number;
  short: number;
  reads: number;
};
// Each line is the cause, then the jab.
type Line = (facts: Facts) => readonly [string, string];
const counts = ["", "one", "two", "three"];
const plural = (count: number, unit: string) =>
  `${count} ${unit}${count === 1 ? "" : "s"}`;

const lines: Record<
  Exclude<CauseCode, "breakup-forced" | "interception-forced">,
  Line
> &
  Record<"breakup-forced" | "interception-forced", Record<ForcedBy, Line>> = {
  "sack-free-rusher": ({ defender }) => [
    `Nobody blocked the ${defender}.`,
    "Count the rushers next time.",
  ],
  "sack-beat-block": ({ defender }) => [
    `The ${defender} beat his block before a read came open.`,
    "Your QB never had a chance.",
  ],
  throwaway: ({ reads }) => [
    reads === 1
      ? "Your only read was covered, so he threw it away."
      : `All ${counts[reads]} reads were covered, so he threw it away.`,
    "Give him someone to throw to.",
  ],
  "breakup-closed": ({ defender, receiver }) => [
    `The ${defender} closed on the ${receiver} and swatted it.`,
    "Get it there sooner.",
  ],
  "breakup-forced": {
    pressure: ({ defender, receiver }) => [
      `Pressure forced the throw to the ${receiver}, and the ${defender} swatted it.`,
      "Buy him more time.",
    ],
    "out-of-reads": ({ defender, receiver }) => [
      `Out of reads, he forced it to the ${receiver} and the ${defender} swatted it.`,
      "Nobody was open.",
    ],
  },
  "interception-closed": ({ defender, receiver }) => [
    `The ${defender} jumped the throw to the ${receiver}.`,
    "He says thanks.",
  ],
  "interception-forced": {
    pressure: ({ defender, receiver }) => [
      `Pressure forced the throw to the ${receiver}, and the ${defender} picked it.`,
      "He says thanks.",
    ],
    "out-of-reads": ({ defender, receiver }) => [
      `Out of reads, he forced it to the ${receiver} and the ${defender} picked it.`,
      "Nobody was open.",
    ],
  },
  short: ({ defender, receiver, short }) => [
    `The ${defender} stopped the ${receiver} ${plural(short, "yard")} short.`,
    "Close doesn't count.",
  ],
  converted: ({ receiver, yards }) => [
    `The ${receiver} picked up ${plural(yards, "yard")}.`,
    "Take notes, real OC.",
  ],
  touchdown: ({ receiver, yards }) => [
    `The ${receiver} took it ${plural(yards, "yard")} to the house.`,
    "Take a bow.",
  ],
};

function causeLine({ cause }: Rep): Line {
  switch (cause.code) {
    case "breakup-forced":
    case "interception-forced":
      return lines[cause.code][cause.forcedBy ?? "out-of-reads"];
    default:
      return lines[cause.code];
  }
}

function signed(yards: number) {
  return yards > 0 ? `+${yards}` : yards < 0 ? `−${-yards}` : "0";
}

const places = ["1st", "2nd", "3rd"];

function readStat(puzzle: Puzzle, engine: Engine, played: Played): Stat {
  const { rep, design } = played;
  if (rep.outcome.kind === "sack") {
    const place = Math.max(rep.reads.length - 1, 0);
    const receiver = rep.reads[place]?.letter ?? design.readOrder[0];
    return {
      value: engine.displayName(puzzle, receiver).short,
      label: `on ${places[place]} read`,
      receiver,
    };
  }
  const receiver = rep.cause.thrownTo;
  if (receiver === null || rep.thrownToRead === null) {
    return { value: "—", label: "thrown away" };
  }
  return {
    value: engine.displayName(puzzle, receiver).short,
    label: `${places[rep.thrownToRead]} read`,
    receiver,
  };
}

export type Sheet = {
  variant: "cream" | "win" | "over";
  ended: boolean;
  headline: string;
  tile: Tile;
  line: string;
  stats: Stat[];
  boxes: RepBox[];
  status: string;
  fieldLabel: string;
  playArt: DefensePlayArt;
};

export function resultSheet(
  puzzle: Puzzle,
  engine: Engine,
  played: readonly Played[],
): Sheet {
  const last = played[played.length - 1];
  const { rep } = last;
  const count = played.length;
  const converted = rep.verdict === "converted";
  const variant = converted ? "win" : count === 4 ? "over" : "cream";
  const toGo =
    puzzle.goal === "touchdown"
      ? 100 - puzzle.situation.spot
      : puzzle.situation.distance;
  const [cause, jab] = causeLine(rep)({
    defender: rep.cause.decisive ? roles[rep.cause.decisive] : "defense",
    receiver: rep.cause.thrownTo
      ? engine.displayName(puzzle, rep.cause.thrownTo).name
      : "receiver",
    yards: rep.outcome.yards,
    short: toGo - rep.outcome.yards,
    reads: last.design.readOrder.length,
  });
  const reps = played.map((entry) => entry.rep);
  const points = String(engine.score(puzzle, reps).total);
  const stats: Stat[] =
    variant === "win"
      ? [
          { value: signed(rep.outcome.yards), label: "yards gained" },
          { value: points, label: "points" },
          { value: "—", label: "day streak" },
        ]
      : variant === "over"
        ? [
            { value: points, label: "points" },
            {
              value: signed(
                Math.max(...reps.map((entry) => entry.outcome.yards)),
              ),
              label: "best rep",
            },
            { value: String(count), label: "reps used" },
          ]
        : [
            {
              value: signed(rep.outcome.yards),
              label: rep.outcome.kind === "sack" ? "yards" : "yards gained",
            },
            {
              value: `${(rep.timeInPocketTicks * TICK_SECONDS).toFixed(1)}s`,
              label: "in the pocket",
            },
            readStat(puzzle, engine, last),
          ];
  const boxes: RepBox[] = [0, 1, 2, 3].map((index) => {
    const entry = reps[index];
    if (entry) {
      return entry.verdict === "short"
        ? { state: "short", yards: signed(entry.outcome.yards) }
        : { state: entry.verdict === "converted" ? "converted" : "no gain" };
    }
    if (converted) return { state: "not needed" };
    return { state: index === count ? "next" : "unused" };
  });
  const left = 4 - count;
  const ended = variant !== "cream";
  const failed = reps.filter((entry) => entry.verdict !== "converted").length;
  return {
    variant,
    ended,
    headline: variant === "over" ? "OUT OF REPS" : headlines[rep.cause.code],
    tile:
      variant === "win"
        ? null
        : rep.verdict === "short" && variant === "cream"
          ? { kind: "short", yards: signed(rep.outcome.yards) }
          : { kind: "fail" },
    line:
      variant === "over"
        ? `${cause} Four reps, no ${puzzle.goal === "touchdown" ? "touchdown" : "first down"}.`
        : `${cause} ${jab}`,
    stats,
    boxes,
    status:
      variant === "win"
        ? `Converted in ${count}`
        : variant === "over"
          ? "No reps left"
          : left === 1
            ? "1 rep left"
            : `${left} reps left`,
    fieldLabel: `Rep ${count} final frame ${ended ? `against ${puzzle.coverageName}` : "with the defense revealed"}: ${headlines[rep.cause.code].toLowerCase()}. ${cause}`,
    playArt: engine.revealedPlayArt(rep.playArt, failed, ended),
  };
}
