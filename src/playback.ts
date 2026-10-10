import { TICK_SECONDS } from "./engine/contract";
import type { Letter, Rep, Vec } from "./engine/contract";
import { fieldPoint } from "./Field";

export type Phase = "set" | "snap" | "throw" | "outcome" | "reveal" | "done";
export type Playback = {
  phase: Phase;
  players: (readonly [string, Vec])[];
  ball: { from: Vec; at: Vec; angle: number } | null;
  read: Letter | null;
  cone: { angle: number; opacity: number } | null;
  reveal: number;
};

const setSeconds = 0.8;
const revealDelay = 0.6;
const revealSeconds = 0.5;
const coneFadeIn = 0.1;
const coneFadeOut = 0.3;
const coneTurn = 0.15;

export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const curve = (a: number, b: number, t: number) =>
    3 * a * (1 - t) ** 2 * t + 3 * b * (1 - t) * t ** 2 + t ** 3;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let low = 0;
    let high = 1;
    for (let step = 0; step < 30; step++) {
      const middle = (low + high) / 2;
      if (curve(x1, x2, middle) < x) low = middle;
      else high = middle;
    }
    return curve(y1, y2, (low + high) / 2);
  };
}

export const motionEase = cubicBezier(0.2, 0.8, 0.2, 1);

const clamp = (value: number) => Math.min(Math.max(value, 0), 1);

function seconds(tick: number) {
  return setSeconds + tick * TICK_SECONDS;
}

// Seconds from the start of the Set phase. A sack has no throw, so its
// release is the sack and the outcome starts there.
export function timeline(rep: Rep) {
  const release = seconds(
    rep.ball ? rep.ball.throwTick : rep.timeInPocketTicks,
  );
  const revealStart = seconds(rep.endTick) + revealDelay;
  return {
    snap: setSeconds,
    release,
    outcome: rep.ball ? seconds(rep.ball.arriveTick) : release,
    revealStart,
    end: revealStart + revealSeconds,
  };
}

function trackAt(track: readonly Vec[], tick: number): Vec {
  const index = Math.floor(tick);
  const before = track[index];
  const after = track[Math.min(index + 1, track.length - 1)];
  const fraction = tick - index;
  return {
    x: before.x + (after.x - before.x) * fraction,
    y: before.y + (after.y - before.y) * fraction,
  };
}

function angle(from: Vec, to: Vec) {
  const start = fieldPoint(from);
  const end = fieldPoint(to);
  return (Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI;
}

function tickAt(rep: Rep, time: number) {
  return Math.min(Math.max((time - setSeconds) / TICK_SECONDS, 0), rep.endTick);
}

function readAt(rep: Rep, tick: number) {
  return Math.max(
    rep.reads.findLastIndex((span) => span.fromTick <= tick),
    0,
  );
}

// The cone tracks the current read until the release, turning to each new
// read along the shorter arc.
function coneAngle(rep: Rep, time: number) {
  const tick = tickAt(rep, time);
  const index = readAt(rep, tick);
  const qb = trackAt(rep.tracks.QB, tick);
  const aim = (letter: Letter) => angle(qb, trackAt(rep.tracks[letter], tick));
  const target = aim(rep.reads[index].letter);
  const turned = (time - seconds(rep.reads[index].fromTick)) / coneTurn;
  if (index === 0 || turned >= 1) return target;
  const previous = aim(rep.reads[index - 1].letter);
  const delta = ((((target - previous) % 360) + 540) % 360) - 180;
  return previous + delta * motionEase(turned);
}

export function playback(rep: Rep, time: number): Playback {
  const times = timeline(rep);
  const tick = tickAt(rep, time);
  const opacity =
    time < times.release
      ? clamp((time - times.snap) / coneFadeIn)
      : clamp(1 - (time - times.release) / coneFadeOut);
  const ball =
    rep.ball && time > times.release && time < times.revealStart
      ? {
          from: rep.ball.from,
          at: trackAt(
            [rep.ball.from, rep.ball.to],
            clamp((time - times.release) / (times.outcome - times.release)),
          ),
          angle: angle(rep.ball.from, rep.ball.to),
        }
      : null;
  return {
    phase:
      time < times.snap
        ? "set"
        : time < times.release
          ? "snap"
          : time < times.outcome
            ? "throw"
            : time < times.revealStart
              ? "outcome"
              : time < times.end
                ? "reveal"
                : "done",
    players: Object.entries(rep.tracks).map(
      ([id, track]) => [id, trackAt(track, tick)] as const,
    ),
    ball,
    read: rep.reads.length ? rep.reads[readAt(rep, tick)].letter : null,
    cone:
      rep.reads.length && opacity > 0
        ? { angle: coneAngle(rep, Math.min(time, times.release)), opacity }
        : null,
    reveal: clamp((time - times.revealStart) / revealSeconds),
  };
}
