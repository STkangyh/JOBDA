import { useSession } from '../store/session'
import { Sidebar } from '../components/Sidebar'
import { AppHeader } from '../components/AppHeader'
import { Text } from '../components/Text'
import { Button } from '../components/Button'
import { ProfileSpectrum } from '../components/ProfileSpectrum'
import { WorkProcessChain } from '../components/WorkProcessChain'
import { SESSION2_STEP_INDEX } from '../data/processSteps'
import type { ActionLog } from '../types'

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

export function Report() {
  const report = useSession((s) => s.report)
  const actionLogs = useSession((s) => s.actionLogs)
  const resetSession = useSession((s) => s.resetSession)

  if (!report) return null

  const behaviorGroups = [report.strengths, report.cautions, report.missed].filter((g) => g.length > 0)

  return (
    <div className="flex min-h-svh gap-6 bg-neutral-950 p-6">
      <Sidebar active="data" />

      <div className="flex min-w-0 flex-1 flex-col gap-6 pb-6">
        <AppHeader />

        <Text variant="headline-lg" emphasis className="text-white">
          직무 이해 리포트
        </Text>

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

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => (window.location.href = '/')}>
            홈으로
          </Button>
          <Button onClick={() => resetSession()}>다시 체험하기</Button>
        </div>
      </div>
    </div>
  )
}
