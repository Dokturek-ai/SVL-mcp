import "server-only";

// ---------------------------------------------------------------------------
// Server-only HTTP klient pro LightRAG FastAPI.
//
// Čte se výhradně z route handleru (app/mcp/route.ts). Nikdy neimportovat
// z klientské komponenty — `import "server-only"` je pojistka, která jinak
// shodí build a zabrání úniku API klíče do prohlížeče.
// ---------------------------------------------------------------------------

const BASE_URL = (process.env.LIGHTRAG_BASE_URL ?? "").replace(/\/$/, "");
const API_KEY = process.env.LIGHTRAG_API_KEY ?? "";

const DEFAULT_TIMEOUT_MS = 60_000; // /query bývá pomalé (generuje LLM)
const HEALTH_TIMEOUT_MS = 10_000;

export class LightRagError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly body?: string,
  ) {
    super(message);
    this.name = "LightRagError";
  }
}

async function request<T>(
  path: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<T> {
  if (!BASE_URL) {
    throw new LightRagError(
      "LIGHTRAG_BASE_URL není nastaveno (zkontrolujte konfiguraci prostředí).",
    );
  }

  const { timeoutMs = DEFAULT_TIMEOUT_MS, headers, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
        ...headers,
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new LightRagError(
        `Volání LightRAG ${path} selhalo (HTTP ${res.status}).`,
        res.status,
        body.slice(0, 500),
      );
    }

    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof LightRagError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new LightRagError(
        `Volání LightRAG ${path} vypršelo po ${timeoutMs} ms.`,
      );
    }
    throw new LightRagError(
      `Síťová chyba při volání LightRAG ${path}: ${String(err)}`,
    );
  } finally {
    clearTimeout(timer);
  }
}

function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) sp.set(key, String(value));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

// ---------------------------------------------------------------------------
// Typy odpovědí (podmnožina modelů LightRAG API potřebná pro widget).
// ---------------------------------------------------------------------------

export interface Reference {
  reference_id: string;
  file_path: string;
  content?: string[];
}

export interface QueryResponse {
  response: string;
  references?: Reference[];
}

export interface QueryEntity {
  entity_name?: string;
  entity_type?: string;
  description?: string;
  file_path?: string;
  reference_id?: string;
  [key: string]: unknown;
}

export interface QueryRelationship {
  src_id?: string;
  tgt_id?: string;
  description?: string;
  keywords?: string;
  weight?: number;
  file_path?: string;
  reference_id?: string;
  [key: string]: unknown;
}

export interface QueryChunk {
  content?: string;
  file_path?: string;
  chunk_id?: string;
  reference_id?: string;
  [key: string]: unknown;
}

export interface QueryDataResponse {
  status: string;
  message: string;
  data: {
    entities?: QueryEntity[];
    relationships?: QueryRelationship[];
    chunks?: QueryChunk[];
    references?: Reference[];
  };
  metadata: Record<string, unknown>;
}

export interface KnowledgeGraphNode {
  id: string;
  labels?: string[];
  properties?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface KnowledgeGraphEdge {
  id?: string;
  source: string;
  target: string;
  type?: string;
  properties?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SubgraphResponse {
  nodes?: KnowledgeGraphNode[];
  edges?: KnowledgeGraphEdge[];
  is_truncated?: boolean;
  [key: string]: unknown;
}

export interface DocStatusItem {
  id: string;
  content_summary: string;
  content_length: number;
  status: string;
  created_at: string;
  updated_at: string;
  track_id?: string | null;
  chunks_count?: number | null;
  error_msg?: string | null;
  file_path: string;
  [key: string]: unknown;
}

export interface PaginationInfo {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedDocsResponse {
  documents: DocStatusItem[];
  pagination: PaginationInfo;
  status_counts: Record<string, number>;
}

export interface HealthResponse {
  status: string;
  webui_available?: boolean;
  working_directory?: string;
  input_directory?: string;
  configuration?: Record<string, unknown>;
  auth_mode?: string;
  pipeline_busy?: boolean;
  core_version?: string;
  api_version?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Vstupy (zrcadlí QueryRequest / DocumentsRequest z LightRAG).
// ---------------------------------------------------------------------------

export interface QueryRequestBody {
  query: string;
  mode?: string;
  top_k?: number;
  chunk_top_k?: number;
  response_type?: string;
  enable_rerank?: boolean;
  include_references?: boolean;
  include_chunk_content?: boolean;
  user_prompt?: string;
  stream?: boolean;
}

export interface DocumentsRequestBody {
  status_filters?: string[];
  page?: number;
  page_size?: number;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
}

// ---------------------------------------------------------------------------
// Typované funkce 1:1 s read-only endpointy LightRAG.
// ---------------------------------------------------------------------------

export const queryRag = (body: QueryRequestBody) =>
  request<QueryResponse>("/query", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const retrieveContext = (body: QueryRequestBody) =>
  request<QueryDataResponse>("/query/data", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const searchEntities = (q: string, limit = 50) =>
  request<string[]>(`/graph/label/search${qs({ q, limit })}`, {
    method: "GET",
  });

export const getSubgraph = (label: string, max_depth = 3, max_nodes = 1000) =>
  request<SubgraphResponse>(`/graphs${qs({ label, max_depth, max_nodes })}`, {
    method: "GET",
  });

export const listLabels = () =>
  request<string[]>("/graph/label/list", { method: "GET" });

export const listDocuments = (body: DocumentsRequestBody) =>
  request<PaginatedDocsResponse>("/documents/paginated", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const healthCheck = () =>
  request<HealthResponse>("/health", {
    method: "GET",
    timeoutMs: HEALTH_TIMEOUT_MS,
  });
