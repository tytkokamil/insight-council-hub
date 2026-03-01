import { useState, useEffect } from "react";
import { useSearchParams, useParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, AlertTriangle, Loader2, ExternalLink, Clock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import decivioLogo from "@/assets/decivio-logo.png";

type ActionState = "loading" | "confirm" | "success" | "error";

const EmailAction = () => {
  const [params] = useSearchParams();
  const routeParams = useParams<{ token?: string }>();

  // Support both /approve/:token, /reject/:token AND /action?token=X&action=Y
  const token = routeParams.token || params.get("token") || "";
  const routeAction = window.location.pathname.startsWith("/approve")
    ? "approve"
    : window.location.pathname.startsWith("/reject")
      ? "reject"
      : params.get("action") || "";

  const [state, setState] = useState<ActionState>("loading");
  const [feedback, setFeedback] = useState("");
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [decisionId, setDecisionId] = useState<string | null>(null);
  const [usedInfo, setUsedInfo] = useState<{ date: string; action: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token || !routeAction) {
      setErrorMsg("Ungültiger Link — kein Token oder Aktion angegeben.");
      setState("error");
      return;
    }
    setState("confirm");
  }, [token, routeAction]);

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
        if (data.error === "already_used") {
          setUsedInfo({ date: data.used_at || "", action: data.original_action || "" });
          setDecisionId(data.decision_id || null);
        }
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

  const isApprove = routeAction === "approve";

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("de-DE", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      }) + " Uhr";
    } catch { return iso; }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
          {/* Header band */}
          <div className={`h-2 w-full ${isApprove ? "bg-success" : "bg-destructive"}`} />

          <div className="p-8 space-y-6">
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
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isApprove ? "bg-success/10" : "bg-destructive/10"}`}>
                    {isApprove
                      ? <CheckCircle2 className="w-8 h-8 text-success" />
                      : <XCircle className="w-8 h-8 text-destructive" />
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
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3" /> Kommentar (optional)
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
                  className={`w-full gap-2 h-12 text-base font-semibold ${isApprove ? "bg-success hover:bg-success/90" : "bg-destructive hover:bg-destructive/90"} text-white`}
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isApprove ? "✓ Genehmigung bestätigen" : "✗ Ablehnung bestätigen"}
                </Button>
              </>
            )}

            {/* Success */}
            {state === "success" && result && (
              <div className="flex flex-col items-center gap-4 text-center py-4">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${result.action === "approve" ? "bg-success/10" : "bg-destructive/10"}`}>
                  {result.action === "approve"
                    ? <CheckCircle2 className="w-10 h-10 text-success" />
                    : <XCircle className="w-10 h-10 text-destructive" />
                  }
                </div>
                <h1 className="text-2xl font-bold text-foreground">
                  {result.action === "approve" ? "Genehmigt!" : "Abgelehnt"}
                </h1>
                <p className="text-base font-semibold text-foreground">
                  „{result.decision_title}"
                </p>
                <p className="text-sm text-muted-foreground">
                  Von: {result.user_name}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(new Date().toISOString())}
                </p>
                <p className="text-xs text-muted-foreground">
                  Diese Aktion wurde im Audit Trail dokumentiert.
                </p>
                <div className="flex flex-col gap-2 w-full pt-2">
                  <Link to={`/decisions/${result.decision_id}`} className="w-full">
                    <Button variant="outline" className="gap-2 w-full">
                      <ExternalLink className="w-4 h-4" /> Entscheidung öffnen
                    </Button>
                  </Link>
                  <Link to="/dashboard" className="w-full">
                    <Button variant="ghost" className="w-full text-sm">
                      Alle Entscheidungen ansehen →
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Error */}
            {state === "error" && (
              <div className="flex flex-col items-center gap-4 text-center py-4">
                <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-warning" />
                </div>
                <h1 className="text-xl font-bold text-foreground">
                  {usedInfo ? "Bereits verarbeitet" : "Link ungültig"}
                </h1>
                <p className="text-sm text-muted-foreground">{errorMsg}</p>
                {usedInfo && (
                  <p className="text-xs text-muted-foreground">
                    Diese Entscheidung wurde bereits {usedInfo.action === "approve" ? "genehmigt" : "abgelehnt"}
                    {usedInfo.date ? ` am ${formatDate(usedInfo.date)}` : ""}.
                  </p>
                )}
                {decisionId && (
                  <Link to={`/decisions/${decisionId}`}>
                    <Button variant="outline" className="gap-2">
                      <ExternalLink className="w-4 h-4" /> Entscheidung ansehen
                    </Button>
                  </Link>
                )}
                <Link to="/auth">
                  <Button variant="ghost" className="text-xs">Zum Login</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Footer branding */}
        <div className="flex flex-col items-center gap-2 mt-6">
          <a href="/" className="opacity-60 hover:opacity-100 transition-opacity">
            <img src={decivioLogo} alt="Decivio" className="h-5" />
          </a>
          <p className="text-[10px] text-muted-foreground">
            Powered by <a href="/" className="underline hover:text-foreground transition-colors">Decivio</a> — Decision Intelligence Platform
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailAction;
