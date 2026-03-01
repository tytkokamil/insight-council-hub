import { useMemo } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  oldText: string;
  newText: string;
}

interface DiffSegment {
  type: "equal" | "added" | "removed";
  text: string;
}

/** Simple word-level diff */
function computeWordDiff(oldStr: string, newStr: string): DiffSegment[] {
  const oldWords = oldStr.split(/(\s+)/);
  const newWords = newStr.split(/(\s+)/);

  // LCS-based diff (simplified for reasonable-length texts)
  const m = oldWords.length;
  const n = newWords.length;

  // For very long texts, fall back to simple before/after
  if (m > 500 || n > 500) {
    return [
      { type: "removed", text: oldStr },
      { type: "added", text: newStr },
    ];
  }

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = oldWords[i - 1] === newWords[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // Backtrack
  const segments: DiffSegment[] = [];
  let i = m, j = n;
  const result: DiffSegment[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      result.push({ type: "equal", text: oldWords[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({ type: "added", text: newWords[j - 1] });
      j--;
    } else {
      result.push({ type: "removed", text: oldWords[i - 1] });
      i--;
    }
  }

  result.reverse();

  // Merge consecutive segments of the same type
  for (const seg of result) {
    if (segments.length > 0 && segments[segments.length - 1].type === seg.type) {
      segments[segments.length - 1].text += seg.text;
    } else {
      segments.push({ ...seg });
    }
  }

  return segments;
}

const DiffViewer = ({ oldText, newText }: Props) => {
  const { t } = useTranslation();
  const segments = useMemo(() => computeWordDiff(oldText, newText), [oldText, newText]);

  const hasChanges = segments.some(s => s.type !== "equal");
  if (!hasChanges) {
    return <p className="text-xs text-muted-foreground italic">{t("audit.noTextChanges")}</p>;
  }

  return (
    <div className="rounded-lg border border-border/60 overflow-hidden">
      <div className="bg-muted/30 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground border-b border-border/60 flex items-center gap-2">
        {t("audit.diffTitle")}
      </div>
      <div className="p-3 text-xs font-mono leading-relaxed whitespace-pre-wrap break-words">
        {segments.map((seg, i) => {
          if (seg.type === "removed") {
            return (
              <span key={i} className="bg-destructive/15 text-destructive line-through rounded px-0.5">
                {seg.text}
              </span>
            );
          }
          if (seg.type === "added") {
            return (
              <span key={i} className="bg-primary/15 text-primary rounded px-0.5">
                {seg.text}
              </span>
            );
          }
          return <span key={i}>{seg.text}</span>;
        })}
      </div>
    </div>
  );
};

export default DiffViewer;
