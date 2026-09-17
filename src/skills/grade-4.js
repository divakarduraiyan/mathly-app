/* Grade 4 skills. Each entry follows the rules in ../generators.js:
   the answer (and every step) comes from the numbers the generator
   already holds, problems are built backwards, no floats, seeded RNG. */

import { RANGE, fracStr, fromCents, fromTenths, gcd, mixedStr, reduce, simplifyStep } from "./helpers.js";

export default [
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
  {
    id: "add-multidigit",
    name: "Adding multi-digit numbers",
    hint: "With regrouping",
    ccss: "4.NBT.B.4",
    grade: 4,
    cat: "number",
    space: 5000,
    gen(rng, d) {
      const hi = RANGE(9999, 49999, 99999)[d];
      const a = rng.int(1000, hi);
      const b = rng.int(1000, hi);
      return {
        prompt: `${a.toLocaleString()} + ${b.toLocaleString()} =`,
        answer: (a + b).toLocaleString(),
        steps: [
          `Line up the digits by place value and add from the right, carrying when a column passes 9`,
          `${a.toLocaleString()} + ${b.toLocaleString()} = ${(a + b).toLocaleString()}`,
        ],
      };
    },
  },
  {
    id: "sub-multidigit",
    name: "Subtracting multi-digit numbers",
    hint: "With regrouping",
    ccss: "4.NBT.B.4",
    grade: 4,
    cat: "number",
    space: 5000,
    gen(rng, d) {
      const hi = RANGE(9999, 49999, 99999)[d];
      const a = rng.int(2000, hi);
      const b = rng.int(1000, a - 1);
      return {
        prompt: `${a.toLocaleString()} − ${b.toLocaleString()} =`,
        answer: (a - b).toLocaleString(),
        steps: [
          `Line up the digits and subtract from the right, borrowing from the next place when the top digit is smaller`,
          `${a.toLocaleString()} − ${b.toLocaleString()} = ${(a - b).toLocaleString()}`,
        ],
      };
    },
  },
  {
    id: "compare-multidigit",
    name: "Comparing large numbers",
    hint: "Up to six digits",
    ccss: "4.NBT.A.2",
    grade: 4,
    cat: "number",
    space: 5000,
    gen(rng, d) {
      const hi = RANGE(9999, 99999, 999999)[d];
      const a = rng.int(1000, hi);
      // Usually share the leading digits so the comparison takes some care.
      const shareUpTo = 10 ** rng.int(1, String(a).length - 1);
      let b = a - (a % shareUpTo) + rng.int(0, shareUpTo - 1);
      if (b === a) b = a - (a % shareUpTo) + (((a % shareUpTo) + 1) % shareUpTo);
      const sign = a > b ? ">" : "<";
      const sa = String(a);
      const sb = String(b);
      let i = 0;
      while (sa[i] === sb[i]) i += 1;
      const placeName = ["", "ones", "tens", "hundreds", "thousands", "ten-thousands", "hundred-thousands"][sa.length - i];
      return {
        prompt: `${a.toLocaleString()} ____ ${b.toLocaleString()}`,
        answer: sign,
        steps: [
          `Same number of digits, so compare from the left; the first difference is in the ${placeName} place: ${sa[i]} and ${sb[i]}`,
          `${Math.max(a, b).toLocaleString()} is bigger, so the sign is ${sign}`,
        ],
      };
    },
  },
  {
    id: "expanded-form-multidigit",
    name: "Expanded form of large numbers",
    hint: "Thousands and beyond",
    ccss: "4.NBT.A.2",
    grade: 4,
    cat: "number",
    space: 5000,
    gen(rng, d) {
      const hi = RANGE(9999, 99999, 999999)[d];
      const n = rng.int(1001, hi);
      const digits = String(n).split("").map(Number);
      const parts = digits
        .map((dg, i) => dg * 10 ** (digits.length - 1 - i))
        .filter((x) => x > 0)
        .map((x) => x.toLocaleString());
      return {
        prompt: `Write ${n.toLocaleString()} in expanded form.`,
        answer: parts.join(" + "),
        steps: [
          `Give each digit its place value, skipping zeros`,
          parts.join(" + "),
        ],
      };
    },
  },
  {
    id: "factors-of",
    name: "Listing factors",
    hint: "All the numbers that divide evenly",
    ccss: "4.OA.B.4",
    grade: 4,
    cat: "number",
    space: 90,
    gen(rng, d) {
      const n = rng.int(RANGE(6, 12, 30)[d], RANGE(24, 50, 100)[d]);
      const factors = [];
      for (let f = 1; f <= n; f += 1) if (n % f === 0) factors.push(f);
      const pairs = [];
      for (const f of factors) if (f * f <= n) pairs.push(`${f} × ${n / f}`);
      return {
        prompt: `List all the factors of ${n}.`,
        answer: factors.join(", "),
        steps: [
          `Find the pairs that multiply to ${n}: ${pairs.join(", ")}`,
          `Every number in a pair is a factor: ${factors.join(", ")}`,
        ],
      };
    },
  },
  {
    id: "prime-composite",
    name: "Prime or composite",
    hint: "Exactly two factors, or more",
    ccss: "4.OA.B.4",
    grade: 4,
    cat: "number",
    space: 98,
    gen(rng, d) {
      const n = rng.int(2, RANGE(20, 50, 100)[d]);
      let smallest = 0;
      for (let f = 2; f * f <= n; f += 1) if (n % f === 0) { smallest = f; break; }
      const prime = smallest === 0;
      return {
        prompt: `Is ${n} prime or composite?`,
        answer: prime ? "prime" : "composite",
        steps: prime
          ? [n < 4 ? `The only factors of ${n} are 1 and ${n}` : `Nothing from 2 to ${Math.floor(Math.sqrt(n))} divides ${n}, so its only factors are 1 and ${n}`, `Exactly two factors: prime`]
          : [`${smallest} divides ${n}: ${smallest} × ${n / smallest} = ${n}`, `More than two factors: composite`],
      };
    },
  },
  {
    id: "div-remainder",
    name: "Division with remainders",
    hint: "Quotient R remainder",
    ccss: "4.NBT.B.6",
    grade: 4,
    cat: "number",
    space: 2000,
    gen(rng, d) {
      const divisor = rng.int(2, RANGE(6, 9, 12)[d]);
      const quotient = rng.int(RANGE(3, 6, 11)[d], RANGE(12, 30, 99)[d]);
      const r = rng.int(1, divisor - 1);
      const dividend = divisor * quotient + r;
      return {
        prompt: `${dividend} ÷ ${divisor} =`,
        answer: `${quotient} R ${r}`,
        steps: [
          `${divisor} goes into ${dividend} ${quotient} times: ${divisor} × ${quotient} = ${divisor * quotient}`,
          `What is left over: ${dividend} − ${divisor * quotient} = ${r}`,
          `Answer: ${quotient} R ${r}`,
        ],
      };
    },
  },
  {
    id: "div-4digit-1digit",
    name: "Dividing larger numbers",
    hint: "Up to four digits, no remainder",
    ccss: "4.NBT.B.6",
    grade: 4,
    cat: "number",
    space: 5000,
    gen(rng, d) {
      const divisor = rng.int(2, RANGE(5, 9, 9)[d]);
      const quotient = rng.int(RANGE(100, 200, 500)[d], RANGE(300, 999, 1999)[d]);
      const dividend = divisor * quotient;
      const hundreds = quotient - (quotient % 100);
      const tens = quotient % 100 - (quotient % 10);
      const ones = quotient % 10;
      const steps = [`Break the quotient into parts: ${divisor} × ${hundreds} = ${divisor * hundreds}`];
      let left = dividend - divisor * hundreds;
      steps.push(`${dividend.toLocaleString()} − ${(divisor * hundreds).toLocaleString()} = ${left.toLocaleString()} still to divide`);
      if (tens) {
        steps.push(`${divisor} × ${tens} = ${divisor * tens}, leaving ${left} − ${divisor * tens} = ${left - divisor * tens}`);
        left -= divisor * tens;
      }
      if (ones) steps.push(`${divisor} × ${ones} = ${divisor * ones}, and ${left} − ${divisor * ones} = 0`);
      steps.push(`Quotient: ${[hundreds, tens, ones].filter(Boolean).join(" + ")} = ${quotient}`);
      return {
        prompt: `${dividend.toLocaleString()} ÷ ${divisor} =`,
        answer: quotient,
        steps: steps.slice(0, 6),
      };
    },
  },
  {
    id: "multiplicative-comparison",
    name: "Times as many",
    hint: "Multiplicative comparison",
    ccss: "4.OA.A.1",
    grade: 4,
    cat: "word",
    space: 500,
    gen(rng, d) {
      const hi = RANGE(6, 9, 12)[d];
      const base = rng.int(2, RANGE(9, 15, 25)[d]);
      const k = rng.int(2, hi);
      const [a, b, unit] = rng.pick([["A rope", "Another rope", "ft"], ["A puppy", "Its mother", "kg"], ["A bookshelf", "A wall", "in"], ["A small tank", "A big tank", "L"]]);
      return {
        prompt: `${a} is ${base} ${unit}. ${b} is ${k} times as ${unit === "kg" ? "heavy" : "long"}. How ${unit === "kg" ? "heavy" : "long"} is ${b.toLowerCase()}?`,
        answer: `${base * k} ${unit}`,
        steps: [`"${k} times as" means multiply: ${k} × ${base} = ${base * k} ${unit}`],
      };
    },
  },
  {
    id: "compare-fractions-4",
    name: "Comparing fractions, unlike denominators",
    hint: "Use a common denominator",
    ccss: "4.NF.A.2",
    grade: 4,
    cat: "fraction",
    space: 200,
    gen(rng, d) {
      const pairs = RANGE([[2, 4], [3, 6], [2, 6], [4, 8]], [[2, 3], [3, 4], [4, 6], [5, 10], [3, 8]], [[3, 5], [4, 7], [5, 6], [7, 8], [6, 9]])[d];
      const [d1, d2] = rng.pick(pairs);
      const n1 = rng.int(1, d1 - 1);
      let n2 = rng.int(1, d2 - 1);
      const den = (d1 * d2) / gcd(d1, d2);
      const c1 = n1 * (den / d1);
      let c2 = n2 * (den / d2);
      if (c1 === c2) {
        n2 = n2 === d2 - 1 ? n2 - 1 : n2 + 1;
        c2 = n2 * (den / d2);
      }
      const sign = c1 > c2 ? ">" : "<";
      return {
        prompt: `${n1}/${d1} ____ ${n2}/${d2}`,
        answer: sign,
        steps: [
          `Common denominator: ${den}`,
          `${n1}/${d1} = ${c1}/${den} and ${n2}/${d2} = ${c2}/${den}`,
          `${Math.max(c1, c2)} pieces is more than ${Math.min(c1, c2)}, so the sign is ${sign}`,
        ],
      };
    },
  },
  {
    id: "frac-sub-like",
    name: "Subtract fractions, like denominators",
    hint: "Answers reduced",
    ccss: "4.NF.B.3",
    grade: 4,
    cat: "fraction",
    space: 144,
    gen(rng, d) {
      const den = rng.pick(RANGE([4, 5, 6], [4, 5, 6, 8, 10], [6, 8, 9, 10, 12])[d]);
      const n1 = rng.int(2, den - 1);
      const n2 = rng.int(1, n1 - 1);
      const [rn, rd] = reduce(n1 - n2, den);
      return {
        prompt: `${n1}/${den} − ${n2}/${den} =`,
        answer: fracStr(rn, rd),
        steps: [
          `Same denominator, so subtract the numerators: ${n1} − ${n2} = ${n1 - n2}`,
          `Keep the denominator: ${n1 - n2}/${den}`,
          ...simplifyStep(n1 - n2, den),
        ],
      };
    },
  },
  {
    id: "mixed-improper",
    name: "Mixed numbers and improper fractions",
    hint: "Convert both ways",
    ccss: "4.NF.B.3.B",
    grade: 4,
    cat: "fraction",
    space: 200,
    gen(rng, d) {
      const den = rng.pick(RANGE([2, 3, 4], [2, 3, 4, 5, 6], [3, 4, 5, 6, 8])[d]);
      const whole = rng.int(1, RANGE(3, 5, 9)[d]);
      const num = rng.int(1, den - 1);
      const improper = whole * den + num;
      const toImproper = rng.next() < 0.5;
      return toImproper
        ? {
            prompt: `Write ${whole} ${num}/${den} as an improper fraction.`,
            answer: `${improper}/${den}`,
            steps: [
              `Each whole is ${den}/${den}, so ${whole} wholes: ${whole} × ${den} = ${whole * den}`,
              `Add the extra ${num}: ${whole * den} + ${num} = ${improper}`,
              `Keep the denominator: ${improper}/${den}`,
            ],
          }
        : {
            prompt: `Write ${improper}/${den} as a mixed number.`,
            answer: `${whole} ${num}/${den}`,
            steps: [
              `How many wholes? ${den} goes into ${improper} ${whole} times: ${den} × ${whole} = ${whole * den}`,
              `Left over: ${improper} − ${whole * den} = ${num}`,
              `Mixed number: ${whole} ${num}/${den}`,
            ],
          };
    },
  },
  {
    id: "frac-times-whole",
    name: "Multiply a fraction by a whole number",
    hint: "Answers as mixed numbers",
    ccss: "4.NF.B.4",
    grade: 4,
    cat: "fraction",
    space: 300,
    gen(rng, d) {
      const den = rng.pick(RANGE([2, 3, 4], [3, 4, 5, 6], [4, 5, 6, 8])[d]);
      const num = rng.int(1, den - 1);
      const k = rng.int(2, RANGE(4, 6, 9)[d]);
      const product = num * k;
      const whole = Math.floor(product / den);
      const rem = product % den;
      const steps = [
        `Multiply the numerator by the whole number: ${k} × ${num} = ${product}`,
        `Keep the denominator: ${product}/${den}`,
      ];
      if (whole === 0) steps.push(...simplifyStep(product, den));
      else if (rem === 0) steps.push(`${den} goes into ${product} exactly ${whole} times: ${whole}`);
      else {
        steps.push(`${den} goes into ${product} ${whole} times with ${rem} left: ${whole} ${rem}/${den}`);
        const [rn, rd] = reduce(rem, den);
        if (rn !== rem) steps.push(`Simplify the fraction part: ${whole} ${rn}/${rd}`);
      }
      return { prompt: `${k} × ${num}/${den} =`, answer: mixedStr(product, den), steps };
    },
  },
  {
    id: "decimal-fraction-conversion",
    name: "Decimals and fractions",
    hint: "Tenths and hundredths",
    ccss: "4.NF.C.6",
    grade: 4,
    cat: "fraction",
    space: 180,
    gen(rng, d) {
      const hundredths = d !== "easy" && rng.next() < 0.6;
      const den = hundredths ? 100 : 10;
      const n = hundredths ? rng.int(1, 99) : rng.int(1, 9);
      const decimal = hundredths ? fromCents(n) : fromTenths(n);
      const toDecimal = rng.next() < 0.5;
      return toDecimal
        ? {
            prompt: `Write ${n}/${den} as a decimal.`,
            answer: decimal,
            steps: [`${n} ${hundredths ? "hundredths" : "tenths"} is ${decimal}`],
          }
        : {
            prompt: `Write ${decimal} as a fraction.`,
            answer: `${n}/${den}`,
            steps: [`${decimal} is ${n} ${hundredths ? "hundredths" : "tenths"}: ${n}/${den}`],
          };
    },
  },
  {
    id: "compare-decimals-4",
    name: "Comparing decimals",
    hint: "Tenths and hundredths",
    ccss: "4.NF.C.7",
    grade: 4,
    cat: "fraction",
    space: 2000,
    gen(rng, d) {
      const hi = RANGE(50, 99, 99)[d];
      let a = rng.int(1, hi);
      let b = rng.int(1, hi);
      if (a === b) b = b === hi ? b - 1 : b + 1;
      // Easy sheets show one number as tenths so the "0.4 vs 0.35" trap comes up.
      const showTenths = (x) => x % 10 === 0 && rng.next() < 0.7;
      const sa = showTenths(a) ? fromTenths(a / 10) : fromCents(a);
      const sb = showTenths(b) ? fromTenths(b / 10) : fromCents(b);
      const sign = a > b ? ">" : "<";
      return {
        prompt: `${sa} ____ ${sb}`,
        answer: sign,
        steps: [
          `Write both as hundredths: ${fromCents(a)} and ${fromCents(b)}, that is ${a} and ${b} hundredths`,
          `${Math.max(a, b)} hundredths is more, so the sign is ${sign}`,
        ],
      };
    },
  },
  {
    id: "unit-conversion-4",
    name: "Converting units",
    hint: "Larger unit to smaller unit",
    ccss: "4.MD.A.1",
    grade: 4,
    cat: "geometry",
    space: 400,
    gen(rng, d) {
      const table = RANGE(
        [["m", "cm", 100], ["km", "m", 1000], ["hours", "minutes", 60], ["ft", "in", 12]],
        [["m", "cm", 100], ["km", "m", 1000], ["kg", "g", 1000], ["L", "mL", 1000], ["hours", "minutes", 60], ["ft", "in", 12], ["yd", "ft", 3]],
        [["km", "m", 1000], ["kg", "g", 1000], ["L", "mL", 1000], ["hours", "minutes", 60], ["minutes", "seconds", 60], ["yd", "in", 36], ["lb", "oz", 16], ["days", "hours", 24]]
      )[d];
      const [big, small, k] = rng.pick(table);
      const n = rng.int(2, RANGE(9, 12, 25)[d]);
      return {
        prompt: `${n} ${big} = ____ ${small}`,
        answer: n * k,
        steps: [`1 ${big.replace(/s$/, "")} is ${k} ${small}, so multiply: ${n} × ${k} = ${n * k}`],
      };
    },
  },
  {
    id: "number-pattern",
    name: "Number patterns",
    hint: "Follow the rule",
    ccss: "4.OA.C.5",
    grade: 4,
    cat: "number",
    space: 1000,
    gen(rng, d) {
      const step = rng.int(2, RANGE(5, 9, 12)[d]);
      const start = rng.int(1, RANGE(10, 20, 50)[d]);
      const mult = d === "hard" && rng.next() < 0.4;
      if (mult) {
        const m = rng.pick([2, 3]);
        const s0 = rng.int(1, 5);
        const seq = [s0, s0 * m, s0 * m * m];
        return {
          prompt: `Rule: multiply by ${m}. ${seq.join(", ")}, ____`,
          answer: s0 * m * m * m,
          steps: [`Apply the rule to the last number: ${seq[2]} × ${m} = ${s0 * m * m * m}`],
        };
      }
      const seq = [start, start + step, start + 2 * step];
      return {
        prompt: `Rule: add ${step}. ${seq.join(", ")}, ____`,
        answer: start + 3 * step,
        steps: [`Apply the rule to the last number: ${seq[2]} + ${step} = ${start + 3 * step}`],
      };
    },
  },
  {
    id: "multiply-by-10-100",
    name: "Multiplying by 10, 100 and 1000",
    hint: "Shift the digits",
    ccss: "4.NBT.A.1",
    grade: 4,
    cat: "number",
    space: 300,
    gen(rng, d) {
      const k = rng.pick(RANGE([10], [10, 100], [10, 100, 1000])[d]);
      const n = rng.int(RANGE(2, 11, 12)[d], RANGE(99, 99, 999)[d]);
      const zeros = String(k).length - 1;
      return {
        prompt: `${n} × ${k.toLocaleString()} =`,
        answer: (n * k).toLocaleString(),
        steps: [`Multiplying by ${k.toLocaleString()} moves every digit ${zeros} place${zeros > 1 ? "s" : ""} left, so write ${zeros} zero${zeros > 1 ? "s" : ""} after ${n}: ${(n * k).toLocaleString()}`],
      };
    },
  },
];
