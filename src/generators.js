/* ===============================================================
   Mathly generator engine.

   Two rules hold everywhere in this file:

   1. The answer is produced by the same computation that produced
      the question. Nothing is ever re-solved, so an answer key
      cannot drift from its worksheet.

   2. Problems are constructed backwards. Pick the answer or the
      roots first, then build a question around them. That is what
      guarantees clean integers without any symbolic algebra.
================================================================*/

import { gcd } from "./skills/helpers.js";
import gradeK from "./skills/grade-k.js";
import grade1 from "./skills/grade-1.js";
import grade2 from "./skills/grade-2.js";
import grade3 from "./skills/grade-3.js";
import grade4 from "./skills/grade-4.js";
import grade5 from "./skills/grade-5.js";
import grade6 from "./skills/grade-6.js";
import grade7 from "./skills/grade-7.js";
import grade8 from "./skills/grade-8.js";
import grade9 from "./skills/grade-9.js";
import grade10 from "./skills/grade-10.js";

export { gcd };

export function makeRng(seed) {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
  };
}

export const CATEGORIES = {
  number:   { label: "Number and operations", tone: "#2563EB" },
  fraction: { label: "Fractions and decimals", tone: "#7C3AED" },
  geometry: { label: "Measurement and geometry", tone: "#0D9488" },
  word:     { label: "Word problems", tone: "#EA580C" },
  algebra:  { label: "Algebra", tone: "#DB2777" },
};

/* ---------------------------------------------------------------
   Skill catalogue, one file per grade under ./skills/. `gen` receives (rng, difficulty) and returns
   { prompt, answer, steps? } — `steps` is an optional list of one-line
   worked steps for the answer key. `space` is the count of distinct
   problems, used to cap the question slider so a sheet can't exhaust
   a skill.
----------------------------------------------------------------*/
export const SKILLS = [...gradeK, ...grade1, ...grade2, ...grade3, ...grade4, ...grade5, ...grade6, ...grade7, ...grade8, ...grade9, ...grade10];

export const GRADES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/* Grade 0 is Kindergarten. Use this for any user-facing label. */
export const gradeLabel = (g) => (g === 0 ? "K" : String(g));

export const skillsForGrade = (grade) => SKILLS.filter((s) => s.grade === grade);

export const skillById = (id) => SKILLS.find((s) => s.id === id);

/* ---------------------------------------------------------------
   Build a worksheet. Interleaves the selected skills in rotation,
   deduplicates on prompt text, and caps retries so a small answer
   space cannot spin the loop forever.
----------------------------------------------------------------*/
export function buildSheet({ skillIds, difficulty = "medium", count = 20, seed = 1 }) {
  const rng = makeRng(seed);
  const chosen = skillIds.map(skillById).filter(Boolean);
  if (!chosen.length) return [];
  const difficulties = Array.isArray(difficulty) && difficulty.length ? difficulty : [difficulty];

  const seen = new Set();
  const out = [];
  let attempts = 0;

  while (out.length < count && attempts < count * 30) {
    const skill = chosen[out.length % chosen.length];
    const d = difficulties[out.length % difficulties.length];
    const q = skill.gen(rng, d);
    attempts += 1;
    if (seen.has(q.prompt)) continue;
    seen.add(q.prompt);
    out.push({ ...q, cat: skill.cat, skillId: skill.id, difficulty: d });
  }
  return out;
}

/* Replace a single question in place, leaving the rest untouched. Keeps
   the question's own assigned difficulty, so redoing one question in a
   mixed-difficulty sheet can't silently change how hard it is. */
export function regenerateOne(sheet, index, seed) {
  const target = sheet[index];
  const skill = skillById(target.skillId);
  if (!skill) return sheet;
  const rng = makeRng(seed);
  const existing = new Set(sheet.map((q, i) => (i === index ? null : q.prompt)));
  for (let i = 0; i < 40; i += 1) {
    const q = skill.gen(rng, target.difficulty);
    if (existing.has(q.prompt)) continue;
    const next = sheet.slice();
    next[index] = { ...q, cat: skill.cat, skillId: skill.id, difficulty: target.difficulty };
    return next;
  }
  return sheet;
}

/* Same questions, new order — for handing neighbouring students different
   copies of one worksheet. Each answer travels with its question object,
   so the key stays right by construction. Always opens with a different
   question than before, so the change is visible at a glance. */
export function reorderSheet(sheet, seed) {
  const rng = makeRng(seed);
  const order = sheet.slice();
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = rng.int(0, i);
    [order[i], order[j]] = [order[j], order[i]];
  }
  if (order.length > 1 && order[0] === sheet[0]) {
    const k = rng.int(1, order.length - 1);
    [order[0], order[k]] = [order[k], order[0]];
  }
  return order;
}

/* Largest question count a skill selection can fill without repeats.
   Prevents offering 30 questions from a 36-problem skill. */
export function maxQuestions(skillIds) {
  const total = skillIds
    .map(skillById)
    .filter(Boolean)
    .reduce((sum, s) => sum + s.space, 0);
  return Math.max(5, Math.min(40, Math.floor(total / 6)));
}
