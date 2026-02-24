import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsWatched, useToggleWatchlist } from "@/hooks/useWatchlist";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface Props {
  decisionId: string;
  size?: "sm" | "icon";
}

const WatchlistButton = ({ decisionId, size = "icon" }: Props) => {
  const { t } = useTranslation();
  const isWatched = useIsWatched(decisionId);
  const toggle = useToggleWatchlist();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggle.mutate(
      { decisionId, isWatched },
      {
        onSuccess: () => toast.success(isWatched ? t("watchlist.removed") : t("watchlist.added")),
      }
    );
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          className={`h-8 w-8 p-0 ${isWatched ? "text-primary" : "text-muted-foreground"}`}
          onClick={handleClick}
          disabled={toggle.isPending}
        >
          {isWatched ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {isWatched ? t("watchlist.removeTooltip") : t("watchlist.addTooltip")}
      </TooltipContent>
    </Tooltip>
  );
};

export default WatchlistButton;
