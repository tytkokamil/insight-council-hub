import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Video, PlayCircle, CheckCircle2, ThumbsUp, ThumbsDown, Minus as MinusIcon,
  FileText, ArrowRight, Timer, Users, Brain, Loader2, Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import AppLayout from "@/components/layout/AppLayout";
import { useDecisions, useProfiles, buildProfileMap, useReviews } from "@/hooks/useDecisions";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { statusLabels, priorityLabels } from "@/lib/labels";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const MeetingMode = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: allDecisions = [] } = useDecisions();
  const { data: profiles = [] } = useProfiles();
  const { data: reviews = [] } = useReviews();
  const profileMap = buildProfileMap(profiles);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("select");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [votes, setVotes] = useState<Record<string, "approve" | "reject" | "neutral">>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [generatingProtocol, setGeneratingProtocol] = useState(false);
  const [protocol, setProtocol] = useState<string>("");

  // Only show review-ready decisions
  const reviewReady = useMemo(() =>
    allDecisions.filter(d => ["proposed", "review", "draft"].includes(d.status)),
    [allDecisions]
  );

  const selectedDecisions = useMemo(() =>
    allDecisions.filter(d => selectedIds.has(d.id)),
    [allDecisions, selectedIds]
  );

  const currentDecision = selectedDecisions[currentIndex];

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const startReview = () => {
    if (selectedIds.size === 0) return;
    setCurrentIndex(0);
    setActiveTab("review");
  };

  const handleVote = async (decision: any, vote: "approve" | "reject" | "neutral") => {
    setVotes(prev => ({ ...prev, [decision.id]: vote }));

    if (vote === "approve" || vote === "reject") {
      const newStatus = vote === "approve" ? "approved" : "rejected";
      await supabase.from("decisions").update({ status: newStatus }).eq("id", decision.id);
      await supabase.from("audit_logs").insert({
        decision_id: decision.id,
        user_id: user!.id,
        action: `decision.status_changed`,
        field_name: "status",
        old_value: decision.status,
        new_value: newStatus,
      });
    }
  };

  const nextDecision = () => {
    if (currentIndex < selectedDecisions.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      setActiveTab("protocol");
    }
  };

  const generateProtocol = async () => {
    setGeneratingProtocol(true);
    try {
      const summary = selectedDecisions.map(d => {
        const vote = votes[d.id];
        const note = notes[d.id] || "";
        return `- "${d.title}" (${priorityLabels[d.priority]}): ${vote === "approve" ? "✅ Genehmigt" : vote === "reject" ? "❌ Abgelehnt" : "⏸️ Zurückgestellt"}${note ? ` — Anmerkung: ${note}` : ""}`;
      }).join("\n");

      const { data, error } = await supabase.functions.invoke("decision-copilot", {
        body: {
          prompt: `Erstelle ein professionelles Meeting-Protokoll auf Deutsch für folgende Entscheidungen, die in einem Decision Review Meeting besprochen wurden:\n\n${summary}\n\nDatum: ${format(new Date(), "dd.MM.yyyy HH:mm", { locale: de })}\n\nStrukturiere das Protokoll mit: Datum, Teilnehmer (${profileMap[user!.id] || "Meeting-Leiter"}), besprochene Entscheidungen, Ergebnisse und nächste Schritte.`,
        },
      });

      if (error) throw error;
      const text = typeof data === "string" ? data : data?.response || data?.text || JSON.stringify(data);
      setProtocol(text);
    } catch (e: any) {
      // Fallback: generate simple protocol locally
      const lines = selectedDecisions.map(d => {
        const vote = votes[d.id];
        const note = notes[d.id] || "";
        return `• ${d.title} — ${vote === "approve" ? "Genehmigt ✅" : vote === "reject" ? "Abgelehnt ❌" : "Zurückgestellt ⏸️"}${note ? `\n  Anmerkung: ${note}` : ""}`;
      });
      setProtocol(
        `Meeting-Protokoll — ${format(new Date(), "dd.MM.yyyy HH:mm", { locale: de })}\n` +
        `Leiter: ${profileMap[user!.id] || "—"}\n\n` +
        `Besprochene Entscheidungen:\n${lines.join("\n\n")}\n\n` +
        `Zusammenfassung: ${selectedDecisions.length} Entscheidungen besprochen, davon ${Object.values(votes).filter(v => v === "approve").length} genehmigt, ${Object.values(votes).filter(v => v === "reject").length} abgelehnt.`
      );
    }
    setGeneratingProtocol(false);
  };

  const copyProtocol = () => {
    navigator.clipboard.writeText(protocol);
    toast.success("Protokoll kopiert");
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" /> Meeting Mode
          </h1>
          <p className="text-sm text-muted-foreground">Live-Review, Abstimmung und Auto-Protokoll</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="select" className="gap-1.5"><FileText className="w-3.5 h-3.5" /> Agenda</TabsTrigger>
          <TabsTrigger value="review" disabled={selectedIds.size === 0} className="gap-1.5"><PlayCircle className="w-3.5 h-3.5" /> Review</TabsTrigger>
          <TabsTrigger value="protocol" className="gap-1.5"><FileText className="w-3.5 h-3.5" /> Protokoll</TabsTrigger>
        </TabsList>

        {/* SELECT / AGENDA */}
        <TabsContent value="select">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Wähle die Entscheidungen für das Meeting ({selectedIds.size} ausgewählt)</p>
            {reviewReady.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">Keine offenen Entscheidungen zur Besprechung.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {reviewReady.map(d => (
                  <button
                    key={d.id}
                    onClick={() => toggleSelect(d.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-colors text-left ${
                      selectedIds.has(d.id) ? "border-primary bg-primary/5" : "border-border hover:border-foreground/20"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                      selectedIds.has(d.id) ? "border-primary bg-primary" : "border-muted-foreground/30"
                    }`}>
                      {selectedIds.has(d.id) && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{d.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{d.description || "Keine Beschreibung"}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-[10px]">{statusLabels[d.status]}</Badge>
                      <Badge variant="outline" className="text-[10px]">{priorityLabels[d.priority]}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {selectedIds.size > 0 && (
              <Button onClick={startReview} className="gap-1.5">
                <PlayCircle className="w-4 h-4" /> Review starten ({selectedIds.size} Decisions)
              </Button>
            )}
          </div>
        </TabsContent>

        {/* LIVE REVIEW */}
        <TabsContent value="review">
          {currentDecision && (
            <motion.div
              key={currentDecision.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline" className="text-xs">
                  {currentIndex + 1} / {selectedDecisions.length}
                </Badge>
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{priorityLabels[currentDecision.priority]}</span>
                </div>
              </div>

              <Card className="mb-6">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-2">{currentDecision.title}</h2>
                  <p className="text-sm text-muted-foreground mb-4">{currentDecision.description || "Keine Beschreibung"}</p>
                  {currentDecision.context && (
                    <div className="mb-4 p-3 rounded-lg bg-muted/30 border border-border">
                      <p className="text-xs font-semibold mb-1">Kontext</p>
                      <p className="text-xs text-muted-foreground whitespace-pre-line">{currentDecision.context}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Owner: {profileMap[currentDecision.owner_id || currentDecision.created_by] || "—"}</span>
                    {currentDecision.ai_risk_score != null && (
                      <span>KI-Risiko: {currentDecision.ai_risk_score}%</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Voting */}
              <div className="flex items-center gap-3 mb-4">
                <p className="text-sm font-medium">Abstimmung:</p>
                {([
                  { value: "approve", icon: ThumbsUp, label: "Genehmigen", color: "text-success hover:bg-success/10" },
                  { value: "neutral", icon: MinusIcon, label: "Zurückstellen", color: "text-warning hover:bg-warning/10" },
                  { value: "reject", icon: ThumbsDown, label: "Ablehnen", color: "text-destructive hover:bg-destructive/10" },
                ] as const).map(opt => (
                  <Button
                    key={opt.value}
                    variant={votes[currentDecision.id] === opt.value ? "default" : "outline"}
                    size="sm"
                    className={`gap-1.5 ${votes[currentDecision.id] !== opt.value ? opt.color : ""}`}
                    onClick={() => handleVote(currentDecision, opt.value)}
                  >
                    <opt.icon className="w-3.5 h-3.5" /> {opt.label}
                  </Button>
                ))}
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Meeting-Notiz</label>
                <Textarea
                  value={notes[currentDecision.id] || ""}
                  onChange={e => setNotes(prev => ({ ...prev, [currentDecision.id]: e.target.value }))}
                  rows={2}
                  placeholder="Anmerkungen, Bedingungen, nächste Schritte..."
                />
              </div>

              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => navigate(`/decisions/${currentDecision.id}`)}>
                  Details öffnen <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
                <Button onClick={nextDecision} className="gap-1.5">
                  {currentIndex < selectedDecisions.length - 1 ? "Nächste" : "Zum Protokoll"} <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </TabsContent>

        {/* PROTOCOL */}
        <TabsContent value="protocol">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Meeting-Zusammenfassung</h3>
              {!protocol && (
                <Button onClick={generateProtocol} disabled={generatingProtocol} size="sm" className="gap-1.5">
                  {generatingProtocol ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                  {generatingProtocol ? "Generiere..." : "Auto-Protokoll generieren"}
                </Button>
              )}
            </div>

            {/* Quick summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="border border-border rounded-lg p-4 text-center">
                <p className="text-2xl font-semibold text-success">{Object.values(votes).filter(v => v === "approve").length}</p>
                <p className="text-xs text-muted-foreground">Genehmigt</p>
              </div>
              <div className="border border-border rounded-lg p-4 text-center">
                <p className="text-2xl font-semibold text-destructive">{Object.values(votes).filter(v => v === "reject").length}</p>
                <p className="text-xs text-muted-foreground">Abgelehnt</p>
              </div>
              <div className="border border-border rounded-lg p-4 text-center">
                <p className="text-2xl font-semibold text-warning">{Object.values(votes).filter(v => v === "neutral").length}</p>
                <p className="text-xs text-muted-foreground">Zurückgestellt</p>
              </div>
            </div>

            {/* Decision list */}
            <div className="space-y-2">
              {selectedDecisions.map(d => (
                <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  {votes[d.id] === "approve" && <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}
                  {votes[d.id] === "reject" && <ThumbsDown className="w-4 h-4 text-destructive shrink-0" />}
                  {votes[d.id] === "neutral" && <MinusIcon className="w-4 h-4 text-warning shrink-0" />}
                  {!votes[d.id] && <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{d.title}</p>
                    {notes[d.id] && <p className="text-xs text-muted-foreground mt-0.5 truncate">{notes[d.id]}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* Generated protocol */}
            {protocol && (
              <div className="relative">
                <div className="p-4 rounded-lg bg-muted/30 border border-border">
                  <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">{protocol}</pre>
                </div>
                <Button variant="outline" size="sm" className="absolute top-2 right-2 gap-1" onClick={copyProtocol}>
                  <Copy className="w-3 h-3" /> Kopieren
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default MeetingMode;
