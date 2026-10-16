// Ring chart drawn in SVG: each slice is a circle stroke with a dash as long as its share
const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
// Small gap between slices so neighbours stay apart
const GAP = 1.5;

export default function DonutChart({ slices, centerLabel, centerValue }) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  let offset = 0;

  return (
    <svg className="donut" viewBox="0 0 120 120" role="img" aria-label={`${centerLabel} ${centerValue}`}>
      <circle className="donut-track" cx="60" cy="60" r={RADIUS} fill="none" strokeWidth="14" />
      {total > 0 &&
        slices.map((slice, i) => {
          const length = (slice.value / total) * CIRCUMFERENCE;
          const visible = Math.max(length - (slices.length > 1 ? GAP : 0), 0.5);
          const circle = (
            <circle
              key={slice.id}
              className="donut-slice"
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke={slice.color}
              strokeWidth="14"
              strokeDasharray={`${visible} ${CIRCUMFERENCE - visible}`}
              strokeDashoffset={-offset}
              style={{ animationDelay: `${i * 80}ms` }}
              transform="rotate(-90 60 60)"
            />
          );
          offset += length;
          return circle;
        })}
      <text className="donut-label" x="60" y="54" textAnchor="middle">
        {centerLabel}
      </text>
      <text className="donut-value" x="60" y="72" textAnchor="middle">
        {centerValue}
      </text>
    </svg>
  );
}
