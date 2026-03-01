import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MessageCircle, Phone, CheckCircle2, Loader2, Send, ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const WhatsAppSettingsPanel = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [phone, setPhone] = useState("");
  const [verified, setVerified] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [step, setStep] = useState<"idle" | "code_sent" | "verified">("idle");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [demoCode, setDemoCode] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("notification_preferences")
      .select("whatsapp_phone, whatsapp_verified, whatsapp_enabled")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setPhone(data.whatsapp_phone || "");
          setVerified(data.whatsapp_verified || false);
          setEnabled(data.whatsapp_enabled || false);
          if (data.whatsapp_verified) setStep("verified");
        }
      });
  }, [user]);

  const sendTestMessage = async () => {
    if (!phone.trim() || !user) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: { mode: "send_verification", phone: phone.trim() },
      });
      if (error) throw error;
      if (data?.demo_code) {
        setDemoCode(data.demo_code);
      }
      setStep("code_sent");
      toast.success(t("settings.whatsappCodeSent"));
    } catch {
      toast.error(t("settings.whatsappSendError"));
    }
    setSending(false);
  };

  const verifyPhone = async () => {
    if (!verifyCode.trim() || !user) return;
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: { mode: "verify", phone: phone.trim(), code: verifyCode.trim() },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.message || t("settings.whatsappVerifyError"));
        setVerifying(false);
        return;
      }
      setVerified(true);
      setEnabled(true);
      setStep("verified");
      setDemoCode(null);
      toast.success(t("settings.whatsappVerified"));
    } catch {
      toast.error(t("settings.whatsappVerifyError"));
    }
    setVerifying(false);
  };

  const toggleEnabled = async () => {
    if (!user || !verified) return;
    const newVal = !enabled;
    setEnabled(newVal);
    await supabase
      .from("notification_preferences")
      .upsert({ user_id: user.id, whatsapp_enabled: newVal }, { onConflict: "user_id" });
  };

  const resetWhatsApp = async () => {
    if (!user) return;
    setPhone("");
    setVerified(false);
    setEnabled(false);
    setStep("idle");
    setVerifyCode("");
    setDemoCode(null);
    await supabase
      .from("notification_preferences")
      .upsert(
        { user_id: user.id, whatsapp_phone: null, whatsapp_verified: false, whatsapp_enabled: false },
        { onConflict: "user_id" }
      );
  };

  const inputClass =
    "w-full h-9 px-3 rounded-md bg-background border border-input text-sm focus:border-foreground focus:outline-none focus:ring-1 focus:ring-ring/20 transition-colors";

  return (
    <section>
      <div className="flex items-center gap-2 mb-1">
        <MessageCircle className="w-4 h-4 text-success" />
        <h2 className="text-sm font-medium">{t("settings.whatsappTitle")}</h2>
        <Badge variant="outline" className="text-[10px]">{t("settings.optional")}</Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-4">{t("settings.whatsappDesc")}</p>

      {/* Verified state */}
      {step === "verified" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg border border-success/30 bg-success/5">
            <ShieldCheck className="w-5 h-5 text-success shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{phone}</p>
              <p className="text-[10px] text-success">{t("settings.whatsappActive")}</p>
            </div>
            <Switch checked={enabled} onCheckedChange={toggleEnabled} />
          </div>

          <div className="p-3 rounded-lg border border-border/60 bg-muted/30">
            <p className="text-xs font-medium mb-1.5">{t("settings.whatsappEventsTitle")}</p>
            <ul className="space-y-1">
              {[
                t("settings.whatsappEventReview"),
                t("settings.whatsappEventEscalation"),
                t("settings.whatsappEventSla"),
              ].map((evt, i) => (
                <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <AlertTriangle className="w-3 h-3 text-warning shrink-0" />
                  {evt}
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-muted-foreground mt-2 italic">{t("settings.whatsappCriticalOnly")}</p>
          </div>

          <button onClick={resetWhatsApp} className="text-xs text-destructive hover:underline">
            {t("settings.whatsappReset")}
          </button>
        </div>
      )}

      {/* Phone input */}
      {step === "idle" && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              <Phone className="w-3 h-3 inline mr-1" />
              {t("settings.whatsappPhoneLabel")}
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+49 170 1234567"
                className={`${inputClass} flex-1`}
              />
              <Button size="sm" onClick={sendTestMessage} disabled={!phone.trim() || sending} className="gap-1.5 shrink-0">
                {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                {t("settings.whatsappSendTest")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Code entry */}
      {step === "code_sent" && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
            <p className="text-sm">{t("settings.whatsappCodeInfo", { phone })}</p>
            {demoCode && (
              <p className="text-xs text-primary mt-1 font-mono">
                Demo-Code: <strong>{demoCode}</strong>
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              {t("settings.whatsappCodeLabel")}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                className={`${inputClass} flex-1 font-mono tracking-widest text-center`}
                maxLength={6}
              />
              <Button size="sm" onClick={verifyPhone} disabled={verifyCode.length !== 6 || verifying} className="gap-1.5 shrink-0">
                {verifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                {t("settings.whatsappVerify")}
              </Button>
            </div>
          </div>
          <button onClick={() => { setStep("idle"); setDemoCode(null); }} className="text-xs text-muted-foreground hover:underline">
            {t("settings.whatsappChangeNumber")}
          </button>
        </div>
      )}
    </section>
  );
};

export default WhatsAppSettingsPanel;
