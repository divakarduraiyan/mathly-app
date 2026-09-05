import { useState, useCallback, useMemo } from "react";
import mathlyLogo from "./assets/mathly-logo.png";

/* ---------------------------------------------------------------
   Seeded RNG — mulberry32.
   Same seed always yields the same worksheet, so a sheet is
   reproducible and shareable via URL.
----------------------------------------------------------------*/
function makeRng(seed) {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { next, int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)) };
}

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

/* ---------------------------------------------------------------
   Generators. Every answer is computed alongside the question,
   never re-derived, so an answer key cannot drift from its sheet.
----------------------------------------------------------------*/
const GENERATORS = {
  multiplyTwoDigit: (rng) => {
    const a = rng.int(12, 99);
    const b = rng.int(3, 9);
    return { prompt: `${a} \u00d7 ${b} =`, answer: a * b, cat: "number" };
  },

  addLikeFractions: (rng) => {
    const den = [4, 5, 6, 8, 10][rng.int(0, 4)];
    const n1 = rng.int(1, den - 2);
    const n2 = rng.int(1, den - n1 - 1);
    const g = gcd(n1 + n2, den);
    return {
      prompt: `${n1}/${den} + ${n2}/${den} =`,
      answer: `${(n1 + n2) / g}/${den / g}`,
      cat: "fraction",
    };
  },

  longDivision: (rng) => {
    const divisor = rng.int(3, 12);
    const quotient = rng.int(11, 99);
    return {
      prompt: `${divisor * quotient} \u00f7 ${divisor} =`,
      answer: quotient,
      cat: "number",
    };
  },

  wordProblem: (rng) => {
    const per = rng.int(6, 24);
    const groups = rng.int(3, 9);
    const frames = [
      [`A box holds ${per} pencils. How many pencils are in ${groups} boxes?`],
      [`Each shelf fits ${per} books. How many books fit on ${groups} shelves?`],
      [`A van carries ${per} students. How many students ride in ${groups} vans?`],
      [`One tray has ${per} muffins. How many muffins are on ${groups} trays?`],
    ];
    return {
      prompt: frames[rng.int(0, frames.length - 1)][0],
      answer: per * groups,
      cat: "word",
    };
  },

  areaRectangle: (rng) => {
    const w = rng.int(4, 18);
    const h = rng.int(3, 15);
    return {
      prompt: `A rectangle is ${w} cm by ${h} cm. What is its area?`,
      answer: `${w * h} cm\u00b2`,
      cat: "geometry",
    };
  },

  roundNearest: (rng) => {
    const n = rng.int(112, 9877);
    return {
      prompt: `Round ${n} to the nearest hundred.`,
      answer: Math.round(n / 100) * 100,
      cat: "number",
    };
  },
};

const CATEGORY = {
  number: { label: "Number and operations", tone: "#2563EB" },
  fraction: { label: "Fractions", tone: "#7C3AED" },
  geometry: { label: "Measurement and geometry", tone: "#0D9488" },
  word: { label: "Word problems", tone: "#EA580C" },
};

/* ---------------------------------------------------------------
   Template catalogue. Each entry is config, not bespoke code.
----------------------------------------------------------------*/
const TEMPLATES = [
  {
    id: "times-tables",
    title: "Times tables",
    detail: "Two-digit by one-digit multiplication",
    grade: 4,
    count: 20,
    gen: "multiplyTwoDigit",
    cat: "number",
  },
  {
    id: "fractions-like",
    title: "Adding fractions",
    detail: "Same denominator, answers reduced",
    grade: 4,
    count: 20,
    gen: "addLikeFractions",
    cat: "fraction",
  },
  {
    id: "long-division",
    title: "Long division",
    detail: "No remainders, divisors to 12",
    grade: 5,
    count: 15,
    gen: "longDivision",
    cat: "number",
  },
  {
    id: "word-multiply",
    title: "Multiplication in context",
    detail: "One-step word problems",
    grade: 3,
    count: 12,
    gen: "wordProblem",
    cat: "word",
  },
  {
    id: "rectangle-area",
    title: "Area of rectangles",
    detail: "Whole-number sides in centimetres",
    grade: 4,
    count: 16,
    gen: "areaRectangle",
    cat: "geometry",
  },
  {
    id: "rounding",
    title: "Rounding",
    detail: "To the nearest ten and hundred",
    grade: 3,
    count: 20,
    gen: "roundNearest",
    cat: "number",
  },
];

