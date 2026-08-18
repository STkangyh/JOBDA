import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProfileAxis } from '../types'
import draftRound1Image from '../assets/illustrations/session1-concept-a.png'

// 세션1 "프로토타입 수정" — Figma 373:147 구역에서 발굴. 협상 라운드 서사는
// 실제 발견한 라운드3 화면(587:9749)의 채팅 로그를 역산해서 재구성함:
// R1) 3파츠+벨트라인 제안 -> 박책임 반려(금형비용, 하나로 줄여달라)
// R2) 조각 수 줄이고 벤트홀로 벨트라인 느낌 유지 -> 박책임 반려(나사산 때문에 사출 안 빠짐)
// R3) 결합부를 목재 파트로 이동 -> 박책임 수용
// 라운드별 정확한 선택지 문구는 Figma에 없어 서사에 맞게 새로 채움(사용자 승인됨).

export type S1Persona = 'engineering' | 'purchasing' | 'senior'

export const S1_PERSONA_LABEL: Record<S1Persona, string> = {
  engineering: '설계팀',
  purchasing: '구매팀',
  senior: '선배 디자이너',
}

export interface S1ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export type S1Stage = 'brief' | 'materials' | 'round' | 'final_check' | 'self_assessment' | 'report'

export interface S1Choice {
  label: string
  sublabel: string
  optionalNote?: string
}

export interface S1RoundSpec {
  roundNumber: 1 | 2 | 3
  draftLabel: string
  draftDescription: string
  /** 라운드1만 Figma에 실제 참고 이미지가 있어서 옵셔널로 둠(2/3라운드는 다른 형상이라 재사용 안 함). */
  draftImage?: string
  feedbackTitle: string
  feedbackText: string
  accepted: boolean
  choices: [S1Choice, S1Choice]
}

export const S1_ROUNDS: S1RoundSpec[] = [
  {
    roundNumber: 1,
    draftLabel: '초안',
    draftDescription:
      '바디 부분의 하우징을 세 조각으로 나눴습니다. 위아래는 세로 슬랫 구조로 타공된 흡기구, 가운데를 가로지르는 벨트라인. 자칫 투박해보일 수 있는 면을 벨트라인으로 나누어 제품이 컴팩트해 보이게 한 안입니다.',
    draftImage: draftRound1Image,
    feedbackTitle: '1차 피드백',
    feedbackText:
      '재현씨가 만들고 있는 목업 잘 봤어요. 근데 이대로 만들려면 예산 못 맞춰요. 금형 하나 파는데 얼마나 드는지 아세요? 아무리 제품이 작아도 천은 우습게 깨집니다. 하우징 파트 나누지 말고 하나로 어떻게 안되나요?',
    accepted: false,
    choices: [
      { label: '하나로 통합', sublabel: '금형 비용을 줄이기 위해 3파츠를 1피스로 축소' },
      {
        label: '3파츠 유지, 다른 방식으로 비용 절감',
        sublabel: '벨트라인 의도를 지키고 다른 항목에서 원가 조율',
        optionalNote: '구매팀에 예산 여지 문의(선택)',
      },
    ],
  },
  {
    roundNumber: 2,
    draftLabel: '수정 1안',
    draftDescription:
      '기존 띠 느낌은 그대로 살리고 싶어서 한 조각으로 줄이고 케이스 가운데를 깊게 파서 벤트홀을 만들었습니다.',
    feedbackTitle: '2차 피드백',
    feedbackText:
      '조각은 줄었는데, 이번엔 다른 게 걸려요. 결합 구조가 바뀌면서 상단부 하우징에 결합부 나사선이 추가 됐어요. 이대로 가면 금형에서 사출물 안 빠집니다.',
    accepted: false,
    choices: [
      { label: '결합부 위치 수정', sublabel: '나사선을 목재 파트 쪽으로 이동해 언더컷 해소' },
      {
        label: '조각 수 다시 늘려 결합 단순화',
        sublabel: '벤트홀 대신 조각을 나눠 나사선 자체를 없앰',
        optionalNote: '선배 디자이너에게 의견 구하기(선택)',
      },
    ],
  },
  {
    roundNumber: 3,
    draftLabel: '수정 2안',
    draftDescription: '말씀하신 결합구조 목재 파트로 위치 수정하였습니다.',
    feedbackTitle: '3차 피드백',
    feedbackText:
      '이건 구현 가능성이 높아 보입니다. 내부 부품과 간섭도 없을 것 같고 괜찮네요.\n이대로 진행하시죠.',
    accepted: true,
    choices: [
      { label: '합의안으로 확정', sublabel: '디자인 제안서에 최종 반영' },
      {
        label: '두 조각 유지, 타 항목에서 비용 절감',
        sublabel: '',
        optionalNote: '선배 디자이너에게 의견 구하기(선택)',
      },
    ],
  },
]

