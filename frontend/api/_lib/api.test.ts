// @vitest-environment node
// API server tests. Lives under api/_lib/ because Vercel ignores underscore folders, so this file never
// becomes a function. No LLM key is set in tests, so every LLM call fails and the fallbacks are exercised.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApiRequest, ApiResponse } from './http.js'
import { loadFallback, normalizeJourney } from './reportFallback.js'
import { parseLines, summarizeNote, validateNote, type NoteRequest } from '../note.js'
import reportHandler from '../report.js'
import chatHandler from '../chat.js'
import type { LLMClient } from './llm.js'
import { clearAuthCache } from './auth.js'

// Runs before the imports above are evaluated: a key in the developer's shell must never make tests call a paid LLM.
vi.hoisted(() => {
  delete process.env.OPENAI_API_KEY
  delete process.env.ANTHROPIC_API_KEY
  delete process.env.ALLOWED_ORIGIN
})

// Supabase Auth stand-in: "good" is an email account, "anon" an anonymous user, anything else is rejected.
// The LLM never gets as far as fetch (no key), so this is the only network call the handlers make.
const SUPABASE = 'https://sb.test'
const realFetch = globalThis.fetch
function stubSupabaseAuth() {
  process.env.SUPABASE_URL = SUPABASE
  process.env.SUPABASE_ANON_KEY = 'anon-key'
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    if (String(url) !== `${SUPABASE}/auth/v1/user`) throw new Error(`unexpected fetch ${url}`)
    const auth = new Headers(init?.headers).get('Authorization')
    if (auth === 'Bearer good') return new Response(JSON.stringify({ id: 'u1', is_anonymous: false }), { status: 200 })
    if (auth === 'Bearer anon') return new Response(JSON.stringify({ id: 'u2', is_anonymous: true }), { status: 200 })
    return new Response('{}', { status: 401 })
  }) as typeof fetch
}

function fakeRes() {
  const res = {
    statusCode: 200,
    headersSent: false,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code
      return res
    },
    json(body: unknown) {
      res.body = body
      res.headersSent = true
    },
    setHeader(name: string, value: string) {
      res.headers[name] = value
    },
    end() {
      res.headersSent = true
    },
  }
  return res
}

async function call(handler: (req: ApiRequest, res: ApiResponse) => Promise<void>, body: unknown, method = 'POST', token: string | null = 'good') {
  const res = fakeRes()
  const headers: ApiRequest['headers'] = { origin: 'https://evil.example' }
  if (token) headers.authorization = `Bearer ${token}`
  await handler({ method, url: '/api/x', headers, body }, res)
  return res
}

