import { AuthShell } from "../ui";

function one(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function Sent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const email = one((await searchParams).email);
  return (
    <AuthShell
      title="Zkontrolujte e-mail"
      subtitle={
        email
          ? `Na adresu ${email} jsme poslali ověřovací odkaz.`
          : "Poslali jsme vám ověřovací odkaz."
      }
    >
      <div className="space-y-4 text-sm leading-relaxed text-ink/80">
        <p>
          Otevřete e-mail a klikněte na <strong>Potvrdit a aktivovat přístup</strong>.
          Po potvrzení se vrátíte zpět do svého AI asistenta s aktivním přístupem.
        </p>
        <p className="rounded-xl border border-stroke bg-surface px-4 py-3 text-ink/70">
          Odkaz platí 15 minut. Nedorazil? Zkontrolujte spam nebo spusťte
          připojení znovu ze svého asistenta.
        </p>
      </div>
    </AuthShell>
  );
}
