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
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...data,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}
