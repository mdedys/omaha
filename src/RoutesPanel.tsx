import { useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
import type {
  Depth,
  Engine,
  Letter,
  Puzzle,
  RouteCall,
  RouteName,
} from "./engine/contract";
import { chooseRoute, receiverColors } from "./routes";

const diagrams: Record<RouteName, string> = {
  Hitch: "M46 50V38L40 44M44.4 43.2L40 44L40.8 39.6",
  Flat: "M46 50V47H72M67 42.5L72 47L67 51.5",
  Slant: "M46 50V45L24 23M28.4 23.8L24 23L24.8 27.4",
  Comeback: "M46 50V28L54 36M49.6 35.2L54 36L53.2 31.6",
  Hook: "M46 50V26L40 33M44.4 32.3L40 33L40.1 28.5",
  Out: "M46 50V28H70M65 23.5L70 28L65 32.5",
  In: "M46 50V28H22M27 23.5L22 28L27 32.5",
  Corner: "M46 50V30L64 12M59.6 12.8L64 12L63.2 16.4",
  Post: "M46 50V30L28 12M32.4 12.8L28 12L28.8 16.4",
  Go: "M46 50V8M41.5 12.5L46 8L50.5 12.5",
  Seam: "M46 50V8M41.5 12.5L46 8L50.5 12.5",
  Drag: "M46 50V43H18M23 38.5L18 43L23 47.5",
  Wheel: "M46 50V47H68V12M63.5 16.5L68 12L72.5 16.5",
};

function moveFocus(event: KeyboardEvent<HTMLButtonElement>, index: number) {
  const delta =
    event.key === "ArrowRight" || event.key === "ArrowDown"
      ? 1
      : event.key === "ArrowLeft" || event.key === "ArrowUp"
        ? -1
        : 0;
  const buttons = Array.from(
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
      "button:not(:disabled)",
    ) ?? [],
  );
  if (!delta && event.key !== "Home" && event.key !== "End") return;
  event.preventDefault();
  const next =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? buttons.length - 1
        : (index + delta + buttons.length) % buttons.length;
  buttons[next]?.focus();
  buttons[next]?.click();
}

export function RoutesPanel({
  puzzle,
  engine,
  selected,
  call,
  onChange,
  onNext,
}: {
  puzzle: Puzzle;
  engine: Engine;
  selected: Letter;
  call?: RouteCall;
  onChange: (call: RouteCall) => void;
  onNext: () => void;
}) {
  const list = useRef<HTMLDivElement>(null);
  const menu = engine.routeMenu(puzzle, selected);
  const depths = call
    ? engine.availableDepths(puzzle, selected, call.route)
    : [];
  const name = engine.displayName(puzzle, selected).name;
  const positions = engine.preSnap(puzzle);
  const left = positions[selected].x < positions.C.x;
  const back = selected === "RB" && positions.RB.y < positions.C.y - 1;
  const colors = receiverColors[selected];
  useEffect(() => {
    if (!list.current || window.matchMedia("(min-width: 900px)").matches) {
      return;
    }
    const card = list.current.querySelector<HTMLElement>(
      '[aria-selected="true"]',
    );
    list.current.scrollTo({
      left: card
        ? card.offsetLeft - (list.current.clientWidth - card.offsetWidth) / 2
        : 0,
    });
  }, [selected, call?.route]);
  function setDepth(depth: Depth) {
    if (!call || !depths.includes(depth)) return;
    const route = call.route;
    if (route === "In" || route === "Out" || route === "Hook") {
      onChange({ route, depth });
    } else if (
      (route === "Corner" || route === "Post" || route === "Comeback") &&
      depth !== 5
    ) {
      onChange({ route, depth });
    }
  }
  return (
    <>
      <h2 className="protect-heading">Routes</h2>
      <div className="routes-controls">
        <div className="routes-receiver">
          <span>{name}</span>
          <p>Tap any receiver on the field</p>
        </div>
        <div
          ref={list}
          className="route-menu"
          role="listbox"
          aria-label={`Routes for ${name}`}
          data-assigned={call ? "true" : undefined}
        >
          {menu.map((route, index) => (
            <button
              key={route}
              type="button"
              role="option"
              className="route-card"
              aria-selected={call?.route === route}
              tabIndex={
                call ? (call.route === route ? 0 : -1) : index === 0 ? 0 : -1
              }
              onClick={() =>
                onChange(chooseRoute(engine, puzzle, selected, route, call))
              }
              onKeyDown={(event) => moveFocus(event, index)}
            >
              <svg viewBox="0 0 92 60" aria-hidden="true">
                <rect width="92" height="60" fill="#0F3A27" />
                <path
                  d={`M0 ${back ? 42 : 54}H92`}
                  stroke="#3B8EEA"
                  opacity=".6"
                />
                <g transform={left ? "translate(92 0) scale(-1 1)" : undefined}>
                  {back ? (
                    <path
                      d="M39 51L46 42"
                      stroke={colors.route}
                      strokeWidth="2"
                      fill="none"
                    />
                  ) : null}
                  <path
                    d={
                      back
                        ? diagrams[route].replace("M46 50", "M46 54")
                        : diagrams[route]
                    }
                    transform={back ? "translate(0 -12)" : undefined}
                    stroke={colors.route}
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx={back ? 36 : 46}
                    cy="54"
                    r="4.5"
                    fill="#0E2219"
                    stroke={colors.ring}
                    strokeWidth="1.8"
                  />
                </g>
              </svg>
              <span>{route}</span>
            </button>
          ))}
        </div>
        <div className="routes-depth">
          <span className="routes-depth-label">Depth</span>
          {!call || depths.length === 0 ? (
            <p className="route-note">
              {call
                ? `No depth for the ${call.route.toLowerCase()}`
                : "Choose a route to set its depth."}
            </p>
          ) : (
            <div
              className="protect-segment route-depth-control"
              role="radiogroup"
              aria-label={`${call.route} route depth`}
            >
              {([5, 10, 15] as const).map((depth) => (
                <button
                  key={depth}
                  type="button"
                  role="radio"
                  disabled={!depths.includes(depth)}
                  aria-disabled={!depths.includes(depth)}
                  aria-checked={"depth" in call && call.depth === depth}
                  tabIndex={"depth" in call && call.depth === depth ? 0 : -1}
                  onClick={() => setDepth(depth)}
                  onKeyDown={(event) => moveFocus(event, depths.indexOf(depth))}
                >
                  {depth} yds
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="protect-action">
        <button type="button" className="protect-next" onClick={onNext}>
          Next: read
        </button>
      </div>
    </>
  );
}
