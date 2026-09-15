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

/* Worked steps for the answer key. Like the answer, steps are written by
   the generator from the numbers it already holds — never by re-solving
   the prompt — so a step cannot disagree with its question. Each skill's
   last step ends with the answer exactly as the key prints it, and the
   wording is what a parent would say at the kitchen table, not what a
   textbook says. Skills without steps simply omit them. */
const fracStr = (n, d) => (d === 1 ? `${n}` : `${n}/${d}`);

/* One "simplify" step for n/d, or nothing when it's already in lowest terms. */
const simplifyStep = (n, d) => {
  const g = gcd(n, d);
  return g === 1 ? [] : [`Divide top and bottom by ${g}: ${fracStr(n / g, d / g)}`];
};

/* Steps for a + b on signed integers, the way it's taught in grade 7:
   same signs add, different signs subtract and keep the bigger sign. */
const addIntSteps = (a, b) => {
  const sum = a + b;
  if (a === 0 || b === 0) return [`Adding 0 changes nothing: ${sum}`];
  if ((a > 0) === (b > 0)) {
    return [
      `Same signs: add the sizes, ${Math.abs(a)} + ${Math.abs(b)} = ${Math.abs(sum)}`,
      `Keep the shared sign: ${sum}`,
    ];
  }
  const big = Math.max(Math.abs(a), Math.abs(b));
  const small = Math.min(Math.abs(a), Math.abs(b));
  if (sum === 0) return [`Different signs with the same size cancel out: ${sum}`];
  return [
    `Different signs: subtract the sizes, ${big} − ${small} = ${big - small}`,
    `Keep the sign of the bigger size: ${sum}`,
  ];
};

/* Early-grade strategies, in the words a K–3 classroom uses. */
const countOnSteps = (a, b) => {
  if (b === 0) return [`Adding 0 keeps it the same: ${a}`];
  if (a === 0) return [`0 plus ${b} is just ${b}`];
  const big = Math.max(a, b);
  const small = Math.min(a, b);
  // "Make ten" only helps when the sum crosses 10 from below it.
  if (big < 10 && big + small > 10) {
    const toTen = 10 - big;
    return [
      `Make ten first: ${big} + ${toTen} = 10`,
      `Then add what is left of the ${small}: 10 + ${small - toTen} = ${a + b}`,
    ];
  }
  return [`Start at the bigger number, ${big}, and count on ${small}: ${a + b}`];
};

const countBackSteps = (a, b) => {
  if (b === 0) return [`Taking away 0 keeps it the same: ${a}`];
  if (b === a) return [`Taking away all of them leaves 0`];
  // "Back to ten" when the answer lands below 10 from above it.
  if (a > 10 && b > a - 10) {
    const toTen = a - 10;
    return [
      `Go back to ten first: ${a} − ${toTen} = 10`,
      `Then take away what is left of the ${b}: 10 − ${b - toTen} = ${a - b}`,
    ];
  }
  return [`Start at ${a} and count back ${b}: ${a - b}`];
};

/* Add place by place (hundreds, tens, ones), then put the parts together. */
const placeParts = (n) => [n - (n % 100), (n % 100) - (n % 10), n % 10];
const PLACE_NAMES = ["hundreds", "tens", "ones"];
const addByPlaceSteps = (a, b) => {
  const pa = placeParts(a);
  const pb = placeParts(b);
  const steps = [];
  const partials = [];
  PLACE_NAMES.forEach((name, i) => {
    if (pa[i] === 0 && pb[i] === 0) return;
    // A place only one number has ("70 + 0") needs no line of its own.
    if (pa[i] && pb[i]) steps.push(`Add the ${name}: ${pa[i]} + ${pb[i]} = ${pa[i] + pb[i]}`);
    partials.push(pa[i] + pb[i]);
  });
  if (partials.length > 1) steps.push(`Put the parts together: ${partials.join(" + ")} = ${a + b}`);
  return steps;
};

