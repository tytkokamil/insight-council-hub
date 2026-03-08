import { useState, useEffect, useRef, useCallback } from "react";
import { Zap, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface QuickCaptureButtonProps {
  className?: string;
}

const QuickCaptureButton = ({ className }: QuickCaptureButtonProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [assignee, setAssignee] = useState("");
  const [profiles, setProfiles] = useState<{ user_id: string; full_name: string | null }[]>([]);
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  // Load profiles for assignee dropdown
  useEffect(() => {
    supabase.from("profiles").select("user_id, full_name").then(({ data }) => {
      if (data) setProfiles(data);
    });
  }, []);

  // Set default assignee to current user
  useEffect(() => {
    if (user && !assignee) setAssignee(user.id);
  }, [user, assignee]);

  // Keyboard shortcut: N key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Auto-focus on open
  useEffect(() => {
    if (open) setTimeout(() => titleRef.current?.focus(), 100);
  }, [open]);

  const setQuickDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().split("T")[0]);
  };

  const handleSubmit = useCallback(async (asDraft: boolean) => {
    if (!user || !title.trim()) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.from("decisions").insert({
        title: title.trim(),
        status: asDraft ? "draft" : "draft",
        priority: "medium",
        category: "operational",
        due_date: dueDate,
        created_by: user.id,
        owner_id: user.id,
        assignee_id: assignee || user.id,
      } as any).select("id").single();

      if (error) throw error;

      setOpen(false);
      setTitle("");
      queryClient.invalidateQueries({ queryKey: ["decisions"] });

      toast.success("Entscheidung angelegt ✓", {
        description: data?.id ? "Details vervollständigen →" : undefined,
        action: data?.id ? {
          label: "Öffnen",
          onClick: () => window.location.href = `/decisions/${data.id}`,
        } : undefined,
      });
    } catch (e: any) {
      toast.error("Fehler beim Speichern", { description: e.message });
    }
    setSaving(false);
  }, [user, title, dueDate, assignee, queryClient]);

  // Handle Enter to submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && title.trim()) {
      e.preventDefault();
      handleSubmit(false);
    }
    if (e.key === "Escape") setOpen(false);
  };

  // Don't show FAB if a modal is open (check for dialog/modal in DOM)
  const isModalOpen = typeof document !== "undefined" && document.querySelector("[role='dialog']");

  return (
    <>
      {/* Floating Action Button */}
      {!open && !isModalOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.08 }}
          className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-glow flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-all md:bottom-6 bottom-20 ${className || ""}`}
          onClick={() => setOpen(true)}
          title="Schnell erfassen (N)"
        >
          <Zap className="w-6 h-6" />
        </motion.button>
      )}

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[4px]"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="fixed inset-0 z-[101] flex items-center justify-center p-4"
              onKeyDown={handleKeyDown}
            >
              <div className="w-full max-w-[480px] bg-card border border-border rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Schnell erfassen
                  </h2>
                  <span className="text-xs text-muted-foreground">ESC zum Schließen</span>
                </div>

                {/* Form */}
                <div className="px-6 py-5 space-y-5">
                  {/* Field 1: Title */}
                  <div>
                    <label className="text-sm font-bold text-foreground">Was muss entschieden werden?</label>
                    <input
                      ref={titleRef}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="z.B. Cloud-Anbieter für Produktion auswählen"
                      className="w-full h-[52px] mt-2 px-4 text-base rounded-lg bg-background border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                    />
                  </div>

                  {/* Field 2: Due Date */}
                  <div>
                    <label className="text-sm font-bold text-foreground">Bis wann?</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full h-12 mt-2 px-4 rounded-lg bg-background border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                    />
                    <div className="flex gap-2 mt-2">
                      {[
                        { label: "3 Tage", days: 3 },
                        { label: "1 Woche", days: 7 },
                        { label: "2 Wochen", days: 14 },
                      ].map(({ label, days }) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => setQuickDate(days)}
                          className="px-3 py-1 text-xs rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Field 3: Assignee */}
                  <div>
                    <label className="text-sm font-bold text-foreground">Wer entscheidet?</label>
                    <select
                      value={assignee}
                      onChange={(e) => setAssignee(e.target.value)}
                      className="w-full h-12 mt-2 px-4 rounded-lg bg-background border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                    >
                      {profiles.map((p) => (
                        <option key={p.user_id} value={p.user_id}>
                          {p.full_name || p.user_id.slice(0, 8)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 px-6 py-4 border-t border-border">
                  <Button
                    variant="outline"
                    className="flex-1 h-12"
                    onClick={() => handleSubmit(true)}
                    disabled={saving || !title.trim()}
                  >
                    Als Entwurf speichern
                  </Button>
                  <Button
                    className="flex-1 h-12"
                    onClick={() => handleSubmit(false)}
                    disabled={saving || !title.trim()}
                  >
                    {saving ? "Wird gespeichert..." : "Entscheidung anlegen"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default QuickCaptureButton;
