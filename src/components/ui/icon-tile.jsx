import { cn } from "@/lib/utils";

const sizes = {
  sm: { tile: "size-9", icon: "size-4" },
  md: { tile: "size-11", icon: "size-[18px]" },
  lg: { tile: "size-12", icon: "size-5" },
};

export const IconTile = ({ icon: Icon, size = "sm", className }) => (
  <span
    className={cn(
      "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-brand to-brand-dark",
      sizes[size].tile,
      className,
    )}
  >
    <Icon className={cn("text-white", sizes[size].icon)} strokeWidth={1.75} />
  </span>
);
