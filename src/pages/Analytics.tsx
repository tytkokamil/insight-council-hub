import { useMemo } from "react";
import PageHint from "@/components/shared/PageHint";
import { motion } from "framer-motion";
import { TrendingUp, Clock, CheckCircle2, AlertCircle, FileText, AlertTriangle, BarChart3 } from "lucide-react";
import AnalysisPageSkeleton from "@/components/shared/AnalysisPageSkeleton";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useDecisions } from "@/hooks/useDecisions";

const COLORS = ["hsl(192, 91%, 56%)", "hsl(38, 92%, 50%)", "hsl(142, 71%, 45%)", "hsl(0, 72%, 51%)", "hsl(215, 28%, 55%)", "hsl(280, 65%, 60%)"];

const Analytics = () => {
  const { data: decisions = [], isLoading: loading } = useDecisions();

  const stats = {
    total: decisions.length,
    draft: decisions.filter((d) => d.status === "draft").length,
    review: decisions.filter((d) => d.status === "review").length,
    approved: decisions.filter((d) => d.status === "approved").length,
    implemented: decisions.filter((d) => d.status === "implemented").length,
    rejected: decisions.filter((d) => d.status === "rejected").length,
  };

  const statusData = [
    { name: "Entwurf", value: stats.draft },
    { name: "Review", value: stats.review },
    { name: "Genehmigt", value: stats.approved },
    { name: "Umgesetzt", value: stats.implemented },
    { name: "Abgelehnt", value: stats.rejected },
  ].filter((d) => d.value > 0);

  const categoryData = Object.entries(
    decisions.reduce((acc: Record<string, number>, d) => {
      acc[d.category] = (acc[d.category] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

  const riskDistribution = [
    { name: "Niedrig (0-40%)", value: decisions.filter(d => (d.ai_risk_score || 0) <= 40).length },
    { name: "Mittel (41-60%)", value: decisions.filter(d => (d.ai_risk_score || 0) > 40 && (d.ai_risk_score || 0) <= 60).length },
    { name: "Hoch (61-100%)", value: decisions.filter(d => (d.ai_risk_score || 0) > 60).length },
  ].filter(d => d.value > 0);

  const avgRisk = decisions.length > 0
    ? Math.round(decisions.reduce((sum, d) => sum + (d.ai_risk_score || 0), 0) / decisions.length)
    : 0;

  const avgImpact = decisions.length > 0
    ? Math.round(decisions.reduce((sum, d) => sum + (d.ai_impact_score || 0), 0) / decisions.length)
    : 0;

  const summaryCards = [
    { label: "Gesamt", value: stats.total, icon: FileText },
    { label: "In Review", value: stats.review, icon: Clock },
    { label: "Ø Risiko", value: `${avgRisk}%`, icon: AlertTriangle },
    { label: "Ø Impact", value: `${avgImpact}%`, icon: TrendingUp },
  ];

  const tooltipStyle = { background: "hsl(222, 47%, 8%)", border: "1px solid hsl(215, 28%, 17%)", borderRadius: "8px" };

  if (loading) return <AnalysisPageSkeleton cards={4} sections={0} showChart />;

  if (decisions.length === 0) {
    return (
      <AppLayout>
        <div className="mb-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Auswertung</p>
          <h1 className="font-display text-xl font-bold">Analytics</h1>
        </div>
        <EmptyAnalysisState
          icon={BarChart3}
          title="Noch keine Analyse-Daten"
          description="Erstelle Entscheidungen, um Statistiken und Diagramme zu sehen."
          hint="Daten werden automatisch analysiert, sobald Entscheidungen vorhanden sind"
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Auswertung</p>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-xl font-bold">Analytics</h1>
          <PageHint>
            Visualisierung deiner Entscheidungsdaten: Statusverteilung, Kategorien, Risikoanalyse und Durchlaufzeiten. Alle Diagramme aktualisieren sich automatisch.
          </PageHint>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryCards.map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{card.label}</p>
                    <p className="font-display text-3xl font-bold">{card.value}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <card.icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-display font-semibold text-lg mb-4">Status-Verteilung</h3>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">Noch keine Daten</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-display font-semibold text-lg mb-4">Übersicht nach Status</h3>
            {stats.total > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: "Entwurf", count: stats.draft },
                  { name: "Review", count: stats.review },
                  { name: "Genehmigt", count: stats.approved },
                  { name: "Umgesetzt", count: stats.implemented },
                  { name: "Abgelehnt", count: stats.rejected },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 17%)" />
                  <XAxis dataKey="name" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                  <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="hsl(192, 91%, 56%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">Noch keine Daten</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-display font-semibold text-lg mb-4">Kategorien</h3>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 17%)" />
                  <XAxis type="number" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke="hsl(215, 20%, 55%)" fontSize={12} width={100} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="hsl(280, 65%, 60%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">Noch keine Daten</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-display font-semibold text-lg mb-4">KI-Risikoverteilung</h3>
            {riskDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={riskDistribution} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    <Cell fill="hsl(142, 71%, 45%)" />
                    <Cell fill="hsl(38, 92%, 50%)" />
                    <Cell fill="hsl(0, 72%, 51%)" />
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">Noch keine KI-Analysen vorhanden</div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Analytics;
