import { useEffect, useState } from "react";
import { TICK } from "./engine/constants.ts";
import { simulate } from "./engine/simulate.ts";
import { Field, type Tier } from "./Field.tsx";
import { causeLine, formatEvent, seconds } from "./format.ts";
import { SCENARIOS } from "./scenarios.ts";

const REPS = SCENARIOS.map((s) => simulate(s.defense, s.design));

const TIERS: { id: Tier; label: string }[] = [
  { id: "rep1", label: "Rep 1 failed" },
  { id: "rep2", label: "Rep 2 failed" },
  { id: "rep3", label: "Rep 3 failed" },
  { id: "end", label: "End" },
];

export default function App() {
  const [index, setIndex] = useState(0);
  const [tick, setTick] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [tier, setTier] = useState<Tier>("rep1");
  const [ghosts, setGhosts] = useState(false);

  const scenario = SCENARIOS[index];
  const rep = REPS[index];
  const frozen = tick >= rep.lastTick;
  const running = playing && !frozen;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(
      () => setTick((t) => Math.min(t + 1, rep.lastTick)),
      TICK * 1000,
    );
    return () => clearInterval(id);
  }, [running, rep.lastTick]);

  const choose = (i: number) => {
    setIndex(i);
    setTick(0);
    setPlaying(true);
  };
  const playPause = () => {
    if (frozen) setTick(0);
    setPlaying(!running);
  };

  const cause = causeLine(rep.cause);
  const clock = `${seconds(tick)} of ${seconds(rep.lastTick)}`;

  return (
    <div className="page">
      <header>
        <h1>Omaha legibility prototype</h1>
        <p>3rd &amp; 6 at the offense's own 35, Gun Trey, middle hash.</p>
      </header>

      <main className="replay">
        <section className="stage" aria-label="Replay">
          <h2>
            {index + 1}. {scenario.name}
          </h2>
          <Field
            rep={rep}
            defense={scenario.defense}
            design={scenario.design}
            tick={tick}
            tier={tier}
            ghosts={ghosts}
            label={`${scenario.name}, ${frozen ? `dead-ball frame: ${cause}` : clock}`}
          />
          <p className="cause" aria-live="polite">
            {frozen ? cause : "The cause shows on the dead-ball frame."}
          </p>
          {tier === "end" && (
            <p className="coverage">
              Coverage: {scenario.defense.coverageName}
            </p>
          )}

          <div className="controls">
            <button type="button" onClick={playPause}>
              {running ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              onClick={() => {
                setTick(0);
                setPlaying(true);
              }}
            >
              Restart
            </button>
            <button
              type="button"
              onClick={() => {
                setTick(rep.lastTick);
                setPlaying(false);
              }}
            >
              Skip to end
            </button>
            <label className="scrubber">
              <span className="clock">{clock}</span>
              <input
                type="range"
                aria-label="Replay tick"
                aria-valuetext={clock}
                min={0}
                max={rep.lastTick}
                value={tick}
                onChange={(e) => {
                  setPlaying(false);
                  setTick(Number(e.target.value));
                }}
              />
            </label>
          </div>

          <fieldset className="tiers">
            <legend>Reveal tier</legend>
            {TIERS.map((t) => (
              <label key={t.id}>
                <input
                  type="radio"
                  name="tier"
                  checked={tier === t.id}
                  onChange={() => setTier(t.id)}
                />
                {t.label}
              </label>
            ))}
          </fieldset>
          <label className="toggle">
            <input
              type="checkbox"
              checked={ghosts}
              onChange={(e) => setGhosts(e.target.checked)}
            />
            Best-moment ghosts
          </label>

          <details className="log" aria-label="Event log">
            <summary>Event log</summary>
            <ol>
              {rep.events.map((e, i) => (
                <li key={i}>
                  <time>{seconds(e.tick)}</time> {formatEvent(e)}
                </li>
              ))}
            </ol>
          </details>
        </section>

        <nav className="scenarios" aria-label="Scenarios">
          <ol>
            {SCENARIOS.map((s, i) => {
              const r = REPS[i];
              const met = s.met(r, s.defense);
              return (
                <li
                  key={s.name}
                  className={i === index ? "current" : undefined}
                >
                  <button
                    type="button"
                    aria-current={i === index ? "true" : undefined}
                    onClick={() => choose(i)}
                  >
                    {i + 1}. {s.name}
                  </button>
                  <dl>
                    <dt>Coverage</dt>
                    <dd>{s.defense.coverageName}</dd>
                    <dt>Expected</dt>
                    <dd>{s.expected}</dd>
                    <dt>Actual</dt>
                    <dd>
                      {r.cause.code}
                      {r.cause.decisive && `, ${r.cause.decisive} decisive`}
                      {r.cause.thrownTo && `, thrown to ${r.cause.thrownTo}`}
                      {!met && <strong className="differs"> differs</strong>}
                    </dd>
                  </dl>
                </li>
              );
            })}
          </ol>
        </nav>
      </main>
    </div>
  );
}
