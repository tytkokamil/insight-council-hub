import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, Loader2, Gift, ArrowLeft, ArrowRight, Heart, Shield, Database, Download, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/** GDPR Art. 17 — Right to Erasure + Art. 20 — Data Portability */

type Step = "reason" | "data-loss" | "offer" | "confirm";

const cancelReasons = [
  "Zu teuer",
  "Zu komplex / nicht verstanden",
  "Nutze ein anderes Tool",
  "Projekt beendet",
  "Fehlendes Feature",
  "Sonstiges",
];

const AccountDeletionPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("reason");
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const [exporting, setExporting] = useState(false);

  const reset = () => {
    setStep("reason");
    setReason("");
    setConfirmText("");
    setPassword("");
    setShowPassword(false);
    setUnderstood(false);
    setOpen(false);
  };

  const handleExportData = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("export-user-data");
      if (error) throw error;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `decivio-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Export erfolgreich", description: "Ihre Daten wurden als JSON-Datei heruntergeladen." });
    } catch (err: any) {
      toast({ title: "Export fehlgeschlagen", description: err?.message || "Unbekannter Fehler", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!user || confirmText !== "LÖSCHEN" || !password) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-account", {
        body: { confirmation: "DELETE", password, cancel_reason: reason },
      });

      if (error) {
        const errorData = error as any;
        toast({ title: "Fehler", description: errorData?.message || error?.message || "Account konnte nicht gelöscht werden.", variant: "destructive" });
        setDeleting(false);
        return;
      }

      if (data && !data.success) {
        const msg = data.error === "ownership_transfer_required"
          ? data.message
          : data.error === "invalid_password"
            ? "Falsches Passwort. Bitte versuchen Sie es erneut."
            : data.message || "Account konnte nicht gelöscht werden.";
        toast({ title: "Fehler", description: msg, variant: "destructive" });
        setDeleting(false);
        return;
      }

      await supabase.auth.signOut();
      window.location.href = "/?deleted=1";
    } catch (err: any) {
      toast({ title: "Fehler", description: err?.message || "Unbekannter Fehler", variant: "destructive" });
      setDeleting(false);
    }
  };

  const inputClass = "w-full h-9 px-3 rounded-md bg-background border border-input text-sm focus:border-destructive focus:outline-none focus:ring-1 focus:ring-destructive/20 transition-colors";

  return (
    <section className="mt-12 pt-8" style={{ borderTop: "1px dashed hsl(0 86% 82%)" }}>
      {/* Data Export (GDPR Art. 20) */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Download className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-medium text-foreground">Datenexport (DSGVO Art. 20)</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Laden Sie alle Ihre persönlichen Daten als JSON-Datei herunter. Enthält: Profil, Entscheidungen, Kommentare, Aufgaben, Risiken und Aktivitäten.
        </p>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleExportData} disabled={exporting}>
          {exporting ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Wird exportiert…</>
          ) : (
            <><Download className="w-3.5 h-3.5" /> Meine Daten exportieren</>
          )}
        </Button>
      </div>

      {/* Danger Zone */}
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-destructive" />
        <h2 className="text-sm font-medium text-destructive">Danger Zone</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Die Löschung Ihres Accounts ist unwiderruflich. Alle Daten werden permanent gelöscht (DSGVO Art. 17).
      </p>

      <Button variant="destructive" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Trash2 className="w-3.5 h-3.5" />
        Account dauerhaft löschen
      </Button>

      {/* Multi-step dialog */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) reset(); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
            >
              {/* Progress */}
              <div className="flex gap-1 px-6 pt-5">
                {(["reason", "data-loss", "offer", "confirm"] as Step[]).map((s, i) => (
                  <div
                    key={s}
                    className="h-1 flex-1 rounded-full transition-colors duration-300"
                    style={{
                      background: (["reason", "data-loss", "offer", "confirm"] as Step[]).indexOf(step) >= i
                        ? "hsl(0 84% 60%)"
                        : "hsl(var(--muted))",
                    }}
                  />
                ))}
              </div>

              <div className="p-6">
                <AnimatePresence mode="wait">
                  {/* Step 1: Reason */}
                  {step === "reason" && (
                    <motion.div key="reason" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                        <Heart className="w-5 h-5 text-destructive" /> Schade, dass Sie gehen wollen.
                      </h3>
                      <p className="text-sm text-muted-foreground mb-5">Was ist der Hauptgrund?</p>
                      <div className="space-y-2 mb-6">
                        {cancelReasons.map((r) => (
                          <button
                            key={r}
                            onClick={() => setReason(r)}
                            className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all ${
                              reason === r
                                ? "border-destructive bg-destructive/5 text-foreground"
                                : "border-border/50 hover:border-border text-muted-foreground"
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={reset}>Abbrechen</Button>
                        <Button variant="destructive" size="sm" disabled={!reason} onClick={() => setStep("data-loss")} className="gap-1">
                          Weiter <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Data loss warning */}
                  {step === "data-loss" && (
                    <motion.div key="data-loss" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                        <Database className="w-5 h-5 text-destructive" /> Folgende Daten gehen verloren
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">Unwiderruflich. Kein Backup möglich.</p>
                      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 mb-4">
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          {[
                            "Alle Entscheidungen & Aufgaben",
                            "Teams & Berechtigungen",
                            "KI-Analysen & Briefings",
                            "Compliance-Dokumentation & Audit Trail",
                            "Risiken, Szenarien & strategische Ziele",
                            "Gespeicherte Dateien & Profilbild",
                          ].map((item) => (
                            <li key={item} className="flex items-start gap-2">
                              <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <p className="text-xs text-muted-foreground mb-6">
                        💡 Tipp: <button onClick={handleExportData} className="text-primary underline underline-offset-2" disabled={exporting}>
                          Exportieren Sie zuerst Ihre Daten
                        </button> bevor Sie fortfahren.
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setStep("reason")} className="gap-1">
                          <ArrowLeft className="w-3.5 h-3.5" /> Zurück
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setStep("offer")} className="gap-1">
                          Ich verstehe <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Retention offer */}
                  {step === "offer" && (
                    <motion.div key="offer" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                        <Gift className="w-5 h-5 text-primary" /> Bevor Sie gehen…
                      </h3>
                      <p className="text-sm text-muted-foreground mb-5">
                        {reason === "Zu teuer" ? "Wir möchten Ihnen entgegenkommen." : "Vielleicht können wir noch etwas tun."}
                      </p>
                      <div className="space-y-3 mb-6">
                        {reason === "Zu teuer" && (
                          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                            <p className="text-sm font-semibold mb-1">50% Rabatt für 3 Monate</p>
                            <p className="text-xs text-muted-foreground">Professional für €74,50/Monat. Sofort aktiv.</p>
                            <Button size="sm" className="mt-3 gap-1" onClick={() => { reset(); }}>
                              <Gift className="w-3.5 h-3.5" /> Angebot annehmen
                            </Button>
                          </div>
                        )}
                        {reason === "Zu komplex / nicht verstanden" && (
                          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                            <p className="text-sm font-semibold mb-1">Kostenloser Onboarding-Call</p>
                            <p className="text-xs text-muted-foreground">30 Min. mit unserem Gründer. Wir zeigen Ihnen alles.</p>
                            <Button size="sm" className="mt-3 gap-1" asChild>
                              <a href="mailto:support@decivio.com?subject=Onboarding-Call"><Gift className="w-3.5 h-3.5" /> Call buchen</a>
                            </Button>
                          </div>
                        )}
                        {reason === "Fehlendes Feature" && (
                          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                            <p className="text-sm font-semibold mb-1">Feature-Request priorisieren</p>
                            <p className="text-xs text-muted-foreground">Sagen Sie uns was fehlt — wir bauen es.</p>
                            <Button size="sm" className="mt-3 gap-1" asChild>
                              <a href="mailto:support@decivio.com?subject=Feature-Request"><Shield className="w-3.5 h-3.5" /> Feature anfragen</a>
                            </Button>
                          </div>
                        )}
                        <div className="rounded-lg border border-border/50 p-4">
                          <p className="text-sm font-semibold mb-1">Downgrade auf Free</p>
                          <p className="text-xs text-muted-foreground">Behalten Sie Ihre Daten. 1 Nutzer, 10 Entscheidungen, kostenlos.</p>
                          <Button variant="outline" size="sm" className="mt-3" onClick={reset}>
                            Auf Free downgraden
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setStep("data-loss")} className="gap-1">
                          <ArrowLeft className="w-3.5 h-3.5" /> Zurück
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setStep("confirm")} className="gap-1">
                          Trotzdem löschen <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 4: Final confirmation with password */}
                  {step === "confirm" && (
                    <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <h3 className="text-lg font-semibold mb-1 flex items-center gap-2 text-destructive">
                        <Trash2 className="w-5 h-5" /> Letzte Warnung
                      </h3>
                      <p className="text-sm text-muted-foreground mb-5">
                        Diese Aktion kann nicht rückgängig gemacht werden.
                      </p>

                      <label className="flex items-start gap-2 mb-4 cursor-pointer">
                        <Checkbox checked={understood} onCheckedChange={(v) => setUnderstood(v === true)} className="mt-0.5" />
                        <span className="text-xs text-muted-foreground">
                          Ich verstehe, dass alle meine Daten unwiderruflich gelöscht werden.
                        </span>
                      </label>

                      {/* Password confirmation */}
                      <div className="mb-4">
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                          Passwort zur Bestätigung
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Ihr aktuelles Passwort"
                            className={inputClass}
                            autoComplete="current-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Type LÖSCHEN */}
                      <div className="mb-5">
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                          Tippen Sie <span className="font-mono font-bold text-destructive">LÖSCHEN</span> zur Bestätigung
                        </label>
                        <input
                          type="text"
                          value={confirmText}
                          onChange={(e) => setConfirmText(e.target.value)}
                          placeholder="LÖSCHEN"
                          className={inputClass}
                          autoComplete="off"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setStep("offer")} className="gap-1">
                          <ArrowLeft className="w-3.5 h-3.5" /> Zurück
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={confirmText !== "LÖSCHEN" || !understood || !password || deleting}
                          onClick={handleDelete}
                          className="gap-1"
                        >
                          {deleting ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Wird gelöscht…</>
                          ) : (
                            <><Trash2 className="w-3.5 h-3.5" /> Endgültig löschen</>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default AccountDeletionPanel;
