import { Loader2 } from "lucide-react";

const PageLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
      <p className="text-sm text-muted-foreground">Laden…</p>
    </div>
  </div>
);

export default PageLoadingFallback;
