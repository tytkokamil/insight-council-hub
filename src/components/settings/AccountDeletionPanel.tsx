import { useState } from "react";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AccountDeletionPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    if (!user || confirmText !== "DELETE") return;
    setDeleting(true);

    try {
      const { data, error } = await supabase.functions.invoke("delete-account", {
        body: { confirmation: "DELETE" },
      });

      if (error || !data?.success) {
        toast({
          title: "Fehler",
          description: (data as any)?.error || error?.message || "Account konnte nicht gelöscht werden.",
          variant: "destructive",
        });
        setDeleting(false);
        return;
      }

      // Sign out locally
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (err: any) {
      toast({
        title: "Fehler",
        description: err?.message || "Unbekannter Fehler",
        variant: "destructive",
      });
      setDeleting(false);
    }
  };

  const inputClass =
    "w-full h-9 px-3 rounded-md bg-background border border-input text-sm focus:border-destructive focus:outline-none focus:ring-1 focus:ring-destructive/20 transition-colors";

  return (
    <section className="mt-8 pt-6 border-t-2 border-destructive/20">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-destructive" />
        <h2 className="text-sm font-medium text-destructive">Danger Zone</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Die Löschung deines Accounts ist unwiderruflich. Alle deine Entscheidungen, Aufgaben, Teams und persönlichen Daten werden permanent gelöscht (DSGVO Art. 17).
      </p>

      <AlertDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setConfirmText(""); }}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm" className="gap-2">
            <Trash2 className="w-3.5 h-3.5" />
            Account dauerhaft löschen
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Account unwiderruflich löschen?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Diese Aktion kann <strong>nicht rückgängig</strong> gemacht werden. Folgende Daten werden permanent gelöscht:
              </p>
              <ul className="list-disc list-inside text-xs space-y-1 text-muted-foreground">
                <li>Dein Benutzerprofil und Login</li>
                <li>Alle von dir erstellten Entscheidungen und Aufgaben</li>
                <li>Teams, die du erstellt hast</li>
                <li>Risiken, strategische Ziele und Szenarien</li>
                <li>Benachrichtigungen, gespeicherte Ansichten, KI-Briefings</li>
                <li>Profilbild und gespeicherte Dateien</li>
              </ul>
              <p className="text-xs">
                Audit-Trail-Einträge werden gemäß DSGVO anonymisiert, aber nicht gelöscht (Compliance-Anforderung).
              </p>
              <div className="pt-2">
                <label className="text-xs font-medium block mb-1.5">
                  Tippe <span className="font-mono text-destructive">DELETE</span> zur Bestätigung:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className={inputClass}
                  autoComplete="off"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={confirmText !== "DELETE" || deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Wird gelöscht…
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  Endgültig löschen
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default AccountDeletionPanel;
