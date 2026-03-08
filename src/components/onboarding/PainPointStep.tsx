import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface Props {
  onNext: (costData: { people: number; rate: number; days: number; monthlyCost: number }) => void;
  slideAnim: Record<string, unknown>;
}

const PainPointStep = ({ onNext, slideAnim }: Props) => {
  const [people, setPeople] = useState(3);
  const [rate, setRate] = useState(90);
  const [days, setDays] = useState(5);

  const monthlyCost = useMemo(() => {
    // Monthly cost = hourly_rate * 8h * people * days_delay * ~4.3 weeks/month
    return Math.round(rate * 8 * people * days * 4.3);
  }, [people, rate, days]);

  return (
    <motion.div key="pain" {...slideAnim} className="w-full max-w-lg">
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold text-foreground">
          Was kostet Entscheidungsverzögerung in Ihrem Unternehmen?
        </h1>
        <p className="text-muted-foreground text-sm mt-2">
          Bewegen Sie die Regler — die Kosten berechnen sich live.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-8">
        {/* Slider 1: People */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-foreground">Wartende Personen</label>
            <span className="text-sm font-bold text-foreground tabular-nums">{people}</span>
          </div>
          <Slider
            value={[people]}
            onValueChange={([v]) => setPeople(v)}
            min={1}
            max={10}
            step={1}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>1</span><span>10</span>
          </div>
        </div>

        {/* Slider 2: Hourly rate */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-foreground">Ø Stundensatz</label>
            <span className="text-sm font-bold text-foreground tabular-nums">{rate} €</span>
          </div>
          <Slider
            value={[rate]}
            onValueChange={([v]) => setRate(v)}
            min={40}
            max={200}
            step={10}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>40 €</span><span>200 €</span>
          </div>
        </div>

        {/* Slider 3: Delay days */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-foreground">Tage bis zur Freigabe</label>
            <span className="text-sm font-bold text-foreground tabular-nums">{days} Tage</span>
          </div>
          <Slider
            value={[days]}
            onValueChange={([v]) => setDays(v)}
            min={1}
            max={20}
            step={1}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>1</span><span>20</span>
          </div>
        </div>
      </div>

      {/* Live cost display */}
      <motion.div
        className="mt-6 text-center"
        layout
      >
        <p className="text-xs text-muted-foreground mb-1">Das kostet Sie ca.</p>
        <motion.p
          key={monthlyCost}
          initial={{ scale: 0.9, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-4xl font-bold text-destructive tabular-nums font-mono"
        >
          {monthlyCost.toLocaleString("de-DE")} €
        </motion.p>
        <p className="text-xs text-muted-foreground mt-1">pro Monat an Verzögerungskosten</p>
      </motion.div>

      <Button
        size="lg"
        onClick={() => onNext({ people, rate, days, monthlyCost })}
        className="w-full mt-8 gap-2 h-12 text-sm font-semibold"
      >
        Ich will das stoppen <ArrowRight className="w-4 h-4" />
      </Button>
    </motion.div>
  );
};

export default PainPointStep;
