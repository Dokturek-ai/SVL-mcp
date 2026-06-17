import { Badge, Card, SectionTitle } from "./shared";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="break-all text-right text-zinc-800 dark:text-zinc-200">
        {value}
      </span>
    </div>
  );
}

export function HealthView({ data }: { data: Record<string, unknown> }) {
  const status = String(data.status ?? "neznámý");
  const config = (data.configuration ?? {}) as Record<string, unknown>;
  const healthy = status === "healthy";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <SectionTitle>Stav systému</SectionTitle>
        <span
          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${
            healthy
              ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
              : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
          }`}
        >
          {status}
        </span>
      </div>

      <Card>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          <Row label="Verze jádra" value={data.core_version as string} />
          <Row label="Verze API" value={data.api_version as string} />
          <Row
            label="Pipeline"
            value={data.pipeline_busy ? "zaneprázdněná" : "volná"}
          />
          <Row label="Autentizace" value={data.auth_mode as string} />
          <Row label="LLM" value={config.llm_model as string} />
          <Row label="Embedding" value={config.embedding_model as string} />
          <Row
            label="Rerank"
            value={
              config.enable_rerank
                ? (config.rerank_model as string) || "zapnuto"
                : "vypnuto"
            }
          />
          <Row label="Graf" value={config.graph_storage as string} />
          <Row label="Vektory" value={config.vector_storage as string} />
          <Row label="Jazyk" value={config.summary_language as string} />
        </div>
      </Card>

      {data.webui_available != null && (
        <div>
          <Badge>WebUI: {data.webui_available ? "dostupné" : "nedostupné"}</Badge>
        </div>
      )}
    </div>
  );
}
