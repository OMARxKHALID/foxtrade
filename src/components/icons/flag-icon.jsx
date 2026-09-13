import { useId } from "react";
import { cn } from "@/lib/utils";

const star = (cx, cy, r) => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const radius = i % 2 ? r * 0.4 : r;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
  });
  return pts.join(" ");
};

const flags = {
  se: (
    <>
      <rect width="32" height="32" fill="#006aa7" />
      <rect x="9" width="5" height="32" fill="#fecc00" />
      <rect y="13.5" width="32" height="5" fill="#fecc00" />
    </>
  ),
  gb: (
    <>
      <rect width="32" height="32" fill="#012169" />
      <path d="M0 0l32 32M32 0 0 32" stroke="#fff" strokeWidth="6" />
      <path d="M0 0l32 32M32 0 0 32" stroke="#c8102e" strokeWidth="2" />
      <path d="M16 0v32M0 16h32" stroke="#fff" strokeWidth="9" />
      <path d="M16 0v32M0 16h32" stroke="#c8102e" strokeWidth="5" />
    </>
  ),
  de: (
    <>
      <rect width="32" height="11" fill="#000" />
      <rect y="11" width="32" height="11" fill="#dd0000" />
      <rect y="22" width="32" height="10" fill="#ffce00" />
    </>
  ),
  it: (
    <>
      <rect width="11" height="32" fill="#009246" />
      <rect x="11" width="10" height="32" fill="#fff" />
      <rect x="21" width="11" height="32" fill="#ce2b37" />
    </>
  ),
  us: (
    <>
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} y={i * 4.6} width="32" height="2.3" fill="#b22234" />
      ))}
      <rect y="2.3" width="32" height="2.3" fill="#fff" />
      <rect width="15" height="16" fill="#3c3b6e" />
      {Array.from({ length: 9 }, (_, i) => (
        <circle key={i} cx={3 + (i % 3) * 4.5} cy={3 + Math.floor(i / 3) * 5} r="0.9" fill="#fff" />
      ))}
    </>
  ),
  cn: (
    <>
      <rect width="32" height="32" fill="#de2910" />
      <polygon points={star(10, 11, 5)} fill="#ffde00" />
      <polygon points={star(18, 6, 1.5)} fill="#ffde00" />
      <polygon points={star(21, 10, 1.5)} fill="#ffde00" />
      <polygon points={star(21, 15, 1.5)} fill="#ffde00" />
      <polygon points={star(18, 19, 1.5)} fill="#ffde00" />
    </>
  ),
  id: (
    <>
      <rect width="32" height="16" fill="#ce1126" />
      <rect y="16" width="32" height="16" fill="#fff" />
    </>
  ),
  jp: (
    <>
      <rect width="32" height="32" fill="#fff" />
      <circle cx="16" cy="16" r="7" fill="#bc002d" />
    </>
  ),
  cz: (
    <>
      <rect width="32" height="16" fill="#fff" />
      <rect y="16" width="32" height="16" fill="#d7141a" />
      <path d="M0 0l16 16L0 32Z" fill="#11457e" />
    </>
  ),
  ru: (
    <>
      <rect width="32" height="11" fill="#fff" />
      <rect y="11" width="32" height="11" fill="#0039a6" />
      <rect y="22" width="32" height="10" fill="#d52b1e" />
    </>
  ),
  eu: (
    <>
      <rect width="32" height="32" fill="#003399" />
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (Math.PI / 6) * i;
        return <polygon key={i} points={star(16 + 8 * Math.cos(angle), 16 + 8 * Math.sin(angle), 1.6)} fill="#ffcc00" />;
      })}
    </>
  ),
  kr: (
    <>
      <rect width="32" height="32" fill="#fff" />
      <path d="M10 16a6 6 0 0 1 12 0Z" fill="#cd2e3a" />
      <path d="M10 16a6 6 0 0 0 12 0Z" fill="#0047a0" />
      <path d="M5 8l3-3M6 10l3-3M23 5l3 3M22 7l3 3M5 24l3 3M6 22l3 3M23 27l3-3M22 25l3-3" stroke="#000" strokeWidth="1.2" />
    </>
  ),
  tr: (
    <>
      <rect width="32" height="32" fill="#e30a17" />
      <circle cx="13" cy="16" r="7" fill="#fff" />
      <circle cx="15" cy="16" r="5.6" fill="#e30a17" />
      <polygon points={star(21.5, 16, 3)} fill="#fff" />
    </>
  ),
  fr: (
    <>
      <rect width="32" height="32" fill="#fff" />
      <rect width="11" height="32" fill="#002395" />
      <rect x="21" width="11" height="32" fill="#ed2939" />
    </>
  ),
  es: (
    <>
      <rect width="32" height="32" fill="#aa151b" />
      <rect y="8" width="32" height="16" fill="#f1bf00" />
    </>
  ),
  pt: (
    <>
      <rect width="32" height="32" fill="#da291c" />
      <rect width="13" height="32" fill="#046a38" />
      <circle cx="13" cy="16" r="5" fill="#ffe900" />
      <circle cx="13" cy="16" r="3" fill="#da291c" />
    </>
  ),
  sa: (
    <>
      <rect width="32" height="32" fill="#006c35" />
      <rect x="8" y="12" width="16" height="2.5" rx="1" fill="#fff" />
      <rect x="9" y="19" width="14" height="1.5" rx="0.75" fill="#fff" />
    </>
  ),
  hk: (
    <>
      <rect width="32" height="32" fill="#de2910" />
      <polygon points={star(16, 16, 7)} fill="#fff" />
      <circle cx="16" cy="16" r="1.6" fill="#de2910" />
    </>
  ),
};

export const FlagIcon = ({ code, className }) => {
  const clipId = useId();

  return (
    <svg viewBox="0 0 32 32" className={cn("size-8 shrink-0 rounded-full", className)} aria-hidden="true">
      <clipPath id={clipId}>
        <circle cx="16" cy="16" r="16" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>{flags[code]}</g>
    </svg>
  );
};
