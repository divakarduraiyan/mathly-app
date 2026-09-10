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

describe("generators", () => {
  for (const skill of SKILLS) {
    it(`${skill.id}: valid answers across seeds and difficulty`, () => {
      for (const d of DIFFICULTIES) {
        for (let seed = 0; seed < SEEDS; seed++) {
          const q = skill.gen(makeRng(seed), d);

          expect(q.prompt, `${skill.id}/${d}/${seed}`).toBeTruthy();
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
        }
      }
    });
  }

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
