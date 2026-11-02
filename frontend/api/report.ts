// POST /api/report: turns pre-assigned findings into natural sentences
// (spec §5). The frontend already did the categorization; neither the
// server nor the LLM re-classifies. The report must always render, so every
// failure path falls back to fixed sentences and returns 200. Ported from
// internal/report/handler.go.
import { validFindingCode, validScenario, SCENARIO_PROTOTYPE } from "./_lib/domain.js";
import { buildLLMClient, loadConfig } from "./_lib/config.js";
import { errBody, readBody, sendJSON, withApi } from "./_lib/http.js";
import { extract } from "./_lib/jsonx.js";
import { loadPrompt } from "./_lib/prompt.js";
import { Fallback, loadFallback, MAX_SENTENCES, normalizeJourney, type Finding, type ReportRequest, type ResS1, type ResS2 } from "./_lib/reportFallback.js";

// ReportRequest's free-text fields (round_summary[].reasoning, evidence
// records, intent summaries...) have no per-field length cap, and the whole
// body gets JSON.stringify'd straight into the paid LLM call's prompt
// (below) — so bound the total serialized size once here rather than
// chasing every field individually.
const MAX_BODY_CHARS = 20_000;

const cfg = loadConfig();
const llmClient = buildLLMClient(cfg);
const fallbackPromise = loadFallback();

export default withApi(cfg.allowedOrigins, async (req, res) => {
  const reqBody = readBody<ReportRequest>(req);
  if (!reqBody) return sendJSON(res, 400, errBody("bad_request"));
  if (JSON.stringify(reqBody).length > MAX_BODY_CHARS) return sendJSON(res, 400, errBody("payload_too_large"));
  if (!validScenario(reqBody.scenario)) return sendJSON(res, 400, errBody("invalid_scenario"));

  // Unknown finding codes are logged but not rejected — the report must
  // always render (issue #10, BACKEND_SPEC §5).
  logUnknownFindings(reqBody);

  const fallback = await fallbackPromise;

  if (reqBody.scenario === SCENARIO_PROTOTYPE) {
    return sendJSON(res, 200, await completeS1(fallback, reqBody));
  }

  const out = await completeS2(fallback, reqBody);
  // Every sentence is shown (girugi issue #19); the cap only guards against a runaway reply.
  out.strengths = capN(out.strengths, MAX_SENTENCES);
  out.cautions = capN(out.cautions, MAX_SENTENCES);
  out.missed = capN(out.missed, MAX_SENTENCES);
  return sendJSON(res, 200, out);
}, { requireAccount: true });

// completeS2 renders the session-2 report, falling back to fixed sentences
// on any prompt/LLM/parse failure (always 200).
async function completeS2(fallback: Fallback, req: ReportRequest): Promise<ResS2> {
  const raw = await complete("report", req);
  if (raw == null) return fallback.forS2(req);
  try {
    const out = JSON.parse(extract(raw)) as Partial<ResS2>;
    // work_overview / job_meaning must never be blank (they are their own
    // report sections); backfill from the fixed defaults if the model
    // omitted them.
    return {
      work_overview: out.work_overview || fallback.s2Default.work_overview,
      journey: normalizeJourney(out.journey, fallback.s2Default.journey),
      strengths: out.strengths ?? [],
      cautions: out.cautions ?? [],
      missed: out.missed ?? [],
      job_meaning: out.job_meaning || fallback.s2Default.job_meaning,
    };
  } catch {
    console.warn("report parse fallback", { scenario: req.scenario });
    return fallback.forS2(req);
  }
}

// completeS1 renders the session-1 narrative report, falling back to the
// fixed _s1_default block when the LLM output is missing or unusable.
async function completeS1(fallback: Fallback, req: ReportRequest): Promise<ResS1> {
  const raw = await complete("s1_report", req);
  if (raw == null) return fallback.s1Default;
  try {
    const out = JSON.parse(extract(raw)) as Partial<ResS1>;
    if (!out.initial_direction) {
      console.warn("report parse fallback", { scenario: req.scenario });
      return fallback.s1Default;
    }
    return {
      initial_direction: out.initial_direction,
      work_journey: out.work_journey ?? "",
      key_changes: out.key_changes ?? "",
      competency_record: out.competency_record ?? "",
      job_meaning: out.job_meaning ?? "",
    };
  } catch {
    console.warn("report parse fallback", { scenario: req.scenario });
    return fallback.s1Default;
  }
}

// complete loads the prompt and calls the LLM. Returns null to signal the
// caller to use its fallback.
async function complete(promptName: string, req: ReportRequest): Promise<string | null> {
  let system: string;
  try {
    system = await loadPrompt(promptName);
  } catch (err) {
    console.error("report prompt load failed", { prompt: promptName, err: String(err) });
    return null;
  }
  try {
    return await llmClient.complete(system, [{ role: "user", content: JSON.stringify(req) }]);
  } catch (err) {
    console.warn("report llm unavailable, using fallback", { err: String(err) });
    return null;
  }
}

// logUnknownFindings warns on finding codes not in the reference whitelist
// so a frontend typo / undefined code is not lost silently (issue #10).
function logUnknownFindings(req: ReportRequest) {
  const check = (bucket: string, fs: Finding[] | undefined) => {
    for (const f of fs ?? []) {
      if (!validFindingCode(req.scenario, f.code)) {
        console.warn("report: unknown finding code (kept, not rejected)", { scenario: req.scenario, bucket, code: f.code });
      }
    }
  };
  check("strengths", req.strengths_findings);
  check("cautions", req.cautions_findings);
  check("missed", req.missed_findings);
}

function capN(s: unknown, n: number): string[] {
  const list = Array.isArray(s) ? s.filter((x): x is string => typeof x === "string") : [];
  return list.length > n ? list.slice(0, n) : list;
}

