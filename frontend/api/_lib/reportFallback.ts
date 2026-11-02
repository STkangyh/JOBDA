// Fixed sentences used when the LLM is unavailable or its output cannot be
// parsed. The report is the last screen and must never be empty (spec §5),
// so this is loaded once per invocation from prompts/fallback.json.
// Ported from internal/report/fallback.go.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PROMPTS_DIR } from "./prompt.js";

export interface Finding {
  code: string;
  evidence?: Record<string, unknown>;
}

export interface RoundEntry {
  round: string;
  choice: unknown;
  reasoning: string;
}

export interface SelfEval {
  q1: number;
  q2: number;
  q3: number;
  q4: string;
}

export interface ActionLog {
  seq: number;
  t: number;
  type: string;
  actor?: string;
  target?: string;
  intent?: string;
}

export interface ReportRequest {
  scenario: string;
  strengths_findings?: Finding[];
  cautions_findings?: Finding[];
  missed_findings?: Finding[];
  action_logs?: ActionLog[];
  // cmf_outsourcing
  scores?: Record<string, number>;
  branch?: string;
  // prototype_revision
  initial_intent?: string;
  final_intent_summary?: string;
  round_summary?: RoundEntry[];
  self_eval?: SelfEval;
}

// resS2 — session 2 (cmf_outsourcing): work overview + journey + three sentence
// buckets + job meaning (wireframe sections; girugi issues #14, #19).
export interface ResS2 {
  work_overview: string;
  /** One line per stage (spec draft → revision → vendor contact), always exactly 3. */
  journey: string[];
  strengths: string[];
  cautions: string[];
  missed: string[];
  job_meaning: string;
}

// resS1 — session 1 (prototype_revision): five narrative sections.
export interface ResS1 {
  initial_direction: string;
  work_journey: string;
  key_changes: string;
  competency_record: string;
  job_meaning: string;
}

interface S2Default {
  work_overview: string;
  journey: string[];
  job_meaning: string;
}

const EMPTY_S1_DEFAULT: ResS1 = {
  initial_direction: "",
  work_journey: "",
  key_changes: "",
  competency_record: "",
  job_meaning: "",
};

const EMPTY_S2_DEFAULT: S2Default = { work_overview: "", journey: ["", "", ""], job_meaning: "" };

// Planning decision (girugi issue #19): show every sentence, one per finding the frontend sent.
// This cap only guards against a runaway payload.
export const MAX_SENTENCES = 10;

/** Always 3 lines: missing or blank slots take the default line in the same position, extras are dropped. */
export function normalizeJourney(journey: unknown, defaults: string[]): string[] {
  const given = Array.isArray(journey) ? journey : [];
  return [0, 1, 2].map((i) => {
    const line = given[i];
    return typeof line === "string" && line.trim() ? line.trim() : (defaults[i] ?? "");
  });
}

export class Fallback {
  constructor(
    public sentences: Record<string, string>,
    public s1Default: ResS1,
    public s2Default: S2Default,
  ) {}

  // Builds the session-2 response from finding codes — every known code becomes a sentence,
  // in the order the frontend sent them (no 2/2/3 cap since girugi issue #19).
  forS2(req: ReportRequest): ResS2 {
    return {
      work_overview: this.s2Default.work_overview,
      journey: normalizeJourney(undefined, this.s2Default.journey),
      strengths: this.sentencesFor(req.strengths_findings, MAX_SENTENCES),
      cautions: this.sentencesFor(req.cautions_findings, MAX_SENTENCES),
      missed: this.sentencesFor(req.missed_findings, MAX_SENTENCES),
      job_meaning: this.s2Default.job_meaning,
    };
  }

  // Maps finding codes to canned sentences, up to limit. Unknown codes are
  // skipped.
  private sentencesFor(findings: Finding[] | undefined, limit: number): string[] {
    const out: string[] = [];
    for (const f of findings ?? []) {
      const s = this.sentences[f.code];
      if (!s) continue;
      out.push(s);
      if (out.length >= limit) break;
    }
    return out;
  }
}

// Reads prompts/fallback.json. On error returns an empty (but usable)
// Fallback so the function can still serve requests — the caller logs the
// error.
export async function loadFallback(): Promise<Fallback> {
  let raw: Record<string, unknown>;
  try {
    const text = await readFile(join(PROMPTS_DIR, "fallback.json"), "utf-8");
    raw = JSON.parse(text);
  } catch (err) {
    console.warn("report fallback load failed, continuing with empty fallback", err);
    return new Fallback({}, EMPTY_S1_DEFAULT, EMPTY_S2_DEFAULT);
  }

  const sentences: Record<string, string> = {};
  let s1Default = EMPTY_S1_DEFAULT;
  let s2Default = EMPTY_S2_DEFAULT;

  for (const [k, v] of Object.entries(raw)) {
    if (k === "_s1_default") {
      s1Default = { ...EMPTY_S1_DEFAULT, ...(v as Partial<ResS1>) };
      continue;
    }
    if (k === "_s2_default") {
      const d = v as Partial<S2Default>;
      s2Default = { ...EMPTY_S2_DEFAULT, ...d, journey: normalizeJourney(d.journey, EMPTY_S2_DEFAULT.journey) };
      continue;
    }
    if (typeof v === "string") sentences[k] = v;
  }

  return new Fallback(sentences, s1Default, s2Default);
}
