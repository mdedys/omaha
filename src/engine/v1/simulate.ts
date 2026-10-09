import {
  TICK_SECONDS,
  type CauseCode,
  type DefenderId,
  type DefensePlayArt,
  type Design,
  type ForcedBy,
  type Letter,
  type Lineman,
  type OffenseId,
  type PlayerId,
  type Puzzle,
  type Rep,
  type Role,
  type RoutePath,
  type Vec,
  type ZoneId,
} from "../contract";
import { EngineError } from "../error";
import {
  chooseHeading,
  headingVector,
  interceptPoint,
  staysInside,
  type Heading,
} from "./afterCatch";
import {
  ballX,
  defenderIds,
  formations,
  gapPoints,
  letters,
  preSnap,
  protections,
} from "./formations";
import { linemen, nearestGap, protect, type Blocker } from "./protection";
import { outsideSign, routePath, routeTrack } from "./routes";
import * as t from "./tuning";
import { direction, distance, segmentDistance, stepToward } from "./vec";
import { inZone, zoneCatalog, type Zone } from "./zones";

export type LogEvent = { tick: number } & (
  | { kind: "pickup"; blocker: Blocker; rusher: DefenderId }
  | { kind: "double"; helper: Lineman; blocker: Lineman; rusher: DefenderId }
  | { kind: "rusher-free"; rusher: DefenderId }
  | { kind: "hug-rush"; defender: DefenderId; letter: Letter }
  | { kind: "hold-release"; rusher: DefenderId }
  | { kind: "pressure"; rusher: DefenderId }
  | { kind: "sack"; rusher: DefenderId }
  | {
      kind: "defender-react";
      defender: DefenderId;
      reason: "break" | "throw" | "zone";
    }
  | { kind: "rubbed"; defender: DefenderId; by: Letter }
  | {
      kind: "zone-choose";
      defender: DefenderId;
      chosen: Letter;
      over: Letter[];
    }
  | { kind: "carry"; defender: DefenderId; letter: Letter }
  | { kind: "read-next"; from: Letter; to: Letter }
  | { kind: "cut"; letter: Letter; heading: Heading }
);
type Rush =
  | { kind: "blocked"; engage: Vec; releaseTick: number }
  | { kind: "free"; gap: Vec; reachedGap: boolean };
// A man or carrying defender's chase: his offset and depth where it starts
// and the cushion left of it, the receiver heading he last reacted to, the
// heading he holds while reacting to a break, and the runner rubbing him.
type Chase = {
  letter: Letter;
  offsetX: number;
  depth: number;
  cushion: number;
  heading: Vec | null;
  resumeTick: number;
  hold: Vec;
  rubbedBy: Letter | null;
  slowUntil: number;
};
// A zone defender's landmark and ellipse and the receiver he reacts to next,
// when the reaction delay ends: an underneath defender's man in his zone and
// the point he aims at, or a deep defender's carry.
type ZonePlay = { zone: Zone; next: Letter | null; reactUntil: number } & (
  | { kind: "underneath"; target: Letter | null; aim: Vec }
  | { kind: "deep"; carry: Chase | null }
);
type Read = { letter: Letter; track: Vec[]; throwTick: number };
type Pass = { read: Read | null; forcedBy?: ForcedBy };
// The ball carrier from the catch, his heading and the tick his cut hold ends.
type Run = {
  letter: Letter;
  catchTick: number;
  heading: Heading;
  holdUntil: number;
};
type Ending =
  | { kind: "sack"; rusher: DefenderId }
  | { kind: "throwaway" }
  | { kind: "breakup" | "interception"; defender: DefenderId }
  | { kind: "tackle"; defender: DefenderId; spot: Vec }
  | { kind: "touchdown" };

const ticks = (seconds: number) => Math.round(seconds / TICK_SECONDS);
const capTicks = ticks(t.REP_CAP_SECONDS);
const holdTicks = ticks(t.HOLD_TIME_SECONDS);
const reactTicks = ticks(t.REACTION_DELAY_SECONDS);
const readTicks = ticks(t.READ_TIME_SECONDS);
const rubTicks = ticks(t.RUB_TIME_SECONDS);
const cutHoldTicks = ticks(t.CUT_HOLD_SECONDS);
const ballStep = t.BALL_SPEED_YARDS_PER_SECOND * TICK_SECONDS;
// The cosine of a 45° turn, with room for rounding in headings taken from
// track steps, since route turns are exact multiples of 45°.
const breakCosine = Math.sqrt(0.5) + 1e-9;

