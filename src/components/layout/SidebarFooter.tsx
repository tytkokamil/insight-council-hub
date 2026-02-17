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
    <div className="py-2 border-t border-border">
      <NotificationCenter collapsed={collapsed} />
    </div>
    <div className="px-2 py-3 border-t border-border">
      <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors">
        <UserAvatar avatarUrl={avatarUrl} fullName={user?.user_metadata?.full_name} email={user?.email} />
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.user_metadata?.full_name || user?.email}
              </p>
              <p className="text-[10px] text-success flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                Online
              </p>
            </div>
            <button onClick={onSignOut} className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted/50">
              <LogOut className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  </>
));

SidebarFooter.displayName = "SidebarFooter";

export default SidebarFooter;
