import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Clock, Sparkles } from "lucide-react";
import {
  CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import type { CommandAction, RecentAction } from "./types";
import { formatDistanceToNow } from "date-fns";
import { de, enUS } from "date-fns/locale";

interface Props {
  contextActions: CommandAction[];
  navigationActions: CommandAction[];
  decisionActions: CommandAction[];
  reviewActions: CommandAction[];
  teamActions: CommandAction[];
  settingsActions: CommandAction[];
  decisionItems: CommandAction[];
  taskItems: CommandAction[];
  riskItems: CommandAction[];
  recentActions: RecentAction[];
}

const groupConfig: Record<string, { heading: string; headingKey: string }> = {
  context: { heading: "Kontextaktionen", headingKey: "cmd.contextActions" },
  "recent-actions": { heading: "Letzte Aktionen", headingKey: "cmd.recentActions" },
  decisions: { heading: "Entscheidungen", headingKey: "cmd.decisionActions" },
  reviews: { heading: "Reviews", headingKey: "cmd.reviews" },
  team: { heading: "Team", headingKey: "cmd.teamActions" },
  navigation: { heading: "Navigation", headingKey: "cmd.pages" },
  settings: { heading: "Einstellungen", headingKey: "cmd.settingsActions" },
};

const ActionItem = ({ action }: { action: CommandAction }) => (
  <CommandItem
    key={action.id}
    value={`${action.label} ${action.keywords || ""}`}
    onSelect={action.onSelect}
    className="gap-2.5"
  >
    <action.icon className={`w-4 h-4 shrink-0 ${action.color || "text-muted-foreground"}`} />
    <span className="flex-1 truncate">{action.label}</span>
    {action.shortcut && (
      <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border/60 text-muted-foreground font-mono">
        {action.shortcut}
      </kbd>
    )}
  </CommandItem>
);

const CommandPaletteContent = ({
  contextActions, navigationActions, decisionActions, reviewActions,
  teamActions, settingsActions, decisionItems, taskItems, riskItems, recentActions,
}: Props) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "de" ? de : enUS;

  const renderGroup = (actions: CommandAction[], heading: string, showSeparator = true) => {
    if (actions.length === 0) return null;
    return (
      <>
        {showSeparator && <CommandSeparator />}
        <CommandGroup heading={heading}>
          {actions.map(a => <ActionItem key={a.id} action={a} />)}
        </CommandGroup>
      </>
    );
  };

  return (
    <>
      <CommandInput placeholder={t("cmd.placeholder")} />
      <CommandList className="max-h-[420px]">
        <CommandEmpty>{t("cmd.noResults")}</CommandEmpty>

        {/* Context actions (route-aware) */}
        {contextActions.length > 0 && (
          <CommandGroup heading={
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-primary" />
              Kontextaktionen
            </span>
          }>
            {contextActions.map(a => <ActionItem key={a.id} action={a} />)}
          </CommandGroup>
        )}

        {/* Recent actions */}
        {recentActions.length > 0 && (
          <>
            {contextActions.length > 0 && <CommandSeparator />}
            <CommandGroup heading="Letzte Aktionen">
              {recentActions.map((ra, i) => (
                <CommandItem key={`recent-${i}`} className="gap-2.5 text-muted-foreground" disabled>
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1 truncate text-xs">{ra.label}</span>
                  <span className="text-[10px]">
                    {formatDistanceToNow(ra.timestamp, { addSuffix: true, locale })}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Quick actions: decisions + tasks */}
        {renderGroup(decisionActions, t("cmd.quickActions"), contextActions.length > 0 || recentActions.length > 0)}

        {/* Reviews */}
        {renderGroup(reviewActions, "Reviews")}

        {/* Team */}
        {renderGroup(teamActions, "Team")}

        {/* Settings */}
        {renderGroup(settingsActions, "Einstellungen")}

        {/* Navigation */}
        {renderGroup(navigationActions, t("cmd.pages"))}

        {/* Searchable items */}
        {decisionItems.length > 0 && renderGroup(decisionItems, t("cmd.decisions"))}
        {taskItems.length > 0 && renderGroup(taskItems, t("cmd.tasks"))}
        {riskItems.length > 0 && renderGroup(riskItems, t("cmd.risks"))}
      </CommandList>
    </>
  );
};

export default CommandPaletteContent;
