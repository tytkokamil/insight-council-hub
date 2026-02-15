import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface WidgetSkeletonProps {
  /** Number of detail rows to show */
  rows?: number;
  /** Show a large number at top */
  showScore?: boolean;
  /** Show a progress bar */
  showProgress?: boolean;
}

const WidgetSkeleton = ({ rows = 3, showScore = true, showProgress = false }: WidgetSkeletonProps) => (
  <Card>
    <CardHeader className="pb-2">
      <div className="flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-2.5 w-40" />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      {showScore && (
        <div className="flex items-end gap-2 mb-3">
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-4 w-10 mb-1" />
        </div>
      )}
      {showProgress && <Skeleton className="h-2 w-full rounded-full mb-4" />}
      <div className="space-y-2.5 pt-3 border-t border-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="w-3.5 h-3.5 rounded shrink-0" />
            <Skeleton className="h-2.5 flex-1" />
            <Skeleton className="h-3 w-8 shrink-0" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default WidgetSkeleton;
