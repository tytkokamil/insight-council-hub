import { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, MessageSquare, ThumbsUp, Check, Loader2, Rocket, Code2, Puzzle, ShieldCheck, Sparkles, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Status = "considering" | "planned" | "in_progress" | "released" | "rejected";
type Category = "feature" | "improvement" | "integration" | "compliance";

interface RoadmapItem {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  category: Category | null;
  vote_count: number;
  planned_quarter: string | null;
  released_at: string | null;
  created_at: string;
}

const statusColumns: { key: Status[]; label: string; accent: string }[] = [
  { key: ["considering", "planned"], label: "Geplant", accent: "text-warning" },
  { key: ["in_progress"], label: "In Entwicklung", accent: "text-primary" },
  { key: ["released"], label: "Veröffentlicht", accent: "text-accent-teal" },
];

const categoryConfig: Record<Category, { label: string; icon: React.ReactNode; className: string }> = {
  feature: { label: "Feature", icon: <Sparkles className="w-3 h-3" />, className: "bg-primary/10 text-primary border-primary/20" },
  improvement: { label: "Verbesserung", icon: <Rocket className="w-3 h-3" />, className: "bg-accent-teal/10 text-accent-teal border-accent-teal/20" },
  integration: { label: "Integration", icon: <Puzzle className="w-3 h-3" />, className: "bg-warning/10 text-warning border-warning/20" },
  compliance: { label: "Compliance", icon: <ShieldCheck className="w-3 h-3" />, className: "bg-muted text-muted-foreground border-border" },
};

const Roadmap = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [votedItems, setVotedItems] = useState<Set<string>>(new Set());
  const [votingItemId, setVotingItemId] = useState<string | null>(null);
  const [voteEmail, setVoteEmail] = useState("");
  const [submittingVote, setSubmittingVote] = useState(false);
  const [showVoteDialog, setShowVoteDialog] = useState(false);

  // Load items
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("roadmap_items" as any)
        .select("*")
        .neq("status", "rejected")
        .order("vote_count", { ascending: false });
      if (data) setItems(data as any);
      setLoading(false);
    };
    load();
  }, []);

  // Load user's votes
  useEffect(() => {
    const email = user?.email;
    if (!email) {
      // Check localStorage for anonymous votes
      const stored = localStorage.getItem("roadmap_votes");
      if (stored) {
        try { setVotedItems(new Set(JSON.parse(stored))); } catch {}
      }
      return;
    }
    supabase
      .from("roadmap_votes" as any)
      .select("item_id")
      .eq("voter_email", email)
      .then(({ data }) => {
        if (data) setVotedItems(new Set(data.map((v: any) => v.item_id)));
      });
  }, [user]);

  const handleVoteClick = (itemId: string) => {
    if (votedItems.has(itemId)) return;
    if (user?.email) {
      submitVote(itemId, user.email);
    } else {
      setVotingItemId(itemId);
      setVoteEmail("");
      setShowVoteDialog(true);
    }
  };

  const submitVote = async (itemId: string, email: string) => {
    setSubmittingVote(true);
    try {
      const { error } = await supabase
        .from("roadmap_votes" as any)
        .insert({ item_id: itemId, voter_email: email } as any);

      if (error) {
        if (error.code === "23505") {
          toast.info("Sie haben bereits abgestimmt.");
        } else {
          toast.error("Fehler beim Abstimmen.");
        }
        setSubmittingVote(false);
        return;
      }

      // Update local state
      setVotedItems(prev => {
        const next = new Set(prev);
        next.add(itemId);
        if (!user) localStorage.setItem("roadmap_votes", JSON.stringify([...next]));
        return next;
      });
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, vote_count: i.vote_count + 1 } : i));
      toast.success("Stimme gezählt! Sie werden benachrichtigt, wenn dieses Feature live geht.");
      setShowVoteDialog(false);
    } catch {
      toast.error("Fehler beim Abstimmen.");
    }
    setSubmittingVote(false);
  };

  const handleEmailVote = () => {
    if (!votingItemId || !voteEmail) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(voteEmail)) {
      toast.error("Bitte geben Sie eine gültige E-Mail-Adresse ein.");
      return;
    }
    submitVote(votingItemId, voteEmail.trim().toLowerCase());
  };

  const grouped = useMemo(() => {
    return statusColumns.map(col => ({
      ...col,
      items: items.filter(i => (col.key as string[]).includes(i.status)).sort((a, b) => b.vote_count - a.vote_count),
    }));
  }, [items]);

  return (
    <>
      <Helmet>
        <title>Roadmap — Decivio</title>
        <meta name="description" content="Was wir als nächstes bauen. Stimmen Sie für Features ab und gestalten Sie Decivio mit." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/30 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-lg font-bold tracking-tight">Produkt-Roadmap</h1>
                <p className="text-xs text-muted-foreground">Stimmen Sie ab und gestalten Sie die Zukunft von Decivio mit.</p>
              </div>
            </div>
            <a href="mailto:feedback@decivio.com">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <MessageSquare className="w-3.5 h-3.5" />
                Feature vorschlagen
              </Button>
            </a>
          </div>
        </header>

        {/* Main */}
        <main className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <Code2 className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Die Roadmap wird gerade vorbereitet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {grouped.map((col, ci) => (
                <div key={ci}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`w-2 h-2 rounded-full ${ci === 0 ? "bg-warning" : ci === 1 ? "bg-primary" : "bg-accent-teal"}`} />
                    <h2 className={`text-sm font-semibold ${col.accent}`}>{col.label}</h2>
                    <span className="text-xs text-muted-foreground ml-auto">{col.items.length}</span>
                  </div>

                  <div className="space-y-3">
                    <AnimatePresence>
                      {col.items.map((item, i) => {
                        const cat = item.category ? categoryConfig[item.category] : null;
                        const hasVoted = votedItems.has(item.id);
                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03, duration: 0.3 }}
                            className="border border-border/40 rounded-xl p-4 bg-card hover:border-foreground/10 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="text-sm font-semibold leading-snug">{item.title}</h3>
                              {cat && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap shrink-0 ${cat.className}`}>
                                  {cat.icon}
                                  {cat.label}
                                </span>
                              )}
                            </div>

                            {item.description && (
                              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{item.description}</p>
                            )}

                            {item.planned_quarter && (
                              <p className="text-[10px] text-muted-foreground mb-2">{item.planned_quarter}</p>
                            )}

                            <button
                              onClick={() => handleVoteClick(item.id)}
                              disabled={hasVoted}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                hasVoted
                                  ? "bg-primary/10 text-primary border border-primary/20 cursor-default"
                                  : "bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground border border-border hover:border-primary/20"
                              }`}
                            >
                              {hasVoted ? <Check className="w-3.5 h-3.5" /> : <ThumbsUp className="w-3.5 h-3.5" />}
                              {hasVoted ? "Abgestimmt" : `${item.vote_count}`}
                              {!hasVoted && <span className="text-muted-foreground/60">Stimmen</span>}
                            </button>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 text-center p-8 border border-border/40 rounded-2xl bg-card"
          >
            <h3 className="text-lg font-bold mb-2">Feature-Wunsch?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Unsere Roadmap wird von Kundenfeedback gesteuert. Sag uns, was du brauchst.
            </p>
            <a href="mailto:feedback@decivio.com">
              <Button variant="default" size="lg" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Feature vorschlagen
              </Button>
            </a>
          </motion.div>
        </main>
      </div>

      {/* Vote dialog for anonymous users */}
      <Dialog open={showVoteDialog} onOpenChange={setShowVoteDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              Abstimmen
            </DialogTitle>
            <DialogDescription>
              Geben Sie Ihre E-Mail ein, um abzustimmen. Sie werden benachrichtigt, wenn das Feature live geht.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input
              type="email"
              placeholder="ihre@email.de"
              value={voteEmail}
              onChange={e => setVoteEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleEmailVote()}
              autoFocus
            />
            <Button
              onClick={handleEmailVote}
              disabled={submittingVote || !voteEmail}
              className="w-full gap-2"
            >
              {submittingVote ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
              Stimme abgeben
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">
              Ihre E-Mail wird nur für die Benachrichtigung verwendet.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Roadmap;
