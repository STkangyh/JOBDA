// Domain types mirrored from BACKEND_SPEC_v2.md (섹션 3, 4, 5, 6, 7, 부록 A)

export type Persona = 'senior' | 'engineering' | 'purchasing'

// Figma 823:53752(Desktop-123) 실측: "선임 디자이너"가 아니라 "선배 디자이너"였음
// (session1의 S1_PERSONA_LABEL.senior와 동일한 표기 — 세션2 쪽만 잘못돼 있었음).
export const PERSONA_LABEL: Record<Persona, string> = {
  senior: '선배 디자이너',
  engineering: '설계팀',
  purchasing: '구매팀',
}

// Figma 823:53752 메신저의 답변 메시지에 붙은 발신자 이름 칩("고프로") — 선배 디자이너=고프로임을
// 실측 확인. engineering/purchasing 발신자는 Brief.tsx 협업 관계자 로스터(고프로·이프로=디자인팀,
// 박책임=설계팀, 김부장=구매팀)의 팀 매핑으로 유추(직접 실측된 프레임은 못 찾음).
export const PERSONA_SENDER_NAME: Record<Persona, string> = {
  senior: '고프로',
  engineering: '박책임',
  purchasing: '김부장',
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
  // Figma 823:53755 — 말풍선 옆에 보내진 시각("13:12")이 표시돼 있어서 추가.
  t?: number
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
  // v4 백엔드 응답에 아직 없는 필드라 store(session.ts)의 finishAssessment에서 채워 넣는다
  // (profile을 client.ts에서 backfill하는 것과 같은 갭 흡수 패턴). session1의 S1ReportResponse와
  // 동일한 필드.
  personaHeadline: string
  burdenNote: string
}

export interface SessionLogRequest {
  session_id: string
  payload: unknown
}

// 시방서 (spec sheet) 입력 필드 — 축 1 판정 기준 (필수: material, color, finish, size, method).
// Figma 823:54925(Desktop-105, "시방서 수정")로 재확인: 예전엔 size/method/cmf/colorChip
// flat 4필드로 다르게 만들어져 있었는데, 실제로는 초안 작성 화면(PartSpec)과 완전히 같은
// 소재/컬러/마감/사이즈(4분할)/제작방식 구성이었음 — PartSpecSize를 그대로 재사용. 이 프레임엔
// 그 다섯 필드 외에 다른 입력이 없어(카드가 제작방식 필드 바로 다음에 끝남), vendorNotes 같은
// 자유 텍스트 필드는 없다.
export interface SpecDraft {
  material: string
  color: string
  finish: string
  size: PartSpecSize
  method: string
  limitSampleAttached: boolean
  limitSampleFileName: string | null
}

// Figma 823:53712~823:54461(Desktop-123~128) — 초안 작성 화면은 부품 태그(목재 흡기구 커버 등
// 6개)가 실제로는 탭이었고, 탭마다 독립된 소재/컬러/마감/사이즈/제작방식/선택근거를 입력받는다.
// 최종본 수정 화면(SpecDraft)은 탭 전환은 없지만 필드 구성 자체는 PartSpec과 동일해서
// PartSpecSize를 공유한다.
export interface PartSpecSize {
  depth: string
  width: string
  height: string
  thickness: string
}

// Figma 823:53807("Add") — 컬러 입력 옆 + 버튼. 눌렀을 때 컬러칩과 한도 견본 판정표 중 하나를
// 첨부하는 용도(둘 다 색/마감 판정 근거 자료라 같은 자리에 묶여 있음). 부품마다 하나만 첨부 가능.
export type PartAttachment = 'colorChip' | 'limitSample' | null

export interface PartSpec {
  material: string
  color: string
  finish: string
  size: PartSpecSize
  method: string
  reasoning: string
  attachment: PartAttachment
  // OS 파일 탐색기로 실제 선택한 파일명(File.name). attachment가 null이면 같이 null.
  attachmentFileName: string | null
}

export interface VendorOption {
  name: string
  leadTimeDays: number | ''
  quantity: number | ''
  unitPrice: number | ''
}

export type Stage =
  | 'brief'
  | 'materials'
  | 'workspace'
  | 'senior_feedback'
  | 'final_feedback'
  | 'branch_select'
  | 'vendor_compare'
  | 'self_assessment'
  | 'report'

// Figma 823:52645(Desktop-117)의 5점 척도 라벨 — 세션1(744:15050/Desktop-87)과 동일한 스케일을
// 자기평가 3문항이 공유한다. 세션1 store(session1.ts)를 세션2 store가 직접 import하는 역방향
// 의존을 피하기 위해, 공유 도메인 타입 파일인 여기(types.ts)에 둔다.
export const RATING_SCALE = ['전혀 아니다', '아니다', '보통', '그렇다', '매우 그렇다'] as const
export type RatingScale = (typeof RATING_SCALE)[number]

// Figma 823:52946(Desktop-121)에 세션1(744:15120/Desktop-38)과 동일한 페르소나 한줄평 문구가
// 재사용되어 있다. Figma에 이 문구 하나만 확인되어 고정 문구로 사용(다른 변형은 근거 없어 생략).
export const PERSONA_HEADLINE_FIXED = '뚝심 강한 디자이너 DNA가 흐르고 있어요'

export interface SelfAssessment {
  interestScore: RatingScale
  expectationGap: RatingScale
  repeatWillingness: RatingScale
  burdenNote: string
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
  // Figma 823:53712(Desktop-123) 등 — 메신저에서 관계자 답변에 "답변 내용 노트에 저장" 버튼.
  // 세션1(store/session1.ts)의 savedNotes/saveNote와 같은 발상.
  savedNotes: string[]
  draft: SpecDraft
  draftParts: PartSpec[]
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
