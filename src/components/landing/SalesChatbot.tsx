import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";

/** Prompt 38 — AI Sales Chatbot (landing page widget) */

interface Message {
  role: "bot" | "user";
  text: string;
}

const FAQ: Record<string, string> = {
  "was ist decivio": "Decivio ist eine Decision Governance Platform, die alle offenen Entscheidungen sichtbar macht, Verzögerungskosten in Echtzeit berechnet und Compliance automatisch dokumentiert.",
  "preis": "Es gibt einen kostenlosen Plan (1 Nutzer, 10 Entscheidungen). Der Professional-Plan kostet €149/Monat für bis zu 25 Nutzer. Alle Pläne mit 14 Tagen kostenloser Testphase.",
  "kostenlos": "Ja! Der Free-Plan ist dauerhaft kostenlos. Sie können Decivio sofort unter /auth registrieren — keine Kreditkarte nötig.",
  "dsgvo": "Alle Daten werden auf ISO 27001-zertifizierten Servern in Deutschland gehostet. DSGVO-konform mit AVV in jedem Plan.",
  "branchen": "Decivio unterstützt 15 Branchen: Maschinenbau, Automotive, Pharma, Finanz, IT, Bau, Healthcare, Energie, Handel, Versicherung, Logistik, Lebensmittel, Non-Profit, Bildung und Öffentlicher Sektor.",
  "compliance": "Decivio unterstützt NIS2, ISO 9001, IATF 16949, GMP, MaRisk, DSGVO, VOB/VgV, Solvency II und den EU AI Act.",
  "ki": "Decivio nutzt KI für tägliche Briefings, Entscheidungsanalysen, CoPilot-Vorschläge, Anomalie-Erkennung und What-If-Simulationen.",
  "integration": "Webhooks, Microsoft Teams, E-Mail-Workflows (One-Click Approval), WhatsApp-Benachrichtigungen und eine REST API.",
  "demo": "Besuchen Sie /demo für eine interaktive Live-Demo oder schreiben Sie an hallo@decivio.com für einen persönlichen Termin.",
  "founding": "Als einer der ersten 20 Founding Customers erhalten Sie lebenslang −40% auf den Professional-Plan. Mehr unter /founding.",
};

function findAnswer(input: string): string {
  const lower = input.toLowerCase();
  for (const [key, answer] of Object.entries(FAQ)) {
    if (lower.includes(key)) return answer;
  }
  if (lower.includes("test") || lower.includes("start")) {
    return "Sie können Decivio 14 Tage kostenlos testen — keine Kreditkarte nötig. Registrieren Sie sich unter /auth.";
  }
  if (lower.includes("support") || lower.includes("hilf") || lower.includes("help")) {
    return "Unser Support-Team erreichen Sie unter hallo@decivio.com oder im Help Center unter /docs.";
  }
  return "Gute Frage! Für eine detaillierte Antwort empfehle ich unser Help Center (/docs) oder einen kurzen Call mit unserem Team: hallo@decivio.com";
}

const SalesChatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Hallo! 👋 Ich bin der Decivio-Assistent. Wie kann ich Ihnen helfen?" },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    // Simulate typing delay
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "bot", text: findAnswer(userMsg) }]);
    }, 600);
  };

  return (
    <>
      {/* Toggle button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
            style={{ background: "#EF4444" }}
            aria-label="Chat öffnen"
          >
            <MessageCircle className="w-6 h-6 text-white" />
            {/* Pulse */}
            <span className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: "#EF4444" }} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4" style={{ color: "#EF4444" }} />
                <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>Decivio Assistent</span>
                <span className="w-2 h-2 rounded-full bg-green-500" />
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-white/10 transition-colors">
                <X className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="h-[320px] overflow-y-auto px-4 py-3 space-y-3" style={{ scrollbarWidth: "thin" }}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}
                >
                  {msg.role === "bot" && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(239,68,68,0.15)" }}>
                      <Bot className="w-3 h-3" style={{ color: "#EF4444" }} />
                    </div>
                  )}
                  <div
                    className="max-w-[80%] px-3 py-2 rounded-xl text-[13px] leading-relaxed"
                    style={
                      msg.role === "bot"
                        ? { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.75)" }
                        : { background: "#EF4444", color: "white" }
                    }
                  >
                    {msg.text}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <User className="w-3 h-3" style={{ color: "rgba(255,255,255,0.5)" }} />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Input */}
            <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <form
                onSubmit={(e) => { e.preventDefault(); send(); }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Frage stellen…"
                  className="flex-1 h-9 px-3 rounded-lg text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
                  style={{ background: "#EF4444" }}
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </form>

              {/* Quick actions */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {["Was kostet Decivio?", "DSGVO?", "Demo buchen"].map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); setTimeout(send, 50); }}
                    className="px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors"
                    style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SalesChatbot;
