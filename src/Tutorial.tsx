import { Fragment, useEffect, useRef, useState } from "react";
import type { Design, Engine, Puzzle, Rep } from "./engine/contract";
import { loadPuzzle } from "./engine";
import { useDesktop } from "./desktopKeys";
import { Field, fieldPoint } from "./Field";
import { Link } from "./Link";
import { todaysPuzzleNumber } from "./puzzles";
import example from "./tutorial.json";
import "./Tutorial.css";

type Step = 1 | 2 | 3;
type Example = { puzzle: Puzzle; engine: Engine; rep: Rep };

const design: Design = {
  protection: { blockers: 6, lineCall: "slide-left" },
  routes: {
    X: { route: "Out", depth: 5 },
    Y: { route: "Hook", depth: 10 },
    H: { route: "Hitch" },
    Z: { route: "Comeback", depth: 10 },
  },
  readOrder: ["Y"],
};

const titles: Record<Step, string> = {
  1: "Read the situation",
  2: "Draw up the play",
  3: "Snap it, then run it back",
};

function Glyph({ path, fill }: { path: string; fill?: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={fill ? "currentColor" : "none"}
      stroke={fill ? "none" : "currentColor"}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

const play = "M7 4.5v15l12-7.5z";

// The first-down zone, its two labelled lines and the ten-yard bracket.
function SituationMarkings({ puzzle }: { puzzle: Puzzle }) {
  const scrimmage = fieldPoint({ x: 0, y: 0 }).y;
  const gain = fieldPoint({ x: 0, y: puzzle.situation.distance }).y;
  const top = gain + 8;
  const bottom = scrimmage - 8;
  const middle = (top + bottom) / 2;
  return (
    <g fontSize="11" fontWeight="800" letterSpacing=".04em">
      <rect
        y={gain}
        width="403"
        height={scrimmage - gain}
        fill="#E2C044"
        opacity=".08"
      />
      <text x="16" y={gain - 8} fill="#E2C044">
        FIRST DOWN
      </text>
      <text x="16" y={scrimmage + 24} fill="#7FB6F2">
        LINE OF SCRIMMAGE
      </text>
      <path
        d={`M390 ${top}V${bottom}M384 ${top + 6}L390 ${top}L396 ${top + 6}M384 ${bottom - 6}L390 ${bottom}L396 ${bottom - 6}`}
        fill="none"
        stroke="#F4EFE4"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="378"
        y={middle + 5}
        textAnchor="end"
        fontSize="14"
        fontWeight="900"
        letterSpacing="0"
        fill="#F4EFE4"
      >
        10 YDS
      </text>
    </g>
  );
}

function TutorialField({ step, example }: { step: Step; example: Example }) {
  const { puzzle, engine, rep } = example;
  switch (step) {
    case 1:
      return (
        <Field
          puzzle={puzzle}
          engine={engine}
          label="The field at your own 45: the blue line of scrimmage and the yellow first-down line ten yards ahead"
        >
          <SituationMarkings puzzle={puzzle} />
        </Field>
      );
    case 2:
      return (
        <Field
          puzzle={puzzle}
          engine={engine}
          protection={design.protection}
          routes={design.routes}
          reads={design.readOrder}
          label="A full play drawn: the line sliding left, four routes, and the tight end marked as the first read"
        />
      );
    case 3:
      return (
        <Field
          puzzle={puzzle}
          engine={engine}
          frame={{ rep, playArt: rep.playArt }}
          label={`The result of rep 1: the defense revealed${rep.ball?.target ? `, the throw to the ${engine.displayName(puzzle, rep.ball.target).name}` : ""}`}
        />
      );
  }
}

function StepDetail({ step }: { step: Step }) {
  switch (step) {
    case 1:
      return (
        <div className="tutorial-reps">
          <span className="tutorial-rep-boxes" aria-hidden="true">
            {[1, 2, 3, 4].map((rep) => (
              <span key={rep}>{rep}</span>
            ))}
          </span>
          <p>Four reps. Use what each one shows you.</p>
        </div>
      );
    case 2:
      return (
        <ol className="tutorial-list">
          {[
            [
              "Protect",
              "Who stays in to block, and which way the line slides.",
            ],
            ["Routes", "A route and a depth for every receiver."],
            ["Read", "Who the quarterback looks at, in order."],
          ].map(([title, description], index) => (
            <li key={title}>
              <span aria-hidden="true">{index + 1}</span>
              <div>
                <b>{title}</b>
                <p>{description}</p>
              </div>
            </li>
          ))}
        </ol>
      );
    case 3:
      return (
        <div
          className="tutorial-strip"
          role="img"
          aria-label="Snap, then the result, then run it back"
        >
          {[
            { label: "Snap", icon: <Glyph path={play} fill /> },
            { label: "Result", icon: <Glyph path="M6 12.5l4 4 8-9" /> },
            {
              label: "Run it back",
              icon: <Glyph path="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" />,
            },
          ].map(({ label, icon }, index) => (
            <Fragment key={label}>
              {index > 0 ? (
                <svg
                  className="tutorial-chevron"
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  aria-hidden="true"
                >
                  <path d="M5 3l4 4-4 4" />
                </svg>
              ) : null}
              <span className="tutorial-phase">
                {icon}
                {label}
              </span>
            </Fragment>
          ))}
        </div>
      );
  }
}

export function Tutorial() {
  const [step, setStep] = useState<Step>(1);
  const [field, setField] = useState<Example | null>(null);
  const [today, setToday] = useState<number | null>(null);
  const desktop = useDesktop();
  const heading = useRef<HTMLHeadingElement>(null);
  const stepped = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    loadPuzzle(example).then(({ puzzle, engine }) => {
      if (!controller.signal.aborted) {
        setField({ puzzle, engine, rep: engine.simulate(puzzle, design) });
      }
    });
    // Without today's puzzle, Skip and the CTA lead to Landing, which says why.
    todaysPuzzleNumber(controller.signal).then(
      (number) => {
        if (!controller.signal.aborted) setToday(number);
      },
      () => {},
    );
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (stepped.current) heading.current?.focus();
  }, [step]);

  function go(next: Step) {
    stepped.current = true;
    setStep(next);
  }

  const puzzleHref = today === null ? "/" : `/puzzle/${today}`;
  const Panel = desktop ? "aside" : "section";
  return (
    <main className="tutorial" data-step={step}>
      <header className="top-bar">
        <span className="brand">OMAHA</span>
        {desktop ? <Link href={puzzleHref}>Skip</Link> : null}
      </header>
      <div className="tutorial-body">
        <div className="tutorial-stage">
          {field ? <TutorialField step={step} example={field} /> : null}
          {step === 1 ? (
            <span className="tutorial-pill situation-pill">
              3rd &amp; 10 · own 45
            </span>
          ) : null}
          {step === 3 ? (
            <span className="tutorial-pill">Rep 1 result</span>
          ) : null}
          {desktop ? null : (
            <Link className="tutorial-skip" href={puzzleHref}>
              Skip
            </Link>
          )}
        </div>
        <Panel className="tutorial-sheet" aria-label={`Step ${step} of 3`}>
          <div className="tutorial-intro">
            <span className="tutorial-dots" aria-hidden="true">
              {[1, 2, 3].map((dot) => (
                <i key={dot} className={dot === step ? "current" : undefined} />
              ))}
            </span>
            <h1 ref={heading} tabIndex={-1}>
              {titles[step]}
            </h1>
            {step === 1 ? (
              <p>
                Every puzzle is one snap from a game. You know the down, the
                distance, the score and the clock. Get past the yellow line.
              </p>
            ) : null}
            {step === 3 ? (
              <p>
                Watch it play out, then see what the defense was really doing.
                Change the call and go again until you convert.
              </p>
            ) : null}
          </div>
          <StepDetail step={step} />
          <div className="tutorial-actions">
            {step === 1 ? null : (
              <button
                type="button"
                className="tutorial-back"
                aria-label="Back"
                onClick={() => go(step === 3 ? 2 : 1)}
              >
                <Glyph path="M15 5l-7 7 7 7" />
              </button>
            )}
            {step === 3 ? (
              <Link className="cta" href={puzzleHref}>
                <Glyph path={play} fill />
                Play today's puzzle
              </Link>
            ) : (
              <button
                type="button"
                className="cta"
                onClick={() => go(step === 1 ? 2 : 3)}
              >
                Next
              </button>
            )}
          </div>
        </Panel>
      </div>
    </main>
  );
}
