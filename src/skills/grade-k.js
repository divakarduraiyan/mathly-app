/* Kindergarten skills. Each entry follows the rules in ../generators.js:
   the answer (and every step) comes from the numbers the generator
   already holds, problems are built backwards, no floats, seeded RNG. */

import { RANGE, countBackSteps, countOnSteps } from "./helpers.js";

export default [
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
        prompt: `There are ${a} ducks on the pond. ${b} more ${b === 1 ? "duck joins" : "ducks join"} them. How many ducks are there now?`,
        answer: a + b,
        steps: [`"More ducks join" means add: ${a} + ${b} = ${a + b}`],
      };
    },
  },
  {
    id: "number-bonds",
    name: "Number bonds",
    hint: "Break a number into two parts",
    ccss: "K.OA.A.3",
    grade: 0,
    cat: "number",
    space: 40,
    gen(rng, d) {
      const hi = RANGE(5, 8, 10)[d];
      const total = rng.int(2, hi);
      const part = rng.int(1, total - 1);
      return {
        prompt: `${total} = ${part} + ____`,
        answer: total - part,
        steps: [`Ask: ${part} and how many more make ${total}? Count up from ${part} to ${total}: ${total - part}`],
      };
    },
  },
  {
    id: "sub-word-within-10",
    name: "Take-away word problems",
    hint: "Subtraction within 10",
    ccss: "K.OA.A.2",
    grade: 0,
    cat: "word",
    space: 45,
    gen(rng, d) {
      const hi = RANGE(5, 8, 10)[d];
      const a = rng.int(2, hi);
      const b = rng.int(1, a - 1);
      const [thing, went, wentOne] = rng.pick([
        ["balloons", "float away", "floats away"],
        ["cookies", "are eaten", "is eaten"],
        ["frogs", "hop away", "hops away"],
        ["cars", "drive off", "drives off"],
      ]);
      const verb = b === 1 ? wentOne : went;
      return {
        prompt: `There are ${a} ${thing}. ${b} ${verb}. How many are left?`,
        answer: a - b,
        steps: [`"${verb[0].toUpperCase()}${verb.slice(1)}" means take away: ${a} − ${b} = ${a - b}`],
      };
    },
  },
  {
    id: "order-numbers-10",
    name: "Ordering numbers",
    hint: "Smallest to largest",
    ccss: "K.CC.C.7",
    grade: 0,
    cat: "number",
    space: 120,
    gen(rng, d) {
      const hi = RANGE(10, 15, 20)[d];
      const set = new Set();
      while (set.size < 3) set.add(rng.int(0, hi));
      const nums = [...set];
      const sorted = nums.slice().sort((x, y) => x - y);
      return {
        prompt: `Put in order from smallest to largest: ${nums.join(", ")}`,
        answer: sorted.join(", "),
        steps: [
          `The smallest is ${sorted[0]}, then ${sorted[1]}, and the biggest is ${sorted[2]}`,
          `In order: ${sorted.join(", ")}`,
        ],
      };
    },
  },
  {
    id: "count-by-tens",
    name: "Counting by tens",
    hint: "10, 20, 30, …",
    ccss: "K.CC.A.1",
    grade: 0,
    cat: "number",
    space: 8,
    gen(rng) {
      const start = 10 * rng.int(1, 7);
      return {
        prompt: `${start}, ${start + 10}, ${start + 20}, ____`,
        answer: start + 30,
        steps: [`Counting by tens, each number is 10 more: ${start + 20} + 10 = ${start + 30}`],
      };
    },
  },
  {
    id: "one-more-less",
    name: "One more, one less",
    hint: "The number just after or before",
    ccss: "K.CC.B.4.C",
    grade: 0,
    cat: "number",
    space: 40,
    gen(rng, d) {
      const hi = RANGE(9, 15, 20)[d];
      const n = rng.int(1, hi);
      const more = rng.next() < 0.5;
      return {
        prompt: `What is one ${more ? "more" : "less"} than ${n}?`,
        answer: more ? n + 1 : n - 1,
        steps: [more ? `One more is the next number when counting: ${n + 1}` : `One less is the number just before ${n}: ${n - 1}`],
      };
    },
  },
];
