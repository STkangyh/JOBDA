// public.admin_report() 응답 — supabase/migrations/20261006000000_admin_dashboard.sql
export interface FunnelStep {
  ord: number
  stage: string
  sessions: number
  pct_of_start: number | null
}

export interface DailyRow {
  day: string
  visits: number
  users: number
  sessions_started: number
  sessions_completed: number
}

export interface AdminReport {
  since: string | null
  overview: { visits: number; users: number; sessions_started: number; sessions_completed: number }
  daily: DailyRow[]
  funnel_s1: FunnelStep[]
  funnel_s2: FunnelStep[]
  screens: { screen: string; views: number; visits: number; exits: number; exit_rate_pct: number; median_duration_s: number | null }[]
  bounce: { landing: string | null; visits: number; bounces: number; bounce_rate_pct: number }[]
  views: {
    screen: string
    view: string
    kind: string
    opens: number
    visits: number
    open_rate_pct: number | null
    median_duration_s: number | null
    close_how: Record<string, number> | null
    exits_in_view: number
  }[]
  exits: { screen: string | null; view: string | null; last_action: string; visits: number }[]
  // 유저 테스트 참가자(?ut=코드) 세션 — 이 필드가 생기기 전 마이그레이션이면 없을 수 있다.
  ut_sessions?: UtSession[]
  ut_stages?: { flow: 's1' | 's2'; screen: string; sessions: number; median_s: number }[]
}

export type UtStatus = 'completed' | 'in_progress' | 'exited'

export interface UtSession {
  participant: string
  session_id: string
  flow: 's1' | 's2'
  started_at: string
  completed_at: string | null
  last_at: string
  status: UtStatus
  time_on_task_s: number
  exit_screen: string | null
  messages: number
  system_errors: number
  stage_seconds: Record<string, number>
}

export interface ActivityRow {
  ts: string
  activity: string
  screen: string | null
  detail: string | null
}

export type Period = 'today' | '7d' | '30d' | 'all'

export const PERIODS: { id: Period; label: string }[] = [
  { id: 'today', label: '오늘' },
  { id: '7d', label: '최근 7일' },
  { id: '30d', label: '최근 30일' },
  { id: 'all', label: '전체' },
]

const DAY_MS = 86_400_000
const KST_OFFSET_MS = 9 * 3_600_000

// "오늘"은 한국 시간 자정부터 — 서버 집계(daily_activity)도 Asia/Seoul 날짜 기준이라 맞춘다.
export function periodSince(period: Period, now = Date.now()): string | null {
  if (period === 'all') return null
  if (period === 'today') {
    const kstMidnight = Math.floor((now + KST_OFFSET_MS) / DAY_MS) * DAY_MS - KST_OFFSET_MS
    return new Date(kstMidnight).toISOString()
  }
  return new Date(now - (period === '7d' ? 7 : 30) * DAY_MS).toISOString()
}

export function kstDay(ms: number) {
  return new Date(ms + KST_OFFSET_MS).toISOString().slice(0, 10)
}

// 방문이 없던 날도 0으로 보여야 추이가 왜곡되지 않는다 — 기간 안의 날짜를 전부 채운다(전체는 최근 60일).
export function fillDays(rows: DailyRow[], period: Period, now = Date.now()): DailyRow[] {
  const span = period === 'today' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 60
  const byDay = new Map(rows.map((r) => [r.day, r]))
  return Array.from({ length: span }, (_, i) => {
    const day = kstDay(now - (span - 1 - i) * DAY_MS)
    return byDay.get(day) ?? { day, visits: 0, users: 0, sessions_started: 0, sessions_completed: 0 }
  })
}

const STAGES: Record<string, string> = {
  brief: '브리프',
  materials: '자료탐색',
  workspace: '관계자 협업',
  senior_feedback: '1차 피드백',
  final_feedback: '최종 피드백',
  branch_select: '방향 선택',
  vendor_compare: '업체 비교',
  self_assessment: '자기 평가',
  report: '직무 리포트',
  round: '라운드',
  final_check: '최종 확인',
}

const PAGES: Record<string, string> = {
  '/': '홈',
  '/explore': '홈',
  '/explore/job': '직무 상세',
  '/journey-map': '체험맵',
  '/comprehensive-report': '종합 리포트',
  '/proposal-writing': '제안서 작성(미리보기)',
  '/design-system': '디자인 시스템',
  mobile_notice: '모바일 안내',
  not_found: '없는 페이지',
}

// 세션 안 단계 순서 — 단계별 소요 시간 표를 체험 순서대로 놓는 데 쓴다.
const FLOW_STAGES: Record<'s1' | 's2', string[]> = {
  s1: ['brief', 'materials', 'round', 'final_check', 'self_assessment', 'report'],
  s2: ['brief', 'materials', 'workspace', 'senior_feedback', 'final_feedback', 'branch_select', 'vendor_compare', 'self_assessment', 'report'],
}

