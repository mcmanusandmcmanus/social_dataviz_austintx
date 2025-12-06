import { ReactNode } from "react";

type MosaicCardProps = {
  title: string;
  subtitle?: string;
  accent?: "cyan" | "amber" | "lime" | "violet";
  footer?: ReactNode;
  children: ReactNode;
};

const accentMap: Record<NonNullable<MosaicCardProps["accent"]>, string> = {
  cyan: "from-cyan-400/20 via-cyan-500/10 to-cyan-200/0 border-cyan-400/30",
  amber:
    "from-amber-300/25 via-orange-500/10 to-amber-200/0 border-amber-400/30",
  lime: "from-lime-300/30 via-emerald-500/10 to-lime-100/0 border-lime-400/30",
  violet:
    "from-violet-400/25 via-blue-600/10 to-indigo-300/0 border-violet-400/30",
};

export function MosaicCard({
  title,
  subtitle,
  accent = "cyan",
  footer,
  children,
}: MosaicCardProps) {
  const accentClass = accentMap[accent];
  return (
    <section
      className={`glass dotted-surface relative overflow-hidden rounded-2xl border p-5 text-foreground transition hover:-translate-y-0.5 hover:shadow-2xl`}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accentClass}`}
      />
      <div className="relative flex flex-col gap-3">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="section-title text-xs">{subtitle || "Austin TX"}</p>
            <h3 className="text-xl font-semibold text-foreground">{title}</h3>
          </div>
        </header>
        <div className="relative">{children}</div>
        {footer && <div className="relative text-sm text-muted">{footer}</div>}
      </div>
    </section>
  );
}
