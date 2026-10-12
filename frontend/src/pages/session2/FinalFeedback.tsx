import { useState } from 'react'
import { WarningIcon } from '../../components/icons'
import { WorkFrame, WorkPanel } from '../../components/WorkFrame'
import { Messenger, WorkNotesCard } from '../../components/NegotiationPanels'
import { FeedbackRemainingBadge } from '../../components/FeedbackRemainingBadge'
import { useSession, feedbackSessionsRemaining } from '../../store/session'
import { SESSION2_NOTE_TAGS } from '../../data/session2Scenario'
import type { Branch } from '../../types'

// 업무 페이지 새 디자인 2217:10722(2026-10-13): 위 카드(최종본 파일 + 2차 피드백), 아래 카드(수정 방향 3지선다 + 근거 + 제출 버튼).
// Figma "관계자 협업" 라운드의 2차 피드백 상태 — 823:55878("Desktop - 135") 실측. 같은 노드에
// 이어져 있던 "수정 방향 선택"(3지 선다) UI를 처음엔 별도 화면(branch_select)으로 분리했는데,
// 실사용 결과("image 242" QA 지적) 두 화면을 오가는 게 불편해 원안대로 한 화면에 병합함
// (1184:12112 "image 244" 참고) — branch_select 화면(BranchSelect.tsx)은 이제 이 화면을 거치지
// 않고는 도달하지 않지만, Stage enum(types.ts)은 다른 에이전트들이 동시에 건드릴 수 있어 그대로
// 두고 SCREENS 매핑도 남겨둠(직접 URL/StageJumper로는 여전히 열람 가능).
const NOTE_TAGS = {
  ...SESSION2_NOTE_TAGS,
  cmf: ['화이트 오크 재질의 흡기구', '목재 접합', '한도 견본 판정표'],
}

interface ChoiceOption {
  branch: Branch
  title: string
  bullets: [string, string]
}

// Figma 823:55958("Frame 13", Desktop-135/136 내부) "수정 방향 선택" 3카드 실측 — 세션1
// ReviewAndChoice의 2카드 선택 패턴과 동일 계열이지만 이번엔 3지선다이고 각 카드가 sublabel 1개
// 대신 불릿 2줄(현재 영향 / 다음 단계)을 가짐. Figma 원본 순서(01 외부 업체 탐색 → 02 시트지
// 래핑 → 03 목재 포기)를 그대로 따름.
const OPTIONS: ChoiceOption[] = [
  {
    branch: 'outsourcing',
    title: '외부 업체 탐색',
    bullets: ['목재 접합 유지, 예산 초과 위험', '외주 탐색 단계로 이동'],
  },
  {
    branch: 'sheet_wrap',
    title: '시트지 래핑으로 결정',
    bullets: ['예산 내, 이번주 완료 가능', '외주 탐색 없이 종료'],
  },
  {
    branch: 'wood_dropped',
    title: '목재 포기, 다른 재질로 변경',
    bullets: ['예산 내 진행 가능, 재작성으로 회귀', '시방서 재작성으로 이동'],
  },
]

