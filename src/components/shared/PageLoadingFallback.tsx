import { Loader2 } from "lucide-react";

const PageLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-label="Seite wird geladen">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-6 h-6 text-primary animate-spin" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">Laden…</p>
    </div>
  </div>
);

export default PageLoadingFallback;
