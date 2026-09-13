import { useId } from "react";
import { cn } from "@/lib/utils";

export const LogoMark = ({ className }) => {
  const gradientId = useId();

  return (
    <svg viewBox="0 0 28 24" fill="none" className={cn("h-6 w-7", className)} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#ff8a4d" />
        </linearGradient>
      </defs>
      <path d="M8 3 3 21M15 3l-5 18M22 3l-5 18" stroke={`url(#${gradientId})`} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
};
