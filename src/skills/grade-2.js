/* Grade 2 skills. Each entry follows the rules in ../generators.js:
   the answer (and every step) comes from the numbers the generator
   already holds, problems are built backwards, no floats, seeded RNG. */

import { RANGE, addByPlaceSteps, clock, dollars, placeParts, subtractByPlaceSteps } from "./helpers.js";

export default [
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
  {
    id: "add-within-1000",
    name: "Adding within 1000",
    hint: "Three-digit numbers",
    ccss: "2.NBT.B.7",
    grade: 2,
    cat: "number",
    space: 3000,
    gen(rng, d) {
      const hi = RANGE(300, 600, 900)[d];
      const a = rng.int(100, hi);
      const b = rng.int(10, Math.max(10, 999 - a));
      return { prompt: `${a} + ${b} =`, answer: a + b, steps: addByPlaceSteps(a, b) };
    },
  },
  {
    id: "sub-within-1000",
    name: "Subtracting within 1000",
    hint: "Three-digit numbers",
    ccss: "2.NBT.B.7",
    grade: 2,
    cat: "number",
    space: 3000,
    gen(rng, d) {
      const hi = RANGE(300, 600, 999)[d];
      const a = rng.int(120, hi);
      const b = rng.int(10, a - 10);
      return { prompt: `${a} − ${b} =`, answer: a - b, steps: subtractByPlaceSteps(a, b) };
    },
  },
  {
    id: "compare-3digit",
    name: "Comparing 3-digit numbers",
    hint: "Use <, > or =",
    ccss: "2.NBT.A.4",
    grade: 2,
    cat: "number",
    space: 3000,
    gen(rng, d) {
      const hi = RANGE(500, 800, 999)[d];
      const a = rng.int(100, hi);
      // Hard sheets sometimes share the hundreds digit so the tens decide.
      let b = d === "hard" && rng.next() < 0.5 ? a - (a % 100) + rng.int(0, 99) : rng.int(100, hi);
      if (rng.next() < 0.15) b = a;
      const sign = a > b ? ">" : a < b ? "<" : "=";
      const ha = Math.floor(a / 100);
      const hb = Math.floor(b / 100);
      const steps = [];
      if (a === b) steps.push(`Every digit matches, so the numbers are equal`);
      else if (ha !== hb) steps.push(`Compare the hundreds first: ${ha} and ${hb}, so ${Math.max(a, b)} is bigger`);
      else steps.push(`Same hundreds, so look at the tens and ones: ${a % 100} and ${b % 100}, so ${Math.max(a, b)} is bigger`);
      steps.push(`Sign: ${sign}`);
      return { prompt: `${a} ____ ${b}`, answer: sign, steps };
    },
  },
  {
    id: "expanded-form",
    name: "Expanded form",
    hint: "Hundreds + tens + ones",
    ccss: "2.NBT.A.3",
    grade: 2,
    cat: "number",
    space: 800,
    gen(rng, d) {
      const hi = RANGE(500, 800, 999)[d];
      const n = rng.int(111, hi);
      const parts = placeParts(n).filter((x) => x > 0);
      return {
        prompt: `Write ${n} in expanded form.`,
        answer: parts.join(" + "),
        steps: [
          `${n} has ${Math.floor(n / 100)} hundreds, ${Math.floor((n % 100) / 10)} tens and ${n % 10} ones`,
          `Write each place as a number: ${parts.join(" + ")}`,
        ],
      };
    },
  },
  {
    id: "odd-even",
    name: "Odd or even",
    hint: "Look at the ones digit",
    ccss: "2.OA.C.3",
    grade: 2,
    cat: "number",
    space: 100,
    gen(rng, d) {
      const hi = RANGE(20, 50, 100)[d];
      const n = rng.int(1, hi);
      const even = n % 2 === 0;
      return {
        prompt: `Is ${n} odd or even?`,
        answer: even ? "even" : "odd",
        steps: [
          `Only the ones digit matters: it is ${n % 10}`,
          even ? `0, 2, 4, 6 and 8 are even, so ${n} is even` : `1, 3, 5, 7 and 9 are odd, so ${n} is odd`,
        ],
      };
    },
  },
  {
    id: "array-repeated-addition",
    name: "Arrays as repeated addition",
    hint: "Rows of equal groups",
    ccss: "2.OA.C.4",
    grade: 2,
    cat: "word",
    space: 100,
    gen(rng, d) {
      const hi = RANGE(3, 4, 5)[d];
      const rows = rng.int(2, hi);
      const per = rng.int(2, 5);
      const thing = rng.pick(["chairs", "stickers", "eggs", "tiles", "stamps"]);
      const sum = Array(rows).fill(per).join(" + ");
      return {
        prompt: `There are ${rows} rows of ${thing} with ${per} in each row. How many ${thing} are there?`,
        answer: rows * per,
        steps: [`Add ${per} once for each row: ${sum} = ${rows * per}`],
      };
    },
  },
  {
    id: "mental-10-100",
    name: "10 or 100 more and less",
    hint: "Change just one digit",
    ccss: "2.NBT.B.8",
    grade: 2,
    cat: "number",
    space: 1500,
    gen(rng, d) {
      const hi = RANGE(500, 800, 899)[d];
      const n = rng.int(111, hi);
      const amount = d === "easy" ? 10 : rng.pick([10, 100]);
      const more = rng.next() < 0.5;
      const result = more ? n + amount : n - amount;
      const digit = amount === 10 ? "tens" : "hundreds";
      return {
        prompt: `What is ${amount} ${more ? "more" : "less"} than ${n}?`,
        answer: result,
        steps: [`Only the ${digit} digit changes, by 1: ${n} ${more ? "+" : "−"} ${amount} = ${result}`],
      };
    },
  },
  {
    id: "money-dollars-cents",
    name: "Dollars and cents",
    hint: "Bills and coins together",
    ccss: "2.MD.C.8",
    grade: 2,
    cat: "word",
    space: 500,
    gen(rng, d) {
      const bills = rng.int(1, RANGE(3, 5, 9)[d]);
      const quarters = rng.int(1, 3);
      const dimes = rng.int(0, RANGE(2, 4, 4)[d]);
      const cents = bills * 100 + quarters * 25 + dimes * 10;
      const parts = [`${bills} dollar${bills > 1 ? "s" : ""}`, `${quarters} quarter${quarters > 1 ? "s" : ""}`];
      if (dimes) parts.push(`${dimes} dime${dimes > 1 ? "s" : ""}`);
      const steps = [`Quarters: ${quarters} × 25 = ${quarters * 25}¢`];
      const coinCents = quarters * 25 + dimes * 10;
      if (dimes) {
        steps.push(`Dimes: ${dimes} × 10 = ${dimes * 10}¢`);
        steps.push(`Coins together: ${quarters * 25} + ${dimes * 10} = ${coinCents}¢`);
      }
      steps.push(`${bills} dollar${bills > 1 ? "s" : ""} and ${coinCents}¢ is ${dollars(cents)}`);
      return {
        prompt: `Maya has ${parts.join(", ")}. How much money is that?`,
        answer: dollars(cents),
        steps,
      };
    },
  },
  {
    id: "two-step-word-100",
    name: "Two-step word problems",
    hint: "Add and subtract within 100",
    ccss: "2.OA.A.1",
    grade: 2,
    cat: "word",
    space: 2000,
    gen(rng, d) {
      const hi = RANGE(30, 60, 90)[d];
      const start = rng.int(15, hi);
      const gave = rng.int(3, Math.max(3, Math.floor(start / 2)));
      const got = rng.int(2, 20);
      const thing = rng.pick(["marbles", "stickers", "cards", "shells"]);
      return {
        prompt: `Leo had ${start} ${thing}. He gave away ${gave}, then got ${got} more. How many does he have now?`,
        answer: start - gave + got,
        steps: [
          `First the give-away: ${start} − ${gave} = ${start - gave}`,
          `Then the ones he got: ${start - gave} + ${got} = ${start - gave + got}`,
        ],
      };
    },
  },
  {
    id: "time-5-minutes",
    name: "Time to five minutes",
    hint: "Read the hands in words",
    ccss: "2.MD.C.7",
    grade: 2,
    cat: "geometry",
    space: 132,
    gen(rng, d) {
      const h = rng.int(1, 12);
      const tick = rng.int(1, RANGE(6, 11, 11)[d]);
      const m = tick * 5;
      return {
        prompt: `On a clock the hour hand is just past the ${h} and the minute hand points at the ${tick}. What time is it?`,
        answer: clock(h, m),
        steps: [
          `The hour hand just past the ${h} means the hour is ${h}`,
          `Each number on the clock is 5 minutes, so ${tick} × 5 = ${m} minutes`,
          `Time: ${clock(h, m)}`,
        ],
      };
    },
  },
  {
    id: "missing-number-100",
    name: "Missing numbers in equations",
    hint: "Find the number that makes it true",
    ccss: "2.NBT.B.5",
    grade: 2,
    cat: "number",
    space: 2000,
    gen(rng, d) {
      const hi = RANGE(40, 70, 99)[d];
      const total = rng.int(20, hi);
      const known = rng.int(5, total - 5);
      const missing = total - known;
      const first = rng.next() < 0.5;
      return {
        prompt: first ? `____ + ${known} = ${total}` : `${known} + ____ = ${total}`,
        answer: missing,
        steps: [
          `Ask: ${known} and how many more make ${total}?`,
          `Take ${known} away from ${total}: ${total} − ${known} = ${missing}`,
        ],
      };
    },
  },
];
