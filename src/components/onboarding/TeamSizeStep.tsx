import { motion } from "framer-motion";

const TEAM_SIZES = [
  { id: "solo", label: "Nur ich", desc: "Einzelnutzer" },
  { id: "small", label: "2–5", desc: "Kleines Team" },
  { id: "medium", label: "6–20", desc: "Mittelgroßes Team" },
  { id: "large", label: "20+", desc: "Große Organisation" },
];

interface Props {
  selectedTeamSize: string | null;
  onSelect: (id: string) => void;
  slideAnim: Record<string, unknown>;
}

const TeamSizeStep = ({ selectedTeamSize, onSelect, slideAnim }: Props) => (
  <motion.div key="s3" {...slideAnim} className="w-full max-w-lg">
    <div className="text-center mb-8">
      <h1 className="text-2xl font-bold text-foreground">
        Wie viele Personen treffen bei euch Entscheidungen?
      </h1>
    </div>
    <div className="grid grid-cols-2 gap-3">
      {TEAM_SIZES.map((ts, i) => {
        const selected = selectedTeamSize === ts.id;
        return (
          <motion.button
            key={ts.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelect(ts.id)}
            className={`p-5 rounded-xl border-2 transition-all text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
              selected
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-border hover:border-primary/40 hover:shadow-sm bg-card"
            }`}
            aria-pressed={selected}
          >
            <p className="text-xl font-bold text-foreground mb-1">{ts.label}</p>
            <p className="text-xs text-muted-foreground">{ts.desc}</p>
          </motion.button>
        );
      })}
    </div>
  </motion.div>
);

export default TeamSizeStep;
