import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Paperclip, Upload, Download, Trash2, Loader2, FileText, Image, FileSpreadsheet, Presentation, File } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string;
  created_at: string;
}

interface Props {
  decisionId: string;
  orgId: string | null;
  profileMap: Record<string, string>;
}

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
  "image/webp",
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

function getFileIcon(type: string | null) {
  if (!type) return <File className="w-4 h-4 text-muted-foreground" />;
  if (type === "application/pdf") return <FileText className="w-4 h-4 text-destructive" />;
  if (type.startsWith("image/")) return <Image className="w-4 h-4 text-primary" />;
  if (type.includes("spreadsheet")) return <FileSpreadsheet className="w-4 h-4 text-success" />;
  if (type.includes("presentation")) return <Presentation className="w-4 h-4 text-warning" />;
  if (type.includes("word")) return <FileText className="w-4 h-4 text-primary" />;
  return <File className="w-4 h-4 text-muted-foreground" />;
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const DecisionAttachmentsPanel = ({ decisionId, orgId, profileMap }: Props) => {
  const { user } = useAuth();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("decision_attachments")
      .select("*")
      .eq("decision_id", decisionId)
      .order("created_at", { ascending: false });
    if (data) setAttachments(data);
    setLoading(false);
  }, [decisionId]);

  useEffect(() => { load(); }, [load]);

  const uploadFile = async (file: globalThis.File) => {
    if (!user) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Dateityp nicht erlaubt. Erlaubt: PDF, DOCX, XLSX, PPTX, PNG, JPG");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Datei zu groß. Maximal 25 MB.");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop() || "bin";
    const storagePath = `${orgId || "default"}/${decisionId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("decision-attachments")
      .upload(storagePath, file);

    if (uploadError) {
      toast.error("Upload fehlgeschlagen: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("decision-attachments")
      .getPublicUrl(storagePath);

    const { error: dbError } = await supabase.from("decision_attachments").insert({
      decision_id: decisionId,
      file_name: file.name,
      file_url: storagePath,
      file_type: file.type,
      file_size: file.size,
      uploaded_by: user.id,
    });

    if (dbError) {
      toast.error("Fehler beim Speichern: " + dbError.message);
    } else {
      // Audit trail
      await supabase.from("audit_logs").insert({
        decision_id: decisionId,
        user_id: user.id,
        action: "attachment_uploaded",
        new_value: file.name,
      });
      toast.success(`"${file.name}" hochgeladen`);
      load();
    }
    setUploading(false);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(uploadFile);
  };

  const handleDownload = async (att: Attachment) => {
    const { data, error } = await supabase.storage
      .from("decision-attachments")
      .createSignedUrl(att.file_url, 3600); // 60 min

    if (error || !data?.signedUrl) {
      toast.error("Download-Link konnte nicht erstellt werden.");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const handleDelete = async (att: Attachment) => {
    if (!confirm(`"${att.file_name}" löschen?`)) return;

    await supabase.storage.from("decision-attachments").remove([att.file_url]);
    await supabase.from("decision_attachments").delete().eq("id", att.id);

    if (user) {
      await supabase.from("audit_logs").insert({
        decision_id: decisionId,
        user_id: user.id,
        action: "attachment_deleted",
        old_value: att.file_name,
      });
    }

    toast.success(`"${att.file_name}" gelöscht`);
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-muted-foreground" /> Anhänge
          {attachments.length > 0 && (
            <Badge variant="outline" className="text-[10px]">{attachments.length}</Badge>
          )}
        </p>
      </div>

      {/* Drop zone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-colors cursor-pointer ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.docx,.xlsx,.pptx,.png,.jpg,.jpeg,.webp"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Wird hochgeladen…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 py-1">
            <Upload className="w-5 h-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Dateien hierher ziehen oder <span className="text-primary font-medium">auswählen</span>
            </p>
            <p className="text-[10px] text-muted-foreground/60">
              PDF, DOCX, XLSX, PPTX, PNG, JPG · max. 25 MB
            </p>
          </div>
        )}
      </div>

      {/* Attachment list */}
      {loading ? (
        <div className="flex justify-center py-3">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : attachments.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">Keine Anhänge</p>
      ) : (
        <div className="space-y-1.5">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-3 p-2.5 rounded-lg border border-border/40 bg-card hover:bg-muted/20 transition-colors group"
            >
              {getFileIcon(att.file_type)}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{att.file_name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {formatSize(att.file_size)} · {profileMap[att.uploaded_by] || "—"} · {format(new Date(att.created_at), "dd.MM.yy", { locale: de })}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  onClick={(e) => { e.stopPropagation(); handleDownload(att); }}
                >
                  <Download className="w-3.5 h-3.5" />
                </Button>
                {user && (att.uploaded_by === user.id) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); handleDelete(att); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DecisionAttachmentsPanel;
