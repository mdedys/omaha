import { useEffect, useState } from "react";
import type { Design, Engine, Letter, Puzzle } from "./engine/contract";
import { loadNumberedPuzzle } from "./puzzles";
import { Field } from "./Field";
import { Protect } from "./Protect";
import { RoutesPanel } from "./RoutesPanel";
import { changeProtection, routeRunners } from "./routes";
import "./PuzzleScreen.css";

type Step = "Protect" | "Routes" | "Read";
export function createPuzzleSession(): {
  rep: number;
  draft: Design;
  step: Step;
  selected: Letter | null;
} {
  return {
    rep: 1,
    draft: {
      protection: { blockers: 5, lineCall: "man" },
      routes: {},
      readOrder: [],
    },
    step: "Protect",
    selected: null,
  };
}

type LoadState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; puzzle: Puzzle; engine: Engine };

function PlayScreen({ puzzle, engine }: { puzzle: Puzzle; engine: Engine }) {
  const [session, setSession] = useState(createPuzzleSession);
  const runners = routeRunners(session.draft.protection);
  const positions = engine.preSnap(puzzle);
  const selected =
    session.selected && runners.includes(session.selected)
      ? session.selected
      : [...runners].sort((a, b) => positions[a].x - positions[b].x)[0];
  function goTo(step: Step) {
    setSession((current) => ({ ...current, step, selected }));
  }
  const { down, distance, spot, scoreDiff, clock } = puzzle.situation;
  const ordinal = ["", "1st", "2nd", "3rd", "4th"][down];
  const location = spot <= 50 ? `own ${spot}` : `opp ${100 - spot}`;
  const score =
    scoreDiff < 0
      ? `Down ${-scoreDiff}`
      : scoreDiff > 0
        ? `Up ${scoreDiff}`
        : "Tied";
  const steps: readonly Step[] = ["Protect", "Routes", "Read"];
  return (
    <main className="play-screen">
      <header className="play-header">
        <span className="play-brand">OMAHA</span>
        <div className="play-situation">
          <h1>
            {ordinal} &amp; {distance >= 100 - spot ? "goal" : distance}
          </h1>
          <span>{location}</span>
        </div>
        <div className="play-meta">
          <span className="play-number">#{puzzle.number}</span>
          <span>
            {score} · {clock}
          </span>
          <span
            className="play-reps"
            role="group"
            aria-label={`Rep ${session.rep} of 4`}
          >
            {[1, 2, 3, 4].map((rep) => (
              <i
                key={rep}
                className={rep === session.rep ? "current" : ""}
                aria-hidden="true"
              />
            ))}
          </span>
        </div>
      </header>
      <div className="play-body">
        <div className="play-stage">
          <Field
            puzzle={puzzle}
            engine={engine}
            protection={session.draft.protection}
            routes={session.draft.routes}
            selected={session.step === "Routes" ? selected : undefined}
            onSelect={
              session.step === "Routes"
                ? (letter) =>
                    setSession((current) => ({ ...current, selected: letter }))
                : undefined
            }
          />
        </div>
        <aside className="play-panel" aria-label="Design the play">
          <nav className="play-steps" aria-label="Play steps">
            {steps.map((step, index) => (
              <button
                key={step}
                type="button"
                className={index < steps.indexOf(session.step) ? "done" : ""}
                aria-current={session.step === step ? "step" : undefined}
                onClick={() => goTo(step)}
              >
                <span className="step-bar" aria-hidden="true" />
                <span>
                  {index + 1} {step}
                </span>
              </button>
            ))}
          </nav>
          {session.step === "Protect" ? (
            <Protect
              protection={session.draft.protection}
              offered={engine.protections(puzzle)}
              onChange={(protection) =>
                setSession((current) => ({
                  ...current,
                  draft: changeProtection(current.draft, protection),
                }))
              }
              onNext={() => goTo("Routes")}
            />
          ) : session.step === "Routes" ? (
            <RoutesPanel
              puzzle={puzzle}
              engine={engine}
              selected={selected}
              call={session.draft.routes[selected]}
              onChange={(call) =>
                setSession((current) => ({
                  ...current,
                  selected,
                  draft: {
                    ...current.draft,
                    routes: { ...current.draft.routes, [selected]: call },
                  },
                }))
              }
              onNext={() => goTo("Read")}
            />
          ) : (
            <section
              className="step-placeholder"
              aria-labelledby="step-heading"
            >
              <h2 id="step-heading">{session.step}</h2>
              <p>Read controls are not available yet.</p>
              <p className="draft-summary">
                Current draft: {session.draft.protection.blockers}-man ·{" "}
                {session.draft.protection.lineCall}. No routes or reads set.
              </p>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}

export function PuzzleScreen({ number }: { number: number }) {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  useEffect(() => {
    const controller = new AbortController();
    loadNumberedPuzzle(number, controller.signal)
      .then(({ puzzle, engine }) => {
        if (!controller.signal.aborted) {
          setState({ kind: "ready", puzzle, engine });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ kind: "error" });
      });
    return () => controller.abort();
  }, [number]);
  if (state.kind === "ready") {
    return <PlayScreen puzzle={state.puzzle} engine={state.engine} />;
  }
  return (
    <main className="route-placeholder">
      <h1>Puzzle #{number}</h1>
      <div className="puzzle-status" role="status" aria-live="polite">
        <h2>
          {state.kind === "loading"
            ? "Loading puzzle…"
            : "Couldn't load puzzle."}
        </h2>
        <p>
          {state.kind === "loading"
            ? "Drawing up the situation."
            : "Please refresh to try again."}
        </p>
      </div>
    </main>
  );
}
