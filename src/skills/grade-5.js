/* Grade 5 skills. Each entry follows the rules in ../generators.js:
   the answer (and every step) comes from the numbers the generator
   already holds, problems are built backwards, no floats, seeded RNG. */

import { RANGE, fracStr, fromCents, fromTenths, gcd, mixedStr, reduce, simplifyStep } from "./helpers.js";

export default [
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
  {
    id: "frac-sub-unlike",
    name: "Subtract fractions, unlike denominators",
    hint: "Find a common denominator",
    ccss: "5.NF.A.1",
    grade: 5,
    cat: "fraction",
    space: 400,
    gen(rng, d) {
      const pairs = RANGE([[2, 4], [3, 6], [2, 6]], [[2, 3], [3, 4], [4, 6], [5, 10], [3, 8]], [[3, 5], [4, 7], [5, 6], [7, 8], [6, 9]])[d];
      let [d1, d2] = rng.pick(pairs);
      const den = (d1 * d2) / gcd(d1, d2);
      let m1 = den / d1;
      let m2 = den / d2;
      // The first fraction is always the bigger one, so the answer stays positive.
      let n1 = rng.int(1, d1 - 1);
      let n2 = rng.int(1, d2 - 1);
      if (n1 * m1 === n2 * m2) {
        n1 = d1 - 1;
        n2 = 1;
      }
      if (n1 * m1 < n2 * m2) {
        [n1, n2] = [n2, n1];
        [d1, d2] = [d2, d1];
        [m1, m2] = [m2, m1];
      }
      const diff = n1 * m1 - n2 * m2;
      const [rn, rd] = reduce(diff, den);
      const steps = [`Common denominator for ${d1} and ${d2}: ${den}`];
      if (m1 > 1) steps.push(`${n1}/${d1} = ${n1 * m1}/${den}`);
      if (m2 > 1) steps.push(`${n2}/${d2} = ${n2 * m2}/${den}`);
      steps.push(`Subtract the numerators: ${n1 * m1} − ${n2 * m2} = ${diff}, so ${diff}/${den}`);
      steps.push(...simplifyStep(diff, den));
      return { prompt: `${n1}/${d1} − ${n2}/${d2} =`, answer: fracStr(rn, rd), steps };
    },
  },
  {
    id: "frac-mult",
    name: "Multiplying fractions",
    hint: "Top times top, bottom times bottom",
    ccss: "5.NF.B.4",
    grade: 5,
    cat: "fraction",
    space: 400,
    gen(rng, d) {
      const dens = RANGE([2, 3, 4], [3, 4, 5, 6], [4, 5, 6, 8, 9])[d];
      const d1 = rng.pick(dens);
      const d2 = rng.pick(dens);
      const n1 = rng.int(1, d1 - 1);
      const n2 = rng.int(1, d2 - 1);
      const [rn, rd] = reduce(n1 * n2, d1 * d2);
      return {
        prompt: `${n1}/${d1} × ${n2}/${d2} =`,
        answer: fracStr(rn, rd),
        steps: [
          `Multiply the tops: ${n1} × ${n2} = ${n1 * n2}`,
          `Multiply the bottoms: ${d1} × ${d2} = ${d1 * d2}, so ${n1 * n2}/${d1 * d2}`,
          ...simplifyStep(n1 * n2, d1 * d2),
        ],
      };
    },
  },
  {
    id: "unit-frac-div-whole",
    name: "Dividing with unit fractions",
    hint: "1/3 ÷ 4 and 4 ÷ 1/3",
    ccss: "5.NF.B.7",
    grade: 5,
    cat: "fraction",
    space: 120,
    gen(rng, d) {
      const den = rng.int(2, RANGE(5, 8, 12)[d]);
      const k = rng.int(2, RANGE(5, 8, 12)[d]);
      const fracFirst = rng.next() < 0.5;
      return fracFirst
        ? {
            prompt: `1/${den} ÷ ${k} =`,
            answer: `1/${den * k}`,
            steps: [
              `Splitting 1/${den} into ${k} equal pieces makes each piece ${k} times smaller`,
              `${den} × ${k} = ${den * k}, so each piece is 1/${den * k}`,
            ],
          }
        : {
            prompt: `${k} ÷ 1/${den} =`,
            answer: k * den,
            steps: [
              `Ask: how many ${den}ths fit in ${k} wholes? Each whole holds ${den} of them`,
              `${k} × ${den} = ${k * den}`,
            ],
          };
    },
  },
  {
    id: "mixed-add-sub",
    name: "Adding and subtracting mixed numbers",
    hint: "Like denominators",
    ccss: "5.NF.A.1",
    grade: 5,
    cat: "fraction",
    space: 900,
    gen(rng, d) {
      const den = rng.pick(RANGE([2, 4], [3, 4, 5, 6], [4, 6, 8, 10])[d]);
      const w1 = rng.int(1, RANGE(3, 5, 9)[d]);
      const w2 = rng.int(1, w1);
      let n1 = rng.int(1, den - 1);
      let n2 = rng.int(1, den - 1);
      // Same wholes: make the first fraction the bigger one so a − b stays positive.
      if (w1 === w2 && n1 <= n2) {
        [n1, n2] = [n2, n1];
        if (n1 === n2) n1 < den - 1 ? (n1 += 1) : (n2 -= 1);
      }
      const add = rng.next() < 0.5;
      const a = w1 * den + n1;
      const b = w2 * den + n2;
      if (add) {
        const sum = a + b;
        const steps = [
          `Add the wholes: ${w1} + ${w2} = ${w1 + w2}`,
          `Add the fractions: ${n1}/${den} + ${n2}/${den} = ${n1 + n2}/${den}`,
        ];
        if (n1 + n2 >= den) steps.push(`${n1 + n2}/${den} is more than a whole: ${n1 + n2}/${den} = 1 ${n1 + n2 - den}/${den}, so add 1 more whole`);
        steps.push(`Together: ${mixedStr(sum, den)}`);
        return { prompt: `${w1} ${n1}/${den} + ${w2} ${n2}/${den} =`, answer: mixedStr(sum, den), steps };
      }
      const diff = a - b;
      const steps = [];
      if (n1 >= n2) {
        steps.push(`Subtract the wholes: ${w1} − ${w2} = ${w1 - w2}`);
        steps.push(`Subtract the fractions: ${n1}/${den} − ${n2}/${den} = ${n1 - n2}/${den}`);
      } else {
        steps.push(`${n1}/${den} is smaller than ${n2}/${den}, so borrow a whole: ${w1} ${n1}/${den} = ${w1 - 1} ${n1 + den}/${den}`);
        steps.push(`Wholes: ${w1 - 1} − ${w2} = ${w1 - 1 - w2}; fractions: ${n1 + den} − ${n2} = ${n1 + den - n2}, so ${n1 + den - n2}/${den}`);
      }
      steps.push(`Together: ${mixedStr(diff, den)}`);
      return { prompt: `${w1} ${n1}/${den} − ${w2} ${n2}/${den} =`, answer: mixedStr(diff, den), steps };
    },
  },
  {
    id: "decimal-sub",
    name: "Subtracting decimals",
    hint: "Hundredths place",
    ccss: "5.NBT.B.7",
    grade: 5,
    cat: "fraction",
    space: 2000,
    gen(rng, d) {
      const hi = RANGE(500, 2000, 9000)[d];
      const a = rng.int(100, hi);
      const b = rng.int(10, a - 1);
      return {
        prompt: `${fromCents(a)} − ${fromCents(b)} =`,
        answer: fromCents(a - b),
        steps: [
          `Line up the decimal points, then subtract as whole numbers: ${a} − ${b} = ${a - b}`,
          `Put the decimal point back, two places from the right: ${fromCents(a - b)}`,
        ],
      };
    },
  },
  {
    id: "decimal-times-decimal",
    name: "Multiplying decimals",
    hint: "Count the decimal places",
    ccss: "5.NBT.B.7",
    grade: 5,
    cat: "fraction",
    space: 900,
    gen(rng, d) {
      const hi = RANGE(9, 30, 99)[d];
      const a = rng.int(2, hi);
      const b = rng.int(2, 9);
      const product = a * b; // hundredths, since tenths × tenths
      return {
        prompt: `${fromTenths(a)} × ${fromTenths(b)} =`,
        answer: fromCents(product),
        steps: [
          `Ignore the decimal points and multiply: ${a} × ${b} = ${product}`,
          `One decimal place in each number makes two in the answer: ${fromCents(product)}`,
        ],
      };
    },
  },
  {
    id: "decimal-div-decimal",
    name: "Dividing by a decimal",
    hint: "Move both decimal points",
    ccss: "5.NBT.B.7",
    grade: 5,
    cat: "fraction",
    space: 500,
    gen(rng, d) {
      const divisor = rng.int(2, RANGE(5, 9, 9)[d]); // tenths
      const quotient = rng.int(2, RANGE(9, 20, 60)[d]);
      const dividend = divisor * quotient; // tenths
      return {
        prompt: `${fromTenths(dividend)} ÷ ${fromTenths(divisor)} =`,
        answer: quotient,
        steps: [
          `Move both decimal points one place right so the divisor is a whole number: ${dividend} ÷ ${divisor}`,
          `${dividend} ÷ ${divisor} = ${quotient}`,
        ],
      };
    },
  },
  {
    id: "round-decimals",
    name: "Rounding decimals",
    hint: "Nearest whole or tenth",
    ccss: "5.NBT.A.4",
    grade: 5,
    cat: "fraction",
    space: 2000,
    gen(rng, d) {
      const n = rng.int(101, RANGE(999, 4999, 9999)[d]); // hundredths
      const toTenth = d !== "easy" && rng.next() < 0.6;
      if (toTenth) {
        const checkDigit = n % 10;
        const below = n - checkDigit;
        const rounded = checkDigit >= 5 ? below + 10 : below;
        return {
          prompt: `Round ${fromCents(n)} to the nearest tenth.`,
          answer: fromTenths(rounded / 10),
          steps: [
            `Look at the hundredths digit: it is ${checkDigit}`,
            checkDigit >= 5 ? `${checkDigit} is 5 or more, so round the tenths up: ${fromTenths(rounded / 10)}` : `${checkDigit} is less than 5, so keep the tenths: ${fromTenths(rounded / 10)}`,
          ],
        };
      }
      const checkDigit = Math.floor(n / 10) % 10;
      const below = Math.floor(n / 100);
      const rounded = checkDigit >= 5 ? below + 1 : below;
      return {
        prompt: `Round ${fromCents(n)} to the nearest whole number.`,
        answer: rounded,
        steps: [
          `Look at the tenths digit: it is ${checkDigit}`,
          checkDigit >= 5 ? `${checkDigit} is 5 or more, so round up: ${rounded}` : `${checkDigit} is less than 5, so round down: ${rounded}`,
        ],
      };
    },
  },
  {
    id: "compare-decimals-5",
    name: "Comparing decimals to thousandths",
    hint: "Line up the places",
    ccss: "5.NBT.A.3.B",
    grade: 5,
    cat: "fraction",
    space: 2000,
    gen(rng, d) {
      const thousandths = (t) => (t / 1000).toFixed(3);
      const hi = RANGE(999, 999, 9999)[d];
      let a = rng.int(1, hi);
      let b = rng.int(1, hi);
      if (a === b) b = b === hi ? b - 1 : b + 1;
      // Often share the first digits so the decision comes from a later place.
      if (rng.next() < 0.6) b = a - (a % 100) + rng.int(0, 99);
      if (a === b) b = a + 1;
      const sign = a > b ? ">" : "<";
      return {
        prompt: `${thousandths(a)} ____ ${thousandths(b)}`,
        answer: sign,
        steps: [
          `Compare place by place from the left; as thousandths they are ${a} and ${b}`,
          `${Math.max(a, b)} thousandths is more, so the sign is ${sign}`,
        ],
      };
    },
  },
  {
    id: "powers-of-10",
    name: "Multiplying and dividing by powers of 10",
    hint: "Move the decimal point",
    ccss: "5.NBT.A.2",
    grade: 5,
    cat: "fraction",
    space: 900,
    gen(rng, d) {
      const power = rng.int(1, RANGE(2, 3, 3)[d]);
      const k = 10 ** power;
      const n = rng.int(11, RANGE(99, 999, 9999)[d]); // hundredths
      const multiply = rng.next() < 0.5;
      const numStr = fromCents(n);
      if (multiply) {
        const result = n * k; // hundredths
        return {
          prompt: `${numStr} × 10^${power} =`,
          answer: fromCents(result).replace(/\.?0+$/, ""),
          steps: [
            `10^${power} is ${k.toLocaleString()}, so move the decimal point ${power} place${power > 1 ? "s" : ""} to the right`,
            `${numStr} × ${k.toLocaleString()} = ${fromCents(result).replace(/\.?0+$/, "")}`,
          ],
        };
      }
      // Dividing hundredths by 1000 would need five decimal places; keep it to 10 and 100.
      const divPower = Math.min(power, 2);
      const divK = 10 ** divPower;
      const result = (n / (100 * divK)).toFixed(divPower + 2);
      return {
        prompt: `${numStr} ÷ 10^${divPower} =`,
        answer: result,
        steps: [
          `10^${divPower} is ${divK}, so move the decimal point ${divPower} place${divPower > 1 ? "s" : ""} to the left`,
          `${numStr} ÷ ${divK} = ${result}`,
        ],
      };
    },
  },
  {
    id: "mult-3x2",
    name: "Multiply 3-digit by 2-digit",
    hint: "Standard algorithm",
    ccss: "5.NBT.B.5",
    grade: 5,
    cat: "number",
    space: 5000,
    gen(rng, d) {
      const a = rng.int(RANGE(101, 123, 234)[d], RANGE(399, 699, 999)[d]);
      const b = rng.int(RANGE(11, 12, 23)[d], RANGE(29, 59, 99)[d]);
      const tens = b - (b % 10);
      const ones = b % 10;
      const steps = [`Break ${b} into ${tens} + ${ones}`, `${a} × ${tens} = ${(a * tens).toLocaleString()}`];
      if (ones) steps.push(`${a} × ${ones} = ${(a * ones).toLocaleString()}`);
      steps.push(`Add the parts: ${(a * tens).toLocaleString()}${ones ? ` + ${(a * ones).toLocaleString()}` : ""} = ${(a * b).toLocaleString()}`);
      return { prompt: `${a} × ${b} =`, answer: (a * b).toLocaleString(), steps };
    },
  },
  {
    id: "div-2digit-divisor",
    name: "Dividing by a 2-digit number",
    hint: "No remainder",
    ccss: "5.NBT.B.6",
    grade: 5,
    cat: "number",
    space: 5000,
    gen(rng, d) {
      const divisor = rng.int(RANGE(11, 12, 21)[d], RANGE(25, 49, 99)[d]);
      const quotient = rng.int(RANGE(11, 21, 41)[d], RANGE(39, 89, 199)[d]);
      const dividend = divisor * quotient;
      const qTens = quotient - (quotient % 10);
      const qOnes = quotient % 10;
      const steps = [
        `Estimate: ${divisor} × ${qTens} = ${(divisor * qTens).toLocaleString()}`,
        `${dividend.toLocaleString()} − ${(divisor * qTens).toLocaleString()} = ${dividend - divisor * qTens} still to divide`,
      ];
      if (qOnes) steps.push(`${divisor} × ${qOnes} = ${divisor * qOnes}, which uses up the rest`);
      steps.push(`Quotient: ${qTens} + ${qOnes} = ${quotient}`);
      return { prompt: `${dividend.toLocaleString()} ÷ ${divisor} =`, answer: quotient, steps };
    },
  },
  {
    id: "order-ops-3step",
    name: "Order of operations, three steps",
    hint: "Brackets, then multiply, then add or subtract",
    ccss: "5.OA.A.1",
    grade: 5,
    cat: "number",
    space: 3000,
    gen(rng, d) {
      const hi = RANGE(6, 9, 12)[d];
      const a = rng.int(2, hi);
      const b = rng.int(2, hi);
      const c = rng.int(2, hi);
      const e = rng.int(1, RANGE(5, 9, 20)[d]);
      const minus = rng.next() < 0.5;
      const inner = a + b;
      const product = inner * c;
      const answer = minus ? product - e : product + e;
      return {
        prompt: `${c} × (${a} + ${b}) ${minus ? "−" : "+"} ${e} =`,
        answer,
        steps: [
          `Brackets first: ${a} + ${b} = ${inner}`,
          `Then multiply: ${c} × ${inner} = ${product}`,
          minus ? `Then subtract: ${product} − ${e} = ${answer}` : `Then add: ${product} + ${e} = ${answer}`,
        ],
      };
    },
  },
  {
    id: "expression-from-words",
    name: "Writing numerical expressions",
    hint: "Words to symbols, no solving",
    ccss: "5.OA.A.2",
    grade: 5,
    cat: "algebra",
    space: 400,
    gen(rng, d) {
      const hi = RANGE(9, 12, 20)[d];
      const a = rng.int(2, hi);
      const b = rng.int(2, hi);
      const c = rng.int(2, 9);
      const forms = [
        [`add ${a} and ${b}, then multiply by ${c}`, `(${a} + ${b}) × ${c}`, "The comma says do the adding first, so it goes in brackets"],
        [`subtract ${Math.min(a, b)} from ${Math.max(a, b)}, then multiply by ${c}`, `(${Math.max(a, b)} − ${Math.min(a, b)}) × ${c}`, "The subtraction happens first, so it goes in brackets"],
        [`multiply ${a} by ${c}, then add ${b}`, `${a} × ${c} + ${b}`, "Multiplying already comes before adding, so no brackets are needed"],
        [`${c} times the sum of ${a} and ${b}`, `${c} × (${a} + ${b})`, "\"The sum of\" is one quantity, so the sum goes in brackets"],
        [`half of the sum of ${a} and ${b}`, `(${a} + ${b}) ÷ 2`, "Find the sum first, then halve it — brackets around the sum"],
      ];
      const [words, expr, why] = rng.pick(forms);
      return {
        prompt: `Write as an expression (do not solve): ${words}.`,
        answer: expr,
        steps: [why, `Expression: ${expr}`],
      };
    },
  },
  {
    id: "unit-conversion-5",
    name: "Converting units with decimals",
    hint: "Both directions",
    ccss: "5.MD.A.1",
    grade: 5,
    cat: "geometry",
    space: 900,
    gen(rng, d) {
      const table = [["km", "m", 1000], ["kg", "g", 1000], ["L", "mL", 1000], ["m", "cm", 100]];
      const [big, small, k] = rng.pick(table);
      const toSmall = rng.next() < 0.5;
      // Amounts are whole tenths or hundredths of the big unit.
      const hund = rng.int(RANGE(10, 10, 5)[d], RANGE(90, 999, 2999)[d]) * (d === "easy" ? 10 : 1);
      const smallAmount = (hund * k) / 100;
      const bigStr = fromCents(hund).replace(/\.?0+$/, "");
      return toSmall
        ? {
            prompt: `${bigStr} ${big} = ____ ${small}`,
            answer: smallAmount.toLocaleString(),
            steps: [`1 ${big} is ${k.toLocaleString()} ${small}, so multiply: ${bigStr} × ${k.toLocaleString()} = ${smallAmount.toLocaleString()}`],
          }
        : {
            prompt: `${smallAmount.toLocaleString()} ${small} = ____ ${big}`,
            answer: bigStr,
            steps: [`${k.toLocaleString()} ${small} make 1 ${big}, so divide: ${smallAmount.toLocaleString()} ÷ ${k.toLocaleString()} = ${bigStr}`],
          };
    },
  },
  {
    id: "fraction-word-5",
    name: "Fraction word problems",
    hint: "Multiply a fraction in context",
    ccss: "5.NF.B.6",
    grade: 5,
    cat: "word",
    space: 300,
    gen(rng, d) {
      const den = rng.pick(RANGE([2, 4], [3, 4, 5], [3, 4, 5, 6, 8])[d]);
      const num = rng.int(1, den - 1);
      const k = rng.int(2, RANGE(4, 6, 9)[d]);
      const product = num * k;
      const answer = mixedStr(product, den);
      const [thing, unit] = rng.pick([["A recipe uses", "cup of sugar per batch"], ["A runner drinks", "litre of water per hour"], ["A painter uses", "can of paint per wall"]]);
      const plural = { batch: "batches", hour: "hours", wall: "walls" }[unit.split(" ").pop()];
      const noun = `${unit.split(" ")[0]}${product <= den ? "" : "s"}`;
      return {
        prompt: `${thing} ${num}/${den} ${unit}. How much for ${k} ${plural}?`,
        answer: `${answer} ${noun}`,
        steps: [
          `${k} groups of ${num}/${den} means multiply: ${k} × ${num} = ${product}, so ${product}/${den}`,
          `${product}/${den} as a mixed number: ${answer} ${noun}`,
        ],
      };
    },
  },
];
