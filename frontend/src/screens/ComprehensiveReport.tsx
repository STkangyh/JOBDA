import { useSession } from '../store/session'
import { useSession1 } from '../store/session1'
import { Sidebar, type SidebarItem } from '../components/Sidebar'
import { Indicator } from '../components/Indicator'
import { Text } from '../components/Text'
import { ProfileSpectrum } from '../components/ProfileSpectrum'
import { WorkProcessChain } from '../components/WorkProcessChain'
import { CloudSavedIcon, ProfileIcon } from '../components/icons'
import { PROCESS_STEPS, SESSION1_STEP_INDEX, SESSION2_STEP_INDEX } from '../data/processSteps'
import type { ProfileAxis } from '../types'

// Figma 744:17446(Desktop-101, "직무 리포트")을 템플릿으로 재사용 — 세션1+세션2 리포트를
// 화면 하나로 합산한 "종합 리포트". 사이드바 3개(apps/work/history) 실측은 Report.tsx와 동일.
const SIDEBAR_TOP_ITEMS: readonly SidebarItem[] = ['apps', 'work', 'history']

const NEXT_EXPLORATIONS = ['동일 직무의 다른 업무', '유사 직무 비교', '필요한 기초 역량 체험', '현직자 인터뷰, 교육과정 추천']

function SectionHeading({ children }: { children: string }) {
  return <p className="text-title-lg font-semibold text-green-800">{children}</p>
}

function QuoteGroup({ items }: { items: string[] }) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-col gap-3">
      {items.map((t, i) => (
        <p key={i} className="text-title-md text-green-500">
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
      <Sidebar active="history" topItems={SIDEBAR_TOP_ITEMS} />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-3">
          <div className="hidden lg:block" />
          <Indicator current="직무 리포트" />
          <div className="hidden items-center justify-end gap-[18px] lg:flex">
            <div className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-neutral-800 text-neutral-50">
              <CloudSavedIcon className="size-5" />
            </div>
            <div className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-neutral-800 text-neutral-50">
              <ProfileIcon className="size-5" />
            </div>
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

export function ComprehensiveReport() {
  const s1Report = useSession1((s) => s.report)
  const s2Report = useSession((s) => s.report)

  if (!s2Report) {
    return <ComprehensiveReportPending />
  }

  // 세션1은 배포에서 제외돼 s1Report는 사실상 항상 없다 — 다만 직접 /session1 URL로 들어가
  // 완료한 경우까지 대비해 있으면 합치고, 없으면 세션2 데이터만으로 자연스럽게 동작하도록
  // 모든 계산을 optional로 둔다.
  const behaviorGroups = [
    [...(s1Report?.strengths ?? []), ...s2Report.strengths],
    [...(s1Report?.cautions ?? []), ...s2Report.cautions],
    [...(s1Report?.missed ?? []), ...s2Report.missed],
  ].filter((g) => g.length > 0)

  const profile = s1Report ? averageProfile(s1Report.profile, s2Report.profile) : s2Report.profile
  const burdenNotes = [s1Report?.burdenNote, s2Report.burdenNote].filter(Boolean)

  return (
    <div className="flex min-h-svh gap-6 bg-neutral-950 p-6">
      <Sidebar active="history" topItems={SIDEBAR_TOP_ITEMS} />

      <div className="flex min-w-0 flex-1 flex-col gap-6 pb-6">
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-3">
          <div className="hidden lg:block" />
          <Indicator current="직무 리포트" />
          <div className="hidden items-center justify-end gap-[18px] lg:flex">
            <div className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-neutral-800 text-neutral-50">
              <CloudSavedIcon className="size-5" />
            </div>
            <div className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-neutral-800 text-neutral-50">
              <ProfileIcon className="size-5" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <Text variant="headline-lg" emphasis className="text-white">
            종합 리포트
          </Text>
          <Text variant="title-lg" emphasis className="text-green-300">
            {s2Report.personaHeadline}
          </Text>
        </div>

        <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-3">
          <div className="flex flex-col gap-4 rounded-xl bg-neutral-900 p-6">
            <SectionHeading>이번에 경험한 업무</SectionHeading>
            <div className="flex flex-col gap-4">
              {s1Report && (
                <>
                  <div className="flex flex-col gap-1">
                    <Text variant="body-md" emphasis className="text-neutral-500">
                      세션1 · {PROCESS_STEPS[SESSION1_STEP_INDEX]}
                    </Text>
                    <Text variant="body-lg" className="text-neutral-200">
                      {s1Report.work_overview}
                    </Text>
                  </div>
                  <div className="h-px w-full bg-neutral-700" />
                </>
              )}
              <div className="flex flex-col gap-1">
                <Text variant="body-md" emphasis className="text-neutral-500">
                  세션2 · {PROCESS_STEPS[SESSION2_STEP_INDEX]}
                </Text>
                <Text variant="body-lg" className="text-neutral-200">
                  {s2Report.work_overview}
                </Text>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 rounded-xl bg-neutral-900 p-6">
            <div className="flex flex-col gap-3">
              <SectionHeading>내 직무 이해 프로필</SectionHeading>
              <Text variant="body-lg" className="text-neutral-200">
                {s1Report
                  ? '두 세션에서 반복적으로 나타난 판단, 협업 성향을 평균으로 보여줍니다.'
                  : '이번 세션에서 나타난 판단, 협업 성향을 보여줍니다.'}
              </Text>
            </div>
            <div className="flex flex-col gap-6">
              {profile.map((axis, i) => (
                <ProfileSpectrum key={i} {...axis} />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6 rounded-xl bg-neutral-900 p-6">
            <div className="flex flex-col gap-3">
              <SectionHeading>내 업무 행동</SectionHeading>
              <Text variant="body-lg" className="text-neutral-200">
                {s1Report
                  ? '두 세션을 합쳐 내 강점, 주의점, 놓친 업무 요소를 확인하세요.'
                  : '내 강점, 주의점, 놓친 업무 요소를 확인하세요.'}
              </Text>
            </div>
            {behaviorGroups.length === 0 ? (
              <Text variant="body-md" className="text-neutral-500">
                이번 체험에서 특별히 강조할 점을 찾지 못했습니다.
              </Text>
            ) : (
              <div className="flex flex-col gap-4">
                {behaviorGroups.map((group, i) => (
                  <div key={i} className="flex flex-col gap-4">
                    {i > 0 && <div className="h-px w-full bg-neutral-700" />}
                    <QuoteGroup items={group} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-lg bg-neutral-900 p-6">
          <SectionHeading>내 업무 진행 과정</SectionHeading>
          <WorkProcessChain activeIndex={s1Report ? [SESSION1_STEP_INDEX, SESSION2_STEP_INDEX] : [SESSION2_STEP_INDEX]} />
        </div>

        {burdenNotes.length > 0 && (
          <div className="flex flex-col gap-3 rounded-lg bg-neutral-900 p-6">
            <SectionHeading>부담 기록</SectionHeading>
            {burdenNotes.map((note, i) => (
              <p key={i} className="text-title-md text-green-500">
                “{note}”
              </p>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <SectionHeading>다음 탐색 제안</SectionHeading>
          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
            {NEXT_EXPLORATIONS.map((label) => (
              <div key={label} className="flex h-[92px] items-center rounded-xl bg-neutral-900 p-6">
                <Text variant="title-md" emphasis className="text-neutral-200">
                  {label}
                </Text>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
