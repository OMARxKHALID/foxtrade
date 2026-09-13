import Image from "next/image";
import { coinLogos } from "@/lib/coin-logos";
import { cn } from "@/lib/utils";

const sizes = {
  sm: { box: "size-6 text-[8px]", pixels: 24 },
  md: { box: "size-8 text-[10px]", pixels: 32 },
};

export const CoinIcon = ({ symbol, color, size = "md", className }) => {
  const logo = coinLogos[symbol];
  const { box, pixels } = sizes[size];

  if (logo) {
    return <Image src={logo} alt="" width={pixels} height={pixels} aria-hidden="true" className={cn("shrink-0 rounded-full", box, className)} />;
  }

  return (
    <span
      className={cn("flex shrink-0 items-center justify-center rounded-full font-bold text-white", box, className)}
      style={{ background: `radial-gradient(circle at 30% 25%, ${color}ee, ${color}99 60%, ${color}66)` }}
      aria-hidden="true"
    >
      {symbol.slice(0, symbol.length > 3 ? 4 : 3)}
    </span>
  );
};
