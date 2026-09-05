import { describe, it, expect } from "vitest";
import {
  SKILLS,
  GRADES,
  makeRng,
  buildSheet,
  regenerateOne,
  maxQuestions,
  skillsForGrade,
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
    const next = regenerateOne(sheet, 2, "medium", 99);
    expect(next[0]).toEqual(sheet[0]);
    expect(next[2].prompt).not.toBe(sheet[2].prompt);
  });

  it("maxQuestions caps a small answer space below 40", () => {
    expect(maxQuestions(["make-ten"])).toBeLessThan(40);
  });
});
