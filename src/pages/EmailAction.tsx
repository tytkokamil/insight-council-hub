import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, AlertTriangle, Loader2, ExternalLink, Clock, MessageSquare, DollarSign, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import decivioLogo from "@/assets/decivio-logo.png";

type ActionState = "loading" | "confirm" | "success" | "error";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640 || /Mobi|Android|iPhone/i.test(navigator.userAgent));
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
};

/* Animated CoD counter */
const CodCounter = ({ value }: { value: number }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    if (value <= 0) return;
    const dur = 1200;
    const start = performance.now();
    const animate = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      ref.current = Math.round(eased * value);
      setDisplay(ref.current);
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  if (value <= 0) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-destructive/10 border border-destructive/20">
      <DollarSign className="w-5 h-5 text-destructive animate-pulse" />
      <span className="text-lg font-bold text-destructive tabular-nums">
        €{display.toLocaleString("de-DE")}/Tag
      </span>
      <span className="text-xs text-destructive/70">Cost-of-Delay</span>
    </div>
  );
};

/* Success checkmark animation */
const SuccessAnimation = ({ isApprove }: { isApprove: boolean }) => (
  <motion.div
    initial={{ scale: 0, rotate: -180 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ type: "spring", stiffness: 200, damping: 15 }}
    className={`w-24 h-24 rounded-full flex items-center justify-center ${isApprove ? "bg-success/10" : "bg-destructive/10"}`}
  >
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
    >
      {isApprove
        ? <CheckCircle2 className="w-14 h-14 text-success" />
        : <XCircle className="w-14 h-14 text-destructive" />
      }
    </motion.div>
  </motion.div>
);

