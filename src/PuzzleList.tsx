import { useEffect, useState } from "react";
import { Link } from "./Link";
import { downAndDistance, loadPublishedPuzzles, spotText } from "./puzzles";
import type { IndexEntry } from "./puzzles";
import { PuzzleStatus } from "./PuzzleStatus";
import { scrimmageY, thumbnailLines } from "./thumbnail";
import "./PuzzleList.css";

type PuzzlesState =
  | { kind: "loading" }
  | { kind: "ready"; today: IndexEntry; earlier: IndexEntry[] }
  | { kind: "error" }
  | { kind: "empty" };

function spokenName(entry: IndexEntry) {
  const situation = downAndDistance(entry).replace("&", "and");
  const label = entry.label.replace(/\.$/, "");
  return `${situation}, ${spotText(entry.spot)}. ${label}`;
}

function Situation({ entry }: { entry: IndexEntry }) {
  return (
    <span className="puzzles-situation">
      <b>{downAndDistance(entry)}</b>
      <span>{spotText(entry.spot)}</span>
    </span>
  );
}

function TodayCard({ entry }: { entry: IndexEntry }) {
  return (
    <Link
      className="today-card"
      href={`/puzzle/${entry.number}`}
      aria-label={`Today's puzzle: ${spokenName(entry)}`}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 358 168"
        preserveAspectRatio="xMaxYMid slice"
        aria-hidden="true"
      >
        <rect width="358" height="168" fill="var(--turf)" />
        <g fill="var(--turf-stripe)">
          <rect width="358" height="42" />
          <rect y="84" width="358" height="42" />
        </g>
        <path
          d="M0 42H358M0 84H358M0 126H358"
          stroke="var(--field-line)"
          strokeOpacity=".25"
        />
        <path d="M190 74H358" stroke="var(--first-down-line)" strokeWidth="2" />
        <path d="M190 122H358" stroke="var(--scrimmage-line)" strokeWidth="2" />
        <g
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity=".9"
        >
          <path d="M214 120V66H262" stroke="var(--receiver-x)" />
          <path d="M282 120V96L318 60" stroke="var(--receiver-y-route)" />
          <path d="M340 120V30" stroke="var(--receiver-z)" />
        </g>
        <g fill="var(--lineman)">
          {[252, 264, 276, 288, 300].map((x) => (
            <circle key={x} cx={x} cy="122" r="4.5" />
          ))}
        </g>
        <circle cx="276" cy="146" r="5" fill="var(--quarterback)" />
      </svg>
      <span className="today-scrim" />
      <span className="today-content">
        <span className="today-text">
          <span className="today-eyebrow">Today</span>
          <Situation entry={entry} />
          <span className="today-card-label">{entry.label}</span>
        </span>
        <span className="today-play">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M7 4.5v15l12-7.5z" />
          </svg>
          Play
        </span>
      </span>
    </Link>
  );
}

function Thumbnail({ entry }: { entry: IndexEntry }) {
  const { lineToGain, goalLine } = thumbnailLines(entry);
  return (
    <svg className="puzzle-thumbnail" viewBox="0 0 56 56" aria-hidden="true">
      <rect width="56" height="56" fill="var(--turf)" />
      <path
        d={`M0 ${lineToGain}H56`}
        stroke="var(--first-down-line)"
        strokeWidth="1.6"
      />
      <path
        d={`M0 ${scrimmageY}H56`}
        stroke="var(--scrimmage-line)"
        strokeWidth="1.6"
      />
      {goalLine === null ? null : (
        <path
          d={`M0 ${goalLine}H56`}
          stroke="var(--cream)"
          strokeOpacity=".5"
          strokeWidth="3"
        />
      )}
      <g fill="var(--lineman)">
        {[18, 23, 28, 33, 38].map((x) => (
          <circle key={x} cx={x} cy={scrimmageY} r="2.6" />
        ))}
      </g>
      <circle cx="28" cy="51" r="2.8" fill="var(--quarterback)" />
    </svg>
  );
}

function Earlier({ entries }: { entries: IndexEntry[] }) {
  return (
    <section className="earlier" aria-labelledby="earlier-label">
      <h2 id="earlier-label">Earlier</h2>
      {entries.length === 0 ? (
        <p className="earlier-empty">
          No earlier puzzles yet. Come back tomorrow.
        </p>
      ) : (
        <ul>
          {entries.map((entry) => (
            <li key={entry.number}>
              <Link
                className="puzzle-row"
                href={`/puzzle/${entry.number}`}
                aria-label={`Puzzle ${entry.number}: ${spokenName(entry)}`}
              >
                <Thumbnail entry={entry} />
                <span className="puzzle-row-text">
                  <Situation entry={entry} />
                  <span className="puzzle-row-label">{entry.label}</span>
                </span>
                <span className="puzzle-row-number">#{entry.number}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function PuzzleList() {
  const [state, setState] = useState<PuzzlesState>({ kind: "loading" });
  useEffect(() => {
    const controller = new AbortController();
    loadPublishedPuzzles(controller.signal)
      .then(([today, ...earlier]) => {
        if (!controller.signal.aborted) {
          setState(
            today ? { kind: "ready", today, earlier } : { kind: "empty" },
          );
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ kind: "error" });
      });
    return () => controller.abort();
  }, []);

  return (
    <main className="puzzles">
      <header className="puzzles-header">
        <span className="puzzles-lead">
          <Link className="puzzles-back" href="/" aria-label="Back">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </Link>
          <span className="puzzles-brand">OMAHA</span>
        </span>
        <h1>Puzzles</h1>
        <span className="puzzles-spacer" />
      </header>
      <div className="puzzles-scroll">
        <div className="puzzles-column">
          {state.kind === "ready" ? (
            <>
              <TodayCard entry={state.today} />
              <Earlier entries={state.earlier} />
            </>
          ) : (
            <PuzzleStatus kind={state.kind} />
          )}
        </div>
      </div>
    </main>
  );
}
