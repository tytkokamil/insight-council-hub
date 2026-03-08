import { Link } from "react-router-dom";

const footerLinks = {
  produkt: [
    { label: "Features", href: "#solution" },
    { label: "Branchen", href: "#branchen" },
    { label: "Preise", href: "#preise" },
    { label: "Demo", href: "#showcase" },
    { label: "Help Center", to: "/docs" },
    { label: "Changelog", to: "/changelog" },
    { label: "Roadmap", to: "/roadmap" },
    { label: "Founding Program", to: "/founding" },
  ],
  unternehmen: [
    { label: "Über Decivio", to: "/about" },
    { label: "Kontakt", to: "/contact" },
    { label: "Impressum", to: "/imprint" },
    { label: "Datenschutz", to: "/privacy" },
    { label: "AGB", to: "/terms" },
  ],
  compliance: [
    { label: "AVV", to: "/dpa" },
    { label: "KI-Datenrichtlinie", to: "/ai-data-policy" },
    { label: "Sub-Processors", to: "/sub-processors" },
    { label: "DSGVO", href: "#" },
    { label: "ISO 27001", href: "#" },
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
  const cls = "text-[13px] hover:text-white transition-colors duration-200";
  const style = { color: "#64748B" };
  if (item.to) return <Link to={item.to} className={cls} style={style}>{item.label}</Link>;
  return <a href={item.href} className={cls} style={style}>{item.label}</a>;
};

const Footer = () => (
  <footer className="py-16" style={{ background: "#030810", borderTop: "1px solid #1E293B" }}>
    <div className="max-w-6xl mx-auto px-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="text-xl font-semibold block mb-3" style={{ fontFamily: "'DM Serif Display', serif", color: "#FFFFFF" }}>
            Decivio
          </Link>
          <p className="text-[13px] leading-relaxed mb-4" style={{ color: "#64748B" }}>
            Decision Governance Platform für den Mittelstand.
          </p>
          <a href="mailto:hallo@decivio.com" className="text-[13px] hover:text-white transition-colors" style={{ color: "#64748B" }}>
            hallo@decivio.com
          </a>
        </div>

        {(["produkt", "unternehmen", "compliance", "vergleiche"] as const).map(section => (
          <nav key={section} aria-label={section}>
            <h4 className="text-[10px] font-semibold tracking-[0.15em] uppercase mb-4" style={{ color: "#94A3B8" }}>
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </h4>
            <ul className="space-y-2.5">
              {footerLinks[section].map(l => <li key={l.label}><FooterLink item={l} /></li>)}
            </ul>
          </nav>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between pt-6 gap-3" style={{ borderTop: "1px solid #1E293B" }}>
        <p className="text-[11px]" style={{ color: "#475569" }}>© 2026 Decivio GmbH · Made with precision in Germany 🇩🇪</p>
        <p className="text-[11px]" style={{ color: "#475569" }}>hallo@decivio.com</p>
      </div>
    </div>
  </footer>
);

export default Footer;
