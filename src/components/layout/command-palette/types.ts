export interface CommandAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "navigation" | "decisions" | "reviews" | "team" | "settings" | "context" | "recent-actions";
  shortcut?: string;
  onSelect: () => void;
  keywords?: string;
  color?: string;
}

export interface RecentAction {
  label: string;
  timestamp: number;
  path?: string;
}
