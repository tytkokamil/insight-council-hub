import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Send, CheckCircle2, Loader2, ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import decivioLogo from "@/assets/decivio-logo.png";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError("Bitte fülle alle Felder aus.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Bitte gib eine gültige E-Mail-Adresse ein.");
      return;
    }
    if (message.length > 5000) {
      setError("Nachricht darf maximal 5.000 Zeichen lang sein.");
      return;
    }

    setSending(true);
    const { error: dbError } = await supabase.from("support_requests").insert({
      name: name.trim().slice(0, 100),
      email: email.trim().slice(0, 255),
      subject: subject.trim().slice(0, 200),
      message: message.trim().slice(0, 5000),
    });

    if (dbError) {
      setError("Nachricht konnte nicht gesendet werden. Bitte versuche es erneut.");
      setSending(false);
      return;
    }

    setSent(true);
    setSending(false);
  };

  const inputClass =
    "w-full h-10 px-3 rounded-md bg-background border border-input text-sm focus:border-foreground focus:outline-none focus:ring-1 focus:ring-ring/20 transition-colors";

  return (
    <>
      <Helmet>
        <title>Kontakt — Decivio Support</title>
        <meta name="description" content="Kontaktiere das Decivio Support-Team. Wir helfen dir bei Fragen zu Features, Account oder Technik." />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="border-b border-border/40 py-4 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
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

        {/* Form */}
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg"
          >
            {sent ? (
              <div className="text-center space-y-4 py-12">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-xl font-bold">Nachricht gesendet</h1>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Danke für deine Nachricht. Wir melden uns innerhalb von 24 Stunden bei dir.
                </p>
                <Link to="/">
                  <Button variant="outline" size="sm" className="mt-4 gap-1.5">
                    <ArrowLeft className="w-3 h-3" />
                    Zurück zur Startseite
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <h1 className="text-xl font-bold">Kontakt & Support</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Fragen, Feedback oder technische Probleme? Wir helfen gerne.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name</label>
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Max Mustermann" maxLength={100} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">E-Mail</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="max@firma.de" maxLength={255} />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Betreff</label>
                    <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} placeholder="z.B. Frage zu Feature X" maxLength={200} />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nachricht</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      maxLength={5000}
                      placeholder="Beschreibe dein Anliegen…"
                      className="w-full px-3 py-2 rounded-md bg-background border border-input text-sm focus:border-foreground focus:outline-none focus:ring-1 focus:ring-ring/20 transition-colors resize-none"
                    />
                    <p className="text-[10px] text-muted-foreground text-right mt-0.5">{message.length}/5000</p>
                  </div>

                  {error && <p className="text-xs text-destructive">{error}</p>}

                  <Button type="submit" disabled={sending} className="w-full gap-2">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {sending ? "Wird gesendet…" : "Nachricht senden"}
                  </Button>

                  <p className="text-[11px] text-muted-foreground text-center">
                    Alternativ erreichst du uns unter{" "}
                    <a href="mailto:hallo@decivio.com" className="text-primary hover:underline">hallo@decivio.com</a>
                  </p>
                </form>
              </>
            )}
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default Contact;