const NOTE_TAGS = {
  userNeeds: ['저소음', '공간 효율', '따뜻함', '관리 용이', '인테리어 오브제 느낌'],
  constraints: [
    '파팅라인 단차 0.5mm 이격할 것',
    '에어케어 제품과 내부 설계 공유',
    '전면부 하우징은 하나로',
    '나사산 위치 수정',
  ],
}

export interface S1ReportResponse {
  work_overview: string
  strengths: string[]
  cautions: string[]
  missed: string[]
  job_meaning: string
  profile: ProfileAxis[]
  personaHeadline: string
  burdenNote: string
}

// Figma 744:15050(Desktop-87)의 5점 척도 라벨 — 자기평가 3문항이 공유하는 스케일.
export const S1_RATING_SCALE = ['전혀 아니다', '아니다', '보통', '그렇다', '매우 그렇다'] as const
export type S1RatingScale = (typeof S1_RATING_SCALE)[number]

interface S1RoundAnswer {
  selectedChoice: 0 | 1 | null
  reasoning: string
  submitted: boolean
}

export interface Session1State {
  sessionId: string
  currentStage: S1Stage
  currentRoundIndex: number
  roundAnswers: S1RoundAnswer[]
  chatHistory: Record<S1Persona, S1ChatMessage[]>
  activePersona: S1Persona
  savedNotes: string[]
  finalChecked: boolean
  selfAssessment: {
    interestScore: S1RatingScale
    expectationGap: S1RatingScale
    repeatWillingness: S1RatingScale
    burdenNote: string
  }
  report: S1ReportResponse | null
}

interface Session1Actions {
  goTo: (stage: S1Stage) => void
  setActivePersona: (persona: S1Persona) => void
  sendMessage: (persona: S1Persona, message: string) => void
  saveNote: (text: string) => void
  selectChoice: (choice: 0 | 1) => void
  setReasoning: (text: string) => void
  submitRound: () => void
  confirmFinalCheck: () => void
  setSelfAssessment: (fields: Partial<Session1State['selfAssessment']>) => void
  finishAssessment: () => void
  resetSession: () => void
}

const initialState = (): Session1State => ({
  sessionId: crypto.randomUUID(),
  currentStage: 'brief',
  currentRoundIndex: 0,
  roundAnswers: S1_ROUNDS.map(() => ({ selectedChoice: null, reasoning: '', submitted: false })),
  chatHistory: { engineering: [], purchasing: [], senior: [] },
  activePersona: 'engineering',
  savedNotes: [],
  finalChecked: false,
  // Figma 744:15050 주석: "자기평가 기본 설정값은 보통입니다."
  selfAssessment: { interestScore: '보통', expectationGap: '보통', repeatWillingness: '보통', burdenNote: '' },
  report: null,
})

// 관계자별 목데이터 응답 — CMF 세션의 mock/chat.ts와 동일한 규칙기반 방식.
function mockReply(persona: S1Persona, message: string): string {
  const lower = message.toLowerCase()
  if (persona === 'engineering') {
    if (lower.includes('금형') || lower.includes('비용')) return '금형 하나 새로 파면 최소 몇 천은 봐야 해요. 파트 수부터 줄이는 게 우선입니다.'
    if (lower.includes('나사') || lower.includes('사출')) return '언더컷 생기면 슬라이드 코어 추가해야 해서 금형비 더 올라가요. 구조부터 다시 보시죠.'
    return '설계 관점에서는 파트 수와 결합 구조가 제일 중요해요. 그 두 가지부터 정리해서 다시 가져오세요.'
  }
  if (persona === 'purchasing') {
    if (lower.includes('예산') || lower.includes('비용')) return '목재 파트 예산은 넉넉하지 않아요. 파트가 늘어날수록 금형비가 커지니 참고하세요.'
    return '원가 관련해서는 설계팀이랑 파트 수부터 맞추고 오시면 저희가 단가 검토해드릴게요.'
  }
  return '재현님 방향 좋아요. 다만 설계팀 말도 일리 있으니 근거를 명확히 남기면서 진행하세요.'
}

