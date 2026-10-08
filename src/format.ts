import { TICK } from "./engine/constants.ts";
import type { Cause, ForceReason, GameEvent } from "./engine/types.ts";

export const seconds = (tick: number): string => `${(tick * TICK).toFixed(2)}s`;
const yd = (n: number) => n.toFixed(1);

export function formatEvent(e: GameEvent): string {
  switch (e.kind) {
    case "pickup":
      return `pickup(${e.blocker} on ${e.rusher})`;
    case "double":
      return `double(${e.helper} helps ${e.blocker} on ${e.rusher})`;
    case "rusher-free":
      return `rusher-free(${e.rusher}, ${e.gap})`;
    case "hug-rush":
      return `hug-rush(${e.defender}, ${e.letter} stayed in)`;
    case "hold-release":
      return `hold-release(${e.rusher})`;
    case "pressure":
      return `pressure(${e.rusher}, ${yd(e.distance)} yd)`;
    case "sack":
      return `sack(${e.rusher})`;
    case "read":
      return `read(${e.letter})`;
    case "read-next":
      return `read-next(${e.from} → ${e.to})`;
    case "throw":
      switch (e.forced) {
        case "pressure":
          return `forced(${e.letter}, sep ${yd(e.separation)}, pressure)`;
        case "out-of-reads":
          return `forced(${e.letter}, sep ${yd(e.separation)}, out-of-reads, ${seconds(e.tick)})`;
        case null:
          return `throw(${e.letter}, sep ${yd(e.separation)})`;
      }
    case "throwaway":
      return "throwaway";
    case "defender-react":
      return `defender-react(${e.defender}, ${e.reason})`;
    case "zone-choose":
      return `zone-choose(${e.defender}, ${e.chosen} over ${e.over.join(", ")})`;
    case "carry":
      return `carry(${e.defender}, ${e.letter})`;
    case "rubbed":
      return `rubbed(${e.defender}, by ${e.by}, ${seconds(e.tick)})`;
    case "catch":
      return `catch(${e.letter}, sep ${yd(e.separation)})`;
    case "breakup":
      return `breakup(${e.defender} on ${e.letter})`;
    case "interception":
      return `interception(${e.defender} on ${e.letter})`;
    case "cut":
      return `cut(${e.letter}, ${e.heading})`;
    case "tackle":
      return `tackle(${e.defender} on ${e.letter}, ${yd(e.yards)} yd)`;
    case "touchdown":
      return `touchdown(${e.letter})`;
  }
}

const forcedThrow: Record<ForceReason, string> = {
  pressure: "pressure forced a contested throw",
  "out-of-reads": "out of reads, the QB forced the throw",
};

// The cause in plain words; it never names the coverage.
export function causeLine(cause: Cause): string {
  const { decisive: d, thrownTo: r } = cause;
  switch (cause.code) {
    case "sack-free-rusher":
      return `Sacked by ${d}: nobody picked him up.`;
    case "sack-beat-block":
      return `Sacked by ${d}: he beat his block while the QB was still reading.`;
    case "throwaway":
      return "Thrown away: every read was covered when the QB ran out of reads.";
    case "breakup-closed":
      return `Broken up by ${d}: ${r} was open at the throw, ${d} closed by the catch.`;
    case "breakup-forced":
      return `Broken up by ${d}: ${forcedThrow[cause.forcedBy]} to ${r}.`;
    case "interception-closed":
      return `Intercepted by ${d}: ${r} was open at the throw, ${d} beat him to the ball.`;
    case "interception-forced":
      return `Intercepted by ${d}: ${forcedThrow[cause.forcedBy]} to ${r}.`;
    case "short":
      return `Short: ${r} caught it and ${d} tackled him before the line to gain.`;
    case "converted":
      return `Converted: ${r} reached the line to gain.`;
    case "touchdown":
      return `Touchdown: ${r} scored.`;
  }
}
