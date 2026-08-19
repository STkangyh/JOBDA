import { Sidebar, type SidebarItem } from '../components/Sidebar'
import { Indicator } from '../components/Indicator'
import { Card } from '../components/Card'
import { Text } from '../components/Text'
import { Button } from '../components/Button'
import { CloudSavedIcon, ProfileIcon } from '../components/icons'
import { PROCESS_STEPS, SESSION1_STEP_INDEX, SESSION2_STEP_INDEX } from '../data/processSteps'
import { S1_RATING_SCALE, S1_ROUNDS, useSession1 } from '../store/session1'
import { useSession } from '../store/session'
import { RATING_SCALE } from '../types'

const COLUMNS = ['업무 영역', '체험 여부', '흥미도', '이해도']
// 이 화면(744:36745)은 Figma에 사이드바 자체가 없어서(작은 로고 박스만 있음) 실측 근거는
// 없음 — 리포트(744:17446, apps/search/work/history 4개로 실측 확인됨)와 같은 구성을 썼더니
// 아이콘 7개가 되어 다른 화면들(자료함/라운드/탐색 등, apps/work/history 3개=6개)과 어긋났음.
// 근거 없는 화면이니 소수(리포트)가 아니라 다수 화면 쪽 구성에 맞춤.
const SIDEBAR_TOP_ITEMS: readonly SidebarItem[] = ['apps', 'work', 'history']

// Figma "Desktop - 120"(744:36745) — get_screenshot으로 재확인해보니 라이트 테마(bg-#fafafa)에
// AppHeader(배너+검색+프로필)가 아니라 브리프/자료함과 같은 인디케이터 헤더였음. 원래 다크
// 테마+AppHeader로 잘못 만들었던 것을 실제 프레임대로 교체.
export function JourneyMap() {
  const session1Stage = useSession1((s) => s.currentStage)
  const s1SelfAssessment = useSession1((s) => s.selfAssessment)
  const roundAnswers = useSession1((s) => s.roundAnswers)

  // 세션2(store/session.ts)는 완전히 별도 스토어라 여기서 따로 구독해야 한다 — 이전엔 이 화면이
  // useSession1만 봐서 세션2를 끝내도 8번("시방서 작성 및 설계 이관") 단계가 계속 "미체험"으로
  // 뜨는 버그가 있었음(SESSION2_STEP_INDEX를 import만 해두고 실제로는 안 씀).
  const session2Stage = useSession((s) => s.currentStage)
  const s2SelfAssessment = useSession((s) => s.selfAssessment)
  const draftParts = useSession((s) => s.draftParts)

  const session1Done = session1Stage === 'report'
  const session2Done = session2Stage === 'report'

  const reasonedRounds = roundAnswers.filter((r) => r.reasoning.trim().length > 0).length
  // Figma에 "이해도"의 산출 근거가 없어, 라운드마다(세션1)/부품마다(세션2) 선택 근거를 남긴
  // 비율을 대리 지표로 사용한다(자기평가 응답과 같은 5단계 라벨을 재사용해 일관성 유지).
  const s1UnderstandingIndex = Math.round((reasonedRounds / S1_ROUNDS.length) * (S1_RATING_SCALE.length - 1))
  const reasonedParts = draftParts.filter((p) => p.reasoning.trim().length > 0).length
  const s2UnderstandingIndex = Math.round((reasonedParts / draftParts.length) * (RATING_SCALE.length - 1))

  // 둘 다 안 끝났으면 세션1부터, 세션1만 끝났으면 세션2로, 둘 다 끝났으면 더 보낼 데가 없어 홈으로.
  const nextHref = !session1Done ? '/session1' : !session2Done ? '/session2' : '/'

  return (
    <div className="flex min-h-svh gap-6 bg-neutral-50 p-6">
      <Sidebar active="history" topItems={SIDEBAR_TOP_ITEMS} />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        {/* 이 화면은 아래 콘텐츠가 3컬럼 그리드가 아니라 단일 카드라, 브리프처럼 인디케이터를
            가운데 컬럼 폭에 맞출 기준이 없음 — 대신 아이콘을 제외한 나머지 폭을 다 씀. */}
        <div className="flex items-center gap-6">
          <Indicator current="직무 리포트" className="flex-1" />
          <div className="hidden shrink-0 items-center gap-[18px] lg:flex">
            <div className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-neutral-900 text-neutral-50">
              <CloudSavedIcon className="size-5" />
            </div>
            <div className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-neutral-900 text-neutral-50">
              <ProfileIcon className="size-5" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Text variant="headline-lg" emphasis>
            체험맵
          </Text>
          <Text variant="title-lg" className="text-neutral-600">
            지금까지 진행한 업무 내용을 확인해보세요.
          </Text>
        </div>

        <Card className="overflow-hidden">
          <div className="grid grid-cols-[1fr_140px_140px_140px] border-b border-neutral-200 px-6 py-4">
            {COLUMNS.map((c) => (
              <Text key={c} variant="body-md" emphasis className="text-neutral-500">
                {c}
              </Text>
            ))}
          </div>
          {PROCESS_STEPS.map((step, i) => {
            const isSession1Step = i === SESSION1_STEP_INDEX
            const isSession2Step = i === SESSION2_STEP_INDEX
            const isDone = (isSession1Step && session1Done) || (isSession2Step && session2Done)
            const interestScore = isSession1Step
              ? s1SelfAssessment.interestScore
              : isSession2Step
                ? s2SelfAssessment.interestScore
                : null
            const understandingLabel = isSession1Step
              ? S1_RATING_SCALE[s1UnderstandingIndex]
              : isSession2Step
                ? RATING_SCALE[s2UnderstandingIndex]
                : null
            return (
              <div
                key={step}
                className={`grid grid-cols-[1fr_140px_140px_140px] items-center border-b border-neutral-100 px-6 py-5 last:border-b-0 ${
                  isDone ? 'bg-green-50' : ''
                }`}
              >
                <Text variant="title-md" className="text-neutral-900">
                  {step}
                </Text>
                <Text variant="body-md" emphasis className={isDone ? 'text-green-800' : 'text-neutral-400'}>
                  {isDone ? '진행 완료' : '미체험'}
                </Text>
                <Text variant="body-md" className="text-neutral-600">
                  {isDone ? interestScore : '-'}
                </Text>
                <Text variant="body-md" className="text-neutral-600">
                  {isDone ? understandingLabel : '-'}
                </Text>
              </div>
            )
          })}
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => (window.location.href = '/')}>
            홈으로 가기
          </Button>
          <Button onClick={() => (window.location.href = nextHref)}>다음 세션으로 이동</Button>
        </div>
      </div>
    </div>
  )
}
