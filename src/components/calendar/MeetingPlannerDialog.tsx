import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Users, Sparkles, FileText, ExternalLink, Loader2, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { priorityColor } from "./CalendarConstants";

interface MeetingPlannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decisions: any[];
  profileMap: Record<string, string>;
}

const MeetingPlannerDialog = ({ open, onOpenChange, decisions, profileMap }: MeetingPlannerDialogProps) => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState("");
  const [generatingAgenda, setGeneratingAgenda] = useState(false);
  const [agenda, setAgenda] = useState("");
  const [step, setStep] = useState<"select" | "configure">("select");

  const eligibleDecisions = useMemo(() =>
    decisions.filter(d => !["archived", "implemented"].includes(d.status) && d.due_date),
    [decisions]
  );

  const selectedDecisions = useMemo(() =>
    eligibleDecisions.filter(d => selected.has(d.id)),
    [eligibleDecisions, selected]
  );

  const totalCod = useMemo(() =>
    selectedDecisions.reduce((sum, d) => sum + (d.cost_per_day || 0), 0),
    [selectedDecisions]
  );

  const reviewerIds = useMemo(() => {
    const ids = new Set<string>();
    selectedDecisions.forEach(d => {
      if (d.owner_id) ids.add(d.owner_id);
      if (d.assignee_id) ids.add(d.assignee_id);
    });
    return ids;
  }, [selectedDecisions]);

  const reviewerNames = useMemo(() =>
    Array.from(reviewerIds).map(id => profileMap[id] || id).filter(Boolean),
    [reviewerIds, profileMap]
  );

  const toggleDecision = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 7) next.add(id);
      return next;
    });
  };

  const generateAgenda = () => {
    setGeneratingAgenda(true);
    // Generate a structured agenda from selected decisions
    setTimeout(() => {
      const items = selectedDecisions.map((d, i) => {
        const codText = d.cost_per_day ? ` (CoD: €${d.cost_per_day.toLocaleString("de-DE")}/Tag)` : "";
        return `${i + 1}. ${d.title}${codText}\n   Status: ${d.status} | Priorität: ${d.priority}\n   ${d.description ? `Kontext: ${d.description.slice(0, 100)}...` : ""}`;
      });

      const generated = [
        `Meeting-Agenda: ${title || "Entscheidungs-Review"}`,
        `Datum: ${new Date().toLocaleDateString("de-DE")}`,
        `Teilnehmer: ${reviewerNames.join(", ") || "TBD"}`,
        ``,
        `─── Entscheidungen zur Besprechung ───`,
        ``,
        ...items,
        ``,
        `─── Zusammenfassung ───`,
        `Gesamter Cost of Delay: €${totalCod.toLocaleString("de-DE")}/Tag`,
        `Anzahl offener Punkte: ${selectedDecisions.length}`,
        ``,
        `─── Nächste Schritte ───`,
        `• Verantwortlichkeiten klären`,
        `• Fristen bestätigen oder anpassen`,
        `• Follow-up Termin vereinbaren`,
      ].join("\n");

      setAgenda(generated);
      setGeneratingAgenda(false);
    }, 800);
  };

  const handleContinue = () => {
    if (selected.size < 1) {
      toast.error("Bitte wähle mindestens 1 Entscheidung aus");
      return;
    }
    setStep("configure");
    if (!title) {
      setTitle(`Entscheidungs-Review (${selected.size} Punkte)`);
    }
    generateAgenda();
  };

  const handleOpenDecisionRoom = () => {
    // Navigate to meeting mode with pre-selected decisions
    const ids = Array.from(selected).join(",");
    navigate(`/meeting?decisions=${ids}`);
    onOpenChange(false);
  };

  const handleCreateCalendarEvent = () => {
    // Create Google Calendar event URL
    const start = new Date();
    start.setHours(start.getHours() + 1, 0, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 30 * Math.max(1, selected.size));

    const fmtDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: title || "Entscheidungs-Review",
      dates: `${fmtDate(start)}/${fmtDate(end)}`,
      details: agenda,
    });

    window.open(`https://calendar.google.com/calendar/render?${params}`, "_blank");
    toast.success("Google Calendar wird geöffnet");
  };

  const handleCopyAgenda = () => {
    navigator.clipboard.writeText(agenda);
    toast.success("Agenda in Zwischenablage kopiert");
  };

  const handleReset = () => {
    setStep("select");
    setSelected(new Set());
    setTitle("");
    setAgenda("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleReset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Meeting aus Entscheidungen planen
          </DialogTitle>
          <DialogDescription>
            {step === "select"
              ? "Wähle 1–7 Entscheidungen für das Meeting aus"
              : "Agenda überprüfen und Meeting erstellen"
            }
          </DialogDescription>
        </DialogHeader>

        {step === "select" && (
          <>
            <ScrollArea className="flex-1 max-h-[400px] -mx-2">
              <div className="space-y-1 px-2">
                {eligibleDecisions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Keine offenen Entscheidungen mit Deadline gefunden.
                  </p>
                ) : (
                  eligibleDecisions.map(d => (
                    <label
                      key={d.id}
                      className={cn(
                        "flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-colors border",
                        selected.has(d.id) ? "bg-primary/5 border-primary/30" : "border-transparent hover:bg-muted/50"
                      )}
                    >
                      <Checkbox
                        checked={selected.has(d.id)}
                        onCheckedChange={() => toggleDecision(d.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{d.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className={cn("text-[10px]", priorityColor[d.priority])}>
                            {d.priority}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{d.status}</span>
                          {d.cost_per_day > 0 && (
                            <span className="text-[10px] text-destructive flex items-center gap-0.5">
                              <DollarSign className="w-2.5 h-2.5" />
                              €{d.cost_per_day.toLocaleString("de-DE")}/Tag
                            </span>
                          )}
                          {d.due_date && (
                            <span className="text-[10px] text-muted-foreground">
                              Frist: {new Date(d.due_date).toLocaleDateString("de-DE")}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </ScrollArea>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                {selected.size} ausgewählt {totalCod > 0 && `• CoD: €${totalCod.toLocaleString("de-DE")}/Tag`}
              </span>
              <Button onClick={handleContinue} disabled={selected.size < 1} className="gap-1.5">
                Weiter <Sparkles className="w-3.5 h-3.5" />
              </Button>
            </div>
          </>
        )}

        {step === "configure" && (
          <>
            <div className="space-y-4 flex-1">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Meeting-Titel</label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Entscheidungs-Review"
                />
              </div>

              {reviewerNames.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Einzuladende Teilnehmer ({reviewerNames.length})
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {reviewerNames.map(name => (
                      <Badge key={name} variant="secondary" className="text-xs">{name}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    Generierte Agenda
                  </label>
                  <Button variant="ghost" size="sm" onClick={generateAgenda} className="text-[10px] h-6">
                    {generatingAgenda ? <Loader2 className="w-3 h-3 animate-spin" /> : "Neu generieren"}
                  </Button>
                </div>
                <Textarea
                  value={agenda}
                  onChange={e => setAgenda(e.target.value)}
                  rows={10}
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setStep("select")} className="text-xs">
                ← Zurück
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyAgenda} className="gap-1.5 text-xs">
                <FileText className="w-3 h-3" /> Agenda kopieren
              </Button>
              <Button variant="outline" size="sm" onClick={handleCreateCalendarEvent} className="gap-1.5 text-xs">
                <Calendar className="w-3 h-3" /> Google Calendar
              </Button>
              <Button size="sm" onClick={handleOpenDecisionRoom} className="gap-1.5 text-xs ml-auto">
                <ExternalLink className="w-3 h-3" /> Decision Room öffnen
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MeetingPlannerDialog;
