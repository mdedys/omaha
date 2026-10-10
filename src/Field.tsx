import { memo } from "react";
import type { ReactNode } from "react";
import type {
  Badge,
  DefenderId,
  DefensePlayArt,
  Design,
  Engine,
  Letter,
  PlayerId,
  Puzzle,
  Rep,
  Vec,
  ZoneId,
} from "./engine/contract";
import type { Playback } from "./playback";
import { protectionCopy } from "./Protect";
import {
  fieldOrder,
  receiverColors,
  receiverLetters,
  routeRunners,
} from "./routes";

const unitsPerYardX = 403 / 31.5;
const unitsPerYardY = 12.8;

export function fieldPoint({ x, y }: Vec): Vec {
  return { x: 201.5 + unitsPerYardX * x, y: 366 - unitsPerYardY * y };
}

const receivers: Record<string, { color: string; label: string }> = {
  X: { color: "#EAC54F", label: "WR" },
  Y: { color: "#8E73F2", label: "TE" },
  H: { color: "#F0607A", label: "WR" },
  Z: { color: "#55AEF5", label: "WR" },
  RB: { color: "#5BDB8C", label: "RB" },
};
const shirts = [
  "#C9572A",
  "#A8481F",
  "#C9572A",
  "#A8481F",
  "#E8E1D2",
  "#B9AE99",
  "#18201C",
  "#2E5E4F",
  "#5A6B62",
];
const heads = ["#E3BF98", "#C6956A", "#946042", "#5E3B26"];
// Seat coordinates are anchored to the field, not to the viewport.
const crowd = Array.from({ length: 18 }, (_, row) =>
  Array.from({ length: 321 }, (_, index) => {
    const column = index - 160;
    const hash = (((row + 1) * 73856093) ^ (column * 19349663)) >>> 0;
    return { row, column, hash, x: column * 12.8 + (row % 2) * 6.4 };
  }),
).flat();

function ProtectionArt({
  positions,
  protection,
  showSlide = true,
}: {
  positions: Record<PlayerId, Vec>;
  protection: Design["protection"];
  showSlide?: boolean;
}) {
  const line = ["LT", "LG", "C", "RG", "RT"] as const;
  const points = line.map((id) => fieldPoint(positions[id]));
  const left = Math.min(...points.map((point) => point.x)) - 12;
  const right = Math.max(...points.map((point) => point.x)) + 12;
  const y = points[2].y + 27;
  const slides = protection.lineCall !== "man";
  const direction = protection.lineCall === "slide-left" ? -1 : 1;
  const end = direction === -1 ? left : right;
  const blocking: PlayerId[] = [...line];
  if (protection.blockers === 7) blocking.push("Y");
  if (protection.blockers > 5) blocking.push("RB");
  return (
    <g
      data-field-layer="protection"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {slides && showSlide ? (
        <path
          data-protection="slide"
          d={`M${direction === -1 ? right : left} ${y}H${end}M${end - direction * 6} ${y - 6}L${end} ${y}L${end - direction * 6} ${y + 6}`}
          stroke="#DADDE0"
        />
      ) : null}
      {blocking.map((id) => {
        const at = positions[id];
        const { x, y: playerY } = fieldPoint(at);
        const color = id === "RB" ? "#5BDB8C" : "#DADDE0";
        if (!slides) {
          return (
            <path
              key={id}
              data-protection={id}
              d={`M${x} ${playerY - 30}V${playerY - 12}M${x - 6} ${playerY - 12}H${x + 6}`}
              stroke={color}
            />
          );
        }
        if (id === "RB") {
          const edgeX = direction === -1 ? right : left;
          const edgeY = points[2].y + 20;
          const dx = edgeX - x;
          const dy = edgeY - playerY;
          const length = Math.hypot(dx, dy);
          const capX = (-dy / length) * 6;
          const capY = (dx / length) * 6;
          return (
            <path
              key={id}
              data-protection="RB"
              d={`M${x} ${playerY}L${edgeX} ${edgeY}M${edgeX - capX} ${edgeY - capY}L${edgeX + capX} ${edgeY + capY}`}
              stroke={color}
            />
          );
        }
        if (id === "Y") {
          return (
            <path
              key={id}
              data-protection="Y"
              d={`M${x - direction * 10} ${playerY + 27}H${x + direction * 10}M${x + direction * 4} ${playerY + 21}L${x + direction * 10} ${playerY + 27}L${x + direction * 4} ${playerY + 33}`}
              stroke={color}
            />
          );
        }
        return null;
      })}
    </g>
  );
}

