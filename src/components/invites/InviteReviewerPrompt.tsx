import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props {
  decisionId: string;
  decisionTitle: string;
  costPerDay?: number | null;
  trigger: "first_decision" | "cod_running" | "sla_warning";
  onDismiss: () => void;
  onInvited?: () => void;
}

const triggerConfig = {
  first_decision: {
    title: "Wer soll diese Entscheidung genehmigen?",
    subtitle: "Laden Sie einen Kollegen als Reviewer ein — direkt per E-Mail.",
    cta: "Als Reviewer einladen",
    placeholder: "kollege@firma.com",
  },
  cod_running: {
    title: "Der Zähler läuft. Wen sollen wir erinnern?",
    subtitle: "Senden Sie eine Erinnerung mit One-Click Approval per E-Mail.",
    cta: "Erinnerung senden",
    placeholder: "reviewer@firma.com",
  },
  sla_warning: {
    title: "Deadline rückt näher — Reviewer einladen",
    subtitle: "Laden Sie jemanden ein, der diese Entscheidung beschleunigen kann.",
    cta: "Jetzt einladen",
    placeholder: "entscheider@firma.com",
  },
};

const InviteReviewerPrompt = ({ decisionId, decisionTitle, costPerDay, trigger, onDismiss, onInvited }: Props) => {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const config = triggerConfig[trigger];

  const handleInvite = async () => {
    if (!email.trim() || !user) return;
    setSending(true);

    try {
      // Get inviter name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, org_id")
        .eq("user_id", user.id)
        .single();

      const inviterName = profile?.full_name || user.email || "Ein Kollege";

      // Get org info for the invite link
      let orgSlug = "";
      if (profile?.org_id) {
        const { data: org } = await supabase
          .from("organizations")
          .select("slug, name")
          .eq("id", profile.org_id)
          .single();
        orgSlug = org?.slug || "";
      }

      // Create contextual invite link
      const inviteParams = new URLSearchParams({
        invite: "context",
        decision: decisionId,
        from: inviterName,
        ...(orgSlug && { org: orgSlug }),
      });
      const inviteUrl = `${window.location.origin}/auth?${inviteParams.toString()}`;

      // Try to add as reviewer if user exists, otherwise send team invite
      const { error } = await supabase.functions.invoke("send-team-invite", {
        body: {
          email: email.trim().toLowerCase(),
          teamId: null, // Will create org-level invite
          teamName: "Decivio",
          contextDecisionId: decisionId,
          contextDecisionTitle: decisionTitle,
          costPerDay: costPerDay || 0,
          inviteUrl,
        },
      });

      if (error) throw error;

      toast.success(`Einladung an ${email} gesendet`);
      onInvited?.();
      onDismiss();
    } catch (err) {
      toast.error("Einladung konnte nicht gesendet werden");
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="relative border border-primary/20 bg-primary/[0.03] rounded-xl p-5"
      >
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 w-6 h-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <UserPlus className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{config.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{config.subtitle}</p>
          </div>
        </div>

        {costPerDay && costPerDay > 0 && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-destructive/5 border border-destructive/10">
            <p className="text-xs text-destructive font-medium">
              ⏱ Verzögerungskosten: {costPerDay.toLocaleString("de-DE")} € / Tag
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={config.placeholder}
            className="h-9 text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
          />
          <Button
            size="sm"
            onClick={handleInvite}
            disabled={sending || !email.trim()}
            className="gap-1.5 shrink-0"
          >
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {config.cta}
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground mt-2">
          Der Eingeladene erhält eine E-Mail mit direktem Link zu dieser Entscheidung.
        </p>
      </motion.div>
    </AnimatePresence>
  );
};

export default InviteReviewerPrompt;
