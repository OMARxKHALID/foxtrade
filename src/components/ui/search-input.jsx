import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const SearchInput = ({ value, onChange, placeholder = "Search", label, className }) => (
  <label className={cn("relative block w-full sm:w-64", className)}>
    <span className="sr-only">{label ?? placeholder}</span>
    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-500" />
    <input
      type="search"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="h-9 w-full rounded-lg border border-white/10 bg-field pr-3 pl-9 text-sm text-white placeholder:text-neutral-600 focus:border-brand/60 focus:outline-none"
    />
  </label>
);
