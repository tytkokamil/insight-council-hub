import { ReactNode } from "react";
import { Brain, Settings, Shield, BookOpen, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PageHelpButton from "./PageHelpButton";

export type PageRole = "intelligence" | "execution" | "governance" | "knowledge";

const roleConfig: Record<PageRole, { label: string; icon: LucideIcon; className: string }> = {
  intelligence: {
    label: "Intelligence",
    icon: Brain,
    className: "bg-accent-violet/10 text-accent-violet border-accent-violet/20",
  },
  execution: {
    label: "Execution",
    icon: Settings,
    className: "bg-primary/10 text-primary border-primary/20",
  },
  governance: {
    label: "Governance",
    icon: Shield,
    className: "bg-accent-rose/10 text-accent-rose border-accent-rose/20",
  },
  knowledge: {
    label: "Knowledge",
    icon: BookOpen,
    className: "bg-accent-teal/10 text-accent-teal border-accent-teal/20",
  },
};

interface PageHeaderProps {
  title: string;
  subtitle: string;
  role: PageRole;
  /** Primary CTA button (right side) */
  primaryAction?: ReactNode;
  /** Secondary actions (filters, exports, etc.) */
  secondaryActions?: ReactNode;
  /** Help dialog content */
  help?: { title: string; description: string };
}

const PageHeader = ({
  title,
  subtitle,
  role,
  primaryAction,
  secondaryActions,
  help,
}: PageHeaderProps) => {
  const config = roleConfig[role];
  const RoleIcon = config.icon;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-1">
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 gap-1 font-medium border ${config.className}`}>
            <RoleIcon className="w-3 h-3" />
            {config.label}
          </Badge>
          {help && <PageHelpButton title={help.title} description={help.description} />}
        </div>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        {secondaryActions}
        {primaryAction}
      </div>
    </div>
  );
};

export default PageHeader;
