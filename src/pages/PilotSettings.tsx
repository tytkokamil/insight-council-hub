import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Shield, Beaker, BarChart3, Brain, Zap, Lock } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const categoryConfig: Record<string, { label: string; icon: React.ElementType; description: string }> = {
  core: { label: "Kern-Module", icon: Shield, description: "Essenzielle Funktionen für den täglichen Betrieb" },
  analysis: { label: "Analyse-Module", icon: BarChart3, description: "Erweiterte Analysen und Visualisierungen" },
  intelligence: { label: "Intelligence-Module", icon: Brain, description: "KI-gestützte Insights und Prognosen" },
  admin: { label: "Administration", icon: Zap, description: "Verwaltung und Governance" },
};

const PilotSettings = () => {
  const { flags, loading, toggleFlag } = useFeatureFlags();

  const grouped = flags.reduce<Record<string, typeof flags>>((acc, flag) => {
    if (!acc[flag.category]) acc[flag.category] = [];
    acc[flag.category].push(flag);
    return acc;
  }, {});

  const enabledCount = flags.filter((f) => f.enabled).length;
  const totalCount = flags.length;

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Beaker className="w-5 h-5 text-primary" />
          <h1 className="font-display text-xl font-bold">Pilot-Modus</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Aktiviere nur die Module, die dein Team im Pilot braucht. Deaktivierte Module verschwinden aus der Navigation.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            {enabledCount} / {totalCount} aktiv
          </Badge>
          {enabledCount < totalCount && (
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
              Pilot-Modus aktiv
            </Badge>
          )}
        </div>
      </div>

      <div className="max-w-2xl space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <div className="h-4 w-32 bg-muted rounded animate-pulse mb-4" />
                  <div className="space-y-3">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="h-12 bg-muted/50 rounded-lg animate-pulse" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          Object.entries(categoryConfig).map(([catKey, cat], catIndex) => {
            const catFlags = grouped[catKey] || [];
            if (catFlags.length === 0) return null;
            const Icon = cat.icon;
            return (
              <motion.div
                key={catKey}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: catIndex * 0.05 }}
              >
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-primary" />
                      <h2 className="text-sm font-semibold">{cat.label}</h2>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">{cat.description}</p>
                    <div className="space-y-2">
                      {catFlags.map((flag) => (
                        <div
                          key={flag.feature_key}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                            flag.enabled
                              ? "bg-muted/20 border-border"
                              : "bg-muted/5 border-border/40 opacity-60"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{flag.label}</p>
                              {catKey === "core" && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  Kern
                                </Badge>
                              )}
                              {flag.min_plan !== "starter" && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5 capitalize">
                                      <Lock className="w-2.5 h-2.5" />
                                      {flag.min_plan}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>Ab Plan „{flag.min_plan}" verfügbar</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                            {flag.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {flag.description}
                              </p>
                            )}
                          </div>
                          <Switch
                            checked={flag.enabled}
                            onCheckedChange={(checked) => toggleFlag(flag.feature_key, checked)}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </AppLayout>
  );
};

export default PilotSettings;
