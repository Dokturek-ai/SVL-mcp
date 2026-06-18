import { baseURL } from "@/baseUrl";
import { createMcpHandler, withMcpAuth } from "mcp-handler";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { verify } from "@/app/lib/auth";
import {
  registerAppTool,
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import {
  queryRag,
  retrieveContext,
  searchEntities,
  getSubgraph,
  listLabels,
  listDocuments,
  healthCheck,
  LightRagError,
} from "@/app/lib/lightrag";
import {
  queryRagShape,
  retrieveContextShape,
  searchEntitiesShape,
  getSubgraphShape,
  listLabelsShape,
  listDocumentsShape,
  healthCheckShape,
} from "@/app/lib/schemas";

// Vercel serverless: /query může generovat odpověď desítky sekund.
// 60 s je strop pro Hobby plán; na Pro/Fluid compute lze zvýšit (max 300 s).
export const maxDuration = 60;

const UI_VERSION = "2026-06-17-01";
const RESOURCE_URI = `ui://app/index.html?v=${UI_VERSION}`;

// Pojistka proti přetečení widgetu velkými payloady.
const MAX_SUBGRAPH_NODES = 500;
const MAX_SUBGRAPH_EDGES = 1000;
const MAX_CHUNKS = 50;

// ---------------------------------------------------------------------------
// Self-fetch: stáhne vyrenderovanou Next.js stránku jako HTML widgetu.
// ---------------------------------------------------------------------------
async function fetchPageHtml(path: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(`${baseURL}${path}`, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(
        `Načtení HTML widgetu selhalo: HTTP ${res.status} pro ${path}.`,
      );
    }
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Jednotné ošetření chyb — vrací isError + strukturovaný obsah pro widget.
// ---------------------------------------------------------------------------
function errorResult(tool: string, err: unknown) {
  const msg = err instanceof LightRagError ? err.message : String(err);
  return {
    isError: true,
    content: [{ type: "text" as const, text: `Chyba: ${msg}` }],
    structuredContent: { kind: "error", tool, error: msg },
  };
}

function text(value: string) {
  return { type: "text" as const, text: value };
}

// ---------------------------------------------------------------------------
// MCP handler
// ---------------------------------------------------------------------------
const handler = createMcpHandler(async (server) => {
  registerAppResource(
    server,
    "app-widget",
    RESOURCE_URI,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => {
      const html = await fetchPageHtml("/widget");
      return {
        contents: [
          {
            uri: RESOURCE_URI,
            mimeType: RESOURCE_MIME_TYPE,
            text: html,
            _meta: {
              ui: {
                csp: {
                  connectDomains: [baseURL],
                  resourceDomains: [baseURL],
                },
              },
            },
          },
        ],
      };
    },
  );

  const READ_ONLY = {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true,
  } as const;
  const UI_META = { ui: { resourceUri: RESOURCE_URI } } as const;

  // --- 1. query_rag -------------------------------------------------------
  registerAppTool(
    server,
    "query_rag",
    {
      title: "Dotaz do znalostní báze",
      description:
        "Položí dotaz znalostní bázi LightRAG a vrátí vygenerovanou odpověď " +
        "včetně citací zdrojů. Pouze pro čtení. Parametr 'mode' řídí strategii " +
        "vyhledávání (výchozí 'mix' kombinuje grafové a vektorové vyhledávání).",
      inputSchema: queryRagShape,
      annotations: READ_ONLY,
      _meta: UI_META,
    },
    async (args) => {
      try {
        const res = await queryRag({ ...args, stream: false });
        const refs = res.references ?? [];
        const refLabel =
          refs.length === 1
            ? "1 zdroj"
            : `${refs.length} ${refs.length >= 2 && refs.length <= 4 ? "zdroje" : "zdrojů"}`;
        return {
          content: [text(`${res.response}\n\n(${refLabel})`)],
          structuredContent: {
            kind: "query_rag",
            query: args.query,
            mode: args.mode ?? "mix",
            response: res.response,
            references: refs,
          },
        };
      } catch (err) {
        return errorResult("query_rag", err);
      }
    },
  );

  // --- 2. retrieve_context ------------------------------------------------
  registerAppTool(
    server,
    "retrieve_context",
    {
      title: "Načíst kontext (bez generování)",
      description:
        "Vrátí surový načtený kontext z LightRAG — entity, vztahy a textové " +
        "úseky (chunky) — bez generování odpovědi LLM. Vhodné pro analýzu, " +
        "ladění a vlastní zpracování. Pouze pro čtení.",
      inputSchema: retrieveContextShape,
      annotations: READ_ONLY,
      _meta: UI_META,
    },
    async (args) => {
      try {
        const res = await retrieveContext({ ...args, stream: false });
        const data = res.data ?? {};
        const entities = data.entities ?? [];
        const relationships = data.relationships ?? [];
        const allChunks = data.chunks ?? [];
        const chunks = allChunks.slice(0, MAX_CHUNKS);
        const references = data.references ?? [];
        return {
          content: [
            text(
              `Načteno: ${entities.length} entit, ${relationships.length} vztahů, ` +
                `${allChunks.length} úseků, ${references.length} zdrojů.`,
            ),
          ],
          structuredContent: {
            kind: "retrieve_context",
            query: args.query,
            mode: args.mode ?? "mix",
            entities,
            relationships,
            chunks,
            total_chunks: allChunks.length,
            truncated: allChunks.length > chunks.length,
            references,
            metadata: res.metadata ?? {},
          },
        };
      } catch (err) {
        return errorResult("retrieve_context", err);
      }
    },
  );

  // --- 3. search_entities -------------------------------------------------
  registerAppTool(
    server,
    "search_entities",
    {
      title: "Hledat entity",
      description:
        "Fuzzy vyhledávání entit (labelů) v grafu znalostí podle textu. " +
        "Vrací seznam názvů entit seřazený podle relevance. Pouze pro čtení.",
      inputSchema: searchEntitiesShape,
      annotations: READ_ONLY,
      _meta: UI_META,
    },
    async (args) => {
      try {
        const labels = await searchEntities(args.q, args.limit);
        return {
          content: [
            text(
              `Nalezeno ${labels.length} entit pro „${args.q}“: ` +
                labels.slice(0, 30).join(", ") +
                (labels.length > 30 ? " …" : ""),
            ),
          ],
          structuredContent: {
            kind: "search_entities",
            q: args.q,
            labels,
          },
        };
      } catch (err) {
        return errorResult("search_entities", err);
      }
    },
  );

  // --- 4. get_subgraph ----------------------------------------------------
  registerAppTool(
    server,
    "get_subgraph",
    {
      title: "Získat podgraf entity",
      description:
        "Vrátí propojený podgraf (uzly a hrany) okolo zadané entity do " +
        "určené hloubky. Pouze pro čtení.",
      inputSchema: getSubgraphShape,
      annotations: READ_ONLY,
      _meta: UI_META,
    },
    async (args) => {
      try {
        const res = await getSubgraph(
          args.label,
          args.max_depth,
          args.max_nodes,
        );
        const allNodes = res.nodes ?? [];
        const allEdges = res.edges ?? [];
        const nodes = allNodes.slice(0, MAX_SUBGRAPH_NODES);
        const edges = allEdges.slice(0, MAX_SUBGRAPH_EDGES);
        return {
          content: [
            text(
              `Podgraf entity „${args.label}“: ${allNodes.length} uzlů, ${allEdges.length} hran.`,
            ),
          ],
          structuredContent: {
            kind: "get_subgraph",
            label: args.label,
            nodes,
            edges,
            truncated:
              allNodes.length > nodes.length || allEdges.length > edges.length,
            total_nodes: allNodes.length,
            total_edges: allEdges.length,
          },
        };
      } catch (err) {
        return errorResult("get_subgraph", err);
      }
    },
  );

  // --- 5. list_labels -----------------------------------------------------
  registerAppTool(
    server,
    "list_labels",
    {
      title: "Vypsat všechny entity",
      description:
        "Vrátí seznam všech entit (labelů) ve znalostním grafu. Pouze pro čtení.",
      inputSchema: listLabelsShape,
      annotations: READ_ONLY,
      _meta: UI_META,
    },
    async () => {
      try {
        const labels = await listLabels();
        return {
          content: [
            text(
              `Graf obsahuje ${labels.length} entit. ` +
                `Prvních ${Math.min(30, labels.length)}: ` +
                labels.slice(0, 30).join(", ") +
                (labels.length > 30 ? " …" : ""),
            ),
          ],
          structuredContent: { kind: "list_labels", labels },
        };
      } catch (err) {
        return errorResult("list_labels", err);
      }
    },
  );

  // --- 6. list_documents --------------------------------------------------
  registerAppTool(
    server,
    "list_documents",
    {
      title: "Vypsat dokumenty",
      description:
        "Vrátí stránkovaný seznam dokumentů ve znalostní bázi včetně jejich " +
        "stavu zpracování a souhrnných počtů podle stavu. Pouze pro čtení.",
      inputSchema: listDocumentsShape,
      annotations: READ_ONLY,
      _meta: UI_META,
    },
    async (args) => {
      try {
        const res = await listDocuments(args);
        const p = res.pagination ?? {
          page: 1,
          page_size: 0,
          total_count: 0,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        };
        return {
          content: [
            text(
              `Dokumenty: stránka ${p.page}/${p.total_pages}, ` +
                `celkem ${p.total_count}. ` +
                `Stavy: ${Object.entries(res.status_counts ?? {})
                  .map(([k, v]) => `${k}=${v}`)
                  .join(", ")}.`,
            ),
          ],
          structuredContent: {
            kind: "list_documents",
            documents: res.documents ?? [],
            pagination: p,
            status_counts: res.status_counts ?? {},
          },
        };
      } catch (err) {
        return errorResult("list_documents", err);
      }
    },
  );

  // --- 7. health_check ----------------------------------------------------
  registerAppTool(
    server,
    "health_check",
    {
      title: "Stav systému",
      description:
        "Vrátí stav serveru LightRAG a jeho konfiguraci (LLM, embedding, " +
        "úložiště, stav pipeline). Pouze pro čtení.",
      inputSchema: healthCheckShape,
      annotations: READ_ONLY,
      _meta: UI_META,
    },
    async () => {
      try {
        const res = await healthCheck();
        return {
          content: [
            text(
              `Stav LightRAG: ${res.status}` +
                (res.core_version ? ` (verze ${res.core_version})` : "") +
                (res.pipeline_busy ? ", pipeline zaneprázdněná" : "") +
                ".",
            ),
          ],
          structuredContent: { ...res, kind: "health_check" },
        };
      } catch (err) {
        return errorResult("health_check", err);
      }
    },
  );
});

// ---------------------------------------------------------------------------
// Vynucení přístupu: každý požadavek na MCP musí nést platný Bearer access
// token (vydaný OAuth tokem po ověření e-mailu). Bez něj vrací withMcpAuth
// 401 s hlavičkou WWW-Authenticate odkazující na metadata chráněného zdroje,
// což hostiteli spustí OAuth flow.
// ---------------------------------------------------------------------------
async function verifyToken(
  _req: Request,
  bearerToken?: string,
): Promise<AuthInfo | undefined> {
  if (!bearerToken) return undefined;
  try {
    const payload = verify<{ sub: string }>(bearerToken, "access");
    const email = typeof payload.sub === "string" ? payload.sub : "unknown";
    return {
      token: bearerToken,
      clientId: email,
      scopes: ["mcp"],
      ...(payload.exp ? { expiresAt: payload.exp } : {}),
      extra: { email },
    };
  } catch {
    return undefined;
  }
}

const authHandler = withMcpAuth(handler, verifyToken, {
  required: true,
  resourceMetadataPath: "/.well-known/oauth-protected-resource",
  resourceUrl: `${baseURL}/mcp`,
});

export const GET = authHandler;
export const POST = authHandler;
