import type { AuthError } from '@supabase/supabase-js'
import { track } from './analytics'

// 사용자 로그인(이메일 + 비밀번호). 설계: docs/email-login-plan.md
// 가입은 새 계정으로 만든다(2026-10-13 결정) — 디자인이 이메일·비밀번호를 한 화면에서 받기 때문.
// 그래서 가입 전 익명으로 쌓인 기록은 이전 익명 ID에 남는다(로그인할 때와 같은 동작).
// 이메일 주소는 활동 이벤트에 절대 넣지 않는다.

// 환경변수가 없는 로컬·테스트에서는 서버 기능이 꺼져 있다(활동 로그와 같은 규칙).
export const authConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

// 로그인·가입 인증 뒤 이동할 곳 — 온보딩(Figma 2217:9726)
export const AFTER_AUTH_PATH = '/onboarding'

// supabase-js가 인증 화면 청크에만 들어가도록 동적 import 한다.
async function supabase() {
  const { getSupabase } = await import('./supabaseClient')
  return getSupabase()
}

export interface AuthFailure {
  code: string
  title: string
  detail: string
}

export type AuthResult = { ok: true } | { ok: false; error: AuthFailure }

const ok: AuthResult = { ok: true }
const fail = (code: string, title: string, detail: string): AuthResult => ({ ok: false, error: { code, title, detail } })

// 영문, 숫자, 특수문자를 조합해 8~20자 (Figma 비밀번호 재설정 안내 문구 기준)
export const PASSWORD_RULE = '영문, 숫자, 특수문자를 조합해 8~20자로 설정해 주세요.'

export function passwordProblem(password: string): string | null {
  if (password.length < 8 || password.length > 20) return PASSWORD_RULE
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z\d]/.test(password)) return PASSWORD_RULE
  return null
}

const ERRORS: Record<string, [string, string]> = {
  invalid_credentials: ['이메일 또는 비밀번호가 올바르지 않습니다.', '계정 정보를 확인한 후 다시 시도해 주세요.'],
  email_not_confirmed: ['아직 이메일 인증이 끝나지 않았어요.', '가입할 때 받은 메일의 인증 링크를 눌러 주세요. 메일이 없다면 스팸 메일함도 확인해 주세요.'],
  user_already_exists: ['이미 가입된 이메일이에요.', '로그인하거나, 비밀번호가 기억나지 않으면 비밀번호 찾기를 이용해 주세요.'],
  weak_password: ['더 안전한 비밀번호가 필요해요.', PASSWORD_RULE],
  same_password: ['이전과 다른 비밀번호를 입력해 주세요.', '지금 쓰고 있는 비밀번호와 같은 비밀번호로는 바꿀 수 없어요.'],
  otp_expired: ['링크가 만료됐거나 이미 사용됐어요.', '메일을 다시 요청한 뒤 가장 최근에 받은 링크를 눌러 주세요.'],
  over_request_rate_limit: ['요청이 너무 많아요.', '몇 분 뒤 다시 시도해 주세요.'],
  over_email_send_rate_limit: ['메일을 너무 자주 요청했어요.', '몇 분 뒤 다시 시도해 주세요.'],
  user_banned: ['사용이 중지된 계정이에요.', 'JOBDA 팀에 문의해 주세요.'],
  not_configured: ['지금은 로그인할 수 없어요.', '서버 연결 설정이 없는 환경이에요. 배포된 사이트에서 다시 시도해 주세요.'],
  no_session: ['링크가 만료됐거나 이미 사용됐어요.', '비밀번호 찾기에서 메일을 다시 요청해 주세요.'],
}

const ALIASES: Record<string, string> = { email_exists: 'user_already_exists', flow_state_expired: 'otp_expired' }

export function describeError(error: Pick<AuthError, 'code' | 'message' | 'status'> | { code?: string; message?: string; status?: number }): AuthFailure {
  let code = error.code ? (ALIASES[error.code] ?? error.code) : undefined
  if (!code && /invalid login credentials/i.test(error.message ?? '')) code = 'invalid_credentials'
  if (!code && /email not confirmed/i.test(error.message ?? '')) code = 'email_not_confirmed'
  if (code && ERRORS[code]) return { code, title: ERRORS[code][0], detail: ERRORS[code][1] }
  if (!error.status) return { code: 'network', title: '서버에 연결하지 못했어요.', detail: '인터넷 연결을 확인하고 다시 시도해 주세요.' }
  return { code: code ?? 'unknown', title: '요청을 처리하지 못했어요.', detail: `잠시 후 다시 시도해 주세요. (${error.message ?? '알 수 없는 오류'})` }
}

function failWith(error: Parameters<typeof describeError>[0]): AuthResult {
  return { ok: false, error: describeError(error) }
}

const notConfigured = () => fail('not_configured', ...ERRORS.not_configured)

// ── 로그인 상태 유지 ─────────────────────────────────────────────
// supabase-js는 세션을 localStorage에 둔다. 체크를 끄고 로그인하면 표시를 남겨 두고, 브라우저를 다시 열었을 때
// (sessionStorage가 비어 있을 때) 로그아웃시킨다 — 앱 시작 시 analytics/supabase.ts가 확인한다.
const EPHEMERAL_KEY = 'jobda-auth-ephemeral'
const ALIVE_KEY = 'jobda-auth-alive'
// 이 브라우저에서 이메일 계정으로 로그인한 적이 있는지 — 다시 오면 시작 화면 대신 로그인 화면으로 보낸다.
const HAS_ACCOUNT_KEY = 'jobda-has-account'

