import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border/50 py-16 relative">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-14">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4.5 h-4.5 text-primary" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight">DecisionOS</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Enterprise Decision Management for teams that demand transparency.
            </p>
          </div>

          {[
            { title: "Product", links: ["Features", "Templates", "Integrations", "Pricing"] },
            { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
            { title: "Legal", links: ["Privacy", "Terms", "Security", "GDPR"] },
          ].map(section => (
            <div key={section.title}>
              <h4 className="font-semibold text-sm mb-4">{section.title}</h4>
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

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border/40">
          <p className="text-sm text-muted-foreground">
            © 2025 DecisionOS. All rights reserved.
          </p>
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            {["Twitter", "LinkedIn", "GitHub"].map(social => (
              <a key={social} href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
