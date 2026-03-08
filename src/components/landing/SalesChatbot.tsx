import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";

const quickReplies = [
  { label: "Was kostet Decivio?", action: "scroll", target: "#preise" },
  { label: "Ist Decivio DSGVO-konform?", action: "scroll", target: "#faq" },
  { label: "Demo buchen", action: "mail" },
  { label: "Für welche Branchen geeignet?", action: "scroll", target: "#branchen" },
];

const SalesChatbot = () => {
  const [open, setOpen] = useState(false);

  const handleQuickReply = (reply: typeof quickReplies[0]) => {
    if (reply.action === "mail") {
      window.open("mailto:hallo@decivio.com?subject=Demo-Anfrage", "_blank");
    } else if (reply.target) {
      document.querySelector(reply.target)?.scrollIntoView({ behavior: "smooth" });
      setOpen(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="mb-4 rounded-xl p-5 w-[300px] shadow-2xl"
            style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold" style={{ color: "#0F172A" }}>Decivio-Assistent</span>
              <button onClick={() => setOpen(false)} aria-label="Schließen"><X className="w-4 h-4" style={{ color: "#94A3B8" }} /></button>
            </div>
            <p className="text-sm mb-4" style={{ color: "#64748B" }}>
              Hallo! Ich bin der Decivio-Assistent. Womit kann ich helfen?
            </p>
            <div className="space-y-2">
              {quickReplies.map((qr, i) => (
                <button key={i} onClick={() => handleQuickReply(qr)}
                  className="w-full text-left text-xs py-2 px-3 rounded-lg transition-colors hover:bg-gray-50"
                  style={{ border: "1px solid #E2E8F0", color: "#0F172A" }}>
                  {qr.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
        style={{ background: "#EF4444" }}
        aria-label="Chat öffnen">
        {open ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
      </button>
    </div>
  );
};

export default SalesChatbot;
