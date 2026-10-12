import { useSession } from '../store/session'
import { useSession1 } from '../store/session1'
import { Sidebar } from '../components/Sidebar'
import { Text } from '../components/Text'
import { ProfileMeter } from '../components/ProfileMeter'
import reportStack from '../assets/illustrations/loading-report-stack.png'
import connectorIcon from '../assets/report/connector.svg'
import arrowIcon from '../assets/explore/arrow-backward.svg'
import { CloudSavedIcon, ProfileIcon } from '../components/icons'
import { PROCESS_STEPS, SESSION1_STEP_INDEX, SESSION2_STEP_INDEX } from '../data/processSteps'
import type { ProfileAxis } from '../types'

// 종합 리포트 — 세션1+세션2 리포트를 화면 하나로 합산. Figma "Desktop - 273"(2219:39273, 2026-10-13) 새 디자인:
// 화면 제목·상단 아이콘 줄이 빠지고, 경험한 업무 카드는 업무 그림으로, 진행 과정은 두 줄로 꺾이는 흐름으로 바뀌었다.

const NEXT_EXPLORATIONS = ['동일 직무의 다른 업무', '유사 직무 비교', '필요한 기초 역량 체험', '현직자 인터뷰, 교육과정 추천']

function SectionHeading({ children }: { children: string }) {
  return <p className="text-title-lg font-semibold text-green-800">{children}</p>
}

function QuoteGroup({ items }: { items: string[] }) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-col gap-3">
      {items.map((t, i) => (
        <p key={i} className="text-title-lg text-green-500">
          “{t}”
        </p>
      ))}
    </div>
  )
}

// 두 세션의 프로필 4축은 라벨/캡션이 완전히 동일(둘 다 mock/report.ts의 computeProfile 방식을
// 그대로 씀)해서, 축별로 값을 평균 내면 "종합" 성향으로 자연스럽게 합쳐진다.
function averageProfile(a: ProfileAxis[], b: ProfileAxis[]): ProfileAxis[] {
  return a.map((axis, i) => ({ ...axis, value: (axis.value + (b[i]?.value ?? axis.value)) / 2 }))
}

// 사이드바 세번째 아이콘(history)이 진행 상태와 무관하게 항상 이 화면으로 연결되므로(사용자
// 명시적 요청 — 체험맵으로 대신 보내지 말 것), 세션2가 아직 안 끝난 상태를 빈 화면(return
// null)으로 방치하지 않고 이 화면 자체가 안내 + 이어하기 CTA를 보여준다. 세션1은 배포에서
// 제외돼(JobDetail.tsx에서 선택 자체가 불가능) 사실상 항상 미완료 상태라, 세션1 여부로
// 분기하던 이전 로직은 제거하고 세션2 하나만 기준으로 삼는다.
function ComprehensiveReportPending() {
  return (
    <div className="flex min-h-svh gap-6 bg-neutral-950 p-6">
      <Sidebar active="report" />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="hidden items-center justify-end gap-[18px] lg:flex">
          <div className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-neutral-800 text-neutral-50">
            <CloudSavedIcon className="size-5" />
          </div>
          <div className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-neutral-800 text-neutral-50">
            <ProfileIcon className="size-5" />
          </div>
        </div>

        <Text variant="headline-lg" emphasis className="text-white">
          종합 리포트
        </Text>

        <div className="flex flex-1 flex-col items-center justify-center gap-6 rounded-xl bg-neutral-900 p-12 text-center">
          <Text variant="title-lg" emphasis className="text-neutral-200">
            세션을 마치면 여기에 종합 리포트가 표시됩니다.
          </Text>
          <Text variant="body-lg" className="text-neutral-500">
            {PROCESS_STEPS[SESSION2_STEP_INDEX]} — 진행 전
          </Text>
        </div>
      </div>
    </div>
  )
}

// "내 업무 진행 과정" — 11단계를 두 줄로 꺾어 보여준다(1~5단계는 왼쪽→오른쪽, 6~11단계는 오른쪽→왼쪽).
// 단계 사이는 Figma 연결선(점선+양끝 점), 줄을 꺾는 부분은 같은 색 점선으로 그린다.
function StepPill({ index, active }: { index: number; active: boolean }) {
  return (
    <span
      className={`relative z-[1] flex items-center gap-1 rounded-xl px-[14px] py-3 text-title-lg font-semibold whitespace-nowrap ${
        active ? 'bg-green-500 text-neutral-900' : 'bg-neutral-700 text-neutral-200'
      }`}
    >
      {index + 1}. {PROCESS_STEPS[index]}
    </span>
  )
}

function Connector() {
  return <img src={connectorIcon} alt="" width={58} height={11} className="-mx-[5px] h-[10.666px] w-[57.666px] shrink-0" />
}

function ProcessFlow({ active }: { active: number[] }) {
  const firstRow = [0, 1, 2, 3, 4]
  const secondRow = [5, 6, 7, 8, 9, 10]
  // 아랫줄은 오른쪽에서 왼쪽으로 진행하므로 칸 안의 연결선도 오른쪽에 붙인다
  const row = (indices: number[], reversed = false) =>
    indices.map((i, n) => (
      <span key={i} className={`flex items-center ${reversed ? 'flex-row-reverse' : ''}`}>
        {n > 0 && <Connector />}
        <StepPill index={i} active={active.includes(i)} />
      </span>
    ))
  return (
    <ol className="relative inline-flex flex-col gap-[60px]" aria-label="업무 프로세스 11단계">
      <li className="flex items-center">
        {row(firstRow)}
        <span className="mr-4 h-0 min-w-6 flex-1 border-t-2 border-dotted border-neutral-200" aria-hidden />
      </li>
      <li className="flex flex-row-reverse items-center">{row(secondRow, true)}</li>
      {/* 줄을 꺾는 점선 — 윗줄 끝에서 내려와 아랫줄 마지막 칸(6단계) 위에 닿는다(Figma 곡선 연결선) */}
      <span
        className="pointer-events-none absolute top-[24px] right-4 h-[84px] w-4 rounded-tr-xl border-t-2 border-r-2 border-dotted border-neutral-200"
        aria-hidden
      />
    </ol>
  )
}

