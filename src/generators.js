/* ===============================================================
   Mathly generator engine.

   Two rules hold everywhere in this file:

   1. The answer is produced by the same computation that produced
      the question. Nothing is ever re-solved, so an answer key
      cannot drift from its worksheet.

   2. Problems are constructed backwards. Pick the answer or the
      roots first, then build a question around them. That is what
      guarantees clean integers without any symbolic algebra.
================================================================*/

export function makeRng(seed) {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
  };
}

export const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

const reduce = (n, d) => {
  const g = gcd(n, d) || 1;
  return [n / g, d / g];
};

/* Decimals are held as integer tenths or hundredths and divided
   only at render time, so 0.1 + 0.2 never appears on a sheet. */
const fromCents = (c) => (c / 100).toFixed(2);
const fromTenths = (t) => (t / 10).toFixed(1);

/* Negative numbers get parentheses in a signed expression so
   "7 + -3" never appears — only "7 + (-3)". */
const fmtSigned = (n) => (n < 0 ? `(${n})` : `${n}`);

export const CATEGORIES = {
  number:   { label: "Number and operations", tone: "#2563EB" },
  fraction: { label: "Fractions and decimals", tone: "#7C3AED" },
  geometry: { label: "Measurement and geometry", tone: "#0D9488" },
  word:     { label: "Word problems", tone: "#EA580C" },
  algebra:  { label: "Algebra", tone: "#DB2777" },
};

const RANGE = (easy, medium, hard) => ({ easy, medium, hard });

