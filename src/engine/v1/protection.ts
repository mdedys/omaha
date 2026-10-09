import type {
  DefenderId,
  Gap,
  Letter,
  LineCall,
  Lineman,
  Puzzle,
  Vec,
} from "../contract";
import { ballX, gapIds, gapPoints } from "./formations";

export type Side = "L" | "R";
export type Blocker = Lineman | Letter;
export type Rusher = { id: DefenderId; gap: Gap; spot: Vec };
export type Pickup = { blocker: Blocker; rusher: DefenderId };
export type Double = { helper: Lineman; blocker: Lineman; rusher: DefenderId };

export const linemen: readonly Lineman[] = ["LT", "LG", "C", "RG", "RT"];
const other = (side: Side): Side => (side === "L" ? "R" : "L");
const guard = (side: Side): Lineman => (side === "L" ? "LG" : "RG");
const tackle = (side: Side): Lineman => (side === "L" ? "LT" : "RT");
const gapSide = (gap: Gap): Side => (gap.startsWith("L") ? "L" : "R");
const gapDepth = (gap: Gap): number => "ABCD".indexOf(gap.slice(2));

// The gap point nearest a look spot across the field, ties toward the ball.
export function nearestGap(puzzle: Puzzle, spot: Vec): Gap {
  const ball = ballX(puzzle);
  const points = gapPoints(puzzle);
  let best = gapIds[0];
  for (const gap of gapIds) {
    const d = Math.abs(points[gap].x - spot.x);
    const bestD = Math.abs(points[best].x - spot.x);
    if (
      d < bestD ||
      (d === bestD &&
        Math.abs(points[gap].x - ball) < Math.abs(points[best].x - ball))
    )
      best = gap;
  }
  return best;
}

// Innermost gap, then nearer the line at the snap, then nearer the ball.
function insideOut(ball: number) {
  return (a: Rusher, b: Rusher): number =>
    gapDepth(a.gap) - gapDepth(b.gap) ||
    a.spot.y - b.spot.y ||
    Math.abs(a.spot.x - ball) - Math.abs(b.spot.x - ball);
}

function slidePickups(
  slide: Side,
  keptIn: readonly Letter[],
  ySide: Side,
  rushers: readonly Rusher[],
  ball: number,
): Pickup[] {
  const away = other(slide);
  const yGap: Gap = `${ySide}-D`;
  const owners: [Blocker, Gap[]][] = [
    ["C", [`${slide}-A`]],
    [guard(slide), [`${slide}-B`]],
    [tackle(slide), [`${slide}-C`]],
    [guard(away), [`${away}-A`]],
    [tackle(away), [`${away}-B`]],
  ];
  if (keptIn.includes("RB")) {
    const edge: Gap[] = [`${away}-C`, `${away}-D`];
    owners.push([
      "RB",
      edge.filter((gap) => !(keptIn.includes("Y") && gap === yGap)),
    ]);
  }
  if (keptIn.includes("Y")) owners.push(["Y", [yGap]]);
  return owners.flatMap(([blocker, gaps]) => {
    const mine = rushers
      .filter((rusher) => gaps.includes(rusher.gap))
      .sort(insideOut(ball));
    return mine.length > 0 ? [{ blocker, rusher: mine[0].id }] : [];
  });
}

