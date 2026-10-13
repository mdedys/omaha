import { createRoot } from "react-dom/client";
import type { Design } from "../src/engine/contract";
import { loadNumberedPuzzle } from "../src/puzzles";
import { chooseRoute } from "../src/routes";
import { LinkPreviewCard } from "../src/ShareCard";
import "../src/index.css";

// Renders the link-preview card for puzzle 1 plays named in `?slot=`, one
// Slot WR route per rep, with the Slot WR read first and then the Left WR.
const slotRoutes = (
  new URLSearchParams(location.search).get("slot") ?? ""
).split(",");
const { puzzle, engine } = await loadNumberedPuzzle(
  1,
  new AbortController().signal,
);
const reps = slotRoutes.map((name) => {
  const route = engine.routeMenu(puzzle, "H").find((entry) => entry === name);
  if (!route) throw new Error(`No Slot WR route named ${name}`);
  const design: Design = {
    protection: { blockers: 5, lineCall: "man" },
    routes: {
      X: { route: "Post", depth: 10 },
      Y: { route: "Hitch" },
      H: chooseRoute(engine, puzzle, "H", route),
      Z: { route: "Go" },
      RB: { route: "Flat" },
    },
    readOrder: ["H", "X"],
  };
  return engine.simulate(puzzle, design);
});
const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(
  <LinkPreviewCard puzzle={puzzle} engine={engine} reps={reps} />,
);
