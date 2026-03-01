import { lazy, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import PageLoadingFallback from "@/components/shared/PageLoadingFallback";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BarChart3, TrendingUp, PieChart, Users, FileDown, Loader2 } from "lucide-react";
import { useDecisions } from "@/hooks/useDecisions";
import { fetchBoardReportData, generateBoardReport } from "@/lib/generateBoardReport";
import { useToast } from "@/hooks/use-toast";
import { useFreemiumLimits } from "@/hooks/useFreemiumLimits";
import FeatureGateBanner from "@/components/upgrade/FeatureGateBanner";

const Analytics = lazy(() => import("./Analytics"));

const MIN_DECISIONS_FOR_ANALYTICS = 5;

export type AnalyticsTimeRange = "7" | "30" | "90" | "all";

const AnalyticsHub = () => {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>("30");
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();
  const { data: decisions = [], isLoading } = useDecisions();
  const { analyticsAvailable } = useFreemiumLimits();
  const hasEnoughData = decisions.length >= MIN_DECISIONS_FOR_ANALYTICS;

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await fetchBoardReportData();
      generateBoardReport(data);
      toast({ title: t("analytics.exported"), description: t("analytics.exportedDesc") });
    } catch {
      toast({ title: t("settings.error"), description: t("analytics.exportError"), variant: "destructive" });
    }
    setExporting(false);
  };

  return (
    <AppLayout>
      <PageHeader
        title={t("analytics.hubTitle")}
        subtitle={t("analytics.hubSubtitle")}
        role="intelligence"
        help={{ title: t("analytics.hubTitle"), description: t("analytics.hubHelp") }}
        secondaryActions={
          hasEnoughData ? (
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as AnalyticsTimeRange)}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">{t("analytics.last7")}</SelectItem>
                <SelectItem value="30">{t("analytics.last30")}</SelectItem>
                <SelectItem value="90">{t("analytics.last90")}</SelectItem>
                <SelectItem value="all">{t("analytics.all")}</SelectItem>
              </SelectContent>
            </Select>
          ) : undefined
        }
        primaryAction={
          hasEnoughData ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" disabled={exporting} onClick={handleExport} className="gap-2">
                    {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                    {t("analytics.executiveSnapshot")}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p className="text-xs">{t("analytics.executiveSnapshotTooltip")}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : undefined
        }
      />

      {!analyticsAvailable && <FeatureGateBanner planName="Professional" price="149€/mo" />}

      {!analyticsAvailable ? (
        <div className="opacity-50 pointer-events-none">
          <EmptyAnalysisState
            icon={BarChart3}
            title={t("analytics.notEnoughData")}
            description="Analytics ist ab dem Professional Plan verfügbar."
          />
        </div>
      ) : !isLoading && !hasEnoughData ? (
        <EmptyAnalysisState
          icon={BarChart3}
          title={t("analytics.notEnoughData")}
          description={t("analytics.notEnoughDataDesc", { min: MIN_DECISIONS_FOR_ANALYTICS, current: decisions.length })}
          ctaLabel={t("analytics.createDecision")}
          ctaRoute="/decisions"
          motivation={t("analytics.motivation")}
          hint={t("analytics.hint")}
          features={[
            { icon: TrendingUp, label: t("analytics.trends"), desc: t("analytics.trendsDesc") },
            { icon: PieChart, label: t("analytics.distribution"), desc: t("analytics.distributionDesc") },
            { icon: Users, label: t("analytics.teamComparison"), desc: t("analytics.teamComparisonDesc") },
          ]}
        />
      ) : (
        <Suspense fallback={<PageLoadingFallback />}>
          <Analytics embedded timeRange={timeRange} />
        </Suspense>
      )}
    </AppLayout>
  );
};

export default AnalyticsHub;