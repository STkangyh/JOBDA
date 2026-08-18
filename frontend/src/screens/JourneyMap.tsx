import { Sidebar } from '../components/Sidebar'
import { AppHeader } from '../components/AppHeader'
import { Text } from '../components/Text'
import { Button } from '../components/Button'
import { PROCESS_STEPS, SESSION1_STEP_INDEX } from '../data/processSteps'
import { S1_RATING_SCALE, S1_ROUNDS, useSession1 } from '../store/session1'

const COLUMNS = ['업무 영역', '체험 여부', '흥미도', '이해도']

export function JourneyMap() {
  const currentStage = useSession1((s) => s.currentStage)
  const selfAssessment = useSession1((s) => s.selfAssessment)
  const roundAnswers = useSession1((s) => s.roundAnswers)

  const session1Done = currentStage === 'report'
  const reasonedRounds = roundAnswers.filter((r) => r.reasoning.trim().length > 0).length
  // Figma(744:36745)에 "이해도"의 산출 근거가 없어, 라운드마다 선택 근거를 남긴 비율을
  // 대리 지표로 사용한다(자기평가 응답과 같은 5단계 라벨을 재사용해 일관성 유지).
  const understandingIndex = Math.round((reasonedRounds / S1_ROUNDS.length) * (S1_RATING_SCALE.length - 1))

  return (
    <div className="flex min-h-svh gap-6 bg-neutral-950 p-6">
      <Sidebar active="data" />

      <div className="flex min-w-0 flex-1 flex-col gap-6 pb-6">
        <AppHeader />

        <div className="flex flex-col gap-1">
          <Text variant="headline-lg" emphasis className="text-white">
            체험맵
          </Text>
          <Text variant="title-lg" className="text-neutral-400">
            지금까지 진행한 업무 내용을 확인해보세요.
          </Text>
        </div>

        <div className="overflow-hidden rounded-xl bg-neutral-900">
          <div className="grid grid-cols-[1fr_140px_140px_140px] border-b border-neutral-700 px-6 py-4">
            {COLUMNS.map((c) => (
              <Text key={c} variant="body-md" emphasis className="text-neutral-400">
                {c}
              </Text>
            ))}
          </div>
          {PROCESS_STEPS.map((step, i) => {
            const isDone = i === SESSION1_STEP_INDEX && session1Done
            return (
              <div
                key={step}
                className="grid grid-cols-[1fr_140px_140px_140px] items-center border-b border-neutral-800 px-6 py-5 last:border-b-0"
              >
                <Text variant="title-md" className="text-neutral-100">
                  {step}
                </Text>
                <Text variant="body-md" emphasis className={isDone ? 'text-green-400' : 'text-neutral-500'}>
                  {isDone ? '진행 완료' : '미체험'}
                </Text>
                <Text variant="body-md" className="text-neutral-300">
                  {isDone ? selfAssessment.interestScore : '-'}
                </Text>
                <Text variant="body-md" className="text-neutral-300">
                  {isDone ? S1_RATING_SCALE[understandingIndex] : '-'}
                </Text>
              </div>
            )
          })}
        </div>

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
