// Only signed-in email accounts may call the paid LLM endpoints (2026-11-02 decision): without this,
// anyone who finds /api/chat could run up the LLM bill. The frontend sends the user's Supabase access
// token; we ask Supabase Auth who it belongs to (GET /auth/v1/user with the public anon key — no secret
// key on the server) and reject anonymous users, which the activity log also signs in.
import type { ApiRequest } from './http.js'

// Short per-instance memo so a chat burst does not re-check the same token every call.
// Tokens live about an hour; a revoked token keeps working here for at most CACHE_MS.
const CACHE_MS = 60_000
const CACHE_MAX = 500
const cache = new Map<string, number>()

export type AuthCheck = { ok: true } | { ok: false; status: 401 | 503; error: 'login_required' | 'auth_unavailable' }

function supabaseEnv() {
  // The same values the frontend uses; on Vercel every project env var is also visible to functions.
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
  return { url: url.replace(/\/$/, ''), anonKey }
}

function bearer(req: ApiRequest): string | null {
  const h = req.headers.authorization
  const value = Array.isArray(h) ? h[0] : h
  const m = value?.match(/^Bearer\s+(\S+)$/i)
  return m ? m[1] : null
}

export async function requireAccount(req: ApiRequest): Promise<AuthCheck> {
  const token = bearer(req)
  if (!token) return { ok: false, status: 401, error: 'login_required' }

  const now = Date.now()
  const cachedUntil = cache.get(token)
  if (cachedUntil && cachedUntil > now) return { ok: true }

  const { url, anonKey } = supabaseEnv()
  // Fail closed: without Supabase settings nobody can be verified, so nobody reaches the LLM.
  if (!url || !anonKey) {
    console.error('auth: SUPABASE_URL / SUPABASE_ANON_KEY not set')
    return { ok: false, status: 503, error: 'auth_unavailable' }
  }

  let res: Response
  try {
    res = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anonKey, Authorization: `Bearer ${token}` } })
  } catch (err) {
    console.warn('auth: supabase unreachable', { err: String(err) })
    return { ok: false, status: 503, error: 'auth_unavailable' }
  }
  if (!res.ok) return { ok: false, status: 401, error: 'login_required' }

  const user = (await res.json().catch(() => null)) as { id?: string; is_anonymous?: boolean } | null
  if (!user?.id || user.is_anonymous) return { ok: false, status: 401, error: 'login_required' }

  if (cache.size >= CACHE_MAX) cache.clear()
  cache.set(token, now + CACHE_MS)
  return { ok: true }
}

/** Test hook: forget verified tokens. */
export function clearAuthCache() {
  cache.clear()
}
