// ---------------------------------------------------------------------------
// Sdílené typy widgetu (klientská strana).
//
// Záměrně oddělené od app/lib/lightrag.ts, který je `server-only` — tyto typy
// se importují i z klientských komponent. Tvar odpovídá `structuredContent`,
// který route handler posílá widgetu přes MCP bridge.
// ---------------------------------------------------------------------------

export interface Reference {
  reference_id: string;
  file_path: string;
  content?: string[];
}

export interface Entity {
  entity_name?: string;
  entity_type?: string;
  description?: string;
  file_path?: string;
  reference_id?: string;
}

export interface Relationship {
  src_id?: string;
  tgt_id?: string;
  description?: string;
  keywords?: string;
  weight?: number;
  reference_id?: string;
}

export interface Chunk {
  content?: string;
  file_path?: string;
  chunk_id?: string;
  reference_id?: string;
}

export interface GraphNode {
  id: string;
  labels?: string[];
  properties?: Record<string, unknown>;
}

export interface GraphEdge {
  id?: string;
  source: string;
  target: string;
  type?: string;
}

export interface DocItem {
  id: string;
  content_summary: string;
  content_length: number;
  status: string;
  created_at: string;
  updated_at: string;
  chunks_count?: number | null;
  error_msg?: string | null;
  file_path: string;
}

export interface Pagination {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export type RagResult =
  | {
      kind: "query_rag";
      query: string;
      mode: string;
      response: string;
      references: Reference[];
    }
  | {
      kind: "retrieve_context";
      query: string;
      mode: string;
      entities: Entity[];
      relationships: Relationship[];
      chunks: Chunk[];
      total_chunks?: number;
      truncated?: boolean;
      references: Reference[];
      metadata: Record<string, unknown>;
    }
  | { kind: "search_entities"; q: string; labels: string[] }
  | {
      kind: "get_subgraph";
      label: string;
      nodes: GraphNode[];
      edges: GraphEdge[];
      truncated?: boolean;
      total_nodes?: number;
      total_edges?: number;
    }
  | { kind: "list_labels"; labels: string[] }
  | {
      kind: "list_documents";
      documents: DocItem[];
      pagination: Pagination;
      status_counts: Record<string, number>;
    }
  | ({ kind: "health_check" } & Record<string, unknown>)
  | { kind: "error"; tool: string; error: string };
