import type { Design, Engine, Letter, Puzzle } from "./engine/contract";
import { useDesktopKeys } from "./desktopKeys";
import { fieldOrder, receiverColors, routeRunners } from "./routes";

export function Swatch({ letter }: { letter: Letter }) {
  return (
    <svg className="swatch" viewBox="0 0 14 14" aria-hidden="true">
      <circle
        cx="7"
        cy="7"
        r="5.5"
        fill="#0E2219"
        stroke={receiverColors[letter].ring}
        strokeWidth="2"
      />
    </svg>
  );
}

export function ReadPanel({
  puzzle,
  engine,
  design,
  snapFailed,
  onToggle,
  onSnap,
}: {
  puzzle: Puzzle;
  engine: Engine;
  design: Design;
  snapFailed: boolean;
  onToggle: (letter: Letter) => void;
  onSnap: () => void;
}) {
  const { routes, readOrder } = design;
  const runners = routeRunners(design.protection);
  const options = fieldOrder(
    engine.preSnap(puzzle),
    runners.filter((letter) => routes[letter]),
  );
  const routed = options.length === runners.length;
  const canSnap = routed && readOrder.length > 0;
  const name = (letter: Letter) => engine.displayName(puzzle, letter).name;
  useDesktopKeys((key) => {
    const option = options[Number(key) - 1];
    if (/^[1-9]$/.test(key) && option) {
      onToggle(option);
    } else if (key === "Enter" && canSnap) {
      onSnap();
    } else {
      return false;
    }
    return true;
  });
  return (
    <>
      <div className="read-controls">
        <div className="read-question">
          <h2>Who does the QB look to?</h2>
          {snapFailed ? (
            <span className="read-error" role="alert">
              Snap failed. Try again.
            </span>
          ) : (
            <span>
              {canSnap
                ? "Pick in order · up to 3"
                : routed
                  ? "Pick a read first"
                  : "Set every route first"}
            </span>
          )}
        </div>
        <div
          className="read-options"
          role="group"
          aria-label="Read order"
          data-columns={options.length === 5 ? 3 : 2}
        >
          {options.map((letter) => {
            const place = readOrder.indexOf(letter);
            const route = routes[letter]?.route;
            return (
              <button
                key={letter}
                type="button"
                className="read-option"
                aria-pressed={place >= 0}
                aria-disabled={
                  place < 0 && readOrder.length === 3 ? true : undefined
                }
                aria-label={`${name(letter)}, ${route}${place >= 0 ? `, read ${place + 1}` : ""}`}
                onClick={() => onToggle(letter)}
              >
                <Swatch letter={letter} />
                <span className="read-option-text">
                  <span>{name(letter)}</span>
                  <span>{route}</span>
                </span>
                {place >= 0 ? (
                  <svg
                    className="read-badge"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <circle cx="10" cy="10" r="9" fill="#F4B13E" />
                    <text
                      x="10"
                      y="14"
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="800"
                      fill="#0A1410"
                    >
                      {place + 1}
                    </text>
                  </svg>
                ) : null}
              </button>
            );
          })}
        </div>
        <p className="visually-hidden" aria-live="polite">
          {readOrder.length
            ? `Read order: ${readOrder.map(name).join(", ")}`
            : "No reads picked"}
        </p>
      </div>
      <div className="protect-action">
        <button
          type="button"
          className="protect-next read-snap"
          aria-disabled={!canSnap}
          onClick={() => {
            if (canSnap) onSnap();
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M7 4.5v15l12-7.5z" />
          </svg>
          Snap <kbd aria-hidden="true">Enter</kbd>
        </button>
        {options.length ? (
          <p className="protect-hint">
            <kbd>1</kbd>
            {options.length > 1 ? (
              <>
                –<kbd>{options.length}</kbd>
              </>
            ) : null}{" "}
            add or drop a read
          </p>
        ) : null}
      </div>
    </>
  );
}
