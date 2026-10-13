import { useNavigate } from 'react-router-dom'
import { WorkFrame, WorkPanel } from '../components/WorkFrame'
import { PROCESS_STEPS, SESSION1_STEP_INDEX, SESSION2_STEP_INDEX } from '../data/processSteps'
import { S1_RATING_SCALE, S1_ROUNDS, useSession1 } from '../store/session1'
import { useSession } from '../store/session'
import { RATING_SCALE } from '../types'

const COLUMNS = ['업무 영역', '체험 여부', '흥미도', '이해도']

// 업무 페이지 새 디자인 "체험맵"(2217:11438, 2026-10-13) — 업무 화면 틀 안의 표 + 오른쪽 아래 버튼 두 개.
// 이전: Figma "Desktop - 120"(744:36745) — get_screenshot으로 재확인해보니 라이트 테마(bg-#fafafa)에
// AppHeader(배너+검색+프로필)가 아니라 브리프/자료함과 같은 인디케이터 헤더였음. 원래 다크
// 테마+AppHeader로 잘못 만들었던 것을 실제 프레임대로 교체.
export function JourneyMap() {
  const navigate = useNavigate()
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

  // 흥미도·이해도는 직무 리포트와 같은 방식의 백분율로 보여준다(업무 페이지 새 디자인 2217:11438, 2026-10-13).
  // 흥미도 = 자기평가 "흥미로웠나요" 5단계 위치, 이해도 = 라운드(세션1)/부품(세션2)마다 선택 근거를 남긴 비율.
  const reasonedRounds = roundAnswers.filter((r) => r.reasoning.trim().length > 0).length
  const reasonedParts = draftParts.filter((p) => p.reasoning.trim().length > 0).length
  const percent = (n: number) => `${Math.round(n)}%`
  const s1Interest = (S1_RATING_SCALE.indexOf(s1SelfAssessment.interestScore) / (S1_RATING_SCALE.length - 1)) * 100
  const s2Interest = (RATING_SCALE.indexOf(s2SelfAssessment.interestScore) / (RATING_SCALE.length - 1)) * 100
  const s1Understanding = (reasonedRounds / S1_ROUNDS.length) * 100
  const s2Understanding = draftParts.length > 0 ? (reasonedParts / draftParts.length) * 100 : 0

  // 둘 다 안 끝났으면 세션1부터, 세션1만 끝났으면 세션2로, 둘 다 끝났으면 종합 리포트로.
  const nextHref = !session1Done ? '/session1' : !session2Done ? '/session2' : '/comprehensive-report'
  const nextLabel = session1Done && session2Done ? '종합 리포트 보기' : '다음 세션으로 이동'

  return (
    <WorkFrame step="직무 리포트" sidebar="work" exitStep="journey_map" flushRight>
      <WorkPanel className="flex min-h-0 min-w-0 flex-1 flex-col gap-[clamp(12px,3svh,32px)] overflow-y-auto">
        <div className="flex flex-col gap-1">
          <h1 className="text-headline-lg font-medium text-neutral-900">체험맵</h1>
          <p className="text-body-lg text-neutral-600">지금까지 진행한 업무 내용을 확인해보세요.</p>
        </div>

        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-neutral-200">
              {COLUMNS.map((c) => (
                <th key={c} scope="col" className="px-4 py-3 text-body-md font-medium text-neutral-500">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PROCESS_STEPS.map((step, i) => {
              const isSession1Step = i === SESSION1_STEP_INDEX
              const isSession2Step = i === SESSION2_STEP_INDEX
              const isDone = (isSession1Step && session1Done) || (isSession2Step && session2Done)
              const interest = isSession1Step ? s1Interest : s2Interest
              const understanding = isSession1Step ? s1Understanding : s2Understanding
              return (
                <tr key={step} className={`border-b border-neutral-100 last:border-b-0 ${isDone ? 'bg-green-100' : ''}`}>
                  <th scope="row" className={`px-4 py-3 text-title-md font-normal ${isDone ? 'text-neutral-900' : 'text-neutral-700'}`}>
                    {step}
                  </th>
                  <td className={`px-4 py-3 text-body-lg ${isDone ? 'font-medium text-neutral-900' : 'text-neutral-400'}`}>{isDone ? '진행 완료' : '진행 전'}</td>
                  <td className={`px-4 py-3 text-body-lg ${isDone ? 'text-neutral-900' : 'text-neutral-400'}`}>{isDone ? percent(interest) : '-'}</td>
                  <td className={`px-4 py-3 text-body-lg ${isDone ? 'text-neutral-900' : 'text-neutral-400'}`}>{isDone ? percent(understanding) : '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </WorkPanel>

      <aside className="flex w-[clamp(320px,25vw,433px)] shrink-0 flex-col justify-end gap-3 pr-8">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="h-[72px] w-full rounded-xl bg-neutral-200 text-headline-md font-semibold text-neutral-600 transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-green-700"
        >
          홈으로 가기
        </button>
        <button
          type="button"
          onClick={() => navigate(nextHref)}
          className="h-[72px] w-full rounded-xl bg-green-500 text-headline-md font-semibold text-neutral-900 transition-colors hover:bg-green-400 focus-visible:outline-2 focus-visible:outline-green-700"
        >
          {nextLabel}
        </button>
      </aside>
    </WorkFrame>
  )
}
