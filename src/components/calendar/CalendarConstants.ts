export const priorityColor: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500 text-white dark:bg-orange-600",
  medium: "bg-primary text-primary-foreground",
  low: "bg-muted text-muted-foreground",
};

export const statusDot: Record<string, string> = {
  draft: "bg-muted-foreground",
  review: "bg-yellow-500",
  approved: "bg-green-500",
  implemented: "bg-primary",
  rejected: "bg-destructive",
};

export const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
export const WEEKDAYS_LONG = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

export type ViewMode = "month" | "week" | "day";
