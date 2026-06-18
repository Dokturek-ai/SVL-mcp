import { baseURL } from "@/baseUrl";

// ---------------------------------------------------------------------------
// Veřejná landing page Doktůrek.ai (MCP iniciativa).
// Design dle DESIGN.md: deep-violet medical-tech, Bricolage Grotesque + DM Sans.
// ---------------------------------------------------------------------------

const MCP_URL = `${baseURL}/mcp`;

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-ink">
      <SiteNav />
      <Hero />
      <WhatIsIt />
      <HowItWorks />
      <Connect />
      <SiteFooter />
    </div>
  );
}

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

function SiteNav() {
  return (
    <header className="absolute inset-x-0 top-0 z-10">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Brand onDark />
        <a
          href="#pripojeni"
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
        >
          Připojit
        </a>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="dk-hero-gradient relative overflow-hidden">
      {/* atmosférické glow blobs */}
      <div className="dk-glow pointer-events-none absolute -left-24 -top-24 h-96 w-96 opacity-40" />
      <div className="dk-glow-orchid pointer-events-none absolute -right-32 top-40 h-[28rem] w-[28rem] opacity-30" />

      <div className="relative mx-auto max-w-6xl px-6 pb-28 pt-36 text-center sm:pt-44">
        <span className="inline-block rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white ring-1 ring-white/20">
          MCP server · Beta
        </span>

        <h1 className="dk-display mx-auto mt-7 max-w-4xl text-5xl text-white sm:text-6xl md:text-7xl">
          Znalostní báze Doktůrek.ai{" "}
          <span className="text-lilac">přímo ve vašem AI asistentovi</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/70 sm:text-xl">
          Připojte ověřenou medicínskou znalostní bázi k&nbsp;Claude, ChatGPT
          nebo Cursoru přes protokol MCP. Ptejte se přirozeným jazykem, dostávejte
          odpovědi s&nbsp;citacemi zdrojů. Méně administrativy, více medicíny.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#pripojeni"
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-primary-hover"
          >
            Připojit ke svému asistentovi
          </a>
          <a
            href="#jak-to-funguje"
            className="rounded-full px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/20 transition-colors hover:bg-white/10"
          >
            Jak to funguje
          </a>
        </div>
      </div>
    </section>
  );
}

function WhatIsIt() {
  const features = [
    {
      title: "Dotazy nad znalostní bází",
      body: "Generované odpovědi z medicínské znalostní báze LightRAG včetně odkazů na zdrojové dokumenty.",
    },
    {
      title: "Graf znalostí",
      body: "Procházejte entity a jejich vztahy — vyhledávání, podgrafy a souvislosti napříč dokumenty.",
    },
    {
      title: "Pouze pro čtení",
      body: "Žádné zápisy ani mutace. Nástroje slouží k dotazování a analýze, vaše data zůstávají v bezpečí.",
    },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="dk-display text-4xl sm:text-5xl">Co získáte</h2>
        <p className="mt-4 text-lg leading-relaxed text-ink/80">
          Sada read-only nástrojů, které váš AI asistent využije k práci nad
          znalostní bází Doktůrek.ai.
        </p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-stroke bg-surface/60 p-7"
          >
            <h3 className="dk-display text-2xl">{f.title}</h3>
            <p className="mt-3 leading-relaxed text-ink/80">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      title: "Připojte server v asistentovi",
      body: "Přidejte MCP server Doktůrek.ai do Claude, ChatGPT nebo Cursoru. Asistent vás vyzve k ověření.",
    },
    {
      title: "Vyplňte formulář a potvrďte e-mail",
      body: "Zadáte jméno, pozici a e-mail. Na e-mail dorazí ověřovací odkaz — kliknutím aktivujete přístup.",
    },
    {
      title: "Ptejte se přirozeným jazykem",
      body: "Hotovo. Asistent teď umí dotazovat znalostní bázi a vracet odpovědi s citacemi přímo v konverzaci.",
    },
  ];
  return (
    <section id="jak-to-funguje" className="bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="dk-display text-4xl sm:text-5xl">Jak to funguje</h2>
          <p className="mt-4 text-lg leading-relaxed text-ink/80">
            Tři kroky k&nbsp;připojení. Žádné účty ani hesla — stačí ověřený
            e-mail.
          </p>
        </div>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="rounded-2xl border border-stroke bg-white p-7"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                {i + 1}
              </span>
              <h3 className="dk-display mt-4 text-2xl">{s.title}</h3>
              <p className="mt-3 leading-relaxed text-ink/80">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Connect() {
  return (
    <section id="pripojeni" className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h2 className="dk-display text-4xl sm:text-5xl">Připojení</h2>
          <p className="mt-4 text-lg leading-relaxed text-ink/80">
            Přidejte tuto adresu jako MCP server ve svém AI asistentovi:
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-stroke bg-surface/60 p-7">
          <code className="block break-all rounded-xl bg-ink px-5 py-4 text-center font-mono text-sm text-white">
            {MCP_URL}
          </code>

          <div className="mt-7 space-y-5 text-sm leading-relaxed text-ink/80">
            <p>
              <span className="font-semibold text-ink">Claude.ai / Claude Desktop:</span>{" "}
              Nastavení → Connectors → Add custom connector → vložte adresu výše.
            </p>
            <p>
              <span className="font-semibold text-ink">ChatGPT:</span>{" "}
              Settings → Connectors → přidejte vlastní MCP server s touto adresou.
            </p>
            <p>
              <span className="font-semibold text-ink">Cursor:</span>{" "}
              Settings → MCP → Add server → zadejte adresu jako vzdálený (HTTP) server.
            </p>
          </div>

          <p className="mt-7 rounded-xl border border-stroke bg-white px-5 py-4 text-sm leading-relaxed text-ink/80">
            Při prvním připojení vás asistent přesměruje na ověření — vyplníte
            krátký formulář a potvrdíte e-mail. Poté je přístup aktivní.
          </p>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-stroke">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
        <Brand />
        <p className="text-sm text-ink/60">
          Vracíme lékaře k pacientům. · Doktůrek.ai s.r.o.
        </p>
        <a
          href="https://dokturek.ai"
          className="text-sm font-semibold text-primary hover:text-primary-hover"
        >
          dokturek.ai →
        </a>
      </div>
    </footer>
  );
}
