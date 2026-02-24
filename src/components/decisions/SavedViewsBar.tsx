import { useState } from "react";
import { Bookmark, Pin, PinOff, Trash2, Plus, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSavedViews, SavedViewFilters } from "@/hooks/useSavedViews";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface SavedViewsBarProps {
  entityType?: string;
  currentFilters: SavedViewFilters;
  onApplyView: (filters: SavedViewFilters) => void;
  hasActiveFilters: boolean;
}

const SavedViewsBar = ({ entityType = "decisions", currentFilters, onApplyView, hasActiveFilters }: SavedViewsBarProps) => {
  const { t } = useTranslation();
  const { views, createView, updateView, deleteView } = useSavedViews(entityType);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [showSave, setShowSave] = useState(false);
  const [saveName, setSaveName] = useState("");

  const pinnedViews = views.filter(v => v.is_pinned);
  const unpinnedViews = views.filter(v => !v.is_pinned);

  const handleApply = (view: typeof views[0]) => {
    setActiveViewId(view.id);
    onApplyView(view.filters);
  };

  const handleSave = () => {
    if (!saveName.trim()) return;
    createView.mutate(
      { name: saveName.trim(), filters: currentFilters, is_pinned: true },
      {
        onSuccess: () => {
          toast.success(t("savedViews.viewSaved", { name: saveName }));
          setSaveName("");
          setShowSave(false);
        },
      }
    );
  };

  const handleDelete = (id: string, name: string) => {
    deleteView.mutate(id, {
      onSuccess: () => {
        toast.success(t("savedViews.viewDeleted", { name }));
        if (activeViewId === id) setActiveViewId(null);
      },
    });
  };

  const handleTogglePin = (id: string, currentlyPinned: boolean) => {
    updateView.mutate({ id, is_pinned: !currentlyPinned });
  };

  const systemViews: { key: string; label: string; filters: SavedViewFilters }[] = [
    { key: "sys_overdue", label: t("savedViews.overdue"), filters: { quickChip: "overdue" } },
    { key: "sys_review", label: t("savedViews.myReviews"), filters: { quickChip: "review" } },
    { key: "sys_highrisk", label: t("savedViews.highRisk"), filters: { quickChip: "highRisk" } },
    { key: "sys_strategic", label: t("savedViews.strategic"), filters: { category: ["strategic"] } },
    { key: "sys_critical", label: t("savedViews.critical"), filters: { priority: ["critical"] } },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Bookmark className="w-3.5 h-3.5 text-muted-foreground shrink-0" />

      {systemViews.map(sv => (
        <button
          key={sv.key}
          onClick={() => {
            setActiveViewId(sv.key);
            onApplyView(sv.filters);
          }}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
            activeViewId === sv.key
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted/40 text-muted-foreground border-border/50 hover:border-primary/30 hover:bg-muted/60"
          }`}
        >
          {sv.label}
        </button>
      ))}

      {pinnedViews.map(v => (
        <div key={v.id} className="group relative">
          <button
            onClick={() => handleApply(v)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
              activeViewId === v.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/40 text-muted-foreground border-border/50 hover:border-primary/30 hover:bg-muted/60"
            }`}
          >
            📌 {v.name}
          </button>
          <button
            onClick={() => handleDelete(v.id, v.name)}
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      ))}

      {unpinnedViews.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-border/50 bg-muted/40 text-muted-foreground hover:border-primary/30 transition-all">
              {t("savedViews.moreViews", { count: unpinnedViews.length })}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="start">
            <div className="space-y-1">
              {unpinnedViews.map(v => (
                <div key={v.id} className="flex items-center gap-1">
                  <button
                    onClick={() => handleApply(v)}
                    className="flex-1 text-left px-2 py-1.5 rounded text-xs hover:bg-muted transition-colors truncate"
                  >
                    {v.name}
                  </button>
                  <button onClick={() => handleTogglePin(v.id, false)} className="p-1 hover:bg-muted rounded">
                    <Pin className="w-3 h-3 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDelete(v.id, v.name)} className="p-1 hover:bg-destructive/10 rounded">
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {hasActiveFilters && (
        <>
          <div className="w-px h-5 bg-border mx-1" />
          {showSave ? (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSave()}
                placeholder={t("savedViews.viewNamePlaceholder")}
                className="h-7 w-32 px-2 rounded-md border border-input text-xs bg-background focus:border-primary focus:outline-none"
              />
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSave} disabled={!saveName.trim()}>
                <Save className="w-3 h-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setShowSave(false); setSaveName(""); }}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setShowSave(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border border-dashed border-primary/40 text-primary hover:bg-primary/5 transition-all"
            >
              <Plus className="w-3 h-3" /> {t("savedViews.saveView")}
            </button>
          )}
        </>
      )}

      {activeViewId && (
        <button
          onClick={() => {
            setActiveViewId(null);
            onApplyView({ status: [], priority: [], category: [], team: [], quickChip: null });
          }}
          className="px-2 py-1 rounded-md text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-3 h-3 inline mr-0.5" />
          {t("savedViews.clearView")}
        </button>
      )}
    </div>
  );
};

export default SavedViewsBar;
