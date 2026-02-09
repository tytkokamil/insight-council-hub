import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { MessageSquare, AlertTriangle, ThumbsUp } from "lucide-react";

const typeConfig = {
  comment: { label: "Kommentar", icon: MessageSquare, color: "text-primary" },
  feedback: { label: "Feedback", icon: ThumbsUp, color: "text-success" },
  risk_flag: { label: "Risiko", icon: AlertTriangle, color: "text-destructive" },
} as const;

type CommentType = keyof typeof typeConfig;

const DiscussionPanel = ({ decisionId }: { decisionId: string }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [type, setType] = useState<CommentType>("comment");
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("*, profiles!comments_user_id_fkey(full_name)")
      .eq("decision_id", decisionId)
      .order("created_at", { ascending: true });
    if (data) setComments(data);
  };

  useEffect(() => { fetchComments(); }, [decisionId]);

  const handleSubmit = async () => {
    if (!content.trim() || !user) return;
    setLoading(true);
    await supabase.from("comments").insert({
      decision_id: decisionId,
      user_id: user.id,
      content: content.trim(),
      type: type as any,
    });
    setContent("");
    setType("comment");
    await fetchComments();
    setLoading(false);
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Noch keine Kommentare.</p>
        ) : comments.map((c) => {
          const cfg = typeConfig[c.type as CommentType] || typeConfig.comment;
          const Icon = cfg.icon;
          return (
            <div key={c.id} className="flex gap-3 p-3 rounded-lg bg-muted/30">
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{c.profiles?.full_name || "Unbekannt"}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${cfg.color} bg-current/10`}>{cfg.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(c.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-sm mt-1">{c.content}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2 pt-2 border-t border-border">
        <div className="flex gap-1">
          {(Object.keys(typeConfig) as CommentType[]).map((t) => {
            const cfg = typeConfig[t];
            const Icon = cfg.icon;
            return (
              <Button
                key={t}
                size="sm"
                variant={type === t ? "default" : "outline"}
                className="text-xs h-7 gap-1"
                onClick={() => setType(t)}
              >
                <Icon className="w-3 h-3" /> {cfg.label}
              </Button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Kommentar schreiben..."
            className="flex-1 h-16 px-3 py-2 rounded-lg bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all text-sm resize-none"
          />
          <Button onClick={handleSubmit} disabled={loading || !content.trim()} className="self-end">
            Senden
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DiscussionPanel;
