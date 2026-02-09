import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Plus, User } from "lucide-react";

const ReviewPanel = ({ decision, onUpdated }: { decision: any; onUpdated: () => void }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedReviewer, setSelectedReviewer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    fetchReviews();
    fetchProfiles();
  }, [decision.id]);

  const addReviewer = async () => {
    if (!selectedReviewer) return;
    setLoading(true);
    const nextOrder = reviews.length + 1;
    await supabase.from("decision_reviews").insert({
      decision_id: decision.id,
      reviewer_id: selectedReviewer,
      step_order: nextOrder,
    });
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

    // Log audit
    await supabase.from("audit_logs").insert({
      decision_id: decision.id,
      user_id: user!.id,
      action: `review_${newStatus}`,
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

  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-2">
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Noch keine Reviewer zugewiesen.</p>
        ) : reviews.map((r, i) => {
          const isMyReview = r.reviewer_id === user?.id && r.status === "review";
          return (
            <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                {i + 1}
              </div>
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium flex-1">{r.profiles?.full_name || "Unbekannt"}</span>
              <span className={`text-xs font-medium capitalize ${statusColors[r.status] || ""}`}>
                {r.status === "review" ? "Ausstehend" : r.status === "approved" ? "Genehmigt" : r.status === "rejected" ? "Abgelehnt" : r.status}
              </span>
              {r.feedback && <span className="text-xs text-muted-foreground truncate max-w-32">"{r.feedback}"</span>}
              {isMyReview && (
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-success" onClick={() => handleReview(r.id, "approved")} disabled={loading}>
                    <CheckCircle2 className="w-3 h-3" /> Genehmigen
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-destructive" onClick={() => handleReview(r.id, "rejected")} disabled={loading}>
                    <XCircle className="w-3 h-3" /> Ablehnen
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {reviews.some((r) => r.reviewer_id === user?.id && r.status === "review") && (
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Optionales Feedback..."
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
            <option value="">Reviewer auswählen...</option>
            {profiles
              .filter((p) => !reviews.some((r) => r.reviewer_id === p.user_id))
              .map((p) => (
                <option key={p.user_id} value={p.user_id}>{p.full_name || p.user_id}</option>
              ))}
          </select>
          <Button size="sm" onClick={addReviewer} disabled={!selectedReviewer || loading}>
            <Plus className="w-4 h-4" /> Hinzufügen
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReviewPanel;
