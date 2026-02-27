import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface Props {
  message?: string;
  onRetry: () => void;
  compact?: boolean;
}

/**
 * Inline error state with retry button for failed React Query fetches.
 * Use inside components that rely on useQuery to give users a clear recovery path.
 */
const QueryErrorRetry = ({ message, onRetry, compact }: Props) => {
  const { t } = useTranslation();

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/20 bg-destructive/5">
        <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
        <span className="text-xs text-muted-foreground flex-1 truncate">
          {message || t("shared.queryError", "Daten konnten nicht geladen werden")}
        </span>
        <Button variant="ghost" size="sm" onClick={onRetry} className="shrink-0 gap-1 h-7 text-xs">
          <RefreshCw className="w-3 h-3" />
          {t("shared.retry", "Erneut versuchen")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
        <AlertTriangle className="w-5 h-5 text-destructive" />
      </div>
      <div>
        <p className="text-sm font-medium">{t("shared.queryError", "Daten konnten nicht geladen werden")}</p>
        {message && <p className="text-xs text-muted-foreground mt-1">{message}</p>}
      </div>
      <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
        <RefreshCw className="w-3.5 h-3.5" />
        {t("shared.retry", "Erneut versuchen")}
      </Button>
    </div>
  );
};

export default QueryErrorRetry;
