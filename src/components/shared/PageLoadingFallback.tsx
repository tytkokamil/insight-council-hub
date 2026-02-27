import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const PageSkeleton = lazy(() => import("./PageSkeleton"));

/**
 * Loading fallback: shows a rich skeleton if it loads quickly, 
 * otherwise a simple spinner.
 */
const PageLoadingFallback = () => (
  <div className="min-h-[60vh]" role="status" aria-label="Seite wird geladen">
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 text-primary animate-spin" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{/* i18n handled by skeleton */}Laden…</p>
          </div>
        </div>
      }
    >
      <PageSkeleton />
    </Suspense>
  </div>
);

export default PageLoadingFallback;
