"use client";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      {icon && (
        <div className="size-10 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground/40">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <p className="text-xs font-black uppercase tracking-widest text-foreground">{title}</p>
        {subtitle && (
          <p className="text-[10px] text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
