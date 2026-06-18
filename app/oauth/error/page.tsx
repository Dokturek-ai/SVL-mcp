import { AuthShell } from "../ui";

function one(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function OAuthError({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const reason =
    one((await searchParams).reason) ||
    "Něco se pokazilo. Zkuste připojení spustit znovu ze svého AI asistenta.";
  return (
    <AuthShell title="Přístup se nezdařil" subtitle={reason}>
      <a
        href="https://dokturek.ai"
        className="inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
      >
        Zpět na dokturek.ai
      </a>
    </AuthShell>
  );
}
