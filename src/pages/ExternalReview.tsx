import { useState, useEffect } from "react";
import { useSearchParams, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, XCircle, FileText, Paperclip, MessageSquare, Clock,
  Loader2, AlertTriangle, ShieldCheck, ExternalLink, DollarSign
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import decivioLogo from "@/assets/decivio-logo.png";

const priorityConfig: Record<string, { label: string; class: string }> = {
  critical: { label: "Kritisch", class: "bg-destructive/10 text-destructive border-destructive/30" },
  high: { label: "Hoch", class: "bg-orange-500/10 text-orange-600 border-orange-500/30" },
  medium: { label: "Mittel", class: "bg-primary/10 text-primary border-primary/30" },
  low: { label: "Niedrig", class: "bg-muted text-muted-foreground border-border" },
};

const statusLabels: Record<string, string> = {
  draft: "Entwurf", proposed: "Vorgeschlagen", review: "In Review",
  approved: "Genehmigt", rejected: "Abgelehnt", implemented: "Umgesetzt",
  cancelled: "Abgebrochen", archived: "Archiviert",
};

interface DecisionData {
  id: string;
  title: string;
  description: string | null;
  context: string | null;
  status: string;
  priority: string;
  category: string;
  due_date: string | null;
  created_at: string;
  cost_per_day: number | null;
}

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_name: string;
}

