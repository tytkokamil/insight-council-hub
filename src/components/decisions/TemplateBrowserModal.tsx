import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Shield, CheckSquare, Clock, ArrowRight, Building2, Globe, Layers } from "lucide-react";
import { useTemplates, toDecisionTemplate, type DbTemplate } from "@/hooks/useTemplates";
import { type DecisionTemplate } from "@/lib/decisionTemplates";
import { industries, getIndustryById } from "@/lib/industries";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: DecisionTemplate) => void;
}

type CategoryFilter = "my-industry" | "allgemein" | "all";

const TemplateBrowserModal = ({ open, onOpenChange, onSelectTemplate }: Props) => {
  const { user } = useAuth();
  const { templates: dbTemplates } = useTemplates();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("my-industry");
  const [userIndustry, setUserIndustry] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !open) return;
    supabase
      .from("profiles")
      .select("industry")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setUserIndustry((data as any)?.industry || null);
      });
  }, [user, open]);

  const industryInfo = getIndustryById(userIndustry);

  const filteredTemplates = useMemo(() => {
    let list = dbTemplates;

    // Category filter
    if (activeCategory === "my-industry" && userIndustry) {
      list = list.filter(t => (t as any).industry === userIndustry);
    } else if (activeCategory === "allgemein") {
      list = list.filter(t => !(t as any).industry || (t as any).industry === "allgemein");
    }
    // "all" shows everything

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }

    return list;
  }, [dbTemplates, activeCategory, userIndustry, search]);

  const handleSelect = (tpl: DbTemplate) => {
    onSelectTemplate(toDecisionTemplate(tpl));
    onOpenChange(false);
    setSearch("");
  };

  const categories: { id: CategoryFilter; label: string; icon: React.ReactNode; count: number }[] = useMemo(() => {
    const myCount = userIndustry
      ? dbTemplates.filter(t => (t as any).industry === userIndustry).length
      : 0;
    const genCount = dbTemplates.filter(t => !(t as any).industry || (t as any).industry === "allgemein").length;

    return [
      {
        id: "my-industry" as const,
        label: industryInfo ? industryInfo.name : "Meine Branche",
        icon: industryInfo ? <span className="text-base">{industryInfo.icon}</span> : <Building2 className="w-4 h-4" />,
        count: myCount,
      },
      {
        id: "allgemein" as const,
        label: "Allgemein",
        icon: <Layers className="w-4 h-4" />,
        count: genCount,
      },
      {
        id: "all" as const,
        label: "Alle Branchen",
        icon: <Globe className="w-4 h-4" />,
        count: dbTemplates.length,
      },
    ];
  }, [dbTemplates, userIndustry, industryInfo]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-lg">Vorlagen-Bibliothek</DialogTitle>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Vorlagen suchen… z.B. Lieferant, Investition, Freigabe"
              className="pl-10"
            />
          </div>
        </DialogHeader>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <div className="w-56 shrink-0 border-r border-border p-3 space-y-1 bg-muted/20">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setSearch(""); }}
                className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeCategory === cat.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {cat.icon}
                <span className="flex-1 min-w-0 truncate">{cat.label}</span>
                <span className="text-[10px] text-muted-foreground">{cat.count}</span>
              </button>
            ))}
          </div>

          {/* Template list */}
          <ScrollArea className="flex-1 p-4">
            {filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="w-8 h-8 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Keine Vorlagen gefunden</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {search ? `Keine Ergebnisse für "${search}"` : "In dieser Kategorie sind noch keine Vorlagen vorhanden."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredTemplates.map(tpl => {
                  const ind = getIndustryById((tpl as any).industry);
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => handleSelect(tpl)}
                      className="text-left p-4 rounded-lg border border-border bg-card hover:border-primary/40 hover:bg-primary/[0.02] transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-sm font-semibold group-hover:text-primary transition-colors line-clamp-1">
                          {tpl.name}
                        </h3>
                        {activeCategory === "all" && ind && (
                          <span className="text-xs shrink-0" title={ind.name}>{ind.icon}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{tpl.description}</p>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          {(tpl.required_fields as any[])?.length || 0} Felder
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckSquare className="w-3 h-3" />
                          {(tpl.approval_steps as any[])?.length || 0} Prüfer
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {tpl.default_duration_days} Tage
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Diese Vorlage verwenden <ArrowRight className="w-3 h-3" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateBrowserModal;
