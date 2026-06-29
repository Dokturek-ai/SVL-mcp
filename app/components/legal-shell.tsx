// Sdílený vizuální rámec pro právní stránky (zásady soukromí, podmínky).
// Vychází z landing page (Doktůrek.ai design system): světlé pozadí,
// jednoduchá navigace a patička, čitelný dokumentový sloupec.

import Link from "next/link";

function Brand({ onDark = false }: { onDark?: boolean }) {
  return (
    <span
      className={`dk-display text-lg ${onDark ? "text-white" : "text-ink"}`}
      style={{ letterSpacing: "-0.01em" }}
    >
      Doktůrek<span className="text-primary">.ai</span>
    </span>
  );
}

export function LegalShell({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro?: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-ink">
      <header className="border-b border-stroke">
        <nav className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/" className="transition-opacity hover:opacity-80">
            <Brand />
          </Link>
          <Link
            href="/"
            className="text-sm font-semibold text-primary hover:text-primary-hover"
          >
            ← Domů
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
        <h1 className="dk-display text-4xl sm:text-5xl">{title}</h1>
        <p className="mt-3 text-sm text-ink/60">Naposledy aktualizováno: {updated}</p>
        {intro ? (
          <p className="mt-6 text-lg leading-relaxed text-ink/80">{intro}</p>
        ) : null}

        <div className="mt-10">{children}</div>
      </main>

      <footer className="border-t border-stroke">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
          <Brand />
          <p className="text-sm text-ink/60">Doktůrek.ai s.r.o.</p>
          <div className="flex gap-4 text-sm font-semibold text-primary">
            <Link href="/privacy" className="hover:text-primary-hover">
              Soukromí
            </Link>
            <Link href="/terms" className="hover:text-primary-hover">
              Podmínky
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Pomocné prvky pro konzistentní typografii uvnitř dokumentu.

export function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="dk-display text-2xl">{heading}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-ink/80">{children}</div>
    </section>
  );
}

export function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}
