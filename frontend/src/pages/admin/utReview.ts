import type { Evidence, IssueType, UtReview, UtSession } from './report'

// UT 운영 문서 "관리자 Drop-off 및 Friction 분석" 폼의 선택지
export const ISSUE_TYPES: { id: IssueType; label: string }[] = [
  { id: 'dropoff', label: 'Drop-off — 체험 미완료·중단' },
  { id: 'friction', label: 'Friction — 혼란·막힘 의심' },
  { id: 'tech_error', label: '기술적 오류' },
  { id: 'none', label: '문제 확인되지 않음' },
]

export const EVIDENCE: { id: Evidence; label: string }[] = [
  { id: 'log', label: 'Activity Log만 확인' },
  { id: 'survey', label: '참가자 설문 응답 확인' },
  { id: 'recording', label: '화면 녹화 확인' },
  { id: 'multiple', label: '복수 근거 확인' },
]

// 원인 분류 목록은 팀이 확정해서 전달하기로 함(2026-10-10). 그 전까지는 두 가지만 둔다.
// 목록을 바꿔도 DB는 문자열로 저장하므로 마이그레이션이 필요 없다.
export const REASONS: { id: string; label: string }[] = [
  { id: 'unknown', label: '원인 불명' },
  { id: 'other', label: '기타 (메모에 기록)' },
]

export function reasonLabel(id: string) {
  return REASONS.find((r) => r.id === id)?.label ?? id
}

export const ISSUE_SHORT: Record<IssueType, string> = { dropoff: 'Drop-off', friction: 'Friction', tech_error: '기술 오류', none: '문제 없음' }

// 저장된 검토가 없을 때 폼의 출발점 — 로그로 확인된 사실만 보고 고른 "제안"이며, 관리자가 확인 후 저장한다.
// 원인은 항상 '원인 불명'에서 시작한다(로그만으로는 원인을 확정할 수 없다).
export function suggestReview(s: UtSession): UtReview {
  const issue: IssueType =
    s.status === 'incomplete' || s.status === 'exited' ? 'dropoff' : s.system_errors > 0 ? 'tech_error' : s.repeat_opens >= 2 ? 'friction' : 'none'
  return { issue_type: issue, reason: 'unknown', evidence: 'log', note: '' }
}

// 근거가 로그뿐인데 원인을 특정했다면 확정이 아니라 추정이다.
export function isPresumed(r: UtReview) {
  return r.evidence === 'log' && r.reason !== 'unknown'
}
