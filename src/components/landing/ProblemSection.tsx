import { motion } from "framer-motion";
import { Mail, Users, FileSearch } from "lucide-react";
import { useTranslation } from "react-i18next";

const ease = [0.16, 1, 0.3, 1] as const;

const ProblemSection = () => {
  const { t } = useTranslation();

  const problems = [
    { icon: Mail, title: t("landing.problem.emailTitle"), description: t("landing.problem.emailDesc"), stat: t("landing.problem.emailStat"), statLabel: t("landing.problem.emailStatLabel") },
    { icon: Users, title: t("landing.problem.responsibilityTitle"), description: t("landing.problem.responsibilityDesc"), stat: t("landing.problem.responsibilityStat"), statLabel: t("landing.problem.responsibilityStatLabel") },
    { icon: FileSearch, title: t("landing.problem.auditTitle"), description: t("landing.problem.auditDesc"), stat: t("landing.problem.auditStat"), statLabel: t("landing.problem.auditStatLabel") },
  ];

  return (
    <section className="py-28 relative">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.7, ease }} className="text-center max-w-xl mx-auto mb-16">
          <p className="text-[11px] font-medium text-muted-foreground/60 mb-4 tracking-[0.2em] uppercase">{t("landing.problem.label")}</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t("landing.problem.title")}</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {problems.map((problem, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: i * 0.1, duration: 0.5, ease }} className="group p-6 rounded-2xl border border-border/50 bg-card/50 hover:bg-card hover:border-accent-rose/20 transition-all duration-300">
              <problem.icon className="w-5 h-5 text-accent-rose/60 mb-4" />
              <h3 className="text-[15px] font-semibold mb-2">{problem.title}</h3>
              <p className="text-sm text-muted-foreground/70 leading-relaxed mb-4">{problem.description}</p>
              <div className="pt-3 border-t border-border/30">
                <span className="text-xl font-bold text-accent-rose">{problem.stat}</span>
                <span className="block text-[10px] text-muted-foreground/50 mt-0.5">{problem.statLabel}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
