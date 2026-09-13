import { cn } from "@/lib/utils";

const seeded = (seed) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return Math.round((x - Math.floor(x)) * 1000) / 1000;
};

const candles = Array.from({ length: 26 }, (_, i) => {
  const t = i / 25;
  const x = 240 + t * 820;
  const baseY = 660 - t * 580;
  const offset = (seeded(i + 3) - 0.5) * 110;
  const height = 36 + seeded(i + 11) * 90;
  const width = 22 + seeded(i + 19) * 12;
  const wick = 20 + seeded(i + 29) * 50;
  return {
    x,
    y: baseY + offset - height / 2,
    width,
    height,
    wick,
    hollow: seeded(i + 37) > 0.62,
    opacity: 0.45 + seeded(i + 41) * 0.55,
  };
});

export const CandleBackdrop = ({ className }) => (
  <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
    <svg viewBox="0 0 1440 640" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      <defs>
        <radialGradient id="hero-ambient" cx="72%" cy="30%" r="70%">
          <stop offset="0" stopColor="#7a1d05" stopOpacity="0.9" />
          <stop offset="0.45" stopColor="#2a0902" stopOpacity="0.8" />
          <stop offset="1" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="candle-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb347" />
          <stop offset="0.5" stopColor="#ff5a14" />
          <stop offset="1" stopColor="#b3210a" />
        </linearGradient>
        <linearGradient id="streak" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#ff3d00" stopOpacity="0" />
          <stop offset="0.35" stopColor="#ff6a1a" />
          <stop offset="0.75" stopColor="#ffd36b" />
          <stop offset="1" stopColor="#ff5a14" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ff4d0d" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ff7a2a" />
          <stop offset="1" stopColor="#ff4d0d" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="bottom-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.6" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <filter id="glow-lg" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <filter id="glow-md" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="glow-sm" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>
      <rect width="1440" height="640" fill="url(#hero-ambient)" />
      <g filter="url(#glow-lg)" opacity="0.7">
        {candles.map((c, i) => (
          <rect key={i} x={c.x} y={c.y} width={c.width} height={c.height} fill="#ff5a14" opacity={c.opacity * 0.6} />
        ))}
      </g>
      <g>
        {candles.map((c, i) => (
          <g key={i} opacity={c.opacity}>
            <line
              x1={c.x + c.width / 2}
              x2={c.x + c.width / 2}
              y1={c.y - c.wick}
              y2={c.y + c.height + c.wick * 0.6}
              stroke="#ff7a2a"
              strokeWidth="1.5"
            />
            {c.hollow ? (
              <rect x={c.x} y={c.y} width={c.width} height={c.height} fill="#1a0602" stroke="#ff6a1a" strokeWidth="1.5" />
            ) : (
              <rect x={c.x} y={c.y} width={c.width} height={c.height} fill="url(#candle-fill)" />
            )}
          </g>
        ))}
      </g>
      <path d="M180 700 C 480 520, 760 360, 1060 60" stroke="url(#streak)" strokeWidth="26" fill="none" filter="url(#glow-lg)" />
      <path d="M180 700 C 480 520, 760 360, 1060 60" stroke="url(#streak)" strokeWidth="6" fill="none" filter="url(#glow-md)" />
      <path d="M180 700 C 480 520, 760 360, 1060 60" stroke="#fff1c9" strokeWidth="1.5" fill="none" filter="url(#glow-sm)" />
      <path d="M860 -10 C 1080 60, 1260 100, 1460 140" stroke="url(#beam)" strokeWidth="18" fill="none" filter="url(#glow-lg)" />
      <path d="M860 -10 C 1080 60, 1260 100, 1460 140" stroke="#ffc58a" strokeWidth="2" fill="none" filter="url(#glow-sm)" />
      <circle cx="1045" cy="95" r="60" fill="#ffb347" opacity="0.35" filter="url(#glow-lg)" />
      <circle cx="1045" cy="95" r="10" fill="#fff4d6" filter="url(#glow-md)" />
      <rect width="1440" height="640" fill="url(#bottom-fade)" />
    </svg>
  </div>
);
