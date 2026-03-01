import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

/**
 * Skeleton for list/table pages (Decisions, Tasks, etc.)
 */
const TableSkeleton = ({ rows = 6, columns = 4 }: TableSkeletonProps) => (
  <div className="space-y-4 animate-in fade-in duration-300" role="status" aria-label="Daten werden geladen">
    {/* Filter bar skeleton */}
    <div className="flex items-center gap-2">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-9 w-24" />
      <Skeleton className="h-9 w-24" />
      <div className="flex-1" />
      <Skeleton className="h-9 w-32" />
    </div>

    {/* Table skeleton */}
    <div className="border border-border/60 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-border/60 bg-muted/30">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3" style={{ width: i === 0 ? "30%" : `${Math.max(10, 20 - i * 3)}%` }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-3 border-b border-border/60 last:border-b-0">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className="h-4" style={{ width: c === 0 ? "30%" : `${Math.max(8, 18 - c * 3)}%` }} />
          ))}
        </div>
      ))}
    </div>

    <span className="sr-only">Laden…</span>
  </div>
);

export default TableSkeleton;
