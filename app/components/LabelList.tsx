import { Badge, SectionTitle } from "./shared";

export function LabelList({
  labels,
  title,
}: {
  labels: string[];
  title: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>
        {title} ({labels.length})
      </SectionTitle>
      {labels.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Žádné entity nenalezeny.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {labels.map((label, i) => (
            <Badge key={`${label}-${i}`}>{label}</Badge>
          ))}
        </div>
      )}
    </div>
  );
}