function NextSuggestion({ label }: { label: string }) {
  return (
    <div className="flex h-[92px] items-center justify-between gap-3 rounded-xl bg-neutral-900 p-6">
      <p className="text-title-lg font-semibold text-neutral-200">{label}</p>
      {/* 연결할 화면이 아직 없어 표시만 한다 */}
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-[rgba(179,179,179,0.25)] bg-[rgba(142,142,142,0.5)]" aria-hidden>
        <img src={arrowIcon} alt="" width={24} height={24} className="size-6 rotate-180" />
      </span>
    </div>
  )
}

export function ComprehensiveReport() {
  const s1Report = useSession1((s) => s.report)
  const s2Report = useSession((s) => s.report)

  if (!s2Report) {
    return <ComprehensiveReportPending />
  }

  // 세션1은 배포에서 제외돼 s1Report는 사실상 항상 없다 — 직접 /session1 URL로 들어가 완료한 경우까지 대비해
  // 있으면 합치고, 없으면 세션2 데이터만으로 동작한다.
  const behaviorGroups = [
    [...(s1Report?.strengths ?? []), ...s2Report.strengths],
    [...(s1Report?.cautions ?? []), ...s2Report.cautions],
    [...(s1Report?.missed ?? []), ...s2Report.missed],
  ].filter((g) => g.length > 0)

  const profile = s1Report ? averageProfile(s1Report.profile, s2Report.profile) : s2Report.profile
  const burdenNotes = [s1Report?.burdenNote, s2Report.burdenNote].filter(Boolean)
  const activeSteps = s1Report ? [SESSION1_STEP_INDEX, SESSION2_STEP_INDEX] : [SESSION2_STEP_INDEX]

  return (
    <div className="flex min-h-svh gap-[clamp(24px,3.1vw,54px)] bg-neutral-950 pt-14 pr-[clamp(32px,3.1vw,54px)] pb-8 pl-8">
      <Sidebar active="report" />

      <main className="flex min-w-0 flex-1 flex-col justify-end gap-[18px]">
        <h1 className="sr-only">종합 리포트</h1>

        <div className="grid grid-cols-3 gap-[18px]">
          <section className="flex min-h-[412px] flex-col justify-between gap-6 rounded-xl bg-neutral-900 p-6">
            <SectionHeading>이번에 경험한 업무</SectionHeading>
            <img
              src={reportStack}
              alt={`생활 가전 제품 디자이너 — ${PROCESS_STEPS[SESSION2_STEP_INDEX]}`}
              width={874}
              height={530}
              className="aspect-[1936/1174] w-full object-cover"
            />
          </section>

          <section className="flex min-h-[412px] flex-col justify-between gap-6 rounded-xl bg-neutral-900 p-6">
            <div className="flex flex-col gap-3">
              <SectionHeading>내 직무 이해 프로필</SectionHeading>
              <p className="text-body-lg text-neutral-200">
                {s1Report ? '두 세션에서 반복적으로 나타난 판단, 협업 성향을 평균으로 보여줍니다.' : '사용자 패턴에서 반복적으로 나타난 판단, 협업 성향을 보여줍니다.'}
              </p>
            </div>
            <div className="flex flex-col gap-6">
              {profile.map((axis, i) => (
                <ProfileMeter key={i} {...axis} />
              ))}
            </div>
          </section>

          <section className="flex min-h-[412px] flex-col gap-12 rounded-xl bg-neutral-900 p-6">
            <div className="flex flex-col gap-3">
              <SectionHeading>내 업무 행동</SectionHeading>
              <p className="text-body-lg text-neutral-200">
                {s1Report ? '두 세션을 합쳐 내 강점, 주의점, 놓친 업무 요소를 확인하세요.' : '내 강점, 주의점, 놓친 업무 요소를 확인하세요.'}
              </p>
            </div>
            {behaviorGroups.length === 0 ? (
              <p className="text-body-md text-neutral-500">이번 체험에서 특별히 강조할 점을 찾지 못했습니다.</p>
            ) : (
              <div className="flex flex-col gap-6">
                {behaviorGroups.map((group, i) => (
                  <div key={i} className="flex flex-col gap-6">
                    {i > 0 && <hr className="border-neutral-700" />}
                    <QuoteGroup items={group} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="flex min-h-[359px] flex-col gap-12 overflow-x-auto rounded-lg bg-neutral-900 p-6">
          <SectionHeading>내 업무 진행 과정</SectionHeading>
          <div>
            <ProcessFlow active={activeSteps} />
          </div>
        </section>

        {/* 부담 기록은 새 디자인에 자리가 없지만 기록된 경우에만 나오는 내용이라 진행 과정 아래에 남긴다 */}
        {burdenNotes.length > 0 && (
          <section className="flex flex-col gap-3 rounded-lg bg-neutral-900 p-6">
            <SectionHeading>부담 기록</SectionHeading>
            {burdenNotes.map((note, i) => (
              <p key={i} className="text-title-lg text-green-500">
                “{note}”
              </p>
            ))}
          </section>
        )}

        <section className="flex flex-col gap-3">
          <div className="px-6">
            <SectionHeading>다음 탐색 제안</SectionHeading>
          </div>
          <div className="grid grid-cols-4 gap-[18px]">
            {NEXT_EXPLORATIONS.map((label) => (
              <NextSuggestion key={label} label={label} />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
