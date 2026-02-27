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
        <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-primary animate-spin" aria-hidden="true" />
            </div>
            <p className="text-xs text-muted-foreground">Laden…</p>
          </div>
        </div>
      }
    >
      <PageSkeleton />
    </Suspense>
  </div>
);

export default PageLoadingFallback;
