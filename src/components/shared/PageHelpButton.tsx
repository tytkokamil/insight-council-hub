import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";

interface PageHelpButtonProps {
  title: string;
  description: string;
}

const PageHelpButton = ({ title, description }: PageHelpButtonProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(true)}>
        <HelpCircle className="w-4 h-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{t("shared.helpPrefix")} {title}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PageHelpButton;
