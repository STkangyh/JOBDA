// POST /api/note: turns a stakeholder's messenger reply into short memo lines for the work notes
// (girugi issue #20). Called only when the user presses "답변 내용 노트에 저장", not on every reply.
// Stateless like the other endpoints, and never logs the conversation. Any LLM/parse failure still
// returns 200 with the reply itself as one line — the memo is what the stakeholder said, so the raw
// reply is never wrong, while a canned sentence would put words in their mouth.
import { validScenario } from './_lib/domain.js'
import { buildLLMClient, loadConfig } from './_lib/config.js'
import { errBody, readBody, sendJSON, withApi } from './_lib/http.js'
import { extract } from './_lib/jsonx.js'
import { loadPrompt } from './_lib/prompt.js'
import type { LLMClient } from './_lib/llm.js'

const MAX_BODY_CHARS = 20_000
const MAX_REPLY_CHARS = 4000
const MAX_EXISTING = 30
// The prompt asks for at most 3 lines; this keeps a misbehaving model from flooding the memo.
const MAX_LINES = 3

export interface NoteRequest {
  scenario: string
  speaker: string
  team: string
  question?: string
  reply: string
  existing?: string[]
}

export interface NoteResponse {
  lines: string[]
}

/** Returns an error code, or null when the request is usable. */
export function validateNote(body: NoteRequest | null): string | null {
  if (!body) return 'bad_request'
  if (JSON.stringify(body).length > MAX_BODY_CHARS) return 'payload_too_large'
  if (!validScenario(body.scenario)) return 'invalid_scenario'
  if (typeof body.reply !== 'string' || !body.reply.trim() || [...body.reply].length > MAX_REPLY_CHARS) return 'invalid_reply'
  if (typeof body.speaker !== 'string' || typeof body.team !== 'string') return 'invalid_speaker'
  if (body.existing !== undefined && (!Array.isArray(body.existing) || body.existing.length > MAX_EXISTING || body.existing.some((l) => typeof l !== 'string'))) {
    return 'invalid_existing'
  }
  return null
}

/** Parses the model output; null means "use the fallback". An empty array is a valid answer. */
export function parseLines(raw: string): string[] | null {
  try {
    const out = JSON.parse(extract(raw)) as { lines?: unknown }
    if (!Array.isArray(out.lines)) return null
    return out.lines
      .filter((l): l is string => typeof l === 'string')
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, MAX_LINES)
  } catch {
    return null
  }
}

export async function summarizeNote(llm: LLMClient, body: NoteRequest): Promise<NoteResponse> {
  const fallback = { lines: [body.reply.trim()] }
  let system: string
  try {
    system = await loadPrompt('note')
  } catch (err) {
    console.error('note prompt load failed', { err: String(err) })
    return fallback
  }
  const input = { speaker: body.speaker, team: body.team, question: body.question ?? '', reply: body.reply, existing: body.existing ?? [] }
  try {
    const raw = await llm.complete(system, [{ role: 'user', content: JSON.stringify(input) }])
    const lines = parseLines(raw)
    if (lines) return { lines }
    console.warn('note parse fallback', { scenario: body.scenario })
  } catch (err) {
    console.warn('note llm unavailable, using fallback', { err: String(err) })
  }
  return fallback
}

const cfg = loadConfig()
const llmClient = buildLLMClient(cfg)

export default withApi(cfg.allowedOrigins, async (req, res) => {
  const body = readBody<NoteRequest>(req)
  const problem = validateNote(body)
  if (problem || !body) return sendJSON(res, 400, errBody(problem ?? 'bad_request'))
  return sendJSON(res, 200, await summarizeNote(llmClient, body))
})
