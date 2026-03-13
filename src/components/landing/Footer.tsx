import { Link } from "react-router-dom";
import { ArrowRight, Mail } from "lucide-react";
import decivioLogo from "@/assets/decivio-logo.png";

const footerLinks = {
  produkt: [
    { label: "Features", href: "#solution" },
    { label: "Branchen", href: "#branchen" },
    { label: "Preise", href: "#preise" },
    { label: "Demo", to: "/demo" },
    { label: "Help Center", to: "/docs" },
    { label: "Changelog", to: "/changelog" },
    { label: "Roadmap", to: "/roadmap" },
    { label: "Founding Program", to: "/founding" },
  ],
  unternehmen: [
    { label: "Kontakt", to: "/contact" },
    { label: "Impressum", to: "/imprint" },
    { label: "Datenschutz", to: "/privacy" },
    { label: "AGB", to: "/terms" },
  ],
  compliance: [
    { label: "AVV", to: "/dpa" },
    { label: "KI-Datenrichtlinie", to: "/ai-data-policy" },
    { label: "Sub-Processors", to: "/sub-processors" },
  ],
  vergleiche: [
    { label: "vs. Monday.com", to: "/vs/monday" },
    { label: "vs. Jira", to: "/vs/jira" },
    { label: "vs. Excel", to: "/vs/excel" },
    { label: "vs. SAP", to: "/vs/sap" },
    { label: "vs. Kissflow", to: "/vs/kissflow" },
  ],
};

const FooterLink = ({ item }: { item: { label: string; to?: string; href?: string } }) => {
  const className = "text-[13px] text-muted-foreground/60 hover:text-foreground transition-colors duration-300";
  if (item.to) return <Link to={item.to} className={className}>{item.label}</Link>;
  return <a href={item.href} className={className}>{item.label}</a>;
};

const Footer = () => (
  <footer className="relative border-t border-border/20 pt-20 pb-10" role="contentinfo">
    <div className="absolute inset-0 mesh-gradient opacity-10 pointer-events-none" />

    <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-16">
        <div className="col-span-2">
          <Link to="/" className="flex items-center gap-2.5 mb-4 group">
            <img src={decivioLogo} alt="Decivio Logo" className="w-7 h-7 rounded-md" width={28} height={28} loading="lazy" />
            <span className="font-semibold text-[15px] text-foreground tracking-tight">Decivio</span>
          </Link>
          <p className="text-[13px] text-muted-foreground/60 leading-relaxed max-w-[260px] mb-6">
            Decision Governance Platform für den Mittelstand. Machen Sie jede Entscheidung sichtbar, messbar und compliant.
          </p>
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground/50">
            <Mail className="w-3.5 h-3.5" />
            <a href="mailto:hallo@decivio.com" className="hover:text-foreground transition-colors duration-300">hallo@decivio.com</a>
          </div>
        </div>

        <nav aria-label="Produkt">
          <h4 className="text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground/40 mb-4">Produkt</h4>
          <ul className="space-y-2.5">
            {footerLinks.produkt.map(l => <li key={l.label}><FooterLink item={l} /></li>)}
          </ul>
        </nav>

        <nav aria-label="Unternehmen">
          <h4 className="text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground/40 mb-4">Unternehmen</h4>
          <ul className="space-y-2.5">
            {footerLinks.unternehmen.map(l => <li key={l.label}><FooterLink item={l} /></li>)}
          </ul>
        </nav>

        <nav aria-label="Compliance">
          <h4 className="text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground/40 mb-4">Compliance</h4>
          <ul className="space-y-2.5">
            {footerLinks.compliance.map(l => <li key={l.label}><FooterLink item={l} /></li>)}
          </ul>
          <div className="mt-6">
            <Link to="/auth" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:gap-2.5 transition-all">
              Kostenlos starten <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </nav>

        <nav aria-label="Vergleiche">
          <h4 className="text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground/40 mb-4">Vergleiche</h4>
          <ul className="space-y-2.5">
            {footerLinks.vergleiche.map(l => <li key={l.label}><FooterLink item={l} /></li>)}
          </ul>
        </nav>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-border/10 gap-3">
        <p className="text-[11px] text-muted-foreground/40">
          © {new Date().getFullYear()} Decivio · Made with precision in Germany 🇩🇪
        </p>
        <p className="text-[11px] text-muted-foreground/40">
          hallo@decivio.com
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
