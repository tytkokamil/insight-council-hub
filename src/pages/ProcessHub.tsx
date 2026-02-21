import { lazy, Suspense, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHelpButton from "@/components/shared/PageHelpButton";
import PageLoadingFallback from "@/components/shared/PageLoadingFallback";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Radar, Flame, Activity, Brain } from "lucide-react";

const BottleneckIntelligence = lazy(() => import("./BottleneckIntelligence"));
const FrictionMap = lazy(() => import("./FrictionMap"));
const HealthHeatmap = lazy(() => import("./HealthHeatmap"));
const PatternEngine = lazy(() => import("./PatternEngine"));

const ProcessHub = () => {
  const [tab, setTab] = useState("bottlenecks");

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Prozess-Analyse</p>
          <h1 className="font-display text-xl font-bold">Process Hub</h1>
        </div>
        <PageHelpButton title="Process Hub" description="Engpässe, Reibungspunkte, Gesundheitsanalyse und Muster in einer Übersicht." />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="bottlenecks" className="gap-1.5 text-xs">
            <Radar className="w-3.5 h-3.5" /> Bottlenecks
          </TabsTrigger>
          <TabsTrigger value="friction" className="gap-1.5 text-xs">
            <Flame className="w-3.5 h-3.5" /> Friction
          </TabsTrigger>
          <TabsTrigger value="health" className="gap-1.5 text-xs">
            <Activity className="w-3.5 h-3.5" /> Health
          </TabsTrigger>
          <TabsTrigger value="patterns" className="gap-1.5 text-xs">
            <Brain className="w-3.5 h-3.5" /> Patterns
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bottlenecks">
          <Suspense fallback={<PageLoadingFallback />}>
            <BottleneckIntelligence embedded />
          </Suspense>
        </TabsContent>
        <TabsContent value="friction">
          <Suspense fallback={<PageLoadingFallback />}>
            <FrictionMap embedded />
          </Suspense>
        </TabsContent>
        <TabsContent value="health">
          <Suspense fallback={<PageLoadingFallback />}>
            <HealthHeatmap embedded />
          </Suspense>
        </TabsContent>
        <TabsContent value="patterns">
          <Suspense fallback={<PageLoadingFallback />}>
            <PatternEngine embedded />
          </Suspense>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default ProcessHub;
