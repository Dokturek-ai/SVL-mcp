import type { DocItem, Pagination } from "../lib/types";
import { Badge, Card, SectionTitle } from "./shared";

export function DocumentTable({
  documents,
  pagination,
  status_counts,
}: {
  documents: DocItem[];
  pagination: Pagination;
  status_counts: Record<string, number>;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <SectionTitle>Dokumenty ({pagination.total_count})</SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(status_counts).map(([status, count]) => (
            <Badge key={status}>
              {status}: {count}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {documents.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Žádné dokumenty.
          </p>
        ) : (
          documents.map((doc) => (
            <Card key={doc.id}>
              <div className="flex items-start justify-between gap-2">
                <span className="break-all text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {doc.file_path}
                </span>
                <Badge>{doc.status}</Badge>
              </div>
              {doc.content_summary && (
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {doc.content_summary}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-400">
                {doc.chunks_count != null && (
                  <span>{doc.chunks_count} úseků</span>
                )}
                <span>aktualizováno {doc.updated_at}</span>
                {doc.error_msg && (
                  <span className="text-red-500">{doc.error_msg}</span>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      <p className="text-xs text-zinc-400">
        Stránka {pagination.page} z {pagination.total_pages}
      </p>
    </div>
  );
}
