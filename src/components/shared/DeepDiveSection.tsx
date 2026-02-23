import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeepDiveSectionProps {
  label?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

const DeepDiveSection = ({ label = "Deep Intelligence", defaultOpen = false, children }: DeepDiveSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="pt-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full py-2 group"
      >
        <Layers className="w-3.5 h-3.5 text-muted-foreground/40" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
          {label}
        </span>
        <div className="flex-1 h-px bg-border/30 mx-2" />
        <ChevronDown className={cn(
          "w-3.5 h-3.5 text-muted-foreground/40 transition-transform duration-300",
          open && "rotate-180"
        )} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8 mt-4 overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DeepDiveSection;
