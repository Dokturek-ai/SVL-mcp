// ---------------------------------------------------------------------------
// Minimální strukturované logování (JSON na jeden řádek).
//
// Na Vercelu se řádky zachytí do logů funkce. Pro alerting napojte log drain
// nebo Resend/Slack webhook na události typu "lead_fallback"/"*_failed".
// ---------------------------------------------------------------------------

type Level = "info" | "warn" | "error";

export function log(
  level: Level,
  event: string,
  data: Record<string, unknown> = {},
): void {
  // Rezervovaná pole nesmí jít přepsat z `data` (jinak by šlo podvrhnout
  // úroveň/název události) — spread dat jde první, pevná pole po něm.
  const line = JSON.stringify({
    ...data,
    ts: new Date().toISOString(),
    level,
    event,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}
