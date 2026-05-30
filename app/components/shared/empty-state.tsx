import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed border-border/50 bg-muted/5 min-h-[160px] space-y-3">
      {icon && <div className="text-muted-foreground/45 flex items-center justify-center">{icon}</div>}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground max-w-[240px] leading-normal">{subtitle}</p>
        )}
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