/* Take away place by place, largest first — the running total is always visible. */
const subtractByPlaceSteps = (a, b) => {
  const pb = placeParts(b);
  const steps = [];
  let running = a;
  PLACE_NAMES.forEach((name, i) => {
    if (pb[i] === 0) return;
    steps.push(`Take away the ${name}: ${running} − ${pb[i]} = ${running - pb[i]}`);
    running -= pb[i];
  });
  return steps;
};

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
   { prompt, answer, steps? } — `steps` is an optional list of one-line
   worked steps for the answer key. `space` is the count of distinct
   problems, used to cap the question slider so a sheet can't exhaust
   a skill.
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
        steps: [`Each number is 1 more than the one before, so count on 1 from ${start + 2}: ${start + 3}`],
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
      return { prompt: `${a} + ${b} =`, answer: a + b, steps: countOnSteps(a, b) };
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
      return { prompt: `${a} − ${b} =`, answer: a - b, steps: countBackSteps(a, b) };
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
      return {
        prompt: `${a} + ____ = 10`,
        answer: 10 - a,
        steps: [`Ask: ${a} and how many more make 10? Count up from ${a} to 10: ${10 - a}`],
      };
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
      const sign = a > b ? ">" : "<";
      return {
        prompt: `${a} ____ ${b}`,
        answer: sign,
        steps: [
          `${Math.max(a, b)} is bigger than ${Math.min(a, b)}`,
          `The open side of the sign faces the bigger number: ${sign}`,
        ],
      };
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
      return { prompt: `${a} + ${b} =`, answer: a + b, steps: countOnSteps(a, b) };
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
      return { prompt: `${a} − ${b} =`, answer: a - b, steps: countBackSteps(a, b) };
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
      return {
        prompt: `${a} + ____ = ${total}`,
        answer: total - a,
        steps: [
          `Ask: ${a} and how many more make ${total}?`,
          `Take ${a} away from ${total}: ${total} − ${a} = ${total - a}`,
        ],
      };
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
        steps: more
          ? [`Ten more moves the tens digit up by 1 and leaves the ones alone: ${n} + 10 = ${n + 10}`]
          : [`Ten less moves the tens digit down by 1 and leaves the ones alone: ${n} − 10 = ${n - 10}`],
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
      return {
        prompt: `${a * 10} + ${b * 10} =`,
        answer: (a + b) * 10,
        steps: [
          `${a * 10} is ${a} tens and ${b * 10} is ${b} tens`,
          `${a} tens + ${b} tens = ${a + b} tens, which is ${(a + b) * 10}`,
        ],
      };
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
      const mm = half ? "30" : "00";
      const h2 = ((h + later - 1) % 12) + 1;
      const steps = [`The minutes stay at :${mm}; only the hour changes`];
      if (h + later > 12) {
        steps.push(`${h} + ${later} = ${h + later}, but a clock starts over after 12: ${h + later} − 12 = ${h2}`);
      } else {
        steps.push(`Move the hour forward ${later}: ${h} + ${later} = ${h2}`);
      }
      steps.push(`New time: ${h2}:${mm}`);
      return {
        prompt: `It is ${h}:${mm}. What time is it ${later} ${later === 1 ? "hour" : "hours"} later?`,
        answer: `${h2}:${mm}`,
        steps,
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
      return { prompt: `${a} + ${b} =`, answer: a + b, steps: addByPlaceSteps(a, b) };
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
      return { prompt: `${a} − ${b} =`, answer: a - b, steps: subtractByPlaceSteps(a, b) };
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
        steps: [
          `Reading ${n} from left to right: ${digits.map((dg, j) => `${dg} ${names[j]}`).join(", ")}`,
          `The ${names[i]} digit is ${digits[i]}`,
        ],
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
        steps: [
          `Find the jump: ${start + step} − ${start} = ${step}, so the numbers go up by ${step}`,
          `Jump once more: ${start + step * 2} + ${step} = ${start + step * 3}`,
        ],
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
      const steps = [];
      const values = [];
      if (q) { steps.push(`Quarters: ${q} × 25 = ${q * 25}¢`); values.push(q * 25); }
      if (dm) { steps.push(`Dimes: ${dm} × 10 = ${dm * 10}¢`); values.push(dm * 10); }
      if (n) { steps.push(`Nickels: ${n} × 5 = ${n * 5}¢`); values.push(n * 5); }
      steps.push(`Pennies: ${p} × 1 = ${p}¢`); values.push(p);
      if (values.length > 1) steps.push(`Add them up: ${values.join(" + ")} = ${total}¢`);
      return {
        prompt: `How much is ${parts.join(", ")}?`,
        answer: `${total}¢`,
        steps,
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
      const steps = a === 0 || b === 0
        ? [`Any number times 0 is 0`]
        : [`${a} groups of ${b}: count by ${b}s ${a} ${a === 1 ? "time" : "times"}: ${Array.from({ length: a }, (_, i) => (i + 1) * b).join(", ")}`];
      return { prompt: `${a} × ${b} =`, answer: a * b, steps };
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
      return {
        prompt: `${divisor * quotient} ÷ ${divisor} =`,
        answer: quotient,
        steps: [
          `Think of the times table: ${divisor} × what = ${divisor * quotient}?`,
          `${divisor} × ${quotient} = ${divisor * quotient}, so the answer is ${quotient}`,
        ],
      };
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
      return { prompt: `${a} + ${b} =`, answer: a + b, steps: addByPlaceSteps(a, b) };
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
      return { prompt: `${a} − ${b} =`, answer: a - b, steps: subtractByPlaceSteps(a, b) };
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
        steps: [
          `The bottom number counts the equal parts: ${den}`,
          `The top number counts the shaded parts: ${num}`,
          `Shaded fraction: ${num}/${den}`,
        ],
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
        answer: `${w * h} cm²`,
        steps: [`Area = length × width`, `${w} × ${h} = ${w * h} cm²`],
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
        steps: [
          `Perimeter is all four sides added: ${w} + ${h} + ${w} + ${h}`,
          `One long side and one short side: ${w} + ${h} = ${w + h}`,
          `There are two of each, so 2 × ${w + h} = ${2 * (w + h)} m`,
        ],
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
      return {
        prompt: f[0],
        answer: per * groups,
        steps: [`${groups} groups with ${per} in each means multiply: ${groups} × ${per} = ${per * groups}`],
      };
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
      const tens = a - (a % 10);
      const ones = a % 10;
      const steps = ones === 0
        ? [
            `${a} is ${tens / 10} tens, so multiply ${tens / 10} × ${b} = ${(tens / 10) * b}`,
            `${(tens / 10) * b} tens = ${a * b}`,
          ]
        : [
            `Break ${a} into ${tens} + ${ones}`,
            `${tens} × ${b} = ${tens * b}`,
            `${ones} × ${b} = ${ones * b}`,
            `Add the two parts: ${tens * b} + ${ones * b} = ${a * b}`,
          ];
      return { prompt: `${a} × ${b} =`, answer: a * b, steps };
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
      const a = rng.int(lo, hi);
      const b = rng.int(lo, hi);
      const tens = b - (b % 10);
      const ones = b % 10;
      const steps = ones === 0
        ? [
            `${b} is ${tens / 10} tens, so multiply ${a} × ${tens / 10} = ${a * (tens / 10)}`,
            `${a * (tens / 10)} tens = ${a * b}`,
          ]
        : [
            `Break ${b} into ${tens} + ${ones}`,
            `${a} × ${tens} = ${a * tens}`,
            `${a} × ${ones} = ${a * ones}`,
            `Add the two parts: ${a * tens} + ${a * ones} = ${a * b}`,
          ];
      return { prompt: `${a} × ${b} =`, answer: a * b, steps };
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
      const dividend = divisor * quotient;
      // Divide, multiply, subtract, bring down — quotient is always two
      // digits, so "head" is the dividend without its last digit.
      const head = Math.floor(dividend / 10);
      const last = dividend % 10;
      const qTens = Math.floor(quotient / 10);
      const qOnes = quotient % 10;
      const left = head - divisor * qTens;
      const broughtDown = left * 10 + last;
      const steps = [
        `${divisor} goes into ${head} ${qTens} ${qTens === 1 ? "time" : "times"}: ${divisor} × ${qTens} = ${divisor * qTens}`,
        `${head} − ${divisor * qTens} = ${left}, then bring down the ${last} to make ${broughtDown}`,
        qOnes === 0
          ? `${divisor} goes into ${broughtDown} 0 times, so the last digit is 0`
          : `${divisor} goes into ${broughtDown} ${qOnes} ${qOnes === 1 ? "time" : "times"}: ${divisor} × ${qOnes} = ${divisor * qOnes}, nothing left over`,
        `Quotient: ${quotient}`,
      ];
      return { prompt: `${dividend} ÷ ${divisor} =`, answer: quotient, steps };
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
        answer: fracStr(rn, rd),
        steps: [
          `Same denominator, so add the numerators: ${n1} + ${n2} = ${n1 + n2}`,
          `Keep the denominator: ${n1 + n2}/${den}`,
          ...simplifyStep(n1 + n2, den),
        ],
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
        steps: [
          `The denominator went from ${den} to ${den * k}: ${den} × ${k} = ${den * k}`,
          `Do the same to the numerator: ${num} × ${k} = ${num * k}`,
        ],
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
      const checkName = { 10: "ones", 100: "tens", 1000: "hundreds" }[place];
      const checkDigit = Math.floor(n / (place / 10)) % 10;
      const below = Math.floor(n / place) * place;
      const rounded = checkDigit >= 5 ? below + place : below;
      return {
        prompt: `Round ${n.toLocaleString()} to the nearest ${name}.`,
        answer: rounded.toLocaleString(),
        steps: [
          `${n.toLocaleString()} sits between ${below.toLocaleString()} and ${(below + place).toLocaleString()}`,
          `Look at the ${checkName} digit, one place to the right: it is ${checkDigit}`,
          checkDigit >= 5
            ? `${checkDigit} is 5 or more, so round up: ${rounded.toLocaleString()}`
            : `${checkDigit} is less than 5, so round down: ${rounded.toLocaleString()}`,
        ],
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
            answer: `${w * h} m²`,
            steps: [
              `Soil covers the whole garden, so this asks for area: length × width`,
              `${w} × ${h} = ${w * h} m²`,
            ],
          }
        : {
            prompt: `A rug is ${w} ft by ${h} ft. How much trim goes around its edge?`,
            answer: `${2 * (w + h)} ft`,
            steps: [
              `Trim goes around the edge, so this asks for perimeter: 2 × (length + width)`,
              `${w} + ${h} = ${w + h}`,
              `2 × ${w + h} = ${2 * (w + h)} ft`,
            ],
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
      const m1 = den / d1;
      const m2 = den / d2;
      const sum = n1 * m1 + n2 * m2;
      const [rn, rd] = reduce(sum, den);
      const steps = [`Common denominator for ${d1} and ${d2}: ${den}`];
      if (m1 > 1) steps.push(`${n1}/${d1} = ${n1 * m1}/${den} (multiply top and bottom by ${m1})`);
      if (m2 > 1) steps.push(`${n2}/${d2} = ${n2 * m2}/${den} (multiply top and bottom by ${m2})`);
      steps.push(`Add the numerators: ${n1 * m1} + ${n2 * m2} = ${sum}, so ${sum}/${den}`);
      steps.push(...simplifyStep(sum, den));
      return {
        prompt: `${n1}/${d1} + ${n2}/${d2} =`,
        answer: fracStr(rn, rd),
        steps,
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
        steps: [
          `Line up the decimal points, then add as whole numbers: ${a} + ${b} = ${a + b}`,
          `Put the decimal point back, two places from the right: ${fromCents(a + b)}`,
        ],
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
        prompt: `${fromTenths(a)} × ${b} =`,
        answer: fromTenths(a * b),
        steps: [
          `Ignore the decimal point and multiply: ${a} × ${b} = ${a * b}`,
          `${fromTenths(a)} has one decimal place, so the answer does too: ${fromTenths(a * b)}`,
        ],
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
        return {
          prompt: `(${a} + ${b}) × ${c} =`,
          answer: (a + b) * c,
          steps: [
            `Brackets first: ${a} + ${b} = ${a + b}`,
            `Then multiply: ${a + b} × ${c} = ${(a + b) * c}`,
          ],
        };
      }
      return {
        prompt: `${a} + ${b} × ${c} =`,
        answer: a + b * c,
        steps: [
          `No brackets, so multiply before adding: ${b} × ${c} = ${b * c}`,
          `Then add: ${a} + ${b * c} = ${a + b * c}`,
        ],
      };
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
        answer: `${l * w * h} cm³`,
        steps: [
          `Volume = length × width × height`,
          `${l} × ${w} = ${l * w}`,
          `${l * w} × ${h} = ${l * w * h} cm³`,
        ],
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
        steps: [
          `First find how many apples there are: ${groups} × ${per} = ${groups * per}`,
          `Then take away the ones sold: ${groups * per} − ${taken} = ${per * groups - taken}`,
        ],
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
      return {
        prompt: `${a}:${b} = ${a * k}:____`,
        answer: b * k,
        steps: [
          `The first number went from ${a} to ${a * k}: ${a} × ${k} = ${a * k}`,
          `Scale the second number the same way: ${b} × ${k} = ${b * k}`,
        ],
      };
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
        steps: [
          `Miles per hour means miles ÷ hours`,
          `${rate * time} ÷ ${time} = ${rate}`,
        ],
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
      // Keep, change, flip: rn/rd × divisorD/divisorN reduces to an/ad.
      const pn = rn * divisorD;
      const pd = rd * divisorN;
      return {
        prompt: `${rn}/${rd} ÷ ${divisorN}/${divisorD} =`,
        answer: fracStr(an, ad),
        steps: [
          `Keep the first fraction, change ÷ to ×, flip the second: ${rn}/${rd} × ${divisorD}/${divisorN}`,
          `Multiply straight across: ${rn} × ${divisorD} = ${pn} on top, ${rd} × ${divisorN} = ${pd} on the bottom, so ${fracStr(pn, pd)}`,
          ...simplifyStep(pn, pd),
        ],
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
        steps: [
          `Divide as if there were no decimal point: ${dividendCents} ÷ ${divisor} = ${quotientCents}`,
          `Put the decimal point back in the same place, two from the right: ${fromCents(quotientCents)}`,
        ],
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
      return {
        prompt: `Evaluate ${a}n + ${b} when n = ${n}.`,
        answer: a * n + b,
        steps: [
          `Put ${n} in place of n: ${a} × ${n} + ${b}`,
          `Multiply first: ${a} × ${n} = ${a * n}`,
          `Then add: ${a * n} + ${b} = ${a * n + b}`,
        ],
      };
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
        return {
          prompt: `Solve: x + ${b} = ${x + b}`,
          answer: x,
          steps: [
            `Undo the + ${b} by subtracting ${b} from both sides`,
            `x = ${x + b} − ${b} = ${x}`,
          ],
        };
      }
      const b = rng.int(1, x - 1);
      return {
        prompt: `Solve: x − ${b} = ${x - b}`,
        answer: x,
        steps: [
          `Undo the − ${b} by adding ${b} to both sides`,
          `x = ${x - b} + ${b} = ${x}`,
        ],
      };
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
        steps: [
          `Area of a triangle = base × height ÷ 2`,
          `${base} × ${height} = ${base * height}`,
          `${base * height} ÷ 2 = ${area} cm²`,
        ],
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
      const sum = nums.reduce((s, n) => s + n, 0);
      return {
        prompt: `Find the mean of: ${nums.join(", ")}`,
        answer: mean,
        steps: [
          `Add them all up: ${nums.join(" + ")} = ${sum}`,
          `Divide by how many numbers there are: ${sum} ÷ ${count} = ${mean}`,
        ],
      };
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
      if (isAdd) {
        return { prompt: `${fmtSigned(a)} + ${fmtSigned(b)} =`, answer: a + b, steps: addIntSteps(a, b) };
      }
      return {
        prompt: `${fmtSigned(a)} − ${fmtSigned(b)} =`,
        answer: a - b,
        steps: [
          `Subtracting is adding the opposite: ${fmtSigned(a)} + ${fmtSigned(-b)}`,
          ...addIntSteps(a, -b),
        ],
      };
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
      const signRule = (p, q, result) =>
        (p > 0) === (q > 0)
          ? `Same signs, so the answer is positive: ${result}`
          : `Different signs, so the answer is negative: ${result}`;
      if (isMult) {
        const a = signA * rng.int(2, hi);
        const b = signB * rng.int(2, hi);
        return {
          prompt: `${fmtSigned(a)} × ${fmtSigned(b)} =`,
          answer: a * b,
          steps: [
            `Multiply the sizes: ${Math.abs(a)} × ${Math.abs(b)} = ${Math.abs(a * b)}`,
            signRule(a, b, a * b),
          ],
        };
      }
      const divisor = signB * rng.int(2, hi);
      const quotient = signA * rng.int(2, hi);
      const dividend = divisor * quotient;
      return {
        prompt: `${fmtSigned(dividend)} ÷ ${fmtSigned(divisor)} =`,
        answer: quotient,
        steps: [
          `Divide the sizes: ${Math.abs(dividend)} ÷ ${Math.abs(divisor)} = ${Math.abs(quotient)}`,
          signRule(dividend, divisor, quotient),
        ],
      };
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
      // The base must be a multiple of 100/gcd(percent, 100) for the
      // answer to be whole — 75% needs a multiple of 4, not of 100/75.
      const unit = 100 / gcd(percent, 100);
      const k = rng.int(2, RANGE(12, 20, 30)[d]);
      const base = k * unit;
      const m = (base * percent) / 100;
      return {
        prompt: `What is ${percent}% of ${base}?`,
        answer: m,
        steps: [
          `${percent}% means ${percent} out of 100, so multiply by ${percent} and divide by 100`,
          `${base} × ${percent} = ${base * percent}`,
          `${base * percent} ÷ 100 = ${m}`,
        ],
      };
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
      return {
        prompt: `Solve for n: ${a}/${b} = ${c}/n`,
        answer: b * k,
        steps: [
          `Cross-multiply: ${a} × n = ${b} × ${c}`,
          `${b} × ${c} = ${b * c}, so ${a}n = ${b * c}`,
          `Divide both sides by ${a}: n = ${b * c} ÷ ${a} = ${b * k}`,
        ],
      };
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
      return {
        prompt: `Solve: ${a}x + ${b} = ${a * x + b}`,
        answer: x,
        steps: [
          `Undo the + ${b} first: subtract ${b} from both sides, ${a * x + b} − ${b} = ${a * x}, so ${a}x = ${a * x}`,
          `Undo the × ${a}: divide both sides by ${a}, x = ${a * x} ÷ ${a} = ${x}`,
        ],
      };
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
        steps: [
          `Circumference = 2 × π × radius = 2 × 22/7 × ${r}`,
          `Divide by the 7 first: ${r} ÷ 7 = ${k}`,
          `2 × 22 × ${k} = ${44 * k} cm`,
        ],
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
        answer: fracStr(rn, rd),
        steps: [
          `Count all the marbles: ${red} + ${blue} = ${total}`,
          `Probability = red marbles ÷ all marbles = ${red}/${total}`,
          ...simplifyStep(red, total),
        ],
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
      return {
        prompt: `Simplify: x^${a} × x^${b} =`,
        answer: `x^${a + b}`,
        steps: [
          `Same base, so keep the base and add the exponents: ${a} + ${b} = ${a + b}`,
          `x^${a + b}`,
        ],
      };
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
        steps: [
          `Move the decimal point left until one digit is in front: ${digit}`,
          `It moved ${zeros} places, so that is the power of 10: ${digit} × 10^${zeros}`,
        ],
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
      const k = a - c;
      const kx = k === 1 ? "x" : `${k}x`;
      const steps = [`Get the x terms together: subtract ${c}x from both sides, ${kx} + ${b} = ${total}`];
      if (k === 1) {
        steps.push(`Subtract ${b} from both sides: x = ${total} − ${b} = ${x}`);
      } else {
        steps.push(`Subtract ${b} from both sides: ${k}x = ${total} − ${b} = ${k * x}`);
        steps.push(`Divide both sides by ${k}: x = ${k * x} ÷ ${k} = ${x}`);
      }
      return { prompt: `Solve: ${a}x + ${b} = ${c}x + ${total}`, answer: x, steps };
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
        steps: [
          `Slope = change in y ÷ change in x`,
          `Change in y: ${fmtSigned(y2)} − ${fmtSigned(y1)} = ${m * dx}`,
          `Change in x: ${fmtSigned(x2)} − ${fmtSigned(x1)} = ${dx}`,
          `Slope = ${fmtSigned(m * dx)} ÷ ${dx} = ${m}`,
        ],
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
        steps: [
          `a² + b² = c², so c² = ${a}² + ${b}²`,
          `${a}² = ${a * a} and ${b}² = ${b * b}, so c² = ${a * a} + ${b * b} = ${c * c}`,
          `c = √${c * c} = ${c}`,
        ],
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
      return {
        prompt: `A function is defined by f(x) = ${a}x + ${b}. What is f(${x})?`,
        answer: a * x + b,
        steps: [
          `f(${x}) means put ${x} in for x: ${a} × ${x} + ${b}`,
          `${a} × ${x} = ${a * x}`,
          `${a * x} + ${b} = ${a * x + b}`,
        ],
      };
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
      return {
        prompt: `Solve: ${a}x − ${b} = ${a * x - b}`,
        answer: x,
        steps: [
          `Undo the − ${b}: add ${b} to both sides, ${a}x = ${fmtSigned(a * x - b)} + ${b} = ${a * x}`,
          `Undo the × ${a}: divide both sides by ${a}, x = ${fmtSigned(a * x)} ÷ ${a} = ${x}`,
        ],
      };
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
      const answer = `(x ${sign1} ${Math.abs(r1)})(x ${sign2} ${Math.abs(r2)})`;
      // The two numbers in the brackets are −r1 and −r2: they multiply to c and add to b.
      const p = -r1;
      const q = -r2;
      return {
        prompt: `Factor: x²${bTerm}${cTerm} =`,
        answer,
        steps: [
          `Look for two numbers that multiply to ${c} and add to ${b}`,
          `${fmtSigned(p)} × ${fmtSigned(q)} = ${c} and ${fmtSigned(p)} + ${fmtSigned(q)} = ${b}, so use ${p} and ${q}`,
          `Factors: ${answer}`,
        ],
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
      const p = -r1;
      const q = -r2;
      const factored = `(x ${r1 >= 0 ? "−" : "+"} ${Math.abs(r1)})(x ${r2 >= 0 ? "−" : "+"} ${Math.abs(r2)})`;
      return {
        prompt: `Solve: x²${bTerm}${cTerm} = 0`,
        answer: `x = ${roots[0]}, ${roots[1]}`,
        steps: [
          `Look for two numbers that multiply to ${c} and add to ${b}: ${p} and ${q}`,
          `Factor: ${factored} = 0`,
          `A product is 0 when either bracket is 0, so x = ${roots[0]}, ${roots[1]}`,
        ],
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
      const answer = `${a}x ${bStr}`;
      const steps = subtract
        ? [
            `Subtracting the bracket flips both of its signs: ${a1}x + ${b1} − ${a2}x − ${b2}`,
            `x terms: ${a1} − ${a2} = ${a}`,
            `Plain numbers: ${b1} − ${b2} = ${b}`,
          ]
        : [
            `x terms: ${a1}x + ${a2}x, so ${a1} + ${a2} = ${a}`,
            `Plain numbers: ${b1} + ${b2} = ${b}`,
          ];
      steps.push(`Put them together: ${answer}`);
      return {
        prompt: `Simplify: (${a1}x + ${b1}) ${op} (${a2}x + ${b2}) =`,
        answer,
        steps,
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
      const answer = `x² ${bCoefStr} ${cCoefStr}`;
      return {
        prompt: `Multiply: (x ${aTerm})(x ${bTerm}) =`,
        answer,
        steps: [
          `FOIL — First: x × x = x²`,
          `Outer and Inner: ${fmtSigned(b)}x + ${fmtSigned(a)}x = ${bCoef}x`,
          `Last: ${fmtSigned(a)} × ${fmtSigned(b)} = ${cCoef}`,
          `Put them together: ${answer}`,
        ],
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
      const b = rng.int(-hi, hi);

      if (d === "hard") {
        // A fractional slope forces the point (rather than the
        // y-intercept) to actually be used — an integer slope lets a
        // student dodge the fraction arithmetic entirely.
        const den = rng.pick([2, 3, 4, 5]);
        let num = rng.int(1, hi);
        while (gcd(num, den) !== 1) num = rng.int(1, hi);
        if (rng.next() < 0.5) num = -num;
        const mLabel = `${num}/${den}`;
        const k = rng.int(-4, 4) || 1;
        const x1 = k * den;
        const y1 = num * k + b;
        const answer = `y = ${mLabel}x ${b >= 0 ? "+" : "−"} ${Math.abs(b)}`;
        return {
          prompt: `Write the equation of a line with a slope of ${mLabel} that passes through the point (${x1}, ${y1}).`,
          answer,
          steps: [
            `Start from y = mx + b and put in m = ${mLabel}, x = ${x1}, y = ${y1}: ${y1} = ${mLabel} × ${fmtSigned(x1)} + b`,
            `${mLabel} × ${fmtSigned(x1)} = ${num * k}, so b = ${fmtSigned(y1)} − ${fmtSigned(num * k)} = ${b}`,
            `Equation: ${answer}`,
          ],
        };
      }

      const m = rng.int(-hi, hi) || 1;
      const answer = `y = ${m}x ${b >= 0 ? "+" : "−"} ${Math.abs(b)}`;

      if (d === "medium") {
        // Same integer slope, but a point instead of the y-intercept —
        // b has to be solved for (b = y1 - m*x1), just without the
        // fraction arithmetic "hard" adds on top.
        const x1 = rng.int(-hi, hi) || 1;
        const y1 = m * x1 + b;
        return {
          prompt: `Write the equation of a line with a slope of ${m} that passes through the point (${x1}, ${y1}).`,
          answer,
          steps: [
            `Start from y = mx + b and put in m = ${m}, x = ${x1}, y = ${y1}: ${y1} = ${fmtSigned(m)} × ${fmtSigned(x1)} + b`,
            `${fmtSigned(m)} × ${fmtSigned(x1)} = ${m * x1}, so b = ${fmtSigned(y1)} − ${fmtSigned(m * x1)} = ${b}`,
            `Equation: ${answer}`,
          ],
        };
      }

      return {
        prompt: `Write the equation of a line with a slope of ${m} and a y-intercept of ${b}.`,
        answer,
        steps: [
          `Slope-intercept form is y = mx + b, where m is the slope and b is the y-intercept`,
          `m = ${m} and b = ${b}: ${answer}`,
        ],
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
        prompt: `Solve for x and y: x + y = ${sum} and x − y = ${diff}.`,
        answer: `x = ${x}, y = ${y}`,
        steps: [
          `Add the two equations so the y terms cancel: 2x = ${sum} + ${fmtSigned(diff)} = ${2 * x}`,
          `x = ${2 * x} ÷ 2 = ${x}`,
          `Put x back into x + y = ${sum}: y = ${sum} − ${x} = ${y}`,
          `So x = ${x}, y = ${y}`,
        ],
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
        steps: [
          `The three angles of a triangle add up to 180°`,
          `${a} + ${b} = ${a + b}`,
          `180 − ${a + b} = ${c}°`,
        ],
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
        steps: [
          `a² + b² = c², so the missing leg² = ${c}² − ${known}²`,
          `${c}² = ${c * c} and ${known}² = ${known * known}, so ${c * c} − ${known * known} = ${missing * missing}`,
          `Missing leg = √${missing * missing} = ${missing}`,
        ],
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
      return {
        prompt: `A circle has a radius of ${r} cm. What is its area, in terms of π?`,
        answer: `${r * r}π cm²`,
        steps: [`Area = π × r²`, `${r}² = ${r * r}, so the area is ${r * r}π cm²`],
      };
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
        steps: [
          `Find the scale factor from the shortest sides: ${s1 * k} ÷ ${s1} = ${k}`,
          `Similar triangles scale every side the same way, so longest side: ${s3} × ${k} = ${s3 * k}`,
        ],
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
        steps: [
          `Volume = π × r² × h`,
          `${r}² = ${r * r}`,
          `${r * r} × ${h} = ${r * r * h}, so the volume is ${r * r * h}π cm³`,
        ],
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
        steps: [
          `Change in x: ${fmtSigned(x1)} − ${fmtSigned(x0)} = ${signX * a}, a distance of ${a}`,
          `Change in y: ${fmtSigned(y1)} − ${fmtSigned(y0)} = ${signY * b}, a distance of ${b}`,
          `Distance² = ${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}`,
          `Distance = √${c * c} = ${c}`,
        ],
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
        steps: [`"More ducks join" means add: ${a} + ${b} = ${a + b}`],
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
          steps: [`"More birds land" means add: ${a} + ${b} = ${a + b}`],
        };
      }
      const a = rng.int(2, hi);
      const b = rng.int(1, a - 1);
      return {
        prompt: `There are ${a} apples in a basket. ${b} are eaten. How many apples are left?`,
        answer: a - b,
        steps: [`"Are eaten" means take away: ${a} − ${b} = ${a - b}`],
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
      return {
        prompt: `A shape is split into ${n} equal shares. What is each share called?`,
        answer: `a ${name}`,
        steps: [`${n} equal shares means each share is 1 out of ${n}: a ${name}`],
      };
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
      return {
        prompt: `A shape has ${angles} angles. What is it called?`,
        answer: name,
        steps: [`A shape has as many sides as angles, so this one has ${angles} sides: ${name}`],
      };
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
      return {
        prompt: `A shape is split into ${n} equal shares. What is each share called?`,
        answer: `a ${name}`,
        steps: [`${n} equal shares means each share is 1 out of ${n}: a ${name}`],
      };
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
        steps: [
          `Angles along a straight line add up to 180°`,
          `180 − ${a} = ${180 - a}°`,
        ],
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
      const g = gcd(a, b);
      if (rng.next() < 0.5) {
        const factors = (n) => {
          const out = [];
          for (let f = 1; f <= n; f += 1) if (n % f === 0) out.push(f);
          return out;
        };
        return {
          prompt: `What is the GCF of ${a} and ${b}?`,
          answer: g,
          steps: [
            `Factors of ${a}: ${factors(a).join(", ")}`,
            `Factors of ${b}: ${factors(b).join(", ")}`,
            `The biggest number in both lists: ${g}`,
          ],
        };
      }
      return {
        prompt: `What is the LCM of ${a} and ${b}?`,
        answer: (a * b) / g,
        steps: [
          `First find the GCF of ${a} and ${b}: ${g}`,
          `LCM = ${a} × ${b} ÷ GCF`,
          `${a} × ${b} = ${a * b}`,
          `${a * b} ÷ ${g} = ${(a * b) / g}`,
        ],
      };
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
      const m = 100 / den;
      return {
        prompt: `Write ${n}/${den} as a decimal.`,
        answer: fromCents(h),
        steps: [
          ...(m === 1
            ? [`${n}/100 is already out of 100`]
            : [`Make the denominator 100: multiply top and bottom by ${m}, ${n}/${den} = ${h}/100`]),
          `${h} hundredths written as a decimal: ${fromCents(h)}`,
        ],
      };
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
        steps: [
          `Total = fee + rate × days`,
          `Daily part: ${rate} × ${x} = ${rate * x}`,
          `Add the fee: ${fee} + ${rate * x} = ${fee + rate * x}, so $${fee + rate * x}`,
        ],
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
      return {
        prompt: `Simplify: √${n}`,
        answer: `${k}·√${m}`,
        steps: [
          `Find the biggest perfect square that divides ${n}: ${k * k}, since ${k * k} × ${m} = ${n}`,
          `√${n} = √${k * k} × √${m}, and √${k * k} = ${k}, so ${k}·√${m}`,
        ],
      };
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
      return {
        prompt: `A number increased by ${b} is ${x + b}. What is the number?`,
        answer: x,
        steps: [
          `"A number increased by ${b}" means x + ${b}, so x + ${b} = ${x + b}`,
          `Subtract ${b} from both sides: x = ${fmtSigned(x + b)} − ${b} = ${x}`,
        ],
      };
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
      return {
        prompt: `Solve: x/${den} + ${b} = ${q + b}`,
        answer: x,
        steps: [
          `Subtract ${b} from both sides: x/${den} = ${q + b} − ${b} = ${q}`,
          `Multiply both sides by ${den}: x = ${q} × ${den} = ${x}`,
        ],
      };
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
      const answer = `(${hTerm})² + (${kTerm})² = ${r * r}`;
      const steps = [
        `Standard form: (x − h)² + (y − k)² = r², with center (h, k)`,
        `h = ${h} and k = ${k}, so the brackets are (${hTerm}) and (${kTerm})${h < 0 || k < 0 ? " — subtracting a negative turns into a plus" : ""}`,
        `r² = ${r}² = ${r * r}`,
        `Equation: ${answer}`,
      ];
      return {
        prompt: `Write the equation of a circle with center (${h}, ${k}) and radius ${r}.`,
        answer,
        steps,
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
        steps: [
          `Area of the room: ${l} × ${w} = ${l * w} square feet`,
          `Cost = area × price per square foot: ${l * w} × $${fromCents(priceCents)} = $${fromCents(totalCents)}`,
        ],
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
  const difficulties = Array.isArray(difficulty) && difficulty.length ? difficulty : [difficulty];

  const seen = new Set();
  const out = [];
  let attempts = 0;

  while (out.length < count && attempts < count * 30) {
    const skill = chosen[out.length % chosen.length];
    const d = difficulties[out.length % difficulties.length];
    const q = skill.gen(rng, d);
    attempts += 1;
    if (seen.has(q.prompt)) continue;
    seen.add(q.prompt);
    out.push({ ...q, cat: skill.cat, skillId: skill.id, difficulty: d });
  }
  return out;
}

/* Replace a single question in place, leaving the rest untouched. Keeps
   the question's own assigned difficulty, so redoing one question in a
   mixed-difficulty sheet can't silently change how hard it is. */
export function regenerateOne(sheet, index, seed) {
  const target = sheet[index];
  const skill = skillById(target.skillId);
  if (!skill) return sheet;
  const rng = makeRng(seed);
  const existing = new Set(sheet.map((q, i) => (i === index ? null : q.prompt)));
  for (let i = 0; i < 40; i += 1) {
    const q = skill.gen(rng, target.difficulty);
    if (existing.has(q.prompt)) continue;
    const next = sheet.slice();
    next[index] = { ...q, cat: skill.cat, skillId: skill.id, difficulty: target.difficulty };
    return next;
  }
  return sheet;
}

/* Same questions, new order — for handing neighbouring students different
   copies of one worksheet. Each answer travels with its question object,
   so the key stays right by construction. Always opens with a different
   question than before, so the change is visible at a glance. */
export function reorderSheet(sheet, seed) {
  const rng = makeRng(seed);
  const order = sheet.slice();
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = rng.int(0, i);
    [order[i], order[j]] = [order[j], order[i]];
  }
  if (order.length > 1 && order[0] === sheet[0]) {
    const k = rng.int(1, order.length - 1);
    [order[0], order[k]] = [order[k], order[0]];
  }
  return order;
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
