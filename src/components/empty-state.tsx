import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  aside?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  aside,
  className,
}: EmptyStateProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden border-border/60 bg-card text-card-foreground shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0 space-y-2">
            <h3 className="text-lg font-semibold leading-tight text-foreground">{title}</h3>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
            {action && <div className="flex flex-wrap gap-2 pt-2">{action}</div>}
          </div>
        </div>
        {aside && <div className="min-w-0 lg:w-64">{aside}</div>}
      </div>
    </Card>
  );
}
