import { Link } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import decivioLogo from "@/assets/decivio-logo.png";

const Footer = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <footer className="border-t border-border/30 py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={decivioLogo} alt="Decivio" className="w-6 h-6 rounded-md" />
              <span className="font-semibold text-[15px] tracking-tight">Decivio</span>
            </Link>
            <p className="text-xs text-muted-foreground/40 leading-relaxed max-w-[200px]">{t("landing.footer.tagline")}</p>
          </div>

          <div>
            <h4 className="text-[11px] font-medium tracking-[0.15em] uppercase text-muted-foreground/30 mb-4">{t("landing.footer.productHeader")}</h4>
            <ul className="space-y-2.5">
              {[
                { label: t("landing.footer.features"), href: "#features" },
                { label: t("landing.footer.pricing"), href: "#pricing" },
                { label: t("landing.footer.useCases"), href: "#use-cases" },
                { label: t("landing.footer.templates"), href: "#" },
              ].map(l => (
                <li key={l.label}><a href={l.href} className="text-sm text-muted-foreground/50 hover:text-foreground transition-colors duration-200">{l.label}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-medium tracking-[0.15em] uppercase text-muted-foreground/30 mb-4">{t("landing.footer.industriesHeader")}</h4>
            <ul className="space-y-2.5">
              {[
                { label: t("landing.footer.finance"), href: "#use-cases" },
                { label: t("landing.footer.pharma"), href: "#use-cases" },
                { label: t("landing.footer.scaleups"), href: "#use-cases" },
                { label: t("landing.footer.publicSector"), href: "#use-cases" },
              ].map(l => (
                <li key={l.label}><a href={l.href} className="text-sm text-muted-foreground/50 hover:text-foreground transition-colors duration-200">{l.label}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-medium tracking-[0.15em] uppercase text-muted-foreground/30 mb-4">{t("landing.footer.legalHeader")}</h4>
            <ul className="space-y-2.5">
              <li><Link to="/privacy" className="text-sm text-muted-foreground/50 hover:text-foreground transition-colors duration-200">{t("landing.footer.privacy")}</Link></li>
              <li><Link to="/terms" className="text-sm text-muted-foreground/50 hover:text-foreground transition-colors duration-200">{t("landing.footer.terms")}</Link></li>
              <li><Link to="/imprint" className="text-sm text-muted-foreground/50 hover:text-foreground transition-colors duration-200">{t("landing.footer.imprint")}</Link></li>
              <li><Link to="/avv" className="text-sm text-muted-foreground/50 hover:text-foreground transition-colors duration-200">AVV</Link></li>
              <li><Link to="/ai-policy" className="text-sm text-muted-foreground/50 hover:text-foreground transition-colors duration-200">KI-Richtlinie</Link></li>
              <li><Link to="/sub-processors" className="text-sm text-muted-foreground/50 hover:text-foreground transition-colors duration-200">Sub-Processors</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-medium tracking-[0.15em] uppercase text-muted-foreground/30 mb-4">{t("landing.footer.newsletterHeader")}</h4>
            {submitted ? (
              <p className="text-sm text-accent-teal">{t("landing.footer.subscribed")}</p>
            ) : (
              <form onSubmit={handleNewsletter} className="space-y-2">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("landing.footer.emailPlaceholder")} className="w-full px-3 py-1.5 text-sm rounded-md border border-border/40 bg-background text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30" required />
                <button type="submit" className="w-full px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">{t("landing.footer.subscribe")}</button>
              </form>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border/20">
          <p className="text-[11px] text-muted-foreground/30">{t("landing.footer.copyright", { year: new Date().getFullYear() })}</p>
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            {[
              { label: "LinkedIn", href: "https://linkedin.com/company/decivio" },
              { label: "Twitter", href: "https://twitter.com/decivio" },
            ].map(social => (
              <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" className="text-[11px] text-muted-foreground/30 hover:text-foreground transition-colors duration-200">{social.label}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
