import { GAPS, LINEMEN, Y_SIDE, gapDepth } from "./formation.ts";
import type {
  DefenderId,
  GapName,
  Letter,
  Lineman,
  OffenseId,
  Protection,
  Side,
  Vec,
} from "./types.ts";

export type Rusher = { id: DefenderId; gap: GapName; spot: Vec };
export type Pickup = { blocker: OffenseId; rusher: DefenderId };
export type Double = Pickup & { helper: Lineman };
export type ProtectionPlan = {
  keptIn: Letter[];
  pickups: Pickup[];
  doubles: Double[];
  free: Rusher[];
};

const other = (side: Side): Side => (side === "L" ? "R" : "L");
const guard = (side: Side): Lineman => (side === "L" ? "LG" : "RG");
const tackle = (side: Side): Lineman => (side === "L" ? "LT" : "RT");
const gapSide = (gap: GapName): Side => (gap[0] === "L" ? "L" : "R");

// Inside-out: innermost gap, then nearer the line at the snap, then nearer
// the ball.
const insideOut = (a: Rusher, b: Rusher): number =>
  gapDepth(a.gap) - gapDepth(b.gap) ||
  a.spot.y - b.spot.y ||
  Math.abs(a.spot.x) - Math.abs(b.spot.x);

function slideOwners(slide: Side, keptIn: Letter[]): [OffenseId, GapName[]][] {
  const away = other(slide);
  const yGap: GapName = `${Y_SIDE}-D`;
  const yIn = keptIn.includes("Y");
  const owners: [OffenseId, GapName[]][] = [
    ["C", [`${slide}-A`]],
    [guard(slide), [`${slide}-B`]],
    [tackle(slide), [`${slide}-C`]],
    [guard(away), [`${away}-A`]],
    [tackle(away), [`${away}-B`]],
  ];
  if (keptIn.includes("RB")) {
    const edge: GapName[] = [`${away}-C`, `${away}-D`];
    owners.push(["RB", edge.filter((g) => !(yIn && g === yGap))]);
  }
  if (yIn) owners.push(["Y", [yGap]]);
  return owners;
}

function slidePickups(
  slide: Side,
  keptIn: Letter[],
  rushers: Rusher[],
): Pickup[] {
  return slideOwners(slide, keptIn).flatMap(([blocker, gaps]) => {
    const mine = rushers.filter((r) => gaps.includes(r.gap)).sort(insideOut);
    return mine.length ? [{ blocker, rusher: mine[0].id }] : [];
  });
}

function areaOf(x: number): Lineman {
  const side: Side = x < 0 ? "L" : "R";
  if (Math.abs(x) <= GAPS["R-A"].x) return "C";
  if (Math.abs(x) <= GAPS["R-B"].x) return guard(side);
  return tackle(side);
}

const outward = (lineman: Lineman, side: Side): Lineman | null =>
  lineman === "C" ? guard(side) : lineman === guard(side) ? tackle(side) : null;

function manPickups(
  keptIn: Letter[],
  rushers: Rusher[],
  dls: { id: DefenderId; spot: Vec }[],
): Pickup[] {
  const dlByArea = new Map<Lineman, { id: DefenderId; spot: Vec }[]>();
  for (const dl of dls) {
    const area = areaOf(dl.spot.x);
    dlByArea.set(area, [...(dlByArea.get(area) ?? []), dl]);
  }
  const owned = new Map<Lineman, DefenderId>();
  for (const [area, dls] of dlByArea) {
    const [inner, outer] = [...dls].sort(
      (a, b) => Math.abs(a.spot.x) - Math.abs(b.spot.x),
    );
    owned.set(area, inner.id);
    const next = outer && outward(area, outer.spot.x < 0 ? "L" : "R");
    if (next && !dlByArea.has(next)) owned.set(next, outer.id);
  }

  const pickups: Pickup[] = [];
  for (const lineman of LINEMEN) {
    const dl = owned.get(lineman);
    if (dl && rushers.some((r) => r.id === dl)) {
      pickups.push({ blocker: lineman, rusher: dl });
    }
  }
  const leftovers = () =>
    rushers
      .filter((r) => !pickups.some((p) => p.rusher === r.id))
      .sort(
        (a, b) =>
          gapDepth(a.gap) - gapDepth(b.gap) ||
          Number(gapSide(a.gap) === Y_SIDE) - Number(gapSide(b.gap) === Y_SIDE),
      );
  if (keptIn.includes("Y")) {
    const mine = leftovers().find((r) => gapSide(r.gap) === Y_SIDE);
    if (mine) pickups.push({ blocker: "Y", rusher: mine.id });
  }
  if (keptIn.includes("RB")) {
    const first = leftovers()[0];
    if (first) pickups.push({ blocker: "RB", rusher: first.id });
  }
  return pickups;
}

// An idle lineman helps the nearest lineman with a rusher, a tie going toward
// the ball; one helper per rusher. Idle linemen pick from the center out.
function doubleTeams(pickups: Pickup[]): Double[] {
  const index = (l: Lineman) => LINEMEN.indexOf(l);
  const center = index("C");
  const busy = LINEMEN.filter((l) => pickups.some((p) => p.blocker === l));
  const idle = LINEMEN.filter((l) => !busy.includes(l)).sort(
    (a, b) => Math.abs(index(a) - center) - Math.abs(index(b) - center),
  );
  const doubles: Double[] = [];
  for (const helper of idle) {
    const target = busy
      .filter((l) => !doubles.some((d) => d.blocker === l))
      .sort(
        (a, b) =>
          Math.abs(index(a) - index(helper)) -
            Math.abs(index(b) - index(helper)) ||
          Math.abs(index(a) - center) - Math.abs(index(b) - center),
      )[0];
    const pickup = pickups.find((p) => p.blocker === target);
    if (pickup) doubles.push({ helper, ...pickup });
  }
  return doubles;
}

export function protect(
  protection: Protection,
  rushers: Rusher[],
  dls: { id: DefenderId; spot: Vec }[],
): ProtectionPlan {
  const keptIn: Letter[] =
    protection.blockers === 7
      ? ["RB", "Y"]
      : protection.blockers === 6
        ? ["RB"]
        : [];
  const pickups =
    protection.call === "man"
      ? manPickups(keptIn, rushers, dls)
      : slidePickups(
          protection.call === "slide-left" ? "L" : "R",
          keptIn,
          rushers,
        );
  return {
    keptIn,
    pickups,
    doubles: doubleTeams(pickups),
    free: rushers.filter((r) => !pickups.some((p) => p.rusher === r.id)),
  };
}
