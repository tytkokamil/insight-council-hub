import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Zap, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrialExpiredModalProps {
  open: boolean;
  onDismiss: () => void;
}

const plans = [
  {
    name: "Starter",
    price: "59",
    highlight: false,
    features: [
      "Unlimitierte Entscheidungen",
      "Bis zu 8 Nutzer",
      "3 Teams",
      "SLA-Tracking",
      "Automatisierungen",
    ],
  },
  {
    name: "Professional",
    price: "149",
    highlight: true,
    features: [
      "Alles aus Starter",
      "KI Daily Brief & Copilot",
      "Alle Analytics-Module",
      "Executive Hub",
      "Echtzeit Cost-of-Delay",
      "Cryptographic Audit Trail",
    ],
  },
];

const TrialExpiredModal = ({ open, onDismiss }: TrialExpiredModalProps) => {
  const navigate = useNavigate();

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="text-center px-8 pt-10 pb-6">
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-5">
              <Shield className="w-7 h-7 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">
              Ihre kostenlose Testphase ist abgelaufen
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Ihre Daten sind sicher gespeichert. Wählen Sie einen Plan um alle Premium-Features wieder freizuschalten.
            </p>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-8 pb-6">
            {plans.map((plan) => (
              <button
                key={plan.name}
                onClick={() => navigate("/upgrade")}
                className={`text-left rounded-xl p-5 border-2 transition-all hover:shadow-lg ${
                  plan.highlight
                    ? "border-primary bg-primary/[0.03] ring-1 ring-primary/20"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  {plan.highlight && <Zap className="w-4 h-4 text-primary" />}
                  <span className="font-bold text-sm">{plan.name}</span>
                  {plan.highlight && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      Empfohlen
                    </span>
                  )}
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold">€{plan.price}</span>
                  <span className="text-sm text-muted-foreground">/Mo</span>
                </div>
                <ul className="space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          {/* Free continue */}
          <div className="px-8 pb-8 text-center">
            <button
              onClick={onDismiss}
              className="text-[12px] text-muted-foreground/60 hover:text-muted-foreground transition-colors underline underline-offset-2"
            >
              Kostenlos weitermachen (eingeschränkte Features)
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TrialExpiredModal;