const roleSpeed: Record<Role, number> = {
  DL: t.DL_SPEED_YARDS_PER_SECOND,
  LB: t.LB_SPEED_YARDS_PER_SECOND,
  CB: t.CB_SPEED_YARDS_PER_SECOND,
  S: t.S_SPEED_YARDS_PER_SECOND,
};
function role(id: DefenderId): Role {
  return id.startsWith("DL")
    ? "DL"
    : id.startsWith("LB")
      ? "LB"
      : id.startsWith("S")
        ? "S"
        : "CB";
}
function letterSpeed(puzzle: Puzzle, letter: Letter): number {
  if (letter === "RB") return t.RB_SPEED_YARDS_PER_SECOND;
  const name = formations[puzzle.formation.id].names[letter];
  return name.toLowerCase().endsWith("tight end")
    ? t.TE_SPEED_YARDS_PER_SECOND
    : t.WR_SPEED_YARDS_PER_SECOND;
}

// Each route runner's path, for a design the helpers could have produced.
function routePaths(puzzle: Puzzle, design: Design): Map<Letter, RoutePath> {
  if (!protections(puzzle).includes(design.protection.blockers)) {
    throw new EngineError("Unavailable blocker count");
  }
  const runners = letters.filter(
    (letter) =>
      !(letter === "RB" && design.protection.blockers >= 6) &&
      !(letter === "Y" && design.protection.blockers === 7),
  );
  const paths = new Map<Letter, RoutePath>();
  for (const letter of letters) {
    const call = design.routes[letter];
    if (runners.includes(letter)) {
      if (call === undefined) throw new EngineError("Missing receiver route");
      paths.set(letter, routePath(puzzle, letter, call));
    } else if (call !== undefined) {
      throw new EngineError("A kept-in receiver cannot run a route");
    }
  }
  if (
    design.readOrder.length === 0 ||
    design.readOrder.length > 3 ||
    new Set(design.readOrder).size !== design.readOrder.length ||
    design.readOrder.some((letter) => !runners.includes(letter))
  ) {
    throw new EngineError("Invalid read order");
  }
  return paths;
}

function playArt(
  puzzle: Puzzle,
  catalog: Record<ZoneId, Zone>,
): DefensePlayArt {
  const art: DefensePlayArt = { zones: [], assignments: {} };
  for (const defender of puzzle.defense) {
    const assignment = defender.assignment;
    art.assignments[defender.id] = assignment.kind;
    if (assignment.kind === "zone")
      art.zones.push({
        defenderId: defender.id,
        zone: assignment.zone,
        ...catalog[assignment.zone],
      });
  }
  return art;
}

function badge(separation: number): Rep["feedback"][number]["badge"] {
  return separation >= t.OPEN_SEPARATION_YARDS
    ? "open"
    : separation >= t.CONTEST_RADIUS_YARDS
      ? "contested"
      : "covered";
}

