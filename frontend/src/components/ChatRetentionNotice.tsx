import { Text } from './Text'
import { ANALYTICS_ENABLED } from '../lib/analytics'

// 메신저 대화 원문은 chat_logs에 저장된다(store/session.ts·session1.ts의 logChat) — 저장이 실제로
// 켜져 있을 때만(Supabase 환경변수가 있을 때) 보관 사실과 기간을 알린다.
const CHAT_RETENTION_TEXT = '대화 내용은 서비스 개선을 위해 저장되며 90일 후 삭제돼요.'

export function ChatRetentionNotice() {
  if (!ANALYTICS_ENABLED) return null
  return (
    <Text variant="caption-sm" className="text-center text-neutral-400">
      {CHAT_RETENTION_TEXT}
    </Text>
  )
}
