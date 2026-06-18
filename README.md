# Dokturek RAG MCP

MCP server, který zpřístupňuje znalostní bázi **LightRAG** přes sadu
**read-only** nástrojů a vizualizuje výsledky v interaktivním widgetu (MCP App).
Slouží ke konverzaci a dotazování nad RAG — generování odpovědí, načítání
kontextu a prohlížení grafu znalostí. Žádné zápisové ani mutační operace.

Přístup k MCP je **chráněn bránou** (OAuth 2.1 + PKCE): hostitel uživatele
přesměruje na lead-formulář, ten potvrdí e-mail magic-linkem a teprve poté
získá přístupový token. Lead se ukládá do Notion. Viz
[Přístupová brána](#přístupová-brána-oauth--e-mail).

Postaveno na [Next.js](https://nextjs.org), [`mcp-handler`](https://github.com/vercel/mcp-handler)
a [`@modelcontextprotocol/ext-apps`](https://github.com/modelcontextprotocol/ext-apps).
Design landing page i formuláře vychází z [`DESIGN.md`](./DESIGN.md) (Doktůrek.ai).

## Jak to funguje

Next.js aplikace plní tři role:

1. **MCP server** (`app/mcp/route.ts`) — registruje nástroje a resource widgetu.
   Každý nástroj volá LightRAG FastAPI přes server-only klienta
   (`app/lib/lightrag.ts`) a vrací `structuredContent` s diskriminačním polem
   `kind`. Handler je obalen `withMcpAuth` — bez platného Bearer tokenu vrací 401.
2. **Widget UI** (`app/widget/page.tsx`) — React stránka, kterou hostitel MCP
   vykreslí v sandboxovaném iframe. MCP route si HTML stránky sám stáhne
   (self-fetch z `/widget`) a nabídne jako MCP resource. Widget podle `kind`
   vykreslí příslušný pohled (`app/components/*`).
3. **Veřejná landing page** (`app/page.tsx`) + **OAuth brána** (`app/oauth/*`,
   `app/.well-known/*`) — marketingová stránka a bezstavový OAuth/magic-link tok.

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
| `AUTH_SECRET` | Tajemství pro podpis OAuth tokenů (HS256). `openssl rand -base64 48` |
| `RESEND_API_KEY` | API klíč [Resend](https://resend.com) pro magic-link e-maily |
| `EMAIL_FROM` | Odesílatel na ověřené doméně, např. `Doktůrek.ai <noreply@dokturek.ai>` |
| `NOTION_TOKEN` | Token interní Notion integrace (databáze s ní nasdílená) |
| `NOTION_DATABASE_ID` | ID Notion databáze pro ukládání leadů |

Na Vercelu nastavte všechny proměnné v **Project Settings → Environment
Variables** (Production i Preview).

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
  page.tsx              — Veřejná landing page (Doktůrek.ai design)
  widget/page.tsx       — Widget UI (router výsledků podle `kind`)
  components/           — View komponenty pro jednotlivé nástroje
  lib/lightrag.ts       — Server-only HTTP klient pro LightRAG + typy
  lib/schemas.ts        — Zod vstupní schémata nástrojů
  lib/types.ts          — Sdílené typy widgetu (klient)
  lib/auth.ts           — Stateless JWT (HS256) + PKCE pro OAuth bránu
  lib/resend.ts         — Odeslání magic-link e-mailu (Resend)
  lib/notion.ts         — Zápis leadu do Notion (REST)
  mcp/route.ts          — MCP endpoint (7 nástrojů) obalený withMcpAuth
  oauth/                — authorize (formulář), submit, verify, token, register
  .well-known/          — OAuth metadata (authorization server + protected resource)
  hooks/use-mcp-app.ts  — React hook pro MCP Apps bridge
  layout.tsx            — Root layout, fonty a iframe bootstrap (jen v iframe)
  globals.css           — Design tokeny (DESIGN.md)
baseUrl.ts              — Resolver veřejné URL (tunel / Vercel)
middleware.ts           — CORS hlavičky pro cross-origin iframe
next.config.ts          — assetPrefix pro načítání assetů v iframe
```

## Přístupová brána (OAuth + e-mail)

Přístup k `/mcp` je chráněn standardním OAuth 2.1 tokem s PKCE. Celý tok je
**bezstavový** — neukládá se žádná DB ani Redis; každý artefakt (registrace
klienta, autorizační požadavek, magic-link, authorization code i access token)
je podepsaný JWT (HS256) s tajemstvím `AUTH_SECRET`.

```
hostitel → /authorize → lead-formulář → e-mail (Resend) → /verify
        → zápis leadu do Notion → authorization code → /token → access token → /mcp
```

1. Hostitel objeví OAuth z `WWW-Authenticate` (401) a metadat
   `/.well-known/oauth-protected-resource` → `/.well-known/oauth-authorization-server`.
2. Dynamická registrace klienta (`/oauth/register`) vrací bezstavový `client_id`.
3. Uživatel na `/oauth/authorize` vyplní formulář (jméno, příjmení, e-mail, pozice).
4. `/oauth/submit` pošle magic-link e-mailem (Resend).
5. `/oauth/verify` ověří odkaz, zapíše lead do Notion a vydá authorization code.
6. `/oauth/token` vymění code (+PKCE) za access token; ten ověřuje `withMcpAuth`.

> Výpadek Notion **neblokuje** přístup — zápis leadu je best-effort a chyba se
> jen zaloguje. Magic-link i authorization code mají krátkou platnost (viz
> `TTL` v `app/lib/auth.ts`).

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
