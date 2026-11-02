import { useNavigate } from 'react-router-dom'
import { understandingPercent, useSession } from '../../store/session'
import { WorkFrame, WorkPanel } from '../../components/WorkFrame'
import { Text } from '../../components/Text'
import { DotMatrix } from '../../components/DotMatrix'
import { RATING_SCALE } from '../../types'
import { track } from '../../lib/analytics'
import { DEFAULT_JOURNEY } from '../../api/mock/report'

// Figma "Desktop - 121"(823:52946, 파일 x6feHLgVMyg8sh8C2jVPE1) 전면 재실측 — 예전 구현은
// 실제로는 이 프레임이 아니라 종합 리포트(ComprehensiveReport.tsx, Desktop-101)의 다크 테마를
// 그대로 베낀 것이었음(제목만 바꿔치기). 실제 121은 완전히 다른 라이트 테마 3컬럼 레이아웃 —
// 사이드바도 아이콘 목록 없이 로고 박스 하나뿐이고, 4축 프로필/업무 타임라인/다음 탐색 제안
// 섹션은 아예 없다.

// 아래 헤드라인/진행 과정 3단계는 이 앱의 유일한 시나리오(CMF·시방서·한도 견본 판정표) 실측
// 문구 그대로 — Figma에 고정 텍스트로 박혀있어 다른 화면들의 SENIOR_INTRO 같은 시나리오
// 상수와 같은 성격으로 취급한다.
const WORK_EXPERIENCED_TITLE = '디자인 의도를 시방서로 정확히 전달, 제품 구현'
const WORK_MEANING_TITLE = '디자인 확정안에 따른 양산 방식 고려'

// 업무 진행 과정의 단계 이름(Figma 2262:13057 원문). 단계마다 한 줄 설명은 리포트의 journey(백엔드 LLM, 없으면 기본값).
// 세 번째 단계는 고른 방향에 따라 외주를 안 거칠 수도 있어, 분기와 무관한 "N차 협상" 이름을 쓴다.
const JOURNEY_STAGES = ['시방서 초안 작성', '2차 협상', '3차 협상']

function SectionTag({ children }: { children: string }) {
  return (
    <span className="w-fit rounded-full border border-green-300 bg-green-50 px-3 py-2 text-body-lg font-medium text-green-900">
      {children}
    </span>
  )
}

function BehaviorRow({ label, quotes, className }: { label: string; quotes: string[]; className: string }) {
  if (quotes.length === 0) return null
  return (
    <div className={`flex min-w-0 gap-6 rounded-lg p-6 ${className}`}>
      <Text variant="title-lg" className="w-[120px] shrink-0 text-green-900">
        {label}
      </Text>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {quotes.map((q, i) => (
          <Text key={i} variant="title-lg" emphasis className="text-green-900">
            “{q}”
          </Text>
        ))}
      </div>
    </div>
  )
}

