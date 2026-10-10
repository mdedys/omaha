import { useEffect } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import type { Blockers, Design, LineCall } from "./engine/contract";

export function protectionCopy({ blockers, lineCall }: Design["protection"]) {
  const blockersHelper =
    blockers === 5
      ? "Line stays in"
      : blockers === 6
        ? "Line + RB stay in"
        : "Line + RB + TE stay in";
  const lineHelper =
    lineCall === "man"
      ? `Line takes defensive linemen${blockers > 5 ? ". Backs take remaining rushers inside-out." : ""}`
      : blockers === 5
        ? `Line slides ${lineCall === "slide-left" ? "left" : "right"}`
        : `RB takes the ${lineCall === "slide-left" ? "right" : "left"} edge`;
  return { blockersHelper, lineHelper };
}

const lineCalls: readonly LineCall[] = ["slide-left", "man", "slide-right"];
const lineNames = {
  "slide-left": "Slide left",
  man: "Man",
  "slide-right": "Slide right",
};

function RadioGroup<T extends string | number>({
  label,
  helper,
  values,
  selected,
  name,
  render,
  onSelect,
}: {
  label: string;
  helper: string;
  values: readonly T[];
  selected: T;
  name: (value: T) => string;
  render: (value: T) => ReactNode;
  onSelect: (value: T) => void;
}) {
  function move(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const delta =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (!delta) return;
    event.preventDefault();
    const nextIndex = (index + delta + values.length) % values.length;
    const next = values[nextIndex];
    onSelect(next);
    const buttons =
      event.currentTarget.parentElement?.querySelectorAll("button");
    buttons?.[nextIndex]?.focus();
  }
  return (
    <section className="protect-group">
      <div className="protect-label">
        <span>{label}</span>
        <p>{helper}</p>
      </div>
      <div className="protect-segment" role="radiogroup" aria-label={label}>
        {values.map((value, index) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-label={name(value)}
            aria-checked={value === selected}
            tabIndex={value === selected ? 0 : -1}
            onClick={() => onSelect(value)}
            onKeyDown={(event) => move(event, index)}
          >
            {render(value)}
          </button>
        ))}
      </div>
    </section>
  );
}

function SlideIcon({ right }: { right: boolean }) {
  return (
    <svg
      width="16"
      height="12"
      viewBox="0 0 16 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={right ? "M1 6H14M10 2L14 6L10 10" : "M15 6H2M6 2L2 6L6 10"} />
    </svg>
  );
}

export function Protect({
  protection,
  offered,
  onChange,
  onNext,
}: {
  protection: Design["protection"];
  offered: readonly Blockers[];
  onChange: (protection: Design["protection"]) => void;
  onNext: () => void;
}) {
  const { blockersHelper, lineHelper } = protectionCopy(protection);
  useEffect(() => {
    function shortcut(event: globalThis.KeyboardEvent) {
      if (
        !window.matchMedia("(min-width: 900px)").matches ||
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return;
      }
      const target = event.target;
      if (target instanceof HTMLElement) {
        if (
          target.isContentEditable ||
          target.closest("input, textarea, select")
        ) {
          return;
        }
        if (event.key.startsWith("Arrow") && target.closest('[role="radio"]')) {
          return;
        }
        if (event.key === "Enter" && target.closest("button, a")) return;
      }
      const blockers = offered.find((count) => String(count) === event.key);
      if (blockers !== undefined) {
        event.preventDefault();
        onChange({ ...protection, blockers });
      } else if (
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key.toLowerCase() === "m"
      ) {
        event.preventDefault();
        onChange({
          ...protection,
          lineCall:
            event.key === "ArrowLeft"
              ? "slide-left"
              : event.key === "ArrowRight"
                ? "slide-right"
                : "man",
        });
      } else if (event.key === "Enter") {
        event.preventDefault();
        onNext();
      }
    }
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [offered, protection, onChange, onNext]);
  return (
    <>
      <h2 className="protect-heading">Protect</h2>
      <div className="protect-controls">
        <RadioGroup
          label="Blockers"
          helper={blockersHelper}
          values={offered}
          selected={protection.blockers}
          name={(count) => `${count}-man`}
          render={(count) => `${count}-man`}
          onSelect={(blockers) => onChange({ ...protection, blockers })}
        />
        <RadioGroup
          label="Line call"
          helper={lineHelper}
          values={lineCalls}
          selected={protection.lineCall}
          name={(call) => lineNames[call]}
          render={(call) =>
            call === "man" ? (
              "Man"
            ) : (
              <>
                {call === "slide-left" ? <SlideIcon right={false} /> : null}
                Slide
                {call === "slide-right" ? <SlideIcon right /> : null}
              </>
            )
          }
          onSelect={(lineCall) => onChange({ ...protection, lineCall })}
        />
      </div>
      <div className="protect-action">
        <button className="protect-next" type="button" onClick={onNext}>
          Next: routes <kbd aria-hidden="true">Enter</kbd>
        </button>
        <p className="protect-hint">
          {offered.map((count) => (
            <kbd key={count}>{count}</kbd>
          ))}{" "}
          blockers · <kbd>←</kbd> <kbd>M</kbd> <kbd>→</kbd> line call
        </p>
      </div>
    </>
  );
}
