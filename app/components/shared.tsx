import type { Reference } from "../lib/types";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
      {children}
    </p>
  );
}

export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
      {children}
    </span>
  );
}

export function ReferenceList({ references }: { references: Reference[] }) {
  if (!references?.length) return null;
  return (
    <div className="flex flex-col gap-2">
      <SectionTitle>Zdroje ({references.length})</SectionTitle>
      <ol className="flex flex-col gap-1.5">
        {references.map((ref) => (
          <li
            key={ref.reference_id}
            className="flex gap-2 text-sm text-zinc-700 dark:text-zinc-300"
          >
            <span className="shrink-0 font-mono text-zinc-400">
              [{ref.reference_id}]
            </span>
            <span className="break-all">{ref.file_path}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
