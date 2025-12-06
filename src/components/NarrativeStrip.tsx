type NarrativeStripProps = {
  items: string[];
};

export function NarrativeStrip({ items }: NarrativeStripProps) {
  return (
    <div className="flex flex-col gap-2 text-sm text-muted">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="flex items-start gap-2 rounded-lg bg-white/5 px-3 py-2"
        >
          <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          <p className="leading-relaxed text-foreground">{item}</p>
        </div>
      ))}
    </div>
  );
}
