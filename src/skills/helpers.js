/* Shared helpers for the skill files in this folder — number formatting,
   fraction reduction, and the step-writing helpers several grades reuse.
   Everything here is pure; nothing touches the RNG. See ../generators.js
   for the rules every generator follows. */

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

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

const RANGE = (easy, medium, hard) => ({ easy, medium, hard });

/* Mixed number "2 3/4" from an improper num/den; whole numbers stay whole. */
const mixedStr = (num, den) => {
  const [n, d] = reduce(num, den);
  const whole = Math.floor(n / d);
  const rest = n % d;
  if (rest === 0) return `${whole}`;
  return whole === 0 ? `${rest}/${d}` : `${whole} ${rest}/${d}`;
};

/* "3x² − 5x + 2" from coefficients, highest power first. Zero terms drop
   out; a lone leading 1 is written as "x", not "1x". */
const POWERS = ["", "", "²", "³"];
const polyStr = (coefs) => {
  const deg = coefs.length - 1;
  const parts = [];
  coefs.forEach((c, i) => {
    if (c === 0) return;
    const power = deg - i;
    const mag = Math.abs(c);
    const body = power === 0 ? `${mag}` : `${mag === 1 ? "" : mag}x${POWERS[power]}`;
    parts.push({ neg: c < 0, body });
  });
  if (!parts.length) return "0";
  return parts
    .map((t, i) => (i === 0 ? (t.neg ? `−${t.body}` : t.body) : `${t.neg ? "−" : "+"} ${t.body}`))
    .join(" ");
};

/* "3:35" from an hour and minutes, minutes zero-padded. */
const clock = (h, m) => `${h}:${String(m).padStart(2, "0")}`;

/* Money from integer cents: "$4.50" */
const dollars = (cents) => `$${fromCents(cents)}`;

export {
  PLACE_NAMES,
  POWERS,
  RANGE,
  addByPlaceSteps,
  addIntSteps,
  clock,
  countBackSteps,
  countOnSteps,
  dollars,
  fmtSigned,
  fracStr,
  fromCents,
  fromTenths,
  gcd,
  mixedStr,
  placeParts,
  polyStr,
  reduce,
  simplifyStep,
  subtractByPlaceSteps,
};
