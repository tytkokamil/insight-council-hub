import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import decivioLogo from "@/assets/decivio-logo.png";

interface Props {
  userName: string;
  onNext: () => void;
  slideAnim: Record<string, unknown>;
}

const WelcomeStep = ({ userName, onNext, slideAnim }: Props) => (
  <motion.div key="s1" {...slideAnim} className="w-full max-w-md text-center">
    <motion.img
      src={decivioLogo}
      alt="Decivio"
      className="w-20 h-20 rounded-2xl mx-auto mb-6 shadow-lg"
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
    />
    <h1 className="text-2xl font-bold text-foreground mb-2">
      Willkommen, {userName}! 👋
    </h1>
    <p className="text-muted-foreground text-sm mb-8">
      Lass uns Decivio in 3 Minuten für dich einrichten.
    </p>
    <Button
      size="lg"
      onClick={onNext}
      autoFocus
      className="w-full max-w-xs mx-auto gap-2 h-12 text-sm font-semibold"
    >
      Los geht's <ArrowRight className="w-4 h-4" />
    </Button>
  </motion.div>
);

export default WelcomeStep;
