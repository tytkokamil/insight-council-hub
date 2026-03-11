import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, X, Trash2 } from "lucide-react";
import { toast } from "sonner";

const DemoBanner = () => {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const check = async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("org_id")
          .eq("user_id", user.id)
          .single();
        if (!profile?.org_id || cancelled) return;

        // Check if org has demo decisions
        const { count: demoCount } = await supabase
          .from("decisions")
          .select("id", { count: "exact", head: true })
          .eq("org_id", profile.org_id)
          .eq("is_demo", true as any);

        // Check if org has real (non-demo) decisions
        const { count: realCount } = await supabase
          .from("decisions")
          .select("id", { count: "exact", head: true })
          .eq("org_id", profile.org_id)
          .eq("is_demo", false as any);

        if (!cancelled) {
          // Show banner when demo data exists AND no real decisions yet
          setVisible((demoCount ?? 0) > 0 && (realCount ?? 0) === 0);
        }
      } catch {
        // silently fail
      }
    };

    check();
    return () => { cancelled = true; };
  }, [user]);

  const handleDeleteDemo = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("user_id", user.id)
        .single();
      if (!profile?.org_id) return;

      await supabase
        .from("decisions")
        .delete()
        .eq("org_id", profile.org_id)
        .eq("is_demo", true as any);

      toast.success("Beispieldaten wurden gelöscht");
      setVisible(false);
    } catch {
      toast.error("Fehler beim Löschen");
    } finally {
      setDeleting(false);
    }
  };

  if (!visible || dismissed) return null;

  return (
    <div className="relative flex items-center gap-3 px-4 py-3 rounded-lg border border-blue-700/50 bg-blue-950/80 text-blue-200 mb-4">
      <Sparkles className="w-5 h-5 text-blue-400 shrink-0" />
      <p className="text-sm flex-1">
        <span className="font-medium text-blue-100">Das sind Beispieldaten</span>{" "}
        damit du Decivio sofort ausprobieren kannst. Jederzeit löschbar.
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-300 hover:text-red-300 hover:bg-red-950/30 h-8 gap-1.5"
          onClick={handleDeleteDemo}
          disabled={deleting}
        >
          <Trash2 className="w-3.5 h-3.5" />
          {deleting ? "…" : "Löschen"}
        </Button>
        <Button
          asChild
          size="sm"
          className="bg-blue-600 hover:bg-blue-500 text-white h-8"
        >
          <Link to="/decisions/new">Eigene Entscheidung →</Link>
        </Button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded hover:bg-blue-800/50 text-blue-400 hover:text-blue-200 transition-colors"
          aria-label="Banner schließen"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default DemoBanner;
