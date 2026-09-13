"use client";

import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { DayPicker } from "react-day-picker";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { controlClass } from "@/components/ui/field";
import { cn } from "@/lib/utils";

const dateFormat = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });

const navButton = "flex size-8 cursor-pointer items-center justify-center rounded-lg text-neutral-400 disabled:cursor-default disabled:opacity-30";

const calendarClasses = {
  root: "relative",
  months: "flex flex-col",
  month: "flex flex-col gap-3",
  month_caption: "flex h-8 items-center justify-center",
  caption_label: "font-heading text-sm font-semibold text-white",
  nav: "absolute inset-x-0 top-0 z-10 flex h-8 items-center justify-between",
  button_previous: navButton,
  button_next: navButton,
  month_grid: "border-collapse",
  weekdays: "flex",
  weekday: "flex size-9 items-center justify-center text-[11px] font-normal text-neutral-500",
  weeks: "flex flex-col gap-1",
  week: "flex",
  day: "size-9 p-0 text-center text-sm",
  day_button: "flex size-9 cursor-pointer items-center justify-center rounded-lg text-neutral-200 tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
  today: "[&>button]:font-semibold [&>button]:text-brand",
  selected: "[&>button]:bg-brand [&>button]:font-semibold [&>button]:text-white",
  outside: "[&>button]:text-neutral-600",
  disabled: "[&>button]:cursor-default [&>button]:text-neutral-700",
  hidden: "invisible",
};

const Chevron = ({ orientation }) => (orientation === "left" ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />);

export const DatePicker = ({ id, value, onChange, placeholder = "Select date", fromDate, toDate, className, triggerClassName, "aria-label": ariaLabel }) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (date) => {
    onChange(date);
    setOpen(false);
  };
  const handleClear = (event) => {
    event.stopPropagation();
    onChange(undefined);
  };

  const disabled = [fromDate && { before: fromDate }, toDate && { after: toDate }].filter(Boolean);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div className={cn("relative", className)}>
        <Popover.Trigger
          id={id}
          aria-label={ariaLabel}
          className={cn(controlClass, "flex cursor-pointer items-center gap-2 pr-8 text-left data-[popup-open]:border-brand/60", triggerClassName)}
        >
          <CalendarDays className="size-4 shrink-0 text-neutral-500" />
          <span className={cn("min-w-0 truncate", !value && "text-neutral-600")}>{value ? dateFormat.format(value) : placeholder}</span>
        </Popover.Trigger>
        {value && (
          <button type="button" onClick={handleClear} aria-label="Clear date" className="absolute top-1/2 right-2 flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-neutral-500">
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <Popover.Portal>
        <Popover.Positioner sideOffset={6} align="start" className="z-50 outline-none">
          <Popover.Popup className="rounded-xl border border-white/10 bg-field p-3 shadow-[0_16px_40px_rgba(0,0,0,0.6)] outline-none">
            <DayPicker
              mode="single"
              selected={value}
              onSelect={handleSelect}
              defaultMonth={value ?? toDate}
              disabled={disabled}
              showOutsideDays
              classNames={calendarClasses}
              components={{ Chevron }}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
};
