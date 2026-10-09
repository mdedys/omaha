import { useEffect, useState } from "react";
import type { ComponentProps, MouseEvent } from "react";
import { Hero } from "./Hero";
import { loadTodaysPuzzle } from "./puzzles";
import type { LandingPuzzle } from "./puzzles";
import { PuzzleScreen } from "./PuzzleScreen";
import "./App.css";

type LandingState =
  | { kind: "loading" }
  | { kind: "ready"; puzzle: LandingPuzzle }
  | { kind: "error" }
  | { kind: "empty" };

function navigate(path: string) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function Link({ href, children, ...props }: ComponentProps<"a">) {
  function click(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      !href
    ) {
      return;
    }
    event.preventDefault();
    navigate(href);
  }
  return (
    <a
      {...props}
      href={href}
      onClick={click}
      onKeyDown={(event) => {
        if (event.key === " ") {
          event.preventDefault();
          if (!event.repeat) event.currentTarget.click();
        }
      }}
    >
      {children}
    </a>
  );
}

function Icon({ name }: { name: "play" | "grid" | "help" | "target" }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={name === "play" ? "currentColor" : "none"}
      stroke={name === "play" ? "none" : "currentColor"}
      strokeWidth={name === "target" ? "2.2" : "2"}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "play" ? <path d="M7 4.5v15l12-7.5z" /> : null}
      {name === "grid" ? (
        <>
          <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
          <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
          <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
          <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
        </>
      ) : null}
      {name === "help" ? (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M9.6 9.4a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.1-2.4 3.7M12 17.2v.1" />
        </>
      ) : null}
      {name === "target" ? (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="12" cy="12" r=".6" fill="currentColor" />
        </>
      ) : null}
    </svg>
  );
}

function SecondaryNavigation() {
  return (
    <div className="secondary-navigation">
      <Link className="secondary" href="/puzzles">
        <Icon name="grid" />
        All puzzles
      </Link>
      <Link className="secondary" href="/how-to-play">
        <Icon name="help" />
        How to play
      </Link>
    </div>
  );
}

function PuzzleInfo({ puzzle }: { puzzle: LandingPuzzle }) {
  const { down, distance, spot } = puzzle.situation;
  const ordinal = ["", "1st", "2nd", "3rd", "4th"][down];
  const location = spot <= 50 ? `own ${spot}` : `opp ${100 - spot}`;
  const distanceLabel = distance >= 100 - spot ? "goal" : distance;
  return (
    <div className="puzzle-info">
      <div className="puzzle-header">
        <span className="today-label">Today's puzzle</span>
        <span className="puzzle-number">Puzzle #{puzzle.number}</span>
      </div>
      <div className="situation">
        <div className="situation-heading">
          <h2>
            {ordinal} &amp; {distanceLabel}
          </h2>
          <span className="spot">{location}</span>
        </div>
        <p className="briefing">{puzzle.briefing}</p>
      </div>
      <div className="goal-row">
        <span className="goal">
          <Icon name="target" />
          {puzzle.goalText}
        </span>
        <span className="reps">
          <span className="rep-squares" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span>4 reps</span>
        </span>
      </div>
    </div>
  );
}

function Landing() {
  const [state, setState] = useState<LandingState>({ kind: "loading" });
  useEffect(() => {
    const controller = new AbortController();
    loadTodaysPuzzle(controller.signal)
      .then((puzzle) => {
        if (!controller.signal.aborted) {
          setState(puzzle ? { kind: "ready", puzzle } : { kind: "empty" });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ kind: "error" });
      });
    return () => controller.abort();
  }, []);

  return (
    <main className="landing">
      <header className="top-bar">
        <span className="brand">OMAHA</span>
        <nav aria-label="Main navigation">
          <Link href="/puzzles">All puzzles</Link>
          <Link href="/how-to-play">How to play</Link>
        </nav>
      </header>
      <div className="landing-body">
        <div className="field-stage">
          <Hero />
          <div className="hero-shade" />
        </div>
        <aside className="landing-panel" aria-label="Today's puzzle">
          <div className="wordmark">
            <h1>Omaha</h1>
            <p>
              A real situation from last week. Four reps to out-coach the pros.
            </p>
          </div>
          <section className="puzzle-card" aria-label="Today's puzzle">
            {state.kind === "ready" ? (
              <PuzzleInfo puzzle={state.puzzle} />
            ) : (
              <div className="puzzle-status" role="status" aria-live="polite">
                <span className="today-label">Today's puzzle</span>
                <h2>
                  {state.kind === "loading"
                    ? "Loading today's puzzle…"
                    : state.kind === "error"
                      ? "Couldn't load today's puzzle."
                      : "No puzzle available yet."}
                </h2>
                <p>
                  {state.kind === "loading"
                    ? "Drawing up the situation."
                    : state.kind === "error"
                      ? "Please refresh to try again."
                      : "Check back for the next situation."}
                </p>
              </div>
            )}
            <div className="button-group">
              {state.kind === "ready" ? (
                <Link className="cta" href={`/puzzle/${state.puzzle.number}`}>
                  <Icon name="play" />
                  Play today's puzzle
                </Link>
              ) : null}
              <SecondaryNavigation />
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

function App() {
  const [path, setPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const update = () => setPath(window.location.pathname);
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);
  const puzzleRoute = /^\/puzzle\/(\d+)$/.exec(path);
  if (puzzleRoute) {
    return (
      <PuzzleScreen key={puzzleRoute[1]} number={Number(puzzleRoute[1])} />
    );
  }
  const title =
    path === "/puzzles"
      ? "All puzzles"
      : path === "/how-to-play"
        ? "How to play"
        : null;
  if (!title) return <Landing />;
  return (
    <main className="route-placeholder">
      <h1>{title}</h1>
      <p>This screen is not available yet.</p>
      <Link href="/">Back to Landing</Link>
    </main>
  );
}

export default App;
