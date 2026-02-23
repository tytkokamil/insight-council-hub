import { Link } from "react-router-dom";
import decivioLogo from "@/assets/decivio-logo.png";

const Footer = () => (
  <footer className="border-t border-border py-16">
    <div className="container mx-auto px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={decivioLogo} alt="Decivio" className="w-5 h-5 rounded" />
              <span className="font-semibold text-sm tracking-tight">Decivio</span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
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
              <h4 className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground/50 mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map(link => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground/50 mb-4">Rechtliches</h4>
            <ul className="space-y-2.5">
              <li><Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">Datenschutz</Link></li>
              <li><Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">AGB</Link></li>
              <li><Link to="/imprint" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">Impressum</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground/40">© 2026 Decivio. Alle Rechte vorbehalten.</p>
          <div className="flex items-center gap-6 mt-3 md:mt-0">
            {["LinkedIn", "Twitter"].map(s => (
              <a key={s} href="#" className="text-xs text-muted-foreground/40 hover:text-foreground transition-colors duration-200">{s}</a>
            ))}
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
