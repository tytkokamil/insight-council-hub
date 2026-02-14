import { Skeleton } from "@/components/ui/skeleton";
import AppLayout from "@/components/layout/AppLayout";

interface AnalysisPageSkeletonProps {
  /** Number of summary cards at the top */
  cards?: number;
  /** Number of content sections below cards */
  sections?: number;
  /** Whether to show a chart placeholder */
  showChart?: boolean;
}

const AnalysisPageSkeleton = ({ cards = 3, sections = 2, showChart = false }: AnalysisPageSkeletonProps) => {
  return (
    <AppLayout>
      {/* Title skeleton */}
      <div className="mb-8">
        <Skeleton className="h-9 w-72 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Summary cards */}
      <div className={`grid grid-cols-1 md:grid-cols-${Math.min(cards, 4)} gap-4 mb-6`}>
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="glass-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="w-4 h-4 rounded" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-2 w-32" />
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      {showChart && (
        <div className="glass-card p-6 mb-6">
          <Skeleton className="h-5 w-48 mb-4" />
          <div className="flex items-end gap-3 h-[200px]">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton
                key={i}
                className="flex-1 rounded-t"
                style={{ height: `${30 + Math.random() * 70}%` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Content sections */}
      {Array.from({ length: sections }).map((_, i) => (
        <div key={i} className="glass-card p-5 mb-4">
          <Skeleton className="h-5 w-40 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3 p-3 rounded-lg bg-muted/10">
                <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-2.5 w-2/5" />
                </div>
                <Skeleton className="h-6 w-12 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </AppLayout>
  );
};

export default AnalysisPageSkeleton;
