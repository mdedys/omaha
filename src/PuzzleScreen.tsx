import { useCallback, useEffect, useState } from "react";
import type { Design, Engine, Letter, Puzzle } from "./engine/contract";
import { EngineError } from "./engine/error";
import { loadNumberedPuzzle } from "./puzzles";
import { useDesktop, useDesktopKeys } from "./desktopKeys";
import { Field } from "./Field";
import { LivePanel } from "./LivePlay";
import { cubicBezier, motionEase, playback, timeline } from "./playback";
import { usePlaybackSeconds } from "./playbackSeconds";
import { Protect } from "./Protect";
import { ReadPanel } from "./ReadPanel";
import { Replay } from "./Replay";
import { ResultSheet } from "./ResultSheet";
import { liveCaption, liveLabel, resultSheet } from "./result";
import type { Played } from "./result";
import { RoutesPanel } from "./RoutesPanel";
import {
  changeProtection,
  fieldOrder,
  routeRunners,
  toggleRead,
} from "./routes";
import "./PuzzleScreen.css";

type Step = "Protect" | "Routes" | "Read";
export function createPuzzleSession(): {
  played: readonly Played[];
  draft: Design;
  step: Step | "Live" | "Result" | "Replay";
  selected: Letter | null;
} {
  return {
    played: [],
    draft: {
      protection: { blockers: 5, lineCall: "man" },
      routes: {},
      readOrder: [],
    },
    step: "Protect",
    selected: null,
  };
}

const shadeEase = cubicBezier(0.25, 0.1, 0.25, 1);

type LoadState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; puzzle: Puzzle; engine: Engine };

function PlayScreen({ puzzle, engine }: { puzzle: Puzzle; engine: Engine }) {
  const [session, setSession] = useState(createPuzzleSession);
  const [snapFailed, setSnapFailed] = useState(false);
  const runners = routeRunners(session.draft.protection);
  const selected =
    session.selected && runners.includes(session.selected)
      ? session.selected
      : fieldOrder(engine.preSnap(puzzle), runners)[0];
  const desktop = useDesktop();
  const designing =
    session.step !== "Live" &&
    session.step !== "Result" &&
    session.step !== "Replay";
  const last = designing ? null : session.played[session.played.length - 1];
  const showResult = useCallback(
    () => setSession((current) => ({ ...current, step: "Result" })),
    [],
  );
  const seconds = usePlaybackSeconds(
    session.step === "Live" ? session.played.length : null,
    last ? timeline(last.rep).end : 0,
    showResult,
  );
  const live =
    last && session.step === "Live" ? playback(last.rep, seconds) : null;
  const reveal =
    live && (live.phase === "reveal" || live.phase === "done")
      ? live.reveal
      : undefined;
  const result = session.step === "Result" || reveal !== undefined;
  const used = result || session.step === "Replay";
  const rep = session.played.length + (designing ? 1 : 0);
  useDesktopKeys((key) => {
    if (key !== "Escape" || session.step !== "Live") return false;
    showResult();
    return true;
  });
  function goTo(step: Step) {
    setSnapFailed(false);
    setSession((current) => ({ ...current, step, selected }));
  }
  function snap() {
    try {
      const entry = {
        design: session.draft,
        rep: engine.simulate(puzzle, session.draft),
      };
      setSnapFailed(false);
      setSession((current) => ({
        ...current,
        step: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "Result"
          : "Live",
        played: [...current.played, entry],
      }));
    } catch (error) {
      if (!(error instanceof EngineError)) throw error;
      setSnapFailed(true);
    }
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
  const sheet = result ? resultSheet(puzzle, engine, session.played) : null;
  const currentIndex = steps.findIndex((step) => step === session.step);
  const pills = (
    <div className="result-pills">
      <span>
        {ordinal} &amp; {distance >= 100 - spot ? "goal" : distance} ·{" "}
        {location}
      </span>
      <span>
        {score} · {clock}
      </span>
    </div>
  );
  const header = (
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
          aria-label={
            used ? `Rep ${rep} used, ${4 - rep} left` : `Rep ${rep} of 4`
          }
        >
          {[1, 2, 3, 4].map((pip) => (
            <i
              key={pip}
              className={
                pip === rep && !used ? "current" : pip <= rep ? "used" : ""
              }
              aria-hidden="true"
            />
          ))}
        </span>
      </div>
    </header>
  );
  if (last && session.step === "Replay") {
    return (
      <main className="play-screen">
        {header}
        <Replay
          puzzle={puzzle}
          engine={engine}
          played={last}
          number={rep}
          onBack={showResult}
        />
      </main>
    );
  }
  return (
    <main className={designing ? "play-screen" : "play-screen result-screen"}>
      {header}
      <div className="play-body">
        <div className="play-stage">
          {last && sheet ? (
            <>
              <Field
                puzzle={puzzle}
                engine={engine}
                frame={{ rep: last.rep, playArt: sheet.playArt }}
                reveal={reveal}
                pan={
                  reveal === undefined || desktop
                    ? undefined
                    : motionEase(reveal)
                }
                label={sheet.fieldLabel}
              />
              <div
                className="result-shade"
                style={
                  reveal === undefined
                    ? undefined
                    : { opacity: shadeEase(reveal) }
                }
              />
              {pills}
              <div
                className="result-keys"
                style={reveal === undefined ? undefined : { opacity: reveal }}
              >
                <span className="result-final">Final · defense revealed</span>
                {sheet.ended ? (
                  <span className="result-key">
                    Defense · {puzzle.coverageName}
                  </span>
                ) : null}
              </div>
            </>
          ) : live ? (
            <>
              <Field
                puzzle={puzzle}
                engine={engine}
                live={live}
                pan={desktop ? undefined : 0}
                label={liveLabel(puzzle, engine, session.played)}
              />
              {pills}
            </>
          ) : (
            <Field
              puzzle={puzzle}
              engine={engine}
              protection={session.draft.protection}
              routes={session.draft.routes}
              selected={session.step === "Routes" ? selected : undefined}
              onSelect={
                session.step === "Routes"
                  ? (letter) =>
                      setSession((current) => ({
                        ...current,
                        selected: letter,
                      }))
                  : undefined
              }
              reads={
                session.step === "Read" ? session.draft.readOrder : undefined
              }
            />
          )}
        </div>
        {last && live && !(desktop && reveal !== undefined) ? (
          <LivePanel
            caption={liveCaption(puzzle, engine, last, live)}
            onSkip={showResult}
          />
        ) : null}
        {sheet ? (
          <ResultSheet
            sheet={sheet}
            onRunItBack={() => goTo("Protect")}
            onReplay={() =>
              setSession((current) => ({ ...current, step: "Replay" }))
            }
            bottom={
              reveal === undefined || desktop
                ? undefined
                : -420 * (1 - motionEase(reveal))
            }
          />
        ) : null}
        {designing ? (
          <aside className="play-panel" aria-label="Design the play">
            <nav className="play-steps" aria-label="Play steps">
              {steps.map((step, index) => (
                <button
                  key={step}
                  type="button"
                  className={index < currentIndex ? "done" : ""}
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
              <ReadPanel
                puzzle={puzzle}
                engine={engine}
                design={session.draft}
                snapFailed={snapFailed}
                onToggle={(letter) =>
                  setSession((current) => ({
                    ...current,
                    draft: {
                      ...current.draft,
                      readOrder: toggleRead(current.draft.readOrder, letter),
                    },
                  }))
                }
                onSnap={snap}
              />
            )}
          </aside>
        ) : null}
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
