import { MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

interface QuickMessageButtonProps {
  teamId?: string | null;
  decisionId?: string | null;
  recipientName?: string;
  className?: string;
}

/**
 * Small message icon that navigates to the team chat
 * with the decision pre-linked as context.
 */
const QuickMessageButton = ({ teamId, decisionId, recipientName, className }: QuickMessageButtonProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!teamId) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const params = new URLSearchParams({ tab: "chat" });
    if (decisionId) params.set("linkDecision", decisionId);
    navigate(`/teams/${teamId}?${params.toString()}`);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-5 w-5 text-muted-foreground hover:text-primary ${className || ""}`}
          onClick={handleClick}
        >
          <MessageSquare className="w-3 h-3" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">
          {recipientName
            ? t("quickMessage.sendTo", { name: recipientName })
            : t("quickMessage.openChat")}
        </p>
      </TooltipContent>
    </Tooltip>
  );
};

export default QuickMessageButton;
