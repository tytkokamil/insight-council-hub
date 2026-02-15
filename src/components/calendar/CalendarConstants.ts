export const priorityColor: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-warning text-warning-foreground",
  medium: "bg-primary text-primary-foreground",
  low: "bg-muted text-muted-foreground",
};

export const statusDot: Record<string, string> = {
  draft: "bg-muted-foreground",
  review: "bg-warning",
  approved: "bg-success",
  implemented: "bg-primary",
  rejected: "bg-destructive",
};

export const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
export const WEEKDAYS_LONG = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

export type ViewMode = "month" | "week" | "day";
