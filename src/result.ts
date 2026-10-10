import { TICK_SECONDS } from "./engine/contract";
import type {
  Blockers,
  CauseCode,
  DefenderId,
  DefensePlayArt,
  Design,
  Engine,
  ForcedBy,
  Letter,
  LineCall,
  Puzzle,
  Rep,
} from "./engine/contract";
import type { Phase } from "./playback";

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

function facts(puzzle: Puzzle, engine: Engine, { design, rep }: Played): Facts {
  const toGo =
    puzzle.goal === "touchdown"
      ? 100 - puzzle.situation.spot
      : puzzle.situation.distance;
  return {
    defender: rep.cause.decisive ? roles[rep.cause.decisive] : "defense",
    receiver: rep.cause.thrownTo
      ? engine.displayName(puzzle, rep.cause.thrownTo).name
      : "receiver",
    yards: rep.outcome.yards,
    short: toGo - rep.outcome.yards,
    reads: design.readOrder.length,
  };
}

function causeLine({ cause }: Rep): Line {
  switch (cause.code) {
    case "breakup-forced":
    case "interception-forced":
      return lines[cause.code][cause.forcedBy ?? "out-of-reads"];
    default:
      return lines[cause.code];
  }
}

export function signed(yards: number) {
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
  const [cause, jab] = causeLine(rep)(facts(puzzle, engine, last));
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

export type Caption = { word: string; line: string };

const blockerCounts: Record<Blockers, string> = {
  5: "Five",
  6: "Six",
  7: "Seven",
};
const lineCalls: Record<LineCall, string> = {
  man: "Man up front.",
  "slide-left": "Line slides left.",
  "slide-right": "Line slides right.",
};

// Play-by-play words, kept apart from the sheet's verdict headlines.
const outcomes: Record<CauseCode, (facts: Facts) => Caption> = {
  "sack-free-rusher": ({ defender }) => ({
    word: "Sacked",
    line: `Nobody blocked the ${defender}.`,
  }),
  "sack-beat-block": ({ defender }) => ({
    word: "Sacked",
    line: `The ${defender} beat his block.`,
  }),
  throwaway: ({ reads }) => ({
    word: "Thrown away",
    line:
      reads === 1 ? "His only read was covered." : "Every read was covered.",
  }),
  "breakup-closed": ({ defender }) => ({
    word: "Broken up",
    line: `Swatted. The ${defender} closed on it.`,
  }),
  "breakup-forced": ({ defender }) => ({
    word: "Broken up",
    line: `Swatted. The ${defender} was waiting.`,
  }),
  "interception-closed": ({ defender }) => ({
    word: "Picked off",
    line: `The ${defender} jumped the throw.`,
  }),
  "interception-forced": ({ defender }) => ({
    word: "Picked off",
    line: `The ${defender} was sitting on it.`,
  }),
  short: ({ short }) => ({
    word: "Stopped short",
    line: `${plural(short, "yard")} shy of the sticks.`,
  }),
  converted: ({ receiver }) => ({
    word: "First down",
    line: `The ${receiver} moves the chains.`,
  }),
  touchdown: ({ receiver }) => ({
    word: "Touchdown",
    line: `The ${receiver} takes it to the house.`,
  }),
};

function throwLine({ cause }: Rep, receiver: string) {
  switch (cause.code) {
    case "throwaway":
      return "Nobody open. Into the seats.";
    case "breakup-forced":
    case "interception-forced":
      return cause.forcedBy === "pressure"
        ? `Heat's coming. He forces it to the ${receiver}.`
        : `Nothing clean. He forces it to the ${receiver}.`;
    default:
      return `Let it rip to the ${receiver}.`;
  }
}

function setLine({ protection }: Design) {
  return `${blockerCounts[protection.blockers]} in protection. ${lineCalls[protection.lineCall]}`;
}

export function liveCaption(
  puzzle: Puzzle,
  engine: Engine,
  played: Played,
  { phase, read }: { phase: Phase; read: Letter | null },
): Caption {
  const { rep } = played;
  switch (phase) {
    case "set":
      return { word: "Set", line: setLine(played.design) };
    case "snap": {
      if (read === null) return { word: "Snap", line: "Eyes downfield." };
      const name = engine.displayName(puzzle, read).name;
      return {
        word: "Snap",
        line:
          read === rep.reads[0].letter
            ? `Eyes locked on the ${name}.`
            : `Nothing there. Eyes to the ${name}.`,
      };
    }
    case "throw":
      return {
        word: "Throw",
        line: throwLine(rep, facts(puzzle, engine, played).receiver),
      };
    case "outcome":
    case "reveal":
    case "done":
      return outcomes[rep.cause.code](facts(puzzle, engine, played));
  }
}

export function liveLabel(
  puzzle: Puzzle,
  engine: Engine,
  played: readonly Played[],
): string {
  const last = played[played.length - 1];
  const { rep } = last;
  const { receiver } = facts(puzzle, engine, last);
  const looks = rep.reads
    .map(({ letter }) => `the ${engine.displayName(puzzle, letter).name}`)
    .join(", then ");
  const thrown = rep.ball ? ` ${throwLine(rep, receiver)}` : "";
  const { word, line } = liveCaption(puzzle, engine, last, {
    phase: "outcome",
    read: null,
  });
  return `Live play, rep ${played.length}: ${setLine(last.design)} The quarterback looks to ${looks}.${thrown} ${word}. ${line} Then the result appears.`;
}
