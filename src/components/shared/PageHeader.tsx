import { ReactNode } from "react";
import PageHelpButton from "./PageHelpButton";

export type PageRole = "intelligence" | "execution" | "governance" | "knowledge" | "system";

const roleAccent: Record<PageRole, string> = {
  intelligence: "border-l-accent-teal",
  execution: "border-l-primary",
  governance: "border-l-accent-rose",
  knowledge: "border-l-accent-blue",
  system: "border-l-accent-amber",
};

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
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8">
      <div className={`flex-1 min-w-0 border-l-[3px] ${roleAccent[role]} pl-3`}>
        <div className="flex items-center gap-2.5 mb-0.5 flex-wrap">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight">{title}</h1>
          {help && <PageHelpButton title={help.title} description={help.description} />}
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0 flex-wrap [&>button]:h-8 [&>button]:text-xs sm:[&>button]:h-9 sm:[&>button]:text-sm [&>*>button]:h-8 [&>*>button]:text-xs sm:[&>*>button]:h-9 sm:[&>*>button]:text-sm">
        {secondaryActions}
        {primaryAction}
      </div>
    </div>
  );
};

export default PageHeader;