export const useSession1 = create<Session1State & Session1Actions>()(
  persist(
    (set, get) => ({
      ...initialState(),

      goTo: (stage) => set({ currentStage: stage }),

      setActivePersona: (persona) => set({ activePersona: persona }),

      // Figma 744:16003 등 — 관계자 답변 아래 "답변 내용 노트에 저장" 버튼. 업무 노트 패널에 반영.
      saveNote: (text) => set((s) => (s.savedNotes.includes(text) ? s : { savedNotes: [...s.savedNotes, text] })),

      sendMessage: (persona, message) => {
        const reply = mockReply(persona, message)
        set((s) => ({
          chatHistory: {
            ...s.chatHistory,
            [persona]: [...s.chatHistory[persona], { role: 'user', content: message }, { role: 'assistant', content: reply }],
          },
        }))
      },

      selectChoice: (choice) => {
        const i = get().currentRoundIndex
        set((s) => {
          const roundAnswers = [...s.roundAnswers]
          roundAnswers[i] = { ...roundAnswers[i], selectedChoice: choice }
          return { roundAnswers }
        })
      },

      setReasoning: (text) => {
        const i = get().currentRoundIndex
        set((s) => {
          const roundAnswers = [...s.roundAnswers]
          roundAnswers[i] = { ...roundAnswers[i], reasoning: text }
          return { roundAnswers }
        })
      },

      submitRound: () => {
        const i = get().currentRoundIndex
        set((s) => {
          const roundAnswers = [...s.roundAnswers]
          roundAnswers[i] = { ...roundAnswers[i], submitted: true }
          return { roundAnswers }
        })
        if (i + 1 < S1_ROUNDS.length) {
          set({ currentRoundIndex: i + 1 })
        } else {
          set({ currentStage: 'final_check' })
        }
      },

      confirmFinalCheck: () => {
        set({ finalChecked: true, currentStage: 'self_assessment' })
      },

      setSelfAssessment: (fields) => set((s) => ({ selfAssessment: { ...s.selfAssessment, ...fields } })),

      finishAssessment: () => {
        const s = get()
        const compliantRounds = s.roundAnswers.filter((r) => r.selectedChoice === 0).length
        const reasonedRounds = s.roundAnswers.filter((r) => r.reasoning.trim().length > 0).length

        const strengths: string[] = []
        const cautions: string[] = []
        const missed: string[] = []

        if (compliantRounds >= 2) {
          strengths.push('설계팀이 제기한 제작 제약을 반영해 파트 구조를 반복적으로 조정했습니다.')
        }
        if (reasonedRounds === S1_ROUNDS.length) {
          strengths.push('매 라운드 선택 근거를 남겨 설계 의도가 협상 과정에 드러나도록 했습니다.')
        } else {
          missed.push('일부 라운드에서 선택 근거를 충분히 남기지 않았습니다.')
        }
        if (compliantRounds < 2) {
          cautions.push('벨트라인 디자인 의도를 지키는 것과 제작 제약 수용 사이에서 타협이 늦게 이뤄졌습니다.')
        }
        if (strengths.length === 0) {
          strengths.push('3회의 협상 라운드를 끝까지 진행해 합의안을 도출했습니다.')
        }

        const altRounds = s.roundAnswers.filter((r) => r.selectedChoice === 1).length
        const consultedSupport = s.chatHistory.purchasing.length > 0 || s.chatHistory.senior.length > 0
        const questionedEngineering = s.chatHistory.engineering.length > 0

        // "내 직무 이해 프로필" 4축 — 세션2(mock/report.ts computeProfile)와 같은 방식으로
        // 이미 추적 중인 라운드 선택/채팅 데이터만으로 도출(새 입력 요구 없음).
        const profile: ProfileAxis[] = [
          {
            leftLabel: '품질 우선',
            rightLabel: '일정 우선',
            caption: '결과물 완성도 vs 제출 속도',
            value: ((S1_ROUNDS.length - reasonedRounds) / S1_ROUNDS.length) * 100,
          },
          {
            leftLabel: '수용형',
            rightLabel: '대안 제시형',
            caption: '이해관계자 설득 선호도',
            value: (altRounds / S1_ROUNDS.length) * 100,
          },
          {
            leftLabel: '수용적',
            rightLabel: '부담 경험',
            caption: '반복 수정에 대한 반응',
            value: consultedSupport ? 70 : 30,
          },
          {
            leftLabel: '수용적',
            rightLabel: '근거 요구형',
            caption: '피드백 후 판단 수정 성향',
            value: questionedEngineering ? 80 : 20,
          },
        ]

        // Figma 744:15120(Desktop-38) — 설계 의도를 끝까지 지켜낸 협상 패턴에 대한 페르소나
        // 한줄평. Figma에 이 문구 하나만 확인되어 고정 문구로 사용(다른 변형은 근거 없어 생략).
        const personaHeadline = '뚝심 강한 디자이너 DNA가 흐르고 있어요'

        const report: S1ReportResponse = {
          work_overview:
            '탁상형 공기청정기 바디 하우징의 파트 분할 안을 두고 설계팀과 3회에 걸쳐 협상하며 벨트라인 디자인 의도와 제작 가능성 사이의 타협점을 찾았습니다.',
          strengths,
          cautions,
          missed,
          job_meaning: '제약 속에서 디자인 의도와 현실의 타협점을 찾는 실무 감각을 경험했습니다.',
          profile,
          personaHeadline,
          burdenNote: s.selfAssessment.burdenNote.trim(),
        }
        set({ report, currentStage: 'report' })
      },

      resetSession: () => set(initialState()),
    }),
    { name: 'coad-hackerton-session1' },
  ),
)

export { NOTE_TAGS }
