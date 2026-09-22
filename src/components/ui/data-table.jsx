"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { GlowCard } from "@/components/ui/glow-card";
import { hitArea } from "@/components/ui/gradient-button";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { cn } from "@/lib/utils";

const hideBelow = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};

const alignment = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

const cellBase = "px-3 whitespace-nowrap first:pl-4 last:pr-4 sm:first:pl-6 sm:last:pr-6";

const compare = (a, b) => {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a ?? "").localeCompare(String(b ?? ""));
};

const SortIcon = ({ direction }) => {
  if (direction === "asc") return <ArrowUp className="size-3 text-brand" />;
  if (direction === "desc") return <ArrowDown className="size-3 text-brand" />;
  return <ArrowUpDown className="size-3 text-neutral-700" />;
};

export const DataTable = ({
  title,
  description,
  titleId,
  tabs,
  filters,
  toolbar,
  searchPlaceholder = "Search",
  searchable = true,
  columns,
  rows,
  pageSize = 10,
  initialSort,
  emptyState,
  footer,
  className,
}) => {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState(initialSort ?? null);
  const [page, setPage] = useState(1);

  const needle = query.trim().toLowerCase();
  const filtered = needle ? rows.filter((row) => (row.searchText ?? "").toLowerCase().includes(needle)) : rows;
  const sorted = sort
    ? [...filtered].sort((a, b) => compare(a.sortValues?.[sort.key], b.sortValues?.[sort.key]) * (sort.direction === "asc" ? 1 : -1))
    : filtered;
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleQuery = (event) => {
    setQuery(event.target.value);
    setPage(1);
  };
  const handleSort = (key) =>
    setSort((current) => {
      if (current?.key !== key) return { key, direction: "desc" };
      return { key, direction: current.direction === "desc" ? "asc" : "desc" };
    });

  const hasHeader = title || tabs || filters || searchable;

  return (
    <GlowCard as="section" aria-labelledby={title ? titleId : undefined} className={cn("overflow-hidden", className)}>
      {hasHeader && (
        <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            {title && (
              <div className="min-w-0">
                <h2 id={titleId} className="font-heading text-base font-semibold text-white">
                  {title}
                </h2>
                {description && <p className="mt-0.5 text-xs text-neutral-500">{description}</p>}
              </div>
            )}
            {tabs}
          </div>
          {(filters || searchable) && (
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center lg:justify-end">
              {filters}
              {searchable && <SearchInput value={query} onChange={handleQuery} placeholder={searchPlaceholder} />}
            </div>
          )}
        </div>
      )}
      {toolbar && <div className="border-b border-white/10 px-4 py-2.5 sm:px-6">{toolbar}</div>}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {columns.map((column) => {
                const direction = sort?.key === column.key ? sort.direction : undefined;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={direction === "asc" ? "ascending" : direction === "desc" ? "descending" : undefined}
                    className={cn(
                      cellBase,
                      "h-10 text-xs font-normal text-neutral-500",
                      alignment[column.align ?? "left"],
                      column.hideBelow && hideBelow[column.hideBelow],
                      column.className,
                    )}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(column.key)}
                        className={cn(hitArea, "inline-flex items-center gap-1", column.align === "right" && "flex-row-reverse")}
                      >
                        {column.header}
                        <SortIcon direction={direction} />
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id} className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02]">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      cellBase,
                      "h-14 text-neutral-200 tabular-nums",
                      alignment[column.align ?? "left"],
                      column.hideBelow && hideBelow[column.hideBelow],
                      column.className,
                    )}
                  >
                    {row.cells[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {visible.length === 0 &&
        (needle && rows.length > 0 ? (
          <EmptyState title="No results" text={`Nothing matches “${query.trim()}”.`} className="py-10" />
        ) : (
          emptyState
        ))}
      {sorted.length > pageSize && <Pagination page={currentPage} pageCount={pageCount} total={sorted.length} pageSize={pageSize} onPageChange={setPage} />}
      {footer}
    </GlowCard>
  );
};
