import { useSession } from '../store/session'
import { Card } from '../components/Card'
import { Text } from '../components/Text'
import { Button } from '../components/Button'
import { Indicator } from '../components/Indicator'
import { DotMatrix } from '../components/DotMatrix'
import { RATING_SCALE } from '../types'
import brandLogo from '../assets/brand-logo.png'

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

const PROGRESS_STAGES = [
  { tag: '시방서 초안 작성', label: '한도 견본 표기 누락에 따른 시방서 수정' },
  { tag: '2차 협상', label: '목재 파트 제작 불가 확인, 대안 탐색' },
  { tag: '3차 협상', label: '외주 업체 탐색 및 보고' },
]

const BURDEN_TAG_GROUPS = [
  { label: '커뮤니케이션', tags: ['의도 전달의 어려움', '관리 용이', '제작 방식 조율'] },
  { label: '제약 상황', tags: ['빡빡한 업무 일정', '반복되는 수정', '생산 단가 고려', '업체 컨택 및 일정 조율'] },
]

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
  const report = useSession((s) => s.report)
  const selfAssessment = useSession((s) => s.selfAssessment)
  const draftParts = useSession((s) => s.draftParts)

  if (!report) return null

  // 흥미도: 자기평가의 5단계 응답을 0~100%로 환산(전혀 아니다=0% ~ 매우 그렇다=100%).
  // 이해도: Figma에 산출 근거가 없어, JourneyMap.tsx와 같은 대리 지표(부품별 선택 근거를
  // 남긴 비율)를 재사용 — 5단계로 뭉개지 않고 연속값 그대로 써서 39%/26% 같은 실측 예시와
  // 비슷한 결의 퍼센트가 나오게 했다.
  const interestPercent = (RATING_SCALE.indexOf(selfAssessment.interestScore) / (RATING_SCALE.length - 1)) * 100
  const reasonedParts = draftParts.filter((p) => p.reasoning.trim().length > 0).length
  const understandingPercent = draftParts.length > 0 ? (reasonedParts / draftParts.length) * 100 : 0

  return (
    <div className="flex min-h-svh gap-6 bg-neutral-50 p-6">
      <div className="hidden shrink-0 lg:block">
        <div className="flex size-[83px] items-center justify-center rounded-xl bg-neutral-900 p-2">
          <img src={brandLogo} alt="JOB:SIM" className="size-[67px] rounded-lg object-cover" />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-[19px]">
        <Indicator current="직무 리포트" />

        {/* Figma 캔버스(1728px)의 442/855/340 고정폭을 그대로 쓰면 실제 브라우저 폭(예: 1280px)에서
            가운데 컬럼이 300px도 안 남아 긴 인용구가 세로로 짜부라짐 — 같은 비율을 fr로 유지해
            어떤 뷰포트에서도 비례하게 분배되도록 함. */}
        <div className="grid grid-cols-1 items-start gap-[19px] lg:grid-cols-[442fr_855fr_340fr]">
          <Card className="flex flex-col gap-[48px] px-6 py-8">
            <div className="flex flex-col gap-3">
              <SectionTag>체험한 업무</SectionTag>
              <div className="flex flex-col gap-2 pt-2">
                <Text variant="title-lg" emphasis>
                  {WORK_EXPERIENCED_TITLE}
                </Text>
                <Text variant="body-lg" className="text-neutral-600">
                  {report.work_overview}
                </Text>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <SectionTag>업무 의미</SectionTag>
              <div className="flex flex-col gap-2 pt-2">
                <Text variant="title-lg" emphasis>
                  {WORK_MEANING_TITLE}
                </Text>
                <Text variant="body-lg" className="text-neutral-600">
                  {report.job_meaning}
                </Text>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <SectionTag>업무 진행 과정</SectionTag>
              <div className="flex flex-col gap-2">
                {PROGRESS_STAGES.map((stage) => (
                  <div key={stage.tag} className="flex flex-col items-start gap-2 rounded-tl-xl rounded-tr-xl rounded-br-xl bg-neutral-100 px-[18px] py-3">
                    <span className="rounded-md bg-neutral-50 px-2.5 py-2 text-caption-lg text-neutral-700">{stage.tag}</span>
                    <Text variant="body-lg" emphasis className="w-full text-center text-neutral-900">
                      {stage.label}
                    </Text>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="flex min-w-0 flex-col gap-[18px]">
            <Card className="flex flex-col gap-6 px-6 py-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <SectionTag>나의 업무 행동 분석</SectionTag>
                <Text variant="headline-md" emphasis>
                  {report.personaHeadline}
                </Text>
              </div>
              <div className="flex flex-col gap-3">
                <BehaviorRow label="강점" quotes={report.strengths} className="bg-green-50" />
                <BehaviorRow label="주의점" quotes={report.cautions} className="bg-green-100" />
                <BehaviorRow label="놓친 업무 요소" quotes={report.missed} className="bg-green-300" />
              </div>
            </Card>

            <div className="flex flex-col gap-[19px] sm:flex-row">
              <Card className="flex flex-1 flex-col justify-between gap-6 p-6">
                <div className="flex items-start justify-between">
                  <Text variant="title-lg" emphasis className="text-green-900">
                    흥미도
                  </Text>
                  <span className="text-display-md font-medium leading-none tracking-tight text-[#b1dc88]">{Math.round(interestPercent)}%</span>
                </div>
                <DotMatrix percent={interestPercent} />
              </Card>
              <Card className="flex flex-1 flex-col justify-between gap-6 p-6">
                <div className="flex items-start justify-between">
                  <Text variant="title-lg" emphasis className="text-green-900">
                    이해도
                  </Text>
                  <span className="text-display-md font-medium leading-none tracking-tight text-[#b1dc88]">{Math.round(understandingPercent)}%</span>
                </div>
                <DotMatrix percent={understandingPercent} />
              </Card>
            </div>
          </div>

          <div className="flex flex-col gap-[18px]">
            {report.burdenNote && (
              <Card className="flex flex-col gap-[48px] p-6">
                <SectionTag>부담 기록</SectionTag>
                {BURDEN_TAG_GROUPS.map((group) => (
                  <div key={group.label} className="flex flex-col gap-3">
                    <Text variant="body-lg" className="text-neutral-700">
                      {group.label}
                    </Text>
                    <div className="flex flex-wrap gap-2.5">
                      {group.tags.map((tag) => (
                        <span key={tag} className="rounded-full border-2 border-neutral-200 bg-neutral-100 px-3 py-2 text-body-lg text-neutral-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </Card>
            )}
            <div className="flex flex-col gap-3">
              <Button
                variant="secondary"
                className="h-[72px] w-full !rounded-xl !border-0 !bg-neutral-200 !text-2xl !text-neutral-600"
                onClick={() => (window.location.href = '/')}
              >
                홈으로 가기
              </Button>
              <Button className="h-[72px] w-full !rounded-xl !text-2xl" onClick={() => (window.location.href = '/journey-map')}>
                다음 세션으로 이동
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