const ExternalReviewPage = () => {
  const [params] = useSearchParams();
  const routeParams = useParams<{ token?: string }>();
  const token = routeParams.token || params.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<DecisionData | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reviewerName, setReviewerName] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [alreadyActed, setAlreadyActed] = useState(false);
  const [actionTaken, setActionTaken] = useState<string | null>(null);
  const [actedAt, setActedAt] = useState<string | null>(null);

  const [activeAction, setActiveAction] = useState<"approve" | "reject" | null>(null);
  const [feedback, setFeedback] = useState("");
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [actionDone, setActionDone] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Kein Token vorhanden. Bitte verwenden Sie den Link aus der Einladungs-E-Mail.");
      setLoading(false);
      return;
    }
    loadReview();
  }, [token]);

  const loadReview = async () => {
    setLoading(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("external-review", {
        body: { action: "get", token },
      });
      if (fnErr) throw fnErr;
      if (data?.error) {
        setError(data.error === "expired" ? "Dieser Link ist abgelaufen." : data.message || "Ungültiger Link.");
        setLoading(false);
        return;
      }
      setDecision(data.decision);
      setAttachments(data.attachments || []);
      setComments(data.comments || []);
      setReviewerName(data.reviewer?.name || "");
      setCreatorName(data.creator_name || "");
      setAlreadyActed(data.already_acted);
      setActionTaken(data.action_taken);
      setActedAt(data.acted_at || null);
    } catch {
      setError("Fehler beim Laden der Entscheidung.");
    }
    setLoading(false);
  };

  const submitAction = async (action: "approve" | "reject") => {
    if (!feedback.trim()) return;
    setSubmitting(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("external-review", {
        body: { action, token, feedback: feedback.trim() },
      });
      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.message);
      setActionDone(action);
      setAlreadyActed(true);
      setActionTaken(action);
    } catch { /* inline */ }
    setSubmitting(false);
  };

  const submitComment = async () => {
    if (!newComment.trim()) return;
    setCommentSubmitting(true);
    try {
      await supabase.functions.invoke("external-review", {
        body: { action: "comment", token, content: newComment.trim() },
      });
      setComments([...comments, {
        id: crypto.randomUUID(),
        content: `[Extern: ${reviewerName}] ${newComment.trim()}`,
        created_at: new Date().toISOString(),
        author_name: `${reviewerName} (extern)`,
      }]);
      setNewComment("");
    } catch { /* ignore */ }
    setCommentSubmitting(false);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("de-DE", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      }) + " Uhr";
    } catch { return iso; }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="text-lg font-semibold">Zugriff nicht möglich</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Link to="/auth">
            <Button variant="outline" size="sm">Zum Login</Button>
          </Link>
        </div>
        <ViralFooter />
      </div>
    );
  }

  if (!decision) return null;

  const prio = priorityConfig[decision.priority] || priorityConfig.medium;
  const weeklyCost = decision.cost_per_day ? Number(decision.cost_per_day) * 7 : null;

  // ── Success confirmation (after action) ──
  if (actionDone) {
    return (
      <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
            <div className={`h-2 w-full ${actionDone === "approve" ? "bg-success" : "bg-destructive"}`} />
            <div className="p-8 text-center space-y-4">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${actionDone === "approve" ? "bg-success/10" : "bg-destructive/10"}`}>
                {actionDone === "approve"
                  ? <CheckCircle2 className="w-10 h-10 text-success" />
                  : <XCircle className="w-10 h-10 text-destructive" />
                }
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                {actionDone === "approve" ? "Genehmigt!" : "Abgelehnt"}
              </h1>
              <p className="text-base font-semibold text-foreground">„{decision.title}"</p>
              <p className="text-sm text-muted-foreground">Von: {reviewerName} (extern)</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 justify-center">
                <Clock className="w-3 h-3" /> {formatDate(new Date().toISOString())}
              </p>
              <p className="text-xs text-muted-foreground">
                Diese Aktion wurde im Audit Trail dokumentiert. Der Ersteller wurde benachrichtigt.
              </p>
              <Link to="/auth">
                <Button variant="outline" className="gap-2 mt-2">
                  Alle Entscheidungen ansehen →
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <ViralFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={decivioLogo} alt="Decivio" className="h-5 opacity-60" />
            <span className="text-xs text-muted-foreground">
              Externe Review
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            Eingeladen als <strong className="text-foreground">{reviewerName || "Reviewer"}</strong>
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Decision card */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          {/* Title + meta */}
          <div>
            <div className="flex items-start gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className={`text-[10px] shrink-0 ${prio.class}`}>{prio.label}</Badge>
              <Badge variant="outline" className="text-[10px] shrink-0">{decision.category}</Badge>
              <Badge variant="outline" className="text-[10px] shrink-0">{statusLabels[decision.status] || decision.status}</Badge>
            </div>
            <h1 className="text-xl font-bold text-foreground leading-tight">{decision.title}</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Erstellt von <strong>{creatorName}</strong> • {formatDistanceToNow(new Date(decision.created_at), { addSuffix: true, locale: de })}
              {decision.due_date && (
                <> • Deadline: <strong>{new Date(decision.due_date).toLocaleDateString("de-DE")}</strong></>
              )}
            </p>
          </div>

          {/* Description */}
          {decision.description && (
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Beschreibung</h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{decision.description}</p>
            </div>
          )}

          {/* Context */}
          {decision.context && (
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Kontext & Hintergrund</h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{decision.context}</p>
            </div>
          )}

          {/* Economic impact */}
          {weeklyCost && weeklyCost > 0 && (
            <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
              <div className="flex items-center gap-2 text-sm font-semibold text-warning">
                <DollarSign className="w-4 h-4" />
                Wirtschaftlicher Impact
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Cost-of-Delay: <strong>{Number(decision.cost_per_day).toLocaleString("de-DE")} € / Tag</strong>
                {" "}({weeklyCost.toLocaleString("de-DE")} € / Woche)
              </p>
            </div>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Paperclip className="w-3 h-3" /> Anhänge ({attachments.length})
              </h3>
              <div className="space-y-1">
                {attachments.map(att => (
                  <a
                    key={att.id}
                    href={att.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-primary hover:underline py-1"
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    {att.file_name}
                    {att.file_size && <span className="text-muted-foreground">({(att.file_size / 1024).toFixed(0)} KB)</span>}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          {comments.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Kommentare ({comments.length})
              </h3>
              <div className="space-y-2">
                {comments.map(c => (
                  <div key={c.id} className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-medium">{c.author_name}</span>
                      <span className="text-[9px] text-muted-foreground">
                        {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: de })}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/80">{c.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action section */}
        <div className="bg-card rounded-xl border border-border p-6">
          {alreadyActed ? (
            <div className="text-center space-y-2">
              {actionTaken === "approve" ? (
                <>
                  <CheckCircle2 className="w-10 h-10 text-success mx-auto" />
                  <h2 className="text-lg font-semibold">Genehmigt</h2>
                  <p className="text-sm text-muted-foreground">
                    Sie haben diese Entscheidung genehmigt{actedAt ? ` am ${formatDate(actedAt)}` : ""}. Der Ersteller wurde benachrichtigt.
                  </p>
                </>
              ) : (
                <>
                  <XCircle className="w-10 h-10 text-destructive mx-auto" />
                  <h2 className="text-lg font-semibold">Abgelehnt</h2>
                  <p className="text-sm text-muted-foreground">
                    Sie haben diese Entscheidung abgelehnt{actedAt ? ` am ${formatDate(actedAt)}` : ""}. Der Ersteller wurde benachrichtigt.
                  </p>
                </>
              )}
            </div>
          ) : (
            <>
              <h3 className="text-sm font-medium mb-3">Ihre Entscheidung</h3>

              {/* Action buttons */}
              {!activeAction ? (
                <div className="flex gap-3">
                  <Button
                    onClick={() => setActiveAction("approve")}
                    className="flex-1 gap-2 h-12 text-base font-semibold bg-success hover:bg-success/90 text-white"
                  >
                    <CheckCircle2 className="w-5 h-5" /> Genehmigen
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setActiveAction("reject")}
                    className="flex-1 gap-2 h-12 text-base font-semibold"
                  >
                    <XCircle className="w-5 h-5" /> Ablehnen
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const el = document.getElementById("ext-comment-box");
                      el?.scrollIntoView({ behavior: "smooth", block: "center" });
                      el?.querySelector("textarea")?.focus();
                    }}
                    className="gap-2 h-12"
                    title="Kommentar ohne Entscheidung"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {activeAction === "approve"
                      ? <CheckCircle2 className="w-5 h-5 text-success" />
                      : <XCircle className="w-5 h-5 text-destructive" />
                    }
                    <span className="text-sm font-medium">
                      {activeAction === "approve" ? "Genehmigung bestätigen" : "Ablehnung bestätigen"}
                    </span>
                  </div>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Bitte geben Sie eine Begründung an (Pflichtfeld)…"
                    className="text-sm"
                    rows={3}
                    maxLength={5000}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => submitAction(activeAction)}
                      disabled={submitting || !feedback.trim()}
                      className={`flex-1 gap-2 ${activeAction === "approve" ? "bg-success hover:bg-success/90 text-white" : ""}`}
                      variant={activeAction === "reject" ? "destructive" : "default"}
                    >
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      Absenden
                    </Button>
                    <Button variant="ghost" onClick={() => { setActiveAction(null); setFeedback(""); }}>
                      Abbrechen
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Comment box */}
        {!alreadyActed && (
          <div id="ext-comment-box" className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-xs font-medium mb-2 flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3" /> Kommentar ohne Entscheidung
            </h3>
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Ihr Kommentar oder Ihre Rückfrage..."
              className="mb-2 text-sm"
              rows={3}
              maxLength={5000}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={submitComment}
              disabled={commentSubmitting || !newComment.trim()}
              className="gap-1.5"
            >
              {commentSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
              Kommentar senden
            </Button>
          </div>
        )}

        {/* Viral footer */}
        <ViralFooter />
      </main>
    </div>
  );
};

const ViralFooter = () => (
  <footer className="text-center py-8 space-y-3">
    <a href="/" className="opacity-50 hover:opacity-80 transition-opacity inline-block">
      <img src={decivioLogo} alt="Decivio" className="h-5 mx-auto" />
    </a>
    <p className="text-[10px] text-muted-foreground">
      Powered by{" "}
      <a href="https://decivio.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
        Decivio
      </a>{" "}
      — Decision Intelligence Platform
    </p>
    <a
      href="https://decivio.com"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block text-xs text-primary hover:underline font-medium"
    >
      Kostenlos testen →
    </a>
  </footer>
);

export default ExternalReviewPage;
