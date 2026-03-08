import { useState } from "react";
import { Share2, Linkedin, Link2, Check, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface SocialShareButtonProps {
  /** Title of the content to share */
  title: string;
  /** Description or achievement text */
  description?: string;
  /** URL to share (defaults to current page) */
  url?: string;
  /** Variant style */
  variant?: "default" | "ghost" | "outline";
  /** Size */
  size?: "sm" | "default" | "icon";
}

const SocialShareButton = ({ title, description, url, variant = "ghost", size = "sm" }: SocialShareButtonProps) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const shareUrl = url || window.location.href;

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}${description ? `&summary=${encodeURIComponent(description)}` : ""}`;
  
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${title}${description ? ` — ${description}` : ""}`)}&url=${encodeURIComponent(shareUrl)}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success(t("common.linkCopied") || "Link kopiert!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={variant} size={size} className="gap-1.5">
          <Share2 className="w-3.5 h-3.5" />
          {size !== "icon" && <span className="text-xs">{t("common.share") || "Teilen"}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1.5" align="end">
        <a
          href={linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
        >
          <Linkedin className="w-4 h-4 text-[#0077b5]" />
          LinkedIn
        </a>
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
        >
          <Twitter className="w-4 h-4" />
          Twitter / X
        </a>
        <button
          onClick={copyLink}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors w-full text-left"
        >
          {copied ? <Check className="w-4 h-4 text-success" /> : <Link2 className="w-4 h-4" />}
          {copied ? (t("common.copied") || "Kopiert!") : (t("common.copyLink") || "Link kopieren")}
        </button>
      </PopoverContent>
    </Popover>
  );
};

export default SocialShareButton;
