const COMPASS_TICKS = [
  ["12", "1", "12", "3.5", "1"],
  ["15.5", "2.2", "14.6", "4.3", "0.5"],
  ["18.5", "4.5", "16.7", "6", "1"],
  ["20.8", "7.5", "18.7", "8.4", "0.5"],
  ["22", "12", "19.5", "12", "1"],
  ["20.8", "16.5", "18.7", "15.6", "0.5"],
  ["18.5", "19.5", "16.7", "18", "1"],
  ["15.5", "21.8", "14.6", "19.7", "0.5"],
  ["12", "23", "12", "20.5", "1"],
  ["8.5", "21.8", "9.4", "19.7", "0.5"],
  ["5.5", "19.5", "7.3", "18", "1"],
  ["3.2", "16.5", "5.3", "15.6", "0.5"],
  ["2", "12", "4.5", "12", "1"],
  ["3.2", "7.5", "5.3", "8.4", "0.5"],
  ["5.5", "4.5", "7.3", "6", "1"],
  ["8.5", "2.2", "9.4", "4.3", "0.5"],
] as const;

export function CompassIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle
        cx="12"
        cy="12"
        r="11"
        fill="rgba(34, 34, 34, 0.14)"
        stroke="#444444"
        strokeWidth="1"
      />

      {COMPASS_TICKS.map(([x1, y1, x2, y2, strokeWidth]) => (
        <line
          key={`${x1}-${y1}-${x2}-${y2}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#FFFFFF"
          strokeWidth={strokeWidth}
        />
      ))}

      <path
        d="M12 1L14.5 4L9.5 4L12 1Z"
        fill="#FF4444"
        stroke="#FF4444"
        strokeWidth="0.5"
      />
      <circle
        cx="12"
        cy="12"
        r="1"
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth="0.5"
      />
      <line x1="12" y1="9" x2="12" y2="15" stroke="#FFFFFF" strokeWidth="0.5" />
      <line x1="9" y1="12" x2="15" y2="12" stroke="#FFFFFF" strokeWidth="0.5" />
    </svg>
  );
}
