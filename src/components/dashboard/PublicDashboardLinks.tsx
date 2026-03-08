import { useState } from "react";
import { Link2, Plus, Trash2, Copy, Check, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { format } from "date-fns";

const PublicDashboardLinks = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [newTitle, setNewTitle] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: links = [], isLoading } = useQuery({
    queryKey: ["public-dashboard-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_dashboard_links")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const createLink = useMutation({
    mutationFn: async (title: string) => {
      const { error } = await supabase
        .from("public_dashboard_links")
        .insert({ created_by: user!.id, title: title || "Dashboard" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["public-dashboard-links"] });
      setNewTitle("");
      toast.success(t("common.linkCopied") || "Link erstellt!");
    },
  });

  const toggleLink = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("public_dashboard_links")
        .update({ is_active: active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["public-dashboard-links"] }),
  });

  const deleteLink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("public_dashboard_links")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["public-dashboard-links"] });
      toast.success("Link gelöscht");
    },
  });

  const copyUrl = (token: string, id: string) => {
    const url = `${window.location.origin}/shared/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success(t("common.linkCopied") || "Link kopiert!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary" />
          Public Dashboard Links
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Link-Titel (z.B. Board Report Q3)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="text-sm h-8"
          />
          <Button
            size="sm"
            onClick={() => createLink.mutate(newTitle)}
            disabled={createLink.isPending}
            className="gap-1 shrink-0"
          >
            {createLink.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Erstellen
          </Button>
        </div>

        {isLoading ? (
          <div className="text-xs text-muted-foreground py-4 text-center">Laden...</div>
        ) : links.length === 0 ? (
          <div className="text-xs text-muted-foreground py-4 text-center">
            Noch keine öffentlichen Links. Erstellen Sie einen, um Ihr Dashboard zu teilen.
          </div>
        ) : (
          <div className="space-y-2">
            {links.map((link: any) => (
              <div key={link.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-border/60 bg-muted/30">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{link.title}</p>
                    <Badge variant={link.is_active ? "default" : "secondary"} className="text-[9px] shrink-0">
                      {link.is_active ? "Aktiv" : "Inaktiv"}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {format(new Date(link.created_at), "dd.MM.yyyy")} · {link.view_count} Aufrufe
                  </p>
                </div>
                <Switch
                  checked={link.is_active}
                  onCheckedChange={(checked) => toggleLink.mutate({ id: link.id, active: checked })}
                  className="shrink-0"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => copyUrl(link.token, link.id)}
                >
                  {copiedId === link.id ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                  onClick={() => deleteLink.mutate(link.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PublicDashboardLinks;
