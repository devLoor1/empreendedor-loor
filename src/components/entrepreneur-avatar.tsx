import { UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type EntrepreneurAvatarProps = {
  src?: string;
  name?: string | null;
  email?: string | null;
  className?: string;
  fallbackClassName?: string;
};

function getEntrepreneurInitials(name?: string | null, email?: string | null) {
  const value = name?.trim() || email?.split("@")[0] || "Empreendedor";
  const parts = value
    .split(/\s|[._-]/)
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase()).join("") || "EM";
}

export function EntrepreneurAvatar({
  src,
  name,
  email,
  className,
  fallbackClassName,
}: EntrepreneurAvatarProps) {
  const initials = getEntrepreneurInitials(name, email);

  return (
    <Avatar className={cn("border border-border bg-muted", className)}>
      <AvatarImage src={src || undefined} alt={name || "Avatar do empreendedor"} />
      <AvatarFallback
        className={cn(
          "bg-primary/10 text-primary ring-1 ring-primary/10",
          fallbackClassName,
        )}
      >
        {initials || <UserRound className="h-4 w-4" />}
      </AvatarFallback>
    </Avatar>
  );
}
