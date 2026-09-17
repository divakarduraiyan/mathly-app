/* Grade 3 skills. Each entry follows the rules in ../generators.js:
   the answer (and every step) comes from the numbers the generator
   already holds, problems are built backwards, no floats, seeded RNG. */

import { RANGE, addByPlaceSteps, clock, subtractByPlaceSteps } from "./helpers.js";

export default [
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
    id: "unknown-factor",
    name: "Unknown factors",
    hint: "4 × ___ = 28",
    ccss: "3.OA.A.4",
    grade: 3,
    cat: "number",
    space: 120,
    gen(rng, d) {
      const [lo, hi] = RANGE([2, 5], [2, 9], [3, 12])[d];
      const a = rng.int(lo, hi);
      const b = rng.int(lo, hi);
      return {
        prompt: `${a} × ____ = ${a * b}`,
        answer: b,
        steps: [
          `Ask: ${a} times what makes ${a * b}? That is the same as ${a * b} ÷ ${a}`,
          `${a * b} ÷ ${a} = ${b}`,
        ],
      };
    },
  },
  {
    id: "div-word",
    name: "Division word problems",
    hint: "Sharing equally",
    ccss: "3.OA.A.3",
    grade: 3,
    cat: "word",
    space: 300,
    gen(rng, d) {
      const [lo, hi] = RANGE([2, 5], [2, 9], [3, 12])[d];
      const groups = rng.int(lo, hi);
      const each = rng.int(lo, hi);
      const total = groups * each;
      const [thing, who] = rng.pick([["cookies", "friends"], ["stickers", "students"], ["grapes", "bowls"], ["pencils", "boxes"]]);
      return {
        prompt: `${total} ${thing} are shared equally among ${groups} ${who}. How many does each get?`,
        answer: each,
        steps: [
          `Sharing equally means divide: ${total} ÷ ${groups}`,
          `${groups} × ${each} = ${total}, so ${total} ÷ ${groups} = ${each}`,
        ],
      };
    },
  },
  {
    id: "two-step-word-3",
    name: "Two-step word problems",
    hint: "Multiply, then add or subtract",
    ccss: "3.OA.D.8",
    grade: 3,
    cat: "word",
    space: 2000,
    gen(rng, d) {
      const hi = RANGE(6, 9, 12)[d];
      const packs = rng.int(2, hi);
      const per = rng.int(3, hi);
      const total = packs * per;
      const change = rng.int(2, Math.max(2, Math.floor(total / 2)));
      const gives = rng.next() < 0.5;
      const thing = rng.pick(["pencils", "muffins", "cards", "erasers"]);
      return {
        prompt: gives
          ? `Ava buys ${packs} packs of ${thing} with ${per} in each pack, then gives away ${change}. How many does she have left?`
          : `Ava buys ${packs} packs of ${thing} with ${per} in each pack. She already had ${change}. How many does she have now?`,
        answer: gives ? total - change : total + change,
        steps: [
          `First find how many she bought: ${packs} × ${per} = ${total}`,
          gives ? `Then take away the ones given: ${total} − ${change} = ${total - change}` : `Then add the ones she had: ${total} + ${change} = ${total + change}`,
        ],
      };
    },
  },
  {
    id: "round-10-100",
    name: "Rounding to 10 and 100",
    hint: "Look at the digit to the right",
    ccss: "3.NBT.A.1",
    grade: 3,
    cat: "number",
    space: 900,
    gen(rng, d) {
      const place = d === "easy" ? 10 : rng.pick([10, 100]);
      const n = rng.int(RANGE(21, 101, 301)[d], RANGE(199, 599, 999)[d]);
      const checkDigit = Math.floor(n / (place / 10)) % 10;
      const below = Math.floor(n / place) * place;
      const rounded = checkDigit >= 5 ? below + place : below;
      return {
        prompt: `Round ${n} to the nearest ${place === 10 ? "ten" : "hundred"}.`,
        answer: rounded,
        steps: [
          `${n} is between ${below} and ${below + place}`,
          `Look at the ${place === 10 ? "ones" : "tens"} digit: it is ${checkDigit}`,
          checkDigit >= 5 ? `${checkDigit} is 5 or more, so round up: ${rounded}` : `${checkDigit} is less than 5, so round down: ${rounded}`,
        ],
      };
    },
  },
  {
    id: "mult-multiples-of-10",
    name: "Multiplying by tens",
    hint: "4 × 60",
    ccss: "3.NBT.A.3",
    grade: 3,
    cat: "number",
    space: 80,
    gen(rng, d) {
      const hi = RANGE(5, 9, 9)[d];
      const a = rng.int(2, hi);
      const b = rng.int(2, hi);
      return {
        prompt: `${a} × ${b * 10} =`,
        answer: a * b * 10,
        steps: [
          `${b * 10} is ${b} tens, so ${a} × ${b} = ${a * b} tens`,
          `${a * b} tens = ${a * b * 10}`,
        ],
      };
    },
  },
  {
    id: "compare-fractions-3",
    name: "Comparing fractions",
    hint: "Same denominator or same numerator",
    ccss: "3.NF.A.3.D",
    grade: 3,
    cat: "fraction",
    space: 120,
    gen(rng, d) {
      const dens = RANGE([2, 3, 4], [2, 3, 4, 6, 8], [3, 4, 6, 8, 10, 12])[d];
      const sameDen = d === "easy" || rng.next() < 0.5;
      if (sameDen) {
        const den = rng.pick(dens);
        let n1 = rng.int(1, den - 1);
        let n2 = rng.int(1, den - 1);
        if (n1 === n2) n2 = n2 === den - 1 ? n2 - 1 : n2 + 1;
        if (n1 === n2) n1 = n1 + 1;
        const sign = n1 > n2 ? ">" : "<";
        return {
          prompt: `${n1}/${den} ____ ${n2}/${den}`,
          answer: sign,
          steps: [
            `Same-size pieces (${den}ths), so more pieces is more: ${Math.max(n1, n2)} pieces beats ${Math.min(n1, n2)}`,
            `Sign: ${sign}`,
          ],
        };
      }
      let d1 = rng.pick(dens);
      let d2 = rng.pick(dens);
      if (d1 === d2) d2 = dens[(dens.indexOf(d1) + 1) % dens.length];
      const lo = Math.min(d1, d2);
      const num = rng.int(1, Math.min(3, lo - 1));
      const sign = d1 < d2 ? ">" : "<";
      return {
        prompt: `${num}/${d1} ____ ${num}/${d2}`,
        answer: sign,
        steps: [
          `Same number of pieces, so the bigger pieces win: cutting into ${lo} makes bigger pieces than cutting into ${Math.max(d1, d2)}`,
          `Sign: ${sign}`,
        ],
      };
    },
  },
  {
    id: "equivalent-fractions-3",
    name: "Simple equivalent fractions",
    hint: "Halves, thirds, fourths and their doubles",
    ccss: "3.NF.A.3.B",
    grade: 3,
    cat: "fraction",
    space: 30,
    gen(rng, d) {
      const den = rng.pick(RANGE([2, 3], [2, 3, 4], [2, 3, 4, 5])[d]);
      const num = rng.int(1, den - 1);
      const k = rng.pick(RANGE([2], [2, 3], [2, 3, 4])[d]);
      const askNum = rng.next() < 0.5;
      return askNum
        ? {
            prompt: `${num}/${den} = ____/${den * k}`,
            answer: num * k,
            steps: [
              `The bottom was multiplied by ${k}: ${den} × ${k} = ${den * k}`,
              `Do the same to the top: ${num} × ${k} = ${num * k}`,
            ],
          }
        : {
            prompt: `${num}/${den} = ${num * k}/____`,
            answer: den * k,
            steps: [
              `The top was multiplied by ${k}: ${num} × ${k} = ${num * k}`,
              `Do the same to the bottom: ${den} × ${k} = ${den * k}`,
            ],
          };
    },
  },
  {
    id: "fractions-and-wholes",
    name: "Fractions equal to whole numbers",
    hint: "4/4 = 1, 8/4 = 2",
    ccss: "3.NF.A.3.C",
    grade: 3,
    cat: "fraction",
    space: 40,
    gen(rng, d) {
      const den = rng.pick(RANGE([2, 3, 4], [2, 3, 4, 6], [3, 4, 6, 8])[d]);
      const whole = rng.int(1, RANGE(1, 3, 4)[d]);
      const askWhole = rng.next() < 0.5;
      return askWhole
        ? {
            prompt: `${den * whole}/${den} = ____`,
            answer: whole,
            steps: [
              `${den}/${den} is one whole`,
              `${den * whole} ÷ ${den} = ${whole}`,
            ],
          }
        : {
            prompt: `${whole} = ____/${den}`,
            answer: den * whole,
            steps: [
              `Each whole is ${den}/${den}`,
              `${whole} wholes: ${whole} × ${den} = ${den * whole}`,
            ],
          };
    },
  },
  {
    id: "elapsed-time",
    name: "Elapsed time",
    hint: "Minutes later",
    ccss: "3.MD.A.1",
    grade: 3,
    cat: "geometry",
    space: 2000,
    gen(rng, d) {
      const h = rng.int(1, 11);
      const m = 5 * rng.int(0, 11);
      const later = 5 * rng.int(RANGE(2, 4, 7)[d], RANGE(6, 10, 11)[d]);
      const total = m + later;
      const h2 = total >= 60 ? h + 1 : h;
      const m2 = total % 60;
      const steps = [];
      if (total >= 60) {
        steps.push(`Minutes to the next hour: 60 − ${m} = ${60 - m}, so ${clock(h, m)} becomes ${clock(h + 1, 0)}`);
        steps.push(`Minutes still to add: ${later} − ${60 - m} = ${m2}`);
      } else {
        steps.push(`Add the minutes: ${m} + ${later} = ${total}, still in the same hour`);
      }
      steps.push(`New time: ${clock(h2, m2)}`);
      return {
        prompt: `A movie starts at ${clock(h, m)} and lasts ${later} minutes. What time does it end?`,
        answer: clock(h2, m2),
        steps,
      };
    },
  },
  {
    id: "perimeter-missing-side",
    name: "Perimeter with a missing side",
    hint: "Work backwards from the perimeter",
    ccss: "3.MD.D.8",
    grade: 3,
    cat: "geometry",
    space: 500,
    gen(rng, d) {
      const hi = RANGE(8, 14, 25)[d];
      const l = rng.int(3, hi);
      const w = rng.int(2, l);
      const per = 2 * (l + w);
      return {
        prompt: `A rectangle has a perimeter of ${per} cm and a length of ${l} cm. What is its width?`,
        answer: `${w} cm`,
        steps: [
          `Two lengths use up ${l} + ${l} = ${2 * l}`,
          `What is left is two widths: ${per} − ${2 * l} = ${2 * w}`,
          `One width: ${2 * w} ÷ 2 = ${w} cm`,
        ],
      };
    },
  },
  {
    id: "mass-volume-word",
    name: "Mass and volume problems",
    hint: "Grams, kilograms, litres",
    ccss: "3.MD.A.2",
    grade: 3,
    cat: "word",
    space: 600,
    gen(rng, d) {
      const hi = RANGE(6, 9, 12)[d];
      const n = rng.int(2, hi);
      const each = rng.pick(RANGE([100, 200, 250], [50, 150, 200, 250, 300], [75, 125, 150, 175, 225, 350])[d]);
      const [thing, plural, unit] = rng.pick([["apple", "apples", "g"], ["bottle", "bottles", "mL"], ["bag of rice", "bags of rice", "g"], ["cup of juice", "cups of juice", "mL"]]);
      return {
        prompt: `One ${thing} ${unit === "g" ? "weighs" : "holds"} ${each} ${unit}. How much do ${n} ${plural} ${unit === "g" ? "weigh" : "hold"} altogether?`,
        answer: `${n * each} ${unit}`,
        steps: [`${n} of the same amount means multiply: ${n} × ${each} = ${n * each} ${unit}`],
      };
    },
  },
];