beforeAll(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

beforeEach(() => {
  clearAuthCache()
  stubSupabaseAuth()
})

afterAll(() => {
  globalThis.fetch = realFetch
})

describe('only signed-in email accounts reach the LLM endpoints', () => {
  const body = { scenario: 'cmf_outsourcing', persona: 'engineering', message: '목재 되나요?' }

  it('rejects a missing token, an unknown token and an anonymous user with 401', async () => {
    for (const token of [null, 'bogus', 'anon']) {
      const res = await call(chatHandler, body, 'POST', token)
      expect(res.statusCode).toBe(401)
      expect(res.body).toEqual({ error: 'login_required' })
    }
  })

  it('fails closed with 503 when the server has no Supabase settings', async () => {
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_ANON_KEY
    delete process.env.VITE_SUPABASE_URL
    delete process.env.VITE_SUPABASE_ANON_KEY
    const res = await call(reportHandler, { scenario: 'cmf_outsourcing' })
    expect(res.statusCode).toBe(503)
    expect(res.body).toEqual({ error: 'auth_unavailable' })
  })
})

describe('report journey', () => {
  it('always has three lines, filling blanks and missing slots from the defaults', () => {
    const d = ['a', 'b', 'c']
    expect(normalizeJourney(['x', '  ', undefined], d)).toEqual(['x', 'b', 'c'])
    expect(normalizeJourney(['x', 'y', 'z', 'extra'], d)).toEqual(['x', 'y', 'z'])
    expect(normalizeJourney('nope', d)).toEqual(d)
  })

  it('reads the session 2 default journey from prompts/fallback.json', async () => {
    const fb = await loadFallback()
    expect(fb.s2Default.journey).toEqual(['부품별 디자인 시방서 초안 작성', '피드백 반영 후 최종본 인계', '목재 파트 양산 방법 검토'])
  })
})

describe('POST /api/report (LLM unavailable → fixed sentences)', () => {
  it('returns every sentence, without the old 2/2/3 cap, plus the default journey', async () => {
    const res = await call(reportHandler, {
      scenario: 'cmf_outsourcing',
      strengths_findings: [
        { code: 'asked_capability_before_final' },
        { code: 'limit_sample_attached_in_draft' },
        { code: 'cost_impact_checked' },
      ],
      cautions_findings: [{ code: 'spec_field_missing' }, { code: 'vendor_criteria_incomplete' }, { code: 'limit_sample_missing_in_draft' }],
      missed_findings: [],
      scores: { intent_delivery: 2, concept_retention: 3, cost_control: 2 },
      branch: 'outsourcing',
    })
    const body = res.body as { strengths: string[]; cautions: string[]; journey: string[] }
    expect(res.statusCode).toBe(200)
    expect(body.strengths).toHaveLength(3)
    expect(body.cautions).toHaveLength(3)
    expect(body.journey).toHaveLength(3)
  })

  it('rejects an unknown scenario', async () => {
    const res = await call(reportHandler, { scenario: 'nope' })
    expect(res.statusCode).toBe(400)
  })
})

describe('POST /api/chat', () => {
  it('reports llm_unavailable as retryable when no LLM key is configured', async () => {
    const res = await call(chatHandler, { scenario: 'cmf_outsourcing', persona: 'engineering', history: [], message: '목재 가공 가능한가요?' })
    expect(res.statusCode).toBe(503)
    expect(res.body).toEqual({ error: 'llm_unavailable', retryable: true })
  })

  it('validates the persona before calling the LLM', async () => {
    const res = await call(chatHandler, { scenario: 'cmf_outsourcing', persona: 'ceo', message: '안녕하세요' })
    expect(res.body).toEqual({ error: 'invalid_persona' })
  })
})

describe('same-origin API', () => {
  it('sends no CORS header unless ALLOWED_ORIGIN is set, answers preflight and refuses GET', async () => {
    const pre = await call(chatHandler, undefined, 'OPTIONS')
    expect(pre.statusCode).toBe(204)
    expect(pre.headers['Access-Control-Allow-Origin']).toBeUndefined()
    const get = await call(chatHandler, undefined, 'GET')
    expect(get.statusCode).toBe(405)
  })
})

describe('POST /api/note', () => {
  const base: NoteRequest = { scenario: 'cmf_outsourcing', speaker: '박책임', team: '설계팀', reply: '우리 공장 목재는 취급 안 합니다.' }
  const llm = (reply: string | Error): LLMClient => ({
    complete: async () => {
      if (reply instanceof Error) throw reply
      return reply
    },
  })

  it('validates the request', () => {
    expect(validateNote(base)).toBeNull()
    expect(validateNote({ ...base, reply: '  ' })).toBe('invalid_reply')
    expect(validateNote({ ...base, scenario: 'x' })).toBe('invalid_scenario')
    expect(validateNote({ ...base, existing: [1 as unknown as string] })).toBe('invalid_existing')
  })

  it('keeps at most three trimmed lines and allows an empty list', () => {
    expect(parseLines('{"lines": [" a ", "", "b", "c", "d"]}')).toEqual(['a', 'b', 'c'])
    expect(parseLines('{"lines": []}')).toEqual([])
    expect(parseLines('not json')).toBeNull()
  })

  it('returns the summary, or the reply itself as one line when the LLM fails or answers badly', async () => {
    expect(await summarizeNote(llm('{"lines": ["목재 취급 안 함"]}'), base)).toEqual({ lines: ['목재 취급 안 함'] })
    expect(await summarizeNote(llm('{"lines": []}'), base)).toEqual({ lines: [] })
    expect(await summarizeNote(llm('???'), base)).toEqual({ lines: [base.reply] })
    expect(await summarizeNote(llm(new Error('down')), base)).toEqual({ lines: [base.reply] })
  })
})
