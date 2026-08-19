import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { chat as apiChat, report as apiReport, sessionLog as apiSessionLog } from '../api/client'
import { PERSONA_HEADLINE_FIXED } from '../types'
import type {
  ActionLog,
  ActionLogType,
  Branch,
  Finding,
  FindingCode,
  Persona,
  PartAttachment,
  PartSpec,
  ReportResponse,
  Scores,
  SelfAssessment,
  SessionState,
  SpecDraft,
  Stage,
  VendorOption,
} from '../types'

const REQUIRED_FIELDS: (keyof SpecDraft)[] = ['size', 'method', 'cmf', 'colorChip']

const emptyDraft = (): SpecDraft => ({
  size: '',
  method: '',
  cmf: '',
  colorChip: '',
  limitSampleAttached: false,
  vendorNotes: '',
})

// Figma 823:53712~823:54461(Desktop-123~128) 부품 태그 6개(목재 흡기구 커버/상부 하우징/
// 하부 하우징/가죽 스트랩/PUI 패널/미끄럼 방지 패드) 순서와 맞춘 6칸. 라벨 자체는 화면(Workspace.tsx)
// 쪽 PART_TAGS가 갖고 있고, 여기는 그 개수(6)만 안다.
const PART_COUNT = 6

const emptyPartSpec = (): PartSpec => ({
  material: '',
  color: '',
  finish: '',
  size: { depth: '', width: '', height: '', thickness: '' },
  method: '',
  reasoning: '',
  attachment: null,
})

const emptyVendors = (): VendorOption[] => [
  { name: '', leadTimeDays: '', quantity: '', unitPrice: '' },
  { name: '', leadTimeDays: '', quantity: '', unitPrice: '' },
  { name: '', leadTimeDays: '', quantity: '', unitPrice: '' },
]

const initialState = (): SessionState => ({
  sessionId: crypto.randomUUID(),
  currentStage: 'brief',
  currentStep: 's1',
  viewedDocs: {},
  askedCapability: false,
  askedBudget: false,
  chatHistory: { senior: [], engineering: [], purchasing: [] },
  disclosedInfo: {},
  savedNotes: [],
  draft: emptyDraft(),
  draftParts: Array.from({ length: PART_COUNT }, emptyPartSpec),
  draftSubmitted: false,
  finalSubmitted: false,
  final: emptyDraft(),
  revisitCount: 0,
  branch: null,
  vendors: emptyVendors(),
  vendorSubmitted: false,
  // Figma 823:52645(Desktop-117) 주석: 세션1(744:15050/Desktop-87)과 동일하게 기본값은 "보통".
  selfAssessment: { interestScore: '보통', expectationGap: '보통', repeatWillingness: '보통', burdenNote: '' },
  actionLogs: [],
  report: null,
})

interface SessionActions {
  goTo: (stage: Stage) => void
  viewDoc: (key: string) => void
  sendMessage: (persona: Persona, message: string) => Promise<string>
  saveNote: (text: string) => void
  updateDraftPart: (index: number, fields: Partial<PartSpec>) => void
  setPartAttachment: (index: number, attachment: PartAttachment) => void
  updateDraft: (fields: Partial<SpecDraft>) => void
  submitDraft: () => void
  updateFinal: (fields: Partial<SpecDraft>) => void
  submitFinal: () => void
  chooseBranch: (branch: Branch) => void
  updateVendor: (index: number, fields: Partial<VendorOption>) => void
  submitVendors: () => void
  setSelfAssessment: (fields: Partial<SelfAssessment>) => void
  finishAssessment: () => Promise<void>
  resetSession: () => void
}

function specComplete(spec: SpecDraft): boolean {
  return REQUIRED_FIELDS.every((k) => spec[k].toString().trim().length > 0)
}

