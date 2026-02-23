import { useMemo } from "react";
import { Check, X } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

const rules = [
  { label: "Min. 8 Zeichen", test: (p: string) => p.length >= 8 },
  { label: "Großbuchstabe", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Kleinbuchstabe", test: (p: string) => /[a-z]/.test(p) },
  { label: "Zahl", test: (p: string) => /\d/.test(p) },
  { label: "Sonderzeichen", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const results = useMemo(() => rules.map(r => ({ ...r, pass: r.test(password) })), [password]);
  const score = results.filter(r => r.pass).length;

  const strength = score <= 1 ? "Schwach" : score <= 3 ? "Mittel" : score <= 4 ? "Stark" : "Sehr stark";
  const color = score <= 1 ? "bg-destructive" : score <= 3 ? "bg-warning" : "bg-success";

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? color : "bg-muted"}`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${score <= 1 ? "text-destructive" : score <= 3 ? "text-warning" : "text-success"}`}>
        {strength}
      </p>
      <ul className="space-y-1">
        {results.map(r => (
          <li key={r.label} className={`flex items-center gap-1.5 text-xs ${r.pass ? "text-success" : "text-muted-foreground"}`}>
            {r.pass ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            {r.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordStrengthIndicator;
