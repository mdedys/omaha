import { createRoot } from "react-dom/client";
import { loadPuzzle } from "../src/engine";
import gunTrey from "../src/engine/stub/gun-trey.json";
import { scenarios } from "../src/engine/stub/fixtures";
import { LinkPreviewCard } from "../src/ShareCard";
import "../src/index.css";

// Renders the link-preview card for the stub plays named in `?routes=`, one
// Left WR route per rep.
const routes = (new URLSearchParams(location.search).get("routes") ?? "").split(
  ",",
);
const { puzzle, engine } = await loadPuzzle(gunTrey);
const reps = routes.map((route) => {
  const scenario = scenarios.find(
    (entry) => entry.design.routes.X?.route === route,
  );
  if (!scenario) throw new Error(`No stub scenario for ${route}`);
  return engine.simulate(puzzle, scenario.design);
});
const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(
  <LinkPreviewCard puzzle={puzzle} engine={engine} reps={reps} />,
);
