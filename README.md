# Dokturek RAG MCP

MCP server, který zpřístupňuje znalostní bázi **LightRAG** přes sadu
**read-only** nástrojů a vizualizuje výsledky v interaktivním widgetu (MCP App).
Slouží ke konverzaci a dotazování nad RAG — generování odpovědí, načítání
kontextu a prohlížení grafu znalostí. Žádné zápisové ani mutační operace.

Postaveno na [Next.js](https://nextjs.org), [`mcp-handler`](https://github.com/vercel/mcp-handler)
a [`@modelcontextprotocol/ext-apps`](https://github.com/anthropics/ext-apps).

## Jak to funguje

Next.js aplikace plní dvě role:

1. **MCP server** (`app/mcp/route.ts`) — registruje nástroje a resource widgetu.
   Každý nástroj volá LightRAG FastAPI přes server-only klienta
   (`app/lib/lightrag.ts`) a vrací `structuredContent` s diskriminačním polem
   `kind`.
2. **Widget UI** (`app/page.tsx`) — React stránka, kterou hostitel MCP vykreslí
   v sandboxovaném iframe. MCP route si HTML stránky sám stáhne (self-fetch) a
   nabídne jako MCP resource. Widget podle `kind` vykreslí příslušný pohled
   (`app/components/*`).

Hook `useMcpApp` (`app/hooks/use-mcp-app.ts`) propojuje widget s hostitelem a
poskytuje výsledek nástroje jako React state. **API klíč LightRAG nikdy
neopouští server** — widget LightRAG nevolá, data dostává od hostitele přes
bridge.

## Nástroje

| Nástroj | LightRAG endpoint | Účel |
|---|---|---|
| `query_rag` | `POST /query` | Dotaz → vygenerovaná odpověď + citace zdrojů |
| `retrieve_context` | `POST /query/data` | Surový kontext (entity, vztahy, úseky) bez LLM |
| `search_entities` | `GET /graph/label/search` | Fuzzy hledání entit (labelů) |
| `get_subgraph` | `GET /graphs` | Podgraf okolo entity |
| `list_labels` | `GET /graph/label/list` | Výpis všech entit |
| `list_documents` | `POST /documents/paginated` | Stránkovaný seznam dokumentů |
| `health_check` | `GET /health` | Stav a konfigurace systému |

## Konfigurace prostředí

Viz `.env.example`. Pro lokální dev zkopírujte do `.env`:

| Proměnná | Popis |
|---|---|
| `LIGHTRAG_BASE_URL` | Základní URL LightRAG serveru (bez koncového lomítka) |
| `LIGHTRAG_API_KEY` | API klíč LightRAG (hlavička `X-API-Key`) |
| `BASE_URL` | Veřejná URL widgetu (tunel pro lokální dev) |

Na Vercelu nastavte `LIGHTRAG_BASE_URL` a `LIGHTRAG_API_KEY` v
**Project Settings → Environment Variables** (Production i Preview).

## Začínáme

```bash
pnpm install
```

### Lokální vývoj s tunelem

MCP hostitel vykresluje widget v iframe, který potřebuje veřejnou HTTPS URL.
Použijte [ngrok](https://ngrok.com) (nebo libovolný tunel):

```bash
ngrok http 3000
```

HTTPS URL vložte do `.env`:

```
BASE_URL=https://xxxx-xxx-xxx.ngrok-free.app
```

Spusťte dev server:

```bash
pnpm dev
```

### Připojení k hostiteli

V hostiteli MCP (Claude.ai / Cursor / ChatGPT) zaregistrujte MCP server na
adrese:

```
https://xxxx-xxx-xxx.ngrok-free.app/mcp
```

Např. v Settings → Apps / Connectors přidejte výše uvedenou URL.

### Kontrola a build

```bash
pnpm lint
pnpm build
```

## Struktura projektu

```
app/
  page.tsx              — Widget UI (router výsledků podle `kind`)
  components/           — View komponenty pro jednotlivé nástroje
  lib/lightrag.ts       — Server-only HTTP klient pro LightRAG + typy
  lib/schemas.ts        — Zod vstupní schémata nástrojů
  lib/types.ts          — Sdílené typy widgetu (klient)
  mcp/route.ts          — MCP server endpoint (registrace 7 nástrojů)
  hooks/use-mcp-app.ts  — React hook pro MCP Apps bridge
  layout.tsx            — Root layout s iframe bootstrap patchi
baseUrl.ts              — Resolver veřejné URL (tunel / Vercel)
middleware.ts           — CORS hlavičky pro cross-origin iframe
next.config.ts          — assetPrefix pro načítání assetů v iframe
```

## Nasazení (Vercel)

Projekt se nasazuje na [Vercel](https://vercel.com/new). Po nastavení env
proměnných (`LIGHTRAG_BASE_URL`, `LIGHTRAG_API_KEY`) je MCP endpoint dostupný na
`https://<vase-domena>/mcp`. `BASE_URL` se v produkci odvozuje automaticky z
proměnných Vercelu.

> **Pozn.:** `/query` generuje odpověď LLM a může trvat desítky sekund — limit
> serverless funkce je nastaven přes `maxDuration` v `app/mcp/route.ts`.

## Další zdroje

- [MCP Apps specification](https://spec.modelcontextprotocol.io/specification/)
- [@modelcontextprotocol/ext-apps](https://github.com/modelcontextprotocol/ext-apps)
- [mcp-handler](https://github.com/vercel/mcp-handler)
