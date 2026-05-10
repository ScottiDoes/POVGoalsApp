interface ComponentsSectionProps {
  components: string[];
}

export function ComponentsSection({ components }: ComponentsSectionProps) {
  if (components.length === 0) return null;

  return (
    <div className="border-t border-border mt-4 pt-3">
      {components.map((text, i) => (
        <div key={i} className="flex items-center gap-2 py-1 text-sm text-foreground/80">
          <span className="h-1 w-1 rounded-full bg-primary/60 shrink-0" />
          <span>{text}</span>
        </div>
      ))}
    </div>
  );
}
