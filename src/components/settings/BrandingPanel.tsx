import { useState, useRef } from "react";
import { Upload, Loader2, Palette, Building2, Eye, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFreemiumLimits } from "@/hooks/useFreemiumLimits";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import decivioLogo from "@/assets/decivio-logo.png";

const COLOR_PRESETS = [
  "#EF4444", "#F97316", "#EAB308", "#22C55E",
  "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899",
];

const BrandingPanel = () => {
  const { user } = useAuth();
  const { isEnterprise } = useFreemiumLimits();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [primaryColor, setPrimaryColor] = useState("#EF4444");
  const [companyName, setCompanyName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [emailFromName, setEmailFromName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load existing branding
  useState(() => {
    (async () => {
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("org_id").eq("user_id", user.id).single();
      if (!profile?.org_id) return;
      const { data: org } = await supabase.from("organizations").select("branding").eq("id", profile.org_id).single();
      const b = org?.branding as Record<string, any> | null;
      if (b) {
        setPrimaryColor(b.primaryColor || "#EF4444");
        setCompanyName(b.companyName || "");
        setLogoUrl(b.logoUrl || null);
        setEmailFromName(b.emailFromName || "");
      }
      setLoaded(true);
    })();
  });

  if (!isEnterprise) {
    return (
      <div className="settings-group p-6 text-center space-y-3">
        <Building2 className="w-10 h-10 mx-auto text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">Custom Branding</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          White-Label-Branding mit eigenem Logo, Farben und Firmennamen ist im Enterprise-Plan enthalten.
        </p>
        <Button variant="outline" onClick={() => window.location.href = "/upgrade"}>
          Auf Enterprise upgraden
        </Button>
      </div>
    );
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Logo darf max. 2MB groß sein"); return; }
    if (!["image/png", "image/svg+xml", "image/jpeg"].includes(file.type)) { toast.error("Nur PNG, SVG oder JPEG erlaubt"); return; }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `branding/${user!.id}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload fehlgeschlagen"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    setLogoUrl(urlData.publicUrl);
    setUploading(false);
    toast.success("Logo hochgeladen");
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { data: profile } = await supabase.from("profiles").select("org_id").eq("user_id", user.id).single();
    if (!profile?.org_id) { setSaving(false); return; }

    const branding = {
      primaryColor,
      logoUrl,
      companyName: companyName || null,
      customDomain: null,
      favicon: null,
      emailFromName: emailFromName || null,
    };

    const { error } = await supabase.from("organizations").update({ branding }).eq("id", profile.org_id);
    if (error) { toast.error("Fehler beim Speichern"); } else {
      toast.success("Branding gespeichert");
      queryClient.invalidateQueries({ queryKey: ["org-branding"] });
    }
    setSaving(false);
  };

  const previewLogo = logoUrl || decivioLogo;
  const previewName = companyName || "Decivio";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Config */}
        <div className="space-y-5">
          {/* Logo */}
          <div className="settings-group p-4 space-y-3">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Upload className="w-4 h-4 text-muted-foreground" /> Logo
            </label>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded object-contain bg-muted p-1" />
              ) : (
                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">Kein</div>
              )}
              <div>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                  Logo hochladen
                </Button>
                <p className="text-[11px] text-muted-foreground mt-1">PNG, SVG oder JPEG, max. 2MB</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/png,image/svg+xml,image/jpeg" className="hidden" onChange={handleLogoUpload} />
            </div>
          </div>

          {/* Primary Color */}
          <div className="settings-group p-4 space-y-3">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Palette className="w-4 h-4 text-muted-foreground" /> Primärfarbe
            </label>
            <div className="flex items-center gap-3">
              <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-9 h-9 rounded cursor-pointer border border-input" />
              <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-28 font-mono text-xs" placeholder="#EF4444" />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {COLOR_PRESETS.map(c => (
                <button
                  key={c}
                  onClick={() => setPrimaryColor(c)}
                  className="w-7 h-7 rounded-md border-2 transition-all"
                  style={{ background: c, borderColor: primaryColor === c ? "hsl(var(--foreground))" : "transparent" }}
                />
              ))}
            </div>
          </div>

          {/* Company Name */}
          <div className="settings-group p-4 space-y-3">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" /> Firmenname
            </label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Decivio" className="max-w-xs" />
            <p className="text-[11px] text-muted-foreground">Ersetzt "Decivio" in Sidebar und Kopfzeilen</p>
          </div>

          {/* Email From Name */}
          <div className="settings-group p-4 space-y-3">
            <label className="text-sm font-medium text-foreground">E-Mail Absendername</label>
            <Input value={emailFromName} onChange={(e) => setEmailFromName(e.target.value)} placeholder="Decivio" className="max-w-xs" />
            <p className="text-[11px] text-muted-foreground">Anzeigename in automatisierten E-Mails</p>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Check className="w-3.5 h-3.5 mr-1.5" />}
            Branding speichern
          </Button>
        </div>

        {/* Live Preview */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground" /> Live-Vorschau
          </h4>
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            {/* Simulated sidebar */}
            <div className="w-full bg-background border-b border-border/40">
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/40">
                <img src={previewLogo} alt="Logo" className="w-6 h-6 rounded object-contain" />
                <span className="font-medium text-[13px] text-foreground tracking-tight">{previewName}</span>
              </div>
              {/* Simulated nav items */}
              <div className="px-2 py-2 space-y-0.5">
                {["Dashboard", "Entscheidungen", "Aufgaben", "Teams"].map((item, i) => (
                  <div
                    key={item}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs"
                    style={i === 0 ? { background: primaryColor + "15", color: primaryColor } : { color: "hsl(var(--muted-foreground))" }}
                  >
                    <div className="w-3.5 h-3.5 rounded" style={i === 0 ? { background: primaryColor } : { background: "hsl(var(--muted-foreground) / 0.2)" }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            {/* Simulated top bar */}
            <div className="px-4 py-3 flex items-center gap-3 border-b border-border/20">
              <div className="w-2 h-2 rounded-full" style={{ background: primaryColor }} />
              <span className="text-xs text-muted-foreground">Primärfarbe: <span className="font-mono">{primaryColor}</span></span>
            </div>
            {/* Simulated button */}
            <div className="px-4 py-4">
              <button className="px-4 py-1.5 rounded-md text-xs font-medium text-white" style={{ background: primaryColor }}>
                Beispiel Button
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandingPanel;
