import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ArrowRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { industries, getIndustryById } from "@/lib/industries";
import { seedIndustryData } from "@/lib/industrySeeder";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const IndustryConfigSection = () => {
  const { user } = useAuth();
  const [currentIndustry, setCurrentIndustry] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("industry")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        const ind = (data as any)?.industry || null;
        setCurrentIndustry(ind);
      });
  }, [user]);

  const current = getIndustryById(currentIndustry);

  const handleOpen = () => {
    setSelected(currentIndustry);
    setModalOpen(true);
  };

  const handleChange = async () => {
    if (!selected || !user || selected === currentIndustry) return;
    setSaving(true);

    await supabase
      .from("profiles")
      .update({ industry: selected } as any)
      .eq("user_id", user.id);

    const { templatesCount } = await seedIndustryData(user.id, selected);

    setCurrentIndustry(selected);
    setSaving(false);
    setModalOpen(false);

    const ind = getIndustryById(selected);
    toast.success(`Branche geändert zu ${ind?.name || selected}. ${templatesCount} neue Vorlagen wurden hinzugefügt.`);
  };

  return (
    <section>
      <h2 className="text-sm font-medium mb-3">Branchen-Konfiguration</h2>

      {current ? (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-card mb-3">
          <span className="text-2xl">{current.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{current.name}</p>
            <p className="text-xs text-muted-foreground">{current.description}</p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mb-3">Noch keine Branche konfiguriert.</p>
      )}

      <Button size="sm" variant="outline" onClick={handleOpen} className="gap-1.5">
        <Building2 className="w-3 h-3" />
        Branche ändern
      </Button>
      <p className="text-[11px] text-muted-foreground mt-2">
        Beim Wechsel der Branche werden die Vorlagen der neuen Branche hinzugefügt. Ihre bestehenden Entscheidungen und Daten bleiben vollständig erhalten.
      </p>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Branche wechseln</DialogTitle>
            <DialogDescription>
              Wählen Sie Ihre Branche. Bestehende Daten bleiben erhalten — nur neue Vorlagen werden hinzugefügt.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 my-4">
            {industries.map((ind) => {
              const isSelected = selected === ind.id;
              return (
                <button
                  key={ind.id}
                  onClick={() => setSelected(ind.id)}
                  className={`relative text-left p-3 rounded-lg border-2 transition-all duration-150 ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border/60 hover:border-primary/40 hover:bg-muted/30"
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
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleChange}
              disabled={!selected || selected === currentIndustry || saving}
              className="gap-1.5"
            >
              {saving ? "Wird geladen..." : "Branche wechseln & Vorlagen laden"}
              {!saving && <ArrowRight className="w-3.5 h-3.5" />}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default IndustryConfigSection;
