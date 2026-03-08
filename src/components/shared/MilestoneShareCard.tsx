import { motion } from "framer-motion";
import { Trophy, Sparkles, TrendingUp } from "lucide-react";
import SocialShareButton from "./SocialShareButton";

interface MilestoneShareCardProps {
  type: "decisions_count" | "streak" | "quality_score";
  value: number;
  label: string;
}

const icons = {
  decisions_count: Trophy,
  streak: Sparkles,
  quality_score: TrendingUp,
};

const colors = {
  decisions_count: "from-primary/20 to-primary/5 border-primary/20",
  streak: "from-amber-500/20 to-amber-500/5 border-amber-500/20",
  quality_score: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20",
};

const MilestoneShareCard = ({ type, value, label }: MilestoneShareCardProps) => {
  const Icon = icons[type];

  const shareTitle = `🎯 ${label}: ${value} — powered by Decivio`;
  const shareDesc = "Bessere Entscheidungen, schneller getroffen. decivio.com";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative rounded-xl border bg-gradient-to-br ${colors[type]} p-4`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-background/80 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
        <SocialShareButton
          title={shareTitle}
          description={shareDesc}
          variant="outline"
          size="sm"
        />
      </div>
    </motion.div>
  );
};

export default MilestoneShareCard;
