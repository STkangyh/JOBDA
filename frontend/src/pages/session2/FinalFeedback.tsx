import { useState } from 'react'
import { Sidebar } from '../../components/Sidebar'
import { IndicatorHeader } from '../../components/IndicatorHeader'
import { Card } from '../../components/Card'
import { Text } from '../../components/Text'
import { Button } from '../../components/Button'
import { WarningIcon } from '../../components/icons'
import { Messenger, WorkNotesCard } from '../../components/NegotiationPanels'
import { FeedbackRemainingBadge } from '../../components/FeedbackRemainingBadge'
import { useSession, feedbackSessionsRemaining } from '../../store/session'
import { SESSION2_NOTE_TAGS } from '../../data/session2Scenario'
import type { Branch } from '../../types'

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

  return (
    <div className="flex min-h-svh gap-6 bg-neutral-75 p-6">
      <Sidebar active="work" topItems={['apps', 'work', 'history']} className="shrink-0" />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="flex flex-col gap-4">
          <IndicatorHeader current="관계자 협업" gridCols="grid-cols-1 lg:grid-cols-[340px_1fr_340px]" loading={isSubmitting} />

          <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-[340px_1fr_340px]">
            <Messenger defaultActive="engineering" />

            <div className="flex flex-col gap-[18px]">
              {revisitCount > 0 && (
                <Card className="flex items-center gap-2 border border-error-100 bg-error-100/20 p-4">
                  <WarningIcon className="size-5 shrink-0 text-error-200" />
                  <Text variant="body-md" className="text-error-300">
                    이미 한 번 시방서를 다시 작성했습니다. 이번에도 목재를 포기하면 이번 선택으로 바로
                    마무리돼요.
                  </Text>
                </Card>
              )}

              <Card className="flex flex-col gap-8 p-6">
                <div className="flex flex-col gap-3">
                  <Text variant="title-lg" emphasis className="text-green-900">
                    시방서 최종본
                  </Text>
                  <div className="flex flex-col items-start gap-1.5">
                    <Text variant="body-lg" className="text-neutral-500 underline">
                      마루 시방서 최종본.docs
                    </Text>
                    {final.limitSampleAttached && (
                      <Text variant="body-lg" className="text-neutral-500 underline">
                        마루 한도 견본 판정표 최종본.docs
                      </Text>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Text variant="title-lg" emphasis className="text-green-900">
                      2차 피드백
                    </Text>
                    <FeedbackRemainingBadge remaining={remaining} />
                  </div>
                  <div className="flex flex-col gap-3">
                    {items.map((item) => (
                      <div
                        key={item.from}
                        className={`rounded-md p-5 ${item.ok ? 'bg-green-50' : 'border border-amber-400 bg-white'}`}
                      >
                        <Text variant="body-md" emphasis className="mb-1 text-neutral-500">
                          {item.from}
                        </Text>
                        <Text variant="body-lg" className="text-neutral-700">
                          {item.text}
                        </Text>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Text variant="title-lg" emphasis className="text-green-900">
                    수정 방향 선택
                  </Text>
                  <div className="grid grid-cols-1 gap-[9px] sm:grid-cols-3">
                    {OPTIONS.map((o, i) => {
                      const isSelected = selected === o.branch
                      return (
                        <button
                          key={o.branch}
                          onClick={() => setSelected(o.branch)}
                          className={`flex flex-1 flex-col items-start gap-1 rounded-md p-5 text-left transition-colors ${
                            isSelected
                              ? 'bg-green-400 text-neutral-900'
                              : 'border border-neutral-200 bg-white hover:border-green-400 hover:bg-green-50'
                          }`}
                        >
                          <Text variant="body-lg" emphasis className={isSelected ? 'text-green-800' : 'text-neutral-400'}>
                            {String(i + 1).padStart(2, '0')}
                          </Text>
                          <Text variant="title-lg" emphasis className="text-neutral-900">
                            {o.title}
                          </Text>
                          <div className="flex flex-col gap-0.5">
                            {o.bullets.map((b) => (
                              <div key={b} className="flex items-center gap-2">
                                <span className="size-1 shrink-0 rounded-full bg-neutral-400" />
                                <Text variant="body-md" className="text-neutral-600">
                                  {b}
                                </Text>
                              </div>
                            ))}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-end gap-2">
                    <Text variant="title-lg" emphasis className="text-green-900">
                      선택 근거 입력
                    </Text>
                    <Text variant="body-sm" className="text-neutral-400">
                      3번 선택 시 대체 아이디어 서술
                    </Text>
                  </div>
                  <textarea
                    value={reasoning}
                    onChange={(e) => setReasoning(e.target.value)}
                    rows={3}
                    placeholder="이 방향을 선택한 이유를 적어주세요."
                    className="rounded-md bg-neutral-75 px-4 py-3 text-sm outline-none placeholder:text-neutral-500"
                  />
                </div>
              </Card>

              {/* 메신저/업무노트는 h-full로 그리드 행 높이만큼 늘어나는데 이 칸은 카드 하나만큼만
                  차지해서 버튼이 카드 바로 아래 붙고 그 밑은 빈 여백으로 남았음 — 카드는 그대로
                  두고 이 빈 칸이 남는 세로 공간을 흡수해서 버튼을 칸 맨 아래로 밀어낸다. */}
              <div className="flex-1" />

              <Button
                variant="primary"
                className="h-[72px] w-[340px] self-end !rounded-xl !text-2xl"
                disabled={!canSubmit || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? '로딩중' : '선택 제출'}
              </Button>
            </div>

            <WorkNotesCard
              groups={[
                { label: '사용자 요구', tags: NOTE_TAGS.userNeeds },
                { label: '제조 제약', tags: NOTE_TAGS.constraints },
                { label: 'CMF 결정 사항', tags: NOTE_TAGS.cmf },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
