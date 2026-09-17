import { describe, it, expect } from "vitest";
import {
  SKILLS,
  GRADES,
  makeRng,
  buildSheet,
  regenerateOne,
  maxQuestions,
  skillsForGrade,
  reorderSheet,
} from "./generators.js";

const DIFFICULTIES = ["easy", "medium", "hard"];
const SEEDS = 200;

// Best-effort independent check: re-derive the answer straight from the
// prompt text for the common "a OP b =" shape. Prompts that don't match
// (word problems, comparisons, place value, ...) are skipped — this is a
// sanity net, not a full parser for every skill.
function rederiveArithmetic(prompt) {
  const m = prompt.match(/^([\d.,]+)\s*([+−×÷])\s*([\d.,]+)\s*=$/);
  if (!m) return null;
  const num = (s) => Number(s.replace(/,/g, ""));
  const a = num(m[1]);
  const b = num(m[3]);
  switch (m[2]) {
    case "+":
      return a + b;
    case "−":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return a / b;
    default:
      return null;
  }
}

// Every "a OP b = c" written inside a worked step must actually be true.
// A step is prose, so this is deliberately narrow: two integer operands,
// one operator, one result. The lookbehind keeps a chain like
// "2 × 22 × 4 = 176" (where "22 × 4 = 176" would be false) and a
// fraction like "3/4 + 1/4" from being misread as a two-term equation.
const EQUATION =
  /(?<![\d.,/)\-−^]|[+−×÷]\s)(\d+(?:,\d{3})*)\s([+−×÷])\s(\d+(?:,\d{3})*)\s=\s(-?\d+(?:,\d{3})*(?:\.\d+)?)(?![\d./])/g;

function equationsIn(step) {
  const num = (t) => Number(t.replace(/,/g, ""));
  return [...step.matchAll(EQUATION)].map(([, a, op, b, c]) => ({
    text: `${a} ${op} ${b} = ${c}`,
    a: num(a),
    op,
    b: num(b),
    c: num(c),
  }));
}

const apply = (a, op, b) =>
  ({ "+": a + b, "−": a - b, "×": a * b, "÷": a / b })[op];

// Rationals for the fraction re-derivation: "-3/4", "1 1/2", "5" → [num, den].
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
function parseRational(text) {
  const t = String(text).trim().replace(/,/g, "").replace(/^\((.*)\)$/, "$1");
  const m = t.match(/^(-?)(?:(\d+) )?(\d+)(?:\/(\d+))?$/);
  if (!m) return null;
  const sign = m[1] === "-" ? -1 : 1;
  const whole = Number(m[2] ?? 0);
  const num = Number(m[3]);
  const den = Number(m[4] ?? 1);
  const n = sign * (whole * den + num);
  const g = gcd(n, den) || 1;
  return [n / g, den / g];
}

// "a/b op c/d =" (either side may be a whole number or a bracketed negative)
// re-derived with exact integer arithmetic, compared to the printed answer.
function rederiveFraction(prompt) {
  if (!prompt.includes("/")) return null; // whole-number prompts are rederiveArithmetic's job
  const m = prompt.match(/^(\(?-?(?:\d+ )?\d+(?:\/\d+)?\)?)\s([+−×÷])\s(\(?-?(?:\d+ )?\d+(?:\/\d+)?\)?)\s=$/);
  if (!m) return null;
  const a = parseRational(m[1]);
  const b = parseRational(m[3]);
  if (!a || !b) return null;
  const [an, ad] = a;
  const [bn, bd] = b;
  let n;
  let d;
  switch (m[2]) {
    case "+": n = an * bd + bn * ad; d = ad * bd; break;
    case "−": n = an * bd - bn * ad; d = ad * bd; break;
    case "×": n = an * bn; d = ad * bd; break;
    case "÷": n = an * bd; d = ad * bn; break;
    default: return null;
  }
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d) || 1;
  return [n / g, d / g];
}

