import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

interface DeepDiveSectionProps {
  label?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

const DeepDiveSection = ({ label = "Deep Intelligence", defaultOpen = false, children }: DeepDiveSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="pt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs font-medium text-muted-foreground/60 hover:text-muted-foreground transition-colors w-full py-3"
      >
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        <span>{open ? `${label} ausblenden` : label}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8 mt-4"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DeepDiveSection;
