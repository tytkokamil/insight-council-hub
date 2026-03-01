import { Link } from "react-router-dom";
import decivioLogo from "@/assets/decivio-logo.png";

const Footer = () => (
  <footer className="border-t border-white/[0.06] py-16">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
        {/* Logo */}
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <img src={decivioLogo} alt="Decivio" className="w-6 h-6 rounded-md" />
            <span className="font-semibold text-[15px] text-white">Decivio</span>
          </Link>
          <p className="text-xs text-[hsl(215,16%,47%)] leading-relaxed max-w-[220px]">
            Decision Governance Platform für den Mittelstand. Made in Germany.
          </p>
        </div>

        {/* Product */}
        <div>
          <h4 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[hsl(215,16%,47%)]/60 mb-4">Produkt</h4>
          <ul className="space-y-2.5">
            {[
              { label: "Features", href: "#solution" },
              { label: "Branchen", href: "#industries" },
              { label: "Compliance", href: "#compliance" },
              { label: "Preise", href: "#pricing" },
            ].map(l => (
              <li key={l.label}><a href={l.href} className="text-sm text-[hsl(215,16%,47%)] hover:text-white transition-colors">{l.label}</a></li>
            ))}
            <li><Link to="/changelog" className="text-sm text-[hsl(215,16%,47%)] hover:text-white transition-colors">Changelog</Link></li>
          </ul>
        </div>

        {/* Industries */}
        <div>
          <h4 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[hsl(215,16%,47%)]/60 mb-4">Branchen</h4>
          <ul className="space-y-2.5">
            {["Maschinenbau", "Pharma", "Automotive", "Finanzdienstleister", "IT & Software"].map(l => (
              <li key={l}><a href="#industries" className="text-sm text-[hsl(215,16%,47%)] hover:text-white transition-colors">{l}</a></li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[hsl(215,16%,47%)]/60 mb-4">Unternehmen</h4>
          <ul className="space-y-2.5">
            <li><Link to="/privacy" className="text-sm text-[hsl(215,16%,47%)] hover:text-white transition-colors">Datenschutz</Link></li>
            <li><Link to="/imprint" className="text-sm text-[hsl(215,16%,47%)] hover:text-white transition-colors">Impressum</Link></li>
            <li><Link to="/terms" className="text-sm text-[hsl(215,16%,47%)] hover:text-white transition-colors">AGB</Link></li>
            <li><Link to="/avv" className="text-sm text-[hsl(215,16%,47%)] hover:text-white transition-colors">AVV</Link></li>
            <li><Link to="/ai-policy" className="text-sm text-[hsl(215,16%,47%)] hover:text-white transition-colors">KI-Richtlinie</Link></li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/[0.06]">
        <p className="text-[11px] text-[hsl(215,16%,47%)]/60">© 2026 Decivio · Made in Germany 🇩🇪</p>
        <div className="flex items-center gap-6 mt-4 md:mt-0">
          <Link to="/privacy" className="text-[11px] text-[hsl(215,16%,47%)]/60 hover:text-white transition-colors">Datenschutz</Link>
          <Link to="/imprint" className="text-[11px] text-[hsl(215,16%,47%)]/60 hover:text-white transition-colors">Impressum</Link>
          <Link to="/terms" className="text-[11px] text-[hsl(215,16%,47%)]/60 hover:text-white transition-colors">AGB</Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
