import { chooseHeading, headingVector, interceptPoint } from "./afterCatch.ts";
import {
  BALL_BREAK_RADIUS,
  BALL_SPEED,
  BREAK_COSINE,
  CARRY_DISTANCE,
  CONTEST_RADIUS,
  CUT_HOLD,
  ENGAGE_OFFSET,
  FIELD_HALF_WIDTH,
  HOLD_TIME,
  OPEN_SEPARATION,
  PASS_SET_DEPTH,
  PRESSURE_RADIUS,
  QB_DROP_SPEED,
  QB_SET_DEPTH,
  READ_TIME,
  REACTION_DELAY,
  RUB_RADIUS,
  SACK_RADIUS,
  SPEED,
  TACKLE_RADIUS,
  THROWAWAY_PAST_SIDELINE,
  TICK,
  TICK_CAP,
  TRAIL_DISTANCE,
  ZONES,
  toTicks,
} from "./constants.ts";
import {
  GAPS,
  GOAL_LINE_Y,
  GUN_TREY,
  LETTERS,
  LINE_TO_GAIN_Y,
  LINEMEN,
  letterSide,
  nearestGap,
  sideSign,
} from "./formation.ts";
import { protect } from "./protection.ts";
import { routePath, routeTrack } from "./routes.ts";
import type {
  BallFlight,
  Defender,
  DefenderId,
  Defense,
  Design,
  ForceReason,
  GameEvent,
  Heading,
  Letter,
  OffenseId,
  PlayerId,
  Rep,
  RoutePath,
  Vec,
  ZoneName,
} from "./types.ts";
import { causeOf, receiverFeedback } from "./verdict.ts";
import {
  add,
  distance,
  dot,
  length,
  scale,
  stepToward,
  sub,
  vec,
} from "./vec.ts";

const REACT_TICKS = toTicks(REACTION_DELAY);
const READ_TICKS = toTicks(READ_TIME);
const HOLD_TICKS = toTicks(HOLD_TIME);
const CUT_HOLD_TICKS = toTicks(CUT_HOLD);
const LAST_TICK = toTicks(TICK_CAP);
const BALL_STEP = BALL_SPEED * TICK;
const SET_SPOT = vec(0, -QB_SET_DEPTH);

const LETTER_SPEED: Record<Letter, number> = {
  X: SPEED.WR,
  H: SPEED.WR,
  Z: SPEED.WR,
  Y: SPEED.TE,
  RB: SPEED.RB,
};

// A defender trailing a receiver: his pre-snap (or carry-start) leverage and
// cushion, how far upfield the receiver has eaten into that cushion, and the
// receiver heading he last reacted to.
type Chase = {
  letter: Letter;
  dx: number;
  cushion: number;
  startY: number;
  eaten: number;
  heading: Vec | null;
  reactUntil: number;
  hold: Vec;
};

type Rush = {
  kind: "rush";
  gap: Vec;
  engage: Vec | null;
  releaseTick: number;
  atGap: boolean;
};
type Coverage =
  | { kind: "man"; chase: Chase; detour: Letter | null }
  | {
      kind: "zone";
      zone: ZoneName;
      target: Letter | null;
      next: Letter | null;
      aim: Vec;
      reactUntil: number;
    }
  | {
      kind: "deep";
      zone: ZoneName;
      carry: Chase | null;
      next: Letter | null;
      reactUntil: number;
    }
  | Rush
  | { kind: "ball"; point: Vec }
  | { kind: "pursue" };

type Run = {
  kind: "run";
  letter: Letter;
  catchTick: number;
  heading: Heading;
  heldUntil: number;
};
type Phase = { kind: "pocket" } | { kind: "flight"; flight: BallFlight } | Run;

const unit = (v: Vec): Vec | null => {
  const l = length(v);
  return l < 1e-9 ? null : scale(v, 1 / l);
};

function inZone(zone: ZoneName, p: Vec): boolean {
  const z = ZONES[zone];
  return ((p.x - z.x) / z.rx) ** 2 + ((p.y - z.y) / z.ry) ** 2 <= 1;
}

