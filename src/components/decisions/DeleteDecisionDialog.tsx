import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { EventTypes } from "@/lib/eventTaxonomy";

interface Props {
  decision: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

const DeleteDecisionDialog = ({ decision, open, onOpenChange, onDeleted }: Props) => {
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();

  const handleDelete = async () => {
    if (!user) return;
    setDeleting(true);

    // Soft delete: set deleted_at timestamp instead of removing the row
    const { error } = await supabase
      .from("decisions")
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq("id", decision.id);

    if (error) {
      toast.error("Fehler beim Löschen");
    } else {
      // Audit log with standardized event
      await supabase.from("audit_logs").insert({
        decision_id: decision.id,
        user_id: user.id,
        action: EventTypes.DECISION_DELETED,
        field_name: "deleted_at",
        old_value: null,
        new_value: new Date().toISOString(),
      });
      toast.success("Entscheidung gelöscht");
      onDeleted();
      onOpenChange(false);
    }
    setDeleting(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Entscheidung löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            „{decision?.title}" wird in den Papierkorb verschoben. Die Entscheidung kann im Archiv wiederhergestellt werden. Audit-Einträge bleiben dauerhaft erhalten.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {deleting ? "Löschen…" : "In Papierkorb verschieben"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteDecisionDialog;
