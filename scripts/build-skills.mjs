/* Writes public/skills.json — id, name, grade, category for every skill —
   straight from generators.js, so anything outside this repo (the usage
   report Lambda in mathly-infra) can map skill ids to names and
   categories without carrying its own copy of the catalogue. Runs before
   `dev` and `build` via the npm pre-scripts. */

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { SKILLS } from "../src/generators.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public", "skills.json");
mkdirSync(dirname(out), { recursive: true });

const skills = SKILLS.map(({ id, name, grade, cat }) => ({ id, name, grade, cat }));
writeFileSync(out, JSON.stringify(skills) + "\n");
console.log(`wrote ${skills.length} skills to public/skills.json`);
