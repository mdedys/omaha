import type { KeyboardEvent, ReactNode } from "react";
import type { Blockers, Design, LineCall } from "./engine/contract";
import { useDesktopKeys } from "./desktopKeys";

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

type Options<T> = {
  label: string;
  values: readonly T[];
  selected: T;
  name: (value: T) => string;
  render: (value: T) => ReactNode;
  onSelect: (value: T) => void;
};

export function Segment<T extends string | number>({
  className,
  label,
  values,
  selected,
  name,
  render,
  onSelect,
}: Options<T> & { className: string }) {
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
    <div className={className} role="radiogroup" aria-label={label}>
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
  );
}

function RadioGroup<T extends string | number>({
  helper,
  ...options
}: Options<T> & { helper: string }) {
  return (
    <section className="protect-group">
      <div className="protect-label">
        <span>{options.label}</span>
        <p>{helper}</p>
      </div>
      <Segment className="protect-segment" {...options} />
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
  useDesktopKeys((key) => {
    const blockers = offered.find((count) => String(count) === key);
    if (blockers !== undefined) {
      onChange({ ...protection, blockers });
    } else if (
      key === "ArrowLeft" ||
      key === "ArrowRight" ||
      key.toLowerCase() === "m"
    ) {
      onChange({
        ...protection,
        lineCall:
          key === "ArrowLeft"
            ? "slide-left"
            : key === "ArrowRight"
              ? "slide-right"
              : "man",
      });
    } else if (key === "Enter") {
      onNext();
    } else {
      return false;
    }
    return true;
  });
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
