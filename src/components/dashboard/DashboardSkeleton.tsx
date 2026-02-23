import WidgetSkeleton from "@/components/dashboard/WidgetSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Full dashboard skeleton shown during initial data load.
 */
const DashboardSkeleton = () => (
  <div className="space-y-10 animate-in fade-in duration-300" role="status" aria-label="Dashboard wird geladen">
    {/* DQI Hero */}
    <div className="border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-64" />
        </div>
      </div>
      <Skeleton className="h-3 w-full rounded-full" />
      <div className="flex gap-4">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>

    {/* Action required cards */}
    <div>
      <Skeleton className="h-3 w-28 mb-3" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="w-4 h-4 rounded" />
              <Skeleton className="h-4 w-6 rounded-full" />
            </div>
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>

    {/* Widgets grid */}
    <div className="grid md:grid-cols-3 gap-5">
      <div className="md:col-span-2">
        <WidgetSkeleton rows={4} showScore={false} showProgress />
      </div>
      <div className="space-y-5">
        <WidgetSkeleton rows={2} />
        <WidgetSkeleton rows={2} />
      </div>
    </div>

    {/* Chart skeleton */}
    <div className="border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-56" />
        </div>
      </div>
      <Skeleton className="h-52 w-full rounded-lg" />
    </div>

    <span className="sr-only">Dashboard wird geladen…</span>
  </div>
);

export default DashboardSkeleton;
