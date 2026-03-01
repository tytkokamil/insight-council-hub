import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Info, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { differenceInDays, differenceInMonths } from "date-fns";

interface ArchiveSummaryBoxProps {
  decision: {
    id: string;
    title: string;
    created_at: string;
    status: string;
    archived_at?: string | null;
    implemented_at?: string | null;
  };
}

const ArchiveSummaryBox = ({ decision }: ArchiveSummaryBoxProps) => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only show for decisions older than 90 days
  const daysOld = differenceInDays(new Date(), new Date(decision.created_at));
  const shouldShow = daysOld >= 90;

  useEffect(() => {
    if (!shouldShow) return;

    const fetchSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fnError } = await supabase.functions.invoke("archive-intelligence", {
          body: { type: "summary", decisionId: decision.id },
        });
        if (fnError) throw fnError;
        if (data?.error) throw new Error(data.error);
        setSummary(data?.summary);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Zusammenfassung konnte nicht geladen werden");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [decision.id, shouldShow]);

  if (!shouldShow) return null;

  if (loading) {
    return (
      <Card className="border-primary/20 bg-primary/[0.03] mb-6">
        <CardContent className="p-4 flex items-center gap-3">
          <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
          <p className="text-sm text-muted-foreground">KI-Zusammenfassung wird generiert…</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-warning/20 bg-warning/5 mb-6">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  const monthsAgo = summary.months_ago || differenceInMonths(new Date(), new Date(decision.created_at));

  return (
    <Card className="border-primary/20 bg-primary/[0.03] mb-6">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
              KI-Zusammenfassung
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              Diese Entscheidung wurde vor {monthsAgo} Monat{monthsAgo !== 1 ? "en" : ""} getroffen.{" "}
              {summary.summary}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
              <span>
                <strong className="text-foreground">Hauptverantwortlicher:</strong> {summary.owner_name}
              </span>
              <span>
                <strong className="text-foreground">Ergebnis:</strong> {summary.result}
              </span>
            </div>
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto mt-2 text-xs text-primary gap-1"
              onClick={() => navigate(`/audit?decision=${decision.id}`)}
            >
              Vollständigen Audit Trail anzeigen <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ArchiveSummaryBox;
