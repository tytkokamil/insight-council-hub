import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Plus, User, UserCheck, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

const ReviewPanel = ({ decision, onUpdated }: { decision: any; onUpdated: () => void }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [externalReviews, setExternalReviews] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedReviewer, setSelectedReviewer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [delegationsForMe, setDelegationsForMe] = useState<string[]>([]);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("decision_reviews")
      .select("*, profiles!decision_reviews_reviewer_id_fkey(full_name)")
      .eq("decision_id", decision.id)
      .order("step_order", { ascending: true });
    if (data) setReviews(data);
  };

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("user_id, full_name");
    if (data) setProfiles(data.filter((p) => p.user_id !== user?.id));
  };

  const fetchDelegations = async () => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("review_delegations")
      .select("delegator_id, scope, scope_value")
      .eq("delegate_id", user.id)
      .eq("active", true)
      .lte("start_date", today)
      .gte("end_date", today);
    if (data) {
      // Filter by scope: match all, or category/team if applicable
      const validDelegatorIds = data
        .filter(d => {
          if (d.scope === "all") return true;
          if (d.scope === "category" && decision.category === d.scope_value) return true;
          if (d.scope === "team" && decision.team_id === d.scope_value) return true;
          return false;
        })
        .map(d => d.delegator_id);
      setDelegationsForMe(validDelegatorIds);
    }
  };

  const fetchExternalReviews = async () => {
    const { data } = await supabase
      .from("external_review_tokens")
      .select("id, reviewer_name, reviewer_email, status, action_taken, acted_at, feedback")
      .eq("decision_id", decision.id)
      .order("created_at", { ascending: true });
    if (data) setExternalReviews(data);
  };

  useEffect(() => {
    fetchReviews();
    fetchProfiles();
    fetchDelegations();
    fetchExternalReviews();
  }, [decision.id]);

  const addReviewer = async () => {
    if (!selectedReviewer) return;
    setLoading(true);
    const nextOrder = reviews.length + 1;
    const { data: newReview } = await supabase.from("decision_reviews").insert({
      decision_id: decision.id,
      reviewer_id: selectedReviewer,
      step_order: nextOrder,
    }).select().single();

    // Trigger email notification
    if (newReview) {
      supabase.functions.invoke("review-notify", {
        body: {
          decision_id: decision.id,
          reviewer_id: selectedReviewer,
          review_id: newReview.id,
        },
      }).catch(() => {});
    }

    // Check if reviewer has an active delegation — add delegate as additional reviewer
    const today = new Date().toISOString().split("T")[0];
    const { data: activeDelegation } = await supabase
      .from("review_delegations")
      .select("delegate_id, scope, scope_value")
      .eq("delegator_id", selectedReviewer)
      .eq("active", true)
      .lte("start_date", today)
      .gte("end_date", today)
      .limit(1)
      .maybeSingle();

    if (activeDelegation) {
      // Check scope
      const scopeMatch =
        activeDelegation.scope === "all" ||
        (activeDelegation.scope === "category" && decision.category === activeDelegation.scope_value) ||
        (activeDelegation.scope === "team" && decision.team_id === activeDelegation.scope_value);

      if (scopeMatch) {
        // Add delegate as additional reviewer
        await supabase.from("decision_reviews").insert({
          decision_id: decision.id,
          reviewer_id: activeDelegation.delegate_id,
          step_order: nextOrder,
        });

        // Notify delegate
        supabase.functions.invoke("review-notify", {
          body: {
            decision_id: decision.id,
            reviewer_id: activeDelegation.delegate_id,
            review_id: newReview?.id,
          },
        }).catch(() => {});

        // Audit trail
        const reviewerName = profiles.find(p => p.user_id === selectedReviewer)?.full_name || "Unbekannt";
        const delegateName = profiles.find(p => p.user_id === activeDelegation.delegate_id)?.full_name || "Unbekannt";
        await supabase.from("audit_logs").insert({
          decision_id: decision.id,
          user_id: user!.id,
          action: "review_delegated",
          field_name: "reviewer",
          old_value: reviewerName,
          new_value: `Delegiert an ${delegateName} (Vertretung aktiv)`,
        });
      }
    }

    setSelectedReviewer("");
    await fetchReviews();
    setLoading(false);
  };

  const handleReview = async (reviewId: string, newStatus: "approved" | "rejected") => {
    setLoading(true);
    await supabase.from("decision_reviews").update({
      status: newStatus,
      feedback: feedback || null,
      reviewed_at: new Date().toISOString(),
    }).eq("id", reviewId);

    const { EventTypes } = await import("@/lib/eventTaxonomy");
    await supabase.from("audit_logs").insert({
      decision_id: decision.id,
      user_id: user!.id,
      action: newStatus === "approved" ? EventTypes.REVIEW_APPROVED : EventTypes.REVIEW_REJECTED,
      field_name: "review",
      new_value: feedback || newStatus,
    });

    setFeedback("");
    await fetchReviews();
    onUpdated();
    setLoading(false);
  };

  const isOwner = user?.id === decision.created_by;
  const statusColors: Record<string, string> = {
    draft: "text-muted-foreground",
    review: "text-warning",
    approved: "text-success",
    rejected: "text-destructive",
  };

  const canActOnReview = (r: any) => {
    if (r.status !== "review") return false;
    if (r.reviewer_id === user?.id) return true;
    return delegationsForMe.includes(r.reviewer_id);
  };

  const getDelegatorName = (reviewerId: string) => {
    const profile = profiles.find(p => p.user_id === reviewerId);
    return profile?.full_name || t("reviewPanel.unknown");
  };

  const statusLabel = (s: string) => {
    if (s === "review") return t("reviewPanel.pending");
    if (s === "approved") return t("reviewPanel.approved");
    if (s === "rejected") return t("reviewPanel.rejected");
    return s;
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-2">
        {reviews.length === 0 && externalReviews.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{t("reviewPanel.noReviewers")}</p>
        ) : (
          <>
            {reviews.map((r, i) => {
              const canAct = canActOnReview(r);
              const isDelegated = canAct && r.reviewer_id !== user?.id;
              return (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </div>
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{r.profiles?.full_name || t("reviewPanel.unknown")}</span>
                    {isDelegated && (
                      <span className="flex items-center gap-1 text-[10px] text-primary mt-0.5">
                        <UserCheck className="w-3 h-3" /> {t("reviewPanel.delegating", { name: getDelegatorName(r.reviewer_id) })}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-medium capitalize ${statusColors[r.status] || ""}`}>
                    {statusLabel(r.status)}
                  </span>
                  {r.feedback && <span className="text-xs text-muted-foreground truncate max-w-32">"{r.feedback}"</span>}
                  {canAct && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-success" onClick={() => handleReview(r.id, "approved")} disabled={loading}>
                        <CheckCircle2 className="w-3 h-3" /> {t("reviewPanel.approve")}
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-destructive" onClick={() => handleReview(r.id, "rejected")} disabled={loading}>
                        <XCircle className="w-3 h-3" /> {t("reviewPanel.reject")}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* External reviews */}
            {externalReviews.map((er) => {
              const extStatusColors: Record<string, string> = {
                pending: "text-warning",
                approved: "text-success",
                rejected: "text-destructive",
              };
              const extStatusLabel = (s: string) => {
                if (s === "approved") return t("reviewPanel.approved");
                if (s === "rejected") return t("reviewPanel.rejected");
                return t("reviewPanel.pending");
              };
              return (
                <div key={er.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="w-7 h-7 rounded-full bg-muted/60 flex items-center justify-center">
                    <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{er.reviewer_name || er.reviewer_email}</span>
                      <Badge variant="outline" className="text-[9px] bg-muted/50 text-muted-foreground border-border h-4 px-1.5">
                        Extern
                      </Badge>
                    </div>
                    {er.reviewer_name && (
                      <span className="text-[10px] text-muted-foreground">{er.reviewer_email}</span>
                    )}
                  </div>
                  <span className={`text-xs font-medium capitalize ${extStatusColors[er.status] || ""}`}>
                    {extStatusLabel(er.status)}
                  </span>
                  {er.feedback && <span className="text-xs text-muted-foreground truncate max-w-32">"{er.feedback}"</span>}
                </div>
              );
            })}
          </>
        )}
      </div>

      {reviews.some((r) => canActOnReview(r)) && (
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder={t("reviewPanel.feedbackPlaceholder")}
          className="w-full h-16 px-3 py-2 rounded-lg bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all text-sm resize-none"
        />
      )}

      {isOwner && (
        <div className="flex gap-2 pt-2 border-t border-border">
          <select
            value={selectedReviewer}
            onChange={(e) => setSelectedReviewer(e.target.value)}
            className="flex-1 h-9 px-3 rounded-lg bg-muted/50 border border-border text-sm"
          >
            <option value="">{t("reviewPanel.selectReviewer")}</option>
            {profiles
              .filter((p) => !reviews.some((r) => r.reviewer_id === p.user_id))
              .map((p) => (
                <option key={p.user_id} value={p.user_id}>{p.full_name || p.user_id}</option>
              ))}
          </select>
          <Button size="sm" onClick={addReviewer} disabled={!selectedReviewer || loading}>
            <Plus className="w-4 h-4" /> {t("reviewPanel.add")}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReviewPanel;
