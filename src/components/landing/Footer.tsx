import { Link } from "react-router-dom";
import decivioLogo from "@/assets/decivio-logo.png";

const Footer = () => (
  <footer className="border-t border-border py-16">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-4 group">
            <img src={decivioLogo} alt="Decivio" className="w-7 h-7 rounded-md" />
            <span className="font-bold tracking-tight">Decivio</span>
          </Link>
          <p className="text-sm text-muted-foreground/70 leading-relaxed max-w-[220px]">
            Enterprise Decision Management für Teams, die Transparenz und Geschwindigkeit fordern.
          </p>
        </div>

        {[
          { title: "Produkt", links: ["Funktionen", "Templates", "Integrationen", "Preise"], color: "text-accent-blue" },
          { title: "Unternehmen", links: ["Über uns", "Blog", "Karriere", "Kontakt"], color: "text-accent-violet" },
          { title: "Rechtliches", links: ["Datenschutz", "AGB", "Sicherheit", "DSGVO"], color: "text-accent-teal" },
        ].map(section => (
          <div key={section.title}>
            <h4 className={`text-xs font-medium tracking-[0.15em] uppercase ${section.color}/50 mb-4`}>{section.title}</h4>
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
          © 2026 Decivio. Alle Rechte vorbehalten.
        </p>
        <div className="flex items-center gap-6 mt-4 md:mt-0">
          {[
            { name: "Twitter", hoverColor: "hover:text-accent-blue" },
            { name: "LinkedIn", hoverColor: "hover:text-accent-blue" },
            { name: "GitHub", hoverColor: "hover:text-foreground" },
          ].map(social => (
            <a key={social.name} href="#" className={`text-xs text-muted-foreground/50 ${social.hoverColor} transition-colors duration-200`}>
              {social.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
