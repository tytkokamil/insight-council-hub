import { lazy, Suspense, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import AppLayout from "@/components/layout/AppLayout";
import PageHelpButton from "@/components/shared/PageHelpButton";
import PageHeader from "@/components/shared/PageHeader";
import PageLoadingFallback from "@/components/shared/PageLoadingFallback";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Target, Sun, CalendarDays, DollarSign, FlaskConical, Dna, Trophy, Briefcase, FileDown } from "lucide-react";
import { useDecisions } from "@/hooks/useDecisions";
import { fetchBoardReportData, generateBoardReport } from "@/lib/generateBoardReport";
import { toast } from "sonner";

const ExecutiveDashboard = lazy(() => import("./ExecutiveDashboard"));
const Briefing = lazy(() => import("./Briefing"));
const PredictiveTimeline = lazy(() => import("./PredictiveTimeline"));
const OpportunityCostRadar = lazy(() => import("./OpportunityCostRadar"));
const ScenarioEngine = lazy(() => import("./ScenarioEngine"));
const DecisionDNA = lazy(() => import("./DecisionDNA"));
const DecisionBenchmarking = lazy(() => import("./DecisionBenchmarking"));

const MIN_DECISIONS = 15;

const ExecutiveHub = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState("dashboard");
  const [exporting, setExporting] = useState(false);
  const { data: allDecisions = [], isLoading } = useDecisions();
  // Exclude personal decisions from executive analytics
  const decisions = useMemo(() => allDecisions.filter(d => d.team_id !== null), [allDecisions]);
  const implemented = decisions.filter(d => d.status === "implemented").length;
  const hasEnoughData = decisions.length >= MIN_DECISIONS && implemented >= 3;

  const handleBoardPack = useCallback(async () => {
    setExporting(true);
    try {
      const data = await fetchBoardReportData();
      generateBoardReport(data);
      toast.success(t("executiveDash.boardPackExportedTitle"), { description: t("executiveDash.boardPackExportedDesc") });
    } catch {
      toast.error(t("executive.exportError"));
    } finally {
      setExporting(false);
    }
  }, []);

  return (
    <AppLayout>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <PageHeader
          title={t("executive.title")}
          subtitle={t("executive.subtitle")}
          role="intelligence"
          help={{ title: t("executive.title"), description: t("executive.help") }}
        />
        {hasEnoughData && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={handleBoardPack}
            disabled={exporting}
          >
            <FileDown className="w-3.5 h-3.5" />
            {exporting ? t("executive.exporting") : t("executive.boardPackPdf")}
          </Button>
        )}
      </div>

      {!isLoading && !hasEnoughData ? (
        <EmptyAnalysisState
          icon={Briefcase}
          title={t("executive.emptyTitle")}
          description={t("executive.emptyDesc", { current: decisions.length, implemented })}
          ctaLabel={t("executive.createDecisions")}
          ctaRoute="/decisions"
          motivation={t("executive.emptyMotivation")}
          hint={t("executive.emptyHint")}
          features={[
            { icon: Sun, label: t("executive.aiBriefing"), desc: t("executive.aiBriefingDesc") },
            { icon: DollarSign, label: t("executive.impactAnalysis"), desc: t("executive.impactAnalysisDesc") },
            { icon: FlaskConical, label: t("executive.tabScenarios"), desc: t("executive.scenariosDesc") },
          ]}
        />
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="dashboard" className="gap-1.5 text-xs">
              <Target className="w-3.5 h-3.5" /> {t("executive.tabDashboard")}
            </TabsTrigger>
            <TabsTrigger value="briefing" className="gap-1.5 text-xs">
              <Sun className="w-3.5 h-3.5" /> {t("executive.tabBriefing")}
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-1.5 text-xs">
              <CalendarDays className="w-3.5 h-3.5" /> {t("executive.tabTimeline")}
            </TabsTrigger>
            <TabsTrigger value="costs" className="gap-1.5 text-xs">
              <DollarSign className="w-3.5 h-3.5" /> {t("executive.tabImpact")}
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="gap-1.5 text-xs">
              <FlaskConical className="w-3.5 h-3.5" /> {t("executive.tabScenarios")}
            </TabsTrigger>
            <TabsTrigger value="dna" className="gap-1.5 text-xs">
              <Dna className="w-3.5 h-3.5" /> {t("executive.tabDna")}
            </TabsTrigger>
            <TabsTrigger value="benchmarking" className="gap-1.5 text-xs">
              <Trophy className="w-3.5 h-3.5" /> {t("executive.tabBenchmark")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Suspense fallback={<PageLoadingFallback />}><ExecutiveDashboard embedded /></Suspense>
          </TabsContent>
          <TabsContent value="briefing">
            <Suspense fallback={<PageLoadingFallback />}><Briefing embedded /></Suspense>
          </TabsContent>
          <TabsContent value="timeline">
            <Suspense fallback={<PageLoadingFallback />}><PredictiveTimeline embedded /></Suspense>
          </TabsContent>
          <TabsContent value="costs">
            <Suspense fallback={<PageLoadingFallback />}><OpportunityCostRadar embedded /></Suspense>
          </TabsContent>
          <TabsContent value="scenarios">
            <Suspense fallback={<PageLoadingFallback />}><ScenarioEngine embedded /></Suspense>
          </TabsContent>
          <TabsContent value="dna">
            <Suspense fallback={<PageLoadingFallback />}><DecisionDNA embedded /></Suspense>
          </TabsContent>
          <TabsContent value="benchmarking">
            <Suspense fallback={<PageLoadingFallback />}><DecisionBenchmarking embedded /></Suspense>
          </TabsContent>
        </Tabs>
      )}
    </AppLayout>
  );
};

export default ExecutiveHub;
