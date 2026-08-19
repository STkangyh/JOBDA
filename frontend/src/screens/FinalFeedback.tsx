import { Sidebar } from '../components/Sidebar'
import { Indicator } from '../components/Indicator'
import { Card } from '../components/Card'
import { Text } from '../components/Text'
import { Button } from '../components/Button'
import { Messenger, WorkNotesCard } from '../components/NegotiationPanels'
import { WarningIcon, CloudSavedIcon, ProfileIcon } from '../components/icons'
import { useSession } from '../store/session'

// Figma "관계자 협업" 라운드의 2차 피드백 상태 — 823:55878("Desktop - 135") 실측. 같은 노드에
// "수정 방향 선택"(3지 선다) UI까지 이어져 있지만 그건 이 앱에서 별도 화면(branch_select, 다른
// 에이전트 담당)이라 여기서는 "시방서 최종본" 리캡 + 설계팀/구매팀 2차 피드백까지만 다룬다.
const NOTE_TAGS = {
  userNeeds: ['저소음', '공간 효율', '따뜻함', '관리 용이', '인테리어 오브제 느낌'],
  constraints: ['파팅라인 단차 0.5mm 이격할 것', '전면부 하우징은 하나로', '에어케어 제품과 내부 설계 공유'],
  cmf: ['화이트 오크 재질의 흡기구', '목재 접합', '한도 견본 판정표'],
}

export function FinalFeedback() {
  const askedCapability = useSession((s) => s.askedCapability)
  const askedBudget = useSession((s) => s.askedBudget)
  const final = useSession((s) => s.final)
  const goTo = useSession((s) => s.goTo)

  // Figma 실측 문구(설계팀: 스테이브 접합 사내 불가 / 구매팀: 예산 초과 가능성) — 사전에 관련
  // 담당자에게 물어봤는지(askedCapability/askedBudget) 여부에 따라 톤이 바뀌는 기존 게이팅 로직은
  // 그대로 두고 문구만 "목재 밴딩" -> "목재 스테이브 접합"으로 이번 초안 서사에 맞춰 정리했다.
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

          <Messenger defaultActive="engineering" />

          <div className="flex flex-col gap-[18px]">
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
                  <div className="flex items-end gap-1">
                    <WarningIcon className="size-5 shrink-0 text-error-200" />
                    <Text variant="body-sm" className="text-neutral-400">
                      가능 피드백 세션 1회 남음
                    </Text>
                  </div>
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
            </Card>

            {/* 메신저/업무노트는 h-full로 그리드 행 높이만큼 늘어나는데 이 칸은 카드 하나만큼만
                차지해서 버튼이 카드 바로 아래 붙고 그 밑은 빈 여백으로 남았음 — 카드는 그대로
                두고 이 빈 칸이 남는 세로 공간을 흡수해서 버튼을 칸 맨 아래로 밀어낸다. */}
            <div className="flex-1" />

            <Button
              variant="primary"
              className="h-[72px] w-[340px] self-end !rounded-xl !text-2xl"
              onClick={() => goTo('branch_select')}
            >
              다음: 방향 선택
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
