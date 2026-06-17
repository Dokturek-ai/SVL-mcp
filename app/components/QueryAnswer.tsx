import type { Reference } from "../lib/types";
import { Badge, Card, ReferenceList, SectionTitle } from "./shared";

export function QueryAnswer({
  query,
  mode,
  response,
  references,
}: {
  query: string;
  mode: string;
  response: string;
  references: Reference[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <SectionTitle>Dotaz</SectionTitle>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{query}</p>
        <div>
          <Badge>režim: {mode}</Badge>
        </div>
      </div>

      <Card>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
          {response}
        </p>
      </Card>

      <ReferenceList references={references} />
    </div>
  );
}
