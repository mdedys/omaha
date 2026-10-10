import { useEffect, useRef } from "react";
import { useDesktop, useDesktopKeys } from "./desktopKeys";
import { Swatch } from "./ReadPanel";
import type { RepBox, Sheet } from "./result";

function Box({ box, number }: { box: RepBox; number: number }) {
  switch (box.state) {
    case "no gain":
      return (
        <span className="rep-box used">
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <path
              d="M2.5 2.5L9.5 9.5M9.5 2.5L2.5 9.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
      );
    case "short":
      return (
        <span className="rep-box used short" aria-hidden="true">
          {box.yards}
        </span>
      );
    case "converted":
      return (
        <span className="rep-box converted">
          <svg viewBox="0 0 14 14" aria-hidden="true">
            <path
              d="M3 7.4L5.8 10.2L11 4.4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      );
    case "next":
    case "unused":
    case "not needed":
      return (
        <span
          className={`rep-box ${box.state === "not needed" ? "not-needed" : box.state}`}
          aria-hidden="true"
        >
          {number}
        </span>
      );
  }
}

export function ResultSheet({
  sheet,
  onRunItBack,
  onReplay,
  bottom,
}: {
  sheet: Sheet;
  onRunItBack: () => void;
  onReplay: () => void;
  bottom?: number;
}) {
  const desktop = useDesktop();
  const heading = useRef<HTMLHeadingElement>(null);
  // The phone sheet can mount below the screen and slide up into place.
  useEffect(() => heading.current?.focus({ preventScroll: true }), []);
  useDesktopKeys((key) => {
    if (key !== "Enter" || sheet.ended) return false;
    onRunItBack();
    return true;
  });
  const Panel = desktop ? "aside" : "section";
  return (
    <Panel
      className={`result-sheet result-${sheet.variant}`}
      aria-label="Rep result"
      style={bottom === undefined ? undefined : { bottom }}
    >
      <div className="result-header">
        <div className="result-headline">
          {sheet.tile ? (
            <span
              className={`outcome-tile ${sheet.tile.kind}`}
              aria-hidden="true"
            >
              {sheet.tile.kind === "short" ? (
                sheet.tile.yards
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="3"
                  strokeLinecap="round"
                >
                  <path d="M7 7l10 10M17 7L7 17" />
                </svg>
              )}
            </span>
          ) : null}
          <h1 ref={heading} tabIndex={-1}>
            {sheet.headline}
          </h1>
        </div>
        <p className="result-line">{sheet.line}</p>
      </div>
      <div className="result-stats">
        {sheet.stats.map((stat) => (
          <div key={stat.label} className="result-stat">
            <b>
              {stat.receiver ? <Swatch letter={stat.receiver} /> : null}
              {stat.value}
            </b>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>
      <div className="result-reps">
        <div
          className="rep-boxes"
          role="group"
          aria-label={`Reps: ${sheet.boxes.map((box, index) => `rep ${index + 1} ${box.state}`).join(", ")}`}
        >
          {sheet.boxes.map((box, index) => (
            <Box key={index} box={box} number={index + 1} />
          ))}
        </div>
        <span className="result-status">{sheet.status}</span>
      </div>
      <div className="result-actions">
        <button
          type="button"
          className="result-replay"
          aria-label="Watch the replay again"
          onClick={onReplay}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 12a8 8 0 1 0 2.4-5.7" />
            <path d="M4 4v4h4" />
          </svg>
        </button>
        {sheet.ended ? (
          <button type="button" className="result-cta" aria-disabled="true">
            See how the pros did
          </button>
        ) : (
          <button type="button" className="result-cta" onClick={onRunItBack}>
            Run it back <kbd aria-hidden="true">Enter</kbd>
          </button>
        )}
      </div>
    </Panel>
  );
}
