import { Link } from "react-router-dom";
import decivioLogo from "@/assets/decivio-logo.png";

const Footer = () => (
  <footer className="border-t border-border/40 py-16" style={{ background: 'hsl(220 20% 97%)' }}>
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-14">
        {/* Logo */}
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <img src={decivioLogo} alt="Decivio" className="w-6 h-6 rounded-md" />
            <span className="font-semibold text-sm">Decivio</span>
          </Link>
          <p className="text-[12px] text-muted-foreground/60 leading-relaxed max-w-[200px]">
            Decision Governance Platform für den Mittelstand.
          </p>
        </div>

        {/* Product */}
        <div>
          <h4 className="text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground/40 mb-4">Produkt</h4>
          <ul className="space-y-2.5">
            {[
              { label: "Features", href: "#solution" },
              { label: "Branchen", href: "#industries" },
              { label: "Preise", href: "#pricing" },
              { label: "Help Center", to: "/docs" },
              { label: "Changelog", to: "/changelog" },
            ].map(l => (
              <li key={l.label}>
                {'to' in l && l.to
                  ? <Link to={l.to} className="text-[13px] text-muted-foreground/60 hover:text-foreground transition-colors">{l.label}</Link>
                  : <a href={l.href} className="text-[13px] text-muted-foreground/60 hover:text-foreground transition-colors">{l.label}</a>
                }
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground/40 mb-4">Unternehmen</h4>
          <ul className="space-y-2.5">
            <li><Link to="/privacy" className="text-[13px] text-muted-foreground/60 hover:text-foreground transition-colors">Datenschutz</Link></li>
            <li><Link to="/imprint" className="text-[13px] text-muted-foreground/60 hover:text-foreground transition-colors">Impressum</Link></li>
            <li><Link to="/terms" className="text-[13px] text-muted-foreground/60 hover:text-foreground transition-colors">AGB</Link></li>
            <li><Link to="/avv" className="text-[13px] text-muted-foreground/60 hover:text-foreground transition-colors">AVV</Link></li>
            <li><Link to="/contact" className="text-[13px] text-muted-foreground/60 hover:text-foreground transition-colors">Kontakt & Support</Link></li>
          </ul>
        </div>

        {/* Compliance */}
        <div>
          <h4 className="text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground/40 mb-4">Compliance</h4>
          <ul className="space-y-2.5">
            <li><Link to="/ai-policy" className="text-[13px] text-muted-foreground/60 hover:text-foreground transition-colors">KI-Richtlinie</Link></li>
            <li><a href="#compliance" className="text-[13px] text-muted-foreground/60 hover:text-foreground transition-colors">Frameworks</a></li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between pt-6 border-t border-border/30">
        <p className="text-[11px] text-muted-foreground/40">© 2026 Decivio · Made in Germany</p>
        <div className="flex items-center gap-6">
          <Link to="/privacy" className="text-[11px] text-muted-foreground/40 hover:text-foreground transition-colors">Datenschutz</Link>
          <Link to="/imprint" className="text-[11px] text-muted-foreground/40 hover:text-foreground transition-colors">Impressum</Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
