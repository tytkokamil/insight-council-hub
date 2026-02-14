import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  avatarUrl?: string | null;
  fullName?: string | null;
  email?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-7 h-7 text-[10px]",
  md: "w-8 h-8 text-[11px]",
  lg: "w-12 h-12 text-sm",
};

const getInitials = (fullName?: string | null, email?: string | null) => {
  if (fullName) {
    return fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  }
  return email?.slice(0, 2).toUpperCase() ?? "??";
};

const UserAvatar = ({ avatarUrl, fullName, email, size = "md", className }: UserAvatarProps) => {
  const initials = getInitials(fullName, email);

  return (
    <Avatar className={cn(sizeClasses[size], "rounded-lg shrink-0", className)}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName || "Avatar"} className="object-cover" />}
      <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
