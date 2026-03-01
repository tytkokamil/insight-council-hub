import { useState, useMemo } from "react";
import { formatNumber } from "@/lib/formatters";
import { FileText, PlayCircle, CheckCircle2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/components/layout/AppLayout";
import { useDecisions, useProfiles, buildProfileMap, useReviews, useDependencies } from "@/hooks/useDecisions";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useTranslatedLabels } from "@/lib/labels";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import DecisionRoomHeader from "@/components/meeting/DecisionRoomHeader";
import DecisionReviewCard from "@/components/meeting/DecisionReviewCard";
import DecisionProtocol from "@/components/meeting/DecisionProtocol";

interface MeetingNote {
  note: string;
  conditions: string;
  followups: string;
}

const MeetingMode = () => {
  const { t } = useTranslation();
  const tl = useTranslatedLabels(t);
  const { user } = useAuth();
  const { data: allDecisions = [] } = useDecisions();
  const { data: profiles = [] } = useProfiles();
  const { data: reviews = [] } = useReviews();
  const { data: dependencies = [] } = useDependencies();
  const profileMap = buildProfileMap(profiles);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("select");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [votes, setVotes] = useState<Record<string, "approve" | "reject" | "neutral">>({});
  const [meetingNotes, setMeetingNotes] = useState<Record<string, MeetingNote>>({});

  const reviewReady = useMemo(() =>
    allDecisions.filter(d => ["proposed", "review", "draft"].includes(d.status)),
    [allDecisions]
  );

  const selectedDecisions = useMemo(() =>
    allDecisions.filter(d => selectedIds.has(d.id)),
    [allDecisions, selectedIds]
  );

  const currentDecision = selectedDecisions[currentIndex];

  // Compute strategic metrics
  const criticalCount = selectedDecisions.filter(d => d.priority === "critical").length;
  const escalatedCount = selectedDecisions.filter(d => (d.escalation_level || 0) >= 1).length;
  const reviewedCount = Object.keys(votes).filter(id => selectedIds.has(id)).length;

  const getCostOfDelay = (d: any) => {
    const risk = d.ai_risk_score || 0;
    const impact = d.ai_impact_score || 0;
    return Math.round(((risk + impact) / 200) * 5000);
  };

  const totalRisk = selectedDecisions.reduce((sum, d) => sum + getCostOfDelay(d), 0);
  const riskReduction = Object.entries(votes)
    .filter(([, v]) => v === "approve")
    .reduce((sum, [id]) => {
      const d = allDecisions.find(dec => dec.id === id);
      return sum + (d ? getCostOfDelay(d) : 0);
    }, 0);

  // Get blockers for a decision
  const getBlockers = (decisionId: string) => {
    const blockers: { id: string; title: string; status: string; type: "decision" | "task" }[] = [];
    dependencies.forEach(dep => {
      if (dep.target_decision_id === decisionId && dep.source_decision_id) {
        const src = allDecisions.find(d => d.id === dep.source_decision_id);
        if (src && !["approved", "implemented"].includes(src.status)) {
          blockers.push({ id: src.id, title: src.title, status: src.status, type: "decision" });
        }
      }
    });
    return blockers;
  };

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

    // Persist vote to decision_votes table
    if (user) {
      const { error } = await supabase.from("decision_votes").upsert({
        decision_id: decision.id,
        user_id: user.id,
        vote,
      }, { onConflict: "decision_id,user_id" });
      if (error) {
        // fallback: simple insert
        await supabase.from("decision_votes").insert({
          decision_id: decision.id,
          user_id: user.id,
          vote,
        });
      }
    }

    if (vote === "approve" || vote === "reject") {
      const newStatus = vote === "approve" ? "approved" : "rejected";
      await supabase.from("decisions").update({ status: newStatus }).eq("id", decision.id);
      await supabase.from("audit_logs").insert({
        decision_id: decision.id,
        user_id: user!.id,
        action: "decision.status_changed",
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

  const getNote = (id: string) => meetingNotes[id] || { note: "", conditions: "", followups: "" };
  const updateNote = (id: string, field: keyof MeetingNote, value: string) => {
    setMeetingNotes(prev => ({
      ...prev,
      [id]: { ...getNote(id), [field]: value },
    }));
  };

  return (
    <AppLayout>
      <DecisionRoomHeader
        totalDecisions={selectedDecisions.length}
        criticalCount={criticalCount}
        totalRisk={totalRisk}
        participantCount={profiles.length > 0 ? Math.min(profiles.length, 6) : 1}
        reviewedCount={reviewedCount}
        riskReduction={riskReduction}
        openEscalations={escalatedCount}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="select" className="gap-1.5"><FileText className="w-3.5 h-3.5" /> {t("meeting.agenda")}</TabsTrigger>
          <TabsTrigger value="review" disabled={selectedIds.size === 0} className="gap-1.5"><PlayCircle className="w-3.5 h-3.5" /> {t("meeting.review")}</TabsTrigger>
          <TabsTrigger value="protocol" className="gap-1.5"><Shield className="w-3.5 h-3.5" /> {t("meeting.protocol")}</TabsTrigger>
        </TabsList>

        {/* AGENDA */}
        <TabsContent value="select">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("meeting.selectForRoom", { count: selectedIds.size })}</p>
            {reviewReady.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">{t("meeting.noOpenDecisions")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {reviewReady.map(d => {
                  const cost = getCostOfDelay(d);
                  const isEscalated = (d.escalation_level || 0) >= 1;
                  return (
                    <button
                      key={d.id}
                      onClick={() => toggleSelect(d.id)}
                      className={`w-full flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-4 rounded-lg border transition-colors text-left ${
                        selectedIds.has(d.id) ? "border-primary bg-primary/5" : "border-border/60 hover:border-foreground/20"
                      }`}
                    >
                      <div className="flex items-center gap-3 w-full sm:w-auto sm:flex-1 min-w-0">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                          selectedIds.has(d.id) ? "border-primary bg-primary" : "border-muted-foreground/30"
                        }`}>
                          {selectedIds.has(d.id) && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{d.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{d.description || t("meeting.noDescription")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap pl-8 sm:pl-0 shrink-0">
                        <Badge variant="outline" className="text-[10px]">{tl.statusLabels[d.status]}</Badge>
                        <Badge variant={d.priority === "critical" ? "destructive" : "outline"} className="text-[10px]">
                          {tl.priorityLabels[d.priority]}
                        </Badge>
                        {isEscalated && <Badge variant="destructive" className="text-[10px]">⚠️</Badge>}
                        {cost > 0 && (
                          <span className="text-[10px] text-warning font-medium">{formatNumber(cost)}{t("meeting.perWeek")}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {selectedIds.size > 0 && (
              <Button onClick={startReview} className="gap-1.5">
                <PlayCircle className="w-4 h-4" /> {t("meeting.startReview", { count: selectedIds.size })}
              </Button>
            )}
          </div>
        </TabsContent>

        {/* REVIEW */}
        <TabsContent value="review">
          {currentDecision && (
            <DecisionReviewCard
              decision={currentDecision}
              currentIndex={currentIndex}
              total={selectedDecisions.length}
              vote={votes[currentDecision.id]}
              onVote={(v) => handleVote(currentDecision, v)}
              onNext={nextDecision}
              profileMap={profileMap}
              blockers={getBlockers(currentDecision.id)}
              costOfDelay={getCostOfDelay(currentDecision)}
              notes={getNote(currentDecision.id).note}
              onNotesChange={(v) => updateNote(currentDecision.id, "note", v)}
              noteConditions={getNote(currentDecision.id).conditions}
              onConditionsChange={(v) => updateNote(currentDecision.id, "conditions", v)}
              noteFollowups={getNote(currentDecision.id).followups}
              onFollowupsChange={(v) => updateNote(currentDecision.id, "followups", v)}
            />
          )}
        </TabsContent>

        {/* PROTOCOL */}
        <TabsContent value="protocol">
          {user && (
            <DecisionProtocol
              decisions={selectedDecisions}
              votes={votes}
              meetingNotes={meetingNotes}
              profileMap={profileMap}
              userId={user.id}
            />
          )}
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default MeetingMode;
