# Mathly

Free K–10 math worksheet generator. Pick a grade and some skills, get a
printable PDF. No signup, no accounts, no data collected.

Live at **[mathly.us](https://mathly.us)**.

## What it does

- **87 skills, grades K–10, CCSS-coded** — number & operations, fractions &
  decimals, geometry & measurement, word problems, and algebra (grades 6–10).
- **Every worksheet is generated fresh.** Problems come from a seeded RNG, so
  a given seed always reproduces the same sheet, but two sheets for the same
  skill are never the same worksheet twice.
- **Answers are never wrong by construction.** The answer comes from the same
  computation that built the question — never re-solved, never stored
  separately, no symbolic algebra involved.
- **PDF export, client-side.** Download a worksheet or its answer key as a
  real PDF (via jsPDF) — no server round-trip, works offline once loaded.

## Quick start

```bash
npm install
npm run dev      # vite dev server
npm run build    # static build to dist/
npm test         # vitest — every skill's generator is checked for correctness
```

## How it's built

React 18 + Vite. No backend, no database, no API — the whole app is a
static bundle. Question generation is plain arithmetic in the browser;
presets live in `localStorage`. See [CLAUDE.md](../CLAUDE.md) for the full
architecture, the rules every skill generator must follow (seeded RNG only,
no floats, construct the answer before the question), and the design system.

```
mathly-app/
  src/
    main.jsx            React entry point.
    App.jsx             Routes between landing and builder.
    generators.js       87 skills, grades K-10, CCSS-coded. The actual product.
    MathlyLanding.jsx   Gallery landing. Hero is a live shuffling worksheet.
    MathlyBuilder.jsx   Single-page configurator with live preview.
    pdf.js              Client-side PDF generation (jsPDF) + share/download.
    analytics.js        Anonymous, aggregate-only usage beacons.
    generators.test.js  Vitest coverage for every skill.
```

## Hosting & deployment

Hosted on AWS (S3 + CloudFront + Route 53), all managed by Terraform in the
sibling repo **[mathly-infra](https://github.com/divakarduraiyan/mathly-infra)**
— infra lives in a separate, private repo on purpose, so AWS account details
stay out of this public one. Pushing to `main` here runs
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml): build, test,
sync to S3, invalidate CloudFront.

## Usage analytics

The app fires a handful of anonymous, aggregate-only beacons — a page
landed on, a worksheet builder opened, a worksheet generated, a PDF
downloaded — tagged only with grade/skill/difficulty, never with anything
that identifies a visitor. No accounts, no cookies, no IP or session
tracking. See `mathly-infra`'s README for exactly what's recorded and how
to read it.

## Feedback

Found a wrong answer, a confusing skill, or just want to say hi? Email
**feedback@mathly.us** — there's also a link in the app's header.
