import { cn } from "@/lib/utils";

export const Marquee = ({ reverse, duration = 40, fade, className, trackClassName, children }) => (
  <div
    className={cn(
      "group flex overflow-hidden",
      fade && "[mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]",
      className,
    )}
    style={{ "--marquee-duration": `${duration}s` }}
  >
    <div
      className={cn(
        "flex w-max shrink-0 group-hover:[animation-play-state:paused] motion-reduce:animate-none",
        reverse ? "animate-marquee-reverse" : "animate-marquee",
        trackClassName,
      )}
    >
      {children}
      {children}
    </div>
  </div>
);
