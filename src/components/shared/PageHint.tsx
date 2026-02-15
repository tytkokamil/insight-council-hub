import { HelpCircle } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { type ReactNode } from "react";

interface PageHintProps {
  children: ReactNode;
}

const PageHint = ({ children }: PageHintProps) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        size="icon"
        className="h-7 w-7 rounded-full border-warning/40 bg-warning/10 text-warning hover:bg-warning/20 hover:text-warning flex-shrink-0"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </Button>
    </PopoverTrigger>
    <PopoverContent side="bottom" align="start" className="max-w-xs text-sm leading-relaxed text-muted-foreground">
      {children}
    </PopoverContent>
  </Popover>
);

export default PageHint;
