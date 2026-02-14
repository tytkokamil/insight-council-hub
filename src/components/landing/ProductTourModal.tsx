import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ArrowLeft,
  BarChart3,
  Brain,
  Users,
  Shield,
  Zap,
  GitBranch,
  CheckCircle2,
  TrendingUp,
  Clock,
  Target,
} from "lucide-react";

interface ProductTourModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const tourSteps = [
  {
    title: "Entscheidungs-Dashboard",
    subtitle: "Alles auf einen Blick",
    description:
      "Verfolge alle Entscheidungen deines Teams in Echtzeit. Sehe Status, Prioritäten und Fortschritt auf einen Blick.",
    icon: BarChart3,
    color: "primary",
    preview: {
      type: "dashboard" as const,
    },
  },
  {
    title: "KI-gestützte Analyse",
    subtitle: "Intelligente Einblicke",
    description:
      "Unsere KI analysiert Risiken, Abhängigkeiten und Erfolgswahrscheinlichkeiten für jede Entscheidung automatisch.",
    icon: Brain,
    color: "accent",
    preview: {
      type: "ai" as const,
    },
  },
  {
    title: "Team-Kollaboration",
    subtitle: "Gemeinsam entscheiden",
    description:
      "Stakeholder-Alignment, Review-Workflows und Diskussionen — alles an einem Ort für transparente Entscheidungen.",
    icon: Users,
    color: "primary",
    preview: {
      type: "team" as const,
    },
  },
  {
    title: "Decision Graph",
    subtitle: "Abhängigkeiten visualisieren",
    description:
      "Verstehe komplexe Abhängigkeiten zwischen Entscheidungen und identifiziere Bottlenecks bevor sie entstehen.",
    icon: GitBranch,
    color: "accent",
    preview: {
      type: "graph" as const,
    },
  },
  {
    title: "Bereit loszulegen?",
    subtitle: "Starte jetzt kostenlos",
    description:
      "14 Tage kostenlos testen. Keine Kreditkarte nötig. Dein Team wird es dir danken.",
    icon: Zap,
    color: "primary",
    preview: {
      type: "cta" as const,
    },
  },
];

const DashboardPreview = () => (
  <div className="space-y-3">
    <div className="flex gap-3">
      {[
        { label: "Offen", value: "12", color: "bg-warning/20 text-warning" },
        { label: "Genehmigt", value: "34", color: "bg-success/20 text-success" },
        { label: "Überfällig", value: "3", color: "bg-destructive/20 text-destructive" },
      ].map((s) => (
        <div key={s.label} className="flex-1 p-3 rounded-xl bg-muted/30 border border-border/40">
          <div className={`text-xl font-bold font-display ${s.color.split(" ")[1]}`}>{s.value}</div>
          <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
        </div>
      ))}
    </div>
    {[
      { t: "Q4 Budget", s: "Approved", p: 92 },
      { t: "Hiring Plan", s: "In Review", p: 65 },
      { t: "Tech Migration", s: "Draft", p: 30 },
    ].map((d, i) => (
      <motion.div
        key={d.t}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 + i * 0.15 }}
        className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/30"
      >
        <div className="flex-1">
          <div className="text-sm font-medium">{d.t}</div>
          <div className="text-xs text-muted-foreground">{d.s}</div>
        </div>
        <div className="w-20 h-1.5 rounded-full bg-muted/40 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${d.p}%` }}
            transition={{ delay: 0.5 + i * 0.15, duration: 0.8 }}
          />
        </div>
        <span className="text-xs text-muted-foreground font-mono w-8 text-right">{d.p}%</span>
      </motion.div>
    ))}
  </div>
);

const AiPreview = () => (
  <div className="space-y-3">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="p-3 rounded-xl bg-primary/5 border border-primary/20"
    >
      <div className="flex items-center gap-2 mb-2">
        <Brain className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold text-primary">KI-Risikoanalyse</span>
      </div>
      <div className="space-y-2">
        {[
          { label: "Risiko-Score", value: "Mittel (42/100)", icon: Shield },
          { label: "Erfolgswahrscheinlichkeit", value: "78%", icon: TrendingUp },
          { label: "Geschätzte Dauer", value: "3-5 Wochen", icon: Clock },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.2 }}
            className="flex items-center justify-between text-sm"
          >
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </span>
            <span className="font-medium">{item.value}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="p-3 rounded-xl bg-muted/20 border border-border/30"
    >
      <div className="text-xs font-semibold mb-2">KI-Empfehlung</div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Basierend auf historischen Daten empfehle ich, vor der Implementierung einen
        Stakeholder-Review durchzuführen. Ähnliche Entscheidungen hatten eine 23% höhere
        Erfolgsrate mit diesem Schritt.
      </p>
    </motion.div>
  </div>
);

