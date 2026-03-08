import { useMemo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Award, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDecisions } from "@/hooks/useDecisions";
import { formatCost } from "@/lib/formatters";

const INDUSTRY_AVG_DAYS = 8.7;
const HOURLY_RATE = 85;

const RoiProofWidget = () => {
  const { data: decisions = [], isLoading } = useDecisions();
  const [showModal, setShowModal] = useState(false);
  const [seen, setSeen] = useState(() => localStorage.getItem("roi-moment-shown") === "1");

  const roi = useMemo(() => {
    const impl = decisions.filter(d => d.status === "implemented" && d.implemented_at);
    if (impl.length === 0) return null;
    const avgDays = impl.reduce((s, d) => s + (new Date(d.implemented_at!).getTime() - new Date(d.created_at).getTime()) / 86400000, 0) / impl.length;
    const saved = Math.max(0, INDUSTRY_AVG_DAYS - avgDays);
    const codSaved = Math.round(impl.length * saved * HOURLY_RATE * 8 * 0.3);
    const multiple = Math.round(codSaved / 149 * 10) / 10;
    return { count: impl.length, saved: Math.round(saved * 10) / 10, codSaved, multiple };
  }, [decisions]);

  useEffect(() => {
    if (roi && roi.multiple >= 1 && !seen) {
      const t = setTimeout(() => { setShowModal(true); setSeen(true); localStorage.setItem("roi-moment-shown", "1"); }, 4000);
      return () => clearTimeout(t);
    }
  }, [roi, seen]);

  if (isLoading || !roi || roi.codSaved <= 0) return null;

  return (
    <>
      <Card className="border-success/20 bg-success/[0.02]">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <CardTitle className="text-sm">ROI-Nachweis</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-success tabular-nums">{formatCost(roi.codSaved)}€ gespart</p>
          <p className="text-xs text-muted-foreground mb-2">{roi.count} beschleunigte Entscheidungen · Ø {roi.saved} Tage schneller</p>
          {roi.multiple >= 1 && (
            <Badge className="bg-success/10 text-success border-success/20 text-[10px]">
              <Award className="w-3 h-3 mr-1" /> {roi.multiple}x ROI
            </Badge>
          )}
        </CardContent>
      </Card>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#0F172A]/95 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
              className="max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}
                className="w-16 h-16 rounded-full bg-[#10B981]/20 flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-[#10B981]" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-1">ROI erreicht!</h2>
              <p className="text-[#10B981] text-4xl font-bold mb-1">{formatCost(roi.codSaved)}€</p>
              <p className="text-sm text-gray-400 mb-4">durch schnellere Entscheidungen</p>
              <p className="text-white mb-6">{roi.multiple}x Gegenwert Ihres Abonnements</p>
              <Button className="bg-[#10B981] hover:bg-[#10B981]/80 text-white" onClick={() => setShowModal(false)}>Weiter arbeiten</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default RoiProofWidget;
