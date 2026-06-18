import "server-only";
import type { Lead } from "./auth";

// ---------------------------------------------------------------------------
// Zápis leadu do Notion databáze přes veřejné Notion REST API.
//
// Schéma databáze se načítá za běhu, takže se kód přizpůsobí skutečným
// vlastnostem (title se detekuje automaticky, ostatní se mapují podle názvu
// a typu). Vlastnost, která v databázi neexistuje, se přeskočí — zápis tak
// neselže kvůli drobné odchylce ve schématu.
//
// Konfigurace (env):
//   NOTION_TOKEN          – token interní Notion integrace (nasdílené s DB)
//   NOTION_DATABASE_ID    – ID databáze (32 hex znaků z URL)
//   NOTION_PROP_EMAIL     – název sloupce pro e-mail   (výchozí "Email")
//   NOTION_PROP_POSITION  – název sloupce pro pozici   (výchozí "Pozice")
//   NOTION_PROP_FIRSTNAME – název sloupce pro jméno    (výchozí "Jméno")
//   NOTION_PROP_LASTNAME  – název sloupce pro příjmení (výchozí "Příjmení")
//   NOTION_PROP_SOURCE    – název sloupce pro zdroj    (výchozí "Zdroj")
// ---------------------------------------------------------------------------

const NOTION_TOKEN = process.env.NOTION_TOKEN ?? "";
const DATABASE_ID =
  process.env.NOTION_DATABASE_ID ?? process.env.NOTION_DATA_SOURCE_ID ?? "";
const NOTION_VERSION = "2022-06-28";

const PROP = {
  email: process.env.NOTION_PROP_EMAIL ?? "Email",
  position: process.env.NOTION_PROP_POSITION ?? "Pozice",
  firstName: process.env.NOTION_PROP_FIRSTNAME ?? "Jméno",
  lastName: process.env.NOTION_PROP_LASTNAME ?? "Příjmení",
  source: process.env.NOTION_PROP_SOURCE ?? "Zdroj",
};

interface PropSchema {
  type: string;
}

export function isNotionConfigured(): boolean {
  return Boolean(NOTION_TOKEN && DATABASE_ID);
}

function headers(json = false): Record<string, string> {
  const h: Record<string, string> = {
    Authorization: `Bearer ${NOTION_TOKEN}`,
    "Notion-Version": NOTION_VERSION,
  };
  if (json) h["Content-Type"] = "application/json";
  return h;
}

async function getSchema(): Promise<Record<string, PropSchema>> {
  const res = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}`, {
    headers: headers(),
  });
  if (!res.ok) {
    throw new Error(`Notion: načtení schématu selhalo (HTTP ${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as { properties?: Record<string, PropSchema> };
  return data.properties ?? {};
}

function setProp(
  schema: Record<string, PropSchema>,
  props: Record<string, unknown>,
  name: string,
  value: string,
): void {
  const s = schema[name];
  if (!s || !value) return;
  switch (s.type) {
    case "title":
      props[name] = { title: [{ text: { content: value } }] };
      break;
    case "rich_text":
      props[name] = { rich_text: [{ text: { content: value } }] };
      break;
    case "email":
      props[name] = { email: value };
      break;
    case "phone_number":
      props[name] = { phone_number: value };
      break;
    case "url":
      props[name] = { url: value };
      break;
    case "select":
      props[name] = { select: { name: value } };
      break;
    case "multi_select":
      props[name] = { multi_select: [{ name: value }] };
      break;
    default:
      props[name] = { rich_text: [{ text: { content: value } }] };
  }
}

export async function createLead(lead: Lead): Promise<void> {
  if (!isNotionConfigured()) {
    throw new Error("Notion není nakonfigurován (NOTION_TOKEN / NOTION_DATABASE_ID).");
  }

  const schema = await getSchema();
  const props: Record<string, unknown> = {};
  const fullName = `${lead.firstName} ${lead.lastName}`.trim();

  // Title je povinný — najdeme ho podle typu a naplníme celým jménem.
  const titleName = Object.keys(schema).find((k) => schema[k].type === "title");
  if (titleName) {
    setProp(schema, props, titleName, fullName || lead.email);
  }

  setProp(schema, props, PROP.email, lead.email);
  setProp(schema, props, PROP.position, lead.position);
  setProp(schema, props, PROP.firstName, lead.firstName);
  setProp(schema, props, PROP.lastName, lead.lastName);
  setProp(schema, props, PROP.source, "Doktůrek RAG MCP");

  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: headers(true),
    body: JSON.stringify({ parent: { database_id: DATABASE_ID }, properties: props }),
  });
  if (!res.ok) {
    throw new Error(`Notion: zápis leadu selhal (HTTP ${res.status}): ${await res.text()}`);
  }
}
