import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTeamContext } from "@/hooks/useTeamContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  FileUp, Upload, FileSpreadsheet, FileText, Sparkles, Check, X,
  Download, Loader2, AlertTriangle, Trash2, Plus, Clock,
} from "lucide-react";
import { toast } from "sonner";
// XLSX loaded dynamically to reduce bundle size (~1MB)
import { useTranslation } from "react-i18next";

interface ExtractedItem {
  title: string;
  description: string;
  category: string;
  priority: string;
  due_date: string | null;
  selected: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "decisions" | "tasks";
  onImported?: () => void;
}

const ImportDialog = ({ open, onOpenChange, mode, onImported }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { selectedTeamId } = useTeamContext();
  const [phase, setPhase] = useState<"upload" | "analyzing" | "preview" | "importing">("upload");
  const [fileName, setFileName] = useState("");
  const [summary, setSummary] = useState("");
  const [items, setItems] = useState<ExtractedItem[]>([]);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const label = t(mode === "decisions" ? "import.decisions" : "import.tasks");

  const categories = mode === "decisions"
    ? ["strategic", "budget", "hr", "technical", "operational", "marketing"].map(v => ({ value: v, label: t(`category.${v}`) }))
    : ["general", "strategic", "operational", "technical", "hr", "marketing", "budget"].map(v => ({ value: v, label: t(`category.${v === "general" ? "operational" : v}`) }));

  const priorities = ["low", "medium", "high", "critical"].map(v => ({ value: v, label: t(`priority.${v}`) }));

  const reset = () => { setPhase("upload"); setItems([]); setSummary(""); setFileName(""); setProgress(0); };
  const handleOpenChange = (o: boolean) => { if (!o) reset(); onOpenChange(o); };

  const parsePdf = async (file: File): Promise<string> => {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= Math.min(pdf.numPages, 50); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((item: any) => item.str).join(" ");
      if (text.trim()) pages.push(text);
    }
    return pages.join("\n\n");
  };

  const parseFile = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "csv" || ext === "txt") return await file.text();
    if (ext === "xlsx" || ext === "xls") {
      throw new Error("Excel-Import wird nicht mehr unterstützt. Bitte als CSV speichern und erneut importieren.");
    }
    if (ext === "pdf") return await parsePdf(file);
    try { return await file.text(); } catch { throw new Error(t("import.formatNotSupported")); }
  };

  const handleFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast.error(t("import.fileTooLarge")); return; }
    setFileName(file.name);
    setPhase("analyzing");
    setProgress(20);
    try {
      const content = await parseFile(file);
      setProgress(40);
      if (!content.trim()) throw new Error(t("import.fileEmpty"));
      setProgress(60);
      const { data, error } = await supabase.functions.invoke("extract-decisions", { body: { content, fileName: file.name, mode } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setProgress(90);
      const extracted: ExtractedItem[] = (data?.decisions || []).map((d: any) => ({
        title: d.title || "", description: d.description || "",
        category: d.category || (mode === "decisions" ? "operational" : "general"),
        priority: d.priority || "medium", due_date: d.due_date || null, selected: true,
      }));
      setSummary(data?.summary || "");
      setItems(extracted);
      setProgress(100);
      setPhase("preview");
    } catch (err: any) {
      toast.error(err.message || t("shared.analysisError"));
      setPhase("upload");
    }
  };

  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter.current++; if (e.dataTransfer.types.includes("Files")) setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter.current--; if (dragCounter.current === 0) setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); dragCounter.current = 0; const file = e.dataTransfer.files?.[0]; if (file) handleFile(file); };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) handleFile(file); };

  const downloadTemplate = () => {
    const csv = mode === "decisions"
      ? "Titel,Beschreibung,Kategorie,Priorität,Fälligkeitsdatum\nBudget Q3 freigeben,Freigabe des Marketing-Budgets für Q3,budget,high,2026-03-15\nNeue CRM-Software evaluieren,Vergleich von 3 CRM-Lösungen,technical,medium,"
      : "Titel,Beschreibung,Kategorie,Priorität,Fälligkeitsdatum\nDokumentation aktualisieren,Wiki-Seiten auf den neuesten Stand bringen,technical,medium,2026-03-15\nOnboarding-Prozess überarbeiten,Neues Onboarding für Entwickler erstellen,hr,high,";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${mode}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleItem = (i: number) => setItems(prev => prev.map((d, idx) => idx === i ? { ...d, selected: !d.selected } : d));
  const updateItem = (i: number, field: string, value: string) => setItems(prev => prev.map((d, idx) => idx === i ? { ...d, [field]: value } : d));
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const importItems = async () => {
    if (!user) return;
    const selected = items.filter(d => d.selected);
    if (selected.length === 0) { toast.error(t("import.noItemsSelected", { label })); return; }
    setPhase("importing");
    setProgress(0);
    try {
      if (mode === "decisions") {
        const rows = selected.map(d => ({
          title: d.title, description: d.description,
          category: d.category as any, priority: d.priority as any,
          due_date: d.due_date || null, team_id: selectedTeamId || null,
          created_by: user.id, owner_id: user.id, status: "draft" as const,
        }));
        const { error } = await supabase.from("decisions").insert(rows);
        if (error) throw error;
      } else {
        const rows = selected.map(d => ({
          title: d.title, description: d.description,
          category: d.category as any, priority: d.priority as any,
          due_date: d.due_date || null, team_id: selectedTeamId || null,
          created_by: user.id, status: "open" as const,
        }));
        const { error } = await supabase.from("tasks").insert(rows);
        if (error) throw error;
      }
      setProgress(100);
      toast.success(t("import.imported", { count: selected.length, label }));
      onImported?.();
      setTimeout(() => { reset(); onOpenChange(false); }, 1200);
    } catch (err: any) {
      toast.error(err.message || "Import failed");
      setPhase("preview");
    }
  };

  const selectedCount = items.filter(d => d.selected).length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="w-5 h-5 text-primary" />
            {t("import.title", { label })}
          </DialogTitle>
        </DialogHeader>

        {phase === "upload" && (
          <div className="space-y-4">
            <div
              onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
              onDragOver={e => e.preventDefault()} onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border/60 hover:border-primary/50 hover:bg-muted/20"}`}
            >
              <input ref={fileInputRef} type="file" className="hidden" accept=".csv,.xlsx,.xls,.txt,.tsv,.pdf" onChange={handleFileSelect} />
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">{t("import.uploadTitle")}</p>
                  <p className="text-xs text-muted-foreground">{t("import.uploadDesc")}</p>
                </div>
                <div className="flex gap-2 mt-1">
                  {[{ icon: FileText, label: "PDF" }, { icon: FileSpreadsheet, label: "Excel" }, { icon: FileText, label: "CSV" }].map((f, i) => (
                    <div key={i} className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">
                      <f.icon className="w-3 h-3" />{f.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/10">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-xs font-medium">{t("import.csvTemplate")}</p>
                  <p className="text-[10px] text-muted-foreground">{t("import.csvTemplateDesc")}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1.5 h-7 text-xs">
                <Download className="w-3 h-3" />{t("import.template")}
              </Button>
            </div>
          </div>
        )}

        {phase === "analyzing" && (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold mb-1">{t("import.aiAnalyzing", { fileName })}</p>
            <p className="text-xs text-muted-foreground mb-3">{t("import.analyzing", { label })}</p>
            <Progress value={progress} className="max-w-xs mx-auto" />
          </div>
        )}

        {phase === "preview" && (
          <div className="space-y-4">
            {summary && (
              <div className="flex items-start gap-2 p-3 rounded-lg border border-primary/20 bg-primary/5">
                <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium mb-0.5">{t("import.aiSummary")}</p>
                  <p className="text-[10px] text-muted-foreground">{summary}</p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t("import.selectedOf", { selected: selectedCount, total: items.length })}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={reset}>{t("import.cancel")}</Button>
                <Button size="sm" className="h-7 text-xs gap-1" onClick={importItems} disabled={selectedCount === 0}>
                  <Plus className="w-3 h-3" />{t("import.importCount", { count: selectedCount })}
                </Button>
              </div>
            </div>
            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
              {items.map((d, i) => (
                <div key={i} className={`rounded-lg border p-3 transition-all ${d.selected ? "border-primary/30 bg-background" : "border-border/60 bg-muted/20 opacity-60"}`}>
                  <div className="flex items-start gap-2">
                    <button onClick={() => toggleItem(i)} className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${d.selected ? "bg-primary border-primary text-primary-foreground" : "border-border/60"}`}>
                      {d.selected && <Check className="w-2.5 h-2.5" />}
                    </button>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <input value={d.title} onChange={e => updateItem(i, "title", e.target.value)} className="w-full text-sm font-medium bg-transparent border-none outline-none p-0" />
                      <textarea value={d.description} onChange={e => updateItem(i, "description", e.target.value)} className="w-full text-xs text-muted-foreground bg-transparent border-none outline-none p-0 resize-none" rows={1} />
                      <div className="flex items-center gap-2">
                        <Select value={d.category} onValueChange={v => updateItem(i, "category", v)}>
                          <SelectTrigger className="h-6 text-[10px] w-[100px]"><SelectValue /></SelectTrigger>
                          <SelectContent>{categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={d.priority} onValueChange={v => updateItem(i, "priority", v)}>
                          <SelectTrigger className="h-6 text-[10px] w-[80px]"><SelectValue /></SelectTrigger>
                          <SelectContent>{priorities.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                        </Select>
                        {d.due_date && <Badge variant="outline" className="text-[10px] gap-1"><Clock className="w-2.5 h-2.5" />{d.due_date}</Badge>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeItem(i)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {items.length === 0 && (
              <div className="text-center py-8">
                <AlertTriangle className="w-6 h-6 text-warning mx-auto mb-2" />
                <p className="text-sm font-medium">{t("import.noItemsDetected", { label })}</p>
                <Button variant="outline" size="sm" className="mt-2 h-7 text-xs" onClick={reset}>{t("import.back")}</Button>
              </div>
            )}
          </div>
        )}

        {phase === "importing" && (
          <div className="text-center py-12">
            {progress < 100 ? (
              <>
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                <p className="text-sm font-semibold">{t("import.importing", { count: selectedCount, label })}</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-success" />
                </div>
                <p className="text-sm font-semibold">{t("import.importComplete")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("import.importCreated", { count: selectedCount, label })}</p>
              </>
            )}
            <Progress value={progress} className="max-w-xs mx-auto mt-3" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImportDialog;
