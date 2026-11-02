import { requireAccount } from './auth.js'

// JSON response helper + CORS handling for Vercel Node functions.
// Ported from girugi internal/httpx/httpx.go (via the Vercel port), with two changes for JOBDA:
// - the API now ships in the same Vercel project as the frontend, so calls are same-origin and
//   no CORS header is sent unless ALLOWED_ORIGIN is set (e.g. for a local frontend on another port);
// - request/response are typed here instead of pulling in @vercel/node just for its types.

/** The parts of Vercel's Node request this API uses (Vercel parses JSON bodies into `body`). */
export interface ApiRequest {
  method?: string
  url?: string
  headers: Record<string, string | string[] | undefined>
  body?: unknown
}

/** The parts of Vercel's Node response helper this API uses. */
export interface ApiResponse {
  statusCode: number
  headersSent: boolean
  status(code: number): ApiResponse
  json(body: unknown): void
  setHeader(name: string, value: string): void
  end(): void
}

export type Handler = (req: ApiRequest, res: ApiResponse) => Promise<void>

// Access-Control-Allow-Origin can only echo ONE origin, so a multi-domain allowlist picks the one
// the browser sent — never blindly echo an unrecognized Origin. "*" is the explicit local-dev opt-out.
export function setCors(res: ApiResponse, allowedOrigins: string[], requestOrigin: string | undefined) {
  if (allowedOrigins.length === 0) return
  const origin = allowedOrigins.includes('*')
    ? '*'
    : requestOrigin && allowedOrigins.includes(requestOrigin)
      ? requestOrigin
      : allowedOrigins[0]
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

export function sendJSON(res: ApiResponse, status: number, body: unknown) {
  res.status(status).json(body)
}

export function errBody(code: string) {
  return { error: code }
}

/** Vercel parses JSON bodies, but a text/plain post arrives as a string — accept both. */
export function readBody<T>(req: ApiRequest): T | null {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as T
    } catch {
      return null
    }
  }
  return req.body && typeof req.body === 'object' ? (req.body as T) : null
}

// withApi wraps a POST-only JSON handler with CORS preflight + error recovery + request logging
// (girugi main.go's Recover/Logger/CORS middleware). Body size is capped by Vercel's request limit
// and by each handler's MAX_BODY_CHARS.
// requireAccount: only signed-in email accounts get through (the LLM endpoints) — see auth.ts.
export function withApi(allowedOrigins: string[], handler: Handler, opts: { requireAccount?: boolean } = {}): Handler {
  return async (req, res) => {
    const origin = req.headers.origin
    setCors(res, allowedOrigins, Array.isArray(origin) ? origin[0] : origin)
    if (req.method === 'OPTIONS') {
      res.status(204).end()
      return
    }
    if (req.method !== 'POST') {
      sendJSON(res, 405, errBody('method_not_allowed'))
      return
    }
    const start = Date.now()
    let status = 200
    try {
      if (opts.requireAccount) {
        const auth = await requireAccount(req)
        if (!auth.ok) {
          sendJSON(res, auth.status, errBody(auth.error))
          status = auth.status
          return
        }
      }
      await handler(req, res)
      status = res.statusCode
    } catch (err) {
      console.error('panic recovered', err)
      status = 500
      if (!res.headersSent) sendJSON(res, 500, errBody('internal'))
    } finally {
      // Never log request bodies: they carry the user's conversation.
      console.log(JSON.stringify({ msg: 'request', method: req.method, path: req.url, status, dur_ms: Date.now() - start }))
    }
  }
}