export function Report() {
  const navigate = useNavigate()
  const report = useSession((s) => s.report)
  const selfAssessment = useSession((s) => s.selfAssessment)
  const understanding = useSession(understandingPercent)

  if (!report) return null

  // 흥미도: 자기평가의 5단계 응답을 0~100%로 환산(전혀 아니다=0% ~ 매우 그렇다=100%).
  // 이해도: 업무에서 챙겨야 할 다섯 가지를 챙긴 비율(store/session.ts understandingChecks).
  const interestPercent = (RATING_SCALE.indexOf(selfAssessment.interestScore) / (RATING_SCALE.length - 1)) * 100

  const journey = report.journey?.length === 3 ? report.journey : DEFAULT_JOURNEY

  // 새 직무 리포트 디자인(Figma 2262:13057, 2026-11-02): 왼쪽 업무 소개 칸 + 오른쪽 행동 분석·흥미도·이해도,
  // 그 아래 오른쪽에 버튼 두 개. 예전 오른쪽 셋째 칸(부담 기록)은 새 디자인에 없어 뺐다.
  // 창 높이에 맞추고, 내용이 넘치면 그 칸만 안에서 스크롤한다.
  return (
    <WorkFrame step="직무 리포트" sidebar="work" exitStep="report">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-[18px]">
        <div className="grid min-h-0 flex-1 grid-cols-[442fr_1078fr] gap-4">
          <WorkPanel padded={false} className="flex min-h-0 flex-col gap-[clamp(24px,4.3svh,48px)] overflow-y-auto px-6 py-8">
            <div className="flex flex-col gap-3">
              <SectionTag>체험한 업무</SectionTag>
              <div className="flex flex-col gap-2 pt-2">
                <p className="text-title-lg font-semibold text-neutral-900">{WORK_EXPERIENCED_TITLE}</p>
                <Text variant="body-lg" className="text-neutral-600">
                  {report.work_overview}
                </Text>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <SectionTag>업무 의미</SectionTag>
              <div className="flex flex-col gap-2 pt-2">
                <p className="text-title-lg font-semibold text-neutral-900">{WORK_MEANING_TITLE}</p>
                <Text variant="body-lg" className="text-neutral-600">
                  {report.job_meaning}
                </Text>
              </div>
            </div>

            <section aria-label="업무 진행 과정" className="flex flex-col gap-3">
              <SectionTag>업무 진행 과정</SectionTag>
              <ol className="flex flex-col gap-3">
                {JOURNEY_STAGES.map((stage, i) => (
                  <li key={stage} className="flex flex-col items-start gap-2 rounded-tl-xl rounded-tr-xl rounded-br-xl bg-neutral-100 px-[18px] py-3">
                    <span className="rounded-md bg-neutral-50 px-2.5 py-2 text-caption-lg text-neutral-700">{stage}</span>
                    <Text variant="body-lg" emphasis className="text-neutral-900">
                      {journey[i]}
                    </Text>
                  </li>
                ))}
              </ol>
            </section>
          </WorkPanel>

          <div className="flex min-h-0 min-w-0 flex-col gap-[18px]">
            <WorkPanel padded={false} className="flex min-h-0 flex-[457_1_0] flex-col gap-6 px-6 py-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <SectionTag>나의 업무 행동 분석</SectionTag>
                <p className="text-headline-md font-semibold text-neutral-900">{report.personaHeadline}</p>
              </div>
              {/* 항목 수에 상한이 없어(이슈 #6) 넘치면 이 목록만 스크롤한다. 적을 때는 디자인처럼 칸 아래쪽에 붙는다 */}
              <div data-testid="behavior-list" className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                <div className="mt-auto flex flex-col gap-3">
                  <BehaviorRow label="강점" quotes={report.strengths} className="bg-green-75" />
                  <BehaviorRow label="주의점" quotes={report.cautions} className="bg-green-100" />
                  <BehaviorRow label="놓친 업무 요소" quotes={report.missed} className="bg-green-300" />
                </div>
              </div>
            </WorkPanel>

            <div className="flex min-h-0 flex-[370_1_0] gap-[19px]">
              <MetricCard label="흥미도" percent={interestPercent} />
              <MetricCard label="이해도" percent={understanding} />
            </div>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-[442fr_1078fr] gap-4">
          <div className="col-start-2 flex justify-end gap-[18px]">
            <button
              type="button"
              onClick={() => {
                track('cta', { name: 'go_home' })
                navigate('/explore')
              }}
              className="h-[clamp(56px,6.4svh,72px)] w-[min(340px,50%)] rounded-xl bg-neutral-200 text-headline-md font-semibold text-neutral-700 transition-colors hover:bg-neutral-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
            >
              홈으로 가기
            </button>
            <button
              type="button"
              onClick={() => {
                track('cta', { name: 'next_session' })
                navigate('/journey-map')
              }}
              className="h-[clamp(56px,6.4svh,72px)] w-[min(340px,50%)] rounded-xl bg-green-300 text-headline-md font-semibold text-neutral-900 transition-colors hover:bg-green-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
            >
              다음 세션으로 이동
            </button>
          </div>
        </div>
      </div>
    </WorkFrame>
  )
}

function MetricCard({ label, percent }: { label: string; percent: number }) {
  return (
    <WorkPanel padded={false} className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-between gap-4 overflow-hidden p-6">
      <div className="flex w-full items-start justify-between">
        <Text variant="title-lg" emphasis className="text-green-900">
          {label}
        </Text>
        <span className="text-display-md font-medium text-green-600">{Math.round(percent)}%</span>
      </div>
      {/* 도트 판은 칸 높이에 맞춰 줄어든다(디자인 360×280) */}
      <div className="flex min-h-0 w-full flex-1 items-end justify-center">
        <div className="aspect-[3/2] h-full max-h-[280px] max-w-full">
          <DotMatrix percent={percent} />
        </div>
      </div>
    </WorkPanel>
  )
}
