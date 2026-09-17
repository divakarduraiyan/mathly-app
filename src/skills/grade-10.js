/* Grade 10 — Geometry skills. Each entry follows the rules in ../generators.js:
   the answer (and every step) comes from the numbers the generator
   already holds, problems are built backwards, no floats, seeded RNG. */

import { RANGE, fmtSigned, fracStr, fromCents, reduce, simplifyStep } from "./helpers.js";

export default [
  {
    id: "triangle-angle-sum",
    name: "Triangle angle sum",
    hint: "Angles add to 180°",
    ccss: "HSG-CO.C.10",
    grade: 10,
    cat: "geometry",
    space: 2000,
    gen(rng, d) {
      const hi = RANGE(100, 140, 170)[d];
      const a = rng.int(20, hi - 40);
      const b = rng.int(20, hi - a);
      const c = 180 - a - b;
      return {
        prompt: `A triangle has angles of ${a}° and ${b}°. What is the measure of the third angle?`,
        answer: `${c}°`,
        steps: [
          `The three angles of a triangle add up to 180°`,
          `${a} + ${b} = ${a + b}`,
          `180 − ${a + b} = ${c}°`,
        ],
      };
    },
  },
  {
    id: "pythagorean-missing-leg",
    name: "Pythagorean theorem: missing leg",
    hint: "Subtract the squares",
    ccss: "HSG-SRT.C.8",
    grade: 10,
    cat: "geometry",
    space: 14,
    gen(rng, d) {
      const triples = [
        [3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [7, 24, 25], [9, 12, 15], [20, 21, 29],
      ];
      const pool = RANGE(triples.slice(0, 3), triples.slice(0, 5), triples)[d];
      const [a, b, c] = rng.pick(pool);
      const giveA = rng.next() < 0.5;
      const known = giveA ? a : b;
      const missing = giveA ? b : a;
      return {
        prompt: `A right triangle has a hypotenuse of ${c} and one leg of ${known}. What is the length of the other leg?`,
        answer: missing,
        steps: [
          `a² + b² = c², so the missing leg² = ${c}² − ${known}²`,
          `${c}² = ${c * c} and ${known}² = ${known * known}, so ${c * c} − ${known * known} = ${missing * missing}`,
          `Missing leg = √${missing * missing} = ${missing}`,
        ],
      };
    },
  },
  {
    id: "circle-area-symbolic",
    name: "Area of circles",
    hint: "Leave the answer in terms of π",
    ccss: "HSG-GMD.A.1",
    grade: 10,
    cat: "geometry",
    space: 40,
    gen(rng, d) {
      const hi = RANGE(6, 10, 15)[d];
      const r = rng.int(2, hi);
      return {
        prompt: `A circle has a radius of ${r} cm. What is its area, in terms of π?`,
        answer: `${r * r}π cm²`,
        steps: [`Area = π × r²`, `${r}² = ${r * r}, so the area is ${r * r}π cm²`],
      };
    },
  },
  {
    id: "similar-triangles",
    name: "Similar triangles",
    hint: "Scale every side the same way",
    ccss: "HSG-SRT.B.5",
    grade: 10,
    cat: "geometry",
    space: 35,
    gen(rng, d) {
      const bases = [[3, 4, 5], [2, 3, 4], [5, 6, 7], [4, 5, 6], [3, 5, 7]];
      const [s1, s2, s3] = rng.pick(bases);
      const k = rng.int(2, RANGE(3, 5, 8)[d]);
      return {
        prompt: `Two triangles are similar. The first has sides ${s1}, ${s2}, ${s3} (in the same units). The shortest side of the second triangle is ${s1 * k}. What is the second triangle's longest side?`,
        answer: s3 * k,
        steps: [
          `Find the scale factor from the shortest sides: ${s1 * k} ÷ ${s1} = ${k}`,
          `Similar triangles scale every side the same way, so longest side: ${s3} × ${k} = ${s3 * k}`,
        ],
      };
    },
  },
  {
    id: "volume-cylinder-symbolic",
    name: "Volume of cylinders",
    hint: "Leave the answer in terms of π",
    ccss: "HSG-GMD.A.3",
    grade: 10,
    cat: "geometry",
    space: 300,
    gen(rng, d) {
      const rhi = RANGE(3, 5, 8)[d];
      const hhi = RANGE(6, 10, 16)[d];
      const r = rng.int(2, rhi);
      const h = rng.int(3, hhi);
      return {
        prompt: `A cylinder has a radius of ${r} cm and a height of ${h} cm. What is its volume, in terms of π?`,
        answer: `${r * r * h}π cm³`,
        steps: [
          `Volume = π × r² × h`,
          `${r}² = ${r * r}`,
          `${r * r} × ${h} = ${r * r * h}, so the volume is ${r * r * h}π cm³`,
        ],
      };
    },
  },
  {
    id: "distance-formula",
    name: "Distance between two points",
    hint: "The Pythagorean theorem on a grid",
    ccss: "HSG-GPE.B.7",
    grade: 10,
    cat: "geometry",
    space: 60,
    gen(rng, d) {
      const triples = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [7, 24, 25]];
      const pool = RANGE(triples.slice(0, 2), triples.slice(0, 4), triples)[d];
      const [a, b, c] = rng.pick(pool);
      const x0 = rng.int(-5, 5);
      const y0 = rng.int(-5, 5);
      const signX = rng.next() < 0.5 ? 1 : -1;
      const signY = rng.next() < 0.5 ? 1 : -1;
      const x1 = x0 + signX * a;
      const y1 = y0 + signY * b;
      return {
        prompt: `Find the distance between (${x0}, ${y0}) and (${x1}, ${y1}).`,
        answer: c,
        steps: [
          `Change in x: ${fmtSigned(x1)} − ${fmtSigned(x0)} = ${signX * a}, a distance of ${a}`,
          `Change in y: ${fmtSigned(y1)} − ${fmtSigned(y0)} = ${signY * b}, a distance of ${b}`,
          `Distance² = ${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}`,
          `Distance = √${c * c} = ${c}`,
        ],
      };
    },
  },
  {
    id: "circle-equation",
    name: "Equation of a circle",
    hint: "(x − h)² + (y − k)² = r²",
    ccss: "HSG-GPE.A.1",
    grade: 10,
    cat: "algebra",
    space: 3000,
    gen(rng, d) {
      const hi = RANGE(6, 9, 12)[d];
      const h = rng.int(-hi, hi);
      const k = rng.int(-hi, hi);
      const r = rng.int(2, RANGE(5, 8, 12)[d]);
      const hTerm = h === 0 ? "x" : `x ${h > 0 ? "−" : "+"} ${Math.abs(h)}`;
      const kTerm = k === 0 ? "y" : `y ${k > 0 ? "−" : "+"} ${Math.abs(k)}`;
      const answer = `(${hTerm})² + (${kTerm})² = ${r * r}`;
      const steps = [
        `Standard form: (x − h)² + (y − k)² = r², with center (h, k)`,
        `h = ${h} and k = ${k}, so the brackets are (${hTerm}) and (${kTerm})${h < 0 || k < 0 ? " — subtracting a negative turns into a plus" : ""}`,
        `r² = ${r}² = ${r * r}`,
        `Equation: ${answer}`,
      ];
      return {
        prompt: `Write the equation of a circle with center (${h}, ${k}) and radius ${r}.`,
        answer,
        steps,
      };
    },
  },
  {
    id: "area-cost-word",
    name: "Area and cost word problems",
    hint: "Multiply area by price per square foot",
    ccss: "HSG-MG.A.1",
    grade: 10,
    cat: "word",
    space: 2000,
    gen(rng, d) {
      const hi = RANGE(8, 14, 22)[d];
      const l = rng.int(4, hi);
      const w = rng.int(4, hi);
      const priceCents = rng.int(150, 900);
      const totalCents = l * w * priceCents;
      return {
        prompt: `A rectangular room is ${l} ft by ${w} ft. Carpet costs $${fromCents(priceCents)} per square foot. What is the total cost?`,
        answer: `$${fromCents(totalCents)}`,
        steps: [
          `Area of the room: ${l} × ${w} = ${l * w} square feet`,
          `Cost = area × price per square foot: ${l * w} × $${fromCents(priceCents)} = $${fromCents(totalCents)}`,
        ],
      };
    },
  },
  {
    id: "polygon-angle-sum",
    name: "Polygon angle sums",
    hint: "(n − 2) × 180°",
    ccss: "HSG-CO.C.11",
    grade: 10,
    cat: "geometry",
    space: 40,
    gen(rng, d) {
      const names = { 3: "triangle", 4: "quadrilateral", 5: "pentagon", 6: "hexagon", 7: "heptagon", 8: "octagon", 9: "nonagon", 10: "decagon", 12: "12-sided polygon" };
      const sides = rng.pick(RANGE([4, 5, 6], [5, 6, 8, 10], [6, 7, 8, 9, 10, 12])[d]);
      const total = (sides - 2) * 180;
      // Only ask for a per-angle measure when it comes out whole.
      const options = ["sum"];
      if (total % sides === 0) options.push("interior");
      if (360 % sides === 0) options.push("exterior");
      const each = rng.pick(options);
      if (each === "sum") {
        return {
          prompt: `What is the sum of the interior angles of a ${names[sides]}?`,
          answer: `${total}°`,
          steps: [`A ${names[sides]} splits into ${sides} − 2 = ${sides - 2} triangles`, `${sides - 2} × 180 = ${total}°`],
        };
      }
      if (each === "interior") {
        return {
          prompt: `What is the measure of each interior angle of a regular ${names[sides]}?`,
          answer: `${total / sides}°`,
          steps: [`Angle sum: (${sides} − 2) × 180 = ${total}`, `Regular means all equal, so ${total} ÷ ${sides} = ${total / sides}°`],
        };
      }
      return {
        prompt: `What is the measure of each exterior angle of a regular ${names[sides]}?`,
        answer: `${360 / sides}°`,
        steps: [`Exterior angles of any polygon add up to 360°`, `Regular means all equal, so 360 ÷ ${sides} = ${360 / sides}°`],
      };
    },
  },
  {
    id: "triangle-inequality",
    name: "Triangle inequality",
    hint: "Can these sides make a triangle?",
    ccss: "HSG-CO.C.10",
    grade: 10,
    cat: "geometry",
    space: 900,
    gen(rng, d) {
      const hi = RANGE(9, 14, 20)[d];
      const a = rng.int(2, hi);
      const b = rng.int(a, hi);
      const rangeForm = d !== "easy" && rng.next() < 0.4;
      if (rangeForm) {
        return {
          prompt: `Two sides of a triangle are ${a} and ${b}. The third side must be between which two values?`,
          answer: `${b - a} and ${a + b}`,
          steps: [
            `Any side must be less than the sum of the other two: less than ${a} + ${b} = ${a + b}`,
            `And more than their difference: more than ${b} − ${a} = ${b - a}`,
            `So the third side is between ${b - a} and ${a + b}`,
          ],
        };
      }
      const works = rng.next() < 0.5;
      const c = works ? rng.int(b - a + 1, a + b - 1) : rng.int(a + b, a + b + 5);
      return {
        prompt: `Can sides of ${a}, ${b} and ${c} form a triangle?`,
        answer: works ? "yes" : "no",
        steps: [
          `The two shorter sides must add to more than the longest side`,
          works
            ? `${Math.min(a, b, c)} + ${[a, b, c].sort((p, q) => p - q)[1]} = ${a + b + c - Math.max(a, b, c)}, which is more than ${Math.max(a, b, c)}, so yes`
            : `${a} + ${b} = ${a + b}, which is not more than ${c}, so no`,
        ],
      };
    },
  },
  {
    id: "special-right-triangles",
    name: "Special right triangles",
    hint: "45-45-90 and 30-60-90",
    ccss: "HSG-SRT.C.8",
    grade: 10,
    cat: "geometry",
    space: 120,
    gen(rng, d) {
      const s = rng.int(2, RANGE(8, 12, 20)[d]);
      const kind = rng.pick(RANGE(["45"], ["45", "30h"], ["45", "30h", "30l"])[d]);
      if (kind === "45") {
        return {
          prompt: `A 45-45-90 triangle has legs of ${s}. What is the hypotenuse?`,
          answer: `${s}·√2`,
          steps: [`In a 45-45-90 triangle the hypotenuse is leg × √2`, `${s} × √2 = ${s}·√2`],
        };
      }
      if (kind === "30h") {
        return {
          prompt: `In a 30-60-90 triangle the short leg is ${s}. What is the hypotenuse?`,
          answer: 2 * s,
          steps: [`In a 30-60-90 triangle the hypotenuse is twice the short leg`, `2 × ${s} = ${2 * s}`],
        };
      }
      return {
        prompt: `In a 30-60-90 triangle the short leg is ${s}. What is the long leg?`,
        answer: `${s}·√3`,
        steps: [`In a 30-60-90 triangle the long leg is short leg × √3`, `${s} × √3 = ${s}·√3`],
      };
    },
  },
  {
    id: "trig-ratios",
    name: "Trigonometric ratios",
    hint: "SOH CAH TOA as a fraction",
    ccss: "HSG-SRT.C.6",
    grade: 10,
    cat: "geometry",
    space: 60,
    gen(rng, d) {
      const triples = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [7, 24, 25]];
      const pool = RANGE(triples.slice(0, 2), triples.slice(0, 4), triples)[d];
      const [a, b, c] = rng.pick(pool);
      const fn = rng.pick(["sin", "cos", "tan"]);
      const [num, den, words] = { sin: [a, c, "opposite ÷ hypotenuse"], cos: [b, c, "adjacent ÷ hypotenuse"], tan: [a, b, "opposite ÷ adjacent"] }[fn];
      const [rn, rd] = reduce(num, den);
      return {
        prompt: `A right triangle has legs ${a} and ${b} and hypotenuse ${c}. Angle A is opposite the side of length ${a}. Find ${fn} A as a fraction.`,
        answer: fracStr(rn, rd),
        steps: [
          `${fn} = ${words}`,
          `Opposite A is ${a}, adjacent to A is ${b}, hypotenuse is ${c}: ${fn} A = ${num}/${den}`,
          ...simplifyStep(num, den),
        ],
      };
    },
  },
  {
    id: "arc-sector",
    name: "Arc length and sector area",
    hint: "A fraction of the whole circle",
    ccss: "HSG-C.B.5",
    grade: 10,
    cat: "geometry",
    space: 200,
    gen(rng, d) {
      const angle = rng.pick(RANGE([90, 180], [60, 90, 120, 180], [30, 45, 60, 90, 120, 135, 180, 270])[d]);
      const [fn, fd] = reduce(angle, 360);
      const arc = rng.next() < 0.5;
      if (arc) {
        const r = fd * rng.int(1, RANGE(3, 4, 6)[d]);
        const len = (2 * r * fn) / fd;
        return {
          prompt: `A circle has a radius of ${r} cm. What is the length of an arc with a central angle of ${angle}°, in terms of π?`,
          answer: `${len}π cm`,
          steps: [
            `${angle}° is ${fn}/${fd} of the full 360°`,
            `Circumference: 2 × π × ${r} = ${2 * r}π`,
            `${fn}/${fd} of that: ${2 * r} × ${fn} ÷ ${fd} = ${len}, so ${len}π cm`,
          ],
        };
      }
      // r² has to be a multiple of fd for the sector area to be a whole number of π.
      let r0 = 1;
      while ((r0 * r0) % fd !== 0) r0 += 1;
      const r = r0 * rng.int(1, Math.max(1, Math.floor(RANGE(6, 9, 12)[d] / r0)));
      const r2 = r * r;
      const area = (r2 * fn) / fd;
      return {
        prompt: `A circle has a radius of ${r} cm. What is the area of a sector with a central angle of ${angle}°, in terms of π?`,
        answer: `${area}π cm²`,
        steps: [
          `${angle}° is ${fn}/${fd} of the full 360°`,
          `Whole area: π × ${r}² = ${r2}π`,
          `${fn}/${fd} of that: ${r2} × ${fn} ÷ ${fd} = ${area}, so ${area}π cm²`,
        ],
      };
    },
  },
  {
    id: "inscribed-angle",
    name: "Inscribed and central angles",
    hint: "Inscribed angle is half the arc",
    ccss: "HSG-C.A.2",
    grade: 10,
    cat: "geometry",
    space: 170,
    gen(rng, d) {
      const arc = 2 * rng.int(RANGE(15, 10, 5)[d], RANGE(80, 85, 89)[d]);
      const fromArc = rng.next() < 0.5;
      return fromArc
        ? {
            prompt: `An inscribed angle intercepts an arc of ${arc}°. What is the measure of the angle?`,
            answer: `${arc / 2}°`,
            steps: [`An inscribed angle is half its intercepted arc`, `${arc} ÷ 2 = ${arc / 2}°`],
          }
        : {
            prompt: `An inscribed angle measures ${arc / 2}°. What is the measure of the arc it intercepts?`,
            answer: `${arc}°`,
            steps: [`The intercepted arc is twice the inscribed angle`, `2 × ${arc / 2} = ${arc}°`],
          };
    },
  },
  {
    id: "midpoint-formula",
    name: "Midpoint of a segment",
    hint: "Average the coordinates",
    ccss: "HSG-GPE.B.6",
    grade: 10,
    cat: "geometry",
    space: 3000,
    gen(rng, d) {
      const hi = RANGE(6, 10, 15)[d];
      const mx = rng.int(-hi, hi);
      const my = rng.int(-hi, hi);
      const dx = rng.int(1, RANGE(3, 5, 8)[d]);
      const dy = rng.int(1, RANGE(3, 5, 8)[d]);
      const x1 = mx - dx;
      const x2 = mx + dx;
      const y1 = my - dy;
      const y2 = my + dy;
      return {
        prompt: `Find the midpoint of the segment from (${x1}, ${y1}) to (${x2}, ${y2}).`,
        answer: `(${mx}, ${my})`,
        steps: [
          `Average the x-coordinates: (${fmtSigned(x1)} + ${fmtSigned(x2)}) ÷ 2 = ${fmtSigned(x1 + x2)} ÷ 2 = ${mx}`,
          `Average the y-coordinates: (${fmtSigned(y1)} + ${fmtSigned(y2)}) ÷ 2 = ${fmtSigned(y1 + y2)} ÷ 2 = ${my}`,
          `Midpoint: (${mx}, ${my})`,
        ],
      };
    },
  },
  {
    id: "line-through-point",
    name: "Parallel or perpendicular line through a point",
    hint: "Find the slope, then b",
    ccss: "HSG-GPE.B.5",
    grade: 10,
    cat: "algebra",
    space: 2000,
    gen(rng, d) {
      const hi = RANGE(5, 8, 12)[d];
      const perpendicular = d !== "easy" && rng.next() < 0.4;
      const m0 = rng.int(1, RANGE(4, 6, 9)[d]) * (rng.next() < 0.5 ? -1 : 1);
      const b0 = rng.int(-hi, hi);
      const given = `y = ${m0}x ${b0 >= 0 ? "+" : "−"} ${Math.abs(b0)}`;
      // Perpendicular slope is −1/m0; keep it an integer by using m0 = ±1 there.
      const m = perpendicular ? (m0 > 0 ? -1 : 1) : m0;
      const x1 = rng.int(-hi, hi);
      const y1 = rng.int(-hi, hi);
      const b = y1 - m * x1;
      const mStr = m === 1 ? "" : m === -1 ? "−" : `${m}`;
      const answer = `y = ${mStr}x ${b >= 0 ? "+" : "−"} ${Math.abs(b)}`;
      const givenLine = perpendicular ? `y = ${m0 > 0 ? "" : "−"}x ${b0 >= 0 ? "+" : "−"} ${Math.abs(b0)}` : given;
      return {
        prompt: `Write the equation of the line ${perpendicular ? "perpendicular" : "parallel"} to ${givenLine} that passes through (${x1}, ${y1}).`,
        answer,
        steps: [
          perpendicular ? `Perpendicular slope is the negative reciprocal of ${m0 > 0 ? 1 : -1}: m = ${m}` : `Parallel lines share the slope: m = ${m}`,
          `Use the point to find b: ${y1} = ${fmtSigned(m)} × ${fmtSigned(x1)} + b, so b = ${fmtSigned(y1)} − ${fmtSigned(m * x1)} = ${b}`,
          `Equation: ${answer}`,
        ],
      };
    },
  },
  {
    id: "translation-rule",
    name: "Translations",
    hint: "(x, y) → (x + a, y + b)",
    ccss: "HSG-CO.A.2",
    grade: 10,
    cat: "geometry",
    space: 3000,
    gen(rng, d) {
      const hi = RANGE(5, 8, 12)[d];
      const x = rng.int(-hi, hi);
      const y = rng.int(-hi, hi);
      const a = rng.int(-hi, hi) || 3;
      const b = rng.int(-hi, hi) || -2;
      const rule = `(x, y) → (x ${a >= 0 ? "+" : "−"} ${Math.abs(a)}, y ${b >= 0 ? "+" : "−"} ${Math.abs(b)})`;
      return {
        prompt: `Apply the translation ${rule} to the point (${x}, ${y}).`,
        answer: `(${x + a}, ${y + b})`,
        steps: [
          `x: ${fmtSigned(x)} ${a >= 0 ? "+" : "−"} ${Math.abs(a)} = ${x + a}`,
          `y: ${fmtSigned(y)} ${b >= 0 ? "+" : "−"} ${Math.abs(b)} = ${y + b}`,
          `Image: (${x + a}, ${y + b})`,
        ],
      };
    },
  },
  {
    id: "dilation",
    name: "Dilations from the origin",
    hint: "Multiply both coordinates by the scale factor",
    ccss: "HSG-SRT.A.1",
    grade: 10,
    cat: "geometry",
    space: 2000,
    gen(rng, d) {
      const hi = RANGE(6, 9, 12)[d];
      const shrink = d !== "easy" && rng.next() < 0.4;
      const k = rng.int(2, RANGE(3, 4, 5)[d]);
      const x = rng.int(-hi, hi) * (shrink ? k : 1);
      const y = rng.int(-hi, hi) * (shrink ? k : 1);
      const kStr = shrink ? `1/${k}` : `${k}`;
      const nx = shrink ? x / k : x * k;
      const ny = shrink ? y / k : y * k;
      return {
        prompt: `Dilate the point (${x}, ${y}) from the origin by a scale factor of ${kStr}.`,
        answer: `(${nx}, ${ny})`,
        steps: [
          `Multiply each coordinate by ${kStr}`,
          shrink ? `x: ${fmtSigned(x)} ÷ ${k} = ${nx}, y: ${fmtSigned(y)} ÷ ${k} = ${ny}` : `x: ${fmtSigned(x)} × ${k} = ${nx}, y: ${fmtSigned(y)} × ${k} = ${ny}`,
          `Image: (${nx}, ${ny})`,
        ],
      };
    },
  },
  {
    id: "similar-area-ratio",
    name: "Areas of similar figures",
    hint: "Area scales by the factor squared",
    ccss: "HSG-SRT.B.5",
    grade: 10,
    cat: "geometry",
    space: 300,
    gen(rng, d) {
      const k = rng.int(2, RANGE(3, 4, 6)[d]);
      const small = rng.int(2, RANGE(10, 15, 25)[d]);
      const big = small * k * k;
      const fromSmall = rng.next() < 0.6;
      return fromSmall
        ? {
            prompt: `Two similar figures have a scale factor of ${k}. The smaller one has an area of ${small} cm². What is the area of the larger one?`,
            answer: `${big} cm²`,
            steps: [`Lengths scale by ${k}, so area scales by ${k}² = ${k * k}`, `${small} × ${k * k} = ${big} cm²`],
          }
        : {
            prompt: `Two similar figures have a scale factor of ${k}. The larger one has an area of ${big} cm². What is the area of the smaller one?`,
            answer: `${small} cm²`,
            steps: [`Lengths scale by ${k}, so area scales by ${k}² = ${k * k}`, `${big} ÷ ${k * k} = ${small} cm²`],
          };
    },
  },
  {
    id: "volume-pyramid-sphere-surface",
    name: "Pyramids and spheres",
    hint: "Volume of a pyramid, surface area of a sphere",
    ccss: "HSG-GMD.A.3",
    grade: 10,
    cat: "geometry",
    space: 300,
    gen(rng, d) {
      const pyramid = rng.next() < 0.5;
      if (pyramid) {
        const s = rng.int(2, RANGE(6, 9, 12)[d]);
        const h = 3 * rng.int(1, RANGE(3, 4, 6)[d]);
        const v = (s * s * h) / 3;
        return {
          prompt: `A square pyramid has a base side of ${s} cm and a height of ${h} cm. What is its volume?`,
          answer: `${v} cm³`,
          steps: [
            `Volume of a pyramid = 1/3 × base area × height`,
            `Base area: ${s} × ${s} = ${s * s}`,
            `${s * s} × ${h} ÷ 3 = ${v} cm³`,
          ],
        };
      }
      const r = rng.int(2, RANGE(6, 9, 12)[d]);
      return {
        prompt: `A sphere has a radius of ${r} cm. What is its surface area, in terms of π?`,
        answer: `${4 * r * r}π cm²`,
        steps: [`Surface area of a sphere = 4 × π × r²`, `${r}² = ${r * r}, and 4 × ${r * r} = ${4 * r * r}, so ${4 * r * r}π cm²`],
      };
    },
  },
  {
    id: "circle-general-to-standard",
    name: "Circle equations, general form",
    hint: "Complete the square to find the center",
    ccss: "HSG-GPE.A.1",
    grade: 10,
    cat: "algebra",
    space: 2000,
    gen(rng, d) {
      const hi = RANGE(4, 6, 9)[d];
      const h = rng.int(-hi, hi) || 1;
      const k = rng.int(-hi, hi) || -2;
      const r = rng.int(2, RANGE(5, 7, 10)[d]);
      // (x − h)² + (y − k)² = r²  →  x² + y² − 2hx − 2ky + (h² + k² − r²) = 0
      const B = -2 * h;
      const C = -2 * k;
      const D = h * h + k * k - r * r;
      const term = (coef, v) => `${coef >= 0 ? "+" : "−"} ${Math.abs(coef)}${v}`;
      return {
        prompt: `Find the center and radius of the circle x² + y² ${term(B, "x")} ${term(C, "y")} ${term(D, "")} = 0`,
        answer: `center (${h}, ${k}), radius ${r}`,
        steps: [
          `Group x and y terms: (x² ${term(B, "x")}) + (y² ${term(C, "y")}) = ${-D}`,
          `Complete each square: half of ${B} is ${-h}, squared ${h * h}; half of ${C} is ${-k}, squared ${k * k}. Add both to each side`,
          `(x ${h >= 0 ? "−" : "+"} ${Math.abs(h)})² + (y ${k >= 0 ? "−" : "+"} ${Math.abs(k)})² = ${-D} + ${h * h} + ${k * k} = ${r * r}`,
          `r² = ${r * r}, so r = ${r}: center (${h}, ${k}), radius ${r}`,
        ],
      };
    },
  },
  {
    id: "conditional-probability",
    name: "Conditional probability",
    hint: "P(B | A) = P(A and B) ÷ P(A)",
    ccss: "HSS-CP.A.3",
    grade: 10,
    cat: "word",
    space: 600,
    gen(rng, d) {
      const both = rng.int(2, RANGE(6, 9, 12)[d]);
      const aOnly = rng.int(1, RANGE(6, 9, 12)[d]);
      const bOnly = rng.int(1, RANGE(6, 9, 12)[d]);
      const neither = rng.int(0, RANGE(4, 8, 12)[d]);
      const total = both + aOnly + bOnly + neither;
      const a = both + aOnly;
      const [rn, rd] = reduce(both, a);
      const [act1, act2] = rng.pick([["play soccer", "play tennis"], ["own a cat", "own a dog"], ["take art", "take music"]]);
      return {
        prompt: `In a class of ${total} students, ${a} ${act1} and ${both} of those also ${act2}. If a student who ${act1.replace(/^(\w+)/, "$1s")} is picked at random, what is the probability they also ${act2}?`,
        answer: fracStr(rn, rd),
        steps: [
          `"Given they ${act1}" shrinks the group to the ${a} who do`,
          `${both} of those ${a} also ${act2}: ${both}/${a}`,
          ...simplifyStep(both, a),
        ],
      };
    },
  },
];
