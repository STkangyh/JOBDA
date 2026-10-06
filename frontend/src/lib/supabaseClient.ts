import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// 활동 로그(익명 로그인)와 관리자 페이지(이메일 로그인)가 같은 클라이언트·같은 로그인 저장소를 쓴다 —
// 클라이언트가 둘이면 서로의 세션을 덮어쓰며 경고가 난다. 이 모듈은 환경변수가 있을 때만
// 동적 import 되므로 supabase-js는 첫 화면 번들에 들어가지 않는다.
let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  client ??= createClient(import.meta.env.VITE_SUPABASE_URL as string, import.meta.env.VITE_SUPABASE_ANON_KEY as string)
  return client
}