const TeamPreview = () => (
  <div className="space-y-3">
    <div className="flex -space-x-2 mb-3">
      {["A", "B", "C", "D", "E"].map((l, i) => (
        <motion.div
          key={l}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 + i * 0.1, type: "spring" }}
          className="w-8 h-8 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-xs font-bold text-primary"
        >
          {l}
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="w-8 h-8 rounded-full bg-muted/30 border-2 border-background flex items-center justify-center text-xs text-muted-foreground"
      >
        +8
      </motion.div>
    </div>
    {[
      { name: "Anna M.", status: "Approved", icon: CheckCircle2 },
      { name: "Thomas K.", status: "In Review", icon: Clock },
      { name: "Sarah L.", status: "Pending", icon: Target },
    ].map((r, i) => (
      <motion.div
        key={r.name}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 + i * 0.15 }}
        className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20 border border-border/30"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
            {r.name[0]}
          </div>
          <span className="text-sm">{r.name}</span>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            r.status === "Approved"
              ? "bg-success/10 text-success"
              : r.status === "In Review"
              ? "bg-warning/10 text-warning"
              : "bg-muted/30 text-muted-foreground"
          }`}
        >
          {r.status}
        </span>
      </motion.div>
    ))}
  </div>
);

const GraphPreview = () => (
  <div className="relative h-40">
    {[
      { x: "15%", y: "20%", label: "Budget" },
      { x: "50%", y: "10%", label: "Hiring" },
      { x: "80%", y: "30%", label: "Tech" },
      { x: "30%", y: "65%", label: "Marketing" },
      { x: "65%", y: "70%", label: "Ops" },
    ].map((node, i) => (
      <motion.div
        key={node.label}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 + i * 0.15, type: "spring" }}
        className="absolute"
        style={{ left: node.x, top: node.y }}
      >
        <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
          <span className="text-[10px] font-medium text-primary">{node.label}</span>
        </div>
      </motion.div>
    ))}
    <svg className="absolute inset-0 w-full h-full" style={{ zIndex: -1 }}>
      {[
        ["22%", "35%", "52%", "22%"],
        ["57%", "22%", "82%", "42%"],
        ["35%", "78%", "52%", "22%"],
        ["37%", "78%", "67%", "82%"],
      ].map(([x1, y1, x2, y2], i) => (
        <motion.line
          key={i}
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="hsl(var(--primary) / 0.2)"
          strokeWidth="1.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
        />
      ))}
    </svg>
  </div>
);

const CtaPreview = () => (
  <div className="flex flex-col items-center justify-center py-4 space-y-4">
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", delay: 0.2 }}
      className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"
    >
      <Zap className="w-8 h-8 text-primary" />
    </motion.div>
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="text-center space-y-1"
    >
      <div className="text-sm font-semibold">Bereit für bessere Entscheidungen?</div>
      <div className="text-xs text-muted-foreground">14 Tage kostenlos · Keine Kreditkarte</div>
    </motion.div>
    {["Unbegrenzte Entscheidungen", "KI-Analyse inklusive", "Team-Kollaboration"].map((f, i) => (
      <motion.div
        key={f}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 + i * 0.1 }}
        className="flex items-center gap-2 text-xs text-muted-foreground"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-success" />
        {f}
      </motion.div>
    ))}
  </div>
);

const previewComponents: Record<string, React.FC> = {
  dashboard: DashboardPreview,
  ai: AiPreview,
  team: TeamPreview,
  graph: GraphPreview,
  cta: CtaPreview,
};

const ProductTourModal = ({ open, onOpenChange }: ProductTourModalProps) => {
  const [step, setStep] = useState(0);
  const current = tourSteps[step];
  const Icon = current.icon;
  const PreviewComponent = previewComponents[current.preview.type];

  const next = () => {
    if (step < tourSteps.length - 1) setStep(step + 1);
    else onOpenChange(false);
  };
  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setStep(0);
      }}
    >
      <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden border-border/60 bg-card/95 backdrop-blur-2xl">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <motion.div
              key={step}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"
            >
              <Icon className="w-5 h-5 text-primary" />
            </motion.div>
            <div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    {current.subtitle}
                  </div>
                  <div className="font-display font-bold text-lg">{current.title}</div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={step}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-muted-foreground leading-relaxed"
            >
              {current.description}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Preview */}
        <div className="px-6 pb-4">
          <div className="rounded-xl border border-border/40 bg-muted/10 p-4 min-h-[200px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                {PreviewComponent && <PreviewComponent />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between">
          {/* Step indicators */}
          <div className="flex gap-1.5">
            {tourSteps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/20 hover:bg-muted-foreground/40"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="ghost" size="sm" onClick={prev} className="rounded-xl">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Zurück
              </Button>
            )}
            <Button size="sm" onClick={next} className="rounded-xl">
              {step < tourSteps.length - 1 ? (
                <>
                  Weiter
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              ) : (
                "Jetzt starten"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductTourModal;
