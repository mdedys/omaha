import { FIELD_HALF_WIDTH, ZONES } from "./engine/constants.ts";
import {
  GAPS,
  GOAL_LINE_Y,
  GUN_TREY,
  LETTERS,
  LINE_TO_GAIN_Y,
  LINEMEN,
  SITUATION,
  Y_SIDE,
} from "./engine/formation.ts";
import type {
  Badge,
  Defender,
  Defense,
  Design,
  Letter,
  Rep,
  Vec,
} from "./engine/types.ts";

export type Tier = "rep1" | "rep2" | "rep3" | "end";

const COLOR = {
  turf: "#0F3A27",
  line: "#D5E0D9",
  number: "#A7B2AC",
  scrimmage: "#3B8EEA",
  firstDown: "#E2C044",
  lineman: "#A4AAAF",
  linemanStroke: "#DADDE0",
  receiverFill: "#0E2219",
  quarterback: "#F2F5F3",
  quarterbackText: "#0A1410",
  defenderFill: "#071710",
  defenderRing: "#F4EFE4",
  defensePath: "#C4CFC8",
  startDot: "#7E8B85",
  blitz: "#E05A2B",
  gold: "#F4B13E",
  football: "#8B5A2B",
};
const RECEIVER: Record<Letter, { ring: string; route: string }> = {
  X: { ring: "#EAC54F", route: "#EAC54F" },
  Y: { ring: "#8E73F2", route: "#B7A6F5" },
  H: { ring: "#F0607A", route: "#F27C8E" },
  Z: { ring: "#55AEF5", route: "#55AEF5" },
  RB: { ring: "#5BDB8C", route: "#5BDB8C" },
};
const ZONE_COLOR = {
  deep: "#3D7BFF",
  hook: "#FFD84A",
  "curl-flat": "#B57CFF",
  flat: "#7FD8FF",
};
const zoneColor = (zone: keyof typeof ZONES) =>
  zone.startsWith("deep")
    ? ZONE_COLOR.deep
    : zone.startsWith("hook")
      ? ZONE_COLOR.hook
      : zone.startsWith("curl")
        ? ZONE_COLOR["curl-flat"]
        : ZONE_COLOR.flat;

const BADGE: Record<Badge, { fill: string; ring: string; glyph: string }> = {
  open: { fill: "#FFFFFF", ring: "#FFFFFF", glyph: "✓" },
  contested: { fill: COLOR.defenderFill, ring: "#FFFFFF", glyph: "~" },
  covered: { fill: COLOR.defenderFill, ring: "#8A958F", glyph: "✕" },
};

// Screen y grows downward; the field's y grows downfield.
const sx = (p: Vec) => p.x;
const sy = (p: Vec) => -p.y;
const points = (ps: readonly Vec[]) =>
  ps.map((p) => `${sx(p).toFixed(2)},${sy(p).toFixed(2)}`).join(" ");

const ARROWS = [
  ...Object.entries(RECEIVER).map(([letter, c]) => [letter, c.route]),
  ["defense", COLOR.defensePath],
  ["blitz", COLOR.blitz],
  ["slide", COLOR.linemanStroke],
];

const revealed = (tier: Tier, d: Defender) =>
  tier === "rep3" || tier === "end"
    ? true
    : tier === "rep2"
      ? d.role === "DL" || d.role === "LB"
      : false;

function frame(rep: Rep): { top: number; bottom: number } {
  let top = LINE_TO_GAIN_Y;
  let bottom = 0;
  for (const track of [...Object.values(rep.tracks), rep.ball]) {
    for (const p of track) {
      top = Math.max(top, p.y);
      bottom = Math.min(bottom, p.y);
    }
  }
  return { top: top + 4, bottom: bottom - 2 };
}

type Props = {
  rep: Rep;
  defense: Defense;
  design: Design;
  tick: number;
  tier: Tier;
  ghosts: boolean;
  label: string;
};

