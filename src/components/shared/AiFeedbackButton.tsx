import { useState } from "react";
import { ThumbsUp, ThumbsDown, MessageSquare, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AiFeedbackButtonProps {
  context: string;
  className?: string;
}

const AiFeedbackButton = ({ context, className = "" }: AiFeedbackButtonProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<"helpful" | "unhelpful" | null>(null);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const persistFeedback = async (sentiment: string, feedbackComment?: string) => {
    if (!user) return;
    await supabase.from("feature_feedback").insert({
      user_id: user.id,
      feature: context,
      sentiment,
      comment: feedbackComment || null,
    });
  };

  const handleFeedback = async (value: "helpful" | "unhelpful") => {
    setFeedback(value);
    if (value === "unhelpful") {
      setShowComment(true);
    } else {
      await persistFeedback("positive");
      setSubmitted(true);
      toast.success(t("shared.aiFeedbackThanks"));
    }
  };

  const submitComment = async () => {
    await persistFeedback("negative", comment);
    setSubmitted(true);
    setShowComment(false);
    toast.success(t("shared.aiFeedbackSent"));
  };

  if (submitted) {
    return (
      <div className={`flex items-center gap-1.5 text-[10px] text-muted-foreground/60 ${className}`}>
        <MessageSquare className="w-3 h-3" />
        <span>{t("shared.aiFeedbackReceived")}</span>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 pt-2 border-t border-border/30">
        <span className="text-[10px] text-muted-foreground/60">{t("shared.aiFeedbackQuestion")}</span>
        <Button
          variant="ghost"
          size="icon"
          className={`h-6 w-6 ${feedback === "helpful" ? "text-success bg-success/10" : "text-muted-foreground/50 hover:text-success"}`}
          onClick={() => handleFeedback("helpful")}
        >
          <ThumbsUp className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-6 w-6 ${feedback === "unhelpful" ? "text-destructive bg-destructive/10" : "text-muted-foreground/50 hover:text-destructive"}`}
          onClick={() => handleFeedback("unhelpful")}
        >
          <ThumbsDown className="w-3 h-3" />
        </Button>
      </div>

      {showComment && (
        <div className="flex gap-2 items-end">
          <Textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder={t("shared.aiFeedbackPlaceholder")}
            rows={2}
            className="text-xs flex-1"
          />
          <div className="flex flex-col gap-1">
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setShowComment(false); setFeedback(null); }}>
              <X className="w-3 h-3" />
            </Button>
            <Button size="icon" className="h-6 w-6" onClick={submitComment}>
              <Send className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiFeedbackButton;
