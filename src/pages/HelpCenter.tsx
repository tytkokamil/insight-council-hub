import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import {
  Search, BookOpen, Rocket, BarChart3, Shield, Users, Brain,
  ChevronDown, ChevronRight, ArrowLeft, MessageSquare, ExternalLink,
  Zap, Calendar, Target, FileText, Settings, Bell
} from "lucide-react";
import decivioLogo from "@/assets/decivio-logo.png";

/* ───── Data ───── */

interface FaqItem { q: string; a: string }
interface Guide { title: string; desc: string; icon: any; steps: string[] }
interface Category { id: string; label: string; icon: any; faqs: FaqItem[]; guides: Guide[] }

const categories: Category[] = [
  {
    id: "start",
    label: "Erste Schritte",
    icon: Rocket,
    guides: [
      {
        title: "Account erstellen & einrichten",
        desc: "In 3 Minuten startklar.",
        icon: Rocket,
        steps: [
          "Registriere dich unter /auth mit E-Mail und Passwort oder Google Login.",
          "Bestätige deine E-Mail-Adresse über den Verifizierungslink.",
          "Der Welcome-Wizard führt dich durch die Grundkonfiguration: Branche, Team-Name und erste Entscheidung.",
          "Im Dashboard siehst du sofort deine KPIs und den Onboarding-Checklist-Fortschritt.",
        ],
      },
      {
        title: "Erste Entscheidung anlegen",
        desc: "So dokumentierst du deine erste Entscheidung.",
        icon: FileText,
        steps: [
          "Klicke im Dashboard auf '+ Neue Entscheidung' oder nutze das Tastenkürzel Cmd+K → 'Neue Entscheidung'.",
          "Wähle ein Template (z.B. Investitionsentscheidung, Prozessänderung) oder starte mit einem leeren Formular.",
          "Fülle Titel, Beschreibung und Kontext aus. Setze Priorität und Fälligkeitsdatum.",
          "Optional: Weise Reviewer zu und verknüpfe strategische Ziele.",
          "Klicke auf 'Erstellen' — die Entscheidung erscheint sofort in deiner Übersicht.",
        ],
      },
    ],
    faqs: [
      { q: "Ist Decivio kostenlos nutzbar?", a: "Ja, der Free-Plan umfasst 1 Nutzer, bis zu 10 Entscheidungen und 30 Tage Audit Trail. Du kannst jederzeit upgraden." },
      { q: "Welche Browser werden unterstützt?", a: "Alle modernen Browser: Chrome, Firefox, Safari, Edge. Mobile Browser werden ebenfalls unterstützt." },
      { q: "Kann ich meine Daten exportieren?", a: "Ja, über Einstellungen → Admin → Daten kannst du alle Entscheidungen als CSV oder Excel exportieren. PDF-Exports einzelner Entscheidungen sind ebenfalls verfügbar." },
      { q: "Wo werden meine Daten gespeichert?", a: "Alle Daten werden in der EU (Deutschland) gehostet. Details findest du in unserer Datenschutzerklärung und dem AVV." },
    ],
  },
  {
    id: "decisions",
    label: "Entscheidungen",
    icon: Target,
    guides: [
      {
        title: "Review-Workflow einrichten",
        desc: "Mehrstufige Freigabeprozesse konfigurieren.",
        icon: Users,
        steps: [
          "Öffne eine Entscheidung und klicke auf den 'Review'-Tab.",
          "Wähle einen Review-Flow: Sequentiell (A → B → C) oder Parallel (alle gleichzeitig).",
          "Füge Reviewer hinzu — aus deinem Team oder als externe Reviewer per E-Mail.",
          "Reviewer werden per E-Mail und In-App-Benachrichtigung informiert.",
          "Jeder Reviewer kann genehmigen, ablehnen oder Änderungen anfragen.",
        ],
      },
    ],
    faqs: [
      { q: "Was passiert wenn eine Entscheidung überfällig ist?", a: "Überfällige Entscheidungen werden rot markiert, der Cost-of-Delay wird berechnet und je nach Konfiguration wird automatisch eskaliert." },
      { q: "Kann ich Entscheidungen archivieren?", a: "Ja, implementierte oder abgelehnte Entscheidungen können archiviert werden. Im Archiv bleiben sie durchsuchbar und der Audit Trail bleibt erhalten." },
      { q: "Was sind Templates?", a: "Templates sind vorkonfigurierte Entscheidungsvorlagen mit vordefinierten Feldern, Review-Flows und SLAs. Du kannst eigene erstellen oder die branchenspezifischen System-Templates nutzen." },
    ],
  },
  {
    id: "teams",
    label: "Teams & Zusammenarbeit",
    icon: Users,
    guides: [
      {
        title: "Team erstellen und Mitglieder einladen",
        desc: "Organisiere deine Teams für bessere Zusammenarbeit.",
        icon: Users,
        steps: [
          "Navigiere zu 'Teams' in der Sidebar und klicke '+ Neues Team'.",
          "Vergib einen Namen und optionale Beschreibung.",
          "Lade Mitglieder per E-Mail ein — sie erhalten eine Einladung.",
          "Weise Rollen zu: Lead (verwaltet das Team) oder Member (arbeitet mit).",
          "Das Team hat sofort einen eigenen Chat, Aufgaben-Board und Entscheidungsübersicht.",
        ],
      },
    ],
    faqs: [
      { q: "Welche Rollen gibt es?", a: "Es gibt 6 Rollen: Owner, Admin, Executive (nur Leserechte), Lead, Member und Viewer. Jede Rolle hat spezifische Berechtigungen die in den Einstellungen angepasst werden können." },
      { q: "Können externe Personen eingeladen werden?", a: "Ja, für Reviews können externe Reviewer per E-Mail eingeladen werden. Sie erhalten einen sicheren Link und benötigen keinen Account." },
    ],
  },
  {
    id: "analytics",
    label: "Analytics & KPIs",
    icon: BarChart3,
    guides: [],
    faqs: [
      { q: "Was ist der Decision Quality Index?", a: "Ein gewichteter Score aus mehreren KPIs: SLA-Compliance, Review-Abdeckung, Outcome-Tracking und Lessons-Learned-Rate. Er zeigt die Gesamtqualität deines Entscheidungsprozesses." },
      { q: "Was bedeutet Cost-of-Delay?", a: "Cost-of-Delay berechnet die wirtschaftlichen Kosten für jeden Tag, an dem eine Entscheidung nicht getroffen wird. Der Wert basiert auf konfigurierbaren Tagessätzen pro Priorität und Kategorie." },
      { q: "Kann ich KPI-Schwellenwerte anpassen?", a: "Ja, unter Einstellungen → Governance → KPI-Konfiguration kannst du Schwellenwerte für alle KPIs individuell anpassen." },
    ],
  },
  {
    id: "ai",
    label: "KI-Features",
    icon: Brain,
    guides: [],
    faqs: [
      { q: "Welche KI wird verwendet?", a: "Decivio nutzt integrierte KI-Modelle (Google Gemini und OpenAI). Du kannst optional eigene API-Keys in den Einstellungen hinterlegen." },
      { q: "Werden meine Daten zum KI-Training verwendet?", a: "Nein, niemals. Deine Daten werden ausschließlich zur Verarbeitung deiner Anfragen genutzt. Details in unserer KI-Richtlinie." },
      { q: "Was kann der KI-CoPilot?", a: "Der CoPilot analysiert Entscheidungskontexte, schlägt Optionen vor, identifiziert Risikofaktoren und gibt Empfehlungen basierend auf Best Practices und deiner Entscheidungshistorie." },
    ],
  },
  {
    id: "security",
    label: "Sicherheit & Compliance",
    icon: Shield,
    guides: [],
    faqs: [
      { q: "Ist Decivio DSGVO-konform?", a: "Ja, vollständig. Hosting in der EU, Auftragsverarbeitung (AVV), Recht auf Löschung, Datenminimierung und verschlüsselte Übertragung sind implementiert." },
      { q: "Wie funktioniert der Audit Trail?", a: "Jede Änderung wird unveränderbar protokolliert und kryptographisch per SHA-256 Hash-Kette gesichert. Manipulationen sind nachweisbar." },
      { q: "Kann ich meinen Account vollständig löschen?", a: "Ja, unter Einstellungen → Allgemein → Danger Zone kannst du deinen Account und alle Daten unwiderruflich löschen (DSGVO Art. 17)." },
      { q: "Unterstützt Decivio MFA?", a: "Ja, du kannst E-Mail-OTP als zweiten Faktor aktivieren unter Einstellungen → Sicherheit." },
    ],
  },
];

