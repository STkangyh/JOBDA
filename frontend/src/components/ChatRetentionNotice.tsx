import { Text } from './Text'
import { ANALYTICS_ENABLED } from '../lib/analytics'

// 메신저 대화 원문은 chat_logs(30일 후 삭제)와 계정 진행 기록(user_progress, 보관 기간 미정)에 저장된다 —
// 저장이 실제로 켜져 있을 때만(Supabase 환경변수가 있을 때) 알린다.
// 계정 기록에는 기한이 없어 "30일 후 삭제"는 빼고 사실대로 적었다(2026-11-03 결정). 보관 기간은 UT 후 정한다.
const CHAT_RETENTION_TEXT = '대화 내용은 서비스 개선과 이어 하기를 위해 계정에 저장돼요.'

export function ChatRetentionNotice() {
  if (!ANALYTICS_ENABLED) return null
  return (
    <Text variant="caption-sm" className="text-center text-neutral-400">
      {CHAT_RETENTION_TEXT}
    </Text>
  )
}
