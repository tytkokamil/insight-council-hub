export const priorityColor: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-warning text-warning-foreground",
  medium: "bg-primary text-primary-foreground",
  low: "bg-muted text-muted-foreground",
};

export const statusDot: Record<string, string> = {
  draft: "bg-muted-foreground",
  proposed: "bg-accent-foreground/60",
  review: "bg-warning",
  approved: "bg-success",
  rejected: "bg-destructive",
  implemented: "bg-primary",
  archived: "bg-muted-foreground/40",
};


export type ViewMode = "month" | "week" | "day";
