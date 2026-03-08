import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Mail, Send, Users, Clock, Target, Filter, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

/** Prompt 33 — Outbound Email Engine (Admin UI) */

const ease = [0.16, 1, 0.3, 1] as const;

const templates = [
  { id: "trial-expiring", name: "Trial läuft ab", subject: "Ihre Testphase endet in 3 Tagen", desc: "Erinnert Trial-User an das Ablaufdatum mit Feature-Highlights." },
  { id: "inactive-7d", name: "7 Tage inaktiv", subject: "Wir vermissen Sie bei Decivio", desc: "Re-Engagement für User, die 7+ Tage nicht aktiv waren." },
  { id: "first-decision", name: "Erste Entscheidung fehlt", subject: "Noch keine Entscheidung angelegt?", desc: "Onboarding-Nudge für User ohne erste Entscheidung." },
  { id: "upgrade-nudge", name: "Upgrade-Anreiz", subject: "Decivio Professional — jetzt mit Founding-Rabatt", desc: "Free-User auf Professional upgraden." },
  { id: "cod-report", name: "Wöchentlicher CoD-Report", subject: "Diese Woche: €X offene Verzögerungskosten", desc: "Wöchentliche Zusammenfassung der Cost-of-Delay." },
];

const segments = [
  { id: "trial-active", label: "Trial (aktiv)", count: 34 },
  { id: "trial-expiring", label: "Trial (läuft ab)", count: 8 },
  { id: "free", label: "Free-Plan", count: 127 },
  { id: "inactive-7d", label: "7+ Tage inaktiv", count: 23 },
  { id: "no-decision", label: "Ohne Entscheidung", count: 15 },
];

const OutboundEmailEngine = () => {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const totalRecipients = segments.filter((s) => selectedSegments.includes(s.id)).reduce((sum, s) => sum + s.count, 0);

  const handleSend = async () => {
    if (!selectedTemplate || selectedSegments.length === 0) return;
    setSending(true);
    // Simulate sending
    await new Promise((r) => setTimeout(r, 2000));
    setSending(false);
    setSent(true);
    toast({ title: "E-Mails gesendet", description: `${totalRecipients} Empfänger erreicht.` });
    setTimeout(() => setSent(false), 3000);
  };

  const template = templates.find((t) => t.id === selectedTemplate);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" /> Outbound E-Mail Engine
        </h2>
        <p className="text-sm text-muted-foreground">
          Gezielte E-Mail-Kampagnen an Trial-User und inaktive Accounts.
        </p>
      </div>

      {/* Template selection */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Target className="w-4 h-4" /> Template wählen
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTemplate(t.id)}
              className={`text-left p-4 rounded-xl border transition-all ${
                selectedTemplate === t.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border/50 hover:border-border"
              }`}
            >
              <p className="text-sm font-medium mb-0.5">{t.name}</p>
              <p className="text-xs text-muted-foreground mb-1.5">{t.desc}</p>
              <p className="text-[11px] text-muted-foreground/60 font-mono">Betreff: {t.subject}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Segment selection */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Filter className="w-4 h-4" /> Zielgruppe
        </h3>
        <div className="flex flex-wrap gap-2">
          {segments.map((s) => {
            const isSelected = selectedSegments.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() =>
                  setSelectedSegments((prev) =>
                    isSelected ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                  )
                }
                className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border/50 text-muted-foreground hover:border-border"
                }`}
              >
                {s.label}
                <span className="ml-1.5 text-xs text-muted-foreground">({s.count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview & Send */}
      {selectedTemplate && selectedSegments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border/60 bg-card p-5"
        >
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Send className="w-4 h-4" /> Vorschau
          </h3>
          <div className="rounded-lg border border-border/40 p-4 mb-4 bg-background">
            <p className="text-xs text-muted-foreground mb-1">An: {totalRecipients} Empfänger</p>
            <p className="text-xs text-muted-foreground mb-2">Betreff: <span className="font-medium text-foreground">{template?.subject}</span></p>
            <p className="text-xs text-muted-foreground">{template?.desc}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleSend} disabled={sending || sent} className="gap-2">
              {sending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Wird gesendet…</>
              ) : sent ? (
                <><CheckCircle2 className="w-4 h-4" /> Gesendet!</>
              ) : (
                <><Send className="w-4 h-4" /> {totalRecipients} E-Mails senden</>
              )}
            </Button>
            <span className="text-xs text-muted-foreground">
              <Clock className="w-3 h-3 inline mr-1" />
              Versand dauert ca. {Math.ceil(totalRecipients / 50)} Min.
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default OutboundEmailEngine;
