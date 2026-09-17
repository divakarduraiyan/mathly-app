/* Grade 6 skills. Each entry follows the rules in ../generators.js:
   the answer (and every step) comes from the numbers the generator
   already holds, problems are built backwards, no floats, seeded RNG. */

import { RANGE, fracStr, fromCents, gcd, reduce, simplifyStep } from "./helpers.js";

export default [
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
  {
    id: "ratio-word",
    name: "Ratio word problems",
    hint: "Scale a rate up",
    ccss: "6.RP.A.3",
    grade: 6,
    cat: "word",
    space: 900,
    gen(rng, d) {
      const hi = RANGE(6, 9, 12)[d];
      const items = rng.int(2, hi);
      const cost = rng.int(1, hi);
      const k = rng.int(2, RANGE(4, 6, 9)[d]);
      const thing = rng.pick(["pencils", "apples", "stickers", "notebooks"]);
      return {
        prompt: `${items} ${thing} cost $${cost}. How much do ${items * k} ${thing} cost?`,
        answer: `$${cost * k}`,
        steps: [
          `${items * k} ÷ ${items} = ${k}, so it is ${k} times as many ${thing}`,
          `The cost scales the same way: ${cost} × ${k} = ${cost * k}, so $${cost * k}`,
        ],
      };
    },
  },
  {
    id: "percent-find-whole",
    name: "Finding the whole from a percent",
    hint: "20% of what number is 8?",
    ccss: "6.RP.A.3.C",
    grade: 6,
    cat: "word",
    space: 400,
    gen(rng, d) {
      const percent = rng.pick(RANGE([10, 25, 50], [10, 20, 25, 50], [5, 10, 20, 25, 40, 50, 75])[d]);
      const unit = 100 / gcd(percent, 100);
      const whole = unit * rng.int(1, RANGE(8, 12, 20)[d]);
      const part = (whole * percent) / 100;
      return {
        prompt: `${percent}% of what number is ${part}?`,
        answer: whole,
        steps: [
          `${percent}% of the number is ${part}, so the number is ${part} × 100 ÷ ${percent}`,
          `${part} × 100 = ${part * 100}`,
          `${part * 100} ÷ ${percent} = ${whole}`,
        ],
      };
    },
  },
  {
    id: "multidigit-division",
    name: "Multi-digit division",
    hint: "Four digits by two",
    ccss: "6.NS.B.2",
    grade: 6,
    cat: "number",
    space: 5000,
    gen(rng, d) {
      const divisor = rng.int(RANGE(12, 15, 21)[d], RANGE(30, 60, 99)[d]);
      const quotient = rng.int(RANGE(40, 100, 120)[d], RANGE(99, 199, 399)[d]);
      const dividend = divisor * quotient;
      const qHundreds = quotient - (quotient % 100);
      const qTens = (quotient % 100) - (quotient % 10);
      const qOnes = quotient % 10;
      const steps = [];
      let left = dividend;
      for (const [chunk, label] of [[qHundreds, "hundreds"], [qTens, "tens"], [qOnes, "ones"]]) {
        if (!chunk) continue;
        steps.push(`${divisor} × ${chunk} = ${(divisor * chunk).toLocaleString()}, leaving ${left.toLocaleString()} − ${(divisor * chunk).toLocaleString()} = ${(left - divisor * chunk).toLocaleString()}`);
        left -= divisor * chunk;
      }
      steps.push(`Quotient: ${[qHundreds, qTens, qOnes].filter(Boolean).join(" + ")} = ${quotient}`);
      return { prompt: `${dividend.toLocaleString()} ÷ ${divisor} =`, answer: quotient, steps };
    },
  },
  {
    id: "decimal-all-ops",
    name: "Decimal operations",
    hint: "Add, subtract and multiply",
    ccss: "6.NS.B.3",
    grade: 6,
    cat: "fraction",
    space: 3000,
    gen(rng, d) {
      const hi = RANGE(999, 4999, 9999)[d];
      const a = rng.int(100, hi);
      const op = rng.pick(["+", "−", "×"]);
      if (op === "×") {
        const b = rng.int(2, RANGE(9, 12, 25)[d]);
        return {
          prompt: `${fromCents(a)} × ${b} =`,
          answer: fromCents(a * b),
          steps: [
            `Ignore the decimal point: ${a} × ${b} = ${a * b}`,
            `Two decimal places in ${fromCents(a)}, so two in the answer: ${fromCents(a * b)}`,
          ],
        };
      }
      const b = rng.int(10, op === "−" ? a - 1 : hi);
      const result = op === "+" ? a + b : a - b;
      return {
        prompt: `${fromCents(a)} ${op} ${fromCents(b)} =`,
        answer: fromCents(result),
        steps: [
          `Line up the decimal points and work in hundredths: ${a} ${op} ${b} = ${result}`,
          `Put the decimal point back: ${fromCents(result)}`,
        ],
      };
    },
  },
  {
    id: "absolute-value-opposites",
    name: "Absolute value and opposites",
    hint: "Distance from zero",
    ccss: "6.NS.C.6",
    grade: 6,
    cat: "number",
    space: 200,
    gen(rng, d) {
      const hi = RANGE(10, 25, 60)[d];
      const n = rng.int(-hi, hi) || -3;
      const abs = rng.next() < 0.5;
      return abs
        ? {
            prompt: `|${n}| =`,
            answer: Math.abs(n),
            steps: [`Absolute value is the distance from zero, always positive: ${Math.abs(n)}`],
          }
        : {
            prompt: `What is the opposite of ${n}?`,
            answer: -n,
            steps: [`The opposite is the same distance from zero on the other side, so flip the sign: ${-n}`],
          };
    },
  },
  {
    id: "order-integers",
    name: "Ordering integers",
    hint: "Least to greatest with negatives",
    ccss: "6.NS.C.7",
    grade: 6,
    cat: "number",
    space: 3000,
    gen(rng, d) {
      const hi = RANGE(10, 20, 50)[d];
      const set = new Set();
      while (set.size < 4) set.add(rng.int(-hi, hi));
      const nums = [...set];
      const sorted = nums.slice().sort((x, y) => x - y);
      return {
        prompt: `Order from least to greatest: ${nums.join(", ")}`,
        answer: sorted.join(", "),
        steps: [
          `On a number line, numbers further left are smaller: negatives before zero before positives, and among negatives the bigger size is the smaller number`,
          `Least to greatest: ${sorted.join(", ")}`,
        ],
      };
    },
  },
  {
    id: "exponents-whole",
    name: "Whole-number exponents",
    hint: "Repeated multiplication",
    ccss: "6.EE.A.1",
    grade: 6,
    cat: "number",
    space: 40,
    gen(rng, d) {
      const base = rng.int(2, RANGE(5, 7, 10)[d]);
      const exp = rng.int(2, RANGE(3, 3, 4)[d]);
      const value = base ** exp;
      return {
        prompt: `Evaluate: ${base}^${exp}`,
        answer: value,
        steps: [
          `The exponent says how many times to multiply the base by itself`,
          `${Array(exp).fill(base).join(" × ")} = ${value}`,
        ],
      };
    },
  },
  {
    id: "distributive-property",
    name: "Distributive property",
    hint: "Expand a(x + b)",
    ccss: "6.EE.A.3",
    grade: 6,
    cat: "algebra",
    space: 300,
    gen(rng, d) {
      const a = rng.int(2, RANGE(5, 9, 12)[d]);
      const b = rng.int(1, RANGE(9, 12, 20)[d]);
      const minus = d !== "easy" && rng.next() < 0.5;
      const answer = `${a}x ${minus ? "−" : "+"} ${a * b}`;
      return {
        prompt: `Expand: ${a}(x ${minus ? "−" : "+"} ${b})`,
        answer,
        steps: [
          `Multiply the ${a} by each term inside the bracket`,
          `${a} × x = ${a}x and ${a} × ${b} = ${a * b}`,
          `Expanded: ${answer}`,
        ],
      };
    },
  },
  {
    id: "one-step-mult-div",
    name: "One-step equations, multiply and divide",
    hint: "4x = 28 and x/5 = 6",
    ccss: "6.EE.B.7",
    grade: 6,
    cat: "algebra",
    space: 900,
    gen(rng, d) {
      const hi = RANGE(9, 12, 20)[d];
      const x = rng.int(2, hi);
      const k = rng.int(2, RANGE(6, 9, 12)[d]);
      const mult = rng.next() < 0.5;
      return mult
        ? {
            prompt: `Solve: ${k}x = ${k * x}`,
            answer: x,
            steps: [`Undo the × ${k} by dividing both sides by ${k}`, `x = ${k * x} ÷ ${k} = ${x}`],
          }
        : {
            prompt: `Solve: x/${k} = ${x}`,
            answer: x * k,
            steps: [`Undo the ÷ ${k} by multiplying both sides by ${k}`, `x = ${x} × ${k} = ${x * k}`],
          };
    },
  },
  {
    id: "inequality-from-words",
    name: "Writing inequalities",
    hint: "Words to symbols",
    ccss: "6.EE.B.8",
    grade: 6,
    cat: "algebra",
    space: 200,
    gen(rng, d) {
      const n = rng.int(1, RANGE(10, 20, 50)[d]);
      const forms = [
        [`A number is more than ${n}`, `x > ${n}`, "\"more than\" means greater than"],
        [`A number is less than ${n}`, `x < ${n}`, "\"less than\" means smaller than"],
        [`A number is at least ${n}`, `x ≥ ${n}`, "\"at least\" includes the number itself, so greater than or equal to"],
        [`A number is at most ${n}`, `x ≤ ${n}`, "\"at most\" includes the number itself, so less than or equal to"],
        [`A number is no more than ${n}`, `x ≤ ${n}`, "\"no more than\" means it can equal ${n} but not go past it"],
      ];
      const [words, expr, why] = rng.pick(forms);
      return {
        prompt: `Write as an inequality: ${words}.`,
        answer: expr,
        steps: [why.replace("${n}", String(n)), `Inequality: ${expr}`],
      };
    },
  },
  {
    id: "area-parallelogram-trapezoid",
    name: "Area of parallelograms and trapezoids",
    hint: "Base times height",
    ccss: "6.G.A.1",
    grade: 6,
    cat: "geometry",
    space: 800,
    gen(rng, d) {
      const hi = RANGE(9, 14, 24)[d];
      const h = rng.int(2, hi);
      const trapezoid = d !== "easy" && rng.next() < 0.5;
      if (trapezoid) {
        const b1 = rng.int(2, hi);
        let b2 = rng.int(2, hi);
        if ((b1 + b2) % 2) b2 += 1;
        const area = ((b1 + b2) * h) / 2;
        return {
          prompt: `A trapezoid has parallel sides of ${b1} cm and ${b2} cm and a height of ${h} cm. What is its area?`,
          answer: `${area} cm²`,
          steps: [
            `Area of a trapezoid = (base 1 + base 2) ÷ 2 × height`,
            `${b1} + ${b2} = ${b1 + b2}, and ${b1 + b2} ÷ 2 = ${(b1 + b2) / 2}`,
            `${(b1 + b2) / 2} × ${h} = ${area} cm²`,
          ],
        };
      }
      const b = rng.int(2, hi);
      return {
        prompt: `A parallelogram has a base of ${b} cm and a height of ${h} cm. What is its area?`,
        answer: `${b * h} cm²`,
        steps: [`Area of a parallelogram = base × height`, `${b} × ${h} = ${b * h} cm²`],
      };
    },
  },
  {
    id: "median-mode-range",
    name: "Median, mode and range",
    hint: "Describe a data set",
    ccss: "6.SP.B.5.C",
    grade: 6,
    cat: "word",
    space: 3000,
    gen(rng, d) {
      const hi = RANGE(12, 20, 40)[d];
      const count = RANGE(5, 5, 7)[d];
      const nums = [];
      const repeat = rng.int(1, hi);
      nums.push(repeat, repeat);
      while (nums.length < count) nums.push(rng.int(1, hi));
      // Shuffle so the mode isn't always first.
      for (let i = nums.length - 1; i > 0; i -= 1) {
        const j = rng.int(0, i);
        [nums[i], nums[j]] = [nums[j], nums[i]];
      }
      const sorted = nums.slice().sort((x, y) => x - y);
      const counts = new Map();
      for (const n of nums) counts.set(n, (counts.get(n) ?? 0) + 1);
      const maxCount = Math.max(...counts.values());
      const modes = [...counts.entries()].filter(([, c]) => c === maxCount).map(([n]) => n);
      const ask = rng.pick(modes.length === 1 ? ["median", "mode", "range"] : ["median", "range"]);
      const list = nums.join(", ");
      if (ask === "median") {
        const mid = sorted[Math.floor(count / 2)];
        return {
          prompt: `Find the median of: ${list}`,
          answer: mid,
          steps: [`Put them in order: ${sorted.join(", ")}`, `The middle of ${count} numbers is the ${["", "1st", "2nd", "3rd", "4th", "5th"][Math.floor(count / 2) + 1]} one: ${mid}`],
        };
      }
      if (ask === "mode") {
        return {
          prompt: `Find the mode of: ${list}`,
          answer: modes[0],
          steps: [`The mode is the value that appears most often`, `${modes[0]} appears ${maxCount} times: ${modes[0]}`],
        };
      }
      return {
        prompt: `Find the range of: ${list}`,
        answer: sorted[count - 1] - sorted[0],
        steps: [`Range = biggest − smallest`, `${sorted[count - 1]} − ${sorted[0]} = ${sorted[count - 1] - sorted[0]}`],
      };
    },
  },
  {
    id: "surface-area-box",
    name: "Surface area of a box",
    hint: "Six faces in three pairs",
    ccss: "6.G.A.4",
    grade: 6,
    cat: "geometry",
    space: 700,
    gen(rng, d) {
      const hi = RANGE(6, 10, 15)[d];
      const l = rng.int(2, hi);
      const w = rng.int(2, hi);
      const h = rng.int(2, hi);
      const sa = 2 * (l * w + l * h + w * h);
      return {
        prompt: `A box is ${l} cm long, ${w} cm wide and ${h} cm tall. What is its surface area?`,
        answer: `${sa} cm²`,
        steps: [
          `Three pairs of faces: ${l} × ${w} = ${l * w}, ${l} × ${h} = ${l * h}, ${w} × ${h} = ${w * h}`,
          `Add them: ${l * w} + ${l * h} + ${w * h} = ${l * w + l * h + w * h}`,
          `Each face has a twin, so double it: 2 × ${l * w + l * h + w * h} = ${sa} cm²`,
        ],
      };
    },
  },
];
