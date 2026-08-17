import avatarEngineering from '../../assets/illustrations/avatar-engineering.svg'
import avatarSenior from '../../assets/illustrations/avatar-senior-designer.svg'
import avatarDesignTeam from '../../assets/illustrations/avatar-design-team.svg'
import { Text } from '../../components/Text'
import { Chip } from '../../components/Chip'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { useSession1 } from '../../store/session1'

const GOALS = [
  '벨트라인(면 분할)이라는 핵심 디자인 의도를 지킨다.',
  '설계팀이 제기하는 비용, 구조 제약 안에서 실현 가능한 형태를 찾는다.',
  '품평회 전까지 설계팀과 합의점을 도출한다.',
]

const INITIAL_CONDITIONS = [
  '하우징 3파츠 분할안 (금형 비용 이슈 발생)',
  '성형 방식: 사출 / 목표 원가 상세는 미확인',
  '품평회까지 남은 시간 제한적',
]

const DELIVERABLES = [
  '최종 확정된 하우징 파트 분할안 / 형태',
  '수정 근거 - 초기 디자인 의도를 어떻게 유지했는지에 대한 설명',
  '협상 과정에서 고려한 제작 방식(성형 방식, 구조적 제약)',
  '설계팀과의 합의 여부',
]

const COLLABORATORS = [
  { img: avatarEngineering, label: '설계팀 박책임' },
  { img: avatarSenior, label: '선배 디자이너' },
  { img: avatarDesignTeam, label: '디자인팀' },
]

// Figma 02_Project Brief (382:2807) — 세션1 브리프. 실제 발견한 원본 텍스트 그대로.
export function Session1Brief() {
  const goTo = useSession1((s) => s.goTo)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
      <div>
        <Text variant="headline-md" emphasis>
          세션1_피드백 수정
        </Text>
        <Text variant="headline-md" emphasis className="mt-1">
          업무 브리프
        </Text>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <Card className="flex-1 p-6">
          <div className="flex flex-col gap-6">
            <div>
              <Text variant="body-sm" className="text-neutral-600">
                당신의 역할
              </Text>
              <Text variant="headline-md" emphasis>
                생활가전 기업의 신입 제품디자이너
              </Text>
            </div>

            <div className="rounded-md bg-neutral-100 p-4">
              <Text variant="caption-lg" emphasis className="text-neutral-600">
                MISSION
              </Text>
              <Text variant="title-lg" emphasis className="mt-1">
                20대 1인 가구를 위한 탁상형 공기청정기의 개선 방향을 제안하세요.
              </Text>
              <Text variant="body-sm" className="mt-2 text-neutral-600">
                사장님까지 참여하는 품평회를 앞두고, 설계팀과 시안 수정을 반복 검토하는 단계입니다.
              </Text>
            </div>

            <div>
              <Text variant="title-md" emphasis className="mb-2">
                프로젝트 배경
              </Text>
              <Text variant="body-lg">
                탁상형 공기청정기 바디 하우징을 3개 파츠로 분할한 시안을 설계팀에 전달했고, 설계팀
                박책임으로부터 금형 비용 문제로 파트 통합을 요구받은 상태입니다.
              </Text>
            </div>

            <div>
              <Text variant="title-md" emphasis className="mb-2">
                이번 세션의 목표
              </Text>
              <ul className="flex flex-col gap-2">
                {GOALS.map((goal) => (
                  <li key={goal} className="flex items-start gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-neutral-900" />
                    <Text variant="body-lg">{goal}</Text>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <Text variant="title-md" emphasis className="mb-2">
                초기 조건
              </Text>
              <ul className="list-inside list-disc">
                {INITIAL_CONDITIONS.map((c) => (
                  <li key={c}>
                    <Text as="span" variant="body-lg">
                      {c}
                    </Text>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <Text variant="title-md" emphasis className="mb-2">
                결과물
              </Text>
              <ol className="list-inside list-decimal">
                {DELIVERABLES.map((d) => (
                  <li key={d}>
                    <Text as="span" variant="body-md" className="text-neutral-600">
                      {d}
                    </Text>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Card>

        <div className="flex w-full flex-col gap-4 lg:w-[340px]">
          <Card className="p-6">
            <Text variant="title-lg" emphasis className="mb-4">
              체험 진행 방식
            </Text>
            <div className="flex flex-col gap-2">
              <Chip className="w-full justify-start">01 1차 협상</Chip>
              <Chip className="w-full justify-start">02 2차 협상</Chip>
              <Chip className="w-full justify-start">03 3차 협상</Chip>
              <Chip className="w-full justify-start">04 업무 리포트</Chip>
            </div>
            <Text variant="caption-lg" className="mt-4 text-neutral-500">
              설계팀과 최대 3회의 협상 라운드를 거칩니다. 매 라운드마다 제시되는 선택지 중 하나를
              고르고 근거를 작성하면, 다음 라운드의 시안과 박책임의 반응이 달라집니다. 합의에
              도달하면 세션이 종료됩니다.
            </Text>
          </Card>

          <Card className="p-6">
            <Text variant="title-lg" emphasis className="mb-4">
              협업 관계자
            </Text>
            <div className="flex gap-4">
              {COLLABORATORS.map((c) => (
                <div key={c.label} className="flex flex-col items-center gap-2">
                  <img src={c.img} alt="" className="size-14 rounded-full bg-neutral-100" />
                  <Text variant="caption-sm" className="text-center text-neutral-600">
                    {c.label}
                  </Text>
                </div>
              ))}
            </div>
          </Card>

          <Button variant="primary" className="h-[48px] text-base" onClick={() => goTo('round')}>
            업무 시작하기
          </Button>
          <Text variant="caption-sm" className="text-center text-neutral-400">
            로그인 없이 현재 브라우저에 자동 저장됩니다.
          </Text>
        </div>
      </div>
    </div>
  )
}