function markSignedIn(remember: boolean) {
  try {
    localStorage.setItem(HAS_ACCOUNT_KEY, '1')
    if (remember) {
      localStorage.removeItem(EPHEMERAL_KEY)
    } else {
      localStorage.setItem(EPHEMERAL_KEY, '1')
      sessionStorage.setItem(ALIVE_KEY, '1')
    }
  } catch {
    // 저장소가 막힌 브라우저는 기본 동작(로그인 유지)으로 둔다.
  }
}

function sessionEndedByChoice(): boolean {
  try {
    return localStorage.getItem(EPHEMERAL_KEY) === '1' && sessionStorage.getItem(ALIVE_KEY) !== '1'
  } catch {
    return false
  }
}

function hasSignedInBefore(): boolean {
  try {
    return localStorage.getItem(HAS_ACCOUNT_KEY) === '1'
  } catch {
    return false
  }
}

/** 로그인 상태 유지를 끄고 로그인한 뒤 브라우저를 다시 열었으면 true. 확인하면서 표시를 지운다. */
export function consumeExpiredSessionFlag(): boolean {
  try {
    if (localStorage.getItem(EPHEMERAL_KEY) !== '1' || sessionStorage.getItem(ALIVE_KEY) === '1') return false
    localStorage.removeItem(EPHEMERAL_KEY)
    return true
  } catch {
    return false
  }
}

// ── 현재 사용자 ─────────────────────────────────────────────────
/** 이메일 계정으로 로그인되어 있으면 true (익명 사용자는 false). */
export async function hasAccountSession(): Promise<boolean> {
  // 앱 시작 시 로그아웃 처리(analytics/supabase.ts)보다 먼저 물어봐도 끝난 세션으로 본다.
  if (!authConfigured || sessionEndedByChoice()) return false
  try {
    const { data } = await (await supabase()).auth.getSession()
    const user = data.session?.user
    return Boolean(user && !user.is_anonymous)
  } catch {
    return false
  }
}

/**
 * 루트(/)로 들어온 사람을 보낼 곳 (2026-10-13 결정). null이면 원래 화면(시작 화면 또는 탐색 홈).
 * - 로그인이 살아 있는 사람(로그인 상태 유지를 체크했거나 아직 브라우저를 닫지 않은 사람) → 온보딩
 * - 이 브라우저에서 로그인한 적은 있지만 지금은 로그아웃 상태 → 시작 화면·로딩을 건너뛰고 로그인
 */
export async function resolveEntry(): Promise<string | null> {
  if (await hasAccountSession()) return AFTER_AUTH_PATH
  if (hasSignedInBefore()) return '/login'
  return null
}

// ── 로그인 · 가입 · 비밀번호 ─────────────────────────────────────
export async function signIn(email: string, password: string, remember: boolean): Promise<AuthResult> {
  if (!authConfigured) return notConfigured()
  const { error } = await (await supabase()).auth.signInWithPassword({ email: email.trim(), password })
  if (error) {
    const failure = describeError(error)
    track('login_error', { code: failure.code })
    return { ok: false, error: failure }
  }
  markSignedIn(remember)
  track('login_success', { remember })
  return ok
}

export type SignUpResult = AuthResult | { ok: true; signedIn: true }

export async function signUp(email: string, password: string): Promise<SignUpResult> {
  if (!authConfigured) return notConfigured()
  track('signup_start')
  const { data, error } = await (await supabase()).auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
  })
  if (error) return failWith(error)
  // 이메일 인증을 켠 프로젝트는 이미 가입된 주소에도 오류 대신 빈 identities를 돌려준다.
  if (data.user && data.user.identities?.length === 0) return fail('user_already_exists', ...ERRORS.user_already_exists)
  // 인증을 끈 환경이면 바로 로그인된다.
  if (data.session) {
    markSignedIn(true)
    track('signup_complete')
    return { ok: true, signedIn: true }
  }
  track('signup_email_sent')
  return ok
}

export async function resendSignupEmail(email: string): Promise<AuthResult> {
  if (!authConfigured) return notConfigured()
  const { error } = await (await supabase()).auth.resend({
    type: 'signup',
    email: email.trim(),
    options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
  })
  return error ? failWith(error) : ok
}

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  if (!authConfigured) return notConfigured()
  const { error } = await (await supabase()).auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/auth/confirm`,
  })
  // 가입하지 않은 주소여도 같은 안내를 보여준다(계정 존재 여부를 드러내지 않음). 요청 한도 같은 오류만 알린다.
  if (error && error.status !== 400 && error.status !== 404) return failWith(error)
  track('password_reset_request')
  return ok
}

export type LinkType = 'signup' | 'recovery' | 'email_change'

export function isLinkType(value: string | null): value is LinkType {
  return value === 'signup' || value === 'recovery' || value === 'email_change'
}

/** 메일 링크의 token_hash로 인증한다. 메일 보안 검사기가 링크를 미리 열어도 토큰이 소진되지 않도록 버튼을 눌렀을 때만 호출한다. */
export async function confirmFromLink(tokenHash: string, type: LinkType): Promise<AuthResult> {
  if (!authConfigured) return notConfigured()
  const { error } = await (await supabase()).auth.verifyOtp({ token_hash: tokenHash, type })
  if (error) return failWith(error)
  markSignedIn(true)
  if (type === 'signup') track('signup_complete')
  return ok
}

/** 비밀번호 재설정 링크로 들어온 세션에서 새 비밀번호를 저장한다. */
export async function updatePassword(password: string): Promise<AuthResult> {
  if (!authConfigured) return notConfigured()
  if (!(await hasAccountSession())) return fail('no_session', ...ERRORS.no_session)
  const { error } = await (await supabase()).auth.updateUser({ password })
  if (error) return failWith(error)
  track('password_reset_complete')
  return ok
}
