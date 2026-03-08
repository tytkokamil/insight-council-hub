import { ReactNode, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

const CollapsibleSection = ({ title, subtitle, icon, defaultOpen = true, children, className, action }: CollapsibleSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={className}>
      <div className="flex items-center justify-between mb-3">
        <CollapsibleTrigger className="flex items-center gap-2.5 group py-1.5 hover:opacity-80 transition-opacity">
          <ChevronDown className={cn(
            "w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 shrink-0",
            !open && "-rotate-90"
          )} />
          {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
          <div className="text-left">
            <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
            {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </CollapsibleTrigger>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <CollapsibleContent className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default CollapsibleSection;
