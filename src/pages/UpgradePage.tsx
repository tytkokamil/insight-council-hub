import { useFreemiumLimits } from "@/hooks/useFreemiumLimits";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Check, Crown, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

interface PlanCardProps {
  name: string;
  price: string;
  period?: string;
  features: string[];
  isCurrent: boolean;
  isPopular?: boolean;
  onSelect: () => void;
}

const PlanCard = ({ name, price, period = "/Monat", features, isCurrent, isPopular, onSelect }: PlanCardProps) => (
  <div
    className={cn(
      "relative rounded-xl border p-6 flex flex-col gap-4 transition-all",
      isPopular ? "border-primary shadow-lg shadow-primary/5 scale-[1.02]" : "border-border",
      isCurrent && "ring-2 ring-primary/30"
    )}
  >
    {isPopular && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
        <span className="bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full">
          Beliebtester Plan
        </span>
      </div>
    )}

    {isCurrent && (
      <div className="absolute -top-3 right-4">
        <span className="bg-success/10 text-success text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full border border-success/20">
          Aktueller Plan
        </span>
      </div>
    )}

    <div>
      <h3 className="text-lg font-semibold">{name}</h3>
      <div className="flex items-baseline gap-1 mt-2">
        <span className="text-3xl font-bold tracking-tight">{price}</span>
        {price !== "Kostenlos" && price !== "Individuell" && (
          <span className="text-sm text-muted-foreground">{period}</span>
        )}
      </div>
    </div>

    <ul className="space-y-2.5 flex-1">
      {features.map((f, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
          <span className="text-muted-foreground">{f}</span>
        </li>
      ))}
    </ul>

    <Button
      variant={isCurrent ? "outline" : isPopular ? "default" : "outline"}
      className="w-full gap-2"
      disabled={isCurrent}
      onClick={onSelect}
    >
      {isCurrent ? (
        "Aktueller Plan"
      ) : (
        <>
          <Sparkles className="w-4 h-4" />
          Upgraden
        </>
      )}
    </Button>
  </div>
);

const PLANS = [
  {
    key: "free",
    name: "Free",
    price: "Kostenlos",
    features: [
      "10 Entscheidungen",
      "1 Nutzer",
      "30 Tage Audit Trail",
      "Basis-Templates",
      "Community Support",
    ],
  },
  {
    key: "starter",
    name: "Starter",
    price: "€49",
    popular: false,
    features: [
      "Unbegrenzte Entscheidungen",
      "Bis zu 8 Nutzer",
      "3 Teams",
      "1 Jahr Audit Trail",
      "SLA-Management",
      "5 Automationsregeln",
      "1 Compliance-Framework",
      "E-Mail Support",
    ],
  },
  {
    key: "professional",
    name: "Professional",
    price: "€149",
    popular: true,
    features: [
      "Alles aus Starter",
      "Bis zu 25 Nutzer",
      "Unbegrenzte Teams",
      "KI Daily Brief & Copilot",
      "Analytics Hub (9 Module)",
      "Executive Dashboard",
      "Unbegrenzter Audit Trail",
      "Kryptographische Sicherung",
      "Webhooks & Integrationen",
      "Prioritäts-Support",
    ],
  },
];

const UpgradePage = () => {
  const { plan } = useFreemiumLimits();
  const navigate = useNavigate();

  const handleSelect = (planKey: string) => {
    // Navigate to landing page pricing for now (Stripe integration later)
    navigate("/#pricing");
  };

  return (
    <AppLayout>
      <Helmet>
        <title>Upgrade — Decivio</title>
      </Helmet>

      <PageHeader
        title="Plan wählen"
        subtitle="Wähle den passenden Plan für dein Team"
        role="system"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 max-w-4xl">
        {PLANS.map((p) => (
          <PlanCard
            key={p.key}
            name={p.name}
            price={p.price}
            features={p.features}
            isCurrent={plan === p.key}
            isPopular={p.popular}
            onSelect={() => handleSelect(p.key)}
          />
        ))}
      </div>

      <div className="mt-8 text-center max-w-4xl">
        <p className="text-sm text-muted-foreground mb-2">
          Brauchst du mehr? Enterprise-Plan ab €499/Monat mit SSO, Custom Branding & On-Premise.
        </p>
        <Button variant="ghost" size="sm" className="gap-1 text-primary" onClick={() => navigate("/contact")}>
          Enterprise anfragen <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
    </AppLayout>
  );
};

export default UpgradePage;
