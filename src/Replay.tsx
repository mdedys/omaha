import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { TICK_SECONDS } from "./engine/contract";
import type { Engine, Puzzle } from "./engine/contract";
import { useDesktop, useDesktopKeys } from "./desktopKeys";
import { Field } from "./Field";
import { playback, timeline } from "./playback";
import { usePlaybackSeconds } from "./playbackSeconds";
import { Segment } from "./Protect";
import { moments, tenths } from "./moments";
import type { Played } from "./result";

const speeds = [0.25, 0.5, 1] as const;
type Speed = (typeof speeds)[number];

// `at` is the tick where the current run started, or the paused tick. Each
// run gets a new `run` so the clock starts again from 0.
type Clock = { at: number; playing: boolean; run: number; speed: Speed };

const seconds = (tick: number) => Math.round(tick * TICK_SECONDS * 100) / 100;

function Glyph({ playing }: { playing: boolean }) {
  return playing ? (
    <svg viewBox="0 0 10 10" data-glyph="play" aria-hidden="true">
      <path d="M2 1v8l7-4z" fill="currentColor" />
    </svg>
  ) : (
    <svg viewBox="0 0 10 10" data-glyph="pause" aria-hidden="true">
      <rect x="1.5" y="1" width="2.4" height="8" rx="0.6" fill="currentColor" />
      <rect x="6.1" y="1" width="2.4" height="8" rx="0.6" fill="currentColor" />
    </svg>
  );
}

