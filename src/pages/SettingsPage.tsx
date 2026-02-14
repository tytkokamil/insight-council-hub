import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { User, Shield, Bell, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("full_name").eq("user_id", user.id).single();
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
      toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Password updated successfully." });
      setNewPassword("");
      setConfirmPassword("");
    }
    setChangingPassword(false);
  };

  const inputClass = "w-full h-9 px-3 rounded-md bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all text-sm font-mono";

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <AppLayout>
      <div className="mb-6">
        <p className="font-mono text-[10px] text-primary/50 uppercase tracking-widest mb-1">Configuration</p>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
      </div>

      <div className="max-w-2xl space-y-4">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="cmd-card p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="text-sm font-mono font-bold text-primary">{initials}</span>
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">{fullName || "Unknown"}</h2>
              <p className="text-xs font-mono text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </motion.div>

        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="cmd-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-3.5 h-3.5 text-primary" />
            <h2 className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">Profile</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1 block">Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1 block">Email</label>
              <input type="email" value={user?.email || ""} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
            </div>
            <Button variant="hero" size="sm" onClick={handleSave} disabled={saving} className="gap-2">
              {saved && <CheckCircle2 className="w-3.5 h-3.5" />}
              {saving ? "Saving..." : saved ? "Saved" : "Save"}
            </Button>
          </div>
        </motion.div>

        {/* Password */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="cmd-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <h2 className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">Security</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1 block">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" className={inputClass} />
            </div>
            <div>
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1 block">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" className={inputClass} />
            </div>
            <Button variant="hero" size="sm" onClick={handlePasswordChange} disabled={changingPassword || !newPassword}>
              {changingPassword ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="cmd-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-3.5 h-3.5 text-primary" />
            <h2 className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">Notifications</h2>
          </div>
          <div className="space-y-2">
            {[
              { label: "Review Requests", desc: "Alert on new reviews" },
              { label: "Escalations", desc: "Immediate escalation alerts" },
              { label: "Team Updates", desc: "New members & invitations" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-md bg-muted/30 border border-border">
                <div>
                  <p className="text-xs font-medium">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{item.desc}</p>
                </div>
                <div className="w-8 h-5 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-end px-0.5">
                  <div className="w-4 h-4 rounded-full bg-primary" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