/* ───── Components ───── */

const FaqAccordion = ({ item }: { item: FaqItem }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border/60 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors">
        <span className="text-sm font-medium pr-4">{item.q}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const GuideCard = ({ guide }: { guide: Guide }) => {
  const [open, setOpen] = useState(false);
  const Icon = guide.icon;
  return (
    <div className="border border-border/60 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{guide.title}</p>
          <p className="text-xs text-muted-foreground">{guide.desc}</p>
        </div>
        <ChevronRight className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <ol className="px-4 pb-4 space-y-2">
              {guide.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ───── Page ───── */

const HelpCenter = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("start");

  const filtered = categories.map(cat => ({
    ...cat,
    faqs: cat.faqs.filter(f => !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())),
    guides: cat.guides.filter(g => !search || g.title.toLowerCase().includes(search.toLowerCase()) || g.desc.toLowerCase().includes(search.toLowerCase())),
  })).filter(cat => cat.faqs.length > 0 || cat.guides.length > 0);

  const activeCat = filtered.find(c => c.id === activeCategory) || filtered[0];

  return (
    <>
      <Helmet>
        <title>Help Center — Decivio</title>
        <meta name="description" content="Anleitungen, FAQ und Hilfe für Decivio. Lerne wie du Entscheidungen dokumentierst, Teams einrichtest und Analytics nutzt." />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="border-b border-border/40 py-4 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src={decivioLogo} alt="Decivio" className="w-6 h-6 rounded-md" />
              <span className="font-semibold text-sm">Decivio</span>
            </Link>
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" />
              Zurück
            </Link>
          </div>
        </header>

        <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Help Center</h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Anleitungen, FAQ und Tipps — damit du das Maximum aus Decivio herausholst.
            </p>
          </motion.div>

          {/* Search */}
          <div className="relative max-w-md mx-auto mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Suche in Anleitungen & FAQ…"
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-background border border-input text-sm focus:border-foreground focus:outline-none focus:ring-1 focus:ring-ring/20 transition-colors"
            />
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-1.5 mb-8 justify-center">
            {(search ? filtered : categories).map(cat => {
              const Icon = cat.icon;
              const isActive = cat.id === (activeCat?.id || activeCategory);
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    isActive ? "bg-foreground text-background" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          {activeCat && (
            <motion.div key={activeCat.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              {activeCat.guides.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Schritt-für-Schritt Anleitungen
                  </h2>
                  <div className="space-y-2">
                    {activeCat.guides.map((g, i) => <GuideCard key={i} guide={g} />)}
                  </div>
                </section>
              )}

              {activeCat.faqs.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    Häufige Fragen
                  </h2>
                  <div className="space-y-2">
                    {activeCat.faqs.map((f, i) => <FaqAccordion key={i} item={f} />)}
                  </div>
                </section>
              )}
            </motion.div>
          )}

          {filtered.length === 0 && search && (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">Keine Ergebnisse für „{search}"</p>
              <p className="text-xs text-muted-foreground mt-1">
                Brauchst du Hilfe? <Link to="/contact" className="text-primary hover:underline">Kontaktiere uns</Link>
              </p>
            </div>
          )}

          {/* CTA */}
          <div className="mt-12 text-center border-t border-border/40 pt-8">
            <p className="text-sm text-muted-foreground mb-3">Frage nicht beantwortet?</p>
            <Link to="/contact" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              <MessageSquare className="w-4 h-4" />
              Support kontaktieren
            </Link>
          </div>
        </main>
      </div>
    </>
  );
};

export default HelpCenter;