const linemen: readonly string[] = ["LT", "LG", "C", "RG", "RT"];

function playerRadius(id: string) {
  return receivers[id] || id === "QB" ? 8.5 : linemen.includes(id) ? 8 : 7.5;
}

const zoneDeep = "#3D7BFF";
const zoneFlat = "#7FD8FF";
const zoneHook = "#FFD84A";
const zoneCurlFlat = "#B57CFF";
const zoneColors: Record<ZoneId, string> = {
  "deep-half-L": zoneDeep,
  "deep-half-R": zoneDeep,
  "deep-third-L": zoneDeep,
  "deep-third-M": zoneDeep,
  "deep-third-R": zoneDeep,
  "deep-quarter-1": zoneDeep,
  "deep-quarter-2": zoneDeep,
  "deep-quarter-3": zoneDeep,
  "deep-quarter-4": zoneDeep,
  "deep-middle": zoneDeep,
  "hook-L": zoneHook,
  "hook-M": zoneHook,
  "hook-R": zoneHook,
  "curl-flat-L": zoneCurlFlat,
  "curl-flat-R": zoneCurlFlat,
  "flat-L": zoneFlat,
  "flat-R": zoneFlat,
};
const defensePath = "#C4CFC8";
const startDot = "#7E8B85";
const arrowArm = (38 * Math.PI) / 180;

// Shortens a polyline by `by` units measured back from its end, so a path
// stops outside the defender's disc. Null when nothing would be left.
function trimEnd(points: readonly Vec[], by: number): Vec[] | null {
  const kept = points.filter(
    (point, index) =>
      index === 0 ||
      point.x !== points[index - 1].x ||
      point.y !== points[index - 1].y,
  );
  let left = by;
  while (kept.length > 1) {
    const end = kept[kept.length - 1];
    const before = kept[kept.length - 2];
    const length = Math.hypot(end.x - before.x, end.y - before.y);
    if (length > left) {
      kept[kept.length - 1] = {
        x: end.x + ((before.x - end.x) * left) / length,
        y: end.y + ((before.y - end.y) * left) / length,
      };
      return kept;
    }
    left -= length;
    kept.pop();
  }
  return null;
}

type PathStyle = {
  kind: "drop" | "man" | "rush" | "blitz";
  color: string;
  width: number;
};

// Interior linemen engaged at the line get no path: a lineman's rush is drawn
// only when he is the sacker.
function pathStyle(
  id: DefenderId,
  rep: Rep,
  playArt: DefensePlayArt,
): PathStyle | null {
  switch (playArt.assignments[id]) {
    case "zone": {
      const zone = playArt.zones.find((entry) => entry.defenderId === id);
      return zone
        ? { kind: "drop", color: zoneColors[zone.zone], width: 1.8 }
        : null;
    }
    case "man":
      return { kind: "man", color: defensePath, width: 1.8 };
    case "rush":
      if (!id.startsWith("DL")) {
        return { kind: "blitz", color: "#E05A2B", width: 2.4 };
      }
      return rep.outcome.kind === "sack" && rep.cause.decisive === id
        ? { kind: "rush", color: defensePath, width: 1.8 }
        : null;
    case undefined:
      return null;
  }
}

const layers: readonly PathStyle["kind"][] = ["drop", "man", "rush", "blitz"];

