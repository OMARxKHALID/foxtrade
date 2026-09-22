"use client";

import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { controlClass } from "@/components/ui/field";
import { menuItemClass, menuPopupClass, menuSideOffset } from "@/components/ui/menu-styles";
import { cn } from "@/lib/utils";

export const SelectMenu = ({ id, value, onChange, onBlur, options, placeholder = "Select", invalid, disabled, name, className, "aria-label": ariaLabel }) => (
  <Select.Root items={options} value={value === "" ? null : value} onValueChange={onChange} name={name} disabled={disabled}>
    <Select.Trigger
      id={id}
      aria-label={ariaLabel}
      aria-invalid={invalid}
      onBlur={onBlur}
      className={cn(controlClass, "flex cursor-pointer items-center justify-between gap-2 text-left data-[popup-open]:border-brand/60", className)}
    >
      <Select.Value placeholder={placeholder} className="flex min-w-0 items-center gap-2 truncate data-[placeholder]:text-neutral-600">
        {(selected) => {
          const option = options.find((item) => item.value === selected);
          if (!option) return placeholder;
          return (
            <>
              {option.icon}
              <span className="truncate">{option.label}</span>
            </>
          );
        }}
      </Select.Value>
      <Select.Icon className="flex shrink-0 text-neutral-500">
        <ChevronDown className="size-4" />
      </Select.Icon>
    </Select.Trigger>
    <Select.Portal>
      <Select.Positioner sideOffset={menuSideOffset} alignItemWithTrigger={false} className="z-50 outline-none">
        <Select.Popup className={cn("max-h-[min(var(--available-height),18rem)] min-w-[var(--anchor-width)] overflow-y-auto", menuPopupClass)}>
          <Select.List>
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className={menuItemClass}
              >
                {option.icon}
                <Select.ItemText className="min-w-0 flex-1 truncate">{option.label}</Select.ItemText>
                <Select.ItemIndicator className="flex shrink-0">
                  <Check className="size-4 text-brand" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.List>
        </Select.Popup>
      </Select.Positioner>
    </Select.Portal>
  </Select.Root>
);
