// POST /api/chat: generates a stakeholder reply and classifies the user's
// intent (spec §4). The disclose whitelist is enforced here in code, not by
// trusting the prompt. Ported from internal/chat/handler.go.
import { filterDisclose, validPersona, validScenario, SCENARIO_CMF, SCENARIO_PROTOTYPE } from "./_lib/domain.js";
import { buildLLMClient, loadConfig } from "./_lib/config.js";
import { errBody, readBody, sendJSON, withApi } from "./_lib/http.js";
import { extract, stripFences } from "./_lib/jsonx.js";
import { loadPrompt } from "./_lib/prompt.js";
import type { Message } from "./_lib/llm.js";

const MAX_HISTORY = 20; // keep only the most recent turns
const MAX_MESSAGE_CHARS = 300; // spec §4: message length cap (counted in Unicode code points)
// history is client-echoed, not server-stored, so nothing stopped a caller from padding it with
// oversized entries before this validation existed — MAX_HISTORY only slices the array *after*
// the full thing (and its token cost) would already have been forwarded to the paid LLM call.
// Assistant turns can legitimately run up to MAX_TOKENS(1024) worth of text, so this cap is sized
// generously above that rather than matching MAX_MESSAGE_CHARS.
const MAX_HISTORY_ENTRY_CHARS = 4000;
const MAX_HISTORY_ARRAY_LEN = 50;
// context.cost_alternative/intent_summary are free text with no per-field cap of their own
// (spec never gave them one) — bound the whole body once rather than special-casing each.
const MAX_BODY_CHARS = 20_000;

interface ChatContext {
  round: string; // round1 | round2 | round3
  choice: unknown; // 1|2|3 or "confirm"|"revisit"
  cost_alternative?: string; // round2 choice=3
  intent_summary?: string; // round3 required
}

interface ChatRequest {
  scenario: string;
  persona: string;
  history?: Message[];
  message: string;
  context?: ChatContext | null;
}

interface ChatResponse {
  reply: string;
  intent: string;
  disclose: string[];
}

// Reproduces the exact JSON the AI part tuned against (spec §4). Empty
// fields are omitted; without a context the raw message is passed through.
function buildUserTurn(msg: string, c: ChatContext | null | undefined): string {
  if (!c) return msg;
  const m: Record<string, unknown> = { round: c.round, choice: c.choice };
  if (msg) m.reasoning = msg;
  if (c.cost_alternative) m.cost_alternative = c.cost_alternative;
  if (c.intent_summary) m.intent_summary = c.intent_summary;
  return JSON.stringify(m);
}

// Parses the LLM output, falling back to raw text when the JSON is malformed
// or the required reply field is empty (spec §6 — never 500). disclose is
// filtered to the persona's whitelist and always emitted as an array.
function parseReply(scenario: string, persona: string, raw: string): ChatResponse {
  try {
    const out = JSON.parse(extract(raw)) as Partial<ChatResponse>;
    if (out.reply && out.reply.trim()) {
      return {
        reply: out.reply,
        intent: out.intent ?? "", // Go zero-value parity: no default here, only the fallback path uses "unknown"
        disclose: filterDisclose(scenario, persona, out.disclose),
      };
    }
  } catch {
    // fall through to fallback
  }
  console.warn("llm parse fallback", { scenario, persona });
  return { reply: stripFences(raw).trim(), intent: "unknown", disclose: [] };
}

// promptName maps scenario+persona to the prompt file path (spec §0).
function promptName(scenario: string, persona: string): string {
  return scenario === SCENARIO_PROTOTYPE ? `s1_personas/${persona}` : `personas/${persona}`;
}

const cfg = loadConfig();
const llmClient = buildLLMClient(cfg);

export default withApi(cfg.allowedOrigins, async (req, res) => {
  const reqBody = readBody<ChatRequest>(req);
  if (!reqBody) return sendJSON(res, 400, errBody("bad_request"));
  if (JSON.stringify(reqBody).length > MAX_BODY_CHARS) return sendJSON(res, 400, errBody("payload_too_large"));

  if (!validScenario(reqBody.scenario)) return sendJSON(res, 400, errBody("invalid_scenario"));
  if (!validPersona(reqBody.scenario, reqBody.persona)) return sendJSON(res, 400, errBody("invalid_persona"));

  // cmf_outsourcing has no negotiation rounds, so context is ignored (spec §4).
  const ctx = reqBody.scenario === SCENARIO_CMF ? null : reqBody.context ?? null;

  const msg = (reqBody.message ?? "").trim();
  if ([...msg].length > MAX_MESSAGE_CHARS) return sendJSON(res, 400, errBody("invalid_message"));
  // Without a round context the message carries the whole turn, so it must
  // be non-empty; with a context an empty message is allowed (e.g. round3).
  if (!ctx && msg === "") return sendJSON(res, 400, errBody("invalid_message"));
  if (ctx?.round === "round3" && !(ctx.intent_summary ?? "").trim()) {
    return sendJSON(res, 400, errBody("missing_intent_summary"));
  }
  if (!validHistory(reqBody.history)) return sendJSON(res, 400, errBody("invalid_history"));

  let system: string;
  try {
    system = await loadPrompt(promptName(reqBody.scenario, reqBody.persona));
  } catch (err) {
    console.error("prompt load failed", { scenario: reqBody.scenario, persona: reqBody.persona, err: String(err) });
    return sendJSON(res, 500, errBody("internal"));
  }

  // Keep only the most recent MAX_HISTORY turns (drop from the front).
  const hist = (reqBody.history ?? []).slice(-MAX_HISTORY);
  const msgs: Message[] = [...hist, { role: "user", content: buildUserTurn(msg, ctx) }];

  let raw: string;
  try {
    raw = await llmClient.complete(system, msgs);
  } catch (err) {
    // Transport failure (timeout/5xx/missing key) — frontend shows a retry
    // button (spec §4). Do not log the conversation content.
    console.warn("llm unavailable", { scenario: reqBody.scenario, persona: reqBody.persona, err: String(err) });
    return sendJSON(res, 503, { error: "llm_unavailable", retryable: true });
  }

  return sendJSON(res, 200, parseReply(reqBody.scenario, reqBody.persona, raw));
});

// Rejects a history whose shape or size would let a caller pad an
// unbounded/expensive payload into the paid LLM call before MAX_HISTORY's
// slice ever gets a chance to trim it.
function validHistory(history: unknown): boolean {
  if (history === undefined) return true;
  if (!Array.isArray(history) || history.length > MAX_HISTORY_ARRAY_LEN) return false;
  return history.every(
    (m) =>
      typeof m === "object" &&
      m !== null &&
      (m as { role?: unknown }).role !== undefined &&
      typeof (m as { content?: unknown }).content === "string" &&
      [...(m as { content: string }).content].length <= MAX_HISTORY_ENTRY_CHARS,
  );
}

