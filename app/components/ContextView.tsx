import type { Chunk, Entity, Reference, Relationship } from "../lib/types";
import { Badge, Card, ReferenceList, SectionTitle } from "./shared";

export function ContextView({
  query,
  mode,
  entities,
  relationships,
  chunks,
  total_chunks,
  truncated,
  references,
}: {
  query: string;
  mode: string;
  entities: Entity[];
  relationships: Relationship[];
  chunks: Chunk[];
  total_chunks?: number;
  truncated?: boolean;
  references: Reference[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <SectionTitle>Načtený kontext</SectionTitle>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{query}</p>
        <div className="flex flex-wrap gap-1.5">
          <Badge>režim: {mode}</Badge>
          <Badge>{entities.length} entit</Badge>
          <Badge>{relationships.length} vztahů</Badge>
          <Badge>{total_chunks ?? chunks.length} úseků</Badge>
          {truncated && <Badge>zobrazen výřez</Badge>}
        </div>
      </div>

      {entities.length > 0 && (
        <div className="flex flex-col gap-2">
          <SectionTitle>Entity</SectionTitle>
          <div className="flex flex-col gap-2">
            {entities.map((e, i) => (
              <Card key={`${e.entity_name}-${i}`}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {e.entity_name}
                  </span>
                  {e.entity_type && <Badge>{e.entity_type}</Badge>}
                </div>
                {e.description && (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {e.description}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {relationships.length > 0 && (
        <div className="flex flex-col gap-2">
          <SectionTitle>Vztahy</SectionTitle>
          <div className="flex flex-col gap-2">
            {relationships.map((r, i) => (
              <Card key={`${r.src_id}-${r.tgt_id}-${i}`}>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {r.src_id ?? "?"} → {r.tgt_id ?? "?"}
                </p>
                {r.description && (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {r.description}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {chunks.length > 0 && (
        <div className="flex flex-col gap-2">
          <SectionTitle>Textové úseky</SectionTitle>
          <div className="flex flex-col gap-2">
            {chunks.map((c, i) => (
              <Card key={c.chunk_id ?? i}>
                {c.file_path && (
                  <p className="mb-1 font-mono text-xs text-zinc-400">
                    {c.file_path}
                  </p>
                )}
                {c.content && (
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    {c.content}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      <ReferenceList references={references} />
    </div>
  );
}
