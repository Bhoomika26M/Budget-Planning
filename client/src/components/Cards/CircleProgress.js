export default function CircleProgress({ pct, size = 80, stroke = 8, color = "#2E93C7" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg
      width={size}
      height={size}
      style={{
        transform: "rotate(-90deg)",
      }}
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E4EFF7" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{
          transition: "stroke-dasharray 0.6s ease",
        }}
      />
    </svg>
  );
}