function computeScores(state: SessionState): Scores {
  const intent_delivery: Scores['intent_delivery'] = !specComplete(state.final)
    ? 1
    : !state.final.limitSampleAttached
      ? 2
      : 3

  const concept_retention: Scores['concept_retention'] =
    state.branch === 'wood_dropped' ? 1 : state.branch === 'sheet_wrap' ? 2 : 3

  let cost_control: Scores['cost_control'] = 2
  if (state.branch === 'outsourcing') {
    const validVendors = state.vendors.filter((v) => v.name && v.leadTimeDays && v.quantity && v.unitPrice)
    if (!state.askedBudget) cost_control = 1
    else if (validVendors.length >= 3) cost_control = 3
    else cost_control = 2
  }

  return { intent_delivery, concept_retention, cost_control }
}

function computeFindings(state: SessionState): Finding[] {
  const findings: Finding[] = []
  const add = (code: FindingCode, evidence: Record<string, unknown> = {}) => findings.push({ code, evidence })

  if (!specComplete(state.final)) add('spec_field_missing')
  if (!state.draft.limitSampleAttached) add('limit_sample_missing_in_draft')

  if (state.askedCapability) add('asked_capability_before_final')
  else add('capability_never_asked')

  if (!state.askedBudget) add('budget_never_asked')

  if (state.branch === 'outsourcing') {
    const validVendors = state.vendors.filter((v) => v.name && v.leadTimeDays && v.quantity && v.unitPrice)
    if (validVendors.length >= 3) add('vendor_compared_three')
    else if (state.vendorSubmitted) add('vendor_criteria_incomplete')
  }

  if (state.revisitCount > 0) add('revisited_after_branch')
  if (state.branch === 'wood_dropped') add('concept_abandoned')

  const deadlineMentioned = /12일|일정|납기/.test(state.final.vendorNotes || '')
  if (!deadlineMentioned) add('deadline_margin_ignored')

  return findings
}

