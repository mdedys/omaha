import type {
  DefenderId,
  Depth,
  Letter,
  PlayerId,
  Puzzle,
  RouteCall,
  RouteName,
  RoutePath,
  Vec,
} from "../contract";
import { EngineError } from "../error";

export const defenderIds: readonly DefenderId[] = [
  "DL1",
  "DL2",
  "DL3",
  "DL4",
  "LB1",
  "LB2",
  "LB3",
  "CB1",
  "CB2",
  "NB",
  "DB",
  "S1",
  "S2",
];

export const letters: readonly Letter[] = ["X", "Y", "Z", "H", "RB"];
// Route-tree order, so a route keeps its place and key in every menu.
const wr: readonly RouteName[] = [
  "Hitch",
  "Flat",
  "Slant",
  "Comeback",
  "Hook",
  "Out",
  "In",
  "Corner",
  "Post",
  "Go",
  "Drag",
];
const inside: readonly RouteName[] = [
  ...wr.map((route) => (route === "Go" ? "Seam" : route)),
  "Wheel",
];
const rb: readonly RouteName[] = ["Flat", "Hook", "Out", "In", "Seam", "Wheel"];

export function routeMenu(_puzzle: Puzzle, letter: Letter): RouteName[] {
  return [
    ...(letter === "RB" ? rb : letter === "X" || letter === "Z" ? wr : inside),
  ];
}

export function availableDepths(
  puzzle: Puzzle,
  _letter: Letter,
  route: RouteName,
): Depth[] {
  const depths: readonly Depth[] =
    route === "In" || route === "Out" || route === "Hook"
      ? [5, 10, 15]
      : route === "Corner" || route === "Post" || route === "Comeback"
        ? [10, 15]
        : [];
  return depths.filter((depth) => depth <= 109 - puzzle.situation.spot);
}

export function preSnap(puzzle: Puzzle): Record<PlayerId, Vec> {
  const mirror = puzzle.formation.flip ? -1 : 1;
  const hash =
    puzzle.situation.hash === "left"
      ? -4
      : puzzle.situation.hash === "right"
        ? 4
        : 0;
  const spot = (x: number, y: number): Vec => ({ x: x * mirror + hash, y });
  const positions: Record<PlayerId, Vec> = {
    X: spot(-11.75 - hash * mirror, 0),
    Y: spot(4, 0),
    Z: spot(11.75 - hash * mirror, 0),
    H: spot((4 + 11.75 - hash * mirror) / 2, -1),
    RB: spot(-2, -5),
    QB: spot(0, -5),
    LT: spot(-3, 0),
    LG: spot(-1.5, 0),
    C: spot(0, 0),
    RG: spot(1.5, 0),
    RT: spot(3, 0),
    DL1: spot(-3, 1),
    DL2: spot(-1, 1),
    DL3: spot(1, 1),
    DL4: spot(3, 1),
    LB1: spot(-4, 5),
    LB2: spot(0, 5),
    LB3: spot(4, 5),
    CB1: spot(-12, 7),
    CB2: spot(12, 7),
    NB: spot(8, 5),
    DB: spot(-8, 5),
    S1: spot(-6, 15),
    S2: spot(6, 15),
  };
  for (const defender of puzzle.defense) {
    positions[defender.id] = { ...defender.at };
  }
  // NB and DB are alternate roster ids, not additional players.
  for (const id of defenderIds) {
    if (!puzzle.defense.some((defender) => defender.id === id)) {
      Reflect.deleteProperty(positions, id);
    }
  }
  return positions;
}

export function routePath(
  puzzle: Puzzle,
  letter: Letter,
  call: RouteCall,
): RoutePath {
  if (!routeMenu(puzzle, letter).includes(call.route)) {
    throw new EngineError("Route is not on this receiver's menu");
  }
  const depths = availableDepths(puzzle, letter, call.route);
  if (
    (depths.length !== 0 || "depth" in call) &&
    (!("depth" in call) || !depths.includes(call.depth))
  ) {
    throw new EngineError("Unavailable route depth");
  }
  // A depth route can have no available break near the end line.
  if (
    !("depth" in call) &&
    ["In", "Out", "Hook", "Corner", "Post", "Comeback"].includes(call.route)
  ) {
    throw new EngineError("Missing route depth");
  }
  const alignment = preSnap(puzzle)[letter];
  const hash =
    puzzle.situation.hash === "left"
      ? -4
      : puzzle.situation.hash === "right"
        ? 4
        : 0;
  const side =
    letter === "RB"
      ? puzzle.formation.flip
        ? 1
        : -1
      : Math.sign(alignment.x - hash) || (puzzle.formation.flip ? -1 : 1);
  const start = letter === "RB" ? { x: hash + side * 4.5, y: 0 } : alignment;
  const endY = 109 - puzzle.situation.spot;
  const points: Vec[] = [{ ...start }];
  const breaks: RoutePath["breaks"][number][] = [];
  const add = (x: number, y: number) => {
    points.push({
      x: Math.max(-14.75, Math.min(14.75, x)),
      y: Math.min(endY, y),
    });
  };
  let end: RoutePath["end"] = "run";
  let throwIndex = 1;
  if (call.route === "Go" || call.route === "Seam") {
    add(start.x, Math.min(10, endY));
    add(start.x, endY);
  } else if (call.route === "Hitch") {
    add(start.x, 1);
    breaks.push({ index: 1, kind: "hard" });
    end = "sit";
  } else {
    const depth =
      "depth" in call
        ? call.depth
        : call.route === "Slant" || call.route === "Drag"
          ? 2
          : 1;
    add(start.x, depth);
    const outside = ["Out", "Corner", "Comeback", "Flat", "Wheel"].includes(
      call.route,
    );
    const direction = outside ? side : -side;
    const hard = ["In", "Out", "Drag", "Hook", "Comeback"].includes(call.route);
    breaks.push({ index: 1, kind: hard ? "hard" : "soft" });
    if (call.route === "Hook" || call.route === "Comeback") {
      add(start.x + direction * (call.route === "Hook" ? 1 : 2), depth - 2);
      throwIndex = 2;
      end = "sit";
    } else if (call.route === "Wheel") {
      add(side * 11.75, depth);
      breaks.push({ index: 2, kind: "soft" });
      throwIndex = 2;
      add(side * 11.75, endY);
    } else if (["Slant", "Post", "Corner"].includes(call.route)) {
      const distance = Math.min(
        direction > 0 ? 14.75 - start.x : start.x + 14.75,
        endY - depth,
      );
      add(start.x + direction * distance, depth + distance);
    } else {
      add(direction * 14.75, depth);
    }
  }
  return { points, breaks, throwIndex, end };
}
