import { Skeleton } from "@/components/ui/skeleton";

const TeamsPageSkeleton = () => (
  <div className="space-y-5 animate-in fade-in duration-300" role="status" aria-label="Loading">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-32" />
      </div>
      <Skeleton className="h-9 w-28 rounded-md" />
    </div>

    {/* Team cards grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border border-border rounded-lg p-5 space-y-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="h-4 w-[60%]" />
          <Skeleton className="h-3 w-[80%]" />
          <div className="flex items-center justify-between pt-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-3" />
          </div>
        </div>
      ))}
    </div>
    <span className="sr-only">Lade Teams…</span>
  </div>
);

export default TeamsPageSkeleton;