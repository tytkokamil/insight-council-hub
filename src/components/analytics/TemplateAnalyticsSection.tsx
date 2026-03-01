import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { FileText, TrendingUp, TrendingDown, Clock, XCircle, CheckCircle2 } from "lucide-react";
import { differenceInDays } from "date-fns";

interface Decision {
  id: string;
  status: string;
  template_used?: string | null;
  created_at: string;
  implemented_at?: string | null;
  [key: string]: any;
}

interface Props {
  decisions: Decision[];
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 142 71% 45%))",
  "hsl(var(--chart-3, 38 92% 50%))",
  "hsl(var(--chart-4, 280 65% 60%))",
  "hsl(var(--chart-5, 215 28% 55%))",
  "hsl(var(--destructive))",
];

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--foreground))",
  fontSize: 12,
};

const TemplateAnalyticsSection = ({ decisions }: Props) => {
  const analytics = useMemo(() => {
    const withTemplate = decisions.filter(d => d.template_used);
    const withoutTemplate = decisions.filter(d => !d.template_used);

    // Group by template
    const grouped = new Map<string, Decision[]>();
    withTemplate.forEach(d => {
      const name = d.template_used!;
      if (!grouped.has(name)) grouped.set(name, []);
      grouped.get(name)!.push(d);
    });

    const templateStats = Array.from(grouped.entries()).map(([name, decs]) => {
      const total = decs.length;
      const rejected = decs.filter(d => d.status === "rejected").length;
      const implemented = decs.filter(d => d.status === "implemented");
      const rejectionRate = total > 0 ? Math.round((rejected / total) * 100) : 0;

      // Avg completion time (created → implemented)
      const completionDays = implemented
        .filter(d => d.implemented_at)
        .map(d => differenceInDays(new Date(d.implemented_at!), new Date(d.created_at)));
      const avgDays = completionDays.length > 0
        ? Math.round(completionDays.reduce((a, b) => a + b, 0) / completionDays.length)
        : null;

      const approvedOrImplemented = decs.filter(d => ["approved", "implemented"].includes(d.status)).length;
      const successRate = total > 0 ? Math.round((approvedOrImplemented / total) * 100) : 0;

      return { name, total, rejected, rejectionRate, avgDays, successRate, implemented: implemented.length };
    }).sort((a, b) => b.total - a.total);

    // Usage chart data
    const usageData = templateStats.map(t => ({
      name: t.name.length > 18 ? t.name.slice(0, 16) + "…" : t.name,
      fullName: t.name,
      count: t.total,
    }));

    // Add "Ohne Template" if any
    if (withoutTemplate.length > 0) {
      usageData.push({ name: "Ohne Template", fullName: "Ohne Template", count: withoutTemplate.length });
    }

    // Best/worst performers
    const fastest = templateStats.filter(t => t.avgDays !== null).sort((a, b) => a.avgDays! - b.avgDays!)[0];
    const highestRejection = templateStats.filter(t => t.total >= 2).sort((a, b) => b.rejectionRate - a.rejectionRate)[0];
    const mostUsed = templateStats[0];

    return { templateStats, usageData, fastest, highestRejection, mostUsed, total: decisions.length, withTemplate: withTemplate.length };
  }, [decisions]);

  if (analytics.withTemplate === 0 && decisions.length < 3) return null;

  return (
    <CollapsibleSection title="Template Analytics" defaultOpen>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Template-Nutzung</span>
            </div>
            <p className="text-2xl font-bold">{analytics.withTemplate}<span className="text-sm font-normal text-muted-foreground">/{analytics.total}</span></p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {analytics.total > 0 ? Math.round((analytics.withTemplate / analytics.total) * 100) : 0}% nutzen Templates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Schnellstes Template</span>
            </div>
            {analytics.fastest ? (
              <>
                <p className="text-sm font-semibold truncate">{analytics.fastest.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Ø {analytics.fastest.avgDays} Tage bis Umsetzung</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Noch keine Daten</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Höchste Rejection Rate</span>
            </div>
            {analytics.highestRejection && analytics.highestRejection.rejectionRate > 0 ? (
              <>
                <p className="text-sm font-semibold truncate">{analytics.highestRejection.name}</p>
                <p className="text-xs text-destructive mt-0.5">{analytics.highestRejection.rejectionRate}% abgelehnt</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Keine Ablehnungen</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage Chart */}
      {analytics.usageData.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Nutzung nach Template</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(180, analytics.usageData.length * 36)}>
              <BarChart data={analytics.usageData} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number, _: string, props: any) => [value, props.payload.fullName]} />
                <Bar dataKey="count" name="Entscheidungen" radius={[0, 4, 4, 0]} maxBarSize={24}>
                  {analytics.usageData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Detail Table */}
      {analytics.templateStats.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Template-Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border/60 text-xs text-muted-foreground">
                    <th className="p-2 font-medium">Template</th>
                    <th className="p-2 font-medium text-right">Gesamt</th>
                    <th className="p-2 font-medium text-right">Umgesetzt</th>
                    <th className="p-2 font-medium text-right">Abgelehnt</th>
                    <th className="p-2 font-medium text-right">Ø Dauer</th>
                    <th className="p-2 font-medium text-right">Erfolgsrate</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.templateStats.map((t, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="p-2 text-sm font-medium">{t.name}</td>
                      <td className="p-2 text-sm text-right">{t.total}</td>
                      <td className="p-2 text-sm text-right">
                        <span className="text-primary">{t.implemented}</span>
                      </td>
                      <td className="p-2 text-sm text-right">
                        <span className={t.rejectionRate > 30 ? "text-destructive font-medium" : "text-muted-foreground"}>
                          {t.rejected} ({t.rejectionRate}%)
                        </span>
                      </td>
                      <td className="p-2 text-sm text-right">
                        {t.avgDays !== null ? (
                          <span className="flex items-center justify-end gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            {t.avgDays}d
                          </span>
                        ) : "—"}
                      </td>
                      <td className="p-2 text-sm text-right">
                        <Badge variant={t.successRate >= 70 ? "default" : t.successRate >= 40 ? "secondary" : "destructive"} className="text-[10px]">
                          {t.successRate}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {analytics.withTemplate === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Noch keine Entscheidungen mit Templates erstellt.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Erstelle Entscheidungen über den Template-Picker, um Analytics zu sehen.</p>
          </CardContent>
        </Card>
      )}
    </CollapsibleSection>
  );
};

export default TemplateAnalyticsSection;
