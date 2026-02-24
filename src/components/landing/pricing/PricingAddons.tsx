import { motion } from "framer-motion";

const addons = [
  { name: "Extra Nutzer-Block", price: "€19 / 10 User", desc: "Nutzerkontingent erweitern ohne Plan-Upgrade", from: "Starter+" },
  { name: "KI-Analyse Boost", price: "€29 / Monat", desc: "+500 KI-Analysen pro Monat zusätzlich", from: "Starter+" },
  { name: "Extended Audit Trail", price: "€19 / Monat", desc: "Audit Trail auf 10 Jahre erweitern", from: "Starter+" },
  { name: "Decision Room Pro", price: "€39 / Monat", desc: "War Room Modus, Gast-Zugang, Meeting Protokoll 2.0", from: "Starter+" },
  { name: "Benchmarking", price: "€49 / Monat", desc: "Industrie-Benchmarking und Vergleichsdaten", from: "Professional+" },
  { name: "Custom Branding", price: "€29 / Monat", desc: "Logo, Primärfarbe, eigene Domain", from: "Professional+" },
  { name: "API-Zugang", price: "€99 / Monat", desc: "Vollständige REST API + Webhooks", from: "Professional+" },
  { name: "Onboarding", price: "€499 einmalig", desc: "2h geführtes Setup mit Berater", from: "Alle Pläne" },
];

const ease = [0.16, 1, 0.3, 1] as const;

const PricingAddons = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, ease }}
    className="mt-16 max-w-4xl mx-auto"
  >
    <h3 className="text-xl font-bold text-center mb-2">Optionale Add-ons</h3>
    <p className="text-sm text-muted-foreground text-center mb-8">
      Schrittweise erweitern — nur zahlen was ihr braucht.
    </p>

    <div className="grid sm:grid-cols-2 gap-3">
      {addons.map((addon, i) => (
        <motion.div
          key={addon.name}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.04, duration: 0.4, ease }}
          className="flex items-start gap-3 p-4 rounded-xl border border-border/40 bg-card hover:border-foreground/10 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold">{addon.name}</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-muted text-muted-foreground">
                {addon.from}
              </span>
            </div>
            <p className="text-xs text-muted-foreground/70">{addon.desc}</p>
          </div>
          <span className="text-sm font-bold text-primary whitespace-nowrap">{addon.price}</span>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

export default PricingAddons;
