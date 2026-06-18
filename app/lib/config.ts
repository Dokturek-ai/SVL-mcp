import "server-only";
import { log } from "./log";

// ---------------------------------------------------------------------------
// Kontrola runtime konfigurace. Chybějící proměnné se jinak projeví až
// pozdě (kryptickou chybou při requestu) — tohle je zviditelní v logu.
// ---------------------------------------------------------------------------

const REQUIRED: Record<string, () => boolean> = {
  AUTH_SECRET: () => Boolean(process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 16),
  RESEND_API_KEY: () => Boolean(process.env.RESEND_API_KEY),
  EMAIL_FROM: () => Boolean(process.env.EMAIL_FROM),
};

const RECOMMENDED: Record<string, () => boolean> = {
  NOTION_TOKEN: () => Boolean(process.env.NOTION_TOKEN),
  NOTION_DATABASE_ID: () =>
    Boolean(process.env.NOTION_DATABASE_ID || process.env.NOTION_DATA_SOURCE_ID),
  LEAD_FALLBACK_EMAIL: () => Boolean(process.env.LEAD_FALLBACK_EMAIL),
};

export function missingConfig(): { required: string[]; recommended: string[] } {
  const required = Object.keys(REQUIRED).filter((k) => !REQUIRED[k]());
  const recommended = Object.keys(RECOMMENDED).filter((k) => !RECOMMENDED[k]());
  return { required, recommended };
}

let warned = false;

/** Jednou za běh instance zaloguje chybějící konfiguraci. */
export function logConfigOnce(): void {
  if (warned) return;
  warned = true;
  const { required, recommended } = missingConfig();
  if (required.length) log("error", "config_missing_required", { required });
  if (recommended.length) log("warn", "config_missing_recommended", { recommended });
}
