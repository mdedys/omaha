import type {
  Design,
  Engine,
  Letter,
  Puzzle,
  RouteCall,
  RouteName,
} from "./engine/contract";

export const receiverLetters: readonly Letter[] = ["X", "Y", "Z", "H", "RB"];
export const receiverColors = {
  X: { ring: "#EAC54F", route: "#EAC54F" },
  Y: { ring: "#8E73F2", route: "#B7A6F5" },
  H: { ring: "#F0607A", route: "#F27C8E" },
  Z: { ring: "#55AEF5", route: "#55AEF5" },
  RB: { ring: "#5BDB8C", route: "#5BDB8C" },
};

export function routeRunners(protection: Design["protection"]) {
  return receiverLetters.filter(
    (letter) =>
      !(letter === "RB" && protection.blockers >= 6) &&
      !(letter === "Y" && protection.blockers === 7),
  );
}

export function changeProtection(
  draft: Design,
  protection: Design["protection"],
): Design {
  const runners = routeRunners(protection);
  const routes: Design["routes"] = {};
  for (const letter of runners) {
    const call = draft.routes[letter];
    if (call) routes[letter] = call;
  }
  return {
    protection,
    routes,
    readOrder: draft.readOrder.filter((letter) => runners.includes(letter)),
  };
}

export function chooseRoute(
  engine: Engine,
  puzzle: Puzzle,
  letter: Letter,
  route: RouteName,
  previous?: RouteCall,
): RouteCall {
  const depths = engine.availableDepths(puzzle, letter, route);
  const preferred = previous && "depth" in previous ? previous.depth : 10;
  const depth = depths.reduce<number | undefined>(
    (best, candidate) =>
      best === undefined ||
      Math.abs(candidate - preferred) < Math.abs(best - preferred) ||
      (Math.abs(candidate - preferred) === Math.abs(best - preferred) &&
        candidate < best)
        ? candidate
        : best,
    undefined,
  );
  switch (route) {
    case "In":
    case "Out":
    case "Hook":
      if (depth === 5 || depth === 10 || depth === 15) return { route, depth };
      throw new Error("No available route depth");
    case "Corner":
    case "Post":
    case "Comeback":
      if (depth === 10 || depth === 15) return { route, depth };
      throw new Error("No available route depth");
    default:
      return { route };
  }
}
