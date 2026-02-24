import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { EventTypes } from "@/lib/eventTaxonomy";
import { useTranslation } from "react-i18next";

interface Props {
  decision: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

const DeleteDecisionDialog = ({ decision, open, onOpenChange, onDeleted }: Props) => {
  const { t } = useTranslation();
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();

  const handleDelete = async () => {
    if (!user) return;
    setDeleting(true);

    const { error } = await supabase
      .from("decisions")
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq("id", decision.id);

    if (error) {
      toast.error(t("decisions.delete.error"));
    } else {
      await supabase.from("audit_logs").insert({
        decision_id: decision.id,
        user_id: user.id,
        action: EventTypes.DECISION_DELETED,
        field_name: "deleted_at",
        old_value: null,
        new_value: new Date().toISOString(),
      });
      toast.success(t("decisions.delete.success"));
      onDeleted();
      onOpenChange(false);
    }
    setDeleting(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("decisions.delete.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("decisions.delete.description", { title: decision?.title })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>{t("decisions.delete.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {deleting ? t("decisions.delete.deleting") : t("decisions.delete.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteDecisionDialog;