const EmailAction = () => {
  const [params] = useSearchParams();
  const routeParams = useParams<{ token?: string }>();
  const isMobile = useIsMobile();

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
  const [showComment, setShowComment] = useState(false);
  const [decisionMeta, setDecisionMeta] = useState<any>(null);

  useEffect(() => {
    if (!token || !routeAction) {
      setErrorMsg("Ungültiger Link — kein Token oder Aktion angegeben.");
      setState("error");
      return;
    }
    loadDecisionMeta();
    setState("confirm");
  }, [token, routeAction]);

  const loadDecisionMeta = async () => {
    try {
      // Try to extract decision info from token metadata
      const { data } = await supabase
        .from("email_action_tokens")
        .select("decision_id, decisions:decision_id(title, priority, cost_per_day, description, ai_summary)")
        .eq("token", token)
        .single();
      if (data) {
        setDecisionId(data.decision_id);
        setDecisionMeta((data as any).decisions);
      }
    } catch {
      // Non-critical, continue without meta
    }
  };

  const hapticFeedback = useCallback(() => {
    try { navigator?.vibrate?.(50); } catch {}
  }, []);

  const executeAction = async () => {
    setSubmitting(true);
    hapticFeedback();
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
      hapticFeedback();

      // Auto-close after 5s on mobile
      if (isMobile) {
        setTimeout(() => {
          try { window.close(); } catch {}
        }, 5000);
      }
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

  const summary = decisionMeta?.ai_summary
    || decisionMeta?.description?.slice(0, 150)
    || null;

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md">
        {/* Logo — small on mobile */}
        <div className="flex justify-center mb-4">
          <img src={decivioLogo} alt="Decivio" className="h-5 opacity-60" />
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
          {/* Header band */}
          <div className={`h-1.5 sm:h-2 w-full ${isApprove ? "bg-success" : "bg-destructive"}`} />

          <div className="p-5 sm:p-8 space-y-5">
            <AnimatePresence mode="wait">
              {/* Loading */}
              {state === "loading" && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-4 py-8"
                >
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Token wird überprüft…</p>
                </motion.div>
              )}

              {/* Confirm — Mobile-optimized */}
              {state === "confirm" && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {/* Decision title */}
                  {decisionMeta?.title ? (
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground text-center leading-tight">
                      {decisionMeta.title}
                    </h1>
                  ) : (
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
                    </div>
                  )}

                  {/* Priority badge */}
                  {decisionMeta?.priority && (
                    <div className="flex justify-center">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        decisionMeta.priority === "critical" ? "bg-destructive/10 text-destructive" :
                        decisionMeta.priority === "high" ? "bg-warning/10 text-warning" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {decisionMeta.priority === "critical" ? "🔴 Kritisch" :
                         decisionMeta.priority === "high" ? "🟠 Hoch" :
                         decisionMeta.priority === "medium" ? "🔵 Mittel" : "🟢 Niedrig"}
                      </span>
                    </div>
                  )}

                  {/* Summary */}
                  {summary && (
                    <p className="text-sm text-muted-foreground text-center leading-relaxed line-clamp-3">
                      {summary}
                    </p>
                  )}

                  {/* CoD */}
                  {decisionMeta?.cost_per_day > 0 && (
                    <CodCounter value={decisionMeta.cost_per_day} />
                  )}

                  {/* Action description */}
                  <p className="text-sm text-center text-muted-foreground">
                    {isApprove
                      ? "Bestätigen Sie die Genehmigung dieser Entscheidung."
                      : "Bestätigen Sie die Ablehnung dieser Entscheidung."
                    }
                  </p>

                  {/* Comment — always visible for reject, toggle for approve */}
                  {(!isApprove || showComment) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3" />
                        {isApprove ? "Kommentar (optional)" : "Begründung"}
                      </label>
                      <Textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder={isApprove ? "Optionales Feedback…" : "Bitte begründen Sie die Ablehnung…"}
                        rows={isMobile ? 2 : 3}
                        className="resize-none text-base"
                        autoFocus={!isApprove}
                      />
                    </motion.div>
                  )}

                  {/* Big touch-friendly action buttons */}
                  <div className="space-y-2.5 pt-1">
                    <Button
                      onClick={executeAction}
                      disabled={submitting || (!isApprove && !feedback.trim())}
                      className={`w-full gap-2 text-base font-semibold text-white transition-all active:scale-[0.98] ${
                        isApprove
                          ? "h-[60px] bg-success hover:bg-success/90 shadow-lg shadow-success/20"
                          : "h-[60px] bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/20"
                      }`}
                    >
                      {submitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : isApprove ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                      {isApprove ? "✓ Genehmigen" : "✗ Ablehnen"}
                    </Button>

                    {isApprove && !showComment && (
                      <button
                        onClick={() => setShowComment(true)}
                        className="w-full flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5"
                      >
                        <ChevronDown className="w-3 h-3" />
                        Kommentar hinzufügen
                      </button>
                    )}
                  </div>

                  {/* Full details link */}
                  {decisionId && (
                    <Link
                      to={`/decisions/${decisionId}`}
                      className="flex items-center justify-center gap-1.5 text-xs text-primary hover:underline pt-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Vollständige Details ansehen
                    </Link>
                  )}
                </motion.div>
              )}

              {/* Success — with animation */}
              {state === "success" && result && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-4 text-center py-4"
                >
                  <SuccessAnimation isApprove={result.action === "approve"} />

                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                    {result.action === "approve" ? "Genehmigt!" : "Abgelehnt"}
                  </h1>
                  <p className="text-base text-muted-foreground">
                    {result.action === "approve"
                      ? "Erledigt! Ihre Genehmigung wurde gespeichert."
                      : "Ihre Ablehnung wurde dokumentiert."
                    }
                  </p>
                  {result.decision_title && (
                    <p className="text-sm font-semibold text-foreground">
                      „{result.decision_title}"
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(new Date().toISOString())}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Im Audit Trail dokumentiert.
                  </p>

                  <div className="flex flex-col gap-2 w-full pt-3">
                    <Link to={`/decisions/${result.decision_id}`} className="w-full">
                      <Button variant="outline" className="gap-2 w-full h-12">
                        <ExternalLink className="w-4 h-4" /> Entscheidung öffnen
                      </Button>
                    </Link>
                    {isMobile && (
                      <Button
                        variant="ghost"
                        className="w-full text-sm"
                        onClick={() => { try { window.close(); } catch {} }}
                      >
                        Fenster schließen
                      </Button>
                    )}
                    {!isMobile && (
                      <Link to="/dashboard" className="w-full">
                        <Button variant="ghost" className="w-full text-sm">
                          Alle Entscheidungen ansehen →
                        </Button>
                      </Link>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Error */}
              {state === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-4 text-center py-4"
                >
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
                      <Button variant="outline" className="gap-2 h-12">
                        <ExternalLink className="w-4 h-4" /> Entscheidung ansehen
                      </Button>
                    </Link>
                  )}
                  <Link to="/auth">
                    <Button variant="ghost" className="text-xs">Zum Login</Button>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-1.5 mt-4">
          <p className="text-[10px] text-muted-foreground">
            Powered by <a href="/" className="underline hover:text-foreground transition-colors">Decivio</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailAction;
