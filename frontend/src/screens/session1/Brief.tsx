import negotiationScene from '../../assets/illustrations/session1-negotiation-scene.png'
import avatarGopro from '../../assets/illustrations/avatar-gopro.png'
import avatarLipro from '../../assets/illustrations/avatar-lipro.png'
import avatarParkChaeim from '../../assets/illustrations/avatar-parkchaeim.png'
import { Sidebar } from '../../components/Sidebar'
import { Indicator } from '../../components/Indicator'
import { Card } from '../../components/Card'
import { Text } from '../../components/Text'
import { Button } from '../../components/Button'
import { CheckIcon, CloudSavedIcon, ProfileIcon } from '../../components/icons'
import { useSession1 } from '../../store/session1'

const INDICATOR_STEPS_S1 = ['브리프', '자료탐색', '설계 수정1', '설계 수정2', '설계 확정', '자기 평가', '직무 리포트'] as const

const GOALS = [
  '핵심 디자인 의도 유지(벨트라인)',
  '비용, 구조 제약 안에서 실현 가능 형태 탐색',
  '품평회 전까지 설계팀과 합의점 도출',
]

const INITIAL_CONDITIONS = ['하우징 3파츠 분할안 (금형 비용 이슈 발생)', '제작 방식 (프레스 금형) (CNC 가공)', '2주 이내에 설계팀과 합의점 도출']

const DELIVERABLES = [
  '최종 확정된 하우징 파트 분할안, 형태',
  '수정 근거 (초기 디자인 의도 유지 여부 설명)',
  '협상 과정에서 고려한 제작 방식',
  '설계팀과의 합의 여부',
]

const ROUND_LABELS = ['1차 양산 용이성 협상', '2차 양산 용이성 협상', '3차 양산 용이성 협상', '업무 리포트']

const COLLABORATORS = [
  { img: avatarGopro, name: '고프로', team: '디자인팀' },
  { img: avatarLipro, name: '이프로', team: '디자인팀' },
  { img: avatarParkChaeim, name: '박책임', team: '설계팀' },
]

function CheckItem({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-1">
      <CheckIcon className="size-4 shrink-0 text-green-500" />
      <Text variant="body-lg" className="text-neutral-600">
        {children}
      </Text>
    </div>
  )
}

function Tag({ children }: { children: string }) {
  return (
    <span className="shrink-0 rounded-[20px] border border-green-400 bg-green-50 px-3 py-2 text-body-lg font-medium text-green-900">
      {children}
    </span>
  )
}

