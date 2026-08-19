import { Sidebar } from '../components/Sidebar'
import { Indicator } from '../components/Indicator'
import { Card } from '../components/Card'
import { Text } from '../components/Text'
import { Button } from '../components/Button'
import { Messenger, WorkNotesCard } from '../components/NegotiationPanels'
import { WarningIcon, CloudSavedIcon, ProfileIcon } from '../components/icons'
import { useSession } from '../store/session'
import productImage from '../assets/illustrations/product-angle-1.png'

// Figma "관계자 협업" 라운드의 1차 피드백 상태 — 823:55090("Desktop - 130")/823:55255
// ("Desktop - 131") 실측. Figma는 이 화면에서 바로 "시방서 수정" 입력 필드까지 함께 보여주지만,
// 이 앱은 draftSubmitted -> senior_feedback -> (workspace로 돌아가 편집) 구조라 편집 폼은
// Workspace.tsx(editingFinal=true)에 있고, 여기는 Brief/Materials와 같은 3열 라운드 레이아웃을
// 유지하면서 "디자인 초안 + 1차 피드백" 리캡 카드와 다음 단계로 넘어가는 CTA만 보여준다.
const DRAFT_DESCRIPTION =
  '이번 공기청정기의 외부 CMF 소재는 오크 재질의 원목을 사용하고자 합니다. 색상은 자연스러운 원목의 색상을 살릴 수 있는 오크 내추럴 컬러로 하며, 목재 접합 설비를 활용한 제작 공정을 거치고자 합니다.'

const SENIOR_INTRO =
  '색이랑 마감 모두 결정됐어요. 설계팀에 넘길 시방서 작성하고 저한테 보내주세요.\n미리 말하는데, 이번에 목재 처음 써보는 거라 사내 공장에서 목재 접합은 안 하는 거로 알고 있어요. 시트지로 마감하거나, 외부 업체 알아봐야 할 겁니다. 발주 일정까지 12일 남았는데 그 안에 어떻게든 해결하세요.'

const NOTE_TAGS = {
  userNeeds: ['저소음', '공간 효율', '따뜻함', '관리 용이', '인테리어 오브제 느낌'],
  constraints: ['파팅라인 단차 0.5mm 이격할 것', '전면부 하우징은 하나로', '에어케어 제품과 내부 설계 공유'],
  // Figma 823:55090 — 한도 견본 판정표 피드백을 받은 뒤라 CMF 결정 사항에 태그가 하나 늘어난 상태.
  cmf: ['화이트 오크 재질의 흡기구', '목재 접합', '한도 견본 판정표'],
}

// Figma 823:55090/823:55255 실측 문구. 통과 문구는 Figma에 없어 기존 로직 그대로 유지.
const FEEDBACK_PASS = '항목은 다 있네요. 이대로 설계팀·구매팀 검토로 넘기세요.'
const FEEDBACK_FAIL =
  '목재와 같이 결과물이 일정하지 않은 소재는 한도 견본 판정표라고 "이 색으로 해주세요"가 아니라 "이 정도까지는 받겠습니다"를 알려줘야 해요. 공용 서식 폴더의 한도 견본 판정표 양식을 참고해서 별첨해주세요.'

export function SeniorFeedback() {
  const draft = useSession((s) => s.draft)
  const goTo = useSession((s) => s.goTo)

  return (
    <div className="flex min-h-svh gap-6 bg-neutral-50 p-6">
      <Sidebar active="work" topItems={['apps', 'work', 'history']} className="shrink-0" />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-[340px_1fr_340px]">
          <div className="hidden lg:block" />
          <Indicator current="관계자 협업" />
          <div className="hidden items-center justify-end gap-[18px] lg:flex">
            <div className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-neutral-900 text-neutral-50">
              <CloudSavedIcon className="size-5" />
            </div>
            <div className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-neutral-900 text-neutral-50">
              <ProfileIcon className="size-5" />
            </div>
          </div>

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
                  <div className="flex items-end gap-1">
                    <WarningIcon className="size-5 shrink-0 text-error-200" />
                    <Text variant="body-sm" className="text-neutral-400">
                      가능 피드백 세션 2회 남음
                    </Text>
                  </div>
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
              최종본 작성하러 가기
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
  )
}
