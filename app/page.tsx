"use client";

import { useMcpApp } from "./hooks/use-mcp-app";
import type { RagResult } from "./lib/types";
import { QueryAnswer } from "./components/QueryAnswer";
import { ContextView } from "./components/ContextView";
import { LabelList } from "./components/LabelList";
import { SubgraphView } from "./components/SubgraphView";
import { DocumentTable } from "./components/DocumentTable";
import { HealthView } from "./components/HealthView";
import { ErrorView } from "./components/ErrorView";

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-zinc-500 dark:text-zinc-400">{children}</p>
  );
}

function renderResult(result: RagResult) {
  switch (result.kind) {
    case "error":
      return <ErrorView message={result.error} />;
    case "query_rag":
      return <QueryAnswer {...result} />;
    case "retrieve_context":
      return <ContextView {...result} />;
    case "search_entities":
      return <LabelList labels={result.labels} title={`Entity pro „${result.q}“`} />;
    case "list_labels":
      return <LabelList labels={result.labels} title="Všechny entity" />;
    case "get_subgraph":
      return <SubgraphView {...result} />;
    case "list_documents":
      return <DocumentTable {...result} />;
    case "health_check":
      return <HealthView data={result as Record<string, unknown>} />;
    default:
      return (
        <pre className="overflow-auto rounded-lg bg-zinc-100 p-3 text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          {JSON.stringify(result, null, 2)}
        </pre>
      );
  }
}

export default function Home() {
  const { toolResult, connected } = useMcpApp();
  const result = toolResult as RagResult | null;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-8">
        <header className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Dokturek RAG
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Znalostní báze LightRAG
          </p>
        </header>

        {!connected ? (
          <Centered>
            Nepřipojeno — otevřete v hostiteli MCP (Claude.ai, Cursor, ChatGPT).
          </Centered>
        ) : !result ? (
          <Centered>Čekání na volání nástroje…</Centered>
        ) : (
          renderResult(result)
        )}
      </main>
    </div>
  );
}
