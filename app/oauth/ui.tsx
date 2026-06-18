// Sdílený vizuální rámec pro OAuth stránky (Doktůrek.ai design system).
// Centrovaná karta na světlé lila ploše s lehkým fialovým glow nahoře.

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-6 py-16 text-ink">
      <div className="dk-glow pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 opacity-20" />

      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="dk-display text-xl">
            Doktůrek<span className="text-primary">.ai</span>
          </span>
        </div>

        <div className="rounded-2xl border border-stroke bg-white p-8 shadow-sm">
          <h1 className="dk-display text-3xl">{title}</h1>
          {subtitle ? (
            <p className="mt-3 leading-relaxed text-ink/80">{subtitle}</p>
          ) : null}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
