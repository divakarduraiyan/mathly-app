/* Grade 7 skills. Each entry follows the rules in ../generators.js:
   the answer (and every step) comes from the numbers the generator
   already holds, problems are built backwards, no floats, seeded RNG. */

import { RANGE, addIntSteps, dollars, fmtSigned, fracStr, fromCents, gcd, mixedStr, polyStr, reduce, simplifyStep } from "./helpers.js";

export default [
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
  {
    id: "discount-tax-tip",
    name: "Discounts, tax and tips",
    hint: "Percent of a price",
    ccss: "7.RP.A.3",
    grade: 7,
    cat: "word",
    space: 900,
    gen(rng, d) {
      const percent = rng.pick(RANGE([10, 20, 50], [10, 15, 20, 25], [5, 8, 15, 30, 35])[d]);
      const unit = 100 / gcd(percent, 100);
      const price = unit * rng.int(RANGE(2, 3, 5)[d], RANGE(10, 25, 40)[d]);
      const change = (price * percent) / 100;
      const kind = rng.pick(["discount", "tax", "tip"]);
      const add = kind !== "discount";
      const total = add ? price + change : price - change;
      const prompt = {
        discount: `A jacket costs $${price}. It is on sale for ${percent}% off. What is the sale price?`,
        tax: `A game costs $${price}. Sales tax is ${percent}%. What is the total cost?`,
        tip: `A meal costs $${price}. You leave a ${percent}% tip. How much do you pay in total?`,
      }[kind];
      return {
        prompt,
        answer: `$${total}`,
        steps: [
          `${percent}% of ${price}: ${price} × ${percent} ÷ 100 = ${change}`,
          add ? `Add it to the price: ${price} + ${change} = ${total}, so $${total}` : `Take it off the price: ${price} − ${change} = ${total}, so $${total}`,
        ],
      };
    },
  },
  {
    id: "percent-change",
    name: "Percent increase and decrease",
    hint: "Change over the original",
    ccss: "7.RP.A.3",
    grade: 7,
    cat: "word",
    space: 600,
    gen(rng, d) {
      const percent = rng.pick(RANGE([10, 25, 50], [10, 20, 25, 50, 75], [5, 12, 20, 30, 40, 60])[d]);
      const unit = 100 / gcd(percent, 100);
      const original = unit * rng.int(2, RANGE(8, 12, 20)[d]);
      const change = (original * percent) / 100;
      const increase = rng.next() < 0.5;
      const after = increase ? original + change : original - change;
      const [thing, unitName] = rng.pick([["A plant grew from", "cm"], ["A town's population went from", "people"], ["The price went from", "dollars"]]);
      return {
        prompt: `${thing} ${original} to ${after} ${unitName}. What is the percent ${increase ? "increase" : "decrease"}?`,
        answer: `${percent}%`,
        steps: [
          `Find the change: ${Math.max(original, after)} − ${Math.min(original, after)} = ${change}`,
          `Divide by the original and make it a percent: ${change} ÷ ${original} × 100 = ${percent}%`,
        ],
      };
    },
  },
  {
    id: "constant-of-proportionality",
    name: "Constant of proportionality",
    hint: "y = kx",
    ccss: "7.RP.A.2.B",
    grade: 7,
    cat: "algebra",
    space: 500,
    gen(rng, d) {
      const k = rng.int(2, RANGE(6, 9, 15)[d]);
      const x1 = rng.int(1, RANGE(5, 8, 12)[d]);
      const x2 = x1 + rng.int(1, 4);
      const x3 = x2 + rng.int(1, 4);
      return {
        prompt: `y is proportional to x. When x = ${x1}, ${x2}, ${x3}, y = ${k * x1}, ${k * x2}, ${k * x3}. What is the constant of proportionality?`,
        answer: k,
        steps: [
          `Proportional means y = kx, so k = y ÷ x for any pair`,
          `${k * x1} ÷ ${x1} = ${k} (and ${k * x2} ÷ ${x2} = ${k} too)`,
          `k = ${k}`,
        ],
      };
    },
  },
  {
    id: "rational-add-sub",
    name: "Adding and subtracting negative fractions",
    hint: "Signed rational numbers",
    ccss: "7.NS.A.1",
    grade: 7,
    cat: "fraction",
    space: 900,
    gen(rng, d) {
      const den = rng.pick(RANGE([2, 4], [3, 4, 5, 6], [4, 6, 8, 10, 12])[d]);
      let n1 = rng.int(1, den - 1) * (rng.next() < 0.5 ? -1 : 1);
      let n2 = rng.int(1, den - 1) * (rng.next() < 0.5 ? -1 : 1);
      if (n1 > 0 && n2 > 0) n1 = -n1;
      const sub = rng.next() < 0.5;
      const sum = sub ? n1 - n2 : n1 + n2;
      const [rn, rd] = reduce(Math.abs(sum), den);
      const answer = sum === 0 ? "0" : `${sum < 0 ? "-" : ""}${fracStr(rn, rd)}`;
      const f = (n) => (n < 0 ? `(-${Math.abs(n)}/${den})` : `${n}/${den}`);
      const steps = [
        sub
          ? `Same denominator, so work with the numerators like integers, and subtracting is adding the opposite: ${fmtSigned(n1)} + ${fmtSigned(-n2)}`
          : `Same denominator, so work with the numerators like integers: ${fmtSigned(n1)} + ${fmtSigned(n2)}`,
        ...addIntSteps(n1, sub ? -n2 : n2),
        `Put it over ${den}: ${sum}/${den}`,
      ];
      if (sum === 0) steps.push(`0/${den} = 0`);
      else if (rd !== den) steps.push(`Simplify: ${answer}`);
      return {
        prompt: `${f(n1)} ${sub ? "−" : "+"} ${f(n2)} =`,
        answer,
        steps,
      };
    },
  },
  {
    id: "rational-mult-div",
    name: "Multiplying and dividing negative fractions",
    hint: "Signs first, then the fractions",
    ccss: "7.NS.A.2",
    grade: 7,
    cat: "fraction",
    space: 900,
    gen(rng, d) {
      const dens = RANGE([2, 3, 4], [3, 4, 5, 6], [4, 5, 6, 8])[d];
      const d1 = rng.pick(dens);
      const d2 = rng.pick(dens);
      const n1 = rng.int(1, d1 - 1);
      const n2 = rng.int(1, d2 - 1);
      const s1 = rng.next() < 0.5 ? -1 : 1;
      const s2 = s1 === 1 || rng.next() < 0.5 ? -1 : 1;
      const negative = s1 !== s2;
      const mult = rng.next() < 0.5;
      const f = (sgn, n, dd) => (sgn < 0 ? `(-${n}/${dd})` : `${n}/${dd}`);
      const pn = mult ? n1 * n2 : n1 * d2;
      const pd = mult ? d1 * d2 : d1 * n2;
      const [rn, rd] = reduce(pn, pd);
      const answer = `${negative ? "-" : ""}${fracStr(rn, rd)}`;
      const steps = [negative ? `Different signs, so the answer is negative` : `Same signs, so the answer is positive`];
      if (!mult) steps.push(`Dividing by ${n2}/${d2} is multiplying by ${d2}/${n2}`);
      steps.push(`Multiply across: ${n1} × ${mult ? n2 : d2} = ${pn} on top, ${d1} × ${mult ? d2 : n2} = ${pd} on the bottom`);
      if (rn !== pn || rd !== pd) steps.push(`Simplify ${pn}/${pd}: divide top and bottom by ${gcd(pn, pd)}`);
      steps.push(`Answer: ${answer}`);
      return {
        prompt: `${f(s1, n1, d1)} ${mult ? "×" : "÷"} ${f(s2, n2, d2)} =`,
        answer,
        steps,
      };
    },
  },
  {
    id: "simplify-expression-7",
    name: "Simplifying expressions",
    hint: "Distribute, then combine like terms",
    ccss: "7.EE.A.1",
    grade: 7,
    cat: "algebra",
    space: 2000,
    gen(rng, d) {
      const a = rng.int(2, RANGE(4, 6, 9)[d]);
      const b = rng.int(1, RANGE(5, 9, 12)[d]);
      const c = rng.int(1, RANGE(5, 9, 12)[d]);
      const e = rng.int(1, RANGE(5, 9, 15)[d]);
      const minus = d !== "easy" && rng.next() < 0.5;
      const xCoef = a + c;
      const constant = minus ? a * b - e : a * b + e;
      const answer = polyStr([xCoef, constant]);
      return {
        prompt: `Simplify: ${a}(x + ${b}) + ${c}x ${minus ? "−" : "+"} ${e}`,
        answer,
        steps: [
          `Distribute the ${a}: ${a}x + ${a * b}`,
          `Now: ${a}x + ${a * b} + ${c}x ${minus ? "−" : "+"} ${e}`,
          `Combine the x terms: ${a} + ${c} = ${xCoef}, so ${xCoef}x`,
          `Combine the numbers: ${a * b} ${minus ? "−" : "+"} ${e} = ${constant}`,
          `Simplified: ${answer}`,
        ],
      };
    },
  },
  {
    id: "two-step-inequality",
    name: "Two-step inequalities",
    hint: "Solve like an equation",
    ccss: "7.EE.B.4.B",
    grade: 7,
    cat: "algebra",
    space: 2000,
    gen(rng, d) {
      const hi = RANGE(8, 12, 20)[d];
      const x = rng.int(1, hi);
      const a = rng.int(2, RANGE(5, 8, 12)[d]);
      const b = rng.int(1, hi);
      const sign = rng.pick(["<", ">", "≤", "≥"]);
      const answer = `x ${sign} ${x}`;
      return {
        prompt: `Solve: ${a}x + ${b} ${sign} ${a * x + b}`,
        answer,
        steps: [
          `Subtract ${b} from both sides: ${a}x ${sign} ${a * x + b} − ${b}, so ${a}x ${sign} ${a * x}`,
          `Divide both sides by ${a} (positive, so the sign stays): x ${sign} ${a * x} ÷ ${a}, so ${answer}`,
        ],
      };
    },
  },
  {
    id: "circle-area-numeric",
    name: "Area of circles",
    hint: "Use π ≈ 22/7",
    ccss: "7.G.B.4",
    grade: 7,
    cat: "geometry",
    space: 12,
    gen(rng, d) {
      const k = rng.int(1, RANGE(3, 5, 8)[d]);
      const r = 7 * k;
      const area = 22 * 7 * k * k;
      return {
        prompt: `A circle has a radius of ${r} cm. Using π ≈ 22/7, what is its area?`,
        answer: `${area} cm²`,
        steps: [
          `Area = π × r² = 22/7 × ${r} × ${r}`,
          `One ${r} ÷ 7 = ${k}, so 22 × ${k} × ${r} = ${area} cm²`,
        ],
      };
    },
  },
  {
    id: "complementary-vertical-angles",
    name: "Complementary and vertical angles",
    hint: "Add to 90°, or equal",
    ccss: "7.G.B.5",
    grade: 7,
    cat: "geometry",
    space: 180,
    gen(rng, d) {
      const complementary = rng.next() < 0.6;
      if (complementary) {
        const a = rng.int(RANGE(10, 5, 1)[d], RANGE(80, 85, 89)[d]);
        return {
          prompt: `Two angles are complementary. One measures ${a}°. What is the other?`,
          answer: `${90 - a}°`,
          steps: [`Complementary angles add up to 90°`, `90 − ${a} = ${90 - a}°`],
        };
      }
      const a = rng.int(RANGE(20, 15, 10)[d], RANGE(160, 165, 170)[d]);
      return {
        prompt: `Two lines cross. One of the angles formed is ${a}°. What is the angle directly opposite it?`,
        answer: `${a}°`,
        steps: [`Angles opposite each other at a crossing (vertical angles) are equal`, `So it is also ${a}°`],
      };
    },
  },
  {
    id: "scale-drawing",
    name: "Scale drawings",
    hint: "Drawing to real life",
    ccss: "7.G.A.1",
    grade: 7,
    cat: "word",
    space: 500,
    gen(rng, d) {
      const scale = rng.pick(RANGE([2, 5, 10], [4, 5, 20, 25], [3, 12, 15, 50])[d]);
      const drawn = rng.int(2, RANGE(9, 12, 20)[d]);
      const toReal = rng.next() < 0.6;
      return toReal
        ? {
            prompt: `A map uses a scale of 1 cm : ${scale} km. A road is ${drawn} cm long on the map. How long is the real road?`,
            answer: `${drawn * scale} km`,
            steps: [`Every 1 cm on the map is ${scale} km, so multiply: ${drawn} × ${scale} = ${drawn * scale} km`],
          }
        : {
            prompt: `A map uses a scale of 1 cm : ${scale} km. A real road is ${drawn * scale} km long. How long is it on the map?`,
            answer: `${drawn} cm`,
            steps: [`Every ${scale} km is 1 cm on the map, so divide: ${drawn * scale} ÷ ${scale} = ${drawn} cm`],
          };
    },
  },
  {
    id: "compound-probability",
    name: "Compound probability",
    hint: "Two independent events",
    ccss: "7.SP.C.8",
    grade: 7,
    cat: "word",
    space: 60,
    gen(rng, d) {
      const events = [
        ["flip a coin and get heads", 1, 2],
        ["roll a die and get a 6", 1, 6],
        ["roll a die and get an even number", 1, 2],
        ["spin a 4-part spinner and land on red", 1, 4],
        ["pick a red marble from a bag with 2 red and 3 blue", 2, 5],
        ["roll a die and get more than 4", 1, 3],
      ];
      const pool = RANGE(events.slice(0, 3), events.slice(0, 5), events)[d];
      const i = rng.int(0, pool.length - 1);
      let j = rng.int(0, pool.length - 1);
      if (j === i) j = (i + 1) % pool.length;
      const [e1, n1, d1] = pool[i];
      const [e2, n2, d2] = pool[j];
      const [rn, rd] = reduce(n1 * n2, d1 * d2);
      return {
        prompt: `What is the probability that you ${e1}, and then ${e2}?`,
        answer: `${rn}/${rd}`,
        steps: [
          `First event: ${n1}/${d1}. Second event: ${n2}/${d2}`,
          `Independent events, so multiply: ${n1}/${d1} × ${n2}/${d2} = ${n1 * n2}/${d1 * d2}`,
          ...simplifyStep(n1 * n2, d1 * d2),
        ],
      };
    },
  },
  {
    id: "unit-rate-fractions",
    name: "Unit rates with fractions",
    hint: "Miles per hour from a fraction of an hour",
    ccss: "7.RP.A.1",
    grade: 7,
    cat: "word",
    space: 300,
    gen(rng, d) {
      const den = rng.pick(RANGE([2, 4], [2, 3, 4], [3, 4, 5, 6])[d]);
      const num = rng.int(1, den - 1);
      const rate = rng.int(2, RANGE(6, 10, 15)[d]);
      // distance = rate × num/den; keep it a clean fraction.
      const distN = rate * num;
      const [dn, dd] = reduce(distN, den);
      const distStr = mixedStr(distN, den);
      return {
        prompt: `A hiker walks ${distStr} miles in ${num}/${den} of an hour. What is the speed in miles per hour?`,
        answer: rate,
        steps: [
          `Speed = distance ÷ time = ${fracStr(dn, dd)} ÷ ${num}/${den}`,
          `Dividing by ${num}/${den} is multiplying by ${den}/${num}: ${fracStr(dn, dd)} × ${den}/${num}`,
          `${dn} × ${den} = ${dn * den} on top, ${dd} × ${num} = ${dd * num} on the bottom, and ${dn * den} ÷ ${dd * num} = ${rate}`,
        ],
      };
    },
  },
];