export function FinalFeedback() {
  const askedCapability = useSession((s) => s.askedCapability)
  const askedBudget = useSession((s) => s.askedBudget)
  const final = useSession((s) => s.final)
  const currentStage = useSession((s) => s.currentStage)
  const remaining = feedbackSessionsRemaining(currentStage, false)
  const chooseBranch = useSession((s) => s.chooseBranch)
  const revisitCount = useSession((s) => s.revisitCount)

  const [selected, setSelected] = useState<Branch | null>(null)
  const [reasoning, setReasoning] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Figma 캡션 "3번 선택 시 대체 아이디어 서술" — 3번(목재 포기)을 고를 때만 대체안 서술을
  // 요구하는 뉘앙스라 그 경우에만 입력을 필수로 둠. reasoning 자체는 store의 chooseBranch가
  // 받는 인자가 아니라(액션 시그니처 변경 금지) 화면 안에서만 쓰는 로컬 상태.
  const canSubmit = selected !== null && (selected !== 'wood_dropped' || reasoning.trim().length > 0)

  const handleSubmit = () => {
    if (!selected) return
    setIsSubmitting(true)
    setTimeout(() => {
      chooseBranch(selected)
      setIsSubmitting(false)
    }, 1200)
  }

  // Figma 실측(설계팀: 스테이브 접합 사내 불가 / 구매팀: 예산 초과 가능성) — 사전에 관련
  // 담당자에게 물어봤는지(askedCapability/askedBudget) 여부에 따라 톤이 바뀌는 게이팅 로직.
  const items = [
    {
      from: '설계팀',
      ok: askedCapability,
      text: askedCapability
        ? '사내 생산 가능 여부를 미리 확인하셨네요. 목재 스테이브 접합은 사내에서 안 되니 그 부분만 참고하세요.'
        : '목재 스테이브 접합은 사내에서 해결 못해요. 외주 업체에 발주를 넣거나 다른 방법을 알아보세요.',
    },
    {
      from: '구매팀',
      ok: askedBudget,
      text: askedBudget
        ? '예산 감안하고 계신 것 같아 다행이에요. 최종 단가는 업체 비교 후 다시 확인해주세요.'
        : '생산 단가도 함께 고려하세요. 목재 스테이브 접합으로 하면 예산을 초과할 가능성이 있어 보이네요.',
    },
  ]

  // Figma(2217:10722)의 버튼 문구는 1번 선택 기준 "외주업체 조사" — 선택에 따라 다음 단계에 맞는 문구로 바꾼다.
  const submitLabel = selected === 'outsourcing' ? '외주업체 조사' : selected === 'sheet_wrap' ? '시트지 래핑으로 확정' : selected === 'wood_dropped' ? '시방서 다시 쓰기' : '선택 제출'

  return (
    <WorkFrame step="관계자 협업" sidebar="work" loading={isSubmitting} exitStep="final_feedback" flushRight>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {revisitCount > 0 && (
          <p role="alert" className="flex items-center gap-2 rounded-lg bg-[rgba(250,250,250,0.85)] p-4 text-body-md text-error-300">
            <WarningIcon className="size-5 shrink-0 text-error-200" />
            이미 한 번 시방서를 다시 작성했습니다. 이번에도 목재를 포기하면 이번 선택으로 바로 마무리돼요.
          </p>
        )}

        <WorkPanel className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-title-lg font-semibold text-green-900">시방서 최종본</h1>
            <ul className="flex flex-col gap-1 text-body-sm text-neutral-700 underline">
              <li>마루 시방서 최종본.docs</li>
              {final.limitSampleAttached && <li>마루 한도 견본 판정표 최종본.docs</li>}
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-title-lg font-semibold text-green-900">2차 피드백</h2>
              <FeedbackRemainingBadge remaining={remaining} />
            </div>
            {/* 미리 물어본 관계자의 피드백은 연한 색, 묻지 않은 쪽은 진한 색으로 구분한다 */}
            {items.map((item) => (
              <div key={item.from} className={`flex flex-col gap-1 px-3 py-6 ${item.ok ? 'bg-green-50' : 'bg-green-200'}`}>
                <span className="text-body-md font-medium text-neutral-500">{item.from}</span>
                <p className="text-body-lg text-neutral-700">{item.text}</p>
              </div>
            ))}
          </div>
        </WorkPanel>

        <WorkPanel className="flex flex-col gap-8">
          <div className="flex items-start justify-between gap-6">
            <h2 className="text-title-lg font-semibold text-neutral-700">수정 방향성을 선택하세요.</h2>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className={`flex h-[82px] w-[280px] shrink-0 items-center justify-center rounded-xl px-3 text-headline-md font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 ${
                isSubmitting ? 'cursor-wait bg-[#9fbf80] text-green-50' : 'bg-green-500 text-neutral-900 hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50'
              }`}
            >
              {isSubmitting ? '로딩 중...' : submitLabel}
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            <h3 className="text-title-lg font-semibold text-green-900">수정 방향 선택</h3>
            <div className="grid grid-cols-3 gap-[9px]">
              {OPTIONS.map((o, i) => {
                const isSelected = selected === o.branch
                return (
                  <button
                    key={o.branch}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelected(o.branch)}
                    className={`flex flex-col items-start gap-1 p-5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-green-700 ${
                      isSelected ? 'bg-green-400' : 'bg-green-50 hover:bg-green-100'
                    }`}
                  >
                    <span className={`text-body-lg font-medium ${isSelected ? 'text-[#8aac6a]' : 'text-green-600'}`}>{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-title-lg font-semibold text-neutral-900">{o.title}</span>
                    <span className="flex flex-col gap-0.5">
                      {o.bullets.map((b) => (
                        <span key={b} className="flex items-center gap-2 text-body-lg font-medium text-neutral-600">
                          <span className="size-1 shrink-0 rounded-full bg-neutral-600" />
                          {b}
                        </span>
                      ))}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <label className="flex flex-col gap-3">
            <span className="flex items-end gap-2">
              <span className="text-title-lg font-semibold text-green-900">선택 근거 입력</span>
              <span className="text-body-sm text-neutral-500">3번 선택 시 대체 아이디어 서술</span>
            </span>
            <textarea
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              rows={3}
              placeholder="이 방향을 선택한 이유를 적어주세요."
              className="rounded-[4px] bg-green-50 px-4 py-3 text-body-lg text-neutral-700 shadow-[inset_0_0_4px_2px_rgba(0,0,0,0.04)] outline-none placeholder:text-neutral-500"
            />
          </label>
        </WorkPanel>
      </div>

      <aside className="flex w-[clamp(320px,25vw,433px)] shrink-0 flex-col gap-4">
        <WorkNotesCard
          groups={[
            { label: '사용자 요구', tags: NOTE_TAGS.userNeeds },
            { label: '제조 제약', tags: NOTE_TAGS.constraints },
            { label: 'CMF 결정 사항', tags: NOTE_TAGS.cmf },
          ]}
        />
        <div className="min-h-[520px] flex-1">
          <Messenger defaultActive="engineering" />
        </div>
      </aside>
    </WorkFrame>
  )
}
