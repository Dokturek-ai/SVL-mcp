import type { Metadata } from "next";
import { LegalShell, Section, List } from "@/app/components/legal-shell";

// ---------------------------------------------------------------------------
// /privacy — Zásady zpracování osobních údajů.
//
// Popisuje data, která aplikace Doktůrek RAG (MCP server) skutečně zpracovává:
// lead-formulář (jméno, e-mail, pozice) → Notion, magic-link e-maily → Resend,
// bezstavové OAuth tokeny a anonymní analytika hostingu. Stránka je vyžadována
// pro odeslání aplikace do ChatGPT App Directory.
// ---------------------------------------------------------------------------

const UPDATED = "29. června 2026";
const CONTACT_EMAIL = "info@dokturek.ai";

export const metadata: Metadata = {
  title: "Zásady ochrany osobních údajů — Doktůrek.ai",
  description:
    "Jak Doktůrek.ai s.r.o. zpracovává osobní údaje v rámci MCP serveru " +
    "a znalostní báze Doktůrek RAG.",
};

export default function Privacy() {
  return (
    <LegalShell
      title="Zásady ochrany osobních údajů"
      updated={UPDATED}
      intro={
        "Tyto zásady popisují, jaké osobní údaje zpracováváme v souvislosti se " +
        "službou Doktůrek RAG (MCP server pro připojení znalostní báze k AI " +
        "asistentům), za jakým účelem, komu je předáváme a jaká máte práva."
      }
    >
      <Section heading="Správce údajů">
        <p>
          Správcem osobních údajů je <strong>Doktůrek.ai s.r.o.</strong> Ve věcech
          ochrany osobních údajů nás kontaktujte na{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-medium text-primary underline hover:text-primary-hover"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>

      <Section heading="Jaké údaje zpracováváme">
        <p>
          Při aktivaci přístupu vyplníte krátký formulář. Zpracováváme tyto
          kategorie údajů:
        </p>
        <List
          items={[
            <>
              <strong>Identifikační a kontaktní údaje:</strong> jméno, příjmení,
              pracovní e-mail a pracovní pozice, které zadáte v aktivačním
              formuláři.
            </>,
            <>
              <strong>Údaje o ověření přístupu:</strong> ověřovací (magic-link)
              odkaz zaslaný na váš e-mail a z něj odvozený bezstavový přístupový
              token. Token obsahuje pouze neidentifikující technický identifikátor
              (hash), nikoli vaše jméno či e-mail.
            </>,
            <>
              <strong>Provozní a technické údaje:</strong> anonymní statistiky
              návštěvnosti a technické logy nezbytné pro provoz a zabezpečení
              služby (např. typ události, časové razítko).
            </>,
          ]}
        />
        <p>
          Aplikace <strong>nesbírá obsah vašich konverzací</strong> s AI
          asistentem nad rámec dotazu, který explicitně pošlete do znalostní báze,
          a <strong>nepožaduje</strong> citlivé údaje, platební údaje ani
          přístupová hesla.
        </p>
      </Section>

      <Section heading="Účel a právní základ zpracování">
        <List
          items={[
            <>
              <strong>Poskytnutí přístupu ke službě</strong> (ověření e-mailu a
              vydání přístupového tokenu) — plnění služby na základě vaší žádosti.
            </>,
            <>
              <strong>Kontakt ohledně přístupu a zájmu o službu</strong> — na
              základě vašeho souhlasu uděleného ve formuláři, případně oprávněného
              zájmu správce.
            </>,
            <>
              <strong>Provoz, zabezpečení a ochrana proti zneužití</strong>{" "}
              (omezení četnosti požadavků, prevence spamu) — oprávněný zájem
              správce.
            </>,
          ]}
        />
      </Section>

      <Section heading="Příjemci a zpracovatelé">
        <p>
          Pro provoz služby využíváme níže uvedené poskytovatele jako
          zpracovatele. Údaje jim předáváme jen v rozsahu nezbytném pro daný účel:
        </p>
        <List
          items={[
            <>
              <strong>Notion</strong> (Notion Labs, Inc.) — ukládání údajů z
              aktivačního formuláře (lead).
            </>,
            <>
              <strong>Resend</strong> — odeslání ověřovacího (magic-link) e-mailu.
            </>,
            <>
              <strong>Vercel</strong> (Vercel Inc.) — hosting aplikace a anonymní
              statistiky návštěvnosti.
            </>,
            <>
              <strong>Provozovatel znalostní báze LightRAG</strong> — zpracování
              vašeho dotazu za účelem vygenerování odpovědi.
            </>,
          ]}
        />
        <p>
          Osobní údaje <strong>neprodáváme</strong> a nepředáváme třetím stranám
          pro marketingové účely. Pokud dojde k předání mimo EU/EHP, děje se tak
          na základě odpovídajících záruk dle GDPR.
        </p>
      </Section>

      <Section heading="Doba uložení">
        <List
          items={[
            <>
              <strong>Údaje z formuláře (lead):</strong> uchováváme po dobu nezbytně
              nutnou k vyřízení vaší žádosti a navázání kontaktu, nejdéle po dobu
              našeho oprávněného zájmu; poté je vymažeme nebo anonymizujeme.
            </>,
            <>
              <strong>Ověřovací odkaz:</strong> platnost 15 minut; přístupové a
              autorizační tokeny mají krátkou platnost a neukládají se do žádné
              databáze (jsou bezstavové).
            </>,
            <>
              <strong>Anonymní statistiky:</strong> uchovávány v agregované podobě
              dle nastavení poskytovatele.
            </>,
          ]}
        />
      </Section>

      <Section heading="Vaše práva">
        <p>
          V souladu s GDPR máte právo na přístup ke svým údajům, jejich opravu nebo
          výmaz, omezení zpracování, vznesení námitky proti zpracování, přenositelnost
          údajů a právo kdykoli odvolat udělený souhlas. Máte rovněž právo podat
          stížnost u dozorového úřadu (Úřad pro ochranu osobních údajů).
        </p>
        <p>
          Pro uplatnění práv nás kontaktujte na{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-medium text-primary underline hover:text-primary-hover"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>

      <Section heading="Změny těchto zásad">
        <p>
          Tyto zásady můžeme čas od času aktualizovat. Aktuální znění je vždy
          dostupné na této stránce s uvedením data poslední aktualizace.
        </p>
      </Section>
    </LegalShell>
  );
}
