const receivers = [
  { x: 52, y: 422, color: "x", label: "WR" },
  { x: 258, y: 421, color: "y", label: "TE" },
  { x: 312, y: 442, color: "h", label: "WR" },
  { x: 372, y: 434, color: "z", label: "WR" },
  { x: 168, y: 482, color: "rb", label: "RB" },
];
const hashes = Array.from({ length: 6 }, (_, band) =>
  [12, 25, 38, 51]
    .map((offset) => {
      const y = 64 + band * 64 + offset;
      return `M136 ${y}H150M240 ${y}H254`;
    })
    .join(""),
).join("");

export function Hero() {
  return (
    <svg
      className="hero-field"
      viewBox="0 0 390 520"
      role="img"
      aria-label="A play drawn on the field: four receivers' routes and the running back's check-down"
    >
      <rect width="390" height="520" fill="var(--turf)" />
      <g fill="var(--turf-stripe)">
        {[0, 128, 256, 384].map((y) => (
          <rect key={y} y={y} width="390" height="64" />
        ))}
      </g>
      <path
        d="M0 64H390M0 128H390M0 192H390M0 256H390M0 320H390M0 384H390M0 448H390M0 512H390"
        stroke="var(--field-line)"
        strokeOpacity=".3"
      />
      <path d={hashes} stroke="var(--field-line)" strokeOpacity=".35" />
      <path
        d="M0 330H390"
        stroke="var(--first-down-line)"
        strokeWidth="2"
        strokeOpacity=".9"
      />
      <path
        d="M0 420H390"
        stroke="var(--scrimmage-line)"
        strokeWidth="2"
        strokeOpacity=".9"
      />
      <g
        fill="none"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M52 412V312H160M152 305L160 312L152 319"
          stroke="var(--receiver-x)"
        />
        <path
          d="M258 412V352L322 286M313 287L322 286L321 295"
          stroke="var(--receiver-y-route)"
        />
        <path
          d="M312 432V348H368M360 341L368 348L360 355"
          stroke="var(--receiver-h-route)"
        />
        <path
          d="M372 424V248M365 256L372 248L379 256"
          stroke="var(--receiver-z)"
        />
        <path
          d="M168 474L148 446M141 451L154 441"
          stroke="var(--receiver-rb)"
        />
      </g>
      <g fill="var(--lineman)" stroke="var(--lineman-stroke)" strokeWidth="1.2">
        {[153, 174, 195, 216, 237].map((x) => (
          <circle key={x} cx={x} cy="420" r="8" />
        ))}
      </g>
      <g fontSize="6.5" fontWeight="700" textAnchor="middle">
        {receivers.map(({ x, y, color, label }) => (
          <g key={color} transform={`translate(${x} ${y})`}>
            <circle
              r="8.5"
              fill="var(--receiver-fill)"
              stroke={`var(--receiver-${color})`}
              strokeWidth="2.2"
            />
            <text y="2.3" fill="var(--paper-white)">
              {label}
            </text>
          </g>
        ))}
        <g transform="translate(195 482)">
          <circle r="8.5" fill="var(--quarterback)" />
          <text y="2.3" fill="var(--quarterback-text)">
            QB
          </text>
        </g>
      </g>
    </svg>
  );
}
