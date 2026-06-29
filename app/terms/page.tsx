import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell, Section, List } from "@/app/components/legal-shell";

// ---------------------------------------------------------------------------
// /terms — Podmínky používání služby Doktůrek RAG (MCP server).
// Stránka je vyžadována pro odeslání aplikace do ChatGPT App Directory.
// ---------------------------------------------------------------------------

const UPDATED = "29. června 2026";
const CONTACT_EMAIL = "info@dokturek.ai";

export const metadata: Metadata = {
  title: "Podmínky používání — Doktůrek.ai",
  description:
    "Podmínky používání služby Doktůrek RAG — MCP serveru pro připojení " +
    "znalostní báze Doktůrek.ai k AI asistentům.",
};

export default function Terms() {
  return (
    <LegalShell
      title="Podmínky používání"
      updated={UPDATED}
      intro={
        "Tyto podmínky upravují používání služby Doktůrek RAG — MCP serveru, " +
        "který zpřístupňuje znalostní bázi Doktůrek.ai vašemu AI asistentovi. " +
        "Používáním služby s těmito podmínkami souhlasíte."
      }
    >
      <Section heading="Poskytovatel">
        <p>
          Službu poskytuje <strong>Doktůrek.ai s.r.o.</strong> Kontakt:{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-medium text-primary underline hover:text-primary-hover"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>

      <Section heading="Popis služby">
        <p>
          Doktůrek RAG je MCP server, který poskytuje sadu nástrojů{" "}
          <strong>pouze pro čtení</strong> nad znalostní bází LightRAG. Umožňuje
          klást dotazy, načítat kontext a procházet znalostní graf přímo v
          prostředí podporovaného AI asistenta (např. ChatGPT, Claude, Cursor).
          Služba neprovádí žádné zápisové, mutační ani destruktivní operace.
        </p>
      </Section>

      <Section heading="Přístup a ověření">
        <List
          items={[
            <>
              Přístup je chráněn standardním tokem OAuth 2.1 s PKCE a ověřením
              e-mailu přes jednorázový (magic-link) odkaz.
            </>,
            <>
              K používání služby se nezakládá žádný účet ani heslo. Odpovídáte za
              to, že údaje, které při aktivaci uvedete, jsou pravdivé.
            </>,
            <>
              Přístup je poskytován pro vaši profesní potřebu; nesdílejte
              ověřovací odkazy ani přístupové tokeny s neoprávněnými osobami.
            </>,
          ]}
        />
      </Section>

      <Section heading="Přijatelné používání">
        <p>Zavazujete se službu nepoužívat zejména k těmto účelům:</p>
        <List
          items={[
            <>obcházení zabezpečení, omezení četnosti požadavků nebo řízení přístupu;</>,
            <>automatizované hromadné stahování dat nad rámec běžného používání;</>,
            <>narušování provozu, dostupnosti nebo integrity služby;</>,
            <>
              jakékoli protiprávní jednání nebo zásah do práv třetích osob.
            </>,
          ]}
        />
      </Section>

      <Section heading="Obsah a přesnost informací">
        <p>
          Odpovědi generuje jazykový model nad znalostní bází a mohou obsahovat
          nepřesnosti. Výstupy <strong>nejsou lékařskou radou</strong> a
          nenahrazují odborný úsudek, diagnózu ani léčbu. Před využitím informací
          k rozhodnutí si je vždy ověřte z primárních zdrojů.
        </p>
      </Section>

      <Section heading="Dostupnost služby">
        <p>
          Služba je poskytována &bdquo;tak, jak je&ldquo;, v režimu beta. Nezaručujeme
          nepřetržitou dostupnost a vyhrazujeme si právo službu kdykoli upravit,
          omezit, pozastavit nebo ukončit, případně odepřít přístup při porušení
          těchto podmínek.
        </p>
      </Section>

      <Section heading="Omezení odpovědnosti">
        <p>
          V maximálním rozsahu povoleném právem neodpovídáme za nepřímé, následné
          nebo náhodné škody vzniklé v souvislosti s používáním služby ani za
          rozhodnutí učiněná na základě jejích výstupů.
        </p>
      </Section>

      <Section heading="Ochrana osobních údajů">
        <p>
          Zpracování osobních údajů se řídí našimi{" "}
          <Link
            href="/privacy"
            className="font-medium text-primary underline hover:text-primary-hover"
          >
            zásadami ochrany osobních údajů
          </Link>
          .
        </p>
      </Section>

      <Section heading="Změny podmínek">
        <p>
          Tyto podmínky můžeme aktualizovat. Aktuální znění je vždy dostupné na
          této stránce s uvedením data poslední aktualizace. Pokračováním v
          používání služby po změně vyjadřujete s novým zněním souhlas.
        </p>
      </Section>
    </LegalShell>
  );
}
