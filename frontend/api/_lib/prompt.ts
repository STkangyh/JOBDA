// Loads prompt text from files bundled with the function. Prompts are data, not code
// (girugi CLAUDE.md rule 7): the planning/AI owners edit frontend/prompts/*.md directly.
// Ported from girugi internal/prompt/prompt.go (Load only — Render was unused).
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

// prompts/ sits at the Vercel project root (frontend/); vercel.json's includeFiles ships it with every
// function. The relative depth from this file differs if Vercel bundles _lib into each function, and
// Vercel runs functions with the project root as cwd — so try those locations in order.
const here = dirname(fileURLToPath(import.meta.url));
const CANDIDATES = [join(here, "..", "..", "prompts"), join(here, "..", "prompts"), join(process.cwd(), "prompts")];
const PROMPTS_DIR = CANDIDATES.find((dir) => existsSync(join(dir, "report.md"))) ?? CANDIDATES[0];

/** Returns the raw contents of prompts/{name}.md. */
export async function loadPrompt(name: string): Promise<string> {
  try {
    return await readFile(join(PROMPTS_DIR, `${name}.md`), "utf-8");
  } catch (err) {
    throw new Error(`prompt: load ${name}: ${err}`);
  }
}

export { PROMPTS_DIR };
