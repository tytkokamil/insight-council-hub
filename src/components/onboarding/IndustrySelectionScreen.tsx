import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { industries, type Industry } from "@/lib/industries";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { seedIndustryData } from "@/lib/industrySeeder";
import decivioLogo from "@/assets/decivio-logo.png";

interface IndustrySelectionScreenProps {
  onComplete: (industryId: string) => void;
}

const IndustrySelectionScreen = ({ onComplete }: IndustrySelectionScreenProps) => {
  const { user } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingText, setLoadingText] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!selected || !user) return;
    setSaving(true);
    const industry = industries.find(i => i.id === selected);
    setLoadingText(`Wir richten Decivio für ${industry?.name || "Sie"} ein...`);

    // Save industry to profile
    await supabase
      .from("profiles")
      .update({ industry: selected } as any)
      .eq("user_id", user.id);

    // Seed industry-specific templates and demo decisions
    await seedIndustryData(user.id, selected);

    onComplete(selected);
  };

  const handleSkip = async () => {
    if (!user) return;
    setSaving(true);
    setLoadingText("Wir richten Decivio für Sie ein...");

    await supabase
      .from("profiles")
      .update({ industry: "allgemein" } as any)
      .eq("user_id", user.id);

    await seedIndustryData(user.id, "allgemein");

    onComplete("allgemein");
  };

  if (loadingText) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-medium text-foreground"
        >
          {loadingText}
        </motion.p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="pt-8 pb-4 text-center">
        <div className="w-10 h-10 rounded-xl overflow-hidden mx-auto mb-4">
          <img src={decivioLogo} alt="Decivio" className="w-full h-full" />
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          In welcher Branche sind Sie tätig?
        </h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base max-w-lg mx-auto px-4">
          Wir laden automatisch passende Vorlagen und Beispiele für Ihre Branche.
        </p>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-16 pb-32">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
          {industries.map((ind, i) => {
            const isSelected = selected === ind.id;
            return (
              <motion.button
                key={ind.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelected(ind.id)}
                className={`relative text-left p-4 rounded-xl border-2 transition-all duration-150 ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border/60 hover:border-primary/40 hover:bg-muted/30"
                }`}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </motion.div>
                )}
                <div className="flex items-start gap-3">
                  <span className="text-2xl leading-none mt-0.5">{ind.icon}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground">{ind.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{ind.description}</p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-background/80 backdrop-blur-lg border-t border-border/60 px-4 py-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleSkip}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
          >
            Ich bin mir noch nicht sicher — später auswählen
          </button>
          <Button
            size="lg"
            disabled={!selected || saving}
            onClick={handleContinue}
            className="gap-2 min-w-[180px]"
          >
            Weiter
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IndustrySelectionScreen;
