import { z } from "zod";

// ---------------------------------------------------------------------------
// Zod vstupní schémata MCP nástrojů.
//
// `registerAppTool` očekává `inputSchema` jako objekt syrových zod tvarů
// (raw shape), NE jako `z.object(...)`. Proto exportujeme objekty tvarů.
// Popisy `.describe()` jsou česky — host je zobrazuje uživateli a předává LLM.
// ---------------------------------------------------------------------------

const modeEnum = z
  .enum(["local", "global", "hybrid", "naive", "mix", "bypass"])
  .describe(
    "Režim vyhledávání: 'mix' (výchozí, kombinuje graf i vektory), 'local' " +
      "(entity a jejich vztahy), 'global' (vzory napříč grafem), 'hybrid', " +
      "'naive' (jen vektorové podobnosti), 'bypass' (přímo LLM bez RAG).",
  );

export const queryRagShape = {
  query: z
    .string()
    .min(3)
    .describe("Dotaz v přirozeném jazyce (minimálně 3 znaky)."),
  mode: modeEnum.default("mix"),
  top_k: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe("Počet nejrelevantnějších entit/vztahů k načtení."),
  chunk_top_k: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe("Počet nejrelevantnějších textových úseků (chunků)."),
  response_type: z
    .string()
    .optional()
    .describe(
      "Formát odpovědi, např. 'Multiple Paragraphs', 'Single Paragraph', 'Bullet Points'.",
    ),
  enable_rerank: z
    .boolean()
    .optional()
    .describe("Zapnout přeřazování (rerank) načtených úseků. Výchozí true."),
  include_references: z
    .boolean()
    .optional()
    .describe("Zahrnout do odpovědi citace zdrojů. Výchozí true."),
  user_prompt: z
    .string()
    .optional()
    .describe("Dodatečná instrukce pro generování odpovědi."),
} as const;

export const retrieveContextShape = {
  query: z
    .string()
    .min(3)
    .describe("Dotaz v přirozeném jazyce (minimálně 3 znaky)."),
  mode: modeEnum.default("mix"),
  top_k: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe("Počet nejrelevantnějších entit/vztahů k načtení."),
  chunk_top_k: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe("Počet nejrelevantnějších textových úseků (chunků)."),
  include_chunk_content: z
    .boolean()
    .optional()
    .describe("Vrátit i plný text úseků (chunků). Výchozí false."),
} as const;

export const searchEntitiesShape = {
  q: z
    .string()
    .min(1)
    .describe("Hledaný řetězec v názvech entit (labelů) — fuzzy shoda."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(50)
    .describe("Maximální počet výsledků (1–100, výchozí 50)."),
} as const;

export const getSubgraphShape = {
  label: z
    .string()
    .min(1)
    .describe("Název entity (labelu), z níž se rozvine podgraf."),
  max_depth: z
    .number()
    .int()
    .min(1)
    .default(3)
    .describe("Maximální hloubka průchodu grafem (výchozí 3)."),
  max_nodes: z
    .number()
    .int()
    .min(1)
    .max(5000)
    .default(1000)
    .describe("Maximální počet uzlů (výchozí 1000)."),
} as const;

export const listLabelsShape = {} as const;

export const listDocumentsShape = {
  status_filters: z
    .array(z.enum(["pending", "processing", "processed", "failed"]))
    .optional()
    .describe(
      "Filtr stavů dokumentů (malými písmeny), např. ['processed', 'failed']. " +
        "Povolené hodnoty: 'pending', 'processing', 'processed', 'failed'. Prázdné = vše.",
    ),
  page: z
    .number()
    .int()
    .min(1)
    .default(1)
    .describe("Číslo stránky (od 1)."),
  page_size: z
    .number()
    .int()
    .min(10)
    .max(200)
    .default(50)
    .describe("Počet dokumentů na stránku (10–200, výchozí 50)."),
  sort_field: z
    .enum(["created_at", "updated_at", "id", "file_path"])
    .optional()
    .describe("Pole pro řazení (výchozí 'updated_at')."),
  sort_direction: z
    .enum(["asc", "desc"])
    .optional()
    .describe("Směr řazení (výchozí 'desc')."),
} as const;

export const healthCheckShape = {} as const;
