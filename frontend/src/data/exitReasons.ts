// 체험을 그만두는 이유 (Figma 2454:18645) — 나가기 확인 창에서 참가자가 고르고,
// 관리자 페이지 UT 검토의 원인 목록에도 같은 항목을 쓴다. id는 기록에 남으므로 바꾸지 않는다.
export const EXIT_REASONS = [
  { id: 'hard_to_use', label: '이용 방법이 어려워요' },
  { id: 'hard_task', label: '업무 내용이 어려워요' },
  { id: 'boring', label: '진행이 지루하거나 반복적이에요' },
  { id: 'too_long', label: '시간이 너무 오래걸려요' },
  { id: 'error_delay', label: '오류나 응답 지연이 있어요' },
  { id: 'other', label: '기타' },
] as const

export type ExitReasonId = (typeof EXIT_REASONS)[number]['id']

/** "기타"에 직접 쓰는 이유의 최대 길이 */
export const EXIT_NOTE_MAX = 100