const GRADES = [3, 4, 5];

/* ---------------------------------------------------------------
   Build a sheet. Deduplicates on prompt text with a retry cap so a
   small answer space cannot spin forever.
----------------------------------------------------------------*/
function buildSheet(genKeys, count, seed) {
  const rng = makeRng(seed);
  const gen = genKeys.map((k) => GENERATORS[k]);
  const seen = new Set();
  const out = [];
  let attempts = 0;
  while (out.length < count && attempts < count * 25) {
    const q = gen[out.length % gen.length](rng);
    attempts += 1;
    if (seen.has(q.prompt)) continue;
    seen.add(q.prompt);
    out.push(q);
  }
  return out;
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Space+Grotesk:wght@400;500;700&display=swap');

.ml { --desk:#EDF1F5; --paper:#FFFFFF; --ink:#16202B; --ink-soft:#5A6B7C;
      --rule:#D3E3F2; --blue:#2563EB; --blue-deep:#1D4FD7; --mint:#10B981;
      font-family:'Inter',system-ui,sans-serif; color:var(--ink);
      background:var(--desk); min-height:100vh; min-height:100dvh;
      overflow-x:hidden; }
.ml *,.ml *::before,.ml *::after { box-sizing:border-box; }
:where(.ml button) { font:inherit; cursor:pointer; border:none; background:none; color:inherit; }
.ml :focus-visible { outline:2px solid var(--blue); outline-offset:3px; }

.ml-shell { max-width:1120px; margin:0 auto; padding:0 24px; }

.ml-bar { display:flex; align-items:center; gap:10px; padding:20px 0; }
.ml-logo { height:80px; width:auto; object-fit:contain; display:block; }

.ml-banner { position:relative; border-bottom:1px solid var(--rule); }
.ml-banner::before { content:''; position:absolute; inset:0; pointer-events:none;
  background-image:linear-gradient(#AFCCE8 1px,transparent 1px),
                   linear-gradient(90deg,#AFCCE8 1px,transparent 1px);
  background-size:28px 28px; opacity:.85;
  -webkit-mask-image:radial-gradient(115% 80% at 66% 46%,#000 22%,transparent 74%);
  mask-image:radial-gradient(115% 80% at 66% 46%,#000 22%,transparent 74%); }
.ml-banner > * { position:relative; }

.ml-hero { display:grid; grid-template-columns:minmax(0,5fr) minmax(0,6fr);
           gap:56px; align-items:center; padding:48px 0 64px; }
.ml-stack { position:relative; }
.ml-stack::before,.ml-stack::after { content:''; position:absolute;
  background:var(--paper); border:1px solid #C3D9EC; border-radius:4px;
  left:0; right:0; top:0; bottom:0; }
.ml-stack::before { transform:rotate(-2.2deg) translate(-14px,10px); }
.ml-stack::after  { transform:rotate(1.4deg) translate(9px,6px); }
.ml-head { font-family:'Space Grotesk',sans-serif; font-weight:500; font-size:52px;
           line-height:1.04; letter-spacing:-.03em; margin:0 0 20px; }
.ml-sub { font-size:17px; line-height:1.6; color:var(--ink-soft); margin:0 0 28px;
          max-width:38ch; }
.ml-cta { display:flex; gap:12px; flex-wrap:wrap; }
.ml-btn { background:var(--blue); color:#fff; padding:13px 22px; border-radius:8px;
          font-size:15px; font-weight:500; }
.ml-btn:hover { background:var(--blue-deep); }
.ml-btn-quiet { border:1px solid var(--rule); background:var(--paper);
                padding:13px 22px; border-radius:8px; font-size:15px; }
.ml-btn-quiet:hover { border-color:var(--blue); color:var(--blue); }

.ml-sheet { background:var(--paper); border:1px solid var(--rule); border-radius:4px;
            padding:34px 38px; position:relative; z-index:1; }
.ml-sheet-top { display:flex; justify-content:space-between; align-items:baseline;
                border-bottom:1px solid var(--rule); padding-bottom:14px; margin-bottom:6px;
                font-size:13px; color:var(--ink-soft); }
.ml-q { display:flex; align-items:baseline; gap:14px; padding:11px 0;
        border-bottom:1px solid #F1F5F9; }
.ml-q:last-of-type { border-bottom:none; }
.ml-q-n { font-size:13px; color:var(--ink-soft); width:20px; flex:none;
          font-variant-numeric:tabular-nums; }
.ml-q-t { font-family:'Space Grotesk',sans-serif; font-size:19px;
          font-variant-numeric:tabular-nums; line-height:1.45; }
.ml-q-t.prose { font-family:'Inter',sans-serif; font-size:16px; }
.ml-dot { width:6px; height:6px; border-radius:50%; flex:none; align-self:center; }
.ml-shuffle { position:absolute; top:-14px; right:22px; background:var(--paper);
              border:1px solid var(--rule); border-radius:20px; padding:7px 15px;
              font-size:13px; color:var(--blue); display:flex; align-items:center; gap:7px; }
.ml-shuffle:hover { border-color:var(--blue); }
.ml-shuffle svg { transition:transform .35s ease; }
.ml-shuffle:hover svg { transform:rotate(140deg); }

.ml-gal { padding:8px 0 72px; }
.ml-gal-top { display:flex; align-items:baseline; gap:20px; flex-wrap:wrap;
              margin-bottom:22px; }
.ml-gal-h { font-family:'Space Grotesk',sans-serif; font-weight:500; font-size:23px;
            letter-spacing:-.02em; margin:0; }
.ml-filters { display:flex; gap:7px; margin-left:auto; }
.ml-filter { border:1px solid var(--rule); background:var(--paper); border-radius:18px;
             padding:7px 16px; font-size:14px; color:var(--ink-soft); }
.ml-filter:hover { border-color:var(--blue); }
.ml-filter[aria-pressed="true"] { background:var(--ink); border-color:var(--ink); color:#fff; }

.ml-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(268px,1fr)); gap:18px; }
.ml-card { background:var(--paper); border:1px solid var(--rule); border-radius:4px;
           overflow:hidden; text-align:left; display:flex; flex-direction:column;
           transition:border-color .15s ease; }
.ml-card:hover { border-color:var(--blue); }
.ml-card-rule { height:3px; }
.ml-card-in { padding:18px 20px 20px; display:flex; flex-direction:column; flex:1; }
.ml-card-h { font-family:'Space Grotesk',sans-serif; font-weight:500; font-size:17px;
             letter-spacing:-.01em; margin:0 0 5px; }
.ml-card-d { font-size:13.5px; color:var(--ink-soft); line-height:1.5; margin:0 0 16px; }
.ml-peek { background:#F8FAFC; border-radius:3px; padding:11px 13px; margin-bottom:16px;
           font-family:'Space Grotesk',sans-serif; font-size:15px;
           font-variant-numeric:tabular-nums; color:var(--ink); }
.ml-peek.prose { font-family:'Inter',sans-serif; font-size:13.5px; line-height:1.45; }
.ml-card-f { display:flex; align-items:center; justify-content:space-between;
             margin-top:auto; font-size:13px; color:var(--ink-soft); }
.ml-get { color:var(--blue); font-weight:500; }

@media (max-width:900px) {
  .ml-hero { grid-template-columns:1fr; gap:36px; padding:32px 0 48px; }
  .ml-head { font-size:38px; }
  .ml-sheet { padding:26px 22px; }
  .ml-q-t { font-size:17px; }
  .ml-banner::before { -webkit-mask-image:radial-gradient(150% 62% at 50% 74%,#000 16%,transparent 72%);
                       mask-image:radial-gradient(150% 62% at 50% 74%,#000 16%,transparent 72%); }
  .ml-stack::before { transform:rotate(-1.6deg) translate(-8px,7px); }
  .ml-stack::after  { transform:rotate(1deg) translate(5px,4px); }
}
@media (max-width:520px) {
  .ml-shell { padding:0 16px; }
  .ml-head { font-size:31px; }
  .ml-sub { font-size:15.5px; }
  .ml-cta { flex-direction:column; }
  .ml-btn,.ml-btn-quiet { text-align:center; min-height:48px; }
  .ml-grid { grid-template-columns:1fr; }

  .ml-gal-top { flex-direction:column; align-items:stretch; gap:14px; }
  .ml-filters { margin-left:0; gap:8px; overflow-x:auto; padding-bottom:4px;
                scrollbar-width:none; -webkit-overflow-scrolling:touch; }
  .ml-filters::-webkit-scrollbar { display:none; }
  .ml-filter { min-height:44px; padding:0 18px; flex:none; white-space:nowrap;
               display:inline-flex; align-items:center; }

  .ml-shuffle { position:static; width:100%; justify-content:center;
                min-height:44px; margin-bottom:16px; }
  .ml-sheet { padding:20px 18px; }
  .ml-q { padding:13px 0; }
  .ml-stack::before { transform:rotate(-1.2deg) translate(-5px,6px); }
  .ml-stack::after  { transform:rotate(.8deg) translate(4px,4px); }
}
@media (prefers-reduced-motion:reduce) {
  .ml *,.ml *::before { transition:none !important; animation:none !important; }
}
`;

function ShuffleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  );
}

export default function MathlyLanding({ onOpenTemplate, onBuildCustom }) {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e6));
  const [grade, setGrade] = useState(null);

  const heroSheet = useMemo(
    () =>
      buildSheet(
        ["multiplyTwoDigit", "addLikeFractions", "wordProblem", "longDivision", "areaRectangle"],
        5,
        seed
      ),
    [seed]
  );

  const shuffle = useCallback(() => setSeed(Math.floor(Math.random() * 1e6)), []);

  const shown = grade ? TEMPLATES.filter((t) => t.grade === grade) : TEMPLATES;

  return (
    <div className="ml">
      <style>{CSS}</style>

      <div className="ml-banner">
        <div className="ml-shell">
        <header className="ml-bar">
          <img src={mathlyLogo} alt="Mathly" className="ml-logo" />
        </header>

        <section className="ml-hero">
          <div>
            <h1 className="ml-head">Every worksheet is a new worksheet.</h1>
            <p className="ml-sub">
              Problems are generated fresh each time, so the same skill never
              comes back as the same sheet. Pick one below, or build your own.
            </p>
            <div className="ml-cta">
              <button className="ml-btn" onClick={onBuildCustom}>
                Build a worksheet
              </button>
              <button className="ml-btn-quiet" onClick={shuffle}>
                See another example
              </button>
            </div>
          </div>

          <div className="ml-stack">
          <div className="ml-sheet">
            <button className="ml-shuffle" onClick={shuffle}>
              <ShuffleIcon />
              Shuffle
            </button>
            <div className="ml-sheet-top">
              <span>Mixed practice</span>
              <span>Grade 4</span>
            </div>
            {heroSheet.map((q, i) => (
              <div className="ml-q" key={`${seed}-${i}`}>
                <span className="ml-dot" style={{ background: CATEGORY[q.cat].tone }} />
                <span className="ml-q-n">{i + 1}.</span>
                <span className={`ml-q-t${q.cat === "word" || q.cat === "geometry" ? " prose" : ""}`}>
                  {q.prompt}
                </span>
              </div>
            ))}
          </div>
          </div>
        </section>
        </div>
      </div>

      <div className="ml-shell">
        <section className="ml-gal">
          <div className="ml-gal-top">
            <h2 className="ml-gal-h">Ready to print</h2>
            <div className="ml-filters">
              <button
                className="ml-filter"
                aria-pressed={grade === null}
                onClick={() => setGrade(null)}
              >
                All
              </button>
              {GRADES.map((g) => (
                <button
                  key={g}
                  className="ml-filter"
                  aria-pressed={grade === g}
                  onClick={() => setGrade(g)}
                >
                  Grade {g}
                </button>
              ))}
            </div>
          </div>

          <div className="ml-grid">
            {shown.map((t) => {
              const sample = buildSheet([t.gen], 1, seed + t.id.length)[0];
              const prose = t.cat === "word" || t.cat === "geometry";
              return (
                <button
                  key={t.id}
                  className="ml-card"
                  onClick={() => onOpenTemplate?.(t)}
                >
                  <div
                    className="ml-card-rule"
                    style={{ background: CATEGORY[t.cat].tone }}
                    aria-hidden="true"
                  />
                  <div className="ml-card-in">
                    <h3 className="ml-card-h">{t.title}</h3>
                    <p className="ml-card-d">{t.detail}</p>
                    <div className={`ml-peek${prose ? " prose" : ""}`}>{sample.prompt}</div>
                    <div className="ml-card-f">
                      <span>
                        Grade {t.grade}, {t.count} questions
                      </span>
                      <span className="ml-get">Open</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
