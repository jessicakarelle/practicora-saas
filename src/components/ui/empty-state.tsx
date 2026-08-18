import type { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-muted/45 px-6 py-10 text-center">
      <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Icon className="size-5" aria-hidden />
      </div>
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
