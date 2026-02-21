import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfiles } from "@/hooks/useDecisions";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, AlertTriangle, ThumbsUp, AtSign } from "lucide-react";
import { cn } from "@/lib/utils";

const typeConfig = {
  comment: { label: "Kommentar", icon: MessageSquare, color: "text-primary" },
  feedback: { label: "Feedback", icon: ThumbsUp, color: "text-success" },
  risk_flag: { label: "Risiko", icon: AlertTriangle, color: "text-destructive" },
} as const;

type CommentType = keyof typeof typeConfig;

/** Renders comment content with highlighted @mentions */
const RenderContent = ({ content }: { content: string }) => {
  const parts = content.split(/(@\[([^\]]+)\]\([a-f0-9\-]{36}\))/g);
  return (
    <p className="text-sm mt-1">
      {parts.map((part, i) => {
        // Every 3rd element (index 1, 4, 7...) is the full match, index 2 is the name
        if (i % 3 === 1) return null; // skip full match, render name below
        if (i % 3 === 2) {
          return (
            <span key={i} className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">
              <AtSign className="w-3 h-3" />
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
};

const DiscussionPanel = ({ decisionId }: { decisionId: string }) => {
  const { user } = useAuth();
  const { data: profiles = [] } = useProfiles();
  const [comments, setComments] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [type, setType] = useState<CommentType>("comment");
  const [loading, setLoading] = useState(false);

  // Mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [cursorPos, setCursorPos] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredProfiles = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return profiles
      .filter(p => p.user_id !== user?.id && (p.full_name || "").toLowerCase().includes(q))
      .slice(0, 6);
  }, [mentionQuery, profiles, user?.id]);

  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("*, profiles!comments_user_id_fkey(full_name)")
      .eq("decision_id", decisionId)
      .order("created_at", { ascending: true });
    if (data) setComments(data);
  };

  useEffect(() => { fetchComments(); }, [decisionId]);

  // Detect @ trigger in textarea
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart || 0;
    setContent(val);
    setCursorPos(pos);

    // Look backwards from cursor for an unmatched @
    const textBefore = val.slice(0, pos);
    const atMatch = textBefore.match(/@(\w*)$/);
    if (atMatch) {
      setMentionQuery(atMatch[1]);
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  }, []);

  const insertMention = useCallback((profile: any) => {
    const textBefore = content.slice(0, cursorPos);
    const textAfter = content.slice(cursorPos);
    const atStart = textBefore.lastIndexOf("@");
    const mention = `@[${profile.full_name}](${profile.user_id}) `;
    const newContent = textBefore.slice(0, atStart) + mention + textAfter;
    setContent(newContent);
    setMentionQuery(null);
    
    // Focus textarea after insert
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = atStart + mention.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  }, [content, cursorPos]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (mentionQuery !== null && filteredProfiles.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex(i => Math.min(i + 1, filteredProfiles.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex(i => Math.max(i - 1, 0));
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredProfiles[mentionIndex]);
      } else if (e.key === "Escape") {
        setMentionQuery(null);
      }
    }
  }, [mentionQuery, filteredProfiles, mentionIndex, insertMention]);

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
    setMentionQuery(null);
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
                <RenderContent content={c.content} />
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
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Kommentar schreiben... @Name zum Erwähnen"
              className="w-full h-16 px-3 py-2 rounded-lg bg-muted/50 border border-border focus:border-foreground/30 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all text-sm resize-none"
            />
            {/* Mention autocomplete dropdown */}
            {mentionQuery !== null && filteredProfiles.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute bottom-full left-0 mb-1 w-64 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50"
              >
                <p className="text-[10px] text-muted-foreground px-3 pt-2 pb-1 font-semibold uppercase tracking-wider">
                  Personen erwähnen
                </p>
                {filteredProfiles.map((p, i) => (
                  <button
                    key={p.user_id}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors",
                      i === mentionIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted/50"
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent textarea blur
                      insertMention(p);
                    }}
                    onMouseEnter={() => setMentionIndex(i)}
                  >
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground shrink-0">
                      {(p.full_name || "?")[0].toUpperCase()}
                    </div>
                    <span className="truncate">{p.full_name || "Unbekannt"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button onClick={handleSubmit} disabled={loading || !content.trim()} className="self-end">
            Senden
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <AtSign className="w-3 h-3" /> Tippe @ um Personen zu erwähnen
        </p>
      </div>
    </div>
  );
};

export default DiscussionPanel;
