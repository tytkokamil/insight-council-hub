import { Skeleton } from "@/components/ui/skeleton";

const DecisionsPageSkeleton = () => (
  <div className="space-y-5 animate-in fade-in duration-300" role="status" aria-label="Loading">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>
    </div>

    {/* Filter bar */}
    <div className="flex items-center gap-2">
      <Skeleton className="h-9 w-64 rounded-md" />
      <Skeleton className="h-7 w-16 rounded-full" />
      <Skeleton className="h-7 w-16 rounded-full" />
      <Skeleton className="h-7 w-16 rounded-full" />
    </div>

    {/* Table */}
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b border-border">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-3 w-16 ml-auto" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
      {/* Rows */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-border last:border-0">
          <Skeleton className="h-4 w-4 rounded" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-[60%]" />
            <Skeleton className="h-3 w-[30%]" />
          </div>
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
    <span className="sr-only">Lade Entscheidungen…</span>
  </div>
);

export default DecisionsPageSkeleton;