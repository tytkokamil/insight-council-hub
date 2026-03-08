import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Mail } from "lucide-react";
import decivioLogo from "@/assets/decivio-logo.png";

const ease = [0.16, 1, 0.3, 1] as const;

const footerLinks = {
  produkt: [
    { label: "Features", href: "#solution" },
    { label: "Branchen", href: "#industries" },
    { label: "Preise", href: "#pricing" },
    { label: "Help Center", to: "/docs" },
    { label: "Changelog", to: "/changelog" },
    { label: "Roadmap", to: "/roadmap" },
  ],
  unternehmen: [
    { label: "Datenschutz", to: "/privacy" },
    { label: "Impressum", to: "/imprint" },
    { label: "AGB", to: "/terms" },
    { label: "AVV", to: "/avv" },
    { label: "Kontakt", to: "/contact" },
  ],
  compliance: [
    { label: "KI-Richtlinie", to: "/ai-policy" },
    { label: "Frameworks", href: "#compliance" },
    { label: "Sub-Processors", to: "/sub-processors" },
  ],
  vergleiche: [
    { label: "Decivio vs. Monday", to: "/vs/monday" },
    { label: "Decivio vs. Jira", to: "/vs/jira" },
    { label: "Decivio vs. Excel", to: "/vs/excel" },
    { label: "Decivio vs. SAP", to: "/vs/sap" },
    { label: "Decivio vs. Kissflow", to: "/vs/kissflow" },
  ],
};

const FooterLink = ({ item }: { item: { label: string; to?: string; href?: string } }) => {
  const className = "text-[13px] text-muted-foreground/70 hover:text-foreground transition-colors duration-200";
  if (item.to) return <Link to={item.to} className={className}>{item.label}</Link>;
  return <a href={item.href} className={className}>{item.label}</a>;
};

const Footer = () => (
  <footer className="relative border-t border-border/30 pt-16 pb-8" role="contentinfo">
    {/* Subtle gradient bg */}
    <div className="absolute inset-0 bg-gradient-to-b from-muted/20 to-muted/40 pointer-events-none" />

    <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-16">
        {/* Brand column — spans 2 cols */}
        <div className="col-span-2">
          <Link to="/" className="flex items-center gap-2.5 mb-4 group">
            <img src={decivioLogo} alt="Decivio Logo" className="w-7 h-7 rounded-md" width={28} height={28} loading="lazy" />
            <span className="font-semibold text-[15px] text-foreground tracking-tight">Decivio</span>
          </Link>
          <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[260px] mb-6">
            Decision Governance Platform für den Mittelstand. Machen Sie jede Entscheidung sichtbar, messbar und compliant.
          </p>
          {/* Newsletter signup hint */}
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <Mail className="w-3.5 h-3.5" />
            <a href="mailto:info@decivio.com" className="hover:text-foreground transition-colors">info@decivio.com</a>
          </div>
        </div>

        {/* Produkt */}
        <nav aria-label="Produkt">
          <h4 className="text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-4">Produkt</h4>
          <ul className="space-y-2.5">
            {footerLinks.produkt.map(l => (
              <li key={l.label}><FooterLink item={l} /></li>
            ))}
          </ul>
        </nav>

        {/* Company */}
        <nav aria-label="Unternehmen">
          <h4 className="text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-4">Unternehmen</h4>
          <ul className="space-y-2.5">
            {footerLinks.unternehmen.map(l => (
              <li key={l.label}><FooterLink item={l} /></li>
            ))}
          </ul>
        </nav>

        {/* Compliance */}
        <nav aria-label="Compliance">
          <h4 className="text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-4">Compliance</h4>
          <ul className="space-y-2.5">
            {footerLinks.compliance.map(l => (
              <li key={l.label}><FooterLink item={l} /></li>
            ))}
          </ul>
          {/* CTA in footer */}
          <div className="mt-6">
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:gap-2.5 transition-all"
            >
              Kostenlos starten <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </nav>
      </div>

      {/* Bottom bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-border/20 gap-3">
        <p className="text-[11px] text-muted-foreground/60">
          © {new Date().getFullYear()} Decivio · Made with precision in Germany 🇩🇪
        </p>
        <div className="flex items-center gap-6">
          <Link to="/privacy" className="text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors">Datenschutz</Link>
          <Link to="/imprint" className="text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors">Impressum</Link>
          <Link to="/terms" className="text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors">AGB</Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
