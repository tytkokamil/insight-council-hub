import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

type Step = "score" | "comment" | "thanks";

const NpsModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("score");
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const getCategory = (s: number) => s <= 6 ? "detractor" : s <= 8 ? "passive" : "promoter";

  const handleScore = async (s: number) => {
    setScore(s);
    setStep("comment");
  };

  const handleSubmit = async (skip = false) => {
    if (!user || score === null) return;
    setSubmitting(true);
    await supabase.from("nps_responses").insert({
      user_id: user.id,
      score,
      comment: skip ? null : comment || null,
      phone: phone || null,
      callback_requested: phone.length > 0,
    });
    await supabase.from("profiles").update({
      nps_last_shown: new Date().toISOString(),
      nps_score: score,
      nps_shown_count: undefined, // will be incremented by trigger ideally
    }).eq("user_id", user.id);
    setSubmitting(false);
    setStep("thanks");
  };

  const getCommentPrompt = () => {
    if (score === null) return "";
    if (score <= 6) return "Was können wir besser machen?";
    if (score <= 8) return "Was fehlt Ihnen noch?";
    return "Was schätzen Sie am meisten?";
  };

  const shareOnLinkedIn = () => {
    const text = encodeURIComponent("Ich nutze Decivio für strukturierte Entscheidungen im Mittelstand. Absolut empfehlenswert! https://decivio.com");
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=https://decivio.com`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[380px] p-0 gap-0" onInteractOutside={e => e.preventDefault()}>
        <AnimatePresence mode="wait">
          {step === "score" && (
            <motion.div key="score" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
              <h3 className="text-base font-semibold text-center mb-1">Wie wahrscheinlich empfehlen Sie Decivio einem Kollegen?</h3>
              <p className="text-xs text-muted-foreground text-center mb-6">Klicken Sie auf eine Zahl</p>
              <div className="grid grid-cols-11 gap-1">
                {Array.from({ length: 11 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => handleScore(i)}
                    className={`h-10 rounded-lg text-sm font-semibold transition-all border ${
                      i <= 6 ? "border-destructive/20 hover:bg-destructive/10 hover:text-destructive" :
                      i <= 8 ? "border-yellow-500/20 hover:bg-yellow-500/10 hover:text-yellow-600" :
                      "border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-600"
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                <span>0 = Gar nicht</span>
                <span>10 = Auf jeden Fall</span>
              </div>
            </motion.div>
          )}

          {step === "comment" && (
            <motion.div key="comment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
              <h3 className="text-base font-semibold text-center mb-4">{getCommentPrompt()}</h3>
              <Textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Optional — Ihr Feedback hilft uns sehr..."
                rows={3}
                className="mb-4"
              />
              <div className="flex gap-2">
                <Button onClick={() => handleSubmit(false)} className="flex-1" disabled={submitting}>Absenden</Button>
                <Button variant="ghost" onClick={() => handleSubmit(true)} className="text-xs text-muted-foreground" disabled={submitting}>Überspringen</Button>
              </div>
            </motion.div>
          )}

          {step === "thanks" && score !== null && (
            <motion.div key="thanks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 text-center">
              {score >= 9 && (
                <>
                  <p className="text-3xl mb-2">🎉</p>
                  <h3 className="text-base font-semibold mb-2">Danke! Würden Sie Decivio auf LinkedIn empfehlen?</h3>
                  <Button onClick={shareOnLinkedIn} className="gap-1.5 mb-2 w-full">Auf LinkedIn teilen</Button>
                </>
              )}
              {score >= 7 && score <= 8 && (
                <>
                  <p className="text-3xl mb-2">👍</p>
                  <h3 className="text-base font-semibold mb-2">Danke! Wir arbeiten an diesen Punkten.</h3>
                </>
              )}
              {score <= 6 && (
                <>
                  <p className="text-3xl mb-2">🙏</p>
                  <h3 className="text-base font-semibold mb-2">Danke. Darf unser Gründer Sie kurz anrufen?</h3>
                  <Input placeholder="Telefonnummer (optional)" value={phone} onChange={e => setPhone(e.target.value)} className="mb-3" />
                  <div className="flex gap-2">
                    <Button onClick={async () => { if (phone) { await supabase.from("nps_responses").update({ phone, callback_requested: true }).eq("user_id", user?.id || "").order("created_at", { ascending: false }).limit(1); } onClose(); }} className="flex-1">Ja, gerne</Button>
                    <Button variant="ghost" onClick={onClose}>Nein danke</Button>
                  </div>
                </>
              )}
              {(score >= 7) && <Button variant="ghost" onClick={onClose} className="mt-2 w-full">Schließen</Button>}
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default NpsModal;
