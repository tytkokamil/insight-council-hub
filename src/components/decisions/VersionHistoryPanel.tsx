import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfiles, buildProfileMap } from "@/hooks/useDecisions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GitCommit, Clock, User, FileText, ArrowRight } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { categoryLabels, priorityLabels } from "@/lib/labels";

interface Props {
  decisionId: string;
  currentDecision: any;
}

const fieldLabels: Record<string, string> = {
  title: "Titel",
  description: "Beschreibung",
  context: "Kontext",
  category: "Kategorie",
  priority: "Priorität",
  due_date: "Fälligkeitsdatum",
  status: "Status",
};

const formatFieldValue = (key: string, value: any): string => {
  if (value === null || value === undefined || value === "") return "—";
  if (key === "category") return categoryLabels[value] || value;
  if (key === "priority") return priorityLabels[value] || value;
  if (key === "due_date") return value;
  if (typeof value === "string" && value.length > 80) return value.substring(0, 80) + "…";
  return String(value);
};

const VersionHistoryPanel = ({ decisionId, currentDecision }: Props) => {
  const { data: profiles = [] } = useProfiles();
  const profileMap = buildProfileMap(profiles);

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ["decision-versions", decisionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("decision_versions")
        .select("*")
        .eq("decision_id", decisionId)
        .order("version_number", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });

  // Build diff between two snapshots
  const getDiff = (older: any, newer: any) => {
    const changes: { field: string; from: string; to: string }[] = [];
    const fields = ["title", "description", "context", "category", "priority", "due_date", "status"];
    for (const f of fields) {
      const oldVal = older?.[f] ?? null;
      const newVal = newer?.[f] ?? null;
      if (String(oldVal) !== String(newVal)) {
        changes.push({
          field: fieldLabels[f] || f,
          from: formatFieldValue(f, oldVal),
          to: formatFieldValue(f, newVal),
        });
      }
    }
    return changes;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="h-24 rounded-lg bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  // Current state as "latest version"
  const currentSnapshot = {
    title: currentDecision.title,
    description: currentDecision.description,
    context: currentDecision.context,
    category: currentDecision.category,
    priority: currentDecision.priority,
    due_date: currentDecision.due_date,
    status: currentDecision.status,
  };

  const currentVersion = versions.length > 0 ? versions[0].version_number + 1 : 1;

  return (
    <ScrollArea className="h-[500px] pr-2">
      <div className="space-y-3">
        {/* Current version (live) */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-primary text-primary-foreground text-[10px]">
                <GitCommit className="w-3 h-3 mr-1" /> v{currentVersion}
              </Badge>
              <span className="text-xs text-muted-foreground">Aktuelle Version</span>
              <Badge variant="outline" className="text-[10px] ml-auto">LIVE</Badge>
            </div>
            {versions.length > 0 && (() => {
              const diff = getDiff(versions[0].snapshot, currentSnapshot);
              return diff.length > 0 ? (
                <div className="space-y-1 mt-2">
                  {diff.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground font-medium min-w-[100px]">{d.field}:</span>
                      <span className="text-destructive/70 line-through">{d.from}</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="text-success font-medium">{d.to}</span>
                    </div>
                  ))}
                </div>
              ) : null;
            })()}
          </CardContent>
        </Card>

        {/* Historical versions */}
        {versions.map((version, idx) => {
          const olderSnapshot = idx < versions.length - 1 ? versions[idx + 1].snapshot : null;
          const diff = olderSnapshot ? getDiff(olderSnapshot, version.snapshot as any) : [];
          const snap = version.snapshot as any;

          return (
            <Card key={version.id} className="card-interactive">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px]">
                    <GitCommit className="w-3 h-3 mr-1" /> v{version.version_number}
                  </Badge>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(version.created_at), { addSuffix: true, locale: de })}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{format(new Date(version.created_at), "dd.MM.yyyy HH:mm", { locale: de })}</p>
                    </TooltipContent>
                  </Tooltip>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 ml-auto">
                    <User className="w-3 h-3" />
                    {profileMap[version.created_by] || "Unbekannt"}
                  </span>
                </div>

                {/* Change reason */}
                {version.change_reason && (
                  <div className="flex items-start gap-2 p-2 rounded-md bg-muted/50 mb-2">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-xs text-foreground">{version.change_reason}</p>
                  </div>
                )}

                {/* Field diffs */}
                {diff.length > 0 ? (
                  <div className="space-y-1">
                    {diff.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground font-medium min-w-[100px]">{d.field}:</span>
                        <span className="text-destructive/70 line-through">{d.from}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="text-success font-medium">{d.to}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground italic">Erster Snapshot – keine vorherige Version zum Vergleichen.</p>
                )}
              </CardContent>
            </Card>
          );
        })}

        {versions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <GitCommit className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">Keine Versionshistorie</p>
            <p className="text-xs mt-1">Versionen werden bei jeder Bearbeitung automatisch erstellt.</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default VersionHistoryPanel;
