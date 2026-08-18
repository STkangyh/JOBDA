import { Sidebar, type SidebarItem } from '../components/Sidebar'
import { Indicator } from '../components/Indicator'
import { Card } from '../components/Card'
import { Text } from '../components/Text'
import { Button } from '../components/Button'
import { CloudSavedIcon, ProfileIcon } from '../components/icons'
import { PROCESS_STEPS, SESSION1_STEP_INDEX } from '../data/processSteps'
import { S1_RATING_SCALE, S1_ROUNDS, useSession1 } from '../store/session1'

const COLUMNS = ['업무 영역', '체험 여부', '흥미도', '이해도']
// 이 화면(744:36745)은 Figma에 사이드바 자체가 없어서(작은 로고 박스만 있음) 실측 근거는
// 없음 — 리포트에서 바로 넘어오는 화면이라 리포트와 같은 구성(apps/search/work/history)으로
// 맞춰 일관성 유지.
const SIDEBAR_TOP_ITEMS: readonly SidebarItem[] = ['apps', 'search', 'work', 'history']

// Figma "Desktop - 120"(744:36745) — get_screenshot으로 재확인해보니 라이트 테마(bg-#fafafa)에
// AppHeader(배너+검색+프로필)가 아니라 브리프/자료함과 같은 인디케이터 헤더였음. 원래 다크
// 테마+AppHeader로 잘못 만들었던 것을 실제 프레임대로 교체.
export function JourneyMap() {
  const currentStage = useSession1((s) => s.currentStage)
  const selfAssessment = useSession1((s) => s.selfAssessment)
  const roundAnswers = useSession1((s) => s.roundAnswers)

  const session1Done = currentStage === 'report'
  const reasonedRounds = roundAnswers.filter((r) => r.reasoning.trim().length > 0).length
  // Figma에 "이해도"의 산출 근거가 없어, 라운드마다 선택 근거를 남긴 비율을 대리 지표로
  // 사용한다(자기평가 응답과 같은 5단계 라벨을 재사용해 일관성 유지).
  const understandingIndex = Math.round((reasonedRounds / S1_ROUNDS.length) * (S1_RATING_SCALE.length - 1))

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
            const isDone = i === SESSION1_STEP_INDEX && session1Done
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
                  {isDone ? selfAssessment.interestScore : '-'}
                </Text>
                <Text variant="body-md" className="text-neutral-600">
                  {isDone ? S1_RATING_SCALE[understandingIndex] : '-'}
                </Text>
              </div>
            )
          })}
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => (window.location.href = '/')}>
            홈으로 가기
          </Button>
          <Button onClick={() => (window.location.href = '/session2')}>다음 세션으로 이동</Button>
        </div>
      </div>
    </div>
  )
}