export const useSession = create<SessionState & SessionActions>()(
  persist(
    (set, get) => ({
      ...initialState(),

      goTo: (stage) => set({ currentStage: stage }),

      viewDoc: (key) => {
        set((s) => ({ viewedDocs: { ...s.viewedDocs, [key]: true } }))
        pushLog(set, get, 'doc_view', { target: key })
      },

      saveNote: (text) => set((s) => (s.savedNotes.includes(text) ? s : { savedNotes: [...s.savedNotes, text] })),

      updateDraftPart: (index, fields) =>
        set((s) => ({
          draftParts: s.draftParts.map((p, i) =>
            i === index ? { ...p, ...fields, size: fields.size ? { ...p.size, ...fields.size } : p.size } : p,
          ),
        })),

      // Figma 823:53807("Add") — 컬러 옆 + 버튼으로 부품마다 컬러칩 또는 한도 견본 판정표 중
      // 하나를 첨부. 한도 견본 판정표는 draft.limitSampleAttached(계산 로직이 참조하는 flat 필드)와
      // 도 연동해서, 부품 중 하나라도 첨부하면 "초안에 한도 견본 안 붙임" finding이 사라지게 한다.
      setPartAttachment: (index, attachment) =>
        set((s) => {
          const draftParts = s.draftParts.map((p, i) => (i === index ? { ...p, attachment } : p))
          return {
            draftParts,
            draft: { ...s.draft, limitSampleAttached: draftParts.some((p) => p.attachment === 'limitSample') },
          }
        }),

      sendMessage: async (persona, message) => {
        const s = get()
        const history = s.chatHistory[persona]
        const res = await apiChat({ persona, history, message })

        const askedCapability = s.askedCapability || res.disclose.includes('inhouse_capability') || res.disclose.includes('sheet_lead_time')
        const askedBudget =
          s.askedBudget ||
          res.disclose.includes('budget_limit') ||
          res.disclose.includes('cost_impact') ||
          res.disclose.includes('part_cost_share')

        set((state) => ({
          chatHistory: {
            ...state.chatHistory,
            [persona]: [
              ...state.chatHistory[persona],
              { role: 'user', content: message, t: Date.now() },
              { role: 'assistant', content: res.reply, t: Date.now() },
            ],
          },
          disclosedInfo: {
            ...state.disclosedInfo,
            [persona]: Array.from(new Set([...(state.disclosedInfo[persona] ?? []), ...res.disclose])),
          },
          askedCapability,
          askedBudget,
        }))
        pushLog(set, get, 'ask', { actor: persona, intent: res.intent })
        return res.reply
      },

      updateDraft: (fields) => set((s) => ({ draft: { ...s.draft, ...fields } })),
      submitDraft: () => {
        set({ draftSubmitted: true, currentStage: 'senior_feedback', final: { ...get().draft } })
        pushLog(set, get, 'submit', { target: 'draft' })
      },

      updateFinal: (fields) => set((s) => ({ final: { ...s.final, ...fields } })),
      submitFinal: () => {
        set({ finalSubmitted: true, currentStage: 'final_feedback' })
        pushLog(set, get, 'submit', { target: 'final' })
      },

      chooseBranch: (branch) => {
        const s = get()
        pushLog(set, get, 'branch', { target: branch })

        if (branch === 'wood_dropped' && s.revisitCount < 1) {
          set({
            branch,
            revisitCount: s.revisitCount + 1,
            draftSubmitted: false,
            finalSubmitted: false,
            currentStage: 'workspace',
            currentStep: 's2',
          })
          pushLog(set, get, 'revise', { target: 'draft' })
          return
        }

        if (branch === 'outsourcing') {
          set({ branch, currentStage: 'vendor_compare' })
          return
        }

        set({ branch, currentStage: 'self_assessment' })
      },

      updateVendor: (index, fields) =>
        set((s) => ({
          vendors: s.vendors.map((v, i) => (i === index ? { ...v, ...fields } : v)),
        })),
      submitVendors: () => {
        set({ vendorSubmitted: true, currentStage: 'self_assessment' })
        pushLog(set, get, 'submit', { target: 'vendor_report' })
      },

      setSelfAssessment: (fields) => set((s) => ({ selfAssessment: { ...s.selfAssessment, ...fields } })),

      finishAssessment: async () => {
        const s = get()
        const scores = computeScores(s)
        const findings = computeFindings(s)
        const res = await apiReport({
          scores,
          branch: s.branch ?? 'wood_dropped',
          findings,
          action_logs: s.actionLogs,
        })
        // session1(store/session1.ts)의 finishAssessment와 동일한 패턴: personaHeadline/burdenNote는
        // v4 백엔드 응답에 없는 필드라 여기서 채워 넣는다. ReportRequest에 selfAssessment가 없어
        // client.ts 경계에서는 burdenNote를 알 수 없으므로, selfAssessment에 접근 가능한 이
        // 액션에서 무조건 덮어쓴다(백엔드가 뭘 보내든 프론트가 최종 소스).
        const report: ReportResponse = {
          ...res,
          personaHeadline: PERSONA_HEADLINE_FIXED,
          burdenNote: s.selfAssessment.burdenNote.trim(),
        }
        set({ report, currentStage: 'report' })
        await apiSessionLog({ session_id: s.sessionId, payload: get() })
      },

      resetSession: () => set(initialState()),
    }),
    { name: 'coad-hackerton-session' },
  ),
)

// action log seq는 1부터 순차 증가해야 하므로 헬퍼로 분리 (finding 판정의 유일한 근거 — 부록 A)
function pushLog(
  set: (fn: (s: SessionState) => Partial<SessionState>) => void,
  get: () => SessionState,
  type: ActionLogType,
  extra: Partial<ActionLog>,
) {
  const s = get()
  const entry: ActionLog = { seq: s.actionLogs.length + 1, t: Date.now(), type, ...extra }
  set((state) => ({ actionLogs: [...state.actionLogs, entry] }))
}
