import { Link } from "react-router-dom";
import decivioLogo from "@/assets/decivio-logo.png";

const Footer = () => (
  <footer className="border-t border-border/20 py-12">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-3">
            <img src={decivioLogo} alt="Decivio" className="w-5 h-5 rounded" />
            <span className="font-semibold text-sm tracking-tight">Decivio</span>
          </Link>
          <p className="text-[11px] text-muted-foreground/35 leading-relaxed max-w-[180px]">
            Decision Governance für Teams mit Anspruch.
          </p>
        </div>

        {[
          { title: "Produkt", links: [
            { label: "Funktionen", href: "#features" },
            { label: "Use Cases", href: "#use-cases" },
            { label: "Templates", href: "#" },
            { label: "Preise", href: "#pricing" },
          ]},
          { title: "Unternehmen", links: [
            { label: "Über uns", href: "#" },
            { label: "Blog", href: "#" },
            { label: "Karriere", href: "#" },
            { label: "Kontakt", href: "#" },
          ]},
        ].map(col => (
          <div key={col.title}>
            <h4 className="text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground/25 mb-3">{col.title}</h4>
            <ul className="space-y-2">
              {col.links.map(link => (
                <li key={link.label}>
                  <a href={link.href} className="text-xs text-muted-foreground/40 hover:text-foreground transition-colors">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h4 className="text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground/25 mb-3">Rechtliches</h4>
          <ul className="space-y-2">
            <li><Link to="/privacy" className="text-xs text-muted-foreground/40 hover:text-foreground transition-colors">Datenschutz</Link></li>
            <li><Link to="/terms" className="text-xs text-muted-foreground/40 hover:text-foreground transition-colors">AGB</Link></li>
            <li><Link to="/imprint" className="text-xs text-muted-foreground/40 hover:text-foreground transition-colors">Impressum</Link></li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between pt-6 border-t border-border/10">
        <p className="text-[10px] text-muted-foreground/25">
          © 2026 Decivio. Alle Rechte vorbehalten.
        </p>
        <div className="flex items-center gap-5 mt-3 md:mt-0">
          {["LinkedIn", "Twitter"].map(social => (
            <a key={social} href="#" className="text-[10px] text-muted-foreground/25 hover:text-foreground transition-colors">
              {social}
            </a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
