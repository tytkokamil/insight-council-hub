import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  decision: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

const DeleteDecisionDialog = ({ decision, open, onOpenChange, onDeleted }: Props) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase
      .from("decisions")
      .delete()
      .eq("id", decision.id);

    if (error) {
      toast.error("Fehler beim Löschen");
    } else {
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
            „{decision?.title}" wird unwiderruflich gelöscht, inklusive aller zugehörigen Kommentare, Reviews und Szenarien.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {deleting ? "Löschen…" : "Endgültig löschen"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteDecisionDialog;