// Figma "Desktop - 21"(744:15857) — 세션1 브리프 재설계. 기존엔 일반 라이트 테마 단일 카드
// 레이아웃이었는데, 다른 세션1 화면들(Materials/Workspace)과 같은 다크 Sidebar+Indicator
// 3컬럼 레이아웃으로 통일. 텍스트 콘텐츠는 유지하되 구조를 Figma 실측대로 다시 짬.
export function Session1Brief() {
  const goTo = useSession1((s) => s.goTo)

  return (
    <div className="flex min-h-svh gap-6 bg-neutral-50 p-6">
      <Sidebar active="apps" className="shrink-0" />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        {/* Figma(744:15857)에서 인디케이터는 전체 폭이 아니라 가운데 컬럼 위에만 떠 있고,
            우측 상단엔 저장상태/프로필 아이콘 한 쌍이 따로 있음 — 그리드 1행에 나란히 배치. */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-[300px_1fr_300px]">
          <div className="hidden lg:block" />
          <Indicator current="브리프" steps={INDICATOR_STEPS_S1} />
          <div className="hidden items-center justify-end gap-[18px] lg:flex">
            <div className="flex size-[50px] items-center justify-center rounded-full bg-neutral-900 text-neutral-50">
              <CloudSavedIcon className="size-5" />
            </div>
            <div className="flex size-[50px] items-center justify-center rounded-full bg-neutral-900 text-neutral-50">
              <ProfileIcon className="size-5" />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Card className="flex items-center justify-center p-6">
              <Text variant="title-lg" emphasis className="text-center">
                모형 제작 및 설계 검토 세션
              </Text>
            </Card>
            <Card className="flex flex-col gap-2 p-6">
              <Text variant="title-md" emphasis className="text-green-900">
                프로젝트 배경
              </Text>
              <Text variant="body-lg" className="text-neutral-600">
                탁상형 공기청정기 바디 하우징을 3개 파츠로 분할한 시안을 설계팀에 전달했고, 설계팀
                박책임으로부터 금형 비용 문제로 파트 통합을 요구받은 상태입니다.
              </Text>
            </Card>
            <Card className="flex flex-col gap-2 p-6">
              <Text variant="title-md" emphasis className="text-green-900">
                세션 목표
              </Text>
              <div className="flex flex-col items-start gap-1">
                {GOALS.map((g) => (
                  <CheckItem key={g}>{g}</CheckItem>
                ))}
              </div>
            </Card>
            <Card className="flex flex-col gap-2 p-6">
              <Text variant="title-md" emphasis className="text-green-900">
                초기 조건
              </Text>
              <div className="flex flex-col items-start gap-1">
                {INITIAL_CONDITIONS.map((c) => (
                  <CheckItem key={c}>{c}</CheckItem>
                ))}
              </div>
            </Card>
          </div>

          <Card className="flex flex-col gap-6 p-6">
            <Text variant="title-lg" emphasis className="text-green-900">
              프로젝트 주제
            </Text>

            <div className="flex flex-col gap-6">
              <div className="flex items-start gap-6">
                <Tag>당신의 역할</Tag>
                <div className="flex flex-1 flex-col gap-3">
                  <Text variant="title-lg" emphasis className="text-green-900">
                    생활가전 기업의 신입 제품 디자이너
                  </Text>
                  <Text variant="body-lg" className="text-neutral-600">
                    월요일 아침, 선임 디자이너로부터 가정용 공기청정기 시안 C의 디자인 확정 소식과 함께
                    2주 뒤에 있을 품평회 전까지 설계팀과 함께 양산 용이성을 검토할 것을 요청받았습니다.
                  </Text>
                </div>
              </div>

              <img src={negotiationScene} alt="" className="h-[300px] w-full rounded-md bg-neutral-200 object-cover" />

              <div className="flex items-start gap-6">
                <Tag>업무 미션</Tag>
                <div className="flex flex-1 flex-col gap-3">
                  <Text variant="title-lg" emphasis className="text-green-900">
                    20대 1인 가구를 위한 탁상형 공기청정기의 개선 방향을 제안하세요.
                  </Text>
                  <Text variant="body-lg" className="text-neutral-600">
                    사장님까지 참여하는 품평회를 2주 앞두고 있습니다. 설계팀과 함께 공기청정기의 시안을
                    수정하고 검토하여 최적의 양산 구조를 찾으세요.
                  </Text>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <Tag>결과물</Tag>
                <div className="flex flex-1 flex-col items-start gap-1">
                  {DELIVERABLES.map((d) => (
                    <CheckItem key={d}>{d}</CheckItem>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-4">
            <Card className="flex flex-col gap-6 p-6">
              <div className="flex flex-col gap-3">
                <Text variant="title-lg" emphasis className="text-green-900">
                  체험 진행 방식
                </Text>
                <div className="flex flex-col items-start gap-2.5">
                  {ROUND_LABELS.map((label) => (
                    <span
                      key={label}
                      className="rounded-[20px] border border-green-300 bg-green-50 px-3 py-2 text-body-lg font-medium text-green-900"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
              <Text variant="body-lg" className="text-neutral-600">
                2주간 진행되는 설계 검토 일정에 맞춰 설계팀과 최대 3회의 협상 라운드를 거칩니다.
                라운드마다 제시되는 선택지 중 하나를 고르고 근거를 작성하면, 다음 라운드의 시안과
                협업자의 반응이 달라집니다. 합의에 도달하면 세션이 종료됩니다.
              </Text>
            </Card>

            <Card className="flex flex-col gap-6 p-6">
              <Text variant="title-lg" emphasis className="text-green-900">
                협업 관계자
              </Text>
              <div className="flex flex-wrap justify-between gap-y-6">
                {COLLABORATORS.map((c) => (
                  <div key={c.name} className="flex flex-col items-center gap-3">
                    <img src={c.img} alt="" className="size-24 rounded-full bg-neutral-100 object-cover" />
                    <div className="flex items-center gap-1">
                      <Text variant="caption-sm" className="text-neutral-700">
                        {c.name}
                      </Text>
                      <span className="size-0.5 rounded-full bg-neutral-400" />
                      <Text variant="caption-sm" className="text-green-600">
                        {c.team}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Button
              variant="primary"
              className="h-[72px] w-full !rounded-xl !text-2xl"
              onClick={() => goTo('materials')}
            >
              시작하기
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