function manPickups(
  puzzle: Puzzle,
  keptIn: readonly Letter[],
  ySide: Side,
  rushers: readonly Rusher[],
  dls: readonly { id: DefenderId; spot: Vec }[],
): Pickup[] {
  const ball = ballX(puzzle);
  const points = gapPoints(puzzle);
  const area = (x: number): Lineman => {
    const side: Side = x < ball ? "L" : "R";
    const out = Math.abs(x - ball);
    if (out <= points["R-A"].x - ball) return "C";
    if (out <= points["R-B"].x - ball) return guard(side);
    return tackle(side);
  };
  const outward = (lineman: Lineman, side: Side): Lineman | null =>
    lineman === "C"
      ? guard(side)
      : lineman === guard(side)
        ? tackle(side)
        : null;
  const byArea = new Map<Lineman, { id: DefenderId; spot: Vec }[]>();
  for (const dl of dls) {
    const lineman = area(dl.spot.x);
    byArea.set(lineman, [...(byArea.get(lineman) ?? []), dl]);
  }
  const owned = new Map<Lineman, DefenderId>();
  for (const [lineman, inArea] of byArea) {
    const [inner, outer] = [...inArea].sort(
      (a, b) => Math.abs(a.spot.x - ball) - Math.abs(b.spot.x - ball),
    );
    owned.set(lineman, inner.id);
    if (outer === undefined) continue;
    const next = outward(lineman, outer.spot.x < ball ? "L" : "R");
    if (next !== null && !byArea.has(next)) owned.set(next, outer.id);
  }
  const pickups: Pickup[] = linemen.flatMap((lineman) => {
    const dl = owned.get(lineman);
    return dl !== undefined && rushers.some((rusher) => rusher.id === dl)
      ? [{ blocker: lineman, rusher: dl }]
      : [];
  });
  const leftovers = () =>
    rushers.filter((rusher) =>
      pickups.every((pickup) => pickup.rusher !== rusher.id),
    );
  if (keptIn.includes("Y")) {
    const mine = leftovers()
      .filter((rusher) => gapSide(rusher.gap) === ySide)
      .sort(insideOut(ball))[0];
    if (mine !== undefined) pickups.push({ blocker: "Y", rusher: mine.id });
  }
  if (keptIn.includes("RB")) {
    const first = leftovers().sort(
      (a, b) =>
        gapDepth(a.gap) - gapDepth(b.gap) ||
        Number(gapSide(a.gap) === ySide) - Number(gapSide(b.gap) === ySide) ||
        insideOut(ball)(a, b),
    )[0];
    if (first !== undefined) pickups.push({ blocker: "RB", rusher: first.id });
  }
  return pickups;
}

// Idle linemen, from the center out, each help the nearest lineman with a
// single block, ties toward the ball; one helper per rusher.
function doubleTeams(pickups: readonly Pickup[]): Double[] {
  const index = (lineman: Lineman) => linemen.indexOf(lineman);
  const center = index("C");
  const blocks = pickups.flatMap(({ blocker, rusher }) => {
    const lineman = linemen.find((each) => each === blocker);
    return lineman === undefined ? [] : [{ blocker: lineman, rusher }];
  });
  const idle = linemen
    .filter((lineman) => blocks.every((block) => block.blocker !== lineman))
    .sort((a, b) => Math.abs(index(a) - center) - Math.abs(index(b) - center));
  const doubles: Double[] = [];
  for (const helper of idle) {
    const block = blocks
      .filter((single) =>
        doubles.every((double) => double.rusher !== single.rusher),
      )
      .sort(
        (a, b) =>
          Math.abs(index(a.blocker) - index(helper)) -
            Math.abs(index(b.blocker) - index(helper)) ||
          Math.abs(index(a.blocker) - center) -
            Math.abs(index(b.blocker) - center),
      )[0];
    if (block !== undefined) doubles.push({ helper, ...block });
  }
  return doubles;
}

// Who blocks whom, fixed at the snap.
export function protect(
  puzzle: Puzzle,
  lineCall: LineCall,
  keptIn: readonly Letter[],
  ySide: Side,
  rushers: readonly Rusher[],
  dls: readonly { id: DefenderId; spot: Vec }[],
): { pickups: Pickup[]; doubles: Double[] } {
  const pickups =
    lineCall === "man"
      ? manPickups(puzzle, keptIn, ySide, rushers, dls)
      : slidePickups(
          lineCall === "slide-left" ? "L" : "R",
          keptIn,
          ySide,
          rushers,
          ballX(puzzle),
        );
  return { pickups, doubles: doubleTeams(pickups) };
}
