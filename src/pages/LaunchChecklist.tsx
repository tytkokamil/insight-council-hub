import { useState, useMemo, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink, Rocket, ChevronDown, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import PageHeader from "@/components/shared/PageHeader";

interface ChecklistItem {
  id: string;
  title: string;
  subtitle?: string;
  link?: string;
}

interface ChecklistCategory {
  title: string;
  emoji: string;
  items: ChecklistItem[];
}

const CHECKLIST: ChecklistCategory[] = [
  {
    title: "Produkt", emoji: "🚀",
    items: [
      { id: "onboarding_tested", title: "Onboarding-Flow getestet", subtitle: "Neuer Account, alle Schritte durchgegangen", link: "/auth" },
      { id: "cod_configured", title: "CoD-Ticker konfiguriert", subtitle: "Zeigt realistischen Wert", link: "/dashboard" },
      { id: "first_decision", title: "Erste Entscheidung als Demo-Daten erstellt", link: "/decisions" },
      { id: "approval_email", title: "One-Click Approval E-Mail getestet", link: "/settings" },
      { id: "quick_capture", title: "Schnell-Erfassen Modal getestet", subtitle: "Tastaturkürzel . und N" },
      { id: "monday_brief", title: "Montags-Brief E-Mail getestet", link: "/briefing" },
      { id: "magic_link", title: "Magic Link Login getestet", link: "/auth" },
      { id: "mobile_tested", title: "Mobile Ansicht auf echtem Gerät getestet" },
      { id: "command_palette", title: "Command Palette (CMD+K) getestet" },
      { id: "demo_mode", title: "Demo-Modus (/demo) komplett durchgeklickt", link: "/demo" },
    ],
  },
  {
    title: "Technik", emoji: "⚙️",
    items: [
      { id: "stripe_webhooks", title: "Stripe Webhooks live", subtitle: "Checkout und Subscription Events aktiv" },
      { id: "cron_jobs", title: "Alle Cron Jobs aktiv", subtitle: "decisions-engine, daily-brief, weekly-brief" },
      { id: "email_domain", title: "E-Mail Domain verifiziert", subtitle: "DKIM, SPF, DMARC" },
      { id: "rls_active", title: "RLS auf allen Tabellen aktiv und getestet" },
      { id: "audit_verified", title: "SHA-256 Audit Trail verifiziert" },
      { id: "custom_domain", title: "Custom Domain konfiguriert" },
      { id: "ssl_active", title: "SSL-Zertifikat aktiv" },
      { id: "error_tracking", title: "Error Tracking eingerichtet", subtitle: "Sentry oder Analytics" },
    ],
  },
  {
    title: "Legal & Compliance", emoji: "⚖️",
    items: [
      { id: "imprint", title: "Impressum ausgefüllt", link: "/imprint" },
      { id: "terms", title: "AGB veröffentlicht", link: "/terms" },
      { id: "privacy", title: "Datenschutzerklärung aktuell", link: "/privacy" },
      { id: "cookie_banner", title: "Cookie-Banner implementiert" },
      { id: "gdpr_consent", title: "DSGVO Consent-Checkbox bei Registrierung" },
      { id: "dpa_signed", title: "DPA mit Cloud-Provider unterschrieben" },
    ],
  },
  {
    title: "Go-to-Market", emoji: "📣",
    items: [
      { id: "landing_live", title: "Landing Page live", subtitle: "Mit Live CoD-Rechner" },
      { id: "pricing_live", title: "Pricing-Seite live", subtitle: "Mit ROI-Rechner" },
      { id: "demo_public", title: "Demo-Mode öffentlich erreichbar", link: "/demo" },
      { id: "linkedin_post", title: "Erster LinkedIn-Post geplant" },
      { id: "first_customers", title: "10 potenzielle Erstkunden identifiziert" },
      { id: "calendly", title: "Calendly-Link für Demo-Calls eingerichtet" },
    ],
  },
];

const ALL_ITEMS = CHECKLIST.flatMap(c => c.items);
const TOTAL = ALL_ITEMS.length;

const LaunchChecklist = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(CHECKLIST.map(c => c.title)));
  const [showConfetti, setShowConfetti] = useState(false);

  const { data: checklist, isLoading } = useQuery({
    queryKey: ["launch-checklist"],
    queryFn: async () => {
      const { data: profile } = await supabase.from("profiles").select("org_id").eq("user_id", user?.id || "").single();
      if (!profile?.org_id) return { completed_items: [] as string[], org_id: "" };
      const { data } = await supabase.from("launch_checklist").select("*").eq("org_id", profile.org_id).single();
      return { completed_items: (data?.completed_items as string[]) || [], org_id: profile.org_id };
    },
    enabled: !!user,
  });

  const completedItems = new Set(checklist?.completed_items || []);
  const completedCount = completedItems.size;
  const percent = Math.round((completedCount / TOTAL) * 100);

  const toggleItem = useMutation({
    mutationFn: async (itemId: string) => {
      if (!checklist?.org_id) return;
      const current = checklist.completed_items || [];
      const next = current.includes(itemId) ? current.filter(i => i !== itemId) : [...current, itemId];
      await supabase.from("launch_checklist").upsert({
        org_id: checklist.org_id,
        completed_items: next,
        completed_at: next.length >= TOTAL ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "org_id" });
      if (next.length >= TOTAL) setShowConfetti(true);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["launch-checklist"] }),
  });

  const toggleCategory = (title: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      next.has(title) ? next.delete(title) : next.add(title);
      return next;
    });
  };

  return (
    <>
      <Helmet><title>Launch Checklist | Decivio</title></Helmet>

      {/* Confetti overlay */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setShowConfetti(false)}
          >
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center">
              <p className="text-6xl mb-4">🚀</p>
              <h2 className="text-3xl font-bold mb-2">Launch-bereit!</h2>
              <p className="text-lg text-muted-foreground mb-1">Alle {TOTAL} Punkte abgeschlossen.</p>
              <p className="text-sm text-muted-foreground">Jetzt: Ersten Kunden anrufen.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PageHeader title="Launch Checklist" subtitle="Alles grün bevor der erste Kunde zahlt." role="system" />

      {/* Progress overview */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                <path className="text-muted" stroke="currentColor" strokeWidth="3" fill="none" d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className={percent >= 80 ? "text-emerald-500" : "text-primary"} stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" strokeDasharray={`${percent}, 100`} d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold">{percent}%</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold">{completedCount}/{TOTAL}</p>
              <p className="text-sm text-muted-foreground">Punkte abgeschlossen</p>
              <Progress value={percent} className="mt-2 h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <div className="space-y-4">
        {CHECKLIST.map(cat => {
          const catCompleted = cat.items.filter(i => completedItems.has(i.id)).length;
          const isExpanded = expandedCats.has(cat.title);
          const allDone = catCompleted === cat.items.length;

          return (
            <Card key={cat.title} className={allDone ? "border-emerald-500/30 bg-emerald-500/[0.02]" : ""}>
              <button className="w-full p-4 flex items-center gap-3 text-left" onClick={() => toggleCategory(cat.title)}>
                <span className="text-xl">{cat.emoji}</span>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold">{cat.title}</h3>
                  <p className="text-xs text-muted-foreground">{catCompleted}/{cat.items.length} abgeschlossen</p>
                </div>
                {allDone && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-4 space-y-1">
                      {cat.items.map(item => {
                        const checked = completedItems.has(item.id);
                        return (
                          <div key={item.id} className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors ${checked ? "bg-emerald-500/5" : "hover:bg-muted/50"}`}>
                            <Checkbox checked={checked} onCheckedChange={() => toggleItem.mutate(item.id)} className="mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${checked ? "line-through text-muted-foreground" : "text-foreground font-medium"}`}>{item.title}</p>
                              {item.subtitle && <p className="text-xs text-muted-foreground">{item.subtitle}</p>}
                            </div>
                            {item.link && (
                              <a href={item.link} target="_blank" rel="noopener" className="text-muted-foreground hover:text-primary transition-colors shrink-0">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>
    </>
  );
};

export default LaunchChecklist;
