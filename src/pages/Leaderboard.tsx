import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Download, Share2, ExternalLink } from "lucide-react";
import decivioLogo from "@/assets/decivio-logo.png";

const ease = [0.16, 1, 0.3, 1] as const;

const industries = [
  { rank: 1, name: "Automotive", monthly: 127400, yearly: 1528800, driver: "PPAP-Freigaben, Lieferantenwechsel", badge: "Über Branchendurchschnitt", badgeColor: "#EF4444", emoji: "🥇", highlight: true },
  { rank: 2, name: "Pharma & Life Sciences", monthly: 118900, yearly: 1426800, driver: "Change Control, Batch-Freigaben", badge: "Kritisch", badgeColor: "#991B1B", emoji: "🥈", highlight: true },
  { rank: 3, name: "Finanzdienstleister", monthly: 98200, yearly: 1178400, driver: "Kreditentscheidungen, Risikoakzeptanz", badge: "Über Branchendurchschnitt", badgeColor: "#EF4444", emoji: "🥉", highlight: true },
  { rank: 4, name: "Maschinenbau", monthly: 84600, yearly: 1015200, driver: "Investitionsfreigaben, ECOs", badge: "Durchschnitt", badgeColor: "#F59E0B", emoji: "", highlight: false },
  { rank: 5, name: "Energie & Versorgung", monthly: 76300, yearly: 915600, driver: "Netzinvestitionen, KRITIS-Entscheidungen", badge: "Durchschnitt", badgeColor: "#F59E0B", emoji: "", highlight: false },
  { rank: 6, name: "Bau & Industrie", monthly: 61800, yearly: 741600, driver: "Auftragsvergabe, Partnerwahl", badge: "Unter Durchschnitt", badgeColor: "#22C55E", emoji: "", highlight: false },
  { rank: 7, name: "IT & Software", monthly: 54200, yearly: 650400, driver: "RFC, Security Reviews, Architektur", badge: "Unter Durchschnitt", badgeColor: "#22C55E", emoji: "", highlight: false },
  { rank: 8, name: "Healthcare", monthly: 47900, yearly: 574800, driver: "Medizinprodukte, Behandlungsprotokolle", badge: "Gut", badgeColor: "#166534", emoji: "", highlight: false },
];

const sizeMultipliers: Record<string, number> = { "< 50 MA": 0.4, "50-200": 1, "200-500": 2.2, "500+": 4 };

const fmt = (n: number) => n.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const today = new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });

const Leaderboard = () => {
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

  const estimate = useMemo(() => {
    if (!selectedIndustry || !selectedSize) return null;
    const ind = industries.find(i => i.name === selectedIndustry);
    if (!ind) return null;
    return Math.round(ind.monthly * (sizeMultipliers[selectedSize] || 1));
  }, [selectedIndustry, selectedSize]);

  const linkedInText = encodeURIComponent(
    `Wussten Sie dass der deutsche Automotive-Sektor im Schnitt €127.000/Monat durch Entscheidungsverzögerung verliert? Quelle: Decivio Branchenreport 2024 https://decivio.com/leaderboard`
  );

  return (
    <>
      <Helmet>
        <title>Branchenreport: Kosten der Entscheidungsverzögerung 2024 | Decivio</title>
        <meta name="description" content="Was kostet Entscheidungsverzögerung deutsche Mittelständler? Automotive €1,5M/Jahr, Pharma €1,4M/Jahr. Jetzt messen." />
        <link rel="canonical" href="https://decivio.com/leaderboard" />
      </Helmet>

      <div className="min-h-screen" style={{ background: "#F8FAFC" }}>
        {/* Header */}
        <header style={{ background: "#1E3A5F" }} className="py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <img src={decivioLogo} alt="Decivio" className="w-8 h-8 rounded-md" style={{ filter: "brightness(10)" }} />
              <Link to="/" className="text-white/70 text-sm hover:text-white transition-colors">← Zur Startseite</Link>
            </div>
            <h1 className="text-white text-2xl md:text-4xl font-bold tracking-tight mb-4">
              Was Entscheidungsverzögerung deutsche Branchen täglich kostet
            </h1>
            <p className="text-blue-200/70 text-sm md:text-base max-w-3xl">
              Basierend auf Branchendaten, durchschnittlichen Stundensätzen und typischen Entscheidungsportfolios im Mittelstand (50–500 MA)
            </p>
            <p className="text-blue-200/40 text-xs mt-4">Berechnet am {today}</p>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 py-10">
          {/* Methodology callout */}
          <div className="rounded-xl border-l-4 border-amber-400 bg-amber-50 p-4 mb-8">
            <p className="text-sm text-amber-900 font-medium mb-1">Berechnungsmethodik</p>
            <p className="text-xs text-amber-800">
              Ø Stundensatz × 8h × Ø beteiligte Personen × offene Entscheidungen × Ø Verzögerungstage / 21 Arbeitstage
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Quellen: Bundesagentur für Arbeit (Lohnstatistik), VDMA, BDI, interne Decivio Produkttests
            </p>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden mb-12">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100" style={{ background: "#F8FAFC" }}>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rang</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Branche</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ø Kosten/Monat</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ø Kosten/Jahr</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Haupttreiber</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Benchmark</th>
                  </tr>
                </thead>
                <tbody>
                  {industries.map((ind) => (
                    <motion.tr
                      key={ind.rank}
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: ind.rank * 0.05, duration: 0.4, ease }}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                      style={ind.highlight ? { background: "rgba(239,68,68,0.04)" } : {}}
                    >
                      <td className="py-3.5 px-4 font-medium">
                        {ind.emoji ? <span className="text-lg">{ind.emoji}</span> : <span className="text-gray-400">{ind.rank}</span>}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-900">{ind.name}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-900">{fmt(ind.monthly)}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-gray-600">{fmt(ind.yearly)}</td>
                      <td className="py-3.5 px-4 text-gray-500 text-xs hidden md:table-cell">{ind.driver}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                          style={{ background: ind.badgeColor }}
                        >
                          {ind.badge}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="rounded-xl border border-gray-200 bg-white p-6 md:p-8 mb-12"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6">Wo steht Ihr Unternehmen?</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Branche wählen</label>
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Bitte wählen —</option>
                  {industries.map(i => <option key={i.name} value={i.name}>{i.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unternehmensgröße</label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(sizeMultipliers).map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{
                        background: selectedSize === size ? "#1E3A5F" : "#F1F5F9",
                        color: selectedSize === size ? "#fff" : "#64748B",
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {estimate && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl p-6 text-center"
                style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}
              >
                <p className="text-sm text-gray-600 mb-2">
                  Als <strong>{selectedIndustry}</strong>-Unternehmen mit <strong>{selectedSize}</strong> Mitarbeitern zahlen Sie schätzungsweise:
                </p>
                <p className="text-3xl font-bold text-red-600 mb-1">{fmt(estimate)}/Monat</p>
                <p className="text-sm text-gray-500 mb-4">an Entscheidungsverzögerung</p>
                <Link
                  to={`/auth?ref=leaderboard&industry=${encodeURIComponent(selectedIndustry)}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: "#EF4444" }}
                >
                  Meine echten Zahlen messen — kostenlos <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            )}
          </motion.div>

          {/* Share section */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 mb-12">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Diese Daten teilen</h3>
            <div className="flex flex-wrap gap-3">
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://decivio.com/leaderboard")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                LinkedIn teilen <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${linkedInText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                X / Twitter <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent("Branchenreport: Kosten der Entscheidungsverzögerung")}&body=${linkedInText}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Per E-Mail teilen <Share2 className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center py-8">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90"
              style={{ background: "#1E3A5F" }}
            >
              Kostenlos starten — 14 Tage testen <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Footer */}
          <footer className="border-t border-gray-200 pt-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <img src={decivioLogo} alt="Decivio" className="w-5 h-5 rounded" />
              <span className="text-sm font-semibold text-gray-900">Decivio</span>
            </div>
            <p className="text-xs text-gray-400">
              Die dargestellten Zahlen basieren auf Branchendurchschnitten und stellen keine individuellen Kosten dar.
              Daten aktualisiert: {today}
            </p>
          </footer>
        </div>
      </div>
    </>
  );
};

export default Leaderboard;
