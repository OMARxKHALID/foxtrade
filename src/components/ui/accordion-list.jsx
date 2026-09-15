"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const AccordionList = ({ items, idPrefix }) => {
  const [openIndex, setOpenIndex] = useState(-1);

  const handleToggle = (index) => setOpenIndex((current) => (current === index ? -1 : index));

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, i) => {
        const open = openIndex === i;
        const panelId = `${idPrefix}-${i}`;
        return (
          <li key={`${i}-${item.question}`} className={cn("rounded-xl border bg-cell", open ? "border-brand/50" : "border-white/5")}>
            <h3>
              <button
                type="button"
                onClick={() => handleToggle(i)}
                aria-expanded={open}
                aria-controls={panelId}
                className="flex min-h-[52px] w-full items-center justify-between gap-4 px-4 text-left text-sm text-white"
              >
                {item.question}
                <ChevronDown className={cn("size-4 shrink-0 text-neutral-400 transition-transform", open && "rotate-180")} />
              </button>
            </h3>
            {open && (
              <p id={panelId} className="px-4 pb-4 text-sm leading-6 text-neutral-400">
                {item.answer}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
};
