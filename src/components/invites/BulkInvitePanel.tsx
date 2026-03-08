import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Send, Copy, CheckCircle2, Loader2, AlertTriangle, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props {
  teamId?: string;
  teamName?: string;
  orgSlug?: string;
}

const BulkInvitePanel = ({ teamId, teamName, orgSlug }: Props) => {
  const { user } = useAuth();
  const [emails, setEmails] = useState("");
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<{ email: string; success: boolean; message: string }[]>([]);
  const [copied, setCopied] = useState(false);

  const inviteLink = `${window.location.origin}/auth${orgSlug ? `?org=${orgSlug}` : ""}`;

  const parseEmails = (input: string): string[] => {
    return input
      .split(/[,;\n]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  };

  const parsedEmails = parseEmails(emails);
  const hasInvalidEntries = emails.trim().length > 0 && parsedEmails.length === 0;

  const handleBulkInvite = async () => {
    if (!user || parsedEmails.length === 0) return;
    setSending(true);
    const newResults: typeof results = [];

    for (const email of parsedEmails) {
      try {
        const { error } = await supabase.functions.invoke("send-team-invite", {
          body: {
            email,
            teamId: teamId || null,
            teamName: teamName || "Decivio",
          },
        });
        newResults.push({
          email,
          success: !error,
          message: error ? "Fehler beim Senden" : "Einladung gesendet",
        });
      } catch {
        newResults.push({ email, success: false, message: "Fehler" });
      }
    }

    setResults(newResults);
    const successCount = newResults.filter((r) => r.success).length;
    if (successCount > 0) {
      toast.success(`${successCount} Einladung${successCount > 1 ? "en" : ""} gesendet`);
    }
    setSending(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Bulk Email Input */}
      <div className="border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Gesamtes Team auf einmal einladen</h3>
        </div>

        <div>
          <Textarea
            value={emails}
            onChange={(e) => { setEmails(e.target.value); setResults([]); }}
            placeholder="max@firma.com, anna@firma.com, peter@firma.com"
            rows={3}
            className="resize-none text-sm"
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-[11px] text-muted-foreground">
              {parsedEmails.length > 0
                ? `${parsedEmails.length} E-Mail${parsedEmails.length > 1 ? "-Adressen" : "-Adresse"} erkannt`
                : "E-Mail-Adressen kommagetrennt, semikolongetrennt oder zeilenweise eingeben"}
            </p>
            {hasInvalidEntries && (
              <span className="text-[11px] text-destructive flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Keine gültigen E-Mails
              </span>
            )}
          </div>
        </div>

        <Button
          onClick={handleBulkInvite}
          disabled={sending || parsedEmails.length === 0}
          className="gap-1.5 w-full"
        >
          {sending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          {parsedEmails.length > 0
            ? `${parsedEmails.length} Einladung${parsedEmails.length > 1 ? "en" : ""} senden`
            : "Einladungen senden"}
        </Button>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {results.map((r) => (
              <div key={r.email} className="flex items-center gap-2 text-xs">
                {r.success ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
                )}
                <span className="truncate">{r.email}</span>
                <span className="text-muted-foreground ml-auto shrink-0">{r.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Org Invite Link */}
      <div className="border border-border rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Oder Link teilen</h3>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border border-border">
          <code className="text-[11px] font-mono flex-1 truncate text-muted-foreground">{inviteLink}</code>
          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={copyLink}>
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Empty State Nudge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="p-4 rounded-xl bg-destructive/[0.03] border border-destructive/10 text-center"
      >
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Noch niemand eingeladen?</span>
          {" "}Entscheidungen ohne Reviewer blockieren alles. Teams mit 3+ Mitgliedern entscheiden 67% schneller.
        </p>
      </motion.div>
    </div>
  );
};

export default BulkInvitePanel;
