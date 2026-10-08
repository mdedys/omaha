import { CONTEST_RADIUS, OPEN_SEPARATION } from "./constants.ts";
import { SITUATION } from "./formation.ts";
import type { Badge, Cause, Feedback, GameEvent, Letter } from "./types.ts";

export const badgeFor = (separation: number): Badge =>
  separation >= OPEN_SEPARATION
    ? "open"
    : separation >= CONTEST_RADIUS
      ? "contested"
      : "covered";

const ENDINGS: readonly GameEvent["kind"][] = [
  "sack",
  "throwaway",
  "breakup",
  "interception",
  "tackle",
  "touchdown",
];

// The cause is read from the event log by the event that ended the rep. A
// throwaway ends it when the ball lands, so other events can follow it.
export function causeOf(events: readonly GameEvent[]): Cause {
  const end = events.findLast((e) => ENDINGS.includes(e.kind));
  if (!end) throw new Error("rep ended without an ending event");
  const thrown = events.findLast((e) => e.kind === "throw");
  const thrownTo = thrown?.kind === "throw" ? thrown.letter : null;
  const forcedBy = thrown?.kind === "throw" ? thrown.forced : null;
  switch (end.kind) {
    case "sack": {
      const free = events.some(
        (e) => e.kind === "rusher-free" && e.rusher === end.rusher,
      );
      return {
        code: free ? "sack-free-rusher" : "sack-beat-block",
        decisive: end.rusher,
        thrownTo: null,
      };
    }
    case "throwaway":
      return { code: "throwaway", decisive: null, thrownTo: null };
    case "breakup":
      return {
        ...(forcedBy
          ? { code: "breakup-forced", forcedBy }
          : { code: "breakup-closed" }),
        decisive: end.defender,
        thrownTo,
      };
    case "interception":
      return {
        ...(forcedBy
          ? { code: "interception-forced", forcedBy }
          : { code: "interception-closed" }),
        decisive: end.defender,
        thrownTo,
      };
    case "touchdown":
      return { code: "touchdown", decisive: null, thrownTo };
    case "tackle":
      return Math.floor(end.yards) >= SITUATION.distance
        ? { code: "converted", decisive: null, thrownTo }
        : { code: "short", decisive: end.defender, thrownTo };
    default:
      throw new Error(`rep ended on a ${end.kind} event`);
  }
}

// The receiver thrown to is measured at arrival; every other route runner at
// his best moment while throwable, or on the ball-out tick if he never was.
export function receiverFeedback(
  runners: readonly Letter[],
  separationAt: (letter: Letter, tick: number) => number,
  throwableFrom: (letter: Letter) => number,
  ballOutTick: number,
  thrown: { letter: Letter; arriveTick: number } | null,
): Feedback[] {
  return runners.map((letter) => {
    let tick = ballOutTick;
    if (thrown?.letter === letter) {
      tick = thrown.arriveTick;
    } else {
      let best = -Infinity;
      for (let t = throwableFrom(letter); t <= ballOutTick; t++) {
        const separation = separationAt(letter, t);
        if (separation > best) {
          best = separation;
          tick = t;
        }
      }
    }
    const separation = separationAt(letter, tick);
    return { letter, badge: badgeFor(separation), separation, tick };
  });
}