/* ---------------------------------------------------------------
   Skill catalogue. `gen` receives (rng, difficulty) and returns
   { prompt, answer }. `space` is the count of distinct problems,
   used to cap the question slider so a sheet can't exhaust a skill.
----------------------------------------------------------------*/
export const SKILLS = [
  {
    id: "count-sequence",
    name: "Counting on",
    hint: "Fill in the next number",
    ccss: "K.CC.A.2",
    grade: 0,
    cat: "number",
    space: 90,
    gen(rng, d) {
      const hi = RANGE(10, 30, 100)[d];
      const start = rng.int(1, hi - 4);
      return {
        prompt: `${start}, ${start + 1}, ${start + 2}, ____`,
        answer: start + 3,
      };
    },
  },
  {
    id: "add-within-5",
    name: "Adding within 5",
    hint: "Sums to 5",
    ccss: "K.OA.A.5",
    grade: 0,
    cat: "number",
    space: 21,
    gen(rng, d) {
      const hi = RANGE(3, 4, 5)[d];
      const a = rng.int(0, hi);
      const b = rng.int(0, hi - a);
      return { prompt: `${a} + ${b} =`, answer: a + b };
    },
  },
  {
    id: "sub-within-5",
    name: "Subtracting within 5",
    hint: "Answers stay positive",
    ccss: "K.OA.A.5",
    grade: 0,
    cat: "number",
    space: 21,
    gen(rng, d) {
      const hi = RANGE(3, 4, 5)[d];
      const a = rng.int(1, hi);
      const b = rng.int(0, a);
      return { prompt: `${a} \u2212 ${b} =`, answer: a - b };
    },
  },
  {
    id: "make-ten",
    name: "Making ten",
    hint: "Find the missing part",
    ccss: "K.OA.A.4",
    grade: 0,
    cat: "number",
    space: 9,
    gen(rng) {
      const a = rng.int(1, 9);
      return { prompt: `${a} + ____ = 10`, answer: 10 - a };
    },
  },
  {
    id: "compare-numbers-10",
    name: "Comparing numbers to 10",
    hint: "Greater than or less than",
    ccss: "K.CC.C.7",
    grade: 0,
    cat: "number",
    space: 100,
    gen(rng, d) {
      const hi = RANGE(5, 10, 20)[d];
      let a = rng.int(0, hi);
      let b = rng.int(0, hi);
      if (a === b) b = b === hi ? b - 1 : b + 1;
      return { prompt: `${a} ____ ${b}`, answer: a > b ? ">" : "<" };
    },
  },

  {
    id: "add-within-20",
    name: "Adding within 20",
    hint: "Sums to 20",
    ccss: "1.OA.C.6",
    grade: 1,
    cat: "number",
    space: 210,
    gen(rng, d) {
      const hi = RANGE(10, 15, 20)[d];
      const a = rng.int(1, hi - 1);
      const b = rng.int(1, hi - a);
      return { prompt: `${a} + ${b} =`, answer: a + b };
    },
  },
  {
    id: "sub-within-20",
    name: "Subtracting within 20",
    hint: "Answers stay positive",
    ccss: "1.OA.C.6",
    grade: 1,
    cat: "number",
    space: 210,
    gen(rng, d) {
      const hi = RANGE(10, 15, 20)[d];
      const a = rng.int(2, hi);
      const b = rng.int(1, a);
      return { prompt: `${a} \u2212 ${b} =`, answer: a - b };
    },
  },
  {
    id: "missing-addend",
    name: "Missing addend",
    hint: "What goes in the blank",
    ccss: "1.OA.D.8",
    grade: 1,
    cat: "number",
    space: 190,
    gen(rng, d) {
      const hi = RANGE(10, 15, 20)[d];
      const total = rng.int(3, hi);
      const a = rng.int(1, total - 1);
      return { prompt: `${a} + ____ = ${total}`, answer: total - a };
    },
  },
  {
    id: "ten-more-less",
    name: "Ten more, ten less",
    hint: "Mental arithmetic",
    ccss: "1.NBT.C.5",
    grade: 1,
    cat: "number",
    space: 180,
    gen(rng, d) {
      const hi = RANGE(50, 80, 99)[d];
      const n = rng.int(11, hi - 10);
      const more = rng.next() < 0.5;
      return {
        prompt: `What is ten ${more ? "more" : "less"} than ${n}?`,
        answer: more ? n + 10 : n - 10,
      };
    },
  },
  {
    id: "add-tens",
    name: "Adding multiples of ten",
    hint: "Whole tens only",
    ccss: "1.NBT.C.4",
    grade: 1,
    cat: "number",
    space: 45,
    gen(rng, d) {
      const hi = RANGE(5, 7, 9)[d];
      const a = rng.int(1, hi);
      const b = rng.int(1, Math.max(1, 10 - a));
      return { prompt: `${a * 10} + ${b * 10} =`, answer: (a + b) * 10 };
    },
  },
  {
    id: "time-hour",
    name: "Telling time to the hour",
    hint: "Whole and half hours",
    ccss: "1.MD.B.3",
    grade: 1,
    cat: "geometry",
    space: 24,
    gen(rng, d) {
      const h = rng.int(1, 12);
      const half = d !== "easy" && rng.next() < 0.5;
      const later = rng.int(1, 4);
      return {
        prompt: `It is ${h}:${half ? "30" : "00"}. What time is it ${later} ${
          later === 1 ? "hour" : "hours"
        } later?`,
        answer: `${((h + later - 1) % 12) + 1}:${half ? "30" : "00"}`,
      };
    },
  },

  {
    id: "add-within-100",
    name: "Adding within 100",
    hint: "Two-digit addition",
    ccss: "2.NBT.B.5",
    grade: 2,
    cat: "number",
    space: 900,
    gen(rng, d) {
      const hi = RANGE(40, 70, 99)[d];
      const a = rng.int(10, hi);
      const b = rng.int(2, Math.max(2, 100 - a));
      return { prompt: `${a} + ${b} =`, answer: a + b };
    },
  },
  {
    id: "sub-within-100",
    name: "Subtracting within 100",
    hint: "Two-digit subtraction",
    ccss: "2.NBT.B.5",
    grade: 2,
    cat: "number",
    space: 900,
    gen(rng, d) {
      const hi = RANGE(40, 70, 99)[d];
      const a = rng.int(12, hi);
      const b = rng.int(2, a - 1);
      return { prompt: `${a} \u2212 ${b} =`, answer: a - b };
    },
  },
  {
    id: "place-value",
    name: "Place value",
    hint: "Tens and ones",
    ccss: "2.NBT.A.1",
    grade: 2,
    cat: "number",
    space: 400,
    gen(rng, d) {
      const hi = RANGE(99, 500, 999)[d];
      const n = rng.int(hi > 99 ? 100 : 11, hi);
      const digits = String(n).split("").map(Number);
      const names = digits.length === 3
        ? ["hundreds", "tens", "ones"]
        : ["tens", "ones"];
      const i = rng.int(0, names.length - 1);
      return {
        prompt: `In ${n}, what digit is in the ${names[i]} place?`,
        answer: digits[i],
      };
    },
  },
  {
    id: "skip-count",
    name: "Skip counting",
    hint: "By 2s, 5s and 10s",
    ccss: "2.NBT.A.2",
    grade: 2,
    cat: "number",
    space: 150,
    gen(rng, d) {
      const step = rng.pick(RANGE([10], [5, 10], [2, 3, 5, 10])[d]);
      const start = step * rng.int(1, 12);
      return {
        prompt: `${start}, ${start + step}, ${start + step * 2}, ____`,
        answer: start + step * 3,
      };
    },
  },
  {
    id: "money-coins",
    name: "Counting money",
    hint: "Coins in cents",
    ccss: "2.MD.C.8",
    grade: 2,
    cat: "word",
    space: 300,
    gen(rng, d) {
      const q = rng.int(0, RANGE(1, 2, 3)[d]);
      const dm = rng.int(0, RANGE(2, 3, 4)[d]);
      const n = rng.int(0, 3);
      const p = rng.int(1, 4);
      const total = q * 25 + dm * 10 + n * 5 + p;
      const parts = [];
      if (q) parts.push(`${q} quarter${q > 1 ? "s" : ""}`);
      if (dm) parts.push(`${dm} dime${dm > 1 ? "s" : ""}`);
      if (n) parts.push(`${n} nickel${n > 1 ? "s" : ""}`);
      parts.push(`${p} penn${p > 1 ? "ies" : "y"}`);
      return {
        prompt: `How much is ${parts.join(", ")}?`,
        answer: `${total}\u00a2`,
      };
    },
  },

  {
    id: "mult-facts",
    name: "Multiplication facts",
    hint: "Single-digit products",
    ccss: "3.OA.C.7",
    grade: 3,
    cat: "number",
    space: 121,
    gen(rng, d) {
      const [lo, hi] = RANGE([0, 5], [0, 10], [2, 12])[d];
      const a = rng.int(lo, hi);
      const b = rng.int(lo, hi);
      return { prompt: `${a} \u00d7 ${b} =`, answer: a * b };
    },
  },
  {
    id: "div-facts",
    name: "Division facts",
    hint: "No remainders",
    ccss: "3.OA.C.7",
    grade: 3,
    cat: "number",
    space: 100,
    gen(rng, d) {
      const [lo, hi] = RANGE([2, 5], [2, 9], [2, 12])[d];
      const divisor = rng.int(lo, hi);
      const quotient = rng.int(lo, hi);
      return { prompt: `${divisor * quotient} \u00f7 ${divisor} =`, answer: quotient };
    },
  },
  {
    id: "add-1000",
    name: "Adding within 1000",
    hint: "Three-digit addition",
    ccss: "3.NBT.A.2",
    grade: 3,
    cat: "number",
    space: 4000,
    gen(rng, d) {
      const hi = RANGE(200, 500, 900)[d];
      const a = rng.int(10, hi);
      const b = rng.int(10, Math.min(hi, 1000 - a));
      return { prompt: `${a} + ${b} =`, answer: a + b };
    },
  },
  {
    id: "sub-1000",
    name: "Subtracting within 1000",
    hint: "Answers stay positive",
    ccss: "3.NBT.A.2",
    grade: 3,
    cat: "number",
    space: 4000,
    gen(rng, d) {
      const hi = RANGE(200, 500, 999)[d];
      const a = rng.int(30, hi);
      const b = rng.int(10, a - 1);
      return { prompt: `${a} \u2212 ${b} =`, answer: a - b };
    },
  },
  {
    id: "unit-fractions",
    name: "Naming unit fractions",
    hint: "Parts of a whole",
    ccss: "3.NF.A.1",
    grade: 3,
    cat: "fraction",
    space: 60,
    gen(rng, d) {
      const dens = RANGE([2, 3, 4], [2, 3, 4, 6, 8], [3, 5, 6, 8, 10, 12])[d];
      const den = rng.pick(dens);
      const num = rng.int(1, den - 1);
      return {
        prompt: `A shape is split into ${den} equal parts. ${num} ${
          num === 1 ? "part is" : "parts are"
        } shaded. What fraction is shaded?`,
        answer: `${num}/${den}`,
      };
    },
  },
  {
    id: "rect-area",
    name: "Area of rectangles",
    hint: "Whole-number sides",
    ccss: "3.MD.C.7",
    grade: 3,
    cat: "geometry",
    space: 400,
    gen(rng, d) {
      const hi = RANGE(8, 14, 25)[d];
      const w = rng.int(2, hi);
      const h = rng.int(2, hi);
      return {
        prompt: `A rectangle measures ${w} cm by ${h} cm. What is its area?`,
        answer: `${w * h} cm\u00b2`,
      };
    },
  },
  {
    id: "rect-perimeter",
    name: "Perimeter of rectangles",
    hint: "Add all four sides",
    ccss: "3.MD.D.8",
    grade: 3,
    cat: "geometry",
    space: 400,
    gen(rng, d) {
      const hi = RANGE(9, 16, 30)[d];
      const w = rng.int(2, hi);
      const h = rng.int(2, hi);
      return {
        prompt: `A rectangle is ${w} m long and ${h} m wide. What is its perimeter?`,
        answer: `${2 * (w + h)} m`,
      };
    },
  },
  {
    id: "word-onestep",
    name: "One-step word problems",
    hint: "Multiplication in context",
    ccss: "3.OA.D.8",
    grade: 3,
    cat: "word",
    space: 500,
    gen(rng, d) {
      const hi = RANGE(8, 15, 30)[d];
      const per = rng.int(3, hi);
      const groups = rng.int(3, 9);
      const f = rng.pick([
        [`A box holds ${per} pencils. How many pencils are in ${groups} boxes?`],
        [`Each shelf fits ${per} books. How many books fit on ${groups} shelves?`],
        [`One tray has ${per} muffins. How many muffins are on ${groups} trays?`],
        [`A van carries ${per} students. How many students ride in ${groups} vans?`],
        [`Each packet holds ${per} seeds. How many seeds are in ${groups} packets?`],
      ]);
      return { prompt: f[0], answer: per * groups };
    },
  },

  {
    id: "mult-2x1",
    name: "Multiply 2-digit by 1-digit",
    hint: "Regrouping practice",
    ccss: "4.NBT.B.5",
    grade: 4,
    cat: "number",
    space: 700,
    gen(rng, d) {
      const [alo, ahi] = RANGE([11, 39], [12, 79], [23, 99])[d];
      const a = rng.int(alo, ahi);
      const b = rng.int(RANGE(2, 3, 4)[d], 9);
      return { prompt: `${a} \u00d7 ${b} =`, answer: a * b };
    },
  },
  {
    id: "mult-2x2",
    name: "Multiply 2-digit by 2-digit",
    hint: "Two partial products",
    ccss: "4.NBT.B.5",
    grade: 4,
    cat: "number",
    space: 3000,
    gen(rng, d) {
      const [lo, hi] = RANGE([11, 25], [12, 49], [23, 99])[d];
      return (() => {
        const a = rng.int(lo, hi);
        const b = rng.int(lo, hi);
        return { prompt: `${a} \u00d7 ${b} =`, answer: a * b };
      })();
    },
  },
  {
    id: "long-division",
    name: "Long division",
    hint: "No remainders",
    ccss: "4.NBT.B.6",
    grade: 4,
    cat: "number",
    space: 900,
    gen(rng, d) {
      const dhi = RANGE(6, 9, 12)[d];
      const qhi = RANGE(30, 60, 99)[d];
      const divisor = rng.int(2, dhi);
      const quotient = rng.int(11, qhi);
      return { prompt: `${divisor * quotient} \u00f7 ${divisor} =`, answer: quotient };
    },
  },
  {
    id: "frac-add-like",
    name: "Add fractions, like denominators",
    hint: "Answers reduced",
    ccss: "4.NF.B.3",
    grade: 4,
    cat: "fraction",
    space: 144,
    gen(rng, d) {
      const dens = RANGE([4, 5, 6], [4, 5, 6, 8, 10], [6, 8, 9, 10, 12])[d];
      const den = rng.pick(dens);
      const n1 = rng.int(1, den - 2);
      const n2 = rng.int(1, den - n1 - 1);
      const [rn, rd] = reduce(n1 + n2, den);
      return {
        prompt: `${n1}/${den} + ${n2}/${den} =`,
        answer: rd === 1 ? `${rn}` : `${rn}/${rd}`,
      };
    },
  },
  {
    id: "frac-equivalent",
    name: "Equivalent fractions",
    hint: "Find the missing numerator",
    ccss: "4.NF.A.1",
    grade: 4,
    cat: "fraction",
    space: 200,
    gen(rng, d) {
      const den = rng.pick(RANGE([2, 3, 4], [2, 3, 4, 5, 6], [3, 4, 6, 8, 9])[d]);
      const num = rng.int(1, den - 1);
      const k = rng.int(2, RANGE(3, 5, 8)[d]);
      return {
        prompt: `${num}/${den} = ___/${den * k}`,
        answer: num * k,
      };
    },
  },
  {
    id: "round-multidigit",
    name: "Rounding multi-digit numbers",
    hint: "Nearest ten, hundred, thousand",
    ccss: "4.NBT.A.3",
    grade: 4,
    cat: "number",
    space: 800,
    gen(rng, d) {
      const place = rng.pick(RANGE([10], [10, 100], [10, 100, 1000])[d]);
      const n = rng.int(RANGE(112, 1120, 10120)[d], RANGE(987, 9870, 98700)[d]);
      const name = { 10: "ten", 100: "hundred", 1000: "thousand" }[place];
      return {
        prompt: `Round ${n.toLocaleString()} to the nearest ${name}.`,
        answer: (Math.round(n / place) * place).toLocaleString(),
      };
    },
  },
  {
    id: "area-word",
    name: "Area and perimeter problems",
    hint: "In context",
    ccss: "4.MD.A.3",
    grade: 4,
    cat: "word",
    space: 600,
    gen(rng, d) {
      const hi = RANGE(10, 18, 30)[d];
      const w = rng.int(3, hi);
      const h = rng.int(3, hi);
      const wantArea = rng.next() < 0.5;
      return wantArea
        ? {
            prompt: `A garden is ${w} m by ${h} m. How many square metres of soil cover it?`,
            answer: `${w * h} m\u00b2`,
          }
        : {
            prompt: `A rug is ${w} ft by ${h} ft. How much trim goes around its edge?`,
            answer: `${2 * (w + h)} ft`,
          };
    },
  },

  {
    id: "frac-add-unlike",
    name: "Add fractions, unlike denominators",
    hint: "Find a common denominator",
    ccss: "5.NF.A.1",
    grade: 5,
    cat: "fraction",
    space: 400,
    gen(rng, d) {
      const pairs = RANGE(
        [[2, 4], [3, 6], [2, 6]],
        [[2, 3], [3, 4], [4, 6], [5, 10], [3, 8]],
        [[3, 5], [4, 7], [5, 6], [7, 8], [6, 9]]
      )[d];
      const [d1, d2] = rng.pick(pairs);
      const n1 = rng.int(1, d1 - 1);
      const n2 = rng.int(1, d2 - 1);
      const den = (d1 * d2) / gcd(d1, d2);
      const [rn, rd] = reduce(n1 * (den / d1) + n2 * (den / d2), den);
      return {
        prompt: `${n1}/${d1} + ${n2}/${d2} =`,
        answer: rd === 1 ? `${rn}` : `${rn}/${rd}`,
      };
    },
  },
  {
    id: "decimal-add",
    name: "Adding decimals",
    hint: "Hundredths place",
    ccss: "5.NBT.B.7",
    grade: 5,
    cat: "fraction",
    space: 2000,
    gen(rng, d) {
      const hi = RANGE(500, 2000, 9000)[d];
      const a = rng.int(10, hi);
      const b = rng.int(10, hi);
      return {
        prompt: `${fromCents(a)} + ${fromCents(b)} =`,
        answer: fromCents(a + b),
      };
    },
  },
  {
    id: "decimal-multiply",
    name: "Multiply decimals by whole numbers",
    hint: "Tenths place",
    ccss: "5.NBT.B.7",
    grade: 5,
    cat: "fraction",
    space: 900,
    gen(rng, d) {
      const hi = RANGE(50, 150, 400)[d];
      const a = rng.int(11, hi);
      const b = rng.int(2, RANGE(5, 9, 12)[d]);
      return {
        prompt: `${fromTenths(a)} \u00d7 ${b} =`,
        answer: fromTenths(a * b),
      };
    },
  },
  {
    id: "order-ops",
    name: "Order of operations",
    hint: "Brackets first",
    ccss: "5.OA.A.1",
    grade: 5,
    cat: "number",
    space: 1500,
    gen(rng, d) {
      const hi = RANGE(8, 12, 20)[d];
      const a = rng.int(2, hi);
      const b = rng.int(2, hi);
      const c = rng.int(2, 9);
      if (rng.next() < 0.5) {
        return { prompt: `(${a} + ${b}) \u00d7 ${c} =`, answer: (a + b) * c };
      }
      return { prompt: `${a} + ${b} \u00d7 ${c} =`, answer: a + b * c };
    },
  },
  {
    id: "volume-prism",
    name: "Volume of rectangular prisms",
    hint: "Length times width times height",
    ccss: "5.MD.C.5",
    grade: 5,
    cat: "geometry",
    space: 700,
    gen(rng, d) {
      const hi = RANGE(6, 10, 15)[d];
      const l = rng.int(2, hi);
      const w = rng.int(2, hi);
      const h = rng.int(2, hi);
      return {
        prompt: `A box is ${l} cm long, ${w} cm wide and ${h} cm tall. What is its volume?`,
        answer: `${l * w * h} cm\u00b3`,
      };
    },
  },
  {
    id: "multistep-word",
    name: "Multi-step word problems",
    hint: "Two operations",
    ccss: "5.OA.A.2",
    grade: 5,
    cat: "word",
    space: 800,
    gen(rng, d) {
      const hi = RANGE(10, 20, 40)[d];
      const per = rng.int(4, hi);
      const groups = rng.int(3, 9);
      const taken = rng.int(2, Math.max(3, Math.floor((per * groups) / 4)));
      return {
        prompt: `There are ${groups} crates with ${per} apples in each. If ${taken} apples are sold, how many are left?`,
        answer: per * groups - taken,
      };
    },
  },

  /* ---------------------------------------------------------------
     Grade 6
  ----------------------------------------------------------------*/
  {
    id: "ratio-equivalent",
    name: "Equivalent ratios",
    hint: "Scale a ratio up",
    ccss: "6.RP.A.1",
    grade: 6,
    cat: "word",
    space: 400,
    gen(rng, d) {
      const hi = RANGE(6, 9, 12)[d];
      const a = rng.int(2, hi);
      const b = rng.int(2, hi);
      const k = rng.int(2, RANGE(4, 6, 9)[d]);
      return { prompt: `${a}:${b} = ${a * k}:____`, answer: b * k };
    },
  },
  {
    id: "unit-rate",
    name: "Unit rate",
    hint: "Find the rate per unit",
    ccss: "6.RP.A.2",
    grade: 6,
    cat: "word",
    space: 500,
    gen(rng, d) {
      const hi = RANGE(20, 60, 120)[d];
      const rate = rng.int(4, hi);
      const time = rng.int(2, 9);
      return {
        prompt: `A car travels ${rate * time} miles in ${time} hours. What is its speed in miles per hour?`,
        answer: rate,
      };
    },
  },
  {
    id: "divide-fractions",
    name: "Dividing fractions",
    hint: "Multiply by the reciprocal",
    ccss: "6.NS.A.1",
    grade: 6,
    cat: "fraction",
    space: 300,
    gen(rng, d) {
      const dens = RANGE([2, 3, 4], [3, 4, 5, 6], [4, 5, 6, 8])[d];
      const divisorD = rng.pick(dens);
      const divisorN = rng.int(1, divisorD - 1);
      const quotD = rng.pick(dens);
      const quotN = rng.int(1, quotD - 1);
      const dividendN = divisorN * quotN;
      const dividendD = divisorD * quotD;
      const [rn, rd] = reduce(dividendN, dividendD);
      const [an, ad] = reduce(quotN, quotD);
      return {
        prompt: `${rn}/${rd} ÷ ${divisorN}/${divisorD} =`,
        answer: ad === 1 ? `${an}` : `${an}/${ad}`,
      };
    },
  },
  {
    id: "decimal-divide",
    name: "Dividing decimals",
    hint: "Quotient lands on the cent",
    ccss: "6.NS.B.3",
    grade: 6,
    cat: "fraction",
    space: 500,
    gen(rng, d) {
      const divisor = rng.int(2, RANGE(6, 9, 12)[d]);
      const quotientCents = rng.int(RANGE(20, 100, 400)[d], RANGE(200, 900, 2000)[d]);
      const dividendCents = divisor * quotientCents;
      return {
        prompt: `${fromCents(dividendCents)} ÷ ${divisor} =`,
        answer: fromCents(quotientCents),
      };
    },
  },
  {
    id: "write-numeric-expression",
    name: "Writing expressions",
    hint: "Translate words into symbols",
    ccss: "6.EE.A.2.A",
    grade: 6,
    cat: "algebra",
    space: 80,
    gen(rng, d) {
      const n = rng.int(3, RANGE(10, 20, 40)[d]);
      const forms = [
        [`${n} more than a number x`, `x + ${n}`],
        [`${n} less than a number x`, `x − ${n}`],
        [`the product of a number x and ${n}`, `${n}x`],
        [`a number x divided by ${n}`, `x ÷ ${n}`],
      ];
      const [prompt, answer] = rng.pick(forms);
      return { prompt: `Write as an expression: ${prompt}`, answer };
    },
  },
  {
    id: "evaluate-expression",
    name: "Evaluating expressions",
    hint: "Substitute and simplify",
    ccss: "6.EE.A.2.C",
    grade: 6,
    cat: "algebra",
    space: 900,
    gen(rng, d) {
      const hi = RANGE(6, 10, 15)[d];
      const a = rng.int(2, hi);
      const b = rng.int(1, hi);
      const n = rng.int(2, hi);
      return { prompt: `Evaluate ${a}n + ${b} when n = ${n}.`, answer: a * n + b };
    },
  },
  {
    id: "one-step-equation-6",
    name: "One-step equations",
    hint: "Addition and subtraction",
    ccss: "6.EE.B.7",
    grade: 6,
    cat: "algebra",
    space: 900,
    gen(rng, d) {
      const hi = RANGE(15, 40, 99)[d];
      const x = rng.int(5, hi);
      const useAdd = rng.next() < 0.5;
      if (useAdd) {
        const b = rng.int(1, hi);
        return { prompt: `Solve: x + ${b} = ${x + b}`, answer: x };
      }
      const b = rng.int(1, x - 1);
      return { prompt: `Solve: x − ${b} = ${x - b}`, answer: x };
    },
  },
  {
    id: "area-triangle",
    name: "Area of triangles",
    hint: "Half of base times height",
    ccss: "6.G.A.1",
    grade: 6,
    cat: "geometry",
    space: 400,
    gen(rng, d) {
      const hi = RANGE(8, 14, 24)[d];
      const base = rng.int(2, hi) * 2;
      const height = rng.int(2, hi);
      const area = (base * height) / 2;
      return {
        prompt: `A triangle has a base of ${base} cm and a height of ${height} cm. What is its area?`,
        answer: `${area} cm²`,
      };
    },
  },
  {
    id: "mean-average",
    name: "Finding the mean",
    hint: "Sum divided by count",
    ccss: "6.SP.B.5.C",
    grade: 6,
    cat: "word",
    space: 300,
    gen(rng, d) {
      const count = RANGE(4, 5, 6)[d];
      const spread = RANGE(2, 4, 6)[d];
      const mean = rng.int(spread + 2, RANGE(15, 25, 40)[d]);
      const half = Math.floor(count / 2);
      const deltas = [];
      for (let i = 0; i < half; i++) deltas.push(rng.int(1, spread));
      for (let i = 0; i < half; i++) deltas.push(-deltas[i]);
      if (count % 2 === 1) deltas.push(0);
      const nums = deltas.map((delta) => mean + delta);
      return { prompt: `Find the mean of: ${nums.join(", ")}`, answer: mean };
    },
  },

  /* ---------------------------------------------------------------
     Grade 7
  ----------------------------------------------------------------*/
  {
    id: "integer-add-sub",
    name: "Adding and subtracting integers",
    hint: "Signed whole numbers",
    ccss: "7.NS.A.1",
    grade: 7,
    cat: "number",
    space: 2000,
    gen(rng, d) {
      const hi = RANGE(15, 30, 60)[d];
      const a = rng.int(-hi, hi);
      const b = rng.int(-hi, hi);
      const isAdd = rng.next() < 0.5;
      return isAdd
        ? { prompt: `${fmtSigned(a)} + ${fmtSigned(b)} =`, answer: a + b }
        : { prompt: `${fmtSigned(a)} − ${fmtSigned(b)} =`, answer: a - b };
    },
  },
  {
    id: "integer-mult-div",
    name: "Multiplying and dividing integers",
    hint: "Same signs give positive",
    ccss: "7.NS.A.2",
    grade: 7,
    cat: "number",
    space: 900,
    gen(rng, d) {
      const hi = RANGE(6, 9, 12)[d];
      const signA = rng.next() < 0.5 ? 1 : -1;
      const signB = rng.next() < 0.5 ? 1 : -1;
      const isMult = rng.next() < 0.5;
      if (isMult) {
        const a = signA * rng.int(2, hi);
        const b = signB * rng.int(2, hi);
        return { prompt: `${fmtSigned(a)} × ${fmtSigned(b)} =`, answer: a * b };
      }
      const divisor = signB * rng.int(2, hi);
      const quotient = signA * rng.int(2, hi);
      const dividend = divisor * quotient;
      return { prompt: `${fmtSigned(dividend)} ÷ ${fmtSigned(divisor)} =`, answer: quotient };
    },
  },
  {
    id: "percent-of-number",
    name: "Percent of a number",
    hint: "Part-to-whole with percent",
    ccss: "7.RP.A.3",
    grade: 7,
    cat: "word",
    space: 400,
    gen(rng, d) {
      const percent = rng.pick(RANGE([10, 50], [10, 20, 25, 50], [10, 20, 25, 50, 75])[d]);
      const scale = 100 / percent;
      const m = rng.int(2, RANGE(12, 20, 30)[d]);
      const base = m * scale;
      return { prompt: `What is ${percent}% of ${base}?`, answer: m };
    },
  },
  {
    id: "proportion-solve",
    name: "Solving proportions",
    hint: "Cross-multiply to solve",
    ccss: "7.RP.A.2.C",
    grade: 7,
    cat: "word",
    space: 500,
    gen(rng, d) {
      const hi = RANGE(6, 9, 12)[d];
      const a = rng.int(2, hi);
      const b = rng.int(2, hi);
      const k = rng.int(2, RANGE(4, 7, 10)[d]);
      const c = a * k;
      return { prompt: `Solve for n: ${a}/${b} = ${c}/n`, answer: b * k };
    },
  },
  {
    id: "two-step-equation",
    name: "Two-step equations",
    hint: "Undo addition, then multiplication",
    ccss: "7.EE.B.4.A",
    grade: 7,
    cat: "algebra",
    space: 2000,
    gen(rng, d) {
      const hi = RANGE(8, 14, 20)[d];
      const x = rng.int(1, hi);
      const a = rng.int(2, RANGE(5, 8, 12)[d]);
      const b = rng.int(1, hi);
      return { prompt: `Solve: ${a}x + ${b} = ${a * x + b}`, answer: x };
    },
  },
  {
    id: "circle-circumference",
    name: "Circumference of circles",
    hint: "Use π ≈ 22/7",
    ccss: "7.G.B.4",
    grade: 7,
    cat: "geometry",
    space: 20,
    gen(rng, d) {
      const maxK = RANGE(6, 12, 20)[d];
      const k = rng.int(1, maxK);
      const r = k * 7;
      return {
        prompt: `A circle has a radius of ${r} cm. Using π ≈ 22/7, what is its circumference?`,
        answer: `${44 * k} cm`,
      };
    },
  },
  {
    id: "probability-simple",
    name: "Simple probability",
    hint: "Favorable over total, reduced",
    ccss: "7.SP.C.7",
    grade: 7,
    cat: "word",
    space: 300,
    gen(rng, d) {
      const hi = RANGE(4, 8, 12)[d];
      const red = rng.int(1, hi);
      const blue = rng.int(1, hi);
      const total = red + blue;
      const [rn, rd] = reduce(red, total);
      return {
        prompt: `A bag has ${red} red and ${blue} blue marbles. What is the probability of picking a red marble, as a fraction?`,
        answer: rd === 1 ? `${rn}` : `${rn}/${rd}`,
      };
    },
  },

  /* ---------------------------------------------------------------
     Grade 8
  ----------------------------------------------------------------*/
  {
    id: "exponent-product-rule",
    name: "Laws of exponents",
    hint: "Add exponents when multiplying",
    ccss: "8.EE.A.1",
    grade: 8,
    cat: "algebra",
    space: 100,
    gen(rng, d) {
      const hi = RANGE(4, 7, 10)[d];
      const a = rng.int(2, hi);
      const b = rng.int(2, hi);
      return { prompt: `Simplify: x^${a} × x^${b} =`, answer: `x^${a + b}` };
    },
  },
  {
    id: "scientific-notation",
    name: "Scientific notation",
    hint: "One digit before the decimal",
    ccss: "8.EE.A.3",
    grade: 8,
    cat: "number",
    space: 50,
    gen(rng, d) {
      const digit = rng.int(1, 9);
      const zeros = rng.int(RANGE(2, 3, 4)[d], RANGE(4, 6, 8)[d]);
      const number = digit * 10 ** zeros;
      return {
        prompt: `Write ${number.toLocaleString()} in scientific notation.`,
        answer: `${digit} × 10^${zeros}`,
      };
    },
  },
  {
    id: "linear-equation-both-sides",
    name: "Variables on both sides",
    hint: "Collect x terms first",
    ccss: "8.EE.C.7.B",
    grade: 8,
    cat: "algebra",
    space: 3000,
    gen(rng, d) {
      const hi = RANGE(8, 14, 20)[d];
      const x = rng.int(1, hi);
      const a = rng.int(3, RANGE(5, 8, 12)[d]);
      const c = rng.int(1, a - 1);
      const b = rng.int(1, hi);
      const total = (a - c) * x + b;
      return { prompt: `Solve: ${a}x + ${b} = ${c}x + ${total}`, answer: x };
    },
  },
  {
    id: "slope-two-points",
    name: "Slope from two points",
    hint: "Rise over run",
    ccss: "8.F.B.4",
    grade: 8,
    cat: "algebra",
    space: 900,
    gen(rng, d) {
      const hi = RANGE(6, 10, 15)[d];
      const x1 = rng.int(-hi, hi);
      const y1 = rng.int(-hi, hi);
      const m = rng.int(-RANGE(3, 5, 8)[d], RANGE(3, 5, 8)[d]) || 1;
      const dx = rng.int(1, RANGE(3, 5, 8)[d]);
      const x2 = x1 + dx;
      const y2 = y1 + m * dx;
      return {
        prompt: `Find the slope of the line through (${x1}, ${y1}) and (${x2}, ${y2}).`,
        answer: m,
      };
    },
  },
  {
    id: "pythagorean-theorem",
    name: "Pythagorean theorem",
    hint: "a² + b² = c²",
    ccss: "8.G.B.7",
    grade: 8,
    cat: "geometry",
    space: 14,
    gen(rng, d) {
      const triples = [
        [3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [7, 24, 25], [9, 12, 15], [20, 21, 29],
      ];
      const pool = RANGE(triples.slice(0, 3), triples.slice(0, 5), triples)[d];
      const [a0, b0, c] = rng.pick(pool);
      const swap = rng.next() < 0.5;
      const a = swap ? b0 : a0;
      const b = swap ? a0 : b0;
      return {
        prompt: `A right triangle has legs of ${a} and ${b}. What is the length of the hypotenuse?`,
        answer: c,
      };
    },
  },
  {
    id: "function-evaluate",
    name: "Evaluating functions",
    hint: "Plug in the input",
    ccss: "8.F.A.1",
    grade: 8,
    cat: "algebra",
    space: 900,
    gen(rng, d) {
      const hi = RANGE(6, 10, 15)[d];
      const a = rng.int(2, hi);
      const b = rng.int(1, hi);
      const x = rng.int(1, hi);
      return { prompt: `A function is defined by f(x) = ${a}x + ${b}. What is f(${x})?`, answer: a * x + b };
    },
  },

  /* ---------------------------------------------------------------
     Grade 9 — Algebra I
  ----------------------------------------------------------------*/
  {
    id: "solve-linear-equation-9",
    name: "Multi-step linear equations",
    hint: "Isolate the variable",
    ccss: "HSA-REI.B.3",
    grade: 9,
    cat: "algebra",
    space: 3000,
    gen(rng, d) {
      const hi = RANGE(10, 20, 40)[d];
      const x = rng.int(-hi, hi) || 1;
      const a = rng.int(2, RANGE(6, 9, 12)[d]);
      const b = rng.int(1, hi);
      return { prompt: `Solve: ${a}x − ${b} = ${a * x - b}`, answer: x };
    },
  },
  {
    id: "factor-quadratic",
    name: "Factoring quadratics",
    hint: "Find two numbers that multiply and add",
    ccss: "HSA-SSE.B.3.A",
    grade: 9,
    cat: "algebra",
    space: 400,
    gen(rng, d) {
      const hi = RANGE(6, 9, 12)[d];
      const r1 = rng.int(-hi, hi) || 1;
      const r2 = rng.int(-hi, hi) || 1;
      const b = -(r1 + r2);
      const c = r1 * r2;
      const bTerm = b === 0 ? "" : ` ${b > 0 ? "+" : "−"} ${Math.abs(b)}x`;
      const cTerm = c === 0 ? "" : ` ${c > 0 ? "+" : "−"} ${Math.abs(c)}`;
      const sign1 = r1 >= 0 ? "−" : "+";
      const sign2 = r2 >= 0 ? "−" : "+";
      return {
        prompt: `Factor: x²${bTerm}${cTerm} =`,
        answer: `(x ${sign1} ${Math.abs(r1)})(x ${sign2} ${Math.abs(r2)})`,
      };
    },
  },
  {
    id: "solve-quadratic-factoring",
    name: "Solving quadratics by factoring",
    hint: "Two roots from two factors",
    ccss: "HSA-REI.B.4.B",
    grade: 9,
    cat: "algebra",
    space: 400,
    gen(rng, d) {
      const hi = RANGE(5, 8, 12)[d];
      const r1 = rng.int(-hi, hi) || 1;
      let r2 = rng.int(-hi, hi) || 2;
      if (r2 === r1) r2 += 1;
      const b = -(r1 + r2);
      const c = r1 * r2;
      const bTerm = b === 0 ? "" : ` ${b > 0 ? "+" : "−"} ${Math.abs(b)}x`;
      const cTerm = c === 0 ? "" : ` ${c > 0 ? "+" : "−"} ${Math.abs(c)}`;
      const roots = [r1, r2].sort((x, y) => x - y);
      return {
        prompt: `Solve: x²${bTerm}${cTerm} = 0`,
        answer: `x = ${roots[0]}, ${roots[1]}`,
      };
    },
  },
  {
    id: "combine-like-terms",
    name: "Combining like terms",
    hint: "Add coefficients of matching terms",
    ccss: "HSA-APR.A.1",
    grade: 9,
    cat: "algebra",
    space: 900,
    gen(rng, d) {
      const hi = RANGE(6, 10, 15)[d];
      const a1 = rng.int(1, hi);
      const b1 = rng.int(1, hi);
      const a2 = rng.int(1, hi);
      const b2 = rng.int(1, hi);
      const subtract = rng.next() < 0.5;
      const op = subtract ? "−" : "+";
      const a = subtract ? a1 - a2 : a1 + a2;
      const b = subtract ? b1 - b2 : b1 + b2;
      const bStr = b >= 0 ? `+ ${b}` : `− ${Math.abs(b)}`;
      return {
        prompt: `Simplify: (${a1}x + ${b1}) ${op} (${a2}x + ${b2}) =`,
        answer: `${a}x ${bStr}`,
      };
    },
  },
  {
    id: "multiply-binomials",
    name: "Multiplying binomials",
    hint: "FOIL: first, outer, inner, last",
    ccss: "HSA-APR.A.1",
    grade: 9,
    cat: "algebra",
    space: 400,
    gen(rng, d) {
      const hi = RANGE(4, 7, 10)[d];
      const a = rng.int(-hi, hi) || 1;
      const b = rng.int(-hi, hi) || 1;
      const bCoef = a + b;
      const cCoef = a * b;
      const aTerm = a >= 0 ? `+ ${a}` : `− ${Math.abs(a)}`;
      const bTerm = b >= 0 ? `+ ${b}` : `− ${Math.abs(b)}`;
      const bCoefStr = bCoef >= 0 ? `+ ${bCoef}x` : `− ${Math.abs(bCoef)}x`;
      const cCoefStr = cCoef >= 0 ? `+ ${cCoef}` : `− ${Math.abs(cCoef)}`;
      return {
        prompt: `Multiply: (x ${aTerm})(x ${bTerm}) =`,
        answer: `x² ${bCoefStr} ${cCoefStr}`,
      };
    },
  },
  {
    id: "slope-intercept-equation",
    name: "Writing slope-intercept equations",
    hint: "y = mx + b",
    ccss: "HSF-LE.A.2",
    grade: 9,
    cat: "algebra",
    space: 400,
    gen(rng, d) {
      const hi = RANGE(6, 9, 12)[d];
      const m = rng.int(-hi, hi) || 1;
      const b = rng.int(-hi, hi);
      return {
        prompt: `Write the equation of a line with a slope of ${m} and a y-intercept of ${b}.`,
        answer: `y = ${m}x ${b >= 0 ? "+" : "−"} ${Math.abs(b)}`,
      };
    },
  },
  {
    id: "system-of-equations",
    name: "Systems of equations",
    hint: "Add or subtract to eliminate a variable",
    ccss: "HSA-REI.C.6",
    grade: 9,
    cat: "algebra",
    space: 900,
    gen(rng, d) {
      const hi = RANGE(5, 9, 15)[d];
      const x = rng.int(1, hi);
      const y = rng.int(1, hi);
      const sum = x + y;
      const diff = x - y;
      return {
        prompt: `If x + y = ${sum} and x − y = ${diff}, what is x?`,
        answer: x,
      };
    },
  },

  /* ---------------------------------------------------------------
     Grade 10 — Geometry
  ----------------------------------------------------------------*/
  {
    id: "triangle-angle-sum",
    name: "Triangle angle sum",
    hint: "Angles add to 180°",
    ccss: "HSG-CO.C.10",
    grade: 10,
    cat: "geometry",
    space: 2000,
    gen(rng, d) {
      const hi = RANGE(100, 140, 170)[d];
      const a = rng.int(20, hi - 40);
      const b = rng.int(20, hi - a);
      const c = 180 - a - b;
      return {
        prompt: `A triangle has angles of ${a}° and ${b}°. What is the measure of the third angle?`,
        answer: `${c}°`,
      };
    },
  },
  {
    id: "pythagorean-missing-leg",
    name: "Pythagorean theorem: missing leg",
    hint: "Subtract the squares",
    ccss: "HSG-SRT.C.8",
    grade: 10,
    cat: "geometry",
    space: 14,
    gen(rng, d) {
      const triples = [
        [3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [7, 24, 25], [9, 12, 15], [20, 21, 29],
      ];
      const pool = RANGE(triples.slice(0, 3), triples.slice(0, 5), triples)[d];
      const [a, b, c] = rng.pick(pool);
      const giveA = rng.next() < 0.5;
      const known = giveA ? a : b;
      const missing = giveA ? b : a;
      return {
        prompt: `A right triangle has a hypotenuse of ${c} and one leg of ${known}. What is the length of the other leg?`,
        answer: missing,
      };
    },
  },
  {
    id: "circle-area-symbolic",
    name: "Area of circles",
    hint: "Leave the answer in terms of π",
    ccss: "HSG-GMD.A.1",
    grade: 10,
    cat: "geometry",
    space: 40,
    gen(rng, d) {
      const hi = RANGE(6, 10, 15)[d];
      const r = rng.int(2, hi);
      return { prompt: `A circle has a radius of ${r} cm. What is its area, in terms of π?`, answer: `${r * r}π cm²` };
    },
  },
  {
    id: "similar-triangles",
    name: "Similar triangles",
    hint: "Scale every side the same way",
    ccss: "HSG-SRT.B.5",
    grade: 10,
    cat: "geometry",
    space: 35,
    gen(rng, d) {
      const bases = [[3, 4, 5], [2, 3, 4], [5, 6, 7], [4, 5, 6], [3, 5, 7]];
      const [s1, s2, s3] = rng.pick(bases);
      const k = rng.int(2, RANGE(3, 5, 8)[d]);
      return {
        prompt: `Two triangles are similar. The first has sides ${s1}, ${s2}, ${s3} (in the same units). The shortest side of the second triangle is ${s1 * k}. What is the second triangle's longest side?`,
        answer: s3 * k,
      };
    },
  },
  {
    id: "volume-cylinder-symbolic",
    name: "Volume of cylinders",
    hint: "Leave the answer in terms of π",
    ccss: "HSG-GMD.A.3",
    grade: 10,
    cat: "geometry",
    space: 300,
    gen(rng, d) {
      const rhi = RANGE(3, 5, 8)[d];
      const hhi = RANGE(6, 10, 16)[d];
      const r = rng.int(2, rhi);
      const h = rng.int(3, hhi);
      return {
        prompt: `A cylinder has a radius of ${r} cm and a height of ${h} cm. What is its volume, in terms of π?`,
        answer: `${r * r * h}π cm³`,
      };
    },
  },
  {
    id: "distance-formula",
    name: "Distance between two points",
    hint: "The Pythagorean theorem on a grid",
    ccss: "HSG-GPE.B.7",
    grade: 10,
    cat: "geometry",
    space: 60,
    gen(rng, d) {
      const triples = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [7, 24, 25]];
      const pool = RANGE(triples.slice(0, 2), triples.slice(0, 4), triples)[d];
      const [a, b, c] = rng.pick(pool);
      const x0 = rng.int(-5, 5);
      const y0 = rng.int(-5, 5);
      const signX = rng.next() < 0.5 ? 1 : -1;
      const signY = rng.next() < 0.5 ? 1 : -1;
      const x1 = x0 + signX * a;
      const y1 = y0 + signY * b;
      return {
        prompt: `Find the distance between (${x0}, ${y0}) and (${x1}, ${y1}).`,
        answer: c,
      };
    },
  },

  /* ---------------------------------------------------------------
     Extra topics, added so every grade's Skills panel covers more
     than one or two categories. Only added where the category
     genuinely belongs to that grade's real curriculum — no algebra
     before grade 6, no forced geometry in the Algebra I slot (9), no
     forced fractions in the Geometry slot (10).
  ----------------------------------------------------------------*/

  // Kindergarten
  {
    id: "shape-recognition",
    name: "Naming 2D shapes",
    hint: "Circles, triangles, squares and rectangles",
    ccss: "K.G.A.2",
    grade: 0,
    cat: "geometry",
    space: 4,
    gen(rng) {
      const riddles = [
        ["This shape is round with no corners.", "circle"],
        ["This shape has 3 straight sides and 3 corners.", "triangle"],
        ["This shape has 4 sides that are all the same length.", "square"],
        ["This shape has 4 sides, and the opposite sides are the same length.", "rectangle"],
      ];
      const [clue, answer] = rng.pick(riddles);
      return { prompt: `${clue} What shape is it?`, answer };
    },
  },
  {
    id: "add-word-within-10",
    name: "Addition word problems",
    hint: "Simple stories within 10",
    ccss: "K.OA.A.2",
    grade: 0,
    cat: "word",
    space: 45,
    gen(rng, d) {
      const hi = RANGE(5, 8, 10)[d];
      const a = rng.int(1, hi - 1);
      const b = rng.int(1, hi - a);
      return {
        prompt: `There are ${a} ducks on the pond. ${b} more ducks join them. How many ducks are there now?`,
        answer: a + b,
      };
    },
  },

  // Grade 1
  {
    id: "add-sub-word-within-20",
    name: "Addition and subtraction stories",
    hint: "Word problems within 20",
    ccss: "1.OA.A.1",
    grade: 1,
    cat: "word",
    space: 380,
    gen(rng, d) {
      const hi = RANGE(10, 15, 20)[d];
      if (rng.next() < 0.5) {
        const a = rng.int(1, hi - 1);
        const b = rng.int(1, hi - a);
        return {
          prompt: `There are ${a} birds in a tree. ${b} more birds land on it. How many birds are there now?`,
          answer: a + b,
        };
      }
      const a = rng.int(2, hi);
      const b = rng.int(1, a - 1);
      return {
        prompt: `There are ${a} apples in a basket. ${b} are eaten. How many apples are left?`,
        answer: a - b,
      };
    },
  },
  {
    id: "partition-halves-fourths",
    name: "Halves and fourths",
    hint: "Equal shares of a shape",
    ccss: "1.G.A.3",
    grade: 1,
    cat: "fraction",
    space: 2,
    gen(rng) {
      const [n, name] = rng.pick([[2, "half"], [4, "fourth"]]);
      return { prompt: `A shape is split into ${n} equal shares. What is each share called?`, answer: `a ${name}` };
    },
  },

  // Grade 2
  {
    id: "shape-angles",
    name: "Shapes by angle count",
    hint: "Count the angles",
    ccss: "2.G.A.1",
    grade: 2,
    cat: "geometry",
    space: 4,
    gen(rng) {
      const shapes = [[3, "triangle"], [4, "quadrilateral"], [5, "pentagon"], [6, "hexagon"]];
      const [angles, name] = rng.pick(shapes);
      return { prompt: `A shape has ${angles} angles. What is it called?`, answer: name };
    },
  },
  {
    id: "partition-shares",
    name: "Halves, thirds and fourths",
    hint: "Equal shares of a shape",
    ccss: "2.G.A.3",
    grade: 2,
    cat: "fraction",
    space: 3,
    gen(rng) {
      const [n, name] = rng.pick([[2, "half"], [3, "third"], [4, "fourth"]]);
      return { prompt: `A shape is split into ${n} equal shares. What is each share called?`, answer: `a ${name}` };
    },
  },

  // Grade 4
  {
    id: "supplementary-angles",
    name: "Angles on a line",
    hint: "Two angles that add to 180°",
    ccss: "4.MD.C.7",
    grade: 4,
    cat: "geometry",
    space: 177,
    gen(rng, d) {
      const hi = RANGE(150, 170, 178)[d];
      const a = rng.int(2, hi);
      return {
        prompt: `Two angles together form a straight line. One angle measures ${a}°. What is the other angle?`,
        answer: `${180 - a}°`,
      };
    },
  },

  // Grade 6
  {
    id: "gcf-lcm",
    name: "GCF and LCM",
    hint: "Greatest common factor, least common multiple",
    ccss: "6.NS.B.4",
    grade: 6,
    cat: "number",
    space: 3000,
    gen(rng, d) {
      const hi = RANGE(24, 48, 96)[d];
      const a = rng.int(4, hi);
      const b = rng.int(4, hi);
      if (rng.next() < 0.5) {
        return { prompt: `What is the GCF of ${a} and ${b}?`, answer: gcd(a, b) };
      }
      return { prompt: `What is the LCM of ${a} and ${b}?`, answer: (a * b) / gcd(a, b) };
    },
  },

  // Grade 7
  {
    id: "fraction-to-decimal",
    name: "Fractions as decimals",
    hint: "Divide numerator by denominator",
    ccss: "7.NS.A.2.D",
    grade: 7,
    cat: "fraction",
    space: 90,
    gen(rng, d) {
      const hi = RANGE(40, 70, 99)[d];
      const h = rng.int(4, hi);
      const [n, den] = reduce(h, 100);
      return { prompt: `Write ${n}/${den} as a decimal.`, answer: fromCents(h) };
    },
  },

  // Grade 8
  {
    id: "linear-rate-word",
    name: "Linear rate word problems",
    hint: "A starting fee plus a rate",
    ccss: "8.F.B.4",
    grade: 8,
    cat: "word",
    space: 2000,
    gen(rng, d) {
      const hi = RANGE(10, 20, 40)[d];
      const fee = rng.int(5, hi);
      const rate = rng.int(2, RANGE(6, 10, 15)[d]);
      const x = rng.int(2, 12);
      return {
        prompt: `A car rental costs a $${fee} fee plus $${rate} per day. How much does it cost to rent for ${x} days?`,
        answer: `$${fee + rate * x}`,
      };
    },
  },

  // Grade 9 — Algebra I
  {
    id: "simplify-radical",
    name: "Simplifying radicals",
    hint: "Pull out the largest perfect square",
    ccss: "HSN-RN.A.2",
    grade: 9,
    cat: "number",
    space: 50,
    gen(rng, d) {
      const squarefree = RANGE([2, 3, 5], [2, 3, 5, 6, 7], [2, 3, 5, 6, 7, 10, 11])[d];
      const m = rng.pick(squarefree);
      const k = rng.int(2, RANGE(4, 6, 9)[d]);
      const n = k * k * m;
      return { prompt: `Simplify: √${n}`, answer: `${k}·√${m}` };
    },
  },
  {
    id: "translate-and-solve",
    name: "Translate and solve",
    hint: "Turn the sentence into an equation",
    ccss: "HSA-CED.A.1",
    grade: 9,
    cat: "word",
    space: 3000,
    gen(rng, d) {
      const hi = RANGE(10, 25, 60)[d];
      const x = rng.int(-hi, hi) || 1;
      const b = rng.int(1, hi);
      return { prompt: `A number increased by ${b} is ${x + b}. What is the number?`, answer: x };
    },
  },
  {
    id: "equation-fraction-coefficient",
    name: "Equations with fraction coefficients",
    hint: "Multiply both sides by the denominator",
    ccss: "HSA-REI.B.3",
    grade: 9,
    cat: "fraction",
    space: 900,
    gen(rng, d) {
      const den = rng.int(2, RANGE(4, 6, 9)[d]);
      const q = rng.int(1, RANGE(10, 15, 25)[d]);
      const b = rng.int(1, RANGE(10, 15, 25)[d]);
      const x = q * den;
      return { prompt: `Solve: x/${den} + ${b} = ${q + b}`, answer: x };
    },
  },

  // Grade 10 — Geometry
  {
    id: "circle-equation",
    name: "Equation of a circle",
    hint: "(x − h)² + (y − k)² = r²",
    ccss: "HSG-GPE.A.1",
    grade: 10,
    cat: "algebra",
    space: 3000,
    gen(rng, d) {
      const hi = RANGE(6, 9, 12)[d];
      const h = rng.int(-hi, hi);
      const k = rng.int(-hi, hi);
      const r = rng.int(2, RANGE(5, 8, 12)[d]);
      const hTerm = h === 0 ? "x" : `x ${h > 0 ? "−" : "+"} ${Math.abs(h)}`;
      const kTerm = k === 0 ? "y" : `y ${k > 0 ? "−" : "+"} ${Math.abs(k)}`;
      return {
        prompt: `Write the equation of a circle with center (${h}, ${k}) and radius ${r}.`,
        answer: `(${hTerm})² + (${kTerm})² = ${r * r}`,
      };
    },
  },
  {
    id: "area-cost-word",
    name: "Area and cost word problems",
    hint: "Multiply area by price per square foot",
    ccss: "HSG-MG.A.1",
    grade: 10,
    cat: "word",
    space: 2000,
    gen(rng, d) {
      const hi = RANGE(8, 14, 22)[d];
      const l = rng.int(4, hi);
      const w = rng.int(4, hi);
      const priceCents = rng.int(150, 900);
      const totalCents = l * w * priceCents;
      return {
        prompt: `A rectangular room is ${l} ft by ${w} ft. Carpet costs $${fromCents(priceCents)} per square foot. What is the total cost?`,
        answer: `$${fromCents(totalCents)}`,
      };
    },
  },
];

export const GRADES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/* Grade 0 is Kindergarten. Use this for any user-facing label. */
export const gradeLabel = (g) => (g === 0 ? "K" : String(g));

export const skillsForGrade = (grade) => SKILLS.filter((s) => s.grade === grade);

export const skillById = (id) => SKILLS.find((s) => s.id === id);

/* ---------------------------------------------------------------
   Build a worksheet. Interleaves the selected skills in rotation,
   deduplicates on prompt text, and caps retries so a small answer
   space cannot spin the loop forever.
----------------------------------------------------------------*/
export function buildSheet({ skillIds, difficulty = "medium", count = 20, seed = 1 }) {
  const rng = makeRng(seed);
  const chosen = skillIds.map(skillById).filter(Boolean);
  if (!chosen.length) return [];

  const seen = new Set();
  const out = [];
  let attempts = 0;

  while (out.length < count && attempts < count * 30) {
    const skill = chosen[out.length % chosen.length];
    const q = skill.gen(rng, difficulty);
    attempts += 1;
    if (seen.has(q.prompt)) continue;
    seen.add(q.prompt);
    out.push({ ...q, cat: skill.cat, skillId: skill.id });
  }
  return out;
}

/* Replace a single question in place, leaving the rest untouched. */
export function regenerateOne(sheet, index, difficulty, seed) {
  const skill = skillById(sheet[index].skillId);
  if (!skill) return sheet;
  const rng = makeRng(seed);
  const existing = new Set(sheet.map((q, i) => (i === index ? null : q.prompt)));
  for (let i = 0; i < 40; i += 1) {
    const q = skill.gen(rng, difficulty);
    if (existing.has(q.prompt)) continue;
    const next = sheet.slice();
    next[index] = { ...q, cat: skill.cat, skillId: skill.id };
    return next;
  }
  return sheet;
}

/* Largest question count a skill selection can fill without repeats.
   Prevents offering 30 questions from a 36-problem skill. */
export function maxQuestions(skillIds) {
  const total = skillIds
    .map(skillById)
    .filter(Boolean)
    .reduce((sum, s) => sum + s.space, 0);
  return Math.max(5, Math.min(40, Math.floor(total / 6)));
}
