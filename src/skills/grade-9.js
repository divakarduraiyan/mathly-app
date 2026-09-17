/* Grade 9 — Algebra I skills. Each entry follows the rules in ../generators.js:
   the answer (and every step) comes from the numbers the generator
   already holds, problems are built backwards, no floats, seeded RNG. */

import { RANGE, fmtSigned, gcd, polyStr, reduce } from "./helpers.js";

export default [
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
  {
    id: "literal-equation",
    name: "Literal equations",
    hint: "Solve a formula for one variable",
    ccss: "HSA-CED.A.4",
    grade: 9,
    cat: "algebra",
    space: 8,
    gen(rng) {
      const formulas = [
        ["P = 2l + 2w", "w", "w = (P − 2l)/2", "Subtract 2l from both sides: P − 2l = 2w", "Divide both sides by 2: w = (P − 2l)/2"],
        ["A = lw", "w", "w = A/l", "w is multiplied by l", "Divide both sides by l: w = A/l"],
        ["d = rt", "t", "t = d/r", "t is multiplied by r", "Divide both sides by r: t = d/r"],
        ["y = mx + b", "x", "x = (y − b)/m", "Subtract b from both sides: y − b = mx", "Divide both sides by m: x = (y − b)/m"],
        ["C = 2πr", "r", "r = C/(2π)", "r is multiplied by 2π", "Divide both sides by 2π: r = C/(2π)"],
        ["V = lwh", "h", "h = V/(lw)", "h is multiplied by lw", "Divide both sides by lw: h = V/(lw)"],
        ["F = 9C/5 + 32", "C", "C = 5(F − 32)/9", "Subtract 32 from both sides: F − 32 = 9C/5", "Multiply by 5 and divide by 9: C = 5(F − 32)/9"],
        ["A = (b × h)/2", "h", "h = 2A/b", "Multiply both sides by 2: 2A = bh", "Divide both sides by b: h = 2A/b"],
      ];
      const [formula, target, answer, s1, s2] = rng.pick(formulas);
      return {
        prompt: `Solve ${formula} for ${target}.`,
        answer,
        steps: [s1, s2],
      };
    },
  },
  {
    id: "inequality-solve",
    name: "Solving inequalities",
    hint: "Flip the sign when dividing by a negative",
    ccss: "HSA-REI.B.3",
    grade: 9,
    cat: "algebra",
    space: 3000,
    gen(rng, d) {
      const hi = RANGE(8, 12, 20)[d];
      const x = rng.int(-hi, hi) || 2;
      const a = rng.int(2, RANGE(5, 8, 12)[d]) * (d !== "easy" && rng.next() < 0.5 ? -1 : 1);
      const b = rng.int(1, hi);
      const sign = rng.pick(["<", ">", "≤", "≥"]);
      const flipped = { "<": ">", ">": "<", "≤": "≥", "≥": "≤" }[sign];
      const rhs = a * x - b;
      const finalSign = a < 0 ? flipped : sign;
      const answer = `x ${finalSign} ${x}`;
      return {
        prompt: `Solve: ${a}x − ${b} ${sign} ${rhs}`,
        answer,
        steps: [
          `Add ${b} to both sides: ${a}x ${sign} ${fmtSigned(rhs)} + ${b}, so ${a}x ${sign} ${a * x}`,
          a < 0
            ? `Divide both sides by ${a} — a negative, so the sign flips: x ${finalSign} ${fmtSigned(a * x)} ÷ ${fmtSigned(a)}, so ${answer}`
            : `Divide both sides by ${a} (positive, sign stays): x ${sign} ${fmtSigned(a * x)} ÷ ${a}, so ${answer}`,
        ],
      };
    },
  },
  {
    id: "compound-inequality",
    name: "Compound inequalities",
    hint: "Do the same to all three parts",
    ccss: "HSA-REI.B.3",
    grade: 9,
    cat: "algebra",
    space: 3000,
    gen(rng, d) {
      const hi = RANGE(8, 12, 20)[d];
      const lo = rng.int(-hi, hi - 2);
      const up = rng.int(lo + 1, hi);
      const b = rng.int(1, hi);
      const a = d === "easy" ? 1 : rng.int(1, RANGE(1, 3, 5)[d]);
      const left = a * lo + b;
      const right = a * up + b;
      const mid = `${a === 1 ? "" : a}x + ${b}`;
      const steps = [`Subtract ${b} from all three parts: ${fmtSigned(left)} − ${b} < ${a === 1 ? "x" : `${a}x`} < ${fmtSigned(right)} − ${b}, so ${a * lo} < ${a === 1 ? "x" : `${a}x`} < ${a * up}`];
      if (a !== 1) steps.push(`Divide all three parts by ${a}: ${lo} < x < ${up}`);
      return {
        prompt: `Solve: ${left} < ${mid} < ${right}`,
        answer: `${lo} < x < ${up}`,
        steps,
      };
    },
  },
  {
    id: "absolute-value-equation",
    name: "Absolute value equations",
    hint: "Two cases",
    ccss: "HSA-REI.B.3",
    grade: 9,
    cat: "algebra",
    space: 900,
    gen(rng, d) {
      const hi = RANGE(6, 10, 15)[d];
      const c = rng.int(-hi, hi);
      const r = rng.int(1, hi);
      const inner = c === 0 ? "x" : `x ${c > 0 ? "−" : "+"} ${Math.abs(c)}`;
      const x1 = c - r;
      const x2 = c + r;
      return {
        prompt: `Solve: |${inner}| = ${r}`,
        answer: `x = ${x1}, ${x2}`,
        steps: [
          `The inside can be ${r} or −${r}: ${inner} = ${r} or ${inner} = −${r}`,
          `Case 1: x = ${r} ${c >= 0 ? "+" : "−"} ${Math.abs(c)} = ${x2}`,
          `Case 2: x = ${fmtSigned(-r)} ${c >= 0 ? "+" : "−"} ${Math.abs(c)} = ${x1}`,
          `So x = ${x1}, ${x2}`,
        ],
      };
    },
  },
  {
    id: "arithmetic-sequence",
    name: "Arithmetic sequences",
    hint: "Find a later term",
    ccss: "HSF-BF.A.2",
    grade: 9,
    cat: "algebra",
    space: 3000,
    gen(rng, d) {
      const first = rng.int(-RANGE(5, 10, 20)[d], RANGE(10, 20, 30)[d]);
      const diff = rng.int(1, RANGE(5, 9, 12)[d]) * (d === "hard" && rng.next() < 0.3 ? -1 : 1);
      const n = rng.int(RANGE(6, 10, 15)[d], RANGE(10, 20, 50)[d]);
      const term = first + (n - 1) * diff;
      const seq = [first, first + diff, first + 2 * diff, first + 3 * diff];
      return {
        prompt: `Find the ${n}th term of the sequence ${seq.join(", ")}, …`,
        answer: term,
        steps: [
          `The common difference is ${fmtSigned(seq[1])} − ${fmtSigned(seq[0])} = ${diff}`,
          `The ${n}th term is the first term plus ${n - 1} jumps: ${n} − 1 = ${n - 1}, and ${n - 1} × ${fmtSigned(diff)} = ${(n - 1) * diff}`,
          `${fmtSigned(first)} + ${fmtSigned((n - 1) * diff)} = ${term}`,
        ],
      };
    },
  },
  {
    id: "geometric-sequence",
    name: "Geometric sequences",
    hint: "Multiply by the same ratio",
    ccss: "HSF-BF.A.2",
    grade: 9,
    cat: "algebra",
    space: 400,
    gen(rng, d) {
      const first = rng.int(1, RANGE(5, 8, 12)[d]);
      const ratio = rng.pick(RANGE([2], [2, 3], [2, 3, 4, 5])[d]);
      const n = rng.int(4, RANGE(5, 6, 7)[d]);
      const term = first * ratio ** (n - 1);
      const seq = [first, first * ratio, first * ratio * ratio];
      return {
        prompt: `Find the ${n}th term of the sequence ${seq.join(", ")}, …`,
        answer: term,
        steps: [
          `The common ratio is ${seq[1]} ÷ ${seq[0]} = ${ratio}`,
          `The ${n}th term is the first term times the ratio ${n - 1} times: ${ratio}^${n - 1} = ${ratio ** (n - 1)}`,
          `${first} × ${ratio ** (n - 1)} = ${term}`,
        ],
      };
    },
  },
  {
    id: "exponential-growth",
    name: "Exponential growth and decay",
    hint: "Repeated doubling or halving",
    ccss: "HSF-LE.A.2",
    grade: 9,
    cat: "word",
    space: 500,
    gen(rng, d) {
      const years = rng.int(2, RANGE(3, 4, 5)[d]);
      const factor = rng.pick(RANGE([2], [2, 3], [2, 3, 4])[d]);
      const grow = d === "easy" || rng.next() < 0.6;
      if (grow) {
        const start = rng.int(2, RANGE(10, 20, 50)[d]) * 10;
        const end = start * factor ** years;
        return {
          prompt: `A colony of ${start} bacteria ${factor === 2 ? "doubles" : `grows ${factor} times bigger`} every hour. How many are there after ${years} hours?`,
          answer: end.toLocaleString(),
          steps: [
            `Multiply by ${factor} once for each hour: ${factor}^${years} = ${factor ** years}`,
            `${start} × ${factor ** years} = ${end.toLocaleString()}`,
          ],
        };
      }
      const end = rng.int(2, RANGE(10, 20, 50)[d]) * 5;
      const start = end * factor ** years;
      return {
        prompt: `A sample of ${start.toLocaleString()} grams ${factor === 2 ? "halves" : `shrinks to 1/${factor} of its size`} every day. How much is left after ${years} days?`,
        answer: `${end} grams`,
        steps: [
          `Divide by ${factor} once for each day: ${factor}^${years} = ${factor ** years}`,
          `${start.toLocaleString()} ÷ ${factor ** years} = ${end} grams`,
        ],
      };
    },
  },
  {
    id: "point-slope-form",
    name: "Point-slope form",
    hint: "y − y₁ = m(x − x₁)",
    ccss: "HSF-LE.A.2",
    grade: 9,
    cat: "algebra",
    space: 2000,
    gen(rng, d) {
      const hi = RANGE(6, 9, 12)[d];
      const m = rng.int(-hi, hi) || 2;
      const x1 = rng.int(-hi, hi);
      const y1 = rng.int(-hi, hi);
      const yPart = y1 === 0 ? "y" : `y ${y1 > 0 ? "−" : "+"} ${Math.abs(y1)}`;
      const xPart = x1 === 0 ? "x" : `x ${x1 > 0 ? "−" : "+"} ${Math.abs(x1)}`;
      const answer = `${yPart} = ${m}(${xPart})`;
      return {
        prompt: `Write the equation in point-slope form of the line with slope ${m} through (${x1}, ${y1}).`,
        answer,
        steps: [
          `Point-slope form is y − y1 = m(x − x1)`,
          `Put in m = ${m}, x1 = ${x1}, y1 = ${y1}${x1 < 0 || y1 < 0 ? " — subtracting a negative becomes a plus" : ""}`,
          `Equation: ${answer}`,
        ],
      };
    },
  },
  {
    id: "parallel-perpendicular-slope",
    name: "Parallel and perpendicular slopes",
    hint: "Same slope, or negative reciprocal",
    ccss: "HSG-GPE.B.5",
    grade: 9,
    cat: "algebra",
    space: 400,
    gen(rng, d) {
      const hi = RANGE(5, 8, 12)[d];
      const perpendicular = rng.next() < 0.5;
      const useFraction = d !== "easy" && rng.next() < 0.4;
      const num = rng.int(1, hi) * (rng.next() < 0.5 ? -1 : 1);
      const den = useFraction ? rng.int(2, 5) : 1;
      const mStr = den === 1 ? `${num}` : `${num}/${den}`;
      const b = rng.int(-hi, hi);
      const line = `y = ${mStr}x ${b >= 0 ? "+" : "−"} ${Math.abs(b)}`;
      if (!perpendicular) {
        return {
          prompt: `What is the slope of a line parallel to ${line}?`,
          answer: mStr,
          steps: [`Parallel lines have the same slope`, `The slope of ${line} is ${mStr}, so the answer is ${mStr}`],
        };
      }
      // Negative reciprocal: −den/num, reduced and with the sign on top.
      const [rn, rd] = reduce(den, Math.abs(num));
      const sign = num > 0 ? "-" : "";
      const answer = rd === 1 ? `${sign}${rn}` : `${sign}${rn}/${rd}`;
      return {
        prompt: `What is the slope of a line perpendicular to ${line}?`,
        answer,
        steps: [
          `Perpendicular slopes are negative reciprocals: flip the fraction and change the sign`,
          `The slope is ${mStr}; flipped it is ${den}/${Math.abs(num)}${num < 0 ? " (dropping the minus)" : ""}, so the answer is ${answer}`,
        ],
      };
    },
  },
  {
    id: "systems-elimination",
    name: "Systems by elimination",
    hint: "Multiply, then add or subtract",
    ccss: "HSA-REI.C.5",
    grade: 9,
    cat: "algebra",
    space: 3000,
    gen(rng, d) {
      const hi = RANGE(5, 8, 12)[d];
      const x = rng.int(-hi, hi) || 1;
      const y = rng.int(-hi, hi) || 2;
      const a1 = rng.int(1, RANGE(3, 4, 6)[d]);
      const b1 = rng.int(1, RANGE(3, 4, 6)[d]);
      const a2 = rng.int(1, RANGE(3, 4, 6)[d]);
      let b2 = rng.int(1, RANGE(3, 4, 6)[d]);
      if (a1 * b2 === a2 * b1) b2 += 1;
      const c1 = a1 * x + b1 * y;
      const c2 = a2 * x + b2 * y;
      const eq = (a, b, c) => `${a === 1 ? "" : a}x + ${b === 1 ? "" : b}y = ${c}`;
      // Eliminate y: multiply the first by b2 and the second by b1, then subtract.
      const m1 = b2;
      const m2 = b1;
      const xCoef = a1 * m1 - a2 * m2;
      const rhs = c1 * m1 - c2 * m2;
      return {
        prompt: `Solve the system: ${eq(a1, b1, c1)} and ${eq(a2, b2, c2)}`,
        answer: `x = ${x}, y = ${y}`,
        steps: [
          m1 === 1 && m2 === 1
            ? `The y terms already match: ${eq(a1, b1, c1)} and ${eq(a2, b2, c2)}`
            : `Match the y terms: multiply the first equation by ${m1}${m2 === 1 ? " (the second stays)" : ` and the second by ${m2}`}: ${eq(a1 * m1, b1 * m1, c1 * m1)} and ${eq(a2 * m2, b2 * m2, c2 * m2)}`,
          `Subtract to eliminate y: ${a1 * m1} − ${a2 * m2} = ${xCoef}, so ${xCoef}x = ${fmtSigned(c1 * m1)} − ${fmtSigned(c2 * m2)} = ${rhs}`,
          `x = ${fmtSigned(rhs)} ÷ ${fmtSigned(xCoef)} = ${x}`,
          `Put x into the first equation: ${a1} × ${fmtSigned(x)} + ${b1 === 1 ? "" : b1}y = ${c1}, so ${b1 === 1 ? "" : b1}y = ${fmtSigned(c1)} − ${fmtSigned(a1 * x)} = ${b1 * y}${b1 === 1 ? "" : `, and y = ${y}`}`,
          `So x = ${x}, y = ${y}`,
        ],
      };
    },
  },
  {
    id: "systems-word",
    name: "Systems word problems",
    hint: "Two unknowns, two facts",
    ccss: "HSA-CED.A.3",
    grade: 9,
    cat: "word",
    space: 2000,
    gen(rng, d) {
      const adults = rng.int(1, RANGE(6, 9, 15)[d]);
      const children = rng.int(1, RANGE(6, 9, 15)[d]);
      const pa = rng.int(RANGE(5, 6, 8)[d], RANGE(9, 12, 20)[d]);
      let pc = rng.int(2, pa - 1);
      const total = adults + children;
      const money = adults * pa + children * pc;
      return {
        prompt: `Adult tickets cost $${pa} and child tickets cost $${pc}. ${total} tickets were sold for $${money}. How many adult tickets were sold?`,
        answer: adults,
        steps: [
          `Let a = adults and c = children: a + c = ${total} and ${pa}a + ${pc}c = ${money}`,
          `If all ${total} were child tickets: ${total} × ${pc} = ${total * pc}`,
          `The extra money comes from adults: ${money} − ${total * pc} = ${money - total * pc}, and each adult adds ${pa} − ${pc} = ${pa - pc}`,
          `Adults: ${money - total * pc} ÷ ${pa - pc} = ${adults}`,
        ],
      };
    },
  },
  {
    id: "quadratic-formula",
    name: "Quadratic formula",
    hint: "Discriminant is a perfect square",
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
      const disc = b * b - 4 * c;
      const root = Math.abs(r1 - r2);
      const roots = [r1, r2].sort((p, q) => p - q);
      return {
        prompt: `Use the quadratic formula to solve: ${polyStr([1, b, c])} = 0`,
        answer: `x = ${roots[0]}, ${roots[1]}`,
        steps: [
          `a = 1, b = ${b}, c = ${c}`,
          `Discriminant: b² − 4ac = ${b * b} − ${fmtSigned(4 * c)} = ${disc}, and √${disc} = ${root}`,
          `x = (−b ± √${disc}) ÷ 2a = (${-b} ± ${root}) ÷ 2`,
          `x = ${-b + root} ÷ 2 = ${(-b + root) / 2} or x = ${-b - root} ÷ 2 = ${(-b - root) / 2}, so x = ${roots[0]}, ${roots[1]}`,
        ],
      };
    },
  },
  {
    id: "vertex-of-parabola",
    name: "Vertex of a parabola",
    hint: "x = −b/2a, then substitute",
    ccss: "HSF-IF.C.8.A",
    grade: 9,
    cat: "algebra",
    space: 400,
    gen(rng, d) {
      const hi = RANGE(4, 6, 9)[d];
      const h = rng.int(-hi, hi);
      const k = rng.int(-hi, hi);
      // y = (x − h)² + k = x² − 2hx + (h² + k)
      const b = -2 * h;
      const c = h * h + k;
      return {
        prompt: `Find the vertex of y = ${polyStr([1, b, c])}`,
        answer: `(${h}, ${k})`,
        steps: [
          `The x-coordinate of the vertex is −b ÷ 2a = ${-b} ÷ 2 = ${h}`,
          `Substitute x = ${h}: ${fmtSigned(h)}² ${b >= 0 ? "+" : "−"} ${Math.abs(b)} × ${fmtSigned(h)} ${c >= 0 ? "+" : "−"} ${Math.abs(c)} = ${h * h} ${b * h >= 0 ? "+" : "−"} ${Math.abs(b * h)} ${c >= 0 ? "+" : "−"} ${Math.abs(c)} = ${k}`,
          `Vertex: (${h}, ${k})`,
        ],
      };
    },
  },
  {
    id: "difference-of-squares",
    name: "Difference of squares",
    hint: "a² − b² = (a − b)(a + b)",
    ccss: "HSA-SSE.A.2",
    grade: 9,
    cat: "algebra",
    space: 30,
    gen(rng, d) {
      const n = rng.int(1, RANGE(6, 10, 15)[d]);
      const coef = d === "hard" && rng.next() < 0.4 ? rng.pick([4, 9]) : 1;
      const a = Math.sqrt(coef);
      const xTerm = coef === 1 ? "x" : `${a}x`;
      const answer = `(${xTerm} − ${n})(${xTerm} + ${n})`;
      return {
        prompt: `Factor: ${coef === 1 ? "" : coef}x² − ${n * n}`,
        answer,
        steps: [
          `Both terms are perfect squares: ${coef === 1 ? "x²" : `${coef}x² = (${a}x)²`} and ${n * n} = ${n}²`,
          `a² − b² = (a − b)(a + b), so ${answer}`,
        ],
      };
    },
  },
  {
    id: "factor-a-not-1",
    name: "Factoring with a leading coefficient",
    hint: "ax² + bx + c with a > 1",
    ccss: "HSA-SSE.B.3.A",
    grade: 9,
    cat: "algebra",
    space: 600,
    gen(rng, d) {
      const hi = RANGE(3, 5, 7)[d];
      // (px + q)(rx + s), with p = 1 kept out so a > 1.
      const p = rng.int(2, hi);
      const r = rng.int(1, hi);
      let q = rng.int(-hi, hi) || 1;
      let s = rng.int(-hi, hi) || 1;
      // Keep each bracket free of a common factor so the whole thing has none.
      while (gcd(p, Math.abs(q)) !== 1) q += q > 0 ? 1 : -1;
      while (gcd(r, Math.abs(s)) !== 1) s += s > 0 ? 1 : -1;
      const a = p * r;
      const b = p * s + q * r;
      const c = q * s;
      const bin = (m, n) => `(${m === 1 ? "" : m}x ${n >= 0 ? "+" : "−"} ${Math.abs(n)})`;
      const answer = `${bin(p, q)}${bin(r, s)}`;
      return {
        prompt: `Factor: ${polyStr([a, b, c])}`,
        answer,
        steps: [
          `Look for two numbers that multiply to a × c = ${a} × ${fmtSigned(c)} = ${a * c} and add to b = ${b}: ${p * s} and ${q * r}`,
          `Split the middle term: ${polyStr([a, p * s, 0]).replace(/ \+ 0$| − 0$/, "")} ${q * r >= 0 ? "+" : "−"} ${Math.abs(q * r)}x ${c >= 0 ? "+" : "−"} ${Math.abs(c)}`,
          `Group and factor each pair: ${p === 1 ? "x" : `${p}x`}(${r === 1 ? "x" : `${r}x`} ${s >= 0 ? "+" : "−"} ${Math.abs(s)}) ${q >= 0 ? "+" : "−"} ${Math.abs(q)}(${r === 1 ? "x" : `${r}x`} ${s >= 0 ? "+" : "−"} ${Math.abs(s)})`,
          `Factor out the common bracket: ${answer}`,
        ],
      };
    },
  },
  {
    id: "polynomial-add-sub",
    name: "Adding and subtracting polynomials",
    hint: "Combine like terms by degree",
    ccss: "HSA-APR.A.1",
    grade: 9,
    cat: "algebra",
    space: 3000,
    gen(rng, d) {
      const hi = RANGE(5, 8, 12)[d];
      const A = [rng.int(1, hi), rng.int(-hi, hi), rng.int(-hi, hi)];
      const B = [rng.int(1, hi), rng.int(-hi, hi), rng.int(-hi, hi)];
      const sub = rng.next() < 0.5;
      const R = A.map((v, i) => (sub ? v - B[i] : v + B[i]));
      const answer = polyStr(R);
      return {
        prompt: `Simplify: (${polyStr(A)}) ${sub ? "−" : "+"} (${polyStr(B)})`,
        answer,
        steps: [
          sub ? `Subtracting the second bracket flips every sign in it: ${polyStr(A)} ${polyStr(B.map((v) => -v)).replace(/^−/, "− ")}` : `Drop the brackets: ${polyStr(A)} + ${polyStr(B)}`,
          `x² terms: ${A[0]} ${sub ? "−" : "+"} ${B[0]} = ${R[0]}; x terms: ${fmtSigned(A[1])} ${sub ? "−" : "+"} ${fmtSigned(B[1])} = ${R[1]}; numbers: ${fmtSigned(A[2])} ${sub ? "−" : "+"} ${fmtSigned(B[2])} = ${R[2]}`,
          `Simplified: ${answer}`,
        ],
      };
    },
  },
  {
    id: "polynomial-multiply",
    name: "Multiplying a binomial by a trinomial",
    hint: "Every term times every term",
    ccss: "HSA-APR.A.1",
    grade: 9,
    cat: "algebra",
    space: 3000,
    gen(rng, d) {
      const hi = RANGE(3, 5, 7)[d];
      const a = rng.int(-hi, hi) || 1;
      const p = rng.int(1, RANGE(1, 2, 3)[d]);
      const q = rng.int(-hi, hi) || 2;
      const r = rng.int(-hi, hi) || 1;
      // (x + a)(px² + qx + r) = px³ + (q + ap)x² + (r + aq)x + ar
      const R = [p, q + a * p, r + a * q, a * r];
      const answer = polyStr(R);
      const tri = polyStr([p, q, r]);
      return {
        prompt: `Multiply: (x ${a >= 0 ? "+" : "−"} ${Math.abs(a)})(${tri})`,
        answer,
        steps: [
          `x times each term: ${polyStr([p, q, r, 0]).replace(/ [+−] 0$/, "")}`,
          `${fmtSigned(a)} times each term: ${polyStr([a * p, a * q, a * r])}`,
          `Add like terms: x² terms ${fmtSigned(q)} + ${fmtSigned(a * p)} = ${R[1]}; x terms ${fmtSigned(r)} + ${fmtSigned(a * q)} = ${R[2]}`,
          `Product: ${answer}`,
        ],
      };
    },
  },
  {
    id: "rational-exponents",
    name: "Rational and negative exponents",
    hint: "8^(2/3) and 4^(−1/2)",
    ccss: "HSN-RN.A.2",
    grade: 9,
    cat: "number",
    space: 40,
    gen(rng, d) {
      const bases = RANGE([[4, 2], [9, 3], [8, 2]], [[4, 2], [9, 3], [8, 2], [27, 3], [16, 2]], [[4, 2], [9, 3], [8, 2], [27, 3], [16, 2], [25, 5], [32, 2], [64, 4]])[d];
      const [base, root] = rng.pick(bases);
      const rootIndex = Math.round(Math.log(base) / Math.log(root));
      let power = rng.int(1, RANGE(2, 3, 3)[d]);
      if (power === rootIndex) power = rootIndex - 1; // 8^(3/3) is just 8
      const negative = d !== "easy" && rng.next() < 0.4;
      const value = root ** power;
      const rootWord = rootIndex === 2 ? "square root" : rootIndex === 3 ? "cube root" : `${rootIndex}th root`;
      if (negative) {
        return {
          prompt: `Evaluate: ${base}^(−${power}/${rootIndex})`,
          answer: `1/${value}`,
          steps: [
            `The negative sign means "1 over": 1 ÷ ${base}^(${power}/${rootIndex})`,
            `The ${rootWord} of ${base} is ${root}, and ${root}^${power} = ${value}`,
            `So the answer is 1/${value}`,
          ],
        };
      }
      return {
        prompt: `Evaluate: ${base}^(${power}/${rootIndex})`,
        answer: value,
        steps: [
          `The bottom of the exponent is a root, the top is a power: take the ${rootWord} first`,
          `The ${rootWord} of ${base} is ${root}, and ${root}^${power} = ${value}`,
        ],
      };
    },
  },
  {
    id: "radical-ops",
    name: "Adding and multiplying radicals",
    hint: "Simplify, then combine like radicals",
    ccss: "HSN-RN.A.2",
    grade: 9,
    cat: "number",
    space: 200,
    gen(rng, d) {
      const m = rng.pick(RANGE([2, 3], [2, 3, 5], [2, 3, 5, 6, 7])[d]);
      const add = rng.next() < 0.5;
      if (add) {
        const k1 = rng.int(1, RANGE(3, 4, 6)[d]);
        const k2 = rng.int(1, RANGE(3, 4, 6)[d]);
        const n1 = k1 * k1 * m;
        const n2 = k2 * k2 * m;
        return {
          prompt: `Simplify: √${n1} + √${n2}`,
          answer: `${k1 + k2}·√${m}`,
          steps: [
            `Simplify each: √${n1} = ${k1}·√${m} and √${n2} = ${k2}·√${m}`,
            `Same radical, so add the numbers in front: ${k1} + ${k2} = ${k1 + k2}, giving ${k1 + k2}·√${m}`,
          ],
        };
      }
      const k = rng.int(2, RANGE(3, 5, 8)[d]);
      const n1 = m;
      const n2 = m * k * k;
      return {
        prompt: `Simplify: √${n1} × √${n2}`,
        answer: m * k,
        steps: [
          `Multiply under one root: √(${n1} × ${n2}) = √${n1 * n2}`,
          `${n1 * n2} = ${m * k}², so √${n1 * n2} = ${m * k}`,
        ],
      };
    },
  },
  {
    id: "direct-variation",
    name: "Direct variation",
    hint: "y = kx",
    ccss: "HSA-CED.A.2",
    grade: 9,
    cat: "algebra",
    space: 900,
    gen(rng, d) {
      const k = rng.int(2, RANGE(5, 9, 12)[d]);
      const x1 = rng.int(2, RANGE(6, 9, 12)[d]);
      let x2 = rng.int(2, RANGE(9, 12, 20)[d]);
      if (x2 === x1) x2 += 1;
      return {
        prompt: `y varies directly with x. When x = ${x1}, y = ${k * x1}. Find y when x = ${x2}.`,
        answer: k * x2,
        steps: [
          `Direct variation means y = kx. Find k: ${k * x1} ÷ ${x1} = ${k}`,
          `Use it: y = ${k} × ${x2} = ${k * x2}`,
        ],
      };
    },
  },
];