// An interception's football stays at full opacity while the rest fades in,
// because the live play leaves it on the field.
function PlayArt({
  puzzle,
  rep,
  playArt,
  fade,
}: {
  puzzle: Puzzle;
  rep: Rep;
  playArt: DefensePlayArt;
  fade?: number;
}) {
  const paths = puzzle.defense
    .flatMap(({ id }) => {
      const style = pathStyle(id, rep, playArt);
      const track = rep.tracks[id].slice(0, rep.endTick + 1).map(fieldPoint);
      const points = style ? trimEnd(track, 10.5) : null;
      return style && points ? [{ id, style, start: track[0], points }] : [];
    })
    .sort(
      (a, b) => layers.indexOf(a.style.kind) - layers.indexOf(b.style.kind),
    );
  const ball = rep.ball
    ? { from: fieldPoint(rep.ball.from), to: fieldPoint(rep.ball.to) }
    : null;
  return (
    <g data-field-layer="play-art" fill="none">
      {ball ? (
        <path
          data-ball-path=""
          opacity={fade}
          d={`M${ball.from.x} ${ball.from.y}L${ball.to.x} ${ball.to.y}`}
          stroke="#F2F5F3"
          strokeOpacity=".7"
          strokeWidth="1.8"
          strokeDasharray="2 5"
          strokeLinecap="round"
        />
      ) : null}
      {ball && rep.outcome.kind === "interception" ? (
        <ellipse
          data-football=""
          cx={ball.to.x}
          cy={ball.to.y}
          rx="4.2"
          ry="2.7"
          transform={`rotate(${(Math.atan2(ball.to.y - ball.from.y, ball.to.x - ball.from.x) * 180) / Math.PI} ${ball.to.x} ${ball.to.y})`}
          fill="#8B5A2B"
          stroke="#F2F5F3"
          strokeWidth="0.8"
        />
      ) : null}
      {playArt.zones.map(({ defenderId, zone, center, radii }) => {
        const { x, y } = fieldPoint(center);
        return (
          <ellipse
            key={defenderId}
            data-zone={zone}
            opacity={fade}
            cx={x}
            cy={y}
            rx={radii.x * unitsPerYardX}
            ry={radii.y * unitsPerYardY}
            fill={zoneColors[zone]}
            fillOpacity=".3"
            stroke={zoneColors[zone]}
            strokeOpacity=".85"
            strokeWidth="1.4"
          />
        );
      })}
      {paths.map(({ id, start }) => (
        <circle
          key={id}
          data-start-dot={id}
          opacity={fade}
          cx={start.x}
          cy={start.y}
          r="3"
          stroke={startDot}
          strokeWidth="1.2"
        />
      ))}
      {paths.map(({ id, style, points }) => {
        const end = points[points.length - 1];
        const before = points[points.length - 2];
        const angle = Math.atan2(end.y - before.y, end.x - before.x);
        const arm = (offset: number) =>
          `${end.x - 5 * Math.cos(angle + offset)} ${end.y - 5 * Math.sin(angle + offset)}`;
        return (
          <path
            key={id}
            data-defense-path={id}
            opacity={fade}
            data-path-kind={style.kind}
            d={`M${points.map((point) => `${point.x} ${point.y}`).join("L")}${style.kind === "drop" ? "" : `M${arm(-arrowArm)}L${end.x} ${end.y}L${arm(arrowArm)}`}`}
            stroke={style.color}
            strokeWidth={style.width}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </g>
  );
}

function BadgeGlyph({ badge }: { badge: Badge }) {
  switch (badge) {
    case "open":
      return (
        <>
          <circle r="7" fill="#F2F5F3" />
          <path
            d="M-3.2 0.2L-1 2.5L3.3 -2.3"
            fill="none"
            stroke="#0A1410"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      );
    case "contested":
      return (
        <>
          <circle r="7" fill="#0A1410" stroke="#F2F5F3" strokeWidth="1.5" />
          <path
            d="M-3.6 0.6Q-1.8 -2.2 0 0.4T3.6 0"
            fill="none"
            stroke="#F2F5F3"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      );
    case "covered":
      return (
        <>
          <circle r="7" fill="#0A1410" stroke={startDot} strokeWidth="1.5" />
          <path
            d="M-2.6 -2.6L2.6 2.6M2.6 -2.6L-2.6 2.6"
            stroke="#F2F5F3"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      );
  }
}

// Each badge sits up-right of its receiver and flips up-left when that spot
// would leave the field or cover a player, the football or an earlier badge.
function FeedbackBadges({ rep, fade }: { rep: Rep; fade?: number }) {
  const players = Object.entries(rep.tracks).map(
    ([id, track]) => [id, fieldPoint(track[rep.endTick])] as const,
  );
  const football =
    rep.ball && rep.outcome.kind === "interception"
      ? fieldPoint(rep.ball.to)
      : null;
  const placed: Vec[] = [];
  return (
    <g data-field-layer="feedback" opacity={fade}>
      {rep.feedback.map(({ letter, badge }) => {
        const at = fieldPoint(rep.tracks[letter][rep.endTick]);
        const y = Math.min(Math.max(at.y - 11, 7), 488);
        const clear = (x: number) =>
          x + 7 <= 403 &&
          players.every(
            ([id, player]) =>
              Math.hypot(player.x - x, player.y - y) >= 7 + playerRadius(id),
          ) &&
          placed.every((badge) => Math.hypot(badge.x - x, badge.y - y) >= 14) &&
          (!football || Math.hypot(football.x - x, football.y - y) >= 11.2);
        const x = Math.min(
          Math.max(clear(at.x + 11) ? at.x + 11 : at.x - 11, 7),
          396,
        );
        placed.push({ x, y });
        return (
          <g
            key={letter}
            data-feedback-badge={letter}
            data-badge={badge}
            transform={`translate(${x} ${y})`}
          >
            <BadgeGlyph badge={badge} />
          </g>
        );
      })}
    </g>
  );
}

// Turf, markings, end zones and stands between field y `top` and `bottom`.
const Turf = memo(function Turf({
  puzzle,
  top,
  bottom,
}: {
  puzzle: Puzzle;
  top: number;
  bottom: number;
}) {
  const { spot } = puzzle.situation;
  const goalY = fieldPoint({ x: 0, y: 100 - spot }).y;
  const ownGoalY = fieldPoint({ x: 0, y: -spot }).y;
  const endY = goalY - 128;
  return (
    <>
      <rect y={top} width="403" height={bottom - top} fill="#0F3A27" />
      {Array.from({ length: 20 }, (_, band) => {
        const y = fieldPoint({ x: 0, y: (band + 1) * 5 - spot }).y;
        const stripe = Math.min(band, 19 - band) % 2 === 1;
        return y < bottom && y + 64 > top ? (
          <rect
            key={band}
            x="0"
            y={Math.max(top, y)}
            width="403"
            height={Math.min(bottom, y + 64) - Math.max(top, y)}
            fill={stripe ? "#113F2A" : "#0F3A27"}
          />
        ) : null;
      })}
      {Array.from({ length: 99 }, (_, index) => {
        const yard = index + 1;
        const y = fieldPoint({ x: 0, y: yard - spot }).y;
        if (y < top || y > bottom) return null;
        return (
          <g key={yard} stroke="#D5E0D9" strokeOpacity=".45">
            {yard % 5 === 0 ? <path d={`M0 ${y}H403`} /> : null}
            <path d={`M141 ${y}H155M247 ${y}H261`} />
            {yard % 10 === 0 ? (
              <g
                fill="#A7B2AC"
                fillOpacity=".8"
                stroke="none"
                fontSize="18"
                fontWeight="800"
                textAnchor="middle"
              >
                <text x="51.2" y={y - 8}>
                  {Math.min(yard, 100 - yard)}
                </text>
                <text x="351.8" y={y - 8}>
                  {Math.min(yard, 100 - yard)}
                </text>
              </g>
            ) : null}
          </g>
        );
      })}
      {goalY > top ? (
        <g data-field-layer="end-zone">
          <rect
            x="0"
            y={Math.max(top, endY)}
            width="403"
            height={Math.min(bottom, goalY) - Math.max(top, endY)}
            fill="#6E2F16"
          />
          <text
            x="201.5"
            y={endY + 86}
            textAnchor="middle"
            fontSize="70"
            fontWeight="900"
            letterSpacing="3"
            fill="#F59A72"
            fillOpacity=".16"
          >
            OMAHA
          </text>
          {puzzle.goal !== "touchdown" ? (
            <path
              d={`M0 ${goalY}H403`}
              stroke="#D5E0D9"
              strokeOpacity=".85"
              strokeWidth="2"
            />
          ) : null}
        </g>
      ) : null}
      {ownGoalY < bottom ? (
        <g data-field-layer="own-end-zone">
          <rect
            x="0"
            y={ownGoalY}
            width="403"
            height={bottom - ownGoalY}
            fill="#6E2F16"
          />
          <text
            x="201.5"
            y={ownGoalY + 86}
            textAnchor="middle"
            transform={`rotate(180 201.5 ${ownGoalY + 64})`}
            fontSize="70"
            fontWeight="900"
            letterSpacing="3"
            fill="#F59A72"
            fillOpacity=".16"
          >
            OMAHA
          </text>
          <path
            d={`M0 ${ownGoalY}H403`}
            stroke="#D5E0D9"
            strokeOpacity=".85"
            strokeWidth="2"
          />
        </g>
      ) : null}
      <path
        d={`M0 ${top}V${bottom}M403 ${top}V${bottom}`}
        stroke="#D5E0D9"
        strokeOpacity=".45"
      />
      {endY > top ? (
        <g data-field-layer="stadium">
          <rect
            x="-10000"
            y="-1000"
            width="20403"
            height={endY + 1000}
            fill="#0C3322"
          />
          <g data-field-layer="crowd" opacity=".6" shapeRendering="crispEdges">
            {crowd.map(({ row, column, hash, x }) => {
              const y = endY - 30.4 - (row + 1) * 16;
              return (
                <g key={`${row}:${column}`}>
                  <rect
                    x={x}
                    y={y}
                    width="12.8"
                    height="16"
                    fill={row % 2 ? "#0A2D1E" : "#0C3322"}
                  />
                  {hash % 100 >= 14 ? (
                    <>
                      <rect
                        x={x + 3.2}
                        y={y + 3.2}
                        width="6.4"
                        height="6.4"
                        fill={heads[hash % heads.length]}
                      />
                      <rect
                        x={x}
                        y={y + 9.6}
                        width="9.6"
                        height="6.4"
                        fill={shirts[(hash >>> 8) % shirts.length]}
                      />
                    </>
                  ) : null}
                </g>
              );
            })}
          </g>
          <rect
            data-field-layer="wall"
            x="-10000"
            y={endY - 30.4}
            width="20403"
            height="4.8"
            fill="#071710"
          />
          <rect
            data-field-layer="path"
            x="-10000"
            y={endY - 25.6}
            width="20403"
            height="25.6"
            fill="#454B47"
          />
          <path
            data-field-layer="end-line"
            d={`M0 ${endY}H403`}
            stroke="#D5E0D9"
            strokeOpacity=".85"
            strokeWidth="2"
          />
        </g>
      ) : null}
    </>
  );
});

export const Field = memo(function Field({
  puzzle,
  engine,
  protection,
  routes = {},
  selected,
  onSelect,
  reads,
  frame,
  reveal,
  live,
  ballPath,
  pan,
  label,
  children,
}: {
  puzzle: Puzzle;
  engine: Engine;
  protection?: Design["protection"];
  routes?: Design["routes"];
  selected?: Letter;
  onSelect?: (letter: Letter) => void;
  reads?: readonly Letter[];
  frame?: { rep: Rep; playArt: DefensePlayArt };
  // Opacity of the frame's play art, badges and converted line while they
  // fade in.
  reveal?: number;
  live?: Playback;
  // Draws the live ball's dashed path from its release point.
  ballPath?: boolean;
  // Phone camera from the live framing (0) to the result framing (1).
  pan?: number;
  label?: string;
  // Markings drawn over the turf and lines, under the routes and players.
  children?: ReactNode;
}) {
  const { spot, down, distance } = puzzle.situation;
  const targetYards = puzzle.goal === "touchdown" ? 100 - spot : distance;
  const lineY = fieldPoint({ x: 0, y: targetYards }).y;
  const ordinal = ["", "1st", "2nd", "3rd", "4th"][down];
  const location = spot <= 50 ? `own ${spot}` : `opponent ${100 - spot}`;
  const situation = `${ordinal} and ${distance >= 100 - spot ? "goal" : distance}, ${location}`;
  const positions = engine.preSnap(puzzle);
  const copy = protection ? protectionCopy(protection) : null;
  const runners = protection ? routeRunners(protection) : [];
  const ordered = fieldOrder(positions, runners);
  const call = selected ? routes[selected] : undefined;
  const selectionCopy = selected
    ? ` Selected ${engine.displayName(puzzle, selected).name}, ${call ? `${call.route}${"depth" in call ? `, ${call.depth} yards` : ", no depth"}` : "no route"}.`
    : "";
  const readCopy = reads
    ? reads.length
      ? ` Read order ${reads.map((letter) => engine.displayName(puzzle, letter).name).join(", then ")}.`
      : " No reads picked."
    : "";
  const drawRoutes = selected !== undefined || reads !== undefined;
  const players = frame
    ? Object.entries(frame.rep.tracks).map(
        ([id, track]) => [id, track[frame.rep.endTick]] as const,
      )
    : live
      ? live.players
      : Object.entries(positions);
  const qb = live?.players.find(([id]) => id === "QB")?.[1];
  const converted = frame?.rep.verdict === "converted";
  const extent =
    pan === undefined ? { top: 0, bottom: 495 } : { top: -180, bottom: 872 };
  return (
    <svg
      className="puzzle-field"
      viewBox={
        pan === undefined ? "0 0 403 495" : `0 ${-180 * (1 - pan)} 403 872`
      }
      style={pan === undefined ? undefined : { aspectRatio: "403 / 872" }}
      role={selected ? "group" : "img"}
      aria-label={
        label ??
        `Field: ${situation}. Pre-snap offense and defense; blue line of scrimmage, yellow line to gain.${protection && copy ? ` ${protection.blockers}-man protection. ${copy.blockersHelper}. ${copy.lineHelper}${copy.lineHelper.endsWith(".") ? "" : "."}` : ""}${selectionCopy}${readCopy}`
      }
      overflow="visible"
      onClick={
        onSelect
          ? (event) => {
              const matrix = event.currentTarget.getScreenCTM();
              if (!matrix) return;
              const point = new DOMPoint(
                event.clientX,
                event.clientY,
              ).matrixTransform(matrix.inverse());
              let nearest: Letter | undefined;
              let distance = 23;
              for (const letter of ordered) {
                const at = fieldPoint(positions[letter]);
                const candidate = Math.hypot(point.x - at.x, point.y - at.y);
                if (candidate <= distance) {
                  nearest = letter;
                  distance = candidate;
                }
              }
              if (nearest) onSelect(nearest);
            }
          : undefined
      }
    >
      <Turf puzzle={puzzle} top={extent.top} bottom={extent.bottom} />
      <path
        data-field-layer="line-to-gain"
        d={`M0 ${lineY}H403`}
        stroke="#E2C044"
        strokeWidth={converted && reveal === undefined ? 3.5 : 2}
      />
      {converted && reveal !== undefined ? (
        <path
          data-field-layer="converted-line"
          d={`M0 ${lineY}H403`}
          stroke="#E2C044"
          strokeWidth="3.5"
          opacity={reveal}
        />
      ) : null}
      <path
        data-field-layer="scrimmage"
        d="M0 366H403"
        stroke="#3B8EEA"
        strokeWidth="2"
      />
      {children}
      {drawRoutes
        ? runners.map((letter) => {
            const route = routes[letter];
            if (!route) return null;
            const points = engine
              .routePath(puzzle, letter, route)
              .points.map(fieldPoint);
            if (letter === "RB") points.unshift(fieldPoint(positions.RB));
            const start = points[0];
            const next = points[1];
            const firstLength = Math.hypot(next.x - start.x, next.y - start.y);
            const trim = Math.min(10, firstLength);
            const trimmed = {
              x: start.x + ((next.x - start.x) * trim) / firstLength,
              y: start.y + ((next.y - start.y) * trim) / firstLength,
            };
            const last = points[points.length - 1];
            const before = points[points.length - 2];
            const angle = Math.atan2(last.y - before.y, last.x - before.x);
            const head = (offset: number) =>
              `${last.x - 9 * Math.cos(angle + offset)} ${last.y - 9 * Math.sin(angle + offset)}`;
            return (
              <path
                key={letter}
                data-route={letter}
                d={`M${trimmed.x} ${trimmed.y}${points
                  .slice(1)
                  .map((point) => `L${point.x} ${point.y}`)
                  .join("")}M${head(-0.7)}L${last.x} ${last.y}L${head(0.7)}`}
                fill="none"
                stroke={receiverColors[letter].route}
                strokeWidth={
                  (reads ? reads.includes(letter) : letter === selected)
                    ? 2.4
                    : 2
                }
                opacity={reads || letter === selected ? 1 : 0.45}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })
        : null}
      {protection ? (
        <ProtectionArt
          positions={positions}
          protection={protection}
          showSlide={!drawRoutes}
        />
      ) : null}
      {selected ? (
        <circle
          data-selection={selected}
          cx={fieldPoint(positions[selected]).x}
          cy={fieldPoint(positions[selected]).y}
          r="14"
          fill="none"
          stroke="#F4B13E"
          strokeWidth="1.6"
        />
      ) : null}
      {reads?.map((letter) => (
        <circle
          key={letter}
          data-read-ring={letter}
          cx={fieldPoint(positions[letter]).x}
          cy={fieldPoint(positions[letter]).y}
          r="14"
          fill="none"
          stroke="#F4B13E"
          strokeWidth="1.6"
        />
      ))}
      {frame ? (
        <PlayArt
          puzzle={puzzle}
          rep={frame.rep}
          playArt={frame.playArt}
          fade={reveal}
        />
      ) : null}
      {live?.cone && qb ? (
        <g
          data-vision-cone={live.read}
          transform={`translate(${fieldPoint(qb).x} ${fieldPoint(qb).y}) rotate(${live.cone.angle})`}
          opacity={live.cone.opacity}
        >
          <linearGradient id="vision-cone">
            <stop offset="0" stopColor="#F4B13E" stopOpacity=".7" />
            <stop offset="1" stopColor="#F4B13E" stopOpacity="0" />
          </linearGradient>
          <path d="M0 0L176 -41L176 41Z" fill="url(#vision-cone)" />
        </g>
      ) : null}
      {ballPath && live?.ball ? (
        <path
          data-ball-path=""
          d={`M${fieldPoint(live.ball.from).x} ${fieldPoint(live.ball.from).y}L${fieldPoint(live.ball.at).x} ${fieldPoint(live.ball.at).y}`}
          fill="none"
          stroke="#F2F5F3"
          strokeWidth="1.8"
          strokeDasharray="2 5"
          strokeLinecap="round"
        />
      ) : null}
      {players.map(([id, at]) => {
        const { x, y } = fieldPoint(at);
        const receiver = receivers[id];
        const letter = receiverLetters.find((letter) => letter === id);
        const lineman = linemen.includes(id);
        const qb = id === "QB";
        return (
          <g key={id} data-player={id} transform={`translate(${x} ${y})`}>
            <circle
              r={playerRadius(id)}
              fill={
                receiver
                  ? "#0E2219"
                  : qb
                    ? "#F2F5F3"
                    : lineman
                      ? "#A4AAAF"
                      : "#071710"
              }
              stroke={
                receiver
                  ? receiver.color
                  : qb
                    ? "none"
                    : lineman
                      ? "#DADDE0"
                      : "#F4EFE4"
              }
              strokeWidth={lineman ? 1.2 : 2.2}
            />
            {receiver || qb ? (
              <text
                y="2.3"
                textAnchor="middle"
                fontSize="6.5"
                fontWeight="700"
                fill={qb ? "#0A1410" : "#FFFFFF"}
              >
                {qb
                  ? "QB"
                  : letter
                    ? engine.displayName(puzzle, letter).short
                    : receiver?.label}
              </text>
            ) : null}
          </g>
        );
      })}
      {live?.ball ? (
        <ellipse
          data-football="in-flight"
          cx={fieldPoint(live.ball.at).x}
          cy={fieldPoint(live.ball.at).y}
          rx="4.2"
          ry="2.7"
          transform={`rotate(${live.ball.angle} ${fieldPoint(live.ball.at).x} ${fieldPoint(live.ball.at).y})`}
          fill="#8B5A2B"
          stroke="#F2F5F3"
          strokeWidth="0.8"
        />
      ) : null}
      {frame ? <FeedbackBadges rep={frame.rep} fade={reveal} /> : null}
      {reads?.map((letter, index) => {
        const { x, y } = fieldPoint(positions[letter]);
        return (
          <g
            key={letter}
            data-read-badge={letter}
            transform={`translate(${x + 19.5 > 402 ? x - 13 : x + 13} ${y - 13})`}
          >
            <circle r="6.5" fill="#F4B13E" />
            <text
              y="2.4"
              textAnchor="middle"
              fontSize="8"
              fontWeight="700"
              fill="#0A1410"
            >
              {index + 1}
            </text>
          </g>
        );
      })}
      {onSelect
        ? ordered.map((letter) => {
            const at = fieldPoint(positions[letter]);
            const route = routes[letter];
            return (
              <circle
                key={letter}
                data-receiver-hit={letter}
                cx={at.x}
                cy={at.y}
                r="23"
                fill="transparent"
                role="button"
                tabIndex={0}
                aria-pressed={selected === letter}
                aria-label={`${engine.displayName(puzzle, letter).name}, ${route ? `${route.route}${"depth" in route ? `, ${route.depth} yards` : ""}` : "no route"}`}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(letter);
                  }
                }}
              />
            );
          })
        : null}
    </svg>
  );
});