describe("generators", () => {
  for (const skill of SKILLS) {
    it(`${skill.id}: valid answers across seeds and difficulty`, () => {
      for (const d of DIFFICULTIES) {
        for (let seed = 0; seed < SEEDS; seed++) {
          const q = skill.gen(makeRng(seed), d);

          expect(q.prompt, `${skill.id}/${d}/${seed}`).toBeTruthy();
          expect(q.prompt, `${skill.id}/${d}/${seed}`).not.toMatch(/NaN|\.\d{5,}|\de-\d/);
          expect(q.answer, `${skill.id}/${d}/${seed}`).not.toBeUndefined();

          const answerStr = String(q.answer);
          expect(answerStr).not.toMatch(/NaN/);
          expect(answerStr).not.toMatch(/\.\d{5,}|e-/);

          if (typeof q.answer === "number") {
            expect(Number.isNaN(q.answer)).toBe(false);
          }

          const derived = rederiveArithmetic(q.prompt);
          if (derived !== null && typeof q.answer === "number") {
            expect(q.answer).toBeCloseTo(derived, 5);
          }

          const frac = rederiveFraction(q.prompt);
          if (frac !== null) {
            const printed = parseRational(q.answer);
            expect(printed, `${skill.id}/${d}/${seed}: unparseable answer "${q.answer}" for "${q.prompt}"`).not.toBeNull();
            expect(printed, `${skill.id}/${d}/${seed}: "${q.prompt}" → "${q.answer}"`).toEqual(frac);
          }
        }
      }
    });
  }

  it("every skill has a unique id and valid metadata", () => {
    const ids = SKILLS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of SKILLS) {
      expect(s.id, s.id).toMatch(/^[a-z0-9-]+$/);
      expect(GRADES, s.id).toContain(s.grade);
      expect(["number", "fraction", "geometry", "word", "algebra"], s.id).toContain(s.cat);
      expect(s.space, s.id).toBeGreaterThan(0);
      expect(s.name, s.id).toBeTruthy();
      expect(s.ccss, s.id).toBeTruthy();
    }
  });

  it("every grade builds a full sheet from all of its skills", () => {
    for (const g of GRADES) {
      const ids = skillsForGrade(g).map((s) => s.id);
      const sheet = buildSheet({ skillIds: ids, difficulty: ["easy", "medium", "hard"], count: 20, seed: 7 });
      expect(sheet.length, `grade ${g}`).toBe(20);
    }
  });

  it("the fraction re-derivation actually covers the fraction skills", () => {
    const covered = SKILLS.filter((s) => rederiveFraction(s.gen(makeRng(3), "medium").prompt) !== null).map((s) => s.id);
    expect(covered).toEqual(expect.arrayContaining(["frac-add-like", "frac-add-unlike", "frac-sub-unlike", "frac-mult", "divide-fractions", "rational-add-sub", "rational-mult-div", "frac-times-whole", "mixed-add-sub", "unit-frac-div-whole"]));
  });

  it("skillsForGrade only returns that grade's skills", () => {
    for (const g of GRADES) {
      expect(skillsForGrade(g).every((s) => s.grade === g)).toBe(true);
    }
  });

  it("buildSheet never repeats a prompt and respects the count", () => {
    const ids = skillsForGrade(4).map((s) => s.id);
    const sheet = buildSheet({ skillIds: ids, difficulty: "medium", count: 15, seed: 42 });
    expect(new Set(sheet.map((q) => q.prompt)).size).toBe(sheet.length);
    expect(sheet.length).toBeLessThanOrEqual(15);
  });

  it("regenerateOne replaces only the targeted question", () => {
    const sheet = buildSheet({ skillIds: ["mult-2x1"], difficulty: "medium", count: 5, seed: 1 });
    const next = regenerateOne(sheet, 2, 99);
    expect(next[0]).toEqual(sheet[0]);
    expect(next[2].prompt).not.toBe(sheet[2].prompt);
  });

  it("regenerateOne keeps the question's own difficulty in a mixed sheet", () => {
    const sheet = buildSheet({
      skillIds: ["mult-2x1"],
      difficulty: ["easy", "hard"],
      count: 6,
      seed: 1,
    });
    const next = regenerateOne(sheet, 3, 99);
    expect(next[3].difficulty).toBe(sheet[3].difficulty);
  });

  describe("worked steps", () => {
    const withSteps = SKILLS.filter((s) => s.gen(makeRng(1), "medium").steps);

    it("every skill has steps except the two with nothing to work out", () => {
      // A riddle's clue is its own reasoning; a translation has no arithmetic.
      const without = SKILLS.filter((s) => !withSteps.includes(s)).map((s) => s.id).sort();
      expect(without).toEqual(["shape-recognition", "write-numeric-expression"]);
    });

    let equationsChecked = 0;
    for (const skill of withSteps) {
      it(`${skill.id}: steps are sound and end on the printed answer`, () => {
        for (const d of DIFFICULTIES) {
          for (let seed = 0; seed < SEEDS; seed++) {
            const q = skill.gen(makeRng(seed), d);
            const label = `${skill.id}/${d}/${seed}`;
            expect(Array.isArray(q.steps), label).toBe(true);
            expect(q.steps.length, label).toBeGreaterThan(0);
            expect(q.steps.length, label).toBeLessThanOrEqual(6);

            for (const step of q.steps) {
              expect(typeof step, label).toBe("string");
              expect(step.trim().length, label).toBeGreaterThan(0);
              expect(step, label).not.toMatch(/NaN|undefined|null|\[object|\.\d{5,}|\de-\d/);
              for (const eq of equationsIn(step)) {
                equationsChecked += 1;
                expect(apply(eq.a, eq.op, eq.b), `${label}: "${eq.text}" in "${step}"`).toBeCloseTo(eq.c, 5);
              }
            }

            const last = q.steps[q.steps.length - 1];
            expect(last.endsWith(String(q.answer)), `${label}: "${last}" should end with "${q.answer}"`).toBe(true);

            // Deterministic: the same seed writes the same steps.
            expect(skill.gen(makeRng(seed), d).steps).toEqual(q.steps);
          }
        }
      });
    }

    // Rounding and fraction→decimal legitimately have no "a op b = c"
    // lines, but across the rest the matcher must be finding thousands —
    // otherwise a regex slip has silently turned the check off.
    it("the equation matcher actually matched", () => {
      expect(equationsChecked).toBeGreaterThan(10000);
    });

    it("steps travel with the question through buildSheet, regenerateOne and reorderSheet", () => {
      const sheet = buildSheet({ skillIds: ["long-division", "frac-add-unlike"], difficulty: "medium", count: 6, seed: 5 });
      expect(sheet.every((q) => q.steps?.length > 0)).toBe(true);
      const next = regenerateOne(sheet, 1, 77);
      expect(next[1].steps.length).toBeGreaterThan(0);
      expect(next[1].steps[next[1].steps.length - 1].endsWith(String(next[1].answer))).toBe(true);
      const reordered = reorderSheet(sheet, 9);
      for (const q of reordered) expect(sheet.find((o) => o.prompt === q.prompt).steps).toEqual(q.steps);
    });

    it("skills without steps leave the field off entirely", () => {
      const q = SKILLS.find((s) => s.id === "shape-recognition").gen(makeRng(1), "easy");
      expect("steps" in q).toBe(false);
    });
  });

  describe("percent-of-number: base is whole and the answer is percent × base ÷ 100", () => {
    const skill = SKILLS.find((s) => s.id === "percent-of-number");
    for (const d of DIFFICULTIES) {
      it(`re-derived from the prompt — ${d}`, () => {
        for (let seed = 0; seed < SEEDS; seed++) {
          const q = skill.gen(makeRng(seed), d);
          const m = q.prompt.match(/^What is (\d+)% of (\d+)\?$/);
          expect(m, q.prompt).toBeTruthy();
          const [, percent, base] = m.map(Number);
          expect((percent * base) / 100).toBe(q.answer);
        }
      });
    }
  });

  it("maxQuestions caps a small answer space below 40", () => {
    expect(maxQuestions(["make-ten"])).toBeLessThan(40);
  });

  describe("reorderSheet", () => {
    const sheet = buildSheet({ skillIds: ["mult-2x1", "frac-add-like"], difficulty: "medium", count: 12, seed: 3 });
    const byPrompt = (s) => s.map((q) => q.prompt);

    it("keeps the same questions, each with its own answer", () => {
      const out = reorderSheet(sheet, 9);
      expect([...byPrompt(out)].sort()).toEqual([...byPrompt(sheet)].sort());
      for (const q of out) {
        expect(q.answer).toBe(sheet.find((o) => o.prompt === q.prompt).answer);
      }
    });

    it("changes the order and always opens with a different question", () => {
      for (let seed = 0; seed < 100; seed += 1) {
        const small = buildSheet({ skillIds: ["mult-2x1"], difficulty: "medium", count: 5, seed });
        const out = reorderSheet(small, seed + 1);
        expect(byPrompt(out), `seed ${seed}`).not.toEqual(byPrompt(small));
        expect(out[0].prompt, `seed ${seed}`).not.toBe(small[0].prompt);
      }
    });

    it("does not mutate the input and is deterministic for a seed", () => {
      const before = byPrompt(sheet);
      const a = reorderSheet(sheet, 5);
      expect(byPrompt(sheet)).toEqual(before);
      expect(byPrompt(reorderSheet(sheet, 5))).toEqual(byPrompt(a));
    });
  });

  it("buildSheet distributes multiple difficulties across a sheet", () => {
    const sheet = buildSheet({
      skillIds: ["mult-2x1"],
      difficulty: ["easy", "hard"],
      count: 6,
      seed: 7,
    });
    const seen = new Set(sheet.map((q) => q.difficulty));
    expect(seen.has("easy")).toBe(true);
    expect(seen.has("hard")).toBe(true);
  });

  describe("system-of-equations: both variables check out", () => {
    const skill = SKILLS.find((s) => s.id === "system-of-equations");
    for (const d of DIFFICULTIES) {
      it(`x + y and x − y both match the prompt — ${d}`, () => {
        for (let seed = 0; seed < SEEDS; seed++) {
          const q = skill.gen(makeRng(seed), d);
          const pm = q.prompt.match(/x \+ y = (-?\d+) and x − y = (-?\d+)/);
          expect(pm, q.prompt).toBeTruthy();
          const [, sum, diff] = pm.map(Number);

          const am = String(q.answer).match(/^x = (-?\d+), y = (-?\d+)$/);
          expect(am, String(q.answer)).toBeTruthy();
          const [, x, y] = am.map(Number);

          expect(x + y).toBe(sum);
          expect(x - y).toBe(diff);
        }
      });
    }
  });

  describe("slope-intercept-equation: equation matches the given slope + point/intercept", () => {
    const skill = SKILLS.find((s) => s.id === "slope-intercept-equation");
    for (const d of DIFFICULTIES) {
      it(`answer satisfies the prompt — ${d}`, () => {
        for (let seed = 0; seed < SEEDS; seed++) {
          const q = skill.gen(makeRng(seed), d);

          // Slope can now be a plain integer ("7") or a reduced fraction
          // ("2/3") — the fraction form is what forces the point (rather
          // than the y-intercept) to actually be used.
          const am = String(q.answer).match(/^y = (-?\d+(?:\/\d+)?)x ([+−]) (\d+)$/);
          expect(am, String(q.answer)).toBeTruthy();
          const mLabel = am[1];
          const b = (am[2] === "+" ? 1 : -1) * Number(am[3]);

          const slopeMatch = q.prompt.match(/slope of (-?\d+(?:\/\d+)?)/);
          expect(slopeMatch, q.prompt).toBeTruthy();
          expect(slopeMatch[1]).toBe(mLabel);

          const [mNumStr, mDenStr] = mLabel.split("/");
          const mNum = Number(mNumStr);
          const mDen = mDenStr ? Number(mDenStr) : 1;

          const ptMatch = q.prompt.match(/passes through the point \((-?\d+), (-?\d+)\)/);
          if (ptMatch) {
            const [, x1, y1] = ptMatch.map(Number);
            // y1 = (mNum/mDen)*x1 + b, kept in integers via cross-multiplication.
            expect(y1 * mDen).toBe(mNum * x1 + b * mDen);
          } else {
            const interceptMatch = q.prompt.match(/y-intercept of (-?\d+)/);
            expect(interceptMatch, q.prompt).toBeTruthy();
            expect(Number(interceptMatch[1])).toBe(b);
          }
        }
      });
    }
  });
});
