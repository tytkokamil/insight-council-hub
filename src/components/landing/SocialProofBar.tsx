const items = [
  { icon: "🔒", text: "DSGVO-KONFORM" },
  { icon: "🇩🇪", text: "SERVER IN DEUTSCHLAND" },
  { icon: "🔐", text: "SHA-256 AUDIT TRAIL" },
  { icon: "📋", text: "AVV INKLUSIVE" },
  { icon: "⚡", text: "SETUP IN 3 MINUTEN" },
];

const SocialProofBar = () => (
  <div className="py-4 bg-card border-y border-border">
    <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
          {i > 0 && <span className="hidden sm:inline mr-4 text-border">|</span>}
          {item.icon} {item.text}
        </span>
      ))}
    </div>
  </div>
);

export default SocialProofBar;
