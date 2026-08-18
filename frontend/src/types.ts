// Domain types mirrored from BACKEND_SPEC_v2.md (섹션 3, 4, 5, 6, 7, 부록 A)

export type Persona = 'senior' | 'engineering' | 'purchasing'

export const PERSONA_LABEL: Record<Persona, string> = {
  senior: '선임 디자이너',
  engineering: '설계팀',
  purchasing: '구매팀',
}

export const DISCLOSE_KEYS: Record<Persona, string[]> = {
  senior: ['spec_format', 'limit_sample', 'vendor_criteria'],
  engineering: ['inhouse_capability', 'sheet_lead_time'],
  purchasing: ['budget_limit', 'cost_impact', 'part_cost_share'],
}

export type Branch = 'wood_dropped' | 'sheet_wrap' | 'outsourcing'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  persona: Persona
  history: ChatMessage[]
  message: string
}

export interface ChatResponse {
  reply: string
  intent: string
  disclose: string[]
}

export type ActionLogType = 'doc_view' | 'ask' | 'submit' | 'branch' | 'revise'

export interface ActionLog {
  seq: number
  t: number
  type: ActionLogType
  target?: string
  actor?: Persona
  intent?: string
}

export type FindingCode =
  | 'limit_sample_missing_in_draft'
  | 'spec_field_missing'
  | 'asked_capability_before_final'
  | 'capability_never_asked'
  | 'budget_never_asked'
  | 'vendor_compared_three'
  | 'vendor_criteria_incomplete'
  | 'revisited_after_branch'
  | 'concept_abandoned'
  | 'deadline_margin_ignored'

export interface Finding {
  code: FindingCode
  evidence: Record<string, unknown>
}

export interface Scores {
  intent_delivery: 1 | 2 | 3
  concept_retention: 1 | 2 | 3
  cost_control: 1 | 2 | 3
}

export interface ReportRequest {
  scores: Scores
  branch: Branch
  findings: Finding[]
  action_logs: ActionLog[]
}

// "직무 이해 프로필" 스펙트럼 축. value 0 = leftLabel 쪽, 100 = rightLabel 쪽.
export interface ProfileAxis {
  leftLabel: string
  rightLabel: string
  caption: string
  value: number
}

export interface ReportResponse {
  work_overview: string
  strengths: string[]
  cautions: string[]
  missed: string[]
  job_meaning: string
  profile: ProfileAxis[]
}

export interface SessionLogRequest {
  session_id: string
  payload: unknown
}

// 시방서 (spec sheet) 입력 필드 — 축 1 판정 기준 (필수: size, method, cmf, colorChip)
export interface SpecDraft {
  size: string
  method: string
  cmf: string
  colorChip: string
  limitSampleAttached: boolean
  vendorNotes: string
}

export interface VendorOption {
  name: string
  leadTimeDays: number | ''
  quantity: number | ''
  unitPrice: number | ''
}

export type Stage =
  | 'home'
  | 'brief'
  | 'workspace'
  | 'senior_feedback'
  | 'final_feedback'
  | 'branch_select'
  | 'vendor_compare'
  | 'self_assessment'
  | 'report'

export interface SelfAssessment {
  interestScore: 1 | 2 | 3 | 4 | 5 | null
  expectationGap: '거의 같았다' | '일부 달랐다' | '상당히 달랐다' | null
  repeatWillingness: '그렇다' | '잘 모르겠다' | '그렇지 않다' | null
  burdenItems: string[]
}

export interface SessionState {
  sessionId: string
  currentStage: Stage
  currentStep: string
  viewedDocs: Record<string, boolean>
  askedCapability: boolean
  askedBudget: boolean
  chatHistory: Record<Persona, ChatMessage[]>
  disclosedInfo: Partial<Record<Persona, string[]>>
  draft: SpecDraft
  draftSubmitted: boolean
  finalSubmitted: boolean
  final: SpecDraft
  revisitCount: number
  branch: Branch | null
  vendors: VendorOption[]
  vendorSubmitted: boolean
  selfAssessment: SelfAssessment
  actionLogs: ActionLog[]
  report: ReportResponse | null
}
