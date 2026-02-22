import { motion } from "framer-motion";
import { Download, X, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";

interface DecisionBulkActionsProps {
  selectedCount: number;
  statusOptions: { value: string; label: string }[];
  teams: { id: string; name: string }[];
  teamMap: Record<string, string>;
  onBulkStatus: (status: string) => void;
  onBulkTeam: (teamId: string | null) => void;
  onExportSelected: () => void;
  onClear: () => void;
}

const DecisionBulkActions = ({
  selectedCount, statusOptions, teams, onBulkStatus, onBulkTeam, onExportSelected, onClear,
}: DecisionBulkActionsProps) => {
  const { t } = useTranslation();

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      className="flex items-center gap-3 p-3 mb-3 rounded-lg bg-primary/5 border border-primary/20">
      <span className="text-xs font-semibold text-primary">{t("decisions.selected", { count: selectedCount })}</span>
      <Separator orientation="vertical" className="h-4" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="text-xs h-7">{t("decisions.setStatus")}</Button></DropdownMenuTrigger>
        <DropdownMenuContent>
          {statusOptions.map(s => (
            <DropdownMenuItem key={s.value} onClick={() => onBulkStatus(s.value)}>{s.label}</DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {teams.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="text-xs h-7 gap-1.5"><UserPlus className="w-3 h-3" /> {t("decisions.assignTeam")}</Button></DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onBulkTeam(null)}>{t("common.personal")}</DropdownMenuItem>
            <DropdownMenuSeparator />
            {teams.map(t => (
              <DropdownMenuItem key={t.id} onClick={() => onBulkTeam(t.id)}>{t.name}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <Button variant="outline" size="sm" className="text-xs h-7 gap-1.5 text-warning hover:text-warning" onClick={() => onBulkStatus("archived")}>
        {t("decisions.archive")}
      </Button>
      <Button variant="outline" size="sm" className="text-xs h-7 gap-1.5" onClick={onExportSelected}>
        <Download className="w-3 h-3" /> {t("decisions.exportSelected")}
      </Button>
      <Button variant="ghost" size="sm" className="text-xs h-7 ml-auto" onClick={onClear}>
        <X className="w-3 h-3 mr-1" /> {t("decisions.clearSelection")}
      </Button>
    </motion.div>
  );
};

export default DecisionBulkActions;
