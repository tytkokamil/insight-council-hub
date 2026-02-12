import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { User, Shield, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();
      if (data) setFullName(data.full_name || "");
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({ full_name: fullName }).eq("user_id", user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Fehler", description: "Passwort muss mindestens 6 Zeichen lang sein.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Fehler", description: "Passwörter stimmen nicht überein.", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Erfolg", description: "Passwort wurde erfolgreich geändert." });
      setNewPassword("");
      setConfirmPassword("");
    }
    setChangingPassword(false);
  };

  const inputClass = "w-full h-10 px-3 rounded-lg bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all text-sm";

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Einstellungen</h1>
        <p className="text-muted-foreground">Verwalte dein Konto und Präferenzen</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-primary" />
            <h2 className="font-display font-semibold text-lg">Profil</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">E-Mail</label>
              <input type="email" value={user?.email || ""} disabled className={`${inputClass} opacity-50`} />
            </div>
            <Button variant="hero" onClick={handleSave} disabled={saving}>
              {saving ? "Speichern..." : saved ? "Gespeichert ✓" : "Speichern"}
            </Button>
          </div>
        </div>

        {/* Password */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="font-display font-semibold text-lg">Passwort ändern</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Neues Passwort</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mindestens 6 Zeichen" className={inputClass} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Passwort bestätigen</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Passwort wiederholen" className={inputClass} />
            </div>
            <Button variant="hero" onClick={handlePasswordChange} disabled={changingPassword || !newPassword}>
              {changingPassword ? "Ändern..." : "Passwort ändern"}
            </Button>
          </div>
        </div>

        {/* Notifications */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="font-display font-semibold text-lg">Benachrichtigungen</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            E-Mail-Benachrichtigungen für Reviews und Entscheidungen werden bald eingerichtet.
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
