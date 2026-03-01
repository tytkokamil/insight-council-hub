import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfiles } from "@/hooks/useDecisions";
import { Button } from "@/components/ui/button";
import { MessageSquare, AlertTriangle, ThumbsUp, AtSign, Paperclip, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";

type CommentType = "comment" | "feedback" | "risk_flag";

/** Renders comment content with highlighted @mentions */
const RenderContent = ({ content }: { content: string }) => {
  const parts = content.split(/(@\[([^\]]+)\]\([a-f0-9\-]{36}\))/g);
  return (
    <p className="text-sm mt-1">
      {parts.map((part, i) => {
        if (i % 3 === 1) return null;
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

/** AI-generated thread summary shown when >5 comments */
const ThreadSummary = ({ decisionId, commentCount }: { decisionId: string; commentCount: number }) => {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (commentCount < 5) return;
    const cached = sessionStorage.getItem(`thread-summary-${decisionId}`);
    if (cached) { setSummary(cached); return; }

    setLoading(true);
    supabase.functions.invoke("decision-copilot", {
      body: {
        mode: "thread_summary",
        decisionId,
      },
    }).then(({ data }) => {
      const text = data?.summary || null;
      if (text) {
        setSummary(text);
        sessionStorage.setItem(`thread-summary-${decisionId}`, text);
      }
    }).finally(() => setLoading(false));
  }, [decisionId, commentCount]);

  if (commentCount < 5) return null;
  if (loading) return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/15 mb-3">
      <Loader2 className="w-4 h-4 text-primary animate-spin" />
      <p className="text-xs text-primary">{t("discussion.generatingSummary")}</p>
    </div>
  );
  if (!summary) return null;

  return (
    <div className="p-3 rounded-lg bg-primary/5 border border-primary/15 mb-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">{t("discussion.threadSummary")}</p>
      </div>
      <p className="text-xs text-foreground leading-relaxed">{summary}</p>
    </div>
  );
};

const DiscussionPanel = ({ decisionId }: { decisionId: string }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { data: profiles = [] } = useProfiles();
  const queryClient = useQueryClient();
  const [comments, setComments] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [type, setType] = useState<CommentType>("comment");
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const typeConfig = useMemo(() => ({
    comment: { label: t("discussion.comment"), icon: MessageSquare, color: "text-primary" },
    feedback: { label: t("discussion.feedback"), icon: ThumbsUp, color: "text-success" },
    risk_flag: { label: t("discussion.riskFlag"), icon: AlertTriangle, color: "text-destructive" },
  }), [t]);

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

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart || 0;
    setContent(val);
    setCursorPos(pos);
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
      if (e.key === "ArrowDown") { e.preventDefault(); setMentionIndex(i => Math.min(i + 1, filteredProfiles.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setMentionIndex(i => Math.max(i - 1, 0)); }
      else if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertMention(filteredProfiles[mentionIndex]); }
      else if (e.key === "Escape") { setMentionQuery(null); }
    }
  }, [mentionQuery, filteredProfiles, mentionIndex, insertMention]);

  const handleSubmit = async () => {
    if (!content.trim() || !user) return;
    setLoading(true);

    // Upload file if present
    let fileUrl: string | null = null;
    let fileName: string | null = null;
    if (file) {
      const ext = file.name.split(".").pop();
      const path = `comments/${decisionId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("chat-attachments").upload(path, file);
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("chat-attachments").getPublicUrl(path);
        fileUrl = urlData.publicUrl;
        fileName = file.name;
      }
    }

    const contentWithFile = fileUrl
      ? `${content.trim()}\n\n📎 [${fileName}](${fileUrl})`
      : content.trim();

    await supabase.from("comments").insert({
      decision_id: decisionId,
      user_id: user.id,
      content: contentWithFile,
      type: type as any,
    });
    setContent("");
    setType("comment");
    setFile(null);
    setMentionQuery(null);
    await fetchComments();
    queryClient.invalidateQueries({ queryKey: ["comment-count", decisionId] });
    setLoading(false);
  };

  const locale = i18n.language === "de" ? "de-DE" : "en-US";

  return (
    <div className="space-y-4 mt-4">
      {/* AI Thread Summary */}
      <ThreadSummary decisionId={decisionId} commentCount={comments.length} />

      <div className="space-y-3 max-h-60 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{t("discussion.noComments")}</p>
        ) : comments.map((c) => {
          const cfg = typeConfig[c.type as CommentType] || typeConfig.comment;
          const Icon = cfg.icon;
          return (
            <div key={c.id} className="flex gap-3 p-3 rounded-lg bg-muted/30">
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{c.profiles?.full_name || t("discussion.unknown")}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${cfg.color} bg-current/10`}>{cfg.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(c.created_at).toLocaleDateString(locale, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
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
          {(Object.keys(typeConfig) as CommentType[]).map((tp) => {
            const cfg = typeConfig[tp];
            const Icon = cfg.icon;
            return (
              <Button key={tp} size="sm" variant={type === tp ? "default" : "outline"} className="text-xs h-7 gap-1" onClick={() => setType(tp)}>
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
              placeholder={t("discussion.placeholder")}
              className="w-full h-16 px-3 py-2 rounded-lg bg-muted/50 border border-border focus:border-foreground/30 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all text-sm resize-none"
            />
            {mentionQuery !== null && filteredProfiles.length > 0 && (
              <div ref={dropdownRef} className="absolute bottom-full left-0 mb-1 w-64 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50">
                <p className="text-[10px] text-muted-foreground px-3 pt-2 pb-1 font-semibold uppercase tracking-wider">
                  {t("discussion.mentionHeading")}
                </p>
                {filteredProfiles.map((p, i) => (
                  <button
                    key={p.user_id}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors",
                      i === mentionIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted/50"
                    )}
                    onMouseDown={(e) => { e.preventDefault(); insertMention(p); }}
                    onMouseEnter={() => setMentionIndex(i)}
                  >
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground shrink-0">
                      {(p.full_name || "?")[0].toUpperCase()}
                    </div>
                    <span className="truncate">{p.full_name || t("discussion.unknown")}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1 self-end">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="w-3.5 h-3.5" />
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !content.trim()} size="sm">
              {t("discussion.send")}
            </Button>
          </div>
        </div>
        {file && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1">
            <Paperclip className="w-3 h-3" />
            <span className="truncate">{file.name}</span>
            <button className="text-destructive hover:underline ml-auto text-[10px]" onClick={() => setFile(null)}>×</button>
          </div>
        )}
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <AtSign className="w-3 h-3" /> {t("discussion.mentionHint")}
        </p>
      </div>
    </div>
  );
};

export default DiscussionPanel;
