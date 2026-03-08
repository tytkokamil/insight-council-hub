import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileUp, Upload, FileSpreadsheet, FileText, Sparkles, Check, X,
  Download, Loader2, AlertTriangle, Trash2, Plus, Clock,
} from "lucide-react";
import { toast } from "sonner";
// XLSX loaded dynamically to reduce bundle size (~1MB)

interface ExtractedDecision {
  title: string;
  description: string;
  category: string;
  priority: string;
  due_date: string | null;
  selected: boolean;
}

interface Props {
  teamId: string;
}

const TeamImportTab = ({ teamId }: Props) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [phase, setPhase] = useState<"upload" | "analyzing" | "preview" | "importing">("upload");
  const [fileName, setFileName] = useState("");
  const [summary, setSummary] = useState("");
  const [decisions, setDecisions] = useState<ExtractedDecision[]>([]);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const CATEGORIES = [
    { value: "strategic", label: t("category.strategic") },
    { value: "budget", label: t("category.budget") },
    { value: "hr", label: t("category.hr") },
    { value: "technical", label: t("category.technical") },
    { value: "operational", label: t("category.operational") },
    { value: "marketing", label: t("category.marketing") },
  ];

  const PRIORITIES = [
    { value: "low", label: t("priority.low") },
    { value: "medium", label: t("priority.medium") },
    { value: "high", label: t("priority.high") },
    { value: "critical", label: t("priority.critical") },
  ];

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

    if (ext === "csv" || ext === "txt") {
      return await file.text();
    }

    if (ext === "xlsx" || ext === "xls") {
      throw new Error("Excel-Import wird nicht mehr unterstützt. Bitte als CSV speichern und erneut importieren.");
    }

    if (ext === "pdf") {
      return await parsePdf(file);
    }

    try {
      return await file.text();
    } catch {
      throw new Error(t("teamImport.formatUnsupported"));
    }
  };

  const handleFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("teamImport.fileTooLarge"));
      return;
    }

    setFileName(file.name);
    setPhase("analyzing");
    setProgress(20);

    try {
      const content = await parseFile(file);
      setProgress(40);

      if (!content.trim()) {
        throw new Error(t("teamImport.fileEmpty"));
      }

      setProgress(60);

      const { data, error } = await supabase.functions.invoke("extract-decisions", {
        body: { content, fileName: file.name },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setProgress(90);

      const extracted: ExtractedDecision[] = (data?.decisions || []).map((d: any) => ({
        title: d.title || "",
        description: d.description || "",
        category: d.category || "operational",
        priority: d.priority || "medium",
        due_date: d.due_date || null,
        selected: true,
      }));

      setSummary(data?.summary || "");
      setDecisions(extracted);
      setProgress(100);
      setPhase("preview");
    } catch (err: any) {
      toast.error(err.message || t("teamImport.analysisFailed"));
      setPhase("upload");
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes("Files")) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const downloadTemplate = () => {
    const csv = "Titel,Beschreibung,Kategorie,Priorität,Fälligkeitsdatum\nBudget Q3 freigeben,Freigabe des Marketing-Budgets für Q3,budget,high,2026-03-15\nNeue CRM-Software evaluieren,Vergleich von 3 CRM-Lösungen für das Vertriebsteam,technical,medium,\nTeam-Lead Produkt einstellen,Nachbesetzung der vakanten Position im Produktteam,hr,critical,2026-04-01";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "entscheidungen-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleDecision = (index: number) => {
    setDecisions((prev) =>
      prev.map((d, i) => (i === index ? { ...d, selected: !d.selected } : d))
    );
  };

  const updateDecision = (index: number, field: string, value: string) => {
    setDecisions((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    );
  };

  const removeDecision = (index: number) => {
    setDecisions((prev) => prev.filter((_, i) => i !== index));
  };

  const importDecisions = async () => {
    if (!user) return;
    const selected = decisions.filter((d) => d.selected);
    if (selected.length === 0) {
      toast.error(t("teamImport.noSelected"));
      return;
    }

    setPhase("importing");
    setProgress(0);

    try {
      const rows = selected.map((d) => ({
        title: d.title,
        description: d.description,
        category: d.category as "strategic" | "budget" | "hr" | "technical" | "operational" | "marketing",
        priority: d.priority as "low" | "medium" | "high" | "critical",
        due_date: d.due_date || null,
        team_id: teamId,
        created_by: user.id,
        owner_id: user.id,
        status: "draft" as const,
      }));

      const { error } = await supabase.from("decisions").insert(rows);
      if (error) throw error;

      setProgress(100);
      toast.success(t("teamImport.importSuccess", { count: selected.length }));

      setTimeout(() => {
        setPhase("upload");
        setDecisions([]);
        setSummary("");
        setFileName("");
      }, 1500);
    } catch (err: any) {
      toast.error(err.message || t("teamImport.importFailed"));
      setPhase("preview");
    }
  };

  const selectedCount = decisions.filter((d) => d.selected).length;

  return (
    <div className="space-y-6">
      {/* Upload Phase */}
      {phase === "upload" && (
        <>
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-border/60 hover:border-primary/50 hover:bg-muted/20"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".csv,.xlsx,.xls,.txt,.tsv,.pdf"
              onChange={handleFileSelect}
            />
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Upload className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold mb-1">{t("teamImport.uploadFile")}</p>
                <p className="text-xs text-muted-foreground">{t("teamImport.uploadDesc")}</p>
              </div>
              <div className="flex gap-3 mt-2">
                {[
                  { icon: FileText, label: "PDF" },
                  { icon: FileSpreadsheet, label: "Excel" },
                  { icon: FileText, label: "CSV" },
                  { icon: FileText, label: "Text" },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-full">
                    <f.icon className="w-3 h-3" />
                    {f.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-border/60 bg-muted/10">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium">{t("teamImport.csvTemplate")}</p>
                <p className="text-[10px] text-muted-foreground">{t("teamImport.csvTemplateDesc")}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1.5">
              <Download className="w-3.5 h-3.5" />
              {t("teamImport.download")}
            </Button>
          </div>

          <div className="rounded-lg border border-border/60 p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              {t("teamImport.howItWorks")}
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { step: "1", title: t("teamImport.step1"), desc: t("teamImport.step1Desc") },
                { step: "2", title: t("teamImport.step2"), desc: t("teamImport.step2Desc") },
                { step: "3", title: t("teamImport.step3"), desc: t("teamImport.step3Desc") },
              ].map((s) => (
                <div key={s.step} className="text-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-2 text-xs font-bold text-primary">
                    {s.step}
                  </div>
                  <p className="text-xs font-medium">{s.title}</p>
                  <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Analyzing Phase */}
      {phase === "analyzing" && (
        <div className="text-center py-16">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold mb-2">{t("teamImport.analyzing", { file: fileName })}</p>
          <p className="text-xs text-muted-foreground mb-4">{t("teamImport.analyzingDesc")}</p>
          <Progress value={progress} className="max-w-xs mx-auto" />
        </div>
      )}

      {/* Preview Phase */}
      {phase === "preview" && (
        <>
          {summary && (
            <div className="flex items-start gap-3 p-4 rounded-lg border border-primary/20 bg-primary/5">
              <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium mb-1">{t("teamImport.aiSummary")}</p>
                <p className="text-xs text-muted-foreground">{summary}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1">
                <FileText className="w-3 h-3" />
                {fileName}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {t("teamImport.selectedOf", { selected: selectedCount, total: decisions.length })}
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setPhase("upload"); setDecisions([]); }}>
                {t("teamImport.cancel")}
              </Button>
              <Button size="sm" onClick={importDecisions} disabled={selectedCount === 0} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                {t("teamImport.importCount", { count: selectedCount })}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {decisions.map((d, i) => (
              <div
                key={i}
                className={`rounded-lg border p-4 transition-all ${
                  d.selected ? "border-primary/30 bg-background" : "border-border/60 bg-muted/20 opacity-60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleDecision(i)}
                    className={`mt-1 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      d.selected ? "bg-primary border-primary text-primary-foreground" : "border-border/60"
                    }`}
                  >
                    {d.selected && <Check className="w-3 h-3" />}
                  </button>
                  <div className="flex-1 min-w-0 space-y-2">
                    <input
                      value={d.title}
                      onChange={(e) => updateDecision(i, "title", e.target.value)}
                      className="w-full text-sm font-medium bg-transparent border-none outline-none focus:ring-0 p-0"
                    />
                    <textarea
                      value={d.description}
                      onChange={(e) => updateDecision(i, "description", e.target.value)}
                      className="w-full text-xs text-muted-foreground bg-transparent border-none outline-none focus:ring-0 p-0 resize-none"
                      rows={2}
                    />
                    <div className="flex items-center gap-2">
                      <Select value={d.category} onValueChange={(v) => updateDecision(i, "category", v)}>
                        <SelectTrigger className="h-7 text-[10px] w-[110px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={d.priority} onValueChange={(v) => updateDecision(i, "priority", v)}>
                        <SelectTrigger className="h-7 text-[10px] w-[90px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITIES.map((p) => (
                            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {d.due_date && (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Clock className="w-3 h-3" />
                          {d.due_date}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeDecision(i)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {decisions.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-3" />
              <p className="text-sm font-medium">{t("teamImport.noDecisions")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("teamImport.noDecisionsHint")}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setPhase("upload")}>
                {t("teamDetail.back")}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Importing Phase */}
      {phase === "importing" && (
        <div className="text-center py-16">
          {progress < 100 ? (
            <>
              <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
              <p className="text-sm font-semibold">{t("teamImport.importing")} {selectedCount}...</p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7 text-success" />
              </div>
              <p className="text-sm font-semibold">{t("teamDetail.importComplete")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("teamDetail.decisionsCreated", { count: selectedCount })}</p>
            </>
          )}
          <Progress value={progress} className="max-w-xs mx-auto mt-4" />
        </div>
      )}
    </div>
  );
};

export default TeamImportTab;
