import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const MOD = isMac ? "⌘" : "Ctrl";

interface Shortcut { keys: string[]; label: string }
interface ShortcutGroup { title: string; shortcuts: Shortcut[] }

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Global",
    shortcuts: [
      { keys: [MOD, "K"], label: "Command Palette öffnen" },
      { keys: ["?"], label: "Tastaturkürzel anzeigen" },
      { keys: ["N"], label: "Neue Entscheidung" },
      { keys: ["."], label: "Schnell-Erfassen" },
    ],
  },
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["G", "D"], label: "Dashboard" },
      { keys: ["G", "E"], label: "Entscheidungen" },
      { keys: ["G", "T"], label: "Teams" },
      { keys: ["G", "A"], label: "Analytics" },
      { keys: ["G", "S"], label: "Einstellungen" },
      { keys: ["G", "K"], label: "Kalender" },
    ],
  },
  {
    title: "Entscheidungen",
    shortcuts: [
      { keys: ["J"], label: "Nächste Entscheidung" },
      { keys: ["K"], label: "Vorherige Entscheidung" },
      { keys: ["Enter"], label: "Entscheidung öffnen" },
      { keys: ["E"], label: "Bearbeiten" },
    ],
  },
];

const NAV_MAP: Record<string, string> = {
  "g+d": "/dashboard",
  "g+e": "/decisions",
  "g+t": "/teams",
  "g+a": "/analytics",
  "g+s": "/settings",
  "g+k": "/calendar",
};

const KeyPill = ({ k }: { k: string }) => (
  <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-md bg-muted border border-border text-[11px] font-mono font-medium text-muted-foreground">
    {k}
  </kbd>
);

export const useKeyboardShortcuts = () => {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const navigate = useNavigate();
  const [pendingG, setPendingG] = useState(false);

  useEffect(() => {
    let gTimer: ReturnType<typeof setTimeout>;

    const handler = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const isInput = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || (el as HTMLElement)?.isContentEditable;
      if (isInput) return;

      // ? key → show shortcuts
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      // G + second key navigation
      if (e.key === "g" && !e.ctrlKey && !e.metaKey && !pendingG) {
        setPendingG(true);
        gTimer = setTimeout(() => setPendingG(false), 1000);
        return;
      }

      if (pendingG) {
        const combo = `g+${e.key.toLowerCase()}`;
        const target = NAV_MAP[combo];
        if (target) {
          e.preventDefault();
          navigate(target);
        }
        setPendingG(false);
        clearTimeout(gTimer);
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      clearTimeout(gTimer);
    };
  }, [navigate, pendingG]);

  return { shortcutsOpen, setShortcutsOpen };
};

const KeyboardShortcutsModal = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Tastaturkürzel</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-2">
          {SHORTCUT_GROUPS.map(group => (
            <div key={group.title}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group.title}</h3>
              <div className="space-y-1.5">
                {group.shortcuts.map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-foreground">{s.label}</span>
                    <div className="flex items-center gap-1">
                      {s.keys.map((k, ki) => (
                        <KeyPill key={ki} k={k} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutsModal;
