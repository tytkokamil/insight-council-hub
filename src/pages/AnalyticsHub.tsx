import { lazy, Suspense, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHelpButton from "@/components/shared/PageHelpButton";
import PageLoadingFallback from "@/components/shared/PageLoadingFallback";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart3, Users } from "lucide-react";

const Analytics = lazy(() => import("./Analytics"));
const TeamPerformance = lazy(() => import("./TeamPerformance"));

const AnalyticsHub = () => {
  const [tab, setTab] = useState("analytics");

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Auswertung</p>
          <h1 className="font-display text-xl font-bold">Analytics Hub</h1>
        </div>
        <PageHelpButton title="Analytics Hub" description="Status, Trends, Durchlaufzeiten und Team-Vergleiche in einer zentralen Übersicht." />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="analytics" className="gap-1.5 text-xs">
            <BarChart3 className="w-3.5 h-3.5" /> Statistiken
          </TabsTrigger>
          <TabsTrigger value="teams" className="gap-1.5 text-xs">
            <Users className="w-3.5 h-3.5" /> Team-Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <Suspense fallback={<PageLoadingFallback />}>
            <Analytics embedded />
          </Suspense>
        </TabsContent>

        <TabsContent value="teams">
          <Suspense fallback={<PageLoadingFallback />}>
            <TeamPerformance embedded />
          </Suspense>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default AnalyticsHub;
