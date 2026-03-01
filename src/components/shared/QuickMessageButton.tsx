import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Link2, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QuickMessageButtonProps {
  teamId?: string | null;
  decisionId?: string | null;
  decisionTitle?: string;
  recipientName?: string;
  recipientId?: string | null;
  contextLabel?: string;
  className?: string;
}

/**
 * Inline chat popover: click the icon, type a message, send it
 * directly into the team chat with the decision/task pre-linked.
 */
const QuickMessageButton = ({
  teamId,
  decisionId,
  decisionTitle,
  recipientName,
  recipientId,
  contextLabel,
  className,
}: QuickMessageButtonProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  if (!teamId) return null;

  const handleSend = async () => {
    if (!message.trim() || !user) return;
    setSending(true);

    // Build content with @mention if recipient is known
    let content = message.trim();
    if (recipientId && recipientName) {
      content = `@[${recipientName}](${recipientId}) ${content}`;
    }

    const { error } = await supabase.from("team_messages").insert({
      team_id: teamId,
      user_id: user.id,
      content,
      decision_id: decisionId || null,
      file_url: null,
      file_name: null,
      file_type: null,
    });

    if (error) {
      toast.error(t("quickMessage.sendError"));
    } else {
      toast.success(t("quickMessage.sent"));
      setMessage("");
      setOpen(false);
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-5 w-5 text-muted-foreground hover:text-primary ${className || ""}`}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              <MessageSquare className="w-3 h-3" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {recipientName
              ? t("quickMessage.sendTo", { name: recipientName })
              : t("quickMessage.openChat")}
          </p>
        </TooltipContent>
      </Tooltip>

      <PopoverContent align="start" className="w-80 p-0" sideOffset={8}>
        {/* Context banner */}
        {(decisionTitle || contextLabel) && (
          <div className="px-3 py-2 border-b border-border/60 bg-primary/5 flex items-center gap-2">
            <Link2 className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-xs font-medium text-primary truncate flex-1">
              {contextLabel || decisionTitle}
            </span>
          </div>
        )}

        {/* Recipient */}
        {recipientName && (
          <div className="px-3 pt-2 pb-1">
            <p className="text-[10px] text-muted-foreground">
              {t("quickMessage.to", { name: recipientName })}
            </p>
          </div>
        )}

        {/* Input */}
        <div className="p-2 flex items-center gap-2">
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("quickMessage.placeholder")}
            className="h-8 text-sm flex-1"
            disabled={sending}
          />
          <Button
            size="icon"
            className="h-8 w-8 shrink-0"
            disabled={!message.trim() || sending}
            onClick={handleSend}
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Link to full chat */}
        <div className="px-3 pb-2">
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-[10px] text-muted-foreground gap-1"
            onClick={() => {
              setOpen(false);
              const params = new URLSearchParams({ tab: "chat" });
              if (decisionId) params.set("linkDecision", decisionId);
              navigate(`/teams/${teamId}?${params.toString()}`);
            }}
          >
            <ExternalLink className="w-2.5 h-2.5" />
            {t("quickMessage.openFullChat")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default QuickMessageButton;
