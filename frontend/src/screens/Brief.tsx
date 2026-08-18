import negotiationScene from '../assets/illustrations/session2-negotiation-scene.png'
import avatarGopro from '../assets/illustrations/avatar-gopro.png'
import avatarLipro from '../assets/illustrations/avatar-lipro.png'
import avatarParkChaeim from '../assets/illustrations/avatar-parkchaeim.png'
import avatarKimBujang from '../assets/illustrations/avatar-kimbujang.png'
import { Sidebar } from '../components/Sidebar'
import { Indicator } from '../components/Indicator'
import { Card } from '../components/Card'
import { Text } from '../components/Text'
import { Button } from '../components/Button'
import { CheckBoxIcon, CloudSavedIcon, ProfileIcon } from '../components/icons'
import { useSession } from '../store/session'

const GOALS = ['설계팀과의 소통 오류가 없도록 시방서를 정확히 작성', '예산 범위 안에서 목재 파트 생산 방법 결정', '발주 일정 안에 외주업체 선정 완료']

const INITIAL_CONDITIONS = ['CMF 확정 상태', '자사 공장은 목재 접합, 오일 마감 불가', '발주까지 12일 남음']

const DELIVERABLES = [
  '디자인 시방서 최종본',
  '목재 파트 양산 방법에 대한 최종 결정과 근거',
  '외주 업체 비교 자료 (후보군 3사) (선택사항)',
]

const ROUND_LABELS = ['시방서 초안 작성', '시방서 수정본 작성', '외주업체 컨택', '업무 리포트']

const COLLABORATORS = [
  { img: avatarGopro, name: '고프로', team: '디자인팀' },
  { img: avatarLipro, name: '이프로', team: '디자인팀' },
  { img: avatarParkChaeim, name: '박책임', team: '설계팀' },
  { img: avatarKimBujang, name: '김부장', team: '구매팀' },
]

function CheckItem({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-1">
      <CheckBoxIcon className="size-4 shrink-0 text-green-500" />
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

// Figma "Desktop - 115"(823:57540) — 세션2(시방서 작성 및 설계팀 이관) 브리프. 세션1 브리프
// (744:15857)와 동일한 3컬럼 레이아웃 + 인디케이터 헤더 패턴, 협업 관계자만 구매팀 김부장이
// 추가되어 4명(세션1은 3명).
export function Brief() {
  const goTo = useSession((s) => s.goTo)

  return (
    <div className="flex min-h-svh gap-6 bg-neutral-50 p-6">
      <Sidebar active="apps" className="shrink-0" />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-3">
          <div className="hidden lg:block" />
          <Indicator current="브리프" />
          <div className="hidden items-center justify-end gap-[18px] lg:flex">
            <div className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-neutral-900 text-neutral-50">
              <CloudSavedIcon className="size-5" />
            </div>
            <div className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-neutral-900 text-neutral-50">
              <ProfileIcon className="size-5" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr_300px]">
          <div className="flex flex-col gap-4">
            <Card className="flex items-center justify-center p-6">
              <Text variant="title-lg" emphasis className="text-center">
                시방서 작성 및 설계팀 이관
              </Text>
            </Card>
            <Card className="flex flex-col gap-2 p-6">
              <Text variant="title-md" emphasis className="text-green-900">
                프로젝트 배경
              </Text>
              <Text variant="body-lg" className="text-neutral-600">
                이번 제품은 처음으로 오크 원목을 하우징 소재로 사용합니다. 그러나 자사 공장은 목재
                접합 설비가 없어 시트지 마감 또는 외주 제작 중 하나를 선택해야 합니다.
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
                    월요일 아침, 선임 디자이너로부터 CMF 확정 소식과 함께 설계팀에 넘길 디자인
                    시방서 작성을 요청받았습니다.
                  </Text>
                </div>
              </div>

              <img src={negotiationScene} alt="" className="h-[300px] w-full rounded-md bg-neutral-200 object-cover" />

              <div className="flex items-start gap-6">
                <Tag>업무 미션</Tag>
                <div className="flex flex-1 flex-col gap-3">
                  <Text variant="title-lg" emphasis className="text-green-900">
                    제품 양산에 필요한 생산 공정을 확인하고 외주 업체를 탐색하세요.
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
                제공된 시방서, 한도 견본 판정표, 외주 문의서 양식을 참고해 초안을 작성하고, 선임
                디자이너의 피드백을 반영합니다. 최종본 제출 후 설계팀, 구매팀의 피드백에 따라 세
                가지 방향 중 하나를 선택하며, 선택에 따라 세션 종료 시점이 달라집니다.
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