export function simulateWithLog(
  puzzle: Puzzle,
  design: Design,
): { rep: Rep; log: LogEvent[] } {
  const paths = routePaths(puzzle, design);
  const runners = [...paths.keys()];
  const keptIn = letters.filter((letter) => !runners.includes(letter));
  const spots = preSnap(puzzle);
  const snapX = ballX(puzzle);
  const gaps = gapPoints(puzzle);
  const setSpot = { x: snapX, y: -t.QB_SET_DEPTH_YARDS };
  const lineToGain = puzzle.situation.distance;
  const goalLine = t.FIELD_LENGTH_YARDS - puzzle.situation.spot;
  const log: LogEvent[] = [];

  const planned = new Map(
    [...paths].map(([letter, path]) => [
      letter,
      routeTrack(spots[letter], path, letterSpeed(puzzle, letter), capTicks),
    ]),
  );

  const rushers = puzzle.defense.flatMap((defender) =>
    defender.assignment.kind === "rush"
      ? [
          {
            id: defender.id,
            gap:
              defender.assignment.gap ?? nearestGap(puzzle, spots[defender.id]),
            spot: spots[defender.id],
          },
        ]
      : [],
  );
  const { pickups, doubles } = protect(
    puzzle,
    design.protection.lineCall,
    keptIn,
    spots.Y.x < snapX ? "L" : "R",
    rushers,
    puzzle.defense
      .filter((defender) => role(defender.id) === "DL")
      .map((defender) => ({ id: defender.id, spot: spots[defender.id] })),
  );
  const engageAt = (gap: Vec): Vec => ({
    x: gap.x,
    y: -t.PASS_SET_DEPTH_YARDS,
  });
  const behind = (engage: Vec, side: number): Vec => ({
    x: engage.x + side * t.ENGAGE_OFFSET_YARDS,
    y: engage.y - t.ENGAGE_OFFSET_YARDS,
  });
  const rushes = new Map<DefenderId, Rush>();
  const blockerTargets = new Map<OffenseId, Vec>();
  for (const rusher of rushers) {
    const pickup = pickups.find((each) => each.rusher === rusher.id);
    const gap = gaps[rusher.gap];
    if (pickup === undefined) {
      rushes.set(rusher.id, { kind: "free", gap, reachedGap: false });
      log.push({ tick: 0, kind: "rusher-free", rusher: rusher.id });
      continue;
    }
    const engage = engageAt(gap);
    const double = doubles.find((each) => each.rusher === rusher.id);
    rushes.set(rusher.id, {
      kind: "blocked",
      engage,
      releaseTick: double === undefined ? holdTicks : 2 * holdTicks,
    });
    blockerTargets.set(pickup.blocker, behind(engage, 0));
    log.push({ tick: 0, kind: "pickup", ...pickup });
    if (double === undefined) continue;
    blockerTargets.set(
      double.helper,
      behind(engage, Math.sign(spots[double.helper].x - engage.x) || 1),
    );
    log.push({ tick: 0, kind: "double", ...double });
  }
  for (const lineman of linemen)
    if (!blockerTargets.has(lineman))
      blockerTargets.set(lineman, behind(engageAt(spots[lineman]), 0));
  const hugs = puzzle.defense.flatMap((defender) =>
    defender.assignment.kind === "man" &&
    keptIn.includes(defender.assignment.target)
      ? [{ id: defender.id, letter: defender.assignment.target }]
      : [],
  );

  const tracks = startTracks(spots);
  const at = (id: PlayerId, tick: number): Vec => tracks[id][tick];
  const defenders = puzzle.defense.map((defender) => defender.id);
  const pressured = new Set<DefenderId>();
  const separation = (letter: Letter, tick: number): number =>
    Math.min(
      ...defenders.map((id) => distance(at(letter, tick), at(id, tick))),
    );
  const chaseFrom = (me: Vec, letter: Letter, receiver: Vec): Chase => ({
    letter,
    offsetX: me.x - receiver.x,
    depth: me.y,
    cushion: me.y - receiver.y,
    heading: null,
    resumeTick: 0,
    hold: { x: 0, y: 0 },
    rubbedBy: null,
    slowUntil: 0,
  });
  const catalog = zoneCatalog(puzzle);
  const chases = new Map<DefenderId, Chase>();
  const zonePlays = new Map<DefenderId, ZonePlay>();
  for (const defender of puzzle.defense) {
    const assignment = defender.assignment;
    const me = spots[defender.id];
    if (assignment.kind === "man" && runners.includes(assignment.target))
      chases.set(
        defender.id,
        chaseFrom(me, assignment.target, spots[assignment.target]),
      );
    if (assignment.kind !== "zone") continue;
    const zone = catalog[assignment.zone];
    zonePlays.set(
      defender.id,
      assignment.zone.startsWith("deep")
        ? { kind: "deep", zone, next: null, reactUntil: 0, carry: null }
        : {
            kind: "underneath",
            zone,
            next: null,
            reactUntil: 0,
            target: null,
            aim: zone.center,
          },
    );
  }
  const order: Read[] = design.readOrder.flatMap((letter) => {
    const route = planned.get(letter);
    return route === undefined ? [] : [{ letter, ...route }];
  });
  const reads: Rep["reads"] = [];
  let readIndex = 0;
  let readFrom = 0;
  let setTick = Infinity;
  let ball: Rep["ball"] = null;
  let forcedBy: ForcedBy | undefined;
  const breakers = new Set<DefenderId>();
  let run: Run | null = null;
  let ending: Ending | null = null;
  let endTick = 0;

  // The receiver's target is his position plus the pre-snap offset and the
  // cushion; at a turn of 45° or more the defender holds his own last heading
  // for the reaction delay.
  const chaseTarget = (id: DefenderId, chase: Chase, tick: number): Vec => {
    const prev = tick - 1;
    const me = at(id, prev);
    const receiver = at(chase.letter, prev);
    const heading =
      prev > 0 ? direction(at(chase.letter, prev - 1), receiver) : null;
    if (tick === chase.resumeTick) {
      log.push({ tick, kind: "defender-react", defender: id, reason: "break" });
      chase.heading = heading ?? chase.heading;
    } else if (heading !== null && tick > chase.resumeTick) {
      if (chase.heading === null) chase.heading = heading;
      else if (
        heading.x * chase.heading.x + heading.y * chase.heading.y <=
        breakCosine
      ) {
        chase.resumeTick = tick + reactTicks;
        chase.hold = direction(at(id, prev - 1), me) ?? { x: 0, y: 0 };
      }
    }
    chase.cushion = Math.min(
      chase.cushion,
      prev > 0 && heading === null
        ? t.TRAIL_DISTANCE_YARDS
        : Math.max(t.TRAIL_DISTANCE_YARDS, chase.depth - receiver.y),
    );
    if (tick < chase.resumeTick)
      return { x: me.x + chase.hold.x, y: me.y + chase.hold.y };
    return { x: receiver.x + chase.offsetX, y: receiver.y + chase.cushion };
  };
  // A chase step that would pass within the contact radius of another route
  // runner heads along the tangent to that radius, on the side nearer the
  // chase target, or straight out when already inside it; from the rub he
  // moves at the rub speed for the rub time.
  const manStep = (id: DefenderId, chase: Chase, tick: number): Vec => {
    const prev = tick - 1;
    const me = at(id, prev);
    const step = roleSpeed[role(id)] * TICK_SECONDS;
    const target = chaseTarget(id, chase, tick);
    const to = stepToward(me, target, step);
    const by = runners.find(
      (letter) =>
        letter !== chase.letter &&
        segmentDistance(me, to, at(letter, prev)) < t.RUB_CONTACT_RADIUS_YARDS,
    );
    if (by !== undefined && by !== chase.rubbedBy) {
      log.push({ tick, kind: "rubbed", defender: id, by });
      chase.slowUntil = tick + rubTicks;
    }
    chase.rubbedBy = by ?? null;
    const stride = tick < chase.slowUntil ? step * t.RUB_SPEED_FACTOR : step;
    if (by === undefined) return stepToward(me, target, stride);
    const runner = at(by, prev);
    const gap = distance(me, runner);
    const out = direction(runner, me) ?? { x: 0, y: 1 };
    const length = Math.min(stride, distance(me, to));
    if (gap < t.RUB_CONTACT_RADIUS_YARDS)
      return { x: me.x + length * out.x, y: me.y + length * out.y };
    const side =
      out.x * (target.y - me.y) - out.y * (target.x - me.x) >= 0 ? 1 : -1;
    const sin = t.RUB_CONTACT_RADIUS_YARDS / gap;
    const cos = Math.sqrt(1 - sin * sin);
    return {
      x: me.x + length * (-out.x * cos - side * out.y * sin),
      y: me.y + length * (-out.y * cos + side * out.x * sin),
    };
  };

  // An underneath defender plays a receiver in his zone and otherwise sits at
  // the landmark; he only ever aims at a point inside his zone. Among two or
  // more he locks onto the nearest one shallower than himself, else the
  // nearest, until that one leaves. Each change of target waits the reaction
  // delay.
  const underneathTarget = (
    id: DefenderId,
    play: Extract<ZonePlay, { kind: "underneath" }>,
    tick: number,
  ): Vec => {
    const prev = tick - 1;
    const me = at(id, prev);
    if (tick < play.reactUntil) return play.aim;
    if (tick === play.reactUntil) {
      play.target = play.next;
      log.push({ tick, kind: "defender-react", defender: id, reason: "zone" });
    }
    const inside = runners.filter((letter) =>
      inZone(play.zone, at(letter, prev)),
    );
    if (play.target === null || !inside.includes(play.target)) {
      let pick = inside[0] ?? null;
      if (inside.length > 1) {
        const shallower = inside.filter((letter) => at(letter, prev).y < me.y);
        pick = (shallower.length > 0 ? shallower : inside).reduce(
          (best, letter) =>
            distance(at(letter, prev), me) < distance(at(best, prev), me)
              ? letter
              : best,
        );
        log.push({
          tick,
          kind: "zone-choose",
          defender: id,
          chosen: pick,
          over: inside.filter((letter) => letter !== pick),
        });
      }
      if (pick !== play.target) {
        play.next = pick;
        play.reactUntil = tick + reactTicks;
        return play.aim;
      }
    }
    play.aim = play.target === null ? play.zone.center : at(play.target, prev);
    return play.aim;
  };
  // A deep defender drops to his landmark. Before the throw, a receiver in
  // his zone within the carry distance of his depth is a threat; after the
  // reaction delay he carries the deepest one, ties nearer the middle, like
  // man and never rubbed, for the rest of the play.
  const deepTarget = (
    id: DefenderId,
    play: Extract<ZonePlay, { kind: "deep" }>,
    tick: number,
  ): Vec => {
    const prev = tick - 1;
    const me = at(id, prev);
    if (tick === play.reactUntil && play.next !== null) {
      play.carry = chaseFrom(me, play.next, at(play.next, prev));
      log.push({ tick, kind: "defender-react", defender: id, reason: "zone" });
      log.push({ tick, kind: "carry", defender: id, letter: play.next });
    }
    if (play.carry !== null) return chaseTarget(id, play.carry, tick);
    if (ball === null && tick > play.reactUntil) {
      const threats = runners
        .filter((letter) => {
          const receiver = at(letter, prev);
          return (
            inZone(play.zone, receiver) &&
            receiver.y >= me.y - t.CARRY_DISTANCE_YARDS
          );
        })
        .sort(
          (a, b) =>
            at(b, prev).y - at(a, prev).y ||
            Math.abs(at(a, prev).x) - Math.abs(at(b, prev).x),
        );
      if (threats.length > 0) {
        play.next = threats[0];
        play.reactUntil = tick + reactTicks;
      }
    }
    return play.zone.center;
  };

  // Every read is past its throw point once the order runs out. He forces the
  // one with the most separation, ties to the earlier read, if it is at
  // least contested, and otherwise throws it away.
  const outOfReads = (tick: number): Pass => {
    let best: Read | null = null;
    let most = -Infinity;
    for (const read of order) {
      const each = separation(read.letter, tick - 1);
      if (each > most) {
        most = each;
        best = read;
      }
    }
    return best !== null && most >= t.CONTEST_RADIUS_YARDS
      ? { read: best, forcedBy: "out-of-reads" }
      : { read: null };
  };
  // Each read's time opens at the latest of reaching it, the QB being set and
  // the receiver reaching his throw point; the QB reads the previous snapshot.
  const decide = (tick: number): Pass | null => {
    for (;;) {
      const read = order[readIndex];
      const opens = Math.max(readFrom, setTick, read.throwTick);
      if (tick >= opens + readTicks) {
        if (readIndex === order.length - 1) return outOfReads(tick);
        reads.push({ letter: read.letter, fromTick: readFrom, toTick: tick });
        readIndex++;
        log.push({
          tick,
          kind: "read-next",
          from: read.letter,
          to: order[readIndex].letter,
        });
        readFrom = tick;
        continue;
      }
      if (tick < opens) return null;
      const open = separation(read.letter, tick - 1);
      if (open >= t.OPEN_SEPARATION_YARDS) return { read };
      if (pressured.size > 0 && open >= t.CONTEST_RADIUS_YARDS)
        return { read, forcedBy: "pressure" };
      return null;
    }
  };
  const flight = (pass: Pass, tick: number): NonNullable<Rep["ball"]> => {
    const from = at("QB", tick);
    const read = pass.read;
    if (read === null) {
      // From the middle of the field he throws it away to the right.
      const to = {
        x:
          (from.x < 0 ? -1 : 1) *
          (t.FIELD_HALF_WIDTH_YARDS + t.THROWAWAY_PAST_SIDELINE_YARDS),
        y: from.y,
      };
      return {
        from,
        to,
        throwTick: tick,
        arriveTick: tick + Math.ceil(distance(from, to) / ballStep),
        target: null,
      };
    }
    for (let arrive = tick + 1; ; arrive++) {
      const to = read.track[Math.min(arrive, capTicks)];
      if (distance(from, to) <= (arrive - tick) * ballStep)
        return {
          from,
          to,
          throwTick: tick,
          arriveTick: arrive,
          target: read.letter,
        };
    }
  };
  // The nearest defender within the radius of a spot, ties by the fixed
  // defender order.
  const nearestWithin = (
    spot: Vec,
    radius: number,
    tick: number,
  ): DefenderId | null => {
    let found: DefenderId | null = null;
    let nearest = Infinity;
    for (const id of defenderIds.filter((each) => defenders.includes(each))) {
      const d = distance(at(id, tick), spot);
      if (d <= radius && d < nearest) {
        nearest = d;
        found = id;
      }
    }
    return found;
  };
  // The nearest defender within the contest radius makes the play; with
  // none, the ball is caught.
  const arrival = (to: Vec, target: Letter, tick: number): Ending | null => {
    const maker = nearestWithin(to, t.CONTEST_RADIUS_YARDS, tick);
    if (maker === null) return null;
    const first =
      distance(at(maker, tick - 1), to) < distance(at(target, tick - 1), to);
    return {
      kind: breakers.has(maker) && first ? "interception" : "breakup",
      defender: maker,
    };
  };
  const moverAt = (id: DefenderId, tick: number) => ({
    at: at(id, tick),
    step: roleSpeed[role(id)] * TICK_SECONDS,
  });
  // He runs at the target line, the line to gain until he reaches it and
  // then the goal line, holding each new heading for the cut hold unless it
  // would cross the boundary margin.
  const carry = (carrier: Run, tick: number): Vec => {
    const prev = tick - 1;
    const me = {
      at: at(carrier.letter, prev),
      step: letterSpeed(puzzle, carrier.letter) * TICK_SECONDS,
    };
    const inside = -outsideSign(puzzle, carrier.letter);
    const held =
      tick < carrier.holdUntil &&
      staysInside(me, headingVector(carrier.heading, inside));
    const heading = held
      ? carrier.heading
      : chooseHeading(
          me,
          inside,
          defenders.map((id) => moverAt(id, prev)),
          me.at.y >= lineToGain ? goalLine : lineToGain,
        );
    if (heading !== carrier.heading) {
      log.push({ tick, kind: "cut", letter: carrier.letter, heading });
      carrier.heading = heading;
      carrier.holdUntil = tick + cutHoldTicks;
    }
    const dir = headingVector(heading, inside);
    return { x: me.at.x + dir.x * me.step, y: me.at.y + dir.y * me.step };
  };
  // A pursuer aims where he would meet the carrier at the carrier's velocity
  // over the last two snapshots.
  const pursue = (id: DefenderId, carrier: Letter, tick: number): Vec => {
    const prev = tick - 1;
    const now = at(carrier, prev);
    const before = at(carrier, prev - 1);
    return interceptPoint(
      now,
      { x: now.x - before.x, y: now.y - before.y },
      moverAt(id, prev),
    );
  };

  for (let tick = 1; tick <= capTicks && ending === null; tick++) {
    const prev = tick - 1;
    const qbPrev = at("QB", prev);
    if (tick === reactTicks) {
      for (const hug of hugs) {
        log.push({
          tick,
          kind: "hug-rush",
          defender: hug.id,
          letter: hug.letter,
        });
        const me = at(hug.id, prev);
        if (blockerTargets.has(hug.letter)) {
          rushes.set(hug.id, { kind: "free", gap: me, reachedGap: true });
          log.push({ tick, kind: "rusher-free", rusher: hug.id });
          continue;
        }
        const share = Math.min(
          1,
          Math.max(0, (-t.PASS_SET_DEPTH_YARDS - me.y) / (setSpot.y - me.y)),
        );
        const engage = {
          x: me.x + (setSpot.x - me.x) * share,
          y: me.y + (setSpot.y - me.y) * share,
        };
        rushes.set(hug.id, { kind: "blocked", engage, releaseTick: holdTicks });
        blockerTargets.set(hug.letter, behind(engage, 0));
        log.push({ tick, kind: "pickup", blocker: hug.letter, rusher: hug.id });
      }
    }
    if (
      ball !== null &&
      ball.target !== null &&
      tick === ball.throwTick + reactTicks
    ) {
      for (const id of defenders) {
        if (distance(at(id, prev), ball.to) > t.BALL_BREAK_RADIUS_YARDS)
          continue;
        breakers.add(id);
        log.push({
          tick,
          kind: "defender-react",
          defender: id,
          reason: "throw",
        });
      }
    }

    const rushTarget = (id: DefenderId, rush: Rush): Vec => {
      if (rush.kind === "blocked") {
        if (tick < rush.releaseTick) return rush.engage;
        if (tick === rush.releaseTick)
          log.push({ tick, kind: "hold-release", rusher: id });
        return qbPrev;
      }
      const me = at(id, prev);
      if (me.x === rush.gap.x && me.y === rush.gap.y) rush.reachedGap = true;
      return rush.reachedGap ? qbPrev : rush.gap;
    };
    tracks.QB.push(
      stepToward(
        qbPrev,
        setSpot,
        t.QB_DROP_SPEED_YARDS_PER_SECOND * TICK_SECONDS,
      ),
    );
    for (const lineman of linemen)
      tracks[lineman].push(
        stepToward(
          at(lineman, prev),
          blockerTargets.get(lineman) ?? at(lineman, prev),
          t.OL_SPEED_YARDS_PER_SECOND * TICK_SECONDS,
        ),
      );
    for (const letter of letters) {
      const route = planned.get(letter);
      tracks[letter].push(
        run?.letter === letter
          ? carry(run, tick)
          : route !== undefined
            ? route.track[tick]
            : stepToward(
                at(letter, prev),
                blockerTargets.get(letter) ?? at(letter, prev),
                letterSpeed(puzzle, letter) * TICK_SECONDS,
              ),
      );
    }
    for (const id of defenders) {
      const me = at(id, prev);
      const step = roleSpeed[role(id)] * TICK_SECONDS;
      // Defenders who broke on the ball pursue from the catch, the rest
      // after the reaction delay.
      const carrier =
        run !== null &&
        (breakers.has(id)
          ? tick > run.catchTick
          : tick >= run.catchTick + reactTicks)
          ? run.letter
          : null;
      const point =
        carrier !== null
          ? pursue(id, carrier, tick)
          : breakers.has(id)
            ? ball?.to
            : undefined;
      const rush = rushes.get(id);
      const chase = chases.get(id);
      const play = zonePlays.get(id);
      tracks[id].push(
        point !== undefined
          ? stepToward(me, point, step)
          : rush !== undefined
            ? stepToward(me, rushTarget(id, rush), step)
            : chase !== undefined
              ? manStep(id, chase, tick)
              : play !== undefined
                ? stepToward(
                    me,
                    play.kind === "deep"
                      ? deepTarget(id, play, tick)
                      : underneathTarget(id, play, tick),
                    step,
                  )
                : me,
      );
    }
    const qb = at("QB", tick);
    if (setTick === Infinity && qb.x === setSpot.x && qb.y === setSpot.y)
      setTick = tick;
    endTick = tick;

    if (ball === null) {
      const pass = decide(tick);
      if (pass !== null) {
        ball = flight(pass, tick);
        forcedBy = pass.forcedBy;
      }
    }
    if (ball === null) {
      let nearest = Infinity;
      let sacker: DefenderId | null = null;
      for (const id of defenders) {
        if (!rushes.has(id)) continue;
        const d = distance(at(id, tick), qb);
        if (d <= t.PRESSURE_RADIUS_YARDS && !pressured.has(id)) {
          pressured.add(id);
          log.push({ tick, kind: "pressure", rusher: id });
        }
        if (d <= t.SACK_RADIUS_YARDS && d < nearest) {
          nearest = d;
          sacker = id;
        }
      }
      if (sacker !== null) {
        log.push({ tick, kind: "sack", rusher: sacker });
        ending = { kind: "sack", rusher: sacker };
      }
    } else if (tick === ball.arriveTick) {
      if (ball.target === null) ending = { kind: "throwaway" };
      else {
        ending = arrival(ball.to, ball.target, tick);
        if (ending === null) {
          run = {
            letter: ball.target,
            catchTick: tick,
            heading: "upfield",
            holdUntil: tick,
          };
          // Blocks end at the catch.
          for (const rush of rushes.values())
            if (rush.kind === "blocked")
              rush.releaseTick = Math.min(rush.releaseTick, tick);
        }
      }
    }
    if (run !== null) {
      const spot = at(run.letter, tick);
      if (spot.y >= goalLine) ending = { kind: "touchdown" };
      else {
        const tackler = nearestWithin(spot, t.TACKLE_RADIUS_YARDS, tick);
        if (tackler !== null)
          ending = { kind: "tackle", defender: tackler, spot };
      }
    }
  }
  if (ending === null) throw new EngineError("Rep reached the 20 s cap");

  const ballOut = ball?.throwTick ?? endTick;
  reads.push({
    letter: order[readIndex].letter,
    fromTick: readFrom,
    toTick: ballOut,
  });
  const feedback = runners.map((letter) => {
    let tick = ballOut;
    if (ball?.target === letter) {
      tick = ball.arriveTick;
    } else {
      const from = Math.max(
        setTick,
        planned.get(letter)?.throwTick ?? Infinity,
      );
      let best = -Infinity;
      for (let each = from; each <= ballOut; each++) {
        if (separation(letter, each) > best) {
          best = separation(letter, each);
          tick = each;
        }
      }
    }
    const measured = separation(letter, tick);
    return { letter, badge: badge(measured), separation: measured, tick };
  });
  const thrownTo = ball?.target ?? null;
  // A breakup or interception, split by whether the throw was forced.
  const played = (
    kind: Rep["outcome"]["kind"],
    closed: CauseCode,
    forced: CauseCode,
    decisive: DefenderId,
  ): Pick<Rep, "outcome" | "verdict" | "cause"> => ({
    outcome: { kind, yards: 0 },
    verdict: "failed",
    cause: {
      code: forcedBy === undefined ? closed : forced,
      decisive,
      thrownTo,
      ...(forcedBy === undefined ? {} : { forcedBy }),
    },
  });
  const result = ((): Pick<Rep, "outcome" | "verdict" | "cause"> => {
    switch (ending.kind) {
      case "sack": {
        const free = log.some(
          (event) =>
            event.kind === "rusher-free" && event.rusher === ending.rusher,
        );
        return {
          outcome: { kind: "sack", yards: Math.trunc(at("QB", endTick).y) },
          verdict: "failed",
          cause: {
            code: free ? "sack-free-rusher" : "sack-beat-block",
            decisive: ending.rusher,
            thrownTo: null,
          },
        };
      }
      case "throwaway":
        return {
          outcome: { kind: "incompletion", yards: 0 },
          verdict: "failed",
          cause: { code: "throwaway", decisive: null, thrownTo: null },
        };
      case "breakup":
        return played(
          "incompletion",
          "breakup-closed",
          "breakup-forced",
          ending.defender,
        );
      case "interception":
        return played(
          "interception",
          "interception-closed",
          "interception-forced",
          ending.defender,
        );
      case "touchdown":
        return {
          outcome: { kind: "completion", yards: Math.trunc(goalLine) },
          verdict: "converted",
          cause: { code: "touchdown", decisive: null, thrownTo },
        };
      case "tackle": {
        const yards = Math.trunc(ending.spot.y);
        return yards >= lineToGain
          ? {
              outcome: { kind: "completion", yards },
              verdict: "converted",
              cause: { code: "converted", decisive: null, thrownTo },
            }
          : {
              outcome: { kind: "completion", yards },
              verdict: "short",
              cause: { code: "short", decisive: ending.defender, thrownTo },
            };
      }
    }
  })();
  const rep: Rep = {
    endTick,
    tracks,
    ball,
    carrier:
      run === null ? null : { letter: run.letter, fromTick: run.catchTick },
    reads,
    thrownToRead: thrownTo === null ? null : design.readOrder.indexOf(thrownTo),
    ...result,
    timeInPocketTicks: ballOut,
    feedback,
    playArt: playArt(puzzle, catalog),
  };
  return { rep, log };
}

export function simulate(puzzle: Puzzle, design: Design): Rep {
  return simulateWithLog(puzzle, design).rep;
}

function startTracks(spots: Record<PlayerId, Vec>): Record<PlayerId, Vec[]> {
  const tracks: Record<PlayerId, Vec[]> = {
    X: [spots.X],
    Y: [spots.Y],
    Z: [spots.Z],
    H: [spots.H],
    RB: [spots.RB],
    QB: [spots.QB],
    LT: [spots.LT],
    LG: [spots.LG],
    C: [spots.C],
    RG: [spots.RG],
    RT: [spots.RT],
    DL1: [spots.DL1],
    DL2: [spots.DL2],
    DL3: [spots.DL3],
    DL4: [spots.DL4],
    LB1: [spots.LB1],
    LB2: [spots.LB2],
    LB3: [spots.LB3],
    CB1: [spots.CB1],
    CB2: [spots.CB2],
    NB: [spots.NB],
    DB: [spots.DB],
    S1: [spots.S1],
    S2: [spots.S2],
  };
  for (const [id, track] of Object.entries(tracks))
    if (track[0] === undefined) Reflect.deleteProperty(tracks, id);
  return tracks;
}
