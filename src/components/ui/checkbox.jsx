"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const Checkbox = ({ id, checked, onChange, onBlur, name, invalid, className }) => (
  <CheckboxPrimitive.Root
    id={id}
    name={name}
    checked={Boolean(checked)}
    onCheckedChange={onChange}
    onBlur={onBlur}
    aria-invalid={invalid}
    className={cn(
      "flex size-4 shrink-0 cursor-pointer items-center justify-center rounded border border-white/20 bg-field outline-none focus-visible:ring-2 focus-visible:ring-brand/40 aria-[invalid=true]:border-down/60 data-[checked]:border-brand data-[checked]:bg-brand",
      className,
    )}
  >
    <CheckboxPrimitive.Indicator className="flex text-white">
      <Check className="size-3" strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
);