export function Field({
  rep,
  defense,
  design,
  tick,
  tier,
  ghosts,
  label,
}: Props) {
  const { top, bottom } = frame(rep);
  const frozen = tick >= rep.lastTick;
  const at = (id: string, t = tick): Vec =>
    rep.tracks[id][Math.min(t, rep.tracks[id].length - 1)];
  const half = FIELD_HALF_WIDTH;

  const yardLines: number[] = [];
  for (let y = Math.ceil(bottom / 5) * 5; y <= top; y += 5) yardLines.push(y);
  const fieldYard = (y: number) => {
    const yard = SITUATION.yardLine + y;
    return yard <= 50 ? yard : 100 - yard;
  };

  const releaseTick = (rusher: string) =>
    rep.events.find((e) => e.kind === "hold-release" && e.rusher === rusher)
      ?.tick ?? rep.lastTick;
  const blocks = rep.events.flatMap((e) =>
    e.kind === "pickup"
      ? [{ blocker: e.blocker, rusher: e.rusher }]
      : e.kind === "double"
        ? [{ blocker: e.helper, rusher: e.rusher }]
        : [],
  );
  const keptIn = LETTERS.filter((l) => !rep.routes[l]);
  const carrier = rep.carrier;
  const slide = design.protection.call;
  const cutTicks = rep.events.flatMap((e) =>
    e.kind === "cut" && e.tick <= tick ? [e.tick] : [],
  );
  const thrown = rep.cause.thrownTo;
  const flight = rep.flight;

  return (
    <svg
      className="field"
      role="img"
      aria-label={label}
      viewBox={`${-half} ${-top} ${2 * half} ${top - bottom}`}
    >
      <defs>
        {ARROWS.map(([id, color]) => (
          <marker
            key={id}
            id={`arrow-${id}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto-start-reverse"
          >
            <path
              d="M1,1 L8,5 L1,9"
              fill="none"
              stroke={color}
              strokeWidth="1.6"
            />
          </marker>
        ))}
      </defs>

      <rect
        x={-half}
        y={-top}
        width={2 * half}
        height={top - bottom}
        fill={COLOR.turf}
      />
      {GOAL_LINE_Y < top && (
        <rect
          x={-half}
          y={-top}
          width={2 * half}
          height={top - GOAL_LINE_Y}
          fill="#0C3322"
        />
      )}
      {yardLines.map((y) => (
        <g key={y}>
          <line
            x1={-half}
            x2={half}
            y1={-y}
            y2={-y}
            stroke={COLOR.line}
            strokeOpacity={0.45}
            strokeWidth={0.1}
          />
          {(SITUATION.yardLine + y) % 10 === 0 &&
            y + SITUATION.yardLine < 100 && (
              <>
                <text x={-half + 4} y={-y + 0.6} className="yard-number">
                  {fieldYard(y)}
                </text>
                <text x={half - 4} y={-y + 0.6} className="yard-number">
                  {fieldYard(y)}
                </text>
              </>
            )}
        </g>
      ))}
      {[-4, 4].map((x) =>
        yardLines.map((y) =>
          [0, 1, 2, 3, 4].map((k) => (
            <line
              key={`${x}-${y}-${k}`}
              x1={x - 0.3}
              x2={x + 0.3}
              y1={-(y + k)}
              y2={-(y + k)}
              stroke={COLOR.line}
              strokeOpacity={0.45}
              strokeWidth={0.08}
            />
          )),
        ),
      )}
      <line
        x1={-half}
        x2={half}
        y1={0}
        y2={0}
        stroke={COLOR.scrimmage}
        strokeWidth={0.16}
      />
      <line
        x1={-half}
        x2={half}
        y1={-LINE_TO_GAIN_Y}
        y2={-LINE_TO_GAIN_Y}
        stroke={COLOR.firstDown}
        strokeWidth={0.16}
      />
      {GOAL_LINE_Y < top && (
        <line
          x1={-half}
          x2={half}
          y1={-GOAL_LINE_Y}
          y2={-GOAL_LINE_Y}
          stroke={COLOR.line}
          strokeWidth={0.3}
        />
      )}

      {/* Offense play art: routes, read order and protection. */}
      {LETTERS.map((letter) => {
        const path = rep.routes[letter];
        return (
          path && (
            <polyline
              key={letter}
              points={points(path.points)}
              fill="none"
              stroke={RECEIVER[letter].route}
              strokeWidth={0.15}
              strokeOpacity={0.75}
              markerEnd={`url(#arrow-${letter})`}
            />
          )
        );
      })}
      {design.readOrder.map((letter, i) => {
        const spot = GUN_TREY[letter];
        return (
          <g key={letter} className="read-number">
            <circle
              cx={spot.x - 1}
              cy={-spot.y + 1.1}
              r={0.5}
              fill={COLOR.gold}
            />
            <text x={spot.x - 1} y={-spot.y + 1.1} dy="0.3">
              {i + 1}
            </text>
          </g>
        );
      })}
      {slide !== "man" && (
        <line
          x1={slide === "slide-left" ? 2.5 : -2.5}
          x2={slide === "slide-left" ? -2.5 : 2.5}
          y1={1.6}
          y2={1.6}
          stroke={COLOR.linemanStroke}
          strokeWidth={0.12}
          markerEnd="url(#arrow-slide)"
        />
      )}
      {keptIn.map((letter) => {
        const from = GUN_TREY[letter];
        const gap =
          letter === "Y"
            ? GAPS[`${Y_SIDE}-D`]
            : slide === "man"
              ? { x: from.x, y: -2 }
              : GAPS[slide === "slide-left" ? "R-C" : "L-C"];
        const to = { x: gap.x, y: gap.y - 1.2 };
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const tx = (-dy / len) * 0.5;
        const ty = (dx / len) * 0.5;
        return (
          <g key={letter} stroke={RECEIVER[letter].route} strokeWidth={0.14}>
            <line x1={sx(from)} y1={sy(from)} x2={sx(to)} y2={sy(to)} />
            <line
              x1={to.x - tx}
              y1={-(to.y - ty)}
              x2={to.x + tx}
              y2={-(to.y + ty)}
            />
          </g>
        );
      })}

      {/* Defense play art, drawn over the frozen frame by reveal tier. */}
      {frozen &&
        defense.defenders
          .filter((d) => revealed(tier, d))
          .map((d) => {
            const a = d.assignment;
            const track = rep.tracks[d.id];
            if (a.kind === "zone") {
              const z = ZONES[a.zone];
              const color = zoneColor(a.zone);
              return (
                <g key={d.id}>
                  <ellipse
                    cx={z.x}
                    cy={-z.y}
                    rx={z.rx}
                    ry={z.ry}
                    fill={color}
                    fillOpacity={0.18}
                    stroke={color}
                    strokeOpacity={0.85}
                    strokeWidth={0.1}
                  />
                  <line
                    x1={d.spot.x}
                    y1={-d.spot.y}
                    x2={z.x}
                    y2={-z.y}
                    stroke={color}
                    strokeWidth={0.1}
                    strokeDasharray="0.3 0.3"
                  />
                  <circle
                    cx={d.spot.x}
                    cy={-d.spot.y}
                    r={0.3}
                    fill={COLOR.startDot}
                  />
                </g>
              );
            }
            const blitz = a.kind === "rush" && d.role !== "DL";
            return (
              <g key={d.id}>
                <polyline
                  points={points(track)}
                  fill="none"
                  stroke={blitz ? COLOR.blitz : COLOR.defensePath}
                  strokeWidth={blitz ? 0.19 : 0.12}
                  markerEnd={`url(#arrow-${blitz ? "blitz" : "defense"})`}
                />
                {a.kind === "man" && (
                  <line
                    x1={d.spot.x}
                    y1={-d.spot.y}
                    x2={GUN_TREY[a.letter].x}
                    y2={-GUN_TREY[a.letter].y}
                    stroke={COLOR.defensePath}
                    strokeWidth={0.08}
                    strokeDasharray="0.25 0.35"
                  />
                )}
                <circle
                  cx={d.spot.x}
                  cy={-d.spot.y}
                  r={0.3}
                  fill={COLOR.startDot}
                />
              </g>
            );
          })}
      {frozen &&
        blocks
          .filter(({ rusher }) =>
            defense.defenders.some((d) => d.id === rusher && revealed(tier, d)),
          )
          .map(({ blocker, rusher }) => {
            const t = Math.min(releaseTick(rusher), rep.lastTick);
            const a = at(blocker, t);
            const b = at(rusher, t);
            return (
              <line
                key={`${blocker}-${rusher}`}
                x1={a.x}
                y1={-a.y}
                x2={b.x}
                y2={-b.y}
                stroke={COLOR.linemanStroke}
                strokeWidth={0.14}
              />
            );
          })}

      {/* The ball carrier's run after the catch, with each cut marked. */}
      {carrier && tick > carrier.fromTick && (
        <g>
          <polyline
            points={points(
              rep.tracks[carrier.letter].slice(carrier.fromTick, tick + 1),
            )}
            fill="none"
            stroke={RECEIVER[carrier.letter].ring}
            strokeWidth={0.12}
            strokeDasharray="0.4 0.25"
          />
          {cutTicks.map((t) => {
            const p = at(carrier.letter, t);
            return (
              <rect
                key={t}
                className="cut"
                x={p.x - 0.32}
                y={-p.y - 0.32}
                width={0.64}
                height={0.64}
                transform={`rotate(45 ${p.x} ${-p.y})`}
              />
            );
          })}
        </g>
      )}

      {flight && tick >= flight.throwTick && (
        <line
          x1={flight.from.x}
          y1={-flight.from.y}
          x2={flight.to.x}
          y2={-flight.to.y}
          stroke="#FFFFFF"
          strokeOpacity={0.7}
          strokeWidth={0.1}
          strokeDasharray="0.15 0.4"
        />
      )}

      {frozen &&
        ghosts &&
        rep.feedback
          .filter((f) => f.letter !== thrown)
          .map((f) => {
            const p = at(f.letter, f.tick);
            return (
              <g key={f.letter} className="ghost">
                <circle
                  cx={p.x}
                  cy={-p.y}
                  r={0.66}
                  fill="none"
                  stroke={RECEIVER[f.letter].ring}
                  strokeDasharray="0.2 0.15"
                />
                <text x={p.x} y={-p.y} dy="0.28">
                  {f.letter}
                </text>
              </g>
            );
          })}

      {/* Players on this tick. */}
      {LINEMEN.map((id) => {
        const p = at(id);
        return (
          <circle
            key={id}
            cx={p.x}
            cy={-p.y}
            r={0.62}
            fill={COLOR.lineman}
            stroke={COLOR.linemanStroke}
            strokeWidth={0.1}
          />
        );
      })}
      {defense.defenders.map((d) => {
        const p = at(d.id);
        return (
          <g key={d.id} className="defender">
            <circle
              cx={p.x}
              cy={-p.y}
              r={0.59}
              fill={COLOR.defenderFill}
              stroke={COLOR.defenderRing}
              strokeWidth={0.17}
            />
            <text x={p.x} y={-p.y} dy="0.2">
              {d.id}
            </text>
          </g>
        );
      })}
      {LETTERS.map((letter) => {
        const p = at(letter);
        return (
          <g key={letter} className="receiver">
            <circle
              cx={p.x}
              cy={-p.y}
              r={0.66}
              fill={COLOR.receiverFill}
              stroke={RECEIVER[letter].ring}
              strokeWidth={0.17}
            />
            <text x={p.x} y={-p.y} dy="0.26">
              {letter}
            </text>
          </g>
        );
      })}
      <g className="quarterback">
        <circle
          cx={at("QB").x}
          cy={-at("QB").y}
          r={0.66}
          fill={COLOR.quarterback}
        />
        <text x={at("QB").x} y={-at("QB").y} dy="0.26">
          QB
        </text>
      </g>
      <ellipse
        cx={rep.ball[Math.min(tick, rep.ball.length - 1)].x}
        cy={-rep.ball[Math.min(tick, rep.ball.length - 1)].y}
        rx={0.33}
        ry={0.21}
        fill={COLOR.football}
        stroke="#FFFFFF"
        strokeWidth={0.06}
      />

      {frozen && rep.cause.decisive && (
        <circle
          cx={at(rep.cause.decisive).x}
          cy={-at(rep.cause.decisive).y}
          r={1.25}
          fill="none"
          stroke={COLOR.gold}
          strokeWidth={0.2}
        />
      )}
      {frozen &&
        rep.feedback.map((f) => {
          const p = at(f.letter);
          const b = BADGE[f.badge];
          return (
            <g key={f.letter} className={`badge badge-${f.badge}`}>
              <circle
                cx={p.x + 0.75}
                cy={-p.y - 0.75}
                r={0.55}
                fill={b.fill}
                stroke={b.ring}
                strokeWidth={0.1}
              />
              <text x={p.x + 0.75} y={-p.y - 0.75} dy="0.25">
                {b.glyph}
              </text>
            </g>
          );
        })}
    </svg>
  );
}
