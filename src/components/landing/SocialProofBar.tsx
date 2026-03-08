const items = [
  { icon: "🔒", text: "DSGVO-KONFORM" },
  { icon: "🇩🇪", text: "SERVER IN DEUTSCHLAND" },
  { icon: "🔐", text: "SHA-256 AUDIT TRAIL" },
  { icon: "📋", text: "AVV INKLUSIVE" },
  { icon: "⚡", text: "SETUP IN 3 MINUTEN" },
];

const SocialProofBar = () => (
  <div className="py-4" style={{ background: "#FFFFFF", borderTop: "1px solid #F1F5F9", borderBottom: "1px solid #F1F5F9" }}>
    <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5 text-[13px] font-medium" style={{ color: "#64748B" }}>
          {i > 0 && <span className="hidden sm:inline mr-4" style={{ color: "#E2E8F0" }}>|</span>}
          {item.icon} {item.text}
        </span>
      ))}
    </div>
  </div>
);

export default SocialProofBar;
