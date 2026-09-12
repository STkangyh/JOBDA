import { Sidebar } from '../../components/Sidebar'
import { IndicatorHeader } from '../../components/IndicatorHeader'
import { Card } from '../../components/Card'
import { Text } from '../../components/Text'
import { Button } from '../../components/Button'
import { Messenger, WorkNotesCard } from '../../components/NegotiationPanels'
import { FeedbackRemainingBadge } from '../../components/FeedbackRemainingBadge'
import { useSession, feedbackSessionsRemaining } from '../../store/session'
import { DRAFT_DESCRIPTION, SENIOR_INTRO, FEEDBACK_PASS, FEEDBACK_FAIL, SESSION2_NOTE_TAGS } from '../../data/session2Scenario'
import productImage from '../../assets/illustrations/product-angle-1.png'

// Figma "관계자 협업" 라운드의 1차 피드백 상태 — 823:55090("Desktop - 130")/823:55255
// ("Desktop - 131") 실측. Figma는 이 화면에서 바로 "시방서 수정" 입력 필드까지 함께 보여주지만,
// 이 앱은 draftSubmitted -> senior_feedback -> (workspace로 돌아가 편집) 구조라 편집 폼은
// Workspace.tsx(editingFinal=true)에 있고, 여기는 Brief/Materials와 같은 3열 라운드 레이아웃을
// 유지하면서 "디자인 초안 + 1차 피드백" 리캡 카드와 다음 단계로 넘어가는 CTA만 보여준다.
const NOTE_TAGS = {
  ...SESSION2_NOTE_TAGS,
  // Figma 823:55090 — 한도 견본 판정표 피드백을 받은 뒤라 CMF 결정 사항에 태그가 하나 늘어난 상태.
  cmf: ['화이트 오크 재질의 흡기구', '목재 접합', '한도 견본 판정표'],
}

export function SeniorFeedback() {
  const draft = useSession((s) => s.draft)
  const goTo = useSession((s) => s.goTo)
  const currentStage = useSession((s) => s.currentStage)
  const remaining = feedbackSessionsRemaining(currentStage, false)

  return (
    <div className="flex min-h-svh gap-6 bg-neutral-75 p-6">
      <Sidebar active="work" topItems={['apps', 'work', 'history']} className="shrink-0" />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="flex flex-col gap-4">
          <IndicatorHeader current="관계자 협업" gridCols="grid-cols-1 lg:grid-cols-[340px_1fr_340px]" />

          <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-[340px_1fr_340px]">
            <Messenger defaultActive="senior" intro={{ persona: 'senior', text: SENIOR_INTRO }} />

            <div className="flex flex-col gap-[18px]">
              <Card className="flex flex-col gap-8 p-6">
                <div className="flex flex-col gap-3">
                  <Text variant="title-lg" emphasis className="text-green-900">
                    디자인 초안
                  </Text>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <img
                      src={productImage}
                      alt=""
                      className="h-[149px] w-[200px] shrink-0 rounded-md bg-neutral-100 object-cover"
                    />
                    <Text variant="body-lg" className="text-neutral-600">
                      {DRAFT_DESCRIPTION}
                    </Text>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Text variant="title-lg" emphasis className="text-green-900">
                      1차 피드백
                    </Text>
                    <FeedbackRemainingBadge remaining={remaining} />
                  </div>
                  <div
                    className={`rounded-md p-5 ${
                      draft.limitSampleAttached ? 'bg-green-50' : 'border border-amber-400 bg-white'
                    }`}
                  >
                    <Text variant="body-lg" className="whitespace-pre-line text-neutral-700">
                      {draft.limitSampleAttached ? FEEDBACK_PASS : FEEDBACK_FAIL}
                    </Text>
                  </div>
                  {!draft.limitSampleAttached && (
                    <Text variant="body-md" className="text-amber-600">
                      수정 요청: 한도 견본 판정표 별첨
                    </Text>
                  )}
                </div>
              </Card>

              {/* 메신저/업무노트는 h-full로 그리드 행 높이만큼 늘어나는데 이 칸은 카드 하나만큼만
                  차지해서 버튼이 카드 바로 아래 붙고 그 밑은 빈 여백으로 남았음 — 카드는 그대로
                  두고 이 빈 칸이 남는 세로 공간을 흡수해서 버튼을 칸 맨 아래로 밀어낸다. */}
              <div className="flex-1" />

              <Button
                variant="primary"
                className="h-[72px] w-[340px] self-end !rounded-xl !text-2xl"
                onClick={() => goTo('workspace')}
              >
                시방서 수정하러 가기
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
