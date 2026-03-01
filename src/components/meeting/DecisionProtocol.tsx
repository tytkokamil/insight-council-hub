import { useState } from "react";
import {
  Brain, Loader2, Copy, ListTodo, Plus, CheckCircle2, ThumbsDown,
  Minus as MinusIcon, FileDown, Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { priorityLabels } from "@/lib/labels";
import { useTranslation } from "react-i18next";

interface Decision {
  id: string; title: string; description?: string | null; priority: string;
  status: string; team_id?: string | null; ai_risk_score?: number | null;
}

interface MeetingNote { note: string; conditions: string; followups: string; }

interface Props {
  decisions: Decision[];
  votes: Record<string, "approve" | "reject" | "neutral">;
  meetingNotes: Record<string, MeetingNote>;
  profileMap: Record<string, string>;
  userId: string;
}

const DecisionProtocol = ({ decisions, votes, meetingNotes, profileMap, userId }: Props) => {
  const { t, i18n } = useTranslation();
  const dateFnsLocale = i18n.language === "de" ? de : enUS;
  const [generatingProtocol, setGeneratingProtocol] = useState(false);
  const [protocol, setProtocol] = useState("");
  const [extractedTasks, setExtractedTasks] = useState<{ title: string; priority: string }[]>([]);
  const [creatingTasks, setCreatingTasks] = useState(false);

  const approved = decisions.filter(d => votes[d.id] === "approve");
  const rejected = decisions.filter(d => votes[d.id] === "reject");
  const deferred = decisions.filter(d => votes[d.id] === "neutral");
  const unvoted = decisions.filter(d => !votes[d.id]);

  const generateProtocol = async () => {
    setGeneratingProtocol(true);
    try {
      const summary = decisions.map(d => {
        const vote = votes[d.id];
        const mn = meetingNotes[d.id] || { note: "", conditions: "", followups: "" };
        return `- "${d.title}" (${priorityLabels[d.priority]}): ${vote === "approve" ? `✅ ${t("meeting.approved")}` : vote === "reject" ? `❌ ${t("meeting.rejected")}` : `⏸️ ${t("meeting.deferred")}`}${mn.note ? ` — ${mn.note}` : ""}${mn.conditions ? ` | ${t("meeting.conditionsNote")}: ${mn.conditions}` : ""}${mn.followups ? ` | ${t("meeting.followupsNote")}: ${mn.followups}` : ""}`;
      }).join("\n");

      const { data, error } = await supabase.functions.invoke("decision-copilot", {
        body: {
          prompt: `Erstelle ein professionelles Decision Room Protokoll auf Deutsch.\n\nEntscheidungen:\n${summary}\n\nDatum: ${format(new Date(), "dd.MM.yyyy HH:mm", { locale: dateFnsLocale })}\nLeiter: ${profileMap[userId] || "Meeting-Leiter"}\n\nStrukturiere nach: Datum, Teilnehmer, GENEHMIGTE Entscheidungen (mit Bedingungen), ABGELEHNTE Entscheidungen (mit Begründung), ZURÜCKGESTELLTE (mit Grund).\n\nAm Ende: "AUFGABEN:" mit Action Items "- [Aufgabe] (Priorität: hoch/mittel/niedrig)"`,
        },
      });

      if (error) throw error;
      const text = typeof data === "string" ? data : data?.response || data?.text || JSON.stringify(data);
      setProtocol(text);
      extractTasks(text);
    } catch {
      const lines = decisions.map(d => {
        const vote = votes[d.id];
        const mn = meetingNotes[d.id] || { note: "", conditions: "", followups: "" };
        return `• ${d.title} — ${vote === "approve" ? `${t("meeting.approved")} ✅` : vote === "reject" ? `${t("meeting.rejected")} ❌` : `${t("meeting.deferred")} ⏸️`}${mn.note ? `\n  ${mn.note}` : ""}${mn.conditions ? `\n  ${t("meeting.conditionsNote")}: ${mn.conditions}` : ""}${mn.followups ? `\n  ${t("meeting.followupsNote")}: ${mn.followups}` : ""}`;
      });
      setProtocol(
        `Decision Room Protokoll — ${format(new Date(), "dd.MM.yyyy HH:mm", { locale: dateFnsLocale })}\n${profileMap[userId] || "—"}\n\n${lines.join("\n\n")}\n\n${decisions.length} ${t("meeting.decisionsLabel")}, ${approved.length} ${t("meeting.approved")}, ${rejected.length} ${t("meeting.rejected")}, ${deferred.length} ${t("meeting.deferred")}.`
      );
      const fallbackTasks = approved.map(d => ({
        title: `Follow-up: ${d.title}`,
        priority: d.priority === "critical" ? "high" : d.priority,
      }));
      setExtractedTasks(fallbackTasks);
    }
    setGeneratingProtocol(false);
  };

  const extractTasks = (text: string) => {
    const tasks: { title: string; priority: string }[] = [];
    const lines = text.split("\n");
    let inSection = false;
    for (const line of lines) {
      if (/aufgaben|action item|nächste schritte/i.test(line)) { inSection = true; continue; }
      if (inSection && /^[-•\d.]/.test(line.trim())) {
        const cleaned = line.replace(/^[-•\d.)\s]+/, "").trim();
        if (cleaned.length < 5) continue;
        const pm = cleaned.match(/\((?:Priorität|Priority)[:\s]*(hoch|mittel|niedrig|high|medium|low)\)/i);
        const priority = pm ? (/hoch|high/i.test(pm[1]) ? "high" : /niedrig|low/i.test(pm[1]) ? "low" : "medium") : "medium";
        const title = cleaned.replace(/\((?:Priorität|Priority)[:\s]*(?:hoch|mittel|niedrig|high|medium|low)\)/gi, "").trim();
        if (title) tasks.push({ title, priority });
      }
    }
    if (tasks.length === 0) {
      approved.forEach(d => tasks.push({ title: `Follow-up: ${d.title}`, priority: d.priority === "critical" ? "high" : d.priority }));
    }
    setExtractedTasks(tasks);
  };

  const createAllTasks = async () => {
    if (extractedTasks.length === 0) return;
    setCreatingTasks(true);
    try {
      const teamId = decisions[0]?.team_id || null;
      const inserts = extractedTasks.map(tsk => ({
        title: tsk.title, priority: tsk.priority as any, status: "open" as const,
        created_by: userId, team_id: teamId, category: "general" as const,
      }));
      const { error } = await supabase.from("tasks").insert(inserts);
      if (error) throw error;
      toast.success(t("meeting.tasksCreated", { count: extractedTasks.length }));
      setExtractedTasks([]);
    } catch (e: any) {
      toast.error(e.message || t("meeting.createError"));
    }
    setCreatingTasks(false);
  };

  const copyProtocol = () => {
    navigator.clipboard.writeText(protocol);
    toast.success(t("meeting.protocolCopied"));
  };

  const renderGroup = (title: string, items: Decision[], icon: React.ReactNode, color: string) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        <h4 className={`text-xs font-semibold flex items-center gap-1.5 ${color}`}>
          {icon} {title} ({items.length})
        </h4>
        {items.map(d => {
          const mn = meetingNotes[d.id] || { note: "", conditions: "", followups: "" };
          return (
            <div key={d.id} className="p-3 rounded-lg border border-border/60 bg-muted/10">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium flex-1">{d.title}</p>
                <Badge variant="outline" className="text-[10px]">{priorityLabels[d.priority]}</Badge>
              </div>
              {mn.note && <p className="text-xs text-muted-foreground mt-1">📝 {mn.note}</p>}
              {mn.conditions && <p className="text-xs text-muted-foreground mt-0.5">📋 {t("meeting.conditionsNote")}: {mn.conditions}</p>}
              {mn.followups && <p className="text-xs text-muted-foreground mt-0.5">➡️ {t("meeting.followupsNote")}: {mn.followups}</p>}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t("meeting.summary")}</h3>
        {!protocol && (
          <Button onClick={generateProtocol} disabled={generatingProtocol} size="sm" className="gap-1.5">
            {generatingProtocol ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
            {generatingProtocol ? t("meeting.generating") : t("meeting.generateProtocol")}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="border border-border/60 rounded-lg p-4 text-center">
          <p className="text-2xl font-semibold text-success">{approved.length}</p>
          <p className="text-xs text-muted-foreground">{t("meeting.approved")}</p>
        </div>
        <div className="border border-border/60 rounded-lg p-4 text-center">
          <p className="text-2xl font-semibold text-destructive">{rejected.length}</p>
          <p className="text-xs text-muted-foreground">{t("meeting.rejected")}</p>
        </div>
        <div className="border border-border/60 rounded-lg p-4 text-center">
          <p className="text-2xl font-semibold text-warning">{deferred.length}</p>
          <p className="text-xs text-muted-foreground">{t("meeting.deferred")}</p>
        </div>
        <div className="border border-border/60 rounded-lg p-4 text-center">
          <p className="text-2xl font-semibold text-muted-foreground">{unvoted.length}</p>
          <p className="text-xs text-muted-foreground">{t("meeting.open")}</p>
        </div>
      </div>

      {renderGroup(t("meeting.approved"), approved, <CheckCircle2 className="w-3.5 h-3.5" />, "text-success")}
      {renderGroup(t("meeting.rejected"), rejected, <ThumbsDown className="w-3.5 h-3.5" />, "text-destructive")}
      {renderGroup(t("meeting.deferred"), deferred, <MinusIcon className="w-3.5 h-3.5" />, "text-warning")}

      {protocol && (
        <div className="relative">
          <div className="p-4 rounded-lg bg-muted/30 border border-border/60">
            <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">{protocol}</pre>
          </div>
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <Button variant="outline" size="sm" className="gap-1 h-7" onClick={copyProtocol}>
              <Copy className="w-3 h-3" /> {t("meeting.copy")}
            </Button>
          </div>
        </div>
      )}

      {extractedTasks.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-border/40">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <ListTodo className="w-4 h-4 text-primary" /> {t("meeting.extractedTasks", { count: extractedTasks.length })}
            </h4>
            <Button size="sm" onClick={createAllTasks} disabled={creatingTasks} className="gap-1.5">
              {creatingTasks ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {t("meeting.createAllTasks")}
            </Button>
          </div>
          <div className="space-y-1.5">
            {extractedTasks.map((tsk, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg border border-border/60 bg-muted/10">
                <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                <span className="text-xs flex-1">{tsk.title}</span>
                <Badge variant="outline" className="text-[10px]">
                  {tsk.priority === "high" ? t("meeting.prioHigh") : tsk.priority === "low" ? t("meeting.prioLow") : t("meeting.prioMedium")}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DecisionProtocol;
