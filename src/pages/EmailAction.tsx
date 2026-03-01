import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, AlertTriangle, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

type ActionState = "loading" | "confirm" | "success" | "error";

const EmailAction = () => {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const action = params.get("action") || "";

  const [state, setState] = useState<ActionState>("loading");
  const [feedback, setFeedback] = useState("");
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [decisionId, setDecisionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // On mount, validate token first (dry-run: we just show the confirm screen)
  useEffect(() => {
    if (!token || !action) {
      setErrorMsg("Ungültiger Link — kein Token oder Aktion angegeben.");
      setState("error");
      return;
    }
    // Show confirmation screen directly
    setState("confirm");
  }, [token, action]);

  const executeAction = async () => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("email-action", {
        body: { token, feedback: feedback.trim() || null },
      });

      if (error) {
        setErrorMsg("Verbindungsfehler. Bitte versuchen Sie es erneut.");
        setState("error");
        return;
      }

      if (data?.error) {
        setErrorMsg(data.message || "Ein Fehler ist aufgetreten.");
        setDecisionId(data.decision_id || null);
        setState("error");
        return;
      }

      setResult(data);
      setState("success");
    } catch {
      setErrorMsg("Unerwarteter Fehler. Bitte versuchen Sie es erneut.");
      setState("error");
    } finally {
      setSubmitting(false);
    }
  };

  const isApprove = action === "approve";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card shadow-xl p-8 space-y-6">
          {/* Loading */}
          {state === "loading" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Token wird überprüft…</p>
            </div>
          )}

          {/* Confirm */}
          {state === "confirm" && (
            <>
              <div className="flex flex-col items-center gap-3 text-center">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isApprove ? "bg-success/10" : "bg-destructive/10"}`}>
                  {isApprove
                    ? <CheckCircle2 className="w-7 h-7 text-success" />
                    : <XCircle className="w-7 h-7 text-destructive" />
                  }
                </div>
                <h1 className="text-xl font-bold text-foreground">
                  {isApprove ? "Entscheidung genehmigen" : "Entscheidung ablehnen"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isApprove
                    ? "Bestätigen Sie die Genehmigung dieser Entscheidung."
                    : "Bestätigen Sie die Ablehnung dieser Entscheidung."
                  }
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Kommentar (optional)
                </label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Optionales Feedback zur Entscheidung…"
                  rows={3}
                  className="resize-none"
                />
              </div>

              <Button
                onClick={executeAction}
                disabled={submitting}
                className={`w-full gap-2 ${isApprove ? "bg-success hover:bg-success/90" : "bg-destructive hover:bg-destructive/90"} text-white`}
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isApprove ? "✓ Genehmigung bestätigen" : "✗ Ablehnung bestätigen"}
              </Button>
            </>
          )}

          {/* Success */}
          {state === "success" && result && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${result.action === "approve" ? "bg-success/10" : "bg-destructive/10"}`}>
                {result.action === "approve"
                  ? <CheckCircle2 className="w-7 h-7 text-success" />
                  : <XCircle className="w-7 h-7 text-destructive" />
                }
              </div>
              <h1 className="text-xl font-bold text-foreground">
                {result.action === "approve" ? "Erfolgreich genehmigt" : "Erfolgreich abgelehnt"}
              </h1>
              <p className="text-sm text-muted-foreground">
                „{result.decision_title}" wurde von {result.user_name}{" "}
                {result.action === "approve" ? "genehmigt" : "abgelehnt"}.
              </p>
              <p className="text-xs text-muted-foreground">
                Diese Aktion wurde im Audit Trail dokumentiert.
              </p>
              <Link to={`/decisions/${result.decision_id}`}>
                <Button variant="outline" className="gap-2">
                  <ExternalLink className="w-4 h-4" /> Entscheidung öffnen
                </Button>
              </Link>
            </div>
          )}

          {/* Error */}
          {state === "error" && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-warning" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Link ungültig</h1>
              <p className="text-sm text-muted-foreground">{errorMsg}</p>
              {decisionId && (
                <Link to={`/decisions/${decisionId}`}>
                  <Button variant="outline" className="gap-2">
                    <ExternalLink className="w-4 h-4" /> Entscheidung ansehen
                  </Button>
                </Link>
              )}
              <Link to="/dashboard">
                <Button variant="ghost" className="text-xs">Zum Dashboard</Button>
              </Link>
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-4">
          Decivio — Decision Intelligence Platform
        </p>
      </div>
    </div>
  );
};

export default EmailAction;
