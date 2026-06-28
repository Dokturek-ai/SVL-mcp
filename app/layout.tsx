import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "./globals.css";
import { baseURL } from "@/baseUrl";
import { Analytics } from "@vercel/analytics/next";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin", "latin-ext"],
  weight: ["800"],
});

export const metadata: Metadata = {
  title: "Doktůrek.ai — znalostní báze pro vaše AI asistenty",
  description:
    "Připojte znalostní bázi Doktůrek.ai ke svému AI asistentovi přes MCP. " +
    "Vracíme lékaře k pacientům.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs" suppressHydrationWarning>
      <head>
        <IframeBootstrap baseUrl={baseURL} />
      </head>
      <body className={`${dmSans.variable} ${bricolage.variable} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}

/**
 * Inline scripts that make the widget page work inside ChatGPT's, Cursor's, or
 * Claude.ai's sandboxed iframe. `assetPrefix` in next.config.ts handles
 * script/style URLs. The JS patches below run ONLY inside an iframe — on the
 * public landing page and OAuth pages they would break normal navigation and
 * external links, so `iframePatchFn` returns early when not embedded.
 */
function IframeBootstrap({ baseUrl }: { baseUrl: string }) {
  return (
    <>
      {/* `<base>` se vkládá až uvnitř iframe (viz iframePatchFn) — na veřejných
          stránkách by lámal fragmentové odkazy a relativní navigaci. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `window.__baseUrl=${JSON.stringify(baseUrl)};`,
        }}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `(${iframePatchFn.toString()})()`,
        }}
      />
    </>
  );
}

/**
 * Self-executing function injected as an inline `<script>`. It runs before
 * React hydrates and makes Next.js behave correctly inside an iframe whose
 * origin differs from the real server. Outside an iframe it does nothing.
 *
 * NOTE: serialised via `.toString()` and executed in a different context.
 * TypeScript types here are purely for readability — stripped on serialise.
 */
function iframePatchFn() {
  const isInIframe = window.self !== window.top;
  // Mimo iframe (landing, OAuth formulář) žádné patche — jinak by se rozbily
  // prokliky a klientská navigace.
  if (!isInIframe) return;

  const baseUrl: string = window.__baseUrl;
  const htmlElement = document.documentElement;

  // 0. Resolve relative URLs (/_next/static, etc.) to the real server.
  //    Vkládáme jen v iframe — skript běží v <head> před zbytkem dokumentu.
  const base = document.createElement("base");
  base.href = baseUrl;
  document.head.prepend(base);

  // 1. Prevent the host from mutating <html> attributes (hydration errors)
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "attributes" && mutation.target === htmlElement) {
        const attr = mutation.attributeName;
        if (attr && attr !== "suppresshydrationwarning" && attr !== "lang") {
          htmlElement.removeAttribute(attr);
        }
      }
    }
  });
  observer.observe(htmlElement, { attributes: true, attributeOldValue: true });

  // 2. Patch history – the sandbox may reject cross-origin state changes.
  const origReplace = history.replaceState.bind(history);
  history.replaceState = function (
    _state: unknown,
    unused: string,
    url?: string | URL | null,
  ) {
    try {
      const u = new URL(String(url ?? ""), window.location.href);
      origReplace(null, unused, u.pathname + u.search + u.hash);
    } catch {
      /* SecurityError in sandboxed iframe */
    }
  };

  const origPush = history.pushState.bind(history);
  history.pushState = function (
    _state: unknown,
    unused: string,
    url?: string | URL | null,
  ) {
    try {
      const u = new URL(String(url ?? ""), window.location.href);
      origPush(null, unused, u.pathname + u.search + u.hash);
    } catch {
      /* SecurityError in sandboxed iframe */
    }
  };

  // 3. Intercept external link clicks → window.openai.openExternal()
  const appOrigin = new URL(baseUrl).origin;
  window.addEventListener(
    "click",
    (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest?.("a");
      if (!a?.href) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin && url.origin !== appOrigin) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const openExternal = (window as any).openai?.openExternal;
        if (typeof openExternal === "function") {
          openExternal({ href: a.href });
          e.preventDefault();
        }
      }
    },
    true,
  );

  // 4. Patch fetch so RSC / data payloads go to the real server
  if (window.location.origin !== appOrigin) {
    const originalFetch = window.fetch.bind(window);

    window.fetch = function patchedFetch(
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> {
      let url: URL;
      if (typeof input === "string" || input instanceof URL) {
        url = new URL(String(input), window.location.href);
      } else {
        url = new URL(input.url, window.location.href);
      }

      if (url.origin === appOrigin || url.origin === window.location.origin) {
        const rewritten = new URL(baseUrl);
        rewritten.pathname = url.pathname;
        rewritten.search = url.search;
        rewritten.hash = url.hash;

        const newInput =
          typeof input === "string" || input instanceof URL
            ? rewritten.toString()
            : new Request(rewritten.toString(), input);

        return originalFetch(newInput, { ...init, mode: "cors" });
      }

      return originalFetch(input, init);
    } as typeof fetch;
  }
}
