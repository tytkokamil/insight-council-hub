import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  decisionTitle: string;
  setDecisionTitle: (v: string) => void;
  decisionCategory: string;
  setDecisionCategory: (v: string) => void;
  decisionPriority: string;
  setDecisionPriority: (v: string) => void;
  loading: boolean;
  onCreateDecision: () => void;
  onLoadDemo: () => void;
  slideAnim: Record<string, unknown>;
}

const FirstDecisionStep = ({
  decisionTitle, setDecisionTitle,
  decisionCategory, setDecisionCategory,
  decisionPriority, setDecisionPriority,
  loading, onCreateDecision, onLoadDemo, slideAnim,
}: Props) => (
  <motion.div key="s4" {...slideAnim} className="w-full max-w-lg">
    <div className="text-center mb-8">
      <h1 className="text-2xl font-bold text-foreground">
        Welche Entscheidung liegt bei euch gerade offen?
      </h1>
      <p className="text-muted-foreground text-sm mt-2">Erstelle deine erste Entscheidung oder lade Beispieldaten.</p>
    </div>

    <div className="rounded-xl border border-border bg-card p-5 space-y-4 mb-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Titel *</label>
        <Input
          value={decisionTitle}
          onChange={(e) => setDecisionTitle(e.target.value)}
          placeholder="z.B. ERP-System Migration entscheiden"
          className="h-11"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Kategorie</label>
          <select
            value={decisionCategory}
            onChange={(e) => setDecisionCategory(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="strategic">Strategisch</option>
            <option value="operational">Operativ</option>
            <option value="technical">Technisch</option>
            <option value="budget">Budget</option>
            <option value="hr">Personal</option>
            <option value="marketing">Marketing</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Priorität</label>
          <select
            value={decisionPriority}
            onChange={(e) => setDecisionPriority(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="low">Niedrig</option>
            <option value="medium">Mittel</option>
            <option value="high">Hoch</option>
            <option value="critical">Kritisch</option>
          </select>
        </div>
      </div>
      <Button
        onClick={onCreateDecision}
        disabled={!decisionTitle.trim() || loading}
        className="w-full gap-2 h-11"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Entscheidung anlegen <ArrowRight className="w-4 h-4" />
      </Button>
    </div>

    <div className="text-center">
      <button
        onClick={onLoadDemo}
        disabled={loading}
        className="text-xs text-primary hover:underline"
      >
        {loading ? "Wird geladen..." : "Beispieldaten laden →"}
      </button>
    </div>
  </motion.div>
);

export default FirstDecisionStep;
