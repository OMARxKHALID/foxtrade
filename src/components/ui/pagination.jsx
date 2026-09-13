import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const pageWindow = (page, pageCount) => {
  const start = Math.max(1, Math.min(page - 2, pageCount - 4));
  const end = Math.min(pageCount, start + 4);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

const pageButton = "flex size-8 items-center justify-center rounded-md text-xs tabular-nums disabled:opacity-40";

export const Pagination = ({ page, pageCount, total, pageSize, onPageChange }) => {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-col items-center gap-3 border-t border-white/10 px-4 py-3 sm:flex-row sm:justify-between sm:px-6">
      <p className="text-xs text-neutral-500 tabular-nums">
        Showing {from}–{to} of {total}
      </p>
      {pageCount > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-1">
          <button type="button" onClick={() => onPageChange(page - 1)} disabled={page === 1} aria-label="Previous page" className={cn(pageButton, "text-neutral-300")}>
            <ChevronLeft className="size-4" />
          </button>
          {pageWindow(page, pageCount).map((number) => (
            <button
              key={number}
              type="button"
              onClick={() => onPageChange(number)}
              aria-current={number === page ? "page" : undefined}
              className={cn(pageButton, number === page ? "bg-white/10 text-white" : "text-neutral-500")}
            >
              {number}
            </button>
          ))}
          <button type="button" onClick={() => onPageChange(page + 1)} disabled={page === pageCount} aria-label="Next page" className={cn(pageButton, "text-neutral-300")}>
            <ChevronRight className="size-4" />
          </button>
        </nav>
      )}
    </div>
  );
};
