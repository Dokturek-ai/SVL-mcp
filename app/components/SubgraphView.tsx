import type { GraphEdge, GraphNode } from "../lib/types";
import { Badge, Card, SectionTitle } from "./shared";

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}

function nodeLabel(node: GraphNode): string {
  const props = node.properties ?? {};
  return (
    nonEmptyString(props.entity_id) ??
    nonEmptyString(props.name) ??
    nonEmptyString(node.labels?.[0]) ??
    node.id
  );
}

export function SubgraphView({
  label,
  nodes,
  edges,
  truncated,
  total_nodes,
  total_edges,
}: {
  label: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  truncated?: boolean;
  total_nodes?: number;
  total_edges?: number;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <SectionTitle>Podgraf</SectionTitle>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {label}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Badge>{total_nodes ?? nodes.length} uzlů</Badge>
          <Badge>{total_edges ?? edges.length} hran</Badge>
          {truncated && <Badge>zobrazen výřez</Badge>}
        </div>
      </div>

      {nodes.length > 0 && (
        <div className="flex flex-col gap-2">
          <SectionTitle>Uzly</SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {nodes.map((n) => (
              <Badge key={n.id}>{nodeLabel(n)}</Badge>
            ))}
          </div>
        </div>
      )}

      {edges.length > 0 && (
        <div className="flex flex-col gap-2">
          <SectionTitle>Hrany</SectionTitle>
          <Card>
            <ul className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
              {edges.map((e, i) => (
                <li key={e.id ?? `${e.source}-${e.target}-${i}`}>
                  {e.source} → {e.target}
                  {e.type ? (
                    <span className="text-zinc-400"> ({e.type})</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
