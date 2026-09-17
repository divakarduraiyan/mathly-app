/* Grade 8 skills. Each entry follows the rules in ../generators.js:
   the answer (and every step) comes from the numbers the generator
   already holds, problems are built backwards, no floats, seeded RNG. */

import { RANGE, fmtSigned, fromTenths, reduce, simplifyStep } from "./helpers.js";

export default [
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
  {
    id: "exponent-quotient-power",
    name: "Quotient and power rules",
    hint: "Subtract or multiply exponents",
    ccss: "8.EE.A.1",
    grade: 8,
    cat: "algebra",
    space: 150,
    gen(rng, d) {
      const hi = RANGE(6, 9, 12)[d];
      const quotient = rng.next() < 0.5;
      if (quotient) {
        const b = rng.int(1, hi - 1);
        const a = rng.int(b + 1, hi);
        return {
          prompt: `Simplify: x^${a} ÷ x^${b}`,
          answer: `x^${a - b}`,
          steps: [`Same base, so subtract the exponents: ${a} − ${b} = ${a - b}`, `x^${a - b}`],
        };
      }
      const a = rng.int(2, Math.min(hi, 6));
      const b = rng.int(2, 4);
      return {
        prompt: `Simplify: (x^${a})^${b}`,
        answer: `x^${a * b}`,
        steps: [`A power of a power: multiply the exponents, ${a} × ${b} = ${a * b}`, `x^${a * b}`],
      };
    },
  },
  {
    id: "negative-exponents",
    name: "Negative exponents",
    hint: "Flip to a fraction",
    ccss: "8.EE.A.1",
    grade: 8,
    cat: "algebra",
    space: 40,
    gen(rng, d) {
      const base = rng.int(2, RANGE(5, 6, 10)[d]);
      const exp = rng.int(1, RANGE(2, 3, 3)[d]);
      const value = base ** exp;
      return {
        prompt: `Evaluate: ${base}^(−${exp})`,
        answer: `1/${value}`,
        steps: [
          `A negative exponent means "1 over": ${base}^(−${exp}) = 1/${base}^${exp}`,
          `${base}^${exp} = ${value}, so 1/${value}`,
        ],
      };
    },
  },
  {
    id: "square-cube-roots",
    name: "Square and cube roots",
    hint: "Perfect squares and cubes",
    ccss: "8.EE.A.2",
    grade: 8,
    cat: "number",
    space: 30,
    gen(rng, d) {
      const cube = d !== "easy" && rng.next() < 0.4;
      if (cube) {
        const n = rng.int(2, RANGE(3, 4, 6)[d]);
        return {
          prompt: `What is the cube root of ${n ** 3}?`,
          answer: n,
          steps: [`Ask: what number times itself three times makes ${n ** 3}?`, `${n} × ${n} × ${n} = ${n ** 3}, so the cube root is ${n}`],
        };
      }
      const n = rng.int(2, RANGE(10, 15, 20)[d]);
      return {
        prompt: `√${n * n} =`,
        answer: n,
        steps: [`Ask: what number times itself makes ${n * n}?`, `${n} × ${n} = ${n * n}, so √${n * n} = ${n}`],
      };
    },
  },
  {
    id: "sci-notation-to-standard",
    name: "Scientific notation to standard form",
    hint: "Move the decimal point",
    ccss: "8.EE.A.3",
    grade: 8,
    cat: "number",
    space: 300,
    gen(rng, d) {
      const mantissa = rng.int(11, 99); // tenths: 1.1 – 9.9
      const power = rng.int(RANGE(2, 3, 4)[d], RANGE(4, 6, 8)[d]);
      const value = mantissa * 10 ** (power - 1);
      const mStr = mantissa % 10 === 0 ? String(mantissa / 10) : fromTenths(mantissa);
      return {
        prompt: `Write ${mStr} × 10^${power} in standard form.`,
        answer: value.toLocaleString(),
        steps: [
          `10^${power} means move the decimal point ${power} places to the right, adding zeros as needed`,
          `${mStr} becomes ${value.toLocaleString()}`,
        ],
      };
    },
  },
  {
    id: "sci-notation-ops",
    name: "Multiplying in scientific notation",
    hint: "Multiply the fronts, add the exponents",
    ccss: "8.EE.A.4",
    grade: 8,
    cat: "number",
    space: 400,
    gen(rng, d) {
      const a = rng.int(1, RANGE(3, 4, 4)[d]);
      const b = rng.int(1, RANGE(3, 2, 2)[d]);
      const p = rng.int(2, RANGE(4, 6, 9)[d]);
      const q = rng.int(2, RANGE(4, 6, 9)[d]);
      const front = a * b;
      const steps = [`Multiply the number parts: ${a} × ${b} = ${front}`, `Add the exponents: ${p} + ${q} = ${p + q}`];
      if (front >= 10) {
        steps.push(`${front} × 10^${p + q} is not in scientific notation yet: ${front} = ${fromTenths(front)} × 10, so ${fromTenths(front)} × 10^${p + q + 1}`);
        return {
          prompt: `(${a} × 10^${p}) × (${b} × 10^${q}) =`,
          answer: `${fromTenths(front)} × 10^${p + q + 1}`,
          steps,
        };
      }
      steps.push(`${front} × 10^${p + q}`);
      return { prompt: `(${a} × 10^${p}) × (${b} × 10^${q}) =`, answer: `${front} × 10^${p + q}`, steps };
    },
  },
  {
    id: "equation-with-distribution",
    name: "Equations with brackets",
    hint: "Distribute first",
    ccss: "8.EE.C.7.B",
    grade: 8,
    cat: "algebra",
    space: 2000,
    gen(rng, d) {
      const hi = RANGE(8, 12, 20)[d];
      const x = rng.int(1, hi);
      const a = rng.int(2, RANGE(5, 7, 9)[d]);
      const b = rng.int(1, hi);
      const total = a * (x + b);
      return {
        prompt: `Solve: ${a}(x + ${b}) = ${total}`,
        answer: x,
        steps: [
          `Distribute the ${a}: ${a}x + ${a * b} = ${total}`,
          `Subtract ${a * b} from both sides: ${a}x = ${total} − ${a * b} = ${a * x}`,
          `Divide both sides by ${a}: x = ${a * x} ÷ ${a} = ${x}`,
        ],
      };
    },
  },
  {
    id: "systems-substitution",
    name: "Systems by substitution",
    hint: "Both equations solved for y",
    ccss: "8.EE.C.8.B",
    grade: 8,
    cat: "algebra",
    space: 2000,
    gen(rng, d) {
      const hi = RANGE(5, 8, 12)[d];
      const x = rng.int(1, hi);
      const m1 = rng.int(1, RANGE(4, 6, 9)[d]);
      let m2 = rng.int(1, RANGE(4, 6, 9)[d]);
      if (m2 === m1) m2 += 1;
      const b1 = rng.int(-hi, hi);
      const y = m1 * x + b1;
      const b2 = y - m2 * x;
      const line = (m, b) => `y = ${m === 1 ? "" : m}x ${b >= 0 ? "+" : "−"} ${Math.abs(b)}`;
      const big = Math.max(m1, m2);
      const small = Math.min(m1, m2);
      const bBig = big === m1 ? b1 : b2;
      const bSmall = big === m1 ? b2 : b1;
      return {
        prompt: `Solve the system: ${line(m1, b1)} and ${line(m2, b2)}`,
        answer: `x = ${x}, y = ${y}`,
        steps: [
          `Both equal y, so set them equal: ${line(m1, b1).slice(4)} = ${line(m2, b2).slice(4)}`,
          `Get the x terms together: ${big} − ${small} = ${big - small}, so ${big - small === 1 ? "" : big - small}x = ${fmtSigned(bSmall)} − ${fmtSigned(bBig)} = ${bSmall - bBig}`,
          `x = ${fmtSigned(bSmall - bBig)} ÷ ${big - small} = ${x}`,
          `Put x back into the first equation: y = ${m1} × ${x} ${b1 >= 0 ? "+" : "−"} ${Math.abs(b1)} = ${y}`,
          `So x = ${x}, y = ${y}`,
        ],
      };
    },
  },
  {
    id: "function-from-table",
    name: "Linear functions from tables",
    hint: "Find the rate and the starting value",
    ccss: "8.F.B.4",
    grade: 8,
    cat: "algebra",
    space: 900,
    gen(rng, d) {
      const m = rng.int(1, RANGE(5, 8, 12)[d]) * (d === "hard" && rng.next() < 0.3 ? -1 : 1);
      const b = rng.int(-RANGE(5, 9, 15)[d], RANGE(5, 9, 15)[d]);
      const xs = [0, 1, 2, 3];
      const ys = xs.map((x) => m * x + b);
      const answer = `y = ${m === 1 ? "" : m === -1 ? "−" : m}x ${b >= 0 ? "+" : "−"} ${Math.abs(b)}`;
      return {
        prompt: `A table shows x = ${xs.join(", ")} and y = ${ys.join(", ")}. Write the equation of the line.`,
        answer,
        steps: [
          `Each time x goes up by 1, y changes by ${fmtSigned(ys[1])} − ${fmtSigned(ys[0])} = ${m}, so the slope is ${m}`,
          `When x = 0, y = ${b}, so the y-intercept is ${b}`,
          `Equation: ${answer}`,
        ],
      };
    },
  },
  {
    id: "parallel-lines-angles",
    name: "Parallel lines and a transversal",
    hint: "Corresponding, alternate, co-interior",
    ccss: "8.G.A.5",
    grade: 8,
    cat: "geometry",
    space: 500,
    gen(rng, d) {
      const a = rng.int(RANGE(30, 20, 11)[d], RANGE(150, 160, 169)[d]);
      const kind = rng.pick(RANGE(["corresponding", "alternate interior"], ["corresponding", "alternate interior", "co-interior"], ["corresponding", "alternate interior", "alternate exterior", "co-interior"])[d]);
      const equal = kind !== "co-interior";
      return {
        prompt: `Two parallel lines are cut by a transversal. One angle measures ${a}°. What is the measure of its ${kind} angle?`,
        answer: `${equal ? a : 180 - a}°`,
        steps: equal
          ? [`${kind[0].toUpperCase()}${kind.slice(1)} angles on parallel lines are equal`, `So it is ${a}°`]
          : [`Co-interior angles on parallel lines add up to 180°`, `180 − ${a} = ${180 - a}°`],
      };
    },
  },
  {
    id: "volume-cone-sphere",
    name: "Volume of cones and spheres",
    hint: "In terms of π",
    ccss: "8.G.C.9",
    grade: 8,
    cat: "geometry",
    space: 200,
    gen(rng, d) {
      const cone = rng.next() < 0.5;
      if (cone) {
        const r = rng.int(2, RANGE(4, 6, 9)[d]);
        const h = 3 * rng.int(1, RANGE(3, 4, 6)[d]);
        const v = (r * r * h) / 3;
        return {
          prompt: `A cone has a radius of ${r} cm and a height of ${h} cm. What is its volume, in terms of π?`,
          answer: `${v}π cm³`,
          steps: [
            `Volume of a cone = 1/3 × π × r² × h`,
            `r² = ${r * r}, and ${r * r} × ${h} = ${r * r * h}`,
            `${r * r * h} ÷ 3 = ${v}, so the volume is ${v}π cm³`,
          ],
        };
      }
      const r = 3 * rng.int(1, RANGE(2, 3, 4)[d]);
      const v = (4 * r * r * r) / 3;
      return {
        prompt: `A sphere has a radius of ${r} cm. What is its volume, in terms of π?`,
        answer: `${v}π cm³`,
        steps: [
          `Volume of a sphere = 4/3 × π × r³`,
          `r³ = ${r} × ${r} × ${r} = ${r ** 3}`,
          `4 × ${r ** 3} ÷ 3 = ${v}, so the volume is ${v}π cm³`,
        ],
      };
    },
  },
  {
    id: "estimate-sqrt",
    name: "Estimating square roots",
    hint: "Between which two whole numbers?",
    ccss: "8.NS.A.2",
    grade: 8,
    cat: "number",
    space: 100,
    gen(rng, d) {
      const k = rng.int(2, RANGE(8, 11, 15)[d]);
      const n = rng.int(k * k + 1, (k + 1) * (k + 1) - 1);
      return {
        prompt: `√${n} is between which two whole numbers?`,
        answer: `${k} and ${k + 1}`,
        steps: [
          `Find the perfect squares on either side: ${k}² = ${k * k} and ${k + 1}² = ${(k + 1) * (k + 1)}`,
          `${k * k} < ${n} < ${(k + 1) * (k + 1)}, so √${n} is between ${k} and ${k + 1}`,
        ],
      };
    },
  },
  {
    id: "repeating-decimal-fraction",
    name: "Repeating decimals as fractions",
    hint: "One or two repeating digits",
    ccss: "8.NS.A.1",
    grade: 8,
    cat: "fraction",
    space: 100,
    gen(rng, d) {
      const two = d !== "easy" && rng.next() < 0.5;
      if (two) {
        let n = rng.int(10, 98);
        while (n % 11 === 0) n = rng.int(10, 98); // 11, 22, … are really one repeating digit
        const [rn, rd] = reduce(n, 99);
        const digits = String(n).padStart(2, "0");
        return {
          prompt: `Write 0.${digits}${digits}… (repeating) as a fraction.`,
          answer: `${rn}/${rd}`,
          steps: [
            `Two repeating digits go over 99: ${n}/99`,
            ...simplifyStep(n, 99),
          ],
        };
      }
      const n = rng.int(1, 8);
      const [rn, rd] = reduce(n, 9);
      return {
        prompt: `Write 0.${n}${n}${n}… (repeating) as a fraction.`,
        answer: `${rn}/${rd}`,
        steps: [`One repeating digit goes over 9: ${n}/9`, ...simplifyStep(n, 9)],
      };
    },
  },
];
