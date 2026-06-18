# Dokturek.ai Design System

> Portable, markdown-based design system extracted from the live
> [dokturek.ai](https://dokturek.ai/) site. Drop into a project root so an AI coding
> agent can build UI matching the Dokturek.ai brand.

**Brand:** Dokturek.ai — AI, která automatizuje klinickou administrativu. „Vracíme lékaře k pacientům."
**Direction:** Deep-violet medical-tech. Bold expressive display headings, calm light surfaces,
saturated purple accents, soft lilac glows on dark hero backgrounds.

---

## Colors

### Brand / Primary
- **Primary** (`#7C3BED`): Main brand purple. Filled buttons, badges, active states, numbered markers.
- **Primary Hover** (`#6D39C6`): Hover/pressed state for primary surfaces.
- **Primary Deep** (`#5914D2`): Strong accent, emphasis fills.

### Hero Gradient (dark sections)
- Diagonal gradient, top-left → bottom-right:
  - **Gradient Start** (`#20074B`) 0%
  - **Gradient Mid** (`#340B79`) 50%
  - **Gradient End** (`#5C0986`) 100%
- CSS: `linear-gradient(to bottom right, #20074B 0%, #340B79 50%, #5C0986 100%)`

### Accent / Glow
- **Lilac** (`#DB9EFA`): Hero headline highlight word, decorative radial glows.
- **Orchid** (`#C058F3`): Secondary glow / accent gradients.
- Glow pattern: `radial-gradient(circle, #DB9EFA, transparent 70%)`.

### Neutrals
- **Background** (`#FFFFFF`), **Surface** (`#F4F3FC`), **Surface Card** (`rgba(244,243,252,0.6)`),
  **Border** (`#E5DFFB`).

### Text
- **Text Primary** (`#130F3E`), **Text Muted** (`rgba(19,15,62,0.8)`),
  **Text On Dark** (`#FFFFFF`), **Text On Dark Muted** (`rgba(255,255,255,0.7)`).

---

## Typography

- **Display** — `Bricolage Grotesque`, weight **800**, tight negative tracking. All headings.
- **Body** — `DM Sans`, 400/500/600/700. Paragraphs, nav, buttons, labels.

| Style | Font | Size | Weight | Line height | Letter spacing |
|-------|------|------|--------|-------------|----------------|
| H1 / Hero | Bricolage Grotesque | 72px | 800 | 1.05 | -1.8px |
| H2 / Section | Bricolage Grotesque | 60px | 800 | 1.1 | -1.5px |
| H3 | Bricolage Grotesque | ~32px | 800 | 1.2 | -0.5px |
| Lead | DM Sans | 24px | 400 | 1.6 | normal |
| Body | DM Sans | 16px | 400 | 1.5 | normal |
| Button | DM Sans | 14px | 600 | 1 | normal |
| Caption / Pill | DM Sans | 12px | 700 | 1 | normal |

---

## Spacing

- Base unit 4px. Card padding 28px. Button padding 8px 16px (pill).
- Section rhythm `clamp(4rem, 5vw, 8rem)`; alternate white ↔ `#F4F3FC` ↔ dark gradient.

---

## Components

- **Buttons:** primary filled `#7C3BED`, white text, **pill** radius, DM Sans 14/600, subtle shadow; hover `#6D39C6`. Secondary = transparent + 1px border, pill.
- **Cards:** `rgba(244,243,252,0.6)` fill, `1px #E5DFFB` border, radius 16px, padding 28px, no shadow.
- **Inputs:** white (light) / `rgba(255,255,255,0.1)` (dark), `1px` border, radius 12px, padding 12px 16px.
- **Badge / Pill:** full radius, `#7C3BED` bg, white, 14/600.
- **Numbered markers:** circular `#7C3BED` filled badges, white numerals.
- **Glow blobs:** radial lilac/orchid gradients behind dark hero content only.

---

## Guidelines

**Do:** pair Bricolage 800 headings with DM Sans body · alternate white → `#F4F3FC` → dark violet ·
deep-indigo `#130F3E` text on light · pill buttons/badges · lilac/orchid glows on dark only ·
highlight key numbers in `#7C3BED`.

**Don't:** pure black text · drop shadows on cards · glow on light sections · a third type family ·
square buttons.

**Tone of voice:** Czech, empatický k lékařům, jasný, konkrétní, důvěryhodný.
Méně administrativy, více medicíny; vracíme lékaře k pacientům.

---

## Implementace v tomto repu

Tokeny jsou v `app/globals.css` (`@theme inline`): `--color-primary`, `--color-ink`,
`--color-surface`, `--color-stroke`, `--color-lilac`, `--color-orchid`, gradient stopy.
Fonty se načítají v `app/layout.tsx` (`next/font/google`) jako `--font-bricolage` / `--font-dm-sans`.
Pomocné třídy: `.dk-display`, `.dk-hero-gradient`, `.dk-glow`, `.dk-glow-orchid`.
