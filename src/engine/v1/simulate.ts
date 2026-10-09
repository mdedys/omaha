import {
  TICK_SECONDS,
  type DefenderId,
  type DefensePlayArt,
  type Design,
  type Letter,
  type Lineman,
  type OffenseId,
  type PlayerId,
  type Puzzle,
  type Rep,
  type Role,
  type RoutePath,
  type Vec,
} from "../contract";
import { EngineError } from "../error";
import {
  ballX,
  formations,
  gapPoints,
  letters,
  preSnap,
  protections,
} from "./formations";
import { linemen, nearestGap, protect, type Blocker } from "./protection";
import { routePath, routeTrack } from "./routes";
import * as t from "./tuning";
import { distance, stepToward } from "./vec";
import { zoneCatalog } from "./zones";

export type LogEvent = { tick: number } & (
  | { kind: "pickup"; blocker: Blocker; rusher: DefenderId }
  | { kind: "double"; helper: Lineman; blocker: Lineman; rusher: DefenderId }
  | { kind: "rusher-free"; rusher: DefenderId }
  | { kind: "hug-rush"; defender: DefenderId; letter: Letter }
  | { kind: "hold-release"; rusher: DefenderId }
  | { kind: "pressure"; rusher: DefenderId }
  | { kind: "sack"; rusher: DefenderId }
);
type Rush =
  | { kind: "blocked"; engage: Vec; releaseTick: number }
  | { kind: "free"; gap: Vec; reachedGap: boolean };

const ticks = (seconds: number) => Math.round(seconds / TICK_SECONDS);
const capTicks = ticks(t.REP_CAP_SECONDS);
const holdTicks = ticks(t.HOLD_TIME_SECONDS);
const reactTicks = ticks(t.REACTION_DELAY_SECONDS);

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

function playArt(puzzle: Puzzle): DefensePlayArt {
  const catalog = zoneCatalog(puzzle);
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
  const ball = ballX(puzzle);
  const gaps = gapPoints(puzzle);
  const setSpot = { x: ball, y: -t.QB_SET_DEPTH_YARDS };
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
    spots.Y.x < ball ? "L" : "R",
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
  let setTick = Infinity;
  let endTick = 0;
  let sacker: DefenderId | null = null;
  for (let tick = 1; tick <= capTicks && sacker === null; tick++) {
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
        route !== undefined
          ? route.track[tick]
          : stepToward(
              at(letter, prev),
              blockerTargets.get(letter) ?? at(letter, prev),
              letterSpeed(puzzle, letter) * TICK_SECONDS,
            ),
      );
    }
    for (const id of defenders) {
      const rush = rushes.get(id);
      tracks[id].push(
        rush === undefined
          ? at(id, prev)
          : stepToward(
              at(id, prev),
              rushTarget(id, rush),
              roleSpeed[role(id)] * TICK_SECONDS,
            ),
      );
    }
    const qb = at("QB", tick);
    if (setTick === Infinity && qb.x === setSpot.x && qb.y === setSpot.y)
      setTick = tick;

    let nearest = Infinity;
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
    endTick = tick;
  }
  if (sacker === null) throw new EngineError("Rep reached the 20 s cap");
  log.push({ tick: endTick, kind: "sack", rusher: sacker });

  const separation = (letter: Letter, tick: number): number =>
    Math.min(
      ...defenders.map((id) => distance(at(letter, tick), at(id, tick))),
    );
  const feedback = runners.map((letter) => {
    const from = Math.max(setTick, planned.get(letter)?.throwTick ?? Infinity);
    let tick = endTick;
    let best = -Infinity;
    for (let each = from; each <= endTick; each++) {
      if (separation(letter, each) > best) {
        best = separation(letter, each);
        tick = each;
      }
    }
    const measured = separation(letter, tick);
    return { letter, badge: badge(measured), separation: measured, tick };
  });
  const free = log.some(
    (event) => event.kind === "rusher-free" && event.rusher === sacker,
  );
  const rep: Rep = {
    endTick,
    tracks,
    ball: null,
    carrier: null,
    reads: [{ letter: design.readOrder[0], fromTick: 0, toTick: endTick }],
    thrownToRead: null,
    outcome: { kind: "sack", yards: Math.trunc(at("QB", endTick).y) },
    verdict: "failed",
    timeInPocketTicks: endTick,
    cause: {
      code: free ? "sack-free-rusher" : "sack-beat-block",
      decisive: sacker,
      thrownTo: null,
    },
    feedback,
    playArt: playArt(puzzle),
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
