import { useSession } from '../store/session'
import { Sidebar, type SidebarItem } from '../components/Sidebar'
import { Indicator } from '../components/Indicator'
import { Text } from '../components/Text'
import { Button } from '../components/Button'
import { ProfileSpectrum } from '../components/ProfileSpectrum'
import { WorkProcessChain } from '../components/WorkProcessChain'
import { CloudSavedIcon, ProfileIcon } from '../components/icons'
import { SESSION2_STEP_INDEX } from '../data/processSteps'
import type { ActionLog } from '../types'

// Figma 744:17446 get_design_context로 재실측: Component214 top group은 Tap(apps)+Roleplay(work)+
// Report2(history, Pressed) 3개뿐 — "search" 자리는 없음. 예전 메타데이터 훑어보기 실측이 잘못됐었음.
const SIDEBAR_TOP_ITEMS: readonly SidebarItem[] = ['apps', 'work', 'history']

const TYPE_LABEL: Record<ActionLog['type'], string> = {
  doc_view: '자료 열람',
  ask: '관계자 질문',
  submit: '제출',
  branch: '방향 선택',
  revise: '재작성',
}

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

// Figma "Desktop - 121"(823:52946, 파일 x6feHLgVMyg8sh8C2jVPE1) 콘텐츠 보강: personaHeadline을
// 페이지 타이틀 옆에 노출하고, 자기평가의 부담 기록이 있을 때만 "부담 기록" 섹션을 추가한다
// (세션1 Report.tsx의 동일 패턴 그대로 — 나머지 섹션은 이미 744:17446 기준으로 완성돼 있어
// 그대로 둔다).
export function Report() {
  const report = useSession((s) => s.report)
  const actionLogs = useSession((s) => s.actionLogs)

  if (!report) return null

  const behaviorGroups = [report.strengths, report.cautions, report.missed].filter((g) => g.length > 0)

  return (
    <div className="flex min-h-svh gap-6 bg-neutral-950 p-6">
      <Sidebar active="history" topItems={SIDEBAR_TOP_ITEMS} />

      <div className="flex min-w-0 flex-1 flex-col gap-6 pb-6">
        {/* 세션1 화면들과 같은 헤더 행 — AppHeader(배너+검색+프로필) 대신 인디케이터+
            저장상태/프로필 아이콘으로 통일. */}
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
            직무 이해 리포트
          </Text>
          <Text variant="title-lg" emphasis className="text-green-300">
            {report.personaHeadline}
          </Text>
        </div>

        <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-3">
          <div className="flex flex-col gap-4 rounded-xl bg-neutral-900 p-6">
            <SectionHeading>이번에 경험한 업무</SectionHeading>
            <Text variant="body-lg" className="text-neutral-200">
              {report.work_overview}
            </Text>
          </div>

          <div className="flex flex-col gap-6 rounded-xl bg-neutral-900 p-6">
            <div className="flex flex-col gap-3">
              <SectionHeading>내 직무 이해 프로필</SectionHeading>
              <Text variant="body-lg" className="text-neutral-200">
                사용자 패턴에서 반복적으로 나타난 판단, 협업 성향을 보여줍니다.
              </Text>
            </div>
            <div className="flex flex-col gap-6">
              {report.profile.map((axis, i) => (
                <ProfileSpectrum key={i} {...axis} />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6 rounded-xl bg-neutral-900 p-6">
            <div className="flex flex-col gap-3">
              <SectionHeading>내 업무 행동</SectionHeading>
              <Text variant="body-lg" className="text-neutral-200">
                내 강점, 주의점, 놓친 업무 요소를 확인하세요.
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
          <WorkProcessChain activeIndex={SESSION2_STEP_INDEX} />
        </div>

        <div className="flex flex-col gap-4 rounded-lg bg-neutral-900 p-6">
          <SectionHeading>업무 행동 타임라인</SectionHeading>
          <ol className="flex flex-col gap-1">
            {actionLogs.map((log) => (
              <li key={log.seq} className="flex gap-2 text-body-md text-neutral-400">
                <span className="w-5 text-neutral-600">{log.seq}</span>
                <span>
                  {TYPE_LABEL[log.type]}
                  {log.target ? ` · ${log.target}` : ''}
                  {log.actor ? ` · ${log.actor}` : ''}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {report.burdenNote && (
          <div className="flex flex-col gap-3 rounded-lg bg-neutral-900 p-6">
            <SectionHeading>부담 기록</SectionHeading>
            <p className="text-title-md text-green-500">“{report.burdenNote}”</p>
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

        <Text variant="body-md" className="text-neutral-500">
          {report.job_meaning}
        </Text>

        {/* Figma 823:52946 실측(Frame 2147227540, Component 216 + Component 212): CTA는 가로
            3개 나열이 아니라 "홈으로 가기"/"다음 세션으로 이동" 세로 2단 스택이었음 — 예전에
            임의로 3개(체험맵 보기/다시 체험하기 추가)로 늘려뒀던 걸 실측대로 되돌림. */}
        <div className="flex w-[340px] flex-col gap-3 self-end">
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
  )
}