export function Replay({
  puzzle,
  engine,
  played,
  number,
  onBack,
}: {
  puzzle: Puzzle;
  engine: Engine;
  played: Played;
  number: number;
  onBack: () => void;
}) {
  const { rep } = played;
  const { endTick } = rep;
  const desktop = useDesktop();
  const panel = useRef<HTMLElement>(null);
  useEffect(() => panel.current?.focus({ preventScroll: true }), []);
  const [clock, setClock] = useState<Clock>({
    at: 0,
    playing: false,
    run: 0,
    speed: 0.5,
  });
  const stop = useCallback(
    () => setClock((current) => ({ ...current, at: endTick, playing: false })),
    [endTick],
  );
  const elapsed = usePlaybackSeconds(
    clock.playing ? clock.run : null,
    ((endTick - clock.at) * TICK_SECONDS) / clock.speed,
    stop,
  );
  const tick = Math.min(
    clock.at + (elapsed * clock.speed) / TICK_SECONDS,
    endTick,
  );
  const marks = moments(puzzle, engine, played);
  const moment = marks.find((mark) => mark.tick === tick);
  const frame = playback(rep, timeline(rep).snap + tick * TICK_SECONDS);

  function seek(to: number) {
    setClock((current) => ({
      ...current,
      at: Math.min(Math.max(to, 0), endTick),
      playing: false,
    }));
  }
  function toggle() {
    setClock((current) =>
      current.playing
        ? { ...current, at: tick, playing: false }
        : {
            ...current,
            at: tick >= endTick ? 0 : tick,
            playing: true,
            run: current.run + 1,
          },
    );
  }
  function changeSpeed(speed: Speed) {
    setClock((current) => ({
      ...current,
      at: tick,
      speed,
      run: current.run + 1,
    }));
  }
  function scrub(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    seek(Math.round(((event.clientX - box.left) / box.width) * endTick));
  }
  function slide(event: KeyboardEvent<HTMLDivElement>) {
    const to =
      event.key === "ArrowRight" || event.key === "ArrowUp"
        ? tick + 1
        : event.key === "ArrowLeft" || event.key === "ArrowDown"
          ? tick - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? endTick
              : null;
    if (to === null) return;
    event.preventDefault();
    seek(to);
  }
  useDesktopKeys((key) => {
    if (document.activeElement?.closest('button, [role="slider"]')) {
      return false;
    }
    if (key === " ") toggle();
    else if (key === ",") seek(tick - 1);
    else if (key === ".") seek(tick + 1);
    else if (key === "Enter") onBack();
    else return false;
    return true;
  });

  const percent = (at: number) => (at / endTick) * 100;
  const splits = marks
    .filter((mark) => mark.name === "Break" || mark.name === "Throw")
    .map((mark) => percent(mark.tick));
  const edges = [0, ...splits, 100];
  const position = percent(tick);
  const Panel = desktop ? "aside" : "footer";
  return (
    <div className="play-body">
      <div className="play-stage">
        <Field
          puzzle={puzzle}
          engine={engine}
          live={{ ...frame, cone: null }}
          ballPath
          label={`Rep ${number} replay, ${clock.playing ? "playing" : `paused at ${tenths(tick * TICK_SECONDS)} seconds${moment ? `, ${moment.name.toLowerCase()}` : ""}`}: players and the ball only, no play art.`}
        />
        <span className="replay-pill">
          <Glyph playing={clock.playing} />
          Rep {number} replay
        </span>
      </div>
      <Panel
        ref={panel}
        className="replay-panel"
        aria-label="Playback"
        tabIndex={-1}
      >
        <div className="replay-scrubber-group">
          <div
            className="replay-scrubber"
            role="slider"
            tabIndex={0}
            aria-label="Replay position"
            aria-valuemin={0}
            aria-valuemax={seconds(endTick)}
            aria-valuenow={seconds(tick)}
            aria-valuetext={`${tenths(tick * TICK_SECONDS)} seconds${moment ? `, ${moment.name.toLowerCase()}` : ""}`}
            onKeyDown={slide}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              scrub(event);
            }}
            onPointerMove={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                scrub(event);
              }
            }}
          >
            {edges.slice(1).map((end, index) => {
              const start = edges[index];
              const played = Math.min(
                Math.max(((position - start) / (end - start)) * 100, 0),
                100,
              );
              return (
                <span
                  key={index}
                  className="replay-segment"
                  data-segment={index}
                  style={{
                    left: index ? `calc(${start}% + 1px)` : 0,
                    right:
                      index < edges.length - 2
                        ? `calc(${100 - end}% + 1px)`
                        : 0,
                    background: `linear-gradient(to right, var(--ink) ${played}%, var(--border) ${played}%)`,
                  }}
                />
              );
            })}
            <span
              className="replay-thumb"
              style={{ left: `calc(${position}% - 7px)` }}
            />
          </div>
          <div className="replay-time-row">
            <span className="replay-time">
              {tenths(tick * TICK_SECONDS)}s{" "}
              <span>/ {tenths(endTick * TICK_SECONDS)}s</span>
            </span>
            <Segment
              className="protect-segment replay-speed"
              label="Playback speed"
              values={speeds}
              selected={clock.speed}
              name={(speed) => `${speed}×`}
              render={(speed) => `${speed}×`}
              onSelect={changeSpeed}
            />
          </div>
        </div>
        <div className="replay-transport">
          <button
            type="button"
            className="replay-step"
            aria-label="Back one frame"
            onClick={() => seek(tick - 1)}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="5" y="5" width="2.4" height="14" rx="1" />
              <path d="M19 5v14L9 12z" />
            </svg>
          </button>
          <button
            type="button"
            className="replay-play"
            aria-label={clock.playing ? "Pause" : "Play"}
            onClick={toggle}
          >
            {clock.playing ? (
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                data-glyph="pause"
                aria-hidden="true"
              >
                <rect x="6" y="4.5" width="4" height="15" rx="1" />
                <rect x="14" y="4.5" width="4" height="15" rx="1" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                data-glyph="play"
                aria-hidden="true"
              >
                <path d="M7 4.5v15l12-7.5z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            className="replay-step"
            aria-label="Forward one frame"
            onClick={() => seek(tick + 1)}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="16.6" y="5" width="2.4" height="14" rx="1" />
              <path d="M5 5v14l10-7z" />
            </svg>
          </button>
        </div>
        <div className="replay-jump">
          <span className="replay-jump-label" aria-hidden="true">
            Jump to
          </span>
          <div
            className="replay-moments"
            role="group"
            aria-label="Jump to a moment"
          >
            {marks.map((mark) => (
              <button
                key={mark.name}
                type="button"
                aria-pressed={mark === moment}
                onClick={() => seek(mark.tick)}
              >
                <span>{mark.name}</span>
                <span>{tenths(mark.tick * TICK_SECONDS)}s</span>
              </button>
            ))}
          </div>
        </div>
        <div className="replay-actions">
          <button type="button" className="protect-next" onClick={onBack}>
            Back to the result <kbd aria-hidden="true">Enter</kbd>
          </button>
          <p className="protect-hint">
            <kbd>Space</kbd> play/pause · <kbd>,</kbd> <kbd>.</kbd> step a frame
          </p>
        </div>
      </Panel>
    </div>
  );
}
