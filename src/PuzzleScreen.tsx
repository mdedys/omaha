import { useEffect, useState } from "react";
import type { Design, Engine, Puzzle } from "./engine/contract";
import { loadNumberedPuzzle } from "./puzzles";
import { Field } from "./Field";
import "./PuzzleScreen.css";

type Step = "Protect" | "Routes" | "Read";
export function createPuzzleSession(): {
  rep: number;
  draft: Design;
  step: Step;
} {
  return {
    rep: 1,
    draft: {
      protection: { blockers: 5, lineCall: "man" },
      routes: {},
      readOrder: [],
    },
    step: "Protect",
  };
}

type LoadState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; puzzle: Puzzle; engine: Engine };

function PlayScreen({ puzzle, engine }: { puzzle: Puzzle; engine: Engine }) {
  const [session, setSession] = useState(createPuzzleSession);
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
          <Field puzzle={puzzle} engine={engine} />
        </div>
        <aside className="play-panel" aria-label="Design the play">
          <nav className="play-steps" aria-label="Play steps">
            {steps.map((step, index) => (
              <button
                key={step}
                type="button"
                aria-current={session.step === step ? "step" : undefined}
                onClick={() => setSession((current) => ({ ...current, step }))}
              >
                <span className="step-bar" aria-hidden="true" />
                <span>
                  {index + 1} {step}
                </span>
              </button>
            ))}
          </nav>
          <section className="step-placeholder" aria-labelledby="step-heading">
            <h2 id="step-heading">{session.step}</h2>
            <p>
              {session.step === "Protect"
                ? "Protection controls are not available yet."
                : session.step === "Routes"
                  ? "Route controls are not available yet."
                  : "Read controls are not available yet."}
            </p>
            <p className="draft-summary">
              Current draft: {session.draft.protection.blockers}-man ·{" "}
              {session.draft.protection.lineCall}. No routes or reads set.
            </p>
          </section>
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
