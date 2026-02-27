import { ReactNode } from "react";
import { Brain, Settings, Shield, BookOpen, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PageHelpButton from "./PageHelpButton";
import { useTranslation } from "react-i18next";

export type PageRole = "intelligence" | "execution" | "governance" | "knowledge";

const PageHeader = ({
  title,
  subtitle,
  role,
  primaryAction,
  secondaryActions,
  help,
}: {
  title: string;
  subtitle: string;
  role: PageRole;
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
  help?: { title: string; description: string };
}) => {
  const { t } = useTranslation();

  const roleConfig: Record<PageRole, { labelKey: string; icon: LucideIcon; className: string }> = {
    intelligence: { labelKey: "shared.pageRoleIntelligence", icon: Brain, className: "bg-accent-teal/10 text-accent-teal border-accent-teal/20" },
    execution: { labelKey: "shared.pageRoleExecution", icon: Settings, className: "bg-accent-violet/10 text-accent-violet border-accent-violet/20" },
    governance: { labelKey: "shared.pageRoleGovernance", icon: Shield, className: "bg-accent-rose/10 text-accent-rose border-accent-rose/20" },
    knowledge: { labelKey: "shared.pageRoleKnowledge", icon: BookOpen, className: "bg-accent-blue/10 text-accent-blue border-accent-blue/20" },
  };

  const config = roleConfig[role];
  const RoleIcon = config.icon;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-1">
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 gap-1 font-medium border ${config.className}`}>
            <RoleIcon className="w-3 h-3" />
            {t(config.labelKey)}
          </Badge>
          {help && <PageHelpButton title={help.title} description={help.description} />}
        </div>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0 flex-wrap [&>button]:h-9 [&>button]:text-sm [&>*>button]:h-9 [&>*>button]:text-sm">
        {secondaryActions}
        {primaryAction}
      </div>
    </div>
  );
};

export default PageHeader;
