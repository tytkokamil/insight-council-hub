import { Link } from "react-router-dom";
import { useState } from "react";
import decivioLogo from "@/assets/decivio-logo.png";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <footer className="border-t border-border/30 py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={decivioLogo} alt="Decivio" className="w-6 h-6 rounded-md" />
              <span className="font-semibold text-[15px] tracking-tight">Decivio</span>
            </Link>
            <p className="text-xs text-muted-foreground/40 leading-relaxed max-w-[200px]">
              Decision Governance Platform — Entscheidungen sichtbar, messbar, lösbar.
            </p>
          </div>

          <div>
            <h4 className="text-[11px] font-medium tracking-[0.15em] uppercase text-muted-foreground/30 mb-4">Produkt</h4>
            <ul className="space-y-2.5">
              {[
                { label: "Funktionen", href: "#features" },
                { label: "Preise", href: "#pricing" },
                { label: "Use Cases", href: "#use-cases" },
                { label: "Templates", href: "#" },
              ].map(l => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm text-muted-foreground/50 hover:text-foreground transition-colors duration-200">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-medium tracking-[0.15em] uppercase text-muted-foreground/30 mb-4">Branchen</h4>
            <ul className="space-y-2.5">
              {[
                { label: "Finanzdienstleister", href: "#use-cases" },
                { label: "Pharma & Life Sciences", href: "#use-cases" },
                { label: "Scale-Ups & Tech", href: "#use-cases" },
                { label: "Public Sector", href: "#use-cases" },
              ].map(l => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm text-muted-foreground/50 hover:text-foreground transition-colors duration-200">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-medium tracking-[0.15em] uppercase text-muted-foreground/30 mb-4">Rechtliches</h4>
            <ul className="space-y-2.5">
              <li><Link to="/privacy" className="text-sm text-muted-foreground/50 hover:text-foreground transition-colors duration-200">Datenschutz</Link></li>
              <li><Link to="/terms" className="text-sm text-muted-foreground/50 hover:text-foreground transition-colors duration-200">AGB</Link></li>
              <li><Link to="/imprint" className="text-sm text-muted-foreground/50 hover:text-foreground transition-colors duration-200">Impressum</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-medium tracking-[0.15em] uppercase text-muted-foreground/30 mb-4">Newsletter</h4>
            {submitted ? (
              <p className="text-sm text-accent-teal">✓ Angemeldet!</p>
            ) : (
              <form onSubmit={handleNewsletter} className="space-y-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-Mail Adresse"
                  className="w-full px-3 py-1.5 text-sm rounded-md border border-border/40 bg-background text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  required
                />
                <button
                  type="submit"
                  className="w-full px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Abonnieren
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border/20">
          <p className="text-[11px] text-muted-foreground/30">
            © {new Date().getFullYear()} Decivio GmbH. Alle Rechte vorbehalten. EU-Hosting (Frankfurt).
          </p>
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            {[
              { label: "LinkedIn", href: "https://linkedin.com/company/decivio" },
              { label: "Twitter", href: "https://twitter.com/decivio" },
            ].map(social => (
              <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" className="text-[11px] text-muted-foreground/30 hover:text-foreground transition-colors duration-200">
                {social.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