export function stageOrder(flow: 's1' | 's2', screen: string) {
  const i = FLOW_STAGES[flow].indexOf(screen.split('/')[1] ?? '')
  return (flow === 's1' ? 0 : 100) + (i < 0 ? 99 : i)
}

export function stageLabel(stage: string) {
  return STAGES[stage] ?? stage
}

export function screenLabel(screen: string | null) {
  if (!screen) return '알 수 없음'
  const m = screen.match(/^session([12])\/(.+)$/)
  if (m) return `세션${m[1]} · ${stageLabel(m[2])}`
  return PAGES[screen] ?? screen
}

const PERSONAS: Record<string, string> = { senior: '선배 디자이너', engineering: '설계팀', purchasing: '구매팀' }
const VIEW_VALUES: Record<string, string> = {
  research: '조사',
  select: '선택',
  feedback: '피드백',
  spec_form: '시방서 양식',
  limit_sample: '한도 견본 판정표',
  draft: '초안',
  final: '최종본',
  concept_a: '시안 A',
  concept_b: '시안 B',
  concept_c: '시안 C',
  design_file: '설계 파일',
  mockup_guide: '목형 제작 가이드',
  design_guide: '디자인 구체화 가이드',
}
const VIEW_GROUPS: Record<string, string> = {
  messenger: '메신저',
  vendor_phase: '업체 비교',
  materials_doc: '자료',
  workspace_mode: '시방서',
  round: '라운드',
}

export function viewLabel(view: string | null) {
  if (!view) return '—'
  const [group, value = ''] = view.split(':')
  const g = VIEW_GROUPS[group] ?? group
  const v = PERSONAS[value] ?? VIEW_VALUES[value] ?? value
  return v ? `${g} · ${v}` : g
}

export const KIND_LABELS: Record<string, string> = { tab: '탭', panel: '패널', modal: '모달', drawer: '드로어' }

export const CLOSE_LABELS: Record<string, string> = {
  button: '버튼',
  esc: 'ESC',
  backdrop: '바깥 클릭',
  switch: '전환',
  unmount: '화면 이동',
  navigate: '화면 이동',
}

const ACTIONS: Record<string, string> = {
  screen_view: '도착 직후 이탈',
  ask: '메신저 질문',
  submit: '제출',
  doc_view: '자료 열람',
  download: '자료 다운로드',
  chat_error: '채팅 실패',
  chat_retry: '채팅 재시도',
  job_select: '직무 선택',
  job_start: '직무 시작',
  cta: '버튼 클릭',
  report_error: '리포트 생성 실패',
  branch: '방향 선택',
  revise: '수정',
  session_reset: '다시 체험하기',
}

export function actionLabel(name: string) {
  return ACTIONS[name] ?? name
}

export const UT_STATUS_LABELS: Record<UtStatus, string> = { completed: '완료', in_progress: '진행 중', exited: '중간 이탈' }

// 유저 테스트 기획서의 Activity Log 이름
const ACTIVITIES: Record<string, string> = {
  session_start: '세션 시작',
  material_open: '자료 열람',
  stakeholder_open: '관계자 선택',
  message_send: '관계자에게 질문',
  decision_select: '선택지 선택',
  reason_submit: '선택 근거 제출',
  feedback_receive: 'AI 피드백 확인',
  revision_submit: '수정안 제출',
  self_eval_start: '자기평가 시작',
  report_view: '리포트 확인',
  session_complete: '세션 완료',
  session_exit: '중간 이탈',
}

export function activityLabel(name: string) {
  return ACTIVITIES[name] ?? name
}

const DETAILS: Record<string, string> = {
  vendor: '업체',
  vendor_proposal: '업체 제안',
  vendor_report: '업체 선정 보고',
  final_approval: '최종 승인 요청',
  wood_dropped: '목재 포기',
  sheet_wrap: '시트 래핑',
  outsourcing: '외주',
}

// 활동의 대상(자료·관계자·선택지)을 읽기 쉽게. 화면 경로면 화면 이름, 뷰 이름이면 뷰 이름으로.
export function activityDetail(row: ActivityRow) {
  const d = row.detail
  if (!d) return ''
  if (d.startsWith('session')) return screenLabel(d)
  if (d.includes(':')) return viewLabel(d)
  const round = d.match(/^round_(\d+)$/)
  if (round) return `라운드 ${round[1]}`
  return PERSONAS[d] ?? VIEW_VALUES[d] ?? DETAILS[d] ?? d
}

export function formatCount(n: number) {
  return n.toLocaleString('ko-KR')
}

export function formatDuration(sec: number | null) {
  if (sec == null) return '—'
  const s = Math.round(sec)
  if (s < 60) return `${s}초`
  const m = Math.floor(s / 60)
  return s % 60 ? `${m}분 ${s % 60}초` : `${m}분`
}

export function formatPct(p: number | null) {
  return p == null ? '—' : `${Number(p).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}%`
}
