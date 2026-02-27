import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Shield, Beaker, BarChart3, Brain, Zap, Lock, Info, AlertTriangle } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usePermissions } from "@/hooks/usePermissions";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/ui/sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const categoryConfig: Record<string, { label: string; icon: React.ElementType; description: string }> = {
  core: { label: "Kern-Module", icon: Shield, description: "Essenzielle Funktionen für den täglichen Betrieb" },
  analysis: { label: "Analyse-Module", icon: BarChart3, description: "Erweiterte Analysen und Visualisierungen" },
  intelligence: { label: "Intelligence-Module", icon: Brain, description: "KI-gestützte Insights und Prognosen" },
  admin: { label: "Administration", icon: Zap, description: "Verwaltung und Governance" },
};

const PilotSettings = () => {
  const { t } = useTranslation();
  const { flags, loading, toggleFlag } = useFeatureFlags();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const [pendingDisable, setPendingDisable] = useState<{ key: string; label: string } | null>(null);

  // Admin-only guard
  useEffect(() => {
    if (!can.manageUsers) navigate("/dashboard");
  }, [can.manageUsers, navigate]);

  if (!can.manageUsers) return null;

  const grouped = flags.reduce<Record<string, typeof flags>>((acc, flag) => {
    if (!acc[flag.category]) acc[flag.category] = [];
    acc[flag.category].push(flag);
    return acc;
  }, {});

  const enabledCount = flags.filter((f) => f.enabled).length;
  const totalCount = flags.length;

  const handleToggle = (featureKey: string, label: string, checked: boolean) => {
    if (!checked) {
      setPendingDisable({ key: featureKey, label });
    } else {
      toggleFlag(featureKey, true);
      toast.success(t("pilot.moduleEnabled", { module: label }));
    }
  };

  const confirmDisable = () => {
    if (pendingDisable) {
      toggleFlag(pendingDisable.key, false);
      toast.info(t("pilot.moduleDisabled", { module: pendingDisable.label }));
      setPendingDisable(null);
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Beaker className="w-5 h-5 text-primary" />
          <h1 className="font-display text-xl font-bold">{t("pilot.title")}</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("pilot.subtitle")}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            {enabledCount} / {totalCount} {t("pilot.active")}
          </Badge>
          {enabledCount < totalCount && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs gap-1 cursor-help">
                  <Info className="w-3 h-3" />
                  {t("pilot.pilotActive")}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[250px] text-xs">
                {t("pilot.pilotActiveTooltip")}
              </TooltipContent>
            </Tooltip>
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
                            onCheckedChange={(checked) => handleToggle(flag.feature_key, flag.label, checked)}
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

      {/* Disable confirmation dialog */}
      <AlertDialog open={!!pendingDisable} onOpenChange={(open) => !open && setPendingDisable(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              {t("pilot.disableTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>„{pendingDisable?.label}"</strong> {t("pilot.disableDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("pilot.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisable}>{t("pilot.confirmDisable")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default PilotSettings;
