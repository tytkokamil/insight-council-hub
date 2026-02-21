import { memo } from "react";
import { LogOut } from "lucide-react";
import UserAvatar from "@/components/shared/UserAvatar";
import NotificationCenter from "./NotificationCenter";

interface SidebarFooterProps {
  collapsed: boolean;
  user: any;
  avatarUrl: string | null;
  onSignOut: () => void;
}

const SidebarFooter = memo(({
  collapsed,
  user,
  avatarUrl,
  onSignOut,
}: SidebarFooterProps) => (
  <>
    <div className="py-1.5 border-t border-border/40">
      <NotificationCenter collapsed={collapsed} />
    </div>
    <div className="px-2 py-2 border-t border-border/40">
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-foreground/[0.04] transition-colors">
        <UserAvatar avatarUrl={avatarUrl} fullName={user?.user_metadata?.full_name} email={user?.email} />
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate text-foreground">
                {user?.user_metadata?.full_name || user?.email}
              </p>
            </div>
            <button
              onClick={onSignOut}
              className="text-muted-foreground/50 hover:text-foreground transition-colors p-1 rounded-md hover:bg-foreground/[0.04]"
              title="Abmelden"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  </>
));

SidebarFooter.displayName = "SidebarFooter";

export default SidebarFooter;
