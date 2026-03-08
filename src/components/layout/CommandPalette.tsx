import { useEffect, useState, lazy, Suspense } from "react";
import { CommandDialog } from "@/components/ui/command";
import { useRecentActions } from "./command-palette/useRecentActions";
import { useCommandActions } from "./command-palette/useCommandActions";
import CommandPaletteContent from "./command-palette/CommandPaletteContent";

const NewDecisionDialog = lazy(() => import("@/components/decisions/NewDecisionDialog"));

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [showNewDecision, setShowNewDecision] = useState(false);
  const { recentActions, trackAction } = useRecentActions();

  const close = () => setOpen(false);

  const actions = useCommandActions({ close, trackAction, setShowNewDecision });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandPaletteContent
          contextActions={actions.contextActions}
          navigationActions={actions.navigationActions}
          decisionActions={actions.decisionActions}
          reviewActions={actions.reviewActions}
          teamActions={actions.teamActions}
          settingsActions={actions.settingsActions}
          decisionItems={actions.decisionItems}
          taskItems={actions.taskItems}
          riskItems={actions.riskItems}
          recentActions={recentActions}
        />
      </CommandDialog>

      {showNewDecision && (
        <Suspense fallback={null}>
          <NewDecisionDialog open={showNewDecision} onOpenChange={setShowNewDecision} onCreated={() => setShowNewDecision(false)} />
        </Suspense>
      )}
    </>
  );
};

export default CommandPalette;
