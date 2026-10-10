import { memo } from "react";
import type {
  Design,
  Engine,
  Letter,
  PlayerId,
  Puzzle,
  Rep,
  Vec,
} from "./engine/contract";
import { protectionCopy } from "./Protect";
import {
  fieldOrder,
  receiverColors,
  receiverLetters,
  routeRunners,
} from "./routes";

export function fieldPoint({ x, y }: Vec): Vec {
  return { x: 201.5 + (403 / 31.5) * x, y: 366 - 12.8 * y };
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

export const Field = memo(function Field({
  puzzle,
  engine,
  protection,
  routes = {},
  selected,
  onSelect,
  reads,
  frame,
  label,
}: {
  puzzle: Puzzle;
  engine: Engine;
  protection?: Design["protection"];
  routes?: Design["routes"];
  selected?: Letter;
  onSelect?: (letter: Letter) => void;
  reads?: readonly Letter[];
  frame?: Rep;
  label?: string;
}) {
  const { spot, down, distance } = puzzle.situation;
  const goalY = fieldPoint({ x: 0, y: 100 - spot }).y;
  const ownGoalY = fieldPoint({ x: 0, y: -spot }).y;
  const endY = goalY - 128;
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
    ? Object.entries(frame.tracks).map(
        ([id, track]) => [id, track[frame.endTick]] as const,
      )
    : Object.entries(positions);
  return (
    <svg
      className="puzzle-field"
      viewBox="0 0 403 495"
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
      <rect width="403" height="495" fill="#0F3A27" />
      {Array.from({ length: 20 }, (_, band) => {
        const y = fieldPoint({ x: 0, y: (band + 1) * 5 - spot }).y;
        const stripe = Math.min(band, 19 - band) % 2 === 1;
        return y < 495 && y + 64 > 0 ? (
          <rect
            key={band}
            x="0"
            y={Math.max(0, y)}
            width="403"
            height={Math.min(495, y + 64) - Math.max(0, y)}
            fill={stripe ? "#113F2A" : "#0F3A27"}
          />
        ) : null;
      })}
      {Array.from({ length: 99 }, (_, index) => {
        const yard = index + 1;
        const y = fieldPoint({ x: 0, y: yard - spot }).y;
        if (y < 0 || y > 495) return null;
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
      {goalY > 0 ? (
        <g data-field-layer="end-zone">
          <rect
            x="0"
            y={Math.max(0, endY)}
            width="403"
            height={Math.min(495, goalY) - Math.max(0, endY)}
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
      {ownGoalY < 495 ? (
        <g data-field-layer="own-end-zone">
          <rect
            x="0"
            y={ownGoalY}
            width="403"
            height={495 - ownGoalY}
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
      <path d="M0 0V495M403 0V495" stroke="#D5E0D9" strokeOpacity=".45" />
      {endY > 0 ? (
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
      <path
        data-field-layer="line-to-gain"
        d={`M0 ${lineY}H403`}
        stroke="#E2C044"
        strokeWidth={frame?.verdict === "converted" ? 3.5 : 2}
      />
      <path
        data-field-layer="scrimmage"
        d="M0 366H403"
        stroke="#3B8EEA"
        strokeWidth="2"
      />
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
      {players.map(([id, at]) => {
        const { x, y } = fieldPoint(at);
        const receiver = receivers[id];
        const letter = receiverLetters.find((letter) => letter === id);
        const lineman = ["LT", "LG", "C", "RG", "RT"].includes(id);
        const qb = id === "QB";
        return (
          <g key={id} data-player={id} transform={`translate(${x} ${y})`}>
            <circle
              r={receiver || qb ? 8.5 : lineman ? 8 : 7.5}
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
