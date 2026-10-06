import { startAnalytics, type Transport } from './analytics'
import { getSupabase } from '../supabaseClient'

// main.tsx에서 환경변수가 있을 때만 동적 import 된다 — supabase-js가 첫 화면 번들에 끼지 않고,
// 환경변수가 없는 로컬/테스트에서는 분석이 아예 꺼진다(VITE_API_BASE_URL 없으면 목데이터로 도는 것과 같은 방식).
const url = import.meta.env.VITE_SUPABASE_URL as string
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// 탭이 닫히는 순간(pagehide)에는 비동기 대기 없이 바로 요청을 출발시켜야 해서, 토큰은 메모리에
// 들고 있다가 그대로 쓴다. supabase-js가 갱신할 때마다 onAuthStateChange로 따라 바뀐다.
let accessToken: string | null = null

async function signInAnonymously() {
  const { data, error } = await getSupabase().auth.signInAnonymously()
  if (error) throw error
  accessToken = data.session?.access_token ?? null
}

async function ensureUser() {
  const supabase = getSupabase()
  supabase.auth.onAuthStateChange((event, session) => {
    accessToken = session?.access_token ?? null
    // 관리자 페이지에서 로그아웃하면 세션이 비므로, 다시 익명 사용자로 돌아와야 기록이 이어진다.
    if (event === 'SIGNED_OUT') void signInAnonymously().catch(() => {})
  })
  const { data } = await supabase.auth.getSession()
  if (data.session) {
    accessToken = data.session.access_token
    return
  }
  await signInAnonymously()
}

// supabase-js의 insert는 keepalive를 지원하지 않아서 REST(PostgREST)를 직접 호출한다.
// user_id는 두 테이블 모두 기본값 auth.uid()가 채운다 — 보내지 않는다.
const transport: Transport = async (table, rows, { keepalive }) => {
  if (!accessToken) return false
  const res = await fetch(`${url}/rest/v1/${table}`, {
    method: 'POST',
    keepalive,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(rows),
  })
  return res.ok
}

export function startSupabaseAnalytics() {
  startAnalytics(transport)
  ensureUser().catch((err) => console.warn('[analytics] anonymous sign-in failed', err))
}
