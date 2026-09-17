/* Grade 1 skills. Each entry follows the rules in ../generators.js:
   the answer (and every step) comes from the numbers the generator
   already holds, problems are built backwards, no floats, seeded RNG. */

import { RANGE, clock, countBackSteps, countOnSteps } from "./helpers.js";

export default [
  {
    id: "add-within-20",
    name: "Adding within 20",
    hint: "Sums to 20",
    ccss: "1.OA.C.6",
    grade: 1,
    cat: "number",
    space: 210,
    gen(rng, d) {
      const hi = RANGE(10, 15, 20)[d];
      const a = rng.int(1, hi - 1);
      const b = rng.int(1, hi - a);
      return { prompt: `${a} + ${b} =`, answer: a + b, steps: countOnSteps(a, b) };
    },
  },
  {
    id: "sub-within-20",
    name: "Subtracting within 20",
    hint: "Answers stay positive",
    ccss: "1.OA.C.6",
    grade: 1,
    cat: "number",
    space: 210,
    gen(rng, d) {
      const hi = RANGE(10, 15, 20)[d];
      const a = rng.int(2, hi);
      const b = rng.int(1, a);
      return { prompt: `${a} − ${b} =`, answer: a - b, steps: countBackSteps(a, b) };
    },
  },
  {
    id: "missing-addend",
    name: "Missing addend",
    hint: "What goes in the blank",
    ccss: "1.OA.D.8",
    grade: 1,
    cat: "number",
    space: 190,
    gen(rng, d) {
      const hi = RANGE(10, 15, 20)[d];
      const total = rng.int(3, hi);
      const a = rng.int(1, total - 1);
      return {
        prompt: `${a} + ____ = ${total}`,
        answer: total - a,
        steps: [
          `Ask: ${a} and how many more make ${total}?`,
          `Take ${a} away from ${total}: ${total} − ${a} = ${total - a}`,
        ],
      };
    },
  },
  {
    id: "ten-more-less",
    name: "Ten more, ten less",
    hint: "Mental arithmetic",
    ccss: "1.NBT.C.5",
    grade: 1,
    cat: "number",
    space: 180,
    gen(rng, d) {
      const hi = RANGE(50, 80, 99)[d];
      const n = rng.int(11, hi - 10);
      const more = rng.next() < 0.5;
      return {
        prompt: `What is ten ${more ? "more" : "less"} than ${n}?`,
        answer: more ? n + 10 : n - 10,
        steps: more
          ? [`Ten more moves the tens digit up by 1 and leaves the ones alone: ${n} + 10 = ${n + 10}`]
          : [`Ten less moves the tens digit down by 1 and leaves the ones alone: ${n} − 10 = ${n - 10}`],
      };
    },
  },
  {
    id: "add-tens",
    name: "Adding multiples of ten",
    hint: "Whole tens only",
    ccss: "1.NBT.C.4",
    grade: 1,
    cat: "number",
    space: 45,
    gen(rng, d) {
      const hi = RANGE(5, 7, 9)[d];
      const a = rng.int(1, hi);
      const b = rng.int(1, Math.max(1, 10 - a));
      return {
        prompt: `${a * 10} + ${b * 10} =`,
        answer: (a + b) * 10,
        steps: [
          `${a * 10} is ${a} tens and ${b * 10} is ${b} tens`,
          `${a} tens + ${b} tens = ${a + b} tens, which is ${(a + b) * 10}`,
        ],
      };
    },
  },
  {
    id: "time-hour",
    name: "Telling time to the hour",
    hint: "Whole and half hours",
    ccss: "1.MD.B.3",
    grade: 1,
    cat: "geometry",
    space: 24,
    gen(rng, d) {
      const h = rng.int(1, 12);
      const half = d !== "easy" && rng.next() < 0.5;
      const later = rng.int(1, 4);
      const mm = half ? "30" : "00";
      const h2 = ((h + later - 1) % 12) + 1;
      const steps = [`The minutes stay at :${mm}; only the hour changes`];
      if (h + later > 12) {
        steps.push(`${h} + ${later} = ${h + later}, but a clock starts over after 12: ${h + later} − 12 = ${h2}`);
      } else {
        steps.push(`Move the hour forward ${later}: ${h} + ${later} = ${h2}`);
      }
      steps.push(`New time: ${h2}:${mm}`);
      return {
        prompt: `It is ${h}:${mm}. What time is it ${later} ${later === 1 ? "hour" : "hours"} later?`,
        answer: `${h2}:${mm}`,
        steps,
      };
    },
  },
  {
    id: "add-sub-word-within-20",
    name: "Addition and subtraction stories",
    hint: "Word problems within 20",
    ccss: "1.OA.A.1",
    grade: 1,
    cat: "word",
    space: 380,
    gen(rng, d) {
      const hi = RANGE(10, 15, 20)[d];
      if (rng.next() < 0.5) {
        const a = rng.int(1, hi - 1);
        const b = rng.int(1, hi - a);
        return {
          prompt: `There are ${a} birds in a tree. ${b} more ${b === 1 ? "bird lands" : "birds land"} on it. How many birds are there now?`,
          answer: a + b,
          steps: [`"More birds land" means add: ${a} + ${b} = ${a + b}`],
        };
      }
      const a = rng.int(2, hi);
      const b = rng.int(1, a - 1);
      return {
        prompt: `There are ${a} apples in a basket. ${b} ${b === 1 ? "is" : "are"} eaten. How many apples are left?`,
        answer: a - b,
        steps: [`"Are eaten" means take away: ${a} − ${b} = ${a - b}`],
      };
    },
  },
  {
    id: "partition-halves-fourths",
    name: "Halves and fourths",
    hint: "Equal shares of a shape",
    ccss: "1.G.A.3",
    grade: 1,
    cat: "fraction",
    space: 2,
    gen(rng) {
      const [n, name] = rng.pick([[2, "half"], [4, "fourth"]]);
      return {
        prompt: `A shape is split into ${n} equal shares. What is each share called?`,
        answer: `a ${name}`,
        steps: [`${n} equal shares means each share is 1 out of ${n}: a ${name}`],
      };
    },
  },
  {
    id: "tens-and-ones",
    name: "Tens and ones",
    hint: "How many tens, how many ones",
    ccss: "1.NBT.B.2",
    grade: 1,
    cat: "number",
    space: 89,
    gen(rng, d) {
      const hi = RANGE(49, 79, 99)[d];
      const n = rng.int(11, hi);
      const tens = Math.floor(n / 10);
      const ones = n % 10;
      return {
        prompt: `${n} = ____ tens and ____ ones`,
        answer: `${tens} tens and ${ones} ones`,
        steps: [
          `The first digit counts the tens: ${tens} tens = ${tens * 10}`,
          `The last digit counts the ones: ${ones}`,
          `${n} = ${tens} tens and ${ones} ones`,
        ],
      };
    },
  },
  {
    id: "compare-2digit",
    name: "Comparing 2-digit numbers",
    hint: "Use < or >",
    ccss: "1.NBT.B.3",
    grade: 1,
    cat: "number",
    space: 2000,
    gen(rng, d) {
      const hi = RANGE(50, 80, 99)[d];
      let a = rng.int(10, hi);
      let b = rng.int(10, hi);
      if (a === b) b = b === hi ? b - 1 : b + 1;
      const sign = a > b ? ">" : "<";
      const ta = Math.floor(a / 10);
      const tb = Math.floor(b / 10);
      const steps = ta !== tb
        ? [`Compare the tens first: ${ta} tens and ${tb} tens, so ${Math.max(a, b)} is bigger`]
        : [`Both have ${ta} tens, so compare the ones: ${a % 10} and ${b % 10}, so ${Math.max(a, b)} is bigger`];
      steps.push(`The open side of the sign faces the bigger number: ${sign}`);
      return { prompt: `${a} ____ ${b}`, answer: sign, steps };
    },
  },
  {
    id: "add-2digit-1digit",
    name: "Add a 1-digit number to a 2-digit number",
    hint: "No regrouping needed",
    ccss: "1.NBT.C.4",
    grade: 1,
    cat: "number",
    space: 300,
    gen(rng, d) {
      const hi = RANGE(40, 70, 90)[d];
      const tens = 10 * rng.int(1, Math.floor(hi / 10));
      const ones = rng.int(0, 8);
      const b = rng.int(1, 9 - ones);
      const a = tens + ones;
      return {
        prompt: `${a} + ${b} =`,
        answer: a + b,
        steps: [
          `Only the ones change: ${ones} + ${b} = ${ones + b}`,
          `Keep the ${tens}: ${tens} + ${ones + b} = ${a + b}`,
        ],
      };
    },
  },
  {
    id: "sub-tens",
    name: "Subtracting tens",
    hint: "Multiples of 10",
    ccss: "1.NBT.C.6",
    grade: 1,
    cat: "number",
    space: 36,
    gen(rng, d) {
      const hi = RANGE(6, 8, 9)[d];
      const a = rng.int(2, hi);
      const b = rng.int(1, a - 1);
      return {
        prompt: `${a * 10} − ${b * 10} =`,
        answer: (a - b) * 10,
        steps: [
          `${a * 10} is ${a} tens and ${b * 10} is ${b} tens`,
          `${a} tens − ${b} tens = ${a - b} tens, which is ${(a - b) * 10}`,
        ],
      };
    },
  },
  {
    id: "fact-family",
    name: "Fact families",
    hint: "Use addition to solve subtraction",
    ccss: "1.OA.B.4",
    grade: 1,
    cat: "number",
    space: 150,
    gen(rng, d) {
      const hi = RANGE(10, 15, 20)[d];
      const total = rng.int(3, hi);
      const a = rng.int(1, total - 1);
      const b = total - a;
      const askA = rng.next() < 0.5;
      const known = askA ? b : a;
      const missing = askA ? a : b;
      return {
        prompt: `If ${a} + ${b} = ${total}, then ${total} − ${known} = ____`,
        answer: missing,
        steps: [
          `${a}, ${b} and ${total} are a fact family: the same three numbers in every fact`,
          `Take ${known} away from ${total} and the other part is left: ${total} − ${known} = ${missing}`,
        ],
      };
    },
  },
  {
    id: "doubles",
    name: "Doubles and near doubles",
    hint: "6 + 6, then 6 + 7",
    ccss: "1.OA.C.6",
    grade: 1,
    cat: "number",
    space: 30,
    gen(rng, d) {
      const hi = RANGE(5, 8, 10)[d];
      const a = rng.int(1, hi);
      const near = d !== "easy" && rng.next() < 0.5;
      if (near) {
        return {
          prompt: `${a} + ${a + 1} =`,
          answer: 2 * a + 1,
          steps: [`Use the double: ${a} + ${a} = ${2 * a}`, `Then one more: ${2 * a} + 1 = ${2 * a + 1}`],
        };
      }
      return { prompt: `${a} + ${a} =`, answer: 2 * a, steps: [`Double ${a}: ${a} + ${a} = ${2 * a}`] };
    },
  },
  {
    id: "true-false-equation",
    name: "True or false equations",
    hint: "Does the equals sign hold?",
    ccss: "1.OA.D.7",
    grade: 1,
    cat: "number",
    space: 400,
    gen(rng, d) {
      const hi = RANGE(10, 15, 20)[d];
      const a = rng.int(1, hi - 1);
      const b = rng.int(1, hi - a);
      const isTrue = rng.next() < 0.5;
      const shown = isTrue ? a + b : a + b + rng.pick([-2, -1, 1, 2]);
      return {
        prompt: `True or false? ${shown} = ${a} + ${b}`,
        answer: isTrue ? "true" : "false",
        steps: [
          `Work out the right side: ${a} + ${b} = ${a + b}`,
          isTrue ? `${shown} is the same as ${a + b}, so it is true` : `${shown} is not ${a + b}, so it is false`,
        ],
      };
    },
  },
];
