"use client";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { cn } from "@/lib/utils";

export const Slider = ({ value, onChange, min = 0, max = 100, step = 1, label, className }) => (
  <SliderPrimitive.Root value={value} onValueChange={onChange} min={min} max={max} step={step} className={cn("w-full", className)}>
    <SliderPrimitive.Control className="flex h-5 w-full cursor-pointer touch-none items-center select-none">
      <SliderPrimitive.Track className="h-1 w-full rounded-full bg-white/10">
        <SliderPrimitive.Indicator className="rounded-full bg-brand" />
        <SliderPrimitive.Thumb
          aria-label={label}
          className="size-4 rounded-full border-2 border-brand bg-white outline-none focus-visible:ring-4 focus-visible:ring-brand/25"
        />
      </SliderPrimitive.Track>
    </SliderPrimitive.Control>
  </SliderPrimitive.Root>
);
