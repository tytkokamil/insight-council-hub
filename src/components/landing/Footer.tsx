import { Link } from "react-router-dom";
import decivioLogo from "@/assets/decivio-logo.png";

const Footer = () => (
  <footer className="border-t border-border/30 py-16">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <img src={decivioLogo} alt="Decivio" className="w-6 h-6 rounded-md" />
            <span className="font-semibold text-[15px] tracking-tight">Decivio</span>
          </Link>
          <p className="text-xs text-muted-foreground/40 leading-relaxed max-w-[200px]">
            Decision Governance für Teams mit Anspruch.
          </p>
        </div>

        {[
          { title: "Produkt", links: ["Funktionen", "Templates", "Integrationen", "Preise"] },
          { title: "Unternehmen", links: ["Über uns", "Blog", "Karriere", "Kontakt"] },
        ].map(col => (
          <div key={col.title}>
            <h4 className="text-[11px] font-medium tracking-[0.15em] uppercase text-muted-foreground/30 mb-4">{col.title}</h4>
            <ul className="space-y-2.5">
              {col.links.map(link => (
                <li key={link}>
                  <a href="#" className="text-sm text-muted-foreground/50 hover:text-foreground transition-colors duration-200">{link}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h4 className="text-[11px] font-medium tracking-[0.15em] uppercase text-muted-foreground/30 mb-4">Rechtliches</h4>
          <ul className="space-y-2.5">
            <li><Link to="/privacy" className="text-sm text-muted-foreground/50 hover:text-foreground transition-colors duration-200">Datenschutz</Link></li>
            <li><Link to="/terms" className="text-sm text-muted-foreground/50 hover:text-foreground transition-colors duration-200">AGB</Link></li>
            <li><Link to="/imprint" className="text-sm text-muted-foreground/50 hover:text-foreground transition-colors duration-200">Impressum</Link></li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border/20">
        <p className="text-[11px] text-muted-foreground/30">
          © 2026 Decivio. Alle Rechte vorbehalten.
        </p>
        <div className="flex items-center gap-6 mt-4 md:mt-0">
          {["Twitter", "LinkedIn", "GitHub"].map(social => (
            <a key={social} href="#" className="text-[11px] text-muted-foreground/30 hover:text-foreground transition-colors duration-200">
              {social}
            </a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
