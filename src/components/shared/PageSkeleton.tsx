import { Skeleton } from "@/components/ui/skeleton";

/**
 * Full-page skeleton shown while lazy-loaded pages resolve.
 * Matches the typical page layout: header + grid of cards.
 */
const PageSkeleton = () => (
  <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-300" role="status" aria-label="Seite wird geladen">
    {/* Page header skeleton */}
    <div className="space-y-2">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-72" />
    </div>

    {/* KPI row */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="h-5 w-10 rounded-full" />
          </div>
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>

    {/* Main content area */}
    <div className="grid md:grid-cols-3 gap-5">
      <div className="md:col-span-2 border border-border rounded-lg p-6 space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
      <div className="space-y-5">
        <div className="border border-border rounded-lg p-4 space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
        <div className="border border-border rounded-lg p-4 space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    </div>

    <span className="sr-only">Laden…</span>
  </div>
);

export default PageSkeleton;
