import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Building2, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2 } from "lucide-react";
import { industries, getIndustryById } from "@/lib/industries";
import { seedIndustryData } from "@/lib/industrySeeder";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const STORAGE_KEY = "industry-reminder-dismissals";
const MAX_DISMISSALS = 3;

const IndustryReminderBanner = () => {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const dismissals = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
    if (dismissals >= MAX_DISMISSALS) return;

    // Check if account is at least 3 days old
    const createdAt = new Date(user.created_at);
    const daysSince = (Date.now() - createdAt.getTime()) / 86400000;
    if (daysSince < 3) return;

    supabase
      .from("profiles")
      .select("industry")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        const ind = (data as any)?.industry;
        if (!ind || ind === "allgemein") {
          setVisible(true);
        }
      });
  }, [user]);

  const dismiss = () => {
    const current = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
    localStorage.setItem(STORAGE_KEY, String(current + 1));
    setVisible(false);
  };

  const handleSave = async () => {
    if (!selected || !user) return;
    setSaving(true);

    await supabase
      .from("profiles")
      .update({ industry: selected } as any)
      .eq("user_id", user.id);

    const { templatesCount } = await seedIndustryData(user.id, selected);

    setSaving(false);
    setModalOpen(false);
    setVisible(false);

    const ind = getIndustryById(selected);
    toast.success(`Branche konfiguriert: ${ind?.name || selected}. ${templatesCount} Vorlagen wurden geladen.`);
  };

  if (!visible) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-xl border border-primary/20 bg-primary/[0.04] p-4 flex items-center gap-3"
      >
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Building2 className="w-4.5 h-4.5 text-primary" />
        </div>
        <p className="text-sm font-medium flex-1 text-primary">
          Ihre Branche ist noch nicht konfiguriert — Vorlagen und Beispiele für Ihre Branche laden
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 text-xs text-primary hover:text-primary"
          onClick={() => { setSelected(null); setModalOpen(true); }}
        >
          Jetzt einrichten <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
        <button
          onClick={dismiss}
          className="text-muted-foreground/40 hover:text-muted-foreground text-xs shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </motion.div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Branche auswählen</DialogTitle>
            <DialogDescription>
              Wählen Sie Ihre Branche — wir laden passende Vorlagen und Beispiele.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 my-4">
            {industries.filter(i => i.id !== "allgemein").map((ind) => {
              const isSelected = selected === ind.id;
              return (
                <button
                  key={ind.id}
                  onClick={() => setSelected(ind.id)}
                  className={`relative text-left p-3 rounded-lg border-2 transition-all duration-150 ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-muted/30"
                  }`}
                >
                  {isSelected && (
                    <CheckCircle2 className="absolute top-2.5 right-2.5 w-4 h-4 text-primary" />
                  )}
                  <div className="flex items-start gap-2.5">
                    <span className="text-xl leading-none mt-0.5">{ind.icon}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-xs">{ind.name}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">{ind.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={!selected || saving} className="gap-1.5">
              {saving ? "Wird geladen..." : "Branche wählen & Vorlagen laden"}
              {!saving && <ArrowRight className="w-3.5 h-3.5" />}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default IndustryReminderBanner;
