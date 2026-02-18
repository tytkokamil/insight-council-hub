import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border/40 py-16">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display font-bold tracking-tight">DecisionOS</span>
          </Link>
          <p className="text-sm text-muted-foreground/70 leading-relaxed max-w-[200px]">
            Enterprise Decision Management für Teams, die Transparenz fordern.
          </p>
        </div>

        {[
          { title: "Produkt", links: ["Funktionen", "Templates", "Integrationen", "Preise"] },
          { title: "Unternehmen", links: ["Über uns", "Blog", "Karriere", "Kontakt"] },
          { title: "Rechtliches", links: ["Datenschutz", "AGB", "Sicherheit", "DSGVO"] },
        ].map(section => (
          <div key={section.title}>
            <h4 className="text-xs font-medium tracking-widest uppercase text-muted-foreground/50 mb-4">{section.title}</h4>
            <ul className="space-y-2.5">
              {section.links.map(link => (
                <li key={link}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border/30">
        <p className="text-xs text-muted-foreground/50">
          © 2025 DecisionOS. Alle Rechte vorbehalten.
        </p>
        <div className="flex items-center gap-6 mt-4 md:mt-0">
          {["Twitter", "LinkedIn", "GitHub"].map(social => (
            <a key={social} href="#" className="text-xs text-muted-foreground/50 hover:text-foreground transition-colors duration-200">
              {social}
            </a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
