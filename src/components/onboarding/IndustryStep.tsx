import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const INDUSTRIES = [
  { id: "maschinenbau", icon: "⚙️", label: "Maschinenbau" },
  { id: "automotive", icon: "🏭", label: "Automotive" },
  { id: "pharma", icon: "💊", label: "Pharma" },
  { id: "it", icon: "💻", label: "IT / Software" },
  { id: "bau", icon: "🏗️", label: "Bau / Industrie" },
  { id: "allgemein", icon: "📦", label: "Andere" },
];

interface Props {
  selectedIndustry: string | null;
  onSelect: (id: string) => void;
  slideAnim: Record<string, unknown>;
}

const IndustryStep = ({ selectedIndustry, onSelect, slideAnim }: Props) => (
  <motion.div key="s2" {...slideAnim} className="w-full max-w-lg">
    <div className="text-center mb-8">
      <h1 className="text-2xl font-bold text-foreground">In welcher Branche bist du tätig?</h1>
      <p className="text-muted-foreground text-sm mt-2">Wir passen Vorlagen und Einstellungen an.</p>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {INDUSTRIES.map((ind, i) => {
        const selected = selectedIndustry === ind.id;
        return (
          <motion.button
            key={ind.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelect(ind.id)}
            className={`relative p-5 rounded-xl border-2 transition-all text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
              selected
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-border hover:border-primary/40 hover:shadow-sm bg-card"
            }`}
            aria-pressed={selected}
          >
            {selected && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
              </motion.div>
            )}
            <span className="text-3xl block mb-2">{ind.icon}</span>
            <span className="text-xs font-medium text-foreground">{ind.label}</span>
          </motion.button>
        );
      })}
    </div>
  </motion.div>
);

export default IndustryStep;