function clampToZone(zone: ZoneName, p: Vec): Vec {
  const z = ZONES[zone];
  const r = Math.sqrt(((p.x - z.x) / z.rx) ** 2 + ((p.y - z.y) / z.ry) ** 2);
  return r <= 1 ? p : vec(z.x + (p.x - z.x) / r, z.y + (p.y - z.y) / r);
}

function segmentDistance(a: Vec, b: Vec, p: Vec): number {
  const ab = sub(b, a);
  const len2 = dot(ab, ab);
  const s =
    len2 === 0 ? 0 : Math.max(0, Math.min(1, dot(sub(p, a), ab) / len2));
  return distance(add(a, scale(ab, s)), p);
}

const byName = (a: { id: string }, b: { id: string }) =>
  a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

function nearestOf<T extends { id: string; d: number }>(items: T[]): T | null {
  return items.reduce<T | null>(
    (best, item) =>
      !best || item.d < best.d || (item.d === best.d && byName(item, best) < 0)
        ? item
        : best,
    null,
  );
}

export function simulate(defense: Defense, design: Design): Rep {
  const events: GameEvent[] = [];
  const log = (e: GameEvent) => events.push(e);
  const defenders = defense.defenders;

  const rushers = defenders.flatMap((d) =>
    d.assignment.kind === "rush"
      ? [
          {
            id: d.id,
            gap: d.assignment.gap ?? nearestGap(d.spot),
            spot: d.spot,
          },
        ]
      : [],
  );
  const protection = protect(
    design.protection,
    rushers,
    defenders.filter((d) => d.role === "DL"),
  );
  const keptIn = protection.keptIn;
  const runners = LETTERS.filter((l) => !keptIn.includes(l));

  const routes: Partial<Record<Letter, RoutePath>> = {};
  const planned: Partial<Record<Letter, Vec[]>> = {};
  const throwTicks: Partial<Record<Letter, number>> = {};
  for (const letter of runners) {
    const call = design.routes[letter];
    if (!call) throw new Error(`${letter} runs a route but has none`);
    const path = routePath(
      GUN_TREY[letter],
      letterSide(letter),
      letter === "RB",
      call,
    );
    const { track, throwTick } = routeTrack(
      path,
      LETTER_SPEED[letter],
      LAST_TICK,
    );
    routes[letter] = path;
    planned[letter] = track;
    throwTicks[letter] = throwTick;
  }
  const plannedAt = (letter: Letter, t: number): Vec => {
    const track = planned[letter];
    if (!track) throw new Error(`${letter} has no route`);
    return track[Math.min(t, track.length - 1)];
  };
  const throwableFrom = (letter: Letter): number =>
    throwTicks[letter] ?? Infinity;

  const tracks: Record<PlayerId, Vec[]> = {};
  const offense: OffenseId[] = [...LINEMEN, "QB", ...LETTERS];
  for (const id of offense) {
    tracks[id] = [GUN_TREY[id]];
  }
  for (const d of defenders) tracks[d.id] = [d.spot];
  const at = (id: PlayerId, t: number): Vec => {
    const track = tracks[id];
    return track[Math.max(0, Math.min(t, track.length - 1))];
  };

  // Protection: who blocks whom, and where each block happens.
  const blockerTargets = new Map<OffenseId, Vec>();
  const coverage = new Map<DefenderId, Coverage>();
  const engageAt = (gap: Vec): Vec => vec(gap.x, -PASS_SET_DEPTH);
  const doubled = (id: DefenderId) =>
    protection.doubles.some((d) => d.rusher === id);
  for (const r of rushers) {
    const pickup = protection.pickups.find((p) => p.rusher === r.id);
    const gap = GAPS[r.gap];
    coverage.set(r.id, {
      kind: "rush",
      gap,
      engage: pickup ? engageAt(gap) : null,
      releaseTick: doubled(r.id) ? 2 * HOLD_TICKS : HOLD_TICKS,
      atGap: false,
    });
    if (pickup) {
      blockerTargets.set(
        pickup.blocker,
        add(engageAt(gap), vec(0, -ENGAGE_OFFSET)),
      );
      log({ tick: 0, kind: "pickup", ...pickup });
    } else {
      log({ tick: 0, kind: "rusher-free", rusher: r.id, gap: r.gap });
    }
  }
  for (const d of protection.doubles) {
    const rush = coverage.get(d.rusher);
    if (rush?.kind !== "rush") throw new Error(`${d.rusher} is not rushing`);
    const gap = rush.gap;
    const side = Math.sign(GUN_TREY[d.helper].x - gap.x) || 1;
    blockerTargets.set(
      d.helper,
      add(engageAt(gap), vec(side * ENGAGE_OFFSET, -ENGAGE_OFFSET)),
    );
    log({ tick: 0, kind: "double", ...d });
  }
  for (const lineman of LINEMEN) {
    if (!blockerTargets.has(lineman)) {
      blockerTargets.set(
        lineman,
        vec(GUN_TREY[lineman].x, -PASS_SET_DEPTH - ENGAGE_OFFSET),
      );
    }
  }

  const chaseFrom = (defender: Vec, letter: Letter, receiver: Vec): Chase => ({
    letter,
    dx: defender.x - receiver.x,
    cushion: defender.y - receiver.y,
    startY: receiver.y,
    eaten: 0,
    heading: null,
    reactUntil: -1,
    hold: vec(0, 0),
  });
  const hugCandidates: Defender[] = [];
  for (const d of defenders) {
    const a = d.assignment;
    if (a.kind === "man") {
      if (keptIn.includes(a.letter)) hugCandidates.push(d);
      coverage.set(d.id, {
        kind: "man",
        chase: chaseFrom(d.spot, a.letter, GUN_TREY[a.letter]),
        detour: null,
      });
    } else if (a.kind === "zone") {
      coverage.set(
        d.id,
        a.zone.startsWith("deep")
          ? {
              kind: "deep",
              zone: a.zone,
              carry: null,
              next: null,
              reactUntil: -1,
            }
          : {
              kind: "zone",
              zone: a.zone,
              target: null,
              next: null,
              aim: vec(ZONES[a.zone].x, ZONES[a.zone].y),
              reactUntil: -1,
            },
      );
    }
  }
  const coverageOf = (id: DefenderId): Coverage => {
    const c = coverage.get(id);
    if (!c) throw new Error(`${id} has no assignment`);
    return c;
  };
  const defenderStep = (d: Defender) => SPEED[d.role] * TICK;

  const separationAt = (letter: Letter, t: number): number =>
    Math.min(...defenders.map((d) => distance(at(letter, t), at(d.id, t))));

  // A man defender holds his old heading for the reaction delay after his
  // receiver breaks 45° or more, then resumes the chase.
  function chaseTarget(id: DefenderId, chase: Chase, t: number): Vec {
    const p = t - 1;
    const me = at(id, p);
    const receiver = at(chase.letter, p);
    const heading = unit(sub(receiver, at(chase.letter, p - 1)));
    if (t === chase.reactUntil) {
      log({ tick: t, kind: "defender-react", defender: id, reason: "break" });
      chase.heading = heading ?? chase.heading;
    } else if (heading && t > chase.reactUntil) {
      if (!chase.heading) chase.heading = heading;
      else if (dot(heading, chase.heading) <= BREAK_COSINE) {
        chase.reactUntil = t + REACT_TICKS;
        chase.hold = unit(sub(me, at(id, p - 1))) ?? vec(0, 0);
      }
    }
    if (t < chase.reactUntil) return add(me, scale(chase.hold, 100));
    chase.eaten = Math.max(chase.eaten, receiver.y - chase.startY);
    const cushion =
      chase.cushion > TRAIL_DISTANCE
        ? Math.max(TRAIL_DISTANCE, chase.cushion - chase.eaten)
        : chase.cushion;
    return vec(receiver.x + chase.dx, receiver.y + cushion);
  }

  function zoneTarget(
    id: DefenderId,
    c: Extract<Coverage, { kind: "zone" }>,
    t: number,
  ): Vec {
    const p = t - 1;
    const me = at(id, p);
    if (t < c.reactUntil) return c.aim;
    if (t === c.reactUntil) {
      c.target = c.next;
      log({ tick: t, kind: "defender-react", defender: id, reason: "zone" });
    }
    const inside = runners.filter((l) => inZone(c.zone, at(l, p)));
    if (!(c.target && inside.includes(c.target))) {
      let pick: Letter | null = inside[0] ?? null;
      if (inside.length > 1) {
        const front = inside.filter((l) => at(l, p).y < me.y);
        const pool = front.length ? front : inside;
        pick = pool.reduce((best, l) =>
          distance(at(l, p), me) < distance(at(best, p), me) ? l : best,
        );
        log({
          tick: t,
          kind: "zone-choose",
          defender: id,
          chosen: pick,
          over: inside.filter((l) => l !== pick),
        });
      }
      if (pick !== c.target) {
        c.next = pick;
        c.reactUntil = t + REACT_TICKS;
        return c.aim;
      }
    }
    c.aim = c.target
      ? clampToZone(c.zone, at(c.target, p))
      : vec(ZONES[c.zone].x, ZONES[c.zone].y);
    return c.aim;
  }

  // A deep defender drops to his landmark and carries the deepest receiver
  // who threatens his depth, until the throw.
  function deepTarget(
    id: DefenderId,
    c: Extract<Coverage, { kind: "deep" }>,
    t: number,
    ballOut: boolean,
  ): Vec {
    const p = t - 1;
    const me = at(id, p);
    if (t === c.reactUntil && c.next) {
      c.carry = chaseFrom(me, c.next, at(c.next, p));
      log({ tick: t, kind: "defender-react", defender: id, reason: "zone" });
      log({ tick: t, kind: "carry", defender: id, letter: c.next });
    }
    if (c.carry) return chaseTarget(id, c.carry, t);
    if (!ballOut && t > c.reactUntil) {
      const threats = runners
        .filter((l) => {
          const r = at(l, p);
          return inZone(c.zone, r) && r.y >= me.y - CARRY_DISTANCE;
        })
        .sort(
          (a, b) =>
            at(b, p).y - at(a, p).y ||
            Math.abs(at(a, p).x) - Math.abs(at(b, p).x),
        );
      if (threats.length) {
        c.next = threats[0];
        c.reactUntil = t + REACT_TICKS;
      }
    }
    return vec(ZONES[c.zone].x, ZONES[c.zone].y);
  }

  function rushTarget(id: DefenderId, c: Rush, t: number): Vec {
    const me = at(id, t - 1);
    const qb = at("QB", t - 1);
    if (c.engage && t < c.releaseTick) return c.engage;
    if (c.engage && t === c.releaseTick) {
      log({ tick: t, kind: "hold-release", rusher: id });
    }
    if (c.engage) return qb;
    if (!c.atGap && distance(me, c.gap) < 0.1) c.atGap = true;
    return c.atGap ? qb : c.gap;
  }

  // A man defender whose step would pass within the rub radius of another
  // route runner heads for the tangent point of that radius instead, on the
  // side nearer his chase target, keeping the step's length.
  function aroundRunners(
    id: DefenderId,
    c: Extract<Coverage, { kind: "man" }>,
    from: Vec,
    to: Vec,
    target: Vec,
    t: number,
  ): Vec {
    const by = runners.find(
      (l) =>
        l !== c.chase.letter &&
        segmentDistance(from, to, at(l, t - 1)) < RUB_RADIUS,
    );
    if (by && by !== c.detour)
      log({ tick: t, kind: "rubbed", defender: id, by });
    c.detour = by ?? null;
    if (!by) return to;
    const away = sub(from, at(by, t - 1));
    const out = unit(away) ?? vec(0, 1);
    const left = vec(-out.y, out.x);
    const side = dot(left, sub(target, from)) >= 0 ? left : scale(left, -1);
    const sin = Math.min(1, RUB_RADIUS / length(away));
    const dir = add(scale(out, -Math.sqrt(1 - sin * sin)), scale(side, sin));
    return add(from, scale(dir, distance(from, to)));
  }

  // QB, ball and outcome state.
  let phase: Phase = { kind: "pocket" };
  let flight: BallFlight | null = null;
  let carrier: { letter: Letter; fromTick: number } | null = null;
  let ballOutTick = -1;
  let pressured = false;
  let readIndex = 0;
  let readReached = 0;
  let setTick = Infinity;
  const pressuredBy: DefenderId[] = [];
  const ball: Vec[] = [at("QB", 0)];
  const order = design.readOrder;
  log({ tick: 0, kind: "read", letter: order[0] });

  function decideThrow(t: number): BallFlight | null {
    if (t < setTick) return null;
    const qb = at("QB", t - 1);
    for (;;) {
      const letter = order[readIndex];
      const start = Math.max(readReached, setTick, throwableFrom(letter));
      if (t >= start + READ_TICKS) {
        const next = order[readIndex + 1];
        if (next) {
          log({ tick: t, kind: "read-next", from: letter, to: next });
          readIndex++;
          readReached = t;
          continue;
        }
        return outOfReads(t, qb);
      }
      if (t < start) return null;
      const separation = separationAt(letter, t - 1);
      const bar = pressured ? CONTEST_RADIUS : OPEN_SEPARATION;
      if (separation < bar) return null;
      const forced = separation < OPEN_SEPARATION ? "pressure" : null;
      return throwTo(letter, separation, forced, t, qb);
    }
  }

  // Out of reads: the read past its throw point with the most separation,
  // the earlier read on a tie, if he is at least contested.
  function outOfReads(t: number, qb: Vec): BallFlight {
    let best: { letter: Letter; separation: number } | null = null;
    for (const letter of order) {
      if (throwableFrom(letter) > t - 1) continue;
      const separation = separationAt(letter, t - 1);
      if (!best || separation > best.separation) best = { letter, separation };
    }
    if (best && best.separation >= CONTEST_RADIUS) {
      return throwTo(best.letter, best.separation, "out-of-reads", t, qb);
    }
    log({ tick: t, kind: "throwaway" });
    const to = vec(
      (qb.x < 0 ? -1 : 1) * (FIELD_HALF_WIDTH + THROWAWAY_PAST_SIDELINE),
      qb.y,
    );
    const arriveTick = t + Math.ceil(distance(qb, to) / BALL_STEP);
    return { from: qb, to, throwTick: t, arriveTick, target: null };
  }

  function throwTo(
    letter: Letter,
    separation: number,
    forced: ForceReason | null,
    t: number,
    qb: Vec,
  ): BallFlight {
    log({ tick: t, kind: "throw", letter, separation, forced });
    for (let k = t + 1; ; k++) {
      const spot = plannedAt(letter, k);
      if (distance(qb, spot) <= (k - t) * BALL_STEP) {
        return {
          from: qb,
          to: spot,
          throwTick: t,
          arriveTick: k,
          target: letter,
        };
      }
    }
  }

  function defenderTarget(d: Defender, c: Coverage, t: number): Vec {
    switch (c.kind) {
      case "man":
        return chaseTarget(d.id, c.chase, t);
      case "zone":
        return zoneTarget(d.id, c, t);
      case "deep":
        return deepTarget(d.id, c, t, phase.kind !== "pocket");
      case "rush":
        return rushTarget(d.id, c, t);
      case "ball":
        return c.point;
      case "pursue": {
        if (phase.kind !== "run") return at(d.id, t - 1);
        const now = at(phase.letter, t - 1);
        const velocity = sub(now, at(phase.letter, t - 2));
        return interceptPoint(now, velocity, {
          pos: at(d.id, t - 1),
          step: defenderStep(d),
        });
      }
    }
  }

  let t = 1;
  for (; ; t++) {
    if (t > LAST_TICK) throw new Error("engine error: play ran past the cap");
    const p = t - 1;

    // Hug rush: a man defender whose receiver stayed in rushes at the delay.
    if (t === REACT_TICKS) {
      for (const d of hugCandidates) {
        const a = d.assignment;
        if (a.kind !== "man") continue;
        log({ tick: t, kind: "hug-rush", defender: d.id, letter: a.letter });
        const blockerBusy = protection.pickups.some(
          (pk) => pk.blocker === a.letter,
        );
        const me = at(d.id, p);
        const toQb = sub(SET_SPOT, me);
        const s = Math.max(0, (-PASS_SET_DEPTH - me.y) / toQb.y);
        const engage = add(me, scale(toQb, Math.min(1, s)));
        coverage.set(d.id, {
          kind: "rush",
          gap: me,
          engage: blockerBusy ? null : engage,
          releaseTick: HOLD_TICKS,
          atGap: true,
        });
        if (blockerBusy) {
          log({ tick: t, kind: "rusher-free", rusher: d.id, gap: "hug" });
        } else {
          log({ tick: t, kind: "pickup", blocker: a.letter, rusher: d.id });
          blockerTargets.set(a.letter, add(engage, vec(0, -ENGAGE_OFFSET)));
        }
      }
    }

    // Ball advance: the QB decides from the previous snapshot.
    if (phase.kind === "pocket") {
      const thrown = decideThrow(t);
      if (thrown) {
        flight = thrown;
        ballOutTick = t;
        phase = { kind: "flight", flight: thrown };
      }
    }

    // Defenders near the catch point break on the ball after the delay.
    if (flight && flight.target && t === flight.throwTick + REACT_TICKS) {
      for (const d of defenders) {
        const c = coverageOf(d.id);
        if (c.kind === "rush") continue;
        if (distance(at(d.id, p), flight.to) <= BALL_BREAK_RADIUS) {
          coverage.set(d.id, { kind: "ball", point: flight.to });
          log({
            tick: t,
            kind: "defender-react",
            defender: d.id,
            reason: "throw",
          });
        }
      }
    }
    if (phase.kind === "run" && t === phase.catchTick + REACT_TICKS) {
      for (const d of defenders) coverage.set(d.id, { kind: "pursue" });
    }

    // Move everyone at once from the previous snapshot.
    const moves = new Map<PlayerId, Vec>();
    const qbNow = at("QB", p);
    moves.set(
      "QB",
      phase.kind === "pocket" && t < setTick
        ? stepToward(qbNow, SET_SPOT, QB_DROP_SPEED * TICK)
        : qbNow,
    );
    for (const id of LINEMEN) {
      moves.set(
        id,
        stepToward(
          at(id, p),
          blockerTargets.get(id) ?? at(id, p),
          SPEED.OL * TICK,
        ),
      );
    }
    for (const letter of LETTERS) {
      if (keptIn.includes(letter)) {
        const target = blockerTargets.get(letter) ?? at(letter, p);
        moves.set(
          letter,
          stepToward(at(letter, p), target, LETTER_SPEED[letter] * TICK),
        );
      } else if (phase.kind === "run" && phase.letter === letter) {
        const run: Run = phase;
        const insideSign = -sideSign(letterSide(letter));
        const targetY =
          at(letter, p).y >= LINE_TO_GAIN_Y ? GOAL_LINE_Y : LINE_TO_GAIN_Y;
        const step = LETTER_SPEED[letter] * TICK;
        const heading =
          t < run.heldUntil
            ? run.heading
            : chooseHeading(
                { pos: at(letter, p), step },
                insideSign,
                defenders.map((d) => ({
                  pos: at(d.id, p),
                  step: defenderStep(d),
                })),
                targetY,
              );
        if (heading !== run.heading) {
          log({ tick: t, kind: "cut", letter, heading });
          const cut: Run = { ...run, heading, heldUntil: t + CUT_HOLD_TICKS };
          phase = cut;
        }
        moves.set(
          letter,
          add(at(letter, p), scale(headingVector(heading, insideSign), step)),
        );
      } else {
        moves.set(letter, plannedAt(letter, t));
      }
    }
    for (const d of defenders) {
      const c = coverageOf(d.id);
      const from = at(d.id, p);
      const target = defenderTarget(d, c, t);
      const to = stepToward(from, target, defenderStep(d));
      moves.set(
        d.id,
        c.kind === "man" ? aroundRunners(d.id, c, from, to, target, t) : to,
      );
    }
    for (const [id, pos] of moves) tracks[id].push(pos);
    if (setTick === Infinity && distance(at("QB", t), SET_SPOT) < 1e-9)
      setTick = t;

    // Ball position this tick.
    if (phase.kind === "flight") {
      const f: BallFlight = phase.flight;
      const total = distance(f.from, f.to);
      const share = Math.min(1, ((t - f.throwTick) * BALL_STEP) / total);
      ball.push(
        t >= f.arriveTick ? f.to : add(f.from, scale(sub(f.to, f.from), share)),
      );
    } else if (phase.kind === "run") {
      ball.push(at(phase.letter, t));
    } else {
      ball.push(at("QB", t));
    }

    // Sack, then pressure, while the QB still holds the ball.
    if (phase.kind === "pocket") {
      const qb = at("QB", t);
      const near = [...coverage]
        .filter(([, c]) => c.kind === "rush")
        .map(([id]) => ({ id, d: distance(at(id, t), qb) }));
      const sacker = nearestOf(near.filter((r) => r.d <= SACK_RADIUS));
      if (sacker) {
        log({ tick: t, kind: "sack", rusher: sacker.id });
        ballOutTick = t;
        break;
      }
      for (const r of near) {
        if (r.d <= PRESSURE_RADIUS && !pressuredBy.includes(r.id)) {
          pressuredBy.push(r.id);
          pressured = true;
          log({ tick: t, kind: "pressure", rusher: r.id, distance: r.d });
        }
      }
    }

    // Ball arrival.
    if (phase.kind === "flight" && t === phase.flight.arriveTick) {
      const f: BallFlight = phase.flight;
      if (!f.target) break;
      const contest = nearestOf(
        defenders
          .map((d) => ({ id: d.id, d: distance(at(d.id, t), f.to) }))
          .filter((x) => x.d <= CONTEST_RADIUS),
      );
      if (contest) {
        const brokeOnBall = coverageOf(contest.id).kind === "ball";
        const beatReceiver = contest.d < distance(at(f.target, t), f.to);
        log({
          tick: t,
          kind: brokeOnBall && beatReceiver ? "interception" : "breakup",
          defender: contest.id,
          letter: f.target,
        });
        break;
      }
      log({
        tick: t,
        kind: "catch",
        letter: f.target,
        separation: separationAt(f.target, t),
      });
      carrier = { letter: f.target, fromTick: t };
      phase = {
        kind: "run",
        letter: f.target,
        catchTick: t,
        heading: "upfield",
        heldUntil: t,
      };
      for (const d of defenders) {
        if (coverageOf(d.id).kind === "ball")
          coverage.set(d.id, { kind: "pursue" });
      }
    }

    // Touchdown, then tackle.
    if (phase.kind === "run") {
      const pos = at(phase.letter, t);
      if (pos.y >= GOAL_LINE_Y) {
        log({ tick: t, kind: "touchdown", letter: phase.letter });
        break;
      }
      const tackler = nearestOf(
        defenders
          .map((d) => ({ id: d.id, d: distance(at(d.id, t), pos) }))
          .filter((x) => x.d <= TACKLE_RADIUS),
      );
      if (tackler) {
        log({
          tick: t,
          kind: "tackle",
          defender: tackler.id,
          letter: phase.letter,
          yards: pos.y,
        });
        break;
      }
    }
  }

  const thrown =
    flight?.target != null
      ? { letter: flight.target, arriveTick: flight.arriveTick }
      : null;
  return {
    lastTick: t,
    tracks,
    ball,
    flight,
    events,
    cause: causeOf(events),
    feedback: receiverFeedback(
      runners,
      separationAt,
      (letter) => Math.max(setTick, throwableFrom(letter)),
      ballOutTick,
      thrown,
    ),
    routes,
    carrier,
  };
}
